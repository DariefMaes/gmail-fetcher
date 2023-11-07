import { google } from "googleapis";
import { supabase } from "./supabase.js";
import { htmlToText } from "html-to-text";
import { fetchLastEmail } from "./fetchLastEmail.js";
function dateToEpochSeconds(date) {
    // Convert the date to milliseconds since the epoch, then to seconds
    return Math.floor(date.getTime() / 1000);
}
// Example usage:
function extractNameAndEmail(input) {
    // Regular expression to match name and email address within a string
    const regex = /(?:"?([^"<]+)"?\s*<)?([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/;
    const match = input.match(regex);
    if (match) {
        return {
            name: match[1] || null,
            email: match[2],
        };
    }
    return null; // or whatever default/fallback behavior you want
}
const findHeader = (headers, value) => {
    return headers.find((header) => header.name === value)?.value;
};
const cleanEmail = (email) => {
    // 1. Remove any URL links
    const urlsRemoved = email.replace(/https?:\/\/[^\s]+/g, "");
    // 2. Replace the sequence \r\n with a space
    const crlfRemoved = urlsRemoved.replace(/\r\n/g, " ");
    // 3. Remove non-width spaces and other unwanted characters
    // (e.g., special control characters or others you deem unwanted)
    const unwantedCharsRemoved = crlfRemoved.replace(/[\u200B\u0000-\u001F\u007F-\u009F]/g, "");
    // 4. Trim any leading/trailing whitespace
    const cleanedEmail = unwantedCharsRemoved.trim();
    // 5. Remove any repeated line breaks (optional based on preference)
    const reducedLinebreaks = cleanedEmail.replace(/\n{2,}/g, "\n");
    return reducedLinebreaks;
};
const findPlainTextOrHTML = (emailOrPart) => {
    // If this part/email has body data and it's text/plain
    if (emailOrPart.body &&
        emailOrPart.body.data &&
        emailOrPart.mimeType === "text/plain") {
        return cleanEmail(Buffer.from(emailOrPart.body.data, "base64").toString("utf-8"));
    }
    // If this part/email has body data and it's text/html
    if (emailOrPart.body &&
        emailOrPart.body.data &&
        emailOrPart.mimeType === "text/html") {
        const htmlContent = Buffer.from(emailOrPart.body.data, "base64").toString("utf-8");
        return cleanEmail(htmlToText(htmlContent));
    }
    // If this part/email has nested parts, go deeper
    if (emailOrPart.parts) {
        for (let innerPart of emailOrPart.parts) {
            const content = findPlainTextOrHTML(innerPart);
            if (content)
                return cleanEmail(content); // Return the first text/plain or text/html found
        }
    }
    // If the email has a payload, check inside the payload
    if (emailOrPart.payload) {
        return findPlainTextOrHTML(emailOrPart.payload);
    }
    return null; // If no content is found, return null
};
export const fetchEmails = async (data) => {
    const oauth2Client = new google.auth.OAuth2({
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        redirectUri: `${process.env.BASE_URL}/auth/callback`,
    });
    oauth2Client.setCredentials({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
    });
    oauth2Client.on("tokens", async (newTokens) => {
        await supabase.from("googleApi").upsert({
            user_id: data.user_id,
            access_token: newTokens.access_token,
            refresh_token: newTokens.refresh_token,
        }, {
            onConflict: "user_id",
            ignoreDuplicates: false,
        });
    });
    const gmail = google.gmail({ version: "v1", auth: oauth2Client });
    const latestEmail = await fetchLastEmail(data.user_id);
    let query;
    if (!latestEmail || !latestEmail.email_date) {
        console.log("true");
        // If summarizedEmails.data is null, fetch emails from the last 24 hours
        const oneDayAgo = new Date();
        oneDayAgo.setDate(oneDayAgo.getDate() - 1);
        query = `-label:SOCIAL -label:PROMOTIONS -label:FORUMS after:${Math.floor(oneDayAgo.getTime() / 1000)}`;
    }
    else {
        const emailDate = new Date(latestEmail.email_date);
        // Otherwise, fetch emails after a specific email id
        console.log("Latest email", latestEmail.email_id, dateToEpochSeconds(emailDate));
        query = `-label:SOCIAL -label:PROMOTIONS -label:FORUMS after:${dateToEpochSeconds(emailDate).toString()}`;
    }
    console.log("query", query);
    console.log("latestEmail", latestEmail);
    const threads = await gmail.users.threads.list({
        userId: "me",
        maxResults: 20,
        q: query,
    });
    // console.log("thread", threads);
    if (!threads.data.threads) {
        return [];
    }
    const fetchableThreads = threads.data.threads.filter((thread) => {
        return thread.id !== latestEmail?.thread_id;
    });
    const threadDetailsPromises = fetchableThreads.map((thread) => gmail.users.threads.get({ userId: "me", id: thread.id }));
    const threadDetails = await Promise.all(threadDetailsPromises);
    const latestEmails = threadDetails.map((thread) => {
        const messages = thread.data.messages;
        if (!messages) {
            return "";
        }
        const cleanedEmail = findPlainTextOrHTML(messages[messages.length - 1]);
        const headers = messages[messages.length - 1].payload.headers;
        const people_info = {
            from_name: extractNameAndEmail(findHeader(headers, "From")).name,
            from_email: extractNameAndEmail(findHeader(headers, "From")).email,
            to_name: extractNameAndEmail(findHeader(headers, "To")).name,
            to_email: extractNameAndEmail(findHeader(headers, "To")).email,
        };
        const response = {
            email: cleanedEmail,
            subject: findHeader(headers, "Subject"),
            from_name: people_info.from_name,
            from_email: people_info.from_email,
            to_name: people_info.to_name,
            to_email: people_info.to_email,
            date: new Date(findHeader(headers, "Date")).toISOString(),
            snippet: thread.data.messages[0].snippet,
            id: thread.data.id,
            last_message_id: messages[messages.length - 1].id,
        };
        return response;
    });
    return latestEmails;
};
//# sourceMappingURL=fetchEmails.js.map