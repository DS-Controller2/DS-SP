// js/ui.js

// --- DOM Elements ---
const wordDisplayArea = document.getElementById('word-display-area');
const keyboardInput = document.getElementById('keyboard-input');
const timerStat = document.getElementById('timer-stat');
const wpmStat = document.getElementById('wpm-stat');
const accuracyStat = document.getElementById('accuracy-stat');
const feedbackMessaging = document.getElementById('feedback-messaging');
const restartButton = document.getElementById('restart-button');
// Add other elements as needed

/**
 * Clears the word display and shows new words, creating spans for letters.
 * @param {string[]} wordsArray - An array of words to display.
 */
export function displayWords(wordsArray) {
    wordDisplayArea.innerHTML = ''; // Clear previous words
    wordsArray.forEach((word, wordIndex) => {
        const wordSpan = document.createElement('span');
        wordSpan.classList.add('word');
        wordSpan.dataset.wordIndex = wordIndex; // Store index for reference

        word.split('').forEach((letter, letterIndex) => {
            const letterSpan = document.createElement('span');
            letterSpan.classList.add('letter');
            letterSpan.textContent = letter;
            letterSpan.dataset.letterIndex = letterIndex; // Store index
            wordSpan.appendChild(letterSpan);
        });
        wordDisplayArea.appendChild(wordSpan);
        // Add space between words (except the last one)
        if (wordIndex < wordsArray.length - 1) {
            wordDisplayArea.appendChild(document.createTextNode(' ')); 
        }
    });
    feedbackMessaging.textContent = ''; // Clear feedback messages
}

/**
 * Updates the visual status (CSS class) of a specific letter span.
 * @param {number} wordIndex - The index of the word.
 * @param {number} letterIndex - The index of the letter within the word.
 * @param {'correct' | 'incorrect' | 'default'} status - The status to set.
 */
export function updateLetterStatus(wordIndex, letterIndex, status) {
    const letterSpan = wordDisplayArea.querySelector(`.word[data-word-index='${wordIndex}'] .letter[data-letter-index='${letterIndex}']`);
    if (letterSpan) {
        letterSpan.classList.remove('correct', 'incorrect'); // Remove previous status
        if (status !== 'default') {
            letterSpan.classList.add(status);
        }
    }
}

/**
 * Moves the caret ('.current' class) to the specified letter.
 * @param {number} wordIndex - The index of the word.
 * @param {number} letterIndex - The index of the letter.
 * @param {boolean} isEndOfLine - Optional flag if caret is at the very end.
 */
export function updateCaretPosition(wordIndex, letterIndex, isEndOfLine = false) {
    // Remove existing caret
    const currentCaret = wordDisplayArea.querySelector('.letter.current');
    if (currentCaret) {
        currentCaret.classList.remove('current');
    }

    // Add caret to new position
    if (!isEndOfLine) {
        const nextCaret = wordDisplayArea.querySelector(`.word[data-word-index='${wordIndex}'] .letter[data-letter-index='${letterIndex}']`);
        if (nextCaret) {
            nextCaret.classList.add('current');
             // Optional: Scroll the caret into view if the word line overflows
            // nextCaret.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        }
    }
    // Handle caret at end of line if needed (e.g., show it after last letter)
}


/**
 * Updates the stats display area.
 * @param {object} stats - Object containing { time, wpm, accuracy }.
 */
export function updateStats({ time = '0:00', wpm = '--', accuracy = '--' } = {}) {
    timerStat.textContent = time;
    wpmStat.textContent = `${wpm} WPM`;
    accuracyStat.textContent = `${accuracy}% Acc`;
}

/**
 * Shows a message in the feedback area.
 * @param {string} message - The message text.
 * @param {'info' | 'error'} type - Type of message (for potential styling).
 */
export function showFeedbackMessage(message, type = 'info') {
    feedbackMessaging.textContent = message;
    feedbackMessaging.className = `feedback-area ${type}`; // Add class for styling
}

/**
 * Resets UI elements to their initial state.
 */
export function resetUI() {
    wordDisplayArea.innerHTML = '<p class="placeholder-text">Loading words...</p>';
    updateStats(); // Reset stats display
    showFeedbackMessage(''); // Clear feedback
    // Enable buttons if they were disabled
    restartButton.disabled = false;
}

/**
 * Focuses the hidden input field to capture keyboard events.
 */
export function focusInput() {
    keyboardInput.focus();
}
