import jwt
from functools import wraps
from flask import request, current_app

from utils import response


def get_token_payload():
    """Decodifica o JWT do header Authorization: Bearer <token>.
    Retorna o payload (dict) ou None se ausente/inválido/expirado."""
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        return None

    token = auth_header.split(" ", 1)[1].strip()
    try:
        return jwt.decode(token, current_app.config["SECRET_KEY"], algorithms=["HS256"])
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None


def admin_required(view_func):
    """Bloqueia a rota se o token for inválido/expirado ou se o e-mail
    do usuário não estiver na lista ADMIN_EMAILS do .env."""

    @wraps(view_func)
    def wrapper(*args, **kwargs):
        payload = get_token_payload()
        if not payload:
            return response(
                "error", "Sessão inválida ou expirada. Faça login novamente.", http_code=401
            )

        email = (payload.get("email") or "").lower()
        if email not in current_app.config["ADMIN_EMAILS"]:
            return response(
                "error", "Você não tem permissão para realizar essa ação.", http_code=403
            )

        return view_func(*args, **kwargs)

    return wrapper