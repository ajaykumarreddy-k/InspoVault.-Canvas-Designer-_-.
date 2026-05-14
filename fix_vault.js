const fs = require('fs');

let content = fs.readFileSync('index.html', 'utf8');

// 1. Add CSS for grid-card-actions
const cssToAdd = `
    .grid-card-actions {
      position: absolute;
      top: 12px;
      right: 12px;
      display: flex;
      gap: 8px;
      opacity: 0;
      transition: opacity 0.2s var(--ease-out);
      z-index: 10;
    }

    .grid-card:hover .grid-card-actions {
      opacity: 1;
    }

    .action-btn {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.9);
      backdrop-filter: blur(4px);
      border: 1px solid var(--border);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: var(--muted);
      transition: all 0.2s;
    }

    body.dark-theme .action-btn {
      background: rgba(30, 30, 30, 0.8);
      color: #a0a0a0;
      border-color: rgba(255, 255, 255, 0.1);
    }

    .action-btn:hover {
      background: var(--white);
      color: var(--text);
      transform: scale(1.1);
    }

    body.dark-theme .action-btn:hover {
      background: #2a2a2a;
      color: #fff;
    }

    .action-btn.like-btn.active {
      color: #ff4b4b;
    }
    
    .action-btn.like-btn.active svg {
      fill: currentColor;
    }
`;

content = content.replace('/* ── ANIMATIONS ── */', cssToAdd + '\n    /* ── ANIMATIONS ── */');

// 2. Fix the vault-dock to be sticky or absolutely positioned
content = content.replace(
  /\.vault-dock\s*{[\s\S]*?}/,
  `.vault-dock {
      position: absolute;
      bottom: 24px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 100;
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 6px;
      padding: 8px;
      border-radius: 100px;
      background: var(--white);
      border: 1px solid var(--border);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.04);
    }`
);

// Add padding to vault-content-area so dock doesn't cover content
content = content.replace(
  /(\.vault-content-area\s*{[^}]*?padding-bottom:\s*)([^;]+)(;[^}]*})/,
  `$180px$3`
);

// 3. Add actions to all .grid-card
const actionsHTML = `
  <div class="grid-card-actions">
    <button class="action-btn like-btn" onclick="toggleHeart(this, event)" title="Like">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
    </button>
    <button class="action-btn dl-btn" onclick="downloadItem(event)" title="Download">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
    </button>
  </div>`;

content = content.replace(/(<div class="grid-card"[^>]*>)/g, `$1${actionsHTML}`);

// 4. Add Javascript functions for toggleHeart and downloadItem
const jsToAdd = `
      window.toggleHeart = function(btn, event) {
          event.stopPropagation();
          btn.classList.toggle('active');
          const isFilled = btn.classList.contains('active');
          if (isFilled) {
             speak('Added to favorites! ❤️');
          } else {
             speak('Removed from favorites');
          }
      };

      window.downloadItem = function(event) {
          event.stopPropagation();
          speak('Downloading item! 📥');
      };
`;

content = content.replace(/\/\/ Switch Tabs/, jsToAdd + '\n      // Switch Tabs');

fs.writeFileSync('index.html', content);
console.log('Done!');
