from flask import Flask, jsonify
from flask_cors import CORS
import subprocess
import json
import os

app = Flask(__name__)
CORS(app)  # Habilita CORS para todas as rotas

# Caminhos dos arquivos
PYTHON_SCRIPT = os.path.abspath("./CDEEPSO.py")
SIMULATION_JSON = os.path.abspath("./simulation.json")

@app.route('/run_simulation', methods=['POST'])
def run_simulation():
    try:
        # Executa o script CDEEPSO.py
        subprocess.run(["python", PYTHON_SCRIPT], check=True)

        # Lê os resultados da simulação
        if os.path.exists(SIMULATION_JSON):
            with open(SIMULATION_JSON, "r") as file:
                data = json.load(file)
                return jsonify(data), 200
        else:
            return jsonify({"error": "Arquivo json não encontrado"}), 404

    except subprocess.CalledProcessError as e:
        return jsonify({"error": f"Erro ao executar a simulação: {e}"}), 500

if __name__ == '__main__':
    app.run(host="0.0.0.0", port=5000, debug=True)
