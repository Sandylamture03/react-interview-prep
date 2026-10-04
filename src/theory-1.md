@section theory

## setup | Project setup with Vite | Week 1 | –

### How do you start a new React project in 2026, and why not Create React App? @basic #legacy
!! Use Vite for a client-side app, or a framework such as Next.js for full-stack apps. Create React App was officially deprecated in February 2025.

- **Vite** serves your source as native ES modules in development, so the dev server starts almost instantly and Hot Module Replacement is fast. It also ships an optimized production build with zero hand-written config.
- **Frameworks** (Next.js, React Router framework mode) add routing, data loading and server rendering on top of React.
- You no longer write Webpack or Babel config by hand; Vite and frameworks configure it for you.

```bash
npm create vite@latest my-app -- --template react-ts
cd my-app
npm install
npm run dev
```

> **Interview tip:** If asked about CRA, say it's deprecated, explain *why* (slow dev server, unmaintained, no data-fetching or routing story) and name the replacement.

### What do index.html, main.jsx and App.jsx each do in a Vite app? @basic
!! `index.html` is the real entry point, `main.jsx` mounts React into it, and `App.jsx` is the root component of your UI.

- **index.html** contains an empty `<div id="root">` and a `<script type="module" src="/src/main.jsx">`.
- **main.jsx** creates a React root on that div and renders the app.
- **App.jsx** is the top of your component tree.

```jsx
// src/main.jsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
```

### How do environment variables work in a Vite React app? @intermediate
!! Read them from `import.meta.env`. Only variables prefixed with `VITE_` are exposed to client code, and they are baked into the bundle at build time.

```bash
# .env.local
VITE_API_URL=https://api.example.com
```

```jsx
const res = await fetch(`${import.meta.env.VITE_API_URL}/products`);

if (import.meta.env.DEV) console.log('running in development');
```

- Built-ins: `import.meta.env.MODE`, `DEV`, `PROD`.
- Files: `.env`, `.env.local`, `.env.production`, and so on.

> **Gotcha:** Anything in the client bundle is public. Never put API secrets in a `VITE_` variable; keep them on a server.

## jsx | JSX, components & props | Week 1 | 1

### What is React, and what does "declarative" mean here? @basic
!! React is a JavaScript library for building user interfaces from components. You describe *what* the UI should look like for the current data, and React works out *how* to update the DOM.

- **Declarative:** UI is a function of state, `UI = f(state)`. You never write "find this element and change its text"; you change state and React re-renders.
- **Component-based:** screens are split into reusable pieces that receive data through props.
- **One-way data flow:** data flows down from parent to child through props; children request changes by calling callbacks.

```jsx
function Greeting({ name }) {
  return <h1>Hello, {name}!</h1>;
}
```

### What is JSX and how is it different from HTML? @basic
!! JSX is a syntax extension that lets you write markup inside JavaScript. A compiler turns each tag into a function call (`jsx('div', props)`) that returns a plain object describing the UI.

Key rules that differ from HTML:

- Return **one root element**; wrap siblings in a `<div>` or a fragment `<>...</>`.
- Use `className` instead of `class`, `htmlFor` instead of `for`.
- Attributes are **camelCase**: `onClick`, `tabIndex`, `strokeWidth`.
- **Every tag must close**: `<img />`, `<input />`, `<br />`.
- `{}` embeds any JavaScript **expression** (not statements like `if` or `for`).
- `style` takes an object: `style={{ fontSize: 16 }}`.

```jsx
function Avatar({ user }) {
  return (
    <>
      <img className="avatar" src={user.imageUrl} alt={user.name} />
      <label htmlFor="bio">Bio</label>
      <p style={{ color: user.online ? 'green' : 'gray' }}>
        {user.online ? 'Online' : 'Offline'}
      </p>
    </>
  );
}
```

> Since the "new JSX transform" you don't need `import React from 'react'` just to use JSX.

### What are Fragments, and when does a Fragment need a key? @basic
!! A Fragment groups children without adding an extra DOM node. Use the short syntax `<>...</>` normally, and the long form `<Fragment key={...}>` when rendering fragments inside a list.

```jsx
import { Fragment } from 'react';

function Glossary({ items }) {
  return (
    <dl>
      {items.map(item => (
        <Fragment key={item.id}>
          <dt>{item.term}</dt>
          <dd>{item.definition}</dd>
        </Fragment>
      ))}
    </dl>
  );
}
```

### What is a component, and why must its name start with a capital letter? @basic
!! A component is a JavaScript function that returns JSX. Names must be PascalCase because JSX treats lowercase tags (`<button>`) as built-in DOM elements and capitalized tags (`<Button>`) as your components.

- Keep one component per file as a convention.
- Components can render other components, forming a **component tree**.
- **Never define a component inside another component.** It becomes a brand-new type on every render, so React unmounts and remounts it and its state is lost.

```jsx
// ❌ Bad: Row is re-created every render, inputs inside lose focus
function Table() {
  function Row() { return <tr>...</tr>; }
  return <Row />;
}

// ✅ Good: declare at module level
function Row() { return <tr>...</tr>; }
function Table() { return <Row />; }
```

### What are props? Can a component change its own props? @basic
!! Props are the read-only inputs a parent passes to a child, like function arguments. A component must never mutate its props; to change something it owns, use state, or ask the parent through a callback prop.

```jsx
function ProductCard({ name, price, onSale = false }) {
  return (
    <article>
      <h3>{name}</h3>
      <p>${price.toFixed(2)}</p>
      {onSale && <span className="badge">Sale</span>}
    </article>
  );
}

<ProductCard name="Desk lamp" price={39} onSale />
```

- Destructure props in the signature for readability.
- Use **default parameter values** for defaults (`defaultProps` on function components was removed in React 19).
- `onSale` with no value is shorthand for `onSale={true}`.
- You can forward everything with spread: `<Button {...props} />`. Use it sparingly.

### What is the children prop and when do you use it? @basic
!! `children` holds whatever JSX you put between a component's opening and closing tags. It is how you build layout wrappers such as cards, modals, and page layouts.

```jsx
function Layout({ children }) {
  return (
    <div className="layout">
      <header>Shop</header>
      <main>{children}</main>
      <footer>© 2026</footer>
    </div>
  );
}

function App() {
  return (
    <Layout>
      <ProductGrid />
    </Layout>
  );
}
```

> Passing JSX as `children` is also a performance tool: the wrapper can re-render without re-rendering the children, because the parent created them.

### What does "keep components pure" mean? @intermediate
!! A pure component returns the same JSX for the same props, state and context, and has no side effects while rendering. It doesn't mutate variables that existed before the render, fetch data, or touch the DOM.

```jsx
// ❌ Impure: mutates a variable outside the component
let guest = 0;
function Cup() {
  guest = guest + 1;
  return <h2>Tea cup for guest #{guest}</h2>;
}

// ✅ Pure: output depends only on props
function Cup({ guest }) {
  return <h2>Tea cup for guest #{guest}</h2>;
}
```

- Side effects belong in **event handlers** first, and in **effects** (`useEffect`) only when there is no event.
- Strict Mode calls components twice in development to surface impure code.
- Purity is what lets React (and the React Compiler) safely skip, pause, or repeat renders.

### What is the difference between props and state? @basic
!! Props are inputs passed in by the parent and are read-only. State is data a component owns and can change over time; changing it triggers a re-render.

| | Props | State |
|---|---|---|
| Who owns it | Parent | The component itself |
| Can the component change it? | No | Yes, with the setter |
| Triggers a re-render when changed? | When the parent re-renders with new values | Yes |
| Typical use | Configuration, data to display, callbacks | User input, toggles, fetched UI data |

A value can be state in a parent and a prop in a child. That's the normal way data flows down the tree.

## lists | Lists, keys & conditional rendering | Week 1 | 2

### How do you render a list of items in React? @basic
!! Transform your array into JSX with `.map()` and give each item a stable, unique `key`, usually its id from the data.

```jsx
function ProductList({ products }) {
  return (
    <ul>
      {products.map(product => (
        <li key={product.id}>
          {product.name} ${product.price}
        </li>
      ))}
    </ul>
  );
}
```

Filter before mapping when needed: `products.filter(p => p.inStock).map(...)`.

### Why does React need keys, and why are array indexes a bad key? @intermediate #gate
!! Keys tell React which item is which between renders. With index keys, inserting, deleting or reordering items makes React match the wrong item to the wrong DOM node and state, so inputs, checkboxes and component state "jump" to the wrong row.

Example: a list of rows each holding an uncontrolled `<input>`. Delete the first row:

- **With `key={index}`:** the old row 0 is gone, but React sees keys `0, 1` still exist, keeps the first two DOM nodes, and drops the last one. The text typed in row 0 now appears next to row 1's label.
- **With `key={item.id}`:** React removes exactly the deleted row.

```jsx
// ❌ Breaks on reorder, insert or delete
{todos.map((todo, index) => <TodoRow key={index} todo={todo} />)}

// ✅ Stable identity from the data
{todos.map(todo => <TodoRow key={todo.id} todo={todo} />)}
```

Rules:

- Keys must be unique **among siblings**, not globally.
- Keys must be **stable**. Never generate them during render with `Math.random()` or `crypto.randomUUID()`; that remounts every item on every render.
- An index is acceptable only for a static list that is never reordered, filtered or edited.
- If data has no id, create one when the item is created (for example, when adding it to state).

### Where should the key go, and can a child read its key? @basic
!! Put the key on the outermost element returned from `.map()`, not inside the child component. The key is consumed by React and is **not** passed to the component as a prop.

```jsx
// ❌ key inside the child does nothing for the list
function Item({ item }) { return <li key={item.id}>{item.name}</li>; }

// ✅ key where the array is created
{items.map(item => <Item key={item.id} item={item} />)}
```

If the child needs the id, pass it separately: `<Item key={item.id} id={item.id} />`.

### What are the ways to render something conditionally? @basic
!! Use plain JavaScript: an `if` with early return, the ternary `? :`, logical `&&`, or a variable. Return `null` to render nothing.

```jsx
function Inbox({ messages, isLoading }) {
  if (isLoading) return <Spinner />;            // early return

  return (
    <section>
      {messages.length > 0 && <Badge count={messages.length} />}   {/* && */}
      {messages.length === 0
        ? <p>No messages yet.</p>                                 // ternary
        : <MessageList messages={messages} />}
    </section>
  );
}
```

- Early return: whole-component states (loading, error).
- Ternary: choose between two pieces of JSX.
- `&&`: show something or nothing.

### What is the "0 &&" rendering gotcha? @intermediate
!! `{count && <Badge />}` renders the number `0` on screen when `count` is 0, because `0 && x` evaluates to `0`, and React renders numbers.

```jsx
// ❌ Shows "0" when the cart is empty
{cart.length && <CartBadge count={cart.length} />}

// ✅ Force a boolean
{cart.length > 0 && <CartBadge count={cart.length} />}
// or
{cart.length ? <CartBadge count={cart.length} /> : null}
```

`false`, `null`, `undefined` and `true` render nothing; `0` and `NaN` do render.

### How do you handle loading, error and empty states in a list? @intermediate
!! Treat every data-driven screen as four states (loading, error, empty, success) and render each explicitly, usually with early returns.

```jsx
function Products({ status, products, error }) {
  if (status === 'loading') return <p>Loading products…</p>;
  if (status === 'error') return <p role="alert">Couldn't load products: {error.message}</p>;
  if (products.length === 0) return <p>No products match your filters.</p>;

  return (
    <ul>
      {products.map(p => <li key={p.id}>{p.name}</li>)}
    </ul>
  );
}
```

With TypeScript, model these as a discriminated union so impossible combinations (loading *and* error) can't happen.

### How can a key be used to reset a component's state? @intermediate
!! Changing a component's `key` tells React it is a different component, so React unmounts the old instance and mounts a fresh one with brand-new state. It's the clean way to reset a form when the selected item changes.

```jsx
function Messenger({ selectedContact }) {
  // A new contact gives a fresh, empty draft (no effect needed)
  return <Chat key={selectedContact.id} contact={selectedContact} />;
}
```

This replaces the anti-pattern of a `useEffect` that resets state when a prop changes.

## rendering | How React renders | Week 2 | 3

### What causes a component to re-render? @intermediate
!! A component re-renders when (1) its own state changes, (2) its parent re-renders, or (3) a context it reads changes. A prop change on its own isn't a trigger; props change *because* the parent re-rendered.

- When a component re-renders, **all of its descendants re-render by default**, whether or not their props changed.
- That's usually cheap: rendering means calling functions and comparing output, not touching the DOM.
- To skip a child's re-render you can memoize it (`memo`), move state down, or pass JSX as `children`. In 2026 the React Compiler does most of this automatically.

> **Interview tip:** The common myth is "components re-render when their props change." The accurate answer is "when state changes in them or an ancestor."

### Explain render and commit (reconciliation in one paragraph) @intermediate #gate
!! An update goes through three steps: **trigger** (state changed), **render** (React calls your components and builds a new tree, then diffs it against the previous one) and **commit** (React applies only the minimal DOM changes, then runs effects after the browser paints).

The diffing ("reconciliation") rules worth knowing:

- Same element type at the same position: React keeps the DOM node and component state and updates props.
- Different type at the same position (`<div>` to `<section>`, or `<A>` to `<B>`): React tears down the whole subtree, including state, and builds a new one.
- In lists, **keys** let React match items across renders instead of relying on position.

That's the level interviewers expect. Deep dives into Fiber internals are trivia.

### What is the Virtual DOM? @basic
!! The "Virtual DOM" is the tree of plain JavaScript objects your components return. React compares the new tree with the previous one and applies only the differences to the real DOM, which is much slower to manipulate.

Modern React docs rarely use the term; they talk about "rendering" (building the tree) and "committing" (updating the DOM). Both describe the same idea.

### Does re-rendering mean the DOM changes? @intermediate
!! No. Rendering only calls your component and produces a description of the UI. React touches the DOM during commit only where the output actually differs. A component can re-render many times with zero DOM updates.

This is why "unnecessary re-renders" are often harmless. Measure with the Profiler before optimizing.

### What is Strict Mode and why do things run twice in development? @intermediate
!! `<StrictMode>` is a development-only checker. It renders components twice, and runs effect setup, cleanup, then setup again on mount, to expose impure rendering and missing effect cleanup. It does nothing in production builds.

What it does in development:

- Calls component functions, `useState`/`useMemo` initializers and updater functions twice.
- Mounts, unmounts and re-mounts components once to test your effect cleanup.
- Calls ref callbacks twice on initial mount (React 19).
- Warns about deprecated APIs.

The fix for "my effect runs twice" is to **write correct cleanup**, not to remove Strict Mode or add a "has run" ref.

### What is automatic batching? @intermediate
!! React groups multiple state updates made in the same event into a single re-render. Since React 18 this also applies inside promises, timeouts and native event handlers.

```jsx
function handleClick() {
  setCount(c => c + 1);
  setFlag(f => !f);
  // One re-render, not two
}

async function handleSave() {
  const data = await api.save();
  setSaving(false);
  setData(data);       // Also batched in React 18+
}
```

`flushSync` from `react-dom` forces a synchronous update, but you rarely need it.

## state | useState & event handling | Week 2 | 3

### What is state, and how does useState work? @basic
!! State is a component's memory: data that persists between renders and, when updated, triggers a re-render. `useState(initial)` returns the current value and a setter function.

```jsx
import { useState } from 'react';

function Counter() {
  const [count, setCount] = useState(0);

  return (
    <button onClick={() => setCount(count + 1)}>
      Clicked {count} times
    </button>
  );
}
```

- State is **local and private** to each component instance; two `<Counter />`s have separate counts.
- Calling the setter doesn't change the variable immediately. It **schedules a re-render** with the new value.
- Regular variables reset on every render and don't trigger updates; that's why you need state.

### What does "state is a snapshot" mean? @intermediate
!! During a render, a state variable is a fixed value for that render. Calling `setX` requests a new render with a new value but does not change `x` in the code that's currently running.

```jsx
function Form() {
  const [name, setName] = useState('Ana');

  function handleClick() {
    setName('Ben');
    console.log(name);        // "Ana" (still the snapshot from this render)
    setTimeout(() => {
      alert(name);            // "Ana" (the closure captured this render's value)
    }, 1000);
  }
  // ...
}
```

Event handlers and effects "see" the state from the render they were created in.

### Why does calling setCount(count + 1) three times only add one? @intermediate #gate
!! All three calls read the same snapshot, so with `count = 0` each call says "set count to 1." React queues three identical replacements, and the result is 1. To build on the latest value, use the updater form: `setCount(c => c + 1)`.

```jsx
function handleClick() {
  // count is 0 in this render
  setCount(count + 1);   // set to 0 + 1
  setCount(count + 1);   // set to 0 + 1
  setCount(count + 1);   // set to 0 + 1
  // Next render: 1
}

function handleClickFixed() {
  setCount(c => c + 1);  // 0 → 1
  setCount(c => c + 1);  // 1 → 2
  setCount(c => c + 1);  // 2 → 3
  // Next render: 3
}
```

React processes updater functions in order, passing each one the result of the previous update.

### When should you use the updater function form of a setter? @intermediate
!! Use `setX(prev => next)` whenever the next state depends on the previous state, especially when there are multiple updates in one event or the update runs later (timers, intervals, async code) where the snapshot could be stale.

```jsx
useEffect(() => {
  const id = setInterval(() => {
    setSeconds(s => s + 1);  // Always the latest value; no dependency on `seconds`
  }, 1000);
  return () => clearInterval(id);
}, []);
```

Convention: name the parameter after the first letter of the state (`c` for count) or `prev`.

### What is lazy initial state? @intermediate
!! Pass a function to `useState` when the initial value is expensive to compute. React calls it only on the first render; passing the *result* would recompute it on every render and throw it away.

```jsx
// ❌ readFromStorage() runs on every render
const [todos, setTodos] = useState(readFromStorage());

// ✅ Runs once
const [todos, setTodos] = useState(() => readFromStorage());
```

### How do event handlers work in React? @basic
!! Pass a function (not a function call) to a camelCase prop such as `onClick`, `onChange` or `onSubmit`. React calls it with an event object that wraps the native event.

```jsx
function Toolbar({ onDelete, itemId }) {
  function handleSubmit(e) {
    e.preventDefault();          // Stop the browser's full-page form submit
    // ...
  }

  return (
    <form onSubmit={handleSubmit}>
      <button type="button" onClick={() => onDelete(itemId)}>Delete</button>
      <button type="submit">Save</button>
    </form>
  );
}
```

- `onClick={handleClick}` passes the function; `onClick={handleClick()}` **calls it during render**, which is a bug.
- Wrap in an arrow function to pass arguments: `onClick={() => onDelete(id)}`.
- Naming convention: handlers inside a component are `handleX`; callback props are `onX`.
- `e.stopPropagation()` stops bubbling; `e.preventDefault()` stops default browser behaviour.

### What are synthetic events? @intermediate
!! React wraps native browser events in a `SyntheticEvent` object with the same interface (`target`, `preventDefault`, `stopPropagation`) and consistent behaviour across browsers. The original is available as `e.nativeEvent`.

- Since React 17, React attaches listeners to the root container, not to `document`.
- Event pooling was removed in React 17, so you can safely read `e.target` asynchronously.
- `onChange` on inputs fires on every keystroke (like the native `input` event), not on blur.

### How does React decide whether a state update needs a re-render? @advanced
!! React compares the new value to the current one with `Object.is`. If they are the same, React can skip re-rendering that component and its children. That's why mutating an object and setting the same reference does nothing visible.

```jsx
const [user, setUser] = useState({ name: 'Ana' });

function rename() {
  user.name = 'Ben';     // ❌ mutation
  setUser(user);         // Same reference, so Object.is → true, no re-render
}

function renameFixed() {
  setUser({ ...user, name: 'Ben' });  // ✅ new object, re-render
}
```

## immutability | Immutable updates | Week 2 | 4

### Why must state be updated immutably? @basic #gate
!! React detects changes by comparing references with `Object.is`. If you mutate an object or array in place, the reference doesn't change, so React may not re-render. This is the #1 "why didn't it re-render?" bug.

Immutability also:

- Keeps previous render snapshots correct (each render has its own unchanging data).
- Makes memoization (`memo`, `useMemo`, React Compiler) reliable, since they compare references.
- Makes features like undo/redo and debugging easier.

Treat everything in state as **read-only**. Create a new object or array and pass it to the setter.

### How do you update an object (including nested objects) in state? @basic
!! Copy it with the spread operator and override the fields that change. Spread is shallow, so nested objects must be copied at every level you change.

```jsx
const [user, setUser] = useState({
  name: 'Ana',
  address: { city: 'Lisbon', zip: '1000' },
});

// Top-level field
setUser({ ...user, name: 'Ben' });

// Nested field: copy each level on the path
setUser({
  ...user,
  address: { ...user.address, city: 'Porto' },
});

// Generic input handler using the `name` attribute
function handleChange(e) {
  setUser(prev => ({ ...prev, [e.target.name]: e.target.value }));
}
```

### What are the immutable patterns for adding, removing and updating array items? @basic #gate
!! Add with spread, remove with `filter`, update with `map`. These three patterns cover almost every list update you'll write.

```jsx
// Add
setItems([...items, newItem]);          // append
setItems([newItem, ...items]);          // prepend

// Remove
setItems(items.filter(i => i.id !== id));

// Update one item
setItems(items.map(i => (i.id === id ? { ...i, done: true } : i)));

// Insert at index
setItems([...items.slice(0, index), newItem, ...items.slice(index)]);

// Sort or reverse: copy first
setItems([...items].sort((a, b) => a.price - b.price));
setItems(items.toSorted((a, b) => a.price - b.price));   // ES2023
```

| Avoid (mutates) | Prefer (returns new array) |
|---|---|
| `push`, `unshift` | `[...arr, x]`, `[x, ...arr]` |
| `pop`, `shift`, `splice` | `filter`, `slice`, `toSpliced` |
| `arr[i] = x` | `map`, `arr.with(i, x)` |
| `sort`, `reverse` | `toSorted`, `toReversed`, or copy first |

### How do you handle deeply nested state without spread soup? @intermediate
!! First, try to flatten (normalize) your state so you don't need deep nesting, for example storing items by id. If the shape must stay nested, use Immer (`useImmer` or `produce`), which lets you write "mutating" code that produces a new immutable object.

```jsx
// Normalized: easier updates
const [state, setState] = useState({
  todosById: { a1: { id: 'a1', text: 'Learn React', done: false } },
  order: ['a1'],
});

// With Immer
import { useImmer } from 'use-immer';
const [user, updateUser] = useImmer(initialUser);
updateUser(draft => { draft.address.city = 'Porto'; });
```

## forms | Forms, lifting state & useReducer | Week 2 | 5

### What is the difference between controlled and uncontrolled inputs? @basic
!! A **controlled** input gets its value from React state (`value` + `onChange`), so React is the single source of truth. An **uncontrolled** input keeps its own value in the DOM (`defaultValue`), and you read it when needed with a ref or `FormData`.

```jsx
// Controlled
function Search() {
  const [query, setQuery] = useState('');
  return <input value={query} onChange={e => setQuery(e.target.value)} />;
}

// Uncontrolled
function Signup() {
  function handleSubmit(e) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    console.log(data.get('email'));
  }
  return (
    <form onSubmit={handleSubmit}>
      <input name="email" defaultValue="" />
      <button>Sign up</button>
    </form>
  );
}
```

Use controlled inputs when the UI must react to each keystroke (live filtering, conditional fields, formatting). Uncontrolled is fine for simple submit-only forms, and it's what React Hook Form and React 19 form actions use under the hood.

### How do you bind text, checkbox, select and textarea inputs? @basic
!! Text, select and textarea bind `value`; checkboxes bind `checked`. All of them update through `onChange`.

```jsx
function Settings() {
  const [form, setForm] = useState({
    name: '', bio: '', plan: 'free', newsletter: false,
  });

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  }

  return (
    <form>
      <input name="name" value={form.name} onChange={handleChange} />
      <textarea name="bio" value={form.bio} onChange={handleChange} />
      <select name="plan" value={form.plan} onChange={handleChange}>
        <option value="free">Free</option>
        <option value="pro">Pro</option>
      </select>
      <label>
        <input type="checkbox" name="newsletter" checked={form.newsletter} onChange={handleChange} />
        Newsletter
      </label>
    </form>
  );
}
```

> **Gotcha:** `value={undefined}` makes an input uncontrolled. Switching to a defined value later gives the "changing an uncontrolled input to be controlled" warning. Initialize with `''`.

### What is "lifting state up"? @basic
!! When two components need the same data, move the state to their closest common parent and pass it down as props, along with callbacks to change it. The parent becomes the single source of truth.

```jsx
function Accordion() {
  const [activeIndex, setActiveIndex] = useState(0);
  return (
    <>
      <Panel title="About" isActive={activeIndex === 0} onShow={() => setActiveIndex(0)}>
        We sell lamps.
      </Panel>
      <Panel title="Shipping" isActive={activeIndex === 1} onShow={() => setActiveIndex(1)}>
        Free over $50.
      </Panel>
    </>
  );
}

function Panel({ title, children, isActive, onShow }) {
  return (
    <section>
      <h3>{title}</h3>
      {isActive ? <p>{children}</p> : <button onClick={onShow}>Show</button>}
    </section>
  );
}
```

### How does a child send data to its parent? @basic
!! The parent passes a callback function as a prop, and the child calls it with the data. Data still flows down; events flow up.

```jsx
function Parent() {
  const [filter, setFilter] = useState('all');
  return <FilterBar value={filter} onChange={setFilter} />;
}

function FilterBar({ value, onChange }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)}>
      <option value="all">All</option>
      <option value="food">Food</option>
    </select>
  );
}
```

### What is derived state, and why "derive, don't store"? @intermediate
!! If a value can be computed from existing props or state, compute it during render instead of keeping it in separate state. Duplicated state gets out of sync and needs extra effects to keep it updated.

```jsx
// ❌ Redundant state + effect to sync it
const [expenses, setExpenses] = useState([]);
const [total, setTotal] = useState(0);
useEffect(() => {
  setTotal(expenses.reduce((sum, e) => sum + e.amount, 0));
}, [expenses]);

// ✅ Derived during render
const [expenses, setExpenses] = useState([]);
const [category, setCategory] = useState('all');

const visible = category === 'all'
  ? expenses
  : expenses.filter(e => e.category === category);
const total = visible.reduce((sum, e) => sum + e.amount, 0);
```

Only wrap in `useMemo` if profiling shows the calculation is slow. With React Compiler you usually don't need to.

### What is useReducer, and when should you use it? @intermediate
!! `useReducer` moves state-update logic into a pure function `reducer(state, action) => newState`. Use it when several state values change together, when there are many kinds of updates (add, edit, delete, reset), or when the next state depends on complex rules.

```jsx
function expensesReducer(state, action) {
  switch (action.type) {
    case 'added':
      return [...state, action.expense];
    case 'edited':
      return state.map(e => (e.id === action.expense.id ? action.expense : e));
    case 'deleted':
      return state.filter(e => e.id !== action.id);
    default:
      throw new Error(`Unknown action: ${action.type}`);
  }
}

function ExpenseTracker() {
  const [expenses, dispatch] = useReducer(expensesReducer, []);

  function handleAdd(expense) {
    dispatch({ type: 'added', expense });
  }
  // ...
}
```

Benefits: update logic lives in one place, it's easy to unit-test (it's a plain function), and event handlers describe *what happened* rather than *how to update*.

### useState vs useReducer: how do you choose? @intermediate
!! Default to `useState` for independent, simple values. Reach for `useReducer` when updates are complex, interrelated, or numerous enough that the logic belongs in one function.

| | `useState` | `useReducer` |
|---|---|---|
| Best for | Independent primitives, toggles, inputs | Related values, many action types |
| Code size | Smaller | More upfront code |
| Update logic | Spread across handlers | Centralized in the reducer |
| Testing | Through the component | Reducer testable as a pure function |
| Debugging | Harder with many setters | Log every action |

You can mix both in the same component.

### How do you decide which component should own a piece of state? @intermediate
!! Find the minimal state, find every component that reads it, and put the state in their closest common parent, as low in the tree as possible. Then ask whether it's really local state at all, or URL, server, or global state.

Steps ("Thinking in React"):

1. Identify the **minimal** state; everything else is derived.
2. List the components that render based on it.
3. Put it in their **closest common parent**.

Where state actually lives in a modern app:

| Kind | Example | Tool |
|---|---|---|
| Local UI | Modal open, input text | `useState` / `useReducer` |
| Shared by a subtree | Selected tab in a wizard | Lift up, or Context |
| Shareable / bookmarkable | Filters, page, search | URL (`useSearchParams`) |
| Server data | Products, users | TanStack Query or framework loaders |
| App-wide client | Cart, sidebar, preferences | Zustand (or Context for rare changes) |
