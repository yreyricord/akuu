(function () {
  'use strict';

  const GINI_BUCKETS = {
    '#240000': 'Au-dessus de 50',
    '#700000': 'Entre 45 et 50',
    '#b80000': 'Entre 40 et 45',
    '#ff6829': 'Entre 35 et 40',
    '#ffb18f': 'Entre 30 et 35',
    '#ffdbcc': 'En dessous de 30',
    '#b9b9b9': 'Pas de données',
  };

  const displayNames = typeof Intl !== 'undefined' && Intl.DisplayNames
    ? new Intl.DisplayNames(['fr'], { type: 'region' })
    : null;

  let activeSlide = null;
  let tooltip = null;
  let wiredObject = null;

  function normalizeFill(fill) {
    if (!fill) return '';
    const hex = fill.trim().toLowerCase();
    if (hex.startsWith('#')) return hex.slice(0, 7);
    const match = hex.match(/rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
    if (!match) return hex;
    const toHex = (n) => Number(n).toString(16).padStart(2, '0');
    return `#${toHex(match[1])}${toHex(match[2])}${toHex(match[3])}`;
  }

  function bucketLabel(fill) {
    const key = normalizeFill(fill);
    return GINI_BUCKETS[key] || 'Pas de données';
  }

  function countryCode(el) {
    if (el.id && el.id.length === 2) return el.id.toLowerCase();
    const fromClass = [...el.classList].find((c) => c !== 'land' && c.length === 2);
    if (fromClass) return fromClass.toLowerCase();
    const parent = el.closest('g[id]');
    if (parent?.id && parent.id.length === 2) return parent.id.toLowerCase();
    return '';
  }

  function countryName(el, code) {
    const root = el.closest('g[id]') || el;
    const title = root.querySelector(':scope > title');
    if (title?.textContent?.trim()) return title.textContent.trim();
    if (displayNames && code) {
      try {
        return displayNames.of(code.toUpperCase()) || code.toUpperCase();
      } catch (_) {
        return code.toUpperCase();
      }
    }
    return code ? code.toUpperCase() : 'Pays';
  }

  function readFill(el) {
    const style = el.getAttribute('style') || '';
    const inline = style.match(/fill:\s*([^;]+)/i);
    if (inline) return inline[1].trim();
    const path = el.querySelector('path[style*="fill"]') || el;
    const pathStyle = path.getAttribute('style') || '';
    const pathFill = pathStyle.match(/fill:\s*([^;]+)/i);
    return pathFill ? pathFill[1].trim() : '';
  }

  function collectCountries(svgDoc) {
    const seen = new Set();
    const items = [];

    svgDoc.querySelectorAll('path.land, g.land').forEach((el) => {
      const code = countryCode(el);
      if (!code || seen.has(code)) return;
      seen.add(code);
      items.push({ el, code });
    });

    return items;
  }

  function injectSvgStyles(svgDoc) {
    if (svgDoc.getElementById('gini-interactive-style')) return;
    const style = svgDoc.createElementNS('http://www.w3.org/2000/svg', 'style');
    style.id = 'gini-interactive-style';
    style.textContent = `
      path.land, g.land path { cursor: pointer; transition: opacity 0.15s ease, filter 0.15s ease; }
      .gini-country--dim { opacity: 0.38 !important; }
      .gini-country--active { opacity: 1 !important; filter: brightness(1.08) drop-shadow(0 0 6px rgba(0,0,0,0.25)); }
    `;
    svgDoc.documentElement.appendChild(style);
  }

  function setDim(countries, activeCode) {
    countries.forEach(({ el, code }) => {
      el.classList.remove('gini-country--active', 'gini-country--dim');
      if (!activeCode) return;
      el.classList.add(code === activeCode ? 'gini-country--active' : 'gini-country--dim');
    });
  }

  function positionTooltip(target, slide) {
    if (!tooltip || !target) return;
    const rect = target.getBoundingClientRect();
    const stage = slide.querySelector('[data-gini-stage]');
    const stageRect = stage?.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top;
    tooltip.style.left = `${x}px`;
    tooltip.style.top = `${y}px`;
    if (stageRect) {
      tooltip.style.transform = y - stageRect.top < 72
        ? 'translate(-50%, 12px)'
        : 'translate(-50%, calc(-100% - 12px))';
    }
  }

  function showTooltip(slide, name, bucket, target) {
    if (!tooltip) tooltip = slide.querySelector('[data-gini-tooltip]');
    if (!tooltip) return;

    let strong = tooltip.querySelector('strong');
    let span = tooltip.querySelector('span');
    if (!strong) {
      strong = document.createElement('strong');
      tooltip.appendChild(strong);
    }
    if (!span) {
      span = document.createElement('span');
      tooltip.appendChild(span);
    }
    strong.textContent = name;
    span.textContent = bucket;
    tooltip.hidden = false;
    positionTooltip(target, slide);
  }

  function hideTooltip(slide) {
    if (!tooltip) tooltip = slide?.querySelector('[data-gini-tooltip]');
    if (tooltip) tooltip.hidden = true;
  }

  function wireObject(slide, obj) {
    const svgDoc = obj.contentDocument;
    if (!svgDoc?.documentElement || obj.dataset.giniReady === '1') return;

    injectSvgStyles(svgDoc);
    const countries = collectCountries(svgDoc);
    if (!countries.length) return;

    obj.dataset.giniReady = '1';
    wiredObject = obj;

    const onEnter = (item, eventTarget) => {
      const fill = readFill(item.el);
      const bucket = bucketLabel(fill);
      const name = countryName(item.el, item.code);
      setDim(countries, item.code);
      showTooltip(slide, name, bucket, eventTarget);
    };

    const onLeave = () => {
      setDim(countries, null);
      hideTooltip(slide);
    };

    countries.forEach((item) => {
      const targets = item.el.tagName === 'path' ? [item.el] : item.el.querySelectorAll('path');
      const list = targets.length ? targets : [item.el];
      list.forEach((node) => {
        node.addEventListener('mouseenter', () => onEnter(item, node));
        node.addEventListener('mousemove', () => positionTooltip(node, slide));
        node.addEventListener('mouseleave', onLeave);
        node.addEventListener('focus', () => onEnter(item, node));
        node.addEventListener('blur', onLeave);
      });
      item.el.setAttribute('tabindex', '0');
      item.el.setAttribute('role', 'img');
      item.el.setAttribute('aria-label', countryName(item.el, item.code));
    });
  }

  function initSlide(slide) {
    if (!slide?.hasAttribute('data-gini-map')) return;
    activeSlide = slide;
    const obj = slide.querySelector('[data-gini-object]');
    if (!obj) return;

    if (obj.contentDocument?.documentElement) {
      wireObject(slide, obj);
    } else {
      obj.addEventListener('load', () => wireObject(slide, obj), { once: true });
    }
  }

  function teardown() {
    if (wiredObject?.contentDocument) {
      wiredObject.contentDocument.querySelectorAll('.gini-country--active, .gini-country--dim')
        .forEach((el) => el.classList.remove('gini-country--active', 'gini-country--dim'));
    }
    hideTooltip(activeSlide);
    activeSlide = null;
  }

  function onSlideChange(e) {
    teardown();
    initSlide(e.detail?.slide);
  }

  function boot() {
    const active = document.querySelector('section[data-deck-active][data-gini-map]');
    if (active) initSlide(active);
  }

  document.addEventListener('slidechange', onSlideChange);
  window.addEventListener('resize', () => {
    if (!activeSlide || tooltip?.hidden) return;
    const hovered = wiredObject?.contentDocument?.querySelector('.gini-country--active');
    if (hovered) positionTooltip(hovered, activeSlide);
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
