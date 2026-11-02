/* network-economics.js — Interactive Network Economics Visualizer
   Shows hub-and-spoke corridor network as zones come online 2025→2028.
   Corridor formation is bilateral sovereign negotiation (~$1M, 2–4 years per corridor);
   realized topology is far sparser than n(n−1)/2. Network value scales Odlyzko O(n log n),
   concentrated at hub zones. Vanilla JS, no dependencies. Respects prefers-reduced-motion. */

(function () {
    'use strict';

    var NS = 'http://www.w3.org/2000/svg';
    var XLINK = 'http://www.w3.org/1999/xlink';
    var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* ── Corridor color palette (matches mesh.js) ── */
    var CORRIDOR_COLORS = {
        cross:   '#8b4c3a',
        federal: '#3a5f7a',
        fzHost:  '#4a6b4a',
        fzFz:    '#7a6b4a'
    };

    /* ── Zone data ──
       Positions from mesh.js (1920×1080 coordinate space).
       wave: 0=2025, 1=2026, 2=2027, 3=2028
       region: us, caribbean, gulf, asia, africa, europe, latam */
    var ZONES = [
        /* Wave 0 — 2025: Foundation + Global Expansion (live + testnet) */
        { id: 'us-de', name: 'Delaware', x: 551, y: 333, wave: 0, region: 'us' },
        { id: 'us-ny', name: 'New York', x: 570, y: 313, wave: 0, region: 'us' },
        { id: 'us-ca', name: 'California', x: 308, y: 342, wave: 0, region: 'us' },
        { id: 'us-nv', name: 'Nevada', x: 346, y: 353, wave: 0, region: 'us' },
        { id: 'us-wy', name: 'Wyoming', x: 401, y: 316, wave: 0, region: 'us' },
        { id: 'us-mt', name: 'Montana', x: 363, y: 275, wave: 0, region: 'us' },
        { id: 'ky', name: 'Cayman', x: 526, y: 481, wave: 0, region: 'caribbean' },
        { id: 'vg', name: 'BVI', x: 616, y: 488, wave: 0, region: 'caribbean' },
        { id: 'sg', name: 'Singapore', x: 1514, y: 617, wave: 0, region: 'asia' },
        { id: 'jp', name: 'Japan', x: 1704, y: 357, wave: 0, region: 'asia' },
        { id: 'au', name: 'Australia', x: 1765, y: 883, wave: 0, region: 'asia' },
        { id: 'gb', name: 'London', x: 960, y: 238, wave: 0, region: 'europe' },
        { id: 'gb-gi', name: 'Gibraltar', x: 932, y: 354, wave: 0, region: 'europe' },
        { id: 'eg', name: 'Egypt', x: 1127, y: 400, wave: 2, region: 'gulf' },
        { id: 'pk-sifc', name: 'Pakistan', x: 1350, y: 373, wave: 0, region: 'asia' },
        { id: 'rw', name: 'Rwanda', x: 1120, y: 641, wave: 0, region: 'africa' },
        { id: 'ng', name: 'Nigeria', x: 978, y: 578, wave: 0, region: 'africa' },
        { id: 'za', name: 'S. Africa', x: 1050, y: 895, wave: 0, region: 'africa' },
        { id: 'mu', name: 'Mauritius', x: 1266, y: 780, wave: 0, region: 'africa' },

        /* Wave 1 — 2026: Gulf Hub + Testnet */
        { id: 'hn-prospera', name: 'Pr\u00f3spera', x: 499, y: 504, wave: 1, region: 'caribbean' },
        { id: 'ae-abudhabi-adgm', name: 'ADGM', x: 1265, y: 415, wave: 1, region: 'gulf' },
        { id: 'ae-dubai-fzc', name: 'Dubai', x: 1296, y: 385, wave: 1, region: 'gulf' },
        { id: 'ae-dubai-ifza', name: 'IFZA', x: 1236, y: 448, wave: 1, region: 'gulf' },
        { id: 'hk', name: 'Hong Kong', x: 1569, y: 458, wave: 1, region: 'asia' },

        /* Wave 2 — 2027: Belt & Road */
        { id: 'kz-alatau', name: 'Alatau', x: 1370, y: 300, wave: 2, region: 'asia' },
        { id: 'qa-qfc', name: 'Qatar', x: 1208, y: 428, wave: 2, region: 'gulf' },
        { id: 'ke', name: 'Kenya', x: 1156, y: 637, wave: 2, region: 'africa' },
        { id: 'pt', name: 'Portugal', x: 911, y: 334, wave: 2, region: 'europe' },
        { id: 'kr', name: 'Korea', x: 1637, y: 343, wave: 2, region: 'asia' },
        { id: 'tz-zanzibar', name: 'Zanzibar', x: 1169, y: 674, wave: 2, region: 'africa' },
        { id: 'gm', name: 'Gambia', x: 872, y: 525, wave: 2, region: 'africa' },
        { id: 'cn-hangzhou', name: 'Hangzhou', x: 1601, y: 398, wave: 2, region: 'asia' },
        { id: 'za-kzn', name: 'KwaZulu Natal', x: 1095, y: 865, wave: 2, region: 'africa' },

        /* Wave 3 — 2028: Global Network */
        { id: 'cn-hainan', name: 'Hainan', x: 1548, y: 476, wave: 3, region: 'asia' },
        { id: 'id-bali', name: 'Bali', x: 1574, y: 690, wave: 3, region: 'asia' },
        { id: 'br-rio', name: 'Rio', x: 730, y: 800, wave: 3, region: 'latam' },
        { id: 'br-floripa', name: 'Florian\u00f3polis', x: 701, y: 835, wave: 3, region: 'latam' }
    ];

    /* ── Corridors ── from mesh.js. Visible when both endpoints active. */
    var CORRIDORS = [
        { from: 'ae-abudhabi-adgm', to: 'pk-sifc' },
        { from: 'ae-abudhabi-adgm', to: 'sg' },
        { from: 'ae-abudhabi-adgm', to: 'gb' },
        { from: 'eg', to: 'ae-abudhabi-adgm' },
        { from: 'qa-qfc', to: 'ae-abudhabi-adgm' },
        { from: 'kz-alatau', to: 'ae-abudhabi-adgm' },
        { from: 'kz-alatau', to: 'cn-hangzhou' },
        { from: 'kz-alatau', to: 'cn-hainan' },
        { from: 'ae-dubai-fzc', to: 'ae-abudhabi-adgm' },
        { from: 'ae-dubai-fzc', to: 'ae-dubai-ifza' },
        { from: 'ae-dubai-ifza', to: 'ae-abudhabi-adgm' },
        { from: 'cn-hainan', to: 'hk' },
        { from: 'cn-hainan', to: 'sg' },
        { from: 'cn-hainan', to: 'cn-hangzhou' },
        { from: 'cn-hainan', to: 'ae-dubai-fzc' },
        { from: 'cn-hainan', to: 'jp' },
        { from: 'cn-hainan', to: 'au' },
        { from: 'cn-hainan', to: 'kr' },
        { from: 'cn-hainan', to: 'id-bali' },
        { from: 'hk', to: 'sg' },
        { from: 'hk', to: 'jp' },
        { from: 'sg', to: 'au' },
        { from: 'kr', to: 'jp' },
        { from: 'gb', to: 'gb-gi' },
        { from: 'gb', to: 'ky' },
        { from: 'gb', to: 'sg' },
        { from: 'gb', to: 'hk' },
        { from: 'gb', to: 'za' },
        { from: 'gb', to: 'eg' },
        { from: 'pt', to: 'gb' },
        { from: 'pt', to: 'br-rio' },
        { from: 'rw', to: 'ke' },
        { from: 'rw', to: 'ng' },
        { from: 'ng', to: 'gm' },
        { from: 'ng', to: 'gb' },
        { from: 'gm', to: 'gb' },
        { from: 'ke', to: 'tz-zanzibar' },
        { from: 'za', to: 'mu' },
        { from: 'mu', to: 'tz-zanzibar' },
        { from: 'us-de', to: 'us-ny' },
        { from: 'us-ny', to: 'us-ca' },
        { from: 'us-ca', to: 'us-nv' },
        { from: 'us-wy', to: 'us-nv' },
        { from: 'us-wy', to: 'us-de' },
        { from: 'us-mt', to: 'us-wy' },
        { from: 'us-mt', to: 'us-de' },
        { from: 'us-mt', to: 'us-ny' },
        { from: 'us-mt', to: 'us-ca' },
        { from: 'us-mt', to: 'us-nv' },
        { from: 'us-de', to: 'ky' },
        { from: 'us-de', to: 'gb' },
        { from: 'us-de', to: 'ae-abudhabi-adgm' },
        { from: 'us-de', to: 'vg' },
        { from: 'us-ny', to: 'gb' },
        { from: 'us-ca', to: 'sg' },
        { from: 'us-ca', to: 'hk' },
        { from: 'us-ca', to: 'jp' },
        { from: 'us-ca', to: 'au' },
        { from: 'ky', to: 'vg' },
        { from: 'ky', to: 'sg' },
        { from: 'ky', to: 'hk' },
        { from: 'ky', to: 'ae-abudhabi-adgm' },
        { from: 'hn-prospera', to: 'ky' },
        { from: 'vg', to: 'gb' },
        { from: 'vg', to: 'sg' },
        { from: 'vg', to: 'ae-abudhabi-adgm' },
        { from: 'ae-abudhabi-adgm', to: 'mu' },
        { from: 'ae-abudhabi-adgm', to: 'ke' },
        { from: 'ae-abudhabi-adgm', to: 'hk' },
        { from: 'br-rio', to: 'br-floripa' }
    ];

    /* ── Wave metadata ── */
    var WAVES = [
        { year: '2025', zones: 13, label: 'Foundation', desc: 'US, Caribbean, Singapore, London, Japan, Australia, Africa' },
        { year: '2026', zones: 24, label: 'Gulf Hub', desc: 'ADGM, Dubai FZC, IFZA, Hong Kong, Pr\u00f3spera come online' },
        { year: '2027', zones: 42, label: 'Corridors', desc: 'Kazakhstan, Qatar, Korea, East Africa, Portugal, Egypt' },
        { year: '2028', zones: 64, label: 'Global Network', desc: 'Greater China, Southeast Asia, Latin America' }
    ];

    /* ── State ── */
    var currentWave = -1;
    var zoneMap = {};
    var zoneElements = {};
    var edgeElements = [];
    var numberEls = {};
    var yearBtns = [];
    var autoPlayed = false;
    var hoveredZone = null;

    /* ── SVG helper ── */
    function svgEl(tag, attrs) {
        var e = document.createElementNS(NS, tag);
        if (attrs) {
            for (var k in attrs) {
                if (attrs.hasOwnProperty(k)) e.setAttribute(k, attrs[k]);
            }
        }
        return e;
    }

    /* ── Number formatting ── */
    function formatNumber(n) {
        return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }

    /* ── Counter animation ── */
    function animateNumber(el, from, to, duration) {
        if (!el) return;
        if (reducedMotion || from === to) {
            el.textContent = formatNumber(to);
            return;
        }
        var startTime = null;
        var diff = to - from;
        function step(timestamp) {
            if (!startTime) startTime = timestamp;
            var progress = Math.min((timestamp - startTime) / duration, 1);
            var eased = 1 - Math.pow(1 - progress, 3);
            el.textContent = formatNumber(Math.round(from + diff * eased));
            if (progress < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
    }

    /* ── Corridor color classification ──
       Same logic as mesh.js: federal (within US), fz-fz (within same region),
       fz-host (region to Gulf), cross (intercontinental) */
    function corridorColor(a, b) {
        if (a.region === 'us' && b.region === 'us') return CORRIDOR_COLORS.federal;
        if (a.region === b.region) return CORRIDOR_COLORS.fzFz;
        if (a.region === 'gulf' || b.region === 'gulf') return CORRIDOR_COLORS.fzHost;
        return CORRIDOR_COLORS.cross;
    }

    /* ── Curved path (same math as mesh.js) ── */
    function corridorPath(a, b) {
        var mx = (a.x + b.x) / 2;
        var my = (a.y + b.y) / 2;
        var dx = b.x - a.x;
        var dy = b.y - a.y;
        var len = Math.sqrt(dx * dx + dy * dy);
        if (len === 0) return null;
        var offset = Math.min(len * 0.1, 40);
        var cx = mx - (dy / len) * offset;
        var cy = my + (dx / len) * offset;
        return 'M' + a.x + ',' + a.y + 'Q' + Math.round(cx) + ',' + Math.round(cy) + ',' + b.x + ',' + b.y;
    }

    /* ── Edge activation with draw-on effect (batched to avoid per-edge reflow) ── */
    function activateEdges(edges) {
        if (!edges.length) return;
        if (reducedMotion) {
            edges.forEach(function (e) { e.path.setAttribute('opacity', '0.4'); });
            return;
        }
        /* Write phase: set initial state with transitions disabled */
        edges.forEach(function (e) {
            var path = e.path;
            var length = path.getTotalLength();
            e._length = length;
            path.style.transition = 'none';
            path.setAttribute('stroke-dasharray', length);
            path.setAttribute('stroke-dashoffset', length);
            path.setAttribute('opacity', '0.4');
        });
        /* Single reflow to flush initial state */
        edges[0].path.getBoundingClientRect();
        /* Read phase: enable transitions and animate */
        edges.forEach(function (e) {
            e.path.style.transition = 'stroke-dashoffset 0.8s cubic-bezier(0.16, 1, 0.3, 1)';
            e.path.setAttribute('stroke-dashoffset', '0');
        });
    }

    function deactivateEdge(edge) {
        var path = edge.path;
        if (reducedMotion) {
            path.setAttribute('opacity', '0');
            path.removeAttribute('stroke-dasharray');
            path.removeAttribute('stroke-dashoffset');
            return;
        }
        path.style.transition = 'opacity 0.4s cubic-bezier(0.25, 0.1, 0.25, 1)';
        path.setAttribute('opacity', '0');
        setTimeout(function () {
            path.removeAttribute('stroke-dasharray');
            path.removeAttribute('stroke-dashoffset');
        }, 400);
    }

    /* ── Node hover ── */
    function handleNodeEnter(zoneId) {
        if (hoveredZone === zoneId) return;
        hoveredZone = zoneId;
        var els = zoneElements[zoneId];
        if (!els) return;

        els.glow.setAttribute('opacity', '1');
        els.label.setAttribute('opacity', '1');
        els.label.style.fontWeight = '600';

        edgeElements.forEach(function (e) {
            if (!e.wasActive) return;
            if (e.from === zoneId || e.to === zoneId) {
                e.path.setAttribute('opacity', '0.85');
                e.path.setAttribute('stroke-width', '2.5');
            }
        });
    }

    function handleNodeLeave(zoneId) {
        if (hoveredZone !== zoneId) return;
        hoveredZone = null;
        var els = zoneElements[zoneId];
        if (!els) return;

        var z = zoneMap[zoneId];
        var active = z && z.wave <= currentWave;
        els.glow.setAttribute('opacity', '0');
        els.label.setAttribute('opacity', active ? '0.6' : '0');
        els.label.style.fontWeight = '';

        edgeElements.forEach(function (e) {
            if (!e.wasActive) return;
            if (e.from === zoneId || e.to === zoneId) {
                e.path.setAttribute('opacity', '0.4');
                e.path.setAttribute('stroke-width', '1.5');
            }
        });
    }

    /* ── Set wave ── */
    function setWave(waveIndex) {
        if (waveIndex === currentWave) return;
        var prevWave = currentWave;
        currentWave = waveIndex;

        var activeZones = {};
        ZONES.forEach(function (z) {
            if (z.wave <= waveIndex) activeZones[z.id] = true;
        });

        /* Update nodes */
        ZONES.forEach(function (z) {
            var els = zoneElements[z.id];
            if (!els) return;
            var active = z.wave <= waveIndex;
            var targetOpacity = active ? '0.9' : '0.06';
            var labelOpacity = active ? '0.6' : '0';
            if (!reducedMotion) {
                els.node.style.transition = 'opacity 0.5s cubic-bezier(0.25, 0.1, 0.25, 1)';
                els.label.style.transition = 'opacity 0.5s cubic-bezier(0.25, 0.1, 0.25, 1), font-weight 0.2s cubic-bezier(0.25, 0.1, 0.25, 1)';
            }
            els.node.setAttribute('opacity', targetOpacity);
            els.label.setAttribute('opacity', labelOpacity);
        });

        /* Update edges — batch activations to avoid per-edge reflow */
        var toActivate = [];
        edgeElements.forEach(function (e) {
            var active = activeZones[e.from] && activeZones[e.to];
            if (active && !e.wasActive) {
                toActivate.push(e);
            } else if (!active && e.wasActive) {
                deactivateEdge(e);
            }
            e.wasActive = active;
        });
        activateEdges(toActivate);

        /* Update numbers */
        var wave = WAVES[waveIndex];
        var n = wave.zones;
        var corridors = n * (n - 1) / 2;
        var feePoints = corridors * 7;

        var prevN = prevWave >= 0 ? WAVES[prevWave].zones : 0;
        var prevCorridors = prevN * (prevN - 1) / 2;
        var prevFeePoints = prevCorridors * 7;

        animateNumber(numberEls.zones, prevN, n, 700);
        animateNumber(numberEls.corridors, prevCorridors, corridors, 700);
        animateNumber(numberEls.feePoints, prevFeePoints, feePoints, 700);

        if (numberEls.year) numberEls.year.textContent = wave.year;
        if (numberEls.waveLabel) numberEls.waveLabel.textContent = wave.label;
        if (numberEls.description) numberEls.description.textContent = wave.desc;

        /* Update slider + year buttons */
        var slider = document.getElementById('ne-slider');
        if (slider) {
            slider.value = waveIndex;
            slider.setAttribute('aria-valuetext', wave.year);
        }
        yearBtns.forEach(function (btn, i) {
            btn.classList.toggle('active', i <= waveIndex);
        });
    }

    /* ── Build visualization ── */
    function init(containerId) {
        var container = document.getElementById(containerId);
        if (!container) return;

        ZONES.forEach(function (z) { zoneMap[z.id] = z; });

        var svg = svgEl('svg', {
            viewBox: '0 100 1920 880',
            width: '100%',
            height: '100%',
            preserveAspectRatio: 'xMidYMid meet',
            'aria-hidden': 'true'
        });
        svg.style.display = 'block';

        /* ── World map background ── */
        var mapImg = svgEl('image', {
            x: '0',
            y: '0',
            width: '1920',
            height: '1080',
            preserveAspectRatio: 'xMidYMid meet',
            opacity: '0.6'
        });
        mapImg.setAttribute('href', '/world-map.svg');
        mapImg.setAttributeNS(XLINK, 'xlink:href', '/world-map.svg');
        svg.appendChild(mapImg);

        /* Edge group (behind nodes) */
        var edgeGroup = svgEl('g');
        CORRIDORS.forEach(function (c) {
            var a = zoneMap[c.from];
            var b = zoneMap[c.to];
            if (!a || !b) return;
            var d = corridorPath(a, b);
            if (!d) return;
            var color = corridorColor(a, b);
            var path = svgEl('path', {
                d: d,
                fill: 'none',
                stroke: color,
                'stroke-width': '1.5',
                'stroke-linecap': 'round',
                opacity: '0'
            });
            edgeGroup.appendChild(path);
            edgeElements.push({ path: path, from: c.from, to: c.to, wasActive: false });
        });
        svg.appendChild(edgeGroup);

        /* Node group */
        var nodeGroup = svgEl('g');
        ZONES.forEach(function (z) {
            var g = svgEl('g', { opacity: '0.06' });
            g.setAttribute('transform', 'translate(' + z.x + ',' + z.y + ')');
            g.style.cursor = 'pointer';

            /* Glow ring (visible on hover) */
            var glow = svgEl('circle', {
                r: '12',
                fill: 'none',
                stroke: '#1a1917',
                'stroke-width': '0.5',
                opacity: '0'
            });
            if (!reducedMotion) glow.style.transition = 'opacity 250ms cubic-bezier(0.25, 0.1, 0.25, 1)';
            g.appendChild(glow);

            /* Outer ring */
            g.appendChild(svgEl('circle', {
                r: '7',
                fill: 'none',
                stroke: '#1a1917',
                'stroke-width': '0.8',
                opacity: '0.3'
            }));

            /* Inner fill */
            g.appendChild(svgEl('circle', {
                r: '4',
                fill: '#1a1917',
                opacity: '0.9'
            }));

            /* Center dot */
            g.appendChild(svgEl('circle', {
                r: '1.5',
                fill: '#fefdfb',
                opacity: '0.95'
            }));

            nodeGroup.appendChild(g);

            /* Label */
            var label = svgEl('text', {
                x: z.x,
                y: z.y - 16,
                'text-anchor': 'middle',
                'font-family': "'garamond-premier-pro-caption', 'EB Garamond', serif",
                'font-size': '15',
                'letter-spacing': '0.03em',
                fill: '#4a4744',
                opacity: '0'
            });
            if (!reducedMotion) label.style.transition = 'opacity 0.3s cubic-bezier(0.25, 0.1, 0.25, 1), font-weight 0.2s cubic-bezier(0.25, 0.1, 0.25, 1)';
            label.textContent = z.name;
            nodeGroup.appendChild(label);

            zoneElements[z.id] = { node: g, label: label, glow: glow };

            /* Hover events */
            g.addEventListener('mouseenter', function () { handleNodeEnter(z.id); });
            g.addEventListener('mouseleave', function () { handleNodeLeave(z.id); });
        });
        svg.appendChild(nodeGroup);

        container.appendChild(svg);

        /* Cache DOM references */
        numberEls.zones = document.getElementById('ne-zones');
        numberEls.corridors = document.getElementById('ne-corridors');
        numberEls.feePoints = document.getElementById('ne-fee-points');
        numberEls.year = document.getElementById('ne-year');
        numberEls.waveLabel = document.getElementById('ne-wave-label');
        numberEls.description = document.getElementById('ne-description');

        /* Slider interaction */
        var slider = document.getElementById('ne-slider');
        if (slider) {
            slider.addEventListener('input', function () {
                autoPlayed = true;
                setWave(parseInt(this.value, 10));
            });
        }

        /* Year button interaction */
        yearBtns = [].slice.call(document.querySelectorAll('.ne-year-btn'));
        yearBtns.forEach(function (btn) {
            btn.addEventListener('click', function () {
                autoPlayed = true;
                var w = parseInt(this.dataset.wave, 10);
                setWave(w);
            });
        });

        /* Initial state */
        setWave(0);

        /* Auto-advance one step when section enters viewport */
        if ('IntersectionObserver' in window) {
            var observer = new IntersectionObserver(function (entries) {
                if (entries[0].isIntersecting && !autoPlayed) {
                    autoPlayed = true;
                    observer.disconnect();
                    setTimeout(function () {
                        if (currentWave === 0) setWave(1);
                    }, 1800);
                }
            }, { threshold: 0.3 });
            observer.observe(container);
        }
    }

    /* ── Auto-init ── */
    function boot() {
        if (document.getElementById('ne-mesh')) init('ne-mesh');
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
    }

    window.NetworkEconomics = { init: init };
})();
