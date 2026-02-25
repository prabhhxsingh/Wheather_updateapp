# Production Deployment Guide

## Overview

This guide covers deploying the Weather Analytics Dashboard API to production environments.

## Local Production Testing

Test locally before deploying:

```bash
# Install Gunicorn if not already installed
pip install gunicorn

# Run with Gunicorn (production WSGI server)
gunicorn -w 4 -b 0.0.0.0:5000 --timeout 30 app:app
```

Gunicorn settings explained:
- `-w 4`: 4 worker processes (adjust based on CPU cores: 2×cores + 1)
- `-b 0.0.0.0:5000`: Bind to all interfaces on port 5000
- `--timeout 30`: 30-second request timeout

## Docker Deployment

### Build Image
```bash
docker build -t weather-api:latest .
```

### Run Container
```bash
docker run -p 5000:5000 \
  -e METEOSTAT_API_KEY=your_key \
  -e METEOSTAT_API_HOST=meteostat.p.rapidapi.com \
  weather-api:latest
```

### Docker Compose
```bash
# Create .env file with your API credentials
cp .env.example .env
# Edit .env with your actual credentials

# Start services
docker-compose up -d

# View logs
docker-compose logs -f weather-api

# Stop services
docker-compose down
```

## Cloud Deployment

### Heroku

```bash
# Install Heroku CLI
# Login to Heroku
heroku login

# Create app
heroku create weather-analytics-api

# Set environment variables
heroku config:set GEMINI_API_KEY=your_key

# Deploy
git push heroku main

# View logs
heroku logs --tail
```

### AWS (Elastic Beanstalk)

```bash
# Install EB CLI
pip install awsebcli

# Initialize
eb init -p python-3.11 weather-api

# Create environment
eb create weather-api-env

# Set environment variables
eb setenv GEMINI_API_KEY=your_key

# Deploy
eb deploy

# Monitor
eb logs
```

### DigitalOcean App Platform

1. Push code to GitHub
2. Connect GitHub repo in DigitalOcean App Platform
3. Set environment variables in DigitalOcean console
4. Deploy

## Environment Configuration

### Production Variables

```env
GEMINI_API_KEY=your_actual_gemini_api_key
FLASK_ENV=production
DEBUG=False
```

### Recommended Additions

```env
# API Rate Limiting (if implemented)
API_RATE_LIMIT=100
API_RATE_WINDOW=3600

# Logging
LOG_LEVEL=INFO
LOG_FILE=/var/log/weather-api/app.log

# Security
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

## Security Checklist

- [ ] API key stored in environment variables (never in code)
- [ ] CORS configured for specific domains only
- [ ] Rate limiting implemented
- [ ] HTTPS enabled (redirect HTTP to HTTPS)
- [ ] Security headers configured
- [ ] Input validation enabled
- [ ] Error messages don't expose sensitive info
- [ ] Database credentials (if any) in environment variables
- [ ] Logs rotated to prevent disk overflow
- [ ] Dependencies regularly updated

## Monitoring & Logging

### Application Logs

```bash
# View real-time logs
tail -f /var/log/weather-api/app.log

# Search for errors
grep 'ERROR' /var/log/weather-api/app.log

# Check API health
curl https://yourdomain.com/api/health
```

### Performance Monitoring

Monitor these metrics:
- Response time (should be < 2 seconds)
- Error rate (should be < 1%)
- API quota usage (Meteostat RapidAPI)
- Server CPU and memory usage

### Recommended Tools

- **Monitoring**: Datadog, New Relic, CloudWatch
- **Logging**: ELK Stack, Splunk, CloudWatch Logs
- **Analytics**: Mixpanel, Amplitude
- **Alerting**: PagerDuty, OpsGenie

## Scaling Considerations

### Horizontal Scaling

```bash
# With load balancer (e.g., Nginx)
# Run multiple instances and distribute requests
```

### Caching

Implement Redis caching for frequently requested cities:

```python
# Example: Cache weather data for 1 hour
from flask_caching import Cache

cache = Cache(app, config={'CACHE_TYPE': 'redis'})

@app.route('/api/weather')
@cache.cached(timeout=3600, query_string=True)
def get_weather():
    # ... implementation
```

### Database

If adding persistent storage:
- PostgreSQL for structured data
- Redis for caching
- MongoDB for flexible schema

## Maintenance

### Regular Updates

```bash
# Update dependencies
pip list --outdated
pip install --upgrade package_name

# Security scan
pip audit

# Code quality
pylint app.py
```

### Backup Strategy

- Back up `.env` files (securely, encrypted)
- Version control all code
- Document configuration changes

### Deployment Checklist

- [ ] All tests passing
- [ ] Code reviewed
- [ ] Dependencies updated
- [ ] Security vulnerabilities checked
- [ ] Environment variables configured
- [ ] Database migrations run (if applicable)
- [ ] Logs configured
- [ ] Monitoring enabled
- [ ] Health checks passing
- [ ] Rollback plan documented

## Troubleshooting

### High Response Times

```bash
# Check API usage
# Verify Meteostat RapidAPI quota
# Add caching for frequent requests
```

### Memory Issues

```bash
# Limit Gunicorn workers
gunicorn -w 2 --max-requests 1000 app:app

# Monitor memory usage
ps aux | grep gunicorn
```

### API Key Expired/Invalid

```bash
# Update environment variable
export METEOSTAT_API_KEY=new_key
# Restart application
```

## Support

For deployment issues:
1. Check application logs
2. Verify environment variables
3. Test API endpoints manually
4. Check Meteostat RapidAPI status
5. Review security settings
