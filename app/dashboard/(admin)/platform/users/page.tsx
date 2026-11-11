import { gatePlatformPage } from '@/features/dashboard/lib/platformGate';
import { UserListPage } from "@/features/platform/users/screens/UserListPage";

export default gatePlatformPage('users', UserListPage);
