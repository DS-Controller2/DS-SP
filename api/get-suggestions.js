// api/get-suggestions.js
import MistralClient from '@mistralai/mistralai';

// --- Configuration ---
const apiKey = process.env.MISTRAL_API_KEY;
const modelName = "mistral-tiny"; // Or choose a more capable model if needed

if (!apiKey) {
    throw new Error("MISTRAL_API_KEY environment variable is not set.");
}

const client = new MistralClient(apiKey);

/**
 * Vercel Serverless Function handler
 * @param {import('@vercel/node').VercelRequest} request
 * @param {import('@vercel/node').VercelResponse} response
 */
export default async function handler(request, response) {
    // Allow requests from your frontend domain (or '*' for development)
    response.setHeader('Access-Control-Allow-Origin', '*'); // Adjust for production
    response.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle CORS preflight requests
    if (request.method === 'OPTIONS') {
        return response.status(200).end();
    }

    // Ensure it's a POST request
    if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Method Not Allowed' });
    }

    // --- Get error data from request body ---
    const { errors } = request.body; // Expecting { errors: { word: { count: X, details: [...] }, ... } }

    if (!errors || typeof errors !== 'object' || Object.keys(errors).length === 0) {
        return response.status(400).json({ error: 'Invalid or missing "errors" data in request body.' });
    }

    // --- Configuration for Suggestions ---
    const suggestionCount = 5; // How many suggestions to ask for

    // --- Format Error Data for Prompt (optional, summarize if too large) ---
    let errorSummary;
    try {
         // Keep it simple for the prompt, maybe just list incorrect words
         const incorrectWords = Object.keys(errors);
         if (incorrectWords.length > 10) { // Limit prompt size
             errorSummary = `User frequently misspelled words like: ${incorrectWords.slice(0, 10).join(', ')}, and others.`;
         } else {
             errorSummary = `User made spelling errors on words including: ${incorrectWords.join(', ')}.`;
             // Optionally add more detail if needed and the model handles it well
             // errorSummary = `User made errors: ${JSON.stringify(errors, null, 2)}`;
         }
    } catch (e) {
        console.error("Error formatting error data:", e);
        return response.status(400).json({ error: 'Invalid error data format.' });
    }


    // --- Construct the Prompt ---
    const prompt = `Based on the following information about a user's recent spelling errors:
"${errorSummary}"

Suggest exactly ${suggestionCount} relevant English words for spelling practice. The suggestions should target spelling patterns, rules, or difficulties related to the types of errors the user might be making (e.g., vowel sounds, double letters, suffixes, common confusions evident from the errors). Prioritize moderately common words.

Return ONLY the suggested words as a JSON formatted list (an array of strings) in your response. Example: ["suggestion1", "suggestion2", ...]`;

    console.log(`Requesting ${suggestionCount} suggestions from Mistral model: ${modelName}`);

    try {
        // --- Call Mistral API ---
        const chatResponse = await client.chat({
            model: modelName,
            messages: [{ role: 'user', content: prompt }],
            // temperature: 0.6, // Maybe slightly lower temp for more focused suggestions
        });

        // --- Process the Response ---
        if (!chatResponse || !chatResponse.choices || chatResponse.choices.length === 0) {
            throw new Error('Invalid response structure from Mistral API');
        }

        const messageContent = chatResponse.choices[0].message.content;
        console.log("Raw Mistral Response (Suggestions):", messageContent);

        // Attempt to parse the JSON array
        let suggestions = [];
         try {
             const jsonMatch = messageContent.match(/\[\s*("[^"]*"(?:\s*,\s*"[^"]*")*)\s*\]/);
             if (jsonMatch && jsonMatch[0]) {
                 suggestions = JSON.parse(jsonMatch[0]);
             } else {
                 suggestions = JSON.parse(messageContent); // Try parsing whole string
             }
              if (!Array.isArray(suggestions) || !suggestions.every(s => typeof s === 'string')) {
                 throw new Error("Parsed response is not an array of strings.");
             }
        } catch (parseError) {
            console.error("Failed to parse JSON suggestions from Mistral response:", parseError);
             // Fallback parsing (less reliable)
             suggestions = messageContent.split(/[\n,]+/).map(w => w.trim().replace(/["']/g, '')).filter(w => w.length > 1);
             if(suggestions.length === 0) {
                // Don't throw error here, just return empty array if parsing fails
                 console.warn(`Could not extract suggestions from Mistral response: ${messageContent}`);
             } else {
                 console.warn("Used fallback parsing method for suggestions.");
             }
        }

        // Limit to requested count
        suggestions = suggestions.slice(0, suggestionCount);

        // --- Send successful response ---
        return response.status(200).json({ suggestions });

    } catch (error) {
        console.error("Error calling Mistral API for suggestions:", error);
        const statusCode = error.status || 500;
        return response.status(statusCode).json({
            error: 'Failed to fetch suggestions from AI service.',
            details: error.message
        });
    }
}
