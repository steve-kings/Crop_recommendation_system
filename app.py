from flask import Flask, request, jsonify, send_from_directory, redirect, url_for
import joblib
import numpy as np
from flask_cors import CORS
import os

# Load model and scaler
model = joblib.load('gaussian_nb_model.pkl')
scaler = joblib.load('minmax_scaler.pkl')

# Crop label mapping
crop_dict = {
    'rice': 1, 'maize': 2, 'chickpea': 3, 'kidneybeans': 4, 'pigeonpeas': 5,
    'mothbeans': 6, 'mungbean': 7, 'blackgram': 8, 'lentil': 9, 'pomegranate': 10,
    'banana': 11, 'mango': 12, 'grapes': 13, 'watermelon': 14, 'muskmelon': 15,
    'apple': 16, 'orange': 17, 'papaya': 18, 'coconut': 19, 'cotton': 20,
    'jute': 21, 'coffee': 22
}

# Reverse the dictionary to map number → crop name
label_to_crop = {v: k for k, v in crop_dict.items()}

app = Flask(__name__, static_folder='.', static_url_path='')
CORS(app)
@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/<path:filename>')
def serve_static(filename):
    return send_from_directory('.', filename)

@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.get_json()

        expected_features = ['N', 'P', 'K', 'temperature', 'humidity', 'ph', 'rainfall']
        if not all(feature in data for feature in expected_features):
            return jsonify({'error': f'Missing one or more required fields: {expected_features}'}), 400

        input_features = np.array([[data[feature] for feature in expected_features]])
        input_scaled = scaler.transform(input_features)
        prediction = model.predict(input_scaled)

        # Convert to native Python int and map to crop name
        predicted_label = int(prediction[0])
        crop_name = label_to_crop.get(predicted_label, "Unknown")

        return jsonify({'predicted_crop': crop_name})

    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
