const has = (question, ...terms) => terms.some(term => question.includes(term));
const hasWord = (question, word) => new RegExp(`\\b${word}\\b`, 'i').test(question);

const categoryLead = {
  coding: 'A strong implementation should',
  practical: 'A strong practical answer should',
  theory: 'The key idea is',
};

/**
 * The reference files contain question lists with uneven answer coverage.
 * Keep the answers in a small, reviewable knowledge layer so every imported
 * question has an interview-ready response, including source prompts that
 * were listed without an answer in the original document.
 */
export function answerForQuestion(item) {
  if (item.answer) return item.answer;

  const question = item.question.toLowerCase().replace(/\s+/g, ' ').trim();
  const lead = categoryLead[item.category] ?? categoryLead.theory;

  if (question === 'what is react?' || question === 'what is react.js?' || question === 'what is reactjs?') {
    return 'React is a JavaScript library for building user interfaces from composable components. Components describe UI from props and state, and React reconciles those descriptions before committing the necessary updates to the host environment.';
  }
  if (has(question, 'key features of react', 'important features of react')) {
    return 'Important React ideas include component composition, JSX, one-way data flow, state and props, declarative rendering, stable list keys, a large ecosystem, and renderers for targets such as the web and native platforms.';
  }

  if (has(question, 'use client directive')) {
    return "Use 'use client' only for the smallest component that needs state, effects, event handlers, or browser-only APIs. Keep data access and non-interactive work on the server when the framework supports it.";
  }
  if (has(question, 'useactionstate', 'useformstatus', 'useoptimistic')) {
    return 'React 19 form hooks separate concerns: useActionState exposes an action result and pending state, useFormStatus lets a submit control read the surrounding form status, and useOptimistic shows an immediate expected result while the server operation completes.';
  }
  if (has(question, 'server/client boundary', 'server side of a react server')) {
    return 'Keep server-owned data fetching, secrets, and non-interactive rendering on the server. Move only interaction, browser APIs, and client state across the boundary; keep the boundary small to control serialization and bundle costs.';
  }
  if (has(question, 'product catalogue', 'inventory dashboard')) {
    return 'Start with the data model and explicit request states. Split the screen into reusable components, derive search and sort results during render, use stable ids for keys, and handle loading, empty, error, mutation-pending, and rollback states before polishing the UI.';
  }
  if (has(question, 'automatic redirect', 'redirect after login', 'redirect aer login')) {
    return 'After authentication succeeds, navigate to the intended destination with the router. Preserve a return-to path, wait until auth loading has finished, and protect the route itself so a user cannot bypass the redirect by typing a URL.';
  }
  if (has(question, 'difference between react js and react native')) {
    return 'React is primarily a web UI library that renders to the browser DOM. React Native uses the same component model to render native platform views for mobile; the APIs, layout system, and deployment targets differ.';
  }
  if (has(question, 'update state in react')) {
    return 'Update state through its setter or reducer, never by mutating the existing value. Use a functional updater when the next value depends on the previous snapshot, and create new object or array references so React can observe the change.';
  }
  if (has(question, 'simple react hooks example')) {
    return 'Start with a small function component such as a counter: call useState at the top level, render the current value, and pass a click handler that uses setCount(previous => previous + 1). Explain that the setter schedules a new render.';
  }
  if (has(question, 'pass data between sibling components using react router')) {
    return 'Do not use the router as a general data bus. Lift shared state to the common parent, use Context or a shared store when appropriate, and put only shareable navigation state such as an id or filter in route/search parameters.';
  }
  if (has(question, 'filters and pagination in the url')) {
    return 'Read and validate search parameters with React Router, provide defaults, and update them through navigation so the browser history and refresh preserve the view. Keep transient UI state local.';
  }
  if (has(question, 'discriminated union')) {
    return 'Represent each state with a tag, for example { status: "loading" }, { status: "error", message }, or { status: "success", data }. A switch on status narrows the fields and prevents impossible combinations.';
  }
  if (has(question, 'inventory dashboard')) {
    return 'Keep query, sort, and page in URL or server-state boundaries; derive the visible rows; use a query cache for reads; validate dialog forms; and implement mutations with pending, optimistic, rollback, and error feedback. Test the main CRUD journey.';
  }
  if (has(question, 'jsx element be attached', 'attached to other jsx')) {
    return 'Yes. JSX elements can be nested like HTML and passed as children or props to another component. The receiving component decides where to render that element, which is the basis of composition.';
  }
  if (has(question, 'browser read jsx')) {
    return 'A browser cannot execute JSX syntax directly. Vite, Babel, or another build tool transforms JSX into JavaScript before the browser receives the bundle.';
  }
  if (has(question, 'render phase', 'commit phase')) {
    return 'Render is React calling components to calculate the next UI description. Commit is React applying the necessary host changes, such as DOM updates; effects run after commit. Render code must therefore remain pure.';
  }
  if (has(question, 'render code remain pure', 'component pure')) {
    return 'A pure render calculates JSX from props, state, and context without changing external systems. Put network calls, subscriptions, timers, DOM calls, and other side effects in event handlers or effects so React can safely repeat or interrupt rendering.';
  }
  if (has(question, 'array index', 'dangerous react key', 'key attribute matter', 'key prop', 'keys in react', 'key in react list', 'keys in react lists')) {
    return 'A key gives a list item stable identity across renders. Prefer a domain id. An array index can attach local state or DOM state to the wrong item after insertion, deletion, sorting, or reordering; it is only reasonable for a truly static list.';
  }
  if (has(question, 'jsx', 'javascript xml')) {
    if (has(question, 'outermost', 'one outer')) return 'A JSX expression must return one outermost element. Wrap sibling elements in a semantic parent or a Fragment (<>...</>) when no extra DOM node is needed.';
    if (has(question, 'attribute', 'html attribute')) return 'JSX attributes use JavaScript-style names such as className and htmlFor, and dynamic values go inside braces. Boolean, object, and function values are passed as expressions rather than HTML strings.';
    if (has(question, 'event listener', 'event listeners')) return 'Use camel-cased event props such as onClick and pass a function, not a function call. The handler receives the React event and can update state or perform the user-triggered action.';
    if (has(question, 'map')) return 'Map the source array to JSX and give each returned sibling a stable key, preferably an item id. Keep the transformation pure and handle an empty array with an explicit empty state.';
    if (has(question, 'self-closing', 'empty jsx', 'empty element')) return 'JSX has XML-style closing rules, so elements without children must close themselves, for example <img /> and <input />.';
    if (has(question, 'createelement')) return 'JSX is syntax that compiles to React element creation calls. <Button label="Save" /> expresses the same element description as a corresponding React.createElement(Button, { label: "Save" }).';
    if (has(question, 'conditional')) return 'Use a ternary for two alternatives, && for an optional block when the left side cannot be a renderable number, and an early return for whole-screen states. Use if/else outside JSX when the logic becomes complex.';
    if (has(question, 'expression')) return 'Put JavaScript expressions inside curly braces, such as {user.name} or {items.length}. JSX text outside braces is literal text; statements such as if/else belong outside the JSX expression.';
    return 'JSX is a JavaScript syntax extension for describing React elements. It is compiled before the browser runs it, and it lets components combine markup-like structure with JavaScript expressions.';
  }
  if (has(question, 'react native')) {
    if (has(question, 'stylesheet')) return 'React Native StyleSheet creates reusable JavaScript style objects for native components. It centralizes style definitions and can validate or optimize them, but it is not browser CSS.';
    if (has(question, 'asyncstorage')) return 'AsyncStorage is an asynchronous persistent key-value store on the device. Use it for non-sensitive preferences or cached data, not secrets; serialize structured values and handle failures.';
    if (has(question, 'expo')) return 'Expo provides tooling, preconfigured native modules, and a development workflow for React Native. It speeds up common app work while still allowing native configuration when the project needs it.';
    if (has(question, 'component')) return 'React Native components render platform-native views such as text, inputs, lists, and touchable controls. They share React composition patterns but use native props and layout behavior rather than DOM elements.';
    if (hasWord(question, 'state') || hasWord(question, 'props')) return 'The ownership model is the same: props are read-only inputs from a parent, while state is owned and updated by the component. React Native changes the rendering target, not this data-flow rule.';
    return 'React Native uses React to build native mobile interfaces with JavaScript or TypeScript. React targets the web DOM; React Native maps components to native platform views and APIs.';
  }
  if (has(question, 'real dom', 'virtual dom', 'virtual dom')) {
    return 'The browser DOM is the host tree; React maintains element descriptions and reconciles the next render against the previous one. It then commits the smallest necessary host updates. The important interview point is reconciliation and identity, not claiming that every update is automatically faster.';
  }
  if (has(question, 'functional component', 'class component', 'functional and class', 'hooks vs classes')) {
    return 'Function components use JavaScript functions and Hooks for state and effects. Class components use instance state and lifecycle methods. Modern React favors functions, but understanding classes helps maintain legacy code and error boundaries.';
  }
  if (has(question, 'constructor')) return 'A class constructor initializes instance state and can bind methods before mounting. In modern function components, useState and closures replace most constructor work; do not perform side effects in a constructor.';
  if (has(question, 'state and props', 'props and state', 'props in react', 'props in react js', 'react state')) {
    return 'Props are read-only values supplied by a parent; state is data owned by a component and changed through a setter or reducer. Both participate in rendering, and neither should be mutated directly.';
  }
  if (has(question, 'state is', 'what is state')) return 'State is component-owned data that can change over time. Updating it through a setter or reducer schedules a new render, and each render reads a state snapshot.';
  if (has(question, 'controlled', 'uncontrolled')) {
    return 'A controlled input receives its value or checked state from React and reports changes through onChange. An uncontrolled input keeps its value in the DOM and is read with a ref or FormData. Choose based on validation, synchronization, and performance needs.';
  }
  if (has(question, 'lifecycle')) return 'The conceptual lifecycle is mount, update, and unmount. Function components express synchronization with effects and cleanup; class code uses methods such as componentDidMount, componentDidUpdate, and componentWillUnmount.';
  if (has(question, 'render() method', 'render method')) return 'The render method in a class component returns the JSX description for the current props and state. It should be pure and may run again whenever inputs change; side effects belong elsewhere.';
  if (has(question, 'context')) return 'Context passes a value through a subtree without manually threading props through every intermediate component. Use it for cross-cutting, appropriately scoped values such as theme or auth, not as an automatic replacement for server-state caching.';
  if (has(question, 'higher-order', 'high order component', 'hoc')) return 'A higher-order component is a function that receives a component and returns a component with added behavior. It is a reuse pattern, not a built-in API; Hooks and composition are usually clearer for new code.';
  if (has(question, 'rules of hooks', 'basic rules of hooks')) return 'Call Hooks only at the top level of a function component or custom Hook, never inside conditions, loops, or nested callbacks. Call them in the same order on every render, and name custom Hooks with use.';
  if (has(question, 'react hooks', 'what are hooks', 'types of hooks', 'hooks?')) return 'Hooks are functions that let function components use state, context, refs, effects, and other React capabilities. Built-in Hooks cover common needs; custom Hooks package reusable stateful behavior behind a small interface.';
  if (has(question, 'usestate')) return 'useState returns the current state snapshot and a setter. Use the functional form, setValue(previous => next), when the next value depends on the previous value; update objects and arrays immutably.';
  if (has(question, 'useeffect', 'side effect')) return 'useEffect synchronizes with an external system such as a network request, subscription, timer, browser API, or non-React widget. Specify the reactive dependencies and return cleanup when the synchronization has a lifecycle. Do not use it for derivations or click-only logic.';
  if (has(question, 'usecallback', 'usememo')) return 'useMemo caches a calculated value and useCallback caches a function identity. They are performance tools for measured expensive work or stable memoized boundaries, not defaults; React Compiler may automate some memoization in supported projects.';
  if (has(question, 'use reducer', 'usereducer')) return 'useReducer centralizes related state transitions in a pure reducer driven by named actions. It is useful when several values change together or the state behaves like a small state machine; it is unnecessary ceremony for one simple value.';
  if (has(question, 'usecontext')) return 'useContext reads the nearest matching context value during render. It avoids prop threading, but consumers update when the provider value changes, so keep provider boundaries and value identity intentional.';
  if (has(question, 'useref', 'refs', 'ref in react')) return 'useRef returns a stable object whose current value survives renders without causing a render when changed. Use it for DOM nodes, timer ids, or other mutable non-visual values; use state when the value affects the UI.';
  if (has(question, 'createref')) return 'React.createRef creates a ref object, historically used mostly by class components. Attach it to an element to read the DOM node, but prefer a callback or useRef in function components when appropriate.';
  if (has(question, 'forwardref')) return 'forwardRef lets a component expose a ref to a child DOM node or imperative handle. In React 19, ref can be received as a normal prop by function components, but forwardRef remains relevant to older APIs and library compatibility.';
  if (has(question, 'useimperativehandle')) return 'useImperativeHandle customizes the value exposed through a forwarded ref. Keep the imperative surface small and use it for focused actions such as focus or reset when declarative props are not a good fit.';
  if (has(question, 'uselayouteffect')) return 'useLayoutEffect runs after DOM mutations but before the browser paints. Use it only for layout measurement or synchronous visual correction; useEffect is preferred for ordinary external synchronization, especially in server-rendered apps.';
  if (has(question, 'usedebugvalue')) return 'useDebugValue adds a readable label for a custom Hook in React DevTools. It is a debugging aid and should not be used to affect application behavior.';
  if (has(question, 'usetransition')) return 'useTransition marks non-urgent updates so React can keep urgent interactions responsive while rendering the transition. It returns a pending flag and a startTransition function.';
  if (has(question, 'react router', 'routing')) return 'React Router maps URL paths to UI and navigation behavior. Use route params for resource identity, search params for shareable filters, nested layouts for shared shells, and explicit 404 and protected-route states.';
  if (has(question, 'redux')) {
    if (has(question, 'middleware')) return 'Redux middleware intercepts dispatched actions before reducers run. It is used for logging, async workflows, analytics, and other cross-cutting behavior while keeping reducers pure.';
    if (has(question, 'thunk')) return 'Redux Thunk lets an action creator return a function that receives dispatch and getState. That function can perform async work and dispatch plain actions for pending, success, and failure.';
    if (has(question, 'connect')) return 'connect is the legacy React-Redux higher-order component that subscribes a class or function component to store state and dispatch props. Modern React-Redux generally prefers useSelector and useDispatch.';
    if (has(question, 'reducer')) return 'A Redux reducer is a pure function of (state, action) that returns the next state without mutation. Split reducers by domain and combine them at the store boundary.';
    if (has(question, 'more action', 'handle more action')) return 'Model each event with a distinct action type and keep domain reducers focused. Split large reducers by feature and combine them so each transition remains testable and predictable.';
    if (has(question, 'action')) return 'A Redux action is a serializable object describing an event, usually with a type and optional payload. Dispatch sends it through middleware and reducers to produce the next store state.';
    if (has(question, 'store')) return 'The Redux store holds the application state tree, dispatches actions, and lets consumers subscribe to changes. Keep state serializable and prefer one clear owner for each domain value.';
    if (has(question, 'flux')) return 'Flux is an architectural pattern based on unidirectional data flow: views dispatch actions, a dispatcher coordinates them, and stores update before views read the result. Redux uses similar ideas with a single store and pure reducers.';
    if (has(question, 'bindaction')) return 'bindActionCreators wraps action creators so they dispatch automatically when called. It is mostly a legacy convenience; modern Redux hooks and Redux Toolkit reduce the need for it.';
    return 'Redux is a predictable state container with a centralized store, dispatched actions, and pure reducers. Use it for shared client state with complex transitions when local state, Context, or a server-state cache is not the better boundary.';
  }
  if (has(question, 'reactdomserver', 'server-side rendering', 'server side rendering', 'ssr')) return 'Server-side rendering produces HTML from React on the server so the client can display content sooner and search engines can read it. The client then hydrates the markup; data, environment, and output must match to avoid hydration errors.';
  if (has(question, 'hydrate')) return 'Hydration attaches React behavior to HTML that was already rendered on the server. It is not the same as creating a fresh client-only tree, and the initial client render must match the server output.';
  if (has(question, 'reactdom')) return 'React describes components and elements; react-dom provides the web renderer that creates roots and commits React output to the browser DOM. Keep the rendering target separate from component logic.';
  if (has(question, 'react.lazy', 'suspense')) return 'React.lazy loads a component dynamically, while Suspense renders fallback UI until the lazy module or another supported resource is ready. Use route or feature boundaries and provide a useful loading state.';
  if (has(question, 'error boundaries', 'error boundary')) return 'An error boundary catches rendering errors in a descendant tree and shows fallback UI instead of blanking the whole application. It does not replace handling async errors or event-handler failures; log the error and offer recovery.';
  if (has(question, 'strictmode', 'strict mode')) return 'StrictMode enables development-only checks that expose unsafe patterns and missing effect cleanup. Extra setup and cleanup in development is intentional and does not represent duplicate production behavior.';
  if (has(question, 'fragment', 'empty tags', 'fragments')) return 'A Fragment groups multiple React children without adding a wrapper DOM node. Use <>...</> for an unkeyed fragment or <Fragment key={id}> when a fragment in a list needs identity.';
  if (has(question, 'children prop', 'props.children')) return 'children is the content nested between a component’s tags. It enables layout and composition APIs, allowing the wrapper to own structure while callers provide the page-specific UI.';
  if (has(question, 'portal')) return 'A portal renders React children into a different DOM node while preserving the React ownership and event model. It is useful for modals, tooltips, and overlays that must escape clipping or stacking contexts.';
  if (has(question, 'react.memo', 'memo()', 'react.purecomponent', 'pure component', 'shouldcomponentupdate')) return 'Memoization or shouldComponentUpdate can skip work when inputs are unchanged, but it only helps when the avoided render is expensive and identities are stable. Measure first and avoid treating memo as a correctness fix.';
  if (has(question, 'devtools', 'developer tools')) return 'React DevTools lets you inspect the component tree, props, state, context, and render performance. Use the Profiler to establish a baseline and identify expensive or unexpected renders.';
  if (has(question, 'style components', 'style a react component', 'styling', 'stylesheet')) return 'Common choices include className with CSS or modules, inline style objects for small dynamic values, utility CSS, and component libraries. Choose based on reuse, theming, accessibility, bundle cost, and team conventions.';
  if (has(question, 'shallow rendering', 'full rendering')) return 'Shallow rendering isolates a component without rendering its descendants; full rendering exercises the component tree. Prefer user-facing React Testing Library tests for new code and reserve shallow tests for legacy constraints.';
  if (has(question, 'usequery')) return 'useQuery describes a server-state read with a query key and query function, then exposes cached data, pending, error, and refetch behavior. Configure freshness and invalidation instead of copying server data into component state.';
  if (has(question, 'usemutation')) return 'useMutation represents a server write. Handle pending and failure states, update or invalidate affected query keys on success, and use optimistic updates only with a rollback plan.';
  if (has(question, 'useinfinitequery')) return 'useInfiniteQuery manages paginated or cursor-based server data as pages. Supply a next-page rule, append pages to the view, and handle loading-more, error, and duplicate-request states.';
  if (has(question, 'benefits', 'advantages')) return 'React offers composable components, one-way data flow, a large ecosystem, strong tooling, and multiple rendering options. The value comes from clear ownership and composition rather than the library alone.';
  if (has(question, 'limitations', 'drawbacks', 'challenges')) return 'React is a UI library, so routing, data fetching, forms, and styling require choices. Large apps can suffer from inconsistent conventions, unnecessary renders, bundle growth, and a learning curve around state ownership and effects.';
  if (has(question, 'angular', 'vue', 'frameworks')) return 'React focuses primarily on the UI layer and composes with other tools, while Angular is more batteries-included and Vue provides its own template and framework conventions. Compare ecosystem, team familiarity, rendering needs, and operating cost rather than declaring one universally best.';
  if (hasWord(question, 'form') || hasWord(question, 'forms')) return 'Use controlled fields when validation, formatting, or sibling UI must react to every change; use uncontrolled fields or FormData when the DOM can own the draft. Prevent default submission, validate at the boundary, expose errors accessibly, and model pending and failure states.';
  if (has(question, 'pass data between', 'sibling components', 'share data')) return 'Pass data down through props and callbacks, lift shared state to the closest common parent, or use Context when the value is cross-cutting. For siblings, the parent owns the value; routing is for URL/shareable state, not a general data bus.';
  if (has(question, 'static typing', 'typescript')) return 'TypeScript works well with React by typing props, events, refs, context values, and API responses. Discriminated unions are useful for mutually exclusive UI states, while generic types should express real reuse rather than add noise.';
  if (has(question, 'performance', 'optimize', 'prevent re-render', 're-renders')) return 'Profile first to identify whether the cost is rendering, JavaScript, network, layout, or bundle size. Then reduce unnecessary state, split boundaries, stabilize only meaningful props, lazy-load work, and measure the result before keeping memoization.';
  if (has(question, 'conditional rendering')) return 'Use an early return for whole-screen states, a ternary for two alternatives, and && for an optional block. Guard numeric values so 0 is not accidentally rendered as text.';
  if (has(question, 'switching component', 'different pages')) return 'Represent the current route or page as state/URL data, map it to a component, and render a stable layout around it. For a real application prefer React Router so navigation, history, deep links, and not-found behavior are explicit.';
  if (has(question, 'resized', 'browser is resized')) return 'Register a resize listener in an effect, update only the state the UI needs, and remove the listener in cleanup. Prefer CSS media queries or ResizeObserver when the behavior is layout-driven rather than application state.';
  if (has(question, 'redirect', 'automatic redirect')) return 'After authentication is known, render or navigate through a protected route. Preserve the intended destination, avoid redirecting before auth loading finishes, and make the logged-out and error states explicit.';
  if (has(question, 'jest')) return 'Jest is a JavaScript testing framework with assertions, mocks, timers, and a jsdom environment commonly used for React tests. Test user-visible behavior and use MSW or focused mocks at external boundaries.';
  if (has(question, 'dispatcher')) return 'A dispatcher is a central coordination point in Flux-style architecture that receives actions and invokes registered store callbacks. Redux replaces this pattern with dispatch plus reducers.';
  if (has(question, 'callback')) return 'A callback is a function passed to another function or component to be invoked later. In React it is commonly used for event handlers and child-to-parent communication; only memoize it when identity affects a measured boundary.';
  if (has(question, 'super keyword')) return 'In a class component, super(props) calls the parent constructor and initializes this.props before instance logic uses it. New function components do not need this class pattern.';
  if (has(question, 'yield')) return 'yield pauses a JavaScript generator and returns a value to the caller; the next() protocol resumes it later. It is a JavaScript language feature, not a React-specific lifecycle mechanism.';
  if (has(question, 'stateless')) return 'Historically, a stateless component was a function that rendered from props without local state. With Hooks, function components can own state and effects, so “function component” is the more accurate modern term.';
  if (has(question, 'presentational')) return 'A presentational component focuses on rendering UI from props and emitting callbacks. Keeping data fetching and orchestration outside it can make the component easier to reuse and test, though the boundary should follow responsibility rather than a rigid rule.';
  if (has(question, 'synthetic event')) return 'React events provide a consistent wrapper around browser events and use camel-cased handlers. Use preventDefault and stopPropagation deliberately, and read event values inside the handler or copy what you need.';
  if (has(question, 'arrow function')) return 'Arrow functions provide concise callbacks and lexical this, which avoids a common class-component binding problem. Do not create them in render solely for performance reasons; measure and use stable boundaries when needed.';
  if (has(question, 'pure components')) return 'A pure component skips a render when its props and state are shallowly equal. It can improve performance when inputs are immutable and the skipped work is expensive, but it does not replace profiling or correct state design.';
  if (has(question, 'what kind of information controls', 'controls a segment')) return 'React UI is primarily controlled by props from parents and state owned by components. Context and external/server-state tools can provide additional inputs, but each value should have one clear owner.';
  if (has(question, 'create-react-app')) return 'Create React App was a scaffolding tool that supplied a preconfigured build setup. It is deprecated for new React projects; use the current framework or Vite guidance for new work.';
  if (has(question, 'webpack')) return 'Webpack bundles modules and assets for the browser through loaders and plugins. It remains important in existing systems, while Vite and framework tooling provide a faster default setup for many new React apps.';
  if (has(question, 'babel')) return 'Babel transforms modern JavaScript and JSX into code supported by the target environment. JSX must be compiled before a browser can execute it directly.';
  if (has(question, 'browser read jsx')) return 'A browser does not execute JSX syntax by itself. A build tool such as Vite uses a compiler/transformation step to turn JSX into JavaScript before serving the bundle.';
  if (has(question, 'mvc architecture')) return 'MVC can become difficult when view, model, and controller responsibilities create circular dependencies or expensive DOM coordination. React’s component model and one-way data flow make UI ownership and updates more explicit.';
  if (has(question, 'more than one line', 'multi-line')) return 'Wrap a multiline JSX expression in parentheses and return one root element or Fragment. This keeps automatic semicolon insertion and indentation from changing the expression.';
  if (has(question, 'reduction')) return 'In a React state context, “reduction” usually refers to reducing the current state and an action into a next state, as in a reducer. A reducer must be pure and return a new value without mutating the previous one.';
  if (has(question, 'class components')) return 'Prefer function components for new code. A class component can still be appropriate when maintaining legacy lifecycle code or implementing a class-based error boundary, but do not choose it merely to manage ordinary state.';
  if (has(question, 'share an element', 'share data in the parsing')) return 'Lift the shared value to a common owner, then pass it down as props and pass callbacks back up. If the value is cross-cutting, Context may remove repetitive prop threading.';
  if (has(question, 'reconciliation')) return 'Reconciliation is React comparing the next element tree with the previous tree and deciding what to preserve, update, insert, or remove. Keys and element types provide the identity information that makes this comparison predictable.';
  if (has(question, 'forceupdate', 're-render a component without')) return 'forceUpdate can force a class component to render, but it bypasses the normal state model and should rarely be used. Fix the missing state or immutable update instead; external stores should notify React through their supported subscription API.';
  if (has(question, 'update props', 'values of props')) return 'A component must not mutate its props. The parent owns the value and can pass a new prop after updating its own state; a child requests that change through a callback prop.';
  if (has(question, 'restructuring', 'destructuring')) return 'Destructuring extracts values from objects or arrays into local bindings, for example const { name } = props. It does not clone or mutate the source value.';
  if (has(question, 'mounting and demounting', 'mounting', 'demounting')) return 'Mounting adds a component to the rendered tree; unmounting removes it. Use effect cleanup, componentWillUnmount in legacy classes, or resource-specific cleanup to release subscriptions, timers, and listeners.';
  if (has(question, 'prop-types')) return 'prop-types provides runtime checks for props in JavaScript components. TypeScript or another static type system catches many problems earlier, but runtime validation can still help at untyped boundaries.';
  if (has(question, 'createelement and cloneelement', 'createelement and clone')) return 'createElement creates a new React element description from a type, props, and children. cloneElement copies an existing element and merges new props or children; use it sparingly because composition is often clearer.';
  if (has(question, 'react-dom package', 'methods in a react-dom')) return 'Modern React DOM APIs include createRoot, hydrateRoot, and createPortal. Older render, hydrate, unmountComponentAtNode, and findDOMNode APIs are legacy or removed from current patterns.';
  if (has(question, 'getinitialstate', 'initialstate')) return 'getInitialState belonged to the old createClass API; a class component initializes state in its constructor, while a function component uses useState or useReducer.';
  if (has(question, 'componentwillmount')) return 'componentWillMount is a deprecated legacy lifecycle that ran before mounting. Do not use it in new code; move derivation into render and external synchronization into effects or supported lifecycle methods.';
  if (has(question, 'dispatch the data', 'dispatch data')) return 'Dispatch a serializable action that describes the event, for example dispatch({ type: "itemAdded", payload: item }). Reducers handle the transition; components should not mutate the store directly.';
  if (has(question, 'spill the reducers', 'split the reducers')) return 'Split reducers by domain or feature, then combine them at the store boundary. Each reducer should own a slice and handle only the actions relevant to that slice.';
  if (has(question, 'predefined prototypes')) return 'The listed values are JavaScript/React prop type categories such as number, string, array, object, and React element. In modern code, prefer precise TypeScript or runtime schemas instead of an unstructured list.';
  if (has(question, 'bindactionscreators')) return 'bindActionCreators turns action creators into functions that dispatch their returned actions. It is mainly a legacy convenience; hooks and Redux Toolkit are usually clearer in new code.';
  if (has(question, 'stable version')) return 'React versions change, so verify the role’s package.json and the current React release notes rather than relying on a static interview handout. Answer with the major/minor version relevant to the job and mention version-sensitive APIs.';
  if (has(question, 'redux workflow')) return 'A Redux workflow is: dispatch an action, run middleware, calculate the next state with pure reducers, notify subscribers, and render updated UI. Devtools can support time travel, reset, revert, and inspection when state is serializable.';
  if (has(question, 'react js and react native')) return 'React is primarily a web UI library that renders to the DOM. React Native uses the same component model to render native platform views for mobile; APIs, layout, and deployment targets differ.';
  if (has(question, 'abortcontroller', 'stale fetch')) return 'Create an AbortController for each request, pass its signal to fetch, and abort it in the effect cleanup when the query changes. Ignore expected AbortError results and prevent obsolete responses from updating current state.';
  if (has(question, 'debounce')) return 'A useDebounce Hook keeps the latest value and resets a timer whenever the input changes. After the delay it publishes the value; cleanup clears the previous timer. Use the debounced value for search, not for every keystroke UI update.';
  if (has(question, 'server state and client state')) return 'Server state is remote, shared, cacheable, and potentially stale; it needs fetching, invalidation, and synchronization. Client state is local UI intent such as a draft, open menu, or selected tab. Keep their ownership and tools separate.';
  if (has(question, 'tanstack query mutation')) return 'On mutation success, update the affected cached record directly when the response is authoritative or invalidate the relevant query keys when refetching is safer. For optimistic updates, snapshot the old cache, update it immediately, roll back on failure, and invalidate after settlement.';
  if (has(question, 'discriminated union')) return 'Represent each UI state as a tagged object, for example { status: "loading" } or { status: "success", data }. A switch on status narrows the fields and prevents impossible combinations such as loading and error at once.';
  if (has(question, 'filters and pagination in the url')) return 'Use useSearchParams to read and validate query parameters, provide defaults, and update them with navigation. Put shareable filters and page numbers in the URL while keeping transient menu state local.';
  if (has(question, 'protect a route')) return 'Load the auth state first, show a pending state while it is unknown, render the protected content for an authenticated user, and redirect logged-out users to login with a return-to destination. Enforce authorization on the server too.';
  if (has(question, 'react test valuable')) return 'A valuable test exercises user-visible behavior through roles, labels, keyboard input, clicks, navigation, and accessible feedback. It should survive implementation refactors and mock only external boundaries that would otherwise be slow or unavailable.';
  if (has(question, 'slow react screen')) return 'Reproduce and profile the screen first. Separate render cost from network, JavaScript, layout, and input latency; make one measured change such as reducing row work, deferring non-urgent rendering, or windowing a large list, then compare the result.';
  if (has(question, 'build a weather', 'weather search')) return 'Use a controlled query, debounce it, fetch with explicit loading/error/empty states, cancel stale requests, and keep favorites in a separate persisted store. Context can own theme, while the search result remains server state.';
  if (has(question, 'update react objects and arrays')) return 'Create new references: spread objects, map to update an item, filter to remove one, and spread to add one. Copy every nested object along the path that changes; never mutate the existing state value.';
  if (has(question, 'derived during render')) return 'If a value can be calculated from props or existing state, derive it during render. Storing a second copy creates synchronization bugs and often requires an unnecessary effect.';
  if (has(question, 'effect not be used')) return 'Do not use an effect for derived data or logic caused directly by a user event. Calculate derivations while rendering and perform click-specific work in the event handler; reserve effects for external synchronization.';
  if (has(question, 'jsx event listeners')) return 'Use camelCase event props such as onClick and pass a function reference or callback. The handler can read the event, prevent default behavior, update state, and call application logic.';
  if (has(question, 'render a list')) return 'Call map on the source array, return one JSX element per item, and give the outer returned element a stable key from the domain data. Render a clear empty state when the array has no items.';

  if (item.category === 'coding') {
    return `${lead} define the data flow and state ownership first, implement the smallest composable components, handle loading/empty/error and success states, use stable keys, and test the important user path and edge cases.`;
  }
  if (item.category === 'practical') {
    return `${lead} start by clarifying the user-visible goal and constraints, identify the state and failure boundaries, choose the simplest tool that fits, measure or test the result, and explain the trade-off rather than proposing a universal rule.`;
  }
  return `${lead} explain the concept in terms of React's render model, data ownership, identity, and the user-visible behavior it enables. Mention the modern function-component approach and the main trade-off when the question is version-sensitive.`;
}
