# Bottom Time Platform

This is the monorepo for the Bottom Time platform.

[![CircleCI](https://dl.circleci.com/status-badge/img/gh/BottomTime/bottomtime-total/tree/master.svg?style=svg&circle-token=fcbae3dbe936da2e349f0f31929cfb2239ff2f29)](https://dl.circleci.com/status-badge/redirect/gh/BottomTime/bottomtime-total/tree/master)
[![Maintainability](https://api.codeclimate.com/v1/badges/6864b76f24d3ab0dc0e9/maintainability)](https://codeclimate.com/repos/644ace3578e41301035de81f/maintainability)
[![Test Coverage](https://api.codeclimate.com/v1/badges/6864b76f24d3ab0dc0e9/test_coverage)](https://codeclimate.com/repos/644ace3578e41301035de81f/test_coverage)

Documentation on the individual components can be found in their respective README files.

- [Core (Backend) Service](packages/service/README.md)
- [Web (Vite + Vue) Front-End](packages/vite/README.md)
- [Deployment (Terraform)](terraform/README.md)

## Dependencies

There are a few dependencies that you will have to have installed to work with the platform.

### Node.js

You'll need [Node.js](https://nodejs.org/en). The platform is currently built for version 20. (The LTS at the time of this writing.) It is recommended that you use [NVM](https://github.com/nvm-sh/nvm#readme) to manage your Node installation.

### Yarn

Once you have Node.js installed you'll need the Yarn package manager installed globally. Install with:

```bash
npm i -g yarn
```

### PostgreSQL

The backend database is powered by [PostgreSQL](https://www.postgresql.org/). First head over to the [download](https://www.postgresql.org/download/) page to get the Postgres server installed locally.

In addition, you will also need to install the PostGIS extension for PostgreSQL. This allows, indexing of GPS
coordinates for doing searches for sites in specific areas. It can be downloaded and installed following the instructions [here](https://postgis.net/documentation/getting_started/).

Once PostgreSQL and PostGIS are installed, you'll want to create a new Postgres user that can create and manage the
application's databases:

```bash
psql postgres -c "CREATE USER bt_user WITH PASSWORD 'bt_admin1234' SUPERUSER;"
```

Your local Postgres server should be ready for use now. See the README for the [backend service](packages/service/README.md)
for instructions on how to initialize your development database so you can begin using the platform locally. However, for now,
continue reading to finish installing the remaining platform dependencies.

### Docker and Docker Compose

The components of the platform each have `Dockerfile`s and the platform can be run as a whole using Docker Compose. You can Docker from [here](https://docs.docker.com/get-docker/) if you don't already have it installed.

### AWS CLI

Install the AWS CLI tool by following the directions [here](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html).

Once installed, you'll need to set your AWS credentials and default region in order to deploy the platform to your AWS environment. To do so run

```bash
aws configure
```

and enter your key, secret, and region when prompted. (By default `us-east-1` can be used as the region.)

### Terraform

If you plan on deploying a running version of the platform to AWS then you'll need [Terraform](https://developer.hashicorp.com/terraform/tutorials/aws-get-started/install-cli) installed.

## Working With the Platform as a Whole

The platform uses [Lerna](https://lerna.js.org/) to manage the monorepo. Several operations can be done at the root level of the repository to work on the platform holistically.

The commands in this section must be run from the root directory of the repository.

### Installing all Node modules for the entire platform

```bash
yarn
```

**Note:** This operation may take several minutes on the first run. This is because it will also perform a number of preparation steps like downloading/installing the Playwright runtime, generating the API docs, initializing the database, and
installing Git hooks.

### Formatting all files

```bash
yarn format
```

### Linting all files

```bash
yarn lint
```

Eslint and Prettier will be used for linting and formatting most files.

### Running all test suites (including end-to-end tests)

```bash
yarn test
```

### Compiling all projects

```bash
yarn build
```

This will result in compiled, minified versions of the core and web libraries being created in `dist/` directories in their respective `packages/` folders.

I.e.

- `packages/core/dist/` and
- `packages/vite/dist/`

## Running the whole platform locally

You can work on individual components separately. (See their respective README files for details on each component.)

Alternatively, you can quickly stand up the whole platform by using Docker Compose.

```bash
docker-compose up
```

If you need to rebuild any of the images due to code changes you can run

```bash
docker-compose build
```
