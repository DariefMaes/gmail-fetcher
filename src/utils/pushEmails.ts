import { supabase } from "./supabase.js";

interface Email {
  summary: any;
  categories: any;
  thread_id: string;
  email_id: string;
  email_date: string;
  from_name: any;
  subject: string;
}

export async function pushEmails(emails: Email[]) {
  const { data, error } = await supabase.from("email_summaries").insert(emails);

  console.log(data, error);
}
