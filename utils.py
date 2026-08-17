from flask import jsonify


def response(status, message, data=None, http_code=200):
    """Formato padronizado de resposta da API: {status, message, data?}."""
    body = {"status": status, "message": message}
    if data is not None:
        body["data"] = data
    return jsonify(body), http_code