from flask import Blueprint, request

from extensions import db
from models import Material
from utils import response, salvar_upload, UploadInvalido, UploadFalhou
from auth_utils import admin_required, get_token_payload

materiais_bp = Blueprint("materiais", __name__, url_prefix="/api")

CAMPOS_OBRIGATORIOS = ["title", "category", "description", "fullDescription"]

EXTENSOES_IMAGEM = {"png", "jpg", "jpeg", "gif", "webp"}
EXTENSOES_ARQUIVO = {"pdf", "doc", "docx", "ppt", "pptx"}


@materiais_bp.route("/materiais", methods=["GET"])
def listar_materiais():
    materiais = Material.query.order_by(Material.criado_em.desc()).all()
    return response("success", "Materiais carregados.", data=[m.to_dict() for m in materiais])


@materiais_bp.route("/materiais", methods=["POST"])
@admin_required
def criar_material():
    # multipart/form-data: campos de texto ficam em request.form,
    # os arquivos (se enviados) ficam em request.files
    dados = request.form

    faltando = [
        campo for campo in CAMPOS_OBRIGATORIOS if not (dados.get(campo) or "").strip()
    ]
    if faltando:
        return response(
            "error",
            f"Campos obrigatórios não preenchidos: {', '.join(faltando)}.",
            http_code=400,
        )

    # Imagem: prioriza o arquivo enviado; se não houver, usa a URL colada
    try:
        imagem_upload = salvar_upload(
            request.files.get("imageFile"), "materiais/imagens", EXTENSOES_IMAGEM
        )
        arquivo_upload = salvar_upload(
            request.files.get("arquivoFile"), "materiais/arquivos", EXTENSOES_ARQUIVO
        )
    except (UploadInvalido, UploadFalhou) as erro:
        return response("error", str(erro), http_code=400)

    imagem_final = imagem_upload or (dados.get("image") or "").strip()
    if not imagem_final:
        return response(
            "error", "Envie uma imagem (arquivo ou URL) para o material.", http_code=400
        )

    arquivo_final = arquivo_upload or (dados.get("arquivoUrl") or "").strip() or None

    tags_raw = dados.get("tags") or ""
    tags = [t.strip() for t in tags_raw.split(",") if t.strip()]

    token_payload = get_token_payload()

    novo_material = Material(
        title=dados["title"].strip(),
        category=dados["category"].strip(),
        description=dados["description"].strip(),
        full_description=dados["fullDescription"].strip(),
        image=imagem_final,
        tags=", ".join(tags) if tags else None,
        arquivo_url=arquivo_final,
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