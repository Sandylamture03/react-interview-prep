# React 80/20 Interview Prep

A single-page React interview study guide based on an 8-week React 80/20 learning roadmap: the small set of skills that covers most day-to-day React work.

**Live site:** https://react.ai-developer.in/

## What's inside

Two separate packages, each with its own Theory, Coding and Technical tabs:

| Package | Theory Q&A | Coding challenges | Technical Q&A |
|---|---|---|---|
| **80/20 Core**: the 17 skills React jobs use every day, plus the "skip list" of legacy topics | 154 | 27 | 46 |
| **Beyond 80/20**: practice for roadmap gaps, plus common interview topics the roadmap skips | 26 | 17 | 27 |

Topics include React 19 (Actions, `useActionState`, `useOptimistic`, Server Components), React Compiler 1.0, React Router, TanStack Query v5, React Hook Form + Zod, Zustand, Tailwind CSS + shadcn/ui, TypeScript, and testing with Vitest, React Testing Library and MSW.

## Features

- Every theory answer starts with a one-line **Say this first** answer
- Search, difficulty filters, and filters for React 19+ topics and roadmap checkpoints
- **Practice mode** hides answers until you reveal them; **Quiz me** opens a random question
- "Mastered" checkboxes with progress per section, saved in your browser
- Light and dark themes, `/` to jump to search, works on phones

## Run it locally

The site is one static file. Open `index.html` in a browser, or serve the folder:

```bash
python -m http.server 8000
```

Fonts and syntax highlighting load from public CDNs; everything else works offline.

## Edit the questions

Questions live in Markdown-like files in `src/`. After editing, rebuild `index.html` (Python 3, no dependencies):

```bash
python src/build.py
```

Content format:

- `@section <key>` starts a section: `theory`, `coding`, `technical`, or `beyond-theory`, `beyond-coding`, `beyond-technical`.
- `## id | Title | Week | Skills | group` starts a topic. `group` is `gap` or `beyond` in the Beyond package.
- `### Question title @basic #new` starts a question. Levels: `@basic`, `@intermediate`, `@advanced`. Tags: `#new` (React 19+), `#gate` (roadmap checkpoint), `#legacy`.
- A line starting with `!! ` becomes the "Say this first" answer; lines starting with `> ` become tips.
- In coding and technical items, a line `-- answer --` separates the problem from the answer.

## Project structure

```
index.html          The built site (served by GitHub Pages)
.nojekyll           Tells GitHub Pages to serve files as they are
src/
  build.py          Builds index.html from the content files
  template.html     Page layout, styles and script
  theory-*.md       80/20 Core: theory questions
  coding-*.md       80/20 Core: coding challenges
  technical-*.md    80/20 Core: technical questions
  beyond-*.md       Beyond 80/20 package
```
