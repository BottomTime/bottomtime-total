# Bottom Time Platform

This is the monorepo for the Bottom Time platform.

[![CircleCI](https://dl.circleci.com/status-badge/img/gh/BottomTime/bottomtime-total/tree/master.svg?style=svg&circle-token=fcbae3dbe936da2e349f0f31929cfb2239ff2f29)](https://dl.circleci.com/status-badge/redirect/gh/BottomTime/bottomtime-total/tree/master)
[![Maintainability](https://api.codeclimate.com/v1/badges/6864b76f24d3ab0dc0e9/maintainability)](https://codeclimate.com/repos/644ace3578e41301035de81f/maintainability)
[![Test Coverage](https://api.codeclimate.com/v1/badges/6864b76f24d3ab0dc0e9/test_coverage)](https://codeclimate.com/repos/644ace3578e41301035de81f/test_coverage)

Documentation for the individual components can be found in their respective README files. Keep reading for instructions
on first-time setup and running the platform locally.

- [Backend Service](packages/service/README.md) - The platform's backend API service.
- [Web Front-End](packages/web/README.md) - Vite/Vue web front-end.
- [Email Service](packages/emails/README.md) - Service that handles the generation and transmission of emails to users.
- [Deployment](terraform/README.md) - Deployment files (Terraform).
- [API Client](packages/api/README.md) - The API client used by the front-end to request data from the backend.
  Also defines types and data structures used in communication.
- [Common Lib](packages/common/README.md) - A small library of resources shared between multiple services.

## Dependencies

There are a few dependencies that you will have to have installed to work with the platform.

### Homebrew

If you are developing on MacOS, you'll want to install the [Homebrew](https://brew.sh/) package manager.
It will make installing the other dependencies much easier.

### Node.js

You'll need the [Node.js](https://nodejs.org/en) runtime to run the platform. The platform is currently built on Node v22.

It is recommended that you use Node Version Manager ([NVM](https://github.com/nvm-sh/nvm#readme)) to manage your
Node installations. It will allow you to have multiple versions of Node.js installed at once and easily switch
between them.

Once NVM is installed, you can simply run the following to install and activate Node.js v22.x

```bash
nvm install 22
nvm use 22
```

### Yarn

Once you have Node.js installed you'll need the Yarn package manager installed globally. Install with:

```bash
npm i -g yarn
```

### Docker and Docker Compose

The components of the platform each have `Dockerfile`s and the platform can be run as a whole using Docker Compose.
You can install Docker from [here](https://docs.docker.com/get-docker/) if you don't already have it installed.

### AWS CLI

Install the AWS CLI tool by following the directions [here](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html).

Once installed, you'll need to set your AWS credentials and default region in order to deploy the platform to your AWS environment. To do so run

```bash
aws configure
```

and enter your key, secret, and region when prompted. (`us-east-1` can be used as the region.)

### Terraform

If you plan on deploying a running version of the platform to AWS then you'll need
[Terraform](https://developer.hashicorp.com/terraform/tutorials/aws-get-started/install-cli) installed.

## Working With the Platform as a Whole

The platform uses [Lerna](https://lerna.js.org/) to manage the monorepo. Several operations can be done at the root level of the repository to work on the platform holistically.

The commands in this section must be run from the root directory of the repository.

### Installing all Node modules for the entire platform

Occasionally, you will need to update the project dependencies. This can easily done by running the `yarn` command in the project root:

```bash
yarn
```

If you have just checked out the repository you will also want to run

```bash
yarn prepare
```

> **Note:** This operation may take several minutes on the first run. This is because it will also perform a
> number of preparation steps including

- installing Git hooks
- downloading/installing the Playwright runtime for running end-to-end tests
- creating initial `.env` files
- etc...

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

> **NOTE:** Testing is dependent on a Postgres database instance. The easiest way to achieve this is by running the
> platform locally using Docker Compose (see below) while running the tests.

> **NOTE:** Running the entire test suite at the same time may be very memory/CPU-intensive depending on your machine. You
> might want to avoid this and instead scope your test run to the part of the project you are working on and its dependencies.

**Example:**

```bash
yarn test --scope=@bottomtime/web
```

### Compiling all packages

```bash
yarn build
```

## Running the Platform Locally

You can work on individual components separately. (See their respective README files for details on each component.)

Alternatively, you can quickly stand up the whole platform by using Docker Compose.

```bash
docker-compose up
```

If you need to rebuild any of the images you can run

```bash
docker-compose build
```

And, of course, for local development you can run Docker Compose in watch mode. It will automatically monitor changes
to source files and sync the files with the running containers so you can make live updates to the platform and see
the changes right away. With the front-end, you will also benefit from Vue hot reloading!

```bash
docker-compose watch
```

## Other Notes to Developers

### Upgrading Node Version

When it comes time to upgrade to a newer version of Node.js updates will need to be made in the following places:

- Update any instructions here in this and any other README.md files.
- Update the CircleCI config file at `.circleci/config.yml`. Update all references to Node Docker images so that the project is being built on the correct version. Try to be precise with your version number. (I.e. `20.14` instead of just `20`).
- Update the Dockerfiles (`Dockerfile.*`) in the project root - ensure that they are being built with images using the correct version of Node.js.
- Don't forget to upgrade your own local Node.js runtime: `nvm install <version> && nvm use <version>`

> **IMPORTANT:** The libraries in the repositories are built to run in AWS' serverless environment (Lambda). The version of Node you are using
> must have a supported runtime. You can check which versions of Node.js AWS Lambda supports
> [here](https://docs.aws.amazon.com/lambda/latest/dg/lambda-runtimes.html#runtimes-supported).
