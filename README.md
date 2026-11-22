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

## 📬 Newsletter Subscription

The blog index and each post render `src/components/SubscribeForm.astro`. It uses the public action from the **Blog Newsletter** form in Brevo (Marketing → Forms → Share → Simple HTML), so signup needs no API key or Netlify environment variables.

The form shows the result inline and links to Brevo’s hosted signup page as a fallback. Brevo sends the **bozhidar.me — newsletter confirmation** template from `contact@bozhidar.me`. Readers join the **Blog Newsletter** list after they confirm. If the form is replaced in Brevo, update the public action and check the generated fields against the new embed.

## Blog project card metadata

Blog posts can optionally include a `repository` object in their frontmatter. Its required `url` must be an HTTPS GitHub owner/repository URL. Optional fields are `description`, `problem`, `contribution`, `approach`, and `outcome`; omit fields that are not supported by the post. The project card is rendered automatically on the post page when this object is present. No API or runtime service is involved.

```yaml
repository:
  url: "https://github.com/owner/repository"
  description: "A short, factual project summary."
  contribution: "What the author implemented."
  approach: "A concise description of the technical approach."
  outcome: "The result or relevant limitations."
```
