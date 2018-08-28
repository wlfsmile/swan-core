// Karma configuration
// Generated on Sat May 26 2018 11:59:58 GMT+0800 (CST)
const webpackConfig = require('../webpack.config.js');

module.exports = function(config) {
  config.set({

    basePath: '..',

    frameworks: ['jasmine'],

    customContextFile: 'test/swan-context.html',

    files: [
        'test/mock/mock.js',
        'test/mock/master.mock.js',
        'test/spec/*.spec.js',
        'test/util/*.js',
        {pattern: 'test/mock/slave.mock.js', included: false, served: true},
        {pattern: 'test/spec/util.spec.js', included: false}
    ],

    client: {
        jasmine: {
            random: false,
            timeoutInterval: 10000
        }
    },

    exclude: [
      '**/*.swp'
    ],

    preprocessors: {
        'test/mock/master.mock.js': ['webpack']
    },
    webpack: webpackConfig,

    webpackMiddleware: {
        noInfo: true
    },

    reporters: ['spec', 'coverage'],
    coverageReporter: {
        dir: 'test/coverage',
        reporters: [{
                type: 'lcov',
                subdir: '.'
            },
            {
                type: 'text-summary'
            }
        ]
    },

    port: 9876,

    colors: true,

    logLevel: config.LOG_INFO,

    autoWatch: true,

    browsers: ['Chrome'],

    customLaunchers: {
        Chrome_travis_ci: {
            base: 'Chrome',
            flags: ['--no-sandbox']
        }
    },

    singleRun: false,

    concurrency: Infinity
  })
}
