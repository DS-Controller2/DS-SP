// api/get-word.js
import MistralClient from '@mistralai/mistralai';

// --- Configuration ---
const apiKey = process.env.MISTRAL_API_KEY;
// Choose a Mistral model suitable for generation (check availability/pricing)
const modelName = "mistral-tiny"; // Or "mistral-small", "mistral-medium", etc.

// Basic validation for the API key
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
    // Allow requests from your frontend domain (or '*' for development, but be specific in production)
    response.setHeader('Access-Control-Allow-Origin', '*'); // Adjust for production
    response.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle CORS preflight requests
    if (request.method === 'OPTIONS') {
        return response.status(200).end();
    }

    // Ensure it's a GET request
    if (request.method !== 'GET') {
        return response.status(405).json({ error: 'Method Not Allowed' });
    }

    // --- Get word count from query parameters ---
    const countParam = request.query.count;
    let wordCount = 20; // Default count
    if (countParam) {
        const parsedCount = parseInt(countParam, 10);
        // Add reasonable limits to count
        if (!isNaN(parsedCount) && parsedCount > 0 && parsedCount <= 50) {
            wordCount = parsedCount;
        } else {
            return response.status(400).json({ error: 'Invalid count parameter. Must be between 1 and 50.' });
        }
    }

    // --- Construct the Prompt ---
    // Prompt engineering is key here. Asking for JSON directly can work but might need parsing.
    const prompt = `Generate a list of exactly ${wordCount} common English words suitable for a spelling practice application.
Focus on words with moderate difficulty, typically between 5 and 12 letters long. Avoid proper nouns.
Return ONLY the words as a JSON formatted list (an array of strings) in your response. Example: ["word1", "word2", ...]`;

    console.log(`Requesting ${wordCount} words from Mistral model: ${modelName}`);

    try {
        // --- Call Mistral API ---
        const chatResponse = await client.chat({
            model: modelName,
            messages: [{ role: 'user', content: prompt }],
            // Optional: Add parameters like temperature if needed
            // temperature: 0.7,
        });

        // --- Process the Response ---
        if (!chatResponse || !chatResponse.choices || chatResponse.choices.length === 0) {
            throw new Error('Invalid response structure from Mistral API');
        }

        const messageContent = chatResponse.choices[0].message.content;
        console.log("Raw Mistral Response:", messageContent);

        // Attempt to parse the JSON array from the response content
        let words = [];
        try {
             // Try finding the JSON array within the text (in case the model adds extra text)
             const jsonMatch = messageContent.match(/\[\s*("[^"]*"(?:\s*,\s*"[^"]*")*)\s*\]/);
             if (jsonMatch && jsonMatch[0]) {
                 words = JSON.parse(jsonMatch[0]);
                 // Optional: Validate if we got roughly the correct number of words
                 if (words.length < wordCount * 0.8) { // Allow some flexibility
                     console.warn(`Mistral returned fewer words (${words.length}) than requested (${wordCount}).`);
                 }
             } else {
                 // Fallback: Try parsing the whole content if it looks like just the array
                 words = JSON.parse(messageContent);
             }
             // Ensure it's actually an array of strings
             if (!Array.isArray(words) || !words.every(w => typeof w === 'string')) {
                 throw new Error("Parsed response is not an array of strings.");
             }
        } catch (parseError) {
            console.error("Failed to parse JSON from Mistral response:", parseError);
            // Fallback: Try splitting by newline/comma if parsing fails (less reliable)
             words = messageContent.split(/[\n,]+/).map(w => w.trim().replace(/["']/g, '')).filter(w => w.length > 1);
             if(words.length === 0) {
                throw new Error(`Could not extract words from Mistral response: ${messageContent}`);
             }
             console.warn("Used fallback parsing method for words.");
        }


        // Limit to the requested count just in case
        words = words.slice(0, wordCount);

        // --- Send successful response ---
        return response.status(200).json({ words });

    } catch (error) {
        console.error("Error calling Mistral API or processing response:", error);
        // Determine if it's an API error or internal error
        const statusCode = error.status || 500; // Use error status if available (from Mistral client?)
        return response.status(statusCode).json({
            error: 'Failed to fetch words from AI service.',
            details: error.message // Provide some detail for debugging
        });
    }
}
