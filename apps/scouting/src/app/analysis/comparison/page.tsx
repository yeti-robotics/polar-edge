import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@repo/ui/components/breadcrumb";
import { routes } from "@/lib/routes";

function ComparisonPageBreadCrumbComponent() {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href={routes.analysis.root}>Analysis</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink href={routes.analysis.comparison}>Compare</BreadcrumbLink>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}

export default function ComparisonPage() {
  return (
    <div className="space-y-6">
      <span>
        <ComparisonPageBreadCrumbComponent />
      </span>
      <h1 className="text-2xl font-bold tracking-tight mt-4">Comparison</h1>
      <p className="text-muted-foreground">Skeleton for the comparison page here</p>
    </div>
  );
}
