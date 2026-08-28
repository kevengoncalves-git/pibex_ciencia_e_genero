from flask import Flask, render_template, request, redirect, url_for
from flask_cors import CORS

from config import Config
from extensions import db
from models import LabXchangeItem
from auth_routes import auth_bp
from materiais_routes import materiais_bp
from labxchange_routes import labxchange_bp


def _seed_labxchange_curated():
    """Popula a tabela labxchange_itens com a curadoria inicial (só roda se a
    tabela estiver vazia, não sobrescreve o que os admins adicionarem depois)."""
    if LabXchangeItem.query.count() > 0:
        return

    curadoria = [
        dict(
            title="Conceitos e Técnicas Fundamentais em Biotecnologia",
            type="Grupo",
            description=(
                "Agrupamento de recursos que expõe alunos a conceitos fundamentais em "
                "biotecnologia, incluindo técnicas laboratoriais modernas como PCR, "
                "sequenciamento e cultivo celular."
            ),
            url="https://www.labxchange.org/library/items/lb:LabXchange:3e25f33b:lx_simulation:1",
            tags="Biotecnologia, Ensino Médio, PCR",
            emoji="🧬",
            gradient_from="#0C3B5E",
            gradient_to="#1A6E9A",
        ),
        dict(
            title="Eletroforese em Gel",
            type="Simulação",
            description=(
                "Simulação interativa da técnica de eletroforese em gel para separação de "
                "moléculas biológicas como DNA, RNA e proteínas por tamanho e carga elétrica."
            ),
            url="https://www.labxchange.org/library/items/lb:LabXchange:8b14b7b0:lx_simulation:1",
            tags="DNA, Biologia Molecular, Separação",
            emoji="⚡",
            gradient_from="#1B3A6B",
            gradient_to="#2563EB",
        ),
        dict(
            title="Estrutura do DNA e Replicação",
            type="Simulação",
            description=(
                "Explore a estrutura tridimensional da dupla hélice do DNA e compreenda o "
                "mecanismo de replicação semiconservativa de forma visual e interativa."
            ),
            url="https://www.labxchange.org/library/path/lb:LabXchange:3e1ed3d3:pathway:1",
            tags="DNA, Genética, Biologia",
            emoji="🔬",
            gradient_from="#1C2D6B",
            gradient_to="#3B4FD0",
        ),
        dict(
            title="Divisão Celular: Mitose e Meiose",
            type="Simulação",
            description=(
                "Visualize e compare passo a passo os processos de mitose e meiose em "
                "células animais e vegetais, com animações detalhadas de cada fase."
            ),
            url="https://www.labxchange.org/library/items/lb:LabXchange:10c0cc85:lx_simulation:1",
            tags="Célula, Genética, Ensino Médio",
            emoji="🔭",
            gradient_from="#2D3B6E",
            gradient_to="#4B6CC2",
        ),
        dict(
            title="Mulheres que Mudaram a Ciência",
            type="Grupo",
            description=(
                "Coleção de recursos sobre cientistas femininas que transformaram diferentes "
                "áreas do conhecimento: Marie Curie, Rosalind Franklin, Katherine Johnson e outras."
            ),
            url="https://www.labxchange.org/search?q=women+science",
            tags="Representatividade, História da Ciência, Gênero",
            emoji="⭐",
            gradient_from="#4A1D6E",
            gradient_to="#7C3AED",
        ),
        dict(
            title="Reações Químicas e Estequiometria",
            type="Simulação",
            description=(
                "Balanceie equações químicas, explore tipos de reação e manipule quantidades "
                "de reagentes em um laboratório virtual seguro e intuitivo."
            ),
            url="https://www.labxchange.org/library/items/lb:LabXchange:9b8c2d91:lx_simulation:1",
            tags="Química, Reações, Ensino Médio",
            emoji="⚗️",
            gradient_from="#1B5E40",
            gradient_to="#16A34A",
        ),
        dict(
            title="Edição Genômica com CRISPR-Cas9",
            type="Vídeo",
            description=(
                "Série de vídeos explicativos sobre a tecnologia CRISPR-Cas9, como ela "
                "funciona, suas aplicações na medicina e as implicações éticas de seu uso."
            ),
            url="https://www.labxchange.org/search?q=CRISPR",
            tags="CRISPR, Genômica, Biotecnologia",
            emoji="✂️",
            gradient_from="#5B21B6",
            gradient_to="#9333EA",
        ),
        dict(
            title="Sistema Solar e Exploração Espacial",
            type="Simulação",
            description=(
                "Simulação do sistema solar com órbitas, distâncias e características de cada "
                "planeta. Inclui módulo sobre missões espaciais protagonizadas por mulheres."
            ),
            url="https://www.labxchange.org/search?q=solar+system",
            tags="Astronomia, Física, Espaço",
            emoji="🚀",
            gradient_from="#0C1440",
            gradient_to="#1E3A8A",
        ),
    ]

    for item in curadoria:
        db.session.add(LabXchangeItem(**item))
    db.session.commit()


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    db.init_app(app)
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    app.register_blueprint(auth_bp)
    app.register_blueprint(materiais_bp)
    app.register_blueprint(labxchange_bp)

    # ---- Páginas do site (frontend já existente) ----
    @app.route("/")
    def home():
        return render_template("home.html")

    # Mantido só por compatibilidade com links antigos: sempre redireciona
    # para a raiz, para não existirem duas URLs diferentes para a mesma página.
    @app.route("/home")
    def home_redirect():
        return redirect(url_for("home"))

    @app.route("/pesquisa")
    def pesquisa():
        return render_template("index.html")

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
        _seed_labxchange_curated()

    return app


app = create_app()

if __name__ == "__main__":
    app.run(debug=True)