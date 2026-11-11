import { gatePlatformPage } from '@/features/dashboard/lib/platformGate';
import { BuylistPage } from '@/features/platform/card-shop/screens/BuylistPage';
import { DeskQueues } from '@/features/platform/collectibles/screens/CollectiblesWorkbenchPage';

function Page() {
  return <BuylistPage workbench={<DeskQueues kind="buylist" />} />;
}

export default gatePlatformPage('buylist', Page);
