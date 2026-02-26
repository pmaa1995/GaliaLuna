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

function getUserEmails(user: ClerkUserLike) {
  if (!user) return [];

  return [
    user.primaryEmailAddress?.emailAddress,
    ...(user.emailAddresses?.map((email) => email.emailAddress) ?? []),
  ]
    .filter((email): email is string => Boolean(email))
    .map((email) => email.trim().toLowerCase());
}

function readRoleFlag(value: unknown) {
  return typeof value === "string" ? value.toLowerCase() : "";
}

export function isAdminFromClerkUser(user: ClerkUserLike) {
  if (!user) return false;

  const allowlist = parseEmailAllowlist(process.env.ADMIN_EMAIL_ALLOWLIST);
  const userEmails = getUserEmails(user);

  if (userEmails.some((email) => allowlist.has(email))) {
    return true;
  }

  const publicRole =
    user.publicMetadata && typeof user.publicMetadata === "object"
      ? readRoleFlag(
          (user.publicMetadata as Record<string, unknown>).galiaLunaRole,
        )
      : "";
  const unsafeRole =
    user.unsafeMetadata && typeof user.unsafeMetadata === "object"
      ? readRoleFlag(
          (user.unsafeMetadata as Record<string, unknown>).galiaLunaRole,
        )
      : "";

  return publicRole === "admin" || unsafeRole === "admin";
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
