#!/usr/bin/env bash
set -e

if [ "$NODE_ENV" = "production" ]
then
  echo "Starting in production mode..."
  yarn build
  # npx pm2 start --no-daemon src/index.ts
else
  echo "Starting in development mode..."
  yarn serve
fi

