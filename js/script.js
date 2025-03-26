// js/script.js
import * as api from './api.js';
import * as ui from './ui.js';

// --- State Variables ---
let words = []; // Array of words for the current test
let currentWordIndex = 0;
let currentLetterIndex = 0;
let startTime = null; // To calculate time elapsed
let timerInterval = null; // ID for setInterval
let correctChars = 0;
let incorrectChars = 0;
let totalTypedEntries = 0; // Includes correct, incorrect, backspace etc for WPM calc? (or just correct+incorrect)
let gameActive = false; // Flag to check if the test is running

// --- DOM Elements ---
const keyboardInput = document.getElementById('keyboard-input');
const restartButton = document.getElementById('restart-button');

// --- Constants ---
const WORDS_TO_FETCH = 30; // How many words to fetch at a time

// --- Core Functions ---

/**
 * Initialize or reset the spelling test.
 */
async function initializeApp() {
    console.log("Initializing app...");
    resetState();
    ui.resetUI();
    ui.showFeedbackMessage("Fetching words...", "info");

    try {
        words = await api.fetchWordsFromServer(WORDS_TO_FETCH);
        if (words.length === 0) {
            throw new Error("Failed to load words.");
        }
        ui.displayWords(words);
        // Set initial caret position
        currentWordIndex = 0;
        currentLetterIndex = 0;
        ui.updateCaretPosition(currentWordIndex, currentLetterIndex);
        ui.showFeedbackMessage(""); // Clear loading message

    } catch (error) {
        console.error("Initialization failed:", error);
        ui.showFeedbackMessage(`Error: ${error.message}`, "error");
    } finally {
        ui.focusInput(); // Ensure input is focused
    }
}

/**
 * Resets all state variables.
 */
function resetState() {
    words = [];
    currentWordIndex = 0;
    currentLetterIndex = 0;
    startTime = null;
    stopTimer(); // Clear any existing timer
    correctChars = 0;
    incorrectChars = 0;
    totalTypedEntries = 0;
    gameActive = false;
    // Clear local storage errors? Or keep them for personalization?
    // localStorage.removeItem('spellingErrors');
}

/**
 * Handles keydown events on the hidden input.
 * @param {KeyboardEvent} event
 */
function handleKeyDown(event) {
    const key = event.key;
    const currentWord = words[currentWordIndex];

    // Prevent default browser behavior for space, backspace etc.
    if (key === ' ' || key === 'Backspace' || (key.length === 1 && !event.ctrlKey && !event.metaKey)) {
        event.preventDefault();
    } else {
        return; // Ignore other keys like Shift, Ctrl, etc.
    }

    // Start timer on first valid keypress
    if (!gameActive && words.length > 0 && key !== 'Backspace') { // Don't start timer on backspace if nothing typed
        startGame();
    }
    if (!gameActive && key === 'Backspace') return; // Don't allow backspace before start
    if (!gameActive) return; // Don't process keys if game ended

    // --- Handle Character Input ---
    if (key.length === 1 && key !== ' ') {
        totalTypedEntries++;
        const expectedLetter = currentWord[currentLetterIndex];

        if (key === expectedLetter) {
            correctChars++;
            ui.updateLetterStatus(currentWordIndex, currentLetterIndex, 'correct');
        } else {
            incorrectChars++;
            ui.updateLetterStatus(currentWordIndex, currentLetterIndex, 'incorrect');
            // Optional: Record error details
            recordError(currentWord, expectedLetter, key, currentLetterIndex);
        }

        currentLetterIndex++;
        // Check if word is complete
        if (currentLetterIndex >= currentWord.length) {
             // Wait for spacebar to move to next word? Or move automatically?
             // Let's require spacebar for now. Caret stays at end.
             ui.updateCaretPosition(currentWordIndex, currentLetterIndex -1 ); // Keep caret visually at last letter
        } else {
            ui.updateCaretPosition(currentWordIndex, currentLetterIndex);
        }

    }
    // --- Handle Spacebar ---
    else if (key === ' ' && currentWord) {
        // Move to next word only if current word has been attempted (caret is at/past end)
        if (currentLetterIndex >= currentWord.length) {
             // Check if accuracy for the word was okay? Or just move on?
             moveToNextWord();
        } else {
             // Optional: Treat space mid-word as an error? For now, ignore.
        }
    }
    // --- Handle Backspace ---
    else if (key === 'Backspace' && currentWord) {
        if (currentLetterIndex > 0) {
             // Move caret back
             currentLetterIndex--;
             // Reset the status of the letter we are moving back to
             const previousStatus = ui.updateLetterStatus(currentWordIndex, currentLetterIndex, 'default');
             // Update caret position
             ui.updateCaretPosition(currentWordIndex, currentLetterIndex);
             // Decrement counts? Be careful here. If you just correct an error, should it still count?
             // Simple approach: Just allow visual correction, don't change stats on backspace.
        } else if (currentWordIndex > 0 && currentLetterIndex === 0) {
            // Optional: Allow backspacing to the previous word? More complex. For now, stop at start of word.
        }
    }

     // Recalculate stats after each valid key affecting counts
     if (key !== 'Backspace') { // Avoid recalculating on backspace if not changing stats
         calculateAndUpdateStats();
     }

    // Check if test is finished
     if (currentWordIndex >= words.length) {
        endGame();
     }
}

/**
 * Moves logic to the next word.
 */
function moveToNextWord() {
    if (currentWordIndex < words.length - 1) {
        currentWordIndex++;
        currentLetterIndex = 0;
        ui.updateCaretPosition(currentWordIndex, currentLetterIndex);
    } else {
        // Reached end of the fetched words
        endGame();
    }
}

/**
 * Starts the timer and sets game state to active.
 */
function startGame() {
    if (gameActive) return;
    console.log("Game started!");
    gameActive = true;
    startTime = Date.now();
    // Update timer every second
    timerInterval = setInterval(() => {
        calculateAndUpdateStats();
         // Optional: Check for time limit and end game
    }, 1000);
    calculateAndUpdateStats(); // Initial calculation
}

/**
 * Stops the timer and ends the game.
 */
function endGame() {
    if (!gameActive) return;
    console.log("Game ended!");
    stopTimer();
    gameActive = false;
    keyboardInput.disabled = true; // Disable input
    restartButton.disabled = false; // Ensure restart is enabled
    calculateAndUpdateStats(); // Final calculation
    ui.showFeedbackMessage("Test Complete! Press Restart.", "info");
    // Suggest new words based on errors?
    // suggestPracticeWords();
}

/**
 * Stops the timer interval.
 */
function stopTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

/**
 * Calculates WPM and Accuracy and updates the UI.
 */
function calculateAndUpdateStats() {
    if (!startTime) {
        ui.updateStats(); // Show default stats if timer hasn't started
        return;
    }

    const now = Date.now();
    const timeElapsedSeconds = (now - startTime) / 1000;
    const timeElapsedMinutes = timeElapsedSeconds / 60;

    // WPM Calculation (Standard: (chars typed / 5) / time in minutes)
    // Decide if totalTypedEntries includes backspaces or only correct/incorrect chars. Let's use correct+incorrect.
    const grossWpm = timeElapsedMinutes > 0 ? Math.round(((correctChars + incorrectChars) / 5) / timeElapsedMinutes) : 0;
    // More accurate WPM might subtract penalty for errors

    // Accuracy Calculation
    const totalCharsAttempted = correctChars + incorrectChars;
    const accuracy = totalCharsAttempted > 0 ? Math.round((correctChars / totalCharsAttempted) * 100) : 100; // Avoid NaN

    // Format time
    const minutes = Math.floor(timeElapsedSeconds / 60);
    const seconds = Math.floor(timeElapsedSeconds % 60).toString().padStart(2, '0');
    const formattedTime = `${minutes}:${seconds}`;

    ui.updateStats({ time: formattedTime, wpm: grossWpm, accuracy: accuracy });
}

/**
 * Records error details (e.g., to localStorage for personalization).
 */
function recordError(word, expected, typed, position) {
    console.log(`Error in word "${word}": expected "${expected}", typed "${typed}" at index ${position}`);
    // --- Basic LocalStorage Example ---
    try {
        const errors = JSON.parse(localStorage.getItem('spellingErrors') || '{}');
        if (!errors[word]) {
            errors[word] = { count: 0, details: [] };
        }
        errors[word].count++;
        // Avoid storing too many details, maybe just last few
        errors[word].details.push({ expected, typed, position, timestamp: Date.now() });
        if (errors[word].details.length > 5) errors[word].details.shift(); // Keep last 5 details

        localStorage.setItem('spellingErrors', JSON.stringify(errors));
    } catch (e) {
        console.error("Failed to record error in localStorage:", e);
    }
}

/**
 * Fetches and potentially displays suggested practice words.
 */
async function suggestPracticeWords() {
     try {
         const errors = JSON.parse(localStorage.getItem('spellingErrors') || '{}');
         if (Object.keys(errors).length > 0) {
             const suggestions = await api.fetchSuggestionsFromServer(errors);
             if (suggestions.length > 0) {
                 // TODO: Decide how to display/use suggestions
                 ui.showFeedbackMessage(`Practice suggestions based on errors: ${suggestions.join(', ')}`, "info");
             }
         }
     } catch(e) {
          console.error("Failed to get suggestions:", e);
     }
}


// --- Event Listeners ---
document.addEventListener('DOMContentLoaded', initializeApp);
keyboardInput.addEventListener('keydown', handleKeyDown);
restartButton.addEventListener('click', initializeApp);

// Keep input focused (important!)
// Refocus if user clicks outside
document.addEventListener('click', (e) => {
    if (e.target !== keyboardInput) { // Avoid refocusing if clicking input itself
       ui.focusInput();
    }
});
// Also consider refocusing on window blur/focus events


console.log("Spelling Practice script loaded.");
