#!/usr/bin/bash

git pull
node ./refresh.js
git commit -am "auto-refresh"
git push
