# React 0→5 interview ladder

A standalone React interview-preparation page separate from the main React Interview Lab app in the parent directory.

The ladder has six practical levels:

- **0 · Foundations** — JSX, components, props, rendering, and identity
- **1 · Interactive UI** — state, events, forms, derived values, and reducers
- **2 · Async React** — effects, request lifecycles, refs, and custom hooks
- **3 · Application React** — context, routes, server state, and boundaries
- **4 · Production React** — tests, performance, accessibility, and resilience
- **5 · React Architect** — migrations, system boundaries, and team trade-offs

Each level includes mental-model Q&A, hands-on exercises, and interview scenarios. Completion state is saved in local storage under `react-0-5-progress`.

## Run locally

From this directory:

```bash
npm install
npm run dev
```

Build the standalone app with:

```bash
npm run build
```

The parent app is intentionally not imported or modified. The 0→5 page has its own Vite entry point, content modules, styles, and package manifest.
