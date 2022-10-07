// background.js
import main from "./config.js";
// why isn't the import working?
function getIssueIdFromUrl(url) {
  let parts = url.split("/");
  let lastPart = parts[parts.length - 1];
  parts = lastPart.split("#");
  return parts[0];
}

function findDrupalIssueId(issue) {
  let description = issue.fields.description;
  const regex = /https:\/\/www\.drupal\.org\/project\/.*\/issues\/\d*/g;
  let matches = description.match(regex);

  if (matches.length > 0) {
    let issueId;
    matches.forEach(function (match) {
      issueId = getIssueIdFromUrl(match);
    });
    return issueId;
  }
}

function parseIssueJson(text) {
  let decoded;
  try {
    decoded = JSON.parse(text);
  } catch (e) {
    let b = "bb";
  }

  let issues = decoded.issues;
  let newIssues = [];
  issues.forEach(function (issue) {
    let newIssue = {};
    newIssue.url = `${main.config.jira_base_url}browse/${issue.key}`;
    newIssue.key = issue.key;
    newIssue.assigned = issue.fields.assignee;
    newIssue.drupalIssueId = findDrupalIssueId(issue);
    newIssues.push(newIssue);
  });
  return newIssues;
}
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  console.log(
    sender.tab
      ? "from a content script:" + sender.tab.url
      : "from the extension"
  );
  if (request.call === "fetchJIraIssues") {
    let url = `${main.config.jira_base_url}rest/api/2/search?jql=`;
    let searchFragments = [];
    request.issueIds.forEach(function (issueId) {
      searchFragments.push(`description~%22issues/${issueId}%22`);
    });
    url += searchFragments.join(" or ");
    fetch(url)
      .then((response) => response.text())
      .then((text) => sendResponse({ issues: parseIssueJson(text) }))
      // @todo handle error.
      .catch((error) => sendResponse({ farewell: error }));

    return true; // Will respond asynchronously.
  }
});
