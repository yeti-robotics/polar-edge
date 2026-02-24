import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@repo/ui/components/breadcrumb";
import { routes } from "@/lib/routes";

function EventOverviewPageBreadCrumbComponent() {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href={routes.analysis.root}>Analysis</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink href={routes.analysis.comparison}>event-overview</BreadcrumbLink>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}

export default function EventOverviewPage() {
  return (
    <div className="space-y-6">
      <span>
        <EventOverviewPageBreadCrumbComponent />
      </span>
      <h1 className="text-2xl font-bold tracking-tight mt-4">Event Overview</h1>
      <p className="text-muted-foreground">Skeleton for the event overview page here</p>
    </div>
  );
}
