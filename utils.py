import os
import uuid
from flask import jsonify, current_app, url_for
from werkzeug.utils import secure_filename

try:
    import cloudinary
    import cloudinary.uploader
except ImportError:  # cloudinary é opcional: só é necessário se configurado
    cloudinary = None

EXTENSOES_IMAGEM = {"png", "jpg", "jpeg", "gif", "webp"}


def response(status, message, data=None, http_code=200):
    """Formato padronizado de resposta da API: {status, message, data?}."""
    body = {"status": status, "message": message}
    if data is not None:
        body["data"] = data
    return jsonify(body), http_code


class UploadInvalido(Exception):
    """Levantada quando o arquivo enviado tem uma extensão não permitida."""


class UploadFalhou(Exception):
    """Levantada quando o upload (Cloudinary ou local) falha por outro motivo
    (rede, credenciais erradas, permissão de escrita, etc.)."""


def _validar_extensao(filename, extensoes_permitidas):
    extensao = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    if extensao not in extensoes_permitidas:
        raise UploadInvalido(
            f"Formato '.{extensao}' não permitido. Use: {', '.join(sorted(extensoes_permitidas))}."
        )
    return extensao


def _cloudinary_configurado():
    cfg = current_app.config
    return bool(
        cloudinary
        and cfg.get("CLOUDINARY_CLOUD_NAME")
        and cfg.get("CLOUDINARY_API_KEY")
        and cfg.get("CLOUDINARY_API_SECRET")
    )


def salvar_upload(file_storage, subpasta, extensoes_permitidas):
    """Salva um arquivo enviado (request.files) e devolve sua URL pública,
    ou None se nenhum arquivo foi enviado nesse campo.

    Se as credenciais do Cloudinary estiverem configuradas (variáveis de
    ambiente), o arquivo vai para lá — o que persiste entre deploys.
    Caso contrário, cai automaticamente para salvar em static/uploads/
    no próprio servidor (ótimo para rodar localmente sem precisar
    configurar nada, mas não persiste em hosts com disco temporário)."""
    if not file_storage or not file_storage.filename:
        return None

    extensao = _validar_extensao(file_storage.filename, extensoes_permitidas)

    if _cloudinary_configurado():
        return _salvar_no_cloudinary(file_storage, subpasta, extensao)

    return _salvar_localmente(file_storage, subpasta)


def _salvar_no_cloudinary(file_storage, subpasta, extensao):
    # Cloudinary trata imagens (resource_type="image") separado de outros
    # arquivos como PDF/DOC/PPT (resource_type="raw").
    resource_type = "image" if extensao in EXTENSOES_IMAGEM else "raw"

    try:
        resultado = cloudinary.uploader.upload(
            file_storage,
            folder=f"ciencia-e-genero/{subpasta}",
            resource_type=resource_type,
        )
    except Exception as erro:
        raise UploadFalhou(f"Falha ao enviar o arquivo para o Cloudinary: {erro}")

    return resultado["secure_url"]


def _salvar_localmente(file_storage, subpasta):
    nome_seguro = secure_filename(file_storage.filename)
    nome_final = f"{uuid.uuid4().hex}_{nome_seguro}"

    pasta_destino = os.path.join(current_app.static_folder, "uploads", subpasta)
    os.makedirs(pasta_destino, exist_ok=True)

    try:
        file_storage.save(os.path.join(pasta_destino, nome_final))
    except OSError as erro:
        raise UploadFalhou(f"Falha ao salvar o arquivo no servidor: {erro}")

    return url_for("static", filename=f"uploads/{subpasta}/{nome_final}")