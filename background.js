// This code opens the sidebar when you click the "F" icon
chrome.action.onClicked.addListener((tab) => {
  chrome.sidePanel.open({ tabId: tab.id });
});

// This function will be injected into the page to get its text
function getPageContent() {
  const main = document.querySelector('main');
  if (main) return main.innerText;
  return document.body.innerText;
}

// This gets the page's entire HTML for analysis
function getPageHtml() {
  return document.documentElement.outerHTML;
}

// This runs ONCE when the extension is installed
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "askFlowMentor",
    title: "FlowMentor: Ask about this code",
    contexts: ["selection"]
  });
  chrome.contextMenus.create({
    id: "getCodeFlowMentor",
    title: "FlowMentor: Get code for this",
    contexts: ["selection"]
  });
  chrome.contextMenus.create({
    id: "pageContextMentor",
    title: "FlowMentor: Ask about this (with page context)",
    contexts: ["selection"]
  });
  chrome.contextMenus.create({
    id: "translateFlowMentor",
    title: "FlowMentor: Translate this",
    contexts: ["selection"]
  });
  
  chrome.contextMenus.create({
    id: "analyzeTechStack",
    title: "FlowMentor: Analyze this page's tech",
    contexts: ["page"] // Triggers on the page itself
  });
});

// This listens for when the user CLICKS ANY menu item
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  
  // --- Task 1: Debug Code ---
  if (info.menuItemId === "askFlowMentor" && info.selectionText) {
    await chrome.sidePanel.open({ tabId: tab.id });
    await chrome.storage.local.set({
      task: 'debug',
      newCodeSnippet: info.selectionText
    });
  }

  // --- Task 2: Get Component Code ---
  if (info.menuItemId === "getCodeFlowMentor" && info.selectionText) {
    await chrome.sidePanel.open({ tabId: tab.id });
    await chrome.storage.local.set({
      task: 'getCode',
      newCodeSnippet: info.selectionText
    });
  }

  // --- Task 3: Page-Aware Assistant ---
  if (info.menuItemId === "pageContextMentor" && info.selectionText) {
    await chrome.sidePanel.open({ tabId: tab.id });

    const [result] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: getPageContent
    });

    let pageType = 'general';
    if (tab.url && tab.url.includes("youtube.com/watch")) {
      pageType = 'youtube';
    }

    await chrome.storage.local.set({
      task: 'pageContext',
      pageQuestion: info.selectionText, 
      pageContext: result ? result.result : "Could not read page content.",
      pageType: pageType 
    });
  }

  // --- Task 4: Translate Task ---
  if (info.menuItemId === "translateFlowMentor" && info.selectionText) {
    await chrome.sidePanel.open({ tabId: tab.id });
    await chrome.storage.local.set({
      task: 'translate',
      newCodeSnippet: info.selectionText
    });
  }

  // --- Task 5: Analyze Tech Stack (FIXED) ---
  if (info.menuItemId === "analyzeTechStack") {
    await chrome.sidePanel.open({ tabId: tab.id });

    const [result] = await chrome.scripting.executeScript({
      target: { tabId: tab.id }, // <-- This is now correct (was tab.g)
      func: getPageHtml 
    });

    await chrome.storage.local.set({
      task: 'analyzeTech',
      pageHtml: result ? result.result : "Could not read page HTML."
    });
  }
});