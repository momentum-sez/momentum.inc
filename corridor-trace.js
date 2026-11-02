/* ═══════════════════════════════════════
   CORRIDOR TRACE
   Animated terminal showing an asset
   migrating from ADGM to Singapore through
   9 compliance domains. Scroll-triggered,
   single-play, reduced-motion aware.
   ═══════════════════════════════════════ */

(function () {
  'use strict';

  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var animationId = 0;
  var hasPlayed = false;

  /* ── Compliance domains with source/target regs ── */
  var DOMAINS = [
    { name: 'AML',          source: 'ADGM AML Rulebook v5.1',          target: 'MAS Notice 626' },
    { name: 'KYC',          source: 'ADGM KYC/CDD Framework',          target: 'MAS Notice 124' },
    { name: 'Sanctions',    source: 'UAE Federal Sanctions List',       target: 'MAS Sanctions Reg' },
    { name: 'Tax',          source: 'UAE CT Law (9% > AED 375K)',       target: 'ITA S13 Exemption' },
    { name: 'Securities',   source: 'FSRA Virtual Asset Framework',    target: 'SFA Cap. 289' },
    { name: 'Corporate',    source: 'ADGM Companies Reg 2020',         target: 'Companies Act 1967' },
    { name: 'Custody',      source: 'FSRA Custody Framework',          target: 'MAS TCA Guidelines' },
    { name: 'Data Privacy', source: 'ADGM Data Protection Reg 2021',   target: 'PDPA 2012' },
    { name: 'Licensing',    source: 'FSRA FSP License',                target: 'MAS CMS License' }
  ];

  /* ── Fee layers ── */
  var FEES = [
    { label: 'Compliance evaluation', amount: '$500' },
    { label: 'Corridor transit fee',  amount: '$1,200' },
    { label: 'Settlement anchoring',  amount: '$800' },
    { label: 'Domicile re-registration', amount: '$400' }
  ];

  var COMMAND = 'mass asset migrate SA-0x7a3f --from adgm.ae --to mas.sg';
  var COMMAND_HTML = 'mass asset migrate <span class="code-value">SA-0x7a3f</span> <span class="code-dim">--from</span> <span class="code-string">adgm.ae</span> <span class="code-dim">--to</span> <span class="code-string">mas.sg</span>';

  /* ── Init ── */
  function init() {
    var section = document.querySelector('.corridor-trace-section');
    if (!section) return;

    var blockEl = section.querySelector('.corridor-trace-code');
    var comparisonEl = section.querySelector('.corridor-trace-comparison');
    if (!blockEl || !comparisonEl) return;

    /* Reduced motion: show final state immediately, no observer needed for animation */
    if (reducedMotion) {
      showFinalState(blockEl, comparisonEl);
      return;
    }

    /* IntersectionObserver — trigger once at 30% visibility */
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting && !hasPlayed) {
          hasPlayed = true;
          observer.disconnect();
          runAnimation(blockEl, comparisonEl);
        }
      });
    }, { threshold: 0.3 });

    observer.observe(section.querySelector('.corridor-trace-terminal'));
  }

  /* ── Full animation sequence ── */
  function runAnimation(blockEl, comparisonEl) {
    animationId++;
    var myId = animationId;

    blockEl.innerHTML = '';

    var cursor = document.createElement('span');
    cursor.className = 'deploy-cursor';
    cursor.textContent = '\u2588';

    /* Phase 1: Type the command */
    var promptSpan = document.createElement('span');
    promptSpan.className = 'code-prompt';
    promptSpan.textContent = '$';
    blockEl.appendChild(promptSpan);
    blockEl.appendChild(document.createTextNode(' '));

    var typedSpan = document.createElement('span');
    blockEl.appendChild(typedSpan);
    blockEl.appendChild(cursor);

    var charIdx = 0;

    function typeChar() {
      if (myId !== animationId) return;
      if (charIdx < COMMAND.length) {
        typedSpan.textContent += COMMAND[charIdx];
        charIdx++;
        blockEl.parentElement.scrollTop = blockEl.parentElement.scrollHeight;
        setTimeout(typeChar, 28 + Math.random() * 28);
      } else {
        cursor.classList.add('done');
        setTimeout(function () {
          if (myId !== animationId) return;
          phaseProcessing();
        }, 380);
      }
    }

    /* Phase 2: Replace plain text with styled command, show processing line */
    function phaseProcessing() {
      cursor.remove();
      var styledCmd = document.createElement('span');
      styledCmd.innerHTML = COMMAND_HTML;
      typedSpan.replaceWith(styledCmd);

      appendLine(blockEl, '');
      appendLine(blockEl, '<span class="code-dim">[compliance]</span> Evaluating 23 domains across 2 jurisdictions...');
      appendLine(blockEl, '');
      blockEl.parentElement.scrollTop = blockEl.parentElement.scrollHeight;

      setTimeout(function () {
        if (myId !== animationId) return;
        phaseCompliance(0);
      }, 380);
    }

    /* Phase 3: Compliance cascade — one domain at a time */
    function phaseCompliance(idx) {
      if (myId !== animationId) return;
      if (idx >= DOMAINS.length) {
        setTimeout(function () {
          if (myId !== animationId) return;
          phaseSettlement();
        }, 200);
        return;
      }

      var d = DOMAINS[idx];
      var tree = (idx === DOMAINS.length - 1) ? '\u2514\u2500' : '\u251C\u2500';
      var padName = padRight(d.name, 14);

      /* Show the domain line first (without checkmark) */
      var lineEl = document.createElement('div');
      lineEl.style.whiteSpace = 'pre';
      var lineHtml = '  <span class="code-tree">' + tree + '</span> <span class="code-domain">' + padName + '</span>';
      lineHtml += '<span class="code-dim">' + padRight(d.source, 32) + '</span> ';
      lineHtml += '<span class="code-dim">\u2192</span> ';
      lineHtml += '<span class="code-dim">' + d.target + '</span>';
      lineEl.innerHTML = lineHtml;
      blockEl.appendChild(lineEl);
      blockEl.parentElement.scrollTop = blockEl.parentElement.scrollHeight;

      /* Fade in checkmark after brief delay */
      setTimeout(function () {
        if (myId !== animationId) return;
        var check = document.createElement('span');
        check.className = 'code-success';
        check.style.opacity = '0';
        check.style.transition = 'opacity 100ms cubic-bezier(0.25, 0.1, 0.25, 1)';
        check.textContent = ' \u2713';
        lineEl.appendChild(check);
        /* Force reflow then fade in */
        check.offsetWidth;
        check.style.opacity = '1';

        setTimeout(function () {
          phaseCompliance(idx + 1);
        }, 180);
      }, 100);
    }

    /* Phase 4: Settlement */
    function phaseSettlement() {
      if (myId !== animationId) return;

      appendLine(blockEl, '');
      appendLine(blockEl, '<span class="code-success">\u2713</span> <span class="code-dim">Corridor receipt:</span>  <span class="code-string">0xa4f8c2e1d3b7...</span>');
      appendLine(blockEl, '<span class="code-success">\u2713</span> <span class="code-dim">Exit attestation:</span> <span class="code-value">adgm.ae</span>   <span class="code-dim">signed by 3 watchers</span>');
      appendLine(blockEl, '<span class="code-success">\u2713</span> <span class="code-dim">Entry attestation:</span> <span class="code-value">mas.sg</span>    <span class="code-dim">signed by 3 watchers</span>');
      appendLine(blockEl, '<span class="code-success">\u2713</span> <span class="code-dim">Domicile updated:</span> <span class="code-value">adgm.ae</span> \u2192 <span class="code-value">mas.sg</span>');
      blockEl.parentElement.scrollTop = blockEl.parentElement.scrollHeight;

      setTimeout(function () {
        if (myId !== animationId) return;
        phaseSummary();
      }, 300);
    }

    /* Phase 5: Summary + fees */
    function phaseSummary() {
      if (myId !== animationId) return;

      appendLine(blockEl, '');
      appendLine(blockEl, '  <span class="code-value">4.2s elapsed</span> \u00b7 <span class="code-value">20/23 domains</span> \u00b7 <span class="code-value">0 intermediaries</span>');
      appendLine(blockEl, '');

      /* Fee breakdown */
      var total = 0;
      FEES.forEach(function (fee, i) {
        var tree = (i === FEES.length - 1) ? '\u2514\u2500' : '\u251C\u2500';
        var padLabel = padRight(fee.label, 28);
        appendLine(blockEl, '  <span class="code-tree">' + tree + '</span> ' + padLabel + ' <span class="code-value">' + fee.amount + '</span>');
        total += parseInt(fee.amount.replace(/[$,]/g, ''));
      });

      appendLine(blockEl, '');
      appendLine(blockEl, '  Total fees: <span class="code-value">$' + total.toLocaleString() + '</span>');

      /* Final cursor */
      var finalCursor = document.createElement('span');
      finalCursor.className = 'deploy-cursor done';
      finalCursor.textContent = '\u2588';
      blockEl.appendChild(finalCursor);
      blockEl.parentElement.scrollTop = blockEl.parentElement.scrollHeight;

      /* Phase 6: Comparison fade-in */
      setTimeout(function () {
        if (myId !== animationId) return;
        comparisonEl.classList.add('visible');
      }, 600);
    }

    typeChar();
  }

  /* ── Reduced motion: render final state instantly ── */
  function showFinalState(blockEl, comparisonEl) {
    var html = '';
    html += '<span class="code-prompt">$</span> ' + COMMAND_HTML + '\n';
    html += '\n';
    html += '<span class="code-dim">[compliance]</span> Evaluating 23 domains across 2 jurisdictions...\n';
    html += '\n';

    DOMAINS.forEach(function (d, idx) {
      var tree = (idx === DOMAINS.length - 1) ? '\u2514\u2500' : '\u251C\u2500';
      var padName = padRight(d.name, 14);
      html += '  <span class="code-tree">' + tree + '</span> <span class="code-domain">' + padName + '</span>';
      html += '<span class="code-dim">' + padRight(d.source, 32) + '</span> ';
      html += '<span class="code-dim">\u2192</span> ';
      html += '<span class="code-dim">' + d.target + '</span>';
      html += ' <span class="code-success">\u2713</span>\n';
    });

    html += '\n';
    html += '<span class="code-success">\u2713</span> <span class="code-dim">Corridor receipt:</span>  <span class="code-string">0xa4f8c2e1d3b7...</span>\n';
    html += '<span class="code-success">\u2713</span> <span class="code-dim">Exit attestation:</span> <span class="code-value">adgm.ae</span>   <span class="code-dim">signed by 3 watchers</span>\n';
    html += '<span class="code-success">\u2713</span> <span class="code-dim">Entry attestation:</span> <span class="code-value">mas.sg</span>    <span class="code-dim">signed by 3 watchers</span>\n';
    html += '<span class="code-success">\u2713</span> <span class="code-dim">Domicile updated:</span> <span class="code-value">adgm.ae</span> \u2192 <span class="code-value">mas.sg</span>\n';
    html += '\n';
    html += '  <span class="code-value">4.2s elapsed</span> \u00b7 <span class="code-value">20/23 domains</span> \u00b7 <span class="code-value">0 intermediaries</span>\n';
    html += '\n';

    var total = 0;
    FEES.forEach(function (fee, i) {
      var tree = (i === FEES.length - 1) ? '\u2514\u2500' : '\u251C\u2500';
      var padLabel = padRight(fee.label, 28);
      html += '  <span class="code-tree">' + tree + '</span> ' + padLabel + ' <span class="code-value">' + fee.amount + '</span>\n';
      total += parseInt(fee.amount.replace(/[$,]/g, ''));
    });

    html += '\n';
    html += '  Total fees: <span class="code-value">$' + total.toLocaleString() + '</span>\n';

    blockEl.innerHTML = html;
    comparisonEl.classList.add('visible');
  }

  /* ── Utilities ── */
  function appendLine(container, html) {
    var div = document.createElement('div');
    div.style.whiteSpace = 'pre';
    div.innerHTML = html || '\u00a0';
    container.appendChild(div);
  }

  function padRight(str, len) {
    while (str.length < len) str += ' ';
    return str;
  }

  /* ── Bootstrap ── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
