@section technical

## t-output | Predict the output | Weeks 1–3 | 3–7

### What does the console log, and what does the screen show after one click? @basic
```jsx
function Counter() {
  const [count, setCount] = useState(0);

  function handleClick() {
    setCount(count + 1);
    console.log(count);
  }

  return <button onClick={handleClick}>{count}</button>;
}
```
-- answer --
The console logs **0**; the screen shows **1**.

`setCount` doesn't change `count` in the running function. It schedules a re-render, and `count` is a snapshot equal to `0` for this render. On the next render the component reads the new value `1`. To use the new value right away, compute it in a variable: `const next = count + 1; setCount(next); console.log(next);`.

### What number is displayed after one click of each button? @intermediate
```jsx
const [n, setN] = useState(0);

<button onClick={() => { setN(n + 5); setN(m => m + 1); }}>A</button>
<button onClick={() => { setN(n + 5); setN(m => m + 1); setN(42); }}>B</button>
```
Assume each button is clicked once, starting from 0 each time.
-- answer --
**A shows 6. B shows 42.**

React processes the queue in order:

| Queued update | A | B |
|---|---|---|
| `setN(n + 5)` (replace with 0 + 5) | 5 | 5 |
| `setN(m => m + 1)` (updater on 5) | 6 | 6 |
| `setN(42)` (replace) | | 42 |

A value replaces whatever is queued before it; an updater function receives the result so far.

### In what order do these logs appear on mount? @intermediate
```jsx
function Child() {
  console.log('Child render');
  useEffect(() => { console.log('Child effect'); }, []);
  return null;
}

function Parent() {
  console.log('Parent render');
  useEffect(() => { console.log('Parent effect'); }, []);
  return <Child />;
}
```
Assume a production build (no Strict Mode double calls).
-- answer --
```
Parent render
Child render
Child effect
Parent effect
```

Rendering goes **top-down**: the parent's function runs first and returns `<Child />`, which then renders. Effects run after commit, **children first**: a parent's effect can rely on its children already being mounted, much as `componentDidMount` worked in classes.

In development with Strict Mode, you'd also see each render twice, then `Child effect`, `Parent effect` running, being cleaned up, and running again.

### What does each expression render? @basic
```jsx
<div>{0 && <p>A</p>}</div>
<div>{'' && <p>B</p>}</div>
<div>{null}</div>
<div>{false}</div>
<div>{[1, 2, 3]}</div>
<div>{undefined ?? 'fallback'}</div>
```
-- answer --

| Expression | Renders |
|---|---|
| `0 && <p>A</p>` | `0` (the number is rendered) |
| `'' && <p>B</p>` | Nothing (an empty string renders no visible text) |
| `null` | Nothing |
| `false` | Nothing |
| `[1, 2, 3]` | `123` (arrays render each item) |
| `undefined ?? 'fallback'` | `fallback` |

The trap is the first one: guard with `count > 0 &&` or a ternary.

### What does the alert show? @intermediate
```jsx
function Messenger() {
  const [to, setTo] = useState('Alice');

  function handleSend() {
    setTimeout(() => alert(`Message sent to ${to}`), 3000);
  }

  return (
    <>
      <select value={to} onChange={e => setTo(e.target.value)}>
        <option>Alice</option>
        <option>Bob</option>
      </select>
      <button onClick={handleSend}>Send</button>
    </>
  );
}
```
The user clicks **Send** while Alice is selected, then switches to **Bob** within 3 seconds.
-- answer --
**"Message sent to Alice".**

The timeout callback closes over `to` from the render in which Send was clicked. Changing the select causes a *new* render with a *new* `to`, but the scheduled callback still holds the old snapshot. That's usually correct behaviour (you sent the message to Alice). If you genuinely need the latest value inside a delayed callback, read it from a ref.

### What does the screen show after three clicks on "+1"? @basic
```jsx
function RefCounter() {
  const countRef = useRef(0);
  const [, forceRender] = useState(0);

  return (
    <>
      <p>Ref: {countRef.current}</p>
      <button onClick={() => { countRef.current += 1; }}>+1</button>
      <button onClick={() => forceRender(x => x + 1)}>Refresh</button>
    </>
  );
}
```
-- answer --
The screen still shows **"Ref: 0"**. After clicking **Refresh** it shows **"Ref: 3"**.

Mutating `ref.current` never triggers a render. The value is updated in memory and only appears when something else re-renders the component. That's why values shown on screen belong in state, and also why you shouldn't read refs during render.

### Two counters, one key: what happens to the count? @intermediate
```jsx
function App() {
  const [isAna, setIsAna] = useState(true);
  return (
    <>
      {isAna ? <Counter person="Ana" /> : <Counter person="Ben" />}
      <button onClick={() => setIsAna(!isAna)}>Switch</button>
    </>
  );
}
```
Ana's counter is at 3. You click **Switch**. What does Ben's counter show? How do you make each person keep a separate count?
-- answer --
Ben's counter shows **3**. Same component type at the same position in the tree means React keeps the same instance and state, and only the `person` prop changes.

To reset state when switching, give each one a different key:

```jsx
{isAna ? <Counter key="ana" person="Ana" /> : <Counter key="ben" person="Ben" />}
```

Now switching unmounts one and mounts the other with fresh state (0). To *preserve* both counts while switching, render both and hide one, or lift the counts up into the parent.

### What appears in the console in development? @intermediate
```jsx
function ChatRoom({ roomId }) {
  useEffect(() => {
    console.log('connect', roomId);
    return () => console.log('disconnect', roomId);
  }, [roomId]);
  return <h1>{roomId}</h1>;
}
// <StrictMode><ChatRoom roomId="general" /></StrictMode>, then roomId changes to "travel"
```
-- answer --
```
connect general        ← mount
disconnect general     ← Strict Mode test unmount (dev only)
connect general        ← Strict Mode re-mount
disconnect general     ← roomId changed: clean up the old room
connect travel         ← set up the new room
```

The extra dev-only disconnect and connect prove the cleanup works. In production the first two Strict Mode lines don't appear. Note that cleanup runs with the **old** `roomId` captured from its own render.

## t-bugs | Spot the bug | Weeks 1–6 | 1–16

### Why doesn't the list update when an item is added? @basic
```jsx
function TodoList() {
  const [items, setItems] = useState([]);

  function addItem(text) {
    items.push({ id: Date.now(), text });
    setItems(items);
  }
  // ...
}
```
-- answer --
`push` mutates the existing array, and `setItems(items)` passes the **same reference**. React compares with `Object.is`, sees no change, and can skip the re-render. You've also corrupted the previous render's snapshot.

```jsx
function addItem(text) {
  setItems(prev => [...prev, { id: crypto.randomUUID(), text }]);
}
```

### Why does every row get deleted as soon as the page loads? @basic
```jsx
{items.map(item => (
  <li key={item.id}>
    {item.name}
    <button onClick={handleDelete(item.id)}>Delete</button>
  </li>
))}
```
-- answer --
`onClick={handleDelete(item.id)}` **calls** `handleDelete` during render and passes its return value (probably `undefined`) as the handler. Every row deletes itself while rendering, which can also cause an infinite render loop.

```jsx
<button onClick={() => handleDelete(item.id)}>Delete</button>
```

Pass a function; don't call one.

### Why does the input lose focus after every keystroke? @intermediate
```jsx
function SignupPage() {
  const [email, setEmail] = useState('');

  function EmailField() {
    return <input value={email} onChange={e => setEmail(e.target.value)} />;
  }

  return (
    <form>
      <EmailField />
    </form>
  );
}
```
-- answer --
`EmailField` is defined **inside** `SignupPage`, so each render creates a brand-new component type. React sees a different type at that position, unmounts the old input, and mounts a new one, losing focus and any internal state.

Move the component to module level and pass what it needs as props:

```jsx
function EmailField({ value, onChange }) {
  return <input value={value} onChange={e => onChange(e.target.value)} />;
}

function SignupPage() {
  const [email, setEmail] = useState('');
  return <form><EmailField value={email} onChange={setEmail} /></form>;
}
```

### Why does this component freeze the browser? @intermediate
```jsx
function Results({ query }) {
  const [results, setResults] = useState([]);
  const filters = { query, limit: 20 };

  useEffect(() => {
    search(filters).then(data => setResults(data));
  }, [filters]);

  return <List items={results} />;
}
```
-- answer --
`filters` is a **new object every render**, so the dependency always "changes" and the effect runs after every render. It sets state, which re-renders, which creates a new `filters`, and so on in an infinite loop of requests and renders.

Depend on primitives and build the object inside the effect (and handle stale responses while you're there):

```jsx
useEffect(() => {
  let ignore = false;
  search({ query, limit: 20 }).then(data => {
    if (!ignore) setResults(data);
  });
  return () => { ignore = true; };
}, [query]);
```

Better still, use `useQuery({ queryKey: ['search', query], ... })`.

### Why does the timer stop at 1? @intermediate
```jsx
function Timer() {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setSeconds(seconds + 1), 1000);
    return () => clearInterval(id);
  }, []);

  return <p>{seconds}s</p>;
}
```
-- answer --
**Stale closure.** The effect runs once (`[]`), so the interval callback captured `seconds = 0` forever and keeps setting it to `0 + 1 = 1`.

Use the updater form so the callback doesn't need to read `seconds`:

```jsx
useEffect(() => {
  const id = setInterval(() => setSeconds(s => s + 1), 1000);
  return () => clearInterval(id);
}, []);
```

Adding `seconds` to the dependencies would also "work", but it tears down and recreates the interval every second.

### Why does the resize handler fire more and more times? @basic
```jsx
function useWindowWidth() {
  const [width, setWidth] = useState(window.innerWidth);

  useEffect(() => {
    window.addEventListener('resize', () => setWidth(window.innerWidth));
  });

  return width;
}
```
-- answer --
Two bugs. There's **no dependency array**, so the effect runs after every render, and there's **no cleanup**, so a new listener is added each time and never removed. Every resize triggers a render, which adds another listener. This also leaks after unmount.

```jsx
useEffect(() => {
  const onResize = () => setWidth(window.innerWidth);
  window.addEventListener('resize', onResize);
  return () => window.removeEventListener('resize', onResize);
}, []);
```

The cleanup needs the **same function reference**, so name the handler.

### Delete the first row: why does the wrong text stay behind? @intermediate #gate
```jsx
function EditableList({ rows, onDelete }) {
  return rows.map((row, index) => (
    <div key={index}>
      <span>{row.label}</span>
      <input defaultValue={row.note} />
      <button onClick={() => onDelete(row.id)}>Delete</button>
    </div>
  ));
}
```
-- answer --
With `key={index}`, deleting row 0 makes the old row 1 become index 0. React matches keys, keeps the DOM node for key `0` (including the uncontrolled `<input>` and whatever the user typed there), updates the `<span>` label, and removes the *last* node. The labels shift but the inputs don't, so notes end up next to the wrong labels.

Use a stable identity:

```jsx
return rows.map(row => (
  <div key={row.id}>...</div>
));
```

This is exactly why index keys break when a list is reordered, filtered, or has items removed.

### What breaks in this component, and when? @basic
```jsx
function Profile({ userId }) {
  if (!userId) {
    return <p>Please sign in.</p>;
  }

  const [user, setUser] = useState(null);
  useEffect(() => { fetchUser(userId).then(setUser); }, [userId]);

  return <h1>{user?.name}</h1>;
}
```
-- answer --
It breaks the **Rules of Hooks**. The hooks come after an early return, so when `userId` goes from defined to empty (or back), the number of hooks called changes between renders. React relies on call order, so it throws "Rendered fewer hooks than expected" or mixes up state.

Call all hooks first, then branch:

```jsx
function Profile({ userId }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (!userId) return;
    let ignore = false;
    fetchUser(userId).then(u => { if (!ignore) setUser(u); });
    return () => { ignore = true; };
  }, [userId]);

  if (!userId) return <p>Please sign in.</p>;
  return <h1>{user?.name}</h1>;
}
```

`eslint-plugin-react-hooks` flags this immediately.

### Why does React warn "A component is changing an uncontrolled input to be controlled"? @basic
```jsx
function ProfileForm() {
  const [profile, setProfile] = useState({});   // Loaded later
  return <input value={profile.name} onChange={e => setProfile({ ...profile, name: e.target.value })} />;
}
```
-- answer --
On the first render `profile.name` is `undefined`, and `value={undefined}` means "uncontrolled". When the user types (or data loads), `value` becomes a string, so the input switches to controlled mid-life and React warns.

Always give controlled inputs a defined value:

```jsx
const [profile, setProfile] = useState({ name: '' });
// or
<input value={profile.name ?? ''} ... />
```

### Why doesn't the form update when the parent selects a different user? @intermediate
```jsx
function EditUser({ user }) {
  const [name, setName] = useState(user.name);
  return <input value={name} onChange={e => setName(e.target.value)} />;
}

// Parent
<EditUser user={selectedUser} />
```
-- answer --
`useState(user.name)` uses the prop only as the **initial** value on mount. When `selectedUser` changes, the same component instance stays mounted, so its state keeps the old name.

Fix by resetting the component with a key, which avoids a syncing effect:

```jsx
<EditUser key={selectedUser.id} user={selectedUser} />
```

If you don't need local edits, don't copy the prop into state at all; read `user.name` directly.

### What's wrong with this effect? @basic
```jsx
useEffect(async () => {
  const res = await fetch(`/api/products/${id}`);
  setProduct(await res.json());
}, [id]);
```
-- answer --
An `async` function always returns a **Promise**, but React expects an effect to return either nothing or a cleanup function. React warns, and you also lose the ability to clean up. There's also no `res.ok` check and no protection against out-of-order responses.

```jsx
useEffect(() => {
  const controller = new AbortController();

  async function load() {
    try {
      const res = await fetch(`/api/products/${id}`, { signal: controller.signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setProduct(await res.json());
    } catch (err) {
      if (err.name !== 'AbortError') setError(err);
    }
  }

  load();
  return () => controller.abort();
}, [id]);
```

### Why does the edit page briefly show the wrong product? @intermediate
```jsx
function ProductDetail({ productId }) {
  const { data } = useQuery({
    queryKey: ['product'],
    queryFn: () => fetchProduct(productId),
  });
  return <h1>{data?.name}</h1>;
}
```
-- answer --
The query key doesn't include `productId`, so **every product shares one cache entry**. Navigating from product 1 to product 2 shows product 1's cached data, and the new id never triggers a fetch because the key didn't change.

Everything the `queryFn` depends on must be in the key:

```jsx
useQuery({
  queryKey: ['product', productId],
  queryFn: () => fetchProduct(productId),
});
```

Think of the query key as the dependency array of the query. The `@tanstack/eslint-plugin-query` package catches this.

### Why does this nested update change the original user too? @intermediate
```jsx
const [user, setUser] = useState({ name: 'Ana', address: { city: 'Lisbon' } });

function moveToPorto() {
  const copy = { ...user };
  copy.address.city = 'Porto';
  setUser(copy);
}
```
-- answer --
Spread is **shallow**. `copy` is a new object, but `copy.address` is the *same* object as `user.address`, so the assignment mutates the previous state too. Components or memoized values relying on `user.address` won't see a change, and the old snapshot is corrupted.

Copy every level you change:

```jsx
setUser(prev => ({ ...prev, address: { ...prev.address, city: 'Porto' } }));
```

### This test fails with "Unable to find an element with the text: Desk lamp". Why? @basic
```jsx
test('renders products', () => {
  render(<ProductsPage />);   // fetches /api/products on mount
  expect(screen.getByText('Desk lamp')).toBeInTheDocument();
});
```
-- answer --
The data arrives **asynchronously**, but `getByText` checks immediately, while the component is still showing its loading state. Use an async `findBy*` query, which retries until the element appears or it times out:

```jsx
test('renders products', async () => {
  render(<ProductsPage />);
  expect(await screen.findByText('Desk lamp')).toBeInTheDocument();
});
```

Make sure the request is mocked (MSW) and, with TanStack Query, render inside a test `QueryClientProvider`.

### Why does this component re-render on every store change, or even loop forever? @advanced
```jsx
function CartSummary() {
  const { items, total } = useCartStore(state => ({
    items: state.items,
    total: state.total,
  }));
  return <p>{items.length} items, ${total}</p>;
}
```
-- answer --
The selector returns a **new object on every call**, so Zustand's equality check (`Object.is`) always sees a change. That means extra re-renders in older versions, and in Zustand v5 it can cause "Maximum update depth exceeded".

Select primitives separately, or use `useShallow`:

```jsx
import { useShallow } from 'zustand/react/shallow';

const items = useCartStore(s => s.items);
const total = useCartStore(s => s.total);
// or
const { items, total } = useCartStore(useShallow(s => ({ items: s.items, total: s.total })));
```

### Every Context consumer re-renders whenever the App re-renders. Why? @advanced
```jsx
function App() {
  const [user, setUser] = useState(null);
  const [search, setSearch] = useState('');

  return (
    <AuthContext value={{ user, login: u => setUser(u), logout: () => setUser(null) }}>
      <input value={search} onChange={e => setSearch(e.target.value)} />
      <Dashboard />
    </AuthContext>
  );
}
```
-- answer --
The `value` is a **new object** (with new functions) on every render, so typing in the search box changes the context value by reference and every `useContext(AuthContext)` consumer re-renders.

Fixes, best first:

1. **Move unrelated state out** of the provider component (put `search` in its own component), so the provider re-renders only when auth changes.
2. **Memoize the value**:

```jsx
const login = useCallback(u => setUser(u), []);
const logout = useCallback(() => setUser(null), []);
const value = useMemo(() => ({ user, login, logout }), [user, login, logout]);
```

3. Enable the **React Compiler**, which memoizes this automatically.
