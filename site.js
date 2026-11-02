/* site.js — Utilities for momentum.inc
   Mobile nav, IntersectionObserver reveals, stat counter, code typing.
   Vanilla JS, no dependencies. */

(function () {
    'use strict';

    var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* ── 1. Mobile Nav Toggle ── */
    var toggle = document.querySelector('.nav-toggle');
    var nav = document.getElementById('primary-nav');
    if (toggle && nav) {
        toggle.addEventListener('click', function () {
            var expanded = toggle.getAttribute('aria-expanded') === 'true';
            toggle.setAttribute('aria-expanded', String(!expanded));
            nav.setAttribute('data-open', String(!expanded));
        });

        /* Close mobile nav when a link is clicked */
        var navLinks = nav.querySelectorAll('a');
        navLinks.forEach(function (link) {
            link.addEventListener('click', function () {
                nav.setAttribute('data-open', 'false');
                toggle.setAttribute('aria-expanded', 'false');
            });
        });

        /* Close mobile nav on Escape key */
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && nav.getAttribute('data-open') === 'true') {
                nav.setAttribute('data-open', 'false');
                toggle.setAttribute('aria-expanded', 'false');
                toggle.focus();
            }
        });
    }

    /* ── 2. Header scroll state (rAF-throttled) ── */
    var header = document.querySelector('.site-header');
    if (header) {
        var scrollTicking = false;
        window.addEventListener('scroll', function () {
            if (!scrollTicking) {
                scrollTicking = true;
                requestAnimationFrame(function () {
                    header.classList.toggle('scrolled', window.scrollY > 40);
                    scrollTicking = false;
                });
            }
        }, { passive: true });
        header.classList.toggle('scrolled', window.scrollY > 40);
    }

    /* ── 3. IntersectionObserver for reveals ── */
    if ('IntersectionObserver' in window && !reducedMotion) {
        var revealObs = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    revealObs.unobserve(entry.target);
                }
            });
        }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

        document.querySelectorAll('.reveal').forEach(function (el) {
            revealObs.observe(el);
        });

        /* Legacy support: also handle .reveal-on-scroll from existing pages */
        var legacyObs = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('revealed');
                    legacyObs.unobserve(entry.target);
                }
            });
        }, { threshold: 0.08, rootMargin: '0px 0px -50px 0px' });

        var vh = window.innerHeight;
        var legacySelectors = [
            '.bridge-section > .container', '.section-header', '.pillars-grid',
            '.paths-grid', '.credibility-content', '.arch-stack', '.case-study-grid',
            '.partner-grid', '.team-grid', '.engage-grid', '.paper-list', '.value-grid',
            '.stack-grid', '.product-content', '.product-stats', '.magnitude-table',
            '.economics-grid', '.primitive-list', '.resource-list', '.principle-grid',
            '.compliance-grid', '.deployment-list', '.vision-callout .container',
            '.cta-content', '.contact-content', '.article-content > .container'
        ].join(', ');

        /* Read pass: measure all positions before any DOM writes */
        var legacyEls = [];
        document.querySelectorAll(legacySelectors).forEach(function (el) {
            legacyEls.push({ el: el, below: el.getBoundingClientRect().top > vh * 0.8 });
        });

        var staggerSelectors = [
            '.pillars-grid', '.paths-grid', '.stats-grid', '.case-study-grid',
            '.partner-grid', '.team-grid', '.engage-grid', '.value-grid',
            '.stack-grid', '.principle-grid', '.compliance-grid', '.deployment-list'
        ].join(', ');

        var staggerEls = [];
        document.querySelectorAll(staggerSelectors).forEach(function (g) {
            staggerEls.push({ el: g, below: g.getBoundingClientRect().top > vh * 0.8 });
        });

        /* Write pass: apply classes and observe (no interleaved reads) */
        legacyEls.forEach(function (item) {
            if (item.below) {
                item.el.classList.add('reveal-on-scroll');
                legacyObs.observe(item.el);
            }
        });

        staggerEls.forEach(function (item) {
            if (item.below) {
                item.el.classList.add('stagger-children');
            }
        });
    }

    /* ── 4. Stat Counter Animation ── */
    function animateCounter(el) {
        var target = parseFloat(el.getAttribute('data-target'));
        var prefix = el.getAttribute('data-prefix') || '';
        var suffix = el.getAttribute('data-suffix') || '';
        var isDecimal = String(target).indexOf('.') !== -1;

        /* Reduced motion: set final value immediately */
        if (reducedMotion) {
            if (isDecimal) {
                el.textContent = prefix + target.toFixed(1) + suffix;
            } else {
                el.textContent = prefix + target.toLocaleString() + suffix;
            }
            return;
        }

        var duration = 600;
        var start = null;

        /* Special case: no animation for values with < prefix */
        if (prefix === '<') {
            el.textContent = prefix + '$' + target + suffix;
            return;
        }

        function step(ts) {
            if (!start) start = ts;
            var progress = Math.min((ts - start) / duration, 1);
            /* Ease-out cubic */
            var t = 1 - Math.pow(1 - progress, 3);
            var current = t * target;

            if (isDecimal) {
                el.textContent = prefix + current.toFixed(1) + suffix;
            } else {
                el.textContent = prefix + Math.floor(current).toLocaleString() + suffix;
            }

            if (progress < 1) {
                requestAnimationFrame(step);
            } else {
                if (isDecimal) {
                    el.textContent = prefix + target.toFixed(1) + suffix;
                } else {
                    el.textContent = prefix + target.toLocaleString() + suffix;
                }
            }
        }

        requestAnimationFrame(step);
    }

    if ('IntersectionObserver' in window) {
        var statObs = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    animateCounter(entry.target);
                    statObs.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });

        document.querySelectorAll('.stat-number[data-target]').forEach(function (el) {
            statObs.observe(el);
        });
    }

    /* ── 5. Code Line Reveal Animation ── */
    if ('IntersectionObserver' in window && !reducedMotion) {
        var codeObs = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    var lines = entry.target.querySelectorAll('.code-line');
                    lines.forEach(function (line, i) {
                        setTimeout(function () {
                            line.classList.add('visible');
                        }, i * 80);
                    });
                    codeObs.unobserve(entry.target);
                }
            });
        }, { threshold: 0.2 });

        document.querySelectorAll('.code-typed').forEach(function (el) {
            codeObs.observe(el);
        });
    }

    /* ── 6. Scroll-Synced Code Panel ── */
    /* Supports multiple .code-scroll-layout sections on the same page.
     * Each layout is initialized independently with its own scene state. */
    (function initScrollCodePanels() {
        var layouts = document.querySelectorAll('.code-scroll-layout');
        if (!layouts.length) return;

        layouts.forEach(function (layout) {
            var chapters = layout.querySelectorAll('.code-chapter');
            if (!chapters.length) return;

            var panel = layout.querySelector('.code-panel');
            var scenes = panel.querySelectorAll('.code-scene');
            var titleEl = panel.querySelector('.title');
            var isMobile = window.innerWidth < 768;

            /* Build scene title map from data-title attributes on each scene */
            var sceneMeta = {};
            scenes.forEach(function (sc) {
                var name = sc.getAttribute('data-scene');
                var title = sc.getAttribute('data-title');
                if (name && title) sceneMeta[name] = title;
            });

            /* Mobile / reduced motion: show everything statically */
            if (reducedMotion || isMobile) {
                chapters.forEach(function (ch) { ch.style.opacity = '1'; });
                return;
            }

            /* First scene is determined by the first chapter's data-scene */
            var firstSceneName = chapters[0] ? chapters[0].getAttribute('data-scene') : null;
            var currentScene = firstSceneName;

            function activateScene(sceneName) {
                if (sceneName === currentScene) return;
                currentScene = sceneName;

                scenes.forEach(function (sc) {
                    sc.classList.toggle('active', sc.getAttribute('data-scene') === sceneName);
                });

                if (titleEl && sceneMeta[sceneName]) {
                    titleEl.textContent = sceneMeta[sceneName];
                }
            }

            /* Set initial state */
            chapters[0].style.opacity = '1';

            /* Progressive chapter opacity driven by intersection ratio.
             * Uses 20 thresholds so opacity updates smoothly as the user
             * scrolls, rather than jumping at a single trigger point. */
            if ('IntersectionObserver' in window) {
                var thresholds = [];
                for (var t = 0; t <= 20; t++) { thresholds.push(t / 20); }

                /* Store each chapter's current ratio to resolve conflicts.
                 * When two chapters are both partially visible, only the
                 * one with the HIGHER ratio wins — eliminates ping-pong. */
                var ratios = {};
                chapters.forEach(function (ch) {
                    ratios[ch.getAttribute('data-scene')] = 0;
                });

                var chapterObs = new IntersectionObserver(function (entries) {
                    /* Update ratios and opacity for every reported entry */
                    entries.forEach(function (entry) {
                        var ch = entry.target;
                        var name = ch.getAttribute('data-scene');
                        var ratio = entry.isIntersecting ? entry.intersectionRatio : 0;

                        ratios[name] = ratio;
                        ch.style.opacity = 0.15 + ratio * 0.85;
                        /* Promote to compositor layer only while near viewport */
                        ch.style.willChange = entry.isIntersecting ? 'opacity' : 'auto';
                    });

                    /* Find the chapter with the highest visibility */
                    var bestScene = currentScene;
                    var bestRatio = ratios[currentScene] || 0;
                    for (var name in ratios) {
                        if (ratios[name] > bestRatio) {
                            bestRatio = ratios[name];
                            bestScene = name;
                        }
                    }

                    /* Only switch if a different chapter is clearly dominant */
                    if (bestScene !== currentScene && bestRatio > 0.15) {
                        activateScene(bestScene);
                    }
                }, {
                    threshold: thresholds,
                    rootMargin: '-8% 0px -8% 0px'
                });

                chapters.forEach(function (ch) {
                    chapterObs.observe(ch);
                });
            }
        });
    })();

    /* ── 7. Initialize mesh if present ── */
    if (window.MomentumMesh) {
        if (document.getElementById('mesh-container')) {
            window.MomentumMesh.init('mesh-container');
        }
        if (document.getElementById('explore-mesh')) {
            window.MomentumMesh.init('explore-mesh', { compact: true });
        }
    }

    /* ── 8. Font load detection ── */
    if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(function () {
            document.documentElement.classList.add('fonts-loaded');
        });
    }
})();
