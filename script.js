/**
 * da:bt — Scroll-Driven Image Sequence Controller
 * 
 * Implements:
 * 1. Lerp-based smooth virtual scrolling (Obys-agency style)
 * 2. Scroll-pinned image sequence scrubbing
 * 3. Scroll progress mapping to frame index
 * 4. Intersection Observer for reveal animations
 */

(function () {
  'use strict';

  // ============================================
  // Image Preloader
  // ============================================
  const images = document.querySelectorAll('.sequence-frame');
  const preloader = document.getElementById('preloader');
  const preloaderProgress = document.getElementById('preloader-progress');
  const preloaderText = document.getElementById('preloader-text');

  let loadedCount = 0;
  const totalImages = images.length;

  function onImageLoad() {
    loadedCount++;
    const percent = Math.round((loadedCount / totalImages) * 100);
    preloaderProgress.style.width = percent + '%';
    preloaderText.textContent = `Loading ${percent}%`;

    if (loadedCount === totalImages) {
      setTimeout(() => {
        preloader.classList.add('hidden');
        document.getElementById('main-nav').classList.add('visible');
        initApp();
      }, 400);
    }
  }

  images.forEach((img) => {
    if (img.complete) {
      onImageLoad();
    } else {
      img.addEventListener('load', onImageLoad);
      img.addEventListener('error', onImageLoad); // Fallback
    }
  });

  // Failsafe: if images loaded before script
  setTimeout(() => {
    if (!preloader.classList.contains('hidden')) {
      preloader.classList.add('hidden');
      document.getElementById('main-nav').classList.add('visible');
      initApp();
    }
  }, 5000);

  // ============================================
  // Main Application
  // ============================================
  function initApp() {
    const TOTAL_FRAMES = 7;

    // DOM References
    const section = document.getElementById('product-scene');
    const frameCounter = document.getElementById('frame-counter');
    const frameCurrent = frameCounter.querySelector('.frame-current');
    const labels = document.querySelectorAll('.product-label');
    const dots = document.querySelectorAll('.progress-dot');
    const scrollPercentEl = document.getElementById('scroll-percent');
    const nav = document.getElementById('main-nav');

    // ============================================
    // Lerp Smooth Scroll (Virtual Scroll)
    // ============================================
    let currentScroll = window.scrollY;
    let targetScroll = window.scrollY;
    const LERP_FACTOR = 0.08; // Lower = smoother/heavier feel (Obys style)
    let isLerpActive = true;
    let lastActiveFrame = 0;

    // Use passive wheel listener for performance
    window.addEventListener('wheel', (e) => {
      // We don't prevent default to allow native scroll but track target
    }, { passive: true });

    // ============================================
    // Scroll-Driven Frame Logic
    // ============================================
    function getScrollProgress() {
      const rect = section.getBoundingClientRect();
      const sectionTop = window.scrollY + rect.top;
      const sectionHeight = section.offsetHeight;
      const viewportHeight = window.innerHeight;

      // Calculate progress: 0 at top of section, 1 at bottom
      const scrolled = currentScroll - sectionTop;
      const totalScrollable = sectionHeight - viewportHeight;
      const progress = Math.max(0, Math.min(1, scrolled / totalScrollable));

      return progress;
    }

    function updateFrame(progress) {
      // Map progress to frame index (0-6)
      const rawFrame = progress * (TOTAL_FRAMES - 1);
      const frameIndex = Math.round(rawFrame);
      const clampedFrame = Math.max(0, Math.min(TOTAL_FRAMES - 1, frameIndex));

      if (clampedFrame !== lastActiveFrame) {
        // Update active image
        images.forEach((img, i) => {
          img.classList.toggle('active', i === clampedFrame);
        });

        // Update labels
        labels.forEach((label, i) => {
          label.classList.toggle('active', i === clampedFrame);
        });

        // Update dots
        dots.forEach((dot, i) => {
          dot.classList.toggle('active', i === clampedFrame);
        });

        // Update frame counter with animation
        const displayNum = String(clampedFrame + 1).padStart(2, '0');
        frameCurrent.style.transform = 'translateY(-10px)';
        frameCurrent.style.opacity = '0';

        setTimeout(() => {
          frameCurrent.textContent = displayNum;
          frameCurrent.style.transform = 'translateY(10px)';

          requestAnimationFrame(() => {
            frameCurrent.style.transition = 'transform 0.35s cubic-bezier(0.16,1,0.3,1), opacity 0.35s ease';
            frameCurrent.style.transform = 'translateY(0)';
            frameCurrent.style.opacity = '1';
          });
        }, 100);

        lastActiveFrame = clampedFrame;
      }

      // Subtle parallax on the image canvas
      const parallaxOffset = (progress - 0.5) * 20;
      const canvas = document.getElementById('image-canvas');
      canvas.style.transform = `translateY(${parallaxOffset}px) scale(${1 + progress * 0.03})`;

      // Glow effect intensity based on progress
      const glow = document.getElementById('product-glow');
      const glowScale = 0.8 + progress * 0.4;
      glow.style.transform = `scale(${glowScale})`;
      glow.style.opacity = 0.5 + progress * 0.5;
    }

    // ============================================
    // Animation Loop (Lerp)
    // ============================================
    function lerpLoop() {
      // Smooth interpolation towards actual scroll position
      targetScroll = window.scrollY;
      currentScroll += (targetScroll - currentScroll) * LERP_FACTOR;

      // Snap when close enough to avoid perpetual micro-updates
      if (Math.abs(targetScroll - currentScroll) < 0.5) {
        currentScroll = targetScroll;
      }

      // Calculate scroll progress for the image sequence section
      const progress = getScrollProgress();
      updateFrame(progress);

      // Update global scroll percentage
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      const globalPercent = Math.round((currentScroll / totalHeight) * 100);
      scrollPercentEl.textContent = globalPercent + '%';

      // Nav visibility (hide at very top)
      if (currentScroll > 100) {
        nav.classList.add('visible');
      } else {
        // Keep visible after preloader
      }

      requestAnimationFrame(lerpLoop);
    }

    requestAnimationFrame(lerpLoop);

    // ============================================
    // Dot Click Navigation
    // ============================================
    dots.forEach((dot, i) => {
      dot.addEventListener('click', () => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.offsetHeight;
        const viewportHeight = window.innerHeight;
        const totalScrollable = sectionHeight - viewportHeight;
        const targetProgress = i / (TOTAL_FRAMES - 1);
        const scrollTarget = sectionTop + totalScrollable * targetProgress;

        window.scrollTo({
          top: scrollTarget,
          behavior: 'smooth'
        });
      });
    });

    // ============================================
    // Intersection Observer — Reveal Animations
    // ============================================
    const revealCards = document.querySelectorAll('.detail-card');

    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Stagger the reveal based on card index
            const card = entry.target;
            const siblings = [...card.parentElement.children];
            const index = siblings.indexOf(card);

            setTimeout(() => {
              card.classList.add('revealed');
            }, index * 150);

            revealObserver.unobserve(card);
          }
        });
      },
      {
        threshold: 0.2,
        rootMargin: '0px 0px -50px 0px'
      }
    );

    revealCards.forEach((card) => revealObserver.observe(card));

    // ============================================
    // Story Section Reveal
    // ============================================
    const storyContent = document.querySelector('.story-content');
    if (storyContent) {
      storyContent.style.opacity = '0';
      storyContent.style.transform = 'translateY(40px)';
      storyContent.style.transition = 'opacity 1s cubic-bezier(0.16,1,0.3,1), transform 1s cubic-bezier(0.16,1,0.3,1)';

      const storyObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              storyContent.style.opacity = '1';
              storyContent.style.transform = 'translateY(0)';
              storyObserver.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.3 }
      );

      storyObserver.observe(storyContent);
    }

    // ============================================
    // Smooth Anchor Links
    // ============================================
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
      anchor.addEventListener('click', (e) => {
        e.preventDefault();
        const target = document.querySelector(anchor.getAttribute('href'));
        if (target) {
          window.scrollTo({
            top: target.offsetTop,
            behavior: 'smooth'
          });
        }
      });
    });

    // ============================================
    // Keyboard Navigation for Image Sequence
    // ============================================
    document.addEventListener('keydown', (e) => {
      // Only activate when the section is in view
      const rect = section.getBoundingClientRect();
      const isInView = rect.top <= window.innerHeight && rect.bottom >= 0;

      if (!isInView) return;

      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        const nextFrame = Math.min(lastActiveFrame + 1, TOTAL_FRAMES - 1);
        scrollToFrame(nextFrame);
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        const prevFrame = Math.max(lastActiveFrame - 1, 0);
        scrollToFrame(prevFrame);
      }
    });

    function scrollToFrame(frameIndex) {
      const sectionTop = section.offsetTop;
      const sectionHeight = section.offsetHeight;
      const viewportHeight = window.innerHeight;
      const totalScrollable = sectionHeight - viewportHeight;
      const targetProgress = frameIndex / (TOTAL_FRAMES - 1);
      const scrollTarget = sectionTop + totalScrollable * targetProgress;

      window.scrollTo({
        top: scrollTarget,
        behavior: 'smooth'
      });
    }
  }
})();
