# Vanilla JavaScript Chat Application using Cloudflare Workers AI

A web based chat interface that allows for exploring Text Generation Models on [Cloudflare Workers AI](https://developers.cloudflare.com/workers-ai/). Design is built using [tailwind](https://tailwindcss.com/).

This demo makes use of [LocalStorage](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage) to maintain state.

This is, like all of us, a Work in Progress.

## Installation

```bash
npm install
npx wrangler login
```

## Develop

```bash
npm run dev
```

## Deploy


```bash
npm run deploy
```

**NOTE**: You must enable Workers AI in your Pages project. Pages > YOUR PROJECT > Settings > Functions > Workers AI Bindings. Set the Binding name to `AI`.
