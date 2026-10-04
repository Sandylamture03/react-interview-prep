@section technical

## t-design | Scenarios & architecture | Weeks 2–5 | 5, 9–15

### Where would you store each piece of state in this app? @intermediate
You're building an inventory dashboard. Decide where each of these lives and justify it:

1. The list of products from the API
2. The text in the table's search box
3. Current page and sort order of the table
4. Whether the sidebar is collapsed (remembered across visits)
5. The signed-in user
6. Whether the "Edit product" dialog is open
7. The values typed into the edit form
8. The total value of the stock on screen
-- answer --
| # | State | Where | Why |
|---|---|---|---|
| 1 | Products from API | **TanStack Query** | Server state: needs caching, refetching, invalidation |
| 2 | Search text | **URL** (`?q=`) or local `useState` | URL if it should survive refresh and be shareable |
| 3 | Page and sort | **URL search params** | Shareable, bookmarkable, Back button works |
| 4 | Sidebar collapsed | **Zustand + persist** | App-wide client UI state read by distant components |
| 5 | Signed-in user | **Context** (or auth library) | App-wide, changes rarely |
| 6 | Dialog open | **Local `useState`** in the table or row | Only one component cares |
| 7 | Form values | **React Hook Form** | Form-local; uncontrolled for performance |
| 8 | Total stock value | **Derived** during render | Computable from #1, so never stored |

> **Interview tip:** Say the rule out loud: "minimal state, as local as possible; the URL for anything shareable; server data in a cache; derive everything else."

### How would you architect a CRUD admin dashboard in React? @intermediate
Walk through the stack and structure you'd use for a products admin: a list with search, sort and pagination; create and edit in a dialog; delete with confirmation; toasts; responsive with dark mode.
-- answer --
**Stack** (the Week 5 "real-app" stack):

- **Vite + React + TypeScript (strict)**, **React Router** for `/products`, `/products/:id` and `/settings`.
- **TanStack Query** for every server read and write: `useQuery` for lists, `useMutation` + `invalidateQueries` after writes, an optimistic delete.
- **React Hook Form + Zod** for the dialog form. One schema gives validation and the TS type, and is shared with the API.
- **Tailwind + shadcn/ui** (Table, Dialog, AlertDialog for delete confirmation, Sonner toasts).
- **Zustand** for small client UI state (sidebar, table density).
- Filters, sort and page in **URL search params**.

**Structure**

```
src/
  features/products/
    api.ts              ← fetchers + query keys
    hooks.ts            ← useProducts, useCreateProduct, useDeleteProduct
    schema.ts           ← Zod schema + z.infer type
    ProductTable.tsx
    ProductDialog.tsx
  components/ui/        ← shadcn components (owned code)
  stores/ui.ts          ← Zustand
  routes/               ← route components + layouts
```

**Quality:** an error boundary per route, `lazy` routes, RTL + MSW tests for the form, list and one mutation, and keyboard and label checks for accessibility.

### Server Actions or TanStack Query for mutations? @advanced
In a Next.js app, when would you mutate with Server Actions and `useActionState`, and when with TanStack Query's `useMutation`? Defend your choice for a job-application tracker.
-- answer --
**Server Actions** fit when the data is rendered by **Server Components**: you mutate on the server, call `revalidatePath`, and the server re-renders the fresh data. You get progressive enhancement (forms work before JS loads), no API layer to write, and `useActionState`/`useOptimistic` for pending and optimistic UI.

**TanStack Query** fits when data lives on the **client**: heavy client interactivity (polling, infinite scroll, complex cache updates, offline), a separate REST or GraphQL API shared with mobile apps, or a client-rendered SPA with no server runtime.

For the job tracker (Next.js + Supabase, mostly server-rendered lists and forms), choose **Server Actions + `useOptimistic`**: less code, one validation schema on the server, instant Kanban moves. You'd add TanStack Query only for a highly interactive client widget. That makes a good "technical decision" to explain in a README or interview.

### How do you prevent a form from being submitted twice? @basic
Users double-click "Pay" or "Save" and create duplicates. How do you prevent it in React?
-- answer --
Disable the button while the submission is pending, and make the server idempotent as the real guarantee.

```jsx
// React Hook Form
const { formState: { isSubmitting } } = useForm();
<button disabled={isSubmitting}>Save</button>

// TanStack Query
<button disabled={mutation.isPending} onClick={() => mutation.mutate(data)}>Save</button>

// React 19 form actions
function SubmitButton() {
  const { pending } = useFormStatus();
  return <button disabled={pending}>Save</button>;
}
// or: const [state, action, isPending] = useActionState(save, null);
```

Client guards are UX only, because a user can still replay the request. On the server, use an idempotency key or a unique constraint so a repeated request can't create a duplicate.

### How would you migrate a JavaScript React component to strict TypeScript? @intermediate
You're migrating the Week 2 expense tracker to TypeScript with `strict: true` and the rule "zero `any`". What's your process?
-- answer --
1. **Set up:** rename files to `.tsx`, enable `strict`, and run `tsc --noEmit` in CI so errors can't creep back.
2. **Start from the data:** define domain types once (`type Expense = { id: string; amount: number; category: Category; date: string }`) with unions for fixed values (`type Category = 'food' | 'travel'`).
3. **Type the edges:** props, reducer actions as a discriminated union, events (`React.ChangeEvent<HTMLInputElement>`), refs (`useRef<HTMLInputElement>(null)`), and context (`createContext<Ctx | null>(null)` plus a throwing hook).
4. **Validate untrusted data:** API responses and `localStorage` go through Zod; derive the types with `z.infer`.
5. **Remove `any`:** use `unknown` plus narrowing for errors (`err instanceof Error`), and generics for reusable hooks.
6. **Let inference work:** don't annotate what TypeScript already infers.

```ts
type Action =
  | { type: 'added'; expense: Expense }
  | { type: 'deleted'; id: string };

function reducer(state: Expense[], action: Action): Expense[] {
  switch (action.type) {
    case 'added': return [...state, action.expense];
    case 'deleted': return state.filter(e => e.id !== action.id);
  }
}
```

### Data depends on another request: how do you load it without a waterfall mess? @intermediate
A page needs the current user, then that user's projects, then shows them. How do you load this in React?
-- answer --
In a client app with TanStack Query, chain them with `enabled`:

```jsx
const userQuery = useQuery({ queryKey: ['me'], queryFn: getMe });
const projectsQuery = useQuery({
  queryKey: ['projects', userQuery.data?.id],
  queryFn: () => getProjects(userQuery.data.id),
  enabled: !!userQuery.data,
});
```

Then ask whether the dependency is real. If the API can return projects for "me" directly, make **one request** or fetch in **parallel**. A true dependency is a waterfall by nature, so minimize it:

- Move it to the server (a Server Component or loader can `await` both close to the database, or the API can join them).
- Fetch independent data in parallel (`Promise.all`, or multiple `useQuery` calls without `enabled` gating).
- Avoid nested components that each fetch only after their parent renders.

### Context or Zustand for a value that changes often? @intermediate
A "currently hovered row" value and a shopping cart both need to be read by many components across the app. Would you use Context or Zustand?
-- answer --
**Zustand** for both.

- Context has **no selectors**: any change to the value re-renders every consumer. A hovered row changes on every mouse move, so every consumer would re-render constantly.
- Zustand lets each component subscribe to a **slice** (`useCart(s => s.items.length)`), so only components whose slice changed re-render. No provider is needed, and `persist` covers storing the cart.

Use Context for rarely changing values (theme, locale, auth user), or as dependency injection for something stable such as a store instance.

### How do you present your React project in five minutes? @basic
Interviewers often say "walk me through a project you built." How would you structure that answer for a React app such as the job-application tracker capstone?
-- answer --
Use a clear five-part structure:

1. **What and why (30 s):** "A full-stack job application tracker: sign in, log applications, drag them across a Kanban board, see your hiring funnel."
2. **Architecture (1 min):** Next.js App Router with Server Components for data, Client Components only for interactive leaves (board, forms); Supabase for auth and Postgres with row-level security; React Hook Form + Zod with the same schema on client and server.
3. **Three decisions and trade-offs (2 min):** for example, Server Actions over TanStack Query (data is server-rendered; less code); `useOptimistic` for instant Kanban moves with automatic rollback; filters in URL search params so views are shareable.
4. **Quality (1 min):** component tests with RTL + MSW, one Playwright end-to-end test, CI blocking failing PRs, keyboard drag and drop, Lighthouse accessibility score.
5. **Next steps (30 s):** what you'd build or change with more time.

Keep a live demo link and a diagram ready. Have real numbers ("12 tests", "Lighthouse 96") instead of adjectives.

## t-quality | Performance, testing & quality in practice | Week 6 | 16

### Typing in a search box that filters 10,000 rows is laggy. What do you do? @advanced
Walk through how you'd diagnose and fix it.
-- answer --
**1. Measure.** Record typing with the React DevTools Profiler. Find which components render on each keystroke and how long they take. Check for long tasks in the Chrome Performance panel.

**2. Fix, cheapest first:**

- **Don't render 10,000 DOM rows.** Virtualize the list (TanStack Virtual) so only about 30 visible rows exist. This is usually the biggest win.
- **Keep the input responsive** with `useDeferredValue(query)` so the list renders with a lagging query while keystrokes stay urgent, or debounce the filter.
- **Stop unnecessary renders:** move state down so only the input and list re-render; enable the React Compiler or memoize the row component.
- **Cache the expensive work:** compute the filtered list with `useMemo` (or let the compiler) and avoid re-normalizing data per keystroke.
- **Move filtering to the server** with pagination if the dataset keeps growing.

**3. Verify** with a before and after Profiler recording. That's a Week 6 checkpoint: show the recording and explain the difference.

### One component crashes and the whole app goes blank. How do you fix it? @intermediate
-- answer --
With no error boundary, an error thrown during render **unmounts the whole root**, so the user sees a white screen.

1. Add an **error boundary per route** (`react-error-boundary`) inside the layout, so the navigation survives and the user can go elsewhere. Reset it on route change with `resetKeys={[pathname]}`.
2. Add boundaries around **risky, independent widgets** (charts, third-party embeds) so a widget failure doesn't take down the page.
3. **Log errors** in `onError` (and the root `onCaughtError`/`onUncaughtError` options in React 19) to a monitoring service.
4. Handle errors that boundaries **don't** catch (event handlers, async code) with `try/catch` and `showBoundary` or a toast.
5. Fix the root cause: often unguarded data access (`user.address.city` when `address` is missing). Validate API data with Zod at the boundary.

### The initial JavaScript bundle is 2 MB. How do you shrink it? @intermediate
-- answer --
1. **Analyze** the build (for example with `rollup-plugin-visualizer` for Vite) to see what's large.
2. **Code-split by route** with `lazy` + `Suspense`, so the charting page's libraries load only on `/reports`.
3. **Lazy-load heavy, rarely used components** (rich-text editor, date picker, map) when they open.
4. **Replace or trim heavy dependencies:** import specific functions instead of whole libraries; prefer native APIs (`Intl` instead of a big date library where possible).
5. **Move work to the server:** with Server Components, static and data-heavy parts ship zero JavaScript.
6. **Check for duplicates:** two versions of the same library, or dev-only code leaking into production.

Verify with Lighthouse and by comparing chunk sizes before and after.

### Lighthouse flags accessibility problems in your React app. What are the usual fixes? @intermediate
-- answer --
| Finding | React fix |
|---|---|
| Clickable `div` / `span` | Use `<button type="button">`; links use `<a>`/`<Link>` |
| Form inputs without labels | `<label htmlFor={id}>` + `id` from `useId()`; or wrap the input in the label |
| Images without alt text | `alt` describing the content, or `alt=""` if decorative |
| Low colour contrast | Adjust design tokens; check both light and dark themes |
| No visible focus | Keep outlines or add `focus-visible:` styles |
| Icon-only buttons | `aria-label="Delete product"` |
| Dialog focus lost | Use an accessible dialog (shadcn/Radix) that traps and restores focus |
| Errors not announced | `role="alert"` or `aria-live`, plus `aria-invalid` and `aria-describedby` on the field |
| Heading levels skipped | One `h1` per page, in order |

Then test with **only the keyboard** (Tab, Shift+Tab, Enter, Space, Escape), and use `getByRole` queries in tests so accessibility regressions fail CI.

### What would your test plan be for a product form that submits to an API? @intermediate
-- answer --
Test behaviour with React Testing Library + user-event, and mock the API with MSW.

1. **Validation:** submitting empty shows each required-field error; an invalid price shows the right message; no request is sent (assert with an MSW handler spy or the absence of a success toast).
2. **Happy path:** fill the fields by label, submit, and expect a success toast and the new product in the list (with TanStack Query invalidation, the list refetches from the MSW handler).
3. **Pending state:** the button is disabled and shows "Saving…" while the request is in flight, preventing double submit.
4. **Server error:** `server.use(...)` returns 500, so expect an error message and the form keeps the user's input.
5. **Edit mode:** the form is pre-filled with the existing product's values.

Skip asserting internal state, call counts of `useState`, or class names. Unit-test the Zod schema separately if it has tricky rules.

### The Profiler shows lots of re-renders, but the app feels fast. Should you optimize? @basic
-- answer --
**No.** Re-renders aren't a problem in themselves: rendering is calling functions, and React only touches the DOM where output changed. Optimize when there's a **measurable, user-visible** problem (slow interactions, dropped frames, long commits in the Profiler).

Premature `useMemo`/`useCallback`/`memo` adds complexity, can hide bugs, and often costs more than it saves. Turn on the React Compiler for free automatic memoization, and spend manual effort only on proven hot spots.

## t-modern | React 19 & Server Components in practice | Week 7 | 17

### What breaks when upgrading an app from React 18 to React 19? @advanced #new
-- answer --
Most apps upgrade smoothly, but check for these removals and changes:

| Change | What to do |
|---|---|
| `ReactDOM.render` / `hydrate` removed | Use `createRoot` / `hydrateRoot` |
| `propTypes` ignored, `defaultProps` removed (function components) | TypeScript + default parameters |
| String refs (`ref="input"`) removed | `useRef` or callback refs |
| Legacy context (`contextTypes`) removed | `createContext` |
| `findDOMNode`, `unmountComponentAtNode` removed | Refs; `root.unmount()` |
| `react-dom/test-utils` `act` moved | `import { act } from 'react'` |
| `react-test-renderer` deprecated | React Testing Library |
| TS: `useRef()` needs an argument; ref callbacks can't implicitly return | `useRef(null)`; block-body ref callbacks |
| `element.ref` access deprecated | Read `ref` from props |

Optional modernizations: replace `forwardRef` with the `ref` prop, `<Context.Provider>` with `<Context>`, and `useFormState` with `useActionState`. Upgrade to 18.3 first, which warns about everything 19 removes, and use the official codemods.

### "You're importing a component that needs useState." How do you fix it? @basic #new
You add a counter with `useState` to a component in a Next.js App Router project and get this build error.
-- answer --
Components in the App Router are **Server Components by default**, and Server Components can't use state, effects or event handlers.

Fix it by marking the **interactive component** as a Client Component, and keep it as small as possible:

```tsx
// LikeButton.tsx
'use client';
import { useState } from 'react';

export function LikeButton() {
  const [likes, setLikes] = useState(0);
  return <button onClick={() => setLikes(l => l + 1)}>♥ {likes}</button>;
}
```

Don't put `'use client'` on the page or layout just to make the error go away. That turns the whole subtree into client code and gives up the benefits of Server Components.

### Why can't you pass onSelect from a Server Component to a Client Component? @intermediate #new
```tsx
// page.tsx (Server Component)
export default async function Page() {
  const products = await getProducts();
  return <ProductPicker products={products} onSelect={id => console.log(id)} />;
}
```
-- answer --
Props passed from a Server Component to a Client Component are **serialized** and sent over the network. Ordinary functions (and class instances) can't be serialized, so React throws "Functions cannot be passed directly to Client Components."

Options:

- Define the handler **inside the Client Component**, where the interaction happens.
- If it must run on the server, pass a **Server Function** (`'use server'`). Those are serializable as references.

```tsx
// actions.ts
'use server';
export async function selectProduct(id: string) { /* server work */ }

// page.tsx
<ProductPicker products={products} onSelect={selectProduct} />
```

### What happens if you put 'use client' at the top of the root layout? @intermediate #new
-- answer --
Everything the layout imports becomes client code. Pages passed in as `children` can still be Server Components, but every component the layout file imports directly ships to the browser. You lose zero-JS rendering for those parts, direct data access in them, and smaller bundles. Layouts also can't export `metadata` from a Client Component in Next.js.

Better: keep the layout a Server Component and extract the interactive pieces (theme toggle, mobile menu) into small Client Components. Providers that need client state (ThemeProvider, QueryClientProvider) go in a separate `'use client'` `Providers` component that wraps `{children}`.

```tsx
// app/providers.tsx
'use client';
export function Providers({ children }) {
  const [client] = useState(() => new QueryClient());
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

// app/layout.tsx (Server Component)
export default function RootLayout({ children }) {
  return <html lang="en"><body><Providers>{children}</Providers></body></html>;
}
```

### Should you still write useMemo and useCallback in 2026? @intermediate #new
How would you answer this in an interview?
-- answer --
"With the React Compiler enabled, I don't add them by default. The compiler memoizes components, values and callbacks automatically at build time. I still understand them deeply because existing codebases are full of them, and there are cases where I'd reach for them manually:"

- The project doesn't use the compiler yet.
- A value is used as an **effect dependency** and must keep a stable identity, where precise control matters.
- Passing callbacks to a non-compiled, `memo`'d third-party component.
- A profiled hot spot where the compiler bailed out (it skips code that breaks the Rules of React).

"Either way, I profile first and keep my code pure so the compiler can optimize it."

### The React Compiler skipped one of your components. Why, and what do you do? @advanced #new
-- answer --
The compiler only optimizes code it can prove follows the **Rules of React**. It skips (doesn't miscompile) components that, for example:

- Mutate props, state, or values used in rendering after creating them.
- Read or write `ref.current` during render.
- Call hooks conditionally or in loops.
- Depend on mutable values from outside the component.

What to do: run `eslint-plugin-react-hooks` (its recommended preset includes the compiler-powered rules) to see the reason, fix the impure code, and confirm in React DevTools (compiled components show a "Memo ✨" badge). Use `"use no memo"` only as a temporary opt-out while you fix it.

### An optimistic like fails on the server. What does the user see? @intermediate #new
```jsx
const [optimisticLikes, addLike] = useOptimistic(likes, (current, delta) => current + delta);

function handleLike() {
  startTransition(async () => {
    addLike(1);
    await likePost(postId);   // throws
  });
}
```
-- answer --
The count jumps up by one immediately. When `likePost` throws, the transition ends. `useOptimistic` only shows the optimistic value **while** the transition is pending, so it falls back to the real `likes` and the count goes back down automatically. No manual rollback code is needed.

Because the error is thrown inside a transition, React 19 sends it to the **nearest error boundary**. For a small action like this you usually don't want a whole fallback screen, so catch it and show a toast instead:

```jsx
startTransition(async () => {
  addLike(1);
  try {
    await likePost(postId);
  } catch {
    toast.error("Couldn't like the post");
  }
});
```

### Why does my form clear itself after submitting in React 19? @intermediate #new
You switched a form to `<form action={formAction}>` and noticed that the inputs are emptied after every successful submit, even when you return errors from the server.
-- answer --
When a `<form action>` Action completes, React automatically **resets uncontrolled form fields**, which is usually what you want after a successful create. If you return validation errors, the user then loses their input.

Options:

- Return the submitted values in the action's state and use them as `defaultValue`:

```jsx
async function save(prev, formData) {
  const values = Object.fromEntries(formData);
  const result = schema.safeParse(values);
  if (!result.success) return { values, errors: result.error.flatten().fieldErrors };
  // ...
  return { values: {}, errors: {} };
}

<input name="company" defaultValue={state.values.company ?? ''} />
```

- Use controlled inputs (or React Hook Form) when you need full control over field values.
- To reset manually in a custom flow, `requestFormReset` from `react-dom` is available.
