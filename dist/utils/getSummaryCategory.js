import { config } from "dotenv";
import { OpenAI } from "langchain/llms/openai";
import { LLMChain, SequentialChain } from "langchain/chains";
import { PromptTemplate } from "langchain/prompts";
config();
const llm = new OpenAI({ temperature: 0.1, modelName: "gpt-3.5-turbo" });
const prompt_template = new PromptTemplate({
    template: 'Provide a 35-word MAX summary of the following email, focusing on the primary content. Refrain from including any mention of unsubscribing or reference the email itself.\nExample summaries:\nThe "Ultimate Wealth Creation Edge" event on economic strategies is available for free replay for 48 hours, with bonus content from Robert Kiyosaki\'s book for registrants.\n-Various SaaS startups are available for sale, including a theft apprehension software, translation agency, AI-powered platform, and more. Prices range from $25,000 to $2,100,000.\n- The monthly sales report for August 2023 is ready for review. Highlights include a 15% increase in overall sales, top-performing products, and individual sales achievements. Action items include reviewing the report, identifying key takeaways, and attending a sales review meeting.\nEmail:{email}',
    inputVariables: ["email"],
});
const categories_template = new PromptTemplate({
    template: '###Your are to act as a persona called CLASIFY. You use extreme intellect to analyse emails and categorize them. You always only provide a category if it is a direct fit with the description of the category provided in this prompt. When nothing fits, you cleverly return nothing.\n\nGiven the available categories below, BASED ON THEIR DESCRIPTION, analyze the email and follow the next steps. \n\nIf there is a DIRECT FIT between the email content and a cateogry description, return the cateogry in a JSON array.\nIf there is a DIRECT FIT between the email content and multiple category descriptions, return all categories that FIT in a JSON array.\nIf there is NO DIRECT FIT between email content and a category description, return an EMPTY JSON array.\n\nDO NOT find the best fit email.\n\nAvailable categories: Events: "Emails detailing dates, locations, and details of upcoming gatherings or occasions.", High Priority: "Emails requiring immediate attention or action due to their critical importance." Promotion: "Emails showcasing special offers, discounts, or limited-time deals to engage recipients.", Buyers: "REQUESTS from individuals expressing interest, inquiries, or intent to purchase properties.", Sellers: "REQUESTS from individuals or entities expressing the intent to enlist their property for sale, seeking realtor expertise or guidance on property listing and promotion.", Partnerships: "Emails inquiring on possibility of a partnership or collaboration between the receiver and the sender."\nEmail: {summary}\nCategories chosen:',
    inputVariables: ["summary"],
});
export const getSummaryCategory = async ({ email, userId, }) => {
    // console.log("prompt_template:",prompt_template)
    try {
        if (!email) {
            return;
        }
        // console.log(email);
        const summary_chain = new LLMChain({
            llm,
            prompt: prompt_template,
            outputKey: "summary",
        });
        const categories_chain = new LLMChain({
            llm,
            prompt: categories_template,
            outputKey: "categories",
        });
        const chain = new SequentialChain({
            chains: [summary_chain, categories_chain],
            inputVariables: ["email"],
            outputVariables: ["summary", "categories"],
        });
        const res = await chain.call({
            email: email.email,
        });
        return {
            summary: res.summary,
            categories: JSON.parse(res.categories),
            thread_id: email.id,
            email_id: email.last_message_id,
            email_date: email.date,
            from_name: email.from_name,
            subject: email.subject,
            user_id: userId,
            // ...email,
        };
        // console.log(allEmails);
    }
    catch (error) {
        console.error(error);
    }
};
//# sourceMappingURL=getSummaryCategory.js.map