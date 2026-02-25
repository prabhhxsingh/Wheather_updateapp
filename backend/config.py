"""
Configuration module for the Weather Analytics Dashboard API
"""

import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()


class DevelopmentConfig:
    """Development configuration"""
    DEBUG = True
    TESTING = False
    FLASK_ENV = 'development'
    GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')


class ProductionConfig:
    """Production configuration"""
    DEBUG = False
    TESTING = False
    FLASK_ENV = 'production'
    GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')


class TestingConfig:
    """Testing configuration"""
    DEBUG = True
    TESTING = True
    FLASK_ENV = 'testing'
    GEMINI_API_KEY = 'test_api_key'


# Select configuration based on environment
config_name = os.getenv('FLASK_ENV', 'production')
if config_name == 'development':
    config = DevelopmentConfig
elif config_name == 'testing':
    config = TestingConfig
else:
    config = ProductionConfig
