export const exercises = [
  {
    id: 'e0-card-list',
    level: 0,
    type: 'Build',
    title: 'Product card list',
    time: '25 min',
    prompt: 'Render a list of products from data. Show a loading state, a useful empty state, and a card with a stable key for every product.',
    constraints: ['No duplicated card markup', 'The empty state must be reachable', 'Price formatting belongs at the display boundary'],
    starter: `function ProductList({ products, status }) {
  // Add loading, empty, and list states.
}`,
    approach: ['Branch on the request status before rendering the list.', 'Extract ProductCard so the list owns iteration and identity.', 'Use product.id as the key and keep formatting close to the label.'],
    interview: 'Follow up by asking what changes if the list can reorder while a card has local state.',
  },
  {
    id: 'e0-composition',
    level: 0,
    type: 'Explain',
    title: 'Composable page shell',
    time: '15 min',
    prompt: 'Design a PageShell that renders a header, optional sidebar, and arbitrary page content without knowing the page’s domain.',
    constraints: ['Use children for the main slot', 'Do not pass a giant config object', 'Keep the shell usable for a narrow viewport'],
    starter: `function PageShell({ children }) {
  return <main>{children}</main>;
}`,
    approach: ['Name the stable layout responsibilities.', 'Use composition for content that changes by route.', 'Explain which slots deserve explicit props versus children.'],
    interview: 'The signal is whether you can explain an interface that remains flexible without becoming vague.',
  },
  {
    id: 'e1-filter-form',
    level: 1,
    type: 'Build',
    title: 'Filterable task board',
    time: '35 min',
    prompt: 'Build a task list with a search field, status filter, and “clear filters” action. The visible list should be derived from the source tasks.',
    constraints: ['Do not store visibleTasks as state', 'Clear must restore every control', 'Announce the result count'],
    starter: `function TaskBoard({ tasks }) {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  // Derive the visible tasks here.
}`,
    approach: ['Keep only the two control values in state.', 'Normalize the query before matching.', 'Use a live status message for the result count.'],
    interview: 'Ask what should be in the URL if these filters need to be shareable.',
  },
  {
    id: 'e1-reducer',
    level: 1,
    type: 'Refactor',
    title: 'Reducer for checkout steps',
    time: '30 min',
    prompt: 'Refactor several related checkout setters into a reducer with explicit actions for shipping, payment, and submission.',
    constraints: ['Actions describe events, not setters', 'Unknown actions should fail loudly', 'Keep reducer logic pure'],
    starter: `const initialState = {
  step: 'shipping',
  shipping: {},
  payment: {},
  status: 'idle',
};`,
    approach: ['List the events that can happen before writing the reducer.', 'Return new state for every transition.', 'Keep network work in the event handler or a separate effect.'],
    interview: 'Explain when a reducer improves a component and when it merely adds ceremony.',
  },
  {
    id: 'e2-search-hook',
    level: 2,
    type: 'Build',
    title: 'Cancellable search hook',
    time: '40 min',
    prompt: 'Create useSearch(query) with a short debounce, cancellation for obsolete requests, and loading, error, and data states.',
    constraints: ['Do not update state after an obsolete request', 'Ignore AbortError as a user-visible error', 'Empty queries should not fetch'],
    starter: `function useSearch(query) {
  // Return { data, status, error }.
}`,
    approach: ['Normalize the query and decide the empty behavior.', 'Create a controller inside the effect and abort in cleanup.', 'Use a request-local flag or signal to protect state updates.'],
    interview: 'Ask how the hook changes if results should be cached across screens.',
  },
  {
    id: 'e2-focus-hook',
    level: 2,
    type: 'Explain',
    title: 'Focus management hook',
    time: '25 min',
    prompt: 'Design a useFocusOnOpen(ref, isOpen) hook for a dialog trigger. Preserve the trigger so focus can return when the dialog closes.',
    constraints: ['Focus only after the dialog is in the DOM', 'Clean up event listeners', 'Do not use a ref change as hidden state'],
    starter: `function useDialogFocus(dialogRef, triggerRef, isOpen) {
  // Define the focus lifecycle.
}`,
    approach: ['Separate opening focus from closing focus.', 'Use an effect for DOM synchronization and cleanup.', 'Describe what happens if the trigger unmounts.'],
    interview: 'The important answer is the focus lifecycle, not memorizing one hook implementation.',
  },
  {
    id: 'e3-dashboard',
    level: 3,
    type: 'Design',
    title: 'Dashboard data boundaries',
    time: '45 min',
    prompt: 'Sketch a dashboard with a URL-driven date range, cached team data, a local command menu, and independently loading panels.',
    constraints: ['Name ownership for every piece of state', 'One slow panel must not block the rest', 'Include not-found and permission failures'],
    starter: `// Draw the route, data, and UI-state boundaries before choosing APIs.
const dashboard = {
  route: {},
  server: {},
  ui: {},
};`,
    approach: ['Classify each value by owner and freshness.', 'Give each panel an explicit loading and error boundary.', 'Keep URL parsing and authorization decisions near their boundaries.'],
    interview: 'Defend one choice you would revisit if the product grew to ten teams.',
  },
  {
    id: 'e3-context',
    level: 3,
    type: 'Refactor',
    title: 'Split a noisy provider',
    time: '30 min',
    prompt: 'A provider contains theme, current user, notification actions, and a rapidly changing draft. Redesign its public API and update strategy.',
    constraints: ['Do not make all consumers rerender on every draft keystroke', 'Keep auth available to deep routes', 'Preserve a testable interface'],
    starter: `function AppProvider({ children }) {
  // This provider currently owns too many update frequencies.
  return children;
}`,
    approach: ['Group values by ownership and update frequency.', 'Split contexts or move fast-changing state closer to consumers.', 'Use stable action functions without hiding a flawed data boundary.'],
    interview: 'Explain when an external store or server-state cache is a better fit than more context.',
  },
  {
    id: 'e4-regression',
    level: 4,
    type: 'Test',
    title: 'Protect a failed checkout',
    time: '35 min',
    prompt: 'Write user-facing tests for a checkout that validates a form, shows a pending state, and preserves entered values after a server error.',
    constraints: ['Query by accessible role or label', 'Test the error recovery path', 'Avoid asserting component state or private calls'],
    starter: `test('keeps the form usable after payment fails', async () => {
  // Arrange, act, and assert the user journey.
});`,
    approach: ['Start from the user’s first observable action.', 'Assert pending feedback and disabled duplicate submission.', 'Assert the error and that the user can correct and retry.'],
    interview: 'Discuss which network boundary you would mock and why.',
  },
  {
    id: 'e4-performance',
    level: 4,
    type: 'Diagnose',
    title: 'Slow 10,000-row table',
    time: '40 min',
    prompt: 'A table feels slow while typing in a filter. Create a measurement plan before proposing a fix.',
    constraints: ['Separate input latency from network time', 'Do not start with useMemo everywhere', 'Name a regression metric'],
    starter: `// Record a baseline for typing and commit time.
const hypothesis = '...';`,
    approach: ['Profile a production-like row count.', 'Check render counts and expensive work per row.', 'Compare a measured intervention such as windowing or deferred rendering.'],
    interview: 'A strong answer says what result would disprove the hypothesis.',
  },
  {
    id: 'e5-migration',
    level: 5,
    type: 'Design',
    title: 'Incremental React migration',
    time: '50 min',
    prompt: 'Plan a migration from a legacy React app to a modern route and data architecture while two teams continue shipping features.',
    constraints: ['No big-bang rewrite', 'Define compatibility seams', 'Include observability and rollback'],
    starter: `const migrationSlice = {
  userOutcome: '',
  firstRoute: '',
  exitCriteria: [],
};`,
    approach: ['Choose a route with meaningful but contained traffic.', 'Make the old/new boundary observable and reversible.', 'Publish a golden path and migrate one vertical slice before broad adoption.'],
    interview: 'Explain how you would handle a team that cannot adopt the new pattern yet.',
  },
  {
    id: 'e5-review',
    level: 5,
    type: 'Review',
    title: 'Architecture decision memo',
    time: '30 min',
    prompt: 'Write a one-page decision comparing local state, context, and an external store for a multi-team editor.',
    constraints: ['State the decision first', 'Compare failure modes and operating cost', 'Name what would change your mind'],
    starter: `# Decision: editor state ownership

## Context

## Options

## Decision and consequences`,
    approach: ['Define the update frequency and ownership of each state slice.', 'Compare debugging, testing, subscription granularity, and adoption cost.', 'Record consequences so future teams can evaluate the decision.'],
    interview: 'Leadership-level answers make trade-offs explicit instead of declaring one tool universally best.',
  },
];
