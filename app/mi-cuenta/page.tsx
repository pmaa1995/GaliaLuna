import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, currentUser } from "@clerk/nextjs/server";
import { Suspense } from "react";

import AccountDashboard, { type DeliveryProfile } from "../../components/account/AccountDashboard";
import AccountOrderHistoryPanel from "../../components/account/AccountOrderHistoryPanel";
import StoreShell from "../../components/store/StoreShell";
import { isAdminFromClerkUser } from "../../lib/admin/auth";
import { isClerkServerConfigured } from "../../lib/clerkConfig";

type PageSearchParams = {
  perfil?: string | string[];
  pedido?: string | string[];
};

const emptyProfile: DeliveryProfile = {
  deliveryPhone: "",
  alternatePhone: "",
  province: "",
  city: "",
  sector: "",
  addressLine1: "",
  addressLine2: "",
  reference: "",
  deliveryNotes: "",
};

function asString(value: unknown) {
  return typeof value === "string" ? value : "";
}

function readProfileFromMetadata(unsafeMetadata: unknown): DeliveryProfile {
  if (!unsafeMetadata || typeof unsafeMetadata !== "object") return emptyProfile;

  const record = unsafeMetadata as Record<string, unknown>;
  const nested = record.galiaLunaProfile;
  if (!nested || typeof nested !== "object") return emptyProfile;

  const p = nested as Record<string, unknown>;

  return {
    deliveryPhone: asString(p.deliveryPhone),
    alternatePhone: asString(p.alternatePhone),
    province: asString(p.province),
    city: asString(p.city),
    sector: asString(p.sector),
    addressLine1: asString(p.addressLine1),
    addressLine2: asString(p.addressLine2),
    reference: asString(p.reference),
    deliveryNotes: asString(p.deliveryNotes),
  };
}

function firstValue(value: string | string[] | undefined) {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

function getPerfilStatus(searchParams?: PageSearchParams) {
  const value = firstValue(searchParams?.perfil);
  return value === "guardado" || value === "error" ? value : "";
}

function OrdersFallback() {
  return (
    <section aria-busy="true">
      <div className="acct-section-head"><h2>Tus pedidos</h2></div>
      <p className="acct-empty">Cargando tus pedidos…</p>
    </section>
  );
}

export default async function AccountPage({
  searchParams,
}: {
  searchParams?: Promise<PageSearchParams>;
}) {
  if (!isClerkServerConfigured()) {
    return (
      <StoreShell>
        <div className="acct shop-container">
          <header className="acct-head">
            <p className="shop-eyebrow">MI CUENTA</p>
            <h1>Acceso de cuenta disponible pronto</h1>
            <p>Mientras tanto, puedes comprar desde la colección y confirmar tu pedido por WhatsApp.</p>
          </header>
          <Link href="/coleccion" className="shop-button shop-button-primary">Explorar la colección</Link>
        </div>
      </StoreShell>
    );
  }

  const session = await auth();
  if (!session.userId) {
    redirect("/iniciar-sesion");
  }

  const user = await currentUser();
  const resolvedSearchParams = await searchParams;
  const selectedOrderCode = firstValue(resolvedSearchParams?.pedido).trim();
  if (selectedOrderCode) {
    redirect(`/mi-cuenta/pedidos/${encodeURIComponent(selectedOrderCode)}`);
  }

  const firstName = user?.firstName ?? "";
  const lastName = user?.lastName ?? "";

  return (
    <StoreShell>
      <AccountDashboard
        firstName={firstName}
        lastName={lastName}
        displayName={[firstName, lastName].filter(Boolean).join(" ") || user?.username || "Cliente"}
        email={user?.primaryEmailAddress?.emailAddress ?? user?.emailAddresses?.[0]?.emailAddress ?? ""}
        profile={readProfileFromMetadata(user?.unsafeMetadata)}
        isAdmin={isAdminFromClerkUser(user)}
        profileStatus={getPerfilStatus(resolvedSearchParams)}
        orders={
          <Suspense fallback={<OrdersFallback />}>
            <AccountOrderHistoryPanel clerkUserId={session.userId} mode="compact" />
          </Suspense>
        }
      />
    </StoreShell>
  );
}
