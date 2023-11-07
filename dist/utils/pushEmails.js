import { supabase } from "./supabase.js";
export async function pushEmails(emails) {
    const { data, error } = await supabase.from("email_summaries").insert(emails);
    console.log(data, error);
}
//# sourceMappingURL=pushEmails.js.map