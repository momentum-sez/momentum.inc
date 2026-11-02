/**
 * anatomy.js — Operation Anatomy interactive visualization.
 *
 * Renders the entity.incorporate operation decomposition across
 * three jurisdictions (Delaware, ADGM, Seychelles). Shows the
 * step DAG, compliance tensor, fees, and per-step inspector.
 */
(function () {
  'use strict';

  /* ── Jurisdiction data ─────────────────────────────────── */

  var JURISDICTIONS = {
    'us-de': {
      name: 'Delaware',
      legal_basis: 'DGCL Section 101\u2013102',
      authority: 'Division of Corporations',
      formation_time: '~47s',
      steps: [
        { id: 'name_check',      type: 'filing.name_availability',            svc: 'organization-info', depends: [],                      domains: ['corporate', 'aml', 'sanctions', 'kyc'] },
        { id: 'entity_create',   type: 'create.entity',                       svc: 'organization-info', depends: ['name_check'],           domains: ['corporate', 'aml', 'sanctions', 'kyc'] },
        { id: 'filing',          type: 'filing.certificate_of_incorporation', svc: 'organization-info', depends: ['entity_create'],        domains: ['corporate', 'licensing'] },
        { id: 'ein_application', type: 'filing.tax_id',                       svc: 'organization-info', depends: ['entity_create'],        domains: ['tax', 'corporate'] },
        { id: 'treasury_create', type: 'create.treasury',                     svc: 'treasury-info',     depends: ['entity_create'],        domains: ['banking', 'aml'] },
        { id: 'bank_account',    type: 'create.bank_account',                 svc: 'treasury-info',     depends: ['treasury_create'],      domains: ['banking', 'payments', 'aml'] },
        { id: 'cap_table',       type: 'create.cap_table',                    svc: 'governance-info',      depends: ['entity_create'],        domains: ['securities', 'corporate'] },
        { id: 'directors',       type: 'consent.board_resolution',            svc: 'governance-info',      depends: ['entity_create'],        domains: ['corporate'] },
        { id: 'bylaws',          type: 'consent.board_resolution',            svc: 'governance-info',      depends: ['directors'],            domains: ['corporate'] },
        { id: 'initial_shares',  type: 'ownership.issue_shares',              svc: 'governance-info',      depends: ['cap_table', 'directors'], domains: ['securities', 'corporate'] }
      ],
      fees: [
        { amount: '$89', authority: 'DE Division of Corporations', desc: 'Certificate filing' }
      ],
      params: {
        legal_name: 'Acme Delaware Inc',
        entity_type: 'c_corp',
        incorporator_name: 'Jane Chen',
        incorporator_email: 'jane@acme.com'
      }
    },

    'ae-abudhabi-adgm': {
      name: 'ADGM',
      legal_basis: 'ADGM Companies Regulations 2020 Part 3',
      authority: 'Registration Authority',
      formation_time: '~3 min',
      steps: [
        { id: 'special_resolution', type: 'consent.special_resolution',  svc: 'governance-info',      depends: [],                        domains: ['corporate'] },
        { id: 'name_check',         type: 'filing.name_reservation',     svc: 'organization-info', depends: ['special_resolution'],     domains: ['corporate', 'aml', 'sanctions'] },
        { id: 'entity_create',      type: 'create.entity',               svc: 'organization-info', depends: ['name_check'],             domains: ['corporate', 'aml', 'sanctions', 'kyc'] },
        { id: 'filing',             type: 'filing.certificate',          svc: 'organization-info', depends: ['entity_create'],          domains: ['corporate', 'licensing'] },
        { id: 'trade_license',      type: 'licensing.acquire',           svc: 'organization-info', depends: ['filing'],                 domains: ['licensing', 'corporate'] },
        { id: 'data_protection',    type: 'filing.data_protection',      svc: 'organization-info', depends: ['entity_create'],          domains: ['data_privacy'] },
        { id: 'treasury_create',    type: 'create.treasury',             svc: 'treasury-info',     depends: ['entity_create'],          domains: ['banking', 'aml'] },
        { id: 'bank_account',       type: 'create.bank_account',         svc: 'treasury-info',     depends: ['treasury_create'],        domains: ['banking', 'payments', 'aml'] },
        { id: 'cap_table',          type: 'create.cap_table',            svc: 'governance-info',      depends: ['entity_create'],          domains: ['securities', 'corporate'] },
        { id: 'directors',          type: 'consent.board',               svc: 'governance-info',      depends: ['entity_create'],          domains: ['corporate'] },
        { id: 'initial_shares',     type: 'ownership.issue_shares',      svc: 'governance-info',      depends: ['cap_table', 'directors'], domains: ['securities', 'corporate'] }
      ],
      fees: [
        { amount: 'AED 100',   authority: 'ADGM RA', desc: 'Name reservation' },
        { amount: 'AED 2,000', authority: 'ADGM RA', desc: 'Certificate filing' },
        { amount: 'AED 1,050', authority: 'ADGM RA', desc: 'Trade license' },
        { amount: 'AED 300',   authority: 'ADGM RA', desc: 'Data protection registration' }
      ],
      params: {
        legal_name: 'Acme ADGM Ltd',
        entity_type: 'private_company',
        share_capital: 'AED 50,000'
      }
    },

    'sc': {
      name: 'Seychelles',
      legal_basis: 'IBC Act 2016 s.4\u201315',
      authority: 'Financial Services Authority',
      formation_time: '~2 min',
      steps: [
        { id: 'name_check',        type: 'filing.name_reservation',           svc: 'organization-info', depends: [],                                                         domains: ['corporate'] },
        { id: 'registered_agent',   type: 'filing.registered_agent',           svc: 'organization-info', depends: [],                                                         domains: ['corporate', 'licensing'] },
        { id: 'entity_create',      type: 'create.entity',                     svc: 'organization-info', depends: ['name_check', 'registered_agent'],                         domains: ['corporate', 'aml', 'sanctions', 'kyc'] },
        { id: 'fsa_filing',         type: 'filing.certificate',                svc: 'organization-info', depends: ['entity_create'],                                          domains: ['corporate', 'licensing'] },
        { id: 'tin_registration',   type: 'filing.tax_registration',           svc: 'organization-info', depends: ['entity_create'],                                          domains: ['tax'] },
        { id: 'ibc_exemption',      type: 'compliance.ibc_exemption',          svc: 'compliance-info',   depends: ['tin_registration'],                                       domains: ['tax', 'corporate'] },
        { id: 'treasury_create',    type: 'create.treasury',                   svc: 'treasury-info',     depends: ['entity_create'],                                          domains: ['banking', 'aml'] },
        { id: 'bank_account',       type: 'create.bank_account',               svc: 'treasury-info',     depends: ['treasury_create'],                                        domains: ['banking', 'payments', 'aml'] },
        { id: 'cap_table',          type: 'create.cap_table',                  svc: 'governance-info',      depends: ['entity_create'],                                          domains: ['securities', 'corporate'] },
        { id: 'directors',          type: 'consent.board',                     svc: 'governance-info',      depends: ['entity_create'],                                          domains: ['corporate'] },
        { id: 'memorandum',         type: 'document.memorandum_and_articles',  svc: 'governance-info',      depends: ['directors'],                                              domains: ['corporate'] },
        { id: 'beneficial_owners',  type: 'filing.beneficial_ownership',       svc: 'organization-info', depends: ['entity_create'],                                          domains: ['aml', 'corporate'] },
        { id: 'activate',           type: 'update.entity_status',              svc: 'organization-info', depends: ['fsa_filing', 'tin_registration', 'treasury_create', 'beneficial_owners'], domains: ['corporate', 'licensing'] }
      ],
      fees: [
        { amount: 'USD 100', authority: 'FSA', desc: 'Name reservation' },
        { amount: 'USD 100', authority: 'FSA', desc: 'Certificate of Incorporation' },
        { amount: 'USD 100', authority: 'FSA', desc: 'Annual license fee' }
      ],
      params: {
        legal_name: 'Acme Global IBC Ltd',
        entity_type: 'ibc',
        registered_agent: 'Meridian CSP (Seychelles)'
      }
    }
  };

  var ALL_DOMAINS = [
    { id: 'aml',                 name: 'AML' },
    { id: 'kyc',                 name: 'KYC' },
    { id: 'sanctions',           name: 'Sanctions' },
    { id: 'tax',                 name: 'Tax' },
    { id: 'securities',          name: 'Securities' },
    { id: 'corporate',           name: 'Corporate' },
    { id: 'custody',             name: 'Custody' },
    { id: 'data_privacy',        name: 'Data Privacy' },
    { id: 'licensing',           name: 'Licensing' },
    { id: 'banking',             name: 'Banking' },
    { id: 'payments',            name: 'Payments' },
    { id: 'clearing',            name: 'Clearing' },
    { id: 'settlement',          name: 'Settlement' },
    { id: 'digital_assets',      name: 'Digital Assets' },
    { id: 'employment',          name: 'Employment' },
    { id: 'immigration',         name: 'Immigration' },
    { id: 'ip',                  name: 'IP' },
    { id: 'consumer_protection', name: 'Consumer Prot.' },
    { id: 'arbitration',         name: 'Arbitration' },
    { id: 'trade',               name: 'Trade' },
    { id: 'insurance',           name: 'Insurance' },
    { id: 'anti_bribery',        name: 'Anti-Bribery' },
    { id: 'sharia',              name: 'Sharia' }
  ];

  var SERVICE_LABELS = {
    'organization-info': 'Entities',
    'governance-info':      'Consent + Ownership',
    'treasury-info':     'Fiscal',
    'identity-info':     'Identity',
    'compliance-info':   'Compliance'
  };

  var STEP_DESCRIPTIONS = {
    'filing.name_availability':            'Queries the registrar to confirm the proposed name is available and not deceptively similar to existing entities.',
    'filing.name_reservation':             'Reserves the proposed name with the registrar for a fixed period, preventing conflicts during incorporation.',
    'create.entity':                       'Creates the entity record in the zone database. Triggers AML/KYC compliance tensor evaluation across all applicable domains.',
    'filing.certificate_of_incorporation': 'Files the certificate of incorporation with the state. Produces the legal instrument that brings the entity into existence.',
    'filing.certificate':                  'Submits the incorporation filing to the registration authority. Returns the certificate of incorporation.',
    'filing.tax_id':                       'Applies for a federal Employer Identification Number (EIN) with the IRS. Required for banking, payroll, and tax filing.',
    'filing.tax_registration':             'Registers the entity with the tax authority. Obtains the Tax Identification Number for the jurisdiction.',
    'create.treasury':                     'Creates the entity\u2019s treasury account in the fiscal subsystem. Enables payment rails and account management.',
    'create.bank_account':                 'Opens the entity\u2019s primary bank account through the integrated banking partner. Subject to AML/KYC verification.',
    'create.cap_table':                    'Initializes the capitalization table with authorized share classes and ownership tracking.',
    'consent.board_resolution':            'Records a board resolution \u2014 initial directors, officer appointments, or bylaws adoption.',
    'consent.board':                       'Appoints the initial board of directors. Establishes governance structure per the jurisdiction\u2019s requirements.',
    'consent.special_resolution':          'Records a special resolution required before incorporation. ADGM requires shareholder pre-approval for certain entity types.',
    'ownership.issue_shares':              'Issues initial shares to founders per the cap table. Creates the first ownership records with share class, quantity, and price.',
    'licensing.acquire':                   'Obtains the required trade license from the licensing authority. Specifies permitted business activities.',
    'filing.data_protection':              'Registers the entity with the data protection authority. Required under ADGM Data Protection Regulations 2021.',
    'filing.registered_agent':             'Appoints a licensed Corporate Service Provider as the entity\u2019s registered agent. Required under IBC Act 2016.',
    'compliance.ibc_exemption':            'Evaluates the entity\u2019s eligibility for IBC tax exemption on foreign-sourced income under IBC Act 2016.',
    'filing.beneficial_ownership':         'Files the register of beneficial owners with the registrar. AML requirement for ownership transparency.',
    'update.entity_status':                'Activates the entity after all prerequisites are met. Transitions status from INCORPORATING to ACTIVE.',
    'document.memorandum_and_articles':    'Generates and registers the Memorandum and Articles of Association. Defines the entity\u2019s constitution.'
  };

  /* ── State ─────────────────────────────────────────────── */

  var state = {
    jurisdiction: 'us-de',
    selectedStep: null
  };

  /* ── DOM refs ──────────────────────────────────────────── */

  var els = {};

  /* ── Helpers ───────────────────────────────────────────── */

  function computeWaves(steps) {
    var stepMap = {};
    steps.forEach(function (s) { stepMap[s.id] = s; });

    var depth = {};
    function getDepth(id) {
      if (depth[id] !== undefined) return depth[id];
      var s = stepMap[id];
      if (!s || !s.depends || s.depends.length === 0) {
        depth[id] = 0;
        return 0;
      }
      var maxDep = 0;
      s.depends.forEach(function (depId) {
        var d = getDepth(depId);
        if (d + 1 > maxDep) maxDep = d + 1;
      });
      depth[id] = maxDep;
      return maxDep;
    }

    steps.forEach(function (s) { getDepth(s.id); });

    var waves = [];
    steps.forEach(function (s) {
      var d = depth[s.id];
      if (!waves[d]) waves[d] = [];
      waves[d].push(s);
    });

    return waves.filter(Boolean);
  }

  function collectDomains(steps) {
    var seen = {};
    steps.forEach(function (s) {
      s.domains.forEach(function (d) { seen[d] = true; });
    });
    return Object.keys(seen);
  }

  function esc(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  /* ── Render: API call ──────────────────────────────────── */

  function renderApiCall() {
    var j = JURISDICTIONS[state.jurisdiction];
    var p = j.params;
    var keys = Object.keys(p);

    var lines = [
      '<span class="code-prompt">$</span> curl -X POST https://api.mass.inc/v1/operations/execute \\',
      '  -H <span class="code-string">"Authorization: Bearer $ZONE_TOKEN"</span> \\',
      '  -H <span class="code-string">"Content-Type: application/json"</span> \\',
      '  -d \'{'
    ];
    lines.push('    <span class="code-key">"type"</span>: <span class="code-string">"entity.incorporate"</span>,');
    lines.push('    <span class="code-key">"jurisdiction"</span>: <span class="code-string">"' + esc(state.jurisdiction) + '"</span>,');
    lines.push('    <span class="code-key">"params"</span>: {');
    keys.forEach(function (k, i) {
      var comma = i < keys.length - 1 ? ',' : '';
      lines.push('      <span class="code-key">"' + esc(k) + '"</span>: <span class="code-string">"' + esc(p[k]) + '"</span>' + comma);
    });
    lines.push('    }');
    lines.push("  }'");

    els.apiCall.innerHTML = lines.join('\n');
  }

  /* ── Render: Tabs ──────────────────────────────────────── */

  function renderTabs() {
    var html = '';
    var jids = Object.keys(JURISDICTIONS);
    jids.forEach(function (jid) {
      var j = JURISDICTIONS[jid];
      var active = jid === state.jurisdiction ? ' active' : '';
      var ariaSel = jid === state.jurisdiction ? 'true' : 'false';
      html += '<button class="anatomy-tab' + active + '" role="tab" aria-selected="' + ariaSel + '" data-jid="' + jid + '">';
      html += esc(j.name);
      html += '</button>';
    });
    els.tabs.innerHTML = html;

    var j = JURISDICTIONS[state.jurisdiction];
    els.legalBasis.textContent = j.legal_basis + ' \u2014 ' + j.authority;
  }

  /* ── Render: Step DAG ──────────────────────────────────── */

  function renderDag() {
    var j = JURISDICTIONS[state.jurisdiction];
    var waves = computeWaves(j.steps);

    var html = '';
    waves.forEach(function (wave, wi) {
      if (wi > 0) {
        html += '<div class="anatomy-connector" aria-hidden="true"></div>';
      }
      html += '<div class="anatomy-wave" role="listitem">';
      html += '<div class="anatomy-wave-label">Wave ' + (wi + 1);
      if (wave.length > 1) html += ' <span class="anatomy-wave-parallel">(' + wave.length + ' parallel)</span>';
      html += '</div>';
      html += '<div class="anatomy-wave-steps">';
      wave.forEach(function (step) {
        var active = state.selectedStep === step.id ? ' active' : '';
        var svcLabel = SERVICE_LABELS[step.svc] || step.svc;
        html += '<button class="anatomy-step' + active + '" data-step="' + step.id + '" aria-label="Step: ' + esc(step.id) + '">';
        html += '<span class="anatomy-step-name">' + esc(step.id) + '</span>';
        html += '<span class="anatomy-step-type">' + esc(step.type) + '</span>';
        html += '<span class="anatomy-step-svc">' + esc(svcLabel) + '</span>';
        html += '</button>';
      });
      html += '</div></div>';
    });

    els.dag.innerHTML = html;
  }

  /* ── Render: Details ───────────────────────────────────── */

  function renderDetails() {
    var j = JURISDICTIONS[state.jurisdiction];

    if (!state.selectedStep) {
      els.details.innerHTML =
        '<div class="anatomy-details-empty">' +
        '<span class="anatomy-details-hint">Select a step to inspect</span>' +
        '</div>';
      return;
    }

    var step = null;
    j.steps.forEach(function (s) { if (s.id === state.selectedStep) step = s; });
    if (!step) {
      state.selectedStep = null;
      renderDetails();
      return;
    }

    var svcLabel = SERVICE_LABELS[step.svc] || step.svc;
    var desc = STEP_DESCRIPTIONS[step.type] || 'Executes ' + step.type + ' through the ' + step.svc + ' service.';

    var html = '<div class="anatomy-detail-card">';
    html += '<div class="anatomy-detail-header">' + esc(step.id) + '</div>';

    html += '<div class="anatomy-detail-row">';
    html += '<span class="anatomy-detail-label">Type</span>';
    html += '<span class="anatomy-detail-value">' + esc(step.type) + '</span>';
    html += '</div>';

    html += '<div class="anatomy-detail-row">';
    html += '<span class="anatomy-detail-label">Service</span>';
    html += '<span class="anatomy-detail-value">' + esc(step.svc) + ' <span class="anatomy-detail-svc-label">(' + esc(svcLabel) + ')</span></span>';
    html += '</div>';

    html += '<div class="anatomy-detail-row">';
    html += '<span class="anatomy-detail-label">Depends on</span>';
    if (step.depends.length > 0) {
      var depLinks = step.depends.map(function (d) {
        return '<button class="anatomy-dep-link" data-step="' + esc(d) + '">' + esc(d) + '</button>';
      });
      html += '<span class="anatomy-detail-value">' + depLinks.join(', ') + '</span>';
    } else {
      html += '<span class="anatomy-detail-value anatomy-detail-none">(none \u2014 parallel root)</span>';
    }
    html += '</div>';

    html += '<div class="anatomy-detail-row">';
    html += '<span class="anatomy-detail-label">Compliance domains</span>';
    html += '<div class="anatomy-detail-domain-list">';
    step.domains.forEach(function (d) {
      html += '<span class="anatomy-domain-tag">' + esc(d) + '</span>';
    });
    html += '</div></div>';

    html += '<div class="anatomy-detail-desc">';
    html += '<span class="anatomy-detail-desc-text">' + esc(desc) + '</span>';
    html += '</div>';

    html += '</div>';
    els.details.innerHTML = html;
  }

  /* ── Render: Compliance tensor ─────────────────────────── */

  function renderCompliance() {
    var j = JURISDICTIONS[state.jurisdiction];
    var active = collectDomains(j.steps);
    var activeMap = {};
    active.forEach(function (d) { activeMap[d] = true; });

    var html = '<div class="anatomy-compliance-label">Compliance tensor \u2014 ' + active.length + ' of 23 domains active</div>';
    html += '<div class="anatomy-compliance-domains">';
    ALL_DOMAINS.forEach(function (d) {
      var cls = activeMap[d.id] ? ' active' : '';
      html += '<span class="anatomy-compliance-domain' + cls + '">' + esc(d.name) + '</span>';
    });
    html += '</div>';
    els.compliance.innerHTML = html;
  }

  /* ── Render: Fees ──────────────────────────────────────── */

  function renderFees() {
    var j = JURISDICTIONS[state.jurisdiction];

    var html = '<div class="anatomy-fees-label">Filing fees \u2014 ' + esc(j.name) + '</div>';
    html += '<div class="anatomy-fees-table">';
    j.fees.forEach(function (f) {
      html += '<div class="anatomy-fee-row">';
      html += '<span class="anatomy-fee-amount">' + esc(f.amount) + '</span>';
      html += '<span class="anatomy-fee-detail"><span class="anatomy-fee-authority">' + esc(f.authority) + '</span> \u2014 ' + esc(f.desc) + '</span>';
      html += '</div>';
    });
    html += '</div>';
    els.fees.innerHTML = html;
  }

  /* ── Render: Summary bar ───────────────────────────────── */

  function renderSummary() {
    var j = JURISDICTIONS[state.jurisdiction];
    var domains = collectDomains(j.steps);
    var waves = computeWaves(j.steps);

    els.summary.innerHTML =
      '<span class="anatomy-stat">' + j.steps.length + ' steps</span>' +
      '<span class="anatomy-stat-sep" aria-hidden="true">\u00b7</span>' +
      '<span class="anatomy-stat">' + waves.length + ' waves</span>' +
      '<span class="anatomy-stat-sep" aria-hidden="true">\u00b7</span>' +
      '<span class="anatomy-stat">' + domains.length + ' domains</span>' +
      '<span class="anatomy-stat-sep" aria-hidden="true">\u00b7</span>' +
      '<span class="anatomy-stat">' + j.fees.length + ' fee' + (j.fees.length !== 1 ? 's' : '') + '</span>' +
      '<span class="anatomy-stat-sep" aria-hidden="true">\u00b7</span>' +
      '<span class="anatomy-stat">' + j.formation_time + '</span>';
  }

  /* ── Full render ───────────────────────────────────────── */

  function render() {
    renderApiCall();
    renderTabs();
    renderDag();
    renderDetails();
    renderCompliance();
    renderFees();
    renderSummary();
  }

  /* ── Event handlers ────────────────────────────────────── */

  function handleTabClick(e) {
    var btn = e.target.closest('.anatomy-tab');
    if (!btn) return;
    var jid = btn.getAttribute('data-jid');
    if (jid === state.jurisdiction) return;
    state.jurisdiction = jid;
    state.selectedStep = null;
    render();
  }

  function handleStepClick(e) {
    var btn = e.target.closest('.anatomy-step') || e.target.closest('.anatomy-dep-link');
    if (!btn) return;
    var stepId = btn.getAttribute('data-step');
    if (!stepId) return;

    if (btn.classList.contains('anatomy-dep-link')) {
      // Clicking a dependency link always navigates to that step
      state.selectedStep = stepId;
    } else {
      // Toggle selection on step cards
      state.selectedStep = state.selectedStep === stepId ? null : stepId;
    }

    renderDag();
    renderDetails();
  }

  /* ── Keyboard navigation ───────────────────────────────── */

  function handleKeydown(e) {
    if (e.key === 'Escape' && state.selectedStep) {
      state.selectedStep = null;
      renderDag();
      renderDetails();
    }
  }

  /* ── Init ──────────────────────────────────────────────── */

  function init() {
    els.apiCall    = document.getElementById('anatomy-api-call');
    els.tabs       = document.getElementById('anatomy-tabs');
    els.legalBasis = document.getElementById('anatomy-legal-basis');
    els.dag        = document.getElementById('anatomy-dag');
    els.details    = document.getElementById('anatomy-details');
    els.compliance = document.getElementById('anatomy-compliance');
    els.fees       = document.getElementById('anatomy-fees');
    els.summary    = document.getElementById('anatomy-summary');

    if (!els.apiCall) return;

    els.tabs.addEventListener('click', handleTabClick);
    els.dag.addEventListener('click', handleStepClick);
    els.details.addEventListener('click', handleStepClick);
    document.addEventListener('keydown', handleKeydown);

    // Select the first step by default
    var j = JURISDICTIONS[state.jurisdiction];
    if (j.steps.length > 0) {
      state.selectedStep = j.steps[0].id;
    }

    render();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
