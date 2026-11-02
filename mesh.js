/* mesh.js — Corridor mesh visualization on world map
   Uses optimized world-map.svg as geographic background.
   Vanilla JS, no dependencies. Generates SVG inline.
   Respects prefers-reduced-motion. */

(function () {
    'use strict';

    var NS = 'http://www.w3.org/2000/svg';
    var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var _resizeHandler = null;
    var _removeCardHandler = null;
    var _teardown = null;
    var _visibilityObs = null;

    /* ── Zone data ──
       Pixel positions calibrated to world-map.svg (1920×1080 equirectangular).
       Derived from lat/lon: x = (lon+180)/360*1920, y = (83-lat)/143*1080
       Lat range: 83°N to 60°S. Zone IDs sourced from momentum-sez/stack jurisdictions/ */
    var ZONES = [
        /* All zones sourced from momentum-sez/stack jurisdictions/
           Positions: x = (lon+180)/360*1920, y = (83-lat)/143*1080
           status: live/testnet/pipeline — controls node opacity */

        /* ── Gulf & Middle East — LIVE ──
           Positions spread for visual clarity — Gulf nodes sit very close
           geographically; we offset them so labels and circles don't overlap.
           True geo coords would put all UAE zones within ~10px of each other.
           Arranged as 2-column grid: Abu Dhabi left (x≈1218), Dubai right (x≈1283).
           Spread centered around real lat ~24.5°N (y≈444), lon ~55°E (x≈1253). */
        { id: 'ae-abudhabi-adgm',name: 'ADGM',                  type: 'natural', status: 'live',     x: 1218, y: 404  },
        { id: 'ae-dubai-fzc',   name: 'Dubai FZC',               type: 'natural', status: 'live',     x: 1283, y: 404  },
        { id: 'ae-dubai-ifza',  name: 'IFZA',                   type: 'natural', status: 'live',     x: 1283, y: 524  },
        { id: 'ae-dubai-difc',   name: 'DIFC',                   type: 'natural', status: 'live',     x: 1283, y: 444  },
        { id: 'ae-dubai-dmcc',   name: 'DMCC',                   type: 'natural', status: 'live',     x: 1283, y: 484  },
        { id: 'ae-dubai-jafza',  name: 'JAFZA',                  type: 'natural', status: 'live',     x: 1218, y: 484  },
        { id: 'eg',              name: 'Egypt',                  type: 'natural', status: 'pipeline', x: 1127, y: 400  },

        /* ── South & Central Asia ── */
        { id: 'pk-sifc',         name: 'Pakistan SIFC',          type: 'natural', status: 'live',     x: 1350, y: 373  },
        { id: 'kz-alatau',       name: 'Alatau',                 type: 'natural', status: 'testnet',  x: 1370, y: 300  },

        /* ── East & Southeast Asia ── */
        { id: 'hk',              name: 'Hong Kong',              type: 'natural', status: 'live',     x: 1569, y: 458  },
        { id: 'sg',              name: 'Singapore',              type: 'natural', status: 'live',     x: 1514, y: 617  },
        { id: 'jp',              name: 'Japan',                  type: 'natural', status: 'live',     x: 1704, y: 357  },
        { id: 'cn-hangzhou',     name: 'Hangzhou',               type: 'natural', status: 'pipeline',  x: 1601, y: 398  },
        { id: 'cn-hainan',       name: 'Hainan',                 type: 'natural', status: 'pipeline', x: 1548, y: 476  },

        /* ── Africa ── */
        { id: 'rw',              name: 'Rwanda',                 type: 'natural', status: 'live',     x: 1120, y: 641  },
        { id: 'ng',              name: 'Nigeria',                type: 'natural', status: 'live',     x: 978,  y: 578  },
        { id: 'ke',              name: 'Kenya',                  type: 'natural', status: 'pipeline', x: 1156, y: 637  },
        { id: 'za',              name: 'South Africa',           type: 'natural', status: 'live',     x: 1110, y: 825  },
        { id: 'mu',              name: 'Mauritius',              type: 'natural', status: 'live',     x: 1267, y: 783  },
        { id: 'sc',              name: 'Seychelles',             type: 'natural', status: 'testnet',     x: 1256, y: 663  },
        { id: 'tz-zanzibar',     name: 'Zanzibar',               type: 'natural', status: 'pipeline', x: 1169, y: 674  },
        { id: 'gm',              name: 'Gambia SAR',             type: 'natural', status: 'pipeline', x: 872,  y: 525  },

        /* ── Europe ── */
        { id: 'gb',              name: 'London',                 type: 'natural', status: 'live',     x: 960,  y: 238  },
        { id: 'gb-gi',           name: 'Gibraltar',              type: 'natural', status: 'live',     x: 932,  y: 354  },
        { id: 'pt',              name: 'Portugal',               type: 'natural', status: 'pipeline',  x: 911,  y: 334  },

        /* ── Americas — United States — LIVE ── */
        { id: 'us-de',           name: 'Delaware',               type: 'natural', status: 'live',     x: 551,  y: 333  },
        { id: 'us-ny',           name: 'New York',               type: 'natural', status: 'live',     x: 570,  y: 313  },
        { id: 'us-ca',           name: 'California',             type: 'natural', status: 'live',     x: 308,  y: 342  },
        { id: 'us-nv',           name: 'Nevada',                 type: 'natural', status: 'live',     x: 346,  y: 353  },
        { id: 'us-wy',           name: 'Wyoming',                type: 'natural', status: 'live',     x: 401,  y: 316  },
        { id: 'us-mt',           name: 'Montana',                type: 'natural', status: 'live',     x: 363,  y: 275  },
        { id: 'us-fl',           name: 'Florida',                type: 'natural', status: 'live',     x: 510,  y: 340  },

        /* ── Americas — Caribbean & Latin America ── */
        { id: 'ky',              name: 'Cayman',                 type: 'natural', status: 'live',     x: 526,  y: 481  },
        { id: 'vg',              name: 'BVI',                    type: 'natural', status: 'live',     x: 616,  y: 488  },
        { id: 'hn-prospera',     name: 'Pr\u00f3spera',          type: 'natural', status: 'live',     x: 499,  y: 504  },
        { id: 'br-rio',          name: 'Rio de Janeiro',         type: 'natural', status: 'pipeline', x: 730,  y: 800  },
        { id: 'br-floripa',      name: 'Florian\u00f3polis',     type: 'natural', status: 'pipeline', x: 701,  y: 835  },

        /* ── Middle East — Pipeline ── */
        { id: 'qa-qfc',          name: 'QFC Qatar',              type: 'natural', status: 'pipeline', x: 1195, y: 428  },

        /* ── Southeast Asia — Pipeline ── */
        { id: 'id-bali',         name: 'North Bali Airport SEZ', type: 'natural', status: 'pipeline', x: 1574, y: 690  },

        /* ── East Asia — Pipeline ── */
        { id: 'kr',              name: 'Korea',                  type: 'natural', status: 'pipeline', x: 1637, y: 343  },

        /* ── Oceania ── */
        { id: 'au',              name: 'Australia',              type: 'natural', status: 'live',     x: 1765, y: 883  },

    ];

    /* ── Corridors ──
       Cross-border corridors between zones. Types follow the 4-corridor taxonomy:
       cross = CrossBorder, federal = IntraFederal, fz-host = FreeZone→Host, fz-fz = FreeZone→FreeZone */
    var CORRIDORS = [
        /* ── Gulf hub corridors ── */
        { from: 'ae-abudhabi-adgm', to: 'pk-sifc',         type: 'cross' },
        { from: 'ae-abudhabi-adgm', to: 'sg',              type: 'cross' },
        { from: 'ae-abudhabi-adgm', to: 'gb',              type: 'cross' },
        { from: 'eg',              to: 'ae-abudhabi-adgm', type: 'cross' },
        { from: 'qa-qfc',          to: 'ae-abudhabi-adgm', type: 'fz-fz' },
        { from: 'kz-alatau',       to: 'ae-abudhabi-adgm', type: 'cross' },
        { from: 'kz-alatau',       to: 'cn-hangzhou',      type: 'cross' },
        { from: 'kz-alatau',       to: 'cn-hainan',        type: 'cross' },

        /* ── UAE inter-zone corridors (intra-federal: same country) ── */
        { from: 'ae-dubai-fzc',    to: 'ae-abudhabi-adgm', type: 'federal' },
        { from: 'ae-dubai-fzc',    to: 'ae-dubai-ifza', type: 'federal' },
        { from: 'ae-dubai-ifza',to: 'ae-abudhabi-adgm', type: 'federal' },

        /* ── Dubai free zone internal corridors ── */
        { from: 'ae-dubai-difc',   to: 'ae-dubai-fzc',     type: 'fz-fz' },
        { from: 'ae-dubai-difc',   to: 'ae-dubai-dmcc',    type: 'fz-fz' },
        { from: 'ae-dubai-difc',   to: 'ae-dubai-jafza',   type: 'fz-fz' },
        { from: 'ae-dubai-dmcc',   to: 'ae-dubai-fzc',     type: 'fz-fz' },
        { from: 'ae-dubai-dmcc',   to: 'ae-dubai-jafza',   type: 'fz-fz' },
        { from: 'ae-dubai-jafza',  to: 'ae-dubai-fzc',     type: 'fz-fz' },

        /* ── DIFC international corridors ── */
        { from: 'ae-dubai-difc',   to: 'ae-abudhabi-adgm', type: 'federal' },
        { from: 'ae-dubai-difc',   to: 'gb',               type: 'cross' },
        { from: 'ae-dubai-difc',   to: 'sg',               type: 'cross' },
        { from: 'ae-dubai-difc',   to: 'hk',               type: 'cross' },
        { from: 'ae-dubai-difc',   to: 'us-ny',            type: 'cross' },
        { from: 'ae-dubai-difc',   to: 'ky',               type: 'cross' },

        /* ── DMCC international corridors ── */
        { from: 'ae-dubai-dmcc',   to: 'ae-abudhabi-adgm', type: 'federal' },
        { from: 'ae-dubai-dmcc',   to: 'sg',               type: 'cross' },
        { from: 'ae-dubai-dmcc',   to: 'gb',               type: 'cross' },

        /* ── JAFZA international corridors ── */
        { from: 'ae-dubai-jafza',  to: 'ae-abudhabi-adgm', type: 'federal' },
        { from: 'ae-dubai-jafza',  to: 'sg',               type: 'cross' },
        { from: 'ae-dubai-jafza',  to: 'cn-hainan',        type: 'cross' },

        /* ── Hainan super connector ── */
        { from: 'cn-hainan',       to: 'hk',               type: 'cross' },
        { from: 'cn-hainan',       to: 'sg',               type: 'cross' },
        { from: 'cn-hainan',       to: 'cn-hangzhou',       type: 'federal' },
        { from: 'cn-hainan',       to: 'ae-dubai-fzc',      type: 'cross' },
        { from: 'cn-hainan',       to: 'jp',               type: 'cross' },
        { from: 'cn-hainan',       to: 'au',               type: 'cross' },
        { from: 'cn-hainan',       to: 'kr',               type: 'cross' },
        { from: 'cn-hainan',       to: 'id-bali',          type: 'cross' },

        /* ── Asia-Pacific corridors ── */
        { from: 'hk',              to: 'sg',               type: 'fz-fz' },
        { from: 'hk',              to: 'jp',               type: 'cross' },
        { from: 'sg',              to: 'au',               type: 'cross' },
        { from: 'kr',              to: 'jp',               type: 'cross' },

        /* ── London superconnector ── */
        { from: 'gb',              to: 'gb-gi',            type: 'federal' },
        { from: 'gb',              to: 'ky',               type: 'cross' },
        { from: 'gb',              to: 'sg',               type: 'cross' },
        { from: 'gb',              to: 'hk',               type: 'cross' },
        { from: 'gb',              to: 'za',               type: 'cross' },
        { from: 'gb',              to: 'eg',               type: 'cross' },
        { from: 'pt',              to: 'gb',               type: 'cross' },
        { from: 'pt',              to: 'br-rio',           type: 'cross' },

        /* ── Africa corridors ── */
        { from: 'rw',              to: 'ke',               type: 'cross' },
        { from: 'rw',              to: 'ng',               type: 'cross' },
        { from: 'ng',              to: 'gm',               type: 'cross' },
        { from: 'ng',              to: 'gb',               type: 'cross' },
        { from: 'gm',              to: 'gb',               type: 'cross' },
        { from: 'ke',              to: 'tz-zanzibar',      type: 'cross' },
        { from: 'za',              to: 'mu',               type: 'cross' },
        { from: 'mu',              to: 'tz-zanzibar',      type: 'cross' },

        /* ── Seychelles superconnector (Chinese diaspora + UAE hub) ── */
        { from: 'sc',              to: 'ae-dubai-difc',    type: 'cross' },
        { from: 'sc',              to: 'ae-abudhabi-adgm', type: 'cross' },
        { from: 'sc',              to: 'hk',               type: 'cross' },
        { from: 'sc',              to: 'sg',               type: 'cross' },
        { from: 'sc',              to: 'cn-hainan',        type: 'cross' },
        { from: 'sc',              to: 'gb',               type: 'cross' },
        { from: 'sc',              to: 'mu',               type: 'cross' },
        { from: 'sc',              to: 'ke',               type: 'cross' },
        { from: 'sc',              to: 'tz-zanzibar',      type: 'cross' },
        { from: 'sc',              to: 'ky',               type: 'cross' },

        /* ── United States intra-federal corridors ── */
        { from: 'us-de',           to: 'us-ny',            type: 'federal' },
        { from: 'us-ny',           to: 'us-ca',            type: 'federal' },
        { from: 'us-ca',           to: 'us-nv',            type: 'federal' },
        { from: 'us-wy',           to: 'us-nv',            type: 'federal' },
        { from: 'us-wy',           to: 'us-de',            type: 'federal' },
        { from: 'us-mt',           to: 'us-wy',            type: 'federal' },
        { from: 'us-mt',           to: 'us-de',            type: 'federal' },
        { from: 'us-mt',           to: 'us-ny',            type: 'federal' },
        { from: 'us-mt',           to: 'us-ca',            type: 'federal' },
        { from: 'us-mt',           to: 'us-nv',            type: 'federal' },
        { from: 'us-fl',           to: 'us-de',            type: 'federal' },
        { from: 'us-fl',           to: 'us-ny',            type: 'federal' },
        { from: 'us-fl',           to: 'ky',               type: 'cross' },
        { from: 'us-fl',           to: 'hn-prospera',      type: 'cross' },

        /* ── Delaware superconnector ── */
        { from: 'us-de',           to: 'ky',               type: 'cross' },
        { from: 'us-de',           to: 'gb',               type: 'cross' },
        { from: 'us-de',           to: 'ae-abudhabi-adgm', type: 'cross' },
        { from: 'us-de',           to: 'vg',               type: 'cross' },
        { from: 'us-ny',           to: 'gb',               type: 'cross' },

        /* ── California superconnector ── */
        { from: 'us-ca',           to: 'sg',               type: 'cross' },
        { from: 'us-ca',           to: 'hk',               type: 'cross' },
        { from: 'us-ca',           to: 'jp',               type: 'cross' },
        { from: 'us-ca',           to: 'au',               type: 'cross' },

        /* ── Cayman superconnector ── */
        { from: 'ky',              to: 'vg',               type: 'fz-fz' },
        { from: 'ky',              to: 'sg',               type: 'cross' },
        { from: 'ky',              to: 'hk',               type: 'cross' },
        { from: 'ky',              to: 'ae-abudhabi-adgm', type: 'cross' },
        { from: 'hn-prospera',     to: 'ky',               type: 'cross' },

        /* ── BVI superconnector ── */
        { from: 'vg',              to: 'gb',               type: 'cross' },
        { from: 'vg',              to: 'sg',               type: 'cross' },
        { from: 'vg',              to: 'ae-abudhabi-adgm', type: 'cross' },

        /* ── ADGM expanded ── */
        { from: 'ae-abudhabi-adgm', to: 'mu',              type: 'cross' },
        { from: 'ae-abudhabi-adgm', to: 'ke',              type: 'cross' },
        { from: 'ae-abudhabi-adgm', to: 'hk',              type: 'cross' },

        /* ── Americas corridors ── */
        { from: 'br-rio',          to: 'br-floripa',       type: 'federal' },

    ];

    var CORRIDOR_COLORS = {
        'cross':   '#cdc5be',
        'federal': '#b0c0cc',
        'fz-host': '#4a6b4a',
        'fz-fz':   '#7a6b4a'
    };

    /* ── Zone composition data for popup cards ──
       Sourced from zone.yaml files in momentum-sez/stack jurisdictions/ */
    var ZONE_DATA = {
        'us-de': {
            type: 'Natural Zone', layers: [
                { domain: 'Corporate', source: 'us-de', statute: 'DGCL — Title 8' },
                { domain: 'Chancery Court', source: 'us-de', statute: 'Court of Chancery' },
                { domain: 'Alt. Entities', source: 'us-de', statute: 'DE LLC Act Ch. 18' }
            ]
        },
        'us-ny': {
            type: 'Natural Zone', layers: [
                { domain: 'Financial', source: 'us-ny', statute: 'DFS / Banking Law' },
                { domain: 'Securities', source: 'us-ny', statute: 'Martin Act' },
                { domain: 'Digital Assets', source: 'us-ny', statute: 'BitLicense' }
            ]
        },
        'us-ca': {
            type: 'Natural Zone', layers: [
                { domain: 'Digital Assets', source: 'us-ca', statute: 'DFPI Licensing' },
                { domain: 'Corporate', source: 'us-ca', statute: 'CA Corporations Code' },
                { domain: 'Privacy', source: 'us-ca', statute: 'CCPA / CPRA' }
            ]
        },
        'us-nv': {
            type: 'Natural Zone', layers: [
                { domain: 'Corporate', source: 'us-nv', statute: 'NRS Ch. 78' },
                { domain: 'Digital Assets', source: 'us-nv', statute: 'SB 398 Framework' },
                { domain: 'Tax', source: 'us-nv', statute: '0% State Corp. Tax' }
            ]
        },
        'us-wy': {
            type: 'Natural Zone', layers: [
                { domain: 'DAO', source: 'us-wy', statute: 'DAO LLC Act 2021' },
                { domain: 'Digital Assets', source: 'us-wy', statute: 'HB 70 / SPDI' },
                { domain: 'Corporate', source: 'us-wy', statute: 'WY LLC Act' }
            ]
        },
        'ky': {
            type: 'Natural Zone', layers: [
                { domain: 'Corporate', source: 'ky', statute: 'Companies Act 2023' },
                { domain: 'Fund Formation', source: 'ky', statute: 'SIBL / MFL' },
                { domain: 'Tax', source: 'ky', statute: '0% Corporate Tax' }
            ]
        },
        'ae-abudhabi-adgm': {
            type: 'Natural Zone', layers: [
                { domain: 'Digital Assets', source: 'ae-adgm', statute: 'FSMR 2015' },
                { domain: 'Corporate', source: 'ae-adgm', statute: 'Companies Reg 2020' },
                { domain: 'AML/CFT', source: 'ae', statute: 'Decree-Law 20/2018' }
            ]
        },
        'pk-sifc': {
            type: 'Natural Zone', layers: [
                { domain: 'Corporate', source: 'pk-sifc', statute: 'SIFC Act 2023' },
                { domain: 'Tax', source: 'pk-sifc', statute: 'Special incentives' },
                { domain: 'Digital Assets', source: 'pk-sifc', statute: 'Pending framework' }
            ]
        },
        'hk': {
            type: 'Natural Zone', layers: [
                { domain: 'Arbitration', source: 'hk', statute: 'Cap 609' },
                { domain: 'Corporate', source: 'hk', statute: 'Companies Ordinance' },
                { domain: 'Digital Assets', source: 'hk', statute: 'VATP Regime 2023' }
            ]
        },
        'sg': {
            type: 'Natural Zone', layers: [
                { domain: 'Tax', source: 'sg', statute: 'ITA — 17% corporate' },
                { domain: 'Corporate', source: 'sg', statute: 'Companies Act 1967' },
                { domain: 'Digital Assets', source: 'sg', statute: 'PSA 2019' }
            ]
        },
        'kz-alatau': {
            type: 'Natural Zone', layers: [
                { domain: 'Financial', source: 'kz-alatau', statute: 'AFSA Regulations' },
                { domain: 'Corporate', source: 'kz-alatau', statute: 'English common law' },
                { domain: 'Digital Assets', source: 'kz-alatau', statute: 'AIFC Digital Asset Framework' }
            ]
        },
        'rw': {
            type: 'Natural Zone', layers: [
                { domain: 'Financial', source: 'rw', statute: 'BNR Regulation 12/2021' },
                { domain: 'Corporate', source: 'rw', statute: 'BNR + CMA framework' },
                { domain: 'Fintech', source: 'rw', statute: 'Kigali IFC' }
            ]
        },
        'gb-gi': {
            type: 'Natural Zone', layers: [
                { domain: 'DLT Provider', source: 'gb-gi', statute: 'DLT Regulations 2020' },
                { domain: 'Financial', source: 'gb-gi', statute: 'GFSC framework' },
                { domain: 'Corporate', source: 'gb-gi', statute: 'Companies Act' }
            ]
        },
        'za': {
            type: 'Natural Zone', layers: [
                { domain: 'Financial', source: 'za', statute: 'Financial Sector Regulation Act' },
                { domain: 'AML/CFT', source: 'za', statute: 'FICA 2001' },
                { domain: 'Corporate', source: 'za', statute: 'Companies Act 71/2008' }
            ]
        },
        'ng': {
            type: 'Natural Zone', layers: [
                { domain: 'Securities', source: 'ng', statute: 'ISA 2007 / SEC Rules' },
                { domain: 'Corporate', source: 'ng', statute: 'CAMA 2020' },
                { domain: 'Fintech', source: 'ng', statute: 'CBN Regulatory Sandbox' }
            ]
        },
        'ke': {
            type: 'Natural Zone', layers: [
                { domain: 'Financial', source: 'ke', statute: 'Capital Markets Act' },
                { domain: 'Payment Rails', source: 'ke', statute: 'NPS Act / M-Pesa' },
                { domain: 'Corporate', source: 'ke', statute: 'Companies Act 2015' }
            ]
        },
        'mu': {
            type: 'Natural Zone', layers: [
                { domain: 'Corporate', source: 'mu', statute: 'Companies Act 2001' },
                { domain: 'Financial', source: 'mu', statute: 'FSC Mauritius framework' },
                { domain: 'Tax', source: 'mu', statute: 'ITA — GBC regime' }
            ]
        },
        'sc': {
            type: 'Natural Zone', layers: [
                { domain: 'Corporate', source: 'sc', statute: 'IBC Act 2016 / Foundation Act 2021' },
                { domain: 'Financial', source: 'sc', statute: 'FSA Securities Dealer / Fund framework' },
                { domain: 'Tax', source: 'sc', statute: '0% IBC tax; DTAAs with China, UAE' }
            ]
        },
        'eg': {
            type: 'Natural Zone', layers: [
                { domain: 'Financial', source: 'eg', statute: 'CBE Law 194/2020' },
                { domain: 'Corporate', source: 'eg', statute: 'Investment Law 72/2017' },
                { domain: 'Digital Assets', source: 'eg', statute: 'FRA Fintech Sandbox' }
            ]
        },
        'gb': {
            type: 'Natural Zone', layers: [
                { domain: 'Financial', source: 'gb', statute: 'FSMA 2000 / FCA' },
                { domain: 'Corporate', source: 'gb', statute: 'Companies Act 2006' },
                { domain: 'Digital Assets', source: 'gb', statute: 'Property (Digital Assets) Bill' }
            ]
        },
        'vg': {
            type: 'Natural Zone', layers: [
                { domain: 'Corporate', source: 'vg', statute: 'BVI Business Companies Act' },
                { domain: 'Financial', source: 'vg', statute: 'FSC framework' },
                { domain: 'Tax', source: 'vg', statute: '0% Corporate Tax' }
            ]
        },
        'hn-prospera': {
            type: 'Natural Zone', layers: [
                { domain: 'Corporate', source: 'hn-prospera', statute: 'Próspera Civil Code' },
                { domain: 'Financial', source: 'hn-prospera', statute: 'eResident framework' },
                { domain: 'Digital Assets', source: 'hn-prospera', statute: 'Digital-asset regulations' }
            ]
        },
        'br-rio': {
            type: 'Natural Zone', layers: [
                { domain: 'Corporate', source: 'br', statute: 'Civil Code / Corp Law' },
                { domain: 'Financial', source: 'br', statute: 'BCB + CVM framework' },
                { domain: 'Digital Assets', source: 'br', statute: 'Marco Legal Cripto 2022' }
            ]
        },
        'au': {
            type: 'Natural Zone', layers: [
                { domain: 'Financial', source: 'au', statute: 'Corporations Act 2001' },
                { domain: 'Digital Assets', source: 'au', statute: 'ASIC licensing regime' },
                { domain: 'Corporate', source: 'au', statute: 'ASIC framework' }
            ]
        },
        'ae-dubai-fzc': {
            type: 'Natural Zone', layers: [
                { domain: 'Free Zones', source: 'ae-dubai', statute: 'Dubai FZ Council \u2014 28 free zones' },
                { domain: 'Corporate', source: 'ae-dubai', statute: 'FZ Company Regulations' },
                { domain: 'Digital Assets', source: 'ae', statute: 'SCA Virtual Assets Framework' }
            ]
        },
        'ae-dubai-difc': {
            type: 'Natural Zone', layers: [
                { domain: 'Financial Services', source: 'ae-difc', statute: 'DFSA Rulebook' },
                { domain: 'Corporate', source: 'ae-difc', statute: 'DIFC Companies Law' },
                { domain: 'Common Law', source: 'ae-difc', statute: 'English common law courts (DIFC Courts)' }
            ]
        },
        'ae-dubai-dmcc': {
            type: 'Natural Zone', layers: [
                { domain: 'Commodities', source: 'ae-dmcc', statute: 'DMCC Authority Law' },
                { domain: 'Corporate', source: 'ae-dmcc', statute: 'DMCC Company Regulations' },
                { domain: 'Digital Assets', source: 'ae-dmcc', statute: 'DMCC digital-asset framework' }
            ]
        },
        'ae-dubai-jafza': {
            type: 'Natural Zone', layers: [
                { domain: 'Trade & Logistics', source: 'ae-jafza', statute: 'JAFZA Authority Rules' },
                { domain: 'Corporate', source: 'ae-jafza', statute: 'FZ Company Regulations' },
                { domain: 'Customs', source: 'ae-jafza', statute: 'Dubai Customs integration' }
            ]
        },
        'ae-dubai-ifza': {
            type: 'Natural Zone', layers: [
                { domain: 'Digital Transform', source: 'ae-ifza', statute: 'Emirate-wide FZ Authority' },
                { domain: 'Corporate', source: 'ae-ifza', statute: 'IFZA Regulations' },
                { domain: 'Licensing', source: 'ae-ifza', statute: 'Digital licensing framework' }
            ]
        },
        'cn-hangzhou': {
            type: 'Natural Zone', layers: [
                { domain: 'Digital Economy', source: 'cn-hangzhou', statute: 'Digital Economy Zone' },
                { domain: 'Corporate', source: 'cn', statute: 'PRC Company Law' },
                { domain: 'Fintech', source: 'cn-hangzhou', statute: 'Sandbox framework' }
            ]
        },
        'pt': {
            type: 'Natural Zone', layers: [
                { domain: 'Corporate', source: 'pt', statute: 'C\u00f3digo das Sociedades' },
                { domain: 'Digital Assets', source: 'pt', statute: 'MiCA framework' },
                { domain: 'Tax', source: 'pt', statute: 'NHR / Startup Visa' }
            ]
        },
        'us-mt': {
            type: 'Natural Zone', layers: [
                { domain: 'Corporate', source: 'us-mt', statute: 'Montana Business Corporation Act' },
                { domain: 'Digital Assets', source: 'us-mt', statute: 'Digital-asset framework' },
                { domain: 'Tax', source: 'us-mt', statute: 'No state sales tax' }
            ]
        },
        'jp': {
            type: 'Natural Zone', layers: [
                { domain: 'Financial', source: 'jp', statute: 'FSA / FIEA' },
                { domain: 'Digital Assets', source: 'jp', statute: 'PSA — digital-asset regime' },
                { domain: 'Corporate', source: 'jp', statute: 'Companies Act' }
            ]
        },
        'kr': {
            type: 'Natural Zone', layers: [
                { domain: 'Financial', source: 'kr', statute: 'FSC / FSS framework' },
                { domain: 'Digital Assets', source: 'kr', statute: 'Virtual Asset User Protection Act' },
                { domain: 'Corporate', source: 'kr', statute: 'Commercial Act' }
            ]
        },
        'cn-hainan': {
            type: 'Natural Zone', layers: [
                { domain: 'Free Trade', source: 'cn-hainan', statute: 'Hainan FTP Master Plan' },
                { domain: 'Cross-Border', source: 'cn-hainan', statute: 'QFLP / QDLP Pilot' },
                { domain: 'Digital Assets', source: 'cn-hainan', statute: 'Digital Asset Pilot Zone' }
            ]
        },
        'qa-qfc': {
            type: 'Natural Zone', layers: [
                { domain: 'Financial', source: 'qa-qfc', statute: 'QFC Authority Regulations' },
                { domain: 'Corporate', source: 'qa-qfc', statute: 'QFC Companies Regulations' },
                { domain: 'Tax', source: 'qa-qfc', statute: '10% Corporate Tax' }
            ]
        },
        'id-bali': {
            type: 'Natural Zone', layers: [
                { domain: 'SEZ', source: 'id-bali', statute: 'PP 40/2021 SEZ Framework' },
                { domain: 'Tourism', source: 'id-bali', statute: 'Airport SEZ Designation' },
                { domain: 'Tax', source: 'id-bali', statute: 'SEZ Tax Incentives' }
            ]
        },
        'tz-zanzibar': {
            type: 'Natural Zone', layers: [
                { domain: 'Financial', source: 'tz-zanzibar', statute: 'ZIPA Investment Framework' },
                { domain: 'Corporate', source: 'tz-zanzibar', statute: 'Companies Act' },
                { domain: 'FTZ', source: 'tz-zanzibar', statute: 'Free Economic Zone Authority' }
            ]
        },
        'gm': {
            type: 'Natural Zone', layers: [
                { domain: 'Financial', source: 'gm', statute: 'CBG Regulatory Framework' },
                { domain: 'Corporate', source: 'gm', statute: 'Companies Act 2013' },
                { domain: 'SAR', source: 'gm', statute: 'Special Administrative Region' }
            ]
        },
        'br-floripa': {
            type: 'Natural Zone', layers: [
                { domain: 'Corporate', source: 'br', statute: 'Civil Code / Corp Law' },
                { domain: 'Financial', source: 'br', statute: 'BCB + CVM framework' },
                { domain: 'Digital Assets', source: 'br', statute: 'Marco Legal Cripto 2022' }
            ]
        }
    };

    /* ── Zone-specific economics ──
       Revenue: annual regulatory/authority revenue for each zone.
       KNOWN data sourced from published annual reports and filings.
       ESTIMATED data derived from entity count × published fee schedules.
       Corridor model: gravity-based — sqrt(zone_a_rev × zone_b_rev) × 0.8
       representing cross-border compliance, settlement, FX, and data activity.
       Calibrated against known bilateral financial flows:
         DIFC↔London ≈ $500M, Delaware↔Cayman ≈ $1.2B, Rwanda↔Kenya ≈ $28M.
       Coherent with thesis.html model ($36K/entity conservative baseline). */
    /* HomeOS factory economics — Broad Group JV modular construction.
       factory: { units: annual units, rev: annual revenue, desc: description }
       A single factory line produces ~800-1200 modular units/yr.
       Average unit value $200K-$500K depending on market.
       HomeOS license: $8K/unit/yr recurring (60% energy reduction, 80% lower maintenance). */

    var ZONE_ECONOMICS = {
        /* Gulf — KNOWN (annual reports, regulatory filings) */
        'ae-abudhabi-adgm':  { entities: 1800,   rev: 250000000,  basis: 'FSRA Annual Report; $1T+ administered' },
        'ae-dubai-fzc':      { entities: 45000,  rev: 2000000000, basis: '25 Dubai free zones (excl DIFC, DMCC, JAFZA)' },
        'ae-dubai-difc':     { entities: 6920,   rev: 500000000,  basis: 'DFSA Annual Report; $800B+ AUM; 6,920 entities' },
        'ae-dubai-dmcc':     { entities: 21000,  rev: 400000000,  basis: 'DMCC Annual Report; 21,000+ businesses' },
        'ae-dubai-jafza':    { entities: 8500,   rev: 500000000,  basis: 'DP World/JAFZA; 15M containers/yr', factory: { units: 1200, rev: 420000000, desc: 'Gulf assembly hub \u2014 modular export to GCC + Africa' } },
        'ae-dubai-ifza':  { entities: 5000,   rev: 200000000,  basis: 'Emirate-wide FZ authority' },
        'eg':                { entities: 500,    rev: 50000000,   basis: 'Est. Suez Canal Economic Zone pipeline', factory: { units: 800, rev: 180000000, desc: 'New Administrative Capital + Suez corridor' } },
        'qa-qfc':            { entities: 800,    rev: 120000000,  basis: 'QFC Authority regulatory fees' },
        /* South & Central Asia */
        'pk-sifc':           { entities: 500,    rev: 50000000,   basis: 'Est. SIFC Act 2023; early deployment', factory: { units: 900, rev: 160000000, desc: 'CPEC corridor \u2014 Belt & Road infrastructure' } },
        'kz-alatau':         { entities: 500,    rev: 40000000,   basis: 'Est. AIFC; English common law FZ', factory: { units: 600, rev: 120000000, desc: 'Alatau City construction \u2014 greenfield deployment' } },
        /* East & Southeast Asia — KNOWN */
        'hk':                { entities: 15000,  rev: 800000000,  basis: 'SFC + Companies Registry annual fees' },
        'sg':                { entities: 12000,  rev: 1000000000, basis: 'MAS regulatory framework' },
        'jp':                { entities: 5000,   rev: 600000000,  basis: 'FSA licensing; FIEA framework', factory: { units: 1100, rev: 380000000, desc: 'Broad Group home market \u2014 factory-built modular' } },
        'cn-hangzhou':       { entities: 3000,   rev: 80000000,   basis: 'Est. Digital Economy Zone' },
        'cn-hainan':         { entities: 2000,   rev: 100000000,  basis: 'Est. Free Trade Port; QFLP/QDLP pilot' },
        'kr':                { entities: 1000,   rev: 500000000,  basis: 'FSC/FSS regulatory fees' },
        'id-bali':           { entities: 100,    rev: 10000000,   basis: 'Est. Airport SEZ pipeline' },
        /* Africa */
        'rw':                { entities: 500,    rev: 15000000,   basis: 'Est. Kigali IFC; BNR framework' },
        'ng':                { entities: 2000,   rev: 150000000,  basis: 'SEC + CAMA regulatory; CBN sandbox', factory: { units: 1000, rev: 250000000, desc: '17M housing gap \u2014 largest African market' } },
        'ke':                { entities: 1000,   rev: 80000000,   basis: 'CMA + NPS Act; M-Pesa ecosystem' },
        'za':                { entities: 3000,   rev: 300000000,  basis: 'FSCA/FSRA regulatory fees', factory: { units: 800, rev: 200000000, desc: 'Sub-Saharan gateway \u2014 3.5M m\u00b2 delivered' } },
        'mu':                { entities: 5000,   rev: 200000000,  basis: 'FSC Mauritius; GBC regime' },
        'sc':                { entities: 8000,   rev: 150000000,  basis: 'FSA Seychelles; IBC Act 2016; Chinese diaspora hub' },
        'tz-zanzibar':       { entities: 200,    rev: 15000000,   basis: 'Est. ZIPA framework' },
        'gm':                { entities: 100,    rev: 8000000,    basis: 'Est. SAR pipeline' },
        /* Europe — KNOWN */
        'gb':                { entities: 20000,  rev: 1000000000, basis: 'FCA annual levy ~\u00a3800M' },
        'gb-gi':             { entities: 3000,   rev: 80000000,   basis: 'GFSC regulatory; DLT Regulations 2020' },
        'pt':                { entities: 2000,   rev: 100000000,  basis: 'Est. MiCA + NHR/Startup framework' },
        /* Americas — US — KNOWN */
        'us-de':             { entities: 350000, rev: 1900000000, basis: 'Div. of Corporations FY2023; franchise tax' },
        'us-ny':             { entities: 8000,   rev: 500000000,  basis: 'DFS regulatory revenue' },
        'us-ca':             { entities: 10000,  rev: 200000000,  basis: 'DFPI regulatory fees' },
        'us-nv':             { entities: 5000,   rev: 100000000,  basis: 'SOS fees; 0% state corp tax' },
        'us-wy':             { entities: 8000,   rev: 60000000,   basis: 'SOS + DAO LLC Act + SPDI' },
        'us-mt':             { entities: 3000,   rev: 40000000,   basis: 'SOS corporate filing fees' },
        /* Americas — Caribbean & Latin America */
        'ky':                { entities: 25000,  rev: 800000000,  basis: 'CIMA fund registration + entity fees' },
        'vg':                { entities: 30000,  rev: 400000000,  basis: 'FSC; ~50% of govt revenue' },
        'hn-prospera':       { entities: 500,    rev: 20000000,   basis: 'Est. eResident framework' },
        'br-rio':            { entities: 1000,   rev: 80000000,   basis: 'Est. BCB + CVM framework', factory: { units: 900, rev: 200000000, desc: 'LatAm assembly hub \u2014 Olympic/infrastructure legacy' } },
        'br-floripa':        { entities: 500,    rev: 30000000,   basis: 'Est. startup/tech ecosystem' },
        /* Oceania — KNOWN */
        'au':                { entities: 8000,   rev: 1000000000, basis: 'ASIC levies + regulatory fees' }
    };

    /* Corridor revenue: gravity model.
       corridor_flow = sqrt(zone_a_rev × zone_b_rev) × CORRIDOR_GRAVITY
       This produces: DIFC↔London ≈ $566M, Delaware↔Cayman ≈ $1.23B,
       Rwanda↔Kenya ≈ $28M — calibrated against published bilateral flows. */
    var CORRIDOR_GRAVITY = 0.8;

    /* ── SVG helper ── */
    function el(tag, attrs) {
        var e = document.createElementNS(NS, tag);
        if (attrs) {
            for (var k in attrs) {
                if (attrs.hasOwnProperty(k)) e.setAttribute(k, attrs[k]);
            }
        }
        return e;
    }

    /* ── Build the mesh ── */
    function init(containerId, opts) {
        var container = document.getElementById(containerId);
        if (!container) return;

        opts = opts || {};
        var isMobile = window.innerWidth < 768;

        /* Mesh is hidden on mobile via CSS — skip all SVG work */
        if (isMobile) return;

        /* Map is 1920×1080 — use same viewBox for perfect alignment */
        var VW = 1920;
        var VH = 1080;

        /* Let CSS control the hero height; container fills its parent */
        container.style.height = '100%';

        var heroAspect = container.clientWidth / Math.max(container.clientHeight || 1, 1);
        var mapAspect = VW / VH;
        var useSlice = isMobile || heroAspect > mapAspect * 1.35;

        /* Use 'slice' on mobile and ultra-wide desktop viewports. Otherwise
           the 16:9 map is letterboxed horizontally and the network drifts
           into the right half of the hero on very wide displays. */
        var svg = el('svg', {
            viewBox: '0 0 ' + VW + ' ' + VH,
            width: '100%',
            height: '100%',
            preserveAspectRatio: useSlice ? 'xMidYMid slice' : 'xMidYMid meet',
            'aria-label': 'Jurisdictional corridor network visualization'
        });
        svg.setAttributeNS('http://www.w3.org/2000/xmlns/', 'xmlns:xlink', 'http://www.w3.org/1999/xlink');
        svg.style.display = 'block';

        /* ── Defs ── */
        var defs = el('defs');

        /* Fade edges to paper color — subtle vignette, not aggressive masking */
        var fadeL = el('linearGradient', { id: 'meshFadeL', x1: '0', y1: '0', x2: '0.03', y2: '0' });
        fadeL.appendChild(el('stop', { offset: '0', 'stop-color': '#fefdfb', 'stop-opacity': '0.6' }));
        fadeL.appendChild(el('stop', { offset: '1', 'stop-color': '#fefdfb', 'stop-opacity': '0' }));
        defs.appendChild(fadeL);

        var fadeR = el('linearGradient', { id: 'meshFadeR', x1: '0.97', y1: '0', x2: '1', y2: '0' });
        fadeR.appendChild(el('stop', { offset: '0', 'stop-color': '#fefdfb', 'stop-opacity': '0' }));
        fadeR.appendChild(el('stop', { offset: '1', 'stop-color': '#fefdfb', 'stop-opacity': '0.6' }));
        defs.appendChild(fadeR);

        var fadeT = el('linearGradient', { id: 'meshFadeT', x1: '0', y1: '0', x2: '0', y2: '0.03' });
        fadeT.appendChild(el('stop', { offset: '0', 'stop-color': '#fefdfb', 'stop-opacity': '0.4' }));
        fadeT.appendChild(el('stop', { offset: '1', 'stop-color': '#fefdfb', 'stop-opacity': '0' }));
        defs.appendChild(fadeT);

        var fadeB = el('linearGradient', { id: 'meshFadeB', x1: '0', y1: '0.95', x2: '0', y2: '1' });
        fadeB.appendChild(el('stop', { offset: '0', 'stop-color': '#fefdfb', 'stop-opacity': '0' }));
        fadeB.appendChild(el('stop', { offset: '1', 'stop-color': '#fefdfb', 'stop-opacity': '0.4' }));
        defs.appendChild(fadeB);

        /* Label readability — strong halo effect for contrast against map */
        var labelFilter = el('filter', { id: 'labelHalo', x: '-0.25', y: '-0.3', width: '1.5', height: '1.6' });
        var flood = el('feFlood', { 'flood-color': '#fefdfb', 'flood-opacity': '0.95', result: 'bg' });
        labelFilter.appendChild(flood);
        var composite1 = el('feComposite', { 'in': 'bg', in2: 'SourceGraphic', operator: 'in', result: 'bgtext' });
        labelFilter.appendChild(composite1);
        var morpho = el('feMorphology', { 'in': 'bgtext', operator: 'dilate', radius: '5', result: 'dilated' });
        labelFilter.appendChild(morpho);
        /* Soften the halo edges with a slight blur */
        var blur = el('feGaussianBlur', { 'in': 'dilated', stdDeviation: '1.5', result: 'blurred' });
        labelFilter.appendChild(blur);
        var merge = el('feMerge');
        merge.appendChild(el('feMergeNode', { 'in': 'blurred' }));
        merge.appendChild(el('feMergeNode', { 'in': 'SourceGraphic' }));
        labelFilter.appendChild(merge);
        defs.appendChild(labelFilter);

        svg.appendChild(defs);

        /* ── World map background ── */
        var mapImg = el('image', {
            x: '0',
            y: '0',
            width: VW,
            height: VH,
            preserveAspectRatio: 'xMidYMid meet'
        });
        /* Set both href and xlink:href for cross-browser SVG image support */
        mapImg.setAttribute('href', '/world-map.svg');
        mapImg.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', '/world-map.svg');
        svg.appendChild(mapImg);

        /* ── Build zone lookup ── */
        var zoneMap = {};
        ZONES.forEach(function (z) { zoneMap[z.id] = z; });

        /* Pre-compute corridor counts per zone */
        var zoneCorridorCounts = {};
        CORRIDORS.forEach(function (c) {
            zoneCorridorCounts[c.from] = (zoneCorridorCounts[c.from] || 0) + 1;
            zoneCorridorCounts[c.to] = (zoneCorridorCounts[c.to] || 0) + 1;
        });

        /* ── Draw corridors ── */
        var edgeGroup = el('g');
        var edgeElements = [];
        var edgeTypeMap = {};
        var visibleCorridors = isMobile
            ? CORRIDORS.slice(0, 15)
            : CORRIDORS;

        visibleCorridors.forEach(function (c) {
            var a = zoneMap[c.from];
            var b = zoneMap[c.to];
            if (!a || !b) return;

            var mx = (a.x + b.x) / 2;
            var my = (a.y + b.y) / 2;
            var dx = b.x - a.x;
            var dy = b.y - a.y;
            var len = Math.sqrt(dx * dx + dy * dy);
            if (len === 0) return;
            var offset = Math.min(len * 0.1, 40);
            var cx = mx - (dy / len) * offset;
            var cy = my + (dx / len) * offset;

            var d = 'M' + a.x + ',' + a.y +
                    'Q' + Math.round(cx) + ',' + Math.round(cy) +
                    ',' + b.x + ',' + b.y;

            var pathAttrs = {
                d: d,
                'class': 'mesh-edge',
                stroke: CORRIDOR_COLORS[c.type] || CORRIDOR_COLORS['cross'],
                'data-from': c.from,
                'data-to': c.to
            };
            /* Differentiate corridor types visually */
            if (c.type === 'cross' || c.type === 'federal') {
                pathAttrs['stroke-opacity'] = '0.85';
                pathAttrs['stroke-width'] = '1.2';
            }
            if (c.type === 'fz-fz') {
                pathAttrs['stroke-dasharray'] = '8,4';
            } else if (c.type === 'fz-host') {
                pathAttrs['stroke-dasharray'] = '12,3';
            }
            var path = el('path', pathAttrs);
            edgeGroup.appendChild(path);
            edgeTypeMap[c.from + ':' + c.to] = c.type;
            edgeElements.push({ path: path, d: d, from: c.from, to: c.to, type: c.type });
        });
        svg.appendChild(edgeGroup);

        /* ── Corridor type inference for dynamically-drawn pairs ── */
        function getCorridorType(idA, idB) {
            var key1 = idA + ':' + idB, key2 = idB + ':' + idA;
            if (edgeTypeMap[key1]) return edgeTypeMap[key1];
            if (edgeTypeMap[key2]) return edgeTypeMap[key2];
            /* Infer from zone ID prefixes */
            var prefA = idA.split('-')[0], prefB = idB.split('-')[0];
            if (prefA === prefB) {
                /* Same country. Check for same city (e.g. ae-dubai-*) */
                var cityA = idA.split('-').slice(0, 2).join('-');
                var cityB = idB.split('-').slice(0, 2).join('-');
                return (cityA === cityB && idA.split('-').length > 2 && idB.split('-').length > 2) ? 'fz-fz' : 'federal';
            }
            return 'cross';
        }

        /* ── Selection corridor layer (drawn between edges and nodes) ── */
        var selectionEdgeGroup = el('g', { 'pointer-events': 'none' });
        svg.appendChild(selectionEdgeGroup);

        /* ── Draw nodes ── */
        var nodeGroup = el('g');
        var visibleZones = ZONES;

        /* Hub zones always show labels on mobile */
        var HUB_ZONES = ['us-de', 'ae-abudhabi-adgm', 'ae-dubai-fzc', 'sg', 'gb', 'hk', 'hn-prospera', 'pk-sifc'];

        visibleZones.forEach(function (z) {
            var nodeOpacity = z.status === 'live' ? '1' : z.status === 'testnet' ? '0.72' : '0.3';
            var g = el('g', { 'class': 'mesh-node', 'data-zone': z.id, opacity: nodeOpacity });
            g.setAttribute('transform', 'translate(' + z.x + ',' + z.y + ')');
            g.setAttribute('tabindex', '0');
            g.setAttribute('role', 'button');
            g.setAttribute('aria-label', z.name + ' — ' + (z.type === 'natural' ? 'Natural Zone' : 'Synthetic Zone') + ' (' + (z.status || 'live') + ')');

            /* Invisible hit target — ensures even faint pipeline nodes are clickable */
            var hit = el('circle', {
                r: '18',
                fill: 'rgba(0,0,0,0.001)',
                'class': 'mesh-node-hit'
            });
            hit.style.pointerEvents = 'all';
            g.appendChild(hit);

            /* Hover glow */
            var glow = el('circle', {
                r: '24',
                fill: z.type === 'natural' ? 'rgba(139,76,58,0.08)' : 'rgba(90,86,82,0.06)',
                'class': 'mesh-node-glow'
            });
            g.appendChild(glow);

            var mobileScale = isMobile ? 1.27 : 1; /* 5.5→7 on mobile */
            if (z.type === 'natural') {
                /* Outer ring for depth */
                g.appendChild(el('circle', {
                    r: String(8 * mobileScale),
                    fill: 'none',
                    stroke: '#1a1917',
                    'stroke-width': '1.2',
                    opacity: '0.2'
                }));
                g.appendChild(el('circle', {
                    r: String(5.5 * mobileScale),
                    fill: '#1a1917',
                    opacity: '0.85',
                    'class': 'mesh-node-circle'
                }));
                g.appendChild(el('circle', {
                    r: String(2 * mobileScale),
                    fill: '#fefdfb',
                    opacity: '0.95'
                }));
            } else {
                var ds = isMobile ? 1.27 : 1; /* scale diamonds on mobile too */
                var d1 = Math.round(9 * ds), d2 = Math.round(6 * ds);
                g.appendChild(el('polygon', {
                    points: '0,-' + d1 + ' ' + d1 + ',0 0,' + d1 + ' -' + d1 + ',0',
                    fill: 'none',
                    stroke: '#5a5652',
                    'stroke-width': '1.5',
                    opacity: '0.3'
                }));
                g.appendChild(el('polygon', {
                    points: '0,-' + d2 + ' ' + d2 + ',0 0,' + d2 + ' -' + d2 + ',0',
                    fill: '#5a5652',
                    opacity: '0.7',
                    'class': 'mesh-node-diamond'
                }));
            }

            /* Persistent breathing ring for testnet nodes */
            if (z.status === 'testnet' && !reducedMotion && !isMobile) {
                var breatheRing = el('circle', {
                    r: '8',
                    fill: 'none',
                    stroke: '#5B8A72',
                    'stroke-width': '1',
                    opacity: '0'
                });
                breatheRing.style.transformBox = 'fill-box';
                breatheRing.style.transformOrigin = 'center';
                breatheRing.style.animation = 'zone-pulse-ring 3s ease-in-out infinite';
                g.appendChild(breatheRing);
            }

            nodeGroup.appendChild(g);

            /* Label — with halo filter for readability */
            var label = el('text', {
                x: z.x,
                y: z.y - 18,
                'class': 'mesh-label',
                'data-zone': z.id,
                'filter': 'url(#labelHalo)'
            });
            label.textContent = z.name;
            if (isMobile && HUB_ZONES.indexOf(z.id) !== -1) {
                label.classList.add('visible');
            }
            nodeGroup.appendChild(label);
        });
        svg.appendChild(nodeGroup);

        /* ── Edge fade overlays (left/right only — bottom handled by CSS .mesh-overlay) ── */
        var fadeGroup = el('g', { 'pointer-events': 'none' });
        fadeGroup.appendChild(el('rect', { x: 0, y: 0, width: VW, height: VH, fill: 'url(#meshFadeL)' }));
        fadeGroup.appendChild(el('rect', { x: 0, y: 0, width: VW, height: VH, fill: 'url(#meshFadeR)' }));
        svg.appendChild(fadeGroup);

        container.appendChild(svg);

        /* ── Economics overlay ── */
        function fmtCurrency(n) {
            if (n >= 1e12) return '$' + (n / 1e12).toFixed(1) + 'T';
            if (n >= 1e9) return '$' + (n / 1e9).toFixed(1) + 'B';
            if (n >= 1e6) return '$' + (n / 1e6).toFixed(1) + 'M';
            if (n >= 1e3) return '$' + (n / 1e3).toFixed(0) + 'K';
            return '$' + n.toFixed(0);
        }

        var compact = !!(opts && opts.compact);

        var economicsPanel = document.createElement('div');
        var breakdownPanel = document.createElement('div');
        if (!compact) {
            economicsPanel.className = 'mesh-economics';
            economicsPanel.innerHTML = '<button class="mesh-economics-genesis" aria-label="Watch network genesis animation">Watch Genesis</button><button class="mesh-economics-growth" aria-label="Simulate network growth">Simulate Growth</button><button class="mesh-economics-explore" aria-label="Explore network economics">Explore Economics</button><button class="mesh-economics-activate" aria-label="Activate all zones"></button>';
            container.parentNode.appendChild(economicsPanel);
            breakdownPanel.className = 'mesh-economics-breakdown';
            container.parentNode.appendChild(breakdownPanel);
        }

        var hoverCard = document.createElement('div');
        hoverCard.className = 'mesh-hover-card';
        container.parentNode.appendChild(hoverCard);

        /* ── Interactions ── */
        var allNodes = svg.querySelectorAll('.mesh-node');
        var allLabels = svg.querySelectorAll('.mesh-label');
        var allEdges = svg.querySelectorAll('.mesh-edge');

        var HIGHLIGHT_COLORS = {
            'cross':   '#a0877a',
            'federal': '#3a5f7a',
            'fz-host': '#4a6b4a',
            'fz-fz':   '#7a6b4a'
        };

        function highlightZone(zoneId) {
            allLabels.forEach(function (l) {
                if (l.getAttribute('data-zone') === zoneId) l.classList.add('visible');
            });
            allEdges.forEach(function (e) {
                if (e.getAttribute('data-from') === zoneId || e.getAttribute('data-to') === zoneId) {
                    e.classList.add('highlight');
                    e._prevStroke = e.getAttribute('stroke');
                    e._prevStrokeOpacity = e.getAttribute('stroke-opacity');
                    e._prevStrokeWidth = e.getAttribute('stroke-width');
                    var type = edgeTypeMap[e.getAttribute('data-from') + ':' + e.getAttribute('data-to')];
                    e.setAttribute('stroke', HIGHLIGHT_COLORS[type] || '#a0877a');
                    e.removeAttribute('stroke-opacity');
                    e.removeAttribute('stroke-width');
                }
            });
        }

        function clearHighlight() {
            allLabels.forEach(function (l) {
                var zId = l.getAttribute('data-zone');
                var isHub = isMobile && HUB_ZONES.indexOf(zId) !== -1;
                if (!isHub && !selectedZones[zId]) l.classList.remove('visible');
            });
            allEdges.forEach(function (e) {
                e.classList.remove('highlight');
                if (e._prevStroke) {
                    e.setAttribute('stroke', e._prevStroke);
                    e._prevStroke = null;
                }
                if (e._prevStrokeOpacity) {
                    e.setAttribute('stroke-opacity', e._prevStrokeOpacity);
                    e._prevStrokeOpacity = null;
                }
                if (e._prevStrokeWidth) {
                    e.setAttribute('stroke-width', e._prevStrokeWidth);
                    e._prevStrokeWidth = null;
                }
            });
        }

        allNodes.forEach(function (node) {
            node.addEventListener('mouseenter', function () {
                var zoneId = node.getAttribute('data-zone');
                highlightZone(zoneId);
                showHoverCard(zoneId);
            });
            node.addEventListener('mouseleave', function () {
                clearHighlight();
                hideHoverCard();
            });

            /* Touch interaction for mobile */
            node.addEventListener('touchstart', function (e) {
                var touch = e.changedTouches[0];
                node._touchStartY = touch.pageY;
            }, { passive: true });

            node.addEventListener('touchend', function (e) {
                var touch = e.changedTouches[0];
                if (Math.abs(touch.pageY - (node._touchStartY || 0)) < 10) {
                    /* Tap, not scroll */
                    var zoneId = node.getAttribute('data-zone');
                    removeCard();
                    toggleSelection(zoneId, node);
                }
            });
        });

        /* ── Zone card popup on click ── */
        var activeCard = null;
        var selectedZones = {};
        var selectedCount = 0;

        function removeCard() {
            if (activeCard && activeCard.parentNode) {
                activeCard.parentNode.removeChild(activeCard);
            }
            activeCard = null;
        }

        function showHoverCard(zoneId) {
            if (isMobile || compact) return;
            var zone = zoneMap[zoneId];
            if (!zone) return;
            var data = ZONE_DATA[zoneId];
            var econ = ZONE_ECONOMICS[zoneId];
            var corridors = zoneCorridorCounts[zoneId] || 0;
            var zoneRev = econ ? econ.rev : 0;
            var entities = econ ? econ.entities : 0;
            var basis = econ ? econ.basis : '';
            var statusDot = zone.status === 'live' ? '#2d7d46' :
                            zone.status === 'testnet' ? '#5B8A72' : '#7a7672';
            var statusLabel = zone.status === 'live' ? 'Live' :
                              zone.status === 'testnet' ? 'Testnet' : 'Pipeline';

            var html = '<div class="mesh-hover-name">' + zone.name + '</div>';
            html += '<div class="mesh-hover-status"><span class="mesh-hover-dot" style="background:' + statusDot + '"></span>' + statusLabel;
            if (entities > 0) {
                html += ' \u00b7 ' + entities.toLocaleString('en-US') + ' entities';
            }
            html += '</div>';
            html += '<div class="mesh-hover-stats">';
            html += '<span class="mesh-hover-rev">' + fmtCurrency(zoneRev) + '/yr</span>';
            html += '<span class="mesh-hover-corridors">' + corridors + ' corridor' + (corridors !== 1 ? 's' : '') + '</span>';
            html += '</div>';

            if (basis) {
                html += '<div class="mesh-hover-source">' + basis + '</div>';
            }

            if (data && data.layers) {
                html += '<div class="mesh-hover-domains">';
                data.layers.forEach(function (l) {
                    html += '<span>' + l.domain + '</span>';
                });
                html += '</div>';
            }

            hoverCard.innerHTML = html;

            var cardX = (zone.x / VW) * 100;
            var cardY = (zone.y / VH) * 100;
            hoverCard.style.left = cardX + '%';
            hoverCard.style.top = cardY + '%';

            var tx = cardX > 75 ? 'calc(-100% - 12px)' : '12px';
            var ty = cardY < 15 ? '4px' : 'calc(-100% - 4px)';
            hoverCard.style.transform = 'translate(' + tx + ', ' + ty + ')';

            hoverCard.classList.add('visible');
        }

        function hideHoverCard() {
            hoverCard.classList.remove('visible');
        }

        function showZoneCard(zoneId) {
            removeCard();
            var zone = zoneMap[zoneId];
            var data = ZONE_DATA[zoneId];
            if (!zone || !data) return;

            var card = document.createElement('div');
            card.className = 'zone-card';
            card.setAttribute('role', 'dialog');
            card.setAttribute('aria-label', zone.name + ' zone composition');
            card.setAttribute('tabindex', '-1');

            var html = '<p class="zone-card-type">' + data.type + '</p>';
            html += '<p class="zone-card-name">' + zone.name + '</p>';
            html += '<div class="zone-card-layers">';
            data.layers.forEach(function (layer) {
                html += '<div class="zone-card-layer">';
                html += '<span class="zone-card-domain">' + layer.domain + '</span>';
                html += '<span class="zone-card-statute">' + layer.statute + '</span>';
                html += '<span class="zone-card-source">' + layer.source + '</span>';
                html += '</div>';
            });
            html += '</div>';

            card.innerHTML = html;

            /* Position using percentage-based coordinates relative to viewBox */
            var cardX = (zone.x / VW) * 100;
            var cardY = (zone.y / VH) * 100;

            card.style.position = 'absolute';
            card.style.left = Math.min(cardX, 80) + '%';
            card.style.top = Math.max(cardY, 2) + '%';
            card.style.transform = 'translate(10px, -50%)';
            card.style.zIndex = '10';

            container.style.position = 'relative';
            container.appendChild(card);
            activeCard = card;

            /* Animate in and move focus for screen readers */
            requestAnimationFrame(function () {
                card.classList.add('visible');
                card.focus();
            });
        }

        allNodes.forEach(function (node) {
            node.addEventListener('click', function (e) {
                e.stopPropagation();
                var zoneId = node.getAttribute('data-zone');
                removeCard();
                toggleSelection(zoneId, node);
            });

            node.addEventListener('keydown', function (e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    var zoneId = node.getAttribute('data-zone');
                    removeCard();
                    toggleSelection(zoneId, node);
                }
            });
        });

        if (_removeCardHandler) document.removeEventListener('click', _removeCardHandler);
        _removeCardHandler = removeCard;
        document.addEventListener('click', _removeCardHandler);

        /* ── Multi-select: toggle zone selection ── */
        function toggleSelection(zoneId, node) {
            if (genesis.running || growth.running) return;
            hideHoverCard();
            if (selectedZones[zoneId]) {
                delete selectedZones[zoneId];
                selectedCount--;
                node.classList.remove('selected');
            } else {
                selectedZones[zoneId] = true;
                selectedCount++;
                node.classList.add('selected');
                /* Notify explore.js (or any listener) of zone click */
                window.dispatchEvent(new CustomEvent('mesh:zone-click', { detail: { zone: zoneId } }));
            }

            allLabels.forEach(function (l) {
                var lzid = l.getAttribute('data-zone');
                if (selectedZones[lzid]) {
                    l.classList.add('visible');
                } else if (!isMobile) {
                    l.classList.remove('visible');
                }
            });

            edgeGroup.style.opacity = selectedCount > 0 ? '0.12' : '';
            drawSelectionCorridors();
            updateEconomics();
        }

        function drawSelectionCorridors() {
            while (selectionEdgeGroup.firstChild) {
                selectionEdgeGroup.removeChild(selectionEdgeGroup.firstChild);
            }

            var selected = [];
            for (var id in selectedZones) {
                if (selectedZones[id] && zoneMap[id]) selected.push(zoneMap[id]);
            }
            if (selected.length < 2) return;

            var corridorCount = selected.length * (selected.length - 1) / 2;
            var opacity = corridorCount > 100 ? '0.35' : corridorCount > 30 ? '0.55' : '0.75';

            var labelPairs = [];
            for (var i = 0; i < selected.length; i++) {
                for (var j = i + 1; j < selected.length; j++) {
                    var a = selected[i], b = selected[j];
                    var mx = (a.x + b.x) / 2;
                    var my = (a.y + b.y) / 2;
                    var dx = b.x - a.x;
                    var dy = b.y - a.y;
                    var len = Math.sqrt(dx * dx + dy * dy);
                    if (len === 0) continue;
                    var offset = Math.min(len * 0.08, 30);
                    var cx = mx - (dy / len) * offset;
                    var cy = my + (dx / len) * offset;
                    var d = 'M' + a.x + ',' + a.y + 'Q' + Math.round(cx) + ',' + Math.round(cy) + ',' + b.x + ',' + b.y;

                    var cType = getCorridorType(a.id, b.id);
                    var cColor = cType === 'cross' ? '#C5A572' : cType === 'federal' ? '#8ab0c8' : cType === 'fz-fz' ? '#a8c0a8' : '#C5A572';
                    var pathEl = el('path', {
                        d: d,
                        fill: 'none',
                        stroke: cColor,
                        'stroke-width': '2',
                        'stroke-opacity': opacity,
                        'stroke-linecap': 'round',
                        'class': 'mesh-selection-edge'
                    });
                    selectionEdgeGroup.appendChild(pathEl);

                    labelPairs.push({
                        tx: 0.25 * a.x + 0.5 * cx + 0.25 * b.x,
                        ty: 0.25 * a.y + 0.5 * cy + 0.25 * b.y,
                        rev: corridorRevPair(a.id, b.id)
                    });
                }
            }

            /* Revenue labels on selected corridors */
            labelPairs.sort(function(pa, pb) { return pb.rev - pa.rev; });
            var maxLabels = corridorCount <= 15 ? corridorCount : corridorCount <= 45 ? 8 : 5;
            for (var li = 0; li < Math.min(maxLabels, labelPairs.length); li++) {
                var lp = labelPairs[li];
                var labelText = fmtCurrency(lp.rev);
                var rectW = labelText.length * 6.5 + 8;
                var rectH = 14;
                var bgRect = el('rect', {
                    x: lp.tx - rectW / 2,
                    y: lp.ty - rectH / 2,
                    width: rectW,
                    height: rectH,
                    rx: '2',
                    'class': 'mesh-corridor-label-bg'
                });
                var textEl = el('text', {
                    x: lp.tx,
                    y: lp.ty,
                    'text-anchor': 'middle',
                    'dominant-baseline': 'central',
                    'class': 'mesh-corridor-label'
                });
                textEl.textContent = labelText;
                selectionEdgeGroup.appendChild(bgRect);
                selectionEdgeGroup.appendChild(textEl);
            }

            /* Corridor draw-in animation via stroke-dashoffset */
            if (!reducedMotion) {
                var edges = selectionEdgeGroup.querySelectorAll('.mesh-selection-edge');
                for (var k = 0; k < edges.length; k++) {
                    var pathLen = edges[k].getTotalLength ? edges[k].getTotalLength() : 1000;
                    edges[k].setAttribute('stroke-dasharray', pathLen);
                    edges[k].setAttribute('stroke-dashoffset', pathLen);
                }
                requestAnimationFrame(function () {
                    var drawn = selectionEdgeGroup.querySelectorAll('.mesh-selection-edge');
                    for (var m = 0; m < drawn.length; m++) {
                        drawn[m].setAttribute('stroke-dashoffset', '0');
                    }
                    var labels = selectionEdgeGroup.querySelectorAll('.mesh-corridor-label, .mesh-corridor-label-bg');
                    for (var n = 0; n < labels.length; n++) {
                        labels[n].classList.add('visible');
                    }
                });
            } else {
                var labels = selectionEdgeGroup.querySelectorAll('.mesh-corridor-label, .mesh-corridor-label-bg');
                for (var n = 0; n < labels.length; n++) {
                    labels[n].style.opacity = '1';
                }
            }
        }

        /* ── Gravity-model corridor revenue ── */
        function corridorRevPair(idA, idB) {
            var revA = (ZONE_ECONOMICS[idA] || {}).rev || 0;
            var revB = (ZONE_ECONOMICS[idB] || {}).rev || 0;
            return Math.sqrt(revA * revB) * CORRIDOR_GRAVITY;
        }

        function updateEconomics() {
            if (selectedCount === 0) {
                economicsPanel.className = 'mesh-economics';
                economicsPanel.innerHTML = '<button class="mesh-economics-genesis" aria-label="Watch network genesis animation">Watch Genesis</button><button class="mesh-economics-growth" aria-label="Simulate network growth">Simulate Growth</button><button class="mesh-economics-explore" aria-label="Explore network economics">Explore Economics</button><button class="mesh-economics-activate" aria-label="Activate all zones"></button>';
                breakdownPanel.className = 'mesh-economics-breakdown';
                breakdownPanel.innerHTML = '';
                return;
            }

            economicsPanel.className = 'mesh-economics active';

            /* Compute zone-specific revenue */
            var ids = [];
            var zoneRev = 0;
            var factoryCount = 0;
            for (var id in selectedZones) {
                if (selectedZones[id]) {
                    ids.push(id);
                    var econ = ZONE_ECONOMICS[id];
                    if (econ) {
                        zoneRev += econ.rev;
                        if (econ.factory) factoryCount++;
                    }
                }
            }

            /* Compute gravity-model corridor revenue */
            var corridorCount = ids.length * (ids.length - 1) / 2;
            var corridorRev = 0;
            for (var i = 0; i < ids.length; i++) {
                for (var j = i + 1; j < ids.length; j++) {
                    corridorRev += corridorRevPair(ids[i], ids[j]);
                }
            }
            var totalRev = zoneRev + corridorRev;

            if (selectedCount === 1) {
                var zone = zoneMap[ids[0]];
                var econ1 = ZONE_ECONOMICS[ids[0]];
                var name = zone ? zone.name : '';
                var rev1 = econ1 ? econ1.rev : 0;
                var factoryHint = (econ1 && econ1.factory) ? ' \u00b7 HomeOS factory' : '';
                economicsPanel.innerHTML =
                    '<span class="mesh-economics-zone">' + name + '</span>' +
                    '<span class="mesh-economics-sep">\u00b7</span>' +
                    '<span class="mesh-economics-stat mesh-economics-revenue">' + fmtCurrency(rev1) + '/yr</span>' +
                    (factoryHint ? '<span class="mesh-economics-sep">\u00b7</span><span class="mesh-economics-factory-hint">HomeOS factory</span>' : '') +
                    '<span class="mesh-economics-sep">\u00b7</span>' +
                    '<span class="mesh-economics-hint">Select more zones to see corridors form</span>';
                breakdownPanel.className = 'mesh-economics-breakdown';
                breakdownPanel.innerHTML = '';
                return;
            }

            var hub = Math.round(corridorCount / (selectedCount - 1));
            var factoryLabel = factoryCount > 0 ? '<span class="mesh-economics-sep">\u00b7</span><span class="mesh-economics-stat">' + factoryCount + ' factor' + (factoryCount === 1 ? 'y' : 'ies') + '</span>' : '';
            var html =
                '<span class="mesh-economics-stat">' + selectedCount + ' zones</span>' +
                '<span class="mesh-economics-sep">\u00b7</span>' +
                '<span class="mesh-economics-stat">' + corridorCount.toLocaleString('en-US') + ' corridors</span>' +
                factoryLabel +
                '<span class="mesh-economics-sep">\u00b7</span>' +
                '<span class="mesh-economics-stat mesh-economics-revenue">' + fmtCurrency(totalRev) + '/yr</span>';

            if (selectedCount >= 3) {
                html +=
                    '<span class="mesh-economics-sep">\u00b7</span>' +
                    '<span class="mesh-economics-hub">' + hub + '\u00d7 hub advantage</span>';
            }

            html += '<button class="mesh-economics-clear" aria-label="Clear selection">\u00d7</button>';
            economicsPanel.innerHTML = html;

            buildBreakdown(ids, corridorCount, zoneRev, corridorRev, totalRev);
        }

        function getNetworkInsight(ids, corridorCount, totalRev) {
            var count = ids.length;

            var gulfZones = ids.filter(function (id) { return id.indexOf('ae-') === 0 || id === 'qa-qfc'; });
            var usZones = ids.filter(function (id) { return id.indexOf('us-') === 0; });
            var asiaZones = ids.filter(function (id) { return ['hk','sg','jp','cn-hangzhou','cn-hainan','kr'].indexOf(id) >= 0; });
            var africaZones = ids.filter(function (id) { return ['rw','ng','ke','za','mu','sc','tz-zanzibar','gm'].indexOf(id) >= 0; });

            /* Specific pairings */
            if (count === 2) {
                if (ids.indexOf('ae-dubai-difc') >= 0 && ids.indexOf('ae-abudhabi-adgm') >= 0) {
                    return 'DIFC\u2013ADGM: $800B in DIFC-administered assets bridged to ADGM\u2019s $1T+ sovereign capital hub. The UAE\u2019s most valuable internal financial corridor.';
                }
                if (ids.indexOf('ae-dubai-difc') >= 0 && ids.indexOf('gb') >= 0) {
                    return 'DIFC\u2013London: connecting $800B in DIFC AUM to FCA-regulated markets. One of the world\u2019s fastest-growing cross-border financial corridors.';
                }
                if (ids.indexOf('ae-dubai-difc') >= 0 && ids.indexOf('sg') >= 0) {
                    return 'DIFC\u2013Singapore: two of Asia\u2019s premier financial centers. Combined administered assets exceed $3T. Automated DFSA\u2013MAS compliance passporting.';
                }
                if (ids.indexOf('ae-abudhabi-adgm') >= 0 && ids.indexOf('ae-dubai-fzc') >= 0) {
                    return 'Intra-UAE corridor: compliance bridge between Dubai\u2019s 28 free zones and ADGM\u2019s $1T+ sovereign capital hub.';
                }
                if (ids.indexOf('us-de') >= 0 && ids.indexOf('ky') >= 0) {
                    return 'Delaware\u2013Cayman: the world\u2019s most common fund formation corridor. 350,000 Delaware entities + 25,000 Cayman fund vehicles. Automated compliance replaces 90 days of manual legal work.';
                }
                if (ids.indexOf('ae-abudhabi-adgm') >= 0 && ids.indexOf('sg') >= 0) {
                    return 'ADGM\u2013Singapore: connecting two of Asia\u2019s premier financial centers. Combined administered assets exceed $3T.';
                }
                if (ids.indexOf('gb') >= 0 && ids.indexOf('us-ny') >= 0) {
                    return 'London\u2013New York: the busiest financial corridor on Earth. FCA + DFS combined regulatory revenue exceeds $1.5B. Automated cross-border compliance at sovereign scale.';
                }
            }

            /* Dubai cluster */
            var dubaiZones = ids.filter(function (id) { return id.indexOf('ae-dubai') === 0; });
            if (dubaiZones.length >= 3) {
                return 'Dubai free zone cluster: ' + dubaiZones.length + ' zones including DIFC ($800B+ AUM), DMCC (21,000 businesses), JAFZA (15M containers/yr). The world\u2019s densest free zone network.';
            }

            /* Regional clusters */
            if (gulfZones.length >= 4) {
                var gulfRev = 0;
                gulfZones.forEach(function (id) { gulfRev += (ZONE_ECONOMICS[id] || {}).rev || 0; });
                return 'Gulf cluster: ' + gulfZones.length + ' zones generating ' + fmtCurrency(gulfRev) + '/yr. UAE zones alone administer over $2T in combined assets.';
            }
            if (usZones.length >= 4) {
                return 'US federal mesh: ' + usZones.length + ' states, ' + (usZones.length * (usZones.length - 1) / 2) + ' intra-federal corridors. Delaware alone generates $1.9B/yr in corporate franchise revenue.';
            }
            if (asiaZones.length >= 3) {
                return 'Asia-Pacific network: ' + asiaZones.length + ' financial centers, ' + (asiaZones.length * (asiaZones.length - 1) / 2) + ' corridors. The fastest-growing cross-border capital flow region.';
            }
            if (africaZones.length >= 3) {
                return 'African corridor network: ' + africaZones.length + ' zones across the continent. Cross-border trade in Africa costs 3\u00d7 more than Asia \u2014 these corridors close that gap.';
            }

            /* Cross-continental */
            if (gulfZones.length >= 1 && usZones.length >= 1 && asiaZones.length >= 1) {
                return 'Tri-continental network: Gulf, Americas, and Asia-Pacific connected. ' + fmtCurrency(totalRev) + '/yr in network economic activity across automated compliance corridors.';
            }
            if (gulfZones.length >= 1 && africaZones.length >= 1) {
                return 'Gulf\u2013Africa axis: the fastest-growing investment corridor in the world. UAE sovereign wealth is deploying $50B+ into African infrastructure \u2014 these corridors automate the compliance layer.';
            }

            /* Scale insights */
            if (count >= 20) {
                return 'At ' + count + ' zones, ' + corridorCount.toLocaleString('en-US') + ' corridors generate ' + fmtCurrency(totalRev) + '/yr in network activity. Hub advantage is insurmountable \u2014 a new entrant captures ' + (count - 1) + ' corridors vs. the hub\u2019s ' + corridorCount.toLocaleString('en-US') + '.';
            }
            if (count >= 10) {
                return corridorCount.toLocaleString('en-US') + ' corridors across ' + count + ' zones. ' + fmtCurrency(totalRev) + '/yr in network economic activity. Every additional zone adds ' + (count - 1) + ' new corridors.';
            }
            if (count >= 5) {
                return count + ' zones, ' + corridorCount + ' corridors. At ' + (count * 2) + ' zones, corridors quadruple to ' + (count * 2 * (count * 2 - 1) / 2) + '. The network effect compounds.';
            }
            if (count >= 3) {
                return count + ' zones form ' + corridorCount + ' corridors. At 10 zones, that becomes 45. The quadratic is beginning.';
            }

            return '';
        }

        function buildBreakdown(ids, corridorCount, zoneRev, corridorRev, totalRev) {
            breakdownPanel.className = 'mesh-economics-breakdown active';

            var html = '<div class="mesh-breakdown-inner">';

            /* Network insight */
            var insight = getNetworkInsight(ids, corridorCount, totalRev);
            if (insight) {
                html += '<div class="mesh-breakdown-insight">' + insight + '</div>';
            }

            /* Zone revenue — per-zone detail for ≤8 zones, aggregated for more */
            html += '<div class="mesh-breakdown-section">';
            html += '<div class="mesh-breakdown-header">';
            html += '<span class="mesh-breakdown-label">Zone Revenue</span>';
            html += '<span class="mesh-breakdown-total">' + fmtCurrency(zoneRev) + '</span>';
            html += '</div>';

            if (ids.length <= 8) {
                /* Sort by revenue descending, show per-zone */
                var sorted = ids.slice().sort(function (a, b) {
                    return ((ZONE_ECONOMICS[b] || {}).rev || 0) - ((ZONE_ECONOMICS[a] || {}).rev || 0);
                });
                sorted.forEach(function (zid) {
                    var z = zoneMap[zid];
                    var ec = ZONE_ECONOMICS[zid];
                    if (!z || !ec) return;
                    html += '<div class="mesh-breakdown-row">';
                    html += '<span class="mesh-breakdown-name">' + z.name + '</span>';
                    html += '<span class="mesh-breakdown-amount">' + fmtCurrency(ec.rev) + '</span>';
                    html += '</div>';
                });
            } else {
                var totalEntities = 0;
                ids.forEach(function (zid) {
                    totalEntities += (ZONE_ECONOMICS[zid] || {}).entities || 0;
                });
                html += '<div class="mesh-breakdown-row">';
                html += '<span class="mesh-breakdown-name">' + ids.length + ' zones \u00b7 ' + totalEntities.toLocaleString('en-US') + ' entities</span>';
                html += '<span class="mesh-breakdown-amount">' + fmtCurrency(zoneRev) + '</span>';
                html += '</div>';
            }
            html += '</div>';

            /* Corridor revenue — show top pairs for small selections */
            html += '<div class="mesh-breakdown-section">';
            html += '<div class="mesh-breakdown-header">';
            html += '<span class="mesh-breakdown-label">Corridor Revenue</span>';
            html += '<span class="mesh-breakdown-total">' + fmtCurrency(corridorRev) + '</span>';
            html += '</div>';

            if (ids.length <= 5) {
                /* Show individual corridor pairs */
                var pairs = [];
                for (var i = 0; i < ids.length; i++) {
                    for (var j = i + 1; j < ids.length; j++) {
                        pairs.push({
                            from: (zoneMap[ids[i]] || {}).name || ids[i],
                            to: (zoneMap[ids[j]] || {}).name || ids[j],
                            rev: corridorRevPair(ids[i], ids[j])
                        });
                    }
                }
                pairs.sort(function (a, b) { return b.rev - a.rev; });
                pairs.forEach(function (p) {
                    html += '<div class="mesh-breakdown-row">';
                    html += '<span class="mesh-breakdown-name">' + p.from + ' \u2194 ' + p.to + '</span>';
                    html += '<span class="mesh-breakdown-amount">' + fmtCurrency(p.rev) + '</span>';
                    html += '</div>';
                });
            } else if (ids.length <= 12) {
                /* Show top 5 corridors */
                var topPairs = [];
                for (var ti = 0; ti < ids.length; ti++) {
                    for (var tj = ti + 1; tj < ids.length; tj++) {
                        topPairs.push({
                            from: (zoneMap[ids[ti]] || {}).name || ids[ti],
                            to: (zoneMap[ids[tj]] || {}).name || ids[tj],
                            rev: corridorRevPair(ids[ti], ids[tj])
                        });
                    }
                }
                topPairs.sort(function (a, b) { return b.rev - a.rev; });
                for (var tp = 0; tp < Math.min(5, topPairs.length); tp++) {
                    html += '<div class="mesh-breakdown-row">';
                    html += '<span class="mesh-breakdown-name">' + topPairs[tp].from + ' \u2194 ' + topPairs[tp].to + '</span>';
                    html += '<span class="mesh-breakdown-amount">' + fmtCurrency(topPairs[tp].rev) + '</span>';
                    html += '</div>';
                }
                if (topPairs.length > 5) {
                    html += '<div class="mesh-breakdown-row">';
                    html += '<span class="mesh-breakdown-name">+ ' + (topPairs.length - 5) + ' more corridors</span>';
                    html += '<span class="mesh-breakdown-amount"></span>';
                    html += '</div>';
                }
            } else {
                var avgCorr = corridorRev / corridorCount;
                html += '<div class="mesh-breakdown-row">';
                html += '<span class="mesh-breakdown-name">' + corridorCount.toLocaleString('en-US') + ' corridors \u00b7 avg ' + fmtCurrency(avgCorr) + '</span>';
                html += '<span class="mesh-breakdown-amount">' + fmtCurrency(corridorRev) + '</span>';
                html += '</div>';
            }
            html += '</div>';

            /* HomeOS factory revenue */
            var factoryZones = [];
            var factoryRevTotal = 0;
            var factoryUnitsTotal = 0;
            ids.forEach(function (zid) {
                var ec = ZONE_ECONOMICS[zid];
                if (ec && ec.factory) {
                    factoryZones.push({ id: zid, name: (zoneMap[zid] || {}).name || zid, factory: ec.factory });
                    factoryRevTotal += ec.factory.rev;
                    factoryUnitsTotal += ec.factory.units;
                }
            });
            if (factoryZones.length > 0) {
                html += '<div class="mesh-breakdown-section">';
                html += '<div class="mesh-breakdown-header">';
                html += '<span class="mesh-breakdown-label">HomeOS Factories</span>';
                html += '<span class="mesh-breakdown-total">' + fmtCurrency(factoryRevTotal) + '</span>';
                html += '</div>';
                factoryZones.forEach(function (fz) {
                    html += '<div class="mesh-breakdown-row">';
                    html += '<span class="mesh-breakdown-name">' + fz.name + ' \u00b7 ' + fz.factory.units.toLocaleString('en-US') + ' units/yr</span>';
                    html += '<span class="mesh-breakdown-amount">' + fmtCurrency(fz.factory.rev) + '</span>';
                    html += '</div>';
                });
                html += '<div class="mesh-breakdown-row mesh-breakdown-row--note">';
                html += '<span class="mesh-breakdown-name">Broad Group JV \u2014 factory-built modular construction + HomeOS</span>';
                html += '</div>';
                html += '</div>';
            }

            var grandTotal = totalRev + factoryRevTotal;

            /* Subnetwork total */
            html += '<div class="mesh-breakdown-total-row">';
            html += '<span class="mesh-breakdown-label">Subnetwork Total</span>';
            html += '<span class="mesh-breakdown-grand">' + fmtCurrency(grandTotal) + '/yr</span>';
            html += '</div>';

            /* Hub advantage comparison */
            if (ids.length >= 3) {
                var hubCorridors = ids.length * (ids.length - 1) / 2;
                var lateCorridors = ids.length;
                var hubRatio = ((ids.length - 1) / 2).toFixed(1);

                /* Late entrant revenue: median non-selected zone's corridors to each selected zone */
                var nonSelectedRevs = [];
                for (var nz in ZONE_ECONOMICS) {
                    if (ZONE_ECONOMICS.hasOwnProperty(nz) && !selectedZones[nz]) {
                        nonSelectedRevs.push({ id: nz, rev: ZONE_ECONOMICS[nz].rev });
                    }
                }
                nonSelectedRevs.sort(function(ra, rb) { return ra.rev - rb.rev; });
                var lateRev = 0;
                if (nonSelectedRevs.length > 0) {
                    var medianZone = nonSelectedRevs[Math.floor(nonSelectedRevs.length / 2)];
                    for (var lr = 0; lr < ids.length; lr++) {
                        lateRev += corridorRevPair(medianZone.id, ids[lr]);
                    }
                    lateRev += medianZone.rev;
                }

                html += '<div class="mesh-hub-section">';
                html += '<div class="mesh-breakdown-header">';
                html += '<span class="mesh-breakdown-label">Hub Advantage</span>';
                html += '</div>';
                html += '<div class="mesh-hub-compare">';
                html += '<div class="mesh-hub-col">';
                html += '<span class="mesh-hub-col-label">Your Network</span>';
                html += '<span class="mesh-hub-metric">' + hubCorridors.toLocaleString('en-US') + '</span>';
                html += '<span class="mesh-hub-unit">corridors</span>';
                html += '<span class="mesh-hub-metric">' + fmtCurrency(grandTotal) + '/yr</span>';
                html += '</div>';
                html += '<div class="mesh-hub-ratio">' + hubRatio + '\u00d7</div>';
                html += '<div class="mesh-hub-col mesh-hub-col--late">';
                html += '<span class="mesh-hub-col-label">Late Entrant #' + (ids.length + 1) + '</span>';
                html += '<span class="mesh-hub-metric">' + lateCorridors + '</span>';
                html += '<span class="mesh-hub-unit">corridors</span>';
                html += '<span class="mesh-hub-metric">' + fmtCurrency(lateRev) + '/yr</span>';
                html += '</div>';
                html += '</div>';
                html += '<div class="mesh-hub-projection">At 100 zones: 4,950 corridors \u00b7 50\u00d7 advantage</div>';
                html += '</div>';
            }

            html += '<div class="mesh-breakdown-note">Zone revenue: published regulatory authority data. Corridor revenue: gravity model \u2014 \u221a(zone\u2090 \u00d7 zone\u2091) \u00d7 0.8. Factory revenue: Broad Group JV modular construction + HomeOS licensing. Excludes FDI uplift, lending, and secondary market activity.</div>';

            html += '</div>';
            breakdownPanel.innerHTML = html;
        }

        /* ── Clear selection via × button or Escape key ── */
        function clearSelection() {
            if (genesis.running) { skipGenesis(); return; }
            if (growth.running) { cancelGrowth(); growth.timeouts.forEach(function (tid) { clearTimeout(tid); }); growth.timeouts = []; if (growth.rafId) { cancelAnimationFrame(growth.rafId); growth.rafId = null; } return; }
            hideHoverCard();
            selectedZones = {};
            selectedCount = 0;
            allNodes.forEach(function (n) { n.classList.remove('selected'); });
            allLabels.forEach(function (l) {
                if (!isMobile) l.classList.remove('visible');
            });
            edgeGroup.style.opacity = '';
            drawSelectionCorridors();
            updateEconomics();
        }

        /* ── Activate All: dramatic cascade build ── */
        function activateAll() {
            if (genesis.running || growth.running) return;
            clearSelection();
            hideHoverCard();
            removeCard();
            var zones = isMobile ? ZONES.slice(0, 14) : ZONES;
            var delay = 0;
            var stagger = reducedMotion ? 0 : 40;

            zones.forEach(function (zone, i) {
                setTimeout(function () {
                    selectedZones[zone.id] = true;
                    selectedCount++;

                    var node = svg.querySelector('.mesh-node[data-zone="' + zone.id + '"]');
                    if (node) node.classList.add('selected');

                    allLabels.forEach(function (l) {
                        if (l.getAttribute('data-zone') === zone.id) l.classList.add('visible');
                    });

                    edgeGroup.style.opacity = '0.12';
                    drawSelectionCorridors();
                    updateEconomics();
                }, delay);
                delay += stagger;
            });
        }

        economicsPanel.addEventListener('click', function (e) {
            if (e.target.classList.contains('mesh-economics-clear')) {
                e.stopPropagation();
                clearSelection();
            }
            if (e.target.classList.contains('mesh-economics-activate')) {
                e.stopPropagation();
                activateAll();
            }
            if (e.target.classList.contains('mesh-economics-genesis')) {
                e.stopPropagation();
                startGenesis();
            }
            if (e.target.classList.contains('mesh-economics-growth')) {
                e.stopPropagation();
                startGrowth();
            }
            if (e.target.classList.contains('mesh-economics-explore')) {
                e.stopPropagation();
                clearSelection();
                ['ae-dubai-difc', 'sg', 'us-de'].forEach(function(zid) {
                    var node = svg.querySelector('.mesh-node[data-zone="' + zid + '"]');
                    if (node) toggleSelection(zid, node);
                });
            }
        });

        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && genesis.running) {
                skipGenesis();
                return;
            }
            if (e.key === 'Escape' && growth.running) {
                cancelGrowth();
                growth.timeouts.forEach(function (tid) { clearTimeout(tid); });
                growth.timeouts = [];
                if (growth.rafId) { cancelAnimationFrame(growth.rafId); growth.rafId = null; }
                return;
            }
            if (e.key === 'Escape') {
                clearSelection();
                removeCard();
                hideHoverCard();
                return;
            }
            if (genesis.running || growth.running) return;
            if ((e.key === 'a' || e.key === 'A') && selectedCount === 0 && !e.ctrlKey && !e.metaKey) {
                var tag = (e.target.tagName || '').toLowerCase();
                if (tag !== 'input' && tag !== 'textarea' && tag !== 'select') {
                    activateAll();
                }
            }
        });

        /* ── Particles (desktop only, respects reduced motion) ── */
        var supportsOffsetPath = CSS && CSS.supports && CSS.supports('offset-path', 'path("M0 0")');
        var particleGroup = null;
        var activeParticles = 0;
        var MAX_PARTICLES = 25;

        if (!reducedMotion && !isMobile && supportsOffsetPath && edgeElements.length > 0) {
            particleGroup = el('g');
            svg.insertBefore(particleGroup, nodeGroup);

            function spawnParticle() {
                if (activeParticles >= MAX_PARTICLES) return;

                var edge = edgeElements[Math.floor(Math.random() * edgeElements.length)];
                /* Vary size: 2–4px radius */
                var r = 2 + Math.random() * 2;
                /* Vary speed: 5–12s duration */
                var duration = 5 + Math.random() * 7;
                var circle = el('circle', {
                    r: r.toFixed(1),
                    fill: CORRIDOR_COLORS[edge.type] || '#a0877a',
                    'class': 'mesh-particle'
                });
                circle.style.offsetPath = 'path("' + edge.d + '")';
                circle.style.offsetRotate = '0deg';
                circle.style.animationDuration = duration.toFixed(1) + 's';
                particleGroup.appendChild(circle);
                activeParticles++;

                requestAnimationFrame(function () {
                    circle.classList.add('active');
                });

                circle.addEventListener('animationend', function () {
                    if (circle.parentNode) circle.parentNode.removeChild(circle);
                    activeParticles--;
                }, { once: true });
            }

            /* Initial burst — continuous spawning handled by weighted spawner below */
            setTimeout(spawnParticle, 200);
            setTimeout(spawnParticle, 500);
            setTimeout(spawnParticle, 900);
            setTimeout(spawnParticle, 1400);
            setTimeout(spawnParticle, 2000);
            setTimeout(spawnParticle, 2700);
        }

        /* ── Live Network Dashboard ──
           Simulated activity feed, zone pulses, revenue counter,
           and weighted particle spawning to make the mesh feel alive. */

        /* --- Hub zones for weighted spawning --- */
        var HUB_ZONES = {
            'ae-dubai-difc': true, 'ae-abudhabi-adgm': true, 'ae-dubai-fzc': true,
            'ae-dubai-dmcc': true, 'ae-dubai-jafza': true,
            'sg': true, 'gb': true, 'us-de': true, 'hk': true, 'ky': true
        };

        /* --- Activity Feed --- */
        var ENTITY_NAMES = [
            'Nexus Capital Ltd', 'Atlas Trading FZE', 'Meridian Holdings Ltd', 'Zenith Corp LLC',
            'Horizon Ventures GP', 'Apex Partners Ltd', 'Vanguard FZC', 'Summit Group Inc',
            'Pinnacle Fund I LP', 'Catalyst Advisors Ltd', 'Frontier Systems FZE', 'Ascend Capital Ltd',
            'Sovereign Equity GP', 'Crestview Partners LLC', 'Elara Holdings Ltd', 'Northstar Infra FZE',
            'Silk Road Logistics LLC', 'Oasis Digital Ltd', 'Keystone Ventures GP', 'Halcyon Capital FZE',
            'Crescent Bridge LP', 'Latitude Commodities FZE', 'Polaris Shipping Ltd', 'Cedarwood Pharma Inc',
            'Gulf Meridian GP', 'Canopy Renewables Ltd', 'Ironforge Mining FZE', 'Bluewater Maritime LLC',
            'Stratos Aerospace Inc', 'Verdant Agriculture Ltd', 'Coral Bay Properties FZC', 'Titanium Wealth GP',
            'Ember Technologies Ltd', 'Sapphire Health Inc', 'Dune Logistics FZE', 'Alpine Ventures LP',
            'Obsidian Infrastructure Ltd', 'Falcon Realty GP', 'Terracotta Capital LLC', 'Archipelago Holdings FZE',
            'Prism Analytics Ltd', 'Citadel Commodities FZC', 'Windrose Navigation Inc', 'Bedrock Industries LP',
            'Solstice Energy Ltd', 'Equinox Fund II GP', 'Ridgeline Capital LLC', 'Lantern Finance FZE'
        ];

        var ENTITY_TYPES = ['LLC', 'FZE', 'Ltd', 'GP', 'LP', 'SPV', 'Inc', 'FZC', 'PLC', 'SPC', 'VCC', 'RAIF'];
        var FRAMEWORKS = {
            'ae-dubai-difc': 'DIFC Companies Law No. 5',
            'ae-abudhabi-adgm': 'ADGM Companies Reg. 2020',
            'ae-dubai-fzc': 'Dubai FZC Operating Reg.',
            'ae-dubai-dmcc': 'DMCC Company Regulations',
            'ae-dubai-jafza': 'JAFZA Companies Rules',
            'ae-dubai-ifza': 'IFZA Business Reg. 2022',
            'us-de': 'DGCL Title 8 \u00a7102',
            'us-ny': 'NY BCL \u00a7402',
            'us-ca': 'CA Corporations Code \u00a7200',
            'us-nv': 'NRS Chapter 78',
            'us-wy': 'Wyoming LLC Act \u00a717-29',
            'us-mt': 'Montana BCA \u00a735-1',
            'ky': 'Companies Act (2023 Rev.)',
            'vg': 'BVI Business Companies Act',
            'sg': 'Companies Act Cap. 50',
            'gb': 'Companies Act 2006',
            'gb-gi': 'Gibraltar Companies Act',
            'hk': 'Companies Ordinance Cap. 622',
            'jp': 'Companies Act (Act No. 86)',
            'au': 'Corporations Act 2001',
            'rw': 'Rwanda Companies Act 2021',
            'ng': 'CAMA 2020',
            'za': 'Companies Act 71 of 2008',
            'mu': 'Mauritius Companies Act 2001',
            'sc': 'Seychelles IBC Act 2016',
            'ke': 'Kenya Companies Act 2015',
            'pk-sifc': 'SIFC Act 2023',
            'kz-alatau': 'AIFC Companies Reg.',
            'pt': 'C\u00f3digo das Sociedades Comerciais',
            'eg': 'Investment Law 72/2017',
            'hn-prospera': 'Pr\u00f3spera Civil Code'
        };

        var LICENSE_TYPES = [
            'Category 3C Investment Mgmt', 'Category 4 Advisory', 'VASP Class F',
            'Fund Management License', 'Payment Services License', 'Money Services Business',
            'Digital Asset Trading License', 'Custody Services License', 'Insurance Intermediary',
            'Securities Dealing License', 'Digital Securities Framework', 'Credit Services License',
            'E-Money Institution License', 'Capital Markets License', 'Crowdfunding License',
            'Broker-Dealer License', 'Trust Services License', 'Collective Investment Scheme',
            'Depository Services License', 'Market Maker Authorization', 'Remittance License',
            'Wealth Management Permit', 'Clearing House Authorization', 'Trade Repository License'
        ];

        var ASSET_TYPES = [
            'Series A equity', 'convertible note', 'SAFE instrument', 'programmable bond',
            'commercial paper', 'warehouse receipt', 'sukuk certificate', 'fund interest',
            'LP commitment', 'revenue-share agreement', 'trade receivable', 'real estate unit',
            'carbon credit', 'structured product', 'cap table entry', 'preference shares',
            'promissory note', 'commodity warrant', 'murabaha contract', 'ijarah certificate',
            'venture debt note', 'mezzanine tranche', 'infrastructure bond', 'green bond',
            'commodity-linked warrant', 'carried interest', 'co-investment right', 'distribution waterfall'
        ];

        var FX_PAIRS = [
            'AED/USD', 'SGD/USD', 'GBP/USD', 'EUR/AED', 'HKD/USD', 'KYD/USD', 'BRL/USD',
            'PKR/USD', 'JPY/USD', 'AUD/USD', 'KES/USD', 'ZAR/USD', 'MUR/USD', 'NGN/USD',
            'EUR/GBP', 'CNH/USD', 'KRW/USD', 'QAR/USD', 'CHF/USD', 'SAR/USD', 'RWF/USD'
        ];

        var ID_TYPES = ['CNIC', 'passport', 'national ID', 'trade license', 'CR number', 'NTN', 'TIN', 'LEI', 'GIIN', 'EIN'];
        var CONSENT_ACTIONS = ['share transfer', 'board resolution', 'capital call', 'fund distribution', 'asset migration', 'dissolution vote', 'merger approval', 'amendment to articles', 'related-party transaction', 'new share issuance', 'dividend declaration', 'officer appointment', 'treasury disbursement', 'cross-border redomiciliation'];
        var TAX_EVENTS = ['capital gains', 'withholding', 'transfer pricing adjustment', 'dividend distribution', 'interest accrual', 'royalty payment', 'management fee', 'carried interest crystallization', 'exit proceeds', 'annual levy', 'stamp duty', 'VAT on services'];
        var COMPLIANCE_DOMAINS = ['AML', 'KYC', 'sanctions', 'tax', 'securities', 'corporate', 'custody', 'data privacy', 'licensing'];
        var DISSOLUTION_STAGES = ['board resolution filed', 'creditor notification period opened', 'asset liquidation commenced', 'tax clearance obtained', 'final distribution approved', 'deregistration filed', 'regulatory sign-off received', 'winding-up complete'];
        var SHARE_CLASSES = ['Class A ordinary', 'Class B voting', 'Series Seed preferred', 'Series A preferred', 'Series B preferred', 'management carry', 'founder shares', 'employee option pool', 'convertible preferred', 'non-voting redeemable'];

        function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
        function rint(lo, hi) { return lo + Math.floor(Math.random() * (hi - lo)); }
        function fmtA(n) { return n >= 1e6 ? (n / 1e6).toFixed(1) + 'M' : n >= 1e3 ? (n / 1e3).toFixed(0) + 'K' : String(n); }
        function hexId() { return Math.random().toString(16).slice(2, 10); }

        var TICKER_TEMPLATES = [

            /* ═══════════════════════════════════════
               ENTITIES PRIMITIVE
               Formation, dissolution, licensing, amendments, officers, registered agents
               ═══════════════════════════════════════ */

            /* Entity formation */
            function (z) {
                var fw = FRAMEWORKS[z.id] || 'Local Companies Act';
                return { text: pick(ENTITY_NAMES) + ' incorporated as ' + pick(ENTITY_TYPES) + ' in <span class="activity-zone">' + z.name + '</span> under ' + fw, zone: z.id };
            },
            /* Entity formation with registry number */
            function (z) {
                return { text: 'Entity #' + rint(10000, 99999) + ' registered in <span class="activity-zone">' + z.name + '</span>: ' + pick(ENTITY_NAMES) + ', ' + pick(ENTITY_TYPES) + ' formation complete', zone: z.id };
            },
            /* License acquisition */
            function (z) {
                return { text: pick(LICENSE_TYPES) + ' issued to ' + pick(ENTITY_NAMES) + ' by <span class="activity-zone">' + z.name + '</span> regulator', zone: z.id };
            },
            /* License renewal */
            function (z) {
                return { text: pick(LICENSE_TYPES) + ' renewed: ' + pick(ENTITY_NAMES) + ' in <span class="activity-zone">' + z.name + '</span>, valid through 2027', zone: z.id };
            },
            /* License amendment */
            function (z) {
                return { text: 'License scope amended: ' + pick(ENTITY_NAMES) + ' in <span class="activity-zone">' + z.name + '</span>, added ' + pick(LICENSE_TYPES).toLowerCase() + ' authorization', zone: z.id };
            },
            /* Dissolution stage */
            function (z) {
                return { text: 'Dissolution: ' + pick(ENTITY_NAMES) + ' in <span class="activity-zone">' + z.name + '</span> \u2014 ' + pick(DISSOLUTION_STAGES), zone: z.id };
            },
            /* Articles amendment */
            function (z) {
                return { text: 'Articles of association amended: ' + pick(ENTITY_NAMES) + ' in <span class="activity-zone">' + z.name + '</span>, filed with registry', zone: z.id };
            },
            /* Officer appointment */
            function (z) {
                return { text: 'Director appointed: ' + pick(ENTITY_NAMES) + ' in <span class="activity-zone">' + z.name + '</span>, compliance check passed, registry updated', zone: z.id };
            },
            /* Registered agent change */
            function (z) {
                return { text: 'Registered agent updated: ' + pick(ENTITY_NAMES) + ' in <span class="activity-zone">' + z.name + '</span>, new agent confirmed', zone: z.id };
            },
            /* Annual return filed */
            function (z) {
                return { text: 'Annual return filed: ' + pick(ENTITY_NAMES) + ' in <span class="activity-zone">' + z.name + '</span>, entity in good standing', zone: z.id };
            },
            /* Branch registration */
            function (z, z2) {
                return { text: pick(ENTITY_NAMES) + ' branch registered in <span class="activity-zone">' + z2.name + '</span>, parent entity in <span class="activity-zone">' + z.name + '</span>', zone: z.id, zone2: z2.id };
            },
            /* Cross-border redomiciliation */
            function (z, z2) {
                return { text: pick(ENTITY_NAMES) + ' redomiciled: <span class="activity-zone">' + z.name + '</span> \u2192 <span class="activity-zone">' + z2.name + '</span>, continuance certificate issued', zone: z.id, zone2: z2.id };
            },

            /* ═══════════════════════════════════════
               OWNERSHIP PRIMITIVE
               Cap table, share transfers, beneficial ownership, equity events
               ═══════════════════════════════════════ */

            /* Share transfer */
            function (z) {
                var shares = rint(1000, 500000);
                return { text: shares.toLocaleString('en-US') + ' ' + pick(SHARE_CLASSES) + ' shares transferred: ' + pick(ENTITY_NAMES) + ' in <span class="activity-zone">' + z.name + '</span>', zone: z.id };
            },
            /* Cap table initialized */
            function (z) {
                return { text: 'Cap table initialized: ' + pick(ENTITY_NAMES) + ' in <span class="activity-zone">' + z.name + '</span>, ' + rint(2, 8) + ' share classes, ' + rint(3, 25) + ' holders', zone: z.id };
            },
            /* Beneficial ownership update */
            function (z) {
                return { text: 'UBO registry updated: ' + pick(ENTITY_NAMES) + ' in <span class="activity-zone">' + z.name + '</span>, verified per FATF Rec. 24', zone: z.id };
            },
            /* New share issuance */
            function (z) {
                var a = fmtA(rint(1, 50) * 1e6);
                return { text: '<span class="activity-amount">$' + a + '</span> ' + pick(SHARE_CLASSES) + ' shares issued: ' + pick(ENTITY_NAMES) + ' in <span class="activity-zone">' + z.name + '</span>', zone: z.id };
            },
            /* Stock split / consolidation */
            function (z) {
                var r = pick(['2:1', '3:1', '4:1', '5:1', '10:1']);
                return { text: r + ' share split executed: ' + pick(ENTITY_NAMES) + ' in <span class="activity-zone">' + z.name + '</span>, cap table recomputed', zone: z.id };
            },
            /* Vesting event */
            function (z) {
                var shares = rint(5000, 200000);
                return { text: shares.toLocaleString('en-US') + ' employee option pool shares vested: ' + pick(ENTITY_NAMES) + ' in <span class="activity-zone">' + z.name + '</span>', zone: z.id };
            },
            /* Cross-border ownership transfer */
            function (z, z2) {
                var a = fmtA(rint(500, 50000) * 1e3);
                return { text: '<span class="activity-amount">$' + a + '</span> ownership transfer: <span class="activity-zone">' + z.name + '</span> \u2192 <span class="activity-zone">' + z2.name + '</span>, tax event computed', zone: z.id, zone2: z2.id };
            },
            /* Pledge / encumbrance */
            function (z) {
                var a = fmtA(rint(2, 80) * 1e6);
                return { text: '<span class="activity-amount">$' + a + '</span> equity pledge registered: ' + pick(ENTITY_NAMES) + ' in <span class="activity-zone">' + z.name + '</span>, lien recorded on cap table', zone: z.id };
            },
            /* Conversion event */
            function (z) {
                var a = fmtA(rint(1, 30) * 1e6);
                return { text: '<span class="activity-amount">$' + a + '</span> convertible note converted to ' + pick(SHARE_CLASSES) + ': ' + pick(ENTITY_NAMES) + ' in <span class="activity-zone">' + z.name + '</span>', zone: z.id };
            },
            /* Drag-along / tag-along */
            function (z) {
                return { text: 'Tag-along right exercised: minority holder in ' + pick(ENTITY_NAMES) + ', <span class="activity-zone">' + z.name + '</span>, joining majority sale', zone: z.id };
            },

            /* ═══════════════════════════════════════
               IDENTITY PRIMITIVE
               KYC/KYB, verification, attestations, credentials, screening
               ═══════════════════════════════════════ */

            /* KYB verification */
            function (z) {
                var n = rint(1000, 9999);
                return { text: 'KYB verified: entity #' + n + ' in <span class="activity-zone">' + z.name + '</span>, VC issued did:mez:' + z.id.replace(/-/g, '') + n, zone: z.id };
            },
            /* KYC individual */
            function (z) {
                return { text: 'KYC cleared: beneficial owner of ' + pick(ENTITY_NAMES) + ' in <span class="activity-zone">' + z.name + '</span>, ' + pick(ID_TYPES) + ' verified', zone: z.id };
            },
            /* Identity linked */
            function (z) {
                return { text: 'Identity linked: ' + pick(ID_TYPES) + ' \u2192 did:mez:' + hexId() + ' for ' + pick(ENTITY_NAMES) + ' officer in <span class="activity-zone">' + z.name + '</span>', zone: z.id };
            },
            /* Sanctions screening */
            function (z) {
                return { text: 'Sanctions screening passed: ' + pick(ENTITY_NAMES) + ' in <span class="activity-zone">' + z.name + '</span>, OFAC + EU + UN watchlists cleared', zone: z.id };
            },
            /* PEP screening */
            function (z) {
                return { text: 'PEP screening completed: director of ' + pick(ENTITY_NAMES) + ' in <span class="activity-zone">' + z.name + '</span>, no matches, EDD not required', zone: z.id };
            },
            /* Investor onboarding */
            function (z) {
                return { text: pick(ENTITY_NAMES) + ' onboarded as accredited investor in <span class="activity-zone">' + z.name + '</span>, AML/CFT cleared', zone: z.id };
            },
            /* Identity attestation */
            function (z) {
                return { text: 'Identity attestation issued: did:mez:' + hexId() + ' in <span class="activity-zone">' + z.name + '</span>, signed by ' + pick(['FSRA', 'DFSA', 'FCA', 'MAS', 'SEC', 'GFSC', 'CMA', 'SFC']), zone: z.id };
            },
            /* Cross-border identity passporting */
            function (z, z2) {
                return { text: 'Identity passported: <span class="activity-zone">' + z.name + '</span> \u2192 <span class="activity-zone">' + z2.name + '</span>, KYC/AML attestation accepted via corridor', zone: z.id, zone2: z2.id };
            },
            /* Adverse media screening */
            function (z) {
                return { text: 'Adverse media scan: ' + pick(ENTITY_NAMES) + ' in <span class="activity-zone">' + z.name + '</span>, 0 hits across 12,000+ sources', zone: z.id };
            },
            /* Ongoing monitoring trigger */
            function (z) {
                return { text: 'Ongoing monitoring: ' + pick(ENTITY_NAMES) + ' in <span class="activity-zone">' + z.name + '</span>, periodic review completed, risk rating unchanged', zone: z.id };
            },
            /* eKYC document verification */
            function (z) {
                return { text: 'eKYC: ' + pick(ID_TYPES) + ' document verified for ' + pick(ENTITY_NAMES) + ' signatory in <span class="activity-zone">' + z.name + '</span>, liveness check passed', zone: z.id };
            },

            /* ═══════════════════════════════════════
               CONSENT PRIMITIVE
               Multi-party signatures, resolutions, approvals, governance
               ═══════════════════════════════════════ */

            /* Board consent */
            function (z) {
                var s = rint(2, 7);
                return { text: s + '/' + s + ' consent signatures confirmed: ' + pick(ENTITY_NAMES) + ' ' + pick(CONSENT_ACTIONS) + ' in <span class="activity-zone">' + z.name + '</span>', zone: z.id };
            },
            /* Shareholder resolution */
            function (z) {
                var pct = rint(67, 100);
                return { text: 'Shareholder resolution passed (' + pct + '% approval): ' + pick(CONSENT_ACTIONS) + ' for ' + pick(ENTITY_NAMES) + ' in <span class="activity-zone">' + z.name + '</span>', zone: z.id };
            },
            /* Multi-party consent request initiated */
            function (z) {
                var parties = rint(2, 6);
                return { text: 'Consent request initiated: ' + parties + ' parties, ' + pick(CONSENT_ACTIONS) + ' for ' + pick(ENTITY_NAMES) + ' in <span class="activity-zone">' + z.name + '</span>', zone: z.id };
            },
            /* Cross-border consent */
            function (z, z2) {
                return { text: 'Cross-border consent: ' + pick(CONSENT_ACTIONS) + ' signed across <span class="activity-zone">' + z.name + '</span> + <span class="activity-zone">' + z2.name + '</span>, bilateral approval recorded', zone: z.id, zone2: z2.id };
            },
            /* Consent audit trail */
            function (z) {
                return { text: 'Consent audit trail sealed: ' + pick(ENTITY_NAMES) + ' in <span class="activity-zone">' + z.name + '</span>, ' + rint(3, 12) + ' signatures, SHA-256 anchored', zone: z.id };
            },
            /* Regulatory approval consent */
            function (z) {
                return { text: 'Regulatory consent obtained: ' + pick(CONSENT_ACTIONS) + ' for ' + pick(ENTITY_NAMES) + ' in <span class="activity-zone">' + z.name + '</span>, regulator sign-off recorded', zone: z.id };
            },
            /* Consent revocation */
            function (z) {
                return { text: 'Consent revoked: 1 party withdrew from ' + pick(CONSENT_ACTIONS) + ', ' + pick(ENTITY_NAMES) + ' in <span class="activity-zone">' + z.name + '</span>, workflow paused', zone: z.id };
            },
            /* Power of attorney */
            function (z) {
                return { text: 'Power of attorney registered: ' + pick(ENTITY_NAMES) + ' in <span class="activity-zone">' + z.name + '</span>, delegated authority for ' + pick(CONSENT_ACTIONS), zone: z.id };
            },

            /* ═══════════════════════════════════════
               FISCAL PRIMITIVE
               Payments, FX, tax, withholding, treasury, lending, reporting
               ═══════════════════════════════════════ */

            /* Cross-border settlement */
            function (z, z2) {
                var a = fmtA(rint(2, 95) * 1e6);
                return { text: '<span class="activity-amount">$' + a + '</span> cross-border settlement: <span class="activity-zone">' + z.name + '</span> \u2192 <span class="activity-zone">' + z2.name + '</span> via corridor', zone: z.id, zone2: z2.id };
            },
            /* Payment + FX */
            function (z, z2) {
                var a = fmtA(rint(50, 5000) * 1e3);
                return { text: '<span class="activity-amount">$' + a + '</span> payment <span class="activity-zone">' + z.name + '</span> \u2192 <span class="activity-zone">' + z2.name + '</span>, FX ' + pick(FX_PAIRS) + ' at mid', zone: z.id, zone2: z2.id };
            },
            /* Withholding tax */
            function (z, z2) {
                return { text: 'Withholding computed at ' + rint(0, 30) + '% on <span class="activity-zone">' + z.name + '</span> \u2192 <span class="activity-zone">' + z2.name + '</span> distribution per DTA', zone: z.id, zone2: z2.id };
            },
            /* Credit facility */
            function (z) {
                var a = fmtA(rint(5, 50) * 1e6);
                return { text: '<span class="activity-amount">$' + a + '</span> credit facility: ' + pick(ENTITY_NAMES) + ' in <span class="activity-zone">' + z.name + '</span>, ' + rint(150, 650) + 'bps over SOFR', zone: z.id };
            },
            /* Tax event */
            function (z) {
                var a = fmtA(rint(10, 2000) * 1e3);
                return { text: '<span class="activity-amount">$' + a + '</span> ' + pick(TAX_EVENTS) + ' recorded: ' + pick(ENTITY_NAMES) + ' in <span class="activity-zone">' + z.name + '</span>', zone: z.id };
            },
            /* Tax return generated */
            function (z) {
                return { text: 'Tax return data generated: ' + pick(ENTITY_NAMES) + ' in <span class="activity-zone">' + z.name + '</span>, FY2025, ' + rint(12, 200) + ' transactions consolidated', zone: z.id };
            },
            /* Treasury account opened */
            function (z) {
                return { text: 'Treasury account opened: ' + pick(ENTITY_NAMES) + ' in <span class="activity-zone">' + z.name + '</span>, multi-currency (USD, AED, SGD)', zone: z.id };
            },
            /* Capital call */
            function (z) {
                var a = fmtA(rint(2, 25) * 1e6);
                return { text: '<span class="activity-amount">$' + a + '</span> capital call issued: ' + pick(ENTITY_NAMES) + ' in <span class="activity-zone">' + z.name + '</span>, 14-day notice', zone: z.id };
            },
            /* Fund distribution */
            function (z) {
                var a = fmtA(rint(1, 40) * 1e6);
                return { text: '<span class="activity-amount">$' + a + '</span> distribution: ' + pick(ENTITY_NAMES) + ' in <span class="activity-zone">' + z.name + '</span>, waterfall computed, carry crystallized', zone: z.id };
            },
            /* Subscription */
            function (z) {
                var a = fmtA(rint(1, 25) * 1e6);
                return { text: '<span class="activity-amount">$' + a + '</span> subscription signed: ' + pick(ENTITY_NAMES) + ' \u2192 Fund I LP in <span class="activity-zone">' + z.name + '</span>', zone: z.id };
            },
            /* DTA applied */
            function (z, z2) {
                return { text: 'Double tax agreement applied: <span class="activity-zone">' + z.name + '</span> \u2194 <span class="activity-zone">' + z2.name + '</span>, withholding reduced from ' + rint(20, 30) + '% to ' + rint(0, 10) + '%', zone: z.id, zone2: z2.id };
            },
            /* Transfer pricing */
            function (z, z2) {
                return { text: 'Transfer pricing documentation filed: ' + pick(ENTITY_NAMES) + ', <span class="activity-zone">' + z.name + '</span> \u2194 <span class="activity-zone">' + z2.name + '</span>, arm\u2019s length confirmed', zone: z.id, zone2: z2.id };
            },
            /* Netting settlement */
            function (z, z2) {
                var a = fmtA(rint(5, 200) * 1e6);
                return { text: '<span class="activity-amount">$' + a + '</span> netting settlement: ' + rint(4, 20) + ' obligations consolidated, <span class="activity-zone">' + z.name + '</span> \u2194 <span class="activity-zone">' + z2.name + '</span>', zone: z.id, zone2: z2.id };
            },
            /* Escrow release */
            function (z) {
                var a = fmtA(rint(1, 20) * 1e6);
                return { text: '<span class="activity-amount">$' + a + '</span> escrow released: ' + pick(ENTITY_NAMES) + ' in <span class="activity-zone">' + z.name + '</span>, conditions met, funds disbursed', zone: z.id };
            },
            /* Invoice factoring */
            function (z) {
                var a = fmtA(rint(100, 5000) * 1e3);
                return { text: '<span class="activity-amount">$' + a + '</span> receivable factored: ' + pick(ENTITY_NAMES) + ' in <span class="activity-zone">' + z.name + '</span>, 90-day term, ' + rint(200, 450) + 'bps discount', zone: z.id };
            },
            /* Remittance */
            function (z, z2) {
                var a = fmtA(rint(5, 500) * 1e3);
                return { text: '<span class="activity-amount">$' + a + '</span> remittance: <span class="activity-zone">' + z.name + '</span> \u2192 <span class="activity-zone">' + z2.name + '</span>, FX ' + pick(FX_PAIRS) + ', T+0 settlement', zone: z.id, zone2: z2.id };
            },
            /* Stamp duty */
            function (z) {
                var a = fmtA(rint(1, 50) * 1e3);
                return { text: '<span class="activity-amount">$' + a + '</span> stamp duty computed: ' + pick(ASSET_TYPES) + ' transfer in <span class="activity-zone">' + z.name + '</span>', zone: z.id };
            },

            /* ═══════════════════════════════════════
               ASSETS / CORRIDOR INFRASTRUCTURE
               Origination, migration, compliance, anchoring, watchers
               ═══════════════════════════════════════ */

            /* Asset origination */
            function (z) {
                var a = fmtA(rint(1, 50) * 1e6);
                return { text: '<span class="activity-amount">$' + a + '</span> ' + pick(ASSET_TYPES) + ' originated in <span class="activity-zone">' + z.name + '</span>, SHA-256 anchored', zone: z.id };
            },
            /* Asset redomiciliation */
            function (z, z2) {
                return { text: pick(ASSET_TYPES) + ' redomiciled: <span class="activity-zone">' + z.name + '</span> \u2192 <span class="activity-zone">' + z2.name + '</span>, compliance tensor recomputed', zone: z.id, zone2: z2.id };
            },
            /* Secondary trade */
            function (z, z2) {
                var a = fmtA(rint(100, 8000) * 1e3);
                return { text: '<span class="activity-amount">$' + a + '</span> ' + pick(ASSET_TYPES) + ' traded: <span class="activity-zone">' + z.name + '</span> \u2192 <span class="activity-zone">' + z2.name + '</span>, atomic settlement', zone: z.id, zone2: z2.id };
            },
            /* Compliance tensor */
            function (z) {
                var d = rint(7, 9);
                return { text: 'Compliance tensor: ' + d + '/' + d + ' domains passed for ' + pick(ENTITY_NAMES) + ' in <span class="activity-zone">' + z.name + '</span>', zone: z.id };
            },
            /* Individual compliance domain check */
            function (z) {
                return { text: pick(COMPLIANCE_DOMAINS) + ' domain check passed: ' + pick(ENTITY_NAMES) + ' in <span class="activity-zone">' + z.name + '</span>, score 0.' + rint(85, 99), zone: z.id };
            },
            /* Corridor activation */
            function (z, z2) {
                return { text: 'Corridor <span class="activity-zone">' + z.name + '</span> \u2194 <span class="activity-zone">' + z2.name + '</span> activated, bilateral compliance passporting live', zone: z.id, zone2: z2.id };
            },
            /* Corridor checkpoint */
            function (z, z2) {
                return { text: 'Corridor checkpoint: <span class="activity-zone">' + z.name + '</span> \u2194 <span class="activity-zone">' + z2.name + '</span>, ' + rint(50, 2000) + ' transactions since last anchor', zone: z.id, zone2: z2.id };
            },
            /* Watcher attestation */
            function (z) {
                var b = rint(18000000, 19000000);
                return { text: 'Watcher attestation anchored at settlement sequence ' + b.toLocaleString('en-US') + ' for <span class="activity-zone">' + z.name + '</span> state root', zone: z.id };
            },
            /* Settlement anchor */
            function (z) {
                return { text: 'Settlement anchor: state root 0x' + hexId() + hexId() + ' for <span class="activity-zone">' + z.name + '</span>, ' + rint(100, 5000) + ' events committed', zone: z.id };
            },
            /* MMR append */
            function (z) {
                return { text: 'MMR append: leaf #' + rint(100000, 999999) + ' for <span class="activity-zone">' + z.name + '</span>, Merkle root 0x' + hexId(), zone: z.id };
            },
            /* Migration saga */
            function (z, z2) {
                var phase = pick(['lock_source', 'verify_compliance', 'transfer_custody', 'update_registry', 'confirm_settlement']);
                return { text: 'Migration saga: ' + pick(ASSET_TYPES) + ' <span class="activity-zone">' + z.name + '</span> \u2192 <span class="activity-zone">' + z2.name + '</span>, phase: ' + phase, zone: z.id, zone2: z2.id };
            },
            /* Corridor receipt */
            function (z, z2) {
                return { text: 'Corridor receipt issued: <span class="activity-zone">' + z.name + '</span> \u2192 <span class="activity-zone">' + z2.name + '</span>, receipt #' + hexId() + ', finality confirmed', zone: z.id, zone2: z2.id };
            },
            /* Watcher bond */
            function (z) {
                var a = fmtA(rint(50, 500) * 1e3);
                return { text: '<span class="activity-amount">$' + a + '</span> watcher bond posted for <span class="activity-zone">' + z.name + '</span> corridor monitoring', zone: z.id };
            },
            /* Dispute filed */
            function (z) {
                return { text: 'Dispute claim filed: ' + pick(ENTITY_NAMES) + ' in <span class="activity-zone">' + z.name + '</span>, arbitration panel assigned, 30-day window', zone: z.id };
            },
            /* Circuit breaker */
            function (z) {
                return { text: 'Circuit breaker: rate limit reached for <span class="activity-zone">' + z.name + '</span> corridor operations, throttled to ' + rint(100, 500) + ' tx/min', zone: z.id };
            },
            /* Zone state snapshot */
            function (z) {
                return { text: 'Zone state snapshot: <span class="activity-zone">' + z.name + '</span>, ' + rint(100, 50000).toLocaleString('en-US') + ' entities, ' + rint(10, 500) + ' active corridors', zone: z.id };
            }
        ];

        function generateEvent() {
            var pool = isMobile ? ZONES.slice(0, 14) : ZONES;
            var liveZones = pool.filter(function (z) { return z.status === 'live'; });
            if (liveZones.length === 0) liveZones = pool;
            var z1 = liveZones[Math.floor(Math.random() * liveZones.length)];
            var z2 = liveZones[Math.floor(Math.random() * liveZones.length)];
            while (z2.id === z1.id && liveZones.length > 1) {
                z2 = liveZones[Math.floor(Math.random() * liveZones.length)];
            }
            var tmpl = TICKER_TEMPLATES[Math.floor(Math.random() * TICKER_TEMPLATES.length)];
            return tmpl(z1, z2);
        }

        /* Activity terminal state — accessible by genesis for pause/resume */
        var activityTerminal = { el: null, intervalId: null, paused: false };

        function initActivityTerminal() {
            var hero = container.parentNode;
            if (!hero) return;

            var terminal = document.createElement('div');
            terminal.className = 'mesh-activity-terminal';
            activityTerminal.el = terminal;

            /* Header with macOS dots + title */
            var header = document.createElement('div');
            header.className = 'activity-terminal-header';
            header.innerHTML =
                '<span class="dot"></span>' +
                '<span class="dot"></span>' +
                '<span class="dot"></span>' +
                '<span class="title">network.activity.log</span>';

            /* Scrollable body */
            var body = document.createElement('div');
            body.className = 'activity-terminal-body';

            terminal.appendChild(header);
            terminal.appendChild(body);
            hero.appendChild(terminal);

            if (reducedMotion) {
                var liveCount = ZONES.filter(function (z) { return z.status === 'live'; }).length;
                body.innerHTML = '<div class="activity-line visible"><span class="activity-prompt">$</span> Network active across ' + liveCount + ' zones \u00b7 ' + CORRIDORS.length + ' corridors</div>';
                return;
            }

            /* Seed initial events */
            for (var i = 0; i < 4; i++) {
                addActivityLine(body, generateEvent(), true);
            }

            /* Continuous feed — paused during genesis */
            activityTerminal.intervalId = setInterval(function () {
                if (activityTerminal.paused) return;
                var ev = generateEvent();
                addActivityLine(body, ev, false);
                if (ev.zone) pulseZone(ev.zone);
                if (ev.zone2 && particleGroup) spawnBurst(ev.zone, ev.zone2, 3);
            }, 3500);
        }

        function addActivityLine(body, ev, immediate) {
            var line = document.createElement('div');
            line.className = 'activity-line' + (immediate ? ' visible' : '');
            line.innerHTML = '<span class="activity-prompt">$ </span>' + ev.text;
            body.appendChild(line);

            /* Limit DOM nodes */
            while (body.children.length > 20) {
                body.removeChild(body.firstChild);
            }

            /* Scroll to bottom */
            body.scrollTop = body.scrollHeight;

            /* Animate in (non-immediate) */
            if (!immediate) {
                requestAnimationFrame(function () {
                    line.classList.add('visible');
                });
            }
        }

        /* --- Zone Pulse Indicators --- */
        function pulseZone(zoneId) {
            if (reducedMotion || isMobile) return;
            var zone = zoneMap[zoneId];
            if (!zone) return;

            var pulseColor = zone.status === 'testnet' ? '#5B8A72' : '#C5A572';
            var ring = el('circle', {
                cx: zone.x,
                cy: zone.y,
                r: '8',
                fill: 'none',
                stroke: pulseColor,
                'stroke-width': '1.5',
                opacity: '0.5'
            });
            ring.style.transformBox = 'fill-box';
            ring.style.transformOrigin = 'center';
            ring.style.animation = 'zone-pulse-ring 1.5s cubic-bezier(0.16, 1, 0.3, 1) forwards';
            nodeGroup.insertBefore(ring, nodeGroup.firstChild);

            ring.addEventListener('animationend', function () {
                if (ring.parentNode) ring.parentNode.removeChild(ring);
            }, { once: true });
        }

        /* Ambient pulses independent of ticker — paused during genesis, disabled in compact */
        var ambientPulseInterval;
        if (!reducedMotion && !isMobile && !compact) {
            ambientPulseInterval = setInterval(function () {
                if (genesis.running || growth.running) return;
                var pool = visibleZones.filter(function (z) { return z.status === 'live' || z.status === 'testnet'; });
                if (pool.length > 0) {
                    var z = pool[Math.floor(Math.random() * pool.length)];
                    pulseZone(z.id);
                }
            }, 2500 + Math.random() * 2000);
        }

        /* Revenue counter removed — activity terminal conveys liveness */

        /* --- Enhanced Weighted Particle Spawning --- */
        function spawnBurst(fromId, toId, count) {
            /* Find the edge element matching this corridor pair */
            if (!particleGroup) return;
            var matchEdge = null;
            for (var ei = 0; ei < edgeElements.length; ei++) {
                var ee = edgeElements[ei];
                if ((ee.from === fromId && ee.to === toId) ||
                    (ee.from === toId && ee.to === fromId)) {
                    matchEdge = ee;
                    break;
                }
            }
            if (!matchEdge || !supportsOffsetPath) return;

            for (var bi = 0; bi < count; bi++) {
                (function (delay) {
                    setTimeout(function () {
                        if (activeParticles >= MAX_PARTICLES) return;
                        var r = 2.5 + Math.random() * 2;
                        var duration = 4 + Math.random() * 4;
                        var circle = el('circle', {
                            r: r.toFixed(1),
                            fill: '#C5A572',
                            'class': 'mesh-particle'
                        });
                        circle.style.offsetPath = 'path("' + matchEdge.d + '")';
                        circle.style.offsetRotate = '0deg';
                        circle.style.animationDuration = duration.toFixed(1) + 's';
                        particleGroup.appendChild(circle);
                        activeParticles++;
                        requestAnimationFrame(function () {
                            circle.classList.add('active');
                        });
                        circle.addEventListener('animationend', function () {
                            if (circle.parentNode) circle.parentNode.removeChild(circle);
                            activeParticles--;
                        }, { once: true });
                    }, delay * 200);
                })(bi);
            }
        }

        /* Override the default particle spawner to prefer hub corridors */
        var ambientParticleInterval = null;
        var weightedEdges = [];
        if (!reducedMotion && !isMobile && !compact && supportsOffsetPath && edgeElements.length > 0) {
            /* Build weighted edge pool: hub corridors appear 3x */
            edgeElements.forEach(function (ee) {
                var isHub = HUB_ZONES[ee.from] || HUB_ZONES[ee.to];
                var weight = isHub ? 3 : 1;
                for (var w = 0; w < weight; w++) {
                    weightedEdges.push(ee);
                }
            });

            /* Weighted ambient particle spawning */
            ambientParticleInterval = setInterval(function () {
                if (activeParticles >= MAX_PARTICLES) return;
                var edge = weightedEdges[Math.floor(Math.random() * weightedEdges.length)];
                var r = 2 + Math.random() * 2;
                var duration = 5 + Math.random() * 7;
                var circle = el('circle', {
                    r: r.toFixed(1),
                    fill: CORRIDOR_COLORS[edge.type] || '#a0877a',
                    'class': 'mesh-particle'
                });
                circle.style.offsetPath = 'path("' + edge.d + '")';
                circle.style.offsetRotate = '0deg';
                circle.style.animationDuration = duration.toFixed(1) + 's';
                particleGroup.appendChild(circle);
                activeParticles++;
                requestAnimationFrame(function () {
                    circle.classList.add('active');
                });
                circle.addEventListener('animationend', function () {
                    if (circle.parentNode) circle.parentNode.removeChild(circle);
                    activeParticles--;
                }, { once: true });
            }, 600 + Math.random() * 800);
        }

        /* ── Network Growth Simulator ──
           Demonstrates the quadratic corridor compounding thesis.
           Four phases: Current Network → Closing → Full Pipeline → 100-Zone Projection.
           Centerpiece: hub advantage ratio displayed large, growing visibly. */

        var GROWTH_WAVE_GAP = 550;
        var GROWTH_PHASE_PAUSE = 1400;
        var GROWTH_WAVES = [
            /* ——— Current Network ——— */
            { label: 'Current Network', zones: ['us-de', 'us-ny'],                                          stagger: 180 },
            { label: '',                zones: ['us-ca', 'us-nv', 'us-wy', 'us-mt'],                        stagger: 120 },
            { label: '',                zones: ['ky', 'vg'],                                                 stagger: 200 },
            { label: '',                zones: ['ae-dubai-fzc', 'ae-abudhabi-adgm', 'ae-dubai-ifza'],     stagger: 180 },
            { label: '',                zones: ['ae-dubai-difc', 'ae-dubai-dmcc', 'ae-dubai-jafza'],         stagger: 150 },
            { label: '',                zones: ['pk-sifc', 'gb', 'gb-gi'],                                   stagger: 200 },
            { label: '',                zones: ['sg', 'jp', 'au'],                                           stagger: 200 },
            { label: '',                zones: ['rw', 'ng', 'za', 'mu', 'sc'],                               stagger: 150 },
            /* ——— Testnet ——— */
            { label: 'Testnet', zones: ['hk', 'cn-hangzhou', 'pt'],                               stagger: 200 },
            { label: '',                zones: ['kz-alatau', 'hn-prospera'],                                 stagger: 200 },
            /* ——— Full Pipeline ——— */
            { label: 'Full Pipeline',   zones: ['eg', 'qa-qfc', 'cn-hainan'],                               stagger: 180 },
            { label: '',                zones: ['ke', 'tz-zanzibar', 'gm'],                                 stagger: 150 },
            { label: '',                zones: ['kr', 'id-bali', 'br-rio', 'br-floripa'],                   stagger: 150 }
        ];

        var growth = {
            running: false,
            timeouts: [],
            visibleZones: [],
            revCurrent: 0,
            revTarget: 0,
            zoneCount: 0,
            corridorCount: 0,
            factoryCount: 0,
            factoryRev: 0,
            factoryRevCurrent: 0,
            factoryUnits: 0,
            hubRatio: 0,
            hubRatioCurrent: 0,
            overlayEl: null,
            rafId: null,
            projecting: false,
            projZones: 0,
            projCorridors: 0,
            projRev: 0,
            projHub: 0,
            projFactories: 0,
            projFactoryRev: 0,
            projZonesCurrent: 0,
            projCorridorsCurrent: 0,
            projRevCurrent: 0,
            projHubCurrent: 0,
            projFactoriesCurrent: 0,
            projFactoryRevCurrent: 0
        };

        function startGrowth() {
            if (growth.running || genesis.running || isMobile || compact) {
                if (isMobile) activateAll();
                return;
            }
            if (reducedMotion) {
                growthSkipToEnd();
                return;
            }

            clearSelection();
            hideHoverCard();
            removeCard();

            growth.running = true;
            growth.timeouts = [];
            growth.visibleZones = [];
            growth.revCurrent = 0;
            growth.revTarget = 0;
            growth.zoneCount = 0;
            growth.corridorCount = 0;
            growth.factoryCount = 0;
            growth.factoryRev = 0;
            growth.factoryRevCurrent = 0;
            growth.factoryUnits = 0;
            growth.hubRatio = 0;
            growth.hubRatioCurrent = 0;
            growth.projecting = false;

            /* Hide nodes */
            allNodes.forEach(function (n) {
                n.style.transition = 'none';
                n.style.opacity = '0';
            });
            allLabels.forEach(function (l) {
                l.classList.remove('visible');
            });

            edgeGroup.style.transition = 'none';
            edgeGroup.style.opacity = '0';
            while (selectionEdgeGroup.firstChild) {
                selectionEdgeGroup.removeChild(selectionEdgeGroup.firstChild);
            }

            nodeGroup.style.pointerEvents = 'none';
            economicsPanel.style.display = 'none';
            breakdownPanel.style.display = 'none';
            if (activityTerminal.el) activityTerminal.el.style.display = 'none';
            activityTerminal.paused = true;
            if (ambientParticleInterval) clearInterval(ambientParticleInterval);

            /* Create overlay */
            var overlay = document.createElement('div');
            overlay.className = 'growth-overlay';
            overlay.innerHTML =
                '<div class="growth-hud">' +
                    '<div class="growth-phase-label"></div>' +
                    '<div class="growth-hero-ratio">0\u00d7</div>' +
                    '<div class="growth-hero-label">Hub Advantage</div>' +
                    '<div class="growth-counters">' +
                        '<div class="growth-counter-group">' +
                            '<span class="growth-zones">0</span>' +
                            '<span class="growth-counter-label">Zones</span>' +
                        '</div>' +
                        '<div class="growth-counter-group">' +
                            '<span class="growth-corridors">0</span>' +
                            '<span class="growth-counter-label">Corridors</span>' +
                        '</div>' +
                        '<div class="growth-counter-group">' +
                            '<span class="growth-factories">0</span>' +
                            '<span class="growth-counter-label">Factories</span>' +
                        '</div>' +
                        '<div class="growth-counter-group">' +
                            '<span class="growth-rev">$0</span>' +
                            '<span class="growth-counter-label">Revenue</span>' +
                        '</div>' +
                    '</div>' +
                '</div>' +
                '<button class="growth-skip" aria-label="Skip simulation">Skip</button>' +
                '<div class="growth-punchline"></div>';

            container.parentNode.appendChild(overlay);
            growth.overlayEl = overlay;

            requestAnimationFrame(function () {
                overlay.classList.add('active');
            });

            overlay.querySelector('.growth-skip').addEventListener('click', function (e) {
                e.stopPropagation();
                skipGrowth();
            });

            /* Start counter loop */
            startGrowthCounterLoop();

            /* Schedule waves — 550ms between each, extra pause at phase transitions */
            var cumulativeDelay = 600;
            GROWTH_WAVES.forEach(function (wave, i) {
                var isPhaseTransition = wave.label && i > 0;
                if (isPhaseTransition) cumulativeDelay += GROWTH_PHASE_PAUSE;
                growth.timeouts.push(setTimeout(function () {
                    if (!growth.running) return;
                    executeGrowthWave(wave);
                }, cumulativeDelay));
                cumulativeDelay += wave.stagger * Math.max(0, wave.zones.length - 1) + GROWTH_WAVE_GAP;
            });

            /* Hide phase label before projection */
            growth.timeouts.push(setTimeout(function () {
                if (!growth.running) return;
                var label = growth.overlayEl.querySelector('.growth-phase-label');
                if (label) label.classList.remove('visible');
            }, cumulativeDelay));
            cumulativeDelay += 400;

            /* Projection phase */
            growth.timeouts.push(setTimeout(function () {
                if (!growth.running) return;
                growthProjection();
            }, cumulativeDelay));
            cumulativeDelay += 4500;

            /* Punchline */
            growth.timeouts.push(setTimeout(function () {
                if (!growth.running) return;
                showGrowthPunchline();
            }, cumulativeDelay));
            cumulativeDelay += 4500;

            /* Complete */
            growth.timeouts.push(setTimeout(function () {
                growthComplete();
            }, cumulativeDelay));
        }

        function executeGrowthWave(wave) {
            if (!growth.running) return;

            /* Show phase label only on phase transitions */
            if (wave.label) {
                var label = growth.overlayEl.querySelector('.growth-phase-label');
                label.textContent = wave.label;
                label.classList.remove('visible');
                void label.offsetWidth;
                label.classList.add('visible');
            }

            /* Reveal zones in stagger */
            wave.zones.forEach(function (zoneId, i) {
                var ztid = setTimeout(function () {
                    if (!growth.running) return;
                    growthRevealZone(zoneId);
                }, i * wave.stagger);
                growth.timeouts.push(ztid);
            });
        }

        function growthRevealZone(zoneId) {
            var node = svg.querySelector('.mesh-node[data-zone="' + zoneId + '"]');
            if (!node) return;

            node.style.transition = 'opacity 0.4s cubic-bezier(0.16, 1, 0.3, 1)';
            node.style.opacity = '';

            addGenesisGlow(zoneId);

            allLabels.forEach(function (l) {
                if (l.getAttribute('data-zone') === zoneId) l.classList.add('visible');
            });

            pulseZone(zoneId);

            growth.visibleZones.push(zoneId);
            growth.zoneCount = growth.visibleZones.length;

            /* Draw corridors to all existing zones */
            drawGrowthCorridors(zoneId);

            /* Update revenue */
            var zoneEcon = ZONE_ECONOMICS[zoneId];
            if (zoneEcon) {
                growth.revTarget += zoneEcon.rev;
                if (zoneEcon.factory) {
                    growth.factoryCount++;
                    growth.factoryRev += zoneEcon.factory.rev;
                    growth.factoryUnits += zoneEcon.factory.units;
                    growth.revTarget += zoneEcon.factory.rev;
                }
            }

            for (var i = 0; i < growth.visibleZones.length - 1; i++) {
                var otherId = growth.visibleZones[i];
                growth.revTarget += corridorRevPair(zoneId, otherId);
                growth.corridorCount++;
            }

            /* Update hub ratio */
            if (growth.zoneCount >= 2) {
                growth.hubRatio = (growth.zoneCount - 1) / 2;
            }
        }

        function drawGrowthCorridors(newZoneId) {
            var newZone = zoneMap[newZoneId];
            if (!newZone) return;

            var totalCorridors = growth.corridorCount + (growth.visibleZones.length - 1);
            var corridorOpacity = totalCorridors > 200 ? 0.18 : totalCorridors > 50 ? 0.3 : totalCorridors > 15 ? 0.5 : 0.7;
            var corridorWidth = totalCorridors > 200 ? 0.8 : totalCorridors > 50 ? 1 : 1.5;

            for (var i = 0; i < growth.visibleZones.length - 1; i++) {
                var otherId = growth.visibleZones[i];
                var other = zoneMap[otherId];
                if (!other) continue;

                var a = newZone, b = other;
                var mx = (a.x + b.x) / 2;
                var my = (a.y + b.y) / 2;
                var dx = b.x - a.x;
                var dy = b.y - a.y;
                var len = Math.sqrt(dx * dx + dy * dy);
                if (len === 0) continue;
                var offset = Math.min(len * 0.08, 30);
                var cx = mx - (dy / len) * offset;
                var cy = my + (dx / len) * offset;
                var d = 'M' + a.x + ',' + a.y + 'Q' + Math.round(cx) + ',' + Math.round(cy) + ',' + b.x + ',' + b.y;

                var gcType = getCorridorType(newZoneId, otherId);
                var gcColor = gcType === 'cross' ? '#C5A572' : gcType === 'federal' ? '#8ab0c8' : gcType === 'fz-fz' ? '#a8c0a8' : '#C5A572';
                var pathEl = el('path', {
                    d: d,
                    fill: 'none',
                    stroke: gcColor,
                    'stroke-width': String(corridorWidth),
                    'stroke-opacity': String(corridorOpacity),
                    'stroke-linecap': 'round',
                    'class': 'mesh-selection-edge growth-edge'
                });

                var pathLen = 1000;
                selectionEdgeGroup.appendChild(pathEl);
                try { pathLen = pathEl.getTotalLength(); } catch (e) { /* fallback */ }
                pathEl.setAttribute('stroke-dasharray', pathLen);
                pathEl.setAttribute('stroke-dashoffset', pathLen);

                (function (p) {
                    requestAnimationFrame(function () {
                        p.setAttribute('stroke-dashoffset', '0');
                    });
                })(pathEl);
            }
        }

        function growthProjection() {
            if (!growth.running) return;

            /* Show phase label */
            var label = growth.overlayEl.querySelector('.growth-phase-label');
            label.textContent = 'At Scale';
            label.classList.remove('visible');
            void label.offsetWidth;
            label.classList.add('visible');

            /* Compute projection targets */
            var projZones = 100;
            var projCorridors = projZones * (projZones - 1) / 2;
            var projHub = (projZones - 1) / 2;

            /* Separate zone revenue from corridor + factory revenue for extrapolation */
            var totalZoneRev = 0;
            var totalFactoryRev = 0;
            growth.visibleZones.forEach(function (zid) {
                var ec = ZONE_ECONOMICS[zid];
                if (ec) {
                    totalZoneRev += ec.rev;
                    if (ec.factory) totalFactoryRev += ec.factory.rev;
                }
            });
            var totalCorrRev = growth.revTarget - totalZoneRev - totalFactoryRev;
            var avgZoneRev = totalZoneRev / Math.max(growth.zoneCount, 1);
            var avgCorrRev = growth.corridorCount > 0
                ? totalCorrRev / growth.corridorCount
                : avgZoneRev * 0.8;

            /* At 100 zones, ~20% host factories (manufacturing hubs) */
            var projFactories = 20;
            var avgFactoryRev = growth.factoryCount > 0
                ? totalFactoryRev / growth.factoryCount
                : 220000000;
            var projFactoryRev = avgFactoryRev * projFactories;
            var projRev = avgZoneRev * projZones + avgCorrRev * projCorridors + projFactoryRev;

            growth.projecting = true;
            growth.projZones = projZones;
            growth.projCorridors = projCorridors;
            growth.projRev = projRev;
            growth.projHub = projHub;
            growth.projFactories = projFactories;
            growth.projFactoryRev = projFactoryRev;
            growth.projZonesCurrent = growth.zoneCount;
            growth.projCorridorsCurrent = growth.corridorCount;
            growth.projRevCurrent = growth.revTarget;
            growth.projHubCurrent = growth.hubRatio;
            growth.projFactoriesCurrent = growth.factoryCount;
            growth.projFactoryRevCurrent = growth.factoryRev;
        }

        function showGrowthPunchline() {
            if (!growth.overlayEl) return;
            var punch = growth.overlayEl.querySelector('.growth-punchline');
            var lateEntrant = growth.projecting ? 99 : growth.zoneCount - 1;
            var hubCorridors = growth.projecting ? 4950 : growth.corridorCount;
            punch.innerHTML =
                '<span class="growth-punchline-main">' +
                'A late entrant captures ' + lateEntrant + ' corridors.<br>' +
                'The hub operator commands ' + hubCorridors.toLocaleString('en-US') + '.' +
                '</span>';
            requestAnimationFrame(function () {
                punch.classList.add('visible');
            });
        }

        function startGrowthCounterLoop() {
            var ratioEl = growth.overlayEl.querySelector('.growth-hero-ratio');
            var zonesEl = growth.overlayEl.querySelector('.growth-zones');
            var corridorsEl = growth.overlayEl.querySelector('.growth-corridors');
            var factoriesEl = growth.overlayEl.querySelector('.growth-factories');
            var revEl = growth.overlayEl.querySelector('.growth-rev');

            function tick() {
                if (!growth.overlayEl) return;

                if (growth.projecting) {
                    /* Interpolate toward projection targets */
                    growth.projZonesCurrent += (growth.projZones - growth.projZonesCurrent) * 0.04;
                    growth.projCorridorsCurrent += (growth.projCorridors - growth.projCorridorsCurrent) * 0.04;
                    growth.projRevCurrent += (growth.projRev - growth.projRevCurrent) * 0.04;
                    growth.projHubCurrent += (growth.projHub - growth.projHubCurrent) * 0.04;
                    growth.projFactoriesCurrent += (growth.projFactories - growth.projFactoriesCurrent) * 0.04;
                    growth.projFactoryRevCurrent += (growth.projFactoryRev - growth.projFactoryRevCurrent) * 0.04;

                    if (Math.abs(growth.projZones - growth.projZonesCurrent) < 0.5) growth.projZonesCurrent = growth.projZones;
                    if (Math.abs(growth.projCorridors - growth.projCorridorsCurrent) < 1) growth.projCorridorsCurrent = growth.projCorridors;
                    if (Math.abs(growth.projRev - growth.projRevCurrent) < 1000) growth.projRevCurrent = growth.projRev;
                    if (Math.abs(growth.projHub - growth.projHubCurrent) < 0.1) growth.projHubCurrent = growth.projHub;
                    if (Math.abs(growth.projFactories - growth.projFactoriesCurrent) < 0.5) growth.projFactoriesCurrent = growth.projFactories;

                    zonesEl.textContent = String(Math.round(growth.projZonesCurrent));
                    corridorsEl.textContent = Math.round(growth.projCorridorsCurrent).toLocaleString('en-US');
                    factoriesEl.textContent = String(Math.round(growth.projFactoriesCurrent));
                    revEl.textContent = fmtCurrency(growth.projRevCurrent) + '/yr';
                    ratioEl.textContent = growth.projHubCurrent.toFixed(1) + '\u00d7';
                } else {
                    /* Interpolate revenue */
                    growth.revCurrent += (growth.revTarget - growth.revCurrent) * 0.06;
                    if (Math.abs(growth.revTarget - growth.revCurrent) < 1000) {
                        growth.revCurrent = growth.revTarget;
                    }
                    growth.hubRatioCurrent += (growth.hubRatio - growth.hubRatioCurrent) * 0.08;
                    if (Math.abs(growth.hubRatio - growth.hubRatioCurrent) < 0.1) {
                        growth.hubRatioCurrent = growth.hubRatio;
                    }
                    growth.factoryRevCurrent += (growth.factoryRev - growth.factoryRevCurrent) * 0.06;
                    if (Math.abs(growth.factoryRev - growth.factoryRevCurrent) < 1000) {
                        growth.factoryRevCurrent = growth.factoryRev;
                    }

                    zonesEl.textContent = String(growth.zoneCount);
                    corridorsEl.textContent = growth.corridorCount.toLocaleString('en-US');
                    factoriesEl.textContent = String(growth.factoryCount);
                    revEl.textContent = fmtCurrency(growth.revCurrent) + '/yr';
                    ratioEl.textContent = (growth.hubRatioCurrent < 1 ? '0' : growth.hubRatioCurrent.toFixed(1)) + '\u00d7';
                }

                growth.rafId = requestAnimationFrame(tick);
            }
            growth.rafId = requestAnimationFrame(tick);
        }

        function skipGrowth() {
            if (!growth.running) return;
            growth.timeouts.forEach(function (tid) { clearTimeout(tid); });
            growth.timeouts = [];
            if (growth.rafId) { cancelAnimationFrame(growth.rafId); growth.rafId = null; }
            cancelGrowth();
        }

        /* Immediate reset to vanilla — no skip-to-end, just clean up */
        function cancelGrowth() {
            growth.running = false;
            growth.projecting = false;

            if (growth.overlayEl && growth.overlayEl.parentNode) {
                growth.overlayEl.parentNode.removeChild(growth.overlayEl);
            }
            growth.overlayEl = null;

            while (selectionEdgeGroup.firstChild) {
                selectionEdgeGroup.removeChild(selectionEdgeGroup.firstChild);
            }

            var glows = svg.querySelectorAll('.genesis-zone-glow');
            for (var g = 0; g < glows.length; g++) {
                if (glows[g].parentNode) glows[g].parentNode.removeChild(glows[g]);
            }

            allNodes.forEach(function (n) {
                n.style.transition = '';
                n.style.opacity = '';
                n.classList.remove('selected');
            });

            allLabels.forEach(function (l) {
                l.style.transition = '';
                if (!isMobile) l.classList.remove('visible');
            });

            edgeGroup.style.transition = '';
            edgeGroup.style.opacity = '';
            nodeGroup.style.pointerEvents = '';
            economicsPanel.style.display = '';
            breakdownPanel.style.display = '';
            if (activityTerminal.el) activityTerminal.el.style.display = '';
            activityTerminal.paused = false;

            selectedZones = {};
            selectedCount = 0;
            growth.visibleZones = [];
            growth.revCurrent = 0;
            growth.revTarget = 0;
            growth.zoneCount = 0;
            growth.corridorCount = 0;
            growth.factoryCount = 0;
            growth.factoryRev = 0;
            growth.factoryRevCurrent = 0;
            growth.factoryUnits = 0;
            growth.hubRatio = 0;
            growth.hubRatioCurrent = 0;
            updateEconomics();

            /* Resume ambient particles */
            if (!reducedMotion && !isMobile && supportsOffsetPath && edgeElements.length > 0 && weightedEdges && weightedEdges.length > 0) {
                ambientParticleInterval = setInterval(function () {
                    if (activeParticles >= MAX_PARTICLES) return;
                    var edge = weightedEdges[Math.floor(Math.random() * weightedEdges.length)];
                    var r = 2 + Math.random() * 2;
                    var duration = 5 + Math.random() * 7;
                    var circle = el('circle', {
                        r: r.toFixed(1),
                        fill: CORRIDOR_COLORS[edge.type] || '#a0877a',
                        'class': 'mesh-particle'
                    });
                    circle.style.offsetPath = 'path("' + edge.d + '")';
                    circle.style.offsetRotate = '0deg';
                    circle.style.animationDuration = duration.toFixed(1) + 's';
                    particleGroup.appendChild(circle);
                    activeParticles++;
                    requestAnimationFrame(function () { circle.classList.add('active'); });
                    circle.addEventListener('animationend', function () {
                        if (circle.parentNode) circle.parentNode.removeChild(circle);
                        activeParticles--;
                    }, { once: true });
                }, 700);
            }
        }

        function growthSkipToEnd() {
            growth.running = true;

            /* Show all zones */
            allNodes.forEach(function (n) {
                n.style.transition = 'none';
                n.style.opacity = '';
            });
            allLabels.forEach(function (l) {
                l.classList.add('visible');
            });

            /* Clean glows */
            var existingGlows = svg.querySelectorAll('.genesis-zone-glow');
            for (var eg = 0; eg < existingGlows.length; eg++) {
                if (existingGlows[eg].parentNode) existingGlows[eg].parentNode.removeChild(existingGlows[eg]);
            }

            /* Compute final totals for 100-zone projection */
            growth.visibleZones = ZONES.map(function (z) { return z.id; });
            growth.zoneCount = ZONES.length;
            growth.corridorCount = ZONES.length * (ZONES.length - 1) / 2;
            growth.revTarget = 0;
            growth.factoryCount = 0;
            growth.factoryRev = 0;
            growth.factoryUnits = 0;
            ZONES.forEach(function (z) {
                var econ = ZONE_ECONOMICS[z.id];
                if (econ) {
                    growth.revTarget += econ.rev;
                    if (econ.factory) {
                        growth.factoryCount++;
                        growth.factoryRev += econ.factory.rev;
                        growth.factoryUnits += econ.factory.units;
                        growth.revTarget += econ.factory.rev;
                    }
                }
            });
            var ids = growth.visibleZones;
            for (var i = 0; i < ids.length; i++) {
                for (var j = i + 1; j < ids.length; j++) {
                    growth.revTarget += corridorRevPair(ids[i], ids[j]);
                }
            }

            /* Draw all corridors */
            while (selectionEdgeGroup.firstChild) {
                selectionEdgeGroup.removeChild(selectionEdgeGroup.firstChild);
            }
            edgeGroup.style.opacity = '0.12';
            for (var ci = 0; ci < ids.length; ci++) {
                for (var cj = ci + 1; cj < ids.length; cj++) {
                    var a = zoneMap[ids[ci]], b = zoneMap[ids[cj]];
                    if (!a || !b) continue;
                    var mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
                    var dx = b.x - a.x, dy = b.y - a.y;
                    var len = Math.sqrt(dx * dx + dy * dy);
                    if (len === 0) continue;
                    var offset = Math.min(len * 0.08, 30);
                    var cx = mx - (dy / len) * offset;
                    var cy = my + (dx / len) * offset;
                    var d = 'M' + a.x + ',' + a.y + 'Q' + Math.round(cx) + ',' + Math.round(cy) + ',' + b.x + ',' + b.y;
                    var skipCType = getCorridorType(ids[ci], ids[cj]);
                    var skipCColor = skipCType === 'cross' ? '#C5A572' : skipCType === 'federal' ? '#8ab0c8' : skipCType === 'fz-fz' ? '#a8c0a8' : '#C5A572';
                    selectionEdgeGroup.appendChild(el('path', {
                        d: d, fill: 'none', stroke: skipCColor,
                        'stroke-width': '0.8', 'stroke-opacity': '0.18',
                        'stroke-linecap': 'round', 'class': 'mesh-selection-edge'
                    }));
                }
            }

            /* Show projection numbers */
            var skipZoneRev = 0;
            var skipFactoryRev = 0;
            growth.visibleZones.forEach(function (zid) {
                var ec = ZONE_ECONOMICS[zid];
                if (ec) {
                    skipZoneRev += ec.rev;
                    if (ec.factory) skipFactoryRev += ec.factory.rev;
                }
            });
            var skipCorrRev = growth.revTarget - skipZoneRev - skipFactoryRev;
            var avgZoneRev = skipZoneRev / growth.zoneCount;
            var avgCorrRev = growth.corridorCount > 0 ? skipCorrRev / growth.corridorCount : avgZoneRev * 0.8;
            var projFactories = 20;
            var avgFactoryRev = growth.factoryCount > 0 ? skipFactoryRev / growth.factoryCount : 220000000;
            var projFactoryRev = avgFactoryRev * projFactories;
            var projRev = avgZoneRev * 100 + avgCorrRev * 4950 + projFactoryRev;

            if (!growth.overlayEl) {
                var overlay = document.createElement('div');
                overlay.className = 'growth-overlay active';
                overlay.innerHTML =
                    '<div class="growth-hud">' +
                        '<div class="growth-phase-label visible">At Scale</div>' +
                        '<div class="growth-hero-ratio">49.5\u00d7</div>' +
                        '<div class="growth-hero-label">Hub Advantage</div>' +
                        '<div class="growth-counters">' +
                            '<div class="growth-counter-group">' +
                                '<span class="growth-zones">100</span>' +
                                '<span class="growth-counter-label">Zones</span>' +
                            '</div>' +
                            '<div class="growth-counter-group">' +
                                '<span class="growth-corridors">4,950</span>' +
                                '<span class="growth-counter-label">Corridors</span>' +
                            '</div>' +
                            '<div class="growth-counter-group">' +
                                '<span class="growth-factories">' + projFactories + '</span>' +
                                '<span class="growth-counter-label">Factories</span>' +
                            '</div>' +
                            '<div class="growth-counter-group">' +
                                '<span class="growth-rev">' + fmtCurrency(projRev) + '/yr</span>' +
                                '<span class="growth-counter-label">Revenue</span>' +
                            '</div>' +
                        '</div>' +
                    '</div>' +
                    '<div class="growth-punchline"></div>';
                container.parentNode.appendChild(overlay);
                growth.overlayEl = overlay;
            }

            var ratioEl = growth.overlayEl.querySelector('.growth-hero-ratio');
            var zonesEl = growth.overlayEl.querySelector('.growth-zones');
            var corridorsEl = growth.overlayEl.querySelector('.growth-corridors');
            var factoriesEl = growth.overlayEl.querySelector('.growth-factories');
            var revEl = growth.overlayEl.querySelector('.growth-rev');
            if (ratioEl) ratioEl.textContent = '49.5\u00d7';
            if (zonesEl) zonesEl.textContent = '100';
            if (corridorsEl) corridorsEl.textContent = '4,950';
            if (factoriesEl) factoriesEl.textContent = String(projFactories);
            if (revEl) revEl.textContent = fmtCurrency(projRev) + '/yr';

            showGrowthPunchline();
            growth.timeouts.push(setTimeout(growthComplete, 4000));
        }

        function growthComplete() {
            /* Phase 1: Fade overlay */
            if (growth.overlayEl) {
                growth.overlayEl.classList.remove('active');
                growth.overlayEl.classList.add('exiting');
            }
            if (growth.rafId) { cancelAnimationFrame(growth.rafId); growth.rafId = null; }

            /* Phase 2: Cross-fade corridors */
            var growthEdges = selectionEdgeGroup.querySelectorAll('.growth-edge');
            for (var gi = 0; gi < growthEdges.length; gi++) {
                growthEdges[gi].style.transition = 'opacity 1.2s cubic-bezier(0.16, 1, 0.3, 1)';
                growthEdges[gi].style.opacity = '0';
            }
            edgeGroup.style.transition = 'opacity 1.2s cubic-bezier(0.16, 1, 0.3, 1)';
            edgeGroup.style.opacity = '';

            /* Phase 3: Fade glows */
            var glows = svg.querySelectorAll('.genesis-zone-glow');
            for (var gk = 0; gk < glows.length; gk++) {
                glows[gk].style.transition = 'opacity 1s cubic-bezier(0.16, 1, 0.3, 1)';
                glows[gk].style.opacity = '0';
            }

            /* Phase 4: Fade labels */
            allLabels.forEach(function (l) {
                l.style.transition = 'opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1)';
            });

            /* Phase 5: Full cleanup */
            setTimeout(function () {
                growth.running = false;
                growth.projecting = false;

                if (growth.overlayEl && growth.overlayEl.parentNode) {
                    growth.overlayEl.parentNode.removeChild(growth.overlayEl);
                }
                growth.overlayEl = null;

                while (selectionEdgeGroup.firstChild) {
                    selectionEdgeGroup.removeChild(selectionEdgeGroup.firstChild);
                }

                var remainingGlows = svg.querySelectorAll('.genesis-zone-glow');
                for (var rg = 0; rg < remainingGlows.length; rg++) {
                    if (remainingGlows[rg].parentNode) remainingGlows[rg].parentNode.removeChild(remainingGlows[rg]);
                }

                allNodes.forEach(function (n) {
                    n.style.transition = '';
                    n.style.opacity = '';
                    n.classList.remove('selected');
                });

                allLabels.forEach(function (l) {
                    l.style.transition = '';
                    if (!isMobile) l.classList.remove('visible');
                });

                edgeGroup.style.transition = '';
                nodeGroup.style.pointerEvents = '';
                economicsPanel.style.display = '';
                breakdownPanel.style.display = '';
                if (activityTerminal.el) activityTerminal.el.style.display = '';
                activityTerminal.paused = false;

                selectedZones = {};
                selectedCount = 0;
                updateEconomics();

                /* Resume ambient particles */
                if (!reducedMotion && !isMobile && supportsOffsetPath && edgeElements.length > 0 && weightedEdges && weightedEdges.length > 0) {
                    ambientParticleInterval = setInterval(function () {
                        if (activeParticles >= MAX_PARTICLES) return;
                        var edge = weightedEdges[Math.floor(Math.random() * weightedEdges.length)];
                        var r = 2 + Math.random() * 2;
                        var duration = 5 + Math.random() * 7;
                        var circle = el('circle', {
                            r: r.toFixed(1),
                            fill: CORRIDOR_COLORS[edge.type] || '#a0877a',
                            'class': 'mesh-particle'
                        });
                        circle.style.offsetPath = 'path("' + edge.d + '")';
                        circle.style.offsetRotate = '0deg';
                        circle.style.animationDuration = duration.toFixed(1) + 's';
                        particleGroup.appendChild(circle);
                        activeParticles++;
                        requestAnimationFrame(function () { circle.classList.add('active'); });
                        circle.addEventListener('animationend', function () {
                            if (circle.parentNode) circle.parentNode.removeChild(circle);
                            activeParticles--;
                        }, { once: true });
                    }, 700);
                }
            }, 1800);
        }

        /* ── Network Genesis Animation ──
           Choreographed 30-second time-lapse: zones appear in narrative waves,
           corridors draw in, revenue accumulates, punchline lands.
           Scoped to homepage only (requires economicsPanel). */

        var GENESIS_WAVES = [
            { id: 'origin',     label: 'Origin',             zones: ['us-de'],                                                              delay: 500,   stagger: 0 },
            { id: 'caribbean',  label: 'Caribbean Bridge',   zones: ['ky', 'vg', 'hn-prospera'],                                            delay: 1050,  stagger: 280 },
            { id: 'gulf',       label: 'Gulf Cluster',       zones: ['ae-dubai-fzc', 'ae-abudhabi-adgm', 'ae-dubai-ifza'],                delay: 1880,  stagger: 280 },
            { id: 'gulf-detail',label: 'Gulf Expansion',     zones: ['ae-dubai-difc', 'ae-dubai-dmcc', 'ae-dubai-jafza'],                    delay: 2990,  stagger: 260 },
            { id: 'global',     label: 'Global Finance',     zones: ['gb', 'sg', 'hk', 'jp', 'au'],                                         delay: 4060,  stagger: 280 },
            { id: 'africa',     label: 'Africa Corridor',    zones: ['rw', 'ng', 'za', 'mu', 'sc'],                                          delay: 5730,  stagger: 260 },
            { id: 'us-mesh',    label: 'US Federal Mesh',    zones: ['us-ny', 'us-ca', 'us-nv', 'us-wy', 'us-mt', 'us-fl'],                delay: 7320,  stagger: 240 },
            { id: 'south-asia', label: 'South Asia',         zones: ['pk-sifc'],                                                            delay: 9070,  stagger: 0 },
            { id: 'europe',     label: 'Europe',             zones: ['gb-gi', 'pt'],                                                        delay: 9620,  stagger: 280 },
            { id: 'testnet', label: 'Testnet',   zones: ['kz-alatau', 'cn-hangzhou'],                                            delay: 10450, stagger: 250 },
            { id: 'pipeline',   label: 'Pipeline',           zones: ['eg', 'qa-qfc', 'cn-hainan', 'ke', 'tz-zanzibar', 'gm', 'kr', 'id-bali', 'br-rio', 'br-floripa'], delay: 11500, stagger: 130 }
        ];

        var GENESIS_BURSTS = [
            { after: 'origin',     pairs: [['us-de', 'ky']] },
            { after: 'caribbean',  pairs: [['us-de', 'ky'], ['us-de', 'vg']] },
            { after: 'gulf',       pairs: [['ae-dubai-fzc', 'ae-abudhabi-adgm']] },
            { after: 'gulf-detail', pairs: [['ae-dubai-difc', 'ae-abudhabi-adgm'], ['ae-dubai-difc', 'sg']] },
            { after: 'global',     pairs: [['gb', 'sg'], ['ae-dubai-difc', 'gb'], ['hk', 'sg']] },
            { after: 'africa',     pairs: [['ae-abudhabi-adgm', 'ke'], ['gb', 'za'], ['sc', 'ae-dubai-difc']] },
            { after: 'us-mesh',    pairs: [['us-de', 'us-ny'], ['us-ca', 'sg'], ['us-de', 'gb']] },
            { after: 'testnet', pairs: [['kz-alatau', 'ae-abudhabi-adgm']] }
        ];

        var genesis = {
            running: false,
            timeouts: [],
            visibleZones: [],
            revCurrent: 0,
            revTarget: 0,
            zoneCount: 0,
            corridorCount: 0,
            overlayEl: null,
            rafId: null
        };

        function startGenesis() {
            if (genesis.running || growth.running || isMobile || compact) {
                if (isMobile) activateAll();
                return;
            }
            if (reducedMotion) {
                genesisSkipToEnd();
                return;
            }

            /* Clear existing state BEFORE setting genesis.running
               (clearSelection checks genesis.running and would skipGenesis) */
            clearSelection();
            hideHoverCard();
            removeCard();

            genesis.running = true;
            genesis.timeouts = [];
            genesis.visibleZones = [];
            genesis.revCurrent = 0;
            genesis.revTarget = 0;
            genesis.zoneCount = 0;
            genesis.corridorCount = 0;

            /* Hide all nodes instantly */
            allNodes.forEach(function (n) {
                n.style.transition = 'none';
                n.style.opacity = '0';
            });
            allLabels.forEach(function (l) {
                l.classList.remove('visible');
            });

            /* Hide base corridors and clear selection layer */
            edgeGroup.style.transition = 'none';
            edgeGroup.style.opacity = '0';
            while (selectionEdgeGroup.firstChild) {
                selectionEdgeGroup.removeChild(selectionEdgeGroup.firstChild);
            }

            /* Disable interaction */
            nodeGroup.style.pointerEvents = 'none';

            /* Hide economics/breakdown panels and activity terminal */
            economicsPanel.style.display = 'none';
            breakdownPanel.style.display = 'none';
            if (activityTerminal.el) activityTerminal.el.style.display = 'none';
            activityTerminal.paused = true;

            /* Pause ambient particles */
            if (ambientParticleInterval) clearInterval(ambientParticleInterval);

            /* Create overlay */
            var overlay = document.createElement('div');
            overlay.className = 'genesis-overlay';
            overlay.innerHTML =
                '<div class="genesis-hud">' +
                    '<div class="genesis-counters">' +
                        '<div class="genesis-counter-group">' +
                            '<span class="genesis-rev">$0</span>' +
                            '<span class="genesis-counter-label">Network Revenue</span>' +
                        '</div>' +
                        '<div class="genesis-counter-group">' +
                            '<span class="genesis-zones">0</span>' +
                            '<span class="genesis-counter-label">Zones</span>' +
                        '</div>' +
                        '<div class="genesis-counter-group">' +
                            '<span class="genesis-corridors">0</span>' +
                            '<span class="genesis-counter-label">Corridors</span>' +
                        '</div>' +
                    '</div>' +
                    '<div class="genesis-wave-label"></div>' +
                '</div>' +
                '<button class="genesis-skip" aria-label="Skip animation">Skip</button>' +
                '<div class="genesis-punchline"></div>';

            container.parentNode.appendChild(overlay);
            genesis.overlayEl = overlay;

            requestAnimationFrame(function () {
                overlay.classList.add('active');
            });

            overlay.querySelector('.genesis-skip').addEventListener('click', function (e) {
                e.stopPropagation();
                skipGenesis();
            });

            /* Start counter interpolation loop */
            startGenesisCounterLoop();

            /* Schedule all waves */
            GENESIS_WAVES.forEach(function (wave) {
                var tid = setTimeout(function () { executeWave(wave); }, wave.delay);
                genesis.timeouts.push(tid);
            });

            /* Schedule punchline and completion */
            genesis.timeouts.push(setTimeout(showPunchline, 14100));
            genesis.timeouts.push(setTimeout(genesisComplete, 18100));
        }

        function executeWave(wave) {
            if (!genesis.running) return;

            if (wave.label) showWaveLabel(wave.label);

            wave.zones.forEach(function (zoneId, i) {
                var tid = setTimeout(function () {
                    if (!genesis.running) return;
                    revealZone(zoneId);
                }, i * wave.stagger);
                genesis.timeouts.push(tid);
            });

            /* Fire bursts after last zone in wave */
            var burstDelay = wave.zones.length * wave.stagger + 300;
            GENESIS_BURSTS.forEach(function (burst) {
                if (burst.after === wave.id) {
                    var tid = setTimeout(function () {
                        if (!genesis.running) return;
                        burst.pairs.forEach(function (pair) {
                            spawnBurst(pair[0], pair[1], 4);
                        });
                    }, burstDelay);
                    genesis.timeouts.push(tid);
                }
            });
        }

        /* Golden glow halo — appears behind each zone during genesis */
        function addGenesisGlow(zoneId) {
            var zone = zoneMap[zoneId];
            if (!zone) return;
            var glow = el('circle', {
                cx: zone.x,
                cy: zone.y,
                r: '28',
                fill: '#C5A572',
                opacity: '0',
                'class': 'genesis-zone-glow'
            });
            nodeGroup.insertBefore(glow, nodeGroup.firstChild);
            requestAnimationFrame(function () {
                glow.style.transition = 'opacity 1s cubic-bezier(0.16, 1, 0.3, 1)';
                glow.style.opacity = '0.18';
            });
        }

        function revealZone(zoneId) {
            var node = svg.querySelector('.mesh-node[data-zone="' + zoneId + '"]');
            if (!node) return;

            /* Reveal node */
            node.style.transition = 'opacity 0.5s cubic-bezier(0.16, 1, 0.3, 1)';
            node.style.opacity = '';

            /* Golden glow halo behind node */
            addGenesisGlow(zoneId);

            /* Show label */
            allLabels.forEach(function (l) {
                if (l.getAttribute('data-zone') === zoneId) l.classList.add('visible');
            });

            /* Pulse ring */
            pulseZone(zoneId);

            /* Track and compute */
            genesis.visibleZones.push(zoneId);
            genesis.zoneCount = genesis.visibleZones.length;

            /* Draw corridors to all previously visible zones */
            drawGenesisCorridors(zoneId);

            /* Update revenue target */
            var zoneEcon = ZONE_ECONOMICS[zoneId];
            if (zoneEcon) genesis.revTarget += zoneEcon.rev;

            /* Corridor revenue for all new pairs */
            for (var i = 0; i < genesis.visibleZones.length - 1; i++) {
                var otherId = genesis.visibleZones[i];
                genesis.revTarget += corridorRevPair(zoneId, otherId);
                genesis.corridorCount++;
            }
        }

        function drawGenesisCorridors(newZoneId) {
            var newZone = zoneMap[newZoneId];
            if (!newZone) return;

            var totalCorridors = genesis.corridorCount + (genesis.visibleZones.length - 1);
            var corridorOpacity = totalCorridors > 200 ? 0.2 : totalCorridors > 50 ? 0.35 : totalCorridors > 15 ? 0.55 : 0.75;
            var corridorWidth = totalCorridors > 200 ? 1 : 1.5;

            for (var i = 0; i < genesis.visibleZones.length - 1; i++) {
                var otherId = genesis.visibleZones[i];
                var other = zoneMap[otherId];
                if (!other) continue;

                var a = newZone, b = other;
                var mx = (a.x + b.x) / 2;
                var my = (a.y + b.y) / 2;
                var dx = b.x - a.x;
                var dy = b.y - a.y;
                var len = Math.sqrt(dx * dx + dy * dy);
                if (len === 0) continue;
                var offset = Math.min(len * 0.08, 30);
                var cx = mx - (dy / len) * offset;
                var cy = my + (dx / len) * offset;
                var d = 'M' + a.x + ',' + a.y + 'Q' + Math.round(cx) + ',' + Math.round(cy) + ',' + b.x + ',' + b.y;

                var pathEl = el('path', {
                    d: d,
                    fill: 'none',
                    stroke: '#C5A572',
                    'stroke-width': String(corridorWidth),
                    'stroke-opacity': String(corridorOpacity),
                    'stroke-linecap': 'round',
                    'class': 'mesh-selection-edge genesis-edge'
                });

                /* Stroke-dashoffset draw-in animation */
                var pathLen = 1000; /* safe default */
                selectionEdgeGroup.appendChild(pathEl);
                try { pathLen = pathEl.getTotalLength(); } catch (e) { /* fallback */ }
                pathEl.setAttribute('stroke-dasharray', pathLen);
                pathEl.setAttribute('stroke-dashoffset', pathLen);

                /* Trigger draw via rAF */
                (function (p) {
                    requestAnimationFrame(function () {
                        p.setAttribute('stroke-dashoffset', '0');
                    });
                })(pathEl);
            }
        }

        function startGenesisCounterLoop() {
            var revEl = genesis.overlayEl.querySelector('.genesis-rev');
            var zonesEl = genesis.overlayEl.querySelector('.genesis-zones');
            var corridorsEl = genesis.overlayEl.querySelector('.genesis-corridors');

            function tick() {
                if (!genesis.overlayEl) return;

                /* Lerp revenue */
                genesis.revCurrent += (genesis.revTarget - genesis.revCurrent) * 0.06;
                if (Math.abs(genesis.revTarget - genesis.revCurrent) < 1000) {
                    genesis.revCurrent = genesis.revTarget;
                }

                revEl.textContent = fmtCurrency(genesis.revCurrent) + '/yr';
                zonesEl.textContent = String(genesis.zoneCount);
                corridorsEl.textContent = String(genesis.corridorCount);

                genesis.rafId = requestAnimationFrame(tick);
            }
            genesis.rafId = requestAnimationFrame(tick);
        }

        function showWaveLabel(text) {
            if (!genesis.overlayEl) return;
            var label = genesis.overlayEl.querySelector('.genesis-wave-label');
            label.textContent = text;
            label.classList.remove('visible');
            /* Force reflow */
            void label.offsetWidth;
            label.classList.add('visible');
            var tid = setTimeout(function () {
                label.classList.remove('visible');
            }, 1800);
            genesis.timeouts.push(tid);
        }

        function showPunchline() {
            if (!genesis.overlayEl) return;
            var punch = genesis.overlayEl.querySelector('.genesis-punchline');
            var lateEntrant = genesis.zoneCount - 1;
            punch.innerHTML =
                '<span class="genesis-punchline-main">' +
                'A late entrant captures ' + lateEntrant + ' corridors.<br>' +
                'The hub operator commands ' + genesis.corridorCount.toLocaleString('en-US') + '.' +
                '</span>';
            requestAnimationFrame(function () {
                punch.classList.add('visible');
            });
        }

        function skipGenesis() {
            if (!genesis.running) return;

            /* Clear all scheduled timeouts */
            genesis.timeouts.forEach(function (tid) { clearTimeout(tid); });
            genesis.timeouts = [];
            if (genesis.rafId) cancelAnimationFrame(genesis.rafId);

            genesisSkipToEnd();
        }

        function genesisSkipToEnd() {
            genesis.running = true; /* ensure guards stay active */

            /* Show all zones instantly (no .selected — genesis uses glow halos) */
            allNodes.forEach(function (n) {
                n.style.transition = 'none';
                n.style.opacity = '';
            });
            allLabels.forEach(function (l) {
                l.classList.add('visible');
            });

            /* Clean up any existing genesis glows */
            var existingGlows = svg.querySelectorAll('.genesis-zone-glow');
            for (var eg = 0; eg < existingGlows.length; eg++) {
                if (existingGlows[eg].parentNode) existingGlows[eg].parentNode.removeChild(existingGlows[eg]);
            }

            /* Compute final totals */
            genesis.visibleZones = ZONES.map(function (z) { return z.id; });
            genesis.zoneCount = ZONES.length;
            genesis.corridorCount = ZONES.length * (ZONES.length - 1) / 2;
            genesis.revTarget = 0;
            ZONES.forEach(function (z) {
                var econ = ZONE_ECONOMICS[z.id];
                if (econ) genesis.revTarget += econ.rev;
            });
            var ids = genesis.visibleZones;
            for (var i = 0; i < ids.length; i++) {
                for (var j = i + 1; j < ids.length; j++) {
                    genesis.revTarget += corridorRevPair(ids[i], ids[j]);
                }
            }
            genesis.revCurrent = genesis.revTarget;

            /* Draw all corridors at once */
            while (selectionEdgeGroup.firstChild) {
                selectionEdgeGroup.removeChild(selectionEdgeGroup.firstChild);
            }
            edgeGroup.style.opacity = '0.12';
            for (var ci = 0; ci < ids.length; ci++) {
                for (var cj = ci + 1; cj < ids.length; cj++) {
                    var a = zoneMap[ids[ci]], b = zoneMap[ids[cj]];
                    if (!a || !b) continue;
                    var mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
                    var dx = b.x - a.x, dy = b.y - a.y;
                    var len = Math.sqrt(dx * dx + dy * dy);
                    if (len === 0) continue;
                    var offset = Math.min(len * 0.08, 30);
                    var cx = mx - (dy / len) * offset;
                    var cy = my + (dx / len) * offset;
                    var d = 'M' + a.x + ',' + a.y + 'Q' + Math.round(cx) + ',' + Math.round(cy) + ',' + b.x + ',' + b.y;
                    selectionEdgeGroup.appendChild(el('path', {
                        d: d, fill: 'none', stroke: '#C5A572',
                        'stroke-width': '1', 'stroke-opacity': '0.2',
                        'stroke-linecap': 'round', 'class': 'mesh-selection-edge'
                    }));
                }
            }

            /* Create overlay if not present (reduced-motion path) */
            if (!genesis.overlayEl) {
                var overlay = document.createElement('div');
                overlay.className = 'genesis-overlay active';
                overlay.innerHTML =
                    '<div class="genesis-hud">' +
                        '<div class="genesis-counters">' +
                            '<div class="genesis-counter-group">' +
                                '<span class="genesis-rev">' + fmtCurrency(genesis.revTarget) + '/yr</span>' +
                                '<span class="genesis-counter-label">Network Revenue</span>' +
                            '</div>' +
                            '<div class="genesis-counter-group">' +
                                '<span class="genesis-zones">' + genesis.zoneCount + '</span>' +
                                '<span class="genesis-counter-label">Zones</span>' +
                            '</div>' +
                            '<div class="genesis-counter-group">' +
                                '<span class="genesis-corridors">' + genesis.corridorCount + '</span>' +
                                '<span class="genesis-counter-label">Corridors</span>' +
                            '</div>' +
                        '</div>' +
                    '</div>' +
                    '<div class="genesis-punchline"></div>';
                container.parentNode.appendChild(overlay);
                genesis.overlayEl = overlay;
            }

            /* Update counters directly */
            var revEl = genesis.overlayEl.querySelector('.genesis-rev');
            var zonesEl = genesis.overlayEl.querySelector('.genesis-zones');
            var corridorsEl = genesis.overlayEl.querySelector('.genesis-corridors');
            if (revEl) revEl.textContent = fmtCurrency(genesis.revTarget) + '/yr';
            if (zonesEl) zonesEl.textContent = String(genesis.zoneCount);
            if (corridorsEl) corridorsEl.textContent = String(genesis.corridorCount);

            showPunchline();
            genesis.timeouts.push(setTimeout(genesisComplete, 4000));
        }

        function genesisComplete() {
            /* ── Smooth multi-phase cross-dissolve exit ──
               No instant state changes — everything transitions gracefully. */

            /* Phase 1: Fade overlay (0ms) */
            if (genesis.overlayEl) {
                genesis.overlayEl.classList.remove('active');
                genesis.overlayEl.classList.add('exiting');
            }
            if (genesis.rafId) { cancelAnimationFrame(genesis.rafId); genesis.rafId = null; }

            /* Phase 2: Cross-fade corridors — gold out, normal in */
            var genesisEdges = selectionEdgeGroup.querySelectorAll('.genesis-edge');
            for (var gi = 0; gi < genesisEdges.length; gi++) {
                genesisEdges[gi].style.transition = 'opacity 1.2s cubic-bezier(0.16, 1, 0.3, 1)';
                genesisEdges[gi].style.opacity = '0';
            }
            edgeGroup.style.transition = 'opacity 1.2s cubic-bezier(0.16, 1, 0.3, 1)';
            edgeGroup.style.opacity = '';

            /* Phase 3: Fade genesis glow halos */
            var glows = svg.querySelectorAll('.genesis-zone-glow');
            for (var gk = 0; gk < glows.length; gk++) {
                glows[gk].style.transition = 'opacity 1s cubic-bezier(0.16, 1, 0.3, 1)';
                glows[gk].style.opacity = '0';
            }

            /* Phase 4: Fade labels (start immediately, 0.8s) */
            allLabels.forEach(function (l) {
                l.style.transition = 'opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1)';
            });

            /* Phase 5: Full cleanup after transitions settle */
            setTimeout(function () {
                genesis.running = false;

                /* Remove overlay DOM */
                if (genesis.overlayEl && genesis.overlayEl.parentNode) {
                    genesis.overlayEl.parentNode.removeChild(genesis.overlayEl);
                }
                genesis.overlayEl = null;

                /* Clear genesis corridors */
                while (selectionEdgeGroup.firstChild) {
                    selectionEdgeGroup.removeChild(selectionEdgeGroup.firstChild);
                }

                /* Remove glow circles */
                var remainingGlows = svg.querySelectorAll('.genesis-zone-glow');
                for (var rg = 0; rg < remainingGlows.length; rg++) {
                    if (remainingGlows[rg].parentNode) remainingGlows[rg].parentNode.removeChild(remainingGlows[rg]);
                }

                /* Reset node styles */
                allNodes.forEach(function (n) {
                    n.style.transition = '';
                    n.style.opacity = '';
                    n.classList.remove('selected');
                });

                /* Reset labels */
                allLabels.forEach(function (l) {
                    l.style.transition = '';
                    if (!isMobile) l.classList.remove('visible');
                });

                edgeGroup.style.transition = '';

                /* Re-enable interaction */
                nodeGroup.style.pointerEvents = '';
                economicsPanel.style.display = '';
                breakdownPanel.style.display = '';
                if (activityTerminal.el) activityTerminal.el.style.display = '';
                activityTerminal.paused = false;

                /* Clean selection state */
                selectedZones = {};
                selectedCount = 0;
                updateEconomics();

                /* Resume ambient particles */
                if (!reducedMotion && !isMobile && supportsOffsetPath && edgeElements.length > 0 && weightedEdges && weightedEdges.length > 0) {
                    ambientParticleInterval = setInterval(function () {
                        if (activeParticles >= MAX_PARTICLES) return;
                        var edge = weightedEdges[Math.floor(Math.random() * weightedEdges.length)];
                        var r = 2 + Math.random() * 2;
                        var duration = 5 + Math.random() * 7;
                        var circle = el('circle', {
                            r: r.toFixed(1),
                            fill: CORRIDOR_COLORS[edge.type] || '#a0877a',
                            'class': 'mesh-particle'
                        });
                        circle.style.offsetPath = 'path("' + edge.d + '")';
                        circle.style.offsetRotate = '0deg';
                        circle.style.animationDuration = duration.toFixed(1) + 's';
                        particleGroup.appendChild(circle);
                        activeParticles++;
                        requestAnimationFrame(function () { circle.classList.add('active'); });
                        circle.addEventListener('animationend', function () {
                            if (circle.parentNode) circle.parentNode.removeChild(circle);
                            activeParticles--;
                        }, { once: true });
                    }, 700);
                }
            }, 1800);
        }

        /* Initialize live dashboard features (skip in compact mode) */
        if (!compact) initActivityTerminal();

        /* ── CustomEvent bridge — explore.js terminal drives mesh highlights ── */
        if (compact) {
            var SHORT_TO_LONG = {
                'adgm': 'ae-abudhabi-adgm', 'dfzc': 'ae-dubai-fzc', 'difc': 'ae-dubai-difc',
                'dmcc': 'ae-dubai-dmcc', 'jafza': 'ae-dubai-jafza', 'ifza': 'ae-dubai-ifza',
                'pk': 'pk-sifc', 'kz': 'kz-alatau', 'prospera': 'hn-prospera',
                'us': 'us-de', 'us-fl': 'us-fl', 'us-ny': 'us-ny', 'us-ca': 'us-ca',
                'us-nv': 'us-nv', 'us-wy': 'us-wy', 'us-mt': 'us-mt',
                'gi': 'gb-gi', 'br-rio': 'br-rio', 'br-floripa': 'br-floripa',
                'id-bali': 'id-bali', 'cn-hainan': 'cn-hainan', 'cn-hangzhou': 'cn-hangzhou',
                'qa': 'qa-qfc', 'tz': 'tz-zanzibar'
            };

            function resolveId(short) {
                return SHORT_TO_LONG[short] || short;
            }

            window.addEventListener('mesh:highlight', function (e) {
                var zones = (e.detail && e.detail.zones) || [];
                for (var i = 0; i < zones.length; i++) {
                    highlightZone(resolveId(zones[i]));
                }
            });

            window.addEventListener('mesh:pulse', function (e) {
                if (!e.detail || !e.detail.zone) return;
                pulseZone(resolveId(e.detail.zone));
            });

            window.addEventListener('mesh:burst', function (e) {
                if (!e.detail) return;
                var from = resolveId(e.detail.from);
                var to = resolveId(e.detail.to);
                var count = e.detail.count || 5;
                spawnBurst(from, to, count);
            });

            window.addEventListener('mesh:trace', function (e) {
                if (!e.detail) return;
                var from = resolveId(e.detail.from);
                var to = resolveId(e.detail.to);
                /* Highlight both zones */
                highlightZone(from);
                highlightZone(to);
                /* Brighten the specific corridor edge */
                allEdges.forEach(function (edge) {
                    var ef = edge.getAttribute('data-from');
                    var et = edge.getAttribute('data-to');
                    if ((ef === from && et === to) || (ef === to && et === from)) {
                        edge.classList.add('highlight');
                        edge._prevStroke = edge.getAttribute('stroke');
                        edge.setAttribute('stroke', '#C5A572');
                        edge.setAttribute('stroke-opacity', '0.9');
                        edge.setAttribute('stroke-width', '2.5');
                    }
                });
            });

            window.addEventListener('mesh:clear', function () {
                clearHighlight();
            });
        }

        /* ── Teardown — clears all intervals before rebuild ── */
        if (_teardown) _teardown();
        _teardown = function () {
            if (activityTerminal.intervalId) { clearInterval(activityTerminal.intervalId); activityTerminal.intervalId = null; }
            if (ambientPulseInterval) { clearInterval(ambientPulseInterval); ambientPulseInterval = null; }
            if (ambientParticleInterval) { clearInterval(ambientParticleInterval); ambientParticleInterval = null; }
        };

        /* ── Visibility — pause intervals when mesh is off-screen ── */
        if (_visibilityObs) _visibilityObs.disconnect();
        var meshVisible = true;
        _visibilityObs = new IntersectionObserver(function (entries) {
            var isVisible = entries[0].isIntersecting;
            if (isVisible === meshVisible) return;
            meshVisible = isVisible;
            if (!isVisible) {
                /* Pause: clear intervals to stop DOM/SVG churn */
                if (activityTerminal.intervalId) { clearInterval(activityTerminal.intervalId); activityTerminal.intervalId = null; }
                if (ambientPulseInterval) { clearInterval(ambientPulseInterval); ambientPulseInterval = null; }
                if (ambientParticleInterval) { clearInterval(ambientParticleInterval); ambientParticleInterval = null; }
            } else {
                /* Resume: restart intervals (only if not in genesis/growth and not reduced motion) */
                if (!activityTerminal.intervalId && !reducedMotion) {
                    var termBody = activityTerminal.el && activityTerminal.el.querySelector('.activity-terminal-body');
                    if (termBody) {
                        activityTerminal.intervalId = setInterval(function () {
                            if (activityTerminal.paused) return;
                            var ev = generateEvent();
                            addActivityLine(termBody, ev, false);
                            if (ev.zone) pulseZone(ev.zone);
                            if (ev.zone2 && particleGroup) spawnBurst(ev.zone, ev.zone2, 3);
                        }, 3500);
                    }
                }
                if (!ambientPulseInterval && !reducedMotion && !isMobile) {
                    ambientPulseInterval = setInterval(function () {
                        if (genesis.running || growth.running) return;
                        var pool = visibleZones.filter(function (z) { return z.status === 'live' || z.status === 'testnet'; });
                        if (pool.length > 0) {
                            var z = pool[Math.floor(Math.random() * pool.length)];
                            pulseZone(z.id);
                        }
                    }, 2500 + Math.random() * 2000);
                }
                if (!ambientParticleInterval && !reducedMotion && !isMobile && supportsOffsetPath && weightedEdges.length > 0) {
                    ambientParticleInterval = setInterval(function () {
                        if (activeParticles >= MAX_PARTICLES) return;
                        var edge = weightedEdges[Math.floor(Math.random() * weightedEdges.length)];
                        var r = 2 + Math.random() * 2;
                        var duration = 5 + Math.random() * 7;
                        var circle = el('circle', {
                            r: r.toFixed(1),
                            fill: '#C5A572',
                            opacity: '0.7',
                            'class': 'mesh-particle'
                        });
                        circle.style.offsetPath = 'path("' + edge.d + '")';
                        circle.style.offsetRotate = '0deg';
                        circle.style.animationDuration = duration.toFixed(1) + 's';
                        particleGroup.appendChild(circle);
                        activeParticles++;
                        requestAnimationFrame(function () {
                            circle.classList.add('active');
                        });
                        circle.addEventListener('animationend', function () {
                            if (circle.parentNode) circle.parentNode.removeChild(circle);
                            activeParticles--;
                        }, { once: true });
                    }, 600 + Math.random() * 800);
                }
            }
        }, { threshold: 0 });
        _visibilityObs.observe(container);

        /* ── Resize ── */
        if (_resizeHandler) window.removeEventListener('resize', _resizeHandler);
        var resizeTimer;
        _resizeHandler = function () {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(function () {
                var newMobile = window.innerWidth < 768;
                if (newMobile !== isMobile) {
                    /* Clear intervals before rebuild to prevent leaks */
                    if (_teardown) _teardown();
                    container.innerHTML = '';
                    init(containerId, opts);
                } else if (!isMobile && !compact) {
                    /* Desktop: update container height to maintain SVG aspect ratio.
                       Mobile/compact: CSS controls height; skip pixel override. */
                    var w = container.getBoundingClientRect().width || container.offsetWidth || 960;
                    container.style.height = Math.round(w * (VH / VW)) + 'px';
                }
            }, 300);
        };
        window.addEventListener('resize', _resizeHandler);
    }

    window.MomentumMesh = { init: init };
})();
