/**
 * Galaxy Library — Landing Page JavaScript
 * HTML me content edit karo; stats API se auto-update honge.
 */

(function () {
  'use strict';

  const API = {
    siteContent: '/api/site-content',
    publicStats: '/api/public/stats',
    recordVisit: '/api/public/stats/visit',
  };

  const VISIT_KEY = 'galaxylibrary_visit_recorded';

  document.querySelectorAll('[data-scroll]').forEach(function (link) {
    link.addEventListener('click', function (e) {
      var targetId = this.getAttribute('data-scroll');
      if (!targetId) return;
      e.preventDefault();
      var el = document.querySelector(targetId);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      var nav = document.querySelector('.navbar-collapse');
      if (nav && nav.classList.contains('show')) {
        bootstrap.Collapse.getOrCreateInstance(nav).hide();
      }
    });
  });

  var slides = document.querySelectorAll('.hero-slide');
  var dots = document.querySelectorAll('.hero-dot');
  var currentSlide = 0;
  var slideTimer;
  var heroTitle = document.getElementById('heroTitle');
  var heroSubtitle = document.getElementById('heroSubtitle');
  var heroBadge = document.getElementById('heroBadge');
  var heroTextWrap = document.querySelector('.hero-text-wrap');

  var heroCopy = [
    {
      badge: 'Your space to focus',
      title: 'Welcome to Galaxy Library',
      subtitle: 'A peaceful environment for serious study and exam preparation.',
    },
    {
      badge: 'Dedicated reading halls',
      title: 'Study Without Distractions',
      subtitle: 'Quiet zones, assigned desks, and a disciplined atmosphere for every aspirant.',
    },
    {
      badge: 'Books & resources',
      title: 'Learn. Focus. Succeed.',
      subtitle: 'From board exams to NEET, JEE, and competitive tests — we support your goals.',
    },
    {
      badge: 'Join our community',
      title: 'Hundreds of Students Trust Us',
      subtitle: 'Flexible shifts from 4 hours to 24 hours. Professional management you can rely on.',
    },
    {
      badge: 'Your own seat',
      title: 'Assigned Seats, Real Results',
      subtitle: 'Build a daily routine with a fixed desk, Wi‑Fi, AC, and full-time support.',
    },
  ];

  function updateHeroText(index) {
    var copy = heroCopy[index % heroCopy.length];
    if (!copy || !heroTitle) return;
    if (heroTextWrap) heroTextWrap.classList.add('fading');
    setTimeout(function () {
      if (heroBadge) heroBadge.textContent = copy.badge;
      heroTitle.textContent = copy.title;
      if (heroSubtitle) heroSubtitle.textContent = copy.subtitle;
      if (heroTextWrap) heroTextWrap.classList.remove('fading');
    }, 200);
  }

  function showSlide(index) {
    if (!slides.length) return;
    currentSlide = (index + slides.length) % slides.length;
    slides.forEach(function (s, i) {
      s.classList.toggle('active', i === currentSlide);
    });
    dots.forEach(function (d, i) {
      d.classList.toggle('active', i === currentSlide);
    });
    updateHeroText(currentSlide);
  }

  function nextSlide() { showSlide(currentSlide + 1); }
  function prevSlide() { showSlide(currentSlide - 1); }

  function startAutoSlide() {
    clearInterval(slideTimer);
    slideTimer = setInterval(nextSlide, 5000);
  }

  var prevBtn = document.getElementById('heroPrev');
  var nextBtn = document.getElementById('heroNext');
  if (prevBtn) prevBtn.addEventListener('click', function () { prevSlide(); startAutoSlide(); });
  if (nextBtn) nextBtn.addEventListener('click', function () { nextSlide(); startAutoSlide(); });

  dots.forEach(function (dot, i) {
    dot.addEventListener('click', function () {
      showSlide(i);
      startAutoSlide();
    });
  });

  if (slides.length) {
    showSlide(0);
    startAutoSlide();
  }

  var lightbox = document.getElementById('lightbox');
  var lightboxImg = document.getElementById('lightboxImg');
  var lightboxTitle = document.getElementById('lightboxTitle');

  document.querySelectorAll('.gallery-item').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var img = this.querySelector('img');
      var title = this.getAttribute('data-title') || '';
      if (lightboxImg && img) {
        lightboxImg.src = img.src;
        lightboxImg.alt = img.alt;
      }
      if (lightboxTitle) lightboxTitle.textContent = title;
      if (lightbox) lightbox.classList.add('show');
    });
  });

  function closeLightbox() {
    if (lightbox) lightbox.classList.remove('show');
  }

  var lightboxClose = document.getElementById('lightboxClose');
  if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
  if (lightbox) {
    lightbox.addEventListener('click', function (e) {
      if (e.target === lightbox) closeLightbox();
    });
  }

  function animateCount(el, target, suffix) {
    suffix = suffix || '';
    var duration = 1200;
    var start = performance.now();
    target = parseInt(target, 10) || 0;

    function tick(now) {
      var p = Math.min((now - start) / duration, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased).toLocaleString('en-IN') + suffix;
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  function updateStats(data) {
    var admissions = document.getElementById('statAdmissions');
    var visitors = document.getElementById('statVisitors');
    if (admissions) animateCount(admissions, data.totalAdmissions);
    if (visitors) animateCount(visitors, data.visitorCount);
  }

  async function loadStats() {
    try {
      var response;
      if (!sessionStorage.getItem(VISIT_KEY)) {
        response = await fetch(API.recordVisit, { method: 'POST' });
        if (response.ok) sessionStorage.setItem(VISIT_KEY, '1');
      } else {
        response = await fetch(API.publicStats + '?_t=' + Date.now());
      }
      if (!response.ok) throw new Error('Stats failed');
      updateStats(await response.json());
    } catch (err) {
      console.warn('Stats API unavailable.', err);
      var banner = document.getElementById('offlineBanner');
      if (banner) banner.classList.add('show');
      var admissions = document.getElementById('statAdmissions');
      var visitors = document.getElementById('statVisitors');
      if (admissions) animateCount(admissions, admissions.getAttribute('data-fallback') || '300');
      if (visitors) animateCount(visitors, visitors.getAttribute('data-fallback') || '300');
    }
  }

  async function loadSiteContent() {
    try {
      var res = await fetch(API.siteContent + '?_t=' + Date.now());
      if (!res.ok) return;
      var data = await res.json();

      setText('[data-field="library-name"]', data.libraryInfo?.name);
      setText('[data-field="library-tagline"]', data.libraryInfo?.tagline);
      setText('[data-field="owner-name"]', data.libraryInfo?.ownerName);
      setText('[data-field="phone"]', data.libraryInfo?.phone);
      setText('[data-field="email"]', data.libraryInfo?.email);
      setText('[data-field="address"]', data.libraryInfo?.address);

      var phoneLink = document.querySelector('[data-field="phone-link"]');
      if (phoneLink && data.libraryInfo?.phoneRaw) phoneLink.href = 'tel:' + data.libraryInfo.phoneRaw;
      var emailLink = document.querySelector('[data-field="email-link"]');
      if (emailLink && data.libraryInfo?.email) emailLink.href = 'mailto:' + data.libraryInfo.email;
      var waLink = document.querySelector('[data-field="whatsapp-link"]');
      if (waLink && data.libraryInfo?.phoneRaw) {
        waLink.href = 'https://wa.me/' + data.libraryInfo.phoneRaw + '?text=' +
          encodeURIComponent(data.libraryInfo.whatsappMessage || '');
      }

      if (data.pageText) {
        Object.keys(data.pageText).forEach(function (key) {
          setText('[data-text="' + key + '"]', data.pageText[key]);
        });
      }
    } catch (e) { /* HTML defaults */ }
  }

  function setText(selector, value) {
    if (!value) return;
    document.querySelectorAll(selector).forEach(function (el) {
      el.textContent = value;
    });
  }

  var yearEl = document.getElementById('footerYear');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  var navbar = document.getElementById('mainNavbar');
  if (navbar) {
    window.addEventListener('scroll', function () {
      navbar.classList.toggle('scrolled', window.scrollY > 40);
    }, { passive: true });
  }

  var backToTop = document.getElementById('backToTop');
  if (backToTop) {
    window.addEventListener('scroll', function () {
      backToTop.classList.toggle('show', window.scrollY > 400);
    }, { passive: true });
    backToTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  if ('IntersectionObserver' in window) {
    var revealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );
    document.querySelectorAll('.reveal').forEach(function (el) {
      revealObserver.observe(el);
    });
  } else {
    document.querySelectorAll('.reveal').forEach(function (el) {
      el.classList.add('visible');
    });
  }

  loadStats();
  loadSiteContent();
})();
