/* ============================================
   CRYPTO MODULE — Real-time prices via CoinGecko (no API key)
   ============================================ */

window.CryptoModule = {
  id: 'crypto',
  name: 'Crypto / Bourse',
  defaultPosition: { col: 1, row: 1, colSpan: 1, rowSpan: 1 },

  _interval: null,
  _currentEl: null,
  _currentConfig: null,

  _defaultCoins: ['bitcoin', 'ethereum', 'solana'],

  render(config) {
    const coins = config.coins || this._defaultCoins;
    return `
      <div class="crypto-module">
        <div class="module-header">
          <span>Crypto</span>
          <button class="module-btn-ghost crypto-refresh" style="font-size:0.7rem;padding:2px 6px">↺</button>
        </div>
        <div class="crypto-list">
          ${coins.map(id => `
            <div class="crypto-item" data-coin="${id}">
              <div class="crypto-info">
                <span class="crypto-symbol">${id.slice(0,3).toUpperCase()}</span>
                <span class="crypto-name">${id.charAt(0).toUpperCase() + id.slice(1)}</span>
              </div>
              <div class="crypto-price-block">
                <span class="crypto-price">---</span>
                <span class="crypto-change">---%</span>
              </div>
            </div>
          `).join('')}
        </div>
        <div class="crypto-updated"></div>
      </div>
    `;
  },

  async mount(el, config) {
    this._currentEl = el;
    this._currentConfig = config;

    if (this._interval) { clearInterval(this._interval); this._interval = null; }

    await this._fetchPrices(el, config);

    el.querySelector('.crypto-refresh')?.addEventListener('click', () => {
      this._fetchPrices(el, config);
    });

    this._interval = setInterval(() => {
      if (this._currentEl) this._fetchPrices(this._currentEl, this._currentConfig);
    }, 5 * 60 * 1000);
  },

  async _fetchPrices(el, config) {
    const coins = config.coins || this._defaultCoins;
    const currency = (config.currency || 'eur').toLowerCase();
    const ids = coins.join(',');

    try {
      const resp = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(ids)}&vs_currencies=${currency}&include_24hr_change=true`
      );
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();

      coins.forEach(coinId => {
        const item = el.querySelector(`.crypto-item[data-coin="${coinId}"]`);
        if (!item) return;
        const coinData = data[coinId];
        if (!coinData) return;

        const price = coinData[currency];
        const change = coinData[`${currency}_24h_change`];
        const priceEl  = item.querySelector('.crypto-price');
        const changeEl = item.querySelector('.crypto-change');

        if (priceEl) {
          priceEl.textContent = price < 1
            ? price.toFixed(4)
            : price.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
          priceEl.textContent += ' ' + currency.toUpperCase();
        }

        if (changeEl && change != null) {
          const pct = change.toFixed(2);
          changeEl.textContent = (change >= 0 ? '+' : '') + pct + '%';
          changeEl.className = 'crypto-change ' + (change >= 0 ? 'crypto-up' : 'crypto-down');
        }
      });

      const updEl = el.querySelector('.crypto-updated');
      if (updEl) updEl.textContent = 'Mis à jour ' + new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      console.error('Crypto fetch error:', e);
      const updEl = el.querySelector('.crypto-updated');
      if (updEl) updEl.textContent = 'Erreur de chargement';
    }
  },

  unmount() {
    if (this._interval) { clearInterval(this._interval); this._interval = null; }
    this._currentEl = null;
    this._currentConfig = null;
  },

  renderSettings(config) {
    const coins = config.coins || this._defaultCoins;
    return `
      <div class="setting-group">
        <label class="setting-label">Devises suivies (IDs CoinGecko)</label>
        <p class="setting-hint">Ex: bitcoin, ethereum, solana, dogecoin, cardano</p>
        <textarea class="setting-input" data-module="crypto" data-key="coinsRaw"
          style="min-height:60px;resize:vertical"
          placeholder="bitcoin&#10;ethereum&#10;solana">${coins.join('\n')}</textarea>
      </div>
      <div class="setting-group">
        <label class="setting-label">Monnaie de référence</label>
        <select class="setting-select" data-module="crypto" data-key="currency">
          <option value="eur" ${(config.currency||'eur') === 'eur' ? 'selected' : ''}>EUR (€)</option>
          <option value="usd" ${config.currency === 'usd' ? 'selected' : ''}>USD ($)</option>
          <option value="gbp" ${config.currency === 'gbp' ? 'selected' : ''}>GBP (£)</option>
          <option value="jpy" ${config.currency === 'jpy' ? 'selected' : ''}>JPY (¥)</option>
        </select>
      </div>
    `;
  },

  onConfigChange(el, newConfig) {
    if (newConfig.coinsRaw) {
      newConfig.coins = newConfig.coinsRaw.split(/\n|,/).map(s => s.trim().toLowerCase()).filter(Boolean);
    }
    this.unmount();
    el.innerHTML = this.render(newConfig);
    this.mount(el, newConfig);
  }
};
