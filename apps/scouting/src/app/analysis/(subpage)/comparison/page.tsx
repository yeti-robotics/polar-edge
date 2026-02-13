import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@repo/ui/components/breadcrumb";

function ComparisonPageBreadCrumbComponent() {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="/analysis">Analysis</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink href="/analysis/comparison">Compare</BreadcrumbLink>
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
      <p className="text-muted-foreground">
        Skeleton for the comparison page here
      </p>
    </div>
  );
}
