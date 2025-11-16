"use server";

import { StandForm2021Data, standForm2021Schema } from "../data/schema";

//Mock Data form submission for the 2021 stand form
//For the most part I used what we had before in the past stand form I tried faking that data
//StandForm2021Data is the type of the data that is being submitted
//Promise<{success: boolean; error?: string;}> is the type of the return value
export async function submitStandForm2021(data: StandForm2021Data): Promise<{ // This is the return type of the function
	success: boolean;
	error?: string; //optional = ?
}> {
	try {
		const { success: isValid, data: validatedData } = standForm2021Schema.safeParse(data); // This is the validation of the data
		
		if (!isValid)//not valid so return false and the error 
		{
			return {
				success: false,
				error: "Invalid form data, ERROR",
			};
		}
		
		// Store in localStorage for persistence (for demo purposes) (Done by AutoComplete!)
		if (typeof window !== "undefined") {
			const existing = localStorage.getItem("scout2021_submissions");
			const submissions = existing ? JSON.parse(existing) : [];
			submissions.push({
				id: `sub_${Date.now()}`,
				timestamp: new Date().toISOString(),
				...validatedData,
			});
			localStorage.setItem("scout2021_submissions", JSON.stringify(submissions));
		}
		
		return {
			success: true,
		};
	} catch (error) {
		console.error("Form submission error:", error);
		return {
			success: false,
			error: "Form submission failed",
		};
	}
}

