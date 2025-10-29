document.addEventListener('DOMContentLoaded', () => { // Main wrapper starts here
    const YOUR_API_KEY = "PASTE YOUR API KEY HERE"; // ⚠️ Paste your Gemini API key here

    // --- Initial Check ---
    if (!YOUR_API_KEY) {
        const chatLogInitial = document.getElementById('chat-log');
        if (chatLogInitial) {
            chatLogInitial.innerHTML =
              `<div class="model-message"><p><strong>Configuration Error:</strong> API Key is missing. Please add your Google Gemini API key to <code>sidebar.js</code> and reload the extension.</p></div>`;
        }
        const inputs = document.querySelectorAll('button, select, textarea');
        inputs.forEach(input => input.disabled = true);
        return; // Stop if no key
    }

    // --- Theme Setup ---
    const themeSelect = document.getElementById('theme-select');
    (async () => {
        try {
            const data = await chrome.storage.local.get('theme');
            const theme = data.theme || 'light';
            document.body.setAttribute('data-theme', theme);
            if (themeSelect) themeSelect.value = theme;
        } catch (e) {
            console.error("Error loading theme:", e);
        }
    })();
    if (themeSelect) {
        themeSelect.addEventListener('change', async () => {
            const selectedTheme = themeSelect.value;
            document.body.setAttribute('data-theme', selectedTheme);
            try {
                await chrome.storage.local.set({ theme: selectedTheme });
            } catch (e) {
                console.error("Error saving theme:", e);
            }
        });
    }

    // --- Element References ---
    const chatLog = document.getElementById('chat-log');
    const chatInput = document.getElementById('chat-input');
    const sendButton = document.getElementById('send-button');
    const analyzeTechButton = document.getElementById('analyze-tech-button');
    const summarizePageButton = document.getElementById('summarize-page-button');
    const flowchartPageButton = document.getElementById('flowchart-page-button');
    const loader = document.getElementById('loader');
    const langSelect = document.getElementById('language-select');

    // Ensure all elements exist
    if (!chatLog || !chatInput || !sendButton || !analyzeTechButton || !summarizePageButton || !flowchartPageButton || !loader || !langSelect) {
        console.error("Initialization failed: One or more essential UI elements not found.");
        if (chatLog) chatLog.innerHTML = `<div class="model-message"><p><strong>Error:</strong> UI elements failed to load. Please reload the extension.</p></div>`;
        const inputs = document.querySelectorAll('button, select, textarea');
        inputs.forEach(input => input.disabled = true);
        return;
    }


    let conversationHistory = [];
    let currentPageContext = null;

    // --- UI Helper Functions ---
    function showLoading() {
        loader.classList.remove('hidden');
        sendButton.disabled = true;
        chatInput.disabled = true;
        analyzeTechButton.disabled = true;
        summarizePageButton.disabled = true;
        flowchartPageButton.disabled = true;
    }
    function hideLoading() {
        loader.classList.add('hidden');
        sendButton.disabled = false;
        chatInput.disabled = false;
        analyzeTechButton.disabled = false;
        summarizePageButton.disabled = false;
        flowchartPageButton.disabled = false;
        if (!chatInput.disabled) {
           chatInput.focus();
        }
    }


    function appendMessage(role, htmlContent) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add(role === 'user' ? 'user-message' : 'model-message');
        // Basic sanitization
        const cleanHtml = htmlContent.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
        messageDiv.innerHTML = cleanHtml;
        chatLog.appendChild(messageDiv);
        chatLog.scrollTo({ top: chatLog.scrollHeight, behavior: 'smooth' });
    }

    chatInput.addEventListener('input', () => {
        chatInput.style.height = 'auto'; // Reset height
        const maxHeight = 100; // Must match max-height in sidebar.css
        chatInput.style.height = Math.min(chatInput.scrollHeight, maxHeight) + 'px';
    });


    // --- API Call Helper ---
    async function callGeminiAPI(history) {
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${YOUR_API_KEY}`;
        const validHistory = history.filter(item => item && item.role && item.parts && Array.isArray(item.parts) && item.parts.length > 0 && typeof item.parts[0].text === 'string');
        if (validHistory.length === 0) {
            console.error("callGeminiAPI called with invalid or empty history:", history);
            return "<p>Error: Invalid request prepared for AI.</p>";
        }
        const requestBody = { contents: validHistory };

        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                let errorMsg = response.statusText;
                try { const errorData = await response.json(); errorMsg = errorData?.error?.message || errorMsg; } catch (e) { /* Ignore */ }
                if (response.status === 400 && errorMsg.includes("API key not valid")) errorMsg = "API key not valid. Please check sidebar.js.";
                else if (response.status === 403) errorMsg = "API key valid but missing permissions/quota. Check Google AI Studio.";
                throw new Error(`Google API error (${response.status}): ${errorMsg}`);
            }
            const data = await response.json();
            const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

            if (typeof text === 'string') {
                return text.trim();
            } else {
                const finishReason = data?.candidates?.[0]?.finishReason;
                const safetyRatings = data?.candidates?.[0]?.safetyRatings;
                console.warn("API response stopped or invalid:", finishReason, safetyRatings, data);
                if (finishReason === "SAFETY") return `<p><strong>Response blocked due to safety settings.</strong> Modify request.</p>`;
                else if (finishReason && finishReason !== "STOP") return `<p><strong>Response stopped unexpectedly:</strong> ${finishReason}. Try again or simplify.</p>`;
                return "<p>AI returned empty/improperly formatted response.</p>";
            }
        } catch (error) {
            console.error("API Call failed:", error);
            if (error instanceof TypeError) return `<p><strong>Network Error:</strong> Cannot reach API. Check connection.</p>`;
            return `<p><strong>API Error:</strong> ${error.message}</p>`;
        }
    }


    // --- Helper to get current page content ---
     async function getCurrentPageContent(forceRefresh = false) {
         if (currentPageContext && !currentPageContext.startsWith("Error:") && !forceRefresh) {
            return currentPageContext;
         }
         try {
            const getContext = () => {
               const main = document.querySelector('main'); if (main) return main.innerText;
               const article = document.querySelector('article'); if (article) return article.innerText;
               return document.body.innerText || "Page has no text content.";
            };

            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (!tab) throw new Error("No active tab found.");
            if (!tab.url || tab.url.startsWith('chrome://') || tab.url.startsWith('about:') || tab.url.startsWith('https://chrome.google.com/webstore')) {
                throw new Error("Cannot access content on this type of restricted page.");
            }

            const results = await chrome.scripting.executeScript({ target: { tabId: tab.id }, func: getContext, world: "MAIN" });
            const result = results?.[0]?.result;

            if (typeof result === 'string' && result.trim() !== "") {
                 currentPageContext = result; return result;
            } else {
                 console.warn("Primary content fetch failed, trying body:", results);
                 const getBodyContext = () => document.body.innerText || "Page has no text content.";
                 const bodyResults = await chrome.scripting.executeScript({ target: { tabId: tab.id }, func: getBodyContext, world: "MAIN" });
                 const bodyResult = bodyResults?.[0]?.result;
                 if (typeof bodyResult === 'string' && bodyResult.trim() !== "") { currentPageContext = bodyResult; return bodyResult; }
                 currentPageContext = "Could not retrieve meaningful text content."; return currentPageContext;
            }
         } catch (e) {
            console.error("Error getting page content:", e);
            let userErrorMessage = `Error getting page content: ${e.message}`;
            if (e.message.includes("Cannot access") || e.message.includes("No tab")) userErrorMessage = `Error: ${e.message}`;
            else if (e.message.includes("Receiving end does not exist")) userErrorMessage = "Error: Connection lost. Reload page and try again.";
            else if (e.message.includes("script execution failed")) userErrorMessage = "Error: Cannot execute script on page.";
            currentPageContext = userErrorMessage; return userErrorMessage;
         }
      }


    // --- Core Chat Send Logic ---
    async function handleSendMessage() {
        const userInput = chatInput.value.trim();
        if (!userInput || sendButton.disabled) return;

        const sanitizedInput = userInput.replace(/</g, "&lt;").replace(/>/g, "&gt;");
        appendMessage('user', `<p>${sanitizedInput}</p>`);
        conversationHistory.push({ role: "user", parts: [{ text: userInput }] });

        chatInput.value = "";
        chatInput.style.height = 'auto';
        showLoading();

        let historyForAPI = [...conversationHistory];

        try {
            // Project Analysis (First message, not page chat)
            if (historyForAPI.length === 1 && !currentPageContext) {
                await chrome.storage.local.remove("projectStack");
                const analysisPrompt = `Analyze project idea/code: "${userInput}". Respond ONLY with primary tech stack name (React, Django, Python, General).`;
                const techStack = await callGeminiAPI([{ role: "user", parts: [{ text: analysisPrompt }] }]);
                const cleanStack = techStack && !techStack.startsWith("<p>") ? techStack.replace(/<[^>]*>?/gm, '').trim() || 'General' : 'General';
                await chrome.storage.local.set({ projectStack: cleanStack });

                const planPrompt = `Act as expert ${cleanStack} mentor. Project:"${userInput}". Provide analysis: 1.**Architecture:** Components, connections, free tools. 2.**Flow(Text-Diagram):** [User]->[Frontend]->[Backend]->[DB] in <pre><code>. 3.**5-Step Plan.** Format:clean HTML(<h4>,<ul>,<li>,<pre><code>). No markdown(*#).`;
                historyForAPI[0].parts[0].text = planPrompt;
            }
            // Page Chat Mode (First message after right-click)
            else if (currentPageContext && historyForAPI.length === 1) {
                const contextText = currentPageContext.startsWith("Error:") ? "Page context error." : currentPageContext;
                const contextPrompt = `Chatting about page. Context:"${contextText.substring(0, 4000)}..." User asks:"${userInput}" Answer concisely using context. Format:clean HTML(<p>,<ul>,<li>,<strong>). No markdown(*#).`;
                historyForAPI[0].parts[0].text = contextPrompt;
            }

            const aiResponse = await callGeminiAPI(historyForAPI);
            appendMessage('model', aiResponse);
            conversationHistory.push({ role: "model", parts: [{ text: aiResponse }] });

        } catch (e) {
            console.error("Error in handleSendMessage:", e);
            appendMessage('model', `<p><strong>Internal Error:</strong> ${e.message}</p>`);
            if (conversationHistory.length > 0 && conversationHistory[conversationHistory.length - 1].role === 'user') {
                conversationHistory.pop();
            }
        } finally {
            hideLoading();
        }
    }


    // --- Event Listeners for Chat & Sidebar Buttons ---
    sendButton.addEventListener('click', handleSendMessage);
    chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); }
    });

    analyzeTechButton.addEventListener('click', async () => {
        showLoading(); chatLog.innerHTML = ""; conversationHistory = []; currentPageContext = null;
        try {
            const getHtml = () => document.documentElement.outerHTML || "Could not get HTML.";
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (!tab) throw new Error("No active tab.");
            if (!tab.url || tab.url.startsWith('chrome://') || tab.url.startsWith('about:') || tab.url.startsWith('https://chrome.google.com/webstore')) throw new Error("Cannot analyze restricted page.");
            const results = await chrome.scripting.executeScript({ target: { tabId: tab.id }, func: getHtml, world: "MAIN" });
            const pageHtml = results?.[0]?.result;
            if (!pageHtml || typeof pageHtml !== 'string') throw new Error("Could not retrieve page HTML.");
            await handleTask({ task: 'analyzeTech', pageHtml: pageHtml });
        } catch (e) { console.error("Analyze Tech error:", e); appendMessage('model', `<p><strong>Error analyzing:</strong> ${e.message}</p>`); hideLoading(); }
    });

    summarizePageButton.addEventListener('click', async () => {
        showLoading(); chatLog.innerHTML = ""; conversationHistory = [];
        try {
            const pageContent = await getCurrentPageContent(!currentPageContext); // Force refresh if not in page mode
            if (pageContent.startsWith("Error")) throw new Error(pageContent);
            await handleTask({ task: 'summarizePage', pageContext: pageContent });
        } catch (e) { console.error("Summarize error:", e); appendMessage('model', `<p><strong>Error summarizing:</strong> ${e.message}</p>`); hideLoading(); }
    });

    flowchartPageButton.addEventListener('click', async () => {
         showLoading(); chatLog.innerHTML = ""; conversationHistory = [];
         try {
            const pageContent = await getCurrentPageContent(!currentPageContext); // Force refresh if not in page mode
            if (pageContent.startsWith("Error")) throw new Error(pageContent);
            await handleTask({ task: 'flowchartPage', pageContext: pageContent });
         } catch (e) { console.error("Flowchart error:", e); appendMessage('model', `<p><strong>Error generating flowchart:</strong> ${e.message}</p>`); hideLoading(); }
    });


    // --- Handle Tasks Triggered by Context Menus or Buttons ---
    async function handleTask(taskData) {
        const calledByButton = ['analyzeTech', 'summarizePage', 'flowchartPage'].includes(taskData.task);
        if (!calledByButton) {
            chatLog.innerHTML = ""; conversationHistory = []; currentPageContext = null;
        } else { chatLog.innerHTML = ""; } // Clear visual log for buttons

        const { task, newCodeSnippet, pageQuestion, pageContext, pageType, pageHtml } = taskData;
        let firstPrompt = ""; let systemMessage = "";

        // Clear task from storage as soon as processing starts
        await chrome.storage.local.remove(['task', 'newCodeSnippet', 'pageQuestion', 'pageContext', 'pageType', 'pageHtml']);

        try {
            // Task: Explain Code
            if (task === 'explain') {
                systemMessage = `<p>Generating explanation and text flowchart...</p>`;
                firstPrompt = `Act as expert Code Explainer. Code:<pre><code>${newCodeSnippet}</code></pre>Explain logic: 1.**Explanation:** <ul><li>, explain terms simply. 2.**Logic(Text-Flowchart):** Show flow like Step 1->Step 2 in <pre><code>. 3.**Example:** Input/output. Format:clean HTML(<h4>,<ul>,<li>,<pre><code>). No markdown(*#).`;
            }
            // Task: Debug Code
            else if (task === 'debug') {
                systemMessage = `<p>Debugging with page context...</p>`;
                firstPrompt = `Act as expert Code Debugger. Student highlighted:<pre><code>${newCodeSnippet}</code></pre>Context:<pre><code>${(pageContext || "None").substring(0, 2000)}...</code></pre>Fix bug: 1.**Corrected Code:** Full fixed code in <pre><code>. Keep style. 2.**Where's Fix?:** <ul><li> pinpoint change. 3.**Explanation:** <ul><li> explain error type simply. Format:clean HTML(<h4>,<ul>,<li>,<pre><code>). No markdown(*#).`;
            }
            // Task: Get Code
            else if (task === 'getCode') {
                systemMessage = `<p>Generating code...</p>`;
                firstPrompt = `Act as Expert Web Component Generator. User wants:"${newCodeSnippet}" Generate code: 1.**HTML**,**CSS**,**JavaScript:** Code each in <pre><code> under <h4>. 2.**How to Use:** Simple <ul><li> steps. Format:clean HTML(<h4>,<ul>,<li>,<pre><code>). No markdown(*#).`;
            }
            // Task: Ask about Selection
            else if (task === 'pageContext') {
                systemMessage = `<p>Answering selection with page context...</p>`;
                firstPrompt = `Act as helpful AI. Page:"${(pageContext || "").substring(0, 3000)}..." User highlighted:"${pageQuestion}" Analyze request/page type('${pageType}'). YouTube:Summarize. Foreign:Translate. Hackathon:Ideas. Long text:Summarize. Else:Answer question using context. Format:clean HTML(<h4>,<ul>,<li>,<strong>). No markdown(*#).`;
            }
            // Task: Translate
            else if (task === 'translate') {
                const lang = langSelect.value || 'English';
                systemMessage = `<p>Translating to ${lang}...</p>`;
                firstPrompt = `Translate to ${lang}. Provide ONLY translation: "${newCodeSnippet}"`;
            }
            // Task: Analyze Tech
            else if (task === 'analyzeTech') {
                const cleanHtml = (pageHtml || "").replace(/</g, "&lt;");
                systemMessage = `<p>Analyzing page technology...</p>`;
                firstPrompt = `Act as tech detector. Analyze HTML:<pre><code>${cleanHtml.substring(0, 5000)}...</code></pre>Explain simply: 1.State backend is guess. 2.**Frontend:** Identify framework/plain HTML, give reason. 3.**Backend Guess:** Suggest tech based on clues, or state unknown/proprietary. Format:clean HTML(<p>,<h4>,<ul><li>,<strong>). No markdown(*#).`;
            }
            // Task: Summarize Page
            else if (task === 'summarizePage') {
                systemMessage = `<p>Summarizing the page content...</p>`;
                firstPrompt = `Act as content summarizer. Analyze: "${(pageContext || "No content found.").substring(0, 5000)}..." Identify ALL main headings/sections. For EACH section, give concise <li> summary. Use <strong> for key terms. Format: <h4>Page Summary</h4>, <ul>. Keep language clear. CRITICAL FORMATTING RULES: No markdown (*#).`;
            }
            // Task: Flowchart Page (UPDATED PROMPT)
            else if (task === 'flowchartPage') {
                systemMessage = `<p>Generating text flowchart of the page...</p>`;
                firstPrompt = `
                Act as a learning assistant. Analyze the main ideas, concepts, or steps in the following page content: "${(pageContext || "No content found.").substring(0, 5000)}..."
                Generate a clear, **text-based flowchart** illustrating the conceptual flow in a <pre><code> block.

                CRITICAL FORMATTING RULES:
                1.  Layout MUST be spatial: Use spaces for positioning (top-down or left-right).
                2.  Use ONLY simple characters: | V -> => : ↳ / \\ for connections.
                3.  Use <strong> for main topics/steps within the code block.
                4.  Handle PARALLEL BRANCHES using / \\ and give each branch its own vertical column using whitespace. Ensure columns are spaced well to prevent text collision.
                5.  DO NOT use box-drawing chars (+, -).
                6.  DO NOT create just an indented list. Make it look like a diagram.
                7.  Start with the main topic. Branch clearly. Include brief examples if helpful.
                8.  Ensure visual clarity of flow.
                9.  No markdown (*#).
                `;
            }
            // Task: Page Chat Mode (Initial setup)
            else if (task === 'pageChat') {
                systemMessage = `<p>Okay, I've read the page context. Ask me anything about it!</p>`;
                currentPageContext = pageContext || null;
                conversationHistory = [];
                appendMessage('model', systemMessage);
                hideLoading();
                // Task already cleared from storage by caller
                return; // Exit handleTask, wait for user input
            }
             else { throw new Error(`Unknown task: ${task}`); }

            // --- Execute API call for all single-turn tasks ---
            appendMessage('model', systemMessage);
            const taskHistory = [{ role: "user", parts: [{ text: firstPrompt }] }];
            const aiResponse = await callGeminiAPI(taskHistory);
            appendMessage('model', aiResponse);

        } catch (e) {
            console.error(`Error processing task '${task}':`, e);
            appendMessage('model', `<p><strong>Error processing task:</strong> ${e.message}</p>`);
        } finally {
             // Ensure loading is hidden, unless pageChat init handled it
             if (task !== 'pageChat') { hideLoading(); }
             // Task already cleared from storage
        }
    } // End handleTask

    // --- Listeners for Tasks Set by Background Script ---
    const storageKeys = ['task', 'newCodeSnippet', 'pageQuestion', 'pageContext', 'pageType', 'pageHtml'];

    chrome.storage.onChanged.addListener((changes, area) => {
        if (area === 'local' && changes.task?.newValue) {
            chrome.storage.local.get(storageKeys).then(data => {
                if (data.task) { handleTask(data); }
            }).catch(e => console.error("Error reading storage on change:", e));
        }
    });

    async function checkTaskOnLoad() {
        try {
            const data = await chrome.storage.local.get(storageKeys);
            if (data.task) {
                handleTask(data); // Clears storage inside
            } else {
                chatLog.innerHTML = `<div class="model-message"><p>Welcome! Describe a project or use the right-click menu / sidebar buttons.</p></div>`;
                currentPageContext = null; conversationHistory = [];
            }
        } catch (e) {
             console.error("Error checking task on load:", e);
             if(chatLog) chatLog.innerHTML = `<div class="model-message"><p><strong>Error initializing:</strong> ${e.message}</p></div>`;
        }
    }

    checkTaskOnLoad();

}); // End of DOMContentLoaded listener