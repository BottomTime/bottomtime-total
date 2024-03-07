#!/usr/bin/env bash

psql -d postgres -c 'CREATE USER IF NOT EXISTS bt_user WITH PASSWORD "bt_admin1234" CREATEDB;'
psql -d postgres -c 'CREATE DATABASE IF NOT EXISTS bottomtime_local WITH OWNER bt_user;'

psql -d bottomtime_local -c ''
