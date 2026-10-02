import { NextResponse, type NextMiddleware } from "next/server";
import { isClerkServerConfigured } from "./lib/clerkConfig";

let protectedMiddleware: Promise<NextMiddleware> | undefined;

function getProtectedMiddleware() {
  // Clerk also reads server keys at import time. Load it only after OpenNext has
  // populated process.env from this Worker's request bindings.
  return protectedMiddleware ??= import("@clerk/nextjs/server").then(({ clerkMiddleware, createRouteMatcher }) => {
    const isProtectedRoute = createRouteMatcher(["/mi-cuenta(.*)", "/admin(.*)"]);
    return clerkMiddleware(
      async (auth, req) => {
        if (isProtectedRoute(req)) {
          const { userId } = await auth();
          if (!userId) {
            const signInUrl = new URL("/iniciar-sesion", req.url);
            signInUrl.searchParams.set("redirect_url", req.url);
            return NextResponse.redirect(signInUrl);
          }
        }
      },
      { signInUrl: "/iniciar-sesion", signUpUrl: "/registrarse" },
    );
  });
}

export default async function middleware(
  ...args: Parameters<NextMiddleware>
) {
  if (!isClerkServerConfigured()) {
    return NextResponse.next();
  }

  return (await getProtectedMiddleware())(...args);
}

export const config = {
  matcher: ["/mi-cuenta(.*)", "/admin(.*)", "/api/orders/whatsapp"],
};
