var angularFiles = require('./angularFiles');
var sharedConfig = require('./karma-shared.conf');

module.exports = function(config) {
  sharedConfig(config, {testName: 'AngularJS: modules', logFile: 'karma-modules.log'});

  config.set({
    files: angularFiles.mergeFilesFor('karmaModules', 'angularSrcModules'),

    junitReporter: {
      outputDir: 'test_out/modules/',
      suite: 'modules'
    }
  });
};
