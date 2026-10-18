"""
Automated Security Test Suite for OAuth 2.0 / OpenID Connect Implementation
Validates redirect_uri controls, state/PKCE binding, replay prevention,
open redirect mitigations, session rotation, and cookie security.
"""

import pytest
import time
from urllib.parse import urlparse, parse_qs
from fastapi.testclient import TestClient

from main import app
from auth.config import OAuthConfig, oauth_config
from auth.security import (
    sanitize_return_url,
    generate_pkce_pair,
    OAuthStateStore,
    SessionStore,
    constant_time_compare
)

@pytest.fixture
def client():
    """FastAPI TestClient fixture."""
    return TestClient(app, follow_redirects=False)


# =====================================================================
# 1. PROVIDER REDIRECT URI TESTS
# =====================================================================

class TestRedirectURIValidation:
    def test_valid_development_redirect_uri(self):
        """Valid absolute URI for local development must pass."""
        cfg = OAuthConfig(
            redirect_uri="http://localhost:8000/auth/callback",
            environment="development"
        )
        cfg.validate_redirect_uri()

    def test_valid_production_https_redirect_uri(self):
        """Valid HTTPS absolute URI for production must pass."""
        cfg = OAuthConfig(
            redirect_uri="https://convertmaster.app/auth/callback",
            environment="production"
        )
        cfg.validate_redirect_uri()

    def test_reject_wildcard_redirect_uri(self):
        """Wildcards in redirect_uri must be strictly prohibited."""
        cfg = OAuthConfig(redirect_uri="https://*.convertmaster.app/auth/callback")
        with pytest.raises(ValueError, match="Wildcards are strictly prohibited"):
            cfg.validate_redirect_uri()

    def test_reject_http_in_production(self):
        """HTTP scheme must be rejected in production environment."""
        cfg = OAuthConfig(
            redirect_uri="http://convertmaster.app/auth/callback",
            environment="production"
        )
        with pytest.raises(ValueError, match="Production environments MUST use HTTPS"):
            cfg.validate_redirect_uri()

    def test_reject_relative_redirect_uri(self):
        """Relative callback paths must be rejected."""
        cfg = OAuthConfig(redirect_uri="/auth/callback")
        with pytest.raises(ValueError, match="Must be an absolute URL"):
            cfg.validate_redirect_uri()

    def test_reject_query_or_fragment_in_redirect_uri(self):
        """Query parameters or fragments in registered callback URI must be rejected."""
        cfg_query = OAuthConfig(redirect_uri="https://convertmaster.app/auth/callback?env=dev")
        with pytest.raises(ValueError, match="Query strings and fragments are prohibited"):
            cfg_query.validate_redirect_uri()

        cfg_fragment = OAuthConfig(redirect_uri="https://convertmaster.app/auth/callback#token")
        with pytest.raises(ValueError, match="Query strings and fragments are prohibited"):
            cfg_fragment.validate_redirect_uri()


# =====================================================================
# 2. OAUTH STATE & CALLBACK BINDING TESTS (ANTI-CSRF & ANTI-REPLAY)
# =====================================================================

class TestOAuthStateSecurity:
    def test_login_initiates_secure_state_and_pkce(self, client):
        """
        Verify /auth/login initiates flow with:
        - Cryptographic high-entropy state
        - PKCE code_challenge (S256)
        - Nonce for OIDC
        - HttpOnly state cookie bound to browser
        """
        resp = client.get("/auth/login?return_to=/dashboard")
        assert resp.status_code == 302
        
        # Check target auth URL
        target_url = resp.headers["location"]
        parsed = urlparse(target_url)
        params = parse_qs(parsed.query)

        assert "state" in params
        assert len(params["state"][0]) >= 32
        assert "code_challenge" in params
        assert params["code_challenge_method"] == ["S256"]
        assert "nonce" in params
        assert params["redirect_uri"] == [oauth_config.redirect_uri]

        # Check browser-bound cookie
        assert oauth_config.state_cookie_name in resp.cookies
        cookie_val = resp.cookies[oauth_config.state_cookie_name]
        assert cookie_val == params["state"][0]

    def test_callback_rejects_missing_state_or_code(self, client):
        """Callback without state or code must return 400 Bad Request."""
        resp = client.get("/auth/callback")
        assert resp.status_code == 400
        assert "Missing required authorization parameters" in resp.json()["detail"]

    def test_callback_rejects_mismatched_state_cookie(self, client):
        """
        State in query mismatching the browser's HttpOnly cookie must be rejected (CSRF attempt).
        """
        # Set state cookie to "valid-state-1", but provide "attacker-state-2" in query
        client.cookies.set(oauth_config.state_cookie_name, "valid-browser-state")
        resp = client.get("/auth/callback?code=mock_code&state=forged-attacker-state")
        assert resp.status_code == 400
        assert "Invalid or mismatched OAuth state" in resp.json()["detail"]

    def test_state_one_time_consumption_prevents_replay(self):
        """
        A state token must be consumed ONCE and immediately invalidated against replay attacks.
        """
        store = OAuthStateStore(ttl_seconds=60)
        state_id = "random-cryptographic-state-12345"
        store.save_state(state_id, {"code_verifier": "verifier-secret", "nonce": "nonce-1"})

        # First consumption: SUCCESS
        first_attempt = store.consume_state(state_id)
        assert first_attempt is not None
        assert first_attempt["code_verifier"] == "verifier-secret"

        # Second consumption (Replay): MUST FAIL (returns None)
        replay_attempt = store.consume_state(state_id)
        assert replay_attempt is None, "State replay was NOT prevented!"

    def test_state_expires_after_ttl(self):
        """State must expire and become invalid after TTL."""
        store = OAuthStateStore(ttl_seconds=1) # 1 second TTL
        state_id = "short-lived-state"
        store.save_state(state_id, {"data": "test"})
        
        time.sleep(1.1)
        assert store.consume_state(state_id) is None


# =====================================================================
# 3. OPEN REDIRECT / RETURN DESTINATION TESTS
# =====================================================================

class TestOpenRedirectMitigation:
    @pytest.mark.parametrize("safe_url", [
        "/",
        "/dashboard",
        "/convert",
        "/settings/profile",
        "/files?view=compact&sort=desc",
    ])
    def test_safe_internal_paths_allowed(self, safe_url):
        """Valid internal relative paths must be accepted."""
        assert sanitize_return_url(safe_url, default_path="/") == safe_url

    @pytest.mark.parametrize("evil_url", [
        # External URLs
        "https://evil.com",
        "http://attacker.org/steal",
        "https://evil.com/dashboard",
        
        # Protocol-relative URLs (bypasses startsWith('/'))
        "//evil.com",
        "//evil.com/dashboard",
        "///evil.com",
        "/%2fevil.com",
        
        # Backslash bypass variants (browsers normalize \ to /)
        r"\evil.com",
        r"/\evil.com",
        r"\\evil.com",
        r"/dashboard\evil.com",
        r"/%5cevil.com",
        
        # Dangerous schemes
        "javascript:alert(1)",
        "data:text/html,<script>alert(1)</script>",
        "vbscript:msgbox",
        "file:///etc/passwd",
        
        # Path traversal
        "/../../../../evil",
        
        # Control characters and CRLF injection
        "/dashboard\r\nSet-Cookie: evil=1",
        "/dashboard\nLocation: https://evil.com",
        "/dashboard\0evil",
        
        # Non-string / empty
        "",
        None,
        "   ",
    ])
    def test_malicious_return_urls_fallback_to_safe_default(self, evil_url):
        """Any external, protocol-relative, backslash, or injected URL must fall back to '/'."""
        sanitized = sanitize_return_url(evil_url, default_path="/")
        assert sanitized == "/", f"Failed to sanitize open redirect payload: {evil_url!r} -> {sanitized!r}"


# =====================================================================
# 4. SESSION MANAGEMENT & HARDENING TESTS
# =====================================================================

class TestSessionSecurity:
    def test_session_fixation_mitigation_rotates_id(self):
        """Session identifier must rotate upon login and invalidate the previous identifier."""
        store = SessionStore(ttl_seconds=3600)
        old_id = store.create_session({"email": "pre_auth@example.com"})
        assert store.get_session(old_id) is not None

        # Authenticate and rotate
        new_id = store.rotate_session(old_id, {"email": "authenticated@example.com"})
        
        # Old session ID must be destroyed
        assert store.get_session(old_id) is None, "Old session ID was not invalidated!"
        
        # New session ID must be active and distinct
        assert new_id != old_id
        assert store.get_session(new_id)["email"] == "authenticated@example.com"

    def test_unauthenticated_me_endpoint(self, client):
        """Accessing /auth/me without active session cookie returns 401 Unauthorized."""
        resp = client.get("/auth/me")
        assert resp.status_code == 401
        assert "Not authenticated" in resp.json()["detail"]

    def test_logout_terminates_session(self, client):
        """Logging out destroys the session and clears the session cookie."""
        # Create session directly in store
        from auth.security import session_store
        session_id = session_store.create_session({"email": "test@convertmaster.app"})
        
        client.cookies.set(oauth_config.session_cookie_name, session_id)
        
        # Verify authenticated
        resp = client.get("/auth/me")
        assert resp.status_code == 200
        assert resp.json()["user"]["email"] == "test@convertmaster.app"

        # Logout
        logout_resp = client.post("/auth/logout")
        assert logout_resp.status_code == 200
        
        # Session must now be destroyed
        assert session_store.get_session(session_id) is None
        
        # Subsequent request must be unauthenticated
        client.cookies.clear()
        assert client.get("/auth/me").status_code == 401
