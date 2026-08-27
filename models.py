from datetime import datetime
from extensions import db


class User(db.Model):
    __tablename__ = "usuarios"

    id = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(150), nullable=False)
    email = db.Column(db.String(150), unique=True, nullable=False, index=True)
    senha_hash = db.Column(db.String(255), nullable=False)
    criado_em = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "nome": self.nome,
            "email": self.email,
            "criado_em": self.criado_em.isoformat(),
        }


class Material(db.Model):
    __tablename__ = "materiais"

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    category = db.Column(db.String(100), nullable=False)
    description = db.Column(db.String(500), nullable=False)
    full_description = db.Column(db.Text, nullable=False)
    image = db.Column(db.String(500), nullable=False)
    tags = db.Column(db.String(300), nullable=True)  # salvas separadas por vírgula
    arquivo_url = db.Column(db.String(500), nullable=True)
    criado_por = db.Column(db.String(150), nullable=True)  # e-mail do admin que cadastrou
    criado_em = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "category": self.category,
            "description": self.description,
            "fullDescription": self.full_description,
            "image": self.image,
            "tags": [t.strip() for t in self.tags.split(",")] if self.tags else [],
            "arquivoUrl": self.arquivo_url,
        }


class LabXchangeItem(db.Model):
    __tablename__ = "labxchange_itens"

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    type = db.Column(db.String(30), nullable=False)  # Simulação | Grupo | Vídeo | Artigo
    description = db.Column(db.Text, nullable=True)
    url = db.Column(db.String(500), nullable=False)
    tags = db.Column(db.String(300), nullable=True)  # salvas separadas por vírgula
    emoji = db.Column(db.String(10), nullable=True)
    gradient_from = db.Column(db.String(10), nullable=True)
    gradient_to = db.Column(db.String(10), nullable=True)
    criado_por = db.Column(db.String(150), nullable=True)  # e-mail do admin que cadastrou
    criado_em = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "type": self.type,
            "description": self.description or "",
            "url": self.url,
            "tags": [t.strip() for t in self.tags.split(",")] if self.tags else [],
            "emoji": self.emoji or "🔬",
            "gradientFrom": self.gradient_from or "#1B3A6B",
            "gradientTo": self.gradient_to or "#2563EB",
        }