module.exports = {
  ci: {
    collect: {
      numberOfRuns: 3,
      startServerCommand: 'npm run serve:ssr:app',
      url: [
        'http://localhost:4000/en/home/',
        'http://localhost:4000/en/solutions/',
        'http://localhost:4000/en/blog/',
        'http://localhost:4000/en/contact/',
        'http://localhost:4000/en/about-us/'
      ],
      settings: [
        { preset: 'desktop' },
        { preset: 'perf', emulatedFormFactor: 'mobile', throttling: { rttMs: 40, throughputKbps: 10240, cpuSlowdownMultiplier: 4 } }
      ],
    },
    assert: {
      assertions: {
        'categories:performance':    ['error', { minScore: 0.8  }],
        'categories:accessibility':  ['error', { minScore: 0.9  }],
        'categories:best-practices': ['error', { minScore: 0.85 }],
        'categories:seo':            ['error', { minScore: 0.95 }],
        // Core Web Vitals — Google top-ranking thresholds
        'largest-contentful-paint':  ['error', { maxNumericValue: 2500 }],
        'cumulative-layout-shift':   ['error', { maxNumericValue: 0.1  }],
        'total-blocking-time':       ['error', { maxNumericValue: 300  }],
        'first-contentful-paint':    ['warn',  { maxNumericValue: 1800 }],
        'interactive':               ['warn',  { maxNumericValue: 3800 }],
        'speed-index':               ['warn',  { maxNumericValue: 3400 }],
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};
