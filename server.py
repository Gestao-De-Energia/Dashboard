from flask import Flask, jsonify
from flask_cors import CORS
import subprocess
import json
import os

app = Flask(__name__)
CORS(app)

# Caminhos dos arquivos
BASE_DIR = os.path.dirname(os.path.abspath(__file__))  # Garante que a função rode no diretório correto
PYTHON_SCRIPT = os.path.join(BASE_DIR, "CDEEPSO.py")
SIMULATION_JSON = os.path.join(BASE_DIR, "simulation.json")


@app.route('/run_simulation', methods=['POST'])
def run_simulation():
    try:
        subprocess.run(["python", PYTHON_SCRIPT], check=True)

        if os.path.exists(SIMULATION_JSON):
            with open(SIMULATION_JSON, "r") as file:
                data = json.load(file)
                return jsonify(data), 200
        else:
            return jsonify({"error": "Arquivo json não encontrado"}), 404

    except subprocess.CalledProcessError as e:
        return jsonify({"error": f"Erro ao executar a simulação: {str(e)}"}), 500

# Função que o Firebase Functions usa como entrada
def flask_app(request):
    return app(request)
