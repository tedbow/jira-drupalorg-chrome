// background.js
import { jiraConfig, utils } from "./common.js";

function findDrupalIssueId(issue) {
  let description = issue.fields.description;
  const regex = /https:\/\/www\.drupal\.org\/project\/.*\/issues\/\d*/g;
  let matches = description.match(regex);

  if (matches && matches.length > 0) {
    let issueId;
    matches.forEach(function (match) {
      issueId = utils.getIssueIdFromUrl(match);
    });
    return issueId;
  }
}

function parseJiraIssuesJson(text) {
  let decoded;
  try {
    decoded = JSON.parse(text);
  } catch (e) {
    let b = "bb";
  }

  let issues = decoded.issues;
  let newIssues = [];
  issues.forEach(function (issue) {
    try {
      let newIssue = {};
      newIssue.url = `${jiraConfig.jira_base_url}browse/${issue.key}`;
      newIssue.id = issue.id;
      newIssue.key = issue.key;
      newIssue.assigned = issue.fields.assignee;
      const drupalId = findDrupalIssueId(issue);
      if (drupalId) {
        newIssue.drupalIssueId = drupalId;
        newIssue.drupalUrl = `https://www.drupal.org/i/${drupalId}`;
      }
      newIssues.push(newIssue);
    }
    catch (error) {
      console.error(error);
    }

  });
  return newIssues;
}
function fetchJson(url, parser, sendResponse) {
  fetch(url)
      .then((response) => response.text())
      .then((text) => sendResponse({ issues: parser(text) }))
      // @todo handle error.
      .catch((error) => sendResponse({ farewell: error }));
}
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  console.log(
    sender.tab
      ? "from a content script:" + sender.tab.url
      : "from the extension"
  );
  let url = `${jiraConfig.jira_base_url}rest/api/2/search?jql=`;
  if (request.call === "fetchJIraIssuesByDrupalIds") {
    let searchFragments = [];
    request.issueIds.forEach(function (issueId) {
      searchFragments.push(`description~%22issues/${issueId}%22`);
    });
    url += searchFragments.join(" or ");
    fetchJson(url, parseJiraIssuesJson, sendResponse)
    return true; // Will respond asynchronously.
  }
  if (request.call === "fetchJIraIssuesByIds") {
    let searchFragments = [];
    request.ids.forEach(function (id) {
      searchFragments.push(`id=${id}`);
    });
    url += searchFragments.join(" or ");
    fetchJson(url, parseJiraIssuesJson, sendResponse);
    return true;
  }
});
