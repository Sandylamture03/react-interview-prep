export const theory = [
  {
    id: 't0-components',
    level: 0,
    category: 'Mental model',
    question: 'What is a React component?',
    answer: 'A component is a reusable UI unit. In modern React it is usually a function that receives props and returns a description of what should appear. Keep rendering pure: given the same props, state, and context, it should calculate the same result.',
    code: `function Greeting({ name }) {
  return <h2>Hello, {name}!</h2>;
}`,
    signal: 'Say “composition” and “pure render,” not just “a function that returns HTML.”',
  },
  {
    id: 't0-props',
    level: 0,
    category: 'Mental model',
    question: 'How are props different from state?',
    answer: 'Props are read-only inputs owned by a parent. State is data owned by a component and changed through a setter or reducer. A child that needs a change asks its owner through a callback prop rather than mutating either value.',
    code: `function Toggle({ enabled, onChange }) {
  return (
    <button onClick={() => onChange(!enabled)}>
      {enabled ? 'On' : 'Off'}
    </button>
  );
}`,
    signal: 'The key phrase is “single source of truth”: put changing data with the component that owns the decision.',
  },
  {
    id: 't0-keys',
    level: 0,
    category: 'Lists',
    question: 'Why do list items need stable keys?',
    answer: 'A key gives each item identity across renders so React can match old and new items. Prefer a domain id. Array indexes become risky when a list can be reordered, inserted into, or deleted because local state and DOM state can appear attached to the wrong item.',
    code: `products.map(product => (
  <ProductCard key={product.id} product={product} />
))`,
    signal: 'Mention the exception: indexes are reasonable for a truly static, never-reordered list.',
  },
  {
    id: 't1-state',
    level: 1,
    category: 'State',
    question: 'Why does calling a state setter not immediately change the current variable?',
    answer: 'A setter requests another render; it does not mutate the snapshot used by the current render. React batches updates and then calls the component again with a fresh snapshot. Use a functional update when the next value depends on the previous one.',
    code: `setCount(count + 1); // schedules from this snapshot
setCount(previous => previous + 1); // safe for chained updates`,
    signal: 'Connect the behavior to snapshots and batching, not to a vague “async state” explanation.',
  },
  {
    id: 't1-derived',
    level: 1,
    category: 'State',
    question: 'When should a value be derived instead of stored?',
    answer: 'If a value can be calculated from props or existing state during render, derive it. Storing it creates two sources of truth and synchronization work. Only store information that cannot be reconstructed from the current inputs.',
    code: `const visibleProducts = products
  .filter(product => product.name.includes(query))
  .sort(byPrice);`,
    signal: 'A good follow-up is “what happens when the source changes?” Derived values cannot go stale independently.',
  },
  {
    id: 't1-controlled',
    level: 1,
    category: 'Forms',
    question: 'What makes an input controlled?',
    answer: 'React owns the input value: the element receives a value prop and reports changes through onChange. This makes validation, formatting, reset, and submission predictable. An uncontrolled input keeps its current value in the DOM and is read through a ref or FormData when needed.',
    code: `<input
  value={email}
  onChange={event => setEmail(event.target.value)}
  aria-invalid={Boolean(error)}
/>`,
    signal: 'Choose based on the form’s needs; controlled is not automatically better for every field.',
  },
  {
    id: 't2-effect',
    level: 2,
    category: 'Effects',
    question: 'What is an Effect actually for?',
    answer: 'An Effect synchronizes React with an external system: a network connection, browser API, timer, subscription, or non-React widget. It is not a general-purpose place to transform data or respond to a click. Those belong in render or the event handler respectively.',
    code: `useEffect(() => {
  const connection = connect(roomId);
  return () => connection.disconnect();
}, [roomId]);`,
    signal: 'Start by naming the external system. If there is none, the effect may not be needed.',
  },
  {
    id: 't2-stale',
    level: 2,
    category: 'Async',
    question: 'How do you avoid a stale response winning a search request?',
    answer: 'Track the request lifecycle and clean up the previous request when the query changes. AbortController is useful for fetch; the cleanup prevents an obsolete response from updating the current screen. Still represent loading, error, and empty states explicitly.',
    code: `useEffect(() => {
  const controller = new AbortController();
  fetch('/api/search?q=' + query, { signal: controller.signal });
  return () => controller.abort();
}, [query]);`,
    signal: 'Include the cancellation path and explain how an abort differs from a user-visible failure.',
  },
  {
    id: 't2-ref',
    level: 2,
    category: 'Hooks',
    question: 'When is useRef a better fit than useState?',
    answer: 'Use a ref for a mutable value that must survive renders but whose changes should not trigger a render, such as a DOM node, timer id, or previous value. Use state when the value affects what the user sees.',
    code: `const inputRef = useRef(null);

function focusInput() {
  inputRef.current?.focus();
}`,
    signal: 'The distinguishing test is whether a change should be visible in the next render.',
  },
  {
    id: 't3-context',
    level: 3,
    category: 'Architecture',
    question: 'What problem does Context solve, and what does it not solve?',
    answer: 'Context makes a value available to a subtree without threading it through every intermediate component. It is useful for stable cross-cutting concerns like theme or auth. It is not automatically a server-state cache, and changing a provider value can rerender all consumers that read it.',
    code: `const ThemeContext = createContext('light');

<ThemeContext.Provider value={theme}>
  <App />
</ThemeContext.Provider>`,
    signal: 'Discuss provider boundaries and value identity before proposing a global context for everything.',
  },
  {
    id: 't3-server',
    level: 3,
    category: 'Data ownership',
    question: 'How should server state differ from UI state?',
    answer: 'Server state is owned by a remote system and needs fetching, caching, synchronization, and invalidation. UI state is local intent such as an open menu or draft text. Keeping them separate avoids copying remote data into local state and inventing cache logic in components.',
    code: `const { data, isPending, error } = useQuery({
  queryKey: ['projects', teamId],
  queryFn: () => fetchProjects(teamId),
});`,
    signal: 'The important boundary is ownership and freshness, not the specific library name.',
  },
  {
    id: 't3-route',
    level: 3,
    category: 'Routing',
    question: 'What belongs in the URL?',
    answer: 'Put state in the URL when it should be shareable, bookmarkable, restorable on refresh, or meaningful to navigation: resource ids, tabs, filters, and pagination often qualify. Keep ephemeral interaction state local. Treat URL parsing as untrusted input and define defaults.',
    code: `const params = new URLSearchParams(location.search);
const page = Math.max(1, Number(params.get('page')) || 1);`,
    signal: 'Explain the user benefit of a URL state choice instead of using routing as a storage trick.',
  },
  {
    id: 't4-testing',
    level: 4,
    category: 'Quality',
    question: 'What makes a React test valuable?',
    answer: 'A valuable test exercises a user-visible behavior through the public interface: rendering, keyboard input, clicks, navigation, and accessible feedback. It should survive refactoring from one implementation to another. Mock only boundaries that would make the behavior test slow, flaky, or unavailable.',
    code: `await user.type(screen.getByRole('textbox'), 'react');
await user.click(screen.getByRole('button', { name: /search/i }));
expect(await screen.findByText(/results/i)).toBeVisible();`,
    signal: 'Say what a user can do and observe before naming a test utility.',
  },
  {
    id: 't4-performance',
    level: 4,
    category: 'Performance',
    question: 'How do you investigate a slow React screen?',
    answer: 'First reproduce the slowness and measure it with the browser profiler, React Profiler, or a performance mark. Identify whether the cost is rendering, JavaScript, network, layout, or too much work. Then change one hypothesis and measure again. Memoization is a targeted tool, not a default architecture.',
    code: `performance.mark('list-start');
renderList();
performance.mark('list-end');
performance.measure('list', 'list-start', 'list-end');`,
    signal: 'A senior answer includes a baseline, a hypothesis, and a before/after measurement.',
  },
  {
    id: 't4-a11y',
    level: 4,
    category: 'Accessibility',
    question: 'What should an accessible async UI communicate?',
    answer: 'Give controls an accessible name, expose loading and error states in a useful way, preserve keyboard focus where navigation changes context, and make status updates available without forcing a screen-reader user to hunt. Start with semantic HTML before adding ARIA.',
    code: `<p role="status" aria-live="polite">
  {isLoading ? 'Loading results' : results.length + ' results'}
</p>`,
    signal: 'Talk about focus and announcement timing, not just color contrast.',
  },
  {
    id: 't5-boundary',
    level: 5,
    category: 'System design',
    question: 'How do you decide where a component boundary belongs?',
    answer: 'Place a boundary where there is a coherent responsibility, a useful ownership rule, a stable interface, or an independent reason to test, load, or change it. Avoid splitting purely by line count. A good boundary makes data flow and failure behavior easier to see.',
    code: `function CheckoutPage() {
  return (
    <CheckoutShell>
      <CartSummary />
      <PaymentForm />
    </CheckoutShell>
  );
}`,
    signal: 'Describe the boundary in terms of change, ownership, and failure—not aesthetics alone.',
  },
  {
    id: 't5-migration',
    level: 5,
    category: 'Leadership',
    question: 'How would you lead a React architecture migration?',
    answer: 'Define the user and business outcome, map constraints, choose a thin vertical slice, and establish observability and rollback before scaling the pattern. Migrate at seams, keep old and new paths compatible where possible, and publish decision records so teams can make consistent local choices.',
    code: `// A migration slice has a measurable exit condition:
// old route traffic ↓, error rate stable, Web Vitals stable`,
    signal: 'Strong answers include sequencing, adoption, instrumentation, and a way to stop safely.',
  },
  {
    id: 't5-client-server',
    level: 5,
    category: 'Modern React',
    question: 'How do you reason about a server/client boundary?',
    answer: 'Keep data access and non-interactive work on the server when the framework supports it, and move only the interaction and browser-only behavior to a client boundary. The boundary has costs: serialization, bundle size, waterfalls, caching, and a more complex mental model. Choose it intentionally.',
    code: `// Server-owned data crosses a small boundary.
<InteractiveFilters initialFilters={filters} />`,
    signal: 'Discuss where code runs, what crosses the boundary, and what the user gains.',
  },
];
