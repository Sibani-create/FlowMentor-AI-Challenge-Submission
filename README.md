# FlowMentor AI

**Real-Time AI Mentor for Every Student and Beginner**

This project is a submission for the **Google Chrome Built-in AI Challenge 2025**, competing in the **Best Hybrid AI Application** category.

---

## The Problem & Our Solution

For beginner coders, students, and self-learners, navigating the web to learn new skills is often fragmented and frustrating. Common hurdles include:
* Getting stuck on project architecture or not knowing the next implementation step.
* The tedious "copy-paste hustle" between tutorials,multiple tabs and separate AI chatbots, which breaks focus.
* Encountering language barriers in documentation or learning materials.
* Struggling to understand complex code snippets found online.

**FlowMentor AI tackles these challenges head-on.**

Its mission is to provide an intelligent, real-time AI mentor directly within the Chrome browser. It breaks down learning barriers by:
* Offering a **conversational project planning assistant** that provides architectural overviews and step-by-step guidance.
* Integrating seamlessly with browsing via a powerful **6-tool right-click context menu**, eliminating context switching.
* Providing **on-demand page analysis** through intuitive sidebar buttons (Summarize, Flowchart, Analyze Tech).
* Explaining **any code snippet** in simple terms, complete with text-based logic flowcharts.
* Offering **context-aware debugging** that provides corrected code and clear explanations.
* **Breaking language barriers** with an integrated translation tool.

FlowMentor AI utilizes a **Hybrid AI Strategy**, leveraging the powerful **Google Gemini API** to ensure these features are accessible and performant for **all users**, irrespective of their local hardware capabilities.

## Key Features

* **Conversational Project Mentor:** Analyzes ideas, generates text-based architecture diagrams & step-by-step plans, maintains context.
* **6-Tool Right-Click Menu:** Explain Code (w/ Flowchart), Debug Code (w/ Context), Get Code, Ask About Selection (w/ Context), Translate, Chat About Page.
* **3 Sidebar Action Buttons:** Analyze Page Tech, Summarize Page, Generate Page (Conceptual) Flowchart.
* **Intelligent Debugging:** Provides corrected code and pinpoints fixes.
* **Text-Based Flowcharts:** Visualizes code logic and page concepts using simple text diagrams.
* **Multi-Language Translation:** Supports several languages including Odia.
* **Customizable UI:** Features multiple themes (Light, Dark, Purple, Synthwave, Minty) with persistent selection.

## Prerequisites

To run this extension, you will need:
1.  The Google Chrome browser.
2.  A **Google Gemini API Key**. A free key can be obtained from [Google AI Studio](https://aistudio.google.com/app/apikey).

## Installation

1.  **Download:** Click the green `<> Code` button on this repository and select `Download ZIP`.
2.  **Unzip:** Extract the downloaded folder to a convenient location.
3.  **Add Your API Key:**
    * Open the extracted folder and edit the `sidebar.js` file using a text editor.
    * Locate the line: `const YOUR_API_KEY = "";`
    * Paste your Gemini API key between the quotes: `const YOUR_API_KEY = "YOUR_KEY_HERE";`
    * Save and close the file.
4.  **Load the Extension:**
    * Open Chrome and navigate to `chrome://extensions`.
    * Enable **"Developer mode"** (using the toggle, usually in the top-right).
    * Click the **"Load unpacked"** button (usually top-left).
    * Select the *entire project folder* you unzipped.
5.  **Ready to Use:** The FlowMentor AI icon should appear in your toolbar. Pin it for easy access. Click the icon or right-click on webpages to start using the mentor.

## Features in Detail

### 1. The Conversational Mentor (Main Chat)

Accessed by clicking the extension icon or right-clicking a page and selecting "Chat about this page".
* **Smart Project Analysis:** On the first message in a new session (when not in "page chat" mode), it analyzes your project idea/code, detects the primary tech stack (e.g., Python/Flask), saves it, and generates a response.
* **Architecture & Plan:** It provides a "text-based flowchart," and overview explaining in simple terms how the frontend, backend, database, and hosting all connect for your specific project.
* **Contextual Follow-up:** The AI remembers the detected stack (or page context if started via right-click) for relevant answers to subsequent questions within that session.

### 2. The Right-Click Context Menu

Provides instant actions on selected text or the page itself:

1.  **Explain this code (with flowchart):** Analyzes the selected code, explains its function and technical terms in simple language, provides a text-based flowchart visualizing the code's logic, and gives an example.
2.  **Debug this (with page context):** Analyzes selected code or an error message, using the full page text for context. It provides the corrected code snippet, pinpoints the location of the fix, and explains the type of error clearly.
3.  **Get code for this:** Generates foundational HTML, CSS, and JavaScript based on a highlighted natural language description (e.g., "a simple contact form"), along with instructions on how to use the generated files.
4.  **Ask about selection (with page context):** Sends the selected text *and* the page context to the AI, which intelligently adapts: summarizes YouTube videos (based on description), brainstorms hackathon ideas, summarizes long paragraphs, or answers specific questions using the page for context.
5.  **Translate this:** Translates the selected text into the language chosen in the sidebar's language dropdown.
6.  **Chat about this page:** Opens the sidebar, automatically loads the page's text content as context (`currentPageContext`), displays a confirmation message, and waits for the user to ask questions about the page in the chat input.

### 3. Sidebar Action Buttons

Offer page-level analysis initiated from the sidebar:

1.  **Analyze Tech:** Fetches the current page's HTML source, sends it to the AI, and displays an analysis guessing the frontend framework and backend technology, along with explanations for its reasoning.
2.  **Summarize Page:** Fetches the current page's text content, sends it to the AI, and displays a concise summary covering all main sections/headings with key terms bolded.
3.  **Page Flowchart:** Fetches the current page's text content, sends it to the AI, and displays a text-based flowchart visualizing the flow of *concepts or ideas* presented on the page, formatted for easy understanding.

### 4. Polished UI/UX
* **Multiple Themes:** Light, Dark, Purple, Synthwave, and Minty themes selectable via a dropdown, with the choice saved locally.
* **Clean Interface:** Uses CSS variables for theming, larger fonts, clear layout, and styled chat bubbles/code blocks for a professional and accessible experience.

## Privacy and Security

User privacy was a key consideration:
* **No Server-Side History:** Conversation history (`conversationHistory` array) exists only in the sidebar's temporary JavaScript memory and is cleared when the sidebar is closed or a new context menu/button action begins a single-turn task.
* **Minimal Local Storage:** Temporary task data passed from the background script is cleared immediately after being processed by the sidebar. The detected `projectStack` is also cleared when starting a new project analysis.
* **Secure API Calls:** The Google Gemini API key you add during setup stays on your computer inside the extension's code (sidebar.js). It's only sent directly and securely to Google when the AI needs to generate a response. Your key is never sent anywhere else..

## Troubleshooting

* **Extension Not Working / API Errors:**
    1.  **Verify API Key:** Ensure the Google Gemini API key is correctly pasted into the `YOUR_API_KEY` variable in `sidebar.js`. Check for typos or extra characters.
    2.  **Check API Key Status:** Visit Google AI Studio to ensure the API key is active and hasn't exceeded any quotas.
    3.  **Host Permissions:** Confirm `manifest.json` includes `"https://generativelanguage.googleapis.com/"` under `host_permissions`.
    4.  **Reload Extension:** Go to `chrome://extensions` and click the reload icon for FlowMentor AI. Also try restarting Chrome.
    5.  **Check Console:** Right-click the sidebar and select "Inspect". Check the "Console" tab for specific JavaScript errors.
* **Right-Click Menu / Buttons Not Working:**
    1.  **Reload Page:** Try refreshing the webpage you are on.
    2.  **Reload Extension:** As above, reload the extension via `chrome://extensions`.
    3.  **Restricted Pages:** Remember the extension cannot access content on `chrome://` pages, the Chrome Web Store, or some other restricted domains due to security policies. Check the console for permission errors.

## License

This project is open-source and licensed under the [MIT License](LICENSE).
