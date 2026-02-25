/**
 * Weather Analytics Dashboard - Main Script
 * Handles API integration, UI interactions, and data visualization
 * @version 2.0 - Enhanced with better modularity and error handling
 */

// ==========================================
// Configuration & Constants
// ==========================================

const CONFIG = {
  API_BASE_URL: 'http://localhost:5000/api',
  THEME_STORAGE_KEY: 'weather-dashboard-theme',
  CITY_CACHE_KEY: 'last-searched-city',
  
  // Chart Colors
  CHART_BG_LIGHT: 'rgba(0, 119, 182, 0.1)',
  CHART_BG_DARK: 'rgba(0, 180, 216, 0.1)',
  CHART_BORDER_LIGHT: 'rgb(0, 119, 182)',
  CHART_BORDER_DARK: 'rgb(0, 180, 216)',
  
  // Alert Thresholds
  TEMP_HEAT_THRESHOLD: 30,
  TEMP_COLD_THRESHOLD: 0,
  PRECIP_RAIN_THRESHOLD: 40,
  
  // Animation Settings
  CHART_ANIMATION_DURATION: 800,
  TRANSITION_DURATION: 300,
};

// ==========================================
// Logger Module - Enhanced Error Handling
// ==========================================

const Logger = {
  log: (message, data = null) => {
    console.log(`[WeatherDash] ${message}`, data || '');
  },
  
  warn: (message, data = null) => {
    console.warn(`[WeatherDash WARN] ${message}`, data || '');
  },
  
  error: (message, error = null) => {
    console.error(`[WeatherDash ERROR] ${message}`, error || '');
  }
};

// ==========================================
// State Management Module
// ==========================================

const state = {
  currentCity: null,
  weatherData: null,
  isLoading: false,
  
  charts: {
    temperature: null,
    rainfall: null,
  },
  
  // Store for calculated metrics
  metrics: {
    avgTemp: null,
    maxTemp: null,
    minTemp: null,
    totalPrecip: null,
    avgWind: null,
    avgHumidity: null,
  }
};

// State update helper with logging
const updateState = (key, value) => {
  state[key] = value;
  Logger.log(`State updated: ${key}`, value);
};

// DOM Elements
const elements = {
  themeToggle: document.getElementById('theme-toggle'),
  cityInput: document.getElementById('city-input'),
  searchBtn: document.getElementById('search-btn'),
  clearBtn: document.getElementById('clear-btn'),
  suggestionBtns: document.querySelectorAll('.suggestion-btn'),
  loadingContainer: document.getElementById('loading'),
  errorSection: document.getElementById('error-section'),
  errorMessage: document.getElementById('error-message'),
  errorCloseBtn: document.getElementById('error-close-btn'),
  cityInfoSection: document.getElementById('city-info-section'),
  cityName: document.getElementById('city-name'),
  cityLocation: document.getElementById('city-location'),
  dataTimestamp: document.getElementById('data-timestamp'),
  weatherCardsSection: document.getElementById('weather-cards-section'),
  weatherCardsContainer: document.getElementById('weather-cards'),
  analyticsSection: document.getElementById('analytics-section'),
  chartsSection: document.getElementById('charts-section'),
  noDataSection: document.getElementById('no-data-section'),
  alertsSection: document.getElementById('alerts-section'),
  alertsContainer: document.getElementById('alerts-container'),
  tempChart: document.getElementById('temperature-chart'),
  rainfallChart: document.getElementById('rainfall-chart'),
  avgTemp: document.getElementById('avg-temp'),
  maxTemp: document.getElementById('max-temp'),
  minTemp: document.getElementById('min-temp'),
  totalPrecip: document.getElementById('total-precip'),
  avgWind: document.getElementById('avg-wind'),
  avgHumidity: document.getElementById('avg-humidity'),
};

// ==========================================
// Initialize Application
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
  initializeTheme();
  attachEventListeners();
  showNoDataState();
});

// ==========================================
// Theme Management
// ==========================================

function initializeTheme() {
  const savedTheme = localStorage.getItem(CONFIG.THEME_STORAGE_KEY);
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
    document.body.classList.add('dark-mode');
    updateThemeIcon('☀️');
  } else {
    updateThemeIcon('🌙');
  }
}

function toggleTheme() {
  document.body.classList.toggle('dark-mode');
  const isDarkMode = document.body.classList.contains('dark-mode');
  localStorage.setItem(CONFIG.THEME_STORAGE_KEY, isDarkMode ? 'dark' : 'light');
  updateThemeIcon(isDarkMode ? '☀️' : '🌙');
  
  // Recreate charts with new theme colors
  if (state.weatherData && state.weatherData.monthly_data) {
    createCharts(state.weatherData.monthly_data);
  }
}

function updateThemeIcon(icon) {
  elements.themeToggle.querySelector('.theme-icon').textContent = icon;
}

// ==========================================
// Event Listeners
// ==========================================

function attachEventListeners() {
  elements.themeToggle.addEventListener('click', toggleTheme);
  
  elements.searchBtn.addEventListener('click', handleSearch);
  elements.cityInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSearch();
  });
  
  elements.clearBtn.addEventListener('click', handleClear);
  
  elements.suggestionBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      elements.cityInput.value = btn.dataset.city;
      handleSearch();
    });
  });
  
  elements.errorCloseBtn.addEventListener('click', hideError);
}

// ==========================================
// Search Functionality
// ==========================================

function handleSearch() {
  const city = elements.cityInput.value.trim();
  
  if (!city) {
    showError('Please enter a city name');
    return;
  }
  
  if (city.length < 2) {
    showError('City name must be at least 2 characters');
    return;
  }
  
  performSearch(city);
}

async function performSearch(city) {
  const result = await API.fetchWeatherData(city);
  
  if (result.success) {
    // Save last searched city
    localStorage.setItem(CONFIG.CITY_CACHE_KEY, city);
    displayWeatherData(result.data);
  } else {
    showError(result.error);
    hideDataSections();
  }
}

function handleClear() {
  elements.cityInput.value = '';
  state.currentCity = null;
  state.weatherData = null;
  hideError();
  clearCharts();
  showNoDataState();
  elements.cityInput.focus();
}

// ==========================================
// API Calls
// ==========================================

// ==========================================
// API Module - Enhanced Error Handling
// ==========================================

const API = {
  async fetchWeatherData(city) {
    try {
      Logger.log(`Fetching weather data for: ${city}`);
      updateState('isLoading', true);
      showLoading(true);
      hideError();
      
      // Show timeout warning after 5 seconds
      const timeoutWarning = setTimeout(() => {
        const loadingText = document.querySelector('.loading-text');
        if (loadingText) {
          loadingText.innerHTML = '⏳ Fetching weather data from Gemini AI...<br><small>This may take up to 10 seconds. Please wait...</small>';
        }
      }, 5000);
      
      const url = `${CONFIG.API_BASE_URL}/weather?city=${encodeURIComponent(city)}`;
      const response = await fetch(url);
      clearTimeout(timeoutWarning);
      
      // Validate response
      if (!response.ok) {
        return this.handleErrorResponse(response);
      }
      
      const data = await response.json();
      
      // Validate data structure
      if (!this.validateData(data)) {
        throw new Error('Invalid data format received from API');
      }
      
      Logger.log(`Successfully fetched data for: ${data.city}`);
      updateState('currentCity', data.city);
      updateState('weatherData', data);
      
      return { success: true, data };
      
    } catch (error) {
      Logger.error('Failed to fetch weather data', error);
      return { success: false, error: error.message };
    } finally {
      updateState('isLoading', false);
      showLoading(false);
    }
  },
  
  async handleErrorResponse(response) {
    try {
      const errorData = await response.json();
      let message = errorData.error || 'Unknown error occurred';
      
      if (response.status === 400) {
        const cities = errorData.available_cities?.join(', ') || 'N/A';
        message = `${message}\n\nAvailable cities: ${cities}`;
      } else if (response.status === 500) {
        message = 'Server error: Unable to fetch weather data. Please try again later.';
      } else if (response.status === 404) {
        message = 'API endpoint not found. Check backend configuration.';
      } else if (response.status === 503) {
        message = 'Service temporarily unavailable. Please try again in a moment.';
      }
      
      Logger.warn(`API Error (${response.status}): ${message}`);
      throw new Error(message);
      
    } catch (error) {
      Logger.error('Error parsing error response', error);
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  },
  
  validateData(data) {
    if (!data || typeof data !== 'object') return false;
    if (!data.success) return false;
    if (!data.city || !data.location) return false;
    if (!Array.isArray(data.monthly_data)) return false;
    return true;
  }
};

// ==========================================
// Display Weather Data
// ==========================================

function displayWeatherData(data) {
  // Update city info
  elements.cityName.textContent = data.city;
  elements.cityLocation.textContent = `${data.location.country} • ${data.location.latitude.toFixed(2)}°, ${data.location.longitude.toFixed(2)}°`;
  
  const timestamp = new Date(data.timestamp);
  elements.dataTimestamp.textContent = `Updated: ${timestamp.toLocaleString()}`;
  
  // Show city info
  elements.cityInfoSection.hidden = false;
  
  // Display weather alerts
  displayWeatherAlerts(data.monthly_data);
  
  // Display weather cards
  displayWeatherCards(data.monthly_data);
  
  // Display analytics
  displayAnalytics(data.monthly_data);
  
  // Create charts
  createCharts(data.monthly_data);
  
  // Update dynamic background
  updateDynamicBackground(data.monthly_data);
  
  // Show sections
  elements.weatherCardsSection.hidden = false;
  elements.analyticsSection.hidden = false;
  elements.chartsSection.hidden = false;
  elements.noDataSection.hidden = true;
}

function displayWeatherCards(monthlyData) {
  if (!monthlyData || monthlyData.length === 0) {
    elements.weatherCardsContainer.innerHTML =
      '<p style="grid-column: 1/-1; text-align: center; color: var(--text-light);">No weather data available</p>';
    return;
  }
  
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  elements.weatherCardsContainer.innerHTML = monthlyData
    .map((month, index) => createWeatherCard(month, monthNames[index]))
    .join('');
}

function createWeatherCard(monthData, monthName) {
  const temp = monthData.temperature?.avg;
  const tempMin = monthData.temperature?.min;
  const tempMax = monthData.temperature?.max;
  const precip = monthData.precipitation;
  const wind = monthData.wind_speed;
  const humidity = monthData.humidity;
  
  // Select weather icon based on temperature
  const icon = getWeatherIcon(temp, precip);
  
  // Format values
  const tempStr = temp !== null ? `${temp.toFixed(1)}°C` : 'N/A';
  const precipStr = precip !== null ? `${precip.toFixed(1)} mm` : 'N/A';
  const windStr = wind !== null ? `${wind.toFixed(1)} km/h` : 'N/A';
  const humidityStr = humidity !== null ? `${humidity.toFixed(0)}%` : 'N/A';
  
  return `
    <div class="weather-card">
      <div class="weather-month">${monthName}</div>
      <div class="weather-icon">${icon}</div>
      <div class="weather-temp">${tempStr}</div>
      <div class="weather-detail">
        <span class="detail-label">Min:</span>
        <span class="detail-value">${tempMin !== null ? tempMin.toFixed(1) : 'N/A'}°C</span>
      </div>
      <div class="weather-detail">
        <span class="detail-label">Max:</span>
        <span class="detail-value">${tempMax !== null ? tempMax.toFixed(1) : 'N/A'}°C</span>
      </div>
      <div class="weather-detail">
        <span class="detail-label">Precipitation:</span>
        <span class="detail-value">${precipStr}</span>
      </div>
      <div class="weather-detail">
        <span class="detail-label">Wind:</span>
        <span class="detail-value">${windStr}</span>
      </div>
      <div class="weather-detail">
        <span class="detail-label">Humidity:</span>
        <span class="detail-value">${humidityStr}</span>
      </div>
    </div>
  `;
}

function getWeatherIcon(temperature, precipitation) {
  if (precipitation && precipitation > 50) return '🌧️';
  if (precipitation && precipitation > 20) return '🌦️';
  if (temperature === null) return '🤷';
  if (temperature > 25) return '☀️';
  if (temperature > 15) return '🌤️';
  if (temperature > 5) return '⛅';
  return '❄️';
}

// ==========================================
// Weather Alerts Module
// ==========================================

function displayWeatherAlerts(monthlyData) {
  if (!monthlyData || monthlyData.length === 0) {
    elements.alertsSection.hidden = true;
    return;
  }
  
  try {
    const alerts = [];
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                       'July', 'August', 'September', 'October', 'November', 'December'];
    
    monthlyData.forEach((month, index) => {
      const temp = month.temperature?.avg;
      const precip = month.precipitation;
      const monthName = monthNames[index];
      
      // Heat Alert
      if (temp && temp > CONFIG.TEMP_HEAT_THRESHOLD) {
        alerts.push({
          type: 'heat-alert',
          icon: '🔥',
          title: 'Heat Alert',
          content: `High temperature of ${temp.toFixed(1)}°C in ${monthName}. Stay hydrated and protect yourself from heat!`,
          severity: temp > 35 ? 'critical' : 'warning'
        });
      }
      
      // Cold Alert
      if (temp && temp < CONFIG.TEMP_COLD_THRESHOLD) {
        alerts.push({
          type: 'cold-alert',
          icon: '❄️',
          title: 'Cold Alert',
          content: `Freezing temperature of ${temp.toFixed(1)}°C in ${monthName}. Dress warmly and limit outdoor exposure!`,
          severity: temp < -10 ? 'critical' : 'warning'
        });
      }
      
      // Rain Alert
      if (precip && precip > CONFIG.PRECIP_RAIN_THRESHOLD) {
        alerts.push({
          type: 'rain-alert',
          icon: '💧',
          title: 'Heavy Rain Alert',
          content: `High rainfall of ${precip.toFixed(1)}mm expected in ${monthName}. Plan indoor activities!`,
          severity: precip > 80 ? 'critical' : 'warning'
        });
      }
    });
    
    if (alerts.length === 0) {
      elements.alertsSection.hidden = true;
      Logger.log('No weather alerts detected');
      return;
    }
    
    // Display alerts
    elements.alertsContainer.innerHTML = alerts
      .map(alert => `
        <div class="alert-box ${alert.type}" data-severity="${alert.severity}">
          <div class="alert-icon">${alert.icon}</div>
          <div class="alert-message">
            <h3 class="alert-title">${alert.title}</h3>
            <p class="alert-content">${alert.content}</p>
          </div>
        </div>
      `)
      .join('');
    
    elements.alertsSection.hidden = false;
    Logger.log(`Displayed ${alerts.length} alerts`);
    
  } catch (error) {
    Logger.error('Error generating alerts', error);
  }
}

// ==========================================
// Dynamic Background Update
// ==========================================

function updateDynamicBackground(monthlyData) {
  if (!monthlyData || monthlyData.length === 0) return;
  
  // Calculate average values
  const temps = monthlyData
    .map(m => m.temperature?.avg)
    .filter(t => t !== null && t !== undefined);
  
  const precips = monthlyData
    .map(m => m.precipitation)
    .filter(p => p !== null && p !== undefined);
  
  const avgTemp = temps.length > 0 ? temps.reduce((a, b) => a + b) / temps.length : 15;
  const totalPrecip = precips.reduce((a, b) => a + b, 0);
  const avgPrecip = totalPrecip / 12;
  
  // Remove previous weather class
  document.body.classList.remove('weather-sunny', 'weather-rainy', 'weather-cold', 'weather-cloudy');
  
  // Apply new weather class based on conditions
  if (avgTemp > 25 && avgPrecip < 30) {
    document.body.classList.add('weather-sunny');
  } else if (avgPrecip > 40) {
    document.body.classList.add('weather-rainy');
  } else if (avgTemp < 5) {
    document.body.classList.add('weather-cold');
  } else {
    document.body.classList.add('weather-cloudy');
  }
}

// ==========================================
// Analytics
// ==========================================

function displayAnalytics(monthlyData) {
  if (!monthlyData || monthlyData.length === 0) {
    Logger.warn('No monthly data available for analytics');
    resetAnalytics();
    return;
  }
  
  try {
    // Extract valid temperatures
    const temps = monthlyData
      .map((m) => m.temperature?.avg)
      .filter((t) => t !== null && t !== undefined);
    
    const tempMins = monthlyData
      .map((m) => m.temperature?.min)
      .filter((t) => t !== null && t !== undefined);
    
    const tempMaxs = monthlyData
      .map((m) => m.temperature?.max)
      .filter((t) => t !== null && t !== undefined);
    
    const precips = monthlyData
      .map((m) => m.precipitation)
      .filter((p) => p !== null && p !== undefined);
    
    const winds = monthlyData
      .map((m) => m.wind_speed)
      .filter((w) => w !== null && w !== undefined);
    
    const humidities = monthlyData
      .map((m) => m.humidity)
      .filter((h) => h !== null && h !== undefined);
    
    // Calculate metrics with proper error handling
    const avgTemp = temps.length > 0 ? temps.reduce((a, b) => a + b, 0) / temps.length : null;
    const maxTemp = temps.length > 0 ? Math.max(...temps) : null;
    const minTemp = tempMins.length > 0 ? Math.min(...tempMins) : null;
    const totalPrecip = precips.length > 0 ? precips.reduce((a, b) => a + b, 0) : 0;
    const avgWind = winds.length > 0 ? winds.reduce((a, b) => a + b, 0) / winds.length : null;
    const avgHumidity = humidities.length > 0 ? humidities.reduce((a, b) => a + b, 0) / humidities.length : null;
    
    // Store metrics in state
    state.metrics = { avgTemp, maxTemp, minTemp, totalPrecip, avgWind, avgHumidity };
    
    // Update UI with formatted values
    elements.avgTemp.textContent = formatNumber(avgTemp, '°C');
    elements.maxTemp.textContent = formatNumber(maxTemp, '°C');
    elements.minTemp.textContent = formatNumber(minTemp, '°C');
    elements.totalPrecip.textContent = formatNumber(totalPrecip, 'mm');
    elements.avgWind.textContent = formatNumber(avgWind, 'km/h');
    elements.avgHumidity.textContent = formatNumber(avgHumidity, '%', 0);
    
    Logger.log('Analytics calculated', state.metrics);
    
  } catch (error) {
    Logger.error('Error calculating analytics', error);
    resetAnalytics();
  }
}

function formatNumber(value, unit = '', decimals = 1) {
  if (value === null || value === undefined) return '-';
  return decimals === 0 ? `${Math.round(value)}${unit}` : `${value.toFixed(decimals)}${unit}`;
}

function resetAnalytics() {
  elements.avgTemp.textContent = '-';
  elements.maxTemp.textContent = '-';
  elements.minTemp.textContent = '-';
  elements.totalPrecip.textContent = '-';
  elements.avgWind.textContent = '-';
  elements.avgHumidity.textContent = '-';
}

// ==========================================
// Charts
// ==========================================

function createCharts(monthlyData) {
  clearCharts();
  
  if (!monthlyData || monthlyData.length === 0) return;
  
  const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const temps = monthlyData.map((m) => m.temperature?.avg || null);
  const precips = monthlyData.map((m) => m.precipitation || 0);
  
  createTemperatureChart(monthLabels, temps);
  createRainfallChart(monthLabels, precips);
}

function createTemperatureChart(labels, data) {
  const isDark = document.body.classList.contains('dark-mode');
  const ctx = elements.tempChart.getContext('2d');
  
  // Validate data
  if (!ctx) {
    Logger.error('Temperature chart context unavailable');
    return;
  }
  
  state.charts.temperature = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Average Temperature (°C)',
          data,
          borderColor: isDark ? CONFIG.CHART_BORDER_DARK : CONFIG.CHART_BORDER_LIGHT,
          backgroundColor: isDark ? CONFIG.CHART_BG_DARK : CONFIG.CHART_BG_LIGHT,
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointRadius: 6,
          pointBackgroundColor: isDark ? CONFIG.CHART_BORDER_DARK : CONFIG.CHART_BORDER_LIGHT,
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointHoverRadius: 8,
          borderCapStyle: 'round',
          borderJoinStyle: 'round',
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: CONFIG.CHART_ANIMATION_DURATION,
        easing: 'easeInOutQuart',
      },
      interaction: {
        mode: 'index',
        intersect: false,
      },
      plugins: {
        legend: {
          display: true,
          labels: {
            color: isDark ? '#d0d5dd' : '#4a4a4a',
            font: { size: 13, weight: '600' },
            padding: 15,
            usePointStyle: true,
            pointStyle: 'circle',
          },
        },
        tooltip: {
          enabled: true,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          titleColor: '#fff',
          bodyColor: '#fff',
          borderColor: isDark ? CONFIG.CHART_BORDER_DARK : CONFIG.CHART_BORDER_LIGHT,
          borderWidth: 2,
          padding: 12,
          displayColors: true,
          boxPadding: 8,
          cornerRadius: 6,
          titleFont: { weight: '600', size: 13 },
          bodyFont: { size: 12 },
          callbacks: {
            label: (context) => {
              let label = context.dataset.label || '';
              if (label) label += ': ';
              if (context.parsed.y !== null) {
                label += context.parsed.y.toFixed(1) + '°C';
              }
              return label;
            }
          }
        },
      },
      scales: {
        y: {
          grid: { 
            color: isDark ? 'rgba(64, 72, 84, 0.5)' : 'rgba(224, 224, 224, 0.5)',
            drawBorder: true,
            lineWidth: 1,
          },
          ticks: { 
            color: isDark ? '#a0afc0' : '#7a7a7a',
            font: { size: 11 },
            padding: 8,
          },
          title: { 
            display: true, 
            text: 'Temperature (°C)', 
            color: isDark ? '#d0d5dd' : '#4a4a4a',
            font: { weight: '600', size: 12 },
          },
        },
        x: {
          grid: { 
            color: isDark ? 'rgba(64, 72, 84, 0.5)' : 'rgba(224, 224, 224, 0.5)',
            drawBorder: true,
            lineWidth: 1,
          },
          ticks: { 
            color: isDark ? '#a0afc0' : '#7a7a7a',
            font: { size: 11 },
            padding: 8,
          },
        },
      },
    },
  });
  
  Logger.log('Temperature chart created successfully');
}

function createRainfallChart(labels, data) {
  const isDark = document.body.classList.contains('dark-mode');
  const ctx = elements.rainfallChart.getContext('2d');
  
  // Validate data
  if (!ctx) {
    Logger.error('Rainfall chart context unavailable');
    return;
  }
  
  state.charts.rainfall = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Monthly Rainfall (mm)',
          data,
          backgroundColor: (context) => {
            const value = context.parsed.y;
            if (value > CONFIG.PRECIP_RAIN_THRESHOLD) {
              return isDark ? '#0096c7' : '#0077b6';
            }
            return isDark ? CONFIG.CHART_BORDER_DARK : CONFIG.CHART_BORDER_LIGHT;
          },
          borderColor: isDark ? CONFIG.CHART_BORDER_DARK : CONFIG.CHART_BORDER_LIGHT,
          borderRadius: { topLeft: 6, topRight: 6 },
          borderSkipped: false,
          borderWidth: 1,
          hoverBackgroundColor: isDark ? '#90e0ef' : '#00b4d8',
          hoverBorderWidth: 2,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: CONFIG.CHART_ANIMATION_DURATION,
        easing: 'easeInOutQuart',
        delay: (context) => {
          let delay = 0;
          if (context.type === 'data' && context.mode === 'default') {
            delay = context.dataIndex * 50;
          }
          return delay;
        }
      },
      interaction: {
        mode: 'index',
        intersect: false,
      },
      plugins: {
        legend: {
          display: true,
          labels: {
            color: isDark ? '#d0d5dd' : '#4a4a4a',
            font: { size: 13, weight: '600' },
            padding: 15,
            usePointStyle: true,
            pointStyle: 'rect',
          },
        },
        tooltip: {
          enabled: true,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          titleColor: '#fff',
          bodyColor: '#fff',
          borderColor: isDark ? CONFIG.CHART_BORDER_DARK : CONFIG.CHART_BORDER_LIGHT,
          borderWidth: 2,
          padding: 12,
          displayColors: true,
          boxPadding: 8,
          cornerRadius: 6,
          titleFont: { weight: '600', size: 13 },
          bodyFont: { size: 12 },
          callbacks: {
            label: (context) => {
              let label = context.dataset.label || '';
              if (label) label += ': ';
              if (context.parsed.y !== null) {
                label += context.parsed.y.toFixed(1) + ' mm';
              }
              return label;
            }
          }
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: { 
            color: isDark ? 'rgba(64, 72, 84, 0.5)' : 'rgba(224, 224, 224, 0.5)',
            drawBorder: true,
            lineWidth: 1,
          },
          ticks: { 
            color: isDark ? '#a0afc0' : '#7a7a7a',
            font: { size: 11 },
            padding: 8,
          },
          title: { 
            display: true, 
            text: 'Rainfall (mm)', 
            color: isDark ? '#d0d5dd' : '#4a4a4a',
            font: { weight: '600', size: 12 },
          },
        },
        x: {
          grid: { 
            color: isDark ? 'rgba(64, 72, 84, 0.5)' : 'rgba(224, 224, 224, 0.5)',
            drawBorder: true,
            lineWidth: 1,
          },
          ticks: { 
            color: isDark ? '#a0afc0' : '#7a7a7a',
            font: { size: 11 },
            padding: 8,
          },
        },
      },
    },
  });
  
  Logger.log('Rainfall chart created successfully');
}

function clearCharts() {
  if (state.charts.temperature) {
    state.charts.temperature.destroy();
    state.charts.temperature = null;
  }
  if (state.charts.rainfall) {
    state.charts.rainfall.destroy();
    state.charts.rainfall = null;
  }
}

// ==========================================
// UI State Management
// ==========================================

function showLoading(isLoading) {
  elements.loadingContainer.hidden = !isLoading;
}

function showError(message) {
  elements.errorMessage.textContent = message;
  elements.errorSection.hidden = false;
}

function hideError() {
  elements.errorSection.hidden = true;
}

function showNoDataState() {
  elements.noDataSection.hidden = false;
}

function hideDataSections() {
  elements.cityInfoSection.hidden = true;
  elements.weatherCardsSection.hidden = true;
  elements.analyticsSection.hidden = true;
  elements.chartsSection.hidden = true;
  elements.alertsSection.hidden = true;
  
  // Remove dynamic background classes
  document.body.classList.remove('weather-sunny', 'weather-rainy', 'weather-cold', 'weather-cloudy');
}

// ==========================================
// Utility Functions
// ==========================================

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}
