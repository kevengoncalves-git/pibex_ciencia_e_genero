from flask import Flask, render_template
from flask_cors import CORS

from config import Config
from extensions import db
from auth_routes import auth_bp


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    db.init_app(app)
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    app.register_blueprint(auth_bp)

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

    with app.app_context():
        db.create_all()

    return app


app = create_app()

if __name__ == "__main__":
    app.run(debug=True)