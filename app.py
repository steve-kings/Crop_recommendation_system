from flask import Flask, request, jsonify, send_from_directory, redirect, url_for
import joblib
import numpy as np
from flask_cors import CORS
import os
from dotenv import load_dotenv
import requests
from urllib.parse import quote

# Load environment variables
load_dotenv()

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

# Get API keys from environment
OPENWEATHER_API_KEY = os.getenv('OPENWEATHER_API_KEY')

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

@app.route('/api/weather/current', methods=['GET'])
def get_weather_by_coords():
    """Proxy endpoint for weather API by coordinates"""
    try:
        lat = request.args.get('lat')
        lon = request.args.get('lon')
        
        if not lat or not lon:
            return jsonify({'error': 'Latitude and longitude are required'}), 400
        
        if not OPENWEATHER_API_KEY:
            return jsonify({'error': 'Weather API key not configured'}), 500
        
        url = f'https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&units=metric&appid={OPENWEATHER_API_KEY}'
        response = requests.get(url)
        
        if response.status_code == 200:
            return jsonify(response.json())
        else:
            return jsonify({'error': 'Failed to fetch weather data'}), response.status_code
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/weather/city', methods=['GET'])
def get_weather_by_city():
    """Proxy endpoint for weather API by city name"""
    try:
        city = request.args.get('city')
        
        if not city:
            return jsonify({'error': 'City name is required'}), 400
        
        if not OPENWEATHER_API_KEY:
            return jsonify({'error': 'Weather API key not configured'}), 500
        
        url = f'https://api.openweathermap.org/data/2.5/weather?q={city}&units=metric&appid={OPENWEATHER_API_KEY}'
        response = requests.get(url)
        
        if response.status_code == 200:
            return jsonify(response.json())
        else:
            return jsonify({'error': 'Failed to fetch weather data'}), response.status_code
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/weather/forecast', methods=['GET'])
def get_weather_forecast():
    """Proxy endpoint for weather forecast API"""
    try:
        lat = request.args.get('lat')
        lon = request.args.get('lon')
        city = request.args.get('city')
        
        if not OPENWEATHER_API_KEY:
            return jsonify({'error': 'Weather API key not configured'}), 500
        
        if lat and lon:
            url = f'https://api.openweathermap.org/data/2.5/forecast?lat={lat}&lon={lon}&units=metric&appid={OPENWEATHER_API_KEY}'
        elif city:
            url = f'https://api.openweathermap.org/data/2.5/forecast?q={city}&units=metric&appid={OPENWEATHER_API_KEY}'
        else:
            return jsonify({'error': 'Either coordinates or city name is required'}), 400
        
        response = requests.get(url)
        
        if response.status_code == 200:
            return jsonify(response.json())
        else:
            return jsonify({'error': 'Failed to fetch forecast data'}), response.status_code
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/translate', methods=['POST'])
def translate_text():
    """Translate text using MyMemory Translation API (completely free)"""
    try:
        data = request.get_json()
        text = data.get('text')
        target_lang = data.get('target', 'sw')  # Default to Swahili
        source_lang = data.get('source', 'en')  # Default source is English
        
        if not text:
            return jsonify({'error': 'Text is required'}), 400
        
        # Handle both single string and array of strings
        if isinstance(text, str):
            translated = translate_with_mymemory(text, source_lang, target_lang)
            return jsonify({'translated_text': translated})
        elif isinstance(text, list):
            translations = []
            for item in text:
                translated = translate_with_mymemory(item, source_lang, target_lang)
                translations.append(translated)
            return jsonify({'translated_text': translations})
        else:
            return jsonify({'error': 'Invalid text format'}), 400
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/translate/page', methods=['POST'])
def translate_page():
    """Translate multiple page elements at once using MyMemory API"""
    try:
        data = request.get_json()
        elements = data.get('elements', {})
        target_lang = data.get('target', 'sw')
        source_lang = data.get('source', 'en')
        
        if not elements:
            return jsonify({'error': 'Elements dictionary is required'}), 400
        
        translated_elements = {}
        for key, text in elements.items():
            if text and isinstance(text, str) and text.strip():
                try:
                    translated = translate_with_mymemory(text, source_lang, target_lang)
                    translated_elements[key] = translated
                except Exception as e:
                    print(f"Translation error for key {key}: {e}")
                    translated_elements[key] = text  # Keep original if translation fails
            else:
                translated_elements[key] = text
        
        return jsonify({'translations': translated_elements})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def translate_with_mymemory(text, source_lang='en', target_lang='sw'):
    """
    Translate text using MyMemory Translation API (free, no API key needed)
    Supports up to 10,000 words per day without registration
    """
    try:
        # MyMemory API endpoint
        url = "https://api.mymemory.translated.net/get"
        
        # Prepare parameters
        params = {
            'q': text,
            'langpair': f'{source_lang}|{target_lang}'
        }
        
        # Make request
        response = requests.get(url, params=params, timeout=10)
        
        if response.status_code == 200:
            result = response.json()
            
            # Check if translation was successful
            if result.get('responseStatus') == 200:
                translated_text = result.get('responseData', {}).get('translatedText', text)
                return translated_text
            else:
                print(f"MyMemory API error: {result.get('responseDetails', 'Unknown error')}")
                return text
        else:
            print(f"HTTP error: {response.status_code}")
            return text
            
    except Exception as e:
        print(f"Translation error: {e}")
        return text  # Return original text if translation fails

if __name__ == '__main__':
    app.run(debug=True)
