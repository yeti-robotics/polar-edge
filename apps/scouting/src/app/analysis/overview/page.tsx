import { redirect } from "next/navigation";
import { routes } from "@/lib/routes";

function OverviewPage() {
  redirect(routes.analysis.root);
}

export default OverviewPage;
