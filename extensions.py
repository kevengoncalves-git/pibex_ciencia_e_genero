from flask_sqlalchemy import SQLAlchemy

# Instância única do SQLAlchemy, inicializada em app.py (evita import circular)
db = SQLAlchemy()