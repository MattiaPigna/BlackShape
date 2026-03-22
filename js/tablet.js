"use strict";
// BlackShape — Tablet View Logic
// Master-detail iPad app for the barbershop catalog

/** @type {number|null} */
let selectedId = null;

/** @type {boolean} */
let isMobileLayout = false;

// ── DOM refs (populated after DOMContentLoaded) ──
let sidebarEl   = null;
let detailEl    = null;

// ── Renders ──────────────────────────────────────

function renderSidebarList() {
  return HAIRCUTS.map(cut => `
    <div class="t-cut-item${cut.id === selectedId ? ' active' : ''}"
         data-id="${cut.id}"
         role="button"
         tabindex="0"
         aria-label="${cut.name}">
      ${cut.isNew ? '<span class="t-new-pip" title="Nuovo"></span>' : ''}
      <div class="t-item-thumb">
        <img src="${cut.imgSrc}" alt="${cut.imgAlt}" loading="lazy" />
      </div>
      <div class="t-item-info">
        <p class="t-item-name">${cut.name}</p>
        <p class="t-item-fade">${cut.fadeType}</p>
      </div>
      <span class="t-item-badge">${cut.badge}</span>
    </div>
  `).join('');
}

function renderDetailEmpty() {
  return `
    <div class="t-detail-empty">
      <div class="t-detail-empty-icon">
        <svg width="72" height="72" viewBox="0 0 28 28" fill="none">
          <rect width="28" height="28" fill="#8B0000" opacity="0.4"/>
          <path d="M9 7 C9 7 8 14 14 14 C20 14 19 7 19 7" stroke="#F5F5F5" stroke-width="1.5" fill="none"/>
          <line x1="14" y1="14" x2="14" y2="22" stroke="#F5F5F5" stroke-width="1.5"/>
          <line x1="10" y1="19" x2="18" y2="19" stroke="#F5F5F5" stroke-width="1.5"/>
        </svg>
      </div>
      <p class="t-detail-empty-title">Seleziona un taglio</p>
      <p class="t-detail-empty-sub">Scegli dalla lista per vedere il tutorial completo e i prodotti consigliati.</p>
    </div>`;
}

function renderDetailContent(cut) {
  const fallback = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='450' viewBox='0 0 800 450'%3E%3Crect width='800' height='450' fill='%231a1a1a'/%3E%3Ctext x='50%25' y='50%25' font-size='20' fill='%23444' text-anchor='middle' dominant-baseline='middle' font-family='serif'%3E${encodeURIComponent(cut.name)}%3C/text%3E%3C/svg%3E`;

  const productsHTML = cut.products.map(p => `
    <li class="t-product-item">
      <span class="t-product-dot"></span>
      <span class="t-product-name">${p}</span>
    </li>`).join('');

  const stepsHTML = cut.steps.map((s, i) => `
    <li class="t-step-item">
      <div class="t-step-number">${i + 1}</div>
      <p class="t-step-text">${s}</p>
    </li>`).join('');

  const backBtn = `
    <button class="t-back-btn" id="detail-back-btn" aria-label="Torna alla lista">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="15 18 9 12 15 6"/>
      </svg>
      Lista tagli
    </button>`;

  return `
    <div class="t-detail-inner">
      <!-- Hero image -->
      <div class="t-detail-hero">
        <span class="t-detail-hero-badge">${cut.badge}</span>
        ${cut.isNew ? '<span class="t-detail-hero-new">Nuovo</span>' : ''}
        <img src="${cut.imgSrc}" alt="${cut.imgAlt}" onerror="this.src='${fallback}'" />
        <div class="t-detail-hero-overlay"></div>
        <div class="t-detail-hero-title">
          <h2 class="t-detail-cut-name">${cut.name}</h2>
          <p class="t-detail-fade">${cut.fadeType}</p>
        </div>
      </div>

      ${backBtn}

      <!-- Body: products + tutorial -->
      <div class="t-detail-body">
        <div>
          <p class="t-section-head">Prodotti Consigliati</p>
          <ul class="t-products-list">${productsHTML}</ul>
        </div>
        <div>
          <p class="t-section-head">Tutorial</p>
          <ol class="t-steps-list">${stepsHTML}</ol>
        </div>
      </div>
    </div>`;
}

// ── Selection logic ───────────────────────────────

function selectCut(id) {
  selectedId = id;

  // Update sidebar active state
  document.querySelectorAll('.t-cut-item').forEach(item => {
    const itemId = parseInt(item.dataset.id, 10);
    item.classList.toggle('active', itemId === id);
  });

  // Render detail
  const cut = HAIRCUTS.find(h => h.id === id);
  if (!cut || !detailEl) return;

  detailEl.innerHTML = renderDetailContent(cut);
  detailEl.scrollTop = 0;

  // Attach back button for mobile
  const backBtn = document.getElementById('detail-back-btn');
  if (backBtn) {
    backBtn.addEventListener('click', showSidebar);
  }

  // Mobile: show detail, hide sidebar
  if (isMobileLayout) {
    showDetail();
  }
}

function showDetail() {
  if (sidebarEl) sidebarEl.classList.add('hidden-mobile');
  if (detailEl)  detailEl.classList.add('visible-mobile');
}

function showSidebar() {
  if (sidebarEl) sidebarEl.classList.remove('hidden-mobile');
  if (detailEl)  detailEl.classList.remove('visible-mobile');
}

// ── Layout detection ──────────────────────────────

function checkLayout() {
  const wasMobile = isMobileLayout;
  isMobileLayout = window.innerWidth < 768;

  if (wasMobile && !isMobileLayout) {
    // Switched to desktop: restore both panels
    if (sidebarEl) sidebarEl.classList.remove('hidden-mobile');
    if (detailEl)  detailEl.classList.remove('visible-mobile');
    // Auto-select first if none selected
    if (!selectedId && HAIRCUTS.length) selectCut(HAIRCUTS[0].id);
  }
}

// ── Init ─────────────────────────────────────────

function initTablet() {
  sidebarEl = document.getElementById('t-sidebar');
  detailEl  = document.getElementById('t-detail');

  const listEl = document.getElementById('t-sidebar-list');
  if (!listEl || !detailEl || !sidebarEl) return;

  // Render sidebar list
  listEl.innerHTML = renderSidebarList();

  // Render empty detail
  detailEl.innerHTML = renderDetailEmpty();

  // Attach click handlers
  listEl.addEventListener('click', (e) => {
    const item = e.target.closest('.t-cut-item');
    if (!item) return;
    const id = parseInt(item.dataset.id, 10);
    if (!isNaN(id)) selectCut(id);
  });

  // Keyboard nav
  listEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      const item = e.target.closest('.t-cut-item');
      if (!item) return;
      e.preventDefault();
      const id = parseInt(item.dataset.id, 10);
      if (!isNaN(id)) selectCut(id);
    }
  });

  // Check initial layout
  checkLayout();
  window.addEventListener('resize', checkLayout);

  // Auto-select first cut on non-mobile
  if (!isMobileLayout && HAIRCUTS.length) {
    selectCut(HAIRCUTS[0].id);
  }
}

document.addEventListener('DOMContentLoaded', initTablet);
