// Opens the sidebar when you click the extension icon
chrome.action.onClicked.addListener((tab) => {
  // Clear any pending task when opening via icon
  chrome.storage.local.remove(['task', 'newCodeSnippet', 'pageQuestion', 'pageContext', 'pageType', 'pageHtml']);
  chrome.sidePanel.open({ tabId: tab.id });
});

// Function injected to get page text content
function getPageContent() {
  const main = document.querySelector('main');
  if (main) return main.innerText;
  const article = document.querySelector('article'); // Try article tag
  if (article) return article.innerText;
  return document.body.innerText || "Page has no text content."; // Fallback to body
}


// Function injected to get page HTML source
function getPageHtml() {
  return document.documentElement.outerHTML || "Could not get HTML source.";
}

// Create context menus when the extension is installed
chrome.runtime.onInstalled.addListener(() => {
  // 1. Explain Code (formerly Ask about Code)
  chrome.contextMenus.create({
    id: "explainCode",
    title: "FlowMentor: Explain this code (with flowchart)",
    contexts: ["selection"]
  });

  // 2. Debug Code (with page context)
  chrome.contextMenus.create({
    id: "debugCode",
    title: "FlowMentor: Debug this (with page context)",
    contexts: ["selection"]
  });

  // 3. Get Code
  chrome.contextMenus.create({
    id: "getCodeFlowMentor",
    title: "FlowMentor: Get code for this",
    contexts: ["selection"]
  });

  // 4. Ask about Selection (with page context) - Renamed slightly
  chrome.contextMenus.create({
    id: "askAboutSelection",
    title: "FlowMentor: Ask about selection (with page context)",
    contexts: ["selection"]
  });

  // 5. Translate Selection
  chrome.contextMenus.create({
    id: "translateFlowMentor",
    title: "FlowMentor: Translate this",
    contexts: ["selection"]
  });

  // 6. NEW: Open Chat with Page Context
  chrome.contextMenus.create({
    id: "openChatWithContext",
    title: "FlowMentor: Chat about this page",
    contexts: ["page"] // Triggers anywhere on the page
  });

  // REMOVED: "analyzeTechStack" is now a button in the sidebar
});

// Listen for context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {

  // Task: Explain Code
  if (info.menuItemId === "explainCode" && info.selectionText) {
    await chrome.sidePanel.open({ tabId: tab.id });
    await chrome.storage.local.set({
      task: 'explain',
      newCodeSnippet: info.selectionText
    });
  }

  // Task: Debug Code (gets selection + page text)
  if (info.menuItemId === "debugCode" && info.selectionText) {
    await chrome.sidePanel.open({ tabId: tab.id });
    try {
        const results = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: getPageContent,
           world: "MAIN"
        });
        const pageContext = results?.[0]?.result || "No page context found.";
        await chrome.storage.local.set({
          task: 'debug',
          newCodeSnippet: info.selectionText, // The error/code
          pageContext: pageContext
        });
    } catch (e) {
        console.error("Error getting page context for debug:", e);
        // Proceed even if context fails, but send error status
         await chrome.storage.local.set({
          task: 'debug',
          newCodeSnippet: info.selectionText,
          pageContext: `Error retrieving context: ${e.message}`
        });
    }
  }


  // Task: Get Code
  if (info.menuItemId === "getCodeFlowMentor" && info.selectionText) {
    await chrome.sidePanel.open({ tabId: tab.id });
    await chrome.storage.local.set({
      task: 'getCode',
      newCodeSnippet: info.selectionText
    });
  }

  // Task: Ask about Selection (gets selection + page text)
  if (info.menuItemId === "askAboutSelection" && info.selectionText) {
    await chrome.sidePanel.open({ tabId: tab.id });
     try {
        const results = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: getPageContent,
          world: "MAIN"
        });
        const pageContext = results?.[0]?.result || "Could not read page content.";
        let pageType = 'general';
        if (tab.url && tab.url.includes("youtube.com/watch")) {
          pageType = 'youtube';
        }
        await chrome.storage.local.set({
          task: 'pageContext', // Still uses the pageContext task logic
          pageQuestion: info.selectionText, // The user's specific question (the highlight)
          pageContext: pageContext,
          pageType: pageType
        });
     } catch (e) {
        console.error("Error getting page context for ask:", e);
         await chrome.storage.local.set({
          task: 'pageContext',
          pageQuestion: info.selectionText,
          pageContext: `Error retrieving context: ${e.message}`,
          pageType: 'general'
        });
     }
  }

  // Task: Translate Selection
  if (info.menuItemId === "translateFlowMentor" && info.selectionText) {
    await chrome.sidePanel.open({ tabId: tab.id });
    await chrome.storage.local.set({
      task: 'translate',
      newCodeSnippet: info.selectionText
    });
  }

  // Task: Open Chat with Page Context (gets only page text)
  if (info.menuItemId === "openChatWithContext") {
    await chrome.sidePanel.open({ tabId: tab.id });
     try {
        const results = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: getPageContent,
          world: "MAIN"
        });
        const pageContext = results?.[0]?.result || "Could not load page content.";
        let pageType = 'general';
         if (tab.url && tab.url.includes("youtube.com/watch")) {
          pageType = 'youtube';
        }
        await chrome.storage.local.set({
          task: 'pageChat', // New task type
          pageContext: pageContext,
          pageType: pageType
        });
     } catch (e) {
         console.error("Error getting page context for chat:", e);
          await chrome.storage.local.set({
            task: 'pageChat',
            pageContext: `Error retrieving context: ${e.message}`,
            pageType: 'general'
          });
     }
  }
});