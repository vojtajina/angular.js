#!/bin/bash

set -e

if [ $BROWSER_PROVIDER = "saucelabs" ]; then
  ./lib/sauce/sauce_connect_setup.sh
elif [ $BROWSER_PROVIDER = "browserstack" ]; then
  ./lib/browser-stack/start-tunnel.sh
else
  echo "Unknown browser provider. Please set BROWSER_PROVIDER=saucelabs or BROWSER_PROVIDER=browserstack."
fi
