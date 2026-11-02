/* ═══════════════════════════════════════
   ZONE COMPOSER
   Interactive zone composition demo.
   Visitors pick regulatory domains,
   watch YAML write itself, then deploy.
   YAML output matches ~/stack zone.yaml
   manifest format precisely.
   ═══════════════════════════════════════ */

(function () {
  'use strict';

  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var animationId = 0;

  /* ── Regulatory-to-compliance domain mapping ──
     Maps RegulatoryDomain variants (10) to ComplianceDomain variants (20).
     Mirrors regulatory_to_compliance_domains() in mez-tensor.
     Full RegulatoryDomain enum: CorporateFormation, CivicCode, DigitalAssets,
     Arbitration, Tax, AmlCft, DataPrivacy, Licensing, PaymentRails, Securities */
  var REGULATORY_TO_COMPLIANCE = {
    'corporate_formation': ['corporate', 'licensing'],
    'digital_assets': ['digital_assets', 'custody'],
    'tax': ['tax'],
    'arbitration': ['arbitration'],
    'aml_cft': ['aml', 'kyc', 'sanctions']
  };
  var ALWAYS_COMPLIANCE = ['consumer_protection', 'data_privacy'];

  /* ── Domain definitions ──
     RegulatoryDomain options with source jurisdictions matching
     ~/stack/jurisdictions/ zone manifest IDs. */
  var DOMAINS = [
    {
      id: 'corporate_formation',
      label: 'Corporate Formation',
      options: [
        { value: 'us-de',            name: 'Delaware',    framework: 'DGCL Title 8' },
        { value: 'ae-abudhabi-adgm', name: 'ADGM',       framework: 'Companies Regulations 2020' },
        { value: 'ae-dubai-difc',    name: 'DIFC',        framework: 'Companies Law No. 5 of 2018' },
        { value: 'ky',               name: 'Cayman',      framework: 'Companies Act (2023 Revision)' },
        { value: 'vg',               name: 'BVI',         framework: 'BVI Business Companies Act 2004' },
        { value: 'sg',               name: 'Singapore',   framework: 'Companies Act 1967' },
        { value: 'us-wy',            name: 'Wyoming',     framework: 'Wyoming LLC Act \u00A717-29' },
        { value: 'us-mt',            name: 'Montana',     framework: 'Montana LLC Act \u00A735-8' }
      ]
    },
    {
      id: 'digital_assets',
      label: 'Digital Assets',
      options: [
        { value: 'ae-abudhabi-adgm', name: 'ADGM (FSRA)',     framework: 'Virtual Asset Framework 2023' },
        { value: 'ae-dubai-difc',    name: 'DIFC (DFSA)',      framework: 'Digital Securities Framework' },
        { value: 'ky',               name: 'Cayman (CIMA)',    framework: 'Virtual Asset Service Providers Act' },
        { value: 'sg',               name: 'Singapore (MAS)',  framework: 'Payment Services Act 2019' },
        { value: 'hk',               name: 'Hong Kong (SFC)',  framework: 'Securities and Futures Ordinance' }
      ]
    },
    {
      id: 'tax',
      label: 'Tax',
      options: [
        { value: 'sg',    name: 'Singapore', framework: 'ITA \u2014 17% corporate' },
        { value: 'ky',    name: 'Cayman',    framework: '0% corporate, 0% capital gains' },
        { value: 'ae',    name: 'UAE',        framework: 'CT Law \u2014 9% above AED 375K' },
        { value: 'us-de', name: 'Delaware',   framework: '8.7% corporate + federal' },
        { value: 'vg',    name: 'BVI',        framework: '0% corporate, 0% withholding' }
      ]
    },
    {
      id: 'arbitration',
      label: 'Arbitration',
      options: [
        { value: 'ae-abudhabi-adgm', name: 'ADGM Courts',  framework: 'ADGM Arbitration Regulations 2015' },
        { value: 'ae-dubai-difc',    name: 'DIFC Courts',   framework: 'DIFC-LCIA Arbitration Centre' },
        { value: 'hk',               name: 'HKIAC',         framework: 'Arbitration Ordinance Cap 609' },
        { value: 'gb',               name: 'LCIA',           framework: 'LCIA Rules 2020' },
        { value: 'sg',               name: 'SIAC',           framework: 'SIAC Rules 2016 (6th Edition)' },
        { value: 'fr',               name: 'ICC',            framework: 'ICC Rules of Arbitration 2021' }
      ]
    },
    {
      id: 'aml_cft',
      label: 'AML / CFT',
      options: [
        { value: 'ae',             name: 'UAE (Federal)',     framework: 'Federal Decree-Law No. 20/2018' },
        { value: 'ae-dubai-difc',  name: 'DIFC (DFSA)',      framework: 'AML Module GEN 11' },
        { value: 'ky',             name: 'Cayman (CIMA)',    framework: 'Proceeds of Crime Act 2020' },
        { value: 'sg',             name: 'Singapore (MAS)',  framework: 'MAS Notice 626' },
        { value: 'pk',             name: 'Pakistan (FBR)',   framework: 'AML Act 2010 + FATF Action Plan' }
      ]
    }
  ];

  /* ── Deterministic mock regpack digests ──
     Two packs per jurisdiction: financial + sanctions.
     Matches regpacks[] structure in zone.yaml manifests. */
  var REGPACK_DIGESTS = {
    'us-de':            { financial: 'a3f8c1e7d4b29605', sanctions: 'b7d2a4e901c38f56' },
    'ae-abudhabi-adgm': { financial: '7b2e4d91f083ca56', sanctions: 'c4a1e8d3b5f09267' },
    'ae-dubai-difc':    { financial: '5c3a9f28e1d47b60', sanctions: 'd8e5f1a2c3b47960' },
    'ky':               { financial: 'd8e1b4c6a3f72950', sanctions: 'e2c5f8a4b1d36790' },
    'vg':               { financial: '9f4a2d87c1e5b360', sanctions: 'f1a8c2e4d3b59076' },
    'sg':               { financial: 'e1c5f834a2d79b06', sanctions: '8b3e1d4c5f027a69' },
    'us-wy':            { financial: 'b7d2a4e9c1f83560', sanctions: 'a2e5c1d4f8b30769' },
    'us-mt':            { financial: 'c6f3e1a2b4d85790', sanctions: 'b1d4e8a3c5f26097' },
    'hk':               { financial: '4d9b7c5ea1f23680', sanctions: 'c8e1a5d2b3f47096' },
    'gb':               { financial: '8a1f6e3dc2b59470', sanctions: 'd4e2a1c5f8b37069' },
    'fr':               { financial: '2e7c4b9af1d53086', sanctions: 'a5c8e1d3f2b40697' },
    'pk':               { financial: '6b3e9d74a1c25f80', sanctions: 'c1e4a8d2f5b30796' },
    'ae':               { financial: '3c7a5f18e2d49b06', sanctions: 'b5d1e8a4c3f20697' }
  };

  /* ── State ── */
  var selections = {};
  var step = 'compose';  // compose → locked → deployed → entity

  /* ── Derived state helpers ── */
  function primaryJurisdiction() {
    var corp = selections.corporate_formation;
    if (corp) return corp.value.split('-')[0];
    var keys = Object.keys(selections);
    if (keys.length > 0) return selections[keys[0]].value.split('-')[0];
    return 'xx';
  }

  function uniqueCountries() {
    var seen = {};
    var result = [];
    DOMAINS.forEach(function (domain) {
      var sel = selections[domain.id];
      if (!sel) return;
      var country = sel.value.split('-')[0];
      if (!seen[country]) {
        seen[country] = true;
        result.push(country);
      }
    });
    return result;
  }

  function derivedComplianceDomains() {
    var domains = {};
    ALWAYS_COMPLIANCE.forEach(function (d) { domains[d] = true; });
    Object.keys(selections).forEach(function (k) {
      var mapping = REGULATORY_TO_COMPLIANCE[k];
      if (mapping) mapping.forEach(function (d) { domains[d] = true; });
    });
    return Object.keys(domains).sort();
  }

  function uniqueSourceJurisdictions() {
    var seen = {};
    var result = [];
    DOMAINS.forEach(function (domain) {
      var sel = selections[domain.id];
      if (!sel) return;
      if (!seen[sel.value]) {
        seen[sel.value] = true;
        result.push(sel);
      }
    });
    return result;
  }

  /* ── Mount ── */
  function init() {
    var mount = document.getElementById('zone-composer');
    var output = document.getElementById('zc-output');
    if (!mount || !output) return;

    renderForm(mount, output);
    updateTerminal(output);
  }

  /* ── Form rendering ── */
  function renderForm(mount, output) {
    var html = '<div class="zc-form">';
    html += '<div class="zc-header">';
    html += '<span class="zc-prompt">$</span> msez compose <span class="zc-flag">--interactive</span>';
    html += '</div>';

    DOMAINS.forEach(function (domain) {
      html += '<div class="zc-domain-row">';
      html += '<label class="zc-domain-label" for="zc-' + domain.id + '">' + domain.label + '</label>';
      html += '<select class="zc-select" id="zc-' + domain.id + '" data-domain="' + domain.id + '">';
      html += '<option value="">--</option>';
      domain.options.forEach(function (opt) {
        html += '<option value="' + opt.value + '">' + opt.name + '</option>';
      });
      html += '</select>';
      html += '</div>';
    });

    html += '<div class="zc-actions">';
    html += '<button class="zc-action-btn" id="zc-lock" disabled>';
    html += '<span class="zc-btn-icon">&#9656;</span> Lock Dependencies';
    html += '</button>';
    html += '<button class="zc-action-btn" id="zc-deploy" disabled>';
    html += '<span class="zc-btn-icon">&#9656;</span> Deploy Corridors';
    html += '</button>';
    html += '<button class="zc-action-btn" id="zc-entity" disabled>';
    html += '<span class="zc-btn-icon">&#9656;</span> Create Entity';
    html += '</button>';
    html += '</div>';

    html += '<p class="zc-hint">Select regulatory domains to compose a synthetic zone</p>';
    html += '</div>';

    mount.innerHTML = html;

    /* Event listeners */
    var selects = mount.querySelectorAll('.zc-select');

    selects.forEach(function (sel) {
      sel.addEventListener('change', function () {
        var domainId = sel.getAttribute('data-domain');
        if (sel.value) {
          var domain = DOMAINS.find(function (d) { return d.id === domainId; });
          var option = domain.options.find(function (o) { return o.value === sel.value; });
          selections[domainId] = option;
        } else {
          delete selections[domainId];
        }

        /* Reset step if selections change after lock */
        if (step !== 'compose') {
          step = 'compose';
          resetButtons();
        }

        updateLockButton();
        updateTerminal(output);
      });
    });

    document.getElementById('zc-lock').addEventListener('click', function () {
      if (Object.keys(selections).length === 0) return;
      step = 'locked';
      var btn = this;
      btn.disabled = true;

      runCommand(output, buildLockData(), false, function () {
        btn.classList.add('completed');
        btn.innerHTML = '<span class="zc-btn-check">&#10003;</span> Dependencies Locked';
        document.getElementById('zc-deploy').disabled = false;
      });
    });

    document.getElementById('zc-deploy').addEventListener('click', function () {
      step = 'deployed';
      var btn = this;
      btn.disabled = true;

      runCommand(output, buildDeployData(), true, function () {
        btn.classList.add('completed');
        btn.innerHTML = '<span class="zc-btn-check">&#10003;</span> Corridors Deployed';
        document.getElementById('zc-entity').disabled = false;
      });
    });

    document.getElementById('zc-entity').addEventListener('click', function () {
      step = 'entity';
      var btn = this;
      btn.disabled = true;

      runCommand(output, buildEntityData(), true, function () {
        btn.classList.add('completed');
        btn.innerHTML = '<span class="zc-btn-check">&#10003;</span> Entity Created';
      });
    });
  }

  function updateLockButton() {
    var lockBtn = document.getElementById('zc-lock');
    if (!lockBtn) return;
    lockBtn.disabled = Object.keys(selections).length === 0;
  }

  function resetButtons() {
    animationId++; /* cancel any running animation */
    var lockBtn = document.getElementById('zc-lock');
    var deployBtn = document.getElementById('zc-deploy');
    var entityBtn = document.getElementById('zc-entity');
    lockBtn.className = 'zc-action-btn';
    lockBtn.innerHTML = '<span class="zc-btn-icon">&#9656;</span> Lock Dependencies';
    lockBtn.disabled = Object.keys(selections).length === 0;
    deployBtn.className = 'zc-action-btn';
    deployBtn.innerHTML = '<span class="zc-btn-icon">&#9656;</span> Deploy Corridors';
    deployBtn.disabled = true;
    entityBtn.className = 'zc-action-btn';
    entityBtn.innerHTML = '<span class="zc-btn-icon">&#9656;</span> Create Entity';
    entityBtn.disabled = true;
  }

  /* ── Terminal: instant render for compose step ── */
  function updateTerminal(output) {
    animationId++; /* cancel any running animation */
    var titleEl = document.getElementById('code-panel-title');

    if (step === 'compose') {
      if (titleEl) titleEl.textContent = 'zone.yaml';
      output.innerHTML = renderCompose();
    }
  }

  /* ── Animated terminal command execution ── */
  function runCommand(output, data, append, onComplete) {
    animationId++;
    var myId = animationId;

    var titleEl = document.getElementById('code-panel-title');
    if (titleEl) titleEl.textContent = 'terminal';

    var pre, codeEl;

    if (append && output.querySelector('code')) {
      /* Append to existing terminal session */
      pre = output.querySelector('pre');
      codeEl = output.querySelector('code');
      var oldCursor = codeEl.querySelector('.deploy-cursor');
      if (oldCursor) oldCursor.remove();
      codeEl.appendChild(document.createTextNode('\n'));
    } else {
      /* Fresh terminal session */
      output.innerHTML = '<pre class="code-block"><code></code></pre>';
      pre = output.querySelector('pre');
      codeEl = output.querySelector('code');
    }

    /* Reduced motion: show everything instantly */
    if (reducedMotion) {
      showFinal(codeEl, data);
      if (pre) pre.scrollTop = pre.scrollHeight;
      if (onComplete) onComplete();
      return;
    }

    /* Phase 1: Show prompt and type command character by character */
    var promptFrag = document.createRange().createContextualFragment(
      '<span class="code-prompt">$</span> '
    );
    codeEl.appendChild(promptFrag);

    var typedSpan = document.createElement('span');
    typedSpan.className = 'zc-typed';
    codeEl.appendChild(typedSpan);

    var cursor = document.createElement('span');
    cursor.className = 'deploy-cursor';
    cursor.textContent = '\u2588';
    codeEl.appendChild(cursor);

    if (pre) pre.scrollTop = pre.scrollHeight;

    var idx = 0;

    function typeChar() {
      if (myId !== animationId) return;
      if (idx < data.plain.length) {
        typedSpan.textContent += data.plain[idx];
        idx++;
        if (pre) pre.scrollTop = pre.scrollHeight;
        setTimeout(typeChar, 28 + Math.random() * 28);
      } else {
        /* Command typed. Pause to simulate processing. */
        cursor.classList.add('done');
        setTimeout(function () {
          if (myId !== animationId) return;
          startReveal();
        }, 380);
      }
    }

    /* Phase 2: Replace typed text with styled HTML, reveal output lines */
    function startReveal() {
      cursor.remove();

      /* Swap plain typed text for styled command HTML */
      var styledCmd = document.createElement('span');
      styledCmd.innerHTML = data.html;
      typedSpan.replaceWith(styledCmd);
      styledCmd.insertAdjacentText('afterend', '\n');

      /* Reveal output lines one by one */
      var lineIdx = 0;

      function showLine() {
        if (myId !== animationId) return;
        if (lineIdx < data.lines.length) {
          var lineFrag = document.createRange().createContextualFragment(
            data.lines[lineIdx] + '\n'
          );
          codeEl.appendChild(lineFrag);
          lineIdx++;
          if (pre) pre.scrollTop = pre.scrollHeight;
          /* Blank lines appear instantly, content lines stagger */
          var delay = data.lines[lineIdx - 1].trim() === '' ? 5 : 55;
          setTimeout(showLine, delay);
        } else {
          /* Animation complete: add blinking cursor */
          var finalCursor = document.createElement('span');
          finalCursor.className = 'deploy-cursor done';
          finalCursor.textContent = '\u2588';
          codeEl.appendChild(finalCursor);
          if (pre) pre.scrollTop = pre.scrollHeight;
          if (onComplete) onComplete();
        }
      }

      showLine();
    }

    typeChar();
  }

  /* Instant render (reduced motion fallback) */
  function showFinal(codeEl, data) {
    var html = '<span class="code-prompt">$</span> ' + data.html + '\n';
    data.lines.forEach(function (line) { html += line + '\n'; });
    codeEl.insertAdjacentHTML('beforeend', html);
  }

  /* ── Data builders for each command ── */

  /* Lock: resolve regpacks for each source jurisdiction */
  function buildLockData() {
    var keys = Object.keys(selections);

    var lines = [];
    lines.push('');
    lines.push('  Resolving composition routing...');

    var i = 0;
    DOMAINS.forEach(function (domain) {
      var sel = selections[domain.id];
      if (!sel) return;
      i++;
      var tree = (i === keys.length) ? '\u2514\u2500' : '\u251C\u2500';
      var padId = padRight(domain.id, 22);
      lines.push('  <span class="code-tree">' + tree + '</span> ' + padId + ' \u2190 ' + padRight(sel.value, 20) + ' <span class="code-success">\u2713</span>');
    });

    lines.push('');
    lines.push('  Regpack verification:');

    /* Collect unique source jurisdictions and show their regpacks */
    var seenJur = {};
    var regEntries = [];
    DOMAINS.forEach(function (domain) {
      var sel = selections[domain.id];
      if (!sel) return;
      var country = sel.value.split('-')[0];
      if (!seenJur[country]) {
        seenJur[country] = true;
        regEntries.push(country);
      }
    });

    for (var r = 0; r < regEntries.length; r++) {
      var country = regEntries[r];
      /* Look up digest — try full jurisdiction ID first, fall back to country */
      var digest = REGPACK_DIGESTS[country] || { financial: 'f0e1d2c3a4b56789', sanctions: 'a1b2c3d4e5f60789' };
      var isLast = (r === regEntries.length - 1);

      var treeF = '\u251C\u2500';
      var treeS = isLast ? '\u2514\u2500' : '\u251C\u2500';
      lines.push('  <span class="code-tree">' + treeF + '</span> ' + padRight(country + '/financial', 22) + ' <span class="code-dim">2026-03-14</span>  sha256:<span class="code-string">' + digest.financial + '...</span>');
      lines.push('  <span class="code-tree">' + treeS + '</span> ' + padRight(country + '/sanctions', 22) + ' <span class="code-dim">2026-03-14</span>  sha256:<span class="code-string">' + digest.sanctions + '...</span>');
    }

    lines.push('');
    lines.push('  <span class="code-success">\u2713</span> Lock file written: <span class="code-value">stack.lock</span> <span class="code-dim">(sha256:a4f8c2e1d3b59076...)</span>');

    return {
      plain: 'msez lock zone.yaml',
      html: 'msez lock zone.yaml',
      lines: lines
    };
  }

  /* Deploy: corridor materialization between source jurisdictions */
  function buildDeployData() {
    var jurisdictions = uniqueSourceJurisdictions();
    var n = jurisdictions.length;
    var corridors = n * (n - 1) / 2;

    var lines = [];
    lines.push('');
    lines.push('  Deploying synth-custom to network...');

    for (var j = 0; j < jurisdictions.length; j++) {
      var tree = (j === jurisdictions.length - 1) ? '\u2514\u2500' : '\u251C\u2500';
      var padName = padRight(jurisdictions[j].value, 24);
      lines.push('  <span class="code-tree">' + tree + '</span> ' + padName + ' <span class="code-dim">API :' + (8080 + j) + '  PG :' + (5432 + j) + '</span>');
    }

    if (corridors > 0) {
      lines.push('');
      lines.push('  Corridors: <span class="code-value">' + corridors + '</span> pairs materialized');
      var ci = 0;
      for (var a = 0; a < jurisdictions.length; a++) {
        for (var b = a + 1; b < jurisdictions.length; b++) {
          ci++;
          var treeC = (ci === corridors) ? '\u2514\u2500' : '\u251C\u2500';
          var nameA = jurisdictions[a].name;
          var nameB = jurisdictions[b].name;
          var pair = padRight(nameA + ' \u2194 ' + nameB, 28);
          lines.push('  <span class="code-tree">' + treeC + '</span> ' + pair + ' <span class="code-corridor-cross">CrossBorder</span>   <span class="code-success">ACTIVE</span>');
        }
      }
    }

    lines.push('');
    lines.push('  <span class="code-success">\u2713</span> ' + corridors + ' corridors activated. N\u00D7(N\u22121)/2 = ' + corridors);

    return {
      plain: 'msez deploy --corridors',
      html: 'msez deploy <span class="code-dim">--corridors</span>',
      lines: lines
    };
  }

  /* Entity: create entity with composite compliance tensor + provenance */
  function buildEntityData() {
    var corpSel = selections.corporate_formation;
    var corpName = corpSel ? corpSel.name : 'Delaware';
    var corpFrame = corpSel ? corpSel.framework : 'DGCL Title 8';
    var compDomains = derivedComplianceDomains();
    var domainCount = compDomains.length;

    var lines = [];
    lines.push('');
    lines.push('  Creating entity in synth-custom...');
    lines.push('');
    lines.push('  <span class="code-success">\u2713</span> Entity: <span class="code-value">CZ-00147</span>              ' + corpName + ' LLC (' + escapeHtml(corpFrame) + ')');
    lines.push('  <span class="code-success">\u2713</span> Compliance: <span class="code-value">' + domainCount + '/' + domainCount + ' domains</span>      tensor passed (composite)');
    lines.push('  <span class="code-success">\u2713</span> Provenance:');

    /* Show provenance: which source jurisdiction evaluated each compliance domain */
    for (var d = 0; d < compDomains.length; d++) {
      var cd = compDomains[d];
      var tree = (d === compDomains.length - 1) ? '\u2514\u2500' : '\u251C\u2500';
      var sourceJur = provenanceFor(cd);
      lines.push('    <span class="code-tree">' + tree + '</span> ' + padRight(cd + ':', 22) + ' <span class="code-success">Compliant</span>  \u2190 <span class="code-dim">' + sourceJur + '</span>');
    }

    lines.push('  <span class="code-success">\u2713</span> Banking: <span class="code-value">SWIFT + Fedwire</span>       rails provisioned');
    lines.push('  <span class="code-success">\u2713</span> Identity: <span class="code-value">VC issued</span>            Ed25519 (did:mez:cz00147)');
    lines.push('');
    lines.push('  Entity operating. Formation time: <span class="code-value">47s</span>.');

    return {
      plain: 'msez entity create --zone synth-custom --type llc',
      html: 'msez entity create <span class="code-dim">--zone</span> <span class="code-value">synth-custom</span> <span class="code-dim">--type</span> <span class="code-value">llc</span>',
      lines: lines
    };
  }

  /* Map a ComplianceDomain back to its source jurisdiction via provenance */
  function provenanceFor(complianceDomain) {
    /* Walk REGULATORY_TO_COMPLIANCE to find which regulatory domain maps here */
    var domainKeys = Object.keys(REGULATORY_TO_COMPLIANCE);
    for (var i = 0; i < domainKeys.length; i++) {
      var regDomain = domainKeys[i];
      var compDomains = REGULATORY_TO_COMPLIANCE[regDomain];
      if (compDomains.indexOf(complianceDomain) !== -1 && selections[regDomain]) {
        return selections[regDomain].value;
      }
    }
    /* Always-present domains: attribute to first selected jurisdiction */
    var keys = Object.keys(selections);
    return keys.length > 0 ? selections[keys[0]].value : 'unknown';
  }

  /* ── Compose YAML (instant, no animation) ──
     Output matches ~/stack/jurisdictions/synth-[x]/zone.yaml format precisely. */
  function renderCompose() {
    var keys = Object.keys(selections);
    if (keys.length === 0) {
      return '<pre class="code-block"><code>' +
        '<span class="code-prompt">$</span> msez compose --interactive\n' +
        '<span class="code-dim">\u2192 Select regulatory domains to compose your zone...</span>' +
        '</code></pre>';
    }

    var primary = primaryJurisdiction();
    var countries = uniqueCountries();
    var compDomains = derivedComplianceDomains();

    var yaml = '<pre class="code-block"><code>';
    yaml += '<span class="code-comment"># Zone Manifest: Custom Synthetic Zone</span>\n';
    yaml += '<span class="code-comment"># Generated via msez compose --interactive</span>\n\n';

    yaml += '<span class="code-key">zone_id:</span> <span class="code-value">org.momentum.mez.zone.synthetic.custom</span>\n';
    yaml += '<span class="code-key">jurisdiction_id:</span> <span class="code-value">synth-custom</span>\n';
    yaml += '<span class="code-key">zone_name:</span> <span class="code-value">Custom Synthetic Zone</span>\n';
    yaml += '<span class="code-key">zone_type:</span> <span class="code-value">synthetic</span>\n';
    yaml += '<span class="code-key">primary_jurisdiction:</span> <span class="code-value">' + primary + '</span>\n';
    yaml += '\n';

    /* composition — per-domain routing */
    yaml += '<span class="code-key">composition:</span>\n';
    DOMAINS.forEach(function (domain) {
      var sel = selections[domain.id];
      if (!sel) return;
      yaml += '  - <span class="code-key">domain:</span> <span class="code-value">' + domain.id + '</span>\n';
      yaml += '    <span class="code-key">source_jurisdiction:</span> <span class="code-value">' + sel.value + '</span>';
      yaml += '  <span class="code-comment"># ' + escapeHtml(sel.framework) + '</span>\n';
    });
    yaml += '\n';

    /* profile */
    yaml += '<span class="code-key">profile:</span>\n';
    yaml += '  <span class="code-key">id:</span> <span class="code-value">org.momentum.mez.profile.synthetic-synth-custom</span>\n';
    yaml += '  <span class="code-key">version:</span> <span class="code-string">"0.5.0"</span>\n';
    yaml += '\n';

    /* jurisdiction_stack */
    yaml += '<span class="code-key">jurisdiction_stack:</span>\n';
    countries.forEach(function (c) {
      yaml += '  - <span class="code-value">' + c + '</span>\n';
    });
    yaml += '\n';

    /* compliance_domains */
    yaml += '<span class="code-key">compliance_domains:</span>\n';
    compDomains.forEach(function (d) {
      yaml += '  - <span class="code-value">' + d + '</span>\n';
    });
    yaml += '\n';

    /* corridors */
    yaml += '<span class="code-key">corridors:</span>\n';
    yaml += '  - <span class="code-value">swift.iso20022-cross-border</span>\n';
    yaml += '  - <span class="code-value">digital-cash.regulated-digital-cash</span>\n';
    yaml += '\n';

    /* key_management */
    yaml += '<span class="code-key">key_management:</span>\n';
    yaml += '  <span class="code-key">rotation_interval_days:</span> <span class="code-value">90</span>\n';
    yaml += '  <span class="code-key">grace_period_days:</span> <span class="code-value">14</span>\n';
    yaml += '\n';

    yaml += '<span class="code-key">lockfile_path:</span> <span class="code-value">stack.lock</span>\n';

    yaml += '</code></pre>';
    return yaml;
  }

  /* ── Utilities ── */
  function padRight(str, len) {
    while (str.length < len) str += ' ';
    return str;
  }

  function escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  /* ── Bootstrap ── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
