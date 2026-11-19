# Note per chi modifica il gioco

- Il sorgente è `src/index.html`. Non modificare `index.html` alla radice: è generato.
- Dopo ogni modifica: `npm install` (una volta) e `npm run build`, poi committa sia `src/index.html` sia `index.html`.
- La build si aspetta in `src/index.html` uno script classico che inizia con `<script>\n'use strict';` e uno `<script type="module">` con `const firebaseConfig = {...};`.
