from flask import Flask, render_template, request
import psycopg2 # Biblioteca para conectar ao PostgreSQL

app = Flask(__name__)

# Rota para a página inicial
@app.route('/')
def home():
    return render_template('index.html')

@app.route('/home')
def home_page():
    return render_template('home.html')

# Rota que recebe os dados do formulário (POST)
@app.route('/inscrever', methods=['POST'])
def inscrever():
    nome = request.form.get('nome')
    vinculo = request.form.get('vinculo')
    percepcao = request.form.get('percepcao')

    # Exemplo de salvamento no PostgreSQL
    # conn = psycopg2.connect("dbname=pibex user=postgres password=...")
    # cur = conn.cursor()
    # cur.execute("INSERT INTO inscritos (nome, vinculo, percepcao) VALUES (%s, %s, %s)", (nome, vinculo, percepcao))
    # conn.commit()

    return f"Obrigado, {nome}! Sua percepção foi registrada para o projeto."

if __name__ == '__main__':
    app.run(debug=True)