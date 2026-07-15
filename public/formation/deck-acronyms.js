/**
 * Acronymes AKUU : survol à la 1ʳᵉ occurrence + annexes glossaire.
 * Registre : public/formation/acronyms.json
 */
(function () {
  const ACRONYM_SEL = '.deck-acronym';
  const SKIP_ANCESTORS = 'script, style, noscript, iframe, svg, [data-no-acronym], .deck-src-panel, .deck-src-tooltip, .gini-map-slide, [data-acronym-annex], .deck-glossary';

  const GLOSSARY_GROUPS = {
    geopolitique: 'Géopolitique & blocs régionaux',
    economie: 'Économie & finance',
    institutions: 'Organisations internationales',
    perou: 'Institutions péruviennes',
    securite: 'Sécurité & criminalité',
  };

  let acronymData = null;
  let acronymList = [];
  let tipEl = null;
  let tipTarget = null;
  let tipHideTimer = null;
  let handlersReady = false;

  fetch('../acronyms.json')
    .then((res) => (res.ok ? res.json() : {}))
    .then((json) => {
      acronymData = json;
      acronymList = buildAcronymList(json);
      scheduleBoot();
    })
    .catch(() => {
      acronymData = {};
      acronymList = [];
    });

  function buildAcronymList(json) {
    const list = Object.entries(json).map(([id, entry]) => ({
      id,
      match: entry.match || [entry.label || id],
      expansion: entry.expansion || '',
      hint: entry.hint || '',
      group: entry.group || '',
    }));
    list.sort((a, b) => {
      const maxA = Math.max(...a.match.map((m) => m.length));
      const maxB = Math.max(...b.match.map((m) => m.length));
      return maxB - maxA;
    });
    return list;
  }

  function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function isContentParent(el) {
    if (!el) return false;
    if (el.closest('.logo, img, figcaption, button, a[href]')) return false;
    if (el.matches(
      '.lead, .small, .body, .stat-l, .stat-n, .h, .xs, .quote, .deck-country-card__text, .deck-galeano-card__body, .deck-history-card__body, .deck-election-card__detail'
    )) return true;
    return /^(P|LI|TD|TH|BLOCKQUOTE|FIGCAPTION|H1|H2|H3|H4|B|SPAN)$/i.test(el.tagName);
  }

  function isSkippable(node) {
    if (!node?.parentElement) return true;
    if (node.parentElement.closest(SKIP_ANCESTORS)) return true;
    if (node.parentElement.closest(ACRONYM_SEL)) return true;
    if (node.parentElement.closest('button, a[href], input, textarea, select, label')) return true;
    if (node.parentElement.closest('[data-src-id]') && node.parentElement.matches('[data-src-id]')) {
      const onlySrc = node.parentElement.getAttribute('data-src');
      if (onlySrc && node.textContent.trim() === node.parentElement.textContent.trim()) return true;
    }
    return !isContentParent(node.parentElement);
  }

  function wrapFirstInTextNode(textNode, acronym) {
    const text = textNode.textContent;
    if (!text?.trim()) return false;

    for (const token of acronym.match) {
      const re = new RegExp(`(?<![\\p{L}\\p{N}])${escapeRegex(token)}(?![\\p{L}\\p{N}])`, 'iu');
      const m = re.exec(text);
      if (!m) continue;

      const before = text.slice(0, m.index);
      const after = text.slice(m.index + m[0].length);
      const abbr = document.createElement('abbr');
      abbr.className = 'deck-acronym';
      abbr.setAttribute('data-acronym-id', acronym.id);
      abbr.setAttribute('title', acronym.expansion);
      abbr.tabIndex = 0;
      abbr.textContent = m[0];

      const parent = textNode.parentNode;
      if (before) parent.insertBefore(document.createTextNode(before), textNode);
      parent.insertBefore(abbr, textNode);
      if (after) parent.insertBefore(document.createTextNode(after), textNode);
      parent.removeChild(textNode);
      return true;
    }
    return false;
  }

  function collectTextNodes(root) {
    const nodes = [];
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        return isSkippable(node) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT;
      },
    });
    while (walker.nextNode()) nodes.push(walker.currentNode);
    return nodes;
  }

  function getSeenIds(root) {
    const seen = new Set();
    root.querySelectorAll(`${ACRONYM_SEL}[data-acronym-id]`).forEach((el) => {
      seen.add(el.getAttribute('data-acronym-id'));
    });
    return seen;
  }

  function markFirstOccurrences(root) {
    if (!acronymList.length) return 0;
    const seen = getSeenIds(root);
    const sections = root.querySelectorAll('section[data-label]:not([data-acronym-annex])');
    let added = 0;

    sections.forEach((section) => {
      if (section.closest(SKIP_ANCESTORS)) return;
      for (const acronym of acronymList) {
        if (seen.has(acronym.id)) continue;
        const nodes = collectTextNodes(section);
        for (const node of nodes) {
          if (wrapFirstInTextNode(node, acronym)) {
            seen.add(acronym.id);
            added += 1;
            break;
          }
        }
      }
    });

    return added;
  }

  function renderGlossaryAnnexes() {
    if (!acronymData) return;
    const hosts = document.querySelectorAll('[data-acronym-glossary]');
    if (!hosts.length) return;

    hosts.forEach((host) => {
      if (host.querySelector('.deck-glossary__grid')) return;
      const groups = (host.getAttribute('data-acronym-glossary') || '')
        .split(',')
        .map((g) => g.trim())
        .filter(Boolean);
      if (!groups.length) return;

      host.replaceChildren();
      const grid = document.createElement('div');
      grid.className = 'deck-glossary__grid';

      const entries = Object.entries(acronymData)
        .filter(([, entry]) => groups.includes(entry.group))
        .sort((a, b) => {
          const labelA = (a[1].match && a[1].match[0]) || a[0];
          const labelB = (b[1].match && b[1].match[0]) || b[0];
          return labelA.localeCompare(labelB, 'fr', { sensitivity: 'base' });
        });

      entries.forEach(([id, entry]) => {
        const item = document.createElement('article');
        item.className = 'deck-glossary__item';
        const label = document.createElement('div');
        label.className = 'deck-glossary__label';
        label.textContent = (entry.match && entry.match[0]) || id.toUpperCase();
        const expansion = document.createElement('div');
        expansion.className = 'deck-glossary__expansion';
        expansion.textContent = entry.expansion || '';
        item.appendChild(label);
        item.appendChild(expansion);
        if (entry.hint) {
          const hint = document.createElement('p');
          hint.className = 'deck-glossary__hint';
          hint.textContent = entry.hint;
          item.appendChild(hint);
        }
        grid.appendChild(item);
      });

      host.appendChild(grid);
    });
  }

  function getTipEl() {
    if (!tipEl) {
      tipEl = document.createElement('div');
      tipEl.className = 'deck-acronym-tooltip';
      tipEl.setAttribute('role', 'tooltip');
      tipEl.id = 'deck-acronym-tooltip';
      tipEl.hidden = true;
      tipEl.addEventListener('pointerenter', () => clearTimeout(tipHideTimer));
      tipEl.addEventListener('pointerleave', scheduleHideTip);
    }
    if (tipEl.parentNode !== document.body) document.body.appendChild(tipEl);
    return tipEl;
  }

  function hideTip() {
    clearTimeout(tipHideTimer);
    tipTarget = null;
    if (!tipEl) return;
    tipEl.hidden = true;
    tipEl.classList.remove('is-visible');
  }

  function scheduleHideTip() {
    clearTimeout(tipHideTimer);
    tipHideTimer = setTimeout(hideTip, 160);
  }

  function positionTip(el) {
    const tip = getTipEl();
    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) return;
    const tw = tip.offsetWidth;
    const th = tip.offsetHeight;
    let left = r.left + r.width / 2 - tw / 2;
    let top = r.top - th - 10;
    if (top < 8) top = r.bottom + 10;
    left = Math.max(8, Math.min(left, window.innerWidth - tw - 8));
    tip.style.left = `${left}px`;
    tip.style.top = `${top}px`;
  }

  function renderTip(el) {
    const id = el.getAttribute('data-acronym-id');
    const entry = id && acronymData ? acronymData[id] : null;
    if (!entry) return;
    const tip = getTipEl();
    tip.replaceChildren();
    const label = document.createElement('div');
    label.className = 'deck-acronym-tooltip__label';
    label.textContent = (entry.match && entry.match[0]) || id.toUpperCase();
    tip.appendChild(label);
    if (entry.expansion) {
      const expansion = document.createElement('div');
      expansion.className = 'deck-acronym-tooltip__expansion';
      expansion.textContent = entry.expansion;
      tip.appendChild(expansion);
    }
    if (entry.hint) {
      const hint = document.createElement('p');
      hint.className = 'deck-acronym-tooltip__hint';
      hint.textContent = entry.hint;
      tip.appendChild(hint);
    }
  }

  function showTip(el) {
    if (!el?.matches?.(ACRONYM_SEL)) return;
    clearTimeout(tipHideTimer);
    tipTarget = el;
    renderTip(el);
    const tip = getTipEl();
    tip.hidden = false;
    tip.classList.add('is-visible');
    positionTip(el);
    requestAnimationFrame(() => positionTip(el));
  }

  function initPointerHandlers() {
    document.addEventListener('pointerover', (e) => {
      const el = e.target.closest?.(ACRONYM_SEL);
      if (el) showTip(el);
    }, true);

    document.addEventListener('pointerout', (e) => {
      const el = e.target.closest?.(ACRONYM_SEL);
      if (el && tipTarget === el) scheduleHideTip();
    }, true);

    document.addEventListener('focusin', (e) => {
      const el = e.target.closest?.(ACRONYM_SEL);
      if (el) showTip(el);
    });

    document.addEventListener('focusout', (e) => {
      const el = e.target.closest?.(ACRONYM_SEL);
      if (el && tipTarget === el) scheduleHideTip();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') hideTip();
    });

    window.addEventListener('scroll', () => {
      if (tipTarget) positionTip(tipTarget);
    }, true);

    window.addEventListener('resize', () => {
      if (tipTarget) positionTip(tipTarget);
    });
  }

  function boot() {
    if (!acronymList.length) return;
    markFirstOccurrences(document);
    renderGlossaryAnnexes();
    if (!handlersReady) {
      initPointerHandlers();
      handlersReady = true;
    }
  }

  function scheduleBoot() {
    boot();
    requestAnimationFrame(boot);
    setTimeout(boot, 400);
    setTimeout(boot, 1200);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', scheduleBoot);
  }

  let rescanScheduled = false;
  new MutationObserver(() => {
    if (rescanScheduled || !acronymList.length) return;
    rescanScheduled = true;
    requestAnimationFrame(() => {
      rescanScheduled = false;
      markFirstOccurrences(document);
      renderGlossaryAnnexes();
    });
  }).observe(document.documentElement, { childList: true, subtree: true });
})();
