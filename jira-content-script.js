(async () => {
    const src = chrome.runtime.getURL("common.js");
    const { jiraConfig, utils } = await import(src);


})();
