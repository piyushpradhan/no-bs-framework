import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";

// ── Types ──────────────────────────────────────────────────────────────────

export interface RouteDefinition {
  path: string;
  component: React.ComponentType<any>;
  /** Optional guard — return false or a redirect path to block navigation */
  guard?: () => boolean | string;
}

export interface RouterOptions {
  routes: RouteDefinition[];
  /** "hash" uses window.location.hash; "history" uses the History API */
  mode?: "hash" | "history";
  /** Fallback route path when no route matches */
  notFound?: React.ComponentType<any>;
}

export interface RouterContext {
  /** Current pathname (without # prefix in hash mode) */
  pathname: string;
  /** Parsed query params from the current URL */
  params: Record<string, string>;
  /** Navigate to a path. Replaces history entry if replace=true */
  navigate: (to: string, options?: { replace?: boolean }) => void;
  /** Navigate back */
  back: () => void;
}

// ── Internal context ────────────────────────────────────────────────────────

const RouterCtx = createContext<RouterContext | null>(null);

// ── Path matching ────────────────────────────────────────────────────────────

function matchPath(
  pattern: string,
  pathname: string,
): Record<string, string> | null {
  const patternParts = pattern.split("/").filter(Boolean);
  const pathParts = pathname.split("/").filter(Boolean);

  if (patternParts.length !== pathParts.length) return null;

  const params: Record<string, string> = {};
  for (let i = 0; i < patternParts.length; i++) {
    if (patternParts[i].startsWith(":")) {
      params[patternParts[i].slice(1)] = decodeURIComponent(pathParts[i]);
    } else if (patternParts[i] !== pathParts[i]) {
      return null;
    }
  }
  return params;
}

function getCurrentPath(mode: "hash" | "history"): string {
  if (mode === "hash") {
    return window.location.hash.slice(1) || "/";
  }
  return window.location.pathname + window.location.search;
}

// ── RouterProvider ────────────────────────────────────────────────────────────

export function RouterProvider({
  options,
  children,
}: {
  options: RouterOptions;
  children?: ReactNode;
}) {
  const mode = options.mode ?? "hash";
  const [pathname, setPathname] = useState(() => getCurrentPath(mode));
  const [params, setParams] = useState<Record<string, string>>({});

  useEffect(() => {
    const handler = () => {
      setPathname(getCurrentPath(mode));
    };

    if (mode === "hash") {
      window.addEventListener("hashchange", handler);
    } else {
      window.addEventListener("popstate", handler);
    }

    // Sync on mount
    handler();

    return () => {
      if (mode === "hash") {
        window.removeEventListener("hashchange", handler);
      } else {
        window.removeEventListener("popstate", handler);
      }
    };
  }, [mode]);

  // Update params whenever pathname changes
  useEffect(() => {
    for (const route of options.routes) {
      const match = matchPath(route.path, pathname.split("?")[0]);
      if (match !== null) {
        setParams(match);
        return;
      }
    }
    setParams({});
  }, [pathname, options.routes]);

  const navigate = useCallback(
    (to: string, opts: { replace?: boolean } = {}) => {
      if (mode === "hash") {
        if (opts.replace) {
          window.location.replace("#" + to);
        } else {
          window.location.hash = to;
        }
      } else {
        if (opts.replace) {
          window.history.replaceState(null, "", to);
        } else {
          window.history.pushState(null, "", to);
        }
        setPathname(getCurrentPath(mode));
      }
    },
    [mode],
  );

  const back = useCallback(() => window.history.back(), []);

  const ctx: RouterContext = { pathname, params, navigate, back };

  return React.createElement(
    RouterCtx.Provider,
    { value: ctx },
    children ?? React.createElement(RouterView, { options }),
  );
}

// ── RouterView ────────────────────────────────────────────────────────────────

/**
 * Renders the component matching the current route.
 * Can be used standalone inside a RouterProvider, or RouterProvider will
 * render it automatically when no children are provided.
 */
export function RouterView({ options }: { options: RouterOptions }) {
  const ctx = useContext(RouterCtx);
  if (!ctx) throw new Error("RouterView must be inside RouterProvider");

  const pathname = ctx.pathname.split("?")[0];

  for (const route of options.routes) {
    const match = matchPath(route.path, pathname);
    if (match !== null) {
      // Run guard if present
      if (route.guard) {
        const result = route.guard();
        if (result === false) {
          return options.notFound
            ? React.createElement(options.notFound)
            : React.createElement("div", null, "403 Forbidden");
        }
        if (typeof result === "string") {
          // Redirect
          ctx.navigate(result, { replace: true });
          return null;
        }
      }
      return React.createElement(route.component, { params: match });
    }
  }

  // No match — render notFound or a default
  if (options.notFound) {
    return React.createElement(options.notFound);
  }

  return React.createElement(
    "div",
    { style: { padding: "2rem", fontFamily: "monospace" } },
    "404 — Route not found: ",
    React.createElement("code", null, pathname),
  );
}

// ── Hooks ─────────────────────────────────────────────────────────────────────

/** Access the router context from any component inside RouterProvider */
export function useRouter(): RouterContext {
  const ctx = useContext(RouterCtx);
  if (!ctx) throw new Error("useRouter must be used within a RouterProvider");
  return ctx;
}

/** Returns the current route's dynamic params */
export function useParams(): Record<string, string> {
  return useRouter().params;
}

/** Navigate programmatically */
export function useNavigate(): RouterContext["navigate"] {
  return useRouter().navigate;
}

// ── createRouter ──────────────────────────────────────────────────────────────

/**
 * Create a router configuration object.
 *
 * @example
 * const router = createRouter({
 *   mode: "hash",
 *   routes: [
 *     { path: "/", component: Home },
 *     { path: "/projects/:id", component: ProjectDetail },
 *     { path: "/settings", component: Settings, guard: () => isLoggedIn() },
 *   ],
 *   notFound: NotFoundPage,
 * });
 *
 * // In your app root:
 * <RouterProvider options={router} />
 */
export function createRouter(options: RouterOptions): RouterOptions {
  return options;
}

// ── Link component ─────────────────────────────────────────────────────────────

interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  to: string;
  replace?: boolean;
  children: ReactNode;
}

/**
 * Declarative navigation link. Uses the router mode automatically.
 */
export function Link({ to, replace, children, onClick, ...rest }: LinkProps) {
  const { navigate, pathname } = useRouter();
  const isActive = pathname === to || pathname.startsWith(to + "/");

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    onClick?.(e);
    navigate(to, { replace });
  };

  return React.createElement(
    "a",
    {
      href: to,
      onClick: handleClick,
      "data-active": isActive || undefined,
      ...rest,
    },
    children,
  );
}
