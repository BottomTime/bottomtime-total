#!/usr/bin/env bash

psql -d postgres << EOF
DO \$\$
  BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles users WHERE users.rolname = 'bt_user')
    THEN
      CREATE USER bt_user WITH PASSWORD 'bt_admin1234' SUPERUSER;
      RAISE NOTICE 'User "bt_user" created';
    ELSE
      RAISE NOTICE 'User "bt_user" already exists';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_database WHERE datname = 'bottomtime_local')
    THEN
      CREATE DATABASE bottomtime_local WITH OWNER bt_user;
      RAISE NOTICE 'Database "bottomtime_local" created';
    ELSE
      RAISE NOTICE 'Database "bottomtime_local" already exists';
    END IF;
  END;
\$\$
EOF

psql -d bottomtime_local -c 'CREATE EXTENSION IF NOT EXISTS "postgis";'

ECHO ""
ECHO "🎉 Local database has been initialized. 🎉"
ECHO "  Database: bottomtime_local"
ECHO "  User:     bt_user"
ECHO "  Password: bt_admin1234"

ECHO ""
ECHO "Next steps:"
ECHO "  1. Run migrations to create tables and indexes: yarn migrate:up"
