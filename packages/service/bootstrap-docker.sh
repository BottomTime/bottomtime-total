#!/usr/bin/env bash
set -e

if [ "$NODE_ENV" = "production" ]
then
  echo "Starting in production mode..."
  npx pm2 start --no-daemon dist/main.js
else
  echo "Starting in development mode..."
  yarn admin db init && yarn admin db seed
  yarn migrate:up
  yarn serve
fi
