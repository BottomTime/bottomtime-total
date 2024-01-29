# Bottom Time Platform

This is the monorepo for the Bottom Time platform.

[![CircleCI](https://dl.circleci.com/status-badge/img/gh/BottomTime/bottomtime-total/tree/master.svg?style=svg&circle-token=fcbae3dbe936da2e349f0f31929cfb2239ff2f29)](https://dl.circleci.com/status-badge/redirect/gh/BottomTime/bottomtime-total/tree/master)
[![Maintainability](https://api.codeclimate.com/v1/badges/6864b76f24d3ab0dc0e9/maintainability)](https://codeclimate.com/repos/644ace3578e41301035de81f/maintainability)
[![Test Coverage](https://api.codeclimate.com/v1/badges/6864b76f24d3ab0dc0e9/test_coverage)](https://codeclimate.com/repos/644ace3578e41301035de81f/test_coverage)

Documentation on the individual components can be found in their respective README files.

- [Core Service](packages/service/README.md)
- [Web (Vite + Vue) Front-End](packages/web/README.md)
- [Interactive API Documentation](packages/docs/README.md)
- [Deployment (Terraform)](terraform/README.md)

## Dependencies

There are a few dependencies that you will have to have installed to work with the platform.

### Node.js

You'll need [Node.js](https://nodejs.org/en). The platform is currently built for version 18. (The LTS at the time of this writing.) It is recommended that you use [NVM](https://github.com/nvm-sh/nvm#readme) to manage your Node installation.

### Yarn

Once you have Node.js installed you'll need the Yarn package manager installed globally. Install with:

```bash
npm i -g yarn
```

### MongoDb

The platform uses [MongoDb](https://www.mongodb.com/docs/manual/installation/) to persist its data. You'll want to have version 5 installed to host your databases.

### Docker

The components of the platform each have `Dockerfile`s and the platform can be run as a whole using Docker Compose. You can Docker from [here](https://docs.docker.com/get-docker/) if you don't already have it installed.

### Mutagen Compose

`TODO`

### Terraform and AWS CLI

If you plan on deploying a running version of the platform to AWS then you'll need [Terraform](https://developer.hashicorp.com/terraform/tutorials/aws-get-started/install-cli) and the [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html) installed.

If you have not done so already, you'll need to set your AWS credentials and default region in order to deploy the platform to your AWS environment. To do so run

```bash
aws configure
```

and enter your key, secret, and region when prompted.

## Working With the Platform as a Whole

The platform uses [Lerna](https://lerna.js.org/) to manage the monorepo. Several operations can be done at the root level of the repository to work on the platform holistically.

The commands in this section must be run from the root directory of the repository.

### Installing all Node modules for the entire platform

```bash
yarn
```

**Note:** This will also install Git hooks to automatically format files correctly on commit! :tada:

### Formatting all files

```bash
yarn format
```

### Linting all files

```bash
yarn lint
```

Eslint will be used for linting most files. Redocly will be used to validate the API documentation.

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
- `packages/web/dist/`

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

**Note:** This is not the most convenient way to work and I'm looking at using [Mutagen Compose](https://mutagen.io/documentation/orchestration/compose) to make this much nicer.
