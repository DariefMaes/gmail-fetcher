import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
config();

export const supabase = createClient(
  process.env.SUPABASE_URL as string,
  process.env.SUPABASE_SECRET as string,
  {
    auth: {
      persistSession: false,
    },
  }
);
