import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const clerkEnabled = Boolean(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY,
);

// Only run Clerk auth checks on private account/admin routes to keep public pages lean.
const isProtectedRoute = createRouteMatcher(["/mi-cuenta(.*)", "/admin(.*)"]);

const protectedMiddleware = clerkMiddleware(
  async (auth, req) => {
    if (isProtectedRoute(req)) {
      await auth.protect();
    }
  },
  {
    signInUrl: "/iniciar-sesion",
    signUpUrl: "/registrarse",
  },
);

export default function middleware(
  ...args: Parameters<typeof protectedMiddleware>
) {
  if (!clerkEnabled) {
    return NextResponse.next();
  }

  return protectedMiddleware(...args);
}

export const config = {
  matcher: ["/mi-cuenta(.*)", "/admin(.*)", "/api/orders/whatsapp"],
};
