@section theory

## effects | useEffect, and when not to use it | Week 3 | 6

### What is useEffect for? @basic
!! `useEffect` synchronizes a component with something **outside React**: timers, subscriptions, browser APIs, WebSockets, non-React widgets, or the network. It runs after React commits the render and the browser paints.

```jsx
import { useEffect, useState } from 'react';

function OnlineBadge() {
  const [online, setOnline] = useState(navigator.onLine);

  useEffect(() => {
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  return <span>{online ? 'Online' : 'Offline'}</span>;
}
```

Think "synchronize with X", not "run code on mount".

### How does the dependency array work? @basic
!! The dependency array tells React when to re-run the effect. React compares each value with `Object.is` against the previous render.

| Form | Runs |
|---|---|
| `useEffect(fn)` | After **every** render |
| `useEffect(fn, [])` | Once after mount (plus the Strict Mode dev re-run) |
| `useEffect(fn, [a, b])` | After mount and whenever `a` or `b` changes |

- You must list **every reactive value** the effect reads: props, state, and variables or functions declared in the component body.
- You don't "choose" dependencies; the code decides them. If you don't want something as a dependency, change the code (move it inside the effect, outside the component, or use `useEffectEvent`).
- Keep `eslint-plugin-react-hooks` enabled. It catches missing dependencies.

### What is the cleanup function, and when does it run? @intermediate
!! The function you return from an effect is its cleanup. React runs it **before the effect runs again** (with the old values) and **when the component unmounts**. Use it to undo what the setup did.

```jsx
useEffect(() => {
  const connection = createConnection(roomId);
  connection.connect();
  return () => connection.disconnect();   // Runs before reconnecting to a new roomId
}, [roomId]);
```

| Setup | Cleanup |
|---|---|
| `setInterval` / `setTimeout` | `clearInterval` / `clearTimeout` |
| `addEventListener` | `removeEventListener` |
| `subscribe()` | `unsubscribe()` |
| `fetch` with `AbortController` | `controller.abort()` |
| `connect()` | `disconnect()` |

### Why does my effect run twice in development? @intermediate
!! In development, Strict Mode deliberately mounts, unmounts and re-mounts every component once, so each effect runs setup, cleanup, then setup again. It exposes effects with missing or broken cleanup. Production runs it once.

- If the double run causes a bug (two connections, duplicate listeners), your **cleanup is missing**.
- Don't hide it with a `useRef(false)` "has run" flag.
- For data fetching, ignore or abort the first request in cleanup, or better, use TanStack Query, which deduplicates.

### Name situations where an effect is the wrong tool @intermediate #gate
!! Avoid effects for (1) **derived data**: compute it during render, (2) **logic caused by a user action**: put it in the event handler, and (3) **resetting state when a prop changes**: use a `key`. Other cases: chained effects, notifying parents, and real-app data fetching.

```jsx
// ❌ 1. Derived data in an effect
const [fullName, setFullName] = useState('');
useEffect(() => setFullName(first + ' ' + last), [first, last]);
// ✅
const fullName = first + ' ' + last;

// ❌ 2. Event logic in an effect
useEffect(() => {
  if (submitted) { post('/api/register', form); showToast('Done'); }
}, [submitted]);
// ✅
function handleSubmit() { post('/api/register', form); showToast('Done'); }

// ❌ 3. Resetting state on prop change
useEffect(() => setComment(''), [userId]);
// ✅
<Profile key={userId} userId={userId} />
```

More cases:

- **Notifying the parent** of a state change: call `onChange` in the same handler that sets state.
- **Chains of effects** that set state, which trigger other effects: compute it all in one handler.
- **Fetching data in a real app:** use TanStack Query or your framework's loaders.
- **One-time app initialization:** run it at module level, outside components.

> This is the most common code-review comment on junior React code. Lead with "effects are for synchronizing with external systems."

### How do you fetch data in useEffect correctly, and why avoid it in real apps? @intermediate
!! Track loading, error and data; abort or ignore stale responses in the cleanup; and include the inputs in the dependencies. In production code, prefer TanStack Query or framework data loading, because raw effects give you no caching, retries, deduplication or background refresh.

```jsx
function User({ userId }) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    const controller = new AbortController();
    setStatus('loading');

    fetch(`/api/users/${userId}`, { signal: controller.signal })
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(data => { setUser(data); setStatus('success'); })
      .catch(err => {
        if (err.name !== 'AbortError') setStatus('error');
      });

    return () => controller.abort();   // Cancel when userId changes or on unmount
  }, [userId]);

  if (status === 'loading') return <p>Loading…</p>;
  if (status === 'error') return <p>Something went wrong.</p>;
  return <h2>{user.name}</h2>;
}
```

Problems you would have to solve yourself: race conditions, caching, request deduplication, retries, refetching on focus, pagination, and network waterfalls.

### What is a race condition in data fetching, and how do you prevent it? @advanced #gate
!! When inputs change quickly (typing "rea", then "react"), requests can resolve out of order, so an old response overwrites the new one. Prevent it by aborting the previous request in the effect cleanup, or by ignoring responses from stale effects.

```jsx
useEffect(() => {
  let ignore = false;

  searchCities(query).then(results => {
    if (!ignore) setResults(results);   // Only the latest effect may write
  });

  return () => { ignore = true; };      // Marks the previous run as stale
}, [query]);
```

- `AbortController` also cancels the network request itself.
- Debouncing the input reduces the number of requests but does **not** remove the race on its own.
- TanStack Query avoids it by keying the cache by query (`['cities', query]`), so a stale response can never be shown for the current query.

### What is a stale closure? @advanced
!! A stale closure is a function that captured state or props from an old render and keeps using those outdated values. A classic example is an interval created once with `[]` that always sees the initial state.

```jsx
// ❌ Logs 0 forever and the counter stops at 1
useEffect(() => {
  const id = setInterval(() => {
    setCount(count + 1);   // `count` is frozen at 0
  }, 1000);
  return () => clearInterval(id);
}, []);

// ✅ Updater function: no need to read `count`
useEffect(() => {
  const id = setInterval(() => setCount(c => c + 1), 1000);
  return () => clearInterval(id);
}, []);
```

Fixes, in order of preference: an updater function; correct dependencies; `useEffectEvent` for non-reactive logic; a ref holding the latest value.

### What is useEffectEvent? @advanced #new
!! `useEffectEvent` (stable since React 19.2) creates an "effect event": a function that always sees the latest props and state but is **not reactive**, so it doesn't belong in the dependency array. Use it for logic inside an effect that shouldn't re-trigger the effect.

```jsx
import { useEffect, useEffectEvent } from 'react';

function ChatRoom({ roomId, theme }) {
  const onConnected = useEffectEvent(() => {
    showNotification('Connected!', theme);   // Reads the latest theme
  });

  useEffect(() => {
    const connection = createConnection(roomId);
    connection.on('connected', () => onConnected());
    connection.connect();
    return () => connection.disconnect();
  }, [roomId]);   // Changing theme no longer reconnects
}
```

Rules: call effect events only from inside effects, don't pass them to other components, and don't list them as dependencies.

### useEffect vs useLayoutEffect: what's the difference? @intermediate
!! `useEffect` runs **after** the browser paints. `useLayoutEffect` runs synchronously **after the DOM updates but before paint**, so you can measure layout and adjust it without a visible flicker. It blocks painting, so use it only for measurement-driven layout.

```jsx
function Tooltip({ targetRect, children }) {
  const ref = useRef(null);
  const [height, setHeight] = useState(0);

  useLayoutEffect(() => {
    setHeight(ref.current.getBoundingClientRect().height);   // Measure before paint
  }, []);

  const top = targetRect.top - height;   // Positioned without a jump
  return <div ref={ref} style={{ top }}>{children}</div>;
}
```

### Why do objects and functions in dependencies cause infinite loops? @intermediate
!! Objects, arrays and functions created during render get a new reference every render, so an effect that depends on them re-runs every render. If that effect also sets state, you get an infinite render loop.

```jsx
// ❌ `options` is a new object every render, so the effect runs every render
const options = { roomId, serverUrl };
useEffect(() => {
  const c = createConnection(options);
  c.connect();
  return () => c.disconnect();
}, [options]);

// ✅ Create the object inside the effect and depend on primitives
useEffect(() => {
  const c = createConnection({ roomId, serverUrl });
  c.connect();
  return () => c.disconnect();
}, [roomId, serverUrl]);
```

Other fixes: move constants outside the component, or memoize with `useMemo`/`useCallback` (or let React Compiler do it).

## refs | useRef | Week 3 | 7

### What is useRef, and how is it different from state? @basic
!! `useRef(initial)` returns a mutable object `{ current }` that persists across renders. Changing `ref.current` does **not** trigger a re-render. Use refs for values the UI doesn't display, and for DOM nodes.

| | `useState` | `useRef` |
|---|---|---|
| Changing it re-renders | Yes | No |
| Mutable | No (use the setter) | Yes, `ref.current = x` |
| Read during render | Yes | Avoid |
| Typical use | Displayed data | DOM nodes, timer ids, instances, "latest value" |

```jsx
const renderCount = useRef(0);
useEffect(() => { renderCount.current += 1; });   // Doesn't cause another render
```

### What are the common use cases for refs? @basic
!! Refs are for accessing DOM nodes (focus, scroll, measure, media playback) and for keeping values that must survive renders without causing them: timer ids, AbortControllers, previous values, and third-party library instances.

```jsx
function Stopwatch() {
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef(null);

  function start() {
    clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
  }
  function stop() {
    clearInterval(intervalRef.current);
  }

  return (
    <>
      <p>{elapsed}s</p>
      <button onClick={start}>Start</button>
      <button onClick={stop}>Stop</button>
    </>
  );
}
```

### How do you focus an input with a ref? @basic
!! Attach the ref with `ref={inputRef}`, then call `inputRef.current.focus()` in an event handler or effect. React sets `ref.current` to the DOM node after commit.

```jsx
function SearchBox() {
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current.focus();   // Autofocus on mount
  }, []);

  return (
    <>
      <input ref={inputRef} placeholder="Search cities" />
      <button onClick={() => inputRef.current.focus()}>Focus</button>
    </>
  );
}
```

For simple mount focus, the `autoFocus` attribute also works.

### How do you pass a ref to a child component in React 19? @intermediate #new #legacy
!! In React 19, `ref` is a regular prop on function components. Accept it like any other prop and attach it to a DOM element. `forwardRef` is no longer needed and is planned for deprecation.

```jsx
// React 19
function TextInput({ label, ref, ...props }) {
  return (
    <label>
      {label}
      <input ref={ref} {...props} />
    </label>
  );
}

function Form() {
  const inputRef = useRef(null);
  return <TextInput label="Email" ref={inputRef} />;
}

// Legacy (React 18 and earlier); you will still read this in older code
const OldInput = forwardRef(function OldInput(props, ref) {
  return <input ref={ref} {...props} />;
});
```

To expose a limited API instead of the raw DOM node, use `useImperativeHandle(ref, () => ({ focus() { ... } }))`.

### What are callback refs and ref cleanup functions? @advanced #new
!! A callback ref is a function passed to `ref`. React calls it with the DOM node when it attaches. Since React 19 the callback can **return a cleanup function**, which React calls when the node detaches. It's handy for observers and measuring items in dynamic lists.

```jsx
function MeasuredBox() {
  return (
    <div
      ref={node => {
        const observer = new ResizeObserver(([entry]) => {
          console.log('width', entry.contentRect.width);
        });
        observer.observe(node);
        return () => observer.disconnect();   // React 19 ref cleanup
      }}
    >
      Resize me
    </div>
  );
}
```

> In TypeScript, an arrow that implicitly returns something (`ref={n => (instance = n)}`) is now an error, because the return value could be mistaken for a cleanup. Use a block body.

### Why shouldn't you read or write ref.current during rendering? @intermediate
!! Refs aren't reactive. Reading them during render makes output depend on a value React doesn't track, and writing them during render is a side effect. Both make components unpredictable and break assumptions that React and the React Compiler rely on. Use refs in event handlers and effects.

The one exception is lazy initialization:

```jsx
const playerRef = useRef(null);
if (playerRef.current === null) {
  playerRef.current = new VideoPlayer();   // OK: initialize once
}
```

## hooks | Custom hooks & the Rules of Hooks | Week 3 | 8

### What are the Rules of Hooks, and why do they exist? @basic
!! (1) Call hooks only at the **top level**: not inside conditions, loops, nested functions, or after an early return. (2) Call hooks only from **React components or custom hooks**. React identifies each hook by its call order, so that order must be identical on every render.

```jsx
// ❌ Conditional hook: the call order changes between renders
function Profile({ user }) {
  if (!user) return null;
  const [tab, setTab] = useState('posts');   // Skipped when user is null
}

// ✅ Hooks first, conditions after
function Profile({ user }) {
  const [tab, setTab] = useState('posts');
  if (!user) return null;
  // ...
}
```

- Custom hook names must start with `use` so tools can check the rules.
- `eslint-plugin-react-hooks` enforces this; keep it on.
- Exception: React 19's `use()` API **can** be called conditionally.

### What is a custom hook? @basic
!! A custom hook is a function whose name starts with `use` and which calls other hooks. It lets components share **stateful logic** behind a name that describes intent, such as `useDebounce`, `useLocalStorage` or `useOnlineStatus`.

```jsx
function useToggle(initial = false) {
  const [on, setOn] = useState(initial);
  const toggle = () => setOn(v => !v);
  return [on, toggle];
}

function Sidebar() {
  const [open, toggleOpen] = useToggle();
  return <button onClick={toggleOpen}>{open ? 'Close' : 'Open'}</button>;
}
```

A plain function that doesn't call hooks shouldn't be named `use…`.

### Do two components using the same custom hook share state? @intermediate
!! No. Each call to a custom hook gets its own, independent state. Hooks share **logic**, not **state**. To share state, lift it up, put it in Context, or use a store such as Zustand.

```jsx
function A() { const [on, toggle] = useToggle(); }   // own state
function B() { const [on, toggle] = useToggle(); }   // separate state
```

### When should you extract a custom hook? @intermediate
!! Extract one when the same stateful logic appears in several components, or when an effect's details obscure what a component does. A good custom hook has a name that describes a purpose (`useChatRoom`, `useDebounce`), not a lifecycle (`useMount`).

Signs it's time:

- You copy the same `useState` + `useEffect` pair into a second component.
- A component has a large effect with setup and cleanup details unrelated to rendering.
- You want to test the logic separately with `renderHook`.

Avoid generic lifecycle wrappers like `useMount(fn)` or `useEffectOnce`. They hide dependency bugs from the linter.

### How do custom hooks replace HOCs and render props? @intermediate #legacy
!! Higher-order components (functions that wrap a component) and render props (a function prop that returns JSX) were the pre-hooks ways to share logic. Custom hooks do the same job without extra wrapper components, prop-name collisions, or "wrapper hell" in DevTools.

```jsx
// HOC (legacy)
const ProfileWithUser = withUser(Profile);

// Render prop (legacy)
<MouseTracker render={pos => <Cursor x={pos.x} y={pos.y} />} />

// Custom hook (modern)
function Profile() {
  const user = useUser();
  const pos = useMousePosition();
  // ...
}
```

You will still meet HOCs in older libraries (`connect` from React Redux, `withRouter`). Know how to read them.

### How does a useDebounce hook work? @intermediate
!! It stores a delayed copy of a value. Each time the value changes, an effect starts a timer to update the debounced copy, and the cleanup cancels the previous timer, so only a pause in changes lets the update through.

```jsx
function useDebounce(value, delay = 400) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);   // A new keystroke cancels the pending update
  }, [value, delay]);

  return debounced;
}

// Usage
const [query, setQuery] = useState('');
const debouncedQuery = useDebounce(query, 300);
// Fetch with debouncedQuery, not query
```

## context | Context | Week 3 | 9

### What problem does Context solve? @basic
!! Context passes data deep into the tree without threading props through every intermediate component ("prop drilling"). It's meant for app-wide values that change rarely, such as theme, the signed-in user, and locale.

Before reaching for Context, consider:

- Passing props a few levels is fine and explicit.
- Composition (`children`) often removes drilling: pass the rendered component instead of the data.

### How do you create and use Context in React 19? @basic #new
!! Create it with `createContext`, render `<MyContext value={...}>` around the tree (React 19 no longer needs `.Provider`), and read it with `useContext(MyContext)` or `use(MyContext)`. Wrap it in a provider component and a custom hook.

```jsx
import { createContext, useContext, useState } from 'react';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('light');
  const toggle = () => setTheme(t => (t === 'light' ? 'dark' : 'light'));

  return (
    <ThemeContext value={{ theme, toggle }}>   {/* React 19 */}
      {children}
    </ThemeContext>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>');
  return ctx;
}

// Anywhere below the provider
function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return <button onClick={toggle}>Theme: {theme}</button>;
}
```

`<ThemeContext.Provider value={...}>` still works, but React plans to deprecate it.

### What is the default value passed to createContext for? @intermediate
!! React uses the default value only when a component reads the context and **no provider exists above it**. It's not an initial value. A common pattern is defaulting to `null` and throwing a helpful error in the custom hook, so a missing provider fails loudly.

### Why do all context consumers re-render, and how do you limit it? @advanced
!! When a provider's `value` changes (by `Object.is`), **every** component reading that context re-renders. Passing a new object literal each render, as in `value={{ user, login }}`, means consumers re-render whenever the provider re-renders.

Fixes:

- **Memoize the value** with `useMemo` and stable callbacks (React Compiler does this automatically).
- **Split contexts:** separate frequently and rarely changing values, or state and dispatch.
- **Keep context for low-frequency data.** For fast-changing shared state, use a store with selectors (Zustand), which re-renders only the components whose slice changed.

```jsx
const value = useMemo(() => ({ user, login, logout }), [user]);
return <AuthContext value={value}>{children}</AuthContext>;
```

### Context vs a state library: which do you use? @intermediate
!! Context is a **transport** (dependency injection), not a state manager. It has no selectors, so it suits values that change rarely. Use TanStack Query for server data, Zustand for frequently changing global client state, and Context for theme, auth user, and locale.

| Need | Use |
|---|---|
| Theme, locale, signed-in user | Context (+ `useState`/`useReducer`) |
| Cart, UI preferences, wizard state | Zustand |
| Data from an API | TanStack Query |
| Large legacy codebase already using it | Redux Toolkit |

### Can you read context conditionally? @intermediate #new
!! Yes, with React 19's `use()` API. Unlike `useContext`, `use(MyContext)` can be called inside `if` statements and loops, because `use` isn't bound by the call-order rule.

```jsx
import { use } from 'react';

function Heading({ children }) {
  if (children == null) return null;
  const theme = use(ThemeContext);   // OK after an early return
  return <h1 className={theme}>{children}</h1>;
}
```

## typescript | TypeScript for React | Week 4 | 10

### How do you type a component's props? @basic
!! Declare a `type` (or `interface`) for the props and annotate the destructured parameter. Use `React.ReactNode` for `children`, `?` for optional props, and default parameters for defaults.

```tsx
type ProductCardProps = {
  id: string;
  name: string;
  price: number;
  onSale?: boolean;
  onAddToCart: (id: string) => void;
  children?: React.ReactNode;
};

function ProductCard({ id, name, price, onSale = false, onAddToCart, children }: ProductCardProps) {
  return (
    <article>
      <h3>{name}</h3>
      <p>${price.toFixed(2)}</p>
      {onSale && <span>Sale</span>}
      <button onClick={() => onAddToCart(id)}>Add to cart</button>
      {children}
    </article>
  );
}
```

Typing the props parameter directly is the common convention. `React.FC` works but adds nothing.

### type vs interface for props: does it matter? @basic
!! Either works for props. `interface` supports declaration merging and `extends`; `type` supports unions, intersections and mapped types. Pick one convention per codebase. Many React teams default to `type` because UI state often needs unions.

```tsx
type Status = 'idle' | 'loading' | 'error';   // Needs `type`

interface ButtonProps { variant: 'primary' | 'ghost' }
interface IconButtonProps extends ButtonProps { icon: string }
```

### How do you type event handlers? @basic
!! Use React's event types with the element as the generic, for example `React.ChangeEvent<HTMLInputElement>` and `React.FormEvent<HTMLFormElement>`. Inline handlers infer the type automatically.

```tsx
function SearchForm() {
  const [query, setQuery] = useState('');

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setQuery(e.target.value);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
  }

  return (
    <form onSubmit={handleSubmit}>
      <input value={query} onChange={handleChange} />
      <button onClick={(e) => console.log(e.currentTarget)}>Go</button> {/* inferred */}
    </form>
  );
}
```

Others: `React.MouseEvent<HTMLButtonElement>`, `React.KeyboardEvent<HTMLInputElement>`, `React.FocusEvent`.

### How do you type useState and useRef? @basic
!! Let TypeScript infer simple state. Pass a generic when the initial value doesn't describe all possible values, such as `useState<User | null>(null)`. For DOM refs, use `useRef<HTMLInputElement>(null)`.

```tsx
const [count, setCount] = useState(0);                  // inferred number
const [user, setUser] = useState<User | null>(null);    // starts empty
const [tags, setTags] = useState<string[]>([]);         // [] alone would be never[]
const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');

const inputRef = useRef<HTMLInputElement>(null);        // DOM ref
const timerRef = useRef<number | null>(null);           // mutable value

inputRef.current?.focus();   // current can be null before mount
```

In React 19's types, `useRef` requires an argument (`useRef(null)`, not `useRef()`).

### How do you extend native HTML element props? @intermediate
!! Intersect `React.ComponentProps<'button'>` (or `'input'`, `'a'`, and so on) with your own props. Your component then accepts every native attribute, and you can spread the rest onto the element.

```tsx
type ButtonProps = React.ComponentProps<'button'> & {
  variant?: 'primary' | 'ghost';
};

function Button({ variant = 'primary', className = '', ...rest }: ButtonProps) {
  return <button className={`btn btn-${variant} ${className}`} {...rest} />;
}

<Button variant="ghost" type="submit" disabled onClick={save}>Save</Button>
```

Because React 19 treats `ref` as a prop, `ComponentProps<'button'>` already includes it.

### What are discriminated unions, and why use them for UI state? @intermediate
!! A discriminated union is a union of object types that share a literal "tag" field such as `status`. It makes impossible states (loading *and* error, success with no data) unrepresentable, and TypeScript narrows the type in each branch.

```tsx
type FetchState<T> =
  | { status: 'loading' }
  | { status: 'error'; error: string }
  | { status: 'success'; data: T };

function UserView({ state }: { state: FetchState<User> }) {
  switch (state.status) {
    case 'loading':
      return <Spinner />;
    case 'error':
      return <p>{state.error}</p>;        // `error` exists only here
    case 'success':
      return <h2>{state.data.name}</h2>;  // `data` exists only here
  }
}
```

### How do you type Context? @intermediate
!! Give `createContext` a generic that includes `null`, then expose a custom hook that throws when the provider is missing. Consumers get a non-null type.

```tsx
type AuthContextValue = {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;   // AuthContextValue
}
```

### How do you type a custom hook that returns a tuple? @intermediate
!! Add `as const` to the returned array, or declare the return type explicitly. Otherwise TypeScript infers an array of a union type, and destructuring loses the per-position types.

```tsx
function useToggle(initial = false) {
  const [on, setOn] = useState(initial);
  const toggle = () => setOn(v => !v);
  return [on, toggle] as const;   // readonly [boolean, () => void]
}
```

### How do you type API responses safely? @intermediate
!! TypeScript types disappear at runtime, so a type annotation on `res.json()` is only a promise you make. Validate untrusted data with a schema library like Zod and derive the TypeScript type from the schema with `z.infer`.

```tsx
import { z } from 'zod';

const ProductSchema = z.object({
  id: z.string(),
  name: z.string(),
  price: z.number(),
});
type Product = z.infer<typeof ProductSchema>;

async function getProduct(id: string): Promise<Product> {
  const res = await fetch(`/api/products/${id}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return ProductSchema.parse(await res.json());   // Throws if the shape is wrong
}
```

## routing | Routing with React Router | Week 4 | 11

### What is client-side routing? @basic
!! In a single-page app, the router maps URLs to components and changes the URL with the History API, without a full page reload. Navigation is instant and app state such as a cart or open sidebar survives page changes.

- The server must return `index.html` for every route (a "fallback"); otherwise refreshing `/reports` gives a 404.
- Each screen still gets a real, shareable URL.

### How do you set up routes in React Router (declarative mode)? @basic
!! Wrap the app in `<BrowserRouter>`, declare `<Routes>` with `<Route path element>` entries, and navigate with `<Link>` or `<NavLink>`. Since v7 everything imports from `react-router`.

```jsx
import { BrowserRouter, Routes, Route, Link, NavLink } from 'react-router';

function App() {
  return (
    <BrowserRouter>
      <nav>
        <NavLink to="/expenses" className={({ isActive }) => (isActive ? 'active' : '')}>
          Expenses
        </NavLink>
        <Link to="/reports">Reports</Link>
      </nav>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/expenses" element={<Expenses />} />
        <Route path="/expenses/:id" element={<ExpenseDetail />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
```

`NavLink` knows whether it matches the current URL, so you can style the active link.

### How do you read URL params and navigate in code? @basic
!! `useParams()` reads dynamic segments such as `:id`. `useNavigate()` returns a function for navigating from code, for example after a form submit.

```jsx
import { useParams, useNavigate } from 'react-router';

function ExpenseDetail() {
  const { id } = useParams();          // "/expenses/42" gives "42" (always a string)
  const navigate = useNavigate();

  async function handleDelete() {
    await deleteExpense(id);
    navigate('/expenses', { replace: true });   // Replace history so Back skips the deleted page
  }

  return <button onClick={handleDelete}>Delete expense {id}</button>;
}
```

`navigate(-1)` goes back. Use `<Link>` for normal navigation and `navigate` only for navigation caused by logic.

### How do nested routes and layout routes work with Outlet? @intermediate
!! A parent route renders shared UI (sidebar, header) plus an `<Outlet />` where the matching child route renders. Child paths are relative to the parent, and an `index` route renders at the parent's own path.

```jsx
<Routes>
  <Route path="/" element={<AppLayout />}>
    <Route index element={<Dashboard />} />          {/* "/" */}
    <Route path="expenses" element={<Expenses />} />  {/* "/expenses" */}
    <Route path="settings" element={<Settings />} />
  </Route>
  <Route path="*" element={<NotFound />} />
</Routes>

function AppLayout() {
  return (
    <div className="shell">
      <Sidebar />
      <main><Outlet /></main>   {/* Child route renders here */}
    </div>
  );
}
```

The layout stays mounted while you navigate between children, so its state is preserved.

### How do you implement a protected route? @intermediate #gate
!! Create a wrapper route that checks auth (usually from Context). If there is no user, render `<Navigate to="/login" replace />` and remember where they came from. Otherwise render `<Outlet />`. After login, navigate back to the saved location.

```jsx
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router';

function RequireAuth() {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return <Outlet />;
}

// Routes
<Route element={<RequireAuth />}>
  <Route path="/reports" element={<Reports />} />
  <Route path="/settings" element={<Settings />} />
</Route>
<Route path="/login" element={<Login />} />

// In Login, after success:
const navigate = useNavigate();
const location = useLocation();
const from = location.state?.from?.pathname ?? '/';
navigate(from, { replace: true });   // /reports → /login → back to /reports
```

> Client-side guards are UX only. The API must still reject unauthenticated requests.

### Why keep filters in the URL, and how do you do it? @intermediate #gate
!! Filters stored in the URL survive refresh, can be bookmarked and shared, and work with the Back button. Use `useSearchParams()` to read and write the query string instead of `useState`.

```jsx
import { useSearchParams } from 'react-router';

function ExpenseFilters() {
  const [searchParams, setSearchParams] = useSearchParams();
  const category = searchParams.get('category') ?? 'all';
  const month = searchParams.get('month') ?? '';

  function updateParam(key, value) {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (value) next.set(key, value); else next.delete(key);
      return next;
    });
  }

  return (
    <select value={category} onChange={e => updateParam('category', e.target.value)}>
      <option value="all">All</option>
      <option value="food">Food</option>
      <option value="travel">Travel</option>
    </select>
  );
}
// URL: /expenses?category=food&month=2026-09
```

### Why use Link instead of a plain anchor tag? @basic
!! A plain `<a href>` triggers a full page reload: the bundle is re-downloaded and all in-memory state is lost. `<Link>` intercepts the click and updates the URL through the router, so only the changed part of the UI re-renders. Use `<a>` for external sites.

### What are React Router's modes? @intermediate
!! React Router has three modes: **Declarative** (`<BrowserRouter>` and `<Routes>`; routing only), **Data** (`createBrowserRouter` + `RouterProvider`, adding route `loader`s, `action`s and pending states), and **Framework** (a Vite plugin with file-based routes, SSR and type-safe data; the successor to Remix).

```jsx
// Data mode sketch
const router = createBrowserRouter([
  {
    path: '/expenses/:id',
    loader: ({ params }) => getExpense(params.id),   // Data loads before render
    Component: ExpenseDetail,
  },
]);
<RouterProvider router={router} />;
// Inside ExpenseDetail: const expense = useLoaderData();
```

Start with declarative mode. Know that the other two exist and when to choose them.
