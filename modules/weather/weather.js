/* ============================================
   WEATHER MODULE — Open-Meteo API (no key needed)
   ============================================ */

window.WeatherModule = {
  id: 'weather',
  name: 'Météo',
  defaultPosition: { col: 4, row: 1, colSpan: 1, rowSpan: 1 },

  _interval: null,

  // Weather code to icon/description mapping
  _weatherCodes: {
    0: { icon: '☀️', desc: 'Ciel dégagé', descEn: 'Clear sky' },
    1: { icon: '🌤️', desc: 'Peu nuageux', descEn: 'Mainly clear' },
    2: { icon: '⛅', desc: 'Partiellement nuageux', descEn: 'Partly cloudy' },
    3: { icon: '☁️', desc: 'Couvert', descEn: 'Overcast' },
    45: { icon: '🌫️', desc: 'Brouillard', descEn: 'Foggy' },
    48: { icon: '🌫️', desc: 'Brouillard givrant', descEn: 'Rime fog' },
    51: { icon: '🌦️', desc: 'Bruine légère', descEn: 'Light drizzle' },
    53: { icon: '🌦️', desc: 'Bruine', descEn: 'Drizzle' },
    55: { icon: '🌧️', desc: 'Bruine dense', descEn: 'Dense drizzle' },
    61: { icon: '🌧️', desc: 'Pluie légère', descEn: 'Light rain' },
    63: { icon: '🌧️', desc: 'Pluie', descEn: 'Rain' },
    65: { icon: '🌧️', desc: 'Forte pluie', descEn: 'Heavy rain' },
    71: { icon: '🌨️', desc: 'Neige légère', descEn: 'Light snow' },
    73: { icon: '🌨️', desc: 'Neige', descEn: 'Snow' },
    75: { icon: '❄️', desc: 'Forte neige', descEn: 'Heavy snow' },
    80: { icon: '🌦️', desc: 'Averses légères', descEn: 'Light showers' },
    81: { icon: '🌧️', desc: 'Averses', descEn: 'Showers' },
    82: { icon: '⛈️', desc: 'Fortes averses', descEn: 'Heavy showers' },
    95: { icon: '⛈️', desc: 'Orage', descEn: 'Thunderstorm' },
    96: { icon: '⛈️', desc: 'Orage avec grêle', descEn: 'Thunderstorm with hail' },
    99: { icon: '⛈️', desc: 'Orage violent', descEn: 'Severe thunderstorm' }
  },

  render(config) {
    const isDetailed = config.mode === 'detailed';

    if (isDetailed) {
      return `
        <div class="weather-module weather-detailed">
          <div class="weather-loading">Chargement...</div>
          <div class="weather-content hidden">
            <div class="weather-main">
              <span class="weather-icon-large"></span>
              <div class="weather-temp-block">
                <span class="weather-temp"></span>
                <span class="weather-desc"></span>
              </div>
            </div>
            <div class="weather-details">
              <div class="weather-detail"><span class="weather-detail-label">Humidité</span><span class="weather-humidity"></span></div>
              <div class="weather-detail"><span class="weather-detail-label">Vent</span><span class="weather-wind"></span></div>
            </div>
            <div class="weather-forecast"></div>
          </div>
          <div class="weather-city-label"></div>
        </div>
      `;
    }

    return `
      <div class="weather-module weather-minimal">
        <div class="weather-loading">Chargement...</div>
        <div class="weather-content hidden">
          <span class="weather-icon-large"></span>
          <span class="weather-temp"></span>
        </div>
        <div class="weather-city-label"></div>
      </div>
    `;
  },

  async mount(el, config) {
    await this._fetchWeather(el, config);
    // Refresh every 30 minutes
    this._interval = setInterval(() => this._fetchWeather(el, config), 30 * 60 * 1000);
  },

  async _fetchWeather(el, config) {
    try {
      let lat = config.lat;
      let lon = config.lon;

      // Get coordinates from city name or geolocation
      if (config.city) {
        const geo = await this._geocode(config.city);
        if (geo) { lat = geo.lat; lon = geo.lon; }
      } else if (!lat || !lon) {
        const pos = await this._getPosition();
        lat = pos.lat;
        lon = pos.lon;
      }

      if (!lat || !lon) {
        el.querySelector('.weather-loading').textContent = 'Position non disponible';
        return;
      }

      const unit = config.unit === 'F' ? 'fahrenheit' : 'celsius';
      const params = `latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,relative_humidity_2m,wind_speed_10m&temperature_unit=${unit}`;
      const detailedParams = config.mode === 'detailed' ? '&daily=weather_code,temperature_2m_max,temperature_2m_min&forecast_days=3&timezone=auto' : '';

      const resp = await fetch(`https://api.open-meteo.com/v1/forecast?${params}${detailedParams}`);
      const data = await resp.json();

      const loading = el.querySelector('.weather-loading');
      const content = el.querySelector('.weather-content');
      loading.classList.add('hidden');
      content.classList.remove('hidden');

      const current = data.current;
      const code = current.weather_code;
      const weather = this._weatherCodes[code] || this._weatherCodes[0];

      el.querySelector('.weather-icon-large').textContent = weather.icon;
      el.querySelector('.weather-temp').textContent = `${Math.round(current.temperature_2m)}°${config.unit || 'C'}`;

      const cityLabel = el.querySelector('.weather-city-label');
      if (cityLabel && config.city) {
        cityLabel.textContent = config.city;
      }

      if (config.mode === 'detailed') {
        const descEl = el.querySelector('.weather-desc');
        if (descEl) descEl.textContent = weather.desc;

        const humEl = el.querySelector('.weather-humidity');
        if (humEl) humEl.textContent = `${current.relative_humidity_2m}%`;

        const windEl = el.querySelector('.weather-wind');
        if (windEl) windEl.textContent = `${Math.round(current.wind_speed_10m)} km/h`;

        // 3-day forecast
        if (data.daily) {
          const forecastEl = el.querySelector('.weather-forecast');
          if (forecastEl) {
            forecastEl.innerHTML = data.daily.time.map((date, i) => {
              const dayWeather = this._weatherCodes[data.daily.weather_code[i]] || this._weatherCodes[0];
              const dayName = new Date(date).toLocaleDateString('fr-FR', { weekday: 'short' });
              return `
                <div class="weather-forecast-day">
                  <span class="forecast-day-name">${dayName}</span>
                  <span class="forecast-icon">${dayWeather.icon}</span>
                  <span class="forecast-temps">
                    <span class="forecast-max">${Math.round(data.daily.temperature_2m_max[i])}°</span>
                    <span class="forecast-min">${Math.round(data.daily.temperature_2m_min[i])}°</span>
                  </span>
                </div>
              `;
            }).join('');
          }
        }
      }
    } catch (e) {
      console.error('Weather fetch error:', e);
      const loading = el.querySelector('.weather-loading');
      if (loading) loading.textContent = 'Erreur météo';
    }
  },

  _getPosition() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
        () => resolve({ lat: 48.8566, lon: 2.3522 }) // Default: Paris
      );
    });
  },

  async _geocode(city) {
    try {
      const resp = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`);
      const data = await resp.json();
      if (data.results && data.results.length > 0) {
        return { lat: data.results[0].latitude, lon: data.results[0].longitude };
      }
    } catch (e) { /* fallback to geolocation */ }
    return null;
  },

  unmount() {
    if (this._interval) {
      clearInterval(this._interval);
      this._interval = null;
    }
  },

  renderSettings(config) {
    return `
      <div class="setting-group">
        <label class="setting-label">Mode d'affichage</label>
        <select class="setting-select" data-module="weather" data-key="mode">
          <option value="minimal" ${config.mode === 'minimal' ? 'selected' : ''}>Minimal</option>
          <option value="detailed" ${config.mode === 'detailed' ? 'selected' : ''}>Détaillé</option>
        </select>
      </div>
      <div class="setting-group">
        <label class="setting-label">Ville (vide = géolocalisation auto)</label>
        <input type="text" class="setting-input" data-module="weather" data-key="city"
               value="${config.city || ''}" placeholder="Paris, Tokyo, New York...">
      </div>
      <div class="setting-group">
        <label class="setting-label">Unité</label>
        <select class="setting-select" data-module="weather" data-key="unit">
          <option value="C" ${config.unit === 'C' ? 'selected' : ''}>°C (Celsius)</option>
          <option value="F" ${config.unit === 'F' ? 'selected' : ''}>°F (Fahrenheit)</option>
        </select>
      </div>
    `;
  },

  onConfigChange(el, newConfig) {
    this.unmount();
    el.innerHTML = this.render(newConfig);
    this.mount(el, newConfig);
  }
};
