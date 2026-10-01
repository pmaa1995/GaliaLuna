import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

type ClerkUserLike = Awaited<ReturnType<typeof currentUser>>;
type ClerkUser = NonNullable<ClerkUserLike>;

function parseEmailAllowlist(raw: string | undefined) {
  if (!raw) return new Set<string>();

  return new Set(
    raw
      .split(/[,\n;]/)
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean),
  );
}

function getVerifiedUserEmails(user: ClerkUserLike) {
  if (!user) return [];

  return [
    user.primaryEmailAddress,
    ...(user.emailAddresses ?? []),
  ]
    .filter((email) => email?.verification?.status === "verified")
    .map((email) => email!.emailAddress.trim().toLowerCase());
}

function readRoleFlag(value: unknown) {
  return typeof value === "string" ? value.toLowerCase() : "";
}

export function isAdminFromClerkUser(user: ClerkUserLike) {
  if (!user) return false;

  const allowlist = parseEmailAllowlist(process.env.ADMIN_EMAIL_ALLOWLIST);
  const userEmails = getVerifiedUserEmails(user);

  if (userEmails.some((email) => allowlist.has(email))) {
    return true;
  }

  const publicRole =
    user.publicMetadata && typeof user.publicMetadata === "object"
      ? readRoleFlag(
          (user.publicMetadata as Record<string, unknown>).galiaLunaRole,
        )
      : "";
  // Authorization must only use metadata that users cannot write from the frontend.
  const privateRole =
    user.privateMetadata && typeof user.privateMetadata === "object"
      ? readRoleFlag(
          (user.privateMetadata as Record<string, unknown>).galiaLunaRole,
        )
      : "";

  return publicRole === "admin" || privateRole === "admin";
}

export async function requireAdminUser(): Promise<ClerkUser> {
  const session = await auth();
  if (!session.userId) {
    redirect("/iniciar-sesion?redirect_url=/admin/pedidos");
  }

  const user = await currentUser();
  if (!isAdminFromClerkUser(user)) {
    redirect("/mi-cuenta");
  }

  return user as ClerkUser;
}

export async function assertAdminRequest() {
  const session = await auth();
  if (!session.userId) {
    return { ok: false as const, status: 401 };
  }

  const user = await currentUser();
  if (!isAdminFromClerkUser(user)) {
    return { ok: false as const, status: 403 };
  }

  return { ok: true as const, user };
}
