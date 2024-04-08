# Bottom Time Platform

This is the monorepo for the Bottom Time platform.

[![CircleCI](https://dl.circleci.com/status-badge/img/gh/BottomTime/bottomtime-total/tree/master.svg?style=svg&circle-token=fcbae3dbe936da2e349f0f31929cfb2239ff2f29)](https://dl.circleci.com/status-badge/redirect/gh/BottomTime/bottomtime-total/tree/master)
[![Maintainability](https://api.codeclimate.com/v1/badges/6864b76f24d3ab0dc0e9/maintainability)](https://codeclimate.com/repos/644ace3578e41301035de81f/maintainability)
[![Test Coverage](https://api.codeclimate.com/v1/badges/6864b76f24d3ab0dc0e9/test_coverage)](https://codeclimate.com/repos/644ace3578e41301035de81f/test_coverage)

Documentation for the individual components can be found in their respective README files. Keep reading for instructions
on first-time setup and running the platform locally.

- [Backend Service](packages/service/README.md)
- [Web Front-End](packages/web/README.md)
- [Deployment (Terraform)](terraform/README.md)

## Dependencies

There are a few dependencies that you will have to have installed to work with the platform.

### Homebrew

If you are developing on MacOS, you'll want to install the [Homebrew](https://brew.sh/) package manager.
It will make installing the other dependencies much easier.

### Node.js

You'll need the [Node.js](https://nodejs.org/en) runtime to run the platform. The platform is currently built on Node v20.

It is recommended that you use Node Version Manager ([NVM](https://github.com/nvm-sh/nvm#readme)) to manage your
Node installations. It will allow you to have multiple versions of Node.js installed at once and easily switch
between them.

Once NVM is installed, you can simply run the following to install and activate Node.js v20.x

```bash
nvm install 20
nvm use 20
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

### LIBVIPS

> **NOTE:** This _might_ be necessary depending on your system. At the time of this writing it is required, on dev machines running MacOS on Apple Silicon.
> Results may vary on other platforms.

This is a library used for image manipulation. It is a dependency of the [Sharp](https://sharp.pixelplumbing.com/) library.
Sharp will attempt to build this from source if it is not found on your system when Sharp is initially installed via yarn.
If you run into issues where Sharp complains that it cannot load the correct version of the library
then install the correct version manually and then use yarn to force sharp to reinstall using the appropriate version of libvips.

```bash
brew install vips
yarn workspace @bottomtime/service add --force sharp
```

### Terraform

If you plan on deploying a running version of the platform to AWS then you'll need
[Terraform](https://developer.hashicorp.com/terraform/tutorials/aws-get-started/install-cli) installed.

## Working With the Platform as a Whole

The platform uses [Lerna](https://lerna.js.org/) to manage the monorepo. Several operations can be done at the root level of the repository to work on the platform holistically.

The commands in this section must be run from the root directory of the repository.

### Installing all Node modules for the entire platform

```bash
yarn
```

**Note:** This operation may take several minutes on the first run. This is because it will also perform a
number of preparation steps like installing Git hooks and downloading/installing the Playwright runtime for
running end-to-end tests.

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

**NOTE:** Testing is dependent on a Postgres database instance. The easiest way to achieve this is by running the
platform locally using Docker Compose (see below) while running the tests.

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
the changes right away.

```bash
docker-compose watch
```
