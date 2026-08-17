from flask import Blueprint, request

from extensions import db
from models import Material
from utils import response
from auth_utils import admin_required, get_token_payload

materiais_bp = Blueprint("materiais", __name__, url_prefix="/api")

CAMPOS_OBRIGATORIOS = ["title", "category", "description", "fullDescription", "image"]


@materiais_bp.route("/materiais", methods=["GET"])
def listar_materiais():
    materiais = Material.query.order_by(Material.criado_em.desc()).all()
    return response("success", "Materiais carregados.", data=[m.to_dict() for m in materiais])


@materiais_bp.route("/materiais", methods=["POST"])
@admin_required
def criar_material():
    payload = request.get_json(silent=True) or {}

    faltando = [
        campo for campo in CAMPOS_OBRIGATORIOS if not str(payload.get(campo) or "").strip()
    ]
    if faltando:
        return response(
            "error",
            f"Campos obrigatórios não preenchidos: {', '.join(faltando)}.",
            http_code=400,
        )

    tags = payload.get("tags") or []
    if isinstance(tags, str):
        tags = [t.strip() for t in tags.split(",") if t.strip()]

    token_payload = get_token_payload()

    novo_material = Material(
        title=payload["title"].strip(),
        category=payload["category"].strip(),
        description=payload["description"].strip(),
        full_description=payload["fullDescription"].strip(),
        image=payload["image"].strip(),
        tags=", ".join(tags) if tags else None,
        arquivo_url=(payload.get("arquivoUrl") or "").strip() or None,
        criado_por=token_payload.get("email") if token_payload else None,
    )

    db.session.add(novo_material)
    db.session.commit()

    return response(
        "success", "Material adicionado com sucesso.", data=novo_material.to_dict(), http_code=201
    )


@materiais_bp.route("/materiais/<int:material_id>", methods=["DELETE"])
@admin_required
def remover_material(material_id):
    material = Material.query.get(material_id)
    if not material:
        return response("error", "Material não encontrado.", http_code=404)

    db.session.delete(material)
    db.session.commit()

    return response("success", "Material removido com sucesso.")