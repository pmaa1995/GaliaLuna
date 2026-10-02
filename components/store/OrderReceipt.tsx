"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, MessageCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { WHATSAPP_OWNER_NUMBER } from "../../lib/contact";
import { ORDER_RECEIPT_PARAM, isOrderCode, readOrderReceipt, type OrderReceipt as Receipt } from "../../lib/orders/receipt";
import { formatDOP } from "../../types/product";

const dateFormat = new Intl.DateTimeFormat("es-DO", { dateStyle: "long", timeStyle: "short" });

// Shown at the top of the home page after checkout: the order code, what was ordered and the next step.
export default function OrderReceipt() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const code = params.get(ORDER_RECEIPT_PARAM);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    setReceipt(isOrderCode(code) ? readOrderReceipt(code) : null);
  }, [code]);

  useEffect(() => {
    if (isOrderCode(code)) sectionRef.current?.focus({ preventScroll: true });
  }, [code]);

  if (!isOrderCode(code)) return null;

  const whatsappUrl = receipt?.whatsappUrl ||
    `https://wa.me/${WHATSAPP_OWNER_NUMBER}?text=${encodeURIComponent(`Hola Galia Luna, quiero confirmar mi pedido ${code}.`)}`;
  const needsWhatsApp = receipt ? !receipt.whatsappOpened : false;
  const dismiss = () => router.replace(pathname, { scroll: false });

  return (
    <section ref={sectionRef} tabIndex={-1} className="receipt" aria-labelledby="receipt-title">
      <div className="receipt-card">
        <p className="receipt-eyebrow"><CheckCircle2 size={16} aria-hidden="true" />Pedido recibido</p>
        <h2 id="receipt-title">Gracias, tu pedido quedó registrado.</h2>
        <p className="receipt-code">
          Código <strong>{code}</strong>
          {receipt ? <span> · {dateFormat.format(new Date(receipt.createdAt))}</span> : null}
        </p>

        {receipt?.items.length ? (
          <div className="receipt-items">
            <ul>
              {receipt.items.map((item, index) => (
                <li key={`${item.name}-${index}`}><span>{item.quantity} × {item.name}</span><span>{formatDOP(item.price * item.quantity)}</span></li>
              ))}
            </ul>
            <p className="receipt-total"><span>Total estimado</span><strong>{formatDOP(receipt.total)}</strong></p>
          </div>
        ) : null}

        <ol className="receipt-steps">
          <li className={needsWhatsApp ? "is-current" : undefined}>
            <strong>{needsWhatsApp ? "Envía tu pedido por WhatsApp" : "Envía el mensaje en WhatsApp"}</strong>
            <span>{needsWhatsApp ? "Tu navegador no abrió WhatsApp. Toca el botón para enviarlo." : "Abrimos WhatsApp con tu pedido listo. Si no lo enviaste, puedes abrirlo de nuevo."}</span>
          </li>
          <li>
            <strong>Te confirmamos</strong>
            <span>Una asesora revisa disponibilidad y coordina contigo el pago y la entrega.</span>
          </li>
        </ol>

        <div className="receipt-actions">
          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className={needsWhatsApp ? "sheet-submit" : "receipt-secondary"}>
            <MessageCircle size={16} aria-hidden="true" />{needsWhatsApp ? "Enviar por WhatsApp" : "Abrir WhatsApp de nuevo"}
          </a>
          {receipt?.signedIn ? <Link href={`/mi-cuenta/pedidos/${encodeURIComponent(code)}`} className="receipt-secondary">Ver en mi cuenta</Link> : null}
          <button type="button" onClick={dismiss} className="receipt-link">Seguir comprando</button>
        </div>
        <p className="receipt-note">Guarda este código por si necesitas consultar tu pedido.</p>
      </div>
    </section>
  );
}
