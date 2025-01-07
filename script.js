const API_KEY = '5273853b27msh9182b52024019f5p18d0cbjsn4f6193ccaafd';
const BASE_URL = 'https://meteostat.p.rapidapi.com/point/monthly';

async function getWeather(city) {
  const cityCoordinates = {
    Berlin: { lat: 52.5244, lon: 13.4105 },
    Delhi: { lat: 28.7041, lon: 77.1025 },
    Mumbai: { lat: 19.076, lon: 72.8777 },
    "New York": { lat: 40.7128, lon: -74.006 },
    Tokyo: { lat: 35.6895, lon: 139.6917 },
    Paris: { lat: 48.8566, lon: 2.3522 },
  };

  const loading = document.getElementById('loading');
  const errorMessage = document.getElementById('error-message');
  const weatherCards = document.getElementById('weather-cards');

  if (!cityCoordinates[city]) {
    alert('Weather data for this city is not available.');
    return;
  }

  const { lat, lon } = cityCoordinates[city];
  const params = `lat=${lat}&lon=${lon}&alt=43&start=2024-01-01&end=2024-12-31`;

  try {
    // Show loading state
    loading.style.display = 'block';
    errorMessage.style.display = 'none';
    weatherCards.innerHTML = '';

    // Fetch data
    const response = await fetch(`${BASE_URL}?${params}`, {
      method: 'GET',
      headers: {
        'x-rapidapi-key': API_KEY,
        'x-rapidapi-host': 'meteostat.p.rapidapi.com',
      },
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    displayWeatherCards(data.data);
  } catch (error) {
    console.error('Error fetching weather data:', error);
    errorMessage.style.display = 'block';
    errorMessage.innerText = 'Failed to load weather data. Please try again.';
  } finally {
    loading.style.display = 'none';
  }
}

function displayWeatherCards(monthlyData) {
  const weatherCards = document.getElementById('weather-cards');
  const icons = { sunny: '☀️', cloudy: '☁️', rain: '🌧️' };

  weatherCards.innerHTML = monthlyData
    .map((month) => {
      const condition = month.prcp > 50 ? 'rain' : month.tavg > 20 ? 'sunny' : 'cloudy';
      return `
        <div class="weather-card">
          <div class="weather-icon">${icons[condition]}</div>
          <div class="weather-details">
            <strong>${new Date(month.date).toLocaleString('default', { month: 'long' })}</strong>
            <p>Avg Temp: ${month.tavg}°C</p>
            <p>Min Temp: ${month.tmin}°C</p>
            <p>Max Temp: ${month.tmax}°C</p>
            <p>Precipitation: ${month.prcp} mm</p>
          </div>
        </div>`;
    })
    .join('');
}
