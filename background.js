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
function combineDrupalJira(drupalOrgIssues, jiraIssues) {

  // @todo Dynamically request user via json.
  function getDrupalUserNameForUid(id) {
    switch (id) {
      case '3685163':
        return 'kunal.sachdev';
      case '205645':
        return 'phenaproxima';
      case '3685174':
        return 'yash.rode';
      case '3688861':
        return 'Theresa.Grannum';
      case '3685158':
        return 'omkarpodey';
      case '240860':
        return 'tedbow';
      default:
        return 'Other';
    }
  }

  return jiraIssues.map(jiraIssue => {
   if(jiraIssue.hasOwnProperty('drupalIssueId')) {
     drupalOrgIssues.every(drupalOrgIssue => {
       if (drupalOrgIssue.nid === jiraIssue.drupalIssueId) {
         // convert to text.
         jiraIssue.drupalStatus = utils.getStatusForId(drupalOrgIssue.field_issue_status);
         if (drupalOrgIssue.hasOwnProperty('field_issue_assigned') && drupalOrgIssue.field_issue_assigned.hasOwnProperty('id')) {
           jiraIssue.drupalUserName = getDrupalUserNameForUid(drupalOrgIssue.field_issue_assigned.id);
         }
         return false;
       }
       return true;
     })

   }
   return jiraIssue;
 });
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
    fetch(url)
        .then((response) => response.text())
        .then((text) => parseJiraIssuesJson(text))
        .then((issues) => sendResponse({issues: issues}));

    return true; // Will respond asynchronously.
  }
  if (request.call === "fetchJIraIssuesByIds") {
    let searchFragments = [];
    request.ids.forEach(function (id) {
      searchFragments.push(`id=${id}`);
    });
    url += searchFragments.join(" or ");
    let jiraIssues;
    fetch(url)
        .then((response) => response.text())
        .then((text) => parseJiraIssuesJson(text))
        .then(issues => {
          jiraIssues = issues;
          return issues;
        })
        .then((issues) => Promise.all(
            issues.filter(
                issue => issue.hasOwnProperty('drupalIssueId')
            ).
            map(
                issue => fetch(`https://www.drupal.org/api-d7/node/${issue.drupalIssueId}.json`)
            )
        ))
        //.then((promises) => promises.map(promise => promise.then((response) => response.text())))
        .then(
            (promises) => Promise.all(promises.map(response => response.text()))
        )
        .then(drupalTexts => drupalTexts.map(drupalText => {
          try {
            return JSON.parse(drupalText);
          }
          catch (e) {
            return false;
          }
        }).filter(decoded => decoded !== false))
        .then(
            (drupalIssues => combineDrupalJira(drupalIssues, jiraIssues))
        )
        .then((issues) => sendResponse({issues: issues}));
    return true;
  }
});
