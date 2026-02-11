import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@repo/ui/components/breadcrumb";

export default function BreadCrumbComponent() {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="/analysis/overview"> Analysis </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink href="/analysis/overview/team">Teams</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        {/* <BreadcrumbItem>
    
          <BreadcrumbPage>Team Details</BreadcrumbPage>
        </BreadcrumbItem>
        <BreadcrumbItem>Analysis Page</BreadcrumbItem> */}
        {/* i need to contional render this  so that depending on the page */}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

// ask drew how one can render it the team details and anlsuyis page based on where the user is located
