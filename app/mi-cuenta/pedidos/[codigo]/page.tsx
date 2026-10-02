import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { ChevronLeft, MessageCircle } from "lucide-react";

import { getOrderDetailByCodeForCustomer } from "../../../../lib/orders/customerRepository";
import {
  AccountOrderStatusBadge,
  CustomerOrderDetailCard,
  formatAccountOrderDateTime,
} from "../../../../components/account/orderUi";
import StoreShell from "../../../../components/store/StoreShell";
import { isClerkServerConfigured } from "../../../../lib/clerkConfig";
import { WHATSAPP_OWNER_NUMBER } from "../../../../lib/contact";

type PageProps = {
  params: Promise<{
    codigo: string;
  }>;
};

function decodeOrderCode(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export default async function AccountOrderDetailPage({ params }: PageProps) {
  const { codigo } = await params;
  if (!isClerkServerConfigured()) {
    redirect("/mi-cuenta");
  }

  const session = await auth();
  if (!session.userId) {
    redirect(
      `/iniciar-sesion?redirect_url=${encodeURIComponent(`/mi-cuenta/pedidos/${codigo}`)}`,
    );
  }

  const orderCode = decodeOrderCode(codigo).trim();
  if (!orderCode) {
    redirect("/mi-cuenta");
  }

  const order = await getOrderDetailByCodeForCustomer(session.userId, orderCode);

  return (
    <StoreShell>
      <div className="acct shop-container">
        <Link href="/mi-cuenta/pedidos" className="acct-back"><ChevronLeft size={15} aria-hidden="true" />Mis pedidos</Link>
        {order ? (
          <>
            <header className="acct-head">
              <p className="shop-eyebrow">PEDIDO</p>
              <h1>{order.orderCode}</h1>
              <div className="acct-detail-head">
                <AccountOrderStatusBadge status={order.status} />
                <p className="acct-order-meta">{formatAccountOrderDateTime(order.createdAt)}</p>
              </div>
            </header>
            <CustomerOrderDetailCard order={order} />
          </>
        ) : (
          <header className="acct-head">
            <h1>No encontramos ese pedido</h1>
            <p>Revisa el código o vuelve a tus pedidos. Si compraste como invitado, escríbenos por WhatsApp con el código y te ayudamos.</p>
            <div className="acct-help-actions">
              <a className="shop-button shop-button-secondary" href={`https://wa.me/${WHATSAPP_OWNER_NUMBER}`} target="_blank" rel="noopener noreferrer"><MessageCircle size={16} aria-hidden="true" />WhatsApp</a>
              <Link className="shop-button shop-button-outline" href="/mi-cuenta/pedidos">Mis pedidos</Link>
            </div>
          </header>
        )}
      </div>
    </StoreShell>
  );
}
