#!/bin/bash

set -e

if [ $BROWSER_PROVIDER = "saucelabs" ]; then
  export SAUCE_ACCESS_KEY=`echo $SAUCE_ACCESS_KEY | rev`
  BROWSERS="SL_Chrome,SL_Safari,SL_Firefox,SL_IE_8,SL_IE_9,SL_IE_10,SL_IE_11"
  E2E_BROWSERS="SL_Chrome"
elif [ $BROWSER_PROVIDER = "browserstack" ]; then
  BROWSERS="BS_Chrome,BS_Safari,BS_Firefox,BS_IE_8,BS_IE_9,BS_IE_10,BS_IE_11"
  E2E_BROWSERS="BS_Chrome"
else
  BROWSERS="Chrome"
  E2E_BROWSERS="Chrome"
fi


if [ $JOB = "unit" ]; then
  grunt ci-checks
  grunt test:docgen
  grunt test:promises-aplus
  grunt test:unit --browsers $BROWSERS --reporters dots
elif [ $JOB = "e2e" ]; then
  grunt test:e2e --browsers $E2E_BROWSERS --reporters dots --port 9090
else
  echo "Unknown job type. Please set JOB=unit or JOB=e2e."
fi
