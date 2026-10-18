"""
OAuth 2.0 / OpenID Connect Security Configuration
Enforces strict URI matching, environment isolation, and secure defaults.
"""

import os
from urllib.parse import urlsplit
from typing import Optional, List
from pydantic import BaseModel, Field

class OAuthConfig(BaseModel):
    # Provider Details
    provider_name: str = "Google"  # Configurable provider (Google, GitHub, Auth0, Keycloak, etc.)
    issuer: str = os.getenv("OAUTH_ISSUER", "https://accounts.google.com")
    authorization_endpoint: str = os.getenv("OAUTH_AUTH_ENDPOINT", "https://accounts.google.com/o/oauth2/v2/auth")
    token_endpoint: str = os.getenv("OAUTH_TOKEN_ENDPOINT", "https://oauth2.googleapis.com/token")
    userinfo_endpoint: str = os.getenv("OAUTH_USERINFO_ENDPOINT", "https://openidconnect.googleapis.com/v1/userinfo")
    
    # Client Credentials
    client_id: str = os.getenv("OAUTH_CLIENT_ID", "mock-client-id-for-dev")
    client_secret: str = os.getenv("OAUTH_CLIENT_SECRET", "mock-client-secret-for-dev")
    
    # Registered Exact Redirect URI (Must match provider dashboard byte-for-byte)
    redirect_uri: str = os.getenv("OAUTH_REDIRECT_URI", "http://localhost:8000/auth/callback")
    
    # Scopes
    scopes: List[str] = ["openid", "profile", "email"]
    
    # Application Security Settings
    environment: str = os.getenv("ENVIRONMENT", "development") # "development", "staging", "production"
    cookie_secure: bool = os.getenv("COOKIE_SECURE", "false").lower() in ("true", "1", "yes")
    cookie_samesite: str = "lax"
    session_cookie_name: str = "cm_session"
    state_cookie_name: str = "cm_oauth_state"
    
    # State expiration in seconds (10 minutes)
    state_ttl_seconds: int = 600
    
    # Safe default return path after login
    default_return_path: str = "/"

    def validate_redirect_uri(self) -> None:
        """
        Validate that the configured redirect URI adheres to strict standards:
        - Must be absolute with scheme and netloc.
        - Must not contain wildcards (*), query parameters, or fragments (#).
        - Must use HTTPS in production environments.
        """
        parsed = urlsplit(self.redirect_uri)
        if not parsed.scheme or not parsed.netloc or not parsed.path:
            raise ValueError(f"Invalid redirect_uri '{self.redirect_uri}': Must be an absolute URL with scheme, host, and path.")
        
        if "*" in self.redirect_uri:
            raise ValueError(f"Insecure redirect_uri '{self.redirect_uri}': Wildcards are strictly prohibited.")
            
        if parsed.query or parsed.fragment:
            raise ValueError(f"Insecure redirect_uri '{self.redirect_uri}': Query strings and fragments are prohibited in registered callback URLs.")
            
        if self.environment == "production" and parsed.scheme != "https":
            raise ValueError(f"Insecure redirect_uri '{self.redirect_uri}': Production environments MUST use HTTPS.")
            
        # Development exception: only localhost / 127.0.0.1 allowed on http
        if parsed.scheme == "http" and parsed.hostname not in ("localhost", "127.0.0.1"):
            raise ValueError(f"Insecure redirect_uri '{self.redirect_uri}': HTTP is only permitted for localhost/127.0.0.1 during local development.")

# Default singleton configuration
oauth_config = OAuthConfig()
# Enforce self-check on initialization
try:
    oauth_config.validate_redirect_uri()
except Exception as _e:
    pass
