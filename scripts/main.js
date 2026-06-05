/* ============================================
   AINHOA LABS — Main JavaScript
   ============================================ */

(() => {
  'use strict';

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* --------------------------------------------
     0. Logo Splash (antes del terminal)
     -------------------------------------------- */
  const initSplash = () => {
    const splash = $('#logo-splash');
    const logo = splash ? $('.splash-logo', splash) : null;
    const intro = $('#terminal-intro');

    if (!splash) { initTerminal(); return; }

    if (prefersReducedMotion) {
      splash.classList.add('gone');
      initTerminal();
      return;
    }

    document.body.style.overflow = 'hidden';

    // Timeline: fade-in logo → hold → fade-out logo → fade-out splash → terminal
    // 0ms      → logo fade in (600ms)
    // 600ms    → logo fully visible
    // 1500ms   → logo fade out (400ms)
    // 1900ms   → splash bg fade out (500ms), terminal starts
    // 2400ms   → splash gone, terminal fully visible

    // Step 1: Fade in logo
    setTimeout(() => {
      if (logo) logo.classList.add('visible');
    }, 100);

    // Step 2: Fade out logo
    setTimeout(() => {
      if (logo) logo.classList.add('fade-out');
    }, 1500);

    // Step 3: Fade out splash background, revealing terminal
    setTimeout(() => {
      splash.classList.add('fade-out');
    }, 1900);

    // Step 4: Remove splash, start terminal
    setTimeout(() => {
      splash.classList.add('gone');
      initTerminal();
    }, 2400);
  };

  /* --------------------------------------------
     1. Terminal Intro
     -------------------------------------------- */
  const initTerminal = () => {
    const intro = $('#terminal-intro');
    if (!intro) return;

    if (prefersReducedMotion) {
      intro.classList.add('hidden');
      document.body.style.overflow = '';
      return;
    }

    document.body.style.overflow = 'hidden';

    const lines = [
      { type: 'cmd',    text: '$ ainhoa-labs --init',           delay: 200 },
      { type: 'out',    text: '> bootstrapping workspace...',    delay: 500 },
      { type: 'out',    text: '> loading design system [ok]',    delay: 800 },
      { type: 'out',    text: '> compiling experience [ok]',     delay: 1100 },
      { type: 'ok',     text: '✓ ready. welcome to ainhoa labs', delay: 1500 }
    ];

    const body = $('.terminal-body', intro);
    const cursor = $('.terminal-cursor', intro);

    lines.forEach(({ type, text, delay }) => {
      setTimeout(() => {
        const span = document.createElement('span');
        span.className = `terminal-line terminal-${type}`;
        span.textContent = text;
        body.insertBefore(span, cursor);
      }, delay);
    });

    setTimeout(() => {
      intro.classList.add('hidden');
      document.body.style.overflow = '';
      // Trigger hero animations
      $$('[data-fade-on-load]').forEach((el, i) => {
        setTimeout(() => el.classList.add('visible'), i * 100);
      });
    }, 2400);
  };

  /* --------------------------------------------
     2. Navigation scroll behavior
     -------------------------------------------- */
  const initNav = () => {
    const nav = $('.nav');
    if (!nav) return;

    const hero = $('.hero');
    const updateNav = () => {
      const scrolled = window.scrollY > 40;
      nav.classList.toggle('scrolled', scrolled);

      if (hero && !scrolled) {
        const heroRect = hero.getBoundingClientRect();
        const inHero = heroRect.bottom > 80;
        nav.classList.toggle('on-light', inHero);
      } else {
        nav.classList.remove('on-light');
      }
    };

    updateNav();
    window.addEventListener('scroll', updateNav, { passive: true });

    // Mobile menu
    const toggle = $('.nav-toggle');
    const menu = $('.mobile-menu');
    if (toggle && menu) {
      toggle.addEventListener('click', () => menu.classList.toggle('open'));
      $$('.mobile-menu a').forEach(a => {
        a.addEventListener('click', () => menu.classList.remove('open'));
      });
    }
  };

  /* --------------------------------------------
     3. Scramble Text Decode
     -------------------------------------------- */
  const SCRAMBLE_CHARS = '!<>-_\\/[]{}—=+*^?#@$%&AINHOALABS01';

  const scrambleText = (element, finalText, duration = 900) => {
    if (prefersReducedMotion) {
      element.textContent = finalText;
      return;
    }
    const chars = SCRAMBLE_CHARS;
    const startTime = performance.now();
    const length = finalText.length;

    const frame = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const revealed = Math.floor(progress * length);

      let output = '';
      for (let i = 0; i < length; i++) {
        const c = finalText[i];
        if (i < revealed || c === ' ' || c === '\n') {
          output += c;
        } else {
          output += chars[Math.floor(Math.random() * chars.length)];
        }
      }
      element.textContent = output;

      if (progress < 1) {
        requestAnimationFrame(frame);
      } else {
        element.textContent = finalText;
      }
    };
    requestAnimationFrame(frame);
  };

  const initScramble = () => {
    const targets = $$('[data-scramble]');
    targets.forEach(el => {
      el.dataset.scrambleOriginal = el.textContent;
    });

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !entry.target.dataset.scrambled) {
          entry.target.dataset.scrambled = 'true';
          scrambleText(entry.target, entry.target.dataset.scrambleOriginal, 800);
        }
      });
    }, { threshold: 0.4, rootMargin: '0px 0px -10% 0px' });

    targets.forEach(el => observer.observe(el));
  };

  /* --------------------------------------------
     4. Fade-in on scroll
     -------------------------------------------- */
  const initFadeIn = () => {
    const targets = $$('.fade-in');
    if (!targets.length) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });

    targets.forEach(el => observer.observe(el));
  };

  /* --------------------------------------------
     5. ASCII background generator for HERO
     -------------------------------------------- */
  const initAsciiBg = () => {
    const container = $('.hero-ascii');
    if (!container) return;

    const cols = Math.floor(window.innerWidth / 9);
    const rows = Math.floor(window.innerHeight / 14);
    const chars = '01';
    const keyTokens = ['AINHOA', 'LABS', '[AI]', '{ }', '<>', '/>', '01'];

    let output = '';
    for (let r = 0; r < rows; r++) {
      let line = '';
      for (let c = 0; c < cols; c++) {
        // Occasionally inject a token
        if (Math.random() < 0.008 && c < cols - 8) {
          const tok = keyTokens[Math.floor(Math.random() * keyTokens.length)];
          line += tok + ' ';
          c += tok.length;
        } else {
          line += Math.random() < 0.5 ? chars[0] : chars[1];
          line += ' ';
        }
      }
      output += line + '\n';
    }
    container.textContent = output;
  };

  /* --------------------------------------------
     6. Smooth anchor scroll with nav offset
     -------------------------------------------- */
  const initSmoothScroll = () => {
    $$('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', (e) => {
        const href = anchor.getAttribute('href');
        if (href === '#') return;
        const target = $(href);
        if (!target) return;
        e.preventDefault();
        const top = target.getBoundingClientRect().top + window.scrollY - 60;
        window.scrollTo({ top, behavior: 'smooth' });
      });
    });
  };

  /* --------------------------------------------
     7. Current year in footer
     -------------------------------------------- */
  const initYear = () => {
    const el = $('#current-year');
    if (el) el.textContent = new Date().getFullYear();
  };

  /* --------------------------------------------
     Boot
     -------------------------------------------- */
  document.addEventListener('DOMContentLoaded', () => {
    initAsciiBg();
    initSplash();   // splash → terminal → hero (chained)
    initNav();
    initScramble();
    initFadeIn();
    initSmoothScroll();
    initYear();
  });

  // Regenerate ASCII on resize (debounced)
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(initAsciiBg, 200);
  });
})();
