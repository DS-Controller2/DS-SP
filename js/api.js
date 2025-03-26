// js/api.js

// --- Configuration ---
// This should work when frontend & API are deployed on the same Vercel project.
// If deploying frontend elsewhere (like GitHub Pages), use the full Vercel function URL.
// Example: const API_BASE_URL = 'https://your-project-name.vercel.app/api';
const API_BASE_URL = '/api';

// --- Sample Data (Fallback) ---
// Keeping sample words as a potential fallback if the API fails catastrophically,
// although throwing an error might be preferred.
const sampleWords = [
    "apple", "banana", "cherry", "date", "elderberry", "fig", "grape", "honeydew",
    "kiwi", "lemon", "mango", "nectarine", "orange", "papaya", "quince", "raspberry",
    "strawberry", "tangerine", "ugli", "vanilla", "watermelon", "xigua", "yam", "zucchini",
    "ability", "believe", "context", "develop", "example", "function", "generate", "however",
    "implement", "javascript", "keyboard", "language", "module", "navigate", "object", "practice"
];


/**
 * Fetches a batch of words from the serverless function.
 * @param {number} count - Number of words to fetch.
 * @returns {Promise<string[]>} A promise that resolves to an array of words.
 * @throws {Error} If the fetch fails or the response is invalid.
 */
export async function fetchWordsFromServer(count = 20) {
    console.log(`API: Fetching ${count} words from ${API_BASE_URL}/get-word...`);

    try {
        const response = await fetch(`${API_BASE_URL}/get-word?count=${count}`);

        if (!response.ok) {
            // Try getting error details from response body if available
            let errorDetails = `HTTP error! status: ${response.status}`;
            try {
                const errorData = await response.json();
                errorDetails = errorData.details || errorData.error || errorDetails;
            } catch (e) { /* Ignore if response body isn't valid JSON */ }
            throw new Error(errorDetails);
        }

        const data = await response.json(); // Expecting { words: ["word1", "word2"] }

        if (!data || !Array.isArray(data.words) || data.words.length === 0) {
             throw new Error("Invalid or empty words array received from API");
        }

        console.log("API: Words received:", data.words.length);
        return data.words;

    } catch (error) {
        console.error("API Error fetching words:", error);
        // Re-throw the error to be handled by the calling function (in script.js)
        // This allows the UI to show a specific error message.
        throw new Error(`Failed to fetch words: ${error.message}`);
        // --- Alternative: Fallback to sample words (less ideal as it hides errors) ---
        // console.warn("API: Falling back to sample words due to error.");
        // return sampleWords.sort(() => 0.5 - Math.random()).slice(0, count);
    }
}

/**
 * Fetches word suggestions based on errors from the serverless function.
 * @param {object} errors - Object detailing user's errors.
 * @returns {Promise<string[]>} A promise that resolves to an array of suggested words. Returns empty array on failure.
 */
export async function fetchSuggestionsFromServer(errors) {
    console.log(`API: Fetching suggestions from ${API_BASE_URL}/get-suggestions based on errors:`, errors);

    try {
        const response = await fetch(`${API_BASE_URL}/get-suggestions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ errors }) // Send errors in the request body
        });

        if (!response.ok) {
             // Try getting error details from response body
            let errorDetails = `HTTP error! status: ${response.status}`;
             try {
                 const errorData = await response.json();
                 errorDetails = errorData.details || errorData.error || errorDetails;
             } catch (e) { /* Ignore */ }
            throw new Error(errorDetails);
        }

        const data = await response.json(); // Expecting { suggestions: ["word1", "word2"] }

        // Return suggestions or empty array if missing/invalid
        const suggestions = (data && Array.isArray(data.suggestions)) ? data.suggestions : [];
        console.log("API: Suggestions received:", suggestions);
        return suggestions;

    } catch (error) {
        console.error("API Error fetching suggestions:", error);
        // Return empty array on error - the suggestions are optional/enhancement
        return [];
    }
}
