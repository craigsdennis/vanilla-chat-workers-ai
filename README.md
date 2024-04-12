# Vanilla JavaScript Chat Application using Cloudflare Workers AI

A web based chat interface built on [Cloudflare Pages](https://page.cloudflare.com) that allows for exploring Text Generation Models on [Cloudflare Workers AI](https://developers.cloudflare.com/workers-ai/). Design is built using [tailwind](https://tailwindcss.com/).

This demo makes use of [LocalStorage](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage) to maintain state. We have better solutions available (moar coming soon).

This is a template repository. Please feel free to create your own repository from this one by using the "Use this template" button. It's right next to the ⭐️ this repo button, which you could totally do as well if you wanted to.

This is, like all of us, a Work in Progress.

## Installation

```bash
npm install
# If this is your first time here
npx wrangler login
```

## Develop

This uses the local Vite server for rapid development

```bash
npm run dev
```

### Preview

This builds and runs in Wrangler your site locally, just as it will run on production

```bash
npm run preview
```

## Deploy

This hosts your site on [Cloudflare Pages](https://pages.cloudflare.com)

```bash
npm run deploy
```

###  Debug

```bash
npx wrangler pages deployment tail
```
