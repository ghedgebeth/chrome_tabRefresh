const container = document.getElementById("tabsContainer");

// Format milliseconds to readable text
function formatInterval(ms) {
  if (ms < 60000) return `${ms / 1000}s`;
  return `${ms / 60000}m`;
}

chrome.tabs.query({}, (tabs) => {
  chrome.storage.local.get("refreshTabs", (data) => {
    const refreshTabs = data.refreshTabs || {};

    tabs.forEach((tab) => {
      if (!tab.url.startsWith("http")) return;

      const interval = refreshTabs[tab.id] || 30000; // Default 30s
      const isChecked = tab.id in refreshTabs;

      const tabDiv = document.createElement("div");
      tabDiv.className = "tab";

      const title = document.createElement("div");
      title.className = "tab-title";
      title.textContent = tab.title.slice(0, 50);

      const controls = document.createElement("div");
      controls.className = "controls";

      // Toggle Switch
      const switchLabel = document.createElement("label");
      switchLabel.className = "switch";

      const toggleInput = document.createElement("input");
      toggleInput.type = "checkbox";
      toggleInput.checked = isChecked;

      const toggleSlider = document.createElement("span");
      toggleSlider.className = "slider";

      switchLabel.appendChild(toggleInput);
      switchLabel.appendChild(toggleSlider);

      // Slider for interval
      const intervalSlider = document.createElement("input");
      intervalSlider.type = "range";
      intervalSlider.min = 30000;
      intervalSlider.max = 300000;
      intervalSlider.step = 30000;
      intervalSlider.value = interval;
      intervalSlider.style.width = "130px";

      const intervalLabel = document.createElement("div");
      intervalLabel.className = "interval-label";
      intervalLabel.textContent = `Every ${formatInterval(intervalSlider.value)}`;

      // Events
      toggleInput.addEventListener("change", () => {
        const action = toggleInput.checked ? "start" : "stop";
        chrome.runtime.sendMessage({
          tabId: tab.id,
          action,
          interval: parseInt(intervalSlider.value)
        });
      });

      intervalSlider.addEventListener("input", () => {
        intervalLabel.textContent = `Every ${formatInterval(intervalSlider.value)}`;
        if (toggleInput.checked) {
          chrome.runtime.sendMessage({
            tabId: tab.id,
            action: "start",
            interval: parseInt(intervalSlider.value)
          });
        }
      });

      controls.appendChild(intervalSlider);
      controls.appendChild(switchLabel);

      tabDiv.appendChild(title);
      tabDiv.appendChild(controls);
      tabDiv.appendChild(intervalLabel);
      container.appendChild(tabDiv);
    });
  });
});
