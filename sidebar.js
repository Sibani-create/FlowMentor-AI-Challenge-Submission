document.addEventListener('DOMContentLoaded', () => {
  // --- PASTE YOUR KEY HERE ---
  const YOUR_API_KEY = "PASTE_YOUR_GEMINI_API_KEY_HERE"; // ⚠️ Make sure to paste your key here
  // ---------------------------

  if (YOUR_API_KEY === "") {
    document.getElementById('chat-log').innerHTML = 
      `<div class="model-message"><p><strong>Error:</strong> API Key is missing. Please add your Google Gemini API key to <code>sidebar.js</code> to begin.</p></div>`;
    return; // Stop execution if no key
  }
  
  // --- 1. DARK MODE LOGIC ---
  const themeToggleBtn = document.getElementById('theme-toggle');

  // On load, apply saved theme
  (async () => {
    const data = await chrome.storage.local.get('theme');
    if (data.theme === 'dark') {
      document.body.setAttribute('data-theme', 'dark');
      themeToggleBtn.innerHTML = 'Light'; // Button text to switch to light
    } else {
      document.body.setAttribute('data-theme', 'light');
      themeToggleBtn.innerHTML = 'Dark'; // Button text to switch to dark
    }
  })();

  // Add click listener to the toggle
  themeToggleBtn.addEventListener('click', async () => {
    const currentTheme = document.body.getAttribute('data-theme');
    if (currentTheme === 'dark') {
      document.body.setAttribute('data-theme', 'light');
      themeToggleBtn.innerHTML = 'Dark';
      await chrome.storage.local.set({ theme: 'light' });
    } else {
      document.body.setAttribute('data-theme', 'dark');
      themeToggleBtn.innerHTML = 'Light';
      await chrome.storage.local.set({ theme: 'dark' });
    }
  });
  // --- END OF DARK MODE LOGIC ---


  // --- 2. EXISTING CHAT LOGIC ---
  const chatLog = document.getElementById('chat-log');
  const chatInput = document.getElementById('chat-input');
  const sendButton = document.getElementById('send-button');
  const loader = document.getElementById('loader');
  const langSelect = document.getElementById('language-select');

  let conversationHistory = [];

  // --- Helper Functions ---
  function showLoading() {
    loader.classList.remove('hidden');
    sendButton.disabled = true;
    chatInput.disabled = true;
  }
  function hideLoading() {
    loader.classList.add('hidden');
    sendButton.disabled = false;
    chatInput.disabled = false;
    chatInput.focus();
  }

  function appendMessage(role, htmlContent) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add(role === 'user' ? 'user-message' : 'model-message');
    messageDiv.innerHTML = htmlContent;
    chatLog.appendChild(messageDiv);
    chatLog.scrollTop = chatLog.scrollHeight; 
  }
  
  chatInput.addEventListener('input', () => {
    chatInput.style.height = 'auto';
    chatInput.style.height = (chatInput.scrollHeight) + 'px';
  });

  // --- API Helper ---
  async function callGeminiAPI(history) {
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${YOUR_API_KEY}`;
    const requestBody = { "contents": history }; 

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Google API error: ${errorData.error.message}`);
    }
    const data = await response.json();
    if (data.candidates && data.candidates[0]) {
      return data.candidates[0].content.parts[0].text.trim();
    } else {
      return "<p>The AI did not provide a valid response. This might be due to safety settings or an empty reply.</p>";
    }
  }

  // --- Core Chat Logic ---
  async function handleSendMessage() {
    const userInput = chatInput.value.trim();
    if (!userInput) return;

    const sanitizedInput = userInput.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    appendMessage('user', `<p>${sanitizedInput}</p>`);
    conversationHistory.push({ "role": "user", "parts": [{"text": userInput}] });
    
    chatInput.value = ""; 
    chatInput.style.height = 'auto'; 
    showLoading();

    try {
      // --- THIS IS THE UPDATED LOGIC ---
      if (conversationHistory.length === 1) {
        // This is the FIRST message of a new session.
        // We MUST re-analyze the stack, regardless of storage.
        
        // 1. Clear any old stack from storage.
        await chrome.storage.local.remove("projectStack");

        // 2. Run the analysis prompt
        const systemPrompt = `
          IMPORTANT: This is the user's first message. 
          First, analyze this text/code: "${userInput}".
          Respond with ONLY the primary stack name (e.g., 'React', 'Django', 'Python', 'HTML/CSS', or 'General' if unsure).
          Do NOT add any other text or formatting.
        `;
        
        const analysisHistory = [...conversationHistory];
        analysisHistory[analysisHistory.length - 1].parts[0].text = systemPrompt;
        
        const techStack = await callGeminiAPI(analysisHistory);
        
        // 3. Save the NEW stack
        const cleanStack = techStack.replace(/<[^>]*>?/gm, '').trim() || 'General';
        await chrome.storage.local.set({ projectStack: cleanStack });

        // 4. Create the real project plan prompt
        const planPrompt = `
          You are an expert ${cleanStack} mentor. 
          The user's project idea/code is: "${userInput}".
          
          Your task is to provide a comprehensive, beginner-friendly project analysis and plan.
          
          **Part 1: Project Overview & Connections (Text-based Visualization)**
          Describe the overall project architecture like a simple flowchart or diagram, using easy-to-understand language. Explain:
          - What are the main components (e.g., "the website you see", "the server working behind the scenes", "the database storing info")?
          - How do these components connect and talk to each other to make the project work?
          - Based on the stack, what are the best, free options for databases, servers, and hosting?
          - Use analogies if helpful for a non-coder.
          
          **Part 2: Step-by-Step Project Plan**
          Then, provide a 5-step project plan for a beginner coder or student to understand how to build it.
          
          Format your entire response as clean HTML:
          - Start with a <p> tag confirming the project and stack.
          - Use <h4> for main section titles (e.g., "Project Architecture Overview", "Your 5-Step Project Plan").
          - Use <ul> and <li> for bullet points.
          - Wrap all code snippets in <pre><code>...</code></pre> blocks.
          - **Do NOT use markdown symbols like '***' or '#'.**
        `;
        
        // 5. Replace the user's message in history with this new prompt
        conversationHistory.pop(); 
        conversationHistory.push({ "role": "user", "parts": [{"text": planPrompt}] });
      
      }
      // --- END OF UPDATED LOGIC ---
      // If it's not the first message (conversationHistory.length > 1),
      // we don't do anything special. The conversation history
      // will correctly provide context to the AI for follow-up questions.

      const aiResponse = await callGeminiAPI(conversationHistory);

      appendMessage('model', aiResponse);
      conversationHistory.push({ "role": "model", "parts": [{"text": aiResponse}] });

    } catch (e) {
      appendMessage('model', `<p><strong>An error occurred:</strong> ${e.message}</p>`);
      conversationHistory.pop();
    } finally {
      hideLoading();
    }
  }

  // --- Event Listeners for Chat ---
  sendButton.addEventListener('click', handleSendMessage);
  chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault(); 
      handleSendMessage();
    }
  });

  // --- UNIFIED FUNCTION TO HANDLE CONTEXT MENU TASKS ---
  async function handleTask(taskData) {
    const { task, newCodeSnippet, pageQuestion, pageContext, pageType, pageHtml } = taskData;
    
    chatLog.innerHTML = "";
    conversationHistory = [];
    showLoading();

    let firstPrompt = "";
    let systemMessage = ""; 

    try {
      // --- Task 1: Debug Code ---
      if (task === 'debug') {
        systemMessage = `<p><strong>Analyzing your code snippet...</strong></p>`;
        firstPrompt = `
          You are a friendly code explainer for complete beginners.
          A user highlighted this code snippet: <pre><code>${newCodeSnippet}</code></pre>
          Explain what this code does in very simple, step-by-step terms.
          Assume the user knows nothing about coding.
          Format your response as clean HTML:
          - Use a <h4> for the main idea (e.g., "What this code does:").
          - Use a <ul> with <li> bullet points for the step-by-step explanation.
          - **Do NOT use markdown symbols like '***' or '#'.**
        `;
      }

      // --- Task 2: Get Component Code ---
      if (task === 'getCode') {
        systemMessage = `<p><strong>Generating code for your request...</strong></p>`;
        firstPrompt = `
          You are a helpful web developer.
          A user highlighted this text: "${newCodeSnippet}"
          Generate the necessary HTML, CSS, and JavaScript to build this component.
          Format your response as clean HTML:
          - Use <h4>HTML</h4>, <h4>CSS</h4>, and <h4>JavaScript</h4> as titles.
          - Place the code for each in its own <pre><code>...</code></pre> block.
          - **Do NOT use markdown symbols like '***' or '#'.**
        `;
      }

      // --- Task 3: Page-Aware Assistant ---
      if (task === 'pageContext') {
        const context = pageContext || "No page context was provided";
        systemMessage = `<p><strong>Answering with page context...</strong></p>`;
        firstPrompt = `
          You are a helpful, multipurpose AI assistant.
          The user is on a webpage with this content: "${context.substring(0, 4000)}..."
          The user highlighted this specific text: "${pageQuestion}"
          Your task is to analyze the user's request. Format as clean HTML.
          - Use <h4> for titles and <ul>/<li> for lists.
          - **Do NOT use markdown symbols like '***' or '#'.**

          Here is your logic:
          1.  If the pageType is 'youtube', act as a YouTube summarizer.
          2.  If the highlighted text is in a foreign language, translate it to English.
          3.  If it mentions 'hackathon', provide 5 project ideas.
          4.  If it's a long paragraph, summarize it.
          5.  For any other query, answer the question using the page context.
        `;
      }
      
      // --- Task 4: Translate ---
      if (task === 'translate') {
        const lang = langSelect.value || 'English'; 
        systemMessage = `<p><strong>Translating to ${lang}...</strong></p>`;
        firstPrompt = `
           You are an expert translator.
           Translate the following text to ${lang}.
           Provide ONLY the translation.
           Text to translate: "${newCodeSnippet}"
        `;
      }

      // --- Task 5: Analyze Tech Stack ---
      if (task === 'analyzeTech') {
        const html = (pageHtml || "").replace(/</g, "&lt;");
        systemMessage = `<p><strong>Analyzing page technology...</strong></p>`;
        firstPrompt = `
          You are a senior web developer acting as a technology detector.
          I will give you the first 5000 characters of a website's HTML source.
          
          Your job is to:
          1.  **Detect the FRONTEND framework:** Look for clues like 'react-root', 'data-v-' (Vue), 'ng-version' (Angular).
          2.  **GUESS the BACKEND technology:** Look for clues like 'csrfmiddlewaretoken' (Django), 'wp-content' (WordPress/PHP).
          
          **IMPORTANT:** Start by explaining that you can't see the backend code, only guess from the HTML.
          
          Format your response as clean HTML:
          - <p>Start with your explanation about the limitation (that you can't see backend code).</p>
          - <h4>Frontend (What I can see):</h4>
          - <ul><li>[Framework or 'Plain HTML/CSS'] with [Your Reason]</li></ul>
          - <h4>Backend (My best guess):</h4>
          - <ul><li>[Guessed Framework or 'Unknown'] with [Your Reason]</li></ul>
          - **Do NOT use markdown '***' or '#'.**
          
          Here is the HTML snapshot:
          <pre><code>${html.substring(0, 5000)}...</code></pre>
        `;
      }

      // --- Execute the first message of the new chat ---
      appendMessage('model', systemMessage); 
      
      conversationHistory.push({ "role": "user", "parts": [{"text": firstPrompt}] });
      const aiResponse = await callGeminiAPI(conversationHistory);

      appendMessage('model', aiResponse);
      conversationHistory.push({ "role": "model", "parts": [{"text": aiResponse}] });

    } catch (e) {
      appendMessage('model', `<p><strong>An error occurred:</strong> ${e.message}</p>`);
    } finally {
      hideLoading();
      await chrome.storage.local.remove(['task', 'newCodeSnippet', 'pageQuestion', 'pageContext', 'pageType', 'pageHtml']);
    }
  }

  // --- Listeners for tasks ---
  const storageKeys = ['task', 'newCodeSnippet', 'pageQuestion', 'pageContext', 'pageType', 'pageHtml'];
  
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes.task?.newValue) {
      chrome.storage.local.get(storageKeys).then(handleTask);
    }
  });

  async function checkTaskOnLoad() {
    const data = await chrome.storage.local.get(storageKeys);
    if (data.task) { 
      handleTask(data);
    }
  }

  checkTaskOnLoad();
});