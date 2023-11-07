import { schedule } from "node-cron";

import { config } from "dotenv";
import { supabase } from "./utils/supabase.js";
import { processUser } from "./utils/processUser.js";

config();

// const email =
//   "Dear DreamHomes Realty, We noticed water damage at the property on 2233 Pinecrest Lane, which is currently under your listing. Immediate action is required to prevent further damage. Please address this urgently. Regards, Alan Greene, NextDoor Neighbor";

const main = async () => {
  //Get all user ids
  const { data: adminUsers, error: usersError } = await supabase
    .from("users")
    .select("user_id")
    .eq("role", "ADMIN");

  if (usersError) {
    console.error("Error fetching admin users:", usersError);
    // return;
  }

  // Get all user tokens
  const userTokens = adminUsers.map((user) => processUser(user.user_id));
  const results = await Promise.all(userTokens);

  // const { data: googleApiData, error: apiError } = await supabase
  //   .from("googleApi")
  //   .select("access_token, refresh_token, user_id")
  //   .in("user_id", adminUserIds);
  // const emailPromises = googleApiData.map(fetchLastEmail);
  // const allEmails = await Promise.all(emailPromises);
  // const { data: summarizedEmails } = await supabase
  //   .from("email_summaries")
  //   .select("*")
  //   .eq("user_id", adminUserIds[0])
  //   .single();

  // console.log(results);
  // console.log(results[0][0]);
};

const task = schedule("* * * * *", async () => {
  console.log("running");
  main();
});

task.start();
