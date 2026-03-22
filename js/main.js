"use strict";
// BlackShape — Main Landing Page Logic

function renderStars(count) {
  return Array.from({ length: count }, () => '★').join('');
}

function renderCutCard(cut) {
  const productsHTML = cut.products.map(p => `<li>${p}</li>`).join('');
  const stepsHTML    = cut.steps.map(s => `<li>${s}</li>`).join('');
  const ribbonHTML   = cut.isNew ? `<div class="corner-ribbon">Nuovo</div>` : '';
  const fallback     = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='533' viewBox='0 0 400 533'%3E%3Crect width='400' height='533' fill='%231a1a1a'/%3E%3Ctext x='50%25' y='50%25' font-size='14' fill='%23444' text-anchor='middle' dominant-baseline='middle' font-family='serif'%3E${encodeURIComponent(cut.name)}%3C/text%3E%3C/svg%3E`;

  return `
    <article class="cut-card" data-id="${cut.id}">
      ${ribbonHTML}
      <div class="card-img-wrap">
        <span class="card-badge">${cut.badge}</span>
        <img src="${cut.imgSrc}" alt="${cut.imgAlt}" loading="lazy" onerror="this.src='${fallback}'" />
        <div class="card-img-gradient"></div>
      </div>
      <div class="card-body">
        <h3 class="card-title">${cut.name}</h3>
        <p class="card-fade-type">${cut.fadeType}</p>
        <div class="card-divider"></div>
        <p class="card-section-label">Prodotti Consigliati</p>
        <ul class="card-products mb-4">${productsHTML}</ul>
        <p class="card-section-label">Mini Tutorial</p>
        <ol class="card-steps">${stepsHTML}</ol>
      </div>
    </article>`;
}

function renderService(svc) {
  return `
    <div class="service-item">
      <div>
        <p class="service-name">${svc.name}</p>
        <p class="service-desc">${svc.desc}</p>
      </div>
      <p class="service-price">${svc.price}</p>
    </div>`;
}

function renderTestimonial(t) {
  return `
    <div class="testi-card">
      <span class="testi-quote-icon">"</span>
      <p class="testi-text">${t.text}</p>
      <p class="testi-author">${t.author}</p>
      <p class="stars">${renderStars(t.stars)}</p>
    </div>`;
}

function init() {
  const galleryGrid = document.getElementById('gallery-grid');
  if (galleryGrid) galleryGrid.innerHTML = HAIRCUTS.map(renderCutCard).join('');

  const servicesList = document.getElementById('services-list');
  if (servicesList) servicesList.innerHTML = SERVICES.map(renderService).join('');

  const testiGrid = document.getElementById('testimonials-grid');
  if (testiGrid) testiGrid.innerHTML = TESTIMONIALS.map(renderTestimonial).join('');
}

// ── Mobile menu ──
function initMobileMenu() {
  const hamburger  = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobile-menu');
  const h1 = document.getElementById('h1');
  const h2 = document.getElementById('h2');
  const h3 = document.getElementById('h3');
  if (!hamburger || !mobileMenu) return;

  let menuOpen = false;

  function setMenu(open) {
    menuOpen = open;
    mobileMenu.classList.toggle('open', open);
    if (h1 && h2 && h3) {
      h1.style.transform = open ? 'rotate(45deg) translate(4px, 4px)' : '';
      h2.style.opacity   = open ? '0' : '1';
      h3.style.transform = open ? 'rotate(-45deg) translate(5px, -4px)' : '';
      h3.style.width     = open ? '24px' : '';
    }
  }

  hamburger.addEventListener('click', () => setMenu(!menuOpen));
  mobileMenu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => setMenu(false));
  });
}

// ── Contact form ──
function initForm() {
  const form = document.getElementById('contact-form');
  if (!form) return;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const msg = document.getElementById('form-msg');
    if (!msg) return;
    msg.textContent = 'Richiesta ricevuta. Qualcuno vi contatterà. Presto.';
    msg.style.color = '#C9A84C';
    setTimeout(() => { msg.style.color = 'transparent'; }, 4500);
  });
}

// ── Scroll reveal ──
function initScrollReveal() {
  const targets = document.querySelectorAll('.cut-card, .testi-card, .service-item');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.style.opacity   = '1';
        entry.target.style.transform = 'translateY(0)';
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08 });

  targets.forEach((el, i) => {
    el.style.opacity    = '0';
    el.style.transform  = 'translateY(28px)';
    el.style.transition = `opacity 0.6s ease ${(i % 3) * 0.1}s, transform 0.6s ease ${(i % 3) * 0.1}s, box-shadow 0.35s, border-color 0.35s`;
    observer.observe(el);
  });
}

// ── Boot ──
document.addEventListener('DOMContentLoaded', () => {
  init();
  initMobileMenu();
  initForm();
  requestAnimationFrame(() => initScrollReveal());
});
