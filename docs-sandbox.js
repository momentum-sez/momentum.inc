/* ═══════════════════════════════════════
   DOCS SANDBOX & NAVIGATION
   Interactive API sandbox + sidebar scroll-spy
   for developer documentation page.
   Built against ~/stack (Rust, Axum, mez CLI).
   ═══════════════════════════════════════ */

(function () {
  'use strict';

  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var animationId = 0;

  /* ── API Catalog — real endpoints from mez-api ── */
  var API_CATALOG = {
    entities: {
      label: 'Entities',
      actions: {
        create: {
          label: 'Create Entity',
          method: 'POST',
          path: '/v1/entities',
          defaultBody: JSON.stringify({
            zone: "synth-atlantic-fintech",
            type: "llc",
            jurisdiction: "us-de",
            name: "Acme Ventures LLC",
            beneficial_owners: [
              { identity_id: "id_9x8f7e", ownership_pct: "100" }
            ]
          }, null, 2),
          responseLines: [
            '<span class="code-dim">HTTP/1.1 201 Created</span>',
            '<span class="code-dim">content-type: application/json</span>',
            '<span class="code-dim">x-request-id: req_a3f8c1e7</span>',
            '',
            '{',
            '  <span class="code-key">"entity_id"</span>: <span class="code-string">"ent_01HZQ3..."</span>,',
            '  <span class="code-key">"type"</span>: <span class="code-string">"llc"</span>,',
            '  <span class="code-key">"jurisdiction"</span>: <span class="code-string">"us-de"</span>,',
            '  <span class="code-key">"framework"</span>: <span class="code-string">"DGCL Title 8"</span>,',
            '  <span class="code-key">"status"</span>: <span class="code-string">"active"</span>,',
            '  <span class="code-key">"compliance"</span>: {',
            '    <span class="code-key">"tensor_status"</span>: <span class="code-string">"passed"</span>,',
            '    <span class="code-key">"domains_checked"</span>: <span class="code-value">20</span>,',
            '    <span class="code-key">"domains_valid"</span>: <span class="code-value">20</span>',
            '  },',
            '  <span class="code-key">"banking"</span>: {',
            '    <span class="code-key">"rails"</span>: [<span class="code-string">"SWIFT"</span>, <span class="code-string">"Fedwire"</span>],',
            '    <span class="code-key">"status"</span>: <span class="code-string">"provisioned"</span>',
            '  },',
            '  <span class="code-key">"identity"</span>: {',
            '    <span class="code-key">"did"</span>: <span class="code-string">"did:mez:ent01hzq3"</span>,',
            '    <span class="code-key">"vc_issued"</span>: <span class="code-value">true</span>',
            '  },',
            '  <span class="code-key">"created_at"</span>: <span class="code-string">"2026-02-25T10:14:32Z"</span>',
            '}'
          ]
        },
        get: {
          label: 'Retrieve Entity',
          method: 'GET',
          path: '/v1/entities/{entity_id}',
          defaultBody: '',
          responseLines: [
            '<span class="code-dim">HTTP/1.1 200 OK</span>',
            '',
            '{',
            '  <span class="code-key">"entity_id"</span>: <span class="code-string">"ent_01HZQ3..."</span>,',
            '  <span class="code-key">"name"</span>: <span class="code-string">"Acme Ventures LLC"</span>,',
            '  <span class="code-key">"type"</span>: <span class="code-string">"llc"</span>,',
            '  <span class="code-key">"jurisdiction"</span>: <span class="code-string">"us-de"</span>,',
            '  <span class="code-key">"status"</span>: <span class="code-string">"active"</span>,',
            '  <span class="code-key">"zone"</span>: <span class="code-string">"synth-atlantic-fintech"</span>,',
            '  <span class="code-key">"corridors_active"</span>: <span class="code-value">7</span>,',
            '  <span class="code-key">"created_at"</span>: <span class="code-string">"2026-02-25T10:14:32Z"</span>',
            '}'
          ]
        },
        list: {
          label: 'List Entities',
          method: 'GET',
          path: '/v1/entities?limit=10&offset=0',
          defaultBody: '',
          responseLines: [
            '<span class="code-dim">HTTP/1.1 200 OK</span>',
            '',
            '{',
            '  <span class="code-key">"data"</span>: [',
            '    {',
            '      <span class="code-key">"entity_id"</span>: <span class="code-string">"ent_01HZQ3..."</span>,',
            '      <span class="code-key">"name"</span>: <span class="code-string">"Acme Ventures LLC"</span>,',
            '      <span class="code-key">"jurisdiction"</span>: <span class="code-string">"us-de"</span>,',
            '      <span class="code-key">"status"</span>: <span class="code-string">"active"</span>',
            '    }',
            '  ],',
            '  <span class="code-key">"has_more"</span>: <span class="code-value">false</span>,',
            '  <span class="code-key">"total"</span>: <span class="code-value">1</span>',
            '}'
          ]
        }
      }
    },
    assets: {
      label: 'Assets',
      actions: {
        genesis: {
          label: 'Create Genesis',
          method: 'POST',
          path: '/v1/assets/genesis',
          defaultBody: JSON.stringify({
            asset_name: "Series A Preferred",
            asset_class: "equity",
            description: "Series A preferred shares",
            home_harbor_id: "ae-abudhabi-adgm",
            metadata: { denomination: "USD", total_supply: "1000000" }
          }, null, 2),
          responseLines: [
            '<span class="code-dim">HTTP/1.1 201 Created</span>',
            '',
            '{',
            '  <span class="code-key">"asset_id"</span>: <span class="code-string">"sha256:7a3f9b2e..."</span>,',
            '  <span class="code-key">"stack_spec_version"</span>: <span class="code-string">"0.5.0"</span>,',
            '  <span class="code-key">"asset_name"</span>: <span class="code-string">"Series A Preferred"</span>,',
            '  <span class="code-key">"asset_class"</span>: <span class="code-string">"equity"</span>,',
            '  <span class="code-key">"home_harbor_id"</span>: <span class="code-string">"ae-abudhabi-adgm"</span>,',
            '  <span class="code-key">"created_at"</span>: <span class="code-string">"2026-02-25T10:14:32Z"</span>,',
            '  <span class="code-key">"genesis_digest"</span>: <span class="code-string">"sha256:7a3f9b2e..."</span>',
            '}'
          ]
        },
        compliance: {
          label: 'Evaluate Compliance',
          method: 'POST',
          path: '/v1/assets/{asset_id}/compliance/evaluate',
          defaultBody: JSON.stringify({
            asset_id: "sha256:7a3f9b2e...",
            jurisdictions: ["ae-abudhabi-adgm", "sg"]
          }, null, 2),
          responseLines: [
            '<span class="code-dim">HTTP/1.1 200 OK</span>',
            '',
            '{',
            '  <span class="code-key">"overall_allowed"</span>: <span class="code-value">true</span>,',
            '  <span class="code-key">"results"</span>: [',
            '    {',
            '      <span class="code-key">"harbor_id"</span>: <span class="code-string">"ae-abudhabi-adgm"</span>,',
            '      <span class="code-key">"binding_status"</span>: <span class="code-string">"active"</span>,',
            '      <span class="code-key">"allowed"</span>: <span class="code-value">true</span>,',
            '      <span class="code-key">"reasons"</span>: [],',
            '      <span class="code-key">"missing_attestations"</span>: []',
            '    }',
            '  ]',
            '}'
          ]
        },
        migrate: {
          label: 'Propose Migration',
          method: 'POST',
          path: '/v1/assets/{asset_id}/migration/propose',
          defaultBody: JSON.stringify({
            asset_id: "sha256:7a3f9b2e...",
            source_jurisdiction: "ae-abudhabi-adgm",
            target_jurisdiction: "sg",
            reason: "secondary_listing"
          }, null, 2),
          responseLines: [
            '<span class="code-dim">HTTP/1.1 202 Accepted</span>',
            '',
            '{',
            '  <span class="code-key">"migration_id"</span>: <span class="code-string">"mig_01HZR4..."</span>,',
            '  <span class="code-key">"asset_id"</span>: <span class="code-string">"sha256:7a3f9b2e..."</span>,',
            '  <span class="code-key">"source"</span>: <span class="code-string">"ae-abudhabi-adgm"</span>,',
            '  <span class="code-key">"target"</span>: <span class="code-string">"sg"</span>,',
            '  <span class="code-key">"status"</span>: <span class="code-string">"pending_compliance"</span>,',
            '  <span class="code-key">"corridor_receipt"</span>: <span class="code-string">"cr_e1c5f8..."</span>,',
            '  <span class="code-key">"exit_attestation"</span>: <span class="code-value">null</span>,',
            '  <span class="code-key">"entry_attestation"</span>: <span class="code-value">null</span>',
            '}'
          ]
        }
      }
    },
    corridors: {
      label: 'Corridors',
      actions: {
        create: {
          label: 'Create Corridor',
          method: 'POST',
          path: '/v1/corridors',
          defaultBody: JSON.stringify({
            jurisdiction_a: "us-de",
            jurisdiction_b: "ae-abudhabi-adgm"
          }, null, 2),
          responseLines: [
            '<span class="code-dim">HTTP/1.1 201 Created</span>',
            '',
            '{',
            '  <span class="code-key">"id"</span>: <span class="code-string">"cor_01HZQ5..."</span>,',
            '  <span class="code-key">"jurisdiction_a"</span>: <span class="code-string">"us-de"</span>,',
            '  <span class="code-key">"jurisdiction_b"</span>: <span class="code-string">"ae-abudhabi-adgm"</span>,',
            '  <span class="code-key">"state"</span>: <span class="code-string">"DRAFT"</span>,',
            '  <span class="code-key">"transition_log"</span>: [],',
            '  <span class="code-key">"created_at"</span>: <span class="code-string">"2026-02-25T10:14:32Z"</span>',
            '}'
          ]
        },
        transition: {
          label: 'Transition State',
          method: 'PUT',
          path: '/v1/corridors/{id}/transition',
          defaultBody: JSON.stringify({
            target_state: "PENDING",
            evidence: { bilateral_agreement_digest: "sha256:a4f8c2e1..." }
          }, null, 2),
          responseLines: [
            '<span class="code-dim">HTTP/1.1 200 OK</span>',
            '',
            '{',
            '  <span class="code-key">"id"</span>: <span class="code-string">"cor_01HZQ5..."</span>,',
            '  <span class="code-key">"state"</span>: <span class="code-string">"PENDING"</span>,',
            '  <span class="code-key">"previous_state"</span>: <span class="code-string">"DRAFT"</span>,',
            '  <span class="code-key">"transition_log"</span>: [',
            '    {',
            '      <span class="code-key">"from"</span>: <span class="code-string">"DRAFT"</span>,',
            '      <span class="code-key">"to"</span>: <span class="code-string">"PENDING"</span>,',
            '      <span class="code-key">"timestamp"</span>: <span class="code-string">"2026-02-25T10:15:01Z"</span>',
            '    }',
            '  ],',
            '  <span class="code-key">"updated_at"</span>: <span class="code-string">"2026-02-25T10:15:01Z"</span>',
            '}'
          ]
        },
        receipt: {
          label: 'Submit Receipt',
          method: 'POST',
          path: '/v1/corridors/state/propose',
          defaultBody: JSON.stringify({
            corridor_id: "cor_01HZQ5...",
            payload: { type: "asset_transfer", asset_id: "sha256:7a3f..." },
            prev_root: "sha256:0000000000000000...",
            next_root: "sha256:a4f8c2e1d7b3..."
          }, null, 2),
          responseLines: [
            '<span class="code-dim">HTTP/1.1 201 Created</span>',
            '',
            '{',
            '  <span class="code-key">"sequence"</span>: <span class="code-value">0</span>,',
            '  <span class="code-key">"prev_root"</span>: <span class="code-string">"sha256:0000..."</span>,',
            '  <span class="code-key">"next_root"</span>: <span class="code-string">"sha256:a4f8..."</span>,',
            '  <span class="code-key">"mmr_root"</span>: <span class="code-string">"sha256:c6f3..."</span>,',
            '  <span class="code-key">"log_height"</span>: <span class="code-value">1</span>,',
            '  <span class="code-key">"timestamp"</span>: <span class="code-string">"2026-02-25T10:15:44Z"</span>',
            '}'
          ]
        }
      }
    },
    identity: {
      label: 'Identity',
      actions: {
        cnic: {
          label: 'Verify CNIC',
          method: 'POST',
          path: '/v1/identity/cnic/verify',
          defaultBody: JSON.stringify({
            cnic: "35201-1234567-8"
          }, null, 2),
          responseLines: [
            '<span class="code-dim">HTTP/1.1 200 OK</span>',
            '',
            '{',
            '  <span class="code-key">"cnic"</span>: <span class="code-string">"35201-1234567-8"</span>,',
            '  <span class="code-key">"verified"</span>: <span class="code-value">true</span>,',
            '  <span class="code-key">"source"</span>: <span class="code-string">"NADRA"</span>,',
            '  <span class="code-key">"name_match"</span>: <span class="code-value">true</span>,',
            '  <span class="code-key">"registration_status"</span>: <span class="code-string">"active"</span>,',
            '  <span class="code-key">"verified_at"</span>: <span class="code-string">"2026-01-15T09:23:47Z"</span>',
            '}'
          ]
        },
        ntn: {
          label: 'Verify NTN',
          method: 'POST',
          path: '/v1/identity/ntn/verify',
          defaultBody: JSON.stringify({
            ntn: "1234567-8"
          }, null, 2),
          responseLines: [
            '<span class="code-dim">HTTP/1.1 200 OK</span>',
            '',
            '{',
            '  <span class="code-key">"ntn"</span>: <span class="code-string">"1234567-8"</span>,',
            '  <span class="code-key">"verified"</span>: <span class="code-value">true</span>,',
            '  <span class="code-key">"source"</span>: <span class="code-string">"FBR IRIS"</span>,',
            '  <span class="code-key">"name_match"</span>: <span class="code-value">true</span>,',
            '  <span class="code-key">"filer_status"</span>: <span class="code-string">"active_filer"</span>,',
            '  <span class="code-key">"verified_at"</span>: <span class="code-string">"2026-01-15T09:23:52Z"</span>',
            '}'
          ]
        },
        entity_identity: {
          label: 'Get Entity Identity',
          method: 'GET',
          path: '/v1/identity/entity/{entity_id}',
          defaultBody: '',
          responseLines: [
            '<span class="code-dim">HTTP/1.1 200 OK</span>',
            '',
            '{',
            '  <span class="code-key">"entity_id"</span>: <span class="code-string">"ent_01HZQ3..."</span>,',
            '  <span class="code-key">"cnic"</span>: {<span class="code-key">"verified"</span>: <span class="code-value">true</span>, <span class="code-key">"source"</span>: <span class="code-string">"NADRA"</span>},',
            '  <span class="code-key">"ntn"</span>: {<span class="code-key">"verified"</span>: <span class="code-value">true</span>, <span class="code-key">"source"</span>: <span class="code-string">"FBR IRIS"</span>},',
            '  <span class="code-key">"did"</span>: <span class="code-string">"did:mez:ent01hzq3"</span>',
            '}'
          ]
        }
      }
    },
    settlement: {
      label: 'Settlement',
      actions: {
        netting: {
          label: 'Compute Netting',
          method: 'POST',
          path: '/v1/corridors/{id}/settlement/compute',
          defaultBody: JSON.stringify({
            corridor_id: "cor_01HZQ5...",
            obligations: [
              { from: "ent_A", to: "ent_B", amount: "100000", currency: "USD" },
              { from: "ent_B", to: "ent_A", amount: "75000", currency: "USD" }
            ]
          }, null, 2),
          responseLines: [
            '<span class="code-dim">HTTP/1.1 200 OK</span>',
            '',
            '{',
            '  <span class="code-key">"corridor_id"</span>: <span class="code-string">"cor_01HZQ5..."</span>,',
            '  <span class="code-key">"obligations_processed"</span>: <span class="code-value">2</span>,',
            '  <span class="code-key">"gross_total"</span>: <span class="code-string">"175000"</span>,',
            '  <span class="code-key">"net_total"</span>: <span class="code-string">"25000"</span>,',
            '  <span class="code-key">"reduction_bps"</span>: <span class="code-value">8571</span>,',
            '  <span class="code-key">"net_positions"</span>: [',
            '    {<span class="code-key">"party_id"</span>: <span class="code-string">"ent_A"</span>, <span class="code-key">"currency"</span>: <span class="code-string">"USD"</span>, <span class="code-key">"receivable"</span>: <span class="code-string">"75000"</span>, <span class="code-key">"payable"</span>: <span class="code-string">"100000"</span>, <span class="code-key">"net"</span>: <span class="code-string">"-25000"</span>}',
            '  ],',
            '  <span class="code-key">"settlement_legs"</span>: [',
            '    {',
            '      <span class="code-key">"from"</span>: <span class="code-string">"ent_A"</span>,',
            '      <span class="code-key">"to"</span>: <span class="code-string">"ent_B"</span>,',
            '      <span class="code-key">"amount"</span>: <span class="code-string">"25000"</span>,',
            '      <span class="code-key">"currency"</span>: <span class="code-string">"USD"</span>',
            '    }',
            '  ]',
            '}'
          ]
        },
        route: {
          label: 'Find Route',
          method: 'POST',
          path: '/v1/corridors/route',
          defaultBody: JSON.stringify({
            source_zone: "us-de",
            target_zone: "sg",
            amount: "500000",
            currency: "USD"
          }, null, 2),
          responseLines: [
            '<span class="code-dim">HTTP/1.1 200 OK</span>',
            '',
            '{',
            '  <span class="code-key">"source"</span>: <span class="code-string">"us-de"</span>,',
            '  <span class="code-key">"target"</span>: <span class="code-string">"sg"</span>,',
            '  <span class="code-key">"hop_count"</span>: <span class="code-value">2</span>,',
            '  <span class="code-key">"total_fee_bps"</span>: <span class="code-value">28</span>,',
            '  <span class="code-key">"total_settlement_time_secs"</span>: <span class="code-value">36000</span>,',
            '  <span class="code-key">"hops"</span>: [',
            '    {<span class="code-key">"from"</span>: <span class="code-string">"us-de"</span>, <span class="code-key">"to"</span>: <span class="code-string">"ae-abudhabi-adgm"</span>, <span class="code-key">"fee_bps"</span>: <span class="code-value">16</span>},',
            '    {<span class="code-key">"from"</span>: <span class="code-string">"ae-abudhabi-adgm"</span>, <span class="code-key">"to"</span>: <span class="code-string">"sg"</span>, <span class="code-key">"fee_bps"</span>: <span class="code-value">12</span>}',
            '  ]',
            '}'
          ]
        }
      }
    },
    ownership: {
      label: 'Ownership',
      actions: {
        create_cap_table: {
          label: 'Create Cap Table',
          method: 'POST',
          path: '/v1/ownership/cap-tables',
          defaultBody: JSON.stringify({
            entity_id: "ent_01HZQ3...",
            share_classes: [
              { name: "Common", authorized_shares: "10000000", par_value: "0.001" },
              { name: "Series A Preferred", authorized_shares: "2000000", par_value: "0.001" }
            ]
          }, null, 2),
          responseLines: [
            '<span class="code-dim">HTTP/1.1 201 Created</span>',
            '<span class="code-dim">content-type: application/json</span>',
            '<span class="code-dim">x-request-id: req_b7c2d4f1</span>',
            '',
            '{',
            '  <span class="code-key">"cap_table_id"</span>: <span class="code-string">"ct_01HZR7..."</span>,',
            '  <span class="code-key">"entity_id"</span>: <span class="code-string">"ent_01HZQ3..."</span>,',
            '  <span class="code-key">"share_classes"</span>: [',
            '    {',
            '      <span class="code-key">"name"</span>: <span class="code-string">"Common"</span>,',
            '      <span class="code-key">"authorized_shares"</span>: <span class="code-string">"10000000"</span>,',
            '      <span class="code-key">"issued_shares"</span>: <span class="code-string">"0"</span>,',
            '      <span class="code-key">"par_value"</span>: <span class="code-string">"0.001"</span>',
            '    },',
            '    {',
            '      <span class="code-key">"name"</span>: <span class="code-string">"Series A Preferred"</span>,',
            '      <span class="code-key">"authorized_shares"</span>: <span class="code-string">"2000000"</span>,',
            '      <span class="code-key">"issued_shares"</span>: <span class="code-string">"0"</span>,',
            '      <span class="code-key">"par_value"</span>: <span class="code-string">"0.001"</span>',
            '    }',
            '  ],',
            '  <span class="code-key">"compliance"</span>: {',
            '    <span class="code-key">"overall_status"</span>: <span class="code-string">"Compliant"</span>,',
            '    <span class="code-key">"domains_evaluated"</span>: <span class="code-value">20</span>',
            '  },',
            '  <span class="code-key">"attestation_id"</span>: <span class="code-string">"att_9f2e7d..."</span>,',
            '  <span class="code-key">"passport_digest"</span>: <span class="code-string">"sha256:c4a1b8e3..."</span>,',
            '  <span class="code-key">"created_at"</span>: <span class="code-string">"2026-02-26T09:41:18Z"</span>',
            '}'
          ]
        },
        get_cap_table: {
          label: 'Get Cap Table',
          method: 'GET',
          path: '/v1/ownership/cap-tables/{id}',
          defaultBody: '',
          responseLines: [
            '<span class="code-dim">HTTP/1.1 200 OK</span>',
            '',
            '{',
            '  <span class="code-key">"cap_table_id"</span>: <span class="code-string">"ct_01HZR7..."</span>,',
            '  <span class="code-key">"entity_id"</span>: <span class="code-string">"ent_01HZQ3..."</span>,',
            '  <span class="code-key">"share_classes"</span>: [',
            '    {',
            '      <span class="code-key">"name"</span>: <span class="code-string">"Common"</span>,',
            '      <span class="code-key">"authorized_shares"</span>: <span class="code-string">"10000000"</span>,',
            '      <span class="code-key">"issued_shares"</span>: <span class="code-string">"1500000"</span>',
            '    }',
            '  ],',
            '  <span class="code-key">"shareholders"</span>: [',
            '    {',
            '      <span class="code-key">"identity_id"</span>: <span class="code-string">"id_9x8f7e"</span>,',
            '      <span class="code-key">"share_class"</span>: <span class="code-string">"Common"</span>,',
            '      <span class="code-key">"shares_held"</span>: <span class="code-string">"1500000"</span>,',
            '      <span class="code-key">"ownership_pct"</span>: <span class="code-string">"15.00"</span>',
            '    }',
            '  ],',
            '  <span class="code-key">"as_of"</span>: <span class="code-string">"2026-02-26T09:41:18Z"</span>',
            '}'
          ]
        },
        transfer: {
          label: 'Transfer Shares',
          method: 'POST',
          path: '/v1/ownership/transfers',
          defaultBody: JSON.stringify({
            entity_id: "ent_01HZQ3...",
            from_shareholder: "id_9x8f7e",
            to_shareholder: "id_4k2m1n",
            share_class: "Common",
            quantity: "250000",
            price_per_share: "1.50",
            currency: "USD"
          }, null, 2),
          responseLines: [
            '<span class="code-dim">HTTP/1.1 201 Created</span>',
            '<span class="code-dim">content-type: application/json</span>',
            '<span class="code-dim">x-request-id: req_e4a8f2c6</span>',
            '',
            '{',
            '  <span class="code-key">"transfer_id"</span>: <span class="code-string">"xfr_01HZR9..."</span>,',
            '  <span class="code-key">"entity_id"</span>: <span class="code-string">"ent_01HZQ3..."</span>,',
            '  <span class="code-key">"from_shareholder"</span>: <span class="code-string">"id_9x8f7e"</span>,',
            '  <span class="code-key">"to_shareholder"</span>: <span class="code-string">"id_4k2m1n"</span>,',
            '  <span class="code-key">"share_class"</span>: <span class="code-string">"Common"</span>,',
            '  <span class="code-key">"quantity"</span>: <span class="code-string">"250000"</span>,',
            '  <span class="code-key">"price_per_share"</span>: <span class="code-string">"1.50"</span>,',
            '  <span class="code-key">"total_consideration"</span>: <span class="code-string">"375000.00"</span>,',
            '  <span class="code-key">"currency"</span>: <span class="code-string">"USD"</span>,',
            '  <span class="code-key">"compliance"</span>: {',
            '    <span class="code-key">"overall_status"</span>: <span class="code-string">"Compliant"</span>,',
            '    <span class="code-key">"domains_evaluated"</span>: <span class="code-value">20</span>,',
            '    <span class="code-key">"securities"</span>: <span class="code-string">"Compliant"</span>,',
            '    <span class="code-key">"corporate"</span>: <span class="code-string">"Compliant"</span>',
            '  },',
            '  <span class="code-key">"tax_event"</span>: {',
            '    <span class="code-key">"type"</span>: <span class="code-string">"capital_gains"</span>,',
            '    <span class="code-key">"jurisdiction"</span>: <span class="code-string">"us-de"</span>',
            '  },',
            '  <span class="code-key">"attestation_id"</span>: <span class="code-string">"att_d3c6a1..."</span>,',
            '  <span class="code-key">"passport_digest"</span>: <span class="code-string">"sha256:e7f2b9a4..."</span>,',
            '  <span class="code-key">"created_at"</span>: <span class="code-string">"2026-02-26T09:43:05Z"</span>',
            '}'
          ]
        }
      }
    },
    fiscal: {
      label: 'Fiscal',
      actions: {
        create_account: {
          label: 'Create Account',
          method: 'POST',
          path: '/v1/fiscal/accounts',
          defaultBody: JSON.stringify({
            entity_id: "ent_01HZQ3...",
            currency: "USD",
            account_type: "operating"
          }, null, 2),
          responseLines: [
            '<span class="code-dim">HTTP/1.1 201 Created</span>',
            '<span class="code-dim">content-type: application/json</span>',
            '<span class="code-dim">x-request-id: req_f1d9e3a7</span>',
            '',
            '{',
            '  <span class="code-key">"account_id"</span>: <span class="code-string">"acc_01HZR8..."</span>,',
            '  <span class="code-key">"entity_id"</span>: <span class="code-string">"ent_01HZQ3..."</span>,',
            '  <span class="code-key">"currency"</span>: <span class="code-string">"USD"</span>,',
            '  <span class="code-key">"account_type"</span>: <span class="code-string">"operating"</span>,',
            '  <span class="code-key">"balance"</span>: <span class="code-string">"0.00"</span>,',
            '  <span class="code-key">"status"</span>: <span class="code-string">"active"</span>,',
            '  <span class="code-key">"compliance"</span>: {',
            '    <span class="code-key">"overall_status"</span>: <span class="code-string">"Compliant"</span>,',
            '    <span class="code-key">"domains_evaluated"</span>: <span class="code-value">20</span>,',
            '    <span class="code-key">"banking"</span>: <span class="code-string">"Compliant"</span>',
            '  },',
            '  <span class="code-key">"attestation_id"</span>: <span class="code-string">"att_8b4e2f..."</span>,',
            '  <span class="code-key">"passport_digest"</span>: <span class="code-string">"sha256:a2d7c5f1..."</span>,',
            '  <span class="code-key">"created_at"</span>: <span class="code-string">"2026-02-26T09:45:12Z"</span>',
            '}'
          ]
        },
        create_payment: {
          label: 'Create Payment',
          method: 'POST',
          path: '/v1/fiscal/payments',
          defaultBody: JSON.stringify({
            from_account: "acc_01HZR8...",
            to_account: "acc_01HZS2...",
            amount: "50000.00",
            currency: "USD",
            reference: "Q1-2026 distribution"
          }, null, 2),
          responseLines: [
            '<span class="code-dim">HTTP/1.1 201 Created</span>',
            '<span class="code-dim">content-type: application/json</span>',
            '<span class="code-dim">x-request-id: req_c5b7a2e8</span>',
            '',
            '{',
            '  <span class="code-key">"payment_id"</span>: <span class="code-string">"pay_01HZS4..."</span>,',
            '  <span class="code-key">"from_account"</span>: <span class="code-string">"acc_01HZR8..."</span>,',
            '  <span class="code-key">"to_account"</span>: <span class="code-string">"acc_01HZS2..."</span>,',
            '  <span class="code-key">"amount"</span>: <span class="code-string">"50000.00"</span>,',
            '  <span class="code-key">"currency"</span>: <span class="code-string">"USD"</span>,',
            '  <span class="code-key">"reference"</span>: <span class="code-string">"Q1-2026 distribution"</span>,',
            '  <span class="code-key">"status"</span>: <span class="code-string">"completed"</span>,',
            '  <span class="code-key">"compliance"</span>: {',
            '    <span class="code-key">"overall_status"</span>: <span class="code-string">"Compliant"</span>,',
            '    <span class="code-key">"domains_evaluated"</span>: <span class="code-value">20</span>,',
            '    <span class="code-key">"sanctions"</span>: <span class="code-string">"Compliant"</span>,',
            '    <span class="code-key">"payments"</span>: <span class="code-string">"Compliant"</span>,',
            '    <span class="code-key">"aml"</span>: <span class="code-string">"Compliant"</span>',
            '  },',
            '  <span class="code-key">"attestation_id"</span>: <span class="code-string">"att_1f7c4a..."</span>,',
            '  <span class="code-key">"passport_digest"</span>: <span class="code-string">"sha256:b9e3d1f7..."</span>,',
            '  <span class="code-key">"created_at"</span>: <span class="code-string">"2026-02-26T09:47:33Z"</span>',
            '}'
          ]
        },
        compute_withholding: {
          label: 'Compute Withholding',
          method: 'POST',
          path: '/v1/tax/withhold',
          defaultBody: JSON.stringify({
            entity_id: "ent_01HZQ3...",
            event_type: "dividend",
            jurisdiction_id: "us-de",
            gross_amount: "50000.00",
            currency: "USD",
            tax_year: 2026
          }, null, 2),
          responseLines: [
            '<span class="code-dim">HTTP/1.1 200 OK</span>',
            '<span class="code-dim">content-type: application/json</span>',
            '',
            '{',
            '  <span class="code-key">"entity_id"</span>: <span class="code-string">"ent_01HZQ3..."</span>,',
            '  <span class="code-key">"event_type"</span>: <span class="code-string">"dividend"</span>,',
            '  <span class="code-key">"gross_amount"</span>: <span class="code-string">"50000.00"</span>,',
            '  <span class="code-key">"withholding_rate_bps"</span>: <span class="code-value">1500</span>,',
            '  <span class="code-key">"withholding_amount"</span>: <span class="code-string">"7500.00"</span>,',
            '  <span class="code-key">"net_amount"</span>: <span class="code-string">"42500.00"</span>,',
            '  <span class="code-key">"currency"</span>: <span class="code-string">"USD"</span>,',
            '  <span class="code-key">"jurisdiction_id"</span>: <span class="code-string">"us-de"</span>,',
            '  <span class="code-key">"filer_status"</span>: <span class="code-string">"active_filer"</span>,',
            '  <span class="code-key">"statutory_reference"</span>: <span class="code-string">"IRC \u00a71441"</span>,',
            '  <span class="code-key">"computed_at"</span>: <span class="code-string">"2026-02-26T09:48:51Z"</span>',
            '}'
          ]
        }
      }
    },
    consent: {
      label: 'Consent',
      actions: {
        create: {
          label: 'Create Consent',
          method: 'POST',
          path: '/v1/consent',
          defaultBody: JSON.stringify({
            entity_id: "ent_01HZQ3...",
            operation_type: "COMPANY_NAME_CHANGE",
            parties: [
              { identity_id: "id_9x8f7e", role: "director" },
              { identity_id: "id_4k2m1n", role: "director" },
              { identity_id: "id_7r3p5q", role: "director" }
            ],
            quorum: "majority"
          }, null, 2),
          responseLines: [
            '<span class="code-dim">HTTP/1.1 201 Created</span>',
            '<span class="code-dim">content-type: application/json</span>',
            '<span class="code-dim">x-request-id: req_a2f4b8c1</span>',
            '',
            '{',
            '  <span class="code-key">"consent_id"</span>: <span class="code-string">"con_01HZS6..."</span>,',
            '  <span class="code-key">"entity_id"</span>: <span class="code-string">"ent_01HZQ3..."</span>,',
            '  <span class="code-key">"operation_type"</span>: <span class="code-string">"COMPANY_NAME_CHANGE"</span>,',
            '  <span class="code-key">"quorum"</span>: <span class="code-string">"majority"</span>,',
            '  <span class="code-key">"parties"</span>: <span class="code-value">3</span>,',
            '  <span class="code-key">"votes_received"</span>: <span class="code-value">0</span>,',
            '  <span class="code-key">"status"</span>: <span class="code-string">"pending"</span>,',
            '  <span class="code-key">"compliance"</span>: {',
            '    <span class="code-key">"overall_status"</span>: <span class="code-string">"Compliant"</span>,',
            '    <span class="code-key">"domains_evaluated"</span>: <span class="code-value">20</span>,',
            '    <span class="code-key">"data_privacy"</span>: <span class="code-string">"Compliant"</span>',
            '  },',
            '  <span class="code-key">"attestation_id"</span>: <span class="code-string">"att_5e9c3b..."</span>,',
            '  <span class="code-key">"passport_digest"</span>: <span class="code-string">"sha256:f1a4d8e2..."</span>,',
            '  <span class="code-key">"created_at"</span>: <span class="code-string">"2026-02-26T09:51:07Z"</span>',
            '}'
          ]
        },
        vote: {
          label: 'Cast Vote',
          method: 'POST',
          path: '/v1/consent/{id}/vote',
          defaultBody: JSON.stringify({
            consent_id: "con_01HZS6...",
            voter_id: "id_9x8f7e",
            decision: "approve"
          }, null, 2),
          responseLines: [
            '<span class="code-dim">HTTP/1.1 200 OK</span>',
            '<span class="code-dim">content-type: application/json</span>',
            '',
            '{',
            '  <span class="code-key">"consent_id"</span>: <span class="code-string">"con_01HZS6..."</span>,',
            '  <span class="code-key">"voter_id"</span>: <span class="code-string">"id_9x8f7e"</span>,',
            '  <span class="code-key">"decision"</span>: <span class="code-string">"approve"</span>,',
            '  <span class="code-key">"votes_received"</span>: <span class="code-value">1</span>,',
            '  <span class="code-key">"votes_required"</span>: <span class="code-value">2</span>,',
            '  <span class="code-key">"status"</span>: <span class="code-string">"pending"</span>,',
            '  <span class="code-key">"quorum_met"</span>: <span class="code-value">false</span>,',
            '  <span class="code-key">"voted_at"</span>: <span class="code-string">"2026-02-26T09:52:44Z"</span>',
            '}'
          ]
        }
      }
    },
    compliance: {
      label: 'Compliance',
      actions: {
        domains: {
          label: 'List Domains',
          method: 'GET',
          path: '/v1/compliance/domains',
          defaultBody: '',
          responseLines: [
            '<span class="code-dim">HTTP/1.1 200 OK</span>',
            '',
            '{',
            '  <span class="code-key">"domains"</span>: [',
            '    <span class="code-string">"aml"</span>, <span class="code-string">"kyc"</span>, <span class="code-string">"sanctions"</span>, <span class="code-string">"tax"</span>,',
            '    <span class="code-string">"securities"</span>, <span class="code-string">"corporate"</span>, <span class="code-string">"custody"</span>, <span class="code-string">"data_privacy"</span>,',
            '    <span class="code-string">"licensing"</span>, <span class="code-string">"banking"</span>, <span class="code-string">"payments"</span>, <span class="code-string">"clearing"</span>,',
            '    <span class="code-string">"settlement"</span>, <span class="code-string">"digital_assets"</span>, <span class="code-string">"employment"</span>,',
            '    <span class="code-string">"immigration"</span>, <span class="code-string">"ip"</span>, <span class="code-string">"consumer_protection"</span>,',
            '    <span class="code-string">"arbitration"</span>, <span class="code-string">"trade"</span>',
            '  ],',
            '  <span class="code-key">"total"</span>: <span class="code-value">20</span>',
            '}'
          ]
        },
        passport: {
          label: 'Get Passport',
          method: 'GET',
          path: '/v1/compliance/entity/{entity_id}/passport',
          defaultBody: '',
          responseLines: [
            '<span class="code-dim">HTTP/1.1 200 OK</span>',
            '',
            '{',
            '  <span class="code-key">"passport_id"</span>: <span class="code-string">"pp_01HZS1..."</span>,',
            '  <span class="code-key">"entity_id"</span>: <span class="code-string">"ent_01HZQ3..."</span>,',
            '  <span class="code-key">"overall_status"</span>: <span class="code-string">"Compliant"</span>,',
            '  <span class="code-key">"domain_results"</span>: {',
            '    <span class="code-key">"aml"</span>: <span class="code-string">"Compliant"</span>,',
            '    <span class="code-key">"kyc"</span>: <span class="code-string">"Compliant"</span>,',
            '    <span class="code-key">"sanctions"</span>: <span class="code-string">"Compliant"</span>,',
            '    <span class="code-key">"tax"</span>: <span class="code-string">"Compliant"</span>,',
            '    <span class="code-key">"securities"</span>: <span class="code-string">"Compliant"</span>,',
            '    <span class="code-key">"corporate"</span>: <span class="code-string">"Compliant"</span>,',
            '    <span class="code-key">"custody"</span>: <span class="code-string">"Pending"</span>,',
            '    <span class="code-key">"data_privacy"</span>: <span class="code-string">"Compliant"</span>',
            '  },',
            '  <span class="code-key">"evaluation_count"</span>: <span class="code-value">14</span>,',
            '  <span class="code-key">"prev_digest"</span>: <span class="code-string">"sha256:d8f3a1b7..."</span>,',
            '  <span class="code-key">"jurisdiction_id"</span>: <span class="code-string">"us-de"</span>,',
            '  <span class="code-key">"updated_at"</span>: <span class="code-string">"2026-02-26T09:55:22Z"</span>',
            '}'
          ]
        },
        passport_integrity: {
          label: 'Verify Passport Integrity',
          method: 'GET',
          path: '/v1/compliance/entity/{entity_id}/passport/integrity',
          defaultBody: '',
          responseLines: [
            '<span class="code-dim">HTTP/1.1 200 OK</span>',
            '',
            '{',
            '  <span class="code-key">"entity_id"</span>: <span class="code-string">"ent_01HZQ3..."</span>,',
            '  <span class="code-key">"passport_id"</span>: <span class="code-string">"pp_01HZS1..."</span>,',
            '  <span class="code-key">"evaluation_count"</span>: <span class="code-value">14</span>,',
            '  <span class="code-key">"prev_digest"</span>: <span class="code-string">"sha256:d8f3a1b7..."</span>,',
            '  <span class="code-key">"current_digest"</span>: <span class="code-string">"sha256:c4a1b8e3..."</span>,',
            '  <span class="code-key">"is_terminal"</span>: <span class="code-value">false</span>,',
            '  <span class="code-key">"journal_entries_for_entity"</span>: <span class="code-value">23</span>,',
            '  <span class="code-key">"log_intact"</span>: <span class="code-value">true</span>,',
            '  <span class="code-key">"violations"</span>: []',
            '}'
          ]
        }
      }
    },
    trade: {
      label: 'Trade',
      actions: {
        create_flow: {
          label: 'Create Trade Flow',
          method: 'POST',
          path: '/v1/trade/flows',
          defaultBody: JSON.stringify({
            flow_type: "letter_of_credit",
            exporter_id: "ent_01HZQ3...",
            importer_id: "ent_01HZR5...",
            goods_description: "Textile machinery (HS 8445)",
            amount: "250000.00",
            currency: "USD"
          }, null, 2),
          responseLines: [
            '<span class="code-dim">HTTP/1.1 201 Created</span>',
            '<span class="code-dim">content-type: application/json</span>',
            '<span class="code-dim">x-request-id: req_d6e9f3a2</span>',
            '',
            '{',
            '  <span class="code-key">"flow_id"</span>: <span class="code-string">"tfl_01HZS8..."</span>,',
            '  <span class="code-key">"flow_type"</span>: <span class="code-string">"letter_of_credit"</span>,',
            '  <span class="code-key">"state"</span>: <span class="code-string">"initiated"</span>,',
            '  <span class="code-key">"exporter_id"</span>: <span class="code-string">"ent_01HZQ3..."</span>,',
            '  <span class="code-key">"importer_id"</span>: <span class="code-string">"ent_01HZR5..."</span>,',
            '  <span class="code-key">"goods_description"</span>: <span class="code-string">"Textile machinery (HS 8445)"</span>,',
            '  <span class="code-key">"amount"</span>: <span class="code-string">"250000.00"</span>,',
            '  <span class="code-key">"currency"</span>: <span class="code-string">"USD"</span>,',
            '  <span class="code-key">"compliance"</span>: {',
            '    <span class="code-key">"overall_status"</span>: <span class="code-string">"Compliant"</span>,',
            '    <span class="code-key">"domains_evaluated"</span>: <span class="code-value">20</span>,',
            '    <span class="code-key">"sanctions"</span>: <span class="code-string">"Compliant"</span>,',
            '    <span class="code-key">"trade"</span>: <span class="code-string">"Compliant"</span>,',
            '    <span class="code-key">"aml"</span>: <span class="code-string">"Compliant"</span>',
            '  },',
            '  <span class="code-key">"attestation_id"</span>: <span class="code-string">"att_7a2d5e..."</span>,',
            '  <span class="code-key">"passport_digest"</span>: <span class="code-string">"sha256:b3f7c2a9..."</span>,',
            '  <span class="code-key">"created_at"</span>: <span class="code-string">"2026-02-26T10:01:38Z"</span>',
            '}'
          ]
        },
        transition: {
          label: 'Transition Flow',
          method: 'POST',
          path: '/v1/trade/flows/{flow_id}/transitions',
          defaultBody: JSON.stringify({
            target_state: "confirmed",
            evidence: {
              lc_number: "LC-2026-001",
              issuing_bank: "HBL",
              advising_bank: "Standard Chartered"
            }
          }, null, 2),
          responseLines: [
            '<span class="code-dim">HTTP/1.1 200 OK</span>',
            '<span class="code-dim">content-type: application/json</span>',
            '',
            '{',
            '  <span class="code-key">"flow_id"</span>: <span class="code-string">"tfl_01HZS8..."</span>,',
            '  <span class="code-key">"previous_state"</span>: <span class="code-string">"initiated"</span>,',
            '  <span class="code-key">"state"</span>: <span class="code-string">"confirmed"</span>,',
            '  <span class="code-key">"evidence"</span>: {',
            '    <span class="code-key">"lc_number"</span>: <span class="code-string">"LC-2026-001"</span>,',
            '    <span class="code-key">"issuing_bank"</span>: <span class="code-string">"HBL"</span>,',
            '    <span class="code-key">"advising_bank"</span>: <span class="code-string">"Standard Chartered"</span>',
            '  },',
            '  <span class="code-key">"transition_log"</span>: [',
            '    {',
            '      <span class="code-key">"from"</span>: <span class="code-string">"initiated"</span>,',
            '      <span class="code-key">"to"</span>: <span class="code-string">"confirmed"</span>,',
            '      <span class="code-key">"timestamp"</span>: <span class="code-string">"2026-02-26T10:03:15Z"</span>',
            '    }',
            '  ],',
            '  <span class="code-key">"attestation_id"</span>: <span class="code-string">"att_4b8f1c..."</span>,',
            '  <span class="code-key">"updated_at"</span>: <span class="code-string">"2026-02-26T10:03:15Z"</span>',
            '}'
          ]
        }
      }
    },
    credentials: {
      label: 'Credentials',
      actions: {
        verify: {
          label: 'Verify Credential',
          method: 'POST',
          path: '/v1/credentials/verify',
          defaultBody: JSON.stringify({
            credential: "eyJhbGciOiJFZERTQSIs..."
          }, null, 2),
          responseLines: [
            '<span class="code-dim">HTTP/1.1 200 OK</span>',
            '<span class="code-dim">content-type: application/json</span>',
            '',
            '{',
            '  <span class="code-key">"verified"</span>: <span class="code-value">true</span>,',
            '  <span class="code-key">"credential_type"</span>: <span class="code-string">"MezSmartAssetRegistryCredential"</span>,',
            '  <span class="code-key">"issuer"</span>: <span class="code-string">"did:mez:zone_synth-atlantic-fintech"</span>,',
            '  <span class="code-key">"issuance_date"</span>: <span class="code-string">"2026-02-26T08:30:00Z"</span>,',
            '  <span class="code-key">"expiration_date"</span>: <span class="code-string">"2027-02-26T08:30:00Z"</span>,',
            '  <span class="code-key">"proof"</span>: {',
            '    <span class="code-key">"type"</span>: <span class="code-string">"Ed25519Signature2020"</span>,',
            '    <span class="code-key">"verification_method"</span>: <span class="code-string">"did:mez:zone_synth-atlantic-fintech#key-1"</span>,',
            '    <span class="code-key">"signature_valid"</span>: <span class="code-value">true</span>',
            '  },',
            '  <span class="code-key">"subject"</span>: {',
            '    <span class="code-key">"entity_id"</span>: <span class="code-string">"ent_01HZQ3..."</span>,',
            '    <span class="code-key">"asset_id"</span>: <span class="code-string">"sha256:7a3f9b2e..."</span>',
            '  },',
            '  <span class="code-key">"verified_at"</span>: <span class="code-string">"2026-02-26T10:05:41Z"</span>',
            '}'
          ]
        }
      }
    },
    operations: {
      label: 'Operations',
      actions: {
        execute: {
          label: 'Execute Operation',
          method: 'POST',
          path: '/v1/operations',
          defaultBody: JSON.stringify({
            operation: "entity.incorporate",
            jurisdiction: "pk",
            params: { legal_name: "Karachi Exports Ltd", entity_type: "private_limited", incorporator_name: "Ali Khan", incorporator_email: "ali@karachi-exports.pk", incorporator_cnic: "35201-1234567-8" }
          }, null, 2),
          responseLines: [
            '<span class="code-dim">HTTP/1.1 201 Created</span>',
            '<span class="code-dim">x-request-id: req_f4a8e2c1</span>',
            '',
            '{',
            '  <span class="code-key">"operation_id"</span>: <span class="code-string">"op_01HZU6..."</span>,',
            '  <span class="code-key">"operation"</span>: <span class="code-string">"entity.incorporate"</span>,',
            '  <span class="code-key">"jurisdiction"</span>: <span class="code-string">"pk"</span>,',
            '  <span class="code-key">"status"</span>: <span class="code-string">"Executing"</span>,',
            '  <span class="code-key">"steps_total"</span>: <span class="code-value">13</span>,',
            '  <span class="code-key">"steps_completed"</span>: <span class="code-value">1</span>,',
            '  <span class="code-key">"started_at"</span>: <span class="code-string">"2026-02-25T16:30:44Z"</span>',
            '}'
          ]
        },
        plan: {
          label: 'Plan Operation',
          method: 'POST',
          path: '/v1/operations/plan',
          defaultBody: JSON.stringify({
            operation: "entity.incorporate",
            jurisdiction: "adgm",
            params: { legal_name: "Gulf Ventures LLC", entity_type: "llc", incorporator_name: "Sara Ahmed", incorporator_email: "sara@gulf-ventures.ae" }
          }, null, 2),
          responseLines: [
            '<span class="code-dim">HTTP/1.1 200 OK</span>',
            '',
            '{',
            '  <span class="code-key">"operation"</span>: <span class="code-string">"entity.incorporate"</span>,',
            '  <span class="code-key">"jurisdiction"</span>: <span class="code-string">"adgm"</span>,',
            '  <span class="code-key">"steps"</span>: <span class="code-value">11</span>,',
            '  <span class="code-key">"async_steps"</span>: <span class="code-value">4</span>,',
            '  <span class="code-key">"services"</span>: [<span class="code-string">"organization-info"</span>, <span class="code-string">"treasury-info"</span>, <span class="code-string">"governance-info"</span>, <span class="code-string">"templating-engine"</span>],',
            '  <span class="code-key">"estimated_fees"</span>: {<span class="code-key">"total"</span>: <span class="code-string">"5000"</span>, <span class="code-key">"currency"</span>: <span class="code-string">"AED"</span>},',
            '  <span class="code-key">"compliance_domains"</span>: [<span class="code-string">"corporate"</span>, <span class="code-string">"licensing"</span>, <span class="code-string">"data_protection"</span>]',
            '}'
          ]
        },
        advance: {
          label: 'Advance Step',
          method: 'POST',
          path: '/v1/operations/{id}/advance',
          defaultBody: JSON.stringify({
            operation_id: "op_01HZU6..."
          }, null, 2),
          responseLines: [
            '<span class="code-dim">HTTP/1.1 200 OK</span>',
            '',
            '{',
            '  <span class="code-key">"step"</span>: <span class="code-string">"filing"</span>,',
            '  <span class="code-key">"status"</span>: <span class="code-string">"Completed"</span>,',
            '  <span class="code-key">"result"</span>: {<span class="code-key">"filing_id"</span>: <span class="code-string">"f_01HZU7..."</span>},',
            '  <span class="code-key">"next_ready"</span>: [<span class="code-string">"trade_license"</span>, <span class="code-string">"data_protection"</span>],',
            '  <span class="code-key">"steps_completed"</span>: <span class="code-value">3</span>,',
            '  <span class="code-key">"steps_total"</span>: <span class="code-value">11</span>',
            '}'
          ]
        },
        events: {
          label: 'Deliver Event',
          method: 'POST',
          path: '/v1/operations/{id}/events',
          defaultBody: JSON.stringify({
            operation_id: "op_01HZU6...",
            event_type: "filing.accepted",
            step_id: "filing",
            evidence: { reference_number: "ADGM-2026-00847" }
          }, null, 2),
          responseLines: [
            '<span class="code-dim">HTTP/1.1 200 OK</span>',
            '',
            '{',
            '  <span class="code-key">"step"</span>: <span class="code-string">"filing"</span>,',
            '  <span class="code-key">"event_type"</span>: <span class="code-string">"filing.accepted"</span>,',
            '  <span class="code-key">"previous_status"</span>: <span class="code-string">"Waiting"</span>,',
            '  <span class="code-key">"new_status"</span>: <span class="code-string">"Completed"</span>,',
            '  <span class="code-key">"unblocked_steps"</span>: [<span class="code-string">"trade_license"</span>, <span class="code-string">"data_protection"</span>]',
            '}'
          ]
        }
      }
    },
    watchers: {
      label: 'Watchers',
      actions: {
        register: {
          label: 'Register Watcher',
          method: 'POST',
          path: '/v1/watchers',
          defaultBody: JSON.stringify({
            zone_id: "synth-atlantic-fintech",
            public_key: "ed25519:abc123...",
            bond_amount: "10000.00",
            bond_currency: "USD"
          }, null, 2),
          responseLines: [
            '<span class="code-dim">HTTP/1.1 201 Created</span>',
            '',
            '{',
            '  <span class="code-key">"watcher_id"</span>: <span class="code-string">"wtc_01HZS8..."</span>,',
            '  <span class="code-key">"zone_id"</span>: <span class="code-string">"synth-atlantic-fintech"</span>,',
            '  <span class="code-key">"bond_status"</span>: <span class="code-string">"active"</span>,',
            '  <span class="code-key">"attestation_count"</span>: <span class="code-value">0</span>,',
            '  <span class="code-key">"registered_at"</span>: <span class="code-string">"2026-02-25T14:22:10Z"</span>',
            '}'
          ]
        },
        attest: {
          label: 'Submit Attestation',
          method: 'POST',
          path: '/v1/watchers/{id}/attest',
          defaultBody: JSON.stringify({
            corridor_id: "cor_01HZQ5...",
            receipt_sequence: 42,
            mmr_root: "sha256:c6f3...",
            signature: "ed25519:sig..."
          }, null, 2),
          responseLines: [
            '<span class="code-dim">HTTP/1.1 201 Created</span>',
            '',
            '{',
            '  <span class="code-key">"attestation_id"</span>: <span class="code-string">"att_01HZT1..."</span>,',
            '  <span class="code-key">"watcher_id"</span>: <span class="code-string">"wtc_01HZS8..."</span>,',
            '  <span class="code-key">"corridor_id"</span>: <span class="code-string">"cor_01HZQ5..."</span>,',
            '  <span class="code-key">"receipt_sequence"</span>: <span class="code-value">42</span>,',
            '  <span class="code-key">"quorum_status"</span>: <span class="code-string">"2/3 achieved"</span>,',
            '  <span class="code-key">"verified"</span>: <span class="code-value">true</span>',
            '}'
          ]
        }
      }
    },
    arbitration: {
      label: 'Arbitration',
      actions: {
        file_dispute: {
          label: 'File Dispute',
          method: 'POST',
          path: '/v1/arbitration/disputes',
          defaultBody: JSON.stringify({
            entity_id: "ent_01HZQ3...",
            respondent_id: "ent_01HZQ5...",
            corridor_id: "cor_01HZQ5...",
            dispute_type: "settlement_disagreement",
            description: "Disputed settlement amount on corridor receipt #42"
          }, null, 2),
          responseLines: [
            '<span class="code-dim">HTTP/1.1 201 Created</span>',
            '',
            '{',
            '  <span class="code-key">"dispute_id"</span>: <span class="code-string">"dsp_01HZV2..."</span>,',
            '  <span class="code-key">"status"</span>: <span class="code-string">"filed"</span>,',
            '  <span class="code-key">"arbitrator_assigned"</span>: <span class="code-value">false</span>,',
            '  <span class="code-key">"evidence_deadline"</span>: <span class="code-string">"2026-03-11T16:30:44Z"</span>,',
            '  <span class="code-key">"filed_at"</span>: <span class="code-string">"2026-02-25T16:30:44Z"</span>',
            '}'
          ]
        }
      }
    }
  };

  var primitiveSelect, actionSelect, methodEl, pathEl, bodyTextarea, sendBtn, outputEl;

  /* ═══════════════════════════════════════
     OPERATION DAG VISUALIZATION (2C)
     ═══════════════════════════════════════ */

  var SERVICE_COLORS = {
    'organization-info': '#7eb8da',
    'treasury-info': '#d4a843',
    'identity-info': '#6dae7f',
    'governance-info': '#a78bba',
    'compliance-info': '#c96b6b',
    'templating-engine': '#8a8a8a'
  };

  var _opsCache = null;

  function loadOperations(cb) {
    if (_opsCache) { cb(_opsCache); return; }
    fetch('/data/operations.json')
      .then(function (r) { return r.json(); })
      .then(function (data) { _opsCache = data; cb(data); })
      .catch(function () { /* silent */ });
  }

  function initDAG() {
    var opSelect = document.getElementById('dag-operation');
    var jurSelect = document.getElementById('dag-jurisdiction');
    var svgEl = document.getElementById('dag-svg');
    var legalEl = document.getElementById('dag-legal-basis');
    if (!opSelect || !jurSelect || !svgEl) return;

    loadOperations(function (ops) {
      var families = Object.keys(ops).sort();
      families.forEach(function (f) {
        var opt = document.createElement('option');
        opt.value = f;
        opt.textContent = f;
        opSelect.appendChild(opt);
      });

      function updateJurisdictions() {
        jurSelect.innerHTML = '';
        var fam = opSelect.value;
        if (!fam || !ops[fam]) return;
        var jurs = Object.keys(ops[fam].jurisdictions).sort();
        jurs.forEach(function (j) {
          var opt = document.createElement('option');
          opt.value = j;
          opt.textContent = j;
          jurSelect.appendChild(opt);
        });
        renderDAG();
      }

      function renderDAG() {
        var fam = opSelect.value;
        var jur = jurSelect.value;
        if (!fam || !jur || !ops[fam] || !ops[fam].jurisdictions[jur]) {
          svgEl.innerHTML = '';
          if (legalEl) legalEl.textContent = '';
          return;
        }
        var data = ops[fam].jurisdictions[jur];
        if (legalEl) legalEl.textContent = data.legal_basis || '';
        var steps = data.steps || [];
        if (!steps.length) { svgEl.innerHTML = ''; return; }

        // Topological sort into layers
        var idMap = {};
        steps.forEach(function (s, i) { idMap[s.id] = i; });
        var layers = [];
        var assigned = {};

        function getLayer(s) {
          if (assigned[s.id] !== undefined) return assigned[s.id];
          var deps = s.depends || [];
          var maxDep = -1;
          deps.forEach(function (d) {
            var di = idMap[d];
            if (di !== undefined) {
              var dl = getLayer(steps[di]);
              if (dl > maxDep) maxDep = dl;
            }
          });
          var layer = maxDep + 1;
          assigned[s.id] = layer;
          return layer;
        }

        steps.forEach(function (s) { getLayer(s); });

        // Group by layer
        var maxLayer = 0;
        steps.forEach(function (s) {
          var l = assigned[s.id];
          if (l > maxLayer) maxLayer = l;
          if (!layers[l]) layers[l] = [];
          layers[l].push(s);
        });

        // Layout params
        var nodeW = 130, nodeH = 28, hGap = 40, vGap = 16;
        var padLeft = 16, padTop = 16;

        // Compute max nodes in any layer
        var maxNodesInLayer = 0;
        layers.forEach(function (l) { if (l.length > maxNodesInLayer) maxNodesInLayer = l.length; });

        var totalH = padTop * 2 + maxNodesInLayer * (nodeH + vGap) - vGap;
        var totalW = padLeft * 2 + (maxLayer + 1) * (nodeW + hGap) - hGap;

        // Position map
        var pos = {};
        layers.forEach(function (layerNodes, li) {
          var layerH = layerNodes.length * (nodeH + vGap) - vGap;
          var yStart = padTop + (totalH - padTop * 2 - layerH) / 2;
          layerNodes.forEach(function (s, ni) {
            pos[s.id] = {
              x: padLeft + li * (nodeW + hGap),
              y: yStart + ni * (nodeH + vGap)
            };
          });
        });

        // Build SVG
        var ns = 'http://www.w3.org/2000/svg';
        svgEl.setAttribute('viewBox', '0 0 ' + totalW + ' ' + totalH);
        svgEl.setAttribute('width', Math.min(totalW, 900));
        svgEl.setAttribute('height', totalH);
        svgEl.innerHTML = '';

        // Arrowhead marker
        var defs = document.createElementNS(ns, 'defs');
        var marker = document.createElementNS(ns, 'marker');
        marker.setAttribute('id', 'dag-arrowhead');
        marker.setAttribute('markerWidth', '6');
        marker.setAttribute('markerHeight', '4');
        marker.setAttribute('refX', '6');
        marker.setAttribute('refY', '2');
        marker.setAttribute('orient', 'auto');
        var polygon = document.createElementNS(ns, 'polygon');
        polygon.setAttribute('points', '0 0, 6 2, 0 4');
        polygon.setAttribute('class', 'dag-arrow');
        marker.appendChild(polygon);
        defs.appendChild(marker);
        svgEl.appendChild(defs);

        // Draw edges
        steps.forEach(function (s) {
          var deps = s.depends || [];
          deps.forEach(function (d) {
            if (!pos[d] || !pos[s.id]) return;
            var fromPos = pos[d];
            var toPos = pos[s.id];
            var line = document.createElementNS(ns, 'line');
            line.setAttribute('x1', fromPos.x + nodeW);
            line.setAttribute('y1', fromPos.y + nodeH / 2);
            line.setAttribute('x2', toPos.x);
            line.setAttribute('y2', toPos.y + nodeH / 2);
            line.setAttribute('stroke', 'rgba(229,226,223,0.2)');
            line.setAttribute('class', 'dag-edge');
            line.setAttribute('marker-end', 'url(#dag-arrowhead)');
            svgEl.appendChild(line);
          });
        });

        // Draw async boundary indicators (dashed lines from node to right)
        steps.forEach(function (s) {
          if (!s.async_event || !pos[s.id]) return;
          var p = pos[s.id];
          var line = document.createElementNS(ns, 'line');
          line.setAttribute('x1', p.x + nodeW + 2);
          line.setAttribute('y1', p.y + nodeH / 2);
          line.setAttribute('x2', p.x + nodeW + 18);
          line.setAttribute('y2', p.y + nodeH / 2);
          line.setAttribute('stroke', 'rgba(229,226,223,0.3)');
          line.setAttribute('class', 'dag-edge dag-edge-async');
          svgEl.appendChild(line);
        });

        // Draw nodes
        steps.forEach(function (s) {
          if (!pos[s.id]) return;
          var p = pos[s.id];
          var color = SERVICE_COLORS[s.service] || '#8a8a8a';

          var g = document.createElementNS(ns, 'g');
          g.setAttribute('class', 'dag-node');

          var rect = document.createElementNS(ns, 'rect');
          rect.setAttribute('x', p.x);
          rect.setAttribute('y', p.y);
          rect.setAttribute('width', nodeW);
          rect.setAttribute('height', nodeH);
          rect.setAttribute('fill', 'rgba(0,0,0,0.3)');
          rect.setAttribute('stroke', color);
          g.appendChild(rect);

          var text = document.createElementNS(ns, 'text');
          text.setAttribute('x', p.x + 6);
          text.setAttribute('y', p.y + nodeH / 2 + 3);
          text.setAttribute('fill', color);
          // Truncate long IDs
          var label = s.id.length > 16 ? s.id.substring(0, 15) + '\u2026' : s.id;
          text.textContent = label;
          g.appendChild(text);

          // Tooltip with full description
          var title = document.createElementNS(ns, 'title');
          title.textContent = s.id + ' (' + s.service + ')' + (s.description ? '\n' + s.description : '') + (s.async_event ? '\nAsync: ' + s.async_event : '');
          g.appendChild(title);

          svgEl.appendChild(g);
        });
      }

      opSelect.addEventListener('change', updateJurisdictions);
      jurSelect.addEventListener('change', renderDAG);

      // Default selection
      if (families.indexOf('entity.incorporate') !== -1) {
        opSelect.value = 'entity.incorporate';
      }
      updateJurisdictions();
    });
  }

  /* ═══════════════════════════════════════
     CROSS-JURISDICTION COMPARISON (2D)
     ═══════════════════════════════════════ */

  function initComparison() {
    var cmpOpSelect = document.getElementById('cmp-operation');
    var thead = document.getElementById('cmp-thead');
    var tbody = document.getElementById('cmp-tbody');
    if (!cmpOpSelect || !thead || !tbody) return;

    loadOperations(function (ops) {
      // Only show operations with 2+ jurisdictions
      var families = Object.keys(ops).sort().filter(function (f) {
        return Object.keys(ops[f].jurisdictions).length >= 2;
      });

      families.forEach(function (f) {
        var opt = document.createElement('option');
        opt.value = f;
        opt.textContent = f + ' (' + Object.keys(ops[f].jurisdictions).length + ' jurisdictions)';
        cmpOpSelect.appendChild(opt);
      });

      function renderComparison() {
        var fam = cmpOpSelect.value;
        thead.innerHTML = '';
        tbody.innerHTML = '';
        if (!fam || !ops[fam]) return;

        var jurs = Object.keys(ops[fam].jurisdictions).sort();
        if (jurs.length < 2) return;

        // Header row
        var headerRow = document.createElement('tr');
        var thLabel = document.createElement('th');
        thLabel.textContent = '';
        headerRow.appendChild(thLabel);
        jurs.forEach(function (j) {
          var th = document.createElement('th');
          th.textContent = j;
          headerRow.appendChild(th);
        });
        thead.appendChild(headerRow);

        // Row builder
        function addRow(label, getter) {
          var tr = document.createElement('tr');
          var tdLabel = document.createElement('td');
          tdLabel.className = 'cmp-row-label';
          tdLabel.textContent = label;
          tr.appendChild(tdLabel);
          jurs.forEach(function (j) {
            var td = document.createElement('td');
            td.innerHTML = getter(ops[fam].jurisdictions[j], j);
            tr.appendChild(td);
          });
          tbody.appendChild(tr);
        }

        addRow('Legal Basis', function (d) {
          return d.legal_basis ? d.legal_basis.substring(0, 60) + (d.legal_basis.length > 60 ? '...' : '') : '—';
        });

        addRow('Steps', function (d) {
          return '' + (d.steps ? d.steps.length : 0);
        });

        addRow('Async Steps', function (d) {
          if (!d.steps) return '0';
          var count = d.steps.filter(function (s) { return s.async_event; }).length;
          return '' + count;
        });

        addRow('Services', function (d) {
          if (!d.steps) return '—';
          var svcs = {};
          d.steps.forEach(function (s) { if (s.service) svcs[s.service] = true; });
          return Object.keys(svcs).sort().join(', ');
        });

        addRow('Required Params', function (d) {
          if (!d.params_required || !d.params_required.length) return '—';
          return d.params_required.map(function (p) { return p.name; }).join(', ');
        });

        addRow('Fees', function (d) {
          if (!d.fees || !d.fees.length) return '—';
          return d.fees.map(function (f) {
            return f.label + ': ' + f.amount + (f.currency ? ' ' + f.currency : '');
          }).join('<br>');
        });

        addRow('Compliance Domains', function (d) {
          if (!d.steps) return '—';
          var domains = {};
          d.steps.forEach(function (s) {
            if (s.domains) s.domains.forEach(function (dm) { domains[dm] = true; });
          });
          var list = Object.keys(domains).sort();
          return list.length ? list.join(', ') : '—';
        });
      }

      cmpOpSelect.addEventListener('change', renderComparison);

      // Default
      if (families.indexOf('entity.incorporate') !== -1) {
        cmpOpSelect.value = 'entity.incorporate';
      } else if (families.length) {
        cmpOpSelect.value = families[0];
      }
      renderComparison();
    });
  }

  /* ═══════════════════════════════════════
     SCHEMA BROWSER (2E)
     ═══════════════════════════════════════ */

  var _schemasCache = null;

  function loadSchemas(cb) {
    if (_schemasCache) { cb(_schemasCache); return; }
    fetch('/data/schemas.json')
      .then(function (r) { return r.json(); })
      .then(function (data) { _schemasCache = data; cb(data); })
      .catch(function () { /* silent */ });
  }

  function initSchemaBrowser() {
    var selectEl = document.getElementById('schema-select');
    var metaEl = document.getElementById('schema-meta');
    var outputEl = document.getElementById('schema-output');
    var titleBar = document.getElementById('schema-title-bar');
    if (!selectEl || !outputEl) return;

    loadSchemas(function (schemas) {
      // Group by family
      var families = {};
      schemas.forEach(function (s, i) {
        var fam = s.file.split('.')[0].replace(/-/g, ' ');
        if (!families[fam]) families[fam] = [];
        families[fam].push({ index: i, schema: s });
      });

      // Populate select with optgroups
      Object.keys(families).sort().forEach(function (fam) {
        var group = document.createElement('optgroup');
        group.label = fam;
        families[fam].forEach(function (entry) {
          var opt = document.createElement('option');
          opt.value = entry.index;
          opt.textContent = entry.schema.title || entry.schema.file;
          group.appendChild(opt);
        });
        selectEl.appendChild(group);
      });

      function renderSchema() {
        var idx = parseInt(selectEl.value, 10);
        if (isNaN(idx) || !schemas[idx]) {
          outputEl.innerHTML = '<span class="code-dim">Select a schema above.</span>';
          if (metaEl) metaEl.innerHTML = '';
          if (titleBar) titleBar.textContent = 'schema';
          return;
        }
        var s = schemas[idx];
        if (titleBar) titleBar.textContent = s.file;

        // Meta line
        if (metaEl) {
          var meta = '';
          if (s.id) meta += '<span class="schema-id">' + escapeHtml(s.id) + '</span><br>';
          if (s.title) meta += s.title + ' &middot; ';
          meta += 'type: ' + (s.type || 'object');
          if (s.required && s.required.length) {
            meta += '<br>required: <span class="schema-req">' + s.required.join(', ') + '</span>';
          }
          metaEl.innerHTML = meta;
        }

        // Render properties as syntax-highlighted JSON-like output
        var lines = [];
        lines.push('{');
        if (s.properties && s.properties.length) {
          s.properties.forEach(function (p, pi) {
            var isRequired = s.required && s.required.indexOf(p.name) !== -1;
            var typePart = '<span class="code-dim">' + escapeHtml(p.type || 'any') + '</span>';
            var line = '  <span class="code-key">"' + escapeHtml(p.name) + '"</span>: ' + typePart;
            if (isRequired) line += '  <span class="schema-req">required</span>';
            if (p.pattern) line += '  <span class="code-dim">/' + escapeHtml(p.pattern) + '/</span>';
            if (p.format) line += '  <span class="code-dim">format:' + escapeHtml(p.format) + '</span>';
            if (p.description) line += '\n    <span class="code-comment">// ' + escapeHtml(p.description) + '</span>';
            if (p.enum) line += '\n    <span class="code-comment">// enum: ' + p.enum.map(escapeHtml).join(' | ') + '</span>';
            if (p.minimum !== undefined) line += '  <span class="code-dim">min:' + p.minimum + '</span>';
            if (pi < s.properties.length - 1) line += ',';
            lines.push(line);
          });
        }
        lines.push('}');
        outputEl.innerHTML = lines.join('\n');
      }

      selectEl.addEventListener('change', renderSchema);
    });
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  /* ═══════════════════════════════════════
     CORRIDOR STATE MACHINE (2G)
     ═══════════════════════════════════════ */

  function initCorridorSM() {
    var svgEl = document.getElementById('corridor-sm-svg');
    var infoEl = document.getElementById('corridor-sm-info');
    if (!svgEl) return;

    var ns = 'http://www.w3.org/2000/svg';

    var states = [
      { id: 'DRAFT',     x: 20,  y: 120, w: 80, h: 30, color: '#8a8a8a' },
      { id: 'PENDING',   x: 150, y: 120, w: 80, h: 30, color: '#d4a843' },
      { id: 'ACTIVE',    x: 280, y: 120, w: 80, h: 30, color: '#6dae7f' },
      { id: 'HALTED',    x: 410, y: 50,  w: 80, h: 30, color: '#c96b6b' },
      { id: 'SUSPENDED', x: 410, y: 190, w: 80, h: 30, color: '#c96b6b' }
    ];

    var transitions = [
      { from: 'DRAFT',   to: 'PENDING',   label: 'propose',   evidence: 'Bilateral agreement digest', who: 'zone_admin', effect: 'Watcher bond collection begins' },
      { from: 'PENDING', to: 'ACTIVE',    label: 'activate',  evidence: 'Watcher bond + attestation quorum', who: 'zone_admin', effect: 'Receipt submission enabled' },
      { from: 'ACTIVE',  to: 'HALTED',    label: 'halt',      evidence: 'Compliance violation or dispute', who: 'regulator / watcher', effect: 'New receipts blocked, existing record preserved' },
      { from: 'HALTED',  to: 'ACTIVE',    label: 'resume',    evidence: 'Resolution attestation', who: 'zone_admin + regulator', effect: 'Receipt submission re-enabled' },
      { from: 'ACTIVE',  to: 'SUSPENDED', label: 'suspend',   evidence: 'Regulatory order', who: 'regulator', effect: 'Full freeze — no receipts, no settlements' },
      { from: 'SUSPENDED', to: 'PENDING', label: 'reinstate', evidence: 'Regulatory clearance', who: 'regulator', effect: 'Returns to pending for re-activation' }
    ];

    var stateMap = {};
    states.forEach(function (s) { stateMap[s.id] = s; });

    // Arrow marker
    var defs = document.createElementNS(ns, 'defs');
    var marker = document.createElementNS(ns, 'marker');
    marker.setAttribute('id', 'sm-arrow');
    marker.setAttribute('markerWidth', '6');
    marker.setAttribute('markerHeight', '4');
    marker.setAttribute('refX', '6');
    marker.setAttribute('refY', '2');
    marker.setAttribute('orient', 'auto');
    var poly = document.createElementNS(ns, 'polygon');
    poly.setAttribute('points', '0 0, 6 2, 0 4');
    poly.setAttribute('fill', 'rgba(229,226,223,0.3)');
    marker.appendChild(poly);
    defs.appendChild(marker);
    svgEl.appendChild(defs);

    // Draw edges
    transitions.forEach(function (t) {
      var from = stateMap[t.from];
      var to = stateMap[t.to];
      if (!from || !to) return;

      var x1 = from.x + from.w;
      var y1 = from.y + from.h / 2;
      var x2 = to.x;
      var y2 = to.y + to.h / 2;

      // For back-transitions, curve the path
      var path;
      if (from.x >= to.x) {
        // Backward — use a curved path
        var midY = Math.min(from.y, to.y) - 30;
        path = document.createElementNS(ns, 'path');
        path.setAttribute('d', 'M' + x1 + ',' + y1 + ' C' + (x1 + 30) + ',' + midY + ' ' + (x2 - 30) + ',' + midY + ' ' + x2 + ',' + y2);
      } else {
        path = document.createElementNS(ns, 'path');
        // Forward — slight curve for clarity
        var midX = (x1 + x2) / 2;
        var midYoff = y1 === y2 ? 0 : (y2 > y1 ? 15 : -15);
        path.setAttribute('d', 'M' + x1 + ',' + y1 + ' Q' + midX + ',' + (y1 + midYoff) + ' ' + x2 + ',' + y2);
      }
      path.setAttribute('class', 'sm-edge');
      path.setAttribute('marker-end', 'url(#sm-arrow)');
      svgEl.appendChild(path);

      // Edge label
      var lx = (x1 + x2) / 2;
      var ly = (y1 + y2) / 2 - 6;
      if (from.x >= to.x) ly = Math.min(from.y, to.y) - 34;
      var label = document.createElementNS(ns, 'text');
      label.setAttribute('x', lx);
      label.setAttribute('y', ly);
      label.setAttribute('text-anchor', 'middle');
      label.setAttribute('class', 'sm-edge-label');
      label.textContent = t.label;
      svgEl.appendChild(label);
    });

    // Draw states
    states.forEach(function (s) {
      var g = document.createElementNS(ns, 'g');
      g.setAttribute('class', 'sm-state');
      g.setAttribute('data-state', s.id);

      var rect = document.createElementNS(ns, 'rect');
      rect.setAttribute('x', s.x);
      rect.setAttribute('y', s.y);
      rect.setAttribute('width', s.w);
      rect.setAttribute('height', s.h);
      rect.setAttribute('fill', 'rgba(0,0,0,0.3)');
      rect.setAttribute('stroke', s.color);
      g.appendChild(rect);

      var text = document.createElementNS(ns, 'text');
      text.setAttribute('x', s.x + s.w / 2);
      text.setAttribute('y', s.y + s.h / 2 + 3);
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('fill', s.color);
      text.textContent = s.id;
      g.appendChild(text);

      // Hover interaction
      g.addEventListener('mouseenter', function () {
        if (!infoEl) return;
        g.classList.add('sm-active');
        var outgoing = transitions.filter(function (t) { return t.from === s.id; });
        if (!outgoing.length) {
          infoEl.innerHTML = '<strong>' + s.id + '</strong> — terminal state (no outgoing transitions)';
          return;
        }
        var html = '<strong>' + s.id + '</strong> transitions:<br>';
        outgoing.forEach(function (t) {
          html += '&rarr; <strong>' + t.to + '</strong> via <em>' + t.label + '</em> — ' + t.effect + '<br>';
        });
        infoEl.innerHTML = html;
      });
      g.addEventListener('mouseleave', function () {
        g.classList.remove('sm-active');
        if (infoEl) infoEl.innerHTML = '<span class="code-dim">Hover a state to see available transitions.</span>';
      });

      svgEl.appendChild(g);
    });

    if (infoEl) infoEl.innerHTML = '<span class="code-dim">Hover a state to see available transitions.</span>';
  }

  /* ═══════════════════════════════════════
     SANDBOX TIMING DISPLAY (2F)
     ═══════════════════════════════════════ */

  // Patch the existing sendRequest to show simulated timing
  var _origSendRequest;

  function patchSandboxTiming() {
    var timingEl = document.getElementById('sb-timing');
    if (!timingEl) return;

    // Observe output changes to show timing
    var sbOutput = document.getElementById('sb-output');
    if (!sbOutput) return;

    // MutationObserver to detect when response renders
    var observer = new MutationObserver(function () {
      // Show a realistic simulated timing
      var ms = Math.floor(Math.random() * 35) + 18; // 18-53ms
      timingEl.textContent = ms + 'ms';
    });
    observer.observe(sbOutput, { childList: true, subtree: true, characterData: true });
  }

  function init() {
    primitiveSelect = document.getElementById('sb-primitive');
    actionSelect = document.getElementById('sb-action');
    methodEl = document.getElementById('sb-method');
    pathEl = document.getElementById('sb-path');
    bodyTextarea = document.getElementById('sb-body');
    sendBtn = document.getElementById('sb-send');
    outputEl = document.getElementById('sb-output');

    if (!primitiveSelect || !actionSelect || !sendBtn || !outputEl) return;

    Object.keys(API_CATALOG).forEach(function (key) {
      var opt = document.createElement('option');
      opt.value = key;
      opt.textContent = API_CATALOG[key].label;
      primitiveSelect.appendChild(opt);
    });

    primitiveSelect.addEventListener('change', function () {
      updateActions(primitiveSelect.value);
    });
    actionSelect.addEventListener('change', function () {
      updateRequestBody(primitiveSelect.value, actionSelect.value);
    });
    sendBtn.addEventListener('click', sendRequest);

    if (primitiveSelect.options.length > 1) {
      primitiveSelect.value = 'entities';
      updateActions('entities');
    }

    initSidebarNav();
    initSidebarSearch();
    initCopyButtons();
    initDAG();
    initComparison();
    initSchemaBrowser();
    initCorridorSM();
    patchSandboxTiming();
  }

  function updateActions(primitive) {
    actionSelect.innerHTML = '';
    if (!primitive || !API_CATALOG[primitive]) {
      actionSelect.innerHTML = '<option value="">--</option>';
      updateMethodPath('', '');
      if (bodyTextarea) bodyTextarea.value = '';
      return;
    }
    var actions = API_CATALOG[primitive].actions;
    Object.keys(actions).forEach(function (key) {
      var opt = document.createElement('option');
      opt.value = key;
      opt.textContent = actions[key].label;
      actionSelect.appendChild(opt);
    });
    var firstKey = Object.keys(actions)[0];
    if (firstKey) {
      actionSelect.value = firstKey;
      updateRequestBody(primitive, firstKey);
    }
  }

  function updateRequestBody(primitive, action) {
    if (!primitive || !action || !API_CATALOG[primitive]) return;
    var endpoint = API_CATALOG[primitive].actions[action];
    if (!endpoint) return;
    updateMethodPath(endpoint.method, endpoint.path);
    if (bodyTextarea) {
      bodyTextarea.value = endpoint.defaultBody;
      bodyTextarea.style.display = endpoint.defaultBody ? '' : 'none';
      var label = bodyTextarea.previousElementSibling;
      if (label && label.classList.contains('docs-sandbox-label')) {
        label.style.display = endpoint.defaultBody ? '' : 'none';
      }
    }
  }

  function updateMethodPath(method, path) {
    if (methodEl) methodEl.textContent = method;
    if (pathEl) pathEl.textContent = path;
  }

  function sendRequest() {
    var primitive = primitiveSelect.value;
    var action = actionSelect.value;
    if (!primitive || !action) return;
    var endpoint = API_CATALOG[primitive].actions[action];
    if (!endpoint) return;

    animationId++;
    var myId = animationId;

    sendBtn.disabled = true;
    sendBtn.innerHTML = '<span class="zc-btn-icon">&#9656;</span> Sending...';
    outputEl.innerHTML = '<div class="code-panel"><div class="code-block-header"><span class="dot"></span><span class="dot"></span><span class="dot"></span><span class="title">response</span></div><pre class="code-block"><code><span class="code-dim">Processing request...</span></code></pre></div>';

    var delay = reducedMotion ? 0 : 800;
    setTimeout(function () {
      if (myId !== animationId) return;
      var codeEl = outputEl.querySelector('code');
      codeEl.innerHTML = '';

      if (reducedMotion) {
        endpoint.responseLines.forEach(function (line) { codeEl.insertAdjacentHTML('beforeend', line + '\n'); });
        resetSendButton();
        return;
      }

      var lineIdx = 0;
      function showLine() {
        if (myId !== animationId) return;
        if (lineIdx < endpoint.responseLines.length) {
          codeEl.insertAdjacentHTML('beforeend', endpoint.responseLines[lineIdx] + '\n');
          lineIdx++;
          var pre = outputEl.querySelector('pre');
          if (pre) pre.scrollTop = pre.scrollHeight;
          setTimeout(showLine, endpoint.responseLines[lineIdx - 1].trim() === '' ? 5 : 55);
        } else {
          resetSendButton();
        }
      }
      showLine();
    }, delay);
  }

  function resetSendButton() {
    if (sendBtn) {
      sendBtn.disabled = false;
      sendBtn.innerHTML = '<span class="zc-btn-icon">&#9656;</span> Send Request';
    }
  }

  /* ── Sidebar search ── */
  function initSidebarSearch() {
    var input = document.getElementById('docs-search');
    if (!input) return;

    var links = document.querySelectorAll('.docs-sidebar-link');
    var groups = document.querySelectorAll('.docs-sidebar-group');
    var sections = document.querySelectorAll('.docs-section');

    // Build search index: link text + section endpoint paths + h3/h4 text
    var index = [];
    links.forEach(function (link) {
      var href = link.getAttribute('href');
      var sectionId = href ? href.replace('#', '') : '';
      var section = sectionId ? document.getElementById(sectionId) : null;
      var terms = [link.textContent.toLowerCase()];
      if (section) {
        // Gather endpoint paths from code blocks
        var codeBlocks = section.querySelectorAll('.code-block');
        codeBlocks.forEach(function (block) {
          var text = block.textContent;
          var pathMatch = text.match(/\/v1\/[^\s'"]*/g);
          if (pathMatch) {
            pathMatch.forEach(function (p) { terms.push(p.toLowerCase()); });
          }
        });
        // Gather h3/h4 headings
        var headings = section.querySelectorAll('h3, h4');
        headings.forEach(function (h) { terms.push(h.textContent.toLowerCase()); });
        // Gather param names
        var params = section.querySelectorAll('.docs-param-name');
        params.forEach(function (p) { terms.push(p.textContent.toLowerCase()); });
      }
      index.push({ link: link, terms: terms.join(' '), sectionId: sectionId });
    });

    function doFilter() {
      var query = input.value.trim().toLowerCase();
      if (!query) {
        links.forEach(function (l) {
          l.classList.remove('search-hidden', 'search-match');
        });
        groups.forEach(function (g) { g.classList.remove('search-group-hidden'); });
        return;
      }
      var escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      var re = new RegExp(escaped);
      groups.forEach(function (g) {
        var hasVisible = false;
        var groupLinks = g.querySelectorAll('.docs-sidebar-link');
        groupLinks.forEach(function (l) {
          var entry = index.find(function (e) { return e.link === l; });
          var match = entry && re.test(entry.terms);
          l.classList.toggle('search-hidden', !match);
          l.classList.toggle('search-match', !!match);
          if (match) hasVisible = true;
        });
        g.classList.toggle('search-group-hidden', !hasVisible);
      });
    }

    input.addEventListener('input', doFilter);

    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        var firstMatch = document.querySelector('.docs-sidebar-link.search-match');
        if (firstMatch) {
          firstMatch.click();
          var targetId = firstMatch.getAttribute('href').replace('#', '');
          var target = document.getElementById(targetId);
          if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
      if (e.key === 'Escape') {
        input.value = '';
        doFilter();
        input.blur();
      }
    });

    // "/" hotkey to focus search (GitHub/Stripe pattern)
    document.addEventListener('keydown', function (e) {
      if (e.key === '/' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
        e.preventDefault();
        input.focus();
      }
    });
  }

  /* ── Copy-to-clipboard on code blocks ── */
  function initCopyButtons() {
    var panels = document.querySelectorAll('.code-panel');
    panels.forEach(function (panel) {
      // Skip if already has a copy button
      if (panel.querySelector('.code-copy-btn')) return;
      var btn = document.createElement('button');
      btn.className = 'code-copy-btn';
      btn.textContent = 'copy';
      btn.setAttribute('aria-label', 'Copy code');
      btn.addEventListener('click', function () {
        var codeBlock = panel.querySelector('code');
        if (!codeBlock) return;
        var text = codeBlock.textContent;
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(function () {
            btn.textContent = 'copied';
            btn.classList.add('copied');
            setTimeout(function () {
              btn.textContent = 'copy';
              btn.classList.remove('copied');
            }, 2000);
          });
        }
      });
      panel.appendChild(btn);
    });
  }

  /* ── Sidebar scroll-spy ── */
  function initSidebarNav() {
    var links = document.querySelectorAll('.docs-sidebar-link');
    var sections = document.querySelectorAll('.docs-section');
    if (!links.length || !sections.length) return;

    var currentId = '';
    var clickLock = false;
    var clickTimer = 0;
    var rafPending = false;

    function setActive(id) {
      if (id === currentId) return;
      currentId = id;
      links.forEach(function (link) {
        link.classList.toggle('active', link.getAttribute('href') === '#' + id);
      });
      var activeLink = document.querySelector('.docs-sidebar-link.active');
      if (activeLink) activeLink.scrollIntoView({ block: 'nearest', behavior: 'auto' });
    }

    // Click handler — immediately set active, suppress scroll-spy briefly
    links.forEach(function (link) {
      var href = link.getAttribute('href');
      if (!href || href.charAt(0) !== '#') return;
      link.addEventListener('click', function () {
        clickLock = true;
        clearTimeout(clickTimer);
        setActive(href.slice(1));
        clickTimer = setTimeout(function () { clickLock = false; }, 800);
      });
    });

    // Scroll-position based spy — deterministic, no observer race conditions.
    // Find the last section whose top has scrolled past the trigger line (header + 100px).
    function updateSpy() {
      rafPending = false;
      if (clickLock) return;

      var triggerY = 100; // pixels from viewport top
      var activeId = null;

      // At page bottom, activate the last section
      if ((window.innerHeight + window.scrollY) >= (document.body.scrollHeight - 50)) {
        activeId = sections[sections.length - 1].getAttribute('id');
      } else {
        for (var i = sections.length - 1; i >= 0; i--) {
          if (sections[i].getBoundingClientRect().top <= triggerY) {
            activeId = sections[i].getAttribute('id');
            break;
          }
        }
      }

      if (activeId) setActive(activeId);
    }

    window.addEventListener('scroll', function () {
      if (!rafPending) {
        rafPending = true;
        requestAnimationFrame(updateSpy);
      }
    }, { passive: true });

    // Initial run
    updateSpy();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
