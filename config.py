import os
from dotenv import load_dotenv

load_dotenv()


class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "cd3d3c25e787ca42a8fd5aea66f3a65a11fa6ab5b741c5c664cbd0dd37bd1826")
    SQLALCHEMY_DATABASE_URI = os.getenv("DATABASE_URL", "sqlite:///database.db")
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_EXP_HOURS = int(os.getenv("JWT_EXP_HOURS", 24))

    # E-mails autorizados a administrar os materiais (separados por vírgula no .env)
    ADMIN_EMAILS = [
        e.strip().lower()
        for e in os.getenv("ADMIN_EMAILS", "").split(",")
        if e.strip()
    ]