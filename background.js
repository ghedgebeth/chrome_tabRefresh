// background.js - v1.2 Tab Auto Refresh Extension with adjustable interval and annotations

// Map to store active refresh intervals per tab
let intervals = {};

// Map to store custom refresh intervals per tabId
let refreshIntervals = {}; // Format: { tabId: intervalMs }

// Start refreshing a specific tab using a specified interval in milliseconds
function startRefreshing(tabId, intervalMs) {
  stopRefreshing(tabId); // Prevent multiple intervals for the same tab

  // Create a repeating timer to reload the tab at the given interval
  intervals[tabId] = setInterval(() => {
    chrome.tabs.get(tabId, (tab) => {
      // Skip if tab is invalid or not a normal web page
      if (chrome.runtime.lastError || !tab || !tab.url.startsWith("http")) return;

      // Reload the tab using scripting API
      chrome.scripting.executeScript({
        target: { tabId },
        func: () => location.reload()
      });
    });
  }, intervalMs);

  refreshIntervals[tabId] = intervalMs; // Save the interval for persistence
}

// Stop refreshing a specific tab
function stopRefreshing(tabId) {
  if (intervals[tabId]) {
    clearInterval(intervals[tabId]); // Clear the timer
    delete intervals[tabId];
    delete refreshIntervals[tabId]; // Remove stored interval
  }
}

// Handle messages from popup (start/stop refresh or update interval)
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  const { tabId, action, interval } = msg; // Message includes tabId, action, and interval

  chrome.storage.local.get("refreshTabs", (data) => {
    const refreshTabs = data.refreshTabs || {}; // Retrieve stored state

    if (action === "start") {
      refreshTabs[tabId] = interval; // Save the interval for this tab
      startRefreshing(tabId, interval); // Start refresh cycle
    } else if (action === "stop") {
      delete refreshTabs[tabId]; // Remove from storage
      stopRefreshing(tabId); // Stop the interval
    }

    chrome.storage.local.set({ refreshTabs }); // Persist state
    sendResponse({ status: "ok" });
  });

  return true; // Indicates async response
});

// Restore all active refreshers on browser startup
chrome.runtime.onStartup.addListener(() => {
  chrome.storage.local.get("refreshTabs", (data) => {
    const refreshTabs = data.refreshTabs || {};
    for (const tabId in refreshTabs) {
      const interval = refreshTabs[tabId];
      startRefreshing(parseInt(tabId), interval); // Resume with stored interval
    }
  });
});

// Cleanup when a tab is closed
chrome.tabs.onRemoved.addListener((tabId) => {
  stopRefreshing(tabId); // Stop timer
  chrome.storage.local.get("refreshTabs", (data) => {
    const refreshTabs = data.refreshTabs || {};
    delete refreshTabs[tabId]; // Remove from storage
    chrome.storage.local.set({ refreshTabs });
  });
});
