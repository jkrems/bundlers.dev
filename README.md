# What is tooling.report?

It's a quick way to determine the best build tool for your next web project, **or** if tooling migration is worth it, **or** how to adopt a tool's best practice into your existing configuration and code base.

# To get set up

```sh
npm install
```

# To dev

```sh
npm run dev
```

This starts the build in watch mode, and starts an HTTP server.

# To build for production

```sh
npm run build
```

# Project shape

The site is set up using Astro and follows the general layout described in the Astro docs.

- `src/pages` - directory-based routing that defines the site's URL structure.
- `src/content/bundler-compat-data` - data about bundler support for each feature, using the MDN browser compat format.
- `compat-suite` - automated tests to gather compatibility information about the various tools.
