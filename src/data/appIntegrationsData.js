/**
 * Central master registry of all live TSE Apps and their genuine third-party service integrations.
 * Verified directly from current production code and server configuration.
 * Extensible data structure allowing new apps and integrations to be added seamlessly.
 */

export const appIntegrationsData = [
  {
    appId: 'website-manager',
    appName: 'Website Manager',
    appDomain: 'tse-website-manager.thesearchequation.co.uk',
    appDescription: 'Central SEO management, single-page sync, and W7 Social video publishing platform.',
    integrations: [
      {
        id: 'wm-meta-graph',
        name: 'Meta (Facebook & Instagram)',
        officialUrl: 'https://developers.facebook.com/',
        purpose: 'OAuth token authentication, Facebook Business Page video/text publishing, and Instagram account linking.',
        type: 'OAuth / Social Media',
        status: 'Active'
      },
      {
        id: 'wm-bundle-social',
        name: 'bundle.social',
        officialUrl: 'https://bundle.social/',
        purpose: 'Automated multi-account social media post scheduling and video publishing dispatch to Facebook & Instagram pages.',
        type: 'Publishing API',
        status: 'Active'
      },
      {
        id: 'wm-creatomate',
        name: 'Creatomate',
        officialUrl: 'https://creatomate.com/',
        purpose: 'Cloud automated video template rendering engine for generating MP4 social video assets with custom typography and themes.',
        type: 'Video Generation API',
        status: 'Active'
      },
      {
        id: 'wm-google-gemini',
        name: 'Google Gemini & Veo 2',
        officialUrl: 'https://ai.google.dev/',
        purpose: 'Multimodal AI engine for social caption generation, Veo 2 AI video generation, image analysis, and automated marketing copy.',
        type: 'Generative AI',
        status: 'Active'
      },
      {
        id: 'wm-ga4',
        name: 'Google Analytics GA4',
        officialUrl: 'https://analytics.google.com/',
        purpose: 'Real-time traffic measurement, user event tracking, and page view performance metrics sync for managed sites.',
        type: 'Analytics API',
        status: 'Active'
      },
      {
        id: 'wm-gsc',
        name: 'Google Search Console',
        officialUrl: 'https://search.google.com/search-console',
        purpose: 'Search performance tracking, index coverage verification, and keyword ranking metrics synchronization.',
        type: 'SEO Analytics',
        status: 'Active'
      },
      {
        id: 'wm-gtm',
        name: 'Google Tag Manager',
        officialUrl: 'https://tagmanager.google.com/',
        purpose: 'Programmatic tag provisioning, container configuration, and tracking pixel deployment across managed sites.',
        type: 'Tag Management',
        status: 'Active'
      },
      {
        id: 'wm-dataforseo',
        name: 'DataForSEO',
        officialUrl: 'https://dataforseo.com/',
        purpose: 'Live SERP position tracking, keyword rank checking, and search volume estimation API.',
        type: 'SEO & SERP API',
        status: 'Active'
      },
      {
        id: 'wm-wordpress',
        name: 'WordPress REST API',
        officialUrl: 'https://wordpress.org/',
        purpose: 'Remote CMS management, single-page sync, and direct SEO title/description metadata pushing via REST API.',
        type: 'CMS Integration',
        status: 'Active'
      },
      {
        id: 'wm-supabase',
        name: 'Supabase',
        officialUrl: 'https://supabase.com/',
        purpose: 'Cloud database hosting, remote asset storage, and portfolio snapshot backups.',
        type: 'Database & Storage',
        status: 'Active'
      }
    ]
  },
  {
    appId: 'lead-generator',
    appName: 'Lead Generator',
    appDomain: 'lead-gen.thesearchequation.co.uk',
    appDescription: 'B2B lead discovery, domain auditing, saved search management, and outreach campaign platform.',
    integrations: [
      {
        id: 'lg-dataforseo',
        name: 'DataForSEO',
        officialUrl: 'https://dataforseo.com/',
        purpose: 'Business lead discovery, domain WHOIS verification, SERP keyword matching, and contact email extraction.',
        type: 'SEO & Lead API',
        status: 'Active'
      },
      {
        id: 'lg-supabase',
        name: 'Supabase',
        officialUrl: 'https://supabase.com/',
        purpose: 'Remote cloud database synchronization for saved searches, shortlisted prospects, and outreach pack metadata.',
        type: 'Database & Cloud',
        status: 'Active'
      },
      {
        id: 'lg-resend-smtp',
        name: 'Resend / SMTP',
        officialUrl: 'https://resend.com/',
        purpose: 'System outreach email delivery, partnership email previews, and automated outreach campaign dispatch.',
        type: 'Email API',
        status: 'Active'
      }
    ]
  },
  {
    appId: 'site-registry',
    appName: 'Site Registry',
    appDomain: 'site-registry.thesearchequation.co.uk',
    appDescription: 'Central backlink inventory repository, Fatima placement management, and indexing verification system.',
    integrations: [
      {
        id: 'sr-supabase',
        name: 'Supabase / PostgreSQL',
        officialUrl: 'https://supabase.com/',
        purpose: 'Enterprise backlink repository hosting (46 tables, domain authority data, Fatima campaign tracking).',
        type: 'Database Hosting',
        status: 'Active'
      },
      {
        id: 'sr-dataforseo',
        name: 'DataForSEO',
        officialUrl: 'https://dataforseo.com/',
        purpose: 'Backlink metrics verification, domain authority lookup, and live backlink placement indexing checks.',
        type: 'SEO & Backlink API',
        status: 'Active'
      },
      {
        id: 'sr-indexnow',
        name: 'IndexNow',
        officialUrl: 'https://www.indexnow.org/',
        purpose: 'Instant search engine indexing pings for newly published backlink articles and target pages.',
        type: 'Indexing API',
        status: 'Active'
      },
      {
        id: 'sr-resend',
        name: 'Resend',
        officialUrl: 'https://resend.com/',
        purpose: 'Automated notification email delivery for backlink verification reports and index checks.',
        type: 'Email Service',
        status: 'Active'
      },
      {
        id: 'sr-ahrefs',
        name: 'Ahrefs API',
        officialUrl: 'https://ahrefs.com/',
        purpose: 'Historical domain rating (DR) and organic traffic benchmarking for backlink sources.',
        type: 'SEO Analytics',
        status: 'Configured'
      }
    ]
  },
  {
    appId: 'website-builder',
    appName: 'Website Builder',
    appDomain: 'website-builder.thesearchequation.co.uk',
    appDescription: 'AI-assisted full site creation engine, page brief mapper, and WordPress deployment suite.',
    integrations: [
      {
        id: 'wb-openai',
        name: 'OpenAI / GPT-4',
        officialUrl: 'https://openai.com/',
        purpose: 'Automated AI website copy generation, page brief mapping, and service area content composition.',
        type: 'Generative AI',
        status: 'Active'
      },
      {
        id: 'wb-gtm-ga4',
        name: 'Google Tag Manager & GA4',
        officialUrl: 'https://tagmanager.google.com/',
        purpose: 'Programmatic GTM container creation and GA4 tracking code insertion into built websites.',
        type: 'Analytics & Tags',
        status: 'Active'
      },
      {
        id: 'wb-google-fonts',
        name: 'Google Fonts',
        officialUrl: 'https://fonts.google.com/',
        purpose: 'Web font delivery and dynamic typography embedding for custom website themes.',
        type: 'Font Asset CDN',
        status: 'Active'
      },
      {
        id: 'wb-supabase',
        name: 'Supabase',
        officialUrl: 'https://supabase.com/',
        purpose: 'Cloud storage for website project briefs, generated pages, and site architecture manifests.',
        type: 'Cloud Storage',
        status: 'Active'
      },
      {
        id: 'wb-wordpress',
        name: 'WordPress REST API',
        officialUrl: 'https://wordpress.org/',
        purpose: 'Automated remote site setup and direct theme/page deployment to target WordPress hosting.',
        type: 'CMS Deployment',
        status: 'Active'
      }
    ]
  },
  {
    appId: 'keyword-research',
    appName: 'Keyword Research',
    appDomain: 'keyword-research.thesearchequation.co.uk',
    appDescription: 'Keyword clustering, search volume analysis, and static site generator engine.',
    integrations: [
      {
        id: 'kr-dataforseo',
        name: 'DataForSEO',
        officialUrl: 'https://dataforseo.com/',
        purpose: 'In-depth keyword research, search volume retrieval, keyword difficulty scoring, and SERP clustering.',
        type: 'SEO Data API',
        status: 'Active'
      },
      {
        id: 'kr-openai',
        name: 'OpenAI / GPT-4',
        officialUrl: 'https://openai.com/',
        purpose: 'Keyword clustering intent classification, semantic content outline generation, and legal/location page drafting.',
        type: 'Generative AI',
        status: 'Active'
      },
      {
        id: 'kr-unsplash',
        name: 'Unsplash Stock Photos',
        officialUrl: 'https://unsplash.com/',
        purpose: 'Automatic royalty-free stock photo asset fetching and placement in generated static website packages.',
        type: 'Media Asset API',
        status: 'Active'
      },
      {
        id: 'kr-supabase',
        name: 'Supabase',
        officialUrl: 'https://supabase.com/',
        purpose: 'Project persistence, keyword cluster history storage, and approved site structure manifests.',
        type: 'Database Hosting',
        status: 'Active'
      }
    ]
  },
  {
    appId: 'auth-service',
    appName: 'Auth / Apps Hub',
    appDomain: 'auth.thesearchequation.co.uk',
    appDescription: 'Central Single Sign-On (SSO) authentication portal and unified application launcher.',
    integrations: [
      {
        id: 'auth-google-oauth',
        name: 'Google OAuth 2.0 / Identity',
        officialUrl: 'https://developers.google.com/identity',
        purpose: 'Single Sign-On (SSO) authentication for TSE team members across all connected ecosystem applications.',
        type: 'OAuth & Identity',
        status: 'Active'
      }
    ]
  },
  {
    appId: 'page-auditor',
    appName: 'Page Auditor',
    appDomain: 'api-page-auditor.thesearchequation.co.uk',
    appDescription: 'Core Web Vitals, accessibility, and synthetic browser SEO performance audit engine.',
    integrations: [
      {
        id: 'pa-pagespeed',
        name: 'Google PageSpeed Insights API',
        officialUrl: 'https://pagespeed.webdev.google/',
        purpose: 'Automated Core Web Vitals audit engine measuring LCP, CLS, INP, and performance scores for candidate pages.',
        type: 'Performance Audit',
        status: 'Active'
      },
      {
        id: 'pa-lighthouse',
        name: 'Google Lighthouse',
        officialUrl: 'https://developer.chrome.com/docs/lighthouse/',
        purpose: 'Server-side synthetic browser auditing for SEO compliance, accessibility, and web best practices.',
        type: 'Audit Engine',
        status: 'Active'
      }
    ]
  },
  {
    appId: 'leadgen-deployer',
    appName: 'TSE Lodged Deployer',
    appDomain: 'leadgen-deployer.thesearchequation.co.uk',
    appDescription: 'Isolated leadgen website hosting provisioning and SSL deployment supervisor.',
    integrations: [
      {
        id: 'tld-nginx',
        name: 'Nginx Web Server',
        officialUrl: 'https://nginx.org/',
        purpose: 'Reverse proxy routing, Let\'s Encrypt SSL certificate termination, and static build hosting.',
        type: 'Web Server / Proxy',
        status: 'Active'
      }
    ]
  }
]
