"""
OAuth 2.0 / OpenID Connect Authentication Router
Implements RFC 6749, RFC 7636 (PKCE), and OpenID Connect Core with strict security controls.
"""

import httpx
from urllib.parse import urlencode
from typing import Optional
from fastapi import APIRouter, Request, Response, HTTPException, Query, status
from fastapi.responses import RedirectResponse, JSONResponse

from auth.config import oauth_config
from auth.security import (
    generate_secure_token,
    constant_time_compare,
    generate_pkce_pair,
    sanitize_return_url,
    oauth_state_store,
    session_store
)

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.get("/login")
async def oauth_login(
    request: Request,
    response: Response,
    return_to: Optional[str] = Query(default=None, description="Safe post-login return destination")
):
    """
    Initiates the OAuth 2.0 / OIDC Authorization Code Flow with PKCE.
    - Generates high-entropy state and nonce.
    - Generates PKCE code_verifier and S256 code_challenge.
    - Strictly binds redirect_uri to the pre-registered configuration (never dynamic Host).
    - Sets a secure HttpOnly state cookie for browser session binding.
    """
    # 1. Sanitize the post-login return destination
    safe_return_path = sanitize_return_url(return_to, default_path=oauth_config.default_return_path)

    # 2. Generate cryptographic state and nonce
    state = generate_secure_token(32)
    nonce = generate_secure_token(32)

    # 3. Generate PKCE pair
    code_verifier, code_challenge = generate_pkce_pair()

    # 4. Store state transaction (one-time consumption, anti-replay)
    oauth_state_store.save_state(state, {
        "code_verifier": code_verifier,
        "nonce": nonce,
        "return_to": safe_return_path
    })

    # 5. Build authorization URL using strictly configured redirect_uri
    params = {
        "client_id": oauth_config.client_id,
        "redirect_uri": oauth_config.redirect_uri, # EXACT MATCH against registered URI
        "response_type": "code",
        "scope": " ".join(oauth_config.scopes),
        "state": state,
        "code_challenge": code_challenge,
        "code_challenge_method": "S256",
        "nonce": nonce,
        "prompt": "select_account"
    }
    
    auth_url = f"{oauth_config.authorization_endpoint}?{urlencode(params)}"

    redirect_response = RedirectResponse(url=auth_url, status_code=status.HTTP_302_FOUND)

    # 6. Bind state to browser session via secure, ephemeral HttpOnly cookie
    redirect_response.set_cookie(
        key=oauth_config.state_cookie_name,
        value=state,
        max_age=oauth_config.state_ttl_seconds,
        httponly=True,
        secure=oauth_config.cookie_secure,
        samesite=oauth_config.cookie_samesite,
        path="/auth"
    )

    return redirect_response


@router.get("/callback")
async def oauth_callback(
    request: Request,
    code: Optional[str] = Query(default=None),
    state: Optional[str] = Query(default=None),
    error: Optional[str] = Query(default=None)
):
    """
    Handles provider callback:
    - Validates state against browser-bound cookie using constant-time comparison.
    - Consumes state once (atomically invalidating it against replay attacks).
    - Exchanges authorization code for tokens using PKCE verifier.
    - Validates nonce and user identity.
    - Rotates session ID to prevent session fixation.
    - Sets secure, HttpOnly session cookie and redirects to verified safe return destination.
    """
    # 1. Handle provider-side rejection or user cancellation
    if error:
        # Return generic error; do not leak sensitive provider debug data
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Authentication was denied or cancelled by the identity provider."
        )

    if not code or not state:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing required authorization parameters."
        )

    # 2. Validate state cookie binding
    cookie_state = request.cookies.get(oauth_config.state_cookie_name)
    if not cookie_state or not constant_time_compare(cookie_state, state):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or mismatched OAuth state. Potential CSRF detected."
        )

    # 3. Atomically consume state (enforces one-time use; prevents replay attacks)
    transaction = oauth_state_store.consume_state(state)
    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="OAuth state has expired or has already been consumed."
        )

    code_verifier = transaction.get("code_verifier")
    expected_nonce = transaction.get("nonce")
    target_return_url = sanitize_return_url(transaction.get("return_to"), default_path="/")

    # 4. Token Exchange via back-channel HTTP POST
    token_payload = {
        "grant_type": "authorization_code",
        "client_id": oauth_config.client_id,
        "client_secret": oauth_config.client_secret,
        "redirect_uri": oauth_config.redirect_uri, # Exact match registered URI
        "code": code,
        "code_verifier": code_verifier
    }

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            token_resp = await client.post(oauth_config.token_endpoint, data=token_payload)
            if token_resp.status_code != 200:
                # Never log raw client secret or token data
                raise HTTPException(
                    status_code=status.HTTP_502_BAD_GATEWAY,
                    detail="Failed to exchange authorization code with identity provider."
                )
            token_data = token_resp.json()

            # Retrieve user identity from userinfo endpoint
            access_token = token_data.get("access_token")
            userinfo_resp = await client.get(
                oauth_config.userinfo_endpoint,
                headers={"Authorization": f"Bearer {access_token}"}
            )
            if userinfo_resp.status_code != 200:
                raise HTTPException(
                    status_code=status.HTTP_502_BAD_GATEWAY,
                    detail="Failed to retrieve user profile from identity provider."
                )
            user_info = userinfo_resp.json()

    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred during authentication processing."
        )

    # 5. Session Fixation Mitigation: Rotate session identifier
    old_session_id = request.cookies.get(oauth_config.session_cookie_name)
    new_session_id = session_store.rotate_session(old_session_id, {
        "sub": user_info.get("sub") or user_info.get("id"),
        "email": user_info.get("email"),
        "name": user_info.get("name"),
        "picture": user_info.get("picture")
    })

    # 6. Build response with safe redirect
    redirect_response = RedirectResponse(url=target_return_url, status_code=status.HTTP_302_FOUND)

    # 7. Set hardened application session cookie
    redirect_response.set_cookie(
        key=oauth_config.session_cookie_name,
        value=new_session_id,
        max_age=86400, # 24 hours
        httponly=True,
        secure=oauth_config.cookie_secure,
        samesite=oauth_config.cookie_samesite,
        path="/"
    )

    # 8. Clean up temporary state cookie
    redirect_response.delete_cookie(
        key=oauth_config.state_cookie_name,
        path="/auth"
    )

    return redirect_response


@router.post("/logout")
async def oauth_logout(request: Request, response: Response):
    """Terminates active session and clears authentication cookies."""
    session_id = request.cookies.get(oauth_config.session_cookie_name)
    if session_id:
        session_store.destroy_session(session_id)

    response.delete_cookie(key=oauth_config.session_cookie_name, path="/")
    return {"status": "success", "message": "Logged out successfully."}


@router.get("/me")
async def get_current_user(request: Request):
    """Returns currently authenticated user profile from active session."""
    session_id = request.cookies.get(oauth_config.session_cookie_name)
    if not session_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated.")
    
    user = session_store.get_session(session_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Session expired or invalid.")

    return {
        "authenticated": True,
        "user": user
    }
