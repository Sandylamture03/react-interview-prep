@section beyond-coding

## bb-portals | Portals | Beyond the roadmap | – | beyond

### Accessible modal with createPortal @advanced
Build a reusable `Modal` rendered through a portal:

- It appears above the page regardless of any parent's `overflow` or `z-index`.
- It's labelled by its title; Escape and clicking the backdrop close it.
- Focus moves into the modal when it opens and returns to the trigger when it closes; Tab stays inside.
- The page behind it can't scroll while it's open.
- A parent passing a new inline `onClose` on every render must not reset focus.
-- answer --
```jsx
import { useEffect, useEffectEvent, useId, useRef } from 'react';
import { createPortal } from 'react-dom';

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), ' +
  'textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function Modal({ open, onClose, title, children }) {
  const titleId = useId();
  const panelRef = useRef(null);
  const requestClose = useEffectEvent(() => onClose());   // Latest onClose, not a dependency

  useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    const previouslyFocused = document.activeElement;
    (panel.querySelector(FOCUSABLE) ?? panel).focus();

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';            // Scroll lock

    function onKeyDown(e) {
      if (e.key === 'Escape') return requestClose();
      if (e.key !== 'Tab') return;
      const items = [...panel.querySelectorAll(FOCUSABLE)];
      if (items.length === 0) return e.preventDefault();
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus();                         // Return focus to the trigger
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div
      className="modal-backdrop"
      onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="modal-panel"
      >
        <h2 id={titleId}>{title}</h2>
        {children}
        <button type="button" onClick={onClose}>Close</button>
      </div>
    </div>,
    document.body
  );
}
```

```jsx
// Usage
function DeleteAccount() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)}>Delete account</button>
      <Modal open={open} onClose={() => setOpen(false)} title="Delete your account?">
        <p>This can't be undone.</p>
      </Modal>
    </>
  );
}
```

**Key points**

- The portal escapes clipping and stacking contexts, while React events and context still flow from the component that renders it.
- `useEffectEvent` (React 19.2) lets the effect call the latest `onClose` without listing it as a dependency, so a parent's inline arrow doesn't re-run the effect and steal focus.
- Closing on `mousedown` only when `e.target === e.currentTarget` means clicks inside the panel never close it.
- In production, prefer the native `<dialog>` with `showModal()` or a library dialog (shadcn/ui, Radix). They also handle `inert` backgrounds, nested dialogs and screen-reader edge cases.

## bb-security | Security | Beyond the roadmap | – | beyond

### Render user-generated HTML and links safely @intermediate
Users write product reviews in a rich-text editor that produces HTML, and can add a link to their website. Build:

- `SafeHtml`: renders review HTML without allowing scripts, event handlers or `javascript:` URLs.
- `UserLink`: renders a link only for `http`, `https` or `mailto` URLs (otherwise plain text), and opens external sites safely.
-- answer --
```jsx
import DOMPurify from 'dompurify';
import { useMemo } from 'react';

export function SafeHtml({ html, className }) {
  const clean = useMemo(
    () => DOMPurify.sanitize(html, { USE_PROFILES: { html: true } }),   // HTML only: no SVG or MathML
    [html]
  );
  return <div className={className} dangerouslySetInnerHTML={{ __html: clean }} />;
}

const SAFE_PROTOCOLS = new Set(['http:', 'https:', 'mailto:']);

function toSafeUrl(raw) {
  try {
    const url = new URL(raw, window.location.origin);
    return SAFE_PROTOCOLS.has(url.protocol) ? url : null;
  } catch {
    return null;   // Not a URL at all
  }
}

export function UserLink({ href, children }) {
  const url = toSafeUrl(href);
  if (!url) return <span>{children}</span>;

  const external = url.protocol !== 'mailto:' && url.origin !== window.location.origin;
  return (
    <a
      href={url.href}
      {...(external && { target: '_blank', rel: 'noopener noreferrer nofollow' })}
    >
      {children}
    </a>
  );
}

// Usage
<SafeHtml className="prose" html={review.bodyHtml} />
<UserLink href={review.author.website}>{review.author.name}</UserLink>
```

**Key points**

- Sanitize right before rendering, even if the server also sanitized on save.
- DOMPurify needs a DOM. To sanitize during server rendering, use a server-side DOM (for example `isomorphic-dompurify`).
- Parsing with `new URL()` normalizes tricks like `JaVaScRiPt:` or leading spaces before you check the protocol.
- `rel="noopener"` stops the opened page from controlling yours through `window.opener`; `nofollow` discourages link spam.
- Test with hostile input: `<img src=x onerror=alert(1)>`, `<a href="javascript:alert(1)">`, `<svg onload=alert(1)>`.

## bb-rendering | Rendering strategies & hydration | Beyond the roadmap | – | beyond

### Show a local time without a hydration mismatch @intermediate
An order page is server-rendered. It must show "Ordered at 14:05" in the **visitor's** time zone, plus a "Today" badge if the order was placed today. Rendering `new Date(order.createdAt).toLocaleTimeString()` directly causes hydration errors.

Make the server HTML stable and show the local time right after hydration. `createdAt` is an ISO string in UTC, such as `"2026-10-04T14:05:00.000Z"`.
-- answer --
```jsx
'use client';
import { useSyncExternalStore } from 'react';

const noopSubscribe = () => () => {};

function useIsClient() {
  // false on the server and during hydration, true after hydration
  return useSyncExternalStore(noopSubscribe, () => true, () => false);
}

export function OrderTime({ iso }) {
  const isClient = useIsClient();

  if (!isClient) {
    // Deterministic on the server and in the first client render
    return <time dateTime={iso}>{iso.slice(11, 16)} UTC</time>;
  }

  const date = new Date(iso);
  const isToday = date.toDateString() === new Date().toDateString();
  return (
    <time dateTime={iso}>
      {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      {isToday && <span className="badge">Today</span>}
    </time>
  );
}
```

**Why it works:** during hydration React uses the third argument (the server snapshot, `false`), so the first client render matches the server HTML exactly. Right after hydration React re-renders with the client snapshot (`true`) and shows the local time.

**Alternatives**

- A `useState(false)` flag set to `true` in `useEffect` (two-pass rendering) works the same way.
- `suppressHydrationWarning` on `<time>` is fine for one text difference, but not here, because the badge changes the element structure.
- If you store the user's time zone (profile or cookie), format on the server with `Intl.DateTimeFormat` and skip the second pass.

### Stream a slow section with Suspense @intermediate
On a Next.js App Router product page, product details come from a fast query (about 50 ms) and reviews from a slow service (about 2 s). Today the whole page waits 2 seconds.

Make the details appear immediately and stream the reviews in behind a skeleton, without moving the fetch to the client.
-- answer --
```tsx
// app/products/[id]/page.tsx
import { Suspense } from 'react';
import { notFound } from 'next/navigation';

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await getProduct(id);   // fast
  if (!product) notFound();

  return (
    <main>
      <h1>{product.name}</h1>
      <p>{product.description}</p>

      <Suspense fallback={<ReviewsSkeleton />}>
        <Reviews productId={id} />          {/* streams in when ready */}
      </Suspense>
    </main>
  );
}

async function Reviews({ productId }: { productId: string }) {
  const reviews = await getReviews(productId);   // slow: only this boundary waits
  if (reviews.length === 0) return <p>No reviews yet.</p>;
  return (
    <ul>
      {reviews.map(r => (
        <li key={r.id}>
          <strong>{r.author}</strong>: {r.text}
        </li>
      ))}
    </ul>
  );
}

function ReviewsSkeleton() {
  return <div aria-busy="true" aria-label="Loading reviews" className="h-32 animate-pulse rounded bg-zinc-100" />;
}
```

**Key points**

- The server sends HTML for everything outside the boundary at once, then streams the reviews' HTML into place when `getReviews` resolves. No client-side fetching, no extra JavaScript.
- Before, the page component awaited both queries, so the slowest one decided when anything appeared.
- `loading.tsx` would wrap the *whole* page in one boundary; a nested `<Suspense>` gives finer control.
- If two slow queries are independent, start both before awaiting either so they run in parallel.

## bb-hooks | Less common hooks | Beyond the roadmap | – | beyond

### useMediaQuery with useSyncExternalStore @intermediate
Write `useMediaQuery(query)` that returns whether a CSS media query matches and updates when the result changes. It must:

- Work with server rendering (assume `false` on the server).
- Avoid tearing under concurrent rendering.
- Not resubscribe on every render.

Use it to switch between a sidebar and a bottom navigation bar.
-- answer --
```jsx
import { useCallback, useSyncExternalStore } from 'react';

export function useMediaQuery(query) {
  const subscribe = useCallback(
    callback => {
      const mql = window.matchMedia(query);
      mql.addEventListener('change', callback);
      return () => mql.removeEventListener('change', callback);
    },
    [query]   // Resubscribe only when the query changes
  );

  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,   // A boolean: stable between calls
    () => false                               // Server snapshot
  );
}

function AppNav() {
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  return isDesktop ? <Sidebar /> : <BottomNav />;
}
```

**Key points**

- `getSnapshot` returns a primitive, so `Object.is` comparisons stay stable and React doesn't loop.
- `subscribe` is memoized on `query` (the React Compiler would do this for you).
- With a `false` server snapshot, server HTML shows the mobile layout, and desktops switch after hydration. When the difference is purely visual, prefer CSS media queries, which never flash.

### Video player with an imperative API (useImperativeHandle) @intermediate
Build a `VideoPlayer` component that wraps `<video>` and exposes only `play()`, `pause()` and `seek(seconds)` to its parent through a ref. The parent has its own **Play**, **Pause** and **Jump to 1:30** buttons. Use React 19's ref-as-prop.
-- answer --
```jsx
import { useImperativeHandle, useRef } from 'react';

function VideoPlayer({ src, ref }) {
  const videoRef = useRef(null);

  useImperativeHandle(ref, () => ({
    play: () => videoRef.current.play(),
    pause: () => videoRef.current.pause(),
    seek: seconds => {
      videoRef.current.currentTime = seconds;
    },
  }), []);

  return <video ref={videoRef} src={src} controls width={640} />;
}

export function Lesson() {
  const playerRef = useRef(null);

  return (
    <>
      <VideoPlayer ref={playerRef} src="/videos/react-19-actions.mp4" />
      <div className="controls">
        <button onClick={() => playerRef.current.play().catch(() => {})}>Play</button>
        <button onClick={() => playerRef.current.pause()}>Pause</button>
        <button onClick={() => playerRef.current.seek(90)}>Jump to 1:30</button>
      </div>
    </>
  );
}
```

**Key points**

- The parent can't reach the `<video>` node, only the three methods, so the player's internals can change freely.
- `play()` returns a promise that rejects if the browser blocks playback, so handle it (here it's ignored deliberately).
- Playback is a good fit for an imperative API: it's an action, not a piece of state. If the parent also needs to *know* whether the video is playing, add an `onPlayingChange` callback prop.

### Accessible form field with useId @basic
Build a reusable `Field` component that renders a label, an input, an optional hint and an optional error, linked with ARIA so screen readers announce the hint and the error with the input. It must work when the same form appears twice on a page and with server rendering.
-- answer --
```jsx
import { useId } from 'react';

export function Field({ label, hint, error, ...inputProps }) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy = [hint && hintId, error && errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        {...inputProps}
      />
      {hint && <p id={hintId} className="hint">{hint}</p>}
      {error && <p id={errorId} className="error" role="alert">{error}</p>}
    </div>
  );
}

function AddressForm({ title }) {
  return (
    <fieldset>
      <legend>{title}</legend>
      <Field label="Street" name="street" autoComplete="street-address" />
      <Field label="Postcode" name="postcode" hint="5 digits" />
    </fieldset>
  );
}

// Two forms on one page: every id is unique and matches between server and client
<AddressForm title="Shipping address" />
<AddressForm title="Billing address" />
```

**Key points:** hard-coded ids (`id="street"`) collide when the form renders twice; `Math.random()` or a counter breaks hydration; `useId` is tied to the component's position in the tree, so it's unique per instance and identical on server and client. Keys for lists still come from your data, never from `useId`.

## bb-nojsx | React without JSX | Beyond the roadmap | – | beyond

### Rewrite JSX with createElement @basic
Rewrite this component without JSX, using `createElement`. Then describe the object that `<Badge count={3} />` produces.

```jsx
function Notifications({ items }) {
  return (
    <section className="panel">
      <h2>Inbox <Badge count={items.length} /></h2>
      <>
        {items.map(item => <p key={item.id}>{item.text}</p>)}
      </>
    </section>
  );
}
```
-- answer --
```jsx
import { createElement, Fragment } from 'react';

function Notifications({ items }) {
  return createElement(
    'section',
    { className: 'panel' },
    createElement('h2', null, 'Inbox ', createElement(Badge, { count: items.length })),
    createElement(
      Fragment,
      null,
      items.map(item => createElement('p', { key: item.id }, item.text))
    )
  );
}
```

`<Badge count={3} />` produces a plain object, roughly:

```js
{
  $$typeof: Symbol.for('react.transitional.element'),   // React 19
  type: Badge,          // the component function itself
  key: null,
  props: { count: 3 },
}
```

**Key points:** strings mean DOM elements and function references mean components; extra arguments become `children`; arrays of children need keys; `key` goes in the props argument but is never passed to the component. The automatic JSX runtime calls `jsx()`/`jsxs()` from `react/jsx-runtime` instead, passing children inside props.

### Replace cloneElement with context @intermediate #legacy
This `RadioGroup` injects props into its children with `Children.map` and `cloneElement`. It breaks as soon as a `Radio` is wrapped in a `<div>` or a `Tooltip`. Refactor it so a `Radio` works at any depth.

```jsx
function RadioGroup({ name, value, onChange, children }) {
  return (
    <div role="radiogroup">
      {Children.map(children, child =>
        cloneElement(child, {
          name,
          checked: child.props.value === value,
          onChange: () => onChange(child.props.value),
        })
      )}
    </div>
  );
}

function Radio({ name, value, checked, onChange, children }) {
  return (
    <label>
      <input type="radio" name={name} value={value} checked={checked} onChange={onChange} />
      {children}
    </label>
  );
}
```
-- answer --
```jsx
import { createContext, useContext } from 'react';

const RadioGroupContext = createContext(null);

export function RadioGroup({ name, value, onChange, label, children }) {
  return (
    <RadioGroupContext value={{ name, value, onChange }}>
      <div role="radiogroup" aria-label={label}>{children}</div>
    </RadioGroupContext>
  );
}

export function Radio({ value, children }) {
  const group = useContext(RadioGroupContext);
  if (!group) throw new Error('<Radio> must be used inside <RadioGroup>');

  return (
    <label>
      <input
        type="radio"
        name={group.name}
        value={value}
        checked={group.value === value}
        onChange={() => group.onChange(value)}
      />
      {children}
    </label>
  );
}

// Nesting now works
<RadioGroup name="plan" label="Plan" value={plan} onChange={setPlan}>
  <div className="row">
    <Radio value="free">Free</Radio>
    <Tooltip text="Best value">
      <Radio value="pro">Pro</Radio>
    </Tooltip>
  </div>
</RadioGroup>
```

**Key points:** context reaches any depth, so wrappers don't matter; `Radio`'s props are now its real API instead of values injected behind the caller's back; the explicit error makes misuse obvious. This is the compound components pattern.

## bb-profiler | The Profiler API | Beyond the roadmap | – | beyond

### Log slow renders with Profiler @intermediate
Wrap the dashboard's product table in a `<Profiler>` that:

- Logs any commit slower than 16 ms with its phase and duration.
- Counts how many times the table rendered, and how many of those were slow, so you can compare before and after enabling the React Compiler.
- Lets you read the numbers from the browser console in development.
-- answer --
```jsx
import { Profiler } from 'react';

const stats = new Map();   // id → { renders, slow, worst }

function onRender(id, phase, actualDuration, baseDuration) {
  const s = stats.get(id) ?? { renders: 0, slow: 0, worst: 0 };
  s.renders += 1;
  s.worst = Math.max(s.worst, actualDuration);

  if (actualDuration > 16) {
    s.slow += 1;
    console.warn(
      `[perf] ${id} ${phase}: ${actualDuration.toFixed(1)} ms ` +
      `(without memoization ≈ ${baseDuration.toFixed(1)} ms)`
    );
  }
  stats.set(id, s);
}

if (import.meta.env.DEV) {
  window.__renderStats = () => console.table(Object.fromEntries(stats));
}

export function Measured({ id, children }) {
  return (
    <Profiler id={id} onRender={onRender}>
      {children}
    </Profiler>
  );
}

// In the dashboard
<Measured id="ProductTable">
  <ProductTable rows={rows} />
</Measured>

// In the browser console, after interacting: __renderStats()
```

**Key points**

- `onRender` runs after every commit of that subtree, so keep it cheap: no network calls inside it. Batch reports if you send them anywhere.
- A big gap between `actualDuration` and `baseDuration` means memoization is working; nearly equal values mean the whole subtree re-renders every time.
- Production builds disable profiling unless you opt into React's profiling build, so this costs nothing for users by default.

## bb-patterns | Component patterns | Beyond the roadmap | – | beyond

### Compound Tabs component with keyboard support @advanced
Build an accessible compound `Tabs` component used like this:

```jsx
<Tabs defaultValue="account">
  <Tabs.List aria-label="Settings">
    <Tabs.Trigger value="account">Account</Tabs.Trigger>
    <Tabs.Trigger value="billing">Billing</Tabs.Trigger>
  </Tabs.List>
  <Tabs.Panel value="account">Account settings…</Tabs.Panel>
  <Tabs.Panel value="billing">Billing settings…</Tabs.Panel>
</Tabs>
```

- It works uncontrolled (`defaultValue`) and controlled (`value` + `onValueChange`).
- Tabs and panels have the right ARIA roles, linked with SSR-safe ids.
- Left and Right arrow keys move between tabs, and only the active tab is in the Tab order.
-- answer --
```jsx
import { createContext, useContext, useId, useState } from 'react';

const TabsContext = createContext(null);

function useTabs() {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error('Tabs parts must be used inside <Tabs>');
  return ctx;
}

export function Tabs({ value, defaultValue, onValueChange, children }) {
  const [internal, setInternal] = useState(defaultValue);
  const isControlled = value !== undefined;
  const active = isControlled ? value : internal;
  const baseId = useId();

  function select(next) {
    if (!isControlled) setInternal(next);
    onValueChange?.(next);
  }

  return (
    <TabsContext value={{ active, select, baseId }}>
      <div className="tabs">{children}</div>
    </TabsContext>
  );
}

function List({ children, ...props }) {
  function onKeyDown(e) {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    const tabs = [...e.currentTarget.querySelectorAll('[role="tab"]')];
    const i = tabs.indexOf(document.activeElement);
    const step = e.key === 'ArrowRight' ? 1 : tabs.length - 1;
    const next = tabs[(i + step) % tabs.length];
    next.focus();
    next.click();   // Selection follows focus
  }
  return (
    <div role="tablist" onKeyDown={onKeyDown} {...props}>
      {children}
    </div>
  );
}

function Trigger({ value, children }) {
  const { active, select, baseId } = useTabs();
  const selected = active === value;
  return (
    <button
      type="button"
      role="tab"
      id={`${baseId}-tab-${value}`}
      aria-selected={selected}
      aria-controls={`${baseId}-panel-${value}`}
      tabIndex={selected ? 0 : -1}
      onClick={() => select(value)}
    >
      {children}
    </button>
  );
}

function Panel({ value, children }) {
  const { active, baseId } = useTabs();
  return (
    <div
      role="tabpanel"
      id={`${baseId}-panel-${value}`}
      aria-labelledby={`${baseId}-tab-${value}`}
      hidden={active !== value}
      tabIndex={0}
    >
      {children}
    </div>
  );
}

Tabs.List = List;
Tabs.Trigger = Trigger;
Tabs.Panel = Panel;
```

**Key points**

- Context shares the active tab between parts that can sit at any depth: the compound pattern.
- The controlled/uncontrolled logic is the "controllable state" pattern from the theory section.
- `useId` gives each `Tabs` instance unique ids that match between server and client.
- "Roving tabindex": only the selected tab has `tabIndex={0}`, so Tab jumps from the tab list to the panel, and arrow keys move within the list.
- Panels stay mounted with `hidden`, so `aria-controls` always points at a real element and panel state survives switching.
- In production, shadcn/ui and Radix Tabs give you this plus Home/End keys and vertical orientation.
