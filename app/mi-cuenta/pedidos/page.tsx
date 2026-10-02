import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { ChevronLeft } from "lucide-react";

import AccountOrderHistoryPanel from "../../../components/account/AccountOrderHistoryPanel";
import StoreShell from "../../../components/store/StoreShell";
import { isClerkServerConfigured } from "../../../lib/clerkConfig";

type PageSearchParams = {
  page?: string | string[];
};

function getHistoryPage(searchParams?: PageSearchParams) {
  const raw = searchParams?.page;
  const value = Array.isArray(raw) ? raw[0] : raw;
  const parsed = Number.parseInt(typeof value === "string" ? value : "", 10);
  if (!Number.isFinite(parsed) || parsed < 1) return 1;
  return parsed;
}

export default async function AccountOrdersPage({
  searchParams,
}: {
  searchParams?: Promise<PageSearchParams>;
}) {
  if (!isClerkServerConfigured()) {
    redirect("/mi-cuenta");
  }

  const session = await auth();
  if (!session.userId) {
    redirect(
      `/iniciar-sesion?redirect_url=${encodeURIComponent("/mi-cuenta/pedidos")}`,
    );
  }

  const page = getHistoryPage(await searchParams);

  return (
    <StoreShell>
      <div className="acct shop-container">
        <Link href="/mi-cuenta" className="acct-back"><ChevronLeft size={15} aria-hidden="true" />Mi cuenta</Link>
        <header className="acct-head">
          <h1>Mis pedidos</h1>
          <p>Toca un pedido para ver sus piezas, la entrega y escribirnos sobre él.</p>
        </header>
        <AccountOrderHistoryPanel clerkUserId={session.userId} page={page} mode="full" />
      </div>
    </StoreShell>
  );
}
