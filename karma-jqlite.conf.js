var angularFiles = require('./angularFiles');
var sharedConfig = require('./karma-shared.conf');

module.exports = function(config) {
  sharedConfig(config, {testName: 'AngularJS: jqLite', logFile: 'karma-jqlite.log'});

  config.set({
    files: angularFiles.mergeFilesFor('karma'),
    exclude: angularFiles.mergeFilesFor('karmaExclude'),

    junitReporter: {
      outputDir: 'test_out/jqlite/',
      suite: 'jqLite'
    }
  });
};
