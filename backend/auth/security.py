"""
OAuth 2.0 / OIDC Security Primitives & Open Redirect Protection
Implements PKCE (RFC 7636), cryptographic state/nonce binding, and strict URL canonicalization.
"""

import os
import hmac
import base64
import hashlib
import secrets
import posixpath
from urllib.parse import urlsplit, unquote
from typing import Optional, Tuple

# -------------------------------------------------------------
# 1. Cryptographic State & Nonce Generation
# -------------------------------------------------------------

def generate_secure_token(nbytes: int = 32) -> str:
    """Generate a high-entropy, cryptographically secure random token."""
    return secrets.token_urlsafe(nbytes)

def constant_time_compare(val1: Optional[str], val2: Optional[str]) -> bool:
    """Constant-time string comparison to prevent timing attacks."""
    if val1 is None or val2 is None:
        return False
    return hmac.compare_digest(str(val1), str(val2))


# -------------------------------------------------------------
# 2. PKCE (Proof Key for Code Exchange - RFC 7636)
# -------------------------------------------------------------

def generate_pkce_pair() -> Tuple[str, str]:
    """
    Generates a code_verifier and code_challenge using SHA-256 (S256).
    Verifier is a high-entropy cryptographic string between 43 and 128 characters.
    """
    code_verifier = secrets.token_urlsafe(64) # ~86 characters
    # S256 Challenge: BASE64URL-ENCODE(SHA256(ASCII(code_verifier))) without padding
    digest = hashlib.sha256(code_verifier.encode('ascii')).digest()
    code_challenge = base64.urlsafe_b64encode(digest).decode('ascii').rstrip('=')
    return code_verifier, code_challenge


# -------------------------------------------------------------
# 3. Open Redirect & Return Destination Sanitization
# -------------------------------------------------------------

def sanitize_return_url(raw_url: Optional[str], default_path: str = "/") -> str:
    """
    Validates and canonicalizes the post-authentication return destination.
    Strictly prevents Open Redirect attacks by rejecting:
    - External domains / schemes (http:, https:, javascript:, data:, etc.)
    - Protocol-relative URLs (//attacker.com)
    - Backslash variants (\\attacker.com, /\\attacker.com, %5c)
    - Control characters, CRLF, and unprintable characters
    - Path traversal attempts (../../../)
    
    Returns the sanitized safe relative path or default_path if validation fails.
    """
    if not raw_url or not isinstance(raw_url, str):
        return default_path

    cleaned = raw_url.strip()
    if not cleaned:
        return default_path

    # Check for control characters (CRLF, null bytes, unprintable characters)
    if any(ord(c) < 32 or ord(c) == 127 for c in cleaned):
        return default_path

    # Reject backslashes (both raw and URL-encoded variants)
    if '\\' in cleaned or '%5c' in cleaned.lower():
        return default_path

    # Reject directory traversal attempts (.. or %2e%2e)
    if '..' in cleaned or '%2e' in cleaned.lower():
        return default_path

    # Reject protocol-relative URLs (starts with // or /%2f)
    if cleaned.startswith('//') or cleaned.startswith('/%2f') or cleaned.startswith('/%2F'):
        return default_path

    # Parse with standards-compliant URL parser
    try:
        parsed = urlsplit(cleaned)
    except Exception:
        return default_path

    # Must NOT have any scheme (e.g. http, https, javascript, data, ftp)
    if parsed.scheme:
        return default_path

    # Must NOT have any netloc (host / domain / authority)
    if parsed.netloc:
        return default_path

    # Must start with a single '/'
    path = parsed.path
    if not path.startswith('/'):
        return default_path

    # Canonicalize path using posixpath.normpath to resolve '.' and '..'
    normalized_path = posixpath.normpath(path)

    # Ensure normalized path still starts with a single '/' and does not resolve to root escape
    if not normalized_path.startswith('/'):
        return default_path

    # Re-verify no backslash or double slash after normalization
    if '\\' in normalized_path or normalized_path.startswith('//'):
        return default_path

    # Reassemble path with query parameters if present and safe
    query = parsed.query
    if query:
        # Reject control characters in query
        if any(ord(c) < 32 or ord(c) == 127 for c in query):
            return normalized_path
        return f"{normalized_path}?{query}"

    return normalized_path


# -------------------------------------------------------------
# 4. In-Memory Session & One-Time State Store
# -------------------------------------------------------------

import time
from threading import Lock

class OAuthStateStore:
    """
    Thread-safe storage for pending OAuth transactions.
    Enforces one-time consumption (anti-replay) and TTL expiration.
    """
    def __init__(self, ttl_seconds: int = 600):
        self._store = {}
        self._lock = Lock()
        self._ttl = ttl_seconds

    def save_state(self, state: str, data: dict) -> None:
        """Store state transaction with timestamp."""
        with self._lock:
            self._cleanup_expired()
            self._store[state] = {
                "data": data,
                "created_at": time.time()
            }

    def consume_state(self, state: str) -> Optional[dict]:
        """
        Atomically validates and deletes state to prevent replay attacks.
        Returns the associated transaction data if valid and unexpired; None otherwise.
        """
        if not state:
            return None

        with self._lock:
            self._cleanup_expired()
            entry = self._store.pop(state, None)
            if not entry:
                return None
            
            # Check expiration
            if time.time() - entry["created_at"] > self._ttl:
                return None

            return entry["data"]

    def _cleanup_expired(self) -> None:
        """Remove stale states older than TTL."""
        now = time.time()
        expired_keys = [k for k, v in self._store.items() if now - v["created_at"] > self._ttl]
        for k in expired_keys:
            self._store.pop(k, None)


class SessionStore:
    """
    Thread-safe session manager with automatic ID rotation upon login.
    """
    def __init__(self, ttl_seconds: int = 86400): # 24 hours
        self._sessions = {}
        self._lock = Lock()
        self._ttl = ttl_seconds

    def create_session(self, user_info: dict) -> str:
        """Create new session with a cryptographically secure identifier."""
        session_id = secrets.token_urlsafe(32)
        with self._lock:
            self._sessions[session_id] = {
                "user": user_info,
                "created_at": time.time(),
                "last_active": time.time()
            }
        return session_id

    def rotate_session(self, old_session_id: Optional[str], user_info: dict) -> str:
        """
        Session Fixation Protection: Rotates session identifier after successful login.
        Invalidates the old session ID immediately.
        """
        with self._lock:
            if old_session_id and old_session_id in self._sessions:
                self._sessions.pop(old_session_id, None)
        return self.create_session(user_info)

    def get_session(self, session_id: str) -> Optional[dict]:
        """Retrieve active session if not expired."""
        if not session_id:
            return None
        with self._lock:
            entry = self._sessions.get(session_id)
            if not entry:
                return None
            if time.time() - entry["last_active"] > self._ttl:
                self._sessions.pop(session_id, None)
                return None
            entry["last_active"] = time.time()
            return entry["user"]

    def destroy_session(self, session_id: str) -> None:
        """Terminate session."""
        with self._lock:
            self._sessions.pop(session_id, None)

# Global singleton stores
oauth_state_store = OAuthStateStore(ttl_seconds=600)
session_store = SessionStore(ttl_seconds=86400)
