@section coding

## c-foundations | Components, lists & state | Weeks 1–2 | 1–5

### Product catalogue grid @basic
Build a product catalogue page from a hard-coded array.

- Render a responsive grid of `ProductCard` components.
- Show a **"Sale"** badge when `salePrice` is set, with the old price struck through.
- Show an **"Out of stock"** state (dimmed card, disabled button) when `stock === 0`.
- Wrap the page in a `Layout` component that takes `children`.
- The console must show zero key warnings.

```jsx
const products = [
  { id: 'p1', name: 'Desk lamp', price: 49, salePrice: 39, stock: 12 },
  { id: 'p2', name: 'Oak chair', price: 120, salePrice: null, stock: 0 },
  { id: 'p3', name: 'Standing desk', price: 499, salePrice: null, stock: 4 },
];
```
-- answer --
```jsx
function Layout({ children }) {
  return (
    <div className="layout">
      <header><h1>Shop</h1></header>
      <main>{children}</main>
    </div>
  );
}

function Price({ price, salePrice }) {
  if (salePrice == null) return <p>${price}</p>;
  return (
    <p>
      <s>${price}</s> <strong>${salePrice}</strong>
    </p>
  );
}

function ProductCard({ product }) {
  const { name, price, salePrice, stock } = product;
  const outOfStock = stock === 0;

  return (
    <article className={outOfStock ? 'card card--disabled' : 'card'}>
      {salePrice != null && <span className="badge">Sale</span>}
      <h2>{name}</h2>
      <Price price={price} salePrice={salePrice} />
      {outOfStock ? (
        <p className="muted">Out of stock</p>
      ) : (
        <p>{stock} left</p>
      )}
      <button disabled={outOfStock}>Add to cart</button>
    </article>
  );
}

export default function App() {
  return (
    <Layout>
      <section className="grid">
        {products.map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </section>
    </Layout>
  );
}
```

```css
.grid { display: grid; gap: 1rem; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); }
.card--disabled { opacity: 0.5; }
```

**Key points**

- The key is the product's stable `id`, placed on the element returned by `map`.
- `salePrice != null` checks for both `null` and `undefined`, and doesn't hide a sale price of `0` the way a truthiness check would.
- `Price` is split out so each component does one thing.
- `Layout` uses `children`, so any page can reuse it.

### Counter that really adds 3 @basic
Build a counter with three buttons:

1. **+1** adds one.
2. **+3** calls an update function three times in one click and must add exactly 3.
3. **+1 in 2 s** adds one after a two-second delay. Clicking it five times quickly must add 5.

Explain why the naive version of buttons 2 and 3 is wrong.
-- answer --
```jsx
import { useState } from 'react';

export default function Counter() {
  const [count, setCount] = useState(0);

  function addOne() {
    setCount(c => c + 1);
  }

  function addThree() {
    setCount(c => c + 1);
    setCount(c => c + 1);
    setCount(c => c + 1);
  }

  function addOneLater() {
    setTimeout(() => {
      setCount(c => c + 1);   // Reads the latest value when the timer fires
    }, 2000);
  }

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={addOne}>+1</button>
      <button onClick={addThree}>+3</button>
      <button onClick={addOneLater}>+1 in 2 s</button>
      <button onClick={() => setCount(0)}>Reset</button>
    </div>
  );
}
```

**Why the naive version fails:** `setCount(count + 1)` three times uses the same snapshot of `count`, so it queues "set to 1" three times. In the delayed version, every timeout closes over the `count` from the render when it was clicked, so five quick clicks all set the same value. The updater form `c => c + 1` always receives the latest queued value.

### Todo list with immutable updates @basic
Build a todo list where the user can:

- Add a todo (ignore empty input; clear the input after adding).
- Toggle done.
- Edit the text inline.
- Delete a todo.
- See "3 of 5 done" (derived, not stored).

Every state update must be immutable.
-- answer --
```jsx
import { useState } from 'react';

export default function TodoApp() {
  const [todos, setTodos] = useState([]);
  const [text, setText] = useState('');

  function handleAdd(e) {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    setTodos([...todos, { id: crypto.randomUUID(), text: trimmed, done: false }]);
    setText('');
  }

  function toggle(id) {
    setTodos(todos.map(t => (t.id === id ? { ...t, done: !t.done } : t)));
  }

  function rename(id, newText) {
    setTodos(todos.map(t => (t.id === id ? { ...t, text: newText } : t)));
  }

  function remove(id) {
    setTodos(todos.filter(t => t.id !== id));
  }

  const doneCount = todos.filter(t => t.done).length;   // Derived

  return (
    <section>
      <form onSubmit={handleAdd}>
        <label htmlFor="new-todo">New todo</label>
        <input id="new-todo" value={text} onChange={e => setText(e.target.value)} />
        <button>Add</button>
      </form>

      <p>{doneCount} of {todos.length} done</p>

      <ul>
        {todos.map(todo => (
          <li key={todo.id}>
            <input
              type="checkbox"
              checked={todo.done}
              onChange={() => toggle(todo.id)}
              aria-label={`Mark "${todo.text}" done`}
            />
            <input value={todo.text} onChange={e => rename(todo.id, e.target.value)} />
            <button onClick={() => remove(todo.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </section>
  );
}
```

**Key points**

- The id is generated **when the item is created**, not during render, so keys stay stable.
- Add uses spread, toggle and rename use `map` + object spread, and delete uses `filter`.
- `doneCount` is computed during render, so it can never drift out of sync.

### Accordion with only one panel open @basic
Build an accordion with three panels. Opening one panel closes the others. Each `Panel` must stay a "dumb" presentational component: it can't own the open/closed state.
-- answer --
```jsx
import { useState } from 'react';

const faqs = [
  { id: 'shipping', title: 'Shipping', body: 'Free shipping on orders over $50.' },
  { id: 'returns', title: 'Returns', body: '30-day no-questions-asked returns.' },
  { id: 'warranty', title: 'Warranty', body: 'Two years on all furniture.' },
];

export default function Accordion() {
  const [openId, setOpenId] = useState(faqs[0].id);   // State lifted to the parent

  return (
    <div>
      {faqs.map(faq => (
        <Panel
          key={faq.id}
          title={faq.title}
          isOpen={openId === faq.id}
          onToggle={() => setOpenId(openId === faq.id ? null : faq.id)}
        >
          {faq.body}
        </Panel>
      ))}
    </div>
  );
}

function Panel({ title, isOpen, onToggle, children }) {
  return (
    <section>
      <h3>
        <button aria-expanded={isOpen} onClick={onToggle}>
          {title}
        </button>
      </h3>
      {isOpen && <p>{children}</p>}
    </section>
  );
}
```

**Key points:** the "which is open" state lives in the closest common parent. Panels receive `isOpen` and an `onToggle` callback (data down, events up). Storing the open **id** instead of an index keeps it correct if the list is reordered. `aria-expanded` exposes the state to screen readers.

### Controlled signup form with validation @intermediate
Build a signup form with **name**, **email**, **plan** (select: free or pro) and **accept terms** (checkbox).

- All inputs are controlled by one state object and one change handler.
- On submit: prevent the page reload, validate (name required, email contains "@", terms accepted), and show errors under each field.
- Disable the submit button while a fake `await` request runs.
-- answer --
```jsx
import { useState } from 'react';

const initial = { name: '', email: '', plan: 'free', terms: false };

function validate(values) {
  const errors = {};
  if (!values.name.trim()) errors.name = 'Name is required';
  if (!values.email.includes('@')) errors.email = 'Enter a valid email';
  if (!values.terms) errors.terms = 'You must accept the terms';
  return errors;
}

export default function SignupForm() {
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setValues(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const nextErrors = validate(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    try {
      await new Promise(r => setTimeout(r, 1000));   // Fake API call
      setValues(initial);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <label htmlFor="name">Name</label>
      <input id="name" name="name" value={values.name} onChange={handleChange} />
      {errors.name && <p role="alert">{errors.name}</p>}

      <label htmlFor="email">Email</label>
      <input id="email" name="email" type="email" value={values.email} onChange={handleChange} />
      {errors.email && <p role="alert">{errors.email}</p>}

      <label htmlFor="plan">Plan</label>
      <select id="plan" name="plan" value={values.plan} onChange={handleChange}>
        <option value="free">Free</option>
        <option value="pro">Pro</option>
      </select>

      <label>
        <input type="checkbox" name="terms" checked={values.terms} onChange={handleChange} />
        I accept the terms
      </label>
      {errors.terms && <p role="alert">{errors.terms}</p>}

      <button disabled={submitting}>{submitting ? 'Creating account…' : 'Sign up'}</button>
    </form>
  );
}
```

**Key points:** one handler serves every field through computed property names (`[name]`); checkboxes use `checked`, not `value`; validation is a pure function you can unit-test; `finally` re-enables the button even if the request fails. At scale you'd switch to React Hook Form + Zod.

### Expense tracker with useReducer and derived totals @intermediate
Build the Week 2 "Foundations gate" tracker:

- Add, edit and delete expenses (`{ id, title, amount, category, date }`) through a **reducer**.
- Filter by category and month.
- Show the running total and per-category totals for the visible expenses. Totals must be derived, not stored.
-- answer --
```jsx
import { useReducer, useState } from 'react';

function expensesReducer(expenses, action) {
  switch (action.type) {
    case 'added':
      return [...expenses, { ...action.expense, id: crypto.randomUUID() }];
    case 'edited':
      return expenses.map(e => (e.id === action.expense.id ? action.expense : e));
    case 'deleted':
      return expenses.filter(e => e.id !== action.id);
    default:
      throw new Error(`Unknown action: ${action.type}`);
  }
}

const seed = [
  { id: '1', title: 'Groceries', amount: 54.2, category: 'food', date: '2026-09-03' },
  { id: '2', title: 'Train pass', amount: 80, category: 'travel', date: '2026-09-01' },
  { id: '3', title: 'Dinner', amount: 32.5, category: 'food', date: '2026-08-28' },
];

export default function ExpenseTracker() {
  const [expenses, dispatch] = useReducer(expensesReducer, seed);
  const [category, setCategory] = useState('all');
  const [month, setMonth] = useState('2026-09');   // "YYYY-MM"

  // Derived data: recomputed every render, never stored
  const visible = expenses.filter(
    e => (category === 'all' || e.category === category) && (!month || e.date.startsWith(month))
  );
  const total = visible.reduce((sum, e) => sum + e.amount, 0);
  const byCategory = visible.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] ?? 0) + e.amount;
    return acc;
  }, {});

  return (
    <section>
      <select value={category} onChange={e => setCategory(e.target.value)} aria-label="Category">
        <option value="all">All categories</option>
        <option value="food">Food</option>
        <option value="travel">Travel</option>
      </select>
      <input type="month" value={month} onChange={e => setMonth(e.target.value)} aria-label="Month" />

      <AddExpenseForm onAdd={expense => dispatch({ type: 'added', expense })} />

      <ul>
        {visible.map(e => (
          <li key={e.id}>
            {e.title}: ${e.amount.toFixed(2)}
            <button onClick={() => dispatch({ type: 'edited', expense: { ...e, amount: e.amount + 1 } })}>
              +$1
            </button>
            <button onClick={() => dispatch({ type: 'deleted', id: e.id })}>Delete</button>
          </li>
        ))}
      </ul>

      <p><strong>Total: ${total.toFixed(2)}</strong></p>
      <ul>
        {Object.entries(byCategory).map(([cat, sum]) => (
          <li key={cat}>{cat}: ${sum.toFixed(2)}</li>
        ))}
      </ul>
    </section>
  );
}

function AddExpenseForm({ onAdd }) {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    if (!title || !amount) return;
    onAdd({ title, amount: Number(amount), category: 'food', date: new Date().toISOString().slice(0, 10) });
    setTitle('');
    setAmount('');
  }

  return (
    <form onSubmit={handleSubmit}>
      <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Title" aria-label="Title" />
      <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Amount" aria-label="Amount" />
      <button>Add</button>
    </form>
  );
}
```

**Key points:** all list mutations live in one pure reducer that you can test without rendering; event handlers dispatch *what happened* (`'added'`); filters are separate UI state; totals are derived from `visible`, so they always match the list on screen.

## c-effects | Effects, refs, custom hooks & Context | Week 3 | 6–9

### Stopwatch with useRef @intermediate
Build a stopwatch with **Start**, **Stop** and **Reset** buttons that shows elapsed time to 0.1 s.

- Clicking Start twice must not create two intervals.
- The interval must be cleared when the component unmounts.
-- answer --
```jsx
import { useEffect, useRef, useState } from 'react';

export default function Stopwatch() {
  const [startTime, setStartTime] = useState(null);
  const [now, setNow] = useState(null);
  const intervalRef = useRef(null);   // Holds the timer id without causing renders

  function start() {
    clearInterval(intervalRef.current);   // Guard against double start
    setStartTime(Date.now());
    setNow(Date.now());
    intervalRef.current = setInterval(() => setNow(Date.now()), 100);
  }

  function stop() {
    clearInterval(intervalRef.current);
    intervalRef.current = null;
  }

  function reset() {
    stop();
    setStartTime(null);
    setNow(null);
  }

  useEffect(() => () => clearInterval(intervalRef.current), []);   // Cleanup on unmount

  const seconds = startTime && now ? (now - startTime) / 1000 : 0;

  return (
    <div>
      <p>{seconds.toFixed(1)} s</p>
      <button onClick={start}>Start</button>
      <button onClick={stop}>Stop</button>
      <button onClick={reset}>Reset</button>
    </div>
  );
}
```

**Key points:** the interval id is in a **ref** because changing it shouldn't re-render; `start` clears any existing interval first; elapsed time is derived from two timestamps rather than incremented, so it stays accurate even if ticks are delayed.

### useLocalStorage hook @intermediate
Write `useLocalStorage(key, initialValue)` that works like `useState` but persists to `localStorage`.

- Read the stored value once, lazily, on first render.
- Support the updater form: `setValue(prev => ...)`.
- Don't crash if storage is unavailable or holds invalid JSON.
- Use it in two components (for example, favourite cities and a theme preference).
-- answer --
```jsx
import { useEffect, useState } from 'react';

export function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored !== null ? JSON.parse(stored) : initialValue;
    } catch {
      return initialValue;   // Private mode, blocked storage, or bad JSON
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Storage full or unavailable: keep working in memory
    }
  }, [key, value]);

  return [value, setValue];   // setValue supports the updater form, like useState
}

// Usage 1
function FavouriteCities() {
  const [favourites, setFavourites] = useLocalStorage('favourites', []);
  const add = city => setFavourites(prev => (prev.includes(city) ? prev : [...prev, city]));
  return (
    <>
      <button onClick={() => add('Lisbon')}>Save Lisbon</button>
      <ul>{favourites.map(c => <li key={c}>{c}</li>)}</ul>
    </>
  );
}

// Usage 2
function UnitToggle() {
  const [unit, setUnit] = useLocalStorage('unit', 'celsius');
  return (
    <button onClick={() => setUnit(u => (u === 'celsius' ? 'fahrenheit' : 'celsius'))}>
      Unit: {unit}
    </button>
  );
}
```

**Key points:** the lazy initializer reads storage only once; the effect *synchronizes* state to an external system (exactly what effects are for); returning the raw `setValue` gives callers the updater form for free.

### Debounced city search with no stale results @advanced
Build the Week 3 weather search box:

- Debounce the input by 400 ms using your own `useDebounce` hook.
- Fetch `https://geocoding-api.open-meteo.com/v1/search?name=<query>&count=5`.
- Show loading, error, empty and results states.
- Typing fast must **never** show results for an older query.
- Autofocus the input on mount.
-- answer --
```jsx
import { useEffect, useRef, useState } from 'react';

function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

export default function CitySearch() {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query.trim(), 400);
  const [state, setState] = useState({ status: 'idle', results: [] });
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current.focus();
  }, []);

  useEffect(() => {
    if (!debouncedQuery) {
      setState({ status: 'idle', results: [] });
      return;
    }

    const controller = new AbortController();
    setState(s => ({ ...s, status: 'loading' }));

    fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(debouncedQuery)}&count=5`,
      { signal: controller.signal }
    )
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(data => setState({ status: 'success', results: data.results ?? [] }))
      .catch(err => {
        if (err.name === 'AbortError') return;   // Stale request: ignore
        setState({ status: 'error', results: [], error: err.message });
      });

    return () => controller.abort();   // New query cancels the old request
  }, [debouncedQuery]);

  return (
    <div>
      <label htmlFor="city">City</label>
      <input id="city" ref={inputRef} value={query} onChange={e => setQuery(e.target.value)} />

      {state.status === 'loading' && <p>Searching…</p>}
      {state.status === 'error' && <p role="alert">Search failed: {state.error}</p>}
      {state.status === 'success' && state.results.length === 0 && <p>No cities found.</p>}
      {state.status === 'success' && (
        <ul>
          {state.results.map(city => (
            <li key={city.id}>
              {city.name}, {city.country}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

**Why there are no stale results:** each new debounced query runs the effect's cleanup for the previous one, which aborts its request. An aborted fetch rejects with `AbortError` and never calls `setState`. Debouncing alone isn't enough, because two requests 400 ms apart can still resolve out of order. In a real app, `useQuery({ queryKey: ['cities', debouncedQuery] })` replaces the whole second effect.

### Focus search on "/" with a reusable event-listener hook @intermediate
Write a `useEventListener(eventName, handler, target = window)` hook and use it so that pressing **/** anywhere focuses a search input (unless the user is already typing in a field).

- The listener must be removed on unmount.
- Changing `handler` on every render must not re-subscribe the listener.
-- answer --
```jsx
import { useEffect, useEffectEvent, useRef } from 'react';

function useEventListener(eventName, handler, target = window) {
  const onEvent = useEffectEvent(handler);   // Always calls the latest handler (React 19.2+)

  useEffect(() => {
    const listener = e => onEvent(e);
    target.addEventListener(eventName, listener);
    return () => target.removeEventListener(eventName, listener);
  }, [eventName, target]);   // The handler isn't a dependency
}

export default function SearchHeader() {
  const inputRef = useRef(null);

  useEventListener('keydown', e => {
    const typing = ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName);
    if (e.key === '/' && !typing) {
      e.preventDefault();   // Don't type "/" into the input
      inputRef.current?.focus();
    }
  });

  return (
    <header>
      <label htmlFor="site-search">Search (press /)</label>
      <input id="site-search" ref={inputRef} type="search" />
    </header>
  );
}
```

**Pre-19.2 alternative:** store the handler in a ref updated in an effect (`handlerRef.current = handler`) and call `handlerRef.current(e)` inside the listener. Either way, the subscription runs once while the logic stays current.

### Theme toggle with Context (React 19 syntax) @intermediate
Add dark mode to an app using Context:

- A `ThemeProvider` that owns the theme and exposes `{ theme, toggleTheme }`.
- Use React 19's `<ThemeContext value>` provider syntax.
- A `useTheme()` hook that throws a helpful error outside the provider.
- Persist the choice and apply it as a class on `<html>`.
-- answer --
```jsx
import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext(null);

function getInitialTheme() {
  try {
    const saved = localStorage.getItem('theme');
    if (saved === 'light' || saved === 'dark') return saved;
  } catch {}
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    try { localStorage.setItem('theme', theme); } catch {}
  }, [theme]);

  const toggleTheme = () => setTheme(t => (t === 'dark' ? 'light' : 'dark'));

  return <ThemeContext value={{ theme, toggleTheme }}>{children}</ThemeContext>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>');
  return ctx;
}

function ThemeButton() {
  const { theme, toggleTheme } = useTheme();
  return (
    <button onClick={toggleTheme} aria-pressed={theme === 'dark'}>
      {theme === 'dark' ? 'Light mode' : 'Dark mode'}
    </button>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <ThemeButton />
    </ThemeProvider>
  );
}
```

**Key points:** `useState(getInitialTheme)` passes the function, so it runs once; the effect syncs React state to the DOM and storage (external systems); the custom hook hides the context object and fails loudly when misused. Without the React Compiler, wrap the value in `useMemo` to avoid re-rendering consumers when the provider re-renders.
