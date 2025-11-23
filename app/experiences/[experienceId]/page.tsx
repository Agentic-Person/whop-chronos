import { redirect } from "next/navigation";

/**
 * Student Experience Root Page
 *
 * Redirects to the courses page which is the main landing for students.
 * This keeps the URL structure clean while providing a proper landing page.
 */
export default async function ExperiencePage({
	params,
}: {
	params: Promise<{ experienceId: string }>;
}) {
	const { experienceId } = await params;

	// Redirect to the courses page
	redirect(`/experiences/${experienceId}/courses`);
}
