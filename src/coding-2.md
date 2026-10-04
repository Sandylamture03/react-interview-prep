@section coding

## c-ts-router | TypeScript & routing | Week 4 | 10–11

### Typed Button that extends native props @basic
Write a TypeScript `Button` component that:

- Accepts **every** native `<button>` attribute (`type`, `disabled`, `onClick`, `aria-*`, and so on) plus `ref`.
- Adds `variant: 'primary' | 'ghost' | 'danger'` (default `'primary'`) and `size?: 'sm' | 'md'`.
- Shows a spinner and disables itself when `loading` is true.
- Merges any `className` passed in.
-- answer --
```tsx
type ButtonProps = React.ComponentProps<'button'> & {
  variant?: 'primary' | 'ghost' | 'danger';
  size?: 'sm' | 'md';
  loading?: boolean;
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  className = '',
  children,
  ...rest   // type, onClick, aria-*, ref (React 19: ref is a prop)
}: ButtonProps) {
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`btn btn-${variant} btn-${size} ${className}`.trim()}
    >
      {loading && <span className="spinner" aria-hidden="true" />}
      {children}
    </button>
  );
}

// Usage: fully type-checked
<Button variant="danger" type="submit" onClick={e => console.log(e.currentTarget)}>
  Delete
</Button>;
// <Button variant="link" />  ✗ Type error: "link" isn't assignable
```

**Key points:** `ComponentProps<'button'>` brings in every native attribute and, in React 19, `ref`; `...rest` forwards them; `disabled || loading` keeps the caller's `disabled` working.

### Generic useAsync hook with a discriminated union @intermediate
Write a typed `useAsync<T>(fn, deps)` hook that returns a discriminated union:

```ts
type AsyncState<T> =
  | { status: 'loading' }
  | { status: 'error'; error: Error }
  | { status: 'success'; data: T };
```

Then use it in a `UserCard` so that TypeScript only allows `data` access in the success branch. It must ignore results from stale calls.
-- answer --
```tsx
import { useEffect, useState, type DependencyList } from 'react';

type AsyncState<T> =
  | { status: 'loading' }
  | { status: 'error'; error: Error }
  | { status: 'success'; data: T };

export function useAsync<T>(fn: () => Promise<T>, deps: DependencyList): AsyncState<T> {
  const [state, setState] = useState<AsyncState<T>>({ status: 'loading' });

  useEffect(() => {
    let ignore = false;
    setState({ status: 'loading' });

    fn().then(
      data => { if (!ignore) setState({ status: 'success', data }); },
      error => { if (!ignore) setState({ status: 'error', error: error instanceof Error ? error : new Error(String(error)) }); }
    );

    return () => { ignore = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return state;
}

type User = { id: number; name: string; email: string };

async function fetchUser(id: number): Promise<User> {
  const res = await fetch(`/api/users/${id}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export function UserCard({ userId }: { userId: number }) {
  const state = useAsync(() => fetchUser(userId), [userId]);

  switch (state.status) {
    case 'loading':
      return <p>Loading…</p>;
    case 'error':
      return <p role="alert">{state.error.message}</p>;
    case 'success':
      return <h2>{state.data.name}</h2>;   // `data` is typed as User only here
  }
}
```

**Key points:** the union makes "loading with data" or "error and success" impossible; `switch` on `status` narrows the type; the `ignore` flag discards stale results. Mention in the interview that in production you'd use TanStack Query, which gives you the same typed states plus caching.

### Protected routes with redirect back after login @advanced
Using React Router and an auth Context:

- Routes: `/login` (public), and `/expenses`, `/reports`, `/settings` inside a shared layout with a sidebar, all **protected**.
- A logged-out user visiting `/reports` is sent to `/login`, then back to `/reports` after signing in.
- Add a 404 route.
-- answer --
```tsx
import { createContext, useContext, useState } from 'react';
import {
  BrowserRouter, Routes, Route, Navigate, Outlet, NavLink,
  useLocation, useNavigate,
} from 'react-router';

type User = { email: string };
type Auth = { user: User | null; login: (email: string) => Promise<void>; logout: () => void };

const AuthContext = createContext<Auth | null>(null);

function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const login = async (email: string) => { await new Promise(r => setTimeout(r, 300)); setUser({ email }); };
  const logout = () => setUser(null);
  return <AuthContext value={{ user, login, logout }}>{children}</AuthContext>;
}

function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}

function RequireAuth() {
  const { user } = useAuth();
  const location = useLocation();
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  return <Outlet />;
}

function AppLayout() {
  const { logout } = useAuth();
  return (
    <div className="shell">
      <nav>
        <NavLink to="/expenses">Expenses</NavLink>
        <NavLink to="/reports">Reports</NavLink>
        <NavLink to="/settings">Settings</NavLink>
        <button onClick={logout}>Log out</button>
      </nav>
      <main><Outlet /></main>
    </div>
  );
}

function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: Location } | null)?.from?.pathname ?? '/expenses';

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const email = String(new FormData(e.currentTarget).get('email'));
    await login(email);
    navigate(from, { replace: true });   // Back to where they were going
  }

  return (
    <form onSubmit={handleSubmit}>
      <label htmlFor="email">Email</label>
      <input id="email" name="email" type="email" required />
      <button>Sign in</button>
    </form>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<RequireAuth />}>
            <Route element={<AppLayout />}>
              <Route index element={<Navigate to="/expenses" replace />} />
              <Route path="expenses" element={<Expenses />} />
              <Route path="reports" element={<Reports />} />
              <Route path="settings" element={<Settings />} />
            </Route>
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
```

**Key points:** `RequireAuth` is a pathless layout route, so it guards every child at once; `replace` keeps the login page out of the Back-button history; `state.from` remembers the destination. Guards are UX only, so the API must enforce auth too.

### Filters that survive a refresh (useSearchParams) @intermediate
On `/expenses`, implement a search box, a category select and a sort select whose values live in the **URL**. Refreshing or sharing the URL must restore the same filtered list. Typing in search shouldn't create one history entry per keystroke.
-- answer --
```tsx
import { useSearchParams } from 'react-router';

type Expense = { id: string; title: string; category: string; amount: number };

export function ExpenseList({ expenses }: { expenses: Expense[] }) {
  const [params, setParams] = useSearchParams();
  const q = params.get('q') ?? '';
  const category = params.get('category') ?? 'all';
  const sort = params.get('sort') ?? 'amount-desc';

  function update(key: string, value: string, replace = false) {
    setParams(
      prev => {
        const next = new URLSearchParams(prev);
        if (value && value !== 'all') next.set(key, value);
        else next.delete(key);
        return next;
      },
      { replace }   // Replace history while typing
    );
  }

  // Derived from the URL: no duplicate state
  const visible = expenses
    .filter(e => e.title.toLowerCase().includes(q.toLowerCase()))
    .filter(e => category === 'all' || e.category === category)
    .toSorted((a, b) => (sort === 'amount-asc' ? a.amount - b.amount : b.amount - a.amount));

  return (
    <>
      <input
        type="search"
        aria-label="Search expenses"
        value={q}
        onChange={e => update('q', e.target.value, true)}
      />
      <select aria-label="Category" value={category} onChange={e => update('category', e.target.value)}>
        <option value="all">All</option>
        <option value="food">Food</option>
        <option value="travel">Travel</option>
      </select>
      <select aria-label="Sort" value={sort} onChange={e => update('sort', e.target.value)}>
        <option value="amount-desc">Amount: high to low</option>
        <option value="amount-asc">Amount: low to high</option>
      </select>
      <ul>{visible.map(e => <li key={e.id}>{e.title}: ${e.amount}</li>)}</ul>
    </>
  );
}
// e.g. /expenses?q=train&category=travel&sort=amount-asc
```

**Key points:** the URL is the single source of truth (no `useState` copy); defaults are omitted from the URL to keep it clean; `{ replace: true }` while typing avoids flooding history.

## c-realapp | Server state, forms & stores | Week 5 | 12–15

### Paginated products table with TanStack Query @intermediate
Using `json-server` at `http://localhost:3001/products?_page=1&_per_page=10`:

- Show a page of products with **Previous/Next** buttons.
- The old page stays visible (dimmed) while the next page loads, with no spinner flash.
- Show an error state with a **Retry** button.
- Data counts as fresh for 30 seconds.
-- answer --
```tsx
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useState } from 'react';

type Product = { id: string; name: string; price: number };
type Page = { data: Product[]; next: number | null; prev: number | null; pages: number };

async function fetchProducts(page: number): Promise<Page> {
  const res = await fetch(`http://localhost:3001/products?_page=${page}&_per_page=10`);
  if (!res.ok) throw new Error(`Failed to load products (HTTP ${res.status})`);
  return res.json();
}

export function ProductsTable() {
  const [page, setPage] = useState(1);

  const { data, isPending, isError, error, refetch, isPlaceholderData, isFetching } = useQuery({
    queryKey: ['products', { page }],
    queryFn: () => fetchProducts(page),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });

  if (isPending) return <p>Loading products…</p>;
  if (isError) {
    return (
      <div role="alert">
        <p>{error.message}</p>
        <button onClick={() => refetch()}>Retry</button>
      </div>
    );
  }

  return (
    <>
      <table style={{ opacity: isPlaceholderData ? 0.5 : 1 }}>
        <thead><tr><th>Name</th><th>Price</th></tr></thead>
        <tbody>
          {data.data.map(p => (
            <tr key={p.id}><td>{p.name}</td><td>${p.price}</td></tr>
          ))}
        </tbody>
      </table>

      <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={!data.prev}>Previous</button>
      <span> Page {page} of {data.pages} {isFetching && '(updating…)'} </span>
      <button onClick={() => setPage(p => p + 1)} disabled={isPlaceholderData || !data.next}>Next</button>
    </>
  );
}
```

**Key points:** `page` is part of the query key, so each page is cached separately and going back is instant; `keepPreviousData` keeps the last page on screen; `isPlaceholderData` stops users skipping ahead before the page has loaded. Page 1 could also live in the URL with `useSearchParams`.

### Optimistic delete with rollback and toast @advanced
Add a **Delete** button to each product row:

- The row disappears **immediately**.
- If the server fails, the row comes back and an error toast appears.
- Either way, re-sync with the server afterwards.
- Show a success toast on success.
-- answer --
```tsx
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

type Product = { id: string; name: string; price: number };

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  const key = ['products'];

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`http://localhost:3001/products/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
    },

    onMutate: async id => {
      await queryClient.cancelQueries({ queryKey: key });               // Stop refetches overwriting us
      const previous = queryClient.getQueriesData<{ data: Product[] }>({ queryKey: key });

      queryClient.setQueriesData<{ data: Product[] }>({ queryKey: key }, old =>
        old ? { ...old, data: old.data.filter(p => p.id !== id) } : old
      );
      return { previous };
    },

    onError: (_err, _id, context) => {
      context?.previous.forEach(([queryKey, data]) => queryClient.setQueryData(queryKey, data));
      toast.error('Could not delete the product. It has been restored.');
    },

    onSuccess: () => toast.success('Product deleted'),

    onSettled: () => queryClient.invalidateQueries({ queryKey: key }),
  });
}

// In a row
function DeleteButton({ product }: { product: Product }) {
  const del = useDeleteProduct();
  return (
    <button onClick={() => del.mutate(product.id)} disabled={del.isPending}>
      Delete {product.name}
    </button>
  );
}
```

**Key points:** `cancelQueries` prevents an in-flight refetch from undoing the optimistic change; `getQueriesData`/`setQueriesData` update **every** cached page under `['products']`; the snapshot returned from `onMutate` arrives in `onError` as `context` for rollback; `onSettled` refetches to get the server's truth.

### Product create/edit form with React Hook Form + Zod @intermediate
Build a `ProductForm` used for both **create** and **edit**:

- Fields: name (min 2 chars), price (positive number), category (enum), inStock (checkbox).
- One Zod schema drives both validation and the TypeScript type.
- When editing, the form is pre-filled. Switching to a different product resets it.
- The submit button shows "Saving…" while the async `onSubmit` runs.
-- answer --
```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

export const productSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters'),
  price: z.number({ message: 'Enter a price' }).positive('Price must be positive'),
  category: z.enum(['lamps', 'chairs', 'desks']),
  inStock: z.boolean(),
});
export type ProductInput = z.infer<typeof productSchema>;

const empty: ProductInput = { name: '', price: 0, category: 'lamps', inStock: true };

type Props = {
  product?: ProductInput & { id: string };
  onSubmit: (values: ProductInput) => Promise<void>;
};

export function ProductForm({ product, onSubmit }: Props) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProductInput>({
    resolver: zodResolver(productSchema),
    defaultValues: product ?? empty,
  });

  async function submit(values: ProductInput) {
    await onSubmit(values);
    if (!product) reset(empty);   // Clear after creating
  }

  return (
    <form onSubmit={handleSubmit(submit)} noValidate>
      <label htmlFor="name">Name</label>
      <input id="name" {...register('name')} aria-invalid={!!errors.name} />
      {errors.name && <p role="alert">{errors.name.message}</p>}

      <label htmlFor="price">Price</label>
      <input id="price" type="number" step="0.01" {...register('price', { valueAsNumber: true })} />
      {errors.price && <p role="alert">{errors.price.message}</p>}

      <label htmlFor="category">Category</label>
      <select id="category" {...register('category')}>
        <option value="lamps">Lamps</option>
        <option value="chairs">Chairs</option>
        <option value="desks">Desks</option>
      </select>

      <label>
        <input type="checkbox" {...register('inStock')} /> In stock
      </label>

      <button disabled={isSubmitting}>{isSubmitting ? 'Saving…' : product ? 'Save changes' : 'Create'}</button>
    </form>
  );
}

// Parent: the key remounts the form when a different product is selected
<ProductForm key={selected?.id ?? 'new'} product={selected} onSubmit={save} />;
```

**Key points:** `z.infer` gives the form type with no duplication; `valueAsNumber` makes the price a number before Zod sees it; `key` gives a clean reset when the edited product changes; export the schema to validate on the server too.

### Cart store with Zustand @intermediate
Create a typed Zustand cart store:

- `items`, plus actions `add(product)`, `remove(id)`, `setQty(id, qty)` and `clear()`.
- Adding an existing product increments its quantity.
- Persist the cart to `localStorage`.
- A `CartBadge` that re-renders **only** when the item count changes.
- The total is derived, not stored.
-- answer --
```tsx
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Product = { id: string; name: string; price: number };
type CartItem = Product & { qty: number };

type CartState = {
  items: CartItem[];
  add: (product: Product) => void;
  remove: (id: string) => void;
  setQty: (id: string, qty: number) => void;
  clear: () => void;
};

export const useCart = create<CartState>()(
  persist(
    set => ({
      items: [],
      add: product =>
        set(state => {
          const exists = state.items.some(i => i.id === product.id);
          return {
            items: exists
              ? state.items.map(i => (i.id === product.id ? { ...i, qty: i.qty + 1 } : i))
              : [...state.items, { ...product, qty: 1 }],
          };
        }),
      remove: id => set(state => ({ items: state.items.filter(i => i.id !== id) })),
      setQty: (id, qty) =>
        set(state => ({
          items: qty <= 0
            ? state.items.filter(i => i.id !== id)
            : state.items.map(i => (i.id === id ? { ...i, qty } : i)),
        })),
      clear: () => set({ items: [] }),
    }),
    { name: 'cart' }
  )
);

// Selectors: derived values, components subscribe to exactly what they need
export const selectCount = (s: CartState) => s.items.reduce((n, i) => n + i.qty, 0);
export const selectTotal = (s: CartState) => s.items.reduce((sum, i) => sum + i.qty * i.price, 0);

function CartBadge() {
  const count = useCart(selectCount);   // Re-renders only when the count number changes
  return <span aria-label={`${count} items in cart`}>{count}</span>;
}

function CartTotal() {
  const total = useCart(selectTotal);
  return <p>Total: ${total.toFixed(2)}</p>;
}

function AddButton({ product }: { product: Product }) {
  const add = useCart(s => s.add);       // Actions are stable; this never re-renders on cart changes
  return <button onClick={() => add(product)}>Add {product.name}</button>;
}
```

**Key points:** updates inside `set` are immutable; selectors returning primitives (numbers) give precise re-renders; the total is computed by a selector, never stored; `persist` handles storage. The cart holds client state only; prices from the server should still be re-validated at checkout.

## c-quality | Testing, performance & errors | Week 6 | 16

### Test a form's validation errors @intermediate
Write Vitest + React Testing Library tests for the `SignupForm` from the foundations section:

1. Submitting empty shows all three errors.
2. Filling everything correctly shows no errors and disables the button while submitting.

Use `user-event` and accessible queries only.
-- answer --
```jsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import SignupForm from './SignupForm';

describe('SignupForm', () => {
  it('shows errors when submitted empty', async () => {
    const user = userEvent.setup();
    render(<SignupForm />);

    await user.click(screen.getByRole('button', { name: /sign up/i }));

    expect(screen.getByText('Name is required')).toBeInTheDocument();
    expect(screen.getByText('Enter a valid email')).toBeInTheDocument();
    expect(screen.getByText('You must accept the terms')).toBeInTheDocument();
  });

  it('submits valid data and shows a pending state', async () => {
    const user = userEvent.setup();
    render(<SignupForm />);

    await user.type(screen.getByLabelText(/name/i), 'Ana');
    await user.type(screen.getByLabelText(/email/i), 'ana@example.com');
    await user.selectOptions(screen.getByLabelText(/plan/i), 'pro');
    await user.click(screen.getByRole('checkbox', { name: /accept the terms/i }));
    await user.click(screen.getByRole('button', { name: /sign up/i }));

    expect(screen.queryAllByRole('alert')).toHaveLength(0);
    expect(screen.getByRole('button', { name: /creating account/i })).toBeDisabled();

    // After the fake request finishes, the button is enabled again
    expect(await screen.findByRole('button', { name: /sign up/i }, { timeout: 2000 })).toBeEnabled();
  });
});
```

**Key points:** queries by role and label double as accessibility checks; `queryAll` asserts absence; `findBy` waits for async UI; nothing touches component state or class names. The jest-dom matchers come from `@testing-library/jest-dom/vitest` in your setup file.

### Test a list that loads data with MSW @advanced
`ProductsPage` uses TanStack Query to fetch `GET /api/products`. Write tests for:

1. Loading, then rows from the API.
2. An error message when the API returns 500.

Mock the network with MSW, not by stubbing `fetch`.
-- answer --
```jsx
// test/server.js
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

export const server = setupServer(
  http.get('/api/products', () =>
    HttpResponse.json([
      { id: '1', name: 'Desk lamp', price: 39 },
      { id: '2', name: 'Oak chair', price: 120 },
    ])
  )
);

// vitest.setup.js
import '@testing-library/jest-dom/vitest';
import { server } from './test/server';
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

```jsx
// ProductsPage.test.jsx
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { server } from '../test/server';
import ProductsPage from './ProductsPage';

function renderWithClient(ui) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

test('shows products from the API', async () => {
  renderWithClient(<ProductsPage />);

  expect(screen.getByText(/loading/i)).toBeInTheDocument();
  expect(await screen.findByText('Desk lamp')).toBeInTheDocument();
  expect(screen.getByText('Oak chair')).toBeInTheDocument();
});

test('shows an error when the API fails', async () => {
  server.use(http.get('/api/products', () => new HttpResponse(null, { status: 500 })));
  renderWithClient(<ProductsPage />);

  expect(await screen.findByRole('alert')).toHaveTextContent(/couldn't load/i);
});
```

**Key points:** a fresh `QueryClient` per test prevents cache leaks; `retry: false` makes the error test fast; `server.use` overrides one handler for one test, and `resetHandlers` restores defaults. If you switch from `fetch` to axios, these tests still pass.

### Error boundary per route with retry @intermediate
Wrap each route of a React Router app in an error boundary so that:

- A crash on `/reports` shows a fallback with **Try again**, while the sidebar keeps working.
- Navigating to another route clears the error automatically.
- Errors are logged to a (fake) monitoring function.
- Retrying also clears the TanStack Query cache for failed queries.
-- answer --
```jsx
import { ErrorBoundary } from 'react-error-boundary';
import { useLocation, Outlet } from 'react-router';
import { useQueryErrorResetBoundary } from '@tanstack/react-query';

function RouteErrorFallback({ error, resetErrorBoundary }) {
  return (
    <div role="alert">
      <h2>This page crashed</h2>
      <p>{error.message}</p>
      <button onClick={resetErrorBoundary}>Try again</button>
    </div>
  );
}

function RouteBoundary({ children }) {
  const { pathname } = useLocation();
  const { reset } = useQueryErrorResetBoundary();

  return (
    <ErrorBoundary
      FallbackComponent={RouteErrorFallback}
      resetKeys={[pathname]}                       // New route clears the error
      onReset={reset}                              // Let failed queries retry
      onError={(error, info) => logError(error, info.componentStack)}
    >
      {children}
    </ErrorBoundary>
  );
}

function AppLayout() {
  return (
    <div className="shell">
      <Sidebar />                                  {/* Outside the boundary: survives crashes */}
      <main>
        <RouteBoundary>
          <Outlet />
        </RouteBoundary>
      </main>
    </div>
  );
}

function logError(error, componentStack) {
  console.error('[monitoring]', error, componentStack);
}
```

**Key points:** the boundary sits *inside* the layout, so navigation stays usable; `resetKeys` resets on route change; `useQueryErrorResetBoundary` resets failed queries when using `throwOnError` or suspense queries. Event-handler errors still need `try/catch` or `showBoundary`.

### Lazy-load routes with Suspense @basic
Your app's main bundle includes a heavy charting page (`/reports`) and a settings page. Split them so that each loads only when visited, with a loading fallback that keeps the app shell visible.
-- answer --
```jsx
import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Outlet } from 'react-router';
import Dashboard from './pages/Dashboard';   // Landing page stays in the main bundle

const Reports = lazy(() => import('./pages/Reports'));    // Separate chunk
const Settings = lazy(() => import('./pages/Settings'));  // Separate chunk

function Shell() {
  return (
    <div className="shell">
      <Sidebar />
      <main>
        <Suspense fallback={<p>Loading page…</p>}>   {/* Only the main area shows the fallback */}
          <Outlet />
        </Suspense>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Shell />}>
          <Route index element={<Dashboard />} />
          <Route path="reports" element={<Reports />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
```

**Key points:** `lazy` is called at module level; each page must `export default`; placing `Suspense` inside the layout keeps the sidebar on screen; pair it with an error boundary in case a chunk fails to download. To verify, run `npm run build` and check that separate chunks were emitted.

### Fix a slow list (profile, then memoize) @intermediate
Typing in the search box below feels laggy. The Profiler shows `ProductRow` (1,000 rows) re-rendering on every keystroke, even though only the **note** input changes. Fix it twice: by hand, and by explaining what the React Compiler would do.

```jsx
function Catalogue({ products }) {
  const [note, setNote] = useState('');
  const [selectedId, setSelectedId] = useState(null);

  return (
    <>
      <input value={note} onChange={e => setNote(e.target.value)} placeholder="Note" />
      {products.map(p => (
        <ProductRow
          key={p.id}
          product={p}
          selected={p.id === selectedId}
          onSelect={() => setSelectedId(p.id)}
        />
      ))}
    </>
  );
}
```
-- answer --
**Option 1: move state down (no memoization needed).** The note doesn't affect the list, so give it its own component:

```jsx
function NoteInput() {
  const [note, setNote] = useState('');
  return <input value={note} onChange={e => setNote(e.target.value)} placeholder="Note" />;
}

function Catalogue({ products }) {
  const [selectedId, setSelectedId] = useState(null);
  return (
    <>
      <NoteInput />   {/* Typing re-renders only NoteInput */}
      {products.map(p => (
        <ProductRow key={p.id} product={p} selected={p.id === selectedId} onSelect={setSelectedId} />
      ))}
    </>
  );
}
```

**Option 2: memoize the rows**, when the state really must stay in the parent:

```jsx
import { memo, useCallback } from 'react';

const ProductRow = memo(function ProductRow({ product, selected, onSelect }) {
  return (
    <div className={selected ? 'row selected' : 'row'} onClick={() => onSelect(product.id)}>
      {product.name}
    </div>
  );
});

function Catalogue({ products }) {
  const [note, setNote] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const handleSelect = useCallback(id => setSelectedId(id), []);   // Stable identity

  return (
    <>
      <input value={note} onChange={e => setNote(e.target.value)} />
      {products.map(p => (
        <ProductRow key={p.id} product={p} selected={p.id === selectedId} onSelect={handleSelect} />
      ))}
    </>
  );
}
```

**Why the original failed:** `onSelect={() => setSelectedId(p.id)}` created a new function for every row on every render, so even a `memo`'d row would see changed props. Passing the stable setter plus the id fixes that.

**With React Compiler 1.0:** the compiler memoizes the JSX for each row and the callbacks automatically, so the original code would mostly stop re-rendering rows without any hand-written `memo` or `useCallback`. Record before and after in the Profiler to prove the gain. For 10,000+ rows, add virtualization (TanStack Virtual).

## c-react19 | React 19 & Server Components | Week 7 | 17

### Form with useActionState, useFormStatus and a Server Function @advanced
In a Next.js App Router project, build "Add application" (company, role) for a job tracker:

- Submits through a **Server Function** that validates with Zod on the server.
- Shows **field errors** returned from the server.
- The submit button shows a pending state using `useFormStatus`.
- After success, the list on `/applications` refreshes and the form clears.
-- answer --
```ts
// app/applications/actions.ts
'use server';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

const schema = z.object({
  company: z.string().trim().min(1, 'Company is required'),
  role: z.string().trim().min(2, 'Role must be at least 2 characters'),
});

export type FormState = {
  errors?: Partial<Record<'company' | 'role', string[]>>;
  message?: string;
};

export async function addApplication(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await getCurrentUser();                 // Always check auth on the server
  if (!user) return { message: 'Please sign in.' };

  const parsed = schema.safeParse({
    company: formData.get('company'),
    role: formData.get('role'),
  });
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors };

  await db.application.create({ data: { ...parsed.data, userId: user.id, status: 'applied' } });
  revalidatePath('/applications');                      // Refresh the server-rendered list
  return { message: 'Application added.' };
}
```

```tsx
// app/applications/AddApplicationForm.tsx
'use client';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { addApplication, type FormState } from './actions';

function SubmitButton() {
  const { pending } = useFormStatus();                  // Reads the parent <form>
  return <button disabled={pending}>{pending ? 'Adding…' : 'Add application'}</button>;
}

export function AddApplicationForm() {
  const [state, formAction] = useActionState<FormState, FormData>(addApplication, {});

  return (
    <form action={formAction}>
      <label htmlFor="company">Company</label>
      <input id="company" name="company" />
      {state.errors?.company && <p role="alert">{state.errors.company[0]}</p>}

      <label htmlFor="role">Role</label>
      <input id="role" name="role" />
      {state.errors?.role && <p role="alert">{state.errors.role[0]}</p>}

      <SubmitButton />
      {state.message && <p aria-live="polite">{state.message}</p>}
    </form>
  );
}
```

```tsx
// app/applications/page.tsx (Server Component)
export default async function ApplicationsPage() {
  const apps = await db.application.findMany({ orderBy: { createdAt: 'desc' } });
  return (
    <>
      <AddApplicationForm />
      <ul>{apps.map(a => <li key={a.id}>{a.company}: {a.role}</li>)}</ul>
    </>
  );
}
```

**Key points:** uncontrolled inputs plus `<form action>` mean React resets the form after a successful action; errors come back as state from the server; `revalidatePath` refreshes the Server Component list; the form works before JavaScript loads. If you want to keep the inputs on validation failure, return the submitted values in `state` and use them as `defaultValue`.

### Instant Kanban status change with useOptimistic @advanced
On a Kanban board, moving an application card between columns (Applied → Interview) must update **instantly**, then persist through a Server Function `updateStatus(id, status)`. If the server fails, the card must snap back and an error must show.
-- answer --
```tsx
'use client';
import { useOptimistic, useState, startTransition } from 'react';
import { updateStatus } from './actions';   // 'use server' function

type Status = 'wishlist' | 'applied' | 'interview' | 'offer' | 'rejected';
type App = { id: string; company: string; status: Status };

const columns: Status[] = ['wishlist', 'applied', 'interview', 'offer', 'rejected'];

export function Board({ apps }: { apps: App[] }) {   // `apps` comes from a Server Component
  const [error, setError] = useState<string | null>(null);
  const [optimisticApps, moveOptimistic] = useOptimistic(
    apps,
    (current, { id, status }: { id: string; status: Status }) =>
      current.map(a => (a.id === id ? { ...a, status } : a))
  );

  function move(id: string, status: Status) {
    setError(null);
    startTransition(async () => {
      moveOptimistic({ id, status });            // Renders immediately
      try {
        await updateStatus(id, status);          // Server revalidates; real `apps` arrive
      } catch {
        setError('Could not move the card. Please try again.');
        // When the transition ends, React drops the optimistic value, so the card snaps back
      }
    });
  }

  return (
    <>
      {error && <p role="alert">{error}</p>}
      <div className="board">
        {columns.map(col => (
          <section key={col} aria-label={col}>
            <h3>{col}</h3>
            {optimisticApps.filter(a => a.status === col).map(a => (
              <article key={a.id}>
                {a.company}
                <select
                  aria-label={`Move ${a.company}`}
                  value={a.status}
                  onChange={e => move(a.id, e.target.value as Status)}
                >
                  {columns.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </article>
            ))}
          </section>
        ))}
      </div>
    </>
  );
}
```

**Key points:** `useOptimistic` holds a temporary value only while the transition is running; on success the server's revalidated `apps` replace it, and on failure the optimistic value disappears with no manual rollback code. The `<select>` gives a keyboard-accessible fallback; a drag-and-drop library (dnd-kit) would call the same `move` function.

### Split a page into Server and Client Components @intermediate
This Next.js page doesn't compile: hooks can't run in a Server Component. Refactor it so that data loads on the server, secrets stay there, and only the interactive part ships JavaScript.

```tsx
// app/products/[id]/page.tsx
import { useState } from 'react';

export default async function ProductPage({ params }) {
  const { id } = await params;
  const product = await db.product.findUnique({ where: { id } });   // uses DB credentials
  const [qty, setQty] = useState(1);

  return (
    <main>
      <h1>{product.name}</h1>
      <p>{product.description}</p>
      <input type="number" value={qty} onChange={e => setQty(+e.target.value)} />
      <button onClick={() => addToCart(product.id, qty)}>Add to cart</button>
    </main>
  );
}
```
-- answer --
```tsx
// app/products/[id]/page.tsx (Server Component: no directive)
import { notFound } from 'next/navigation';
import { AddToCart } from './AddToCart';

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await db.product.findUnique({ where: { id } });
  if (!product) notFound();

  return (
    <main>
      <h1>{product.name}</h1>
      <p>{product.description}</p>              {/* Static: zero client JS */}
      <AddToCart productId={product.id} />      {/* Only serializable props cross the boundary */}
    </main>
  );
}
```

```tsx
// app/products/[id]/AddToCart.tsx
'use client';
import { useState } from 'react';
import { addToCart } from './actions';            // A 'use server' function is allowed as an import

export function AddToCart({ productId }: { productId: string }) {
  const [qty, setQty] = useState(1);
  return (
    <div>
      <label htmlFor="qty">Quantity</label>
      <input id="qty" type="number" min={1} value={qty} onChange={e => setQty(Number(e.target.value))} />
      <button onClick={() => addToCart(productId, qty)}>Add to cart</button>
    </div>
  );
}
```

**Key points:** the page stays a Server Component (async, direct DB access, nothing shipped for the static parts); `'use client'` is pushed down to the smallest interactive leaf; only a string id crosses the boundary; `params` is awaited because it's a Promise in current Next.js. The page only needed `'use client'` for the quantity input and button, so that's all that became client code.
