// background.js

let color = '#3aa757';

chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.sync.set({ color });
    console.log('Default background color set to %cgreen', `color: ${color}`);
    alert("what");
});

chrome.tabs.onUpdated.addListener( function (tabId, changeInfo, tab) {
    if (changeInfo.status === 'complete') {
        alert("dhw");
    }
})
function parseIssueJson(text, issueId) {
  data = JSON.parse(text);
  issues = data.issues;
  issueCnt = issues.length;
  var response = {issueCnt: issueCnt};
  if (issueCnt === 1) {
      issue = issues[0];
      response.issueId = issueId;
      response.url = `https://backlog.acquia.com/browse/${issue.key}`
      response.key = issue.key;
      response.assigned = issue.fields.assignee;
  }
  return response;
}
chrome.runtime.onMessage.addListener(

    function(request, sender, sendResponse) {
        console.log(sender.tab ?
            "from a content script:" + sender.tab.url :
            "from the extension");
        if (request.call === "fetchIssue") {
            var url = `https://backlog.acquia.com/rest/api/2/search?jql=description~%22issues/${request.issue_id}%22`;
            fetch(url)
                .then(response => response.text())
                .then(text => sendResponse({issue: parseIssueJson(text, request.issue_id)}))
                //.then(price => sendResponse(price))
                .catch(error => sendResponse({farewell: error}));

            return true; // Will respond asynchronously.
            sendResponse({farewell: `id = ${request.issue_id}`});
        }

    }
);
