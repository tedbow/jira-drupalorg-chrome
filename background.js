// background.js
import { utils } from "./common.js";
import { jiraConfig } from "./config.js";

function findDrupalIssueId(issue) {
  let description = issue.fields.description;
  const regex = /https:\/\/www\.drupal\.org\/project\/.*\/issues\/\d*/g;
  if (description) {
    let matches = description.match(regex);

    if (matches && matches.length > 0) {
      let issueId;
      matches.forEach(function (match) {
        issueId = utils.getIssueIdFromUrl(match);
      });
      return issueId;
    }
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
      newIssue.status = issue.fields.status.name;
      newIssue.sprint = "";
      if (jiraConfig.show_sprint_value) { 
        if (issue['fields'][jiraConfig.sprint_custom_field_id]) {
          newIssue.sprint = issue['fields'][jiraConfig.sprint_custom_field_id][0].name;
        }
      }
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
// Get username from cached data or fetch from API.
async function getDrupalUserNameForUid(id) {
    // Check if we have a cached version
    const cacheKey = `drupal_user_${id}`;
    const cacheData = await chrome.storage.local.get(cacheKey);
    
    if (cacheData[cacheKey]) {
      const userData = cacheData[cacheKey];
      const cacheExpiry = userData.timestamp + (jiraConfig.drupal_user_cache_days || 7) * 24 * 60 * 60 * 1000;
      
      // Return cached data if not expired
      if (Date.now() < cacheExpiry) {
        return userData.username;
      }
    }
    
    // Fetch fresh data from API
    try {
      const response = await fetch(`https://www.drupal.org/api-d7/user/${id}.json`);
      const userData = await response.json();
      
      // Cache the result
      const cacheObject = {};
      cacheObject[cacheKey] = {
        username: userData.name,
        timestamp: Date.now()
      };
      
      await chrome.storage.local.set(cacheObject);
      return userData.name;
    } catch (error) {
      console.error(`Failed to fetch username for user ID ${id}:`, error);
      return 'Unknown';
    }
  }

// Function to clear username cache
async function clearDrupalUserCache() {
  try {
    const allStorage = await chrome.storage.local.get(null);
    const userCacheKeys = Object.keys(allStorage).filter(key => key.startsWith('drupal_user_'));
    
    if (userCacheKeys.length > 0) {
      await chrome.storage.local.remove(userCacheKeys);
      return { success: true, count: userCacheKeys.length };
    }
    return { success: true, count: 0 };
  } catch (error) {
    console.error('Error clearing Drupal user cache:', error);
    return { success: false, error: error.message };
  }
}

function combineDrupalJira(drupalOrgIssues, jiraIssues) {
  // @todo Dynamically get tags names but also store locally to avoid calls every time
  //   or add this config.js property.
  const knownTags = {
    "31228": 'Sprint',
    "192148": 'stable blocker',
    "345": "Needs tests",
  }
  return jiraIssues.map(jiraIssue => {
   if(jiraIssue.hasOwnProperty('drupalIssueId')) {
     drupalOrgIssues.every(drupalOrgIssue => {
       if (drupalOrgIssue.nid === jiraIssue.drupalIssueId) {
         jiraIssue.drupalOrgTags = [];
         // convert to text.
         jiraIssue.drupalStatus = utils.getStatusForId(drupalOrgIssue.field_issue_status);
         if (drupalOrgIssue.hasOwnProperty('field_issue_assigned') && drupalOrgIssue.field_issue_assigned.hasOwnProperty('id')) {
           // Store the user ID first, then we'll process usernames later
           jiraIssue.drupalUserId = drupalOrgIssue.field_issue_assigned.id;
           jiraIssue.drupalUserName = 'Loading...';
         } else {
           // Issue is unassigned
           jiraIssue.drupalUserName = '(UNASSIGNED)';
         }
         if (drupalOrgIssue.hasOwnProperty('taxonomy_vocabulary_9')) {

           drupalOrgIssue.taxonomy_vocabulary_9.forEach(function (tag) {
             if (knownTags.hasOwnProperty(tag.id)) {
               jiraIssue.drupalOrgTags.push(knownTags[tag.id]);
             }
           })
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
  
  if (request.call === "clearDrupalUserCache") {
    clearDrupalUserCache().then(result => {
      sendResponse(result);
    });
    return true; // Will respond asynchronously
  }
  
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
        .then(async (issues) => {
          // Process usernames asynchronously
          const issuesWithUserNames = [...issues];
          for (const issue of issuesWithUserNames) {
            if (issue.hasOwnProperty('drupalUserId')) {
              try {
                issue.drupalUserName = await getDrupalUserNameForUid(issue.drupalUserId);
              } catch (error) {
                console.error('Error fetching username:', error);
              }
            }
          }
          return issuesWithUserNames;
        })
        .then((issues) => sendResponse({issues: issues}));
    return true;
  }
});
