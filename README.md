# AI Spelling Practice App

A web-based spelling practice application inspired by Monkeytype, using Mistral AI via serverless functions for dynamic word generation and personalized suggestions.

## Features

* **Spelling Practice Interface:** Clean, minimalist interface for typing practice.
* **AI Word Generation:** Fetches practice words dynamically from the Mistral AI API.
* **Error Tracking:** Records incorrectly spelled words in the browser's local storage.
* **AI Suggestions:** Provides suggestions for related words to practice based on past errors.
* **Monkeytype Style:** Aims for a visual aesthetic similar to popular typing test sites.
* **Serverless Backend:** Uses Vercel Serverless Functions to securely handle API calls.
* **Static Frontend:** Hosted via GitHub Pages (or could be hosted on Vercel too).

## Tech Stack

* **Frontend:** HTML, CSS, Vanilla JavaScript (ES6 Modules)
* **Backend API Proxy:** Vercel Serverless Functions (Node.js)
* **AI:** Mistral AI API
* **Hosting:**
    * Frontend: GitHub Pages (or Vercel)
    * Backend: Vercel

## Project Structure

/
|-- index.html             # Main app page
|-- css/                   # Stylesheets
|   |-- style.css
|-- js/                    # Frontend JavaScript
|   |-- script.js          # Main logic
|   |-- api.js             # API call handlers
|   |-- ui.js              # DOM manipulation
|-- api/                   # Vercel Serverless Functions (Node.js)
|   |-- get-word.js
|   |-- get-suggestions.js
|-- .gitignore             # Files to ignore in Git
|-- package.json           # Node.js project definition & dependencies
|-- package-lock.json      # Exact dependency versions
|-- vercel.json            # Vercel configuration (optional)
|-- README.md              # This file


## Setup and Installation

1.  **Clone Repository:**
    ```bash
    git clone [https://github.com/your-username/your-repo-name.git](https://github.com/your-username/your-repo-name.git) # <-- CHANGE THIS
    cd your-repo-name
    ```

2.  **Install Dependencies:** (Needed for serverless functions)
    ```bash
    npm install
    ```

3.  **Environment Variables:**
    * You need an API key from [Mistral AI](https://mistral.ai/).
    * Set this key as an **environment variable** named `MISTRAL_API_KEY` in your Vercel project settings. **Do not commit your API key.**

## Deployment

1.  **Frontend (GitHub Pages):**
    * Push your code to your GitHub repository.
    * Go to your repository's **Settings** > **Pages**.
    * Select the branch to deploy from (e.g., `main`) and the folder (usually `/root`).
    * Your site will be available at `https://your-username.github.io/your-repo-name/`.

2.  **Backend (Vercel):**
    * Sign up for a [Vercel](https://vercel.com/) account (free tier available).
    * Create a **New Project** and import your GitHub repository.
    * Vercel should automatically detect the framework (Node.js for the `/api` functions).
    * Configure the **Environment Variable** `MISTRAL_API_KEY` with your Mistral API key in the project settings on Vercel.
    * Deploy the project. Vercel will provide a URL (e.g., `your-project-name.vercel.app`) where your frontend will be hosted *and* your API functions will be available under `/api/`.

    *(Note: You can choose to host *both* frontend and backend on Vercel for simplicity, skipping the GitHub Pages step if preferred. Vercel will serve the static files from the root and the functions from `/api/`.)*

3.  **Frontend API Configuration:**
    * Update the `API_BASE_URL` constant in `js/api.js` to point to your deployed Vercel URL's API path (e.g., `https://your-project-name.vercel.app/api` or just `/api` if frontend is also on Vercel) if needed.
    * Update CORS headers (`Access-Control-Allow-Origin`) in the serverless functions (`api/*.js`) to allow requests specifically from your GitHub Pages domain (or keep `'*'` for testing, but restrict in production).

## Running Locally (Optional)

* **Frontend:** You can often open `index.html` directly in your browser for basic UI checks, but API calls won't work without a running backend.
* **Frontend + Backend:** Use the Vercel CLI for a local development environment that mimics Vercel:
    ```bash
    npm install -g vercel # Install Vercel CLI globally (if not already)
    vercel dev           # Runs a local server, including serverless functions
    ```
    You might need a `.env` file locally (add it to `.gitignore`!) containing `MISTRAL_API_KEY=your_key` for `vercel dev` to pick it up.

---