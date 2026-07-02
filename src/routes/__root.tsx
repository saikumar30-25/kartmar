import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { AuthProvider } from "../lib/auth";
import { Toaster } from "../components/ui/sonner";
import { NotificationBridge } from "../components/NotificationBridge";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-cream px-4">
      <div className="max-w-md text-center">
        <h1 className="font-serif text-7xl italic text-brand-green">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          That route isn't part of AgriConnect.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-brand-green px-4 py-2 text-sm font-semibold text-brand-cream"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);
  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-cream px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold">This page didn't load</h1>
        <p className="mt-2 text-sm text-muted-foreground">Something went wrong. Try again or head home.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="rounded-md bg-brand-green px-4 py-2 text-sm font-semibold text-brand-cream"
          >
            Try again
          </button>
          <a href="/" className="rounded-md border border-border bg-card px-4 py-2 text-sm font-semibold">
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "AgriConnect — Farmer & Buyer Marketplace" },
      { name: "description", content: "AI-powered agri marketplace connecting Indian farmers with market and shop owners." },
      { property: "og:title", content: "AgriConnect — Farmer & Buyer Marketplace" },
      { property: "og:description", content: "AI-powered agri marketplace connecting Indian farmers with market and shop owners." },
      { property: "og:type", content: "website" },
      { name: "twitter:title", content: "AgriConnect — Farmer & Buyer Marketplace" },
      { name: "twitter:description", content: "AI-powered agri marketplace connecting Indian farmers with market and shop owners." },
      { property: "og:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/150e83fa-7d8f-46a7-8bc3-942650372dc4" },
      { name: "twitter:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/150e83fa-7d8f-46a7-8bc3-942650372dc4" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Instrument+Serif:ital@0;1&family=Noto+Sans+Devanagari:wght@400;600&family=Noto+Sans+Telugu:wght@400;600&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <NotificationBridge />
        <Outlet />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}
