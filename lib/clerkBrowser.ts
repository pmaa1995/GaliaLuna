import { loadClerkJsScript } from "@clerk/shared/loadClerkJsScript";

export type BrowserClerkUser = {
  firstName?: string | null;
  lastName?: string | null;
  primaryEmailAddress?: { emailAddress?: string | null } | null;
  unsafeMetadata?: unknown;
};

type BrowserClerk = {
  loaded?: boolean;
  user?: BrowserClerkUser | null;
  load: () => Promise<void>;
};

// Clerk keeps a readable __client_uat cookie (optionally suffixed) holding the last sign-in time; 0 means signed out.
export function hasClerkSessionCookie() {
  return typeof document !== "undefined" && /(?:^|;\s*)__client_uat(?:_[^=]+)?=[1-9]\d*/.test(document.cookie);
}

let pending: Promise<BrowserClerk | null> | null = null;

// Storefront pages ship without Clerk. Checkout loads it only for shoppers who are signed in,
// so their saved delivery data is prefilled and the order request carries a fresh session.
export function loadSignedInClerk(): Promise<BrowserClerk | null> {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  if (!publishableKey || !hasClerkSessionCookie()) return Promise.resolve(null);
  const win = window as Window & { Clerk?: BrowserClerk };
  if (win.Clerk?.loaded) return Promise.resolve(win.Clerk);
  pending ??= loadClerkJsScript({ publishableKey })
    .then(async () => {
      if (!win.Clerk) return null;
      if (!win.Clerk.loaded) await win.Clerk.load();
      return win.Clerk;
    })
    .catch(() => {
      pending = null;
      return null;
    });
  return pending;
}
