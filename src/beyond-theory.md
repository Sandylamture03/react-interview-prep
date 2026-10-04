@section beyond-theory

## b-portals | Portals | Beyond the roadmap | – | beyond

### What is a portal, and when do you use one? @basic
!! `createPortal(children, domNode)` renders children into a different DOM node (usually `document.body`) while keeping them in the same place in the **React** tree. Use it for UI that must escape a parent's `overflow: hidden`, `z-index` or `transform`: modals, tooltips, dropdown menus and toasts.

```jsx
import { createPortal } from 'react-dom';

function Modal({ children }) {
  return createPortal(
    <div className="modal-backdrop">
      <div role="dialog" aria-modal="true" className="modal">
        {children}
      </div>
    </div>,
    document.body
  );
}
```

- Only the DOM placement changes. The portal's content still gets context from its React parents, and its state belongs to the component that rendered it.
- `document.body` doesn't exist during server rendering, so render portals only on the client (after mount).

### How do events and context behave inside a portal? @intermediate
!! Events bubble through the **React tree**, not the DOM tree, and context flows through the React tree too. A click inside a portaled modal still triggers `onClick` handlers on the modal's React ancestors, even though in the DOM the modal sits directly under `body`.

```jsx
function Card() {
  const [open, setOpen] = useState(false);

  return (
    <div onClick={() => console.log('card clicked')}>   {/* Also fires for clicks inside the modal */}
      <button onClick={() => setOpen(true)}>Open</button>
      {open && (
        <Modal>
          <button onClick={() => setOpen(false)}>Close</button>
        </Modal>
      )}
    </div>
  );
}
```

- Call `e.stopPropagation()` inside the modal if ancestors shouldn't react, or render the modal outside that ancestor.
- DOM-level code behaves differently: a native `addEventListener` on the card's DOM node, or a `node.contains(e.target)` check, does **not** see portal events. That mismatch causes most portal bugs.

### What does an accessible modal need beyond a portal? @intermediate
!! A portal only moves DOM nodes. An accessible modal also needs `role="dialog"`, `aria-modal="true"` and a label, focus moved in on open and returned to the trigger on close, Tab kept inside, Escape to close, and the page behind made inert. The native `<dialog>` element opened with `showModal()` gives you most of this for free.

```jsx
import { useEffect, useId, useRef } from 'react';

function ConfirmDialog({ open, onClose, title, children }) {
  const ref = useRef(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (open && !dialog.open) dialog.showModal();   // Top layer, inert page, Escape support
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog ref={ref} onClose={onClose} aria-labelledby={titleId}>
      <h2 id={titleId}>{title}</h2>
      {children}
    </dialog>
  );
}
```

- `showModal()` renders in the browser's **top layer**, above everything, so you need neither a portal nor `z-index`.
- Component libraries (shadcn/ui's Dialog, built on Radix) also handle focus trapping, scroll locking and screen-reader details.

## b-security | Security: XSS & dangerouslySetInnerHTML | Beyond the roadmap | – | beyond

### How does React protect you from XSS by default? @basic
!! React escapes every value you render as text in JSX, so a string such as `<img src=x onerror=alert(1)>` appears as literal text instead of running. The protection stops at the escape hatches: `dangerouslySetInnerHTML`, URLs you put in `href` or `src`, refs that write `innerHTML`, and props you spread from untrusted objects.

```jsx
const comment = '<img src=x onerror="alert(document.cookie)">';

<p>{comment}</p>   // Rendered as harmless text
```

### What is dangerouslySetInnerHTML, and how do you use it safely? @intermediate
!! It sets an element's `innerHTML` from a string: `dangerouslySetInnerHTML={{ __html: html }}`. React does no escaping, so user-influenced HTML becomes an XSS hole. Use it only for trusted HTML, and sanitize anything users could have written with a library such as DOMPurify.

```jsx
import DOMPurify from 'dompurify';

function ArticleBody({ html }) {
  const clean = DOMPurify.sanitize(html);   // Removes scripts, on* handlers and javascript: URLs
  return <div className="prose" dangerouslySetInnerHTML={{ __html: clean }} />;
}
```

- The awkward name and the `__html` wrapper are deliberate: they make the risk obvious in code review.
- An element can't have both `children` and `dangerouslySetInnerHTML`.
- Sanitize when rendering, even if you also sanitized before saving. Never trust what comes back from the database.

### Which other React patterns can open XSS holes? @intermediate
!! Watch for user-controlled URLs in `href`/`src` (`javascript:` links), spreading untrusted objects as props (they can carry `dangerouslySetInnerHTML`), writing `innerHTML` through a ref, and embedding user data in inline `<script>` tags during server rendering.

```jsx
// ❌ A user sets their website to "javascript:alert(document.cookie)"
<a href={user.website}>Website</a>

// ✅ Allow only safe protocols
function safeUrl(url) {
  try {
    const u = new URL(url, window.location.origin);
    return ['http:', 'https:', 'mailto:'].includes(u.protocol) ? u.href : null;
  } catch {
    return null;
  }
}
const href = safeUrl(user.website);
{href ? <a href={href} rel="noopener noreferrer">Website</a> : null}

// ❌ Spreading untrusted data as props
<div {...JSON.parse(userSettings)} />   // could include dangerouslySetInnerHTML

// ❌ Bypassing React with a ref
ref.current.innerHTML = userBio;
```

Recent React versions warn about or block `javascript:` URLs, but validate anyway. An allowlist of protocols is simple and also covers code that doesn't go through React.

### Where should a React app store auth tokens? @intermediate
!! Prefer an `httpOnly`, `Secure`, `SameSite` cookie set by the server. JavaScript can't read it, so an XSS bug can't steal it. Tokens in `localStorage` or readable cookies are exposed to any script running on your page. Either way, an XSS bug can act as the user while the page is open, so preventing XSS comes first.

- Cookies bring CSRF risk: use `SameSite=Lax` or `Strict`, and CSRF protection for state-changing requests. (Next.js Server Actions accept only POST and compare the `Origin` and `Host` headers.)
- Keep access tokens short-lived and refresh them through the httpOnly cookie.
- Never put secrets in the client bundle; `VITE_` and `NEXT_PUBLIC_` variables are public.

## b-rendering | Rendering strategies & hydration | Beyond the roadmap | – | beyond

### What are CSR, SSR, SSG and ISR? @intermediate
!! They differ in **when and where the HTML is produced**. CSR builds the page in the browser with JavaScript. SSR renders HTML on the server for each request. SSG renders HTML once at build time. ISR serves static HTML but regenerates it later, after a time limit or on demand.

| Strategy | HTML produced | Good for | Trade-off |
|---|---|---|---|
| CSR (a Vite SPA) | In the browser | Dashboards behind a login | Slower first paint, weaker SEO |
| SSR | On the server, per request | Personalized or fast-changing pages | Server cost, slower time to first byte |
| SSG | At build time | Docs, blogs, marketing pages | Must rebuild or revalidate to update |
| ISR / revalidation | Static, regenerated later | Product listings, CMS pages | Content can be briefly stale |
| Streaming SSR | On the server, sent in chunks | Pages with a few slow parts | Needs a streaming-capable framework |

- In Next.js App Router you rarely pick these by name: a route is rendered statically or per request depending on what data it reads and how that data is cached.
- Server Components describe *where component code runs*. They work with static and dynamic rendering alike.

### What is hydration? @basic
!! Hydration is React taking over HTML that was already rendered on the server. React renders the same components in the browser, matches them to the existing DOM nodes and attaches event handlers, instead of building the DOM from scratch. Until hydration finishes, the page is visible but not interactive.

```jsx
// Server (usually done for you by a framework): renderToPipeableStream(<App />)
// Client:
import { hydrateRoot } from 'react-dom/client';

hydrateRoot(document.getElementById('root'), <App />);
```

- **Selective hydration** (React 18+): with Suspense boundaries, React hydrates parts of the page independently and prioritizes the part the user interacts with.
- Server Components are never hydrated. Their code doesn't ship to the browser, only their rendered output.

### What causes hydration mismatch errors, and how do you fix them? @intermediate
!! A mismatch happens when the first client render differs from the server HTML. Common causes: values that differ between server and browser (`Date.now()`, `Math.random()`, `toLocaleString()`), `typeof window` checks in render, reading `localStorage` in render, invalid HTML nesting (`<div>` inside `<p>`), and browser extensions that edit the DOM.

```jsx
// ❌ Server and browser produce different text
function Greeting() {
  return <p>It is {new Date().toLocaleTimeString()}</p>;
}

// ✅ Same output on both, real value after hydration ("two-pass rendering")
function Greeting() {
  const [time, setTime] = useState(null);
  useEffect(() => setTime(new Date().toLocaleTimeString()), []);
  return <p>It is {time ?? '…'}</p>;
}
```

- Use `useId` for ids instead of random numbers or counters.
- `useSyncExternalStore` with a `getServerSnapshot` gives a server-safe value for browser APIs.
- Fix invalid nesting; the browser's HTML parser restructures it, so the DOM no longer matches.
- For one unavoidable text difference (a timestamp), `suppressHydrationWarning` on that element silences it (one level deep only).

React 19 reports a single error with a diff of the mismatched content, which makes these much easier to track down.

### What is streaming SSR with Suspense? @advanced
!! Instead of waiting for all data before sending any HTML, the server sends the page shell straight away and streams each `<Suspense>` boundary's content when its data is ready, along with a small inline script that swaps it into place. Users see content sooner, and slow sections don't hold up fast ones.

```tsx
// Next.js App Router: async Server Components inside Suspense stream automatically
export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <>
      <ProductDetails id={id} />            {/* fast query */}
      <Suspense fallback={<ReviewsSkeleton />}>
        <Reviews id={id} />                 {/* slow query streams in later */}
      </Suspense>
    </>
  );
}
```

Under the hood this uses `renderToPipeableStream` (Node) or `renderToReadableStream` (Web Streams). The older `renderToString` can't stream or wait for data.

### How do you render a component only in the browser? @intermediate
!! First, `'use client'` does **not** mean client-only: Client Components are still rendered to HTML on the server. To skip server rendering for a browser-only widget (a map, or a chart that reads `window`), render a placeholder until after hydration. In Next.js you can instead load it with `next/dynamic` and `ssr: false` from a Client Component.

```jsx
// Option 1: a hook that is false on the server and during hydration, true afterwards
import { useSyncExternalStore } from 'react';

const subscribe = () => () => {};
export function useIsClient() {
  return useSyncExternalStore(subscribe, () => true, () => false);
}

function MapPanel() {
  const isClient = useIsClient();
  return isClient ? <LeafletMap /> : <div className="map-placeholder" aria-hidden="true" />;
}
```

```jsx
// Option 2 (Next.js): the widget's module never loads on the server
'use client';
import dynamic from 'next/dynamic';

const LeafletMap = dynamic(() => import('./LeafletMap'), {
  ssr: false,
  loading: () => <p>Loading map…</p>,
});
```

Option 1 still imports the module on the server. If a library touches `window` as soon as it's imported, use option 2.

## b-hooks | Less common hooks | Beyond the roadmap | – | beyond

### What are all the built-in React hooks, grouped by purpose? @basic #new
!! React 19.2 has about 20 built-in hooks. Group them by job: state, context, refs, effects, performance, Actions and forms, and a few utilities. Interviewers often ask you to name them and say when you'd reach for each.

| Group | Hooks |
|---|---|
| State | `useState`, `useReducer` |
| Context | `useContext` |
| Refs | `useRef`, `useImperativeHandle` |
| Effects | `useEffect`, `useLayoutEffect`, `useInsertionEffect`, `useEffectEvent` |
| Performance | `useMemo`, `useCallback`, `useTransition`, `useDeferredValue` |
| Actions and forms | `useActionState`, `useOptimistic`, `useFormStatus` (from `react-dom`) |
| Utilities | `useId`, `useSyncExternalStore`, `useDebugValue` |

`use` is an API rather than a hook: it reads a promise or a context and, unlike hooks, can be called inside conditions and loops.

### What is useId, and when should you use it? @basic
!! `useId()` returns a unique, stable id that is identical on the server and the client. Use it to connect labels, hints and ARIA attributes inside reusable components. Don't use it for list keys, and don't generate ids with `Math.random()` or a counter, because those break hydration.

```jsx
import { useId } from 'react';

function PasswordField() {
  const id = useId();
  return (
    <>
      <label htmlFor={id}>Password</label>
      <input id={id} type="password" aria-describedby={`${id}-hint`} />
      <p id={`${id}-hint`}>At least 12 characters.</p>
    </>
  );
}
```

Each `PasswordField` instance gets its own id, so the component can appear several times on one page.

### What is useImperativeHandle? @intermediate
!! `useImperativeHandle(ref, createHandle)` customizes what a parent receives through a `ref`. Instead of the whole DOM node, the child exposes a small API such as `focus()` or `scrollToBottom()`. In React 19 the child receives `ref` as a normal prop.

```jsx
import { useImperativeHandle, useRef } from 'react';

function SearchInput({ ref, ...props }) {
  const inputRef = useRef(null);

  useImperativeHandle(ref, () => ({
    focus: () => inputRef.current.focus(),
    clear: () => { inputRef.current.value = ''; },
  }), []);

  return <input ref={inputRef} {...props} />;
}

function Toolbar() {
  const searchRef = useRef(null);
  return (
    <>
      <SearchInput ref={searchRef} />
      <button onClick={() => searchRef.current.focus()}>Focus search</button>
    </>
  );
}
```

Use it sparingly. If something can be a prop (like `isOpen`), make it a prop. Imperative handles suit one-off actions: focus, scroll, play, measure.

### What is useSyncExternalStore? @advanced
!! `useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot?)` subscribes a component to a data source outside React (a browser API or a third-party store) safely under concurrent rendering. It prevents **tearing**, where parts of the UI show different values of the same store during one render. Zustand and React Redux use it internally.

```jsx
import { useSyncExternalStore } from 'react';

function subscribe(callback) {
  window.addEventListener('online', callback);
  window.addEventListener('offline', callback);
  return () => {
    window.removeEventListener('online', callback);
    window.removeEventListener('offline', callback);
  };
}

export function useOnlineStatus() {
  return useSyncExternalStore(
    subscribe,
    () => navigator.onLine,   // Client snapshot
    () => true                // Server snapshot (no navigator on the server)
  );
}
```

- `getSnapshot` must return the same value (by `Object.is`) while nothing has changed. Returning a new object each call causes an infinite loop.
- Define `subscribe` outside the component (or memoize it), otherwise React resubscribes on every render.

### What do useDebugValue and useInsertionEffect do? @advanced
!! Both are mainly for library authors. `useDebugValue(value)` shows a label next to a custom hook in React DevTools. `useInsertionEffect` runs before layout effects so CSS-in-JS libraries can insert `<style>` tags before any code reads layout. You won't need it in application code.

```jsx
function useOnlineStatus() {
  const isOnline = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  useDebugValue(isOnline ? 'Online' : 'Offline');   // Shown in DevTools
  return isOnline;
}
```

- `useDebugValue(date, d => d.toDateString())` defers expensive formatting until DevTools inspects the hook.
- `useInsertionEffect` can't update state, and refs aren't attached yet when it runs. It exists for libraries such as Emotion.

## b-nojsx | React without JSX: createElement, Children & cloneElement | Beyond the roadmap | – | beyond

### What does JSX compile to, and can you write React without it? @basic
!! JSX compiles to function calls that create element objects. With the modern automatic runtime, `<h1 className="title">Hi</h1>` becomes `jsx('h1', { className: 'title', children: 'Hi' })` from `react/jsx-runtime`; the classic transform produced `React.createElement('h1', { className: 'title' }, 'Hi')`. You can call `createElement` yourself, which is how React works without a build step.

```jsx
import { createElement } from 'react';

// <Greeting name="Ana" /> creates the same element as:
const greeting = createElement(Greeting, { name: 'Ana' });

// <ul><li key="a">A</li></ul>
const list = createElement('ul', null, createElement('li', { key: 'a' }, 'A'));
```

An element is a plain, immutable object (roughly `{ type, props, key }`). It *describes* UI; it isn't a DOM node or a component instance.

### What's the difference between a component, an element and an instance? @intermediate
!! A **component** is the function (or class) you write. An **element** is the plain object JSX creates to describe what to render, such as `{ type: Button, props: { label: 'Save' } }`. An **instance** is the live, mounted occurrence React keeps in the tree for that element, which holds state and effects.

```jsx
function Button({ label }) {            // component
  return <button>{label}</button>;
}

const el = <Button label="Save" />;     // element: a description, cheap to create

// Rendering <Button /> in two places creates two instances,
// each with its own state, effects and position in the tree.
```

Elements are recreated on every render; instances persist across renders as long as the type and position (or key) stay the same.

### What are React.Children and cloneElement, and why are they discouraged? @intermediate #legacy
!! `Children` (`map`, `forEach`, `count`, `toArray`, `only`) lets a component inspect and transform the `children` it receives, and `cloneElement(element, props)` copies an element with extra or overridden props. React's docs list both as legacy APIs: they hide data flow and break as soon as children are wrapped in another component or a fragment.

```jsx
import { Children, cloneElement } from 'react';

// Legacy pattern: inject `isActive` into each child
function List({ children, activeIndex }) {
  return Children.map(children, (child, i) =>
    cloneElement(child, { isActive: i === activeIndex })
  );
}

// Breaks with <List><RowsGroup /></List>: RowsGroup is one child, not each row
```

Prefer explicit data (an `items` array with a `renderItem` prop), context (compound components), or letting children read what they need.

## b-profiler | The Profiler API | Beyond the roadmap | – | beyond

### What is the Profiler component, and what does onRender report? @intermediate
!! `<Profiler id onRender>` measures how long a subtree takes to render, from code. React calls `onRender` after each commit with timings, so you can log or report slow renders. It's the programmatic version of the DevTools Profiler tab.

```jsx
import { Profiler } from 'react';

function onRender(id, phase, actualDuration, baseDuration, startTime, commitTime) {
  if (actualDuration > 16) {
    console.warn(`${id} ${phase} took ${actualDuration.toFixed(1)} ms`);
  }
}

<Profiler id="ProductTable" onRender={onRender}>
  <ProductTable rows={rows} />
</Profiler>
```

| Argument | Meaning |
|---|---|
| `id` | The Profiler's `id` prop |
| `phase` | `"mount"`, `"update"` or `"nested-update"` |
| `actualDuration` | Milliseconds spent rendering the subtree in this commit (drops when memoization works) |
| `baseDuration` | Estimated milliseconds to re-render the whole subtree without any memoization |
| `startTime`, `commitTime` | When React started rendering and when it committed |

Profiling adds overhead, so it's disabled in production builds by default. React provides a special profiling build if you need it in production.

### When would you use the Profiler API instead of React DevTools? @intermediate
!! Use DevTools to investigate interactively on your own machine. Use the Profiler API to measure from code: logging slow renders in a staging build, automated performance checks, or tracking one widget's render time across releases. Find the problem with DevTools; watch it with the API.

Pair both with user-centred metrics (INP, LCP from the `web-vitals` package): a fast render that blocks input for other reasons still feels slow.

## b-patterns | Component patterns | Beyond the roadmap | – | beyond

### What is the compound components pattern? @intermediate
!! Compound components are a set of components that work together and share implicit state through context, like `<select>` and `<option>`. The parent owns the state; parts such as `<Tabs.Trigger>` and `<Tabs.Panel>` read it from context. Users arrange the parts freely instead of passing one large configuration object.

```jsx
<Tabs defaultValue="account">
  <Tabs.List aria-label="Settings">
    <Tabs.Trigger value="account">Account</Tabs.Trigger>
    <Tabs.Trigger value="billing">Billing</Tabs.Trigger>
  </Tabs.List>
  <Tabs.Panel value="account">…</Tabs.Panel>
  <Tabs.Panel value="billing">…</Tabs.Panel>
</Tabs>
```

shadcn/ui and Radix components use this pattern. A full implementation is in this package's coding challenges.

### How do you design a component that works controlled or uncontrolled? @advanced
!! Mirror native inputs: accept `value` + `onChange` for controlled use and `defaultValue` for uncontrolled use. Internally, keep your own state only when `value` is undefined, and always call `onChange`. This "controllable state" pattern makes one component work in both simple and fully managed forms.

```jsx
function useControllableState({ value, defaultValue, onChange }) {
  const [internal, setInternal] = useState(defaultValue);
  const isControlled = value !== undefined;
  const current = isControlled ? value : internal;

  function setValue(next) {
    if (!isControlled) setInternal(next);
    onChange?.(next);
  }
  return [current, setValue];
}

function Toggle({ pressed, defaultPressed = false, onPressedChange }) {
  const [on, setOn] = useControllableState({
    value: pressed,
    defaultValue: defaultPressed,
    onChange: onPressedChange,
  });
  return (
    <button aria-pressed={on} onClick={() => setOn(!on)}>
      {on ? 'On' : 'Off'}
    </button>
  );
}

<Toggle defaultPressed />                                 // uncontrolled
<Toggle pressed={isBold} onPressedChange={setIsBold} />   // controlled
```

Don't switch a component between controlled and uncontrolled during its lifetime. React warns about this for inputs for the same reason.

### What are headless components and hooks? @intermediate
!! A headless component or hook provides behaviour, state and accessibility (keyboard handling, ARIA attributes, focus management) but no styling, so you render your own markup. Examples: TanStack Table, Radix UI primitives, React Aria and Downshift. It separates how something works from how it looks.

```jsx
// A tiny headless hook: logic and ARIA, no markup or styles
function useDisclosure(initial = false) {
  const [isOpen, setIsOpen] = useState(initial);
  const toggle = () => setIsOpen(o => !o);
  return {
    isOpen,
    close: () => setIsOpen(false),
    triggerProps: { 'aria-expanded': isOpen, onClick: toggle },
  };
}

function FaqItem({ question, answer }) {
  const { isOpen, triggerProps } = useDisclosure();
  return (
    <div className="faq">
      <button {...triggerProps}>{question}</button>
      {isOpen && <p>{answer}</p>}
    </div>
  );
}
```

### What is a polymorphic "as" prop? @intermediate
!! A polymorphic component lets the caller choose which element it renders, such as `<Text as="label">` or `<Button as="a" href="/docs">`. One styled component then works as different elements without wrapper divs. Radix and shadcn/ui offer a related `asChild` prop, which merges the component's props and behaviour onto its single child element instead.

```jsx
function Text({ as: Component = 'span', className = '', ...props }) {
  return <Component className={`text ${className}`} {...props} />;
}

<Text as="label" htmlFor="email">Email</Text>
<Text as="h2">Settings</Text>

// shadcn/ui: Button styles on a router link, with no <button> inside an <a>
<Button asChild>
  <Link to="/docs">Read the docs</Link>
</Button>
```

The variable must be capitalized (`Component`), or JSX would treat it as a DOM tag named "component". Typing `as` props precisely in TypeScript needs generics, which is one reason libraries moved to `asChild`.
