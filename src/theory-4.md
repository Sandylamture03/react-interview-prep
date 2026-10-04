@section theory

## react19 | React 19 & Server Components | Week 7 | 17

### What are the most important changes in React 19? @intermediate #new
!! React 19 (December 2024) added **Actions** and the form hooks (`useActionState`, `useFormStatus`, `useOptimistic`), the `use()` API, `ref` as a regular prop, `<Context>` as a provider, built-in document metadata, and stable **Server Components** and **Server Functions**. It also removed long-deprecated APIs.

**New**

- Actions: async functions in transitions; `<form action={fn}>`.
- `useActionState`, `useFormStatus` (react-dom), `useOptimistic`.
- `use(promise)` and `use(context)`, callable conditionally.
- `ref` as a prop (no `forwardRef`), ref cleanup functions.
- `<ThemeContext value>` instead of `.Provider`.
- `<title>`, `<meta>` and `<link>` rendered anywhere are hoisted into `<head>`.
- Better hydration error messages; root `onCaughtError` and `onUncaughtError`.

**Removed:** `propTypes` checks and `defaultProps` on function components, string refs, legacy context, `ReactDOM.render`/`hydrate`, `unmountComponentAtNode`, `findDOMNode`.

**Since then:** React 19.2 (October 2025) added `<Activity>`, `useEffectEvent` and React Performance tracks in Chrome DevTools, and React Compiler 1.0 shipped the same month. This roadmap targets React 19.3.

### What is an Action in React 19? @intermediate #new
!! An Action is a function, usually async, that React runs inside a **transition**: passed to `startTransition`, or to a form's `action` prop. React then tracks its pending state for you, keeps the UI responsive, sends thrown errors to error boundaries, supports optimistic updates, and resets uncontrolled forms after success.

```jsx
function UpdateName() {
  const [name, setName] = useState('');
  const [error, setError] = useState(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit() {
    startTransition(async () => {          // An async transition is an Action
      const err = await updateName(name);
      if (err) { setError(err); return; }
      redirect('/profile');
    });
  }

  return (
    <>
      <input value={name} onChange={e => setName(e.target.value)} />
      <button onClick={handleSubmit} disabled={isPending}>Update</button>
      {error && <p>{error}</p>}
    </>
  );
}
```

Before Actions you managed `isPending`, errors and race conditions by hand with `useState`.

### Explain useActionState @intermediate #new
!! `useActionState(action, initialState)` wraps an Action and returns `[state, formAction, isPending]`. React calls your action with `(previousState, formData)` and stores whatever it returns as the new `state`, which is ideal for showing form results and field errors. It was called `useFormState` in the canaries.

```jsx
import { useActionState } from 'react';

async function subscribe(prevState, formData) {
  const email = formData.get('email');
  if (!email.includes('@')) return { error: 'Enter a valid email' };
  await api.subscribe(email);
  return { success: true };
}

function Newsletter() {
  const [state, formAction, isPending] = useActionState(subscribe, { error: null });

  return (
    <form action={formAction}>
      <input name="email" type="email" />
      <button disabled={isPending}>{isPending ? 'Subscribing…' : 'Subscribe'}</button>
      {state.error && <p role="alert">{state.error}</p>}
      {state.success && <p>Thanks for subscribing!</p>}
    </form>
  );
}
```

The action can also be a Server Function, which makes the form work before JavaScript loads (progressive enhancement).

### Explain useFormStatus @intermediate #new
!! `useFormStatus()` from `react-dom` returns the status of the **parent** `<form>` (`pending`, `data`, `method`, `action`). It must be called from a component rendered *inside* the form, which makes it perfect for a reusable submit button.

```jsx
import { useFormStatus } from 'react-dom';

function SubmitButton({ children }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending}>
      {pending ? 'Saving…' : children}
    </button>
  );
}

function ProductForm({ action }) {
  return (
    <form action={action}>
      <input name="name" />
      <SubmitButton>Save product</SubmitButton>   {/* Reads this form's status */}
    </form>
  );
}
```

> **Gotcha:** Calling `useFormStatus` in the same component that renders the `<form>` doesn't work. It only reads a form *above* it.

### Explain useOptimistic @advanced #new
!! `useOptimistic(state, updateFn)` shows a temporary, optimistic version of state while an Action runs. Call `addOptimistic(value)` inside the Action; React renders the optimistic state immediately, then switches back to the real state when the Action finishes. If it failed, the optimistic change simply disappears.

```jsx
import { useOptimistic, startTransition } from 'react';

function Board({ applications, moveApplication }) {
  const [optimisticApps, setOptimisticStatus] = useOptimistic(
    applications,
    (current, { id, status }) => current.map(a => (a.id === id ? { ...a, status } : a))
  );

  function handleDrop(id, status) {
    startTransition(async () => {
      setOptimisticStatus({ id, status });   // Card moves instantly
      await moveApplication(id, status);     // Server Function; real data refreshes after
    });
  }

  return <Columns apps={optimisticApps} onDrop={handleDrop} />;
}
```

The optimistic update must happen inside a transition or form action.

### What is the use() API? @advanced #new
!! `use(resource)` reads the value of a **promise** or a **context** during render. With a promise, the component suspends until it resolves (show a `<Suspense>` fallback) and rejections go to the nearest error boundary. Unlike hooks, `use` can be called inside conditions and loops.

```jsx
// page.jsx: a Server Component creates the promise and passes it down
import { Suspense } from 'react';
import Comments from './Comments';

export default function Page() {
  const commentsPromise = getComments();   // Not awaited
  return (
    <Suspense fallback={<p>Loading comments…</p>}>
      <Comments commentsPromise={commentsPromise} />
    </Suspense>
  );
}
```

```jsx
// Comments.jsx: a Client Component reads it
'use client';
import { use } from 'react';

export default function Comments({ commentsPromise }) {
  const comments = use(commentsPromise);
  return comments.map(c => <p key={c.id}>{c.text}</p>);
}
```

> Don't create the promise inside a Client Component's render. A new promise every render suspends forever. Create it in a Server Component, a loader, or a cache.

### What are React Server Components? @intermediate #new
!! Server Components render **only on the server** (at build time or per request). Their code never ships to the browser. They can be `async` and read data directly from a database, the file system or private APIs, but they can't use state, effects, event handlers or browser APIs. In Next.js App Router they're the default.

```tsx
// app/products/page.tsx (a Server Component by default)
import { db } from '@/lib/db';
import AddToCartButton from './AddToCartButton';   // A Client Component

export default async function ProductsPage() {
  const products = await db.product.findMany();   // Direct DB access; secrets stay on the server
  return (
    <ul>
      {products.map(p => (
        <li key={p.id}>
          {p.name}
          <AddToCartButton productId={p.id} />
        </li>
      ))}
    </ul>
  );
}
```

Benefits: less JavaScript in the client bundle, no client-server fetch waterfall, secrets and heavy libraries stay on the server, and HTML can stream.

### When does a component need 'use client'? @intermediate #new #gate
!! **In one sentence:** a component needs `'use client'` when it uses state, effects, event handlers, refs to the DOM, browser-only APIs, or a client-only library. In other words, anything interactive that must run in the browser.

- `'use client'` at the top of a file marks a **boundary**: that module and everything it imports become client code.
- Push it down to the **smallest interactive leaf** (the button, not the page).
- Server Components can render Client Components and pass them **serializable** props (strings, numbers, plain objects, arrays, Dates, promises, Server Functions), but not ordinary functions or class instances.
- A Client Component can't import a Server Component, but it can receive one as `children`.

```tsx
// AddToCartButton.tsx
'use client';
import { useState } from 'react';

export default function AddToCartButton({ productId }: { productId: string }) {
  const [added, setAdded] = useState(false);
  return <button onClick={() => setAdded(true)}>{added ? 'Added' : 'Add to cart'}</button>;
}
```

> "Client Component" doesn't mean "client-only rendering". Client Components are still pre-rendered to HTML on the server, then hydrated.

### Compare Server Components and Client Components @intermediate #new
!! Server Components handle data and static structure with zero client JavaScript. Client Components handle interactivity. A typical page is a Server Component tree with small Client Component leaves.

| | Server Component | Client Component |
|---|---|---|
| Directive | None (the default in RSC frameworks) | `'use client'` |
| Runs | Server only | Server (pre-render) + browser |
| Can be `async` | Yes | No |
| State, effects, event handlers | No | Yes |
| Browser APIs | No | Yes |
| Direct DB, file system, secrets | Yes | No |
| Adds to client bundle | No | Yes |

### What are Server Functions ('use server')? @intermediate #new
!! A Server Function is an async function marked with `'use server'` that runs on the server but can be called from the client, for example as a form `action` or from an event handler. Next.js calls them **Server Actions** when used for mutations. Treat them like public API endpoints: validate input and check authorization every time.

```ts
// app/products/actions.ts
'use server';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

const schema = z.object({ name: z.string().min(2), price: z.number().positive() });

export async function createProduct(prevState: unknown, formData: FormData) {
  const session = await getSession();
  if (!session) return { error: 'Not signed in' };

  const parsed = schema.safeParse({
    name: formData.get('name'),
    price: Number(formData.get('price')),
  });
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors };

  await db.product.create({ data: parsed.data });
  revalidatePath('/products');   // Refresh server-rendered data
  return { success: true };
}
```

```tsx
'use client';
import { useActionState } from 'react';
import { createProduct } from './actions';

export function NewProductForm() {
  const [state, formAction, isPending] = useActionState(createProduct, null);
  return <form action={formAction}>{/* inputs, errors from state, pending button */}</form>;
}
```

### How do loading.tsx and error.tsx map to React concepts in Next.js? @intermediate
!! They're file-based wrappers around React primitives. `loading.tsx` wraps the route's page in a **`<Suspense>`** boundary, and `error.tsx` is an **error boundary** (it must be a Client Component). `layout.tsx` wraps child routes and **stays mounted** across navigation, so its state persists. `not-found.tsx` renders for `notFound()`.

```
app/
  layout.tsx            ← persistent shell (header, nav)
  products/
    page.tsx            ← async Server Component
    loading.tsx         ← Suspense fallback while page.tsx streams
    error.tsx           ← 'use client' error boundary with a retry button
    [id]/page.tsx       ← dynamic segment: params.id
```

In recent Next.js versions, `params` is a Promise in pages and layouts: `const { id } = await params;`.

### What is the <Activity> component? @advanced #new
!! `<Activity mode="visible" | "hidden">` (React 19.2) hides part of the UI **without unmounting it**. State and DOM are preserved, effects are cleaned up while hidden, and hidden content can pre-render at low priority. It's a better fit than conditional rendering for tabs or panels you expect users to return to.

```jsx
import { Activity } from 'react';

<Activity mode={tab === 'reports' ? 'visible' : 'hidden'}>
  <Reports />   {/* Keeps filters and scroll position when you switch tabs */}
</Activity>
```

### How does React 19 handle document metadata? @basic #new
!! You can render `<title>`, `<meta>` and `<link>` tags inside any component, and React hoists them into the document `<head>`. Libraries like react-helmet are no longer needed for basic cases. Frameworks such as Next.js also offer their own Metadata API.

```jsx
function BlogPost({ post }) {
  return (
    <article>
      <title>{post.title}</title>
      <meta name="description" content={post.summary} />
      <h1>{post.title}</h1>
    </article>
  );
}
```

## legacy | Modern vs legacy React | Skip list | –

### Class components vs function components: what changed? @basic #legacy
!! New code uses function components with hooks. Classes use `this.state`, `this.setState` (which **merges** objects) and lifecycle methods; functions use `useState` (which **replaces** the value) and `useEffect`. Functions need less code, avoid `this` binding bugs, and share logic through custom hooks. You only need to *read* classes.

```jsx
// Class (legacy; read-only knowledge)
class Counter extends React.Component {
  state = { count: 0 };
  increment = () => this.setState(prev => ({ count: prev.count + 1 }));
  render() {
    return <button onClick={this.increment}>{this.state.count}</button>;
  }
}

// Function (modern)
function Counter() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(c => c + 1)}>{count}</button>;
}
```

Error boundaries are the one thing React still only supports as classes, and libraries hide that.

### How do class lifecycle methods map to hooks? @intermediate #legacy
!! Mount, update and unmount logic all map onto `useEffect` with the right dependencies and cleanup. In hooks, though, you think in terms of "synchronize with X" rather than lifecycle moments.

| Class | Function equivalent |
|---|---|
| `constructor` / `this.state` | `useState`, `useReducer` |
| `componentDidMount` | `useEffect(fn, [])` |
| `componentDidUpdate` (when x changes) | `useEffect(fn, [x])` |
| `componentWillUnmount` | Cleanup returned from `useEffect` |
| `shouldComponentUpdate` / `PureComponent` | `memo` (or React Compiler) |
| `getDerivedStateFromProps` | Compute during render, or a `key` |
| `this.myRef = createRef()` | `useRef` |
| `getDerivedStateFromError` / `componentDidCatch` | No hook; use `react-error-boundary` |

### What happened to PropTypes and defaultProps? @basic #legacy
!! React 19 removed `propTypes` checking (it's silently ignored) and `defaultProps` for function components. Use TypeScript for prop types and default parameter values for defaults. Classes still support `defaultProps`.

```tsx
// ❌ Legacy
Button.propTypes = { variant: PropTypes.string };
Button.defaultProps = { variant: 'primary' };

// ✅ Modern
type ButtonProps = { variant?: 'primary' | 'ghost' };
function Button({ variant = 'primary' }: ButtonProps) { /* ... */ }
```

### Classic Redux vs modern alternatives: what would you use? @intermediate #legacy
!! Classic Redux (`connect`, `mapStateToProps`, hand-written action types and `switch` reducers) is 2016–2019 boilerplate. Today, put server data in TanStack Query and client state in Zustand (or Context). Learn **Redux Toolkit** if a job uses Redux. It's the official modern way, with `createSlice`, `configureStore`, hooks and RTK Query.

```js
// Redux Toolkit: what "Redux" means in a modern codebase
import { createSlice, configureStore } from '@reduxjs/toolkit';

const cartSlice = createSlice({
  name: 'cart',
  initialState: { items: [] },
  reducers: {
    added(state, action) { state.items.push(action.payload); },   // Immer makes this safe
  },
});

export const { added } = cartSlice.actions;
export const store = configureStore({ reducer: { cart: cartSlice.reducer } });

// In components: useSelector(s => s.cart.items), useDispatch()
```

### What is React Fiber? (the one-paragraph answer) @intermediate #legacy
!! Fiber is React's reconciliation engine, rewritten in React 16. It splits rendering into small units of work that can be paused, prioritized and resumed, instead of one blocking pass. That's what makes concurrent features such as transitions, Suspense and streaming possible. React renders (computes changes, interruptible), then commits (applies them to the DOM in one go).

That's the depth interviews need. Deeper internals (fiber nodes, lanes, the work loop) are trivia unless you're applying to work on React itself.
