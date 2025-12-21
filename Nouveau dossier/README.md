# Brave Anime Tab / Onglet animé pour Brave

A lightweight custom New Tab experience for Brave that supports animated video backgrounds, quick shortcuts and a minimal clock.
Un nouvel onglet léger pour Brave avec fond vidéo animé, raccourcis rapides et une horloge minimaliste.

---

## Table of contents / Table des matières
- About / À propos
- Features / Fonctionnalités
- Files you care about / Fichiers importants
- Quick setup (Unpacked extension) / Installation rapide (extension non empaquetée)
- If there is no manifest.json / S'il n'y a pas de manifest.json
- Customize / Personnalisation
- Optimization & compatibility / Optimisation & compatibilité
- Packaging & publishing / Emballage et publication
- Troubleshooting / Dépannage
- Security & privacy / Sécurité & vie privée
- License & Credits / Licence & Remerciements

---

## About / À propos
This small project turns your Brave new tab into a visually pleasing page with an animated wallpaper (video), rounded site shortcuts and a small clock. It is intended to be simple to set up and customize.
Ce petit projet transforme votre nouvel onglet Brave en une page visuellement agréable avec un fond animé (vidéo), des raccourcis arrondis et une petite horloge. Conçu pour être simple à installer et personnaliser.

---

## Features / Fonctionnalités
- Animated video background (mp4) / Fond vidéo animé (mp4)
- Configurable shortcuts (HTML) / Raccourcis configurables (HTML)
- Minimal real-time clock (script.js) / Horloge minimale (script.js)
- Easy to load as an unpacked extension in Brave / Facile à charger comme extension non empaquetée dans Brave

---

## Files you care about / Fichiers importants
- `newtab.html` — main new tab UI / UI principal
- `script.js` — clock logic (and small helpers) / logique de l'horloge
- `CustomWallpaperGoesHere.mp4` — place your video here (or change path in HTML) / mettez votre vidéo ici (ou modifiez le chemin dans le HTML)

---

## Quick setup — Load as an unpacked extension (Brave / Chrome)  
Steps (EN) — Quick:
1. Clone or download this repository:
   - git clone https://github.com/Dopiiii/Brave-Anime-tab.git
2. Put your video into the repository folder and name it `CustomWallpaperGoesHere.mp4` (or update `newtab.html` to point to your file).
3. Open Brave and go to: `brave://extensions`
4. Enable "Developer mode" (top-right).
5. Click "Load unpacked" and select the repository folder you just cloned.
6. Open a new tab — you should see the custom page.

Étapes (FR) — Rapide :
1. Clonez ou téléchargez le dépôt :
   - git clone https://github.com/Dopiiii/Brave-Anime-tab.git
2. Placez votre vidéo dans le dossier du dépôt et renommez-la `CustomWallpaperGoesHere.mp4` (ou mettez à jour `newtab.html`).
3. Ouvrez Brave et allez sur : `brave://extensions`
4. Activez le "Mode développeur" (en haut à droite).
5. Cliquez sur "Charger l’extension non empaquetée" et sélectionnez le dossier du dépôt.
6. Ouvrez un nouvel onglet — la page personnalisée devrait s’afficher.

---

## If there is no manifest.json / S'il n'y a pas de manifest.json
A Chrome/Brave extension requires a `manifest.json` that declares the New Tab override. If your repo does not contain one, create a file named `manifest.json` in the root of the project with the example below and then load the unpacked extension as described above.

Example (Manifest v3) / Exemple (Manifest v3):
```json
{
  "manifest_version": 3,
  "name": "Brave Anime Tab",
  "version": "1.0.0",
  "description": "Custom new tab with animated video background",
  "icons": {
    "48": "icon48.png",
    "128": "icon128.png"
  },
  "chrome_url_overrides": {
    "newtab": "newtab.html"
  },
  "permissions": [],
  "author": "Dopiiii"
}
```

Notes:
- `chrome_url_overrides.newtab` makes the browser load `newtab.html` whenever a new tab opens.
- You can add `icons` (recommended) but they are optional for local testing.

Remarques :
- `chrome_url_overrides.newtab` force le navigateur à charger `newtab.html` pour le nouvel onglet.
- Les `icons` sont recommandées mais optionnelles pour les tests locaux.

---

## Important HTML/Video attributes (autoplay policy)
Modern browsers (including Brave) block autoplay unless the video is muted. Make sure your `<video>` element includes `muted` and `playsinline`. Example snippet to use inside `newtab.html`:

```html
<video id="bgVideo" autoplay muted loop playsinline>
  <source src="CustomWallpaperGoesHere.mp4" type="video/mp4" />
  <!-- optional fallback image -->
</video>
```

Without `muted`, autoplay may NOT work. If your video is hosted remotely, cross-origin (CORS) and Content Security Policy (CSP) issues can block it — prefer bundling the MP4 with the extension or a properly configured host.

---

## Customize / Personnalisation
- Change the wallpaper: replace `CustomWallpaperGoesHere.mp4` or edit `<source src="...">` in `newtab.html`.
- Shortcuts: edit the HTML elements in `newtab.html` (rounded icons/links).
- Clock: `script.js` contains the clock logic — edit formats, position or styling via CSS.
- Styling: modify or add CSS in `newtab.html` (or an external stylesheet) to change layout, colors, fonts.

---

## Optimization & compatibility / Optimisation & compatibilité
- Use H.264 (MP4) for widest compatibility in Brave/Chrome. Consider WebM for smaller files but test across targets.
- Keep resolution reasonable (e.g., 1920×1080 or lower) — large files increase memory and slow down the new tab.
- Use fast encoding settings and small bitrate for smooth looped playback.
- Provide a `poster` or fallback image for devices that can't play video.

---

## Packaging & publishing / Emballage & publication
- To distribute publicly, you must package and publish to the Chrome Web Store (or Brave Web Store if you want Brave-specific listing).
- Steps (summary):
  1. Prepare icons (48×48, 128×128).
  2. Ensure `manifest.json` is compliant with Chrome Web Store requirements (manifest v3 preferred).
  3. Zip the extension folder (do not include .git unless needed).
  4. Upload to the Chrome Web Store developer dashboard and follow the publishing flow (developer account and fees may apply).
- Brave may accept Chrome Web Store extensions; for the Brave Add-ons store follow Brave’s publisher instructions.

---

## Troubleshooting / Dépannage
- Video not playing:
  - Ensure `muted` and `playsinline` are set.
  - Check the DevTools console (Ctrl+Shift+I) for errors.
  - If video is remote, check CORS and CSP.
- New tab not overridden:
  - Verify `manifest.json` exists and contains `chrome_url_overrides.newtab`.
  - Ensure you loaded the correct folder when using "Load unpacked".
- Styles or script not applying:
  - Make sure relative paths are correct.
  - Clear cache or reload the extension in `brave://extensions`.
- Extension appears but not in new tab:
  - Some browsers/platforms can restrict newtab overrides; test in Brave stable and check for extension conflicts.

---

## Security & privacy / Sécurité & vie privée
- The extension runs locally in your browser. Bundled video files are not uploaded anywhere by default.
- If you add analytics, remote resources or external scripts, mention them clearly and handle permissions carefully.
- Avoid embedding third-party scripts unless you trust their security/privacy posture.

---

## License & Credits / Licence & Remerciements
- Add your preferred license file (e.g., `LICENSE`) if you want others to reuse or contribute.
- Credit: original author — Dopiiii (this repo).
- Example: MIT or CC0 are common for small UI projects — choose the license that fits your intentions.

---

If you'd like, I can:
- provide a ready-to-use `manifest.json` (I included a basic example above),
- craft a short CONTRIBUTING guide for people who want to help,
- or prepare a packaged zip ready for uploading to the Chrome Web Store.

Si vous voulez, je peux :
- fournir un `manifest.json` prêt à l’emploi (exemple inclus ci‑dessous),
- rédiger un guide CONTRIBUTING pour les contributeurs,
- ou préparer un zip prêt à être envoyé au Chrome Web Store.
