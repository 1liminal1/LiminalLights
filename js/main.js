// Liminal Lights - site behaviour. Everything here is progressive: the site
// works without it.

document.addEventListener('DOMContentLoaded', function () {
  var nav = document.querySelector('.nav');

  // Mobile navigation
  var navToggle = document.querySelector('.nav-toggle');
  var navLinks = document.getElementById('nav-links');

  function setMenu(open) {
    navToggle.setAttribute('aria-expanded', String(open));
    navLinks.classList.toggle('open', open);
    document.body.classList.toggle('menu-open', open);
  }

  if (navToggle && navLinks) {
    navToggle.addEventListener('click', function () {
      setMenu(navToggle.getAttribute('aria-expanded') !== 'true');
    });
    navLinks.addEventListener('click', function (e) {
      if (e.target.closest('a')) setMenu(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && navToggle.getAttribute('aria-expanded') === 'true') {
        setMenu(false);
        navToggle.focus();
      }
    });
  }

  // Nav shadow once scrolled; back-to-top visibility
  var backToTop = document.querySelector('.back-to-top');
  function onScroll() {
    var y = window.scrollY;
    if (nav) nav.classList.toggle('scrolled', y > 8);
    if (backToTop) backToTop.classList.toggle('visible', y > 600);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  if (backToTop) {
    backToTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: reduceMotion.matches ? 'auto' : 'smooth' });
      var main = document.getElementById('main');
      if (main) main.focus({ preventScroll: true });
    });
  }

  // Ambient videos: pause/play control (WCAG 2.2.2), no autoplay under
  // prefers-reduced-motion, and pause while off-screen to save CPU/battery.
  var videos = document.querySelectorAll('.ambient video');
  var userPaused = new WeakSet();

  videos.forEach(function (video) {
    var label = video.getAttribute('aria-label') || 'video';
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'ambient-toggle';

    function sync() {
      var playing = !video.paused;
      btn.setAttribute('aria-label', (playing ? 'Pause ' : 'Play ') + label);
      btn.dataset.state = playing ? 'playing' : 'paused';
    }

    btn.addEventListener('click', function () {
      if (video.paused) {
        userPaused.delete(video);
        video.play().catch(function () {});
      } else {
        userPaused.add(video);
        video.pause();
      }
    });
    video.addEventListener('play', sync);
    video.addEventListener('pause', sync);

    if (reduceMotion.matches) {
      video.removeAttribute('autoplay');
      video.pause();
      userPaused.add(video);
    }

    video.parentNode.appendChild(btn);
    sync();
  });

  if ('IntersectionObserver' in window && videos.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var v = entry.target;
        if (entry.isIntersecting) {
          if (!userPaused.has(v)) v.play().catch(function () {});
        } else if (!v.paused) {
          v.pause();
        }
      });
    }, { threshold: 0.15 });
    videos.forEach(function (v) { io.observe(v); });
  }
});
