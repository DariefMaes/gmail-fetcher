import { fetchEmails } from "./fetchEmails.js";
import { getSummaryCategory } from "./getSummaryCategory.js";
import { pushEmails } from "./pushEmails.js";
import { supabase } from "./supabase.js";
import { config } from "dotenv";
config();
export const processUser = async (userId) => {
    const { data: googleApiData, error: apiError } = await supabase
        .from("googleApi")
        .select("access_token, refresh_token, user_id")
        .eq("user_id", userId)
        .single();
    await supabase.auth.refreshSession({
        refresh_token: googleApiData.refresh_token,
    });
    if (apiError) {
        console.error("Error fetching Google API data:", apiError);
        return;
    }
    //Get all user emails
    const emails = await Promise.all(await fetchEmails(googleApiData));
    const emailResults = [].concat(...emails);
    console.log(emailResults);
    //Summarize and categorize emails
    const categories = emailResults.map((result) => getSummaryCategory({ email: result, userId }));
    const categoriesFetched = await Promise.all(categories);
    console.log(categoriesFetched);
    // Push emails to Supabase
    await pushEmails(categoriesFetched);
};
//# sourceMappingURL=processUser.js.map