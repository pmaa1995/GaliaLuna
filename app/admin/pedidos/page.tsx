import AdminOrdersView from "../../../components/admin/AdminOrdersView";
import StoreShell from "../../../components/store/StoreShell";
import { requireAdminUser } from "../../../lib/admin/auth";
import {
  getOrderDetailByCode,
  listOrdersForAdminPage,
} from "../../../lib/orders/adminRepository";
import { ORDER_STATUS_VALUES, type OrderStatus } from "../../../lib/orders/types";

type PageSearchParams = {
  estado?: string | string[];
  q?: string | string[];
  pedido?: string | string[];
  page?: string | string[];
};

const ADMIN_ORDERS_PAGE_SIZE = 12;

function pickFirst(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function parseStatusFilter(value: string | undefined): OrderStatus | "all" {
  if (!value) return "all";
  return (ORDER_STATUS_VALUES as readonly string[]).includes(value)
    ? (value as OrderStatus)
    : "all";
}

function parsePage(value: string | undefined) {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams?: Promise<PageSearchParams>;
}) {
  const adminUser = await requireAdminUser();

  const resolvedSearchParams = await searchParams;
  const statusFilter = parseStatusFilter(pickFirst(resolvedSearchParams?.estado));
  const q = (pickFirst(resolvedSearchParams?.q) ?? "").trim();
  const selectedOrderCode = (pickFirst(resolvedSearchParams?.pedido) ?? "").trim();
  const page = parsePage(pickFirst(resolvedSearchParams?.page));

  const [ordersPage, selectedOrder] = await Promise.all([
    listOrdersForAdminPage({
      status: statusFilter,
      q,
      page,
      pageSize: ADMIN_ORDERS_PAGE_SIZE,
    }),
    selectedOrderCode ? getOrderDetailByCode(selectedOrderCode) : Promise.resolve(null),
  ]);

  return (
    <StoreShell>
      <AdminOrdersView
        adminEmail={
          adminUser.primaryEmailAddress?.emailAddress ??
          adminUser.emailAddresses?.[0]?.emailAddress ??
          "Admin"
        }
        orders={ordersPage.orders}
        total={ordersPage.total}
        page={ordersPage.page}
        pageSize={ordersPage.pageSize}
        hasPreviousPage={ordersPage.hasPreviousPage}
        hasNextPage={ordersPage.hasNextPage}
        statusFilter={statusFilter}
        q={q}
        selectedOrder={selectedOrder}
      />
    </StoreShell>
  );
}
