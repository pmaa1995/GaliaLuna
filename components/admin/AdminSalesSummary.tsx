import { Download } from "lucide-react";

import type { AdminMonthSummary } from "../../lib/orders/adminRepository";
import { formatMonthLabel } from "../../lib/orders/dates";
import { formatDOP } from "../../types/product";

const capitalize = (text: string) => text.charAt(0).toLocaleUpperCase("es") + text.slice(1);
const orders = (count: number) => `${count} ${count === 1 ? "pedido" : "pedidos"}`;

// Three figures at a glance; the yearly breakdown stays folded until asked for.
export default function AdminSalesSummary({ months }: { months: AdminMonthSummary[] }) {
  const [current, previous] = months;
  if (!current) return null;
  const pendingOrders = months.reduce((total, month) => total + month.pendingOrders, 0);
  const pendingAmount = months.reduce((total, month) => total + month.pendingAmount, 0);
  const best = Math.max(1, ...months.map((month) => month.soldAmount));
  return (
    <section className="adm-stats" aria-labelledby="adm-stats-title">
      <div className="adm-stats-head">
        <div>
          <p className="shop-eyebrow">RESUMEN DE VENTAS</p>
          <h2 id="adm-stats-title">{capitalize(formatMonthLabel(current.month))}</h2>
        </div>
        <a href="/admin/pedidos/exportar" className="adm-btn" download><Download size={15} aria-hidden="true" />Descargar Excel</a>
      </div>
      <dl className="adm-stats-grid">
        <div>
          <dt>Vendido este mes</dt>
          <dd>{formatDOP(current.soldAmount)}</dd>
          <p>{orders(current.soldOrders)} confirmados</p>
        </div>
        <div>
          <dt>Por confirmar</dt>
          <dd>{formatDOP(pendingAmount)}</dd>
          <p>{orders(pendingOrders)} esperando respuesta</p>
        </div>
        {previous ? (
          <div>
            <dt>{capitalize(formatMonthLabel(previous.month))}</dt>
            <dd>{formatDOP(previous.soldAmount)}</dd>
            <p>{orders(previous.soldOrders)} confirmados</p>
          </div>
        ) : null}
      </dl>
      <details className="adm-months">
        <summary>Ver los últimos {months.length} meses</summary>
        <ol>
          {months.map((month) => (
            <li key={month.month}>
              <span>{capitalize(formatMonthLabel(month.month))}</span>
              <span className="adm-bar" aria-hidden="true"><span style={{ width: `${(month.soldAmount / best) * 100}%` }} /></span>
              <span>{formatDOP(month.soldAmount)}</span>
              <span className="adm-months-count">{orders(month.soldOrders)}</span>
            </li>
          ))}
        </ol>
        <p className="adm-note">Vendido incluye pedidos confirmados, en preparación, enviados y entregados. Los cancelados no cuentan.</p>
      </details>
    </section>
  );
}
