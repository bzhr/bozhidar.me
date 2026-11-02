# bozhidar.me
Home of my personal web site. 

## Run locally

Run these commands from the `site/` directory using Node.js 24:

```sh
nvm use
npm ci
npm run dev
```

`nvm use` reads `.nvmrc`; if you do not use nvm, select Node.js 24 with your preferred version manager instead. Open the address printed in the terminal (normally `http://localhost:4321`). The CV page is at `/cv/`, and edits reload automatically. Press `Ctrl+C` to stop the server.

To build and preview the production site:

```sh
npm run build
npm run preview
```

The sitemap is generated automatically during the production build. Netlify is not required to run the current static pages locally.

# Astro Starter Kit: Basics

```sh
npm create astro@latest -- --template basics
```

[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/withastro/astro/tree/latest/examples/basics)
[![Open with CodeSandbox](https://assets.codesandbox.io/github/button-edit-lime.svg)](https://codesandbox.io/p/sandbox/github/withastro/astro/tree/latest/examples/basics)
[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/withastro/astro?devcontainer_path=.devcontainer/basics/devcontainer.json)

> 🧑‍🚀 **Seasoned astronaut?** Delete this file. Have fun!

![just-the-basics](https://github.com/withastro/astro/assets/2244813/a0a5533c-a856-4198-8470-2d67b1d7c554)

## 🚀 Project Structure

Inside of your Astro project, you'll see the following folders and files:

```text
/
├── public/
│   └── favicon.svg
├── src/
│   ├── components/
│   │   └── Card.astro
│   ├── layouts/
│   │   └── Layout.astro
│   └── pages/
│       └── index.astro
└── package.json
```

Astro looks for `.astro` or `.md` files in the `src/pages/` directory. Each page is exposed as a route based on its file name.

There's nothing special about `src/components/`, but that's where we like to put any Astro/React/Vue/Svelte/Preact components.

Any static assets, like images, can be placed in the `public/` directory.

## 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Installs dependencies                            |
| `npm run dev`             | Starts local dev server at `localhost:4321`      |
| `npm run build`           | Build your production site to `./dist/`          |
| `npm run preview`         | Preview your build locally, before deploying     |
| `npm run astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `npm run astro -- --help` | Get help using the Astro CLI                     |

## 👀 Want to learn more?

Feel free to check [our documentation](https://docs.astro.build) or jump into our [Discord server](https://astro.build/chat).

## 📬 Newsletter Subscription (Listmonk)

The newsletter form and Netlify Function source are retained for future use, but the form is not rendered on the site. The analytics script has also been removed. No newsletter or analytics service configuration is needed for local development.

- Component: `src/components/SubscribeForm.astro`
- Function: `netlify/functions/subscribe.js`

Configure these environment variables in your Netlify site settings:

- `LISTMONK_URL` — e.g. `https://listmonk.bozhidar.me`
- Token auth (recommended):
  - `LISTMONK_API_USER` — API user name
  - `LISTMONK_API_TOKEN` — token value (or set this as `api_user:token` if you prefer a single var)
- Basic auth (fallback, if no token):
  - `LISTMONK_USERNAME` and `LISTMONK_PASSWORD`
- `LISTMONK_LIST_ID` — Numeric ID of the target Listmonk list (e.g., 2).

Notes:
- The function posts to `POST /api/subscribers?upsert=true` with Basic Auth.
- A simple honeypot field (`company`) is used to deter bots.
- For a nicer UX, the form progressively enhances submission via `fetch`, but also works as a normal HTML form.
