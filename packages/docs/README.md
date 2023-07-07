# Bottom Time API Documentation

This is where the documentation for the Bottom Time APIs lives. It is powered by [Swagger UI](https://swagger.io/tools/swagger-ui/).

The actual documentation can be found in the `public/specs.yml` file. The file contents themselves are actually maintained on [SwaggerHub](https://app.swaggerhub.com/) - please do not manually edit them here.

## Viewing the Documentation

The simplest way to view the documentation is to build and run the Docker container:

```bash
yarn docker:build
yarn docker:run
```

The documentation can now be viewed at [http://localhost:3200/](http://localhost:3200/).

## Linting/Inspecting the Spec File

Linting is provided by the [Redocly]() library. You can run the linter by running:

```bash
yarn lint
```
