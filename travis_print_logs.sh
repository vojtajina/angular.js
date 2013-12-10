#!/bin/bash

LOG_FILES=$LOGS_DIR/*

for FILE in $LOG_FILES; do
  echo -e "\n\n\n"
  echo -en "travis_fold:start:$FILE\r"
  echo "================================================================================"
  echo " $FILE"
  echo "================================================================================"
  cat $FILE
  echo -en "travis_fold:end:$FILE\r"
done
