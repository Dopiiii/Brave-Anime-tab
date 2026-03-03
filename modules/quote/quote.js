/* ============================================
   QUOTE MODULE — Citation du jour
   ============================================ */

window.QuoteModule = {
  id: 'quote',
  name: 'Citation',
  defaultPosition: { col: 4, row: 3, colSpan: 1, rowSpan: 1 },

  // Built-in quotes (fallback if API fails)
  _quotes: {
    fr: [
      { text: "La vie est un mystère qu'il faut vivre, et non un problème à résoudre.", author: "Gandhi" },
      { text: "Le succès, c'est se promener d'échec en échec tout en restant motivé.", author: "Winston Churchill" },
      { text: "La seule façon de faire du bon travail est d'aimer ce que vous faites.", author: "Steve Jobs" },
      { text: "Il n'y a qu'une façon d'échouer, c'est d'abandonner avant d'avoir réussi.", author: "Olivier Lockert" },
      { text: "Le courage n'est pas l'absence de peur, mais la capacité de vaincre ce qui fait peur.", author: "Nelson Mandela" },
      { text: "Chaque accomplissement commence par la décision d'essayer.", author: "John F. Kennedy" },
      { text: "La créativité, c'est l'intelligence qui s'amuse.", author: "Albert Einstein" },
      { text: "Le meilleur moment pour planter un arbre était il y a 20 ans. Le deuxième meilleur moment est maintenant.", author: "Proverbe chinois" },
      { text: "Ce n'est pas parce que les choses sont difficiles que nous n'osons pas, c'est parce que nous n'osons pas qu'elles sont difficiles.", author: "Sénèque" },
      { text: "L'imagination est plus importante que le savoir.", author: "Albert Einstein" },
      { text: "Sois le changement que tu veux voir dans le monde.", author: "Gandhi" },
      { text: "La simplicité est la sophistication suprême.", author: "Léonard de Vinci" }
    ],
    en: [
      { text: "Life is what happens when you're busy making other plans.", author: "John Lennon" },
      { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
      { text: "In the middle of difficulty lies opportunity.", author: "Albert Einstein" },
      { text: "It does not matter how slowly you go as long as you do not stop.", author: "Confucius" },
      { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
      { text: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt" },
      { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
      { text: "Be yourself; everyone else is already taken.", author: "Oscar Wilde" },
      { text: "The only impossible journey is the one you never begin.", author: "Tony Robbins" },
      { text: "Creativity is intelligence having fun.", author: "Albert Einstein" },
      { text: "Simplicity is the ultimate sophistication.", author: "Leonardo da Vinci" },
      { text: "Stay hungry, stay foolish.", author: "Steve Jobs" }
    ]
  },

  render(config) {
    return `
      <div class="quote-module">
        <div class="module-header"><span>Citation du jour</span></div>
        <div class="quote-content">
          <p class="quote-text">Chargement...</p>
          <p class="quote-author"></p>
        </div>
      </div>
    `;
  },

  mount(el, config) {
    const lang = config.language || 'fr';
    const quotes = this._quotes[lang] || this._quotes.fr;

    // Pick a "daily" quote based on the day of the year
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const dayOfYear = Math.floor((now - start) / 86400000);
    const quote = quotes[dayOfYear % quotes.length];

    const textEl = el.querySelector('.quote-text');
    const authorEl = el.querySelector('.quote-author');

    if (quote) {
      textEl.textContent = `"${quote.text}"`;
      authorEl.textContent = `— ${quote.author}`;
    }
  },

  unmount() {},

  renderSettings(config) {
    return `
      <div class="setting-group">
        <label class="setting-label">Langue des citations</label>
        <select class="setting-select" data-module="quote" data-key="language">
          <option value="fr" ${config.language === 'fr' ? 'selected' : ''}>Français</option>
          <option value="en" ${config.language === 'en' ? 'selected' : ''}>English</option>
        </select>
      </div>
    `;
  },

  onConfigChange(el, newConfig) {
    el.innerHTML = this.render(newConfig);
    this.mount(el, newConfig);
  }
};
