// Initialize button with user's preferred color
let changeColor = document.getElementById("changeColor");

chrome.storage.sync.get("color", ({ color }) => {
  changeColor.style.backgroundColor = color;
});

// When the button is clicked, inject setPageBackgroundColor into current page
changeColor.addEventListener("click", async () => {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: setPageBackgroundColor,
  });
});

// The body of this function will be executed as a content script inside the
// current page
function setPageBackgroundColor() {
  chrome.storage.sync.get("color", ({ color }) => {
    document.body.style.backgroundColor = color;
  });
}

// Handle cache clearing
document.addEventListener('DOMContentLoaded', function() {
  const clearDrupalCacheButton = document.getElementById('clearDrupalCache');
  const clearTaxonomyCacheButton = document.getElementById('clearTaxonomyCache');
  const resultElement = document.getElementById('clearCacheResult');
  
  // Clear Drupal username cache
  clearDrupalCacheButton.addEventListener('click', async () => {
    try {
      // Send message to background script to clear cache
      const result = await chrome.runtime.sendMessage({
        call: "clearDrupalUserCache"
      });
      
      if (result.success) {
        resultElement.textContent = `Success! ${result.count} cached username(s) cleared.`;
        resultElement.style.color = 'green';
        
        // Hide the message after 3 seconds
        setTimeout(() => {
          resultElement.textContent = '';
        }, 3000);
      } else {
        resultElement.textContent = `Error: ${result.error}`;
        resultElement.style.color = 'red';
      }
    } catch (error) {
      resultElement.textContent = `Error: ${error.message}`;
      resultElement.style.color = 'red';
    }
  });
  
  // Clear taxonomy term cache
  clearTaxonomyCacheButton.addEventListener('click', async () => {
    try {
      // Send message to background script to clear cache
      const result = await chrome.runtime.sendMessage({
        call: "clearTaxonomyTermCache"
      });
      
      if (result.success) {
        resultElement.textContent = `Success! ${result.count} cached taxonomy term(s) cleared.`;
        resultElement.style.color = 'green';
        
        // Hide the message after 3 seconds
        setTimeout(() => {
          resultElement.textContent = '';
        }, 3000);
      } else {
        resultElement.textContent = `Error: ${result.error}`;
        resultElement.style.color = 'red';
      }
    } catch (error) {
      resultElement.textContent = `Error: ${error.message}`;
      resultElement.style.color = 'red';
    }
  });
});
