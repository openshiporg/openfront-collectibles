import { gatePlatformPage } from '@/features/dashboard/lib/platformGate';
import { OrderListPage } from "@/features/platform/orders/screens/OrderListPage";

export default gatePlatformPage('orders', OrderListPage);