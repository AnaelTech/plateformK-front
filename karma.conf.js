// Karma configuration complète (Angular) + seuils de couverture minimaux.
module.exports = function (config) {
  config.set({
    basePath: '',
    frameworks: ['jasmine', '@angular-devkit/build-angular'],
    plugins: [
      require('karma-jasmine'),
      require('karma-chrome-launcher'),
      require('karma-jasmine-html-reporter'),
      require('karma-coverage'),
      require('@angular-devkit/build-angular/plugins/karma'),
    ],
    client: {
      jasmine: {},
      clearContext: false,
    },
    jasmineHtmlReporter: {
      suppressAll: true,
    },
    coverageReporter: {
      dir: 'coverage/plateform-k',
      subdir: '.',
      reporters: [{ type: 'text-summary' }, { type: 'html' }, { type: 'lcov' }],
      check: {
        global: {
          statements: 39,
          branches: 22,
          functions: 29,
          lines: 39,
        },
      },
    },
    reporters: ['progress', 'kjhtml'],
    browsers: ['ChromeHeadless'],
    restartOnFileChange: true,
  });
};
