/* ============================================================
   THE CYCLEVAULT — Site interactions
   ============================================================ */

(function () {
  /* ---------- Theme toggle ---------- */
  const root = document.documentElement;
  const storageKey = 'cv-theme';
  function applyTheme(t) {
    if (t === 'dark') root.setAttribute('data-theme', 'dark');
    else root.removeAttribute('data-theme');
  }
  // Initialize from storage or system preference
  const stored = (() => { try { return localStorage.getItem(storageKey); } catch { return null; } })();
  if (stored === 'dark' || stored === 'light') {
    applyTheme(stored);
  } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    applyTheme('dark');
  }
  // Wire toggle buttons
  document.querySelectorAll('.theme-toggle').forEach((btn) => {
    btn.addEventListener('click', () => {
      const now = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      applyTheme(now);
      try { localStorage.setItem(storageKey, now); } catch {}
    });
  });

  /* ---------- Wrap "The CycleVault" in a brand wordmark span everywhere it appears in body copy ---------- */
  (function wrapWordmark() {
    const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'INPUT', 'TEXTAREA', 'TITLE']);
    const SKIP_CLASSES = ['brand-name', 'brand-text', 'foot-title']; // already styled
    const RE = /The CycleVault/g;

    function walk(node) {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.nodeValue;
        if (!text || !text.includes('The CycleVault')) return;
        const parent = node.parentElement;
        if (!parent) return;
        if (parent.closest('.brand-name, .brand-text, .foot-title')) return;

        const frag = document.createDocumentFragment();
        let lastIdx = 0;
        for (const m of text.matchAll(RE)) {
          if (m.index > lastIdx) frag.appendChild(document.createTextNode(text.slice(lastIdx, m.index)));
          const span = document.createElement('span');
          span.className = 'brand-name';
          span.textContent = 'The CycleVault';
          frag.appendChild(span);
          lastIdx = m.index + m[0].length;
        }
        if (lastIdx < text.length) frag.appendChild(document.createTextNode(text.slice(lastIdx)));
        node.parentNode.replaceChild(frag, node);
        return;
      }
      if (node.nodeType !== Node.ELEMENT_NODE) return;
      if (SKIP_TAGS.has(node.tagName)) return;
      if (SKIP_CLASSES.some(c => node.classList.contains(c))) return;
      // iterate snapshot since we mutate the tree
      Array.from(node.childNodes).forEach(walk);
    }
    walk(document.body);
  })();

  /* ---------- Reveal on scroll ---------- */
  const revealIO = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('in');
          revealIO.unobserve(e.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -60px 0px' }
  );
  document.querySelectorAll('.reveal').forEach((el) => {
    const r = el.getBoundingClientRect();
    if (r.top < window.innerHeight * 0.95) {
      // already visible — reveal next frame so transition runs
      requestAnimationFrame(() => el.classList.add('in'));
    } else {
      revealIO.observe(el);
    }
  });

  // Safety: after 2s, force-reveal anything still hidden (e.g. snapshot contexts)
  setTimeout(() => {
    document.querySelectorAll('.reveal:not(.in)').forEach((el) => el.classList.add('in'));
  }, 2000);

  /* ---------- Feature scrollytelling ---------- */
  const panels = Array.from(document.querySelectorAll('.f-panel'));
  const screens = Array.from(document.querySelectorAll('.f-screen'));
  const dots = Array.from(document.querySelectorAll('.fp-dot'));

  function setActiveFeature(idx) {
    panels.forEach((p, i) => p.classList.toggle('f-active', i === idx));
    screens.forEach((s) => {
      const isActive =
        s.dataset.screen === panels[idx]?.dataset.feature;
      s.classList.toggle('f-screen-active', isActive);
    });
    dots.forEach((d, i) => d.classList.toggle('fp-active', i === idx));
  }

  if (panels.length) {
    // Choose panel whose center is nearest to viewport mid
    const featureIO = new IntersectionObserver(
      (entries) => {
        // Compute the closest visible panel each tick
        let best = null;
        let bestDist = Infinity;
        const vpMid = window.innerHeight / 2;
        panels.forEach((p, i) => {
          const r = p.getBoundingClientRect();
          const mid = (r.top + r.bottom) / 2;
          const dist = Math.abs(mid - vpMid);
          if (dist < bestDist && r.bottom > 0 && r.top < window.innerHeight) {
            bestDist = dist;
            best = i;
          }
        });
        if (best != null) setActiveFeature(best);
      },
      { threshold: [0, 0.25, 0.5, 0.75, 1] }
    );
    panels.forEach((p) => featureIO.observe(p));

    // Also recompute on scroll for fine-grain crossfade
    let rafId = null;
    window.addEventListener(
      'scroll',
      () => {
        if (rafId) return;
        rafId = requestAnimationFrame(() => {
          rafId = null;
          let best = 0;
          let bestDist = Infinity;
          const vpMid = window.innerHeight / 2;
          panels.forEach((p, i) => {
            const r = p.getBoundingClientRect();
            const mid = (r.top + r.bottom) / 2;
            const dist = Math.abs(mid - vpMid);
            if (dist < bestDist) {
              bestDist = dist;
              best = i;
            }
          });
          setActiveFeature(best);
        });
      },
      { passive: true }
    );

    setActiveFeature(0);
  }

  /* ---------- Subtle 3D tilt on phones (skip on touch / reduced motion) ---------- */
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const touch = window.matchMedia('(hover: none)').matches;
  if (!reduced && !touch) {
    document.querySelectorAll('[data-tilt]').forEach((el) => {
      const phone = el.querySelector('.phone') || el;
      let raf = null;
      const onMove = (e) => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        if (raf) cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => {
          phone.style.transform = `rotateY(${x * 8}deg) rotateX(${-y * 6}deg) translateZ(0)`;
        });
      };
      const onLeave = () => {
        if (raf) cancelAnimationFrame(raf);
        phone.style.transform = '';
      };
      el.addEventListener('mousemove', onMove);
      el.addEventListener('mouseleave', onLeave);
    });
  }

  /* ---------- Hero parallax for floating cards ---------- */
  const floats = document.querySelectorAll('.float-card');
  if (floats.length && !reduced && !touch) {
    const wrap = document.querySelector('.hero-phone-wrap');
    if (wrap) {
      wrap.addEventListener('mousemove', (e) => {
        const r = wrap.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        floats.forEach((f, i) => {
          const k = (i + 1) * 8;
          f.style.translate = `${-x * k}px ${-y * k}px`;
        });
      });
      wrap.addEventListener('mouseleave', () => {
        floats.forEach((f) => (f.style.translate = ''));
      });
    }
  }

  /* ---------- Animated FAQ accordion ---------- */
  document.querySelectorAll('.faq-item').forEach((item) => {
    const summary = item.querySelector('summary');
    const body = item.querySelector('.faq-body');
    if (!summary || !body) return;

    // If a FAQ is open by default, leave it open (no initial animation)
    summary.addEventListener('click', (e) => {
      e.preventDefault();
      const isOpen = item.hasAttribute('open');

      if (isOpen) {
        const h = body.scrollHeight;
        body.style.height = h + 'px';
        // force reflow
        void body.offsetHeight;
        body.style.height = '0px';
        body.addEventListener('transitionend', function onEnd(ev) {
          if (ev.propertyName !== 'height') return;
          item.removeAttribute('open');
          body.style.height = '';
          body.removeEventListener('transitionend', onEnd);
        });
      } else {
        item.setAttribute('open', '');
        const h = body.scrollHeight;
        body.style.height = '0px';
        void body.offsetHeight;
        body.style.height = h + 'px';
        body.addEventListener('transitionend', function onEnd(ev) {
          if (ev.propertyName !== 'height') return;
          body.style.height = '';
          body.removeEventListener('transitionend', onEnd);
        });
      }
    });
  });

  /* ---------- Waitlist form (Formspree) ---------- */
  const wForm = document.getElementById('waitlist-form');
  if (wForm) {
    const btn = wForm.querySelector('button[type="submit"]');
    const btnLabel = wForm.querySelector('.cta-btn-label');
    const thanks = wForm.querySelector('.cta-thanks');
    const errBox = wForm.querySelector('.cta-error');
    const emailInput = wForm.querySelector('input[type="email"]');

    function showError(msg) {
      thanks.classList.remove('visible');
      errBox.textContent = msg;
      errBox.classList.add('visible');
    }
    function clearError() {
      errBox.textContent = '';
      errBox.classList.remove('visible');
    }
    emailInput.addEventListener('input', clearError);

    wForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      clearError();
      if (wForm.dataset.state === 'sending' || wForm.dataset.state === 'done') return;

      wForm.dataset.state = 'sending';
      btn.disabled = true;
      btnLabel.textContent = 'Sending…';

      try {
        const res = await fetch(wForm.action, {
          method: 'POST',
          body: new FormData(wForm),
          headers: { Accept: 'application/json' },
        });
        if (res.ok) {
          wForm.dataset.state = 'done';
          btnLabel.textContent = 'You\'re on the list ✦';
          btn.classList.add('btn-success');
          thanks.textContent = 'We\'ll email you the day The CycleVault is live. That\'s the only message.';
          thanks.classList.add('visible');
          emailInput.disabled = true;
          return;
        }
        const data = await res.json().catch(() => ({}));
        const detail = data?.errors?.[0]?.message;
        showError(detail || 'Something went wrong. Please try again in a moment.');
      } catch {
        showError('No network — please check your connection and try again.');
      } finally {
        if (wForm.dataset.state !== 'done') {
          wForm.dataset.state = '';
          btn.disabled = false;
          btnLabel.textContent = 'Join the waitlist';
        }
      }
    });
  }

  /* ---------- Feedback form (Formspree, AJAX) ---------- */
  const fForm = document.getElementById('feedback-form');
  if (fForm) {
    // Pick up source + version from query string so iOS-app submissions are
    // distinguished from website submissions in the Formspree dashboard.
    try {
      const params = new URLSearchParams(window.location.search);
      const src = params.get('source');
      const ver = params.get('version');
      if (src) {
        const srcInput = document.getElementById('ff-source');
        if (srcInput) srcInput.value = src;
      }
      if (ver) {
        const verInput = document.getElementById('ff-version');
        if (verInput) verInput.value = ver;
      }
    } catch {}

    const fBtn = fForm.querySelector('button[type="submit"]');
    const fLabel = fForm.querySelector('.ff-btn-label');
    const fThanks = fForm.querySelector('.ff-thanks');
    const fErr = fForm.querySelector('.ff-error');
    const fMsg = fForm.querySelector('textarea[name="message"]');
    const fEmail = fForm.querySelector('input[name="email"]');

    function fShowError(msg) {
      fThanks.classList.remove('visible');
      fErr.textContent = msg;
      fErr.classList.add('visible');
    }
    function fClearError() {
      fErr.textContent = '';
      fErr.classList.remove('visible');
    }
    [fMsg, fEmail].forEach(el => el && el.addEventListener('input', fClearError));

    fForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      fClearError();
      if (fForm.dataset.state === 'sending' || fForm.dataset.state === 'done') return;

      // Type is required but `required` on radios doesn't always trigger if the
      // group is empty — check explicitly so we can show our own message.
      const typeChosen = !!fForm.querySelector('input[name="type"]:checked');
      if (!typeChosen) {
        fShowError('Please pick a type so we know how to route this.');
        return;
      }
      if (!fMsg.value.trim() || fMsg.value.trim().length < 10) {
        fShowError('Add a few more words so we have something to work with.');
        return;
      }

      fForm.dataset.state = 'sending';
      fBtn.disabled = true;
      fLabel.textContent = 'Sending…';

      try {
        const res = await fetch(fForm.action, {
          method: 'POST',
          body: new FormData(fForm),
          headers: { Accept: 'application/json' },
        });
        if (res.ok) {
          fForm.dataset.state = 'done';
          fLabel.textContent = 'Sent ✦';
          fBtn.classList.add('btn-success');
          fThanks.textContent = 'Thanks — your message landed. We read every one.';
          fThanks.classList.add('visible');
          fForm.querySelectorAll('input, textarea, button').forEach(el => {
            if (el !== fBtn) el.disabled = true;
          });
          return;
        }
        const data = await res.json().catch(() => ({}));
        const detail = data?.errors?.[0]?.message;
        fShowError(detail || 'Something went wrong. Please try again in a moment.');
      } catch {
        fShowError('No network — please check your connection and try again.');
      } finally {
        if (fForm.dataset.state !== 'done') {
          fForm.dataset.state = '';
          fBtn.disabled = false;
          fLabel.textContent = 'Send feedback';
        }
      }
    });
  }
})();
