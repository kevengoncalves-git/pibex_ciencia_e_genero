import os
from dotenv import load_dotenv

load_dotenv()


def _normalizar_database_url(url):
    """Alguns provedores (Render, Heroku, etc.) fornecem a URL do Postgres
    com o prefixo antigo 'postgres://', que o SQLAlchemy 1.4+ não aceita
    mais. Aqui convertemos para 'postgresql://' automaticamente."""
    if url and url.startswith("postgres://"):
        return url.replace("postgres://", "postgresql://", 1)
    return url


class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "troque-esta-chave-em-producao")
    SQLALCHEMY_DATABASE_URI = _normalizar_database_url(
        os.getenv("DATABASE_URL", "sqlite:///database.db")
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_EXP_HOURS = int(os.getenv("JWT_EXP_HOURS", 24))

    # E-mails autorizados a administrar os materiais (separados por vírgula no .env)
    ADMIN_EMAILS = [
        e.strip().lower()
        for e in os.getenv("ADMIN_EMAILS", "").split(",")
        if e.strip()
    ]