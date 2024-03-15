#!/usr/bin/env bash
set -e

if [ $NODE_ENV = "production" ]; then
  echo "Production mode!"
  exit 1
fi

echo "Not production!"
