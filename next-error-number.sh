#!/bin/bash

# TODO(vojta): migrate to grunt, move the number into package.json
error_num=`cat angularjs-error.txt`
error_num=$((error_num+1))

if [ "$1" = "update" ]; then
  echo "Error number ${error_num} marked as used"
  echo ${error_num} > angularjs-error.txt
else
  echo "Please Use Error Number: ${error_num}"
fi
