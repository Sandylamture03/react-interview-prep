export const topicOptions = [
  'All topics',
  'Components & JSX',
  'State & forms',
  'Hooks & effects',
  'Context & custom hooks',
  'TypeScript & routing',
  'Data & state tools',
  'Testing & performance',
  'React 19 & Next',
];

export const theoryQuestions = [
  {
    id: 'component',
    number: '01',
    topic: 'Components & JSX',
    question: 'What is a React component?',
    answer:
      'A component is a reusable unit of UI. In modern React it is usually a function that receives props and returns JSX. Rendering should be a pure calculation: the same props, state, and context should produce the same UI. A component can compose other components, read state, and attach event handlers, but it should not perform side effects while React is rendering it.',
    example: `function Greeting({ name }) {
  return <h2>Hello, {name}!</h2>;
}

<Greeting name="Mina" />`,
  },
  {
    id: 'jsx-rules',
    number: '02',
    topic: 'Components & JSX',
    question: 'What JSX rules should you know for an interview?',
    answer:
      'JSX must return one root element or a Fragment, uses className instead of class, places JavaScript expressions inside curly braces, and requires explicit closing or self-closing tags. JSX is syntax that React transforms into element descriptions; it is not HTML text copied into the DOM.',
    example: `function Card({ title, children }) {
  return (
    <section className="card">
      <h2>{title}</h2>
      {children}
    </section>
  );
}`,
  },
  {
    id: 'props-state',
    number: '03',
    topic: 'Components & JSX',
    question: 'How are props different from state?',
    answer:
      'Props are read-only inputs owned by the parent and passed down to a child. State is data owned by a component and changed through a state setter or reducer. Both are inputs to rendering, but a component must not mutate either one directly. If a child needs to request a change, the parent passes a callback prop.',
    example: `function Toggle({ enabled, onChange }) {
  return (
    <button onClick={() => onChange(!enabled)}>
      {enabled ? 'On' : 'Off'}
    </button>
  );
}`,
  },
  {
    id: 'children',
    number: '04',
    topic: 'Components & JSX',
    question: 'What is the children prop and when is it useful?',
    answer:
      'children is the JSX nested between a component’s opening and closing tags. It lets layout components provide a reusable shell without knowing the content they wrap. Treat it as data: render it where the layout needs it and avoid cloning or mutating it unless there is a specific composition reason.',
    example: `function PageShell({ children }) {
  return (
    <main className="shell">
      <header>React Interview Lab</header>
      {children}
    </main>
  );
}`,
  },
  {
    id: 'keys',
    number: '05',
    topic: 'Components & JSX',
    question: 'Why are stable keys important when rendering lists?',
    answer:
      'A key gives React stable identity for each item so it can match items between renders. Use a domain id, not the array index, when a list can be reordered, inserted into, or deleted from. Index keys can make local component state or DOM state appear to move to the wrong item. An index is only relatively safe for a truly static, append-only list.',
    example: `products.map(product => (
  <ProductCard key={product.id} product={product} />
))`,
  },
  {
    id: 'conditional',
    number: '06',
    topic: 'Components & JSX',
    question: 'How do you conditionally render UI in React?',
    answer:
      'Use an early return for whole-screen states, a ternary for one of two branches, and && when a block is shown only when a condition is truthy. Be careful with numeric values: count && <p> can render 0, so use count > 0 or a ternary when zero should render nothing.',
    example: `if (status === 'loading') return <Spinner />;

return items.length === 0
  ? <EmptyState />
  : <ItemList items={items} />;`,
  },
  {
    id: 'purity',
    number: '07',
    topic: 'Components & JSX',
    question: 'What does it mean for a component to be pure?',
    answer:
      'A pure component performs no observable side effect during render. It calculates JSX from its current inputs and leaves timers, subscriptions, DOM calls, network work, and other external synchronization to event handlers or effects. Purity makes rendering predictable and allows React to start, pause, or repeat render work safely.',
    example: `// Good: derive during render
const visibleItems = items.filter(item => item.active);

// Not during render: fetch(), setTimeout(), or element.focus()`,
  },
  {
    id: 'render-commit',
    number: '08',
    topic: 'Components & JSX',
    question: 'What is the difference between render and commit?',
    answer:
      'During render, React calls components to calculate the next UI description. During commit, React applies the necessary changes to the host environment such as the DOM. Effects run after the commit. This mental model explains why render code must stay pure and why DOM measurement belongs in an effect or a layout effect rather than in the component body.',
    example: `function Status({ online }) {
  // Render phase: calculate JSX only.
  return <span>{online ? 'Online' : 'Offline'}</span>;
}`,
  },
  {
    id: 'state-snapshot',
    number: '09',
    topic: 'State & forms',
    question: 'Why is state described as a snapshot per render?',
    answer:
      'Calling a state setter requests another render; it does not change the state variable already captured by the current render or event handler. Every render receives its own snapshot. This is why a log immediately after setState prints the old value and why several replacement-style updates can read the same value.',
    example: `function Counter() {
  const [count, setCount] = useState(0);

  function addThree() {
    setCount(count + 1);
    setCount(count + 1);
    setCount(count + 1);
  }
}`,
  },
  {
    id: 'updater',
    number: '10',
    topic: 'State & forms',
    question: 'When should you use the functional state updater?',
    answer:
      'Use the updater form when the next value depends on the previous value, especially when multiple updates may be batched or when an asynchronous callback can outlive the render that created it. React queues the functions and applies them in order to the latest state.',
    example: `function addThree() {
  setCount(current => current + 1);
  setCount(current => current + 1);
  setCount(current => current + 1);
}
// Result: +3`,
  },
  {
    id: 'batching',
    number: '11',
    topic: 'State & forms',
    question: 'What is batching and why does it matter?',
    answer:
      'React can group multiple state updates from the same turn into one render. Batching reduces work, but it does not merge your JavaScript variables or make a state snapshot mutable. Use functional updaters for dependent changes and remember that the UI updates on the next render.',
    example: `function handleSave() {
  setStatus('saving');
  setError(null);
  // React can commit these updates together.
}`,
  },
  {
    id: 'immutable-object',
    number: '12',
    topic: 'State & forms',
    question: 'How do you update an object in state immutably?',
    answer:
      'Create a new object with the properties that changed and spread the previous object for the rest. Direct mutation keeps the same reference and can prevent React or memoized children from seeing a meaningful change. If nested data is updated, copy every object along the path that changes.',
    example: `setUser(previous => ({
  ...previous,
  profile: {
    ...previous.profile,
    name: nextName,
  },
}));`,
  },
  {
    id: 'immutable-array',
    number: '13',
    topic: 'State & forms',
    question: 'What are the common immutable array update patterns?',
    answer:
      'Add with a new array and spread, remove with filter, and update an item with map plus a copied item. Avoid push, splice, and direct assignment on the existing state array. A new array reference lets React detect that the state value changed.',
    example: `setItems(previous => [...previous, newItem]);
setItems(previous => previous.filter(item => item.id !== id));
setItems(previous => previous.map(item =>
  item.id === id ? { ...item, done: true } : item
));`,
  },
  {
    id: 'controlled-input',
    number: '14',
    topic: 'State & forms',
    question: 'What is a controlled input?',
    answer:
      'A controlled input gets its current value or checked state from React state, and its onChange handler writes the user’s next value back to that state. React is then the source of truth. Controlled inputs are useful for validation, conditional fields, and keeping sibling UI in sync.',
    example: `function SearchBox({ query, onQueryChange }) {
  return (
    <label>
      Search
      <input
        value={query}
        onChange={event => onQueryChange(event.target.value)}
      />
    </label>
  );
}`,
  },
  {
    id: 'lifting-state',
    number: '15',
    topic: 'State & forms',
    question: 'What does lifting state up mean?',
    answer:
      'Move shared state to the closest common parent of the components that need it. The parent owns the single source of truth and passes the current value plus callbacks down. Do not lift everything automatically: state that only one component needs should stay local.',
    example: `function FilterPanel() {
  const [category, setCategory] = useState('all');

  return (
    <>
      <CategorySelect value={category} onChange={setCategory} />
      <ProductList category={category} />
    </>
  );
}`,
  },
  {
    id: 'derive-dont-store',
    number: '16',
    topic: 'State & forms',
    question: 'What does “derive, don’t store” mean in React?',
    answer:
      'If a value can be calculated from props or existing state, compute it during render instead of storing a second copy in state. Duplicate state creates synchronization bugs and often adds an unnecessary effect. Store the source data, then derive filtered lists, totals, labels, and flags from it.',
    example: `const visibleExpenses = expenses.filter(expense =>
  expense.category === category
);
const total = visibleExpenses.reduce(
  (sum, expense) => sum + expense.amount,
  0,
);`,
  },
  {
    id: 'use-reducer',
    number: '17',
    topic: 'State & forms',
    question: 'When is useReducer a better fit than several useState calls?',
    answer:
      'useReducer is useful when multiple values change together, transitions have meaningful names, or a state machine is easier to reason about than many setters. The reducer must be pure: it receives the current state and an action, then returns the next state without mutating the old state.',
    example: `function expenseReducer(state, action) {
  switch (action.type) {
    case 'added':
      return [...state, action.expense];
    case 'removed':
      return state.filter(item => item.id !== action.id);
    default:
      return state;
  }
}`,
  },
  {
    id: 'effect-purpose',
    number: '18',
    topic: 'Hooks & effects',
    question: 'What is useEffect for?',
    answer:
      'An Effect synchronizes a component with an external system: a timer, subscription, browser API, imperative widget, or network process. It runs after React commits. The effect should describe how to connect, and its cleanup should describe how to disconnect or cancel that work.',
    example: `useEffect(() => {
  const connection = createConnection(roomId);
  connection.connect();
  return () => connection.disconnect();
}, [roomId]);`,
  },
  {
    id: 'effect-wrong-tool',
    number: '19',
    topic: 'Hooks & effects',
    question: 'When is an Effect the wrong tool?',
    answer:
      'Do not use an Effect just to transform props/state into derived data or to respond to a click that can be handled directly in the event handler. Effects add another render path and can create stale or duplicated state. Compute derived values during render and put event-specific business logic in the event handler.',
    example: `// Avoid: effect that copies filtered items into state
const visible = items.filter(matchesQuery);

// Avoid: effect for a button action
function handleDelete() {
  deleteItem(id);
}`,
  },
  {
    id: 'dependencies',
    number: '20',
    topic: 'Hooks & effects',
    question: 'How should you reason about an Effect dependency array?',
    answer:
      'Dependencies are the reactive values the effect reads from the component scope. When one changes, React cleans up the old synchronization and runs the setup again. Include the values the effect actually uses; do not silence the hooks linter just to hide a dependency bug. If a dependency causes unwanted work, restructure the code rather than lying about it.',
    example: `useEffect(() => {
  document.title = query ? 'Results' : 'Search';
}, [query]);`,
  },
  {
    id: 'cleanup-strict',
    number: '21',
    topic: 'Hooks & effects',
    question: 'Why does Strict Mode appear to run Effects twice?',
    answer:
      'In development, Strict Mode performs an extra setup and cleanup cycle to expose missing cleanup logic. It is a stress test, not a production guarantee that every effect runs twice. A correct effect should be safe to connect, disconnect, and reconnect; timers should be cleared and subscriptions unsubscribed.',
    example: `useEffect(() => {
  const id = setInterval(refresh, 30_000);
  return () => clearInterval(id);
}, [refresh]);`,
  },
  {
    id: 'abort-request',
    number: '22',
    topic: 'Hooks & effects',
    question: 'How do you prevent stale fetch results from updating the UI?',
    answer:
      'Create an AbortController inside the effect, pass its signal to fetch, and abort it in cleanup when the query changes or the component unmounts. Handle AbortError separately from real failures. AbortController cancels fetch; for other asynchronous work, also guard against applying a result that no longer matches the latest request.',
    example: `useEffect(() => {
  const controller = new AbortController();

  fetch('/api/weather?q=' + query, { signal: controller.signal })
    .then(response => response.json())
    .then(setWeather)
    .catch(error => {
      if (error.name !== 'AbortError') setError(error);
    });

  return () => controller.abort();
}, [query]);`,
  },
  {
    id: 'use-ref',
    number: '23',
    topic: 'Context & custom hooks',
    question: 'What does useRef provide?',
    answer:
      'useRef returns a stable object with a mutable current property. Updating current does not trigger a render, so refs are good for focusing a DOM node, storing a timer id, or remembering a value that should not drive the UI. If a change should be visible, it belongs in state instead.',
    example: `function SearchInput() {
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return <input ref={inputRef} aria-label="Search" />;
}`,
  },
  {
    id: 'custom-hook',
    number: '24',
    topic: 'Context & custom hooks',
    question: 'What is a custom hook?',
    answer:
      'A custom hook is a function whose name starts with use and that composes built-in or other custom hooks into reusable behavior. Each call gets its own state; the hook shares logic, not one shared state instance. A good hook exposes a small domain-focused API such as useDebounce(value, delay).',
    example: `function useDebounce(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);

  return debounced;
}`,
  },
  {
    id: 'hooks-rules',
    number: '25',
    topic: 'Context & custom hooks',
    question: 'What are the Rules of Hooks?',
    answer:
      'Call hooks only at the top level of a function component or custom hook—not inside loops, conditions, nested functions, or event handlers. Call them only from React components or custom hooks. Stable call order lets React associate each hook call with the correct state slot across renders.',
    example: `function Panel({ enabled }) {
  const [open, setOpen] = useState(false); // top level

  // Do not put useEffect inside: if (enabled) { ... }
  return <button onClick={() => setOpen(!open)}>Toggle</button>;
}`,
  },
  {
    id: 'context',
    number: '26',
    topic: 'Context & custom hooks',
    question: 'When should you use Context?',
    answer:
      'Context is useful for values many components need, such as a theme, locale, or signed-in user, without threading props through every layer. It is not automatically a state-management replacement: consumers re-render when the provided value changes, so keep contexts focused and stabilize or split provider values when profiling shows a problem.',
    example: `const ThemeContext = createContext('light');

function App() {
  const [theme, setTheme] = useState('dark');
  return (
    <ThemeContext value={theme}>
      <Toolbar onToggle={() => setTheme('light')} />
    </ThemeContext>
  );
}`,
  },
  {
    id: 'typescript-react',
    number: '27',
    topic: 'TypeScript & routing',
    question: 'What should you type in a React component?',
    answer:
      'Type component props, event handlers, refs, Context values, and API responses. Prefer explicit unions for finite UI states and React.ReactNode for renderable children. Types protect the component contract at compile time, but they do not validate data arriving from a server at runtime.',
    example: `type SearchProps = {
  value: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
};

const inputRef = useRef<HTMLInputElement>(null);`,
  },
  {
    id: 'discriminated-state',
    number: '28',
    topic: 'TypeScript & routing',
    question: 'Why use discriminated unions for UI state?',
    answer:
      'A discriminated union models mutually exclusive states so impossible combinations are rejected. Instead of allowing loading and error to both be present accidentally, use a status field and narrow the data associated with that status. This makes render branches explicit and safer to refactor.',
    example: `type LoadState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; items: Item[] }
  | { status: 'error'; message: string };`,
  },
  {
    id: 'router-primitives',
    number: '29',
    topic: 'TypeScript & routing',
    question: 'What are the React Router primitives you should know?',
    answer:
      'Declarative routing uses BrowserRouter, Routes, Route, Link or NavLink, and Outlet for nested layouts. useParams reads dynamic segments, useNavigate performs an imperative navigation after a user action, and useSearchParams keeps filters or pagination in the URL. Choose the mode that matches the app, but be able to explain the core URL-to-component flow.',
    example: `<Routes>
  <Route element={<AppLayout />}>
    <Route path="/expenses" element={<Expenses />} />
    <Route path="/expenses/:id" element={<ExpenseDetails />} />
  </Route>
</Routes>

function AppLayout() {
  return <><Nav /><Outlet /></>;
}`,
  },
  {
    id: 'url-state',
    number: '30',
    topic: 'TypeScript & routing',
    question: 'When should filters live in the URL?',
    answer:
      'Put search, filter, sort, and page state in the URL when it should survive refresh, be shareable, or participate in browser back/forward navigation. Keep transient UI state such as a closed dialog local. useSearchParams provides a bridge between the URL and the rendered list.',
    example: `function Results() {
  const [params, setParams] = useSearchParams();
  const query = params.get('q') ?? '';

  function updateQuery(value) {
    setParams(value ? { q: value } : {});
  }
}`,
  },
  {
    id: 'protected-route',
    number: '31',
    topic: 'TypeScript & routing',
    question: 'How should you explain a protected route?',
    answer:
      'A protected-route wrapper checks client-visible auth state and redirects unauthenticated users, often with Navigate. It improves navigation UX but is not authorization or security. The server/API must still validate the session and permissions before returning or changing protected data.',
    example: `function ProtectedRoute({ children }) {
  const user = useAuth();
  return user ? children : <Navigate to="/login" replace />;
}`,
  },
  {
    id: 'server-client-state',
    number: '32',
    topic: 'Data & state tools',
    question: 'How is server state different from client state?',
    answer:
      'Server state lives remotely, is asynchronous, can become stale, and may be shared by multiple screens. Client state is UI-owned data such as an open sidebar, selected tab, or view preference. Treating server data like local state leads to manual loading flags, refetch logic, and cache bugs; use a server-state tool for the former and a local/context/store solution for the latter.',
    example: `// Server state: fetched, cached, and invalidated
const products = useQuery({ queryKey: ['products'], queryFn: fetchProducts });

// Client state: local UI preference
const [isSidebarOpen, setSidebarOpen] = useState(true);`,
  },
  {
    id: 'tanstack-query',
    number: '33',
    topic: 'Data & state tools',
    question: 'What problem does TanStack Query solve?',
    answer:
      'TanStack Query coordinates remote data fetching, caching, stale/loading/error state, refetching, mutations, and cache updates. A query key identifies a particular result, while staleTime controls freshness. Mutations usually invalidate or update the relevant query after the server responds instead of manually copying fetch logic into every component.',
    example: `const query = useQuery({
  queryKey: ['products', { page, search }],
  queryFn: () => getProducts({ page, search }),
  staleTime: 30_000,
});`,
  },
  {
    id: 'optimistic-update',
    number: '34',
    topic: 'Data & state tools',
    question: 'How would you implement an optimistic update?',
    answer:
      'Update the cached UI before the server confirms, but keep a snapshot of the previous value. If the mutation fails, restore the snapshot and show an error. On success or settlement, invalidate or reconcile the query so the cache agrees with the server. Optimism improves perceived speed but must include rollback behavior.',
    example: `const mutation = useMutation({
  mutationFn: updateProduct,
  onMutate: async nextProduct => {
    await queryClient.cancelQueries({ queryKey: ['products'] });
    const previous = queryClient.getQueryData(['products']);
    queryClient.setQueryData(['products'], current =>
      current.map(item => item.id === nextProduct.id
        ? { ...item, ...nextProduct }
        : item
      )
    );
    return { previous };
  },
  onError: (_error, _next, context) => {
    queryClient.setQueryData(['products'], context.previous);
  },
  onSettled: () => queryClient.invalidateQueries({ queryKey: ['products'] }),
});`,
  },
  {
    id: 'rhf-zod',
    number: '35',
    topic: 'Data & state tools',
    question: 'How do React Hook Form and Zod work together?',
    answer:
      'React Hook Form manages registration, submission, touched/dirty state, and field errors with minimal re-rendering. Zod defines the runtime schema, and zodResolver connects it to the form. z.infer<typeof schema> derives the TypeScript type, but the server must validate again because client validation and types are not a security boundary.',
    example: `const schema = z.object({
  name: z.string().min(1, 'Name is required'),
});

const form = useForm({ resolver: zodResolver(schema) });
const onSubmit = data => saveProduct(data);`,
  },
  {
    id: 'zustand',
    number: '36',
    topic: 'Data & state tools',
    question: 'When is Zustand a good fit?',
    answer:
      'Zustand is a small client-state store for cross-component UI data such as sidebar preferences, a cart, or a multi-step wizard. Read state through selectors so a component subscribes only to the slice it needs. Do not use it as a replacement for a server cache or for every piece of local state.',
    example: `const useUiStore = create(set => ({
  sidebarOpen: true,
  toggleSidebar: () => set(state => ({
    sidebarOpen: !state.sidebarOpen,
  })),
}));

const sidebarOpen = useUiStore(state => state.sidebarOpen);`,
  },
  {
    id: 'rtl',
    number: '37',
    topic: 'Testing & performance',
    question: 'How should React Testing Library tests query the UI?',
    answer:
      'Test behavior through the same affordances users have. Prefer getByRole with an accessible name and getByLabelText for form fields. Use user-event for interaction and findBy queries when the UI changes asynchronously. Avoid asserting implementation details such as component state or private callback calls.',
    example: `const saveButton = screen.getByRole('button', { name: /save/i });
await user.click(saveButton);
expect(await screen.findByText(/saved/i)).toBeInTheDocument();`,
  },
  {
    id: 'msw',
    number: '38',
    topic: 'Testing & performance',
    question: 'Why use MSW in React tests?',
    answer:
      'Mock Service Worker intercepts network requests at the boundary, so a component test exercises real loading, success, and error behavior without stubbing fetch inside the component. This keeps the test close to production behavior and makes failure states easy to reproduce.',
    example: `http.get('/api/products', () =>
  HttpResponse.json([{ id: 'p1', name: 'Keyboard' }])
);`,
  },
  {
    id: 'performance',
    number: '39',
    topic: 'Testing & performance',
    question: 'How do you investigate a slow React screen?',
    answer:
      'Profile first with React DevTools rather than adding memoization everywhere. Look for expensive calculations, broad Context updates, unstable props, large lists, and unnecessary remounts. Then use the smallest fix that the profile supports, such as route lazy loading with Suspense, a better state boundary, or targeted memoization. The React Compiler may automate some memoization, but it does not replace profiling or fundamentals.',
    example: `const Reports = lazy(() => import('./Reports.jsx'));

<Suspense fallback={<Spinner />}>
  <Reports />
</Suspense>`,
  },
  {
    id: 'error-boundary',
    number: '40',
    topic: 'Testing & performance',
    question: 'What does an error boundary catch—and what does it not catch?',
    answer:
      'An error boundary catches rendering errors in its descendant tree and shows fallback UI instead of blanking the entire app. It does not automatically catch errors in event handlers, arbitrary asynchronous callbacks, or the boundary itself. Handle those explicitly and use route-level boundaries so one broken screen does not take down unrelated routes.',
    example: `function RouteFallback({ resetErrorBoundary }) {
  return (
    <button onClick={resetErrorBoundary}>
      Try this screen again
    </button>
  );
}`,
  },
  {
    id: 'react19-forms',
    number: '41',
    topic: 'React 19 & Next',
    question: 'What do useActionState, useFormStatus, and useOptimistic do?',
    answer:
      'useActionState connects a form action to result state and pending state. useFormStatus reads the status of a parent form and is typically used inside a submit button. useOptimistic lets the UI show an immediate optimistic value while an action is pending. Their server-action behavior depends on the framework integration; validate data on the server.',
    example: `const [result, formAction, pending] =
  useActionState(saveItem, { errors: {} });

<form action={formAction}>
  <input name="name" />
  <SubmitButton pending={pending} />
</form>`,
  },
  {
    id: 'server-components',
    number: '42',
    topic: 'React 19 & Next',
    question: 'What is a Server Component and when is use client needed?',
    answer:
      'In an RSC-enabled framework such as Next App Router, Server Components run on the server and can read server-side data directly. They cannot use client state, effects, event handlers, or browser APIs. Add use client to the smallest component that needs those capabilities and keep the rest of the tree on the server when possible.',
    example: `// app/products/page.tsx — server by default
export default async function ProductsPage() {
  const products = await getProducts();
  return <ProductList products={products} />;
}

// ProductFilter.tsx needs state or events:
'use client';`,
  },
];

export const codeExamples = [
  {
    id: 'catalogue',
    title: 'Product catalogue with empty states',
    lane: 'Components + JSX',
    difficulty: 'Core',
    prompt:
      'Render a responsive product grid with a Sale badge, an Out of stock state, and a reusable layout wrapper.',
    solution:
      'Split the page into Layout, ProductGrid, and ProductCard. Keep the product data in the parent, use the product id as the key, and make each visual state explicit. The card never mutates its product prop.',
    code: String.raw`const products = [
  { id: 'p1', name: 'Keyboard', price: 89, sale: true, stock: 4 },
  { id: 'p2', name: 'Monitor', price: 249, sale: false, stock: 0 },
];

function Layout({ children }) {
  return <main className="layout">{children}</main>;
}

function ProductCard({ product }) {
  return (
    <article className={product.stock === 0 ? 'card muted' : 'card'}>
      <div className="card-heading">
        <h2>{product.name}</h2>
        {product.sale && <span className="badge">Sale</span>}
      </div>
      <p>{'$'}{product.price}</p>
      {product.stock === 0
        ? <p role="status">Out of stock</p>
        : <button>Add to cart</button>}
    </article>
  );
}

function Catalogue() {
  return (
    <Layout>
      <section className="grid">
        {products.map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </section>
    </Layout>
  );
}`,
    interviewNotes: [
      'Stable id keys preserve item identity.',
      'Children makes Layout reusable.',
      'Empty, loading, and error branches belong in the list boundary.',
    ],
  },
  {
    id: 'state-updates',
    title: 'Immutable updates + derived totals',
    lane: 'State + forms',
    difficulty: 'Core',
    prompt:
      'Update an expense list without mutation and calculate the visible total without storing duplicate state.',
    solution:
      'Use functional updates when the next array depends on the previous one. Add, remove, and edit with new arrays. Filtered data and totals are derived during render, so there is no effect to synchronize a second total state.',
    code: String.raw`function Expenses({ category }) {
  const [expenses, setExpenses] = useState([]);

  function addExpense(expense) {
    setExpenses(previous => [...previous, expense]);
  }

  function removeExpense(id) {
    setExpenses(previous =>
      previous.filter(expense => expense.id !== id)
    );
  }

  function markPaid(id) {
    setExpenses(previous => previous.map(expense =>
      expense.id === id
        ? { ...expense, paid: true }
        : expense
    ));
  }

  const visible = expenses.filter(expense =>
    category === 'all' || expense.category === category
  );
  const total = visible.reduce((sum, expense) =>
    sum + expense.amount,
    0,
  );

  return <ExpenseList expenses={visible} total={total} />;
}`,
    interviewNotes: [
      'The updater form avoids stale snapshots.',
      'Never use push, splice, or direct property assignment on state.',
      'Derived data does not need its own state or effect.',
    ],
  },
  {
    id: 'expense-reducer',
    title: 'Expense tracker with useReducer',
    lane: 'State + forms',
    difficulty: 'Core',
    prompt:
      'Model add, edit, and delete transitions for an expense tracker whose related values change together.',
    solution:
      'Keep the reducer pure and make actions describe intent. The form dispatches an action; the reducer owns the immutable transition rules. Keep category filters and totals as derived values outside the reducer unless they are truly part of the state machine.',
    code: String.raw`function expenseReducer(state, action) {
  switch (action.type) {
    case 'added':
      return [...state, action.expense];
    case 'edited':
      return state.map(expense =>
        expense.id === action.expense.id
          ? { ...expense, ...action.expense }
          : expense
      );
    case 'deleted':
      return state.filter(expense => expense.id !== action.id);
    default:
      throw new Error('Unknown action: ' + action.type);
  }
}

function ExpenseTracker() {
  const [expenses, dispatch] = useReducer(expenseReducer, []);

  function handleSubmit(formData) {
    dispatch({
      type: 'added',
      expense: { ...formData, id: crypto.randomUUID() },
    });
  }

  return (
    <>
      <ExpenseForm onSubmit={handleSubmit} />
      <ExpenseList
        expenses={expenses}
        onDelete={id => dispatch({ type: 'deleted', id })}
      />
    </>
  );
}`,
    interviewNotes: [
      'Actions make correlated transitions easy to test.',
      'The reducer is a pure function and can be unit tested in isolation.',
      'Do not put server cache behavior in a local reducer.',
    ],
  },
  {
    id: 'controlled-form',
    title: 'Controlled form with lifting state',
    lane: 'Forms',
    difficulty: 'Core',
    prompt:
      'Build a search form whose input and filtered results share one source of truth.',
    solution:
      'The parent owns query because both the input and result list need it. The input is controlled, submit prevents the browser navigation, and the list receives the current value through props.',
    code: String.raw`function SearchPage({ products }) {
  const [query, setQuery] = useState('');

  const visibleProducts = products.filter(product =>
    product.name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <>
      <form onSubmit={event => event.preventDefault()}>
        <label htmlFor="product-search">Search products</label>
        <input
          id="product-search"
          value={query}
          onChange={event => setQuery(event.target.value)}
        />
      </form>
      <ProductList products={visibleProducts} />
    </>
  );
}`,
    interviewNotes: [
      'The closest common parent owns shared state.',
      'Derived filtering is calculated from query and products.',
      'The label makes the control accessible and testable by name.',
    ],
  },
  {
    id: 'debounced-weather',
    title: 'Debounced search with AbortController',
    lane: 'Effects + custom hooks',
    difficulty: 'Core',
    prompt:
      'Search a weather API without showing results for an older query when a user types quickly.',
    solution:
      'Debounce the input in a custom hook, put the debounced value in the effect dependencies, and abort the previous fetch during cleanup. Track loading, error, and data states explicitly. In a real app, move server-state caching to TanStack Query after understanding this raw pattern.',
    code: String.raw`function useDebounce(value, delay = 300) {
  const [result, setResult] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setResult(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return result;
}

function WeatherSearch() {
  const [query, setQuery] = useState('');
  const [state, setState] = useState({ status: 'idle' });
  const debouncedQuery = useDebounce(query);

  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setState({ status: 'idle' });
      return;
    }

    const controller = new AbortController();
    setState({ status: 'loading' });

    fetch('/api/weather?q=' + encodeURIComponent(debouncedQuery), {
      signal: controller.signal,
    })
      .then(response => {
        if (!response.ok) throw new Error('Request failed');
        return response.json();
      })
      .then(data => setState({ status: 'success', data }))
      .catch(error => {
        if (error.name !== 'AbortError') {
          setState({ status: 'error', message: error.message });
        }
      });

    return () => controller.abort();
  }, [debouncedQuery]);

  return <WeatherView query={query} onQueryChange={setQuery} state={state} />;
}`,
    interviewNotes: [
      'Cleanup prevents an obsolete fetch from winning the race.',
      'An empty query is a deliberate idle state, not an error.',
      'Effects synchronize with the network; derived UI does not need one.',
    ],
  },
  {
    id: 'router-protected',
    title: 'Nested routes + protected route',
    lane: 'Routing',
    difficulty: 'Professional',
    prompt:
      'Create a shared layout, a dynamic detail route, and a client-side redirect for a logged-out user.',
    solution:
      'Use an Outlet for the shared layout, useParams for the dynamic id, and Navigate for the client experience. Keep filters in search params when they need to survive refresh. Explain that real authorization still belongs on the server.',
    code: String.raw`function ProtectedRoute({ children }) {
  const user = useAuth();
  return user ? children : <Navigate to="/login" replace />;
}

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/expenses" element={<Expenses />} />
          <Route path="/expenses/:id" element={<ExpenseDetails />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

function DashboardLayout() {
  return <><Nav /><Outlet /></>;
}

function ExpenseDetails() {
  const { id } = useParams();
  return <Details id={id} />;
}`,
    interviewNotes: [
      'Nested layout code is rendered where Outlet appears.',
      'A route guard is a UX redirect, not an authorization boundary.',
      'A 404 route is part of the complete user flow.',
    ],
  },
  {
    id: 'tanstack-query-example',
    title: 'Query + mutation + invalidation',
    lane: 'Server state',
    difficulty: 'Professional',
    prompt:
      'Fetch a searchable product list and keep it correct after a mutation.',
    solution:
      'Make every result-affecting input part of the query key. Let TanStack Query own loading and error state, use a mutation for the write, and invalidate the matching key when the server responds. This avoids a manual useEffect fetch and a hand-rolled cache.',
    code: String.raw`function ProductTable({ search, page }) {
  const query = useQuery({
    queryKey: ['products', { search, page }],
    queryFn: () => getProducts({ search, page }),
    placeholderData: keepPreviousData,
  });

  const deleteProduct = useMutation({
    mutationFn: removeProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });

  if (query.isPending) return <Spinner />;
  if (query.isError) return <ErrorState />;

  return (
    <ProductRows
      products={query.data.items}
      onDelete={id => deleteProduct.mutate(id)}
    />
  );
}`,
    interviewNotes: [
      'The key includes both search and page because both change the result.',
      'Invalidation marks related data stale so it can reconcile with the server.',
      'placeholderData keeps the previous page visible while the next page loads.',
    ],
  },
  {
    id: 'rhf-zod-form',
    title: 'React Hook Form + Zod validation',
    lane: 'Forms at scale',
    difficulty: 'Professional',
    prompt:
      'Build a typed product form with field errors and one schema shared by the form and submit handler.',
    solution:
      'Define the Zod schema once, pass its resolver to useForm, and let register connect fields. The inferred type is useful to TypeScript, but parse the submitted data again on the server before saving.',
    code: String.raw`const productSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  price: z.coerce.number().positive('Use a positive price'),
});

function ProductForm({ onSave }) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(productSchema),
  });

  return (
    <form onSubmit={handleSubmit(onSave)} noValidate>
      <label>
        Name
        <input {...register('name')} />
      </label>
      {errors.name && <p role="alert">{errors.name.message}</p>}

      <label>
        Price
        <input type="number" {...register('price')} />
      </label>
      {errors.price && <p role="alert">{errors.price.message}</p>}

      <button disabled={isSubmitting}>Save product</button>
    </form>
  );
}`,
    interviewNotes: [
      'z.infer gives a compile-time type; it is not runtime validation by itself.',
      'Errors are rendered near the field and exposed to assistive technology.',
      'Server-side parsing is still required before a write.',
    ],
  },
  {
    id: 'rtl-msw',
    title: 'Behavior test with RTL + MSW',
    lane: 'Testing',
    difficulty: 'Professional',
    prompt:
      'Test that a product list renders server data and that a user-visible loading state resolves.',
    solution:
      'Mock the HTTP boundary with MSW, render the real screen, query by role, and wait with findBy for the asynchronous result. The test does not know or care which hook or component owns the request.',
    code: String.raw`server.use(
  http.get('/api/products', () =>
    HttpResponse.json([
      { id: 'p1', name: 'Keyboard' },
    ])
  )
);

render(<ProductPage />);

expect(screen.getByRole('status')).toHaveTextContent(/loading/i);
expect(await screen.findByRole('heading', { name: 'Keyboard' }))
  .toBeInTheDocument();

const deleteButton = screen.getByRole('button', {
  name: /delete keyboard/i,
});
await user.click(deleteButton);`,
    interviewNotes: [
      'Query by the user-visible role and name.',
      'findBy expresses an async UI transition without arbitrary sleeps.',
      'MSW lets success and failure handlers exercise the network boundary.',
    ],
  },
  {
    id: 'react19-action',
    title: 'React 19 form action state',
    lane: 'React 19 + framework APIs',
    difficulty: 'Modern',
    prompt:
      'Show pending state and field errors from a form action without hand-wiring a submit flag.',
    solution:
      'useActionState receives the action result and exposes a function for the form action. A submit button can use useFormStatus from inside the form subtree. Validate again on the server when the action crosses a trust boundary.',
    code: String.raw`async function saveProduct(previous, formData) {
  const result = productSchema.safeParse({
    name: formData.get('name'),
  });

  if (!result.success) {
    return { errors: result.error.flatten().fieldErrors };
  }

  await persistProduct(result.data);
  return { errors: {}, saved: true };
}

function ProductForm() {
  const [result, action] = useActionState(saveProduct, {
    errors: {},
  });

  return (
    <form action={action}>
      <input name="name" aria-describedby="name-error" />
      {result.errors.name && (
        <p id="name-error" role="alert">{result.errors.name}</p>
      )}
      <SubmitButton />
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return <button disabled={pending}>{pending ? 'Saving…' : 'Save'}</button>;
}`,
    interviewNotes: [
      'useFormStatus must be called by a component rendered inside the form.',
      'The action result is a useful place for field-level errors.',
      'The exact server-function wiring depends on the RSC framework.',
    ],
  },
];

export const technicalQuestions = [
  {
    id: 'counter-once',
    signal: 'State snapshots + functional updaters',
    question: 'Why does setCount(count + 1) three times often add only one?',
    answer:
      'All three calls read the same count snapshot from the current render, so they request the same replacement value. Use setCount(current => current + 1) three times when each update depends on the result of the previous one.',
    followUp: 'Explain batching without saying that state is mutated immediately.',
  },
  {
    id: 'index-key-review',
    signal: 'Identity + list reconciliation',
    question: 'A reviewer sees key={index}. What do you say?',
    answer:
      'Ask whether the list can reorder, insert, delete, or filter. If it can, use a stable domain id because index keys can make DOM or local component state follow the wrong item. An index is acceptable only for a truly static, append-only list where item identity never changes.',
    followUp: 'Give a concrete reorder example where an input value moves to a different row.',
  },
  {
    id: 'effect-derived-state',
    signal: 'Avoiding unnecessary Effects',
    question: 'How would you review an Effect that stores a filtered list in state?',
    answer:
      'Remove the duplicate state and derive the filtered list during render from the source items and filter. The effect creates an extra render and a synchronization path that can be temporarily stale. Use an Effect only if the code is synchronizing with something outside React.',
    followUp: 'When would you consider useMemo? Only after measuring an expensive calculation.',
  },
  {
    id: 'stale-search',
    signal: 'Debounce + cancellation',
    question: 'A fast typist sees results for an older search. How do you fix it?',
    answer:
      'Debounce the input, include the debounced query in the request effect or query key, and cancel the previous fetch with AbortController in cleanup. Handle AbortError separately. If the work is not cancellable, guard the result so only the latest request can update state; in a production app, prefer a server-state cache such as TanStack Query.',
    followUp: 'Mention loading, empty, and error states—not just the request call.',
  },
  {
    id: 'state-owner',
    signal: 'State ownership',
    question: 'Where should state live in a multi-panel form?',
    answer:
      'Keep state local to the smallest component that owns it. If two siblings need the same value, lift it to their closest common parent and pass data plus callbacks down. If many fields change through correlated transitions, use a reducer. Use Context or a client store only when prop drilling is a real boundary problem, not by default.',
    followUp: 'Separate UI state from server state before choosing a library.',
  },
  {
    id: 'context-zustand-query',
    signal: 'Choosing state tools',
    question: 'Context, Zustand, or TanStack Query: which one would you choose?',
    answer:
      'Use Context for broadly available, usually low-frequency values such as theme or the current user. Use Zustand for cross-component client/UI state with selector-based subscriptions. Use TanStack Query for remote server data, caching, staleness, refetching, and mutations. Local state is still the best choice when only one component needs the value.',
    followUp: 'Describe what would make you split a large Context into smaller contexts.',
  },
  {
    id: 'optimistic-edit',
    signal: 'Cache consistency + rollback',
    question: 'How would you implement an optimistic edit?',
    answer:
      'Snapshot the relevant cache, cancel conflicting work, update the cache immediately, and return the snapshot from the mutation setup. On error, restore the snapshot and show feedback. On success or settlement, invalidate or reconcile the query so the cache agrees with the server.',
    followUp: 'What happens if two optimistic edits overlap? Discuss ordering or server reconciliation.',
  },
  {
    id: 'async-form-test',
    signal: 'User behavior + network boundary',
    question: 'How would you test an asynchronous form?',
    answer:
      'Render the real form, query controls by accessible role or label, interact through user-event, assert validation errors, and use findBy or waitFor for the visible async result. Mock HTTP with MSW so the test covers loading, success, and failure without stubbing component internals.',
    followUp: 'Include one invalid submission and one successful mutation path.',
  },
  {
    id: 'rerender-investigation',
    signal: 'Measure before optimizing',
    question: 'A dashboard re-renders too much. What do you do first?',
    answer:
      'Profile the screen first. Inspect broad Context updates, unstable provider values, large parent state boundaries, expensive calculations, and list identity. Then apply the smallest measured fix: a narrower subscription, better state ownership, lazy route loading, or targeted memoization. Do not add useMemo or memo everywhere as a reflex.',
    followUp: 'Explain why a memoized child still renders when its Context value changes.',
  },
  {
    id: 'boundary-limits',
    signal: 'Failure isolation',
    question: 'When does an error boundary help?',
    answer:
      'It catches render errors in a descendant tree and can show a route-level fallback so one broken screen does not blank the app. It does not automatically catch event-handler errors, arbitrary async callback errors, or errors in the boundary itself; those need explicit handling.',
    followUp: 'Pair the boundary with loading, empty, and explicit request-error UI.',
  },
  {
    id: 'route-security',
    signal: 'Client UX vs authorization',
    question: 'Should a protected-route wrapper be considered security?',
    answer:
      'No. It improves client navigation by redirecting when there is no known user, but it can be bypassed. Server endpoints must authenticate the session and authorize every protected read or write. A UI guard should never be the only protection for sensitive data.',
    followUp: 'Explain the difference between hiding a link and enforcing permission.',
  },
  {
    id: 'use-client',
    signal: 'Server/client boundaries',
    question: 'Which component needs use client in Next App Router?',
    answer:
      'A component needs use client when it uses state, effects, event handlers, browser APIs, or a client-only dependency. Keep the boundary as low as practical so server components can continue to fetch server-side data and send only the interactive leaf to the client.',
    followUp: 'Mention that plain Vite React does not automatically provide Server Components.',
  },
  {
    id: 'action-state',
    signal: 'React 19 form primitives',
    question: 'How would you explain useActionState in one minute?',
    answer:
      'It connects a form action to state that represents the action result and pending lifecycle. The form receives the returned action function, and a component inside the form can read pending status with useFormStatus. Treat the server as the trust boundary: validate and authorize the submitted data there.',
    followUp: 'Contrast useActionState with local controlled input state.',
  },
  {
    id: 'compiler-hooks',
    signal: 'Modern performance trade-offs',
    question: 'Does the React Compiler make useMemo and useCallback obsolete?',
    answer:
      'The compiler can automate some memoization when its toolchain and code are supported, but it does not remove the need to understand referential identity, stale closures, or profiling. Explain the manual hooks for interviews, then say you would measure first and follow the project’s compiler configuration rather than sprinkling memoization everywhere.',
    followUp: 'Give an example where useCallback can still be needed for a non-compiled boundary.',
  },
  {
    id: 'version-guardrails',
    signal: 'Version-aware React judgment',
    question: 'How do you answer version-sensitive React questions safely?',
    answer:
      'Name the version or framework context before making a claim. The supplied roadmap targets React 19.3, React Compiler 1.0, React Router v8, and Next.js 16.3 as of September 2026. Call out that Context provider syntax, Server Components, form hooks, and routing modes depend on the installed version and toolchain; verify current official docs for production decisions.',
    followUp: 'Never present a framework feature as a plain React feature if it requires RSC tooling.',
  },
];
