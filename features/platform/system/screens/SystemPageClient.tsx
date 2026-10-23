"use client";

import { PageContainer } from "../../../dashboard/components/PageContainer";
import { SystemTabs, TabType } from "../components/SystemTabs";
import { PageTitle } from "../../components/vault-ui";

interface SystemPageClientProps {
  list: any;
  initialTab: TabType;
}

export function SystemPageClient({
  list,
  initialTab,
}: SystemPageClientProps) {

  return (
    <PageContainer
      header={<PageTitle title="System Configuration" />}
    >
      <SystemTabs
        initialTab={initialTab}
        list={list}
      />
    </PageContainer>
  );
}