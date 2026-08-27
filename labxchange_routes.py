from flask import Blueprint, request

from extensions import db
from models import LabXchangeItem
from utils import response
from auth_utils import admin_required, get_token_payload

labxchange_bp = Blueprint("labxchange", __name__, url_prefix="/api")

TIPOS_VALIDOS = ["Simulação", "Grupo", "Vídeo", "Artigo"]
CAMPOS_OBRIGATORIOS = ["title", "url"]


@labxchange_bp.route("/labxchange", methods=["GET"])
def listar_labxchange():
    itens = LabXchangeItem.query.order_by(LabXchangeItem.criado_em.desc()).all()
    return response("success", "Simulações carregadas.", data=[i.to_dict() for i in itens])


@labxchange_bp.route("/labxchange", methods=["POST"])
@admin_required
def criar_labxchange():
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

    tipo = (payload.get("type") or "Simulação").strip()
    if tipo not in TIPOS_VALIDOS:
        tipo = "Simulação"

    tags = payload.get("tags") or []
    if isinstance(tags, str):
        tags = [t.strip() for t in tags.split(",") if t.strip()]

    token_payload = get_token_payload()

    novo_item = LabXchangeItem(
        title=payload["title"].strip(),
        type=tipo,
        description=(payload.get("description") or "").strip() or None,
        url=payload["url"].strip(),
        tags=", ".join(tags) if tags else None,
        emoji=(payload.get("emoji") or "🔬").strip(),
        gradient_from=(payload.get("gradientFrom") or "#1B3A6B").strip(),
        gradient_to=(payload.get("gradientTo") or "#2563EB").strip(),
        criado_por=token_payload.get("email") if token_payload else None,
    )

    db.session.add(novo_item)
    db.session.commit()

    return response(
        "success", "Simulação adicionada com sucesso.", data=novo_item.to_dict(), http_code=201
    )


@labxchange_bp.route("/labxchange/<int:item_id>", methods=["DELETE"])
@admin_required
def remover_labxchange(item_id):
    item = LabXchangeItem.query.get(item_id)
    if not item:
        return response("error", "Simulação não encontrada.", http_code=404)

    db.session.delete(item)
    db.session.commit()

    return response("success", "Simulação removida com sucesso.")