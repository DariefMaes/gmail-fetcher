import { supabase } from "./supabase.js";

export const fetchLastEmail = async (userId: string) => {
  const lastEmailId = await supabase
    .from("email_summaries")
    .select("email_date, email_id, thread_id")
    .order("email_date", { ascending: false })
    .limit(1)
    .single();

  return lastEmailId.data;
};
