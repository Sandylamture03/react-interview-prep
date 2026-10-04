# React Interview Lab

React-only interview preparation built from the supplied **React 80/20 Roadmap**.

## Included

- 42 theory questions with concise answers and React examples
- 10 code exercises with solution approaches, copyable code, and interview notes
- 15 technical interview prompts with follow-up guidance
- The separate 0→5 React interview ladder, including foundations through architecture
- A 235-question source-backed React question bank: 189 theory, 19 practical, and 27 coding prompts, with source traces and 31 roadmap/cheat-sheet expansions
- One shared application shell: use the **Study guides** switcher in the sidebar to move between both guides without another server or folder
- Search across all sections, question-bank category filters, topic filters, code exercise navigation, and localStorage-backed progress for each guide
- Responsive single-page UI with a React 19 / Next App Router version guardrail

## Run locally

```bash
npm install
npm run dev
```

Then open the local Vite URL shown in the terminal. To verify a production build:

```bash
npm run build
```

## Deploy to GitHub Pages

The repository includes a GitHub Actions workflow at
`.github/workflows/deploy.yml`. Push the `main` branch and GitHub Pages will
build and deploy the Vite app automatically.

For a custom domain, add a `public/CNAME` file containing the exact domain
before deploying, then configure the DNS records shown by GitHub Pages.

The reference PDFs and Word documents remain local in `reference-files/` and
are excluded from the repository; the generated question bank is included in
`src/questionBank.js` and `src/questionBankAnswers.js`.

The content boundary is intentionally narrow: React, React hooks, React Router, server/client state patterns, React testing/performance, and the React 19 / Next topics covered by the source roadmap. General JavaScript, CSS, backend, deployment, and legacy class-component prep are excluded.
