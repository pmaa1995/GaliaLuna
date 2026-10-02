import { requireAdminUser } from "../../../../lib/admin/auth";
import { getAdminMonthlySummary, listOrdersForExport } from "../../../../lib/orders/adminRepository";
import { formatMonthLabel, formatStoreDateTimeISO, STORE_TIME_ZONE } from "../../../../lib/orders/dates";
import { ORDER_STATUS_LABELS } from "../../../../lib/orders/types";
import { buildXlsx, XLSX_MIME } from "../../../../lib/xlsx";

export const dynamic = "force-dynamic";

export async function GET() {
  await requireAdminUser();
  const [{ orders, lines }, months] = await Promise.all([listOrdersForExport(), getAdminMonthlySummary(24)]);

  const file = buildXlsx([
    {
      name: "Pedidos",
      header: ["Código", "Fecha", "Estado", "Cliente", "Teléfono", "Correo", "Provincia", "Ciudad", "Dirección", "Piezas", "Total"],
      widths: [20, 17, 24, 26, 15, 28, 18, 20, 36, 8, 14],
      currencyColumns: [10],
      rows: orders.map((order) => [
        order.orderCode,
        formatStoreDateTimeISO(order.createdAt),
        ORDER_STATUS_LABELS[order.status] ?? order.status,
        order.fullName,
        order.phone,
        order.email,
        order.province,
        order.city,
        [order.addressLine1, order.addressLine2, order.sector].filter(Boolean).join(", "),
        order.itemCount,
        order.subtotalAmount,
      ]),
    },
    {
      name: "Piezas",
      header: ["Pedido", "Pieza", "Categoría", "Cantidad", "Precio", "Total"],
      widths: [20, 36, 14, 10, 14, 14],
      currencyColumns: [4, 5],
      rows: lines.map((line) => [line.orderCode, line.productName, line.productCategory, line.quantity, line.unitPrice, line.lineTotal]),
    },
    {
      name: "Resumen mensual",
      header: ["Mes", "Pedidos vendidos", "Vendido", "Pedidos por confirmar", "Por confirmar"],
      widths: [18, 17, 16, 21, 16],
      currencyColumns: [2, 4],
      rows: months.map((month) => [formatMonthLabel(month.month), month.soldOrders, month.soldAmount, month.pendingOrders, month.pendingAmount]),
    },
  ]);

  const today = new Intl.DateTimeFormat("sv-SE", { timeZone: STORE_TIME_ZONE }).format(new Date());
  return new Response(file, {
    headers: {
      "content-type": XLSX_MIME,
      "content-disposition": `attachment; filename="galia-luna-pedidos-${today}.xlsx"`,
      "cache-control": "no-store",
    },
  });
}
