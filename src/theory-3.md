@section theory

## query | Server state with TanStack Query | Week 5 | 12

### What is the difference between server state and client state? @basic
!! **Server state** lives on a server: you don't own it, it can change without you knowing, and your copy goes stale (products, users, orders). **Client state** exists only in the browser and you fully own it (modal open, selected tab, theme). They need different tools.

| | Server state | Client state |
|---|---|---|
| Source of truth | Backend / database | The browser |
| Can go stale | Yes | No |
| Needs | Caching, refetching, dedupe, retries, invalidation | Simple reads and writes |
| Tool | TanStack Query (or framework loaders) | `useState`, Context, Zustand, the URL |

Most of what apps call "state" is really cached server data. Moving it into TanStack Query usually removes most of the global store.

### Why not fetch inside useEffect in a real app? @intermediate #legacy
!! Raw effect fetching makes you hand-build what a data library already does: race-condition handling, caching, deduplication, retries, background refetching, pagination, and invalidation after mutations. It also double-fetches in Strict Mode and encourages request waterfalls.

Fetch with an effect once to understand the problem (Week 3), then use TanStack Query or your framework's data loading. A Week 5 checkpoint is "no `useEffect` fetches remain anywhere in the app."

### Explain useQuery: queryKey, queryFn and the returned state @basic
!! `useQuery({ queryKey, queryFn })` fetches and caches data. The **query key** is a serializable array that identifies the data and acts like a dependency array: when it changes, a new query runs. The hook returns `data`, `error`, and status flags such as `isPending`, `isError` and `isFetching`.

```jsx
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Products category="lamps" />
    </QueryClientProvider>
  );
}

function Products({ category }) {
  const { data, isPending, isError, error } = useQuery({
    queryKey: ['products', { category }],
    queryFn: async () => {
      const res = await fetch(`/api/products?category=${category}`);
      if (!res.ok) throw new Error('Failed to load products');
      return res.json();
    },
  });

  if (isPending) return <p>Loading…</p>;
  if (isError) return <p>Error: {error.message}</p>;
  return <ul>{data.map(p => <li key={p.id}>{p.name}</li>)}</ul>;
}
```

- Put **every variable the query depends on** in the key.
- `queryFn` must throw on failure. `fetch` doesn't reject on HTTP errors, so check `res.ok`.
- Add `@tanstack/react-query-devtools` to inspect the cache.

### What are staleTime and gcTime? @intermediate
!! `staleTime` is how long data counts as fresh. While fresh, TanStack Query serves it from cache without refetching. `gcTime` (called `cacheTime` before v5) is how long **unused** data stays in memory before garbage collection.

- Default `staleTime` is `0`: data is stale immediately, so it's refetched in the background on mount, window focus and reconnect, while still showing cached data instantly (stale-while-revalidate).
- Default `gcTime` is 5 minutes.
- Raise `staleTime` for data that rarely changes: `staleTime: 60_000`.

```jsx
useQuery({ queryKey: ['categories'], queryFn: fetchCategories, staleTime: 5 * 60 * 1000 });
```

### How do mutations work, and how does the UI update afterwards? @intermediate
!! `useMutation({ mutationFn })` runs writes (POST, PUT, DELETE). After success, **invalidate** the affected queries so they refetch, or write the result straight into the cache with `setQueryData`.

```jsx
import { useMutation, useQueryClient } from '@tanstack/react-query';

function AddProduct() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: newProduct =>
      fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProduct),
      }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });   // Refetch every products query
    },
  });

  return (
    <button disabled={mutation.isPending} onClick={() => mutation.mutate({ name: 'Lamp', price: 39 })}>
      {mutation.isPending ? 'Saving…' : 'Add product'}
    </button>
  );
}
```

`invalidateQueries` matches by prefix: `['products']` also invalidates `['products', { category: 'lamps' }]`.

### What is an optimistic update, and how do you roll it back? @advanced
!! An optimistic update changes the UI **before** the server confirms, so the app feels instant. In `onMutate`, cancel in-flight queries, snapshot the current cache, and write the expected result. In `onError`, restore the snapshot. In `onSettled`, invalidate to sync with the server.

```jsx
const deleteProduct = useMutation({
  mutationFn: id => fetch(`/api/products/${id}`, { method: 'DELETE' }),

  onMutate: async id => {
    await queryClient.cancelQueries({ queryKey: ['products'] });
    const previous = queryClient.getQueryData(['products']);
    queryClient.setQueryData(['products'], old => old.filter(p => p.id !== id));
    return { previous };                       // Becomes `context`
  },

  onError: (_err, _id, context) => {
    queryClient.setQueryData(['products'], context.previous);   // Roll back
    toast.error('Delete failed');
  },

  onSettled: () => {
    queryClient.invalidateQueries({ queryKey: ['products'] });
  },
});
```

A simpler v5 alternative for a single screen: render `mutation.variables` as a pending row while `mutation.isPending`, with no cache writes at all.

### How do you paginate without flashing a loading state? @intermediate
!! Put the page in the query key and set `placeholderData: keepPreviousData`. While the next page loads, the previous page's data stays on screen, and `isPlaceholderData` tells you it's not the current page yet.

```jsx
import { keepPreviousData, useQuery } from '@tanstack/react-query';

function ProductTable() {
  const [page, setPage] = useState(1);

  const { data, isPending, isPlaceholderData } = useQuery({
    queryKey: ['products', { page }],
    queryFn: () => fetchProducts(page),
    placeholderData: keepPreviousData,
  });

  if (isPending) return <p>Loading…</p>;

  return (
    <>
      <Table rows={data.items} dimmed={isPlaceholderData} />
      <button onClick={() => setPage(p => p - 1)} disabled={page === 1}>Previous</button>
      <button
        onClick={() => setPage(p => p + 1)}
        disabled={isPlaceholderData || !data.hasMore}
      >
        Next
      </button>
    </>
  );
}
```

### isPending vs isFetching vs isLoading: what's the difference? @intermediate
!! `isPending` means there's **no data yet**. `isFetching` means **a request is in flight**, including background refetches when data already exists. `isLoading` is `isPending && isFetching`: the first load is actually happening.

| Situation | isPending | isFetching | isLoading |
|---|---|---|---|
| First load in progress | true | true | true |
| Cached data, background refetch | false | true | false |
| Disabled query, no data | true | false | false |
| Data loaded, idle | false | false | false |

Show a full-page spinner for `isPending` and a subtle indicator for `isFetching`.

### How do you run a query that depends on another value? @intermediate
!! Use the `enabled` option. The query won't run until `enabled` is true, which is useful when the input comes from another query or from user selection.

```jsx
const { data: user } = useQuery({ queryKey: ['user', email], queryFn: () => getUser(email) });

const { data: projects } = useQuery({
  queryKey: ['projects', user?.id],
  queryFn: () => getProjects(user.id),
  enabled: !!user?.id,   // Waits for the user query
});
```

## rhf | Forms at scale: React Hook Form + Zod | Week 5 | 13

### Why use React Hook Form instead of useState for every field? @intermediate
!! React Hook Form registers **uncontrolled** inputs through refs, so typing doesn't re-render the whole form on every keystroke. It also gives you validation, error messages, dirty and touched tracking, and submit state with very little code.

Hand-rolled controlled forms are fine for two or three fields. For real forms (10+ fields, validation, async submit) you'd rebuild most of what React Hook Form provides.

### What is React Hook Form's core API? @basic
!! `useForm()` returns `register` (connects an input), `handleSubmit` (validates, then calls your function with typed values), and `formState` (`errors`, `isSubmitting`, `isDirty`). `reset`, `watch` and `setValue` cover the rest.

```jsx
import { useForm } from 'react-hook-form';

function LoginForm() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();

  async function onSubmit(values) {
    await api.login(values);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <label htmlFor="email">Email</label>
      <input id="email" type="email" {...register('email', { required: 'Email is required' })} />
      {errors.email && <p role="alert">{errors.email.message}</p>}

      <button disabled={isSubmitting}>{isSubmitting ? 'Signing in…' : 'Sign in'}</button>
    </form>
  );
}
```

### How do you combine React Hook Form with Zod and get types from one schema? @intermediate #gate
!! Define a Zod schema, pass `zodResolver(schema)` as the form's `resolver`, and derive the TypeScript type with `z.infer<typeof schema>`. One schema then drives validation and types, and you can reuse it on the server.

```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const productSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  price: z.number().positive('Price must be positive'),
  category: z.enum(['lamps', 'chairs', 'desks']),
});
type ProductForm = z.infer<typeof productSchema>;

function ProductFormDialog({ onSave }: { onSave: (p: ProductForm) => Promise<void> }) {
  const { register, handleSubmit, formState: { errors } } = useForm<ProductForm>({
    resolver: zodResolver(productSchema),
  });

  return (
    <form onSubmit={handleSubmit(onSave)}>
      <input {...register('name')} />
      {errors.name && <p>{errors.name.message}</p>}

      <input type="number" step="0.01" {...register('price', { valueAsNumber: true })} />
      {errors.price && <p>{errors.price.message}</p>}

      <select {...register('category')}>
        <option value="lamps">Lamps</option>
        <option value="chairs">Chairs</option>
        <option value="desks">Desks</option>
      </select>
      <button>Save</button>
    </form>
  );
}
```

### register vs Controller: when do you need Controller? @intermediate
!! Use `register` for native inputs (`input`, `select`, `textarea`). Use `Controller` (or `useController`) for **controlled** third-party components that don't expose a native input ref, such as custom selects, date pickers, and many shadcn/ui components.

```jsx
import { Controller } from 'react-hook-form';

<Controller
  name="dueDate"
  control={control}
  render={({ field }) => (
    <DatePicker selected={field.value} onChange={field.onChange} onBlur={field.onBlur} />
  )}
/>
```

### Why validate on the server if the client already validates? @basic
!! Client validation is for user experience. Anyone can bypass it with DevTools, curl, or a modified client. The server must validate every input. With Zod you share the **same schema** on both sides.

```ts
// Server (route handler or Server Function)
const result = productSchema.safeParse(body);
if (!result.success) {
  return { errors: result.error.flatten().fieldErrors };
}
await db.product.create({ data: result.data });   // Typed and validated
```

### What validation modes does React Hook Form support? @intermediate
!! The `mode` option controls when fields validate before the first submit: `'onSubmit'` (default), `'onBlur'`, `'onChange'`, `'onTouched'` or `'all'`. `reValidateMode` controls re-validation after a submit (default `'onChange'`).

`'onTouched'` is a good UX default: no errors while the user is still typing in a field for the first time, then live feedback once they've left it.

## styling | Styling: Tailwind CSS & shadcn/ui | Week 5 | 14

### What are the ways to style React components, and which would you pick today? @basic #legacy
!! The main options are plain or global CSS, CSS Modules, utility-first CSS (Tailwind), inline `style` objects, and runtime CSS-in-JS. For new projects, choose Tailwind CSS or CSS Modules. Runtime CSS-in-JS such as styled-components entered maintenance mode in 2025 and adds runtime cost.

| Approach | Pros | Cons |
|---|---|---|
| CSS Modules (`Button.module.css`) | Scoped class names, plain CSS | Context-switching between files |
| Tailwind CSS | Fast, consistent design tokens, no naming | Long class strings |
| Inline `style={{}}` | Dynamic values | No hover, media queries or pseudo-elements |
| Runtime CSS-in-JS | Co-located, dynamic | Runtime cost, problems with Server Components |

### How does Tailwind CSS work in a React component? @basic
!! You compose small utility classes in `className`: layout (`flex`, `grid`), spacing (`p-4`, `gap-2`), responsive prefixes (`md:`), state variants (`hover:`, `focus-visible:`) and `dark:`. For conditional classes, use a small helper such as `clsx` with `tailwind-merge` (the `cn()` helper shadcn uses).

```jsx
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
const cn = (...inputs) => twMerge(clsx(inputs));

function ProductCard({ product }) {
  return (
    <article className="rounded-lg border p-4 shadow-sm md:p-6 dark:border-zinc-700">
      <h3 className="text-lg font-semibold">{product.name}</h3>
      <span
        className={cn(
          'rounded px-2 py-0.5 text-xs',
          product.inStock ? 'bg-green-100 text-green-800' : 'bg-zinc-200 text-zinc-500'
        )}
      >
        {product.inStock ? 'In stock' : 'Out of stock'}
      </span>
    </article>
  );
}

// Responsive grid: 1 column on phones, 2 on tablets, 4 on desktop
<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">...</div>
```

Avoid building class names from string fragments like `` `bg-${color}-500` ``. Tailwind only generates classes it can find as complete strings in your source.

### What is shadcn/ui, and how is it different from MUI or Chakra? @intermediate
!! shadcn/ui isn't an npm dependency. Its CLI **copies component source code into your project** (Button, Dialog, Table, Form, toasts), built with Tailwind on accessible headless primitives such as Radix UI. You own and edit the code; there's no library version to upgrade or fight.

```bash
npx shadcn@latest init
npx shadcn@latest add button dialog table
```

- **MUI or Chakra:** install a package, customize through themes and props, receive updates.
- **shadcn/ui:** code lives in `components/ui/`, you customize by editing it, and accessibility comes from the primitives.

> Because you own the code, read it. It's a good way to learn accessible component patterns.

### How do you implement dark mode in a React + Tailwind app? @intermediate
!! Configure Tailwind's `dark:` variant to follow a `.dark` class, toggle that class on `<html>` from React (usually via a theme Context), and persist the choice in `localStorage`, defaulting to the OS preference.

```css
/* Tailwind v4: index.css */
@import "tailwindcss";
@custom-variant dark (&:where(.dark, .dark *));
```

```jsx
function useDarkMode() {
  const [dark, setDark] = useState(
    () => localStorage.theme === 'dark' ||
      (!('theme' in localStorage) && matchMedia('(prefers-color-scheme: dark)').matches)
  );

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);   // Sync with the DOM
    localStorage.theme = dark ? 'dark' : 'light';
  }, [dark]);

  return [dark, setDark];
}
```

## zustand | Client global state: Zustand | Week 5 | 15

### What is Zustand, and when do you need a global store? @basic
!! Zustand is a small, hook-based state library. You create a store with state and actions, and components subscribe to just the slices they need. Use it for **client** state shared by distant components (cart, sidebar open, table density, multi-step wizard), not for server data.

```jsx
import { create } from 'zustand';

const useUiStore = create(set => ({
  sidebarOpen: true,
  density: 'comfortable',
  toggleSidebar: () => set(state => ({ sidebarOpen: !state.sidebarOpen })),
  setDensity: density => set({ density }),
}));

function SidebarToggle() {
  const toggle = useUiStore(s => s.toggleSidebar);
  return <button onClick={toggle}>☰</button>;
}

function Sidebar() {
  const open = useUiStore(s => s.sidebarOpen);
  return open ? <nav>…</nav> : null;
}
```

- No provider needed.
- `set` shallow-merges at the top level, so `set({ density })` keeps the other fields.

### Why should you read a Zustand store through selectors? @intermediate
!! A component re-renders only when the value its selector returns changes. `useStore(s => s.count)` re-renders only for count changes; `useStore()` with no selector re-renders on **any** store change. When selecting several fields as an object, wrap the selector in `useShallow`.

```jsx
import { useShallow } from 'zustand/react/shallow';

// ❌ Re-renders on every store change
const store = useCartStore();

// ❌ New object every time; in Zustand v5 this can loop forever
const { items, total } = useCartStore(s => ({ items: s.items, total: s.total }));

// ✅ Single values
const items = useCartStore(s => s.items);

// ✅ Several values with shallow comparison
const { items, total } = useCartStore(useShallow(s => ({ items: s.items, total: s.total })));
```

### Zustand vs Context vs Redux Toolkit: how do you choose? @intermediate
!! Use Context for rarely changing, app-wide values; Zustand for frequently changing shared client state with minimal boilerplate; and Redux Toolkit when a team or job already uses it or you need its strict patterns and tooling.

| | Context | Zustand | Redux Toolkit |
|---|---|---|---|
| Boilerplate | Low | Very low | Medium |
| Selective re-renders | No (all consumers) | Yes (selectors) | Yes (selectors) |
| Provider needed | Yes | No | Yes |
| DevTools / middleware | No | Yes (devtools, persist) | Excellent |
| Best for | Theme, auth, locale | UI state, cart, wizards | Large teams, existing codebases |

### How do you persist a Zustand store to localStorage? @intermediate
!! Wrap the store creator in the `persist` middleware and give it a unique `name`. Use `partialize` to save only the fields you want.

```jsx
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const usePrefsStore = create(
  persist(
    set => ({
      density: 'comfortable',
      sidebarOpen: true,
      setDensity: density => set({ density }),
    }),
    {
      name: 'ui-prefs',
      partialize: state => ({ density: state.density }),   // Don't persist sidebarOpen
    }
  )
);
```

### How do you type a Zustand store in TypeScript? @intermediate
!! Declare the state-and-actions type and use the curried form `create<State>()(...)`. The extra `()` lets TypeScript infer middleware types correctly.

```tsx
type CartItem = { id: string; name: string; qty: number; price: number };

type CartState = {
  items: CartItem[];
  add: (item: Omit<CartItem, 'qty'>) => void;
  remove: (id: string) => void;
};

export const useCartStore = create<CartState>()(set => ({
  items: [],
  add: item =>
    set(state => {
      const existing = state.items.find(i => i.id === item.id);
      return {
        items: existing
          ? state.items.map(i => (i.id === item.id ? { ...i, qty: i.qty + 1 } : i))
          : [...state.items, { ...item, qty: 1 }],
      };
    }),
  remove: id => set(state => ({ items: state.items.filter(i => i.id !== id) })),
}));
```

## testing | Testing: Vitest, React Testing Library & MSW | Week 6 | 16

### What is React Testing Library's philosophy? @basic #legacy
!! Test components the way users use them: find elements by role, label and text, interact like a user, and assert on what appears on screen. Don't test implementation details such as internal state, hook calls or component instances. Enzyme, which encouraged that style, is unmaintained and doesn't support modern React.

```jsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

test('shows a greeting after submitting a name', async () => {
  const user = userEvent.setup();
  render(<Greeter />);

  await user.type(screen.getByLabelText(/name/i), 'Ana');
  await user.click(screen.getByRole('button', { name: /greet/i }));

  expect(screen.getByText('Hello, Ana!')).toBeInTheDocument();
});
```

> **Interview tip:** The closer a test is to how a real user works the page, the more it proves. Refactors that don't change behaviour shouldn't break it.

### What is the difference between getBy, queryBy and findBy? @basic
!! `getBy*` returns the element or **throws** if it's missing. `queryBy*` returns `null` instead of throwing, so use it to assert absence. `findBy*` returns a **promise** that waits for the element, so use it for async UI.

| Query | Not found | Async | Use for |
|---|---|---|---|
| `getBy` | Throws | No | Elements that should be there now |
| `queryBy` | Returns `null` | No | `expect(...).not.toBeInTheDocument()` |
| `findBy` | Rejects after timeout | Yes | Elements that appear after fetch or state change |

`getAllBy`, `queryAllBy` and `findAllBy` return arrays.

```jsx
expect(await screen.findByRole('row', { name: /desk lamp/i })).toBeInTheDocument();
expect(screen.queryByText(/error/i)).not.toBeInTheDocument();
```

### Which query should you prefer, and why getByRole? @intermediate
!! Prefer queries everyone can use: `getByRole` (with `name`) first, then `getByLabelText`, `getByPlaceholderText`, `getByText`, `getByDisplayValue`, and `getByTestId` only as a last resort. `getByRole` matches what assistive technologies see, so it also checks your accessibility.

```jsx
screen.getByRole('button', { name: /save/i });
screen.getByRole('heading', { level: 2, name: /reports/i });
screen.getByRole('textbox', { name: /email/i });
screen.getByLabelText(/password/i);
```

If you can't find an element by role, that often points to an accessibility bug, such as a clickable `div` instead of a `button`.

### fireEvent vs userEvent: which should you use? @intermediate
!! Use `@testing-library/user-event`. It simulates complete interactions the way a browser does (focus, keydown, keypress, input, keyup, click). `fireEvent` dispatches a single DOM event and can miss behaviour real users trigger.

```jsx
const user = userEvent.setup();          // Call setup() before render
render(<SignupForm />);
await user.type(screen.getByLabelText(/email/i), 'ana@example.com');
await user.selectOptions(screen.getByLabelText(/plan/i), 'pro');
await user.click(screen.getByRole('checkbox', { name: /terms/i }));
await user.keyboard('{Enter}');
```

All `user.*` calls are async; always `await` them.

### Why mock the network with MSW instead of mocking fetch? @intermediate
!! Mock Service Worker intercepts requests at the network level, so your components, hooks and data library run their real code paths. Tests don't care whether you use `fetch`, axios or TanStack Query, and you can reuse the same handlers in development.

```js
// src/mocks/handlers.js
import { http, HttpResponse } from 'msw';

export const handlers = [
  http.get('/api/products', () =>
    HttpResponse.json([
      { id: '1', name: 'Desk lamp', price: 39 },
      { id: '2', name: 'Chair', price: 120 },
    ])
  ),
];

// vitest.setup.js
import { setupServer } from 'msw/node';
import { handlers } from './src/mocks/handlers';
export const server = setupServer(...handlers);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// In one test, override a handler to simulate an error
server.use(http.get('/api/products', () => new HttpResponse(null, { status: 500 })));
```

### What should you test first in a React app? @basic
!! Test behaviour that would hurt users if it broke: a form shows validation errors, a list renders data from the API (plus its loading and error states), and one mutation's happy path. Ten meaningful tests beat chasing 100% coverage.

Good first tests:

1. Submitting an empty form shows the right error messages.
2. The products page shows rows from the (mocked) API.
3. The error state appears when the API returns 500.
4. Creating an item shows it in the list and shows a toast.

### How do you test components that need providers (Query, Router, Context)? @advanced
!! Write a custom `render` helper that wraps the component in the providers it needs: a **fresh** `QueryClient` per test with retries off, a `MemoryRouter` with an initial URL, and any Context providers.

```jsx
import { render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';

export function renderWithProviders(ui, { route = '/' } = {}) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },   // Fail fast in error tests
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[route]}>
        <AuthProvider>{ui}</AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>
  );
}
```

A new client per test stops cached data leaking between tests.

### What are common mistakes with React Testing Library? @intermediate
!! The usual ones: querying the DOM directly instead of using `screen` and accessible queries, using `getBy` for async content instead of `findBy`, wrapping things in `act` or `waitFor` unnecessarily, putting side effects inside `waitFor`, and asserting on implementation details.

| Mistake | Better |
|---|---|
| `container.querySelector('.btn')` | `screen.getByRole('button', { name })` |
| `const { getByText } = render(...)` | `screen.getByText(...)` |
| `await waitFor(() => getByText(x))` | `await screen.findByText(x)` |
| `expect(queryByX).toBeNull()` | `expect(queryByX).not.toBeInTheDocument()` (jest-dom) |
| `fireEvent.change(...)` | `await user.type(...)` |
| Clicking inside `waitFor` | Act first, then `waitFor` the assertion |
| `getByTestId` everywhere | Role, label, or text queries |

### How do you test a custom hook? @intermediate
!! Prefer testing a hook through a component that uses it. When the hook is a reusable unit, use `renderHook` from `@testing-library/react`, and wrap updates in `act`. Use Vitest fake timers for time-based hooks.

```jsx
import { renderHook, act } from '@testing-library/react';
import { vi } from 'vitest';

test('useDebounce updates after the delay', () => {
  vi.useFakeTimers();
  const { result, rerender } = renderHook(({ value }) => useDebounce(value, 300), {
    initialProps: { value: 'a' },
  });

  rerender({ value: 'ab' });
  expect(result.current).toBe('a');            // Not yet

  act(() => vi.advanceTimersByTime(300));
  expect(result.current).toBe('ab');           // After 300 ms
  vi.useRealTimers();
});
```

## perf | Performance & React Compiler | Week 6 | 16

### How do you find performance problems in a React app? @intermediate #gate
!! Measure before optimizing. Record an interaction with the **React DevTools Profiler** to see which components rendered, how long each took and why ("What caused this update?"). Then fix the slowest part and record again to compare before and after.

Tools:

- **React DevTools Profiler:** flame graph and ranked chart per commit, render reasons, highlight updates.
- **Chrome Performance panel:** long tasks, layout and paint. React 19.2 adds React-specific Performance tracks (Scheduler, Components).
- **Lighthouse:** load performance, bundle size hints.

Typical findings: one expensive component re-rendering on every keystroke, a huge list rendering every row, a heavy library in the main bundle.

### What do memo, useMemo and useCallback do? @intermediate
!! `memo(Component)` skips re-rendering a component when its props are shallowly equal to last time. `useMemo(fn, deps)` caches a **computed value** between renders. `useCallback(fn, deps)` caches a **function's identity**. They work together: a memoized child only benefits if the objects and functions you pass it are stable.

```jsx
import { memo, useMemo, useCallback, useState } from 'react';

const ProductList = memo(function ProductList({ products, onSelect }) {
  return products.map(p => (
    <button key={p.id} onClick={() => onSelect(p.id)}>{p.name}</button>
  ));
});

function Shop({ allProducts }) {
  const [query, setQuery] = useState('');
  const [theme, setTheme] = useState('light');

  const visible = useMemo(
    () => allProducts.filter(p => p.name.toLowerCase().includes(query.toLowerCase())),
    [allProducts, query]
  );

  const handleSelect = useCallback(id => console.log('selected', id), []);

  // Toggling theme doesn't re-render ProductList: props are referentially equal
  return (
    <div className={theme}>
      <button onClick={() => setTheme(t => (t === 'light' ? 'dark' : 'light'))}>Theme</button>
      <input value={query} onChange={e => setQuery(e.target.value)} />
      <ProductList products={visible} onSelect={handleSelect} />
    </div>
  );
}
```

### When should you NOT use useMemo, useCallback and memo? @intermediate #legacy
!! Don't wrap everything by default. Skip them when the computation is cheap, when the child would re-render anyway, or when dependencies change every render. Each one adds code and comparison cost. In 2026 the React Compiler memoizes automatically, so profile first and hand-memoize only proven hot spots.

- `useCallback` on a function passed to a non-memoized child does nothing useful.
- `useMemo` for `a + b` costs more than it saves.
- If a dependency is a new object each render, the memo never hits.

> Still know these hooks well. Interviewers ask about them, and you'll read them in every existing codebase.

### What is the React Compiler? @intermediate #new
!! The React Compiler (stable 1.0 since October 2025) is a build-time tool that automatically memoizes components and hooks, so you rarely write `useMemo`, `useCallback` or `memo` yourself. It relies on your code following the Rules of React: pure rendering, no mutation of props or state, and hooks called correctly.

```js
// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    react({
      babel: { plugins: ['babel-plugin-react-compiler'] },
    }),
  ],
});
```

- Next.js: set `reactCompiler: true` in `next.config`.
- `eslint-plugin-react-hooks` (recommended preset) reports code the compiler can't optimize.
- Opt a component out with the `"use no memo"` directive while you fix it.
- Code that breaks the rules isn't miscompiled; the compiler skips it.

### How do you code-split with lazy and Suspense? @intermediate
!! `lazy(() => import('./Page'))` loads a component's code only when it first renders. Wrap it in `<Suspense fallback={...}>` to show something while the chunk downloads. Route-level splitting gives the biggest win for the least effort.

```jsx
import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router';

const Reports = lazy(() => import('./pages/Reports'));
const Settings = lazy(() => import('./pages/Settings'));

function App() {
  return (
    <Suspense fallback={<PageSpinner />}>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </Suspense>
  );
}
```

`lazy` must be called at module level, and the module needs a default export.

### What are useTransition and useDeferredValue? @advanced
!! Both mark some updates as **non-urgent** so React keeps typing and clicking responsive. `useTransition` wraps a state update you trigger (`startTransition(() => setTab(next))`) and gives you `isPending`. `useDeferredValue(value)` gives you a lagging copy of a value, so an expensive child can render with the old value while urgent updates happen first.

```jsx
function Search({ items }) {
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);   // May lag behind while typing
  const isStale = query !== deferredQuery;

  return (
    <>
      <input value={query} onChange={e => setQuery(e.target.value)} />  {/* Always responsive */}
      <div style={{ opacity: isStale ? 0.6 : 1 }}>
        <SlowList items={items} query={deferredQuery} />
      </div>
    </>
  );
}

function Tabs() {
  const [tab, setTab] = useState('home');
  const [isPending, startTransition] = useTransition();
  return (
    <button onClick={() => startTransition(() => setTab('reports'))}>
      Reports {isPending && '…'}
    </button>
  );
}
```

`SlowList` should be memoized (or compiled) so it can skip rendering when `deferredQuery` hasn't changed. In React 19, functions passed to `startTransition` can be async; these are called Actions.

### How can you avoid re-renders without any memoization? @advanced
!! Use composition: **move state down** into the smallest component that needs it, or **lift content up** by passing expensive subtrees as `children`. Components created by a parent that didn't re-render are reused as-is.

```jsx
// ❌ Typing re-renders ExpensiveTree because state lives in App
function App() {
  const [color, setColor] = useState('red');
  return (
    <div style={{ color }}>
      <input value={color} onChange={e => setColor(e.target.value)} />
      <ExpensiveTree />
    </div>
  );
}

// ✅ State moved into a wrapper; ExpensiveTree is passed as children
function ColorPicker({ children }) {
  const [color, setColor] = useState('red');
  return (
    <div style={{ color }}>
      <input value={color} onChange={e => setColor(e.target.value)} />
      {children}
    </div>
  );
}

function App() {
  return (
    <ColorPicker>
      <ExpensiveTree />   {/* Created by App, which doesn't re-render */}
    </ColorPicker>
  );
}
```

Other no-memo techniques: virtualize long lists (TanStack Virtual), debounce expensive work, and paginate.

## errors | Error boundaries, Suspense & accessibility | Week 6 | 16

### What is an error boundary? @intermediate
!! An error boundary catches JavaScript errors thrown while **rendering** its child tree, logs them, and shows a fallback UI instead of unmounting the whole app. React only supports them as class components, so in practice you use the `react-error-boundary` package.

```jsx
import { ErrorBoundary } from 'react-error-boundary';

function ErrorFallback({ error, resetErrorBoundary }) {
  return (
    <div role="alert">
      <p>Something went wrong:</p>
      <pre>{error.message}</pre>
      <button onClick={resetErrorBoundary}>Try again</button>
    </div>
  );
}

<ErrorBoundary
  FallbackComponent={ErrorFallback}
  onError={(error, info) => logToService(error, info.componentStack)}
  onReset={() => queryClient.resetQueries()}
>
  <ReportsPage />
</ErrorBoundary>
```

Under the hood a boundary is a class with `static getDerivedStateFromError()` (to render the fallback) and `componentDidCatch()` (to log).

### Which errors do error boundaries NOT catch? @intermediate
!! Error boundaries don't catch errors in **event handlers**, **async code** (`setTimeout`, promise callbacks that run outside rendering), **server-side rendering**, or errors thrown **in the boundary itself**. Use `try/catch` there, and send the error to a boundary with `showBoundary` if you want the fallback UI.

```jsx
import { useErrorBoundary } from 'react-error-boundary';

function SaveButton() {
  const { showBoundary } = useErrorBoundary();

  async function handleClick() {
    try {
      await saveReport();
    } catch (err) {
      showBoundary(err);   // Shows the nearest boundary's fallback
    }
  }
  return <button onClick={handleClick}>Save</button>;
}
```

In React 19, errors thrown inside Actions (functions passed to `startTransition` or to a form `action`) **do** propagate to the nearest error boundary.

### Where should you place error boundaries? @intermediate
!! Put one around each route so a crash on one page doesn't blank the app, plus around risky, independent widgets (charts, third-party embeds). Reset the boundary when the user navigates by passing the location as a `resetKeys` value.

```jsx
function RouteBoundary({ children }) {
  const location = useLocation();
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback} resetKeys={[location.pathname]}>
      {children}
    </ErrorBoundary>
  );
}
```

Too few boundaries means one bug takes down everything. Too many fragments the UI with error boxes.

### What is Suspense? @intermediate
!! `<Suspense fallback={...}>` shows a fallback while something in its subtree is **suspended**, meaning it isn't ready to render. Things that suspend include `lazy` components, `use(promise)`, Suspense-enabled data libraries (`useSuspenseQuery`), and streamed Server Components. Nested boundaries let parts of the page appear independently.

```jsx
<Suspense fallback={<HeaderSkeleton />}>
  <Header />
  <Suspense fallback={<ChartSkeleton />}>
    <SalesChart />   {/* Can load after the header */}
  </Suspense>
</Suspense>
```

Suspense doesn't detect data fetched inside `useEffect`. The data source must integrate with Suspense.

### How do you handle uncaught errors globally in React 19? @advanced #new
!! React 19 adds root options `onUncaughtError`, `onCaughtError` and `onRecoverableError` to `createRoot` (and `hydrateRoot`). Use them to report every error to a monitoring service in one place. Uncaught errors are now reported once to `window.reportError` instead of being logged twice.

```jsx
createRoot(document.getElementById('root'), {
  onCaughtError: (error, info) => monitoring.log('caught', error, info.componentStack),
  onUncaughtError: (error, info) => monitoring.log('uncaught', error, info.componentStack),
}).render(<App />);
```

### How do you make a React app accessible? @intermediate
!! Use semantic HTML (real `button`, `nav`, `main`, headings in order), label every input, make everything keyboard-usable with a visible focus style, manage focus in dialogs and after navigation, and add ARIA only when HTML can't express it. Verify with Lighthouse, the keyboard, and `getByRole` in tests.

```jsx
// ❌ Not focusable, no role, invisible to screen readers as a control
<div className="btn" onClick={save}>Save</div>
<input placeholder="Email" />

// ✅
<button type="button" onClick={save}>Save</button>
<label htmlFor="email">Email</label>
<input id="email" type="email" aria-invalid={!!errors.email} aria-describedby="email-error" />
{errors.email && <p id="email-error" role="alert">{errors.email.message}</p>}
```

- Use `useId()` to generate stable ids for label and description pairs in reusable components.
- Don't remove focus outlines without replacing them (`focus-visible:` styles).
- `eslint-plugin-jsx-a11y` catches many issues while you type.
