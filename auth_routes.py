import re
import bcrypt
import jwt
from datetime import datetime, timedelta, timezone
from flask import Blueprint, request, current_app

from extensions import db
from models import User
from utils import response

auth_bp = Blueprint("auth", __name__, url_prefix="/api")

EMAIL_REGEX = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def validar_email(email):
    return bool(email) and bool(EMAIL_REGEX.match(email))


def validar_senha(senha):
    return bool(senha) and len(senha) >= 6


@auth_bp.route("/register", methods=["POST"])
def register():
    payload = request.get_json(silent=True) or {}

    nome = (payload.get("nome") or "").strip()
    email = (payload.get("email") or "").strip().lower()
    senha = payload.get("senha") or ""
    # 'confirmarSenha' é ignorado no backend (a validação de igualdade
    # já é feita no frontend antes do envio)

    if not nome:
        return response("error", "O campo 'nome' é obrigatório.", http_code=400)

    if not validar_email(email):
        return response("error", "E-mail inválido.", http_code=400)

    if not validar_senha(senha):
        return response("error", "A senha deve ter no mínimo 6 caracteres.", http_code=400)

    if User.query.filter_by(email=email).first():
        return response("error", "Este e-mail já está cadastrado.", http_code=409)

    senha_hash = bcrypt.hashpw(senha.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

    novo_usuario = User(nome=nome, email=email, senha_hash=senha_hash)
    db.session.add(novo_usuario)
    db.session.commit()

    return response(
        "success",
        "Usuário cadastrado com sucesso.",
        data=novo_usuario.to_dict(),
        http_code=201,
    )


@auth_bp.route("/login", methods=["POST"])
def login():
    payload = request.get_json(silent=True) or {}

    email = (payload.get("email") or "").strip().lower()
    senha = payload.get("senha") or ""

    if not validar_email(email) or not senha:
        return response("error", "E-mail e senha são obrigatórios.", http_code=400)

    usuario = User.query.filter_by(email=email).first()

    senha_confere = usuario and bcrypt.checkpw(
        senha.encode("utf-8"), usuario.senha_hash.encode("utf-8")
    )

    if not senha_confere:
        return response("error", "E-mail ou senha incorretos.", http_code=401)

    exp = datetime.now(timezone.utc) + timedelta(hours=current_app.config["JWT_EXP_HOURS"])
    token_payload = {"sub": usuario.id, "email": usuario.email, "exp": exp}
    token = jwt.encode(token_payload, current_app.config["SECRET_KEY"], algorithm="HS256")

    return response(
        "success",
        "Login realizado com sucesso.",
        data={
            "token": token,
            "usuario": {
                **usuario.to_dict(),
                "isAdmin": usuario.email in current_app.config["ADMIN_EMAILS"],
            },
        },
        http_code=200,
    )