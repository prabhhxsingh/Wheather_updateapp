# Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Step 1: Get Your API Key
1. Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Click **Create API Key** in the top-left corner
3. You'll get a free Gemini API key instantly (no credit card needed)
4. Copy your **API Key**

### Step 2: Configure Environment
```bash
# Inside the backend folder
cp .env.example .env
```

Edit `.env` and add your credentials:
```
GEMINI_API_KEY=your_actual_key_here
FLASK_ENV=production
DEBUG=False
```

### Step 3: Install & Run
```bash
# Install dependencies
pip install -r requirements.txt

# Run the server
python app.py
```

Server will start at: `http://localhost:5000`

### Step 4: Test It
Open in your browser:
```
http://localhost:5000/api/weather?city=Berlin
```

## 📋 Available Cities
- Berlin
- Delhi
- Mumbai
- New York
- Paris
- Tokyo

## 📌 Quick API Tests

```bash
# Get weather for Berlin
curl "http://localhost:5000/api/weather?city=Berlin"

# List all available cities
curl "http://localhost:5000/api/cities"

# Health check
curl "http://localhost:5000/api/health"
```

## Integration with Frontend

Update your frontend to use the API:

```javascript
// Instead of direct API calls, use your backend
const response = await fetch('http://localhost:5000/api/weather?city=Berlin');
const data = await response.json();
console.log(data.monthly_data);
```

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `ModuleNotFoundError: No module named 'google'` | Run `pip install -r requirements.txt` |
| `403 Forbidden from Gemini` | Check your API key in `.env` |
| `Connection refused` | Make sure Flask app is running |
| `CORS errors` | CORS is enabled by default for all origins |

## Next Steps

1. ✅ Customize supported cities in `app.py`
2. ✅ Add caching for performance
3. ✅ Deploy to production (Heroku, AWS, DigitalOcean)
4. ✅ Add rate limiting
5. ✅ Implement authentication if needed

For complete documentation, see `README.md`
