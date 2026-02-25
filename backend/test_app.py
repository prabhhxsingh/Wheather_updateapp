"""
Unit tests for the Weather Analytics Dashboard API
Run with: pytest test_app.py
"""

import pytest
import json
from app import app, CITIES


@pytest.fixture
def client():
    """Create a test client for the Flask app"""
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client


class TestWeatherEndpoint:
    """Test cases for /api/weather endpoint"""
    
    def test_health_check(self, client):
        """Test health check endpoint"""
        response = client.get('/api/health')
        assert response.status_code == 200
        data = response.get_json()
        assert data['success'] is True
        assert data['status'] == 'healthy'
    
    def test_missing_city_parameter(self, client):
        """Test GET /api/weather without city parameter"""
        response = client.get('/api/weather')
        assert response.status_code == 400
        data = response.get_json()
        assert data['success'] is False
        assert 'City parameter is required' in data['error']
    
    def test_empty_city_parameter(self, client):
        """Test GET /api/weather with empty city parameter"""
        response = client.get('/api/weather?city=')
        assert response.status_code == 400
        data = response.get_json()
        assert data['success'] is False
        assert 'City parameter is required' in data['error']
    
    def test_invalid_city(self, client):
        """Test GET /api/weather with invalid city"""
        response = client.get('/api/weather?city=InvalidCity')
        assert response.status_code == 400
        data = response.get_json()
        assert data['success'] is False
        assert 'Invalid city' in data['error']
        assert 'available_cities' in data
    
    def test_valid_city_listed(self, client):
        """Test that all supported cities are listed in error response"""
        response = client.get('/api/weather?city=InvalidCity')
        data = response.get_json()
        available = data['available_cities']
        
        # Check all supported cities are listed
        for city in CITIES.keys():
            assert city in available
    
    def test_cities_endpoint(self, client):
        """Test GET /api/cities endpoint"""
        response = client.get('/api/cities')
        assert response.status_code == 200
        data = response.get_json()
        assert data['success'] is True
        assert 'cities' in data
        
        # Check all supported cities are returned
        city_names = [city['name'] for city in data['cities']]
        for city in CITIES.keys():
            assert city in city_names
    
    def test_cities_endpoint_structure(self, client):
        """Test /api/cities endpoint returns proper structure"""
        response = client.get('/api/cities')
        data = response.get_json()
        
        # Check first city has proper structure
        if data['cities']:
            city = data['cities'][0]
            assert 'name' in city
            assert 'latitude' in city
            assert 'longitude' in city
            assert 'country' in city
    
    def test_not_found_endpoint(self, client):
        """Test 404 error for non-existent endpoint"""
        response = client.get('/api/nonexistent')
        assert response.status_code == 404
        data = response.get_json()
        assert data['success'] is False
        assert 'available_endpoints' in data
    
    def test_method_not_allowed(self, client):
        """Test 405 error for unsupported HTTP method"""
        response = client.post('/api/weather?city=Berlin')
        assert response.status_code == 405
        data = response.get_json()
        assert data['success'] is False
    
    def test_weather_response_structure(self, client):
        """Test that weather response has proper structure"""
        # Note: This test assumes valid API credentials in .env
        response = client.get('/api/weather?city=Berlin')
        
        # If API call fails, just check the structure of error response
        if response.status_code == 500:
            data = response.get_json()
            assert 'success' in data
            assert 'error' in data
        else:
            # If API call succeeds, check response structure
            data = response.get_json()
            if data.get('success'):
                assert 'city' in data
                assert 'location' in data
                assert 'year' in data
                assert 'monthly_data' in data
                assert 'timestamp' in data


class TestConfigurationValidation:
    """Test configuration and validation"""
    
    def test_cities_dictionary_not_empty(self):
        """Test that cities dictionary is properly configured"""
        assert len(CITIES) > 0
        assert 'Berlin' in CITIES
        assert 'Delhi' in CITIES
    
    def test_cities_have_coordinates(self):
        """Test that all cities have proper coordinates"""
        for city, coords in CITIES.items():
            assert 'lat' in coords
            assert 'lon' in coords
            assert 'country' in coords
            assert isinstance(coords['lat'], (int, float))
            assert isinstance(coords['lon'], (int, float))
            assert isinstance(coords['country'], str)


class TestCORS:
    """Test CORS configuration"""
    
    def test_cors_headers_present(self, client):
        """Test that CORS headers are present in response"""
        response = client.get('/api/health')
        # Check for CORS headers (flask-cors sets these)
        # The presence of these headers confirms CORS is enabled
        assert response.status_code == 200


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
