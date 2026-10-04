@section beyond-technical

## tg-routing | Routing in practice | Week 4 | 11 | gap

### Refreshing /reports on the deployed app returns a 404. Why? @intermediate
The app works when you click around, but refreshing any page other than `/` on a static host (Vercel, Netlify, S3) shows the host's 404 page. Locally with `npm run dev` it works.
-- answer --
Client-side routes exist only in JavaScript. On refresh, the browser asks the **server** for `/reports`, and a static host has no file at that path. The Vite dev server falls back to `index.html` automatically, which is why it works locally.

Configure a fallback (rewrite) so every unknown path serves `index.html`; React Router then reads the URL and renders the right page.

For Vercel, add `vercel.json`:

```json
{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
```

For Netlify, add `public/_redirects`:

```text
/*    /index.html   200
```

- Real files (JS, CSS, images) are still served as files; the fallback applies when no file matches.
- Server-rendered frameworks (Next.js, React Router framework mode) handle routing on the server, so they don't need this.
- `HashRouter` (`/#/reports`) avoids the problem without server config, at the cost of uglier URLs.

### Why does `expenses.find(e => e.id === id)` never find the expense? @basic
```jsx
// Route: /expenses/:id      Data: [{ id: 42, title: 'Train pass' }, ...]
function ExpenseDetail({ expenses }) {
  const { id } = useParams();
  const expense = expenses.find(e => e.id === id);
  if (!expense) return <p>Expense not found.</p>;
  return <h1>{expense.title}</h1>;
}
```
-- answer --
URL params are always **strings** (`"42"`), while the data uses numbers (`42`), so strict equality never matches. Convert explicitly, and validate, because anyone can type anything into the URL:

```jsx
const { id } = useParams();
const expenseId = Number(id);
if (!Number.isInteger(expenseId)) return <p>Invalid expense id.</p>;

const expense = expenses.find(e => e.id === expenseId);
```

With TypeScript, `useParams()` types each param as `string | undefined`, which makes this bug visible at compile time. Parsing with Zod (`z.coerce.number().int().positive()`) gives you a typed, validated id in one step.

### Why does this redirect cause a warning, or even a loop? @intermediate
```jsx
function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    navigate('/login');
    return null;
  }
  return <h1>Hi {user.name}</h1>;
}
```
-- answer --
`navigate()` is a side effect, and here it runs **during render**. React Router warns that `navigate()` should be called in an effect, not while the component is first rendering, and depending on the setup it can trigger repeated renders. Rendering must stay pure.

Return the declarative redirect instead, which React Router handles at the right moment:

```jsx
function Dashboard() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <h1>Hi {user.name}</h1>;
}
```

Call `navigate()` only from event handlers (after a form submit) or effects. Better still, guard every private page in one place with a `RequireAuth` layout route.

### After logging in, the Back button returns to the login page. How do you fix it? @basic
A logged-out user opens `/reports`, gets redirected to `/login`, signs in, and is sent back to `/reports`. Pressing **Back** shows the login page again.
-- answer --
Both redirects **pushed** new history entries, so history reads `… → /reports → /login → /reports`, and Back lands on `/login`. Redirects should **replace** the current entry instead:

```jsx
// In the guard
<Navigate to="/login" replace state={{ from: location }} />

// After a successful login
navigate(from, { replace: true });
```

Now history reads `… → /reports`, and Back goes to wherever the user was before. Rule of thumb: redirects replace; navigation the user chose pushes.

### Clicking a nav item reloads the whole app and empties the cart. Why? @basic
```jsx
<nav>
  <a href="/products">Products</a>
  <a href="/cart">Cart</a>
</nav>
```
-- answer --
A plain `<a href>` makes the browser do a **full page load**: it re-downloads the app, and everything in memory is lost, including React state, a Zustand store without `persist`, and the TanStack Query cache.

Use the router's `Link` (or `NavLink` for active styling). It updates the URL through the History API and renders the new route without a reload:

```jsx
import { NavLink } from 'react-router';

<nav>
  <NavLink to="/products">Products</NavLink>
  <NavLink to="/cart">Cart</NavLink>
</nav>
```

Keep `<a>` for external sites and file downloads. When navigating from code, use `useNavigate`, never `window.location.href = '/cart'`.

## tg-styling | Styling in practice | Week 5 | 14 | gap

### Why doesn't a class like `bg-${color}-500` work in Tailwind? @intermediate
```jsx
function Badge({ color, children }) {
  return <span className={`bg-${color}-500 rounded px-2 text-white`}>{children}</span>;
}

<Badge color="red">Overdue</Badge>   // No background colour appears
```
-- answer --
Tailwind generates CSS by scanning your source files for **complete class names written as plain text**. It never runs your code, so it never sees `bg-red-500`, only the fragments `bg-` and `-500`. No CSS is generated for that class.

Map props to complete class strings that appear in the source:

```jsx
const badgeColors = {
  red: 'bg-red-500 text-white',
  green: 'bg-green-600 text-white',
  gray: 'bg-zinc-200 text-zinc-800',
};

function Badge({ color = 'gray', children }) {
  return <span className={`rounded px-2 ${badgeColors[color]}`}>{children}</span>;
}
```

For truly dynamic values, such as a colour a user picks, use a CSS variable: `style={{ '--badge': user.color }}` with the class `bg-(--badge)` in Tailwind v4. Safelisting classes in config is a last resort.

### A caller's className doesn't override your component's padding. Why? @intermediate
```jsx
function Card({ className = '', children }) {
  return <div className={`rounded-lg border p-6 ${className}`}>{children}</div>;
}

<Card className="p-2">Compact card</Card>   // Still has the large padding
```
-- answer --
The element ends up with **both** `p-6` and `p-2`. When two classes set the same property, the one that comes later **in the generated stylesheet** wins. Their order in the `class` attribute doesn't matter. The caller's `p-2` only wins if Tailwind happened to emit it later, which you don't control.

Merge classes with `tailwind-merge` (the `cn` helper), which removes earlier conflicting classes so the last one in your list wins:

```jsx
import { cn } from '@/lib/utils';   // twMerge(clsx(...))

function Card({ className, children }) {
  return <div className={cn('rounded-lg border p-6', className)}>{children}</div>;
}

// <Card className="p-2"> renders class="rounded-lg border p-2"
```

That's why every shadcn/ui component passes `className` through `cn(...)`.

### Dark mode flashes light on page load. Why, and how do you fix it? @advanced
Your theme toggle saves `'dark'` to `localStorage`, and a `useEffect` adds the `dark` class to `<html>`. Users who chose dark mode see a white flash on every page load.
-- answer --
The browser paints the HTML (server-rendered, or the initial shell) **before** React runs your effect. Until the effect adds `class="dark"`, the light styles apply, so the wrong theme flashes.

Decide the theme **before the first paint** with a tiny blocking script in `<head>`, then let React take over:

```html
<script>
  try {
    const saved = localStorage.getItem('theme');
    const dark = saved === 'dark' ||
      (!saved && matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.classList.toggle('dark', dark);
  } catch (e) {}
</script>
```

- In Next.js, the `next-themes` package injects this script for you. Add `suppressHydrationWarning` to `<html>`, because the class the script sets won't match the server HTML.
- Also set the CSS `color-scheme` property, so form controls and scrollbars match the theme.
- Alternatively, store the theme in a cookie and render the right class on the server.

## tg-legacy | Legacy code in practice | Skip list | – | gap

### Why is `this` undefined in this class component's click handler? @basic #legacy
```jsx
class Counter extends React.Component {
  state = { count: 0 };

  increment() {
    this.setState({ count: this.state.count + 1 });
  }

  render() {
    return <button onClick={this.increment}>{this.state.count}</button>;
  }
}
// Click: TypeError: Cannot read properties of undefined (reading 'setState')
```
-- answer --
`onClick={this.increment}` passes the method as a plain function. When React calls it later, it isn't called as `this.increment()`, so `this` is `undefined` (class bodies always run in strict mode).

Two standard fixes:

```jsx
// 1. Class field with an arrow function (most common in legacy code)
increment = () => {
  this.setState(prev => ({ count: prev.count + 1 }));
};

// 2. Bind once in the constructor
constructor(props) {
  super(props);
  this.state = { count: 0 };
  this.increment = this.increment.bind(this);
}
```

Note the updater form `prev => ...`: class `setState` is batched too, so reading `this.state` has the same stale-value problem as reading state in hooks. Function components avoid `this` entirely, one reason hooks replaced classes.

### What's wrong with this `componentDidUpdate`? @intermediate #legacy
```jsx
class OrderList extends React.Component {
  state = { orders: [] };

  componentDidMount() {
    this.load();
  }

  componentDidUpdate() {
    this.load();
  }

  async load() {
    const orders = await api.getOrders(this.props.customerId);
    this.setState({ orders });
  }

  render() {
    return <ul>{this.state.orders.map(o => <li key={o.id}>{o.total}</li>)}</ul>;
  }
}
```
-- answer --
`componentDidUpdate` runs after **every** update, including the one caused by `this.setState({ orders })`. So the cycle is load → setState → update → load → … an endless stream of requests and renders.

Compare props first:

```jsx
componentDidUpdate(prevProps) {
  if (prevProps.customerId !== this.props.customerId) {
    this.load();
  }
}
```

This is the class version of a missing dependency array. The hooks equivalent is `useEffect(() => { ... }, [customerId])`, and with hooks you'd also add cleanup so a slow response for an old customer can't overwrite the new one.

### You inherit a React 18 app with class components and classic Redux. How do you modernize it safely? @advanced #legacy
-- answer --
Incrementally, with tests as a safety net. Never a big-bang rewrite.

1. **Protect behaviour first.** Add React Testing Library tests around the most important user flows. They test behaviour, so they survive refactors.
2. **Upgrade React in two steps.** Move to React 18.3, which warns about everything React 19 removes. Fix the warnings (string refs, legacy context, `defaultProps` on function components), then upgrade to 19 with the official codemods.
3. **Make all new code modern.** Function components, hooks and TypeScript. Convert class components when you touch them for a feature or bug, starting with leaf components.
4. **Move Redux to Redux Toolkit.** `configureStore` accepts your existing reducers, new state goes in `createSlice`, and `connect` gives way to `useSelector`/`useDispatch` as components are converted.
5. **Pull server data out of Redux.** Move API caching to TanStack Query (or RTK Query if the team wants to stay in Redux). This usually deletes a lot of reducer and thunk code.
6. **Ship in small pull requests.** Keep CI green, and watch bundle size and error rates after each step.

> **Interview tip:** Mention the order: tests first, then upgrades, then gradual conversion. It shows you can change a production codebase without breaking it.
