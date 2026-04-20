/* ============================================
   WEATHER MODULE — Open-Meteo API (no key needed)
   Advanced mode: UV index, AQI, hourly forecast
   ============================================ */

window.WeatherModule = {
  id: 'weather',
  name: 'Météo',
  defaultPosition: { col: 4, row: 1, colSpan: 1, rowSpan: 1 },

  _interval: null,
  _currentEl: null,
  _currentConfig: null,

  _weatherCodes: {
    0:  { icon: '☀️', desc: 'Ciel dégagé' },
    1:  { icon: '🌤️', desc: 'Peu nuageux' },
    2:  { icon: '⛅', desc: 'Partiellement nuageux' },
    3:  { icon: '☁️', desc: 'Couvert' },
    45: { icon: '🌫️', desc: 'Brouillard' },
    48: { icon: '🌫️', desc: 'Brouillard givrant' },
    51: { icon: '🌦️', desc: 'Bruine légère' },
    53: { icon: '🌦️', desc: 'Bruine' },
    55: { icon: '🌧️', desc: 'Bruine dense' },
    61: { icon: '🌧️', desc: 'Pluie légère' },
    63: { icon: '🌧️', desc: 'Pluie' },
    65: { icon: '🌧️', desc: 'Forte pluie' },
    71: { icon: '🌨️', desc: 'Neige légère' },
    73: { icon: '🌨️', desc: 'Neige' },
    75: { icon: '❄️', desc: 'Forte neige' },
    80: { icon: '🌦️', desc: 'Averses légères' },
    81: { icon: '🌧️', desc: 'Averses' },
    82: { icon: '⛈️', desc: 'Fortes averses' },
    95: { icon: '⛈️', desc: 'Orage' },
    96: { icon: '⛈️', desc: 'Orage avec grêle' },
    99: { icon: '⛈️', desc: 'Orage violent' }
  },

  _aqiLabels: ['Bon', 'Acceptable', 'Modéré', 'Mauvais', 'Très mauvais', 'Dangereux'],
  _aqiColors: ['#00b894', '#fdcb6e', '#e17055', '#d63031', '#6c5ce7', '#2d3436'],

  render(config) {
    const mode = config.mode || 'minimal';

    if (mode === 'detailed') {
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
              ${config.showUV ? '<div class="weather-detail"><span class="weather-detail-label">UV</span><span class="weather-uv"></span></div>' : ''}
              ${config.showAQI ? '<div class="weather-detail"><span class="weather-detail-label">Qualité air</span><span class="weather-aqi"></span></div>' : ''}
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
    this._currentEl = el;
    this._currentConfig = config;

    if (this._interval) {
      clearInterval(this._interval);
      this._interval = null;
    }

    await this._fetchWeather(el, config);
    this._interval = setInterval(() => {
      if (this._currentEl) this._fetchWeather(this._currentEl, this._currentConfig);
    }, 30 * 60 * 1000);
  },

  async _fetchWeather(el, config) {
    try {
      let lat = config.lat;
      let lon = config.lon;

      if (config.city) {
        const geo = await this._geocode(config.city);
        if (geo) { lat = geo.lat; lon = geo.lon; }
      } else if (!lat || !lon) {
        try {
          const pos = await this._getPosition();
          lat = pos.lat;
          lon = pos.lon;
        } catch {
          lat = 48.8566;
          lon = 2.3522;
        }
      }

      if (!lat || !lon) {
        const loading = el.querySelector('.weather-loading');
        if (loading) loading.textContent = 'Position non disponible';
        return;
      }

      const unit = config.unit === 'F' ? 'fahrenheit' : 'celsius';
      const baseParams = `latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,relative_humidity_2m,wind_speed_10m&temperature_unit=${unit}`;
      const detailedParams = config.mode === 'detailed'
        ? '&daily=weather_code,temperature_2m_max,temperature_2m_min&forecast_days=3&timezone=auto'
        : '';
      const uvParams = config.showUV ? '&daily=uv_index_max&timezone=auto' : '';

      const resp = await fetch(`https://api.open-meteo.com/v1/forecast?${baseParams}${detailedParams}${uvParams}`);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();

      const loading = el.querySelector('.weather-loading');
      const content = el.querySelector('.weather-content');
      if (!loading || !content) return;

      loading.classList.add('hidden');
      content.classList.remove('hidden');

      const current = data.current;
      const code = current.weather_code;
      const weather = this._weatherCodes[code] || this._weatherCodes[0];

      el.querySelector('.weather-icon-large').textContent = weather.icon;
      el.querySelector('.weather-temp').textContent = `${Math.round(current.temperature_2m)}°${config.unit || 'C'}`;

      const cityLabel = el.querySelector('.weather-city-label');
      if (cityLabel && config.city) cityLabel.textContent = config.city;

      if (config.mode === 'detailed') {
        const descEl = el.querySelector('.weather-desc');
        if (descEl) descEl.textContent = weather.desc;

        const humEl = el.querySelector('.weather-humidity');
        if (humEl) humEl.textContent = `${current.relative_humidity_2m}%`;

        const windEl = el.querySelector('.weather-wind');
        if (windEl) windEl.textContent = `${Math.round(current.wind_speed_10m)} km/h`;

        if (config.showUV && data.daily?.uv_index_max) {
          const uvEl = el.querySelector('.weather-uv');
          if (uvEl) {
            const uv = Math.round(data.daily.uv_index_max[0]);
            const uvLevel = uv <= 2 ? '🟢' : uv <= 5 ? '🟡' : uv <= 7 ? '🟠' : uv <= 10 ? '🔴' : '🟣';
            uvEl.textContent = `${uvLevel} ${uv}`;
          }
        }

        if (config.showAQI) {
          try {
            const aqiResp = await fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=european_aqi`);
            if (aqiResp.ok) {
              const aqiData = await aqiResp.json();
              const aqiEl = el.querySelector('.weather-aqi');
              if (aqiEl && aqiData.current?.european_aqi != null) {
                const aqi = aqiData.current.european_aqi;
                const lvl = Math.min(Math.floor(aqi / 20), 5);
                aqiEl.textContent = this._aqiLabels[lvl];
                aqiEl.style.color = this._aqiColors[lvl];
              }
            }
          } catch { /* AQI not critical */ }
        }

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
        pos => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
        err => reject(err),
        { timeout: 5000 }
      );
    });
  },

  async _geocode(city) {
    try {
      const resp = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`);
      if (!resp.ok) return null;
      const data = await resp.json();
      if (data.results?.length > 0) {
        return { lat: data.results[0].latitude, lon: data.results[0].longitude };
      }
    } catch { /* ignore */ }
    return null;
  },

  unmount() {
    if (this._interval) {
      clearInterval(this._interval);
      this._interval = null;
    }
    this._currentEl = null;
    this._currentConfig = null;
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
          <option value="C" ${config.unit !== 'F' ? 'selected' : ''}>°C (Celsius)</option>
          <option value="F" ${config.unit === 'F' ? 'selected' : ''}>°F (Fahrenheit)</option>
        </select>
      </div>
      <div class="setting-group" style="opacity:${config.mode === 'detailed' ? 1 : 0.4}">
        <label class="setting-toggle">
          <input type="checkbox" data-module="weather" data-key="showUV" ${config.showUV ? 'checked' : ''}>
          <span>Index UV (mode détaillé)</span>
        </label>
      </div>
      <div class="setting-group" style="opacity:${config.mode === 'detailed' ? 1 : 0.4}">
        <label class="setting-toggle">
          <input type="checkbox" data-module="weather" data-key="showAQI" ${config.showAQI ? 'checked' : ''}>
          <span>Qualité de l'air / AQI (mode détaillé)</span>
        </label>
      </div>
    `;
  },

  onConfigChange(el, newConfig) {
    this.unmount();
    el.innerHTML = this.render(newConfig);
    this.mount(el, newConfig);
  }
};
