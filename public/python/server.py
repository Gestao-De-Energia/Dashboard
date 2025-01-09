from flask import Flask, request, jsonify
from flask_cors import CORS
import subprocess
import json
import os

app = Flask(__name__)
CORS(app)

PYTHON_SCRIPT = os.path.abspath("./CDEEPSO.py")
SIMULATION_JSON = os.path.abspath("./simulation.json")

@app.route('/run_simulation', methods=['POST'])
def run_simulation():
    try:
        # Obtém os valores enviados pelo JavaScript
        data = request.get_json()
        iterations = data.get("iterations", 10)  # Valor padrão = 10
        steps = data.get("period", 8640)         # Valor padrão = 12 meses (8640)

        # Executa o script Python passando os valores como argumentos
        subprocess.run(["python", PYTHON_SCRIPT, str(iterations), str(steps)], check=True)

        # Lê os resultados da simulação
        if os.path.exists(SIMULATION_JSON):
            with open(SIMULATION_JSON, "r") as file:
                simulation_data = json.load(file)
                return jsonify(simulation_data), 200
        else:
            return jsonify({"error": "Arquivo json não encontrado"}), 404

    except subprocess.CalledProcessError as e:
        return jsonify({"error": f"Erro ao executar a simulação: {e}"}), 500

if __name__ == '__main__':
    app.run(host="0.0.0.0", port=5000, debug=True)
