# FlowMentor AI

**Your Real-Time AI Mentor for Every Student and Beginner**

This project is a submission for the **Google Chrome Built-in AI Challenge 2025**, competing in the **Best Hybrid AI Application** category.

---

## The Problem & Our Solution

For beginner coders, students, and self-learners, the journey is often filled with barriers. You might be:
* Stuck on a project, unsure of the architecture or the "next step."
* Frustrated with the "copy-paste hustle" of juggling a chatbot, your code, and the webpage you're learning from.
* Facing a language barrier on a tutorial or documentation.
* Looking at a complex piece of code on a webpage and having no idea what it does.

**FlowMentor AI was built to solve these exact problems.**

Our mission is to provide an AI mentor that lives in your browser, helping you in real-time. It's designed to break down barriers for beginners by:
* Providing a **conversational project mentor** that gives you a full architectural plan, not just code snippets.
* Eliminating the copy-paste hustle with a **powerful 5-tool right-click menu**.
* Helping you **understand any code** on any page in simple, beginner-friendly language.
* **Breaking language barriers** with an instant-access translator.
* **Guessing the tech stack** of any website to help you learn how it's built.

We use a **Hybrid AI Strategy** (leveraging the Google Gemini API) to ensure these powerful tools are accessible to *all users*, regardless of their device's hardware.

## Key Features

* **Conversational Project Mentor** with "Text-Based Flowchart" Architecture Planning
* **5-Tool Right-Click Context Menu**
* **Website Tech Stack Analyzer** (Frontend & Backend)
* **Beginner-Friendly Code Debugger**
* **AI-Powered Code Generator**
* **Page-Aware Summarizer** (for articles and YouTube videos)
* **Multi-Language Translator**
* **Polished UI** with persistent Light & Dark Modes

## Prerequisites

To run this extension, you will need:
1.  The Google Chrome browser.
2.  A **Google Gemini API Key**. You can get a free key from [Google AI Studio](https://aistudio.google.com/app/apikey).

## Installation (Instructions for Judges)

1.  **Download:** Click the green `<> Code` button on this repository and select `Download ZIP`.
2.  **Unzip:** Unzip the downloaded folder to a location you'll remember.
3.  **Add Your API Key:**
    * Open the unzipped folder and edit the `sidebar.js` file.
    * Find the line: `const YOUR_API_KEY = "";`
    * Paste your Gemini API key inside the quotes: `const YOUR_API_KEY = "PASTE_YOUR_GEMINI_API_KEY_HERE";`
    * Save and close the file.
4.  **Load the Extension:**
    * Open Chrome and go to the URL: `chrome://extensions`.
    * Enable **"Developer mode"** (using the toggle in the top-right).
    * Click the **"Load unpacked"** button (in the top-left).
    * Select the *entire project folder* you unzipped.
5.  **You're Ready!** The FlowMentor AI icon will appear in your toolbar. Pin it for easy access, and right-click on any page to use its tools.

## Features in Detail

### 1. The Conversational Mentor (Main Chat)

This is the main chat window in the sidebar.
* **Smart Project Analysis:** When you send your first message (like "a PYQ portal in Django"), it analyzes it, identifies the stack ("Django"), and saves it for the conversation.
* **Project Architecture Overview:** It provides a "text-based flowchart," explaining in simple terms how the frontend, backend, database, and hosting all connect for your specific project.
* **Contextual Follow-up:** Every question you ask after that (like "how do I write a view?") is answered with the correct "Django" context.

### 2. The 5-Tool Right-Click Menu

This is the "no copy-paste" solution. Highlight text on any webpage and right-click to access:

1.  **FlowMentor: Analyze this page's tech:**
    * This is a general tool (doesn't require highlighting text). It reads the page's HTML to give you its best guess on the **Frontend** (like React, Vue) and **Backend** (like Django, WordPress).
2.  **FlowMentor: Ask about this code:**
    * Your personal, beginner-friendly debugger. It explains any highlighted code snippet in simple, step-by-step terms.
3.  **FlowMentor: Get code for this:**
    * An AI code generator. You can highlight text like "a dark-themed login form" and it will generate the HTML, CSS, and JS for it.
4.  **FlowMentor: Ask about this (with page context):**
    * This is the "Smart Analyzer" that changes its job:
    * **On YouTube:** It becomes a **YouTube Summarizer**, using the title and description to answer your questions.
    * **On a Hackathon Page:** It becomes a **Brainstorming Partner**.
    * **On a Long Article:** It becomes a **Summarizer**.
5.  **FlowMentor: Translate this:**
    * An instant-access translator. It translates any highlighted text into the language you've selected from the sidebar dropdown.

### 3. Polished UI
* **Dark / Light Mode:** A persistent theme toggle (using `chrome.storage.local`) that respects your choice.
* **Clean, Readable UI:** Built with larger fonts and a modern chat interface for readability.

## Privacy and Security

Your privacy is paramount.
* **No Chat History Saved:** Your conversation history is stored in a temporary variable and is **deleted** every time you close the sidebar.
* **Local Storage:** The only data saved locally is your theme preference (Light/Dark) and your current `projectStack` (which is cleared when you start a new project chat).
* **Secure API Calls:** Your API key is stored only on your computer in the `sidebar.js` file and is sent directly to Google's secure API endpoint with every request. It is never shared with any other service.

## Troubleshooting

* **Extension Not Working / API Error:**
    1.  Make sure you have correctly pasted your Gemini API key into `sidebar.js`.
    2.  Make sure the `host_permissions` in `manifest.json` is set to `"https://generativelanguage.googleapis.com/"`.
* **Right-Click Menu Not Working:**
    1.  After installing, try reloading the webpage you are on.
    2.  Go to `chrome://extensions` and click the "Reload" icon for the FlowMentor extension.

## License

This project is open-source and licensed under the [MIT License](LICENSE).