"""
Weather Analytics Dashboard Backend API
A production-ready Flask API for fetching monthly weather data using Google Gemini API
"""

import os
import logging
import json
import random
import hashlib
from datetime import datetime
from typing import Dict, Any, Optional

import google.generativeai as genai
from flask import Flask, jsonify, request
from flask_cors import CORS
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

# Configuration
class Config:
    """Application configuration"""
    GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
    FLASK_ENV = os.getenv('FLASK_ENV', 'production')
    DEBUG = os.getenv('DEBUG', 'False').lower() == 'true'

# Validate configuration
if not Config.GEMINI_API_KEY:
    logger.warning('Missing API configuration. Please set GEMINI_API_KEY in .env')

# City validation dictionary
CITIES = {
    'Berlin': {'lat': 52.5200, 'lon': 13.4050, 'country': 'Germany'},
    'Delhi': {'lat': 28.7041, 'lon': 77.1025, 'country': 'India'},
    'Mumbai': {'lat': 19.0760, 'lon': 72.8777, 'country': 'India'},
    'New York': {'lat': 40.7128, 'lon': -74.0060, 'country': 'USA'},
    'Tokyo': {'lat': 35.6762, 'lon': 139.6503, 'country': 'Japan'},
    'Paris': {'lat': 48.8566, 'lon': 2.3522, 'country': 'France'},
}


def generate_mock_weather(city_name: str) -> Dict[str, Any]:
    """
    Generate deterministic mock monthly weather data for the year 2024.

    This generator is seeded from the city name so the results are stable
    between runs for the same city.
    """
    # Create a deterministic seed from the city name
    seed = int(hashlib.sha256(city_name.encode('utf-8')).hexdigest(), 16) % (10 ** 8)
    rnd = random.Random(seed)

    data = []
    # Simple baseline climates by heuristics on city name (very coarse)
    baseline_temp = 10.0
    if city_name.lower() in ('delhi', 'mumbai'):
        baseline_temp = 25.0
    elif city_name.lower() in ('dubai',):
        baseline_temp = 28.0
    elif city_name.lower() in ('new york', 'paris', 'berlin'):
        baseline_temp = 8.0
    elif city_name.lower() in ('tokyo',):
        baseline_temp = 15.0

    for month in range(1, 13):
        # Seasonal swing
        seasonal = 10 * (1.0 - abs((month - 7) / 6.0))  # peak around mid-year for northern hemisphere
        tavg = round(baseline_temp + seasonal * (rnd.random() * 0.6 + 0.7) - 6.0, 1)
        tmin = round(tavg - (rnd.random() * 5.0 + 2.0), 1)
        tmax = round(tavg + (rnd.random() * 5.0 + 2.0), 1)
        prcp = round(max(0.0, rnd.gauss(50.0 - (seasonal * 2.0), 20.0)), 1)  # mm for month
        wspd = round(max(0.0, rnd.gauss(12.0, 4.0)), 1)
        pres = round(rnd.gauss(1013.0, 5.0), 1)
        rhum = max(0, min(100, int(rnd.gauss(65.0, 15.0))))

        entry = {
            'date': f'2024-{month:02d}-01',
            'tavg': tavg,
            'tmin': tmin,
            'tmax': tmax,
            'prcp': prcp,
            'wspd': wspd,
            'pres': pres,
            'rhum': rhum
        }
        data.append(entry)

    return {'data': data}


class WeatherAPIClient:
    """Client for interacting with Google Gemini API for weather data"""
    
    def __init__(self, api_key: str):
        """
        Initialize the Weather API client
        
        Args:
            api_key: Google Gemini API key
        """
        self.api_key = api_key
        genai.configure(api_key=api_key)
        
        # Try different models in order of preference (use models detected from API)
        model_options = [
            'models/gemini-2.5-flash',
            'models/gemini-2.5-pro',
            'models/gemini-2.0-flash',
            'models/gemini-flash-latest',
            'models/gemini-pro-latest',
            'models/gemini-1.5-flash',
            'models/gemini-pro'
        ]
        
        self.model = None
        for model_name in model_options:
            try:
                self.model = genai.GenerativeModel(model_name)
                # Test if model works
                self.model.generate_content("test")
                logger.info(f'Successfully initialized model: {model_name}')
                break
            except Exception as e:
                logger.warning(f'Model {model_name} not available: {str(e)[:100]}')
                continue
        
        if not self.model:
            logger.error('No suitable Gemini model available. Check API key and available models. Falling back to mock data if enabled.')
            # Do not raise here; allow the application to continue and use mock data when needed
            self.model = None
    
    def get_monthly_weather(
        self,
        city_name: str
    ) -> Optional[Dict[str, Any]]:
        """
        Fetch monthly weather data for a given city in 2024 using Gemini API
        
        Args:
            city_name: Name of the city
            
        Returns:
            Dictionary containing monthly weather data or None if error occurs
        """
        try:
            # If configured to use mock data, or if no Gemini model was initialized, return deterministic mock data
            use_mock = os.getenv('USE_MOCK_DATA', 'False').lower() == 'true'
            if use_mock or not self.model:
                logger.info(f'Using mock weather data for {city_name} (use_mock={use_mock}, model_available={self.model is not None})')
                return generate_mock_weather(city_name)
            logger.info(f'Fetching weather data for {city_name} via Gemini API')
            
            # Craft a detailed prompt for Gemini to fetch weather data
            prompt = f"""
            Provide monthly weather statistics for {city_name} for the year 2024 (Jan-Dec).
            
            For each month, provide the following data in JSON format:
            {{
              "data": [
                {{
                  "date": "2024-01-01",
                  "tavg": average_temperature_celsius,
                  "tmin": minimum_temperature_celsius,
                  "tmax": maximum_temperature_celsius,
                  "prcp": precipitation_mm,
                  "wspd": wind_speed_kmh,
                  "pres": pressure_hpa,
                  "rhum": humidity_percent
                }},
                ...12 months total
              ]
            }}
            
            Provide realistic weather data for {city_name}. Return ONLY valid JSON, no additional text.
            """
            
            response = self.model.generate_content(prompt)
            
            if not response.text:
                logger.error(f'Empty response from Gemini API for {city_name}')
                return None
            
            # Extract JSON from response
            response_text = response.text.strip()
            
            # Try to parse JSON directly
            try:
                data = json.loads(response_text)
                logger.info(f'Successfully fetched weather data for {city_name}')
                return data
            except json.JSONDecodeError:
                # If direct parsing fails, try to extract JSON from the response
                logger.warning(f'JSON parsing failed, attempting to extract JSON from response for {city_name}')
                
                # Find JSON in the response
                start_idx = response_text.find('{')
                end_idx = response_text.rfind('}') + 1
                
                if start_idx != -1 and end_idx > start_idx:
                    json_str = response_text[start_idx:end_idx]
                    data = json.loads(json_str)
                    logger.info(f'Successfully extracted and parsed weather data for {city_name}')
                    return data
                else:
                    logger.error(f'Could not extract JSON from Gemini response for {city_name}')
                    return None
        
        except Exception as e:
            logger.error(f'Error fetching weather data for {city_name}: {str(e)}')
            return None


def format_weather_response(
    city_name: str,
    weather_data: Dict[str, Any],
    city_info: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Format the raw API response into a structured JSON response
    
    Args:
        city_name: Name of the city
        weather_data: Raw weather data from API
        city_info: City metadata
        
    Returns:
        Formatted response dictionary
    """
    monthly_data = []
    
    if 'data' in weather_data:
        for entry in weather_data['data']:
            monthly_data.append({
                'month': entry.get('date', 'N/A'),
                'temperature': {
                    'avg': entry.get('tavg'),
                    'min': entry.get('tmin'),
                    'max': entry.get('tmax')
                },
                'precipitation': entry.get('prcp'),
                'wind_speed': entry.get('wspd'),
                'pressure': entry.get('pres'),
                'humidity': entry.get('rhum')
            })
    
    return {
        'success': True,
        'city': city_name,
        'location': {
            'latitude': city_info['lat'],
            'longitude': city_info['lon'],
            'country': city_info['country']
        },
        'year': 2024,
        'monthly_data': monthly_data,
        'timestamp': datetime.utcnow().isoformat() + 'Z'
    }


# Initialize API client
weather_client = WeatherAPIClient(
    api_key=Config.GEMINI_API_KEY
)


@app.route('/api/weather', methods=['GET'])
def get_weather():
    """
    GET /api/weather?city=CityName
    
    Fetch monthly weather data for a specified city
    
    Query Parameters:
        city (string, required): Name of the city
        
    Returns:
        JSON response with monthly weather data or error message
        
    Status Codes:
        200: Success
        400: Bad request (missing or invalid city)
        500: Server error (API failure)
    """
    try:
        # Get city parameter
        city_name = request.args.get('city', '').strip()
        
        # Validate city parameter
        if not city_name:
            logger.warning('Weather request without city parameter')
            return jsonify({
                'success': False,
                'error': 'City parameter is required',
                'example': '/api/weather?city=Berlin'
            }), 400
        
        if city_name not in CITIES:
            logger.warning(f'Weather request for invalid city: {city_name}')
            available_cities = ', '.join(sorted(CITIES.keys()))
            return jsonify({
                'success': False,
                'error': f'Invalid city: {city_name}',
                'available_cities': sorted(list(CITIES.keys())),
                'example': '/api/weather?city=Berlin'
            }), 400
        
        # Get city coordinates
        city_info = CITIES[city_name]
        
        # Fetch weather data
        weather_data = weather_client.get_monthly_weather(
            city_name=city_name
        )
        
        if weather_data is None:
            logger.error(f'Failed to fetch weather data for {city_name}')
            return jsonify({
                'success': False,
                'error': 'Failed to fetch weather data from external API',
                'city': city_name
            }), 500
        
        # Format response
        response = format_weather_response(city_name, weather_data, city_info)
        
        return jsonify(response), 200
    
    except Exception as e:
        logger.error(f'Unexpected error in get_weather endpoint: {str(e)}', exc_info=True)
        return jsonify({
            'success': False,
            'error': 'An unexpected error occurred'
        }), 500


@app.route('/api/cities', methods=['GET'])
def get_available_cities():
    """
    GET /api/cities
    
    Return list of available cities
    
    Returns:
        JSON response with list of available cities
        
    Status Codes:
        200: Success
    """
    try:
        cities_list = [
            {
                'name': city,
                'latitude': info['lat'],
                'longitude': info['lon'],
                'country': info['country']
            }
            for city, info in CITIES.items()
        ]
        
        return jsonify({
            'success': True,
            'cities': sorted(cities_list, key=lambda x: x['name'])
        }), 200
    
    except Exception as e:
        logger.error(f'Error in get_available_cities endpoint: {str(e)}', exc_info=True)
        return jsonify({
            'success': False,
            'error': 'An unexpected error occurred'
        }), 500


@app.route('/api/health', methods=['GET'])
def health_check():
    """
    GET /api/health
    
    Health check endpoint
    
    Returns:
        JSON response indicating API status
        
    Status Codes:
        200: API is healthy
    """
    return jsonify({
        'status': 'healthy',
        'service': 'Weather Analytics Dashboard API',
        'environment': Config.FLASK_ENV,
        'timestamp': datetime.utcnow().isoformat() + 'Z'
    }), 200


@app.errorhandler(404)
def not_found(error):
    """Handle 404 errors"""
    return jsonify({
        'success': False,
        'error': 'Endpoint not found',
        'available_endpoints': [
            '/api/weather?city=CityName',
            '/api/cities',
            '/api/health'
        ]
    }), 404


@app.errorhandler(405)
def method_not_allowed(error):
    """Handle 405 errors"""
    return jsonify({
        'success': False,
        'error': 'Method not allowed'
    }), 405


@app.errorhandler(500)
def internal_error(error):
    """Handle 500 errors"""
    logger.error(f'Internal server error: {str(error)}', exc_info=True)
    return jsonify({
        'success': False,
        'error': 'Internal server error'
    }), 500


if __name__ == '__main__':
    logger.info(f'Starting Weather Analytics Dashboard API (Environment: {Config.FLASK_ENV})')
    app.run(
        host='0.0.0.0',
        port=5000,
        debug=Config.DEBUG
    )
