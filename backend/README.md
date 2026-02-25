# Weather Analytics Dashboard API

A production-ready Flask backend API for fetching monthly weather data using Google's Gemini API.

## Features

- ✅ RESTful API endpoints for weather data retrieval
- ✅ City validation with predefined dictionary
- ✅ Monthly weather data for 2024 (Jan–Dec)
- ✅ Proper error handling with appropriate HTTP status codes
- ✅ CORS enabled for frontend integration
- ✅ Environment-based configuration
- ✅ Comprehensive logging
- ✅ Health check endpoint
- ✅ Production-ready code structure
- ✅ Uses Google Gemini API (free tier available)

## Project Structure

```
backend/
├── app.py                 # Main Flask application
├── config.py             # Configuration management
├── requirements.txt      # Python dependencies
├── .env.example          # Environment variables template
├── .env                  # Actual environment variables (create from .env.example)
└── README.md            # This file
```

## Prerequisites

- Python 3.8+
- pip (Python package manager)
- Google Gemini API key (free tier available at [Google AI Studio](https://aistudio.google.com/app/apikey))

## Setup Instructions

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Configure Environment Variables

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Get your API key:
   - Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
   - Click **Create API Key** (no credit card required)
   - Copy your API key

3. Update `.env` with your API key:
   ```
   GEMINI_API_KEY=your_actual_api_key_here
   FLASK_ENV=production
   DEBUG=False
   ```

### 3. Run the API

**Development Mode:**
```bash
python app.py
```

**Production Mode (using Gunicorn):**
```bash
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

The API will be available at `http://localhost:5000`

## API Endpoints

### 1. Get Weather Data
**Request:**
```
GET /api/weather?city=Berlin
```

**Response (200 OK):**
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
    },
    ...
  ],
  "timestamp": "2024-02-26T10:30:45.123456Z"
}
```

**Error Response (400 Bad Request):**
```json
{
  "success": false,
  "error": "Invalid city: InvalidCity",
  "available_cities": ["Berlin", "Delhi", "Mumbai", "New York", "Paris", "Tokyo"],
  "example": "/api/weather?city=Berlin"
}
```

### 2. Get Available Cities
**Request:**
```
GET /api/cities
```

**Response (200 OK):**
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
    ...
  ]
}
```

### 3. Health Check
**Request:**
```
GET /api/health
```

**Response (200 OK):**
```json
{
  "status": "healthy",
  "service": "Weather Analytics Dashboard API",
  "environment": "production",
  "timestamp": "2024-02-26T10:30:45.123456Z"
}
```

## Supported Cities

- Berlin, Germany
- Delhi, India
- Mumbai, India
- New York, USA
- Paris, France
- Tokyo, Japan

## HTTP Status Codes

| Code | Meaning | Scenario |
|------|---------|----------|
| 200 | OK | Successful request |
| 400 | Bad Request | Missing or invalid city parameter |
| 404 | Not Found | Invalid endpoint |
| 405 | Method Not Allowed | Using unsupported HTTP method |
| 500 | Internal Server Error | API failure or unexpected error |

## Error Handling

The API handles the following error scenarios:

1. **Missing City Parameter**: Returns 400 with suggestion
2. **Invalid City Name**: Returns 400 with list of available cities
3. **API Timeout**: Returns 500 with error message
4. **API Failure**: Returns 500 with descriptive error
5. **Invalid JSON Response**: Returns 500 with error message

## Logging

All requests and errors are logged to the console with timestamp, log level, and message. Logs include:
- API requests
- Successful data fetches
- Errors and exceptions
- Configuration warnings

Example log output:
```
2024-02-26 10:30:45,123 - __main__ - INFO - Fetching weather data for Berlin (lat: 52.52, lon: 13.405)
2024-02-26 10:30:46,456 - __main__ - INFO - Successfully fetched weather data for Berlin
```

## CORS Configuration

CORS is enabled for all origins (`*`) on `/api/*` endpoints, allowing frontend applications to make cross-origin requests.

To restrict to specific origins in production, modify the CORS configuration in `app.py`:
```python
CORS(app, resources={
    r"/api/*": {
        "origins": ["https://yourdomain.com", "https://www.yourdomain.com"]
    }
})
```

## Development Tips

### Adding New Cities

1. Update the `CITIES` dictionary in `app.py`:
   ```python
   CITIES = {
       'CityName': {'lat': latitude, 'lon': longitude, 'country': 'Country'},
       ...
   }
   ```

2. No restart needed if using reload mode

### Testing the API

Using curl:
```bash
curl "http://localhost:5000/api/weather?city=Berlin"
curl "http://localhost:5000/api/cities"
curl "http://localhost:5000/api/health"
```

Using Python requests:
```python
import requests

response = requests.get('http://localhost:5000/api/weather?city=Berlin')
print(response.json())
```

### Debugging

Enable debug logging by setting `DEBUG=True` in `.env`:
```
FLASK_ENV=development
DEBUG=True
```

## Security Considerations

1. **API Keys**: Never commit `.env` to version control. Use `.env.example` as template.
2. **CORS**: Restrict origins in production to trusted domains.
3. **Rate Limiting**: Consider implementing rate limiting for production.
4. **Validation**: All user inputs are validated before processing.
5. **Error Messages**: Sensitive information is not exposed in error responses.

## Performance Optimization

For production deployment:

1. Use Gunicorn with multiple workers (4-8 for standard deployments)
2. Enable caching for frequently requested cities
3. Implement request timeout (currently 10 seconds)
4. Monitor API response times

## Deployment

### Docker (Optional)

Create a `Dockerfile`:
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:5000", "app:app"]
```

Build and run:
```bash
docker build -t weather-api .
docker run -p 5000:5000 -e METEOSTAT_API_KEY=your_key weather-api
```

## Troubleshooting

**Issue**: API returns 500 error constantly
- Check `.env` file has correct API key
- Verify internet connection
- Check API key is valid at [Google AI Studio](https://aistudio.google.com/app/apikey)

**Issue**: CORS errors in browser
- Verify Flask-CORS is installed
- Check CORS configuration in `app.py`
- Ensure correct origin in frontend

**Issue**: 400 error when valid city is provided
- Verify city name matches exactly (case-sensitive)
- Check available cities with `/api/cities` endpoint

## License

MIT License - Feel free to use this project for personal and commercial purposes.

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review API logs for error details
3. Verify API credentials on RapidAPI console
