# Vue/Vite Web Front-End

This service provides the web front-end for the Bottom Time service. It is server-side rendered with a Vue application to run
on the client side. You should have familiarity with those two technologies:

- [Vue.js](https://vuejs.org/) - A superior alternative to the ubiquitous React framework for making awesome front-ends.
- [Vite](https://vitejs.dev/) - Provides tooling for building/bundling, configuration, server-side rendering (SSR), and more.

### Directory Structure

The most pertinent directories you should be aware of are

- `src/` - The source code for the actual Vue.js application. This code will run both on the server-side and on the client.
- `server/` - The code for performing the initial page renders that are served to the browser.
- `public/` - Static assets, such as images, to be served to browsers.
- `tests/` - The suite of Jest tests.

## Development

## Configuration

The configuration for the service is configured using environment variables. Generally, it's easiest to set these in `.env` files. However, you can set them directly in your environment as well.

### Environment Variable Availability

Some environment variables are required to be accessible on both the client-side and the server-side, while
others only need to be available on the server. If a variable is prefixed with `BTWEB_VITE_`, then it will be available
in the browser as well as on the server. This distinction is important for two reasons.

First, client-side environment variables need to be _bundled_ into the client-side code. That is, changes to environment
variables will not take effect on the client-side until the service is rebuilt/redeployed! When running the service
in dev mode, the `.env` files are watched and changes will automatically be applied to your running dev instance.

Second, client-side environment variables will be present in the browser and could potentially be read by an end-user. For
this reason it is **unsafe** to store sensitive configuration (such as non-public API keys) with a `BTWEB_VITE_` prefix.
**DO NOT DO THIS!**

### The `.env` Files

There are a number of `.env` files with configuration for the various environments. Specifically, they are

- `.env` - This is the default config file. Configuration will be loaded from here first and then environment-specific
  configuration can be loaded from another file. Environment variables in the environment-specific files will override the
  corresponding variables in the `.env` file.
- `.env.e2e` - Configuration overrides for the E2E testing environment.
- `.env.staging` - Cofniguration overrides for the staging environment.
- `.env.production` - Configuration overrides for the production environment.
- `.env.local` - Optional file that provides configuration overrides for local development (in case you need to test
  alternate configurations without checking in changes to the `.env` file). This file is listed in the `.gitignore` so you
  don't have to worry about accidentally checking it in. This provides a convenient way for developers to personalize their
  environments.

### Environment Variables

#### Server-Side Only

| Variable            | Description                                                                                                                                                         |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `BTWEB_API_URL`     | The URL at which the backend service can be reached. This is needed for making API calls.                                                                           |
| `BTWEB_COOKIE_NAME` | The name of the session cookie used to identify the current user when making API calls. This needs to match the corresponding configuration in the backend service. |
| `BTWEB_LOG_LEVEL`   | The amount of detail written to the logs. Valid values (in order of increasing verbosity) are `fatal`, `error`, `warn`, `info`, `debug`, and `verbose`.             |
| `BTWEB_PORT`        | The TCP port on which the service will listen for requests.                                                                                                         |

#### Client- and Server-Side

| Variable                       | Description                                                                                                                                                                                                                                                                                                                       |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `BTWEB_VITE_ADMIN_EMAIL`       | Email address for the site administrator. Will displayed in the UI in "contact an administrator" links.                                                                                                                                                                                                                           |
| `BTWEB_VITE_APP_TITLE`         | Title of the application. Will be displayed in the heading for the browser tab.                                                                                                                                                                                                                                                   |
| `BTWEB_VITE_BASE_URL`          | The base URL for the site. Used for constructing URLs to specific pages when needed.                                                                                                                                                                                                                                              |
| `BTWEB_VITE_CONFIGCAT_API_KEY` | ConfigCat publishable SDK key for accessing the state of feature flags.                                                                                                                                                                                                                                                           |
| `BTWEB_VITE_ENABLE_PLACES_API` | A boolean-ish value (`true`, `false`, `0` or `1`) that indicates whether the Google Places API should be used for autocomplete when entering addresses or locations in the UI. This service is kinda pricey so to save $$ this should only be turned on in production or temporarily for local testing in your `.env.local` file. |
| `BTWEB_VITE_GOOGLE_API_KEY`    | Google API key for using Google Maps and Google Places APIs.                                                                                                                                                                                                                                                                      |
| `BTWEB_VITE_STRIPE_API_KEY`    | Publishible API key for accessing Stripe services for handling payments.                                                                                                                                                                                                                                                          |
