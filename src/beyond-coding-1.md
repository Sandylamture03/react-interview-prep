@section beyond-coding

## bg-styling | Styling with Tailwind & shadcn/ui | Week 5 | 14 | gap

### Responsive product grid with Tailwind and dark mode @basic
Using Tailwind CSS v4 with class-based dark mode, build `ProductGrid` and `ProductCard`:

- 1 column on phones, 2 from `sm`, 3 from `lg`, 4 from `xl`.
- Product image with a fixed 4:3 aspect ratio.
- A "Sale" badge when `salePrice` is set; out-of-stock cards look disabled.
- A visible keyboard focus style on the button and a small hover lift on the card.
- Correct colours in both light and dark mode.
-- answer --
```css
/* index.css: class-based dark mode in Tailwind v4 */
@import "tailwindcss";
@custom-variant dark (&:where(.dark, .dark *));
```

```jsx
import { cn } from '@/lib/utils';   // clsx + tailwind-merge

export function ProductGrid({ products }) {
  return (
    <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {products.map(product => (
        <li key={product.id}>
          <ProductCard product={product} />
        </li>
      ))}
    </ul>
  );
}

function ProductCard({ product }) {
  const outOfStock = product.stock === 0;
  const onSale = product.salePrice != null;

  return (
    <article
      className={cn(
        'relative flex h-full flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm transition',
        'hover:-translate-y-0.5 hover:shadow-md',
        'dark:border-zinc-800 dark:bg-zinc-900',
        outOfStock && 'opacity-60'
      )}
    >
      <img src={product.image} alt={product.name} className="aspect-[4/3] w-full object-cover" />

      {onSale && (
        <span className="absolute left-3 top-3 rounded-full bg-red-600 px-2 py-0.5 text-xs font-semibold text-white">
          Sale
        </span>
      )}

      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">{product.name}</h3>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {onSale ? (
            <>
              <s>${product.price}</s>{' '}
              <span className="font-semibold text-red-600 dark:text-red-400">${product.salePrice}</span>
            </>
          ) : (
            `$${product.price}`
          )}
        </p>
        <button
          disabled={outOfStock}
          className={cn(
            'mt-auto rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-700',
            'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900',
            'disabled:cursor-not-allowed disabled:bg-zinc-400',
            'dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white dark:focus-visible:outline-zinc-100'
          )}
        >
          {outOfStock ? 'Out of stock' : 'Add to cart'}
        </button>
      </div>
    </article>
  );
}
```

**Key points**

- Tailwind is **mobile-first**: unprefixed classes apply at every width, and `sm:`, `lg:` and `xl:` override from that breakpoint up.
- `cn()` keeps conditional classes readable and resolves conflicts.
- Give borders an explicit colour: in Tailwind v4 a bare `border` uses `currentColor`.
- `disabled:` and `focus-visible:` variants style real states, so keyboard users get a focus ring and mouse users don't.
- The grid is a `ul` of `li`s, so screen readers announce "list, 12 items".

### Button variants with cva and cn (the shadcn pattern) @intermediate
Build a typed `Button` the way shadcn/ui does:

- Variants `default`, `outline`, `ghost` and `destructive`; sizes `sm`, `md`, `lg` and `icon`.
- Callers can pass `className` to override any style, so `className="px-8"` beats the size's padding.
- The types come from the variant definitions, so `variant="danger"` is a type error.
- Links that should look like buttons can reuse the styles.
-- answer --
```tsx
// lib/utils.ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

```tsx
// components/ui/button.tsx
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

export const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors ' +
    'focus-visible:outline-2 focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-zinc-900 text-white hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900',
        outline: 'border border-zinc-300 bg-transparent hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800',
        ghost: 'hover:bg-zinc-100 dark:hover:bg-zinc-800',
        destructive: 'bg-red-600 text-white hover:bg-red-700',
      },
      size: {
        sm: 'h-8 px-3',
        md: 'h-10 px-4',
        lg: 'h-12 px-6 text-base',
        icon: 'size-10',
      },
    },
    defaultVariants: { variant: 'default', size: 'md' },
  }
);

type ButtonProps = React.ComponentProps<'button'> & VariantProps<typeof buttonVariants>;

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return <button className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
```

```tsx
// Usage
<Button>Save</Button>
<Button variant="outline" size="sm">Cancel</Button>
<Button variant="destructive" className="px-8">Delete</Button>   {/* px-8 replaces px-4 */}
<Button size="icon" aria-label="Settings"><GearIcon /></Button>

{/* A link styled as a button, without putting a <button> inside an <a> */}
<Link to="/docs" className={buttonVariants({ variant: 'outline' })}>Docs</Link>
```

**Key points:** `cva` maps variant props to class strings in one place; `VariantProps` derives the prop types, so the variants and types can't drift apart; `tailwind-merge` drops conflicting earlier classes, which is what makes `className` overrides reliable; exporting `buttonVariants` lets non-button elements share the look.

### Delete with a confirmation dialog and a toast (shadcn/ui) @intermediate
In the inventory dashboard, clicking **Delete** on a product row must:

- Open a confirmation dialog that names the product (shadcn/ui `AlertDialog`).
- Keep the dialog open, with a "Deleting…" button, while the request runs. Escape and Cancel must not close it mid-request.
- On success, close the dialog and show a success toast (Sonner). On failure, show an error toast and keep the dialog open.

Assume `useDeleteProduct()` returns a TanStack Query mutation that doesn't show toasts or remove the row optimistically.
-- answer --
```tsx
import { useState } from 'react';
import { toast } from 'sonner';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { useDeleteProduct } from './hooks';

export function DeleteProductButton({ product }: { product: { id: string; name: string } }) {
  const [open, setOpen] = useState(false);
  const del = useDeleteProduct();

  function handleConfirm(e: React.MouseEvent) {
    e.preventDefault();   // AlertDialogAction normally closes the dialog straight away
    del.mutate(product.id, {
      onSuccess: () => {
        setOpen(false);
        toast.success(`Deleted ${product.name}`);
      },
      onError: () => toast.error('Delete failed. Please try again.'),
    });
  }

  return (
    <AlertDialog open={open} onOpenChange={next => { if (!del.isPending) setOpen(next); }}>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="sm">Delete</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {product.name}?</AlertDialogTitle>
          <AlertDialogDescription>
            This permanently removes the product and its stock history.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={del.isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={del.isPending}
            className="bg-red-600 text-white hover:bg-red-700"
          >
            {del.isPending ? 'Deleting…' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// Once, in the app layout: import { Toaster } from '@/components/ui/sonner'; then render <Toaster />
```

**Key points:** the dialog is **controlled** (`open` + `onOpenChange`) so it closes only when the request succeeds; `e.preventDefault()` stops the Action button's built-in close; ignoring `onOpenChange` while pending blocks Escape and Cancel mid-request; `AlertDialog` (not `Dialog`) is the right primitive for destructive confirmations, because it requires an explicit choice and doesn't close on an outside click; per-call `mutate` callbacks keep UI feedback next to the UI that triggered it.

## bg-legacy | Legacy code from the skip list | Skip list | – | gap

### Convert a class component to hooks @intermediate #legacy
Rewrite this class component as a function component with hooks. Then fix the bug the class has when `userId` changes quickly.

```jsx
class UserProfile extends React.Component {
  state = { user: null, loading: true, width: window.innerWidth };

  componentDidMount() {
    this.loadUser();
    window.addEventListener('resize', this.handleResize);
  }

  componentDidUpdate(prevProps) {
    if (prevProps.userId !== this.props.userId) {
      this.loadUser();
    }
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.handleResize);
  }

  handleResize = () => this.setState({ width: window.innerWidth });

  async loadUser() {
    this.setState({ loading: true });
    const res = await fetch(`/api/users/${this.props.userId}`);
    const user = await res.json();
    this.setState({ user, loading: false });
  }

  render() {
    const { user, loading, width } = this.state;
    if (loading) return <p>Loading…</p>;
    return <h2>{user.name} ({width < 600 ? 'mobile' : 'desktop'} layout)</h2>;
  }
}
```
-- answer --
```jsx
import { useEffect, useState } from 'react';

function useWindowWidth() {
  const [width, setWidth] = useState(() => window.innerWidth);

  useEffect(() => {
    const onResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);   // componentWillUnmount
  }, []);

  return width;
}

export function UserProfile({ userId }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const width = useWindowWidth();

  // componentDidMount + componentDidUpdate(userId) + cleanup, in one effect
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);

    fetch(`/api/users/${userId}`, { signal: controller.signal })
      .then(res => res.json())
      .then(data => {
        setUser(data);
        setLoading(false);
      })
      .catch(err => {
        if (err.name !== 'AbortError') setLoading(false);
      });

    return () => controller.abort();   // A newer userId cancels the stale request
  }, [userId]);

  if (loading) return <p>Loading…</p>;
  if (!user) return <p>Couldn't load this user.</p>;
  return <h2>{user.name} ({width < 600 ? 'mobile' : 'desktop'} layout)</h2>;
}
```

| Class | Hooks version |
|---|---|
| One `state` object, `setState` merges | Separate `useState` values (setters replace, not merge) |
| `componentDidMount` + `componentDidUpdate` comparing `userId` | One `useEffect` with `[userId]` |
| `componentWillUnmount` | The effect's cleanup function |
| Resize logic spread over three methods | A reusable `useWindowWidth` hook |
| `this.handleResize` bound as a class field | A local function inside the effect |

**The class bug:** if `userId` changes from 1 to 2 while user 1 is still loading, whichever response arrives last wins, so the page can show user 1 for `userId` 2. The class also never cancels the request on unmount. The effect's cleanup aborts the stale request in both cases.

### Replace a higher-order component with a custom hook @intermediate #legacy
This HOC injects the signed-in user and shows a login prompt when there isn't one. Refactor it to hooks and explain what improves.

```jsx
function withAuth(WrappedComponent) {
  return function WithAuth(props) {
    const [user, setUser] = useState(null);

    useEffect(() => {
      return authClient.onChange(setUser);   // onChange returns an unsubscribe function
    }, []);

    if (!user) return <LoginPrompt />;
    return <WrappedComponent {...props} user={user} />;
  };
}

export default withAuth(Dashboard);
```
-- answer --
```jsx
// The logic becomes a hook
function useUser() {
  const [user, setUser] = useState(() => authClient.currentUser);
  useEffect(() => authClient.onChange(setUser), []);   // Returns the unsubscribe as cleanup
  return user;
}

// The gating becomes a small wrapper component (or a protected route)
function RequireUser({ children }) {
  const user = useUser();
  if (!user) return <LoginPrompt />;
  return children;
}

function Dashboard() {
  const user = useUser();   // Visible at the call site: no hidden injected prop
  return <h1>Welcome back, {user.name}</h1>;
}

// Usage
<RequireUser>
  <Dashboard />
</RequireUser>
```

**What improves**

- **No hidden props:** with the HOC, `user` appears in `Dashboard`'s props from nowhere and can collide with a real `user` prop.
- **No wrapper layers:** `withAuth(withTheme(withRouter(Dashboard)))` becomes a few hook calls, and DevTools shows the real component tree.
- **Simpler TypeScript:** typing a hook is easy; typing a HOC that adds and removes props needs generics.
- **Composable:** any component can call `useUser()` alongside other hooks.

In a real app, put the user in Context (one subscription for the whole app) and have `useUser` read it.

### Modernize a component for React 19 @basic #legacy
Rewrite this component for React 19 with TypeScript. It should keep working the same way for callers.

```jsx
import PropTypes from 'prop-types';
import { forwardRef } from 'react';

const TextField = forwardRef(function TextField({ label, size }, ref) {
  return (
    <ThemeContext.Consumer>
      {theme => (
        <label className={`field field-${size} ${theme}`}>
          {label}
          <input ref={ref} />
        </label>
      )}
    </ThemeContext.Consumer>
  );
});

TextField.propTypes = {
  label: PropTypes.string.isRequired,
  size: PropTypes.oneOf(['sm', 'md']),
};
TextField.defaultProps = { size: 'md' };

// App
<ThemeContext.Provider value="dark">
  <TextField label="Email" ref={emailRef} />
</ThemeContext.Provider>
```
-- answer --
```tsx
import { useContext } from 'react';

type TextFieldProps = Omit<React.ComponentProps<'input'>, 'size'> & {
  label: string;
  size?: 'sm' | 'md';
};

export function TextField({ label, size = 'md', ref, ...inputProps }: TextFieldProps) {
  const theme = useContext(ThemeContext);
  return (
    <label className={`field field-${size} ${theme}`}>
      {label}
      <input ref={ref} {...inputProps} />
    </label>
  );
}

// App
<ThemeContext value="dark">
  <TextField label="Email" ref={emailRef} type="email" />
</ThemeContext>
```

| Before | React 19 | Why |
|---|---|---|
| `forwardRef(...)` | `ref` destructured from props | Function components receive `ref` as a prop |
| `propTypes` | TypeScript types | React 19 ignores `propTypes` |
| `defaultProps` | Default parameter `size = 'md'` | Removed for function components |
| `<ThemeContext.Consumer>` render prop | `useContext(ThemeContext)` | Simpler; no nesting |
| `<ThemeContext.Provider value>` | `<ThemeContext value>` | New provider syntax |

`Omit<..., 'size'>` is needed because `<input>` already has a native numeric `size` attribute. As a bonus, the field now forwards any native input prop (`type`, `name`, `autoComplete`) to the input.
