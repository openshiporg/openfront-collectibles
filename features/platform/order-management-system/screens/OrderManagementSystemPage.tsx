import { PageBreadcrumbs } from "@/features/dashboard/components/PageBreadcrumbs";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Dot, ListBand, PageTitle } from "../../components/vault-ui";
import { OAuthInstallDialog } from "../components/OAuthInstallDialog";

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function OrderManagementSystemPage({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams;

  // Check if install popup should be shown
  const shouldShowInstall = resolvedSearchParams.install === "true";

  // OAuth parameters for installation
  const oauthParams = shouldShowInstall
    ? {
        clientId: typeof resolvedSearchParams.client_id === "string" ? resolvedSearchParams.client_id : "",
        scope: typeof resolvedSearchParams.scope === "string" ? resolvedSearchParams.scope : "",
        redirectUri: typeof resolvedSearchParams.redirect_uri === "string" ? resolvedSearchParams.redirect_uri : "",
        state: typeof resolvedSearchParams.state === "string" ? resolvedSearchParams.state : "",
        responseType: typeof resolvedSearchParams.response_type === "string" ? resolvedSearchParams.response_type : "",
      }
    : null;

  return (
    <section
      aria-label="Order Management System overview"
      className="overflow-hidden flex flex-col"
    >
      <PageBreadcrumbs
        items={[
          {
            type: "link",
            label: "Dashboard",
            href: "/",
          },
          {
            type: "page",
            label: "Platform",
          },
          {
            type: "page",
            label: "Order Management System",
          },
        ]}
      />

      <div className="flex flex-col flex-1 min-h-0">
        <div className="px-4 md:px-6 pt-4 md:pt-6 pb-4">
          <PageTitle title="Order Management System" />
        </div>

        <div className="flex-1 overflow-auto px-4 pb-6 md:px-6">
          <ListBand>
            <div className="flex items-baseline gap-2.5 px-4 py-3 text-sm text-foreground">
              <Dot tone={shouldShowInstall ? "info" : "muted"} />
              {shouldShowInstall ? "Installation requested" : "No installation requested"}
            </div>
            <Link
              href="/dashboard/platform/apps"
              className="group flex min-h-11 items-center justify-between gap-4 px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-background/60"
            >
              Apps
              <ArrowUpRight className="size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground" />
            </Link>
          </ListBand>
        </div>
      </div>

      {/* OAuth Install Dialog */}
      {shouldShowInstall && oauthParams && (
        <OAuthInstallDialog 
          isOpen={true}
          oauthParams={oauthParams}
        />
      )}
    </section>
  );
}