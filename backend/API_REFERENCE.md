# API Reference Guide

## Quick Reference

### Base URL
```
http://localhost:5000    (Development)
https://yourdomain.com   (Production)
```

## Endpoints

### 1. Get Weather Data
```
GET /api/weather?city=CityName
```

**Query Parameters:**
| Parameter | Type | Required | Example |
|-----------|------|----------|---------|
| city | string | Yes | Berlin |

**Success Response (200):**
```json
{
  "success": true,
  "city": "Berlin",
  "location": {
    "latitude": 52.52,
    "longitude": 13.405,
    "country": "Germany"
  },
  "year": 2024,
  "monthly_data": [
    {
      "month": "2024-01-01",
      "temperature": {
        "avg": 2.5,
        "min": -1.2,
        "max": 6.8
      },
      "precipitation": 45.2,
      "wind_speed": 12.5,
      "pressure": 1013.25,
      "humidity": 75.5
    }
  ],
  "timestamp": "2024-02-26T10:30:45.123456Z"
}
```

**Error Response (400 - Invalid City):**
```json
{
  "success": false,
  "error": "Invalid city: InvalidCity",
  "available_cities": ["Berlin", "Delhi", "Mumbai", "New York", "Paris", "Tokyo"],
  "example": "/api/weather?city=Berlin"
}
```

**Error Response (500 - API Failure):**
```json
{
  "success": false,
  "error": "Failed to fetch weather data from external API",
  "city": "Berlin"
}
```

---

### 2. List Available Cities
```
GET /api/cities
```

**Success Response (200):**
```json
{
  "success": true,
  "cities": [
    {
      "name": "Berlin",
      "latitude": 52.52,
      "longitude": 13.405,
      "country": "Germany"
    },
    {
      "name": "Delhi",
      "latitude": 28.7041,
      "longitude": 77.1025,
      "country": "India"
    }
  ]
}
```

---

### 3. Health Check
```
GET /api/health
```

**Success Response (200):**
```json
{
  "status": "healthy",
  "service": "Weather Analytics Dashboard API",
  "environment": "production",
  "timestamp": "2024-02-26T10:30:45.123456Z"
}
```

---

## HTTP Status Codes

| Code | Meaning | Use Case |
|------|---------|----------|
| 200 | OK | Successful request |
| 400 | Bad Request | Invalid/missing city parameter |
| 404 | Not Found | Invalid endpoint |
| 405 | Method Not Allowed | Wrong HTTP method (POST instead of GET) |
| 500 | Server Error | API failure or unexpected error |

---

## Available Cities

| City | Country | Latitude | Longitude |
|------|---------|----------|-----------|
| Berlin | Germany | 52.52 | 13.405 |
| Delhi | India | 28.7041 | 77.1025 |
| Mumbai | India | 19.0760 | 72.8777 |
| New York | USA | 40.7128 | -74.0060 |
| Paris | France | 48.8566 | 2.3522 |
| Tokyo | Japan | 35.6762 | 139.6503 |

---

## Temperature Data Fields

Each monthly data point contains:

```json
{
  "month": "2024-01-01",
  "temperature": {
    "avg": 2.5,     // Average temperature in Celsius
    "min": -1.2,    // Minimum temperature in Celsius
    "max": 6.8      // Maximum temperature in Celsius
  },
  "precipitation": 45.2,  // Rainfall in mm
  "wind_speed": 12.5,     // Wind speed in km/h
  "pressure": 1013.25,    // Atmospheric pressure in hPa
  "humidity": 75.5        // Relative humidity in %
}
```

---

## cURL Examples

### Get Weather for Berlin
```bash
curl "http://localhost:5000/api/weather?city=Berlin"
```

### Get Weather for Multiple Cities
```bash
curl "http://localhost:5000/api/weather?city=New%20York"
curl "http://localhost:5000/api/weather?city=Tokyo"
```

### List Available Cities
```bash
curl "http://localhost:5000/api/cities"
```

### Health Check
```bash
curl "http://localhost:5000/api/health"
```

### Pretty Print JSON (with jq)
```bash
curl "http://localhost:5000/api/weather?city=Berlin" | jq
```

---

## JavaScript Examples

### Fetch Weather Data
```javascript
async function getWeather(city) {
  try {
    const response = await fetch(
      `http://localhost:5000/api/weather?city=${encodeURIComponent(city)}`
    );
    const data = await response.json();
    
    if (data.success) {
      console.log(`Weather for ${data.city}:`, data.monthly_data);
    } else {
      console.error('Error:', data.error);
    }
  } catch (error) {
    console.error('Request failed:', error);
  }
}

getWeather('Berlin');
```

### Fetch All Cities
```javascript
async function getCities() {
  const response = await fetch('http://localhost:5000/api/cities');
  const data = await response.json();
  
  data.cities.forEach(city => {
    console.log(`${city.name}, ${city.country}`);
  });
}

getCities();
```

### Health Check
```javascript
async function checkHealth() {
  const response = await fetch('http://localhost:5000/api/health');
  const data = await response.json();
  
  if (data.status === 'healthy') {
    console.log('API is healthy');
  }
}

checkHealth();
```

---

## Python Examples

### Using Requests Library
```python
import requests

# Get weather
response = requests.get('http://localhost:5000/api/weather?city=Berlin')
data = response.json()

if data['success']:
    for month in data['monthly_data']:
        print(f"{month['month']}: {month['temperature']['avg']}°C")
else:
    print(f"Error: {data['error']}")

# Get cities
response = requests.get('http://localhost:5000/api/cities')
cities = response.json()['cities']

for city in cities:
    print(f"{city['name']}, {city['country']}")
```

---

## Error Handling Best Practices

### Check Status Code
```javascript
const response = await fetch('http://localhost:5000/api/weather?city=Berlin');

if (response.status === 200) {
  const data = await response.json();
  console.log(data);
} else if (response.status === 400) {
  console.error('Invalid city parameter');
} else if (response.status === 500) {
  console.error('Server error');
}
```

### Validate Response
```javascript
const response = await fetch('http://localhost:5000/api/weather?city=Berlin');
const data = await response.json();

if (data.success) {
  // Process data
} else {
  // Handle error
  console.error(data.error);
  if (data.available_cities) {
    console.log('Valid cities:', data.available_cities);
  }
}
```

---

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| 400: Invalid city | Use city name exactly as shown in cities list |
| 500: API Error | Check API credentials in .env file |
| Connection Refused | Ensure Flask app is running on port 5000 |
| CORS Error | CORS is enabled by default for all origins |
| Timeout | API call takes > 10s, check internet connection |

---

## Rate Limiting (Future Addition)

Currently no rate limiting. For production deployment, consider adding:

```python
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

limiter = Limiter(
    app=app,
    key_func=get_remote_address,
    default_limits=["200 per day", "50 per hour"]
)

@app.route('/api/weather')
@limiter.limit("10 per minute")
def get_weather():
    # Implementation
```

---

## Caching (Future Addition)

To improve performance with frequently requested cities:

```python
from flask_caching import Cache

cache = Cache(app, config={'CACHE_TYPE': 'redis'})

@app.route('/api/weather')
@cache.cached(timeout=3600, query_string=True)
def get_weather():
    # Implementation - cached for 1 hour
```

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2024-02-26 | Initial release |

---

**Last Updated**: February 26, 2024
**API Version**: 1.0.0
