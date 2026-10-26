import { BuylistPage } from '@/features/platform/card-shop/screens/BuylistPage';
import { DeskQueues } from '@/features/platform/collectibles/screens/CollectiblesWorkbenchPage';

export default function Page() {
  return <BuylistPage workbench={<DeskQueues kind="buylist" />} />;
}
