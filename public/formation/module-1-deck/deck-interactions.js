/**
 * Interactions deck AKUU : délégation d'événements (fiable en fullscreen / x-dc).
 */
(function () {
  const carouselIdx = new WeakMap();

  let tipEl = null;
  let tipTarget = null;
  let tipHideTimer = null;
  /* SRC_SEL : uniquement les boutons "Source" explicites (survol/focus individuel, legacy). */
  const SRC_SEL = '.src-tip:not(.deck-vs__bubble)';
  /* PANEL_SEL : tout élément porteur d'une citation, agrégé dans le panneau de sources par diapo. */
  const PANEL_SEL = '[data-src]:not(.deck-vs__bubble), [data-src-id]:not(.deck-vs__bubble)';

  /* ---------- Registre de sources (public/formation/sources.json) ---------- */
  let sourcesData = null; // Map<id, {citation,title,summary,url}> une fois chargé ; null tant que le fetch n'a pas résolu.
  fetch('../sources.json')
    .then((res) => (res.ok ? res.json() : {}))
    .then((json) => {
      sourcesData = new Map(Object.entries(json));
      const active = document.querySelector('section[data-deck-active]');
      if (active) renderSlideSourcePanel(active);
    })
    .catch(() => { sourcesData = new Map(); }); // hors-ligne / fichier absent : repli sur le texte simple, jamais bloquant.

  function getTipEl() {
    if (!tipEl) {
      tipEl = document.createElement('div');
      tipEl.className = 'deck-src-tooltip';
      tipEl.setAttribute('role', 'tooltip');
      tipEl.id = 'deck-src-tooltip';
      tipEl.addEventListener('pointerenter', () => { clearTimeout(tipHideTimer); });
      tipEl.addEventListener('pointerleave', scheduleHideTip);
    }
    if (tipEl.parentNode !== document.body) document.body.appendChild(tipEl);
    return tipEl;
  }

  function hideTip() {
    clearTimeout(tipHideTimer);
    tipTarget = null;
    if (!tipEl) return;
    tipEl.classList.remove('is-visible', 'deck-src-tooltip--rich');
  }

  function scheduleHideTip() {
    clearTimeout(tipHideTimer);
    tipHideTimer = setTimeout(hideTip, 180);
  }

  function positionTip(el) {
    const tip = getTipEl();
    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) return;
    const tw = tip.offsetWidth;
    const th = tip.offsetHeight;
    let left = r.left + r.width / 2 - tw / 2;
    let top = r.top - th - 12;
    if (top < 8) top = r.bottom + 12;
    left = Math.max(8, Math.min(left, window.innerWidth - tw - 8));
    tip.style.left = `${left}px`;
    tip.style.top = `${top}px`;
  }

  function renderTip(tip, el) {
    const srcId = el.getAttribute('data-src-id');
    const entry = srcId && sourcesData ? sourcesData.get(srcId) : null;
    if (entry) {
      tip.classList.add('deck-src-tooltip--rich');
      while (tip.firstChild) tip.removeChild(tip.firstChild);
      const citation = document.createElement('div');
      citation.className = 'deck-src-tooltip__citation';
      citation.textContent = entry.citation;
      const title = document.createElement('div');
      title.className = 'deck-src-tooltip__title';
      title.textContent = entry.title;
      tip.appendChild(citation);
      tip.appendChild(title);
      if (entry.summary) {
        const summary = document.createElement('p');
        summary.className = 'deck-src-tooltip__summary';
        summary.textContent = entry.summary;
        tip.appendChild(summary);
      }
      if (entry.url) {
        const link = document.createElement('a');
        link.className = 'deck-src-tooltip__link';
        link.href = entry.url;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.textContent = 'Lire l’étude →';
        tip.appendChild(link);
      }
      return;
    }
    tip.classList.remove('deck-src-tooltip--rich');
    tip.textContent = el.getAttribute('data-src') || '';
  }

  function showTip(el) {
    if (!el?.matches?.(SRC_SEL)) return;
    const active = document.querySelector('section[data-deck-active]');
    if (!active?.contains(el)) return;
    if (!el.getAttribute('data-src') && !el.getAttribute('data-src-id')) return;
    clearTimeout(tipHideTimer);
    tipTarget = el;
    const tip = getTipEl();
    renderTip(tip, el);
    tip.classList.add('is-visible');
    positionTip(el);
    requestAnimationFrame(() => positionTip(el));
  }

  /** Ouvre le lien de la source associée à `el`, si le registre l'a résolue. */
  function openSourceLink(el) {
    const srcId = el?.getAttribute('data-src-id');
    const entry = srcId && sourcesData ? sourcesData.get(srcId) : null;
    if (entry?.url) window.open(entry.url, '_blank', 'noopener,noreferrer');
  }

  /* ---------- Panneau de sources par diapo (bouton bas-droite) ---------- */
  let panelBtnEl = null;
  let panelBoxEl = null;
  let panelListEl = null;
  let panelBadgeEl = null;
  let panelIsOpen = false;

  function getSourcePanelEls() {
    if (panelBtnEl) return;
    panelBtnEl = document.createElement('button');
    panelBtnEl.type = 'button';
    panelBtnEl.className = 'deck-src-panel__btn';
    panelBtnEl.setAttribute('aria-haspopup', 'true');
    panelBtnEl.setAttribute('aria-expanded', 'false');
    panelBtnEl.setAttribute('aria-label', 'Afficher les sources de cette diapositive');

    const icon = document.createElement('span');
    icon.className = 'deck-src-panel__icon';
    icon.setAttribute('aria-hidden', 'true');
    icon.textContent = '”';
    panelBadgeEl = document.createElement('span');
    panelBadgeEl.className = 'deck-src-panel__badge';
    panelBtnEl.appendChild(icon);
    panelBtnEl.appendChild(panelBadgeEl);
    panelBtnEl.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleSourcePanel();
    });

    panelBoxEl = document.createElement('div');
    panelBoxEl.className = 'deck-src-panel';
    panelBoxEl.setAttribute('role', 'dialog');
    panelBoxEl.setAttribute('aria-label', 'Sources de cette diapositive');

    const heading = document.createElement('div');
    heading.className = 'deck-src-panel__heading';
    heading.textContent = 'Sources';
    panelListEl = document.createElement('div');
    panelListEl.className = 'deck-src-panel__list';
    panelBoxEl.appendChild(heading);
    panelBoxEl.appendChild(panelListEl);
  }

  function closeSourcePanel() {
    if (!panelIsOpen) return;
    panelIsOpen = false;
    panelBoxEl?.classList.remove('is-open');
    panelBtnEl?.setAttribute('aria-expanded', 'false');
  }

  function toggleSourcePanel() {
    getSourcePanelEls();
    panelIsOpen = !panelIsOpen;
    panelBoxEl.classList.toggle('is-open', panelIsOpen);
    panelBtnEl.setAttribute('aria-expanded', String(panelIsOpen));
  }

  /** Liste dédupliquée (ordre d'apparition) des sources portées par les éléments `PANEL_SEL` d'une diapo. */
  function collectSlideSources(slide) {
    const seen = new Map();
    slide.querySelectorAll(PANEL_SEL).forEach((el) => {
      const id = el.getAttribute('data-src-id');
      const key = id || el.getAttribute('data-src');
      if (!key || seen.has(key)) return;
      const entry = id && sourcesData ? sourcesData.get(id) : null;
      seen.set(key, entry || { citation: el.getAttribute('data-src') || '' });
    });
    return [...seen.values()];
  }

  function renderSlideSourcePanel(slide) {
    if (!slide) return;
    getSourcePanelEls();
    const list = collectSlideSources(slide);
    if (!list.length) {
      panelBtnEl.remove();
      panelBoxEl.remove();
      closeSourcePanel();
      return;
    }
    while (panelListEl.firstChild) panelListEl.removeChild(panelListEl.firstChild);
    list.forEach((entry) => {
      const hasLink = !!entry.url;
      const row = document.createElement(hasLink ? 'a' : 'div');
      row.className = 'deck-src-panel__row';
      if (hasLink) {
        row.href = entry.url;
        row.target = '_blank';
        row.rel = 'noopener noreferrer';
      }
      if (entry.citation) {
        const cite = document.createElement('div');
        cite.className = 'deck-src-panel__citation';
        cite.textContent = entry.citation;
        row.appendChild(cite);
      }
      if (entry.title) {
        const title = document.createElement('div');
        title.className = 'deck-src-panel__title';
        title.textContent = entry.title;
        row.appendChild(title);
      }
      if (entry.summary) {
        const summary = document.createElement('div');
        summary.className = 'deck-src-panel__summary';
        summary.textContent = entry.summary;
        row.appendChild(summary);
      }
      panelListEl.appendChild(row);
    });
    panelBadgeEl.textContent = String(list.length);
    if (panelBtnEl.parentNode !== slide) slide.appendChild(panelBtnEl);
    if (panelBoxEl.parentNode !== slide) slide.appendChild(panelBoxEl);
  }

  /* ---------- Panneaux d'aide contextuelle (bas-gauche, ?) ---------- */
  function closeHelpPanels(root = document) {
    root.querySelectorAll('[data-deck-help-panel].is-open').forEach((panel) => {
      panel.classList.remove('is-open');
      panel.setAttribute('aria-hidden', 'true');
      const slide = panel.closest('section');
      const panelId = panel.id;
      const btn = panelId && slide
        ? slide.querySelector(`[data-deck-help-btn][aria-controls="${panelId}"]`)
        : slide?.querySelector('[data-deck-help-btn][aria-expanded="true"]');
      btn?.setAttribute('aria-expanded', 'false');
    });
  }

  function initHelpPanels(slide) {
    if (!slide) return;
    slide.querySelectorAll('[data-deck-help-btn]').forEach((btn) => {
      if (btn.dataset.deckHelpReady === '1') return;
      const panelId = btn.getAttribute('aria-controls');
      const panel = panelId
        ? slide.querySelector(`#${CSS.escape(panelId)}`)
        : slide.querySelector('[data-deck-help-panel]');
      if (!panel) return;
      btn.dataset.deckHelpReady = '1';

      let isOpen = false;

      function closeHelp() {
        if (!isOpen) return;
        isOpen = false;
        panel.classList.remove('is-open');
        panel.setAttribute('aria-hidden', 'true');
        btn.setAttribute('aria-expanded', 'false');
      }

      function toggleHelp(e) {
        e.stopPropagation();
        isOpen = !isOpen;
        panel.classList.toggle('is-open', isOpen);
        panel.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
        btn.setAttribute('aria-expanded', String(isOpen));
      }

      btn.addEventListener('click', toggleHelp);
      document.addEventListener('click', (e) => {
        if (!isOpen) return;
        if (panel.contains(e.target) || btn.contains(e.target)) return;
        closeHelp();
      });
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeHelp();
      });
    });
  }

  function initSourcePanelGlobalHandlers() {
    document.addEventListener('click', (e) => {
      if (!panelIsOpen) return;
      if (panelBoxEl?.contains(e.target) || e.target === panelBtnEl || panelBtnEl?.contains(e.target)) return;
      closeSourcePanel();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && panelIsOpen) {
        closeSourcePanel();
        panelBtnEl?.focus();
      }
    });
  }

  function findSrcUnderPointer(x, y) {
    const active = document.querySelector('section[data-deck-active]');
    if (!active) return null;
    const hit = document.elementFromPoint(x, y);
    if (!hit) return null;
    if (tipEl && tipEl.contains(hit)) return 'tip';
    if (!active.contains(hit)) return null;
    const el = hit.closest(SRC_SEL);
    return el && active.contains(el) ? el : null;
  }

  function onSourcePointerMove(e) {
    if (e.pointerType === 'touch') return;
    const el = findSrcUnderPointer(e.clientX, e.clientY);
    if (el === 'tip') {
      clearTimeout(tipHideTimer);
    } else if (el) {
      if (tipTarget !== el) showTip(el);
      else positionTip(el);
    } else if (tipTarget) {
      scheduleHideTip();
    }
  }

  function markSourceEls(root = document) {
    const active = root.matches?.('section[data-deck-active]')
      ? root
      : root.querySelector?.('section[data-deck-active]') || document.querySelector('section[data-deck-active]');
    if (!active) return;
    active.querySelectorAll(SRC_SEL).forEach((el) => {
      el.classList.add('src-data');
      if (!el.hasAttribute('tabindex') && !el.matches('a[href], button, input, select, textarea')) {
        el.setAttribute('tabindex', '0');
      }
    });
  }

  function initSources(root = document) {
    markSourceEls(root);
  }

  function initSourcePointer() {
    if (document.documentElement.dataset.deckSrcPointer) return;
    document.documentElement.dataset.deckSrcPointer = '1';
    document.addEventListener('pointermove', onSourcePointerMove, { passive: true });
    document.addEventListener('pointerdown', (e) => {
      const el = findSrcUnderPointer(e.clientX, e.clientY);
      if (el === 'tip') return; // laisser le lien/la carte gérer son propre clic
      if (el) showTip(el);
      else hideTip();
    }, { passive: true });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { hideTip(); return; }
      if (e.key !== 'Enter' && e.key !== ' ') return;
      const el = document.activeElement?.closest?.(SRC_SEL);
      if (!el || !el.getAttribute('data-src-id')) return;
      e.preventDefault();
      openSourceLink(el);
    });
    document.addEventListener('focusin', (e) => {
      const el = e.target?.closest?.(SRC_SEL);
      const active = document.querySelector('section[data-deck-active]');
      if (el && active?.contains(el)) showTip(el);
    });
    document.addEventListener('focusout', () => {
      requestAnimationFrame(() => {
        if (!document.activeElement?.closest?.(SRC_SEL)) hideTip();
      });
    });
  }

  function stopDeckNav(e) {
    e.stopPropagation();
  }

  /* ---------- Toggle Carte / Répartition ---------- */
  function showPanel(section, id) {
    if (!section) return;
    section.querySelectorAll('[data-deck-panel]').forEach((p) => {
      const on = p.dataset.deckPanel === id;
      p.hidden = !on;
      p.classList.toggle('deck-panel--active', on);
    });
    section.querySelectorAll('[data-deck-toggle]').forEach((b) => {
      const on = b.dataset.deckToggle === id;
      b.classList.toggle('deck-toggle__btn--active', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    if (id === 'stats') {
      section.querySelectorAll('.deck-bar__fill').forEach((f) => {
        const w = f.style.width;
        f.style.width = '0';
        requestAnimationFrame(() => { f.style.width = w; });
      });
    }
  }

  function resetToggle(section) {
    if (section?.querySelector('[data-deck-panel="map"]')) showPanel(section, 'map');
  }

  /* ---------- Question / Réponse ---------- */
  function resetReveal(section) {
    section?.querySelectorAll('[data-deck-reveal]').forEach((el) => {
      el.classList.remove('deck-reveal--revealed');
      el.querySelector('[data-deck-reveal-question]')?.removeAttribute('hidden');
      el.querySelector('[data-deck-reveal-answer]')?.setAttribute('hidden', '');
    });
  }

  function revealAnswer(reveal) {
    if (!reveal) return;
    reveal.classList.add('deck-reveal--revealed');
    reveal.querySelector('[data-deck-reveal-question]')?.setAttribute('hidden', '');
    reveal.querySelector('[data-deck-reveal-answer]')?.removeAttribute('hidden');
  }

  /* ---------- Carrousel ---------- */
  function padCarouselNum(n, total) {
    const w = Math.max(String(total).length, 2);
    return `${String(n).padStart(w, '0')} / ${String(total).padStart(w, '0')}`;
  }

  function initCarouselNumbers(carousel) {
    if (carousel.dataset.deckCarouselNumbered) return;
    const slides = [...carousel.querySelectorAll('.deck-carousel__slide')];
    const total = slides.length;
    if (!total) return;

    slides.forEach((slide, i) => {
      const card = slide.querySelector('.card');
      if (!card) return;
      let badge = card.querySelector('.deck-carousel__card-num');
      if (!badge) {
        badge = document.createElement('span');
        badge.className = 'deck-carousel__card-num';
        badge.setAttribute('aria-hidden', 'true');
        card.appendChild(badge);
      }
      badge.textContent = padCarouselNum(i + 1, total);
    });

    const nav = carousel.querySelector('.deck-carousel__nav');
    const dots = nav?.querySelector('.deck-carousel__dots');
    if (nav && dots && !nav.querySelector('[data-deck-carousel-count]')) {
      const count = document.createElement('span');
      count.className = 'deck-carousel__count';
      count.setAttribute('data-deck-carousel-count', '');
      count.setAttribute('aria-live', 'polite');
      nav.appendChild(count);
    }

    carousel.dataset.deckCarouselNumbered = '1';
  }

  function updateCarouselCount(carousel, i) {
    const el = carousel.querySelector('[data-deck-carousel-count]');
    const total = carousel.querySelectorAll('.deck-carousel__slide').length;
    if (el && total) el.textContent = padCarouselNum(i + 1, total);
  }

  function fitCarousel(carousel) {
    const stage = carousel.querySelector('.deck-carousel__stage');
    const viewport = carousel.querySelector('.deck-carousel__viewport');
    if (!stage || !viewport) return;
    const h = stage.getBoundingClientRect().height;
    if (h > 40) viewport.style.minHeight = `${Math.max(240, h)}px`;
  }

  /* ---------- Frise ↔ carrousel ---------- */
  function getSyncedTimeline(carousel) {
    if (!carousel?.hasAttribute('data-deck-sync-timeline')) return null;
    const section = carousel.closest('section');
    return section?.querySelector('[data-deck-timeline]') || null;
  }

  function getTimelineTheme(section) {
    const tag = section?.querySelector('.tag');
    const color = tag?.style?.color || '';
    if (color.includes('blue-akuu')) return { cardBg: 'var(--blue-akuu)', kicker: 'var(--ochre)' };
    if (color.includes('terracotta')) return { cardBg: 'var(--terracotta)', kicker: 'var(--ochre)' };
    return { cardBg: 'var(--green-forest)', kicker: 'var(--ochre)' };
  }

  function extractTimelineStep(slide, index, dots) {
    const dotLabel = dots[index]?.getAttribute('aria-label') || '';
    const card = slide.querySelector('.card');
    if (!card) return { year: dotLabel || String(index + 1), desc: '' };

    const tag = card.querySelector(':scope > .xs, .deck-ethno-card__head .xs')?.textContent
      ?.replace(/\s*\d+\s*·\s*/i, '')
      .trim() || '';
    const titles = [...card.querySelectorAll('[style*="Playfair Display"]')];
    const title = titles.find((el) => !el.style.fontSize?.includes('fs-4') && !el.style.fontSize?.includes('fs-6'))
      ?.textContent?.trim()
      || titles[0]?.textContent?.trim()
      || dotLabel;

    const roman = card.querySelector('[style*="fs-4"]');
    const period = card.querySelector(':scope > .small, :scope > div > .small');
    if (roman && period) {
      return {
        year: period.textContent.trim().split(/\s/)[0] || roman.textContent.trim(),
        desc: titles.find((el) => el.style.fontSize?.includes('fs-2'))?.textContent?.trim() || title,
      };
    }

    const statNum = card.querySelector('.deck-geoglyph-stat .num');
    if (statNum) {
      const statTitle = card.querySelector('.deck-geoglyph-stat [style*="Playfair"]')?.textContent?.trim();
      return {
        year: statNum.textContent.trim(),
        desc: statTitle || card.querySelector('.deck-geoglyph-stat .body')?.textContent?.trim().slice(0, 36) || title,
      };
    }

    const ethnoName = card.querySelector('.deck-ethno-card__head [style*="Playfair"]')?.textContent?.trim();
    if (ethnoName) {
      const place = card.querySelector('.deck-ethno-card__head .small')?.textContent?.trim() || '';
      return { year: ethnoName, desc: place };
    }

    return { year: dotLabel || tag || String(index + 1), desc: title };
  }

  function findTimelineInsertPoint(carousel, section) {
    const flexRow = [...section.children].find(
      (el) => getComputedStyle(el).display === 'flex' && el.contains(carousel),
    );
    if (flexRow) return { parent: section, before: flexRow };
    return { parent: carousel.parentElement, before: carousel };
  }

  function buildTimelineElement(steps, theme) {
    const n = steps.length;
    const wrap = document.createElement('div');
    wrap.className = 'card deck-timeline-wrap';
    wrap.style.background = theme.cardBg;
    wrap.style.marginBottom = '18px';
    wrap.style.flexShrink = '0';
    wrap.style.padding = '22px 28px 26px';

    const timeline = document.createElement('div');
    timeline.className = 'deck-timeline';
    timeline.dataset.deckTimeline = '';
    timeline.dataset.deckTimelineAuto = '';
    timeline.style.setProperty('--deck-timeline-cols', String(n));

    const years = document.createElement('div');
    years.className = 'deck-timeline__years';
    const rail = document.createElement('div');
    rail.className = 'deck-timeline__rail';
    const line = document.createElement('div');
    line.className = 'deck-timeline__line';
    const dotsRow = document.createElement('div');
    dotsRow.className = 'deck-timeline__dots';
    const descs = document.createElement('div');
    descs.className = 'deck-timeline__descs';

    steps.forEach((step) => {
      const y = document.createElement('div');
      y.textContent = step.year;
      years.appendChild(y);
      const dot = document.createElement('span');
      dot.className = 'deck-timeline__dot';
      dotsRow.appendChild(dot);
      const d = document.createElement('div');
      d.className = 'xs';
      d.style.color = 'var(--cream)';
      d.innerHTML = step.desc ? `<b>${step.desc}</b>` : '';
      descs.appendChild(d);
    });

    rail.append(line, dotsRow);
    timeline.append(years, rail, descs);
    wrap.append(timeline);
    return wrap;
  }

  function initAutoTimelines(root) {
    root.querySelectorAll('[data-deck-auto-timeline]').forEach((carousel) => {
      const section = carousel.closest('section');
      if (!section || section.querySelector('[data-deck-timeline]')) return;
      if (carousel.dataset.deckTimelineBuilt) return;

      const slides = [...carousel.querySelectorAll('.deck-carousel__slide')];
      const dots = [...carousel.querySelectorAll('.deck-carousel__dot')];
      if (!slides.length) return;

      const steps = slides.map((slide, i) => extractTimelineStep(slide, i, dots));
      const theme = getTimelineTheme(section);
      const wrap = buildTimelineElement(steps, theme);
      const { parent, before } = findTimelineInsertPoint(carousel, section);
      parent.insertBefore(wrap, before);

      carousel.setAttribute('data-deck-sync-timeline', '');
      carousel.dataset.deckTimelineBuilt = '1';
    });
  }

  function getTimelineStepCount(timeline) {
    return timeline?.querySelectorAll('.deck-timeline__dots .deck-timeline__dot').length || 0;
  }

  function getTimelineIndexForCarousel(carousel, slideIndex) {
    const slides = [...carousel.querySelectorAll('.deck-carousel__slide')];
    const slide = slides[slideIndex];
    if (slide?.hasAttribute('data-timeline-step')) {
      const step = parseInt(slide.dataset.timelineStep, 10);
      if (!Number.isNaN(step)) return step;
    }
    const timeline = getSyncedTimeline(carousel);
    const steps = timeline ? getTimelineStepCount(timeline) : slides.length;
    if (!steps || !slides.length) return 0;
    if (steps === slides.length) return slideIndex;
    if (slides.length === 1) return 0;
    return Math.round((slideIndex * (steps - 1)) / (slides.length - 1));
  }

  function getCarouselIndexForTimelineStep(carousel, stepIndex) {
    const slides = [...carousel.querySelectorAll('.deck-carousel__slide')];
    const explicit = slides.findIndex(
      (s) => parseInt(s.dataset.timelineStep, 10) === stepIndex,
    );
    if (explicit >= 0) return explicit;
    const timeline = getSyncedTimeline(carousel);
    const steps = timeline ? getTimelineStepCount(timeline) : slides.length;
    if (!slides.length) return 0;
    if (slides.length === 1) return 0;
    if (steps <= 1) return 0;
    return Math.round((stepIndex * (slides.length - 1)) / (steps - 1));
  }

  function updateTimelineFill(timeline, activeIdx, dots) {
    const line = timeline.querySelector('.deck-timeline__line');
    const activeDot = dots[activeIdx];
    if (!line || !activeDot || !dots.length) {
      timeline.style.setProperty('--deck-timeline-fill', '0%');
      return;
    }
    const lineRect = line.getBoundingClientRect();
    const dotRect = activeDot.getBoundingClientRect();
    if (!lineRect.width) {
      timeline.style.setProperty('--deck-timeline-fill', '0%');
      return;
    }
    const dotCenter = dotRect.left + dotRect.width / 2;
    const pct = Math.max(0, Math.min(100, ((dotCenter - lineRect.left) / lineRect.width) * 100));
    timeline.style.setProperty('--deck-timeline-fill', `${pct}%`);
  }

  function syncTimeline(carousel, slideIndex) {
    const timeline = getSyncedTimeline(carousel);
    if (!timeline) return;
    const years = [...timeline.querySelectorAll('.deck-timeline__years > div')];
    const dots = [...timeline.querySelectorAll('.deck-timeline__dots .deck-timeline__dot')];
    const descs = [...timeline.querySelectorAll('.deck-timeline__descs > div')];
    const cols = Math.max(years.length, dots.length, descs.length, 1);
    const activeIdx = Math.min(getTimelineIndexForCarousel(carousel, slideIndex), cols - 1);

    function paint(els, activeClass) {
      els.forEach((el, j) => {
        el.classList.remove(activeClass, 'deck-timeline__step--past');
        if (j < activeIdx) el.classList.add('deck-timeline__step--past');
        else if (j === activeIdx) el.classList.add(activeClass);
      });
    }
    paint(years, 'deck-timeline__step--active');
    paint(dots, 'deck-timeline__dot--sync-active');
    paint(descs, 'deck-timeline__step--active');

    /* Mesure après application des classes : la ligne (inset + flèche) et
     * la grille de points n'ont pas la même largeur ; un % théorique décale
     * la barre par rapport aux centres des jalons. */
    requestAnimationFrame(() => updateTimelineFill(timeline, activeIdx, dots));
  }

  function carouselGo(carousel, n) {
    const slides = [...carousel.querySelectorAll('.deck-carousel__slide')];
    const dots = [...carousel.querySelectorAll('.deck-carousel__dot')];
    if (!slides.length) return;
    const i = (n + slides.length) % slides.length;
    carouselIdx.set(carousel, i);
    const prevIdx = (i - 1 + slides.length) % slides.length;
    const nextIdx = (i + 1) % slides.length;
    slides.forEach((s, j) => {
      s.classList.remove(
        'deck-carousel__slide--active',
        'deck-carousel__slide--before',
        'deck-carousel__slide--after',
      );
      if (j === i) s.classList.add('deck-carousel__slide--active');
      else if (j === prevIdx) s.classList.add('deck-carousel__slide--before');
      else if (j === nextIdx) s.classList.add('deck-carousel__slide--after');
    });
    dots.forEach((d, j) => {
      d.classList.toggle('deck-carousel__dot--active', j === i);
      d.setAttribute('aria-selected', j === i ? 'true' : 'false');
    });
    initCarouselNumbers(carousel);
    updateCarouselCount(carousel, i);
    syncTimeline(carousel, i);
  }

  function resetCarousel(carousel) {
    carouselIdx.set(carousel, 0);
    carouselGo(carousel, 0);
    fitCarousel(carousel);
  }

  function initCarouselsIn(root) {
    root.querySelectorAll('[data-deck-carousel]').forEach((c) => {
      const isNew = !carouselIdx.has(c);
      if (isNew) carouselIdx.set(c, 0);
      carouselGo(c, carouselIdx.get(c) || 0);
      /* fitCarousel() forces a synchronous layout (getBoundingClientRect).
       * This runs once per carousel discovery, not on every call ; this fn
       * is invoked from a document-wide MutationObserver, so re-fitting on
       * every DOM mutation causes severe layout thrashing while React mounts
       * the full multi-slide deck. */
      if (isNew) fitCarousel(c);
    });
  }

  /* ---------- Swap images ---------- */
  function swapTo(root, id) {
    if (!root || !id) return;
    root.querySelectorAll('[data-deck-swap-item]').forEach((el) => {
      const on = el.dataset.deckSwapItem === id;
      el.classList.toggle('deck-swap__item--active', on);
      el.setAttribute('aria-hidden', on ? 'false' : 'true');
    });
    root.querySelectorAll('[data-deck-swap-thumb]').forEach((t) => {
      t.classList.toggle('deck-swap__thumb--active', t.dataset.deckSwapThumb === id);
    });
  }

  function resetSwap(root) {
    const first = root.querySelector('[data-deck-swap-item]');
    if (first) swapTo(root, first.dataset.deckSwapItem);
  }

  function initSwapIn(root) {
    root.querySelectorAll('[data-deck-swap]').forEach((swap) => {
      if (swap.dataset.deckSwapBound) return;
      swap.dataset.deckSwapBound = '1';
      swap.addEventListener('click', (e) => {
        const thumb = e.target.closest('[data-deck-swap-thumb]');
        if (!thumb) return;
        stopDeckNav(e);
        swapTo(swap, thumb.dataset.deckSwapThumb);
      }, true);
    });
  }

  /* ---------- VS boxe ---------- */
  const vsTimers = new WeakMap();

  function clearVsTimers(root) {
    const t = vsTimers.get(root);
    if (t) { t.forEach(clearTimeout); vsTimers.delete(root); }
  }

  function resetVs(root) {
    clearVsTimers(root);
    const section = root.closest('section');
    root.classList.remove(
      'deck-vs--intro', 'deck-vs--entering', 'deck-vs--vsflash', 'deck-vs--ready',
      'deck-vs--fight', 'deck-vs--rounds', 'deck-vs--punching', 'deck-vs--finish-ready',
      'deck-vs--verdict', 'deck-vs--ko', 'deck-vs--reveal', 'deck-vs--done', 'deck-vs--victory', 'deck-vs--hit'
    );
    root.querySelectorAll('.deck-vs__bubble').forEach((b) => {
      b.classList.remove('deck-vs__bubble--show', 'deck-vs__bubble--ko');
    });
    root.querySelectorAll('[data-deck-vs-glove]').forEach((g) => {
      g.disabled = true;
      g.classList.remove('deck-vs__glove--active');
    });
    root.querySelectorAll('.deck-vs__dmg-pop').forEach((el) => el.remove());
    const koBanner = root.querySelector('.deck-vs__ko-banner');
    const prompt = root.querySelector('[data-deck-vs-prompt]');
    const btn = root.querySelector('.deck-vs__start');
    const finishBtn = root.querySelector('[data-deck-vs-finish]');
    const verdict = root.querySelector('[data-deck-vs-verdict]');
    if (verdict) verdict.hidden = true;
    const hpMeggers = root.querySelector('[data-deck-vs-hp="meggers"]');
    const hpRoosevelt = root.querySelector('[data-deck-vs-hp="roosevelt"]');
    const pctMeggers = root.querySelector('[data-deck-vs-hp-pct="meggers"]');
    const pctRoosevelt = root.querySelector('[data-deck-vs-hp-pct="roosevelt"]');
    const roundEl = root.querySelector('[data-deck-vs-round]');
    if (koBanner) koBanner.hidden = true;
    if (prompt) prompt.hidden = true;
    if (btn) { btn.hidden = false; btn.disabled = false; }
    if (finishBtn) finishBtn.disabled = false;
    if (hpMeggers) { hpMeggers.style.transition = 'none'; hpMeggers.style.width = '100%'; }
    if (hpRoosevelt) { hpRoosevelt.style.transition = 'none'; hpRoosevelt.style.width = '100%'; }
    if (pctMeggers) pctMeggers.textContent = '100';
    if (pctRoosevelt) pctRoosevelt.textContent = '100';
    if (roundEl) roundEl.textContent = 'ROUND 1';
    root.dataset.vsStep = '0';
    root.dataset.vsTurn = '';
    root.dataset.meggersHp = '100';
    section?.classList.remove('deck-vs-slide--cinema', 'deck-vs-slide--victory');
    void root.offsetWidth;
    if (hpMeggers) hpMeggers.style.transition = '';
    if (hpRoosevelt) hpRoosevelt.style.transition = '';
  }

  function setMeggersHp(root, hp) {
    const val = Math.max(0, Math.min(100, hp));
    root.dataset.meggersHp = String(val);
    const fill = root.querySelector('[data-deck-vs-hp="meggers"]');
    const pct = root.querySelector('[data-deck-vs-hp-pct="meggers"]');
    if (fill) fill.style.width = `${val}%`;
    if (pct) pct.textContent = String(Math.round(val));
  }

  function updateVsGloves(root) {
    const turn = root.dataset.vsTurn;
    root.querySelectorAll('[data-deck-vs-glove]').forEach((g) => {
      const side = g.dataset.deckVsGlove;
      const active = turn === side;
      g.disabled = !active || root.classList.contains('deck-vs--ko') || root.classList.contains('deck-vs--victory');
      g.classList.toggle('deck-vs__glove--active', active && !g.disabled);
    });
    const prompt = root.querySelector('[data-deck-vs-prompt]');
    if (prompt) {
      if (!turn || !root.classList.contains('deck-vs--fight') || root.classList.contains('deck-vs--ko')) {
        prompt.hidden = true;
      } else {
        prompt.hidden = false;
        prompt.textContent = turn === 'meggers'
          ? 'Meggers attaque : cliquez le gant rouge'
          : 'Roosevelt répond : cliquez le gant bleu';
      }
    }
  }

  function showVsBubble(root, bubble, { hideOthers = true } = {}) {
    if (hideOthers) {
      root.querySelectorAll('.deck-vs__bubble').forEach((b) => {
        if (b === bubble) return;
        b.classList.remove('deck-vs__bubble--show', 'deck-vs__bubble--ko');
      });
    }
    bubble.classList.remove('deck-vs__bubble--show');
    void bubble.offsetWidth;
    bubble.classList.add('deck-vs__bubble--show');
  }

  function popVsDamage(root, dmg) {
    const hpLeft = root.querySelector('.deck-vs__hp--left');
    if (!hpLeft) return;
    const pop = document.createElement('span');
    pop.className = 'deck-vs__dmg-pop';
    pop.textContent = `-${dmg}`;
    hpLeft.appendChild(pop);
    const timers = vsTimers.get(root) || [];
    timers.push(setTimeout(() => pop.remove(), 950));
    vsTimers.set(root, timers);
  }

  function triggerVsKo(root) {
    const koBanner = root.querySelector('.deck-vs__ko-banner');
    const section = root.closest('section');
    const timers = vsTimers.get(root) || [];
    root.querySelectorAll('.deck-vs__bubble').forEach((b) => b.classList.remove('deck-vs__bubble--show', 'deck-vs__bubble--ko'));
    root.querySelectorAll('[data-deck-vs-glove]').forEach((g) => {
      g.disabled = true;
      g.classList.remove('deck-vs__glove--active');
    });
    const prompt = root.querySelector('[data-deck-vs-prompt]');
    if (prompt) prompt.hidden = true;
    root.classList.add('deck-vs--ko');
    setMeggersHp(root, 0);
    if (koBanner) koBanner.hidden = false;
    timers.push(setTimeout(() => {
      root.classList.add('deck-vs--done', 'deck-vs--victory');
      section?.classList.add('deck-vs-slide--victory');
    }, 2800));
    vsTimers.set(root, timers);
  }

  function vsGloveClick(root, side) {
    if (!root.classList.contains('deck-vs--fight')) return;
    if (root.classList.contains('deck-vs--ko') || root.classList.contains('deck-vs--victory')) return;
    if (root.dataset.vsTurn !== side) return;

    const bubbles = [...root.querySelectorAll('.deck-vs__bubble')];
    const step = parseInt(root.dataset.vsStep, 10) || 0;
    const bubble = bubbles[step];
    if (!bubble) return;

    const roundEl = root.querySelector('[data-deck-vs-round]');

    if (side === 'meggers') {
      showVsBubble(root, bubble);
      root.dataset.vsStep = String(step + 1);
      root.dataset.vsTurn = 'roosevelt';
      updateVsGloves(root);
      return;
    }

    /* La riposte de Roosevelt reste affichée à côté de l'affirmation de Meggers,
       qu'on marque KO au lieu de la faire disparaître. */
    const meggersBubble = bubbles[step - 1];
    if (meggersBubble) meggersBubble.classList.add('deck-vs__bubble--ko');
    showVsBubble(root, bubble, { hideOthers: false });

    const dmg = parseInt(bubble.dataset.vsDmg, 10) || 25;
    popVsDamage(root, dmg);
    const meggersHp = (parseInt(root.dataset.meggersHp, 10) || 100) - dmg;
    setMeggersHp(root, meggersHp);
    root.classList.remove('deck-vs--hit');
    void root.offsetWidth;
    root.classList.add('deck-vs--hit');
    const timers = vsTimers.get(root) || [];
    timers.push(setTimeout(() => root.classList.remove('deck-vs--hit'), 450));
    vsTimers.set(root, timers);

    const nextStep = step + 1;
    root.dataset.vsStep = String(nextStep);
    if (roundEl) roundEl.textContent = `ROUND ${Math.min(4, Math.floor(nextStep / 2) + 1)}`;

    if (nextStep >= bubbles.length) {
      root.dataset.vsTurn = '';
      updateVsGloves(root);
      root.classList.add('deck-vs--finish-ready');
      return;
    }

    root.dataset.vsTurn = 'meggers';
    updateVsGloves(root);
  }

  function triggerVsFinish(root) {
    if (!root.classList.contains('deck-vs--finish-ready')) return;
    root.classList.remove('deck-vs--finish-ready');
    const verdict = root.querySelector('[data-deck-vs-verdict]');
    if (verdict) {
      verdict.hidden = false;
      root.classList.add('deck-vs--verdict');
    }
    const timers = vsTimers.get(root) || [];
    timers.push(setTimeout(() => {
      root.classList.remove('deck-vs--verdict');
      if (verdict) verdict.hidden = true;
      triggerVsKo(root);
    }, 2200));
    vsTimers.set(root, timers);
  }

  function enterVsIntro(root) {
    resetVs(root);
    root.closest('section')?.classList.add('deck-vs-slide--cinema');
    const timers = vsTimers.get(root) || [];
    root.classList.add('deck-vs--entering');
    timers.push(setTimeout(() => {
      root.classList.remove('deck-vs--entering');
      root.classList.add('deck-vs--intro', 'deck-vs--vsflash');
      setMeggersHp(root, 100);
      const pctRoosevelt = root.querySelector('[data-deck-vs-hp-pct="roosevelt"]');
      const hpRoosevelt = root.querySelector('[data-deck-vs-hp="roosevelt"]');
      if (hpRoosevelt) hpRoosevelt.style.width = '100%';
      if (pctRoosevelt) pctRoosevelt.textContent = '100';
    }, 620));
    timers.push(setTimeout(() => {
      root.classList.add('deck-vs--ready');
    }, 1500));
    vsTimers.set(root, timers);
  }

  function runVsFightWithPunch(root, btn) {
    if (btn.disabled) return;
    btn.disabled = true;
    root.classList.add('deck-vs--punching');
    const timers = vsTimers.get(root) || [];
    timers.push(setTimeout(() => {
      root.classList.remove('deck-vs--punching');
      runVsFight(root);
    }, 480));
    vsTimers.set(root, timers);
  }

  function runVsFight(root) {
    const btn = root.querySelector('.deck-vs__start');
    const prompt = root.querySelector('[data-deck-vs-prompt]');
    if (btn) { btn.disabled = true; btn.hidden = true; }
    root.classList.remove('deck-vs--intro', 'deck-vs--vsflash', 'deck-vs--ready');
    root.classList.add('deck-vs--fight', 'deck-vs--rounds');
    root.dataset.vsStep = '0';
    root.dataset.vsTurn = 'meggers';
    if (prompt) prompt.hidden = false;
    updateVsGloves(root);
  }

  /* ---------- Figure plein écran + zoom ---------- */
  const FIG_ZOOM_STEPS = [1, 1.25, 1.5, 2, 2.5, 3, 4];
  const figLb = { el: null, scale: 1, x: 0, y: 0, drag: false, ptrId: null, startX: 0, startY: 0, originX: 0, originY: 0 };

  function mkFigBtn(label, attrs) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'deck-fig-lightbox__btn';
    b.textContent = label;
    Object.entries(attrs).forEach(([k, v]) => b.setAttribute(k, v));
    return b;
  }

  function ensureFigLightbox() {
    if (figLb.el) return figLb.el;

    const el = document.createElement('div');
    el.className = 'deck-fig-lightbox';
    el.hidden = true;
    el.setAttribute('data-deck-fig-lightbox', '');

    const toolbar = document.createElement('div');
    toolbar.className = 'deck-fig-lightbox__toolbar';

    const hint = document.createElement('span');
    hint.className = 'deck-fig-lightbox__hint';
    hint.textContent = 'Glisser pour déplacer · molette ou +/- pour zoomer';

    const zoomOut = mkFigBtn('−', { 'data-deck-fig-zoom-out': '', 'aria-label': 'Zoom arrière' });
    const zoomLabel = document.createElement('span');
    zoomLabel.className = 'deck-fig-lightbox__zoom-label';
    zoomLabel.setAttribute('data-deck-fig-zoom-label', '');
    zoomLabel.textContent = '100 %';
    const zoomIn = mkFigBtn('+', { 'data-deck-fig-zoom-in': '', 'aria-label': 'Zoom avant' });
    const zoomReset = mkFigBtn('100 %', { 'data-deck-fig-zoom-reset': '', 'aria-label': 'Réinitialiser' });
    const closeBtn = mkFigBtn('Fermer', { 'data-deck-fig-close': '', 'aria-label': 'Fermer' });
    closeBtn.classList.add('deck-fig-lightbox__btn--close');

    toolbar.append(hint, zoomOut, zoomLabel, zoomIn, zoomReset, closeBtn);

    const stage = document.createElement('div');
    stage.className = 'deck-fig-lightbox__stage';
    stage.setAttribute('data-deck-fig-pan', '');

    const img = document.createElement('img');
    img.className = 'deck-fig-lightbox__img';
    img.setAttribute('data-deck-fig-lightbox-img', '');
    img.alt = '';
    stage.appendChild(img);

    el.append(toolbar, stage);
    document.body.appendChild(el);
    figLb.el = el;

    stage.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      figLb.drag = true;
      figLb.ptrId = e.pointerId;
      figLb.startX = e.clientX;
      figLb.startY = e.clientY;
      figLb.originX = figLb.x;
      figLb.originY = figLb.y;
      stage.classList.add('is-dragging');
      stage.setPointerCapture(e.pointerId);
      e.preventDefault();
    });
    stage.addEventListener('pointermove', (e) => {
      if (!figLb.drag || e.pointerId !== figLb.ptrId) return;
      figLb.x = figLb.originX + (e.clientX - figLb.startX);
      figLb.y = figLb.originY + (e.clientY - figLb.startY);
      applyFigTransform();
    });
    stage.addEventListener('pointerup', endFigDrag);
    stage.addEventListener('pointercancel', endFigDrag);
    stage.addEventListener('wheel', (e) => {
      e.preventDefault();
      figZoomBy(e.deltaY < 0 ? 1 : -1);
    }, { passive: false });

    return el;
  }

  function endFigDrag(e) {
    if (figLb.ptrId != null && e.pointerId !== figLb.ptrId) return;
    figLb.drag = false;
    figLb.ptrId = null;
    figLb.el?.querySelector('[data-deck-fig-pan]')?.classList.remove('is-dragging');
  }

  function applyFigTransform() {
    const img = figLb.el?.querySelector('[data-deck-fig-lightbox-img]');
    const label = figLb.el?.querySelector('[data-deck-fig-zoom-label]');
    if (!img) return;
    img.style.transform = `translate(${figLb.x}px, ${figLb.y}px) scale(${figLb.scale})`;
    if (label) label.textContent = `${Math.round(figLb.scale * 100)} %`;
  }

  function resetFigTransform() {
    figLb.scale = 1;
    figLb.x = 0;
    figLb.y = 0;
    applyFigTransform();
  }

  function figZoomBy(dir) {
    const idx = FIG_ZOOM_STEPS.findIndex((s) => s >= figLb.scale - 0.001);
    const cur = idx === -1 ? 0 : idx;
    const next = Math.max(0, Math.min(FIG_ZOOM_STEPS.length - 1, cur + dir));
    figLb.scale = FIG_ZOOM_STEPS[next];
    applyFigTransform();
  }

  function openFigLightbox(src, alt) {
    const el = ensureFigLightbox();
    const img = el.querySelector('[data-deck-fig-lightbox-img]');
    if (!img) return;
    img.src = src;
    img.alt = alt || '';
    resetFigTransform();
    el.hidden = false;
    document.body.style.overflow = 'hidden';
  }

  function closeFigLightbox() {
    if (!figLb.el || figLb.el.hidden) return;
    figLb.el.hidden = true;
    document.body.style.overflow = '';
    endFigDrag({ pointerId: figLb.ptrId ?? -1 });
  }

  function isFigLightboxOpen() {
    return figLb.el && !figLb.el.hidden;
  }

  /* ---------- Slide enter ---------- */
  /* ---------- Galerie d'espèces : clic sur une carte affiche l'image à droite ---------- */
  function showSpeciesPic(card) {
    const section = card.closest('section');
    const viewer = section?.querySelector('[data-deck-pic-viewer]');
    if (!viewer) return;
    section.querySelectorAll('[data-deck-pic]').forEach((c) => c.classList.remove('is-active'));
    card.classList.add('is-active');
    const label = card.getAttribute('data-deck-pic-label') || '';
    const src = card.getAttribute('data-deck-pic');
    const labelEl = viewer.querySelector('.deck-pic-viewer__label');
    if (labelEl) labelEl.textContent = label;
    const img = viewer.querySelector('.deck-pic-viewer__img');
    if (img && src) {
      viewer.classList.remove('is-ready'); // fondu sortant
      img.onload = () => { viewer.classList.add('has-image', 'is-ready'); };
      img.onerror = () => { viewer.classList.remove('has-image'); viewer.classList.add('is-ready'); };
      // rAF pour laisser le fondu se jouer avant de changer la source
      requestAnimationFrame(() => { img.alt = label; img.src = src; });
    }
  }

  function initPicViewer(slide) {
    const cards = slide.querySelectorAll('[data-deck-pic]');
    if (!cards.length) return;
    cards.forEach((c) => {
      if (!c.hasAttribute('tabindex')) c.setAttribute('tabindex', '0');
      c.setAttribute('role', 'button');
    });
    const current = slide.querySelector('[data-deck-pic].is-active') || cards[0];
    showSpeciesPic(current);
  }

  function onSlideActive(slide) {
    if (!slide) return;
    initSources(slide);
    renderSlideSourcePanel(slide);
    initHelpPanels(slide);
    initPicViewer(slide);
    resetToggle(slide);
    resetReveal(slide);
    slide.querySelectorAll('[data-deck-carousel]').forEach(resetCarousel);
    slide.querySelectorAll('[data-deck-swap]').forEach(resetSwap);
    slide.querySelectorAll('[data-deck-vs]').forEach((v) => {
      if (slide.hasAttribute('data-deck-active')) enterVsIntro(v);
      else resetVs(v);
    });
  }

  function onSlideChange(e) {
    hideTip();
    closeSourcePanel();
    closeFigLightbox();
    closeHelpPanels();
    onSlideActive(e.detail?.slide);
  }

  /* ---------- Délégation clic (capture) ---------- */
  function handleDeckClick(e) {
    const picCard = e.target.closest('[data-deck-pic]');
    if (picCard) {
      stopDeckNav(e);
      showSpeciesPic(picCard);
      return;
    }

    const toggleBtn = e.target.closest('[data-deck-toggle]');
    if (toggleBtn) {
      stopDeckNav(e);
      showPanel(toggleBtn.closest('section'), toggleBtn.dataset.deckToggle);
      return;
    }

    const revealBtn = e.target.closest('[data-deck-reveal-btn]');
    if (revealBtn) {
      stopDeckNav(e);
      revealAnswer(revealBtn.closest('[data-deck-reveal]'));
      return;
    }

    if (e.target.closest('[data-deck-fig-close]')) {
      stopDeckNav(e);
      closeFigLightbox();
      return;
    }
    if (e.target.closest('[data-deck-fig-zoom-in]')) {
      stopDeckNav(e);
      figZoomBy(1);
      return;
    }
    if (e.target.closest('[data-deck-fig-zoom-out]')) {
      stopDeckNav(e);
      figZoomBy(-1);
      return;
    }
    if (e.target.closest('[data-deck-fig-zoom-reset]')) {
      stopDeckNav(e);
      resetFigTransform();
      return;
    }
    const figOpen = e.target.closest('[data-deck-fig-open], [data-deck-fig-src]');
    if (figOpen) {
      stopDeckNav(e);
      const wrap = figOpen.closest('[data-deck-fig-zoom]');
      const img = wrap?.querySelector('[data-deck-fig-src]');
      if (img?.src) openFigLightbox(img.src, img.alt);
      return;
    }

    const prev = e.target.closest('.deck-carousel__prev');
    if (prev) {
      stopDeckNav(e);
      const carousel = prev.closest('[data-deck-carousel]');
      if (carousel) carouselGo(carousel, (carouselIdx.get(carousel) || 0) - 1);
      return;
    }

    const next = e.target.closest('.deck-carousel__next');
    if (next) {
      stopDeckNav(e);
      const carousel = next.closest('[data-deck-carousel]');
      if (carousel) carouselGo(carousel, (carouselIdx.get(carousel) || 0) + 1);
      return;
    }

    const dot = e.target.closest('.deck-carousel__dot');
    if (dot) {
      stopDeckNav(e);
      const carousel = dot.closest('[data-deck-carousel]');
      if (carousel) {
        const dots = [...carousel.querySelectorAll('.deck-carousel__dot')];
        carouselGo(carousel, dots.indexOf(dot));
      }
      return;
    }

    const timelineCol = e.target.closest(
      '.deck-timeline__years > div, .deck-timeline__dots .deck-timeline__dot, .deck-timeline__descs > div',
    );
    if (timelineCol?.closest('[data-deck-timeline]')) {
      stopDeckNav(e);
      const timeline = timelineCol.closest('[data-deck-timeline]');
      const section = timeline?.closest('section');
      const carousel = section?.querySelector('[data-deck-sync-timeline]');
      if (!carousel || !timeline) return;
      const lists = [
        [...timeline.querySelectorAll('.deck-timeline__years > div')],
        [...timeline.querySelectorAll('.deck-timeline__dots .deck-timeline__dot')],
        [...timeline.querySelectorAll('.deck-timeline__descs > div')],
      ];
      const stepIndex = lists.reduce((idx, list) => {
        const i = list.indexOf(timelineCol);
        return i >= 0 ? i : idx;
      }, -1);
      if (stepIndex >= 0) carouselGo(carousel, getCarouselIndexForTimelineStep(carousel, stepIndex));
      return;
    }

    const viewport = e.target.closest('.deck-carousel__viewport');
    if (viewport) {
      const carousel = viewport.closest('[data-deck-carousel]');
      if (carousel) {
        const cur = carouselIdx.get(carousel) || 0;
        const slideEl = e.target.closest('.deck-carousel__slide');
        if (slideEl?.classList.contains('deck-carousel__slide--before')) {
          stopDeckNav(e);
          carouselGo(carousel, cur - 1);
          return;
        }
        if (slideEl?.classList.contains('deck-carousel__slide--after')) {
          stopDeckNav(e);
          carouselGo(carousel, cur + 1);
          return;
        }
        const rect = viewport.getBoundingClientRect();
        const ratio = (e.clientX - rect.left) / Math.max(rect.width, 1);
        if (ratio < 0.2) {
          stopDeckNav(e);
          carouselGo(carousel, cur - 1);
          return;
        }
        if (ratio > 0.8) {
          stopDeckNav(e);
          carouselGo(carousel, cur + 1);
          return;
        }
      }
    }

    const thumb = e.target.closest('[data-deck-swap-thumb]');
    if (thumb) {
      stopDeckNav(e);
      const swap = thumb.closest('[data-deck-swap]');
      if (swap) swapTo(swap, thumb.dataset.deckSwapThumb);
      return;
    }

    const fight = e.target.closest('.deck-vs__start');
    if (fight) {
      stopDeckNav(e);
      const vs = fight.closest('[data-deck-vs]');
      if (vs) runVsFightWithPunch(vs, fight);
      return;
    }

    const glove = e.target.closest('[data-deck-vs-glove]');
    if (glove) {
      stopDeckNav(e);
      const vs = glove.closest('[data-deck-vs]');
      if (vs) vsGloveClick(vs, glove.dataset.deckVsGlove);
      return;
    }

    const finish = e.target.closest('[data-deck-vs-finish]');
    if (finish) {
      stopDeckNav(e);
      const vs = finish.closest('[data-deck-vs]');
      if (vs) triggerVsFinish(vs);
    }
  }

  document.addEventListener('click', handleDeckClick, true);
  document.addEventListener('keydown', (e) => {
    if (!isFigLightboxOpen()) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      closeFigLightbox();
      return;
    }
    if (e.key === '+' || e.key === '=') {
      e.preventDefault();
      figZoomBy(1);
      return;
    }
    if (e.key === '-') {
      e.preventDefault();
      figZoomBy(-1);
    }
  });
  document.addEventListener('pointerup', (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    const thumb = e.target.closest('[data-deck-swap-thumb]');
    if (!thumb) return;
    stopDeckNav(e);
    const swap = thumb.closest('[data-deck-swap]');
    if (swap) swapTo(swap, thumb.dataset.deckSwapThumb);
  }, true);

  function initPicViewerKeyboard() {
    if (document.documentElement.dataset.deckPicKb) return;
    document.documentElement.dataset.deckPicKb = '1';
    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      const card = document.activeElement?.closest?.('[data-deck-pic]');
      if (!card) return;
      e.preventDefault();
      showSpeciesPic(card);
    });
  }

  function boot() {
    initSourcePointer();
    initSourcePanelGlobalHandlers();
    initPicViewerKeyboard();
    initSources(document);
    initAutoTimelines(document);
    initCarouselsIn(document);
    initSwapIn(document);
    document.querySelectorAll('[data-deck-swap]').forEach(resetSwap);
    document.querySelectorAll('section').forEach((s) => {
      if (s.querySelector('[data-deck-panel="map"]')) showPanel(s, 'map');
    });
    const active = document.querySelector('section[data-deck-active]');
    if (active) onSlideActive(active);
  }

  function hookStage() {
    const stage = document.querySelector('deck-stage');
    if (!stage || stage.dataset.interactionsHooked) return;
    stage.dataset.interactionsHooked = '1';
    stage.addEventListener('slidechange', onSlideChange);
    stage.addEventListener('click', handleDeckClick, true);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { boot(); hookStage(); });
  } else {
    boot();
    hookStage();
  }

  document.addEventListener('slidechange', onSlideChange);

  let mutationRescanScheduled = false;
  new MutationObserver(() => {
    /* Coalesce bursts of mutations (e.g. React mounting the full multi-slide
     * deck) into one rescan per frame instead of one per mutation record ;
     * each rescan walks the whole document, so running it on every single
     * mutation makes initial mount cost scale with document size squared. */
    if (mutationRescanScheduled) return;
    mutationRescanScheduled = true;
    requestAnimationFrame(() => {
      mutationRescanScheduled = false;
      hookStage();
      initSources(document);
      initAutoTimelines(document);
      initCarouselsIn(document);
      initSwapIn(document);
    });
  }).observe(document.documentElement, { childList: true, subtree: true });

  window.addEventListener('resize', () => {
    if (tipTarget) positionTip(tipTarget);
    else hideTip();
    const active = document.querySelector('section[data-deck-active]');
    active?.querySelectorAll('[data-deck-sync-timeline]').forEach((carousel) => {
      syncTimeline(carousel, carouselIdx.get(carousel) || 0);
    });
  });
  document.addEventListener('scroll', () => {
    if (tipTarget) positionTip(tipTarget);
  }, true);
})();
