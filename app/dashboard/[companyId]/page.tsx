import { redirect } from "next/navigation";

/**
 * Creator Dashboard Root Page
 *
 * Redirects to the overview page which contains the actual dashboard content.
 * This keeps the URL structure clean while providing a proper landing page.
 */
export default async function DashboardPage({
	params,
}: {
	params: Promise<{ companyId: string }>;
}) {
	const { companyId } = await params;

	// Redirect to the overview page
	redirect(`/dashboard/${companyId}/overview`);
}
