/* ============================================
   NOTIFICATIONS-MANAGER.JS — Browser notifications
   ============================================ */

const NotificationManager = (() => {
  let _enabled = false;
  const _timers = new Map();

  async function init(config) {
    _enabled = config?.notificationsEnabled ?? false;
    if (!_enabled) return;

    if (Notification.permission === 'default') {
      const perm = await Notification.requestPermission();
      _enabled = perm === 'granted';
    } else {
      _enabled = Notification.permission === 'granted';
    }
  }

  function send(title, body = '', icon = '') {
    if (!_enabled || Notification.permission !== 'granted') return;
    try {
      new Notification(title, {
        body,
        icon: icon || chrome.runtime.getURL('icons/icon128.png'),
        silent: false
      });
    } catch { /* blocked */ }
  }

  function scheduleAlert(message, delayMs) {
    const id = Symbol();
    const t = setTimeout(() => {
      send('Anime Tab', message);
      _timers.delete(id);
    }, delayMs);
    _timers.set(id, t);
    return id;
  }

  function cancelAlert(id) {
    const t = _timers.get(id);
    if (t) { clearTimeout(t); _timers.delete(id); }
  }

  function cancelAll() {
    for (const t of _timers.values()) clearTimeout(t);
    _timers.clear();
  }

  function pomodoroAlert(message) {
    send('Pomodoro 🍅', message);
  }

  function countdownAlert(label) {
    send(`⏰ ${label}`, 'Le compte à rebours est terminé !');
  }

  function setEnabled(val) {
    _enabled = val && Notification.permission === 'granted';
  }

  return { init, send, scheduleAlert, cancelAlert, cancelAll, pomodoroAlert, countdownAlert, setEnabled };
})();
