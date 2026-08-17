from flask import Flask, render_template, request
from flask_cors import CORS

from config import Config
from extensions import db
from auth_routes import auth_bp
from materiais_routes import materiais_bp


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    db.init_app(app)
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    app.register_blueprint(auth_bp)
    app.register_blueprint(materiais_bp)

    # ---- Páginas do site (frontend já existente) ----
    @app.route("/")
    def home():
        return render_template("index.html")

    @app.route("/home")
    def home_page():
        return render_template("home.html")

    @app.route("/materiais")
    def materiais():
        return render_template("materiais.html")

    @app.route("/cadastro")
    def cadastro_page():
        return render_template("cadastro.html")

    @app.route("/login")
    def login_page():
        return render_template("login.html")

    # Rota que recebe os dados do formulário de percepção (POST)
    @app.route("/inscrever", methods=["POST"])
    def inscrever():
        nome = request.form.get("nome")
        vinculo = request.form.get("vinculo")
        percepcao = request.form.get("percepcao")

        # Exemplo de salvamento no PostgreSQL
        # conn = psycopg2.connect("dbname=pibex user=postgres password=...")
        # cur = conn.cursor()
        # cur.execute("INSERT INTO inscritos (nome, vinculo, percepcao) VALUES (%s, %s, %s)", (nome, vinculo, percepcao))
        # conn.commit()

        return f"Obrigado, {nome}! Sua percepção foi registrada para o projeto."

    with app.app_context():
        db.create_all()

    return app


app = create_app()

if __name__ == "__main__":
    app.run(debug=True)