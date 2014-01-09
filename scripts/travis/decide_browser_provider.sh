#!/bin/bash

if [ $(( $TRAVIS_BUILD_NUMBER % 2 )) -eq 0 ]; then
  echo "browserstack"
else
  echo "saucelabs"
fi
