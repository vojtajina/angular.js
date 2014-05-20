#!/bin/bash

set -e

export SAUCE_ACCESS_KEY=`echo $SAUCE_ACCESS_KEY | rev`

if [ $JOB = "unit" ]; then
  if [ $BROWSER_PROVIDER = "sl" ]; then
    BROWSERS=SL_Chrome,SL_Safari,SL_Firefox,SL_IE_9,SL_IE_10,SL_IE_11
  elif [ $BROWSER_PROVIDER = "bs" ]; then
    BROWSERS=BS_Chrome,BS_Safari,BS_Firefox,BS_IE_9,BS_IE_10,BS_IE_11
  fi

  grunt ci-checks
  grunt test:promises-aplus
  grunt test:unit --browsers $BROWSERS --reporters dots
  grunt tests:docs --browsers $BROWSERS --reporters dots
elif [ $JOB = "e2e" ]; then
  export TARGET_SPECS="build/docs/ptore2e/**/*jqlite_test.js"
  if [ $TEST_TARGET = "jquery" ]; then
    TARGET_SPECS="build/docs/ptore2e/**/*jquery_test.js"
  elif [ $TEST_TARGET = "doce2e" ]; then
    TARGET_SPECS="test/e2e/docsAppE2E.js"
  fi
  grunt test:travis-protractor --specs "$TARGET_SPECS"
else
  echo "Unknown job type. Please set JOB=unit or JOB=e2e-*."
fi
