/* =========================================================
   MNLP — homepage interactions
   GSAP scroll-scrubbed video hero + reveals + nav
   ========================================================= */
(function () {
  "use strict";

  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));

  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const hasGSAP = !!(window.gsap && window.ScrollTrigger);

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    setYear();
    galleryFallback();
    navBurger();

    if (hasGSAP) gsap.registerPlugin(ScrollTrigger);

    // No GSAP or reduced motion → calm, fully-visible static page
    if (!hasGSAP || prefersReduced) {
      staticFallback();
      return;
    }

    splitTitle();
    buildHero();
    buildReveals();
    buildNavState();
    buildCounters();

    // Recalculate once everything (fonts, video, images) has settled
    window.addEventListener("load", () => ScrollTrigger.refresh());
  }

  /* ---------- small helpers ---------- */
  function setYear() {
    const y = $("#year");
    if (y) y.textContent = new Date().getFullYear();
  }

  // If a gallery photo is missing, show a branded placeholder instead of a broken image
  function galleryFallback() {
    $$(".gallery__item img").forEach((img) => {
      const fail = () => img.closest(".gallery__item").classList.add("is-empty");
      if (img.complete && img.naturalWidth === 0) fail();
      img.addEventListener("error", fail);
    });
  }

  // Mobile menu
  function navBurger() {
    const burger = $("#navBurger");
    const links = $("#navLinks");
    if (!burger || !links) return;
    burger.addEventListener("click", () => {
      const open = links.classList.toggle("is-open");
      burger.setAttribute("aria-expanded", String(open));
    });
    links.addEventListener("click", (e) => {
      if (e.target.tagName === "A") {
        links.classList.remove("is-open");
        burger.setAttribute("aria-expanded", "false");
      }
    });
  }

  /* ---------- title → per-word reveal wrappers ---------- */
  function splitTitle() {
    const title = $("#heroTitle");
    if (!title) return;
    const words = title.textContent.trim().split(/\s+/);
    title.textContent = "";
    words.forEach((w, i) => {
      const wrap = document.createElement("span");
      wrap.className = "word";
      const inner = document.createElement("span");
      inner.textContent = w;
      wrap.appendChild(inner);
      title.appendChild(wrap);
      if (i < words.length - 1) title.appendChild(document.createTextNode(" "));
    });
  }

  /* =======================================================
     HERO: pin the stage, scrub the video with scroll,
     then reveal the headline. First frame shows "her";
     scrolling plays the meditation + brings in the text.
     ======================================================= */
  function buildHero() {
    const video    = $("#heroVideo");
    const stage    = $("#heroStage");
    const content  = $("#heroContent");
    const overlay  = $("#heroOverlay");
    const cue      = $("#heroCue");
    const progress = $("#heroProgress");
    if (!video || !stage) return;

    const titleInners = $$("#heroTitle .word > span");
    const sub     = $(".hero__sub");
    const eyebrow = $(".hero__eyebrow");
    const ctaBtns = $$(".hero__cta .btn");

    // Shorter scrub distance on small screens (lighter scroll feel)
    const distance = window.innerWidth < 820 ? "+=170%" : "+=320%";

    // Try to decode the first frame so it isn't blank before playback/seek
    primeVideo(video);

    // Hero text is shown at the TOP (over the water) and animates OUT as you
    // scroll. Paused timeline whose progress() we drive by hand: 1 = shown,
    // 0 = gone (title clips upward, the rest fades).
    const textTl = gsap.timeline({ paused: true });
    textTl
      .set(content, { autoAlpha: 1 }, 0)
      .fromTo(eyebrow, { y: -22, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.5, ease: "power3.out" }, 0)
      .fromTo(titleInners, { yPercent: -115, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, stagger: 0.08, duration: 0.7, ease: "power3.out" }, 0.06)
      .fromTo(sub, { y: -16, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.5, ease: "power3.out" }, 0.4)
      .fromTo(ctaBtns, { y: 18, autoAlpha: 0 }, { y: 0, autoAlpha: 1, stagger: 0.12, duration: 0.5, ease: "power3.out" }, 0.5);

    const clamp01 = gsap.utils.clamp(0, 1);

    const build = () => {
      if (video.dataset.built) return;
      video.dataset.built = "1";
      const dur = video.duration && isFinite(video.duration) ? video.duration : 6;

      // Start ON the water (the END of the clip); scrolling rewinds to the woman.
      let targetTime = dur;
      try { video.currentTime = dur; } catch (e) {}

      // Ease the seek in a rAF loop (rather than snapping from the scroll
      // handler) for buttery scrubbing on the all-intra clip.
      const ease = 0.18;
      gsap.ticker.add(() => {
        const ct = video.currentTime || 0;
        const diff = targetTime - ct;
        if (Math.abs(diff) > 0.015) {
          try { video.currentTime = ct + diff * ease; } catch (e) {}
        }
      });

      ScrollTrigger.create({
        trigger: ".hero",
        start: "top top",
        end: distance,
        pin: stage,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          const p = self.progress;

          // 1) REVERSED scrub: water (clip end) at the top → rewind to the
          //    woman (clip start) by ~90% of the scroll.
          targetTime = (1 - clamp01(p / 0.9)) * dur;

          // 2) Hero text shown at the top, fades/slides out as you scroll.
          const textVis = 1 - clamp01(p / 0.26);
          textTl.progress(textVis);

          // 3) Overlay darker while the text is up (readability), lighter as
          //    the woman is revealed.
          if (overlay) overlay.style.opacity = (0.3 + 0.52 * textVis).toFixed(3);

          // 4) Scroll cue only at the very top.
          if (cue) cue.style.opacity = (1 - clamp01(p / 0.08)).toFixed(3);

          // 5) Header shows at the start (water) AND the end (woman),
          //    hidden during the rewind in between.
          document.body.classList.toggle("header-shown", p <= 0.08 || p >= 0.82);

          if (progress) progress.style.width = (p * 100).toFixed(1) + "%";
        },
      });

      // First paint = the top state: water frame + text + header all visible.
      textTl.progress(1);
      document.body.classList.add("header-shown");
      if (overlay) overlay.style.opacity = "0.82";

      ScrollTrigger.refresh();
    };

    // Build once we know the duration
    if (video.readyState >= 1 && isFinite(video.duration)) {
      build();
    } else {
      video.addEventListener("loadedmetadata", build, { once: true });
      setTimeout(build, 2500); // safety net if metadata never fires
    }
  }

  // Force iOS/Safari to decode, then park on the water frame (clip end)
  function primeVideo(video) {
    const kick = () => {
      const toEnd = () => { try { video.pause(); if (isFinite(video.duration)) video.currentTime = video.duration; } catch (e) {} };
      const p = video.play();
      if (p && p.then) p.then(toEnd).catch(() => {}); else toEnd();
    };
    if (video.readyState >= 2) kick();
    else video.addEventListener("loadeddata", kick, { once: true });
    // also prime on first touch (iOS gesture requirement)
    window.addEventListener("touchstart", kick, { once: true, passive: true });
  }

  /* ---------- generic reveal-on-scroll ---------- */
  function buildReveals() {
    $$(".reveal").forEach((el) => {
      ScrollTrigger.create({
        trigger: el,
        start: "top 85%",
        once: true,
        onEnter: () => el.classList.add("is-in"),
      });
    });
  }

  /* ---------- keep the (solid white) header shown past the hero ---------- */
  function buildNavState() {
    ScrollTrigger.create({
      trigger: ".community",
      start: "top 92%",
      onEnter: () => document.body.classList.add("header-shown"),
    });
  }

  /* ---------- count-up stats ---------- */
  function buildCounters() {
    $$(".values__num").forEach((el) => {
      const target = parseFloat(el.dataset.count || "0");
      const suffix = el.dataset.suffix || "";
      ScrollTrigger.create({
        trigger: el,
        start: "top 88%",
        once: true,
        onEnter: () => {
          const obj = { v: 0 };
          gsap.to(obj, {
            v: target,
            duration: 1.6,
            ease: "power2.out",
            onUpdate: () => { el.textContent = Math.round(obj.v).toLocaleString("he-IL") + suffix; },
          });
        },
      });
    });
  }

  /* ---------- fallback (no GSAP / reduced motion) ---------- */
  function staticFallback() {
    const content = $("#heroContent");
    const video = $("#heroVideo");
    if (content) content.style.opacity = "1";
    document.body.classList.add("header-shown"); // no scroll animation → show header
    $$(".reveal").forEach((el) => el.classList.add("is-in"));
    $$(".values__num").forEach((el) => {
      el.textContent = Number(el.dataset.count || 0).toLocaleString("he-IL") + (el.dataset.suffix || "");
    });
    // let the footage play gently in the background
    if (video) {
      video.loop = true;
      video.muted = true;
      const p = video.play();
      if (p && p.catch) p.catch(() => {});
    }
  }
})();
