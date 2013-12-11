#!/bin/bash

LOG_FILES=$LOGS_DIR/*

for FILE in $LOG_FILES; do
  echo -e "\n\n\n"
  echo -e "travis_fold:start:$FILE"
  echo "================================================================================"
  echo " $FILE"
  echo "================================================================================"
  cat $FILE
  echo -e "travis_fold:end:$FILE"
done
