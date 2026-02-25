# Developer Checklist

## Pre-Launch Checklist

### ✅ Setup & Installation
- [ ] Install Python 3.8+
- [ ] Clone/extract project to `backend/` directory
- [ ] Create virtual environment: `python -m venv venv`
- [ ] Activate virtual environment:
  - Windows: `venv\Scripts\activate`
  - Mac/Linux: `source venv/bin/activate`
- [ ] Install dependencies: `pip install -r requirements.txt`

### ✅ Configuration
- [ ] Sign up for [RapidAPI Meteostat](https://rapidapi.com/weatherapi/api/meteostat)
- [ ] Subscribe to Meteostat API (free tier)
- [ ] Copy API key from RapidAPI dashboard
- [ ] Copy `.env.example` to `.env`
- [ ] Add API key to `.env`: `METEOSTAT_API_KEY=your_key`
- [ ] Add API host to `.env`: `METEOSTAT_API_HOST=meteostat.p.rapidapi.com`

### ✅ Local Testing
- [ ] Run Flask app: `python app.py`
- [ ] Test health endpoint: `curl http://localhost:5000/api/health`
- [ ] Test weather endpoint: `curl http://localhost:5000/api/weather?city=Berlin`
- [ ] Test cities endpoint: `curl http://localhost:5000/api/cities`
- [ ] Test invalid city: `curl http://localhost:5000/api/weather?city=InvalidCity`
- [ ] Verify all endpoints return proper JSON

### ✅ Frontend Integration
- [ ] Update frontend to use API base URL: `http://localhost:5000`
- [ ] Update fetch calls to point to `/api/weather?city=CityName`
- [ ] Test CORS requests from frontend
- [ ] Verify weather data displays correctly
- [ ] Test error handling for invalid cities

### ✅ Code Quality
- [ ] Run tests: `pytest test_app.py`
- [ ] Check code style: `pylint app.py`
- [ ] Verify no hardcoded API keys
- [ ] Review error handling
- [ ] Verify logging is working

### ✅ Documentation
- [ ] Read README.md
- [ ] Review API_REFERENCE.md
- [ ] Check QUICKSTART.md for setup details
- [ ] Understand deployment options in DEPLOYMENT.md

## Development Workflow

### Starting Work Session
```bash
# Activate virtual environment
source venv/bin/activate  # Mac/Linux
# or
venv\Scripts\activate     # Windows

# Run the Flask app
python app.py
```

### Testing Changes
```bash
# Test API endpoints
curl "http://localhost:5000/api/weather?city=Berlin"

# Run unit tests
pytest test_app.py -v

# Check code quality
pylint app.py
```

### Adding Features
1. Edit code in `app.py` or `config.py`
2. Server auto-reloads (if DEBUG=true)
3. Run tests to verify changes
4. Update README if adding new endpoints

### Debugging Tips
- Enable DEBUG in `.env`: `DEBUG=True`
- Check logs in terminal output
- Use `print()` for quick debugging
- Check `.env` file exists and has correct credentials
- Verify port 5000 is not in use: `netstat -tulpn | grep 5000`

## Before Committing

```bash
# Make sure tests pass
pytest test_app.py

# Check for API key in code
grep -r "METEOSTAT_API_KEY" . --exclude-dir=.git --exclude=".env"

# Verify .env is in .gitignore (no commits of actual keys!)
cat .gitignore | grep ".env"

# Run linter
pylint app.py
```

## Deployment Checklist

### Pre-Deployment
- [ ] All tests passing
- [ ] No hardcoded API keys
- [ ] Error messages don't expose sensitive info
- [ ] Logging configured for production
- [ ] Database/cache (if used) configured
- [ ] Security headers configured
- [ ] CORS restricted to specific origins

### Docker Deployment
- [ ] Build image: `docker build -t weather-api .`
- [ ] Test image: `docker run -p 5000:5000 weather-api`
- [ ] Push to Docker Hub (if using)
- [ ] Update docker-compose.yml with correct tags

### Cloud Deployment
- [ ] Choose cloud provider (Heroku/AWS/DigitalOcean)
- [ ] Configure environment variables in cloud console
- [ ] Deploy application
- [ ] Test endpoints from cloud URL
- [ ] Set up monitoring and logging
- [ ] Configure custom domain (if applicable)

### Post-Deployment
- [ ] Test all endpoints from production URL
- [ ] Monitor error logs
- [ ] Check API usage (RapidAPI quota)
- [ ] Set up monitoring alerts
- [ ] Document deployment details
- [ ] Create runbook for common issues

## Common Commands

### Managing Virtual Environment
```bash
# Create virtual environment
python -m venv venv

# Activate (Windows)
venv\Scripts\activate

# Activate (Mac/Linux)
source venv/bin/activate

# Deactivate
deactivate

# List installed packages
pip list

# Update pip
pip install --upgrade pip
```

### Git Commands
```bash
# Initialize repository
git init

# Add to staging
git add .

# Commit changes
git commit -m "Your message"

# Push to remote
git push origin main

# Check .env is not committed
git ls-tree -r HEAD | grep .env  # Should return nothing
```

### Testing & Quality
```bash
# Run tests
pytest test_app.py

# Verbose output
pytest test_app.py -v

# Coverage report
pytest --cov=app test_app.py

# Lint code
pylint app.py

# Format code
black app.py
```

### Running Flask
```bash
# Development mode
python app.py

# Production with Gunicorn (4 workers)
gunicorn -w 4 -b 0.0.0.0:5000 app:app

# With worker restart on code change
gunicorn -w 4 -b 0.0.0.0:5000 --reload app:app
```

## Troubleshooting

### Flask App Won't Start
```bash
# Check port is available
netstat -tulpn | grep 5000

# Kill process on port 5000
lsof -ti:5000 | xargs kill -9  # Mac/Linux
taskkill /PID <PID> /F          # Windows
```

### API Returns 500 Error
1. Check Flask terminal for error message
2. Verify `.env` file exists and has API credentials
3. Verify internet connection
4. Test RapidAPI manually at https://rapidapi.com

### Tests Failing
```bash
# Clear Python cache
find . -type d -name __pycache__ -exec rm -f {} +

# Reinstall dependencies
pip install -r requirements.txt --force-reinstall

# Run tests with verbose output
pytest test_app.py -v -s
```

### CORS Errors in Browser
1. Verify Flask app is running
2. Check frontend is using correct base URL
3. Enable CORS in app.py (default: enabled)
4. Check browser console for actual error

## Resources

### Official Documentation
- [Flask Documentation](https://flask.palletsprojects.com/)
- [Flask-CORS](https://flask-cors.readthedocs.io/)
- [Requests Library](https://docs.python-requests.org/)
- [Meteostat API](https://rapidapi.com/weatherapi/api/meteostat)

### Learning Resources
- [Flask Tutorial](https://flask.palletsprojects.com/tutorial/)
- [REST API Best Practices](https://restfulapi.net/)
- [Python Best Practices](https://pep8.org/)

### Tools
- [Postman](https://www.postman.com/) - API testing
- [VS Code](https://code.visualstudio.com/) - Code editor
- [Git](https://git-scm.com/) - Version control
- [Docker](https://www.docker.com/) - Containerization

## Support Contacts

- **API Issues**: Check RapidAPI docs and dashboard
- **Flask Issues**: See [Flask Documentation](https://flask.palletsprojects.com/)
- **Deployment Help**: Refer to DEPLOYMENT.md
- **Code Issues**: Review README.md and code comments

## Progress Tracker

### Week 1
- [ ] Setup and project initialization
- [ ] Install dependencies
- [ ] Configure API credentials
- [ ] Test locally

### Week 2
- [ ] Verify all endpoints working
- [ ] Integrate with frontend (if applicable)
- [ ] Complete local testing
- [ ] Code review

### Week 3
- [ ] Prepare for deployment
- [ ] Choose cloud provider
- [ ] Configure environment
- [ ] Deploy to production

### Post-Launch
- [ ] Monitor API usage
- [ ] Handle support requests
- [ ] Plan for scaling
- [ ] Regular updates

---

**Need Help?**
1. Check the README.md
2. Review QUICKSTART.md
3. See DEPLOYMENT.md for deployment help
4. Review API_REFERENCE.md for endpoint details
5. Check code comments in app.py
