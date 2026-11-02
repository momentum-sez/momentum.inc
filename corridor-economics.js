/* ═══════════════════════════════════════
   NETWORK ECONOMICS CALCULATOR
   Vanilla JS — drops into thesis.html
   Entity-driven zone economics + N×(N-1)/2
   corridor multiplier, made visceral.
   ═══════════════════════════════════════ */

(function () {
  'use strict';

  /* Fee schedule — per entity per year.
     Based on published free zone fee schedules (DIFC, DMCC, JAFZA).
     DIFC: ~$300M annual revenue from ~7,000 entities ≈ $43K/entity.
     Our $36K total is deliberately conservative. */
  const FEE_LAYERS = [
    { label: 'Formation & licensing',  amount: 10000 },
    { label: 'Banking & accounts',     amount: 6000 },
    { label: 'Compliance & reporting', amount: 4000 },
    { label: 'Payments & FX',         amount: 12000 },
    { label: 'Corridor passporting',   amount: 4000 }
  ];
  const PER_ENTITY = 36000;
  const DEPLOY_COST_PER_ZONE = 10000000;

  /* Benchmark scenarios */
  const BENCHMARKS = [
    { label: 'Seed',       z: 7,   e: 500 },
    { label: 'Growth',     z: 30,  e: 2000 },
    { label: 'DIFC-scale', z: 30,  e: 7000 },
    { label: 'DMCC-scale', z: 100, e: 45000 },
    { label: 'IFZA-scale', z: 100, e: 70000 }
  ];

  function fmt(n) {
    if (n >= 1e12) return '$' + (n / 1e12).toFixed(1) + 'T';
    if (n >= 1e9) return '$' + (n / 1e9).toFixed(1) + 'B';
    if (n >= 1e6) return '$' + (n / 1e6).toFixed(1) + 'M';
    if (n >= 1e3) return '$' + (n / 1e3).toFixed(0) + 'K';
    return '$' + n.toFixed(0);
  }

  function plain(n) { return n.toLocaleString('en-US'); }

  function init() {
    const root = document.getElementById('corridor-calc');
    if (!root) return;

    /* Build fee schedule rows */
    let feeRows = '';
    FEE_LAYERS.forEach(f => {
      feeRows += '<div class="cc-fee-row"><span>' + f.label + '</span><span>$' + plain(f.amount) + '</span></div>';
    });

    root.innerHTML = `
      <div class="cc-header">
        <h3 class="cc-title">Network Economics</h3>
        <div class="cc-rule"></div>
        <p class="cc-subtitle">Each zone generates revenue from every entity formed, every compliance check, every transaction settled. N zones create N&times;(N&minus;1)/2 corridors. Scale is quadratic.</p>
      </div>

      <div class="cc-inputs">
        <div class="cc-slider-block">
          <div class="cc-slider-head">
            <span class="cc-slider-label">Zones in Network</span>
            <span class="cc-big-num" id="cc-zone-count">30</span>
          </div>
          <input type="range" id="cc-slider-z" min="3" max="150" value="30" class="cc-range" aria-label="Number of zones">
          <div class="cc-milestones">
            <button class="cc-ms" data-val="7" data-target="z">Current (7)</button>
            <button class="cc-ms" data-val="30" data-target="z">Near-term (30)</button>
            <button class="cc-ms" data-val="100" data-target="z">Target (100)</button>
          </div>
        </div>

        <div class="cc-slider-block">
          <div class="cc-slider-head">
            <span class="cc-slider-label">Entities per Zone</span>
            <span class="cc-big-num" id="cc-entity-count">2,000</span>
          </div>
          <input type="range" id="cc-slider-e" min="100" max="100000" value="2000" step="100" class="cc-range" aria-label="Entities per zone">
          <div class="cc-milestones">
            <button class="cc-ms" data-val="500" data-target="e">Early (500)</button>
            <button class="cc-ms" data-val="2000" data-target="e">Growth (2,000)</button>
            <button class="cc-ms" data-val="7000" data-target="e">DIFC-scale (7,000)</button>
            <button class="cc-ms" data-val="50000" data-target="e">At scale (50,000)</button>
          </div>
        </div>
      </div>

      <div class="cc-fee-schedule">
        <div class="cc-fee-head">Revenue per entity / year</div>
        ${feeRows}
        <div class="cc-fee-row cc-fee-total"><span>Total</span><span>$${plain(PER_ENTITY)}</span></div>
      </div>

      <div class="cc-rule-gold"></div>

      <div class="cc-hero">
        <div class="cc-hero-val" id="cc-total-rev">$2.16B</div>
        <div class="cc-hero-label">Annual Network Revenue</div>
        <div class="cc-hero-sub" id="cc-hero-sub">60,000 entities across 30 zones</div>
      </div>

      <div class="cc-metrics">
        <div class="cc-metric">
          <div class="cc-metric-val" id="cc-entities">60,000</div>
          <div class="cc-metric-label">Total Entities</div>
          <div class="cc-metric-sub" id="cc-entities-sub">30 &times; 2,000</div>
        </div>
        <div class="cc-metric cc-highlight">
          <div class="cc-metric-val" id="cc-per-zone">$72M</div>
          <div class="cc-metric-label">Revenue per Zone</div>
          <div class="cc-metric-sub" id="cc-per-zone-sub">2,000 entities &times; $36K</div>
        </div>
        <div class="cc-metric">
          <div class="cc-metric-val" id="cc-corridors">435</div>
          <div class="cc-metric-label">Corridors</div>
          <div class="cc-metric-sub" id="cc-corridors-sub">30 &times; 29 / 2</div>
        </div>
        <div class="cc-metric cc-highlight">
          <div class="cc-metric-val" id="cc-hub">15&times;</div>
          <div class="cc-metric-label">Hub Advantage</div>
          <div class="cc-metric-sub" id="cc-hub-sub">Hub: 435 vs New: 29</div>
        </div>
      </div>

      <div class="cc-vis-wrap">
        <svg id="cc-vis" viewBox="0 0 360 280" class="cc-vis"></svg>
      </div>

      <div class="cc-rule-gold"></div>

      <table class="cc-table">
        <thead>
          <tr>
            <th class="left">Scenario</th><th>Zones</th><th>Ent/Zone</th><th>Revenue</th><th>/Zone</th><th>Corridors</th><th>Hub</th>
          </tr>
        </thead>
        <tbody id="cc-tbody"></tbody>
      </table>

      <div class="cc-insight" id="cc-insight"></div>

      <div class="cc-footer">
        Per-entity fees based on published free zone fee schedules (DIFC, DMCC, JAFZA). DIFC: ~$300M annual revenue from ~7,000 entities. Model excludes FDI multiplier, lending, and marketplace transaction fees.
      </div>
    `;

    const sliderZ = document.getElementById('cc-slider-z');
    const sliderE = document.getElementById('cc-slider-e');
    const milestones = root.querySelectorAll('.cc-ms');

    function update(z, e) {
      const totalEntities = z * e;
      const totalRev = totalEntities * PER_ENTITY;
      const revPerZone = e * PER_ENTITY;
      const corridors = z * (z - 1) / 2;
      const late = z - 1;
      const hubVsLate = Math.round(corridors / late);

      /* Hero */
      document.getElementById('cc-total-rev').textContent = fmt(totalRev);
      document.getElementById('cc-hero-sub').textContent =
        plain(totalEntities) + ' entities across ' + z + ' zones';

      /* Counts */
      document.getElementById('cc-zone-count').textContent = z;
      document.getElementById('cc-entity-count').textContent = plain(e);

      /* Metrics */
      document.getElementById('cc-entities').textContent = plain(totalEntities);
      document.getElementById('cc-entities-sub').textContent = z + ' \u00D7 ' + plain(e);

      document.getElementById('cc-per-zone').textContent = fmt(revPerZone);
      document.getElementById('cc-per-zone-sub').textContent =
        plain(e) + ' entities \u00D7 $' + plain(PER_ENTITY);

      document.getElementById('cc-corridors').textContent = plain(corridors);
      document.getElementById('cc-corridors-sub').textContent =
        z + ' \u00D7 ' + (z - 1) + ' / 2';

      document.getElementById('cc-hub').textContent = hubVsLate + '\u00D7';
      document.getElementById('cc-hub-sub').textContent =
        'Hub: ' + plain(corridors) + ' vs New: ' + plain(late);

      /* Slider fills */
      const pctZ = ((z - 3) / (150 - 3)) * 100;
      sliderZ.style.setProperty('--fill', pctZ + '%');
      const pctE = ((e - 100) / (100000 - 100)) * 100;
      sliderE.style.setProperty('--fill', pctE + '%');

      /* Milestone active states */
      milestones.forEach(btn => {
        const target = btn.getAttribute('data-target');
        const val = parseInt(btn.getAttribute('data-val'));
        if (target === 'z') {
          btn.classList.toggle('active', val === z);
        } else {
          btn.classList.toggle('active', val === e);
        }
      });

      /* Benchmark table */
      const tbody = document.getElementById('cc-tbody');
      tbody.innerHTML = BENCHMARKS.map(b => {
        const bEnt = b.z * b.e;
        const bRev = bEnt * PER_ENTITY;
        const bRevZ = b.e * PER_ENTITY;
        const bCorr = b.z * (b.z - 1) / 2;
        const bHub = Math.round(bCorr / (b.z - 1));
        const active = b.z === z && b.e === e;
        return `<tr class="${active ? 'active' : ''}" data-bz="${b.z}" data-be="${b.e}">
          <td class="left">${b.label}</td>
          <td>${b.z}</td>
          <td class="mono">${plain(b.e)}</td>
          <td>${fmt(bRev)}</td>
          <td>${fmt(bRevZ)}</td>
          <td class="mono">${plain(bCorr)}</td>
          <td class="gold">${bHub}\u00D7</td>
        </tr>`;
      }).join('');

      tbody.querySelectorAll('tr').forEach(tr => {
        tr.addEventListener('click', () => {
          const bz = parseInt(tr.getAttribute('data-bz'));
          const be = parseInt(tr.getAttribute('data-be'));
          sliderZ.value = bz;
          sliderE.value = be;
          update(bz, be);
        });
      });

      /* Insight — dynamic prose with real-world comparisons */
      const insight = document.getElementById('cc-insight');
      if (z <= 10) {
        insight.textContent =
          'At ' + z + ' zones with ' + plain(e) + ' entities each, the network generates ' +
          fmt(totalRev) + ' annually from ' + plain(totalEntities) + ' entities. ' +
          'Revenue per zone: ' + fmt(revPerZone) + '. ' +
          'Each entity pays across five fee layers \u2014 formation, banking, compliance, payments, and corridor access. ' +
          'The quadratic corridor multiplier has not yet engaged.';
      } else if (z <= 50) {
        insight.textContent =
          plain(totalEntities) + ' entities across ' + z + ' zones produce ' +
          fmt(totalRev) + ' in annual network revenue. Each zone generates ' + fmt(revPerZone) +
          ' \u2014 for comparison, DIFC generates ~$300M from ~7,000 entities. ' +
          plain(corridors) + ' corridors create a ' + hubVsLate + '\u00D7 structural advantage ' +
          'for the hub operator over any late entrant. The moat is forming.';
      } else if (z <= 100) {
        insight.textContent =
          'At ' + z + ' zones, ' + plain(totalEntities) + ' entities generate ' + fmt(totalRev) +
          ' across the network. Revenue per zone: ' + fmt(revPerZone) + '. ' +
          'With ' + plain(corridors) + ' corridors, the hub operator holds a ' +
          hubVsLate + '\u00D7 advantage over any new entrant. ' +
          'No competing network can replicate the compliance context embedded across ' +
          plain(totalEntities) + ' entities. The infrastructure layer has achieved escape velocity.';
      } else {
        insight.textContent =
          z + ' zones, ' + plain(totalEntities) + ' entities, ' + fmt(totalRev) +
          ' in annual network revenue. Revenue per zone: ' + fmt(revPerZone) +
          '. The hub operator controls ' + plain(corridors) + ' corridors \u2014 ' +
          hubVsLate + '\u00D7 more than any single new entrant can access. ' +
          'Switching costs are embedded in every entity, every compliance record, every banking relationship. ' +
          'The corridor layer has consolidated.';
      }

      /* Visualization */
      drawNetwork(z, corridors);
    }

    function drawNetwork(z, c) {
      const svg = document.getElementById('cc-vis');
      const W = 360, H = 280;
      const cx = W / 2, cy = H / 2, r = Math.min(cx, cy) - 28;

      const dn = Math.min(z, 40);
      const t = Math.min((z - 3) / (150 - 3), 1);

      let html = '';

      const nodes = [];
      for (let i = 0; i < dn; i++) {
        const angle = (2 * Math.PI * i) / dn - Math.PI / 2;
        nodes.push({
          x: cx + r * Math.cos(angle),
          y: cy + r * Math.sin(angle),
          hub: i < 3
        });
      }

      const lineOp = (0.55 + t * 0.35).toFixed(3);
      const lineSw = (0.6 + t * 0.8).toFixed(2);
      const lineStroke = '#C5A572';

      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          html += '<line x1="' + nodes[i].x.toFixed(1) + '" y1="' + nodes[i].y.toFixed(1) +
            '" x2="' + nodes[j].x.toFixed(1) + '" y2="' + nodes[j].y.toFixed(1) +
            '" stroke="' + lineStroke + '" stroke-width="' + lineSw + '" opacity="' + lineOp + '"/>';
        }
      }

      const nodeR = 3 + t * 2;
      const hubR = 5 + t * 2;

      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        html += '<circle cx="' + n.x.toFixed(1) + '" cy="' + n.y.toFixed(1) +
          '" r="' + (n.hub ? hubR.toFixed(1) : nodeR.toFixed(1)) + '" fill="' + (n.hub ? '#C5A572' : '#FAF8F5') +
          '" stroke="' + (n.hub ? '#C5A572' : '#1B2A4A') +
          '" stroke-width="' + (n.hub ? 2 : 1) + '"/>';
      }

      html += '<text x="' + cx + '" y="' + cy +
        '" text-anchor="middle" dominant-baseline="middle" fill="#1B2A4A" font-size="13" font-weight="600" opacity="0.7">' +
        plain(c) + '</text>';
      html += '<text x="' + cx + '" y="' + (cy + 16) +
        '" text-anchor="middle" dominant-baseline="middle" fill="#8A8A7A" font-size="10" letter-spacing="0.08em">CORRIDORS</text>';

      svg.innerHTML = html;
    }

    let rafPending = false;
    function scheduleUpdate() {
      if (!rafPending) {
        rafPending = true;
        requestAnimationFrame(() => {
          rafPending = false;
          update(parseInt(sliderZ.value), parseInt(sliderE.value));
        });
      }
    }
    sliderZ.addEventListener('input', scheduleUpdate);
    sliderE.addEventListener('input', scheduleUpdate);

    milestones.forEach(btn => {
      btn.addEventListener('click', () => {
        const target = btn.getAttribute('data-target');
        const val = parseInt(btn.getAttribute('data-val'));
        if (target === 'z') {
          sliderZ.value = val;
        } else {
          sliderE.value = val;
        }
        update(parseInt(sliderZ.value), parseInt(sliderE.value));
      });
    });

    update(30, 2000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
