import {
  getLatestInProgressOrderForCustomer,
  listOrderSummariesForCustomerPage,
} from "../../lib/orders/customerRepository";
import AccountOrderList from "./AccountOrderList";

const COMPACT_PAGE_SIZE = 5;
const FULL_PAGE_SIZE = 10;

export default async function AccountOrderHistoryPanel({
  clerkUserId,
  page = 1,
  mode = "compact",
}: {
  clerkUserId: string;
  page?: number;
  mode?: "compact" | "full";
}) {
  const safePage = Number.isFinite(page) ? Math.max(1, Math.floor(page)) : 1;
  const isCompact = mode === "compact";
  const pageSize = isCompact ? COMPACT_PAGE_SIZE : FULL_PAGE_SIZE;
  const currentPage = isCompact ? 1 : safePage;

  const [historyPage, inProgressOrder] = await Promise.all([
    listOrderSummariesForCustomerPage({
      clerkUserId,
      page: currentPage,
      pageSize,
      includeTotal: !isCompact,
    }),
    getLatestInProgressOrderForCustomer(clerkUserId),
  ]);

  return (
    <AccountOrderList
      mode={mode}
      orders={historyPage.orders}
      inProgressOrder={inProgressOrder}
      total={historyPage.total}
      page={historyPage.page}
      pageSize={historyPage.pageSize}
      hasPreviousPage={historyPage.hasPreviousPage}
      hasNextPage={historyPage.hasNextPage}
    />
  );
}
