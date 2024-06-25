#!/usr/bin/env bash
set -e

if [ "$NODE_ENV" = "production" ]
then
  echo "Starting in production mode..."
  yarn serve
else
  echo "Starting in development mode..."
  yarn dev
fi
