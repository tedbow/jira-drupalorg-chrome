(async () => {
  let src = chrome.runtime.getURL("config.js");
  const { jiraConfig } = await import(src);
  src = chrome.runtime.getURL("common.js");
  const { utils } = await import(src);

  var issueIds = [];
  var pageIssueId;
  var url = document.URL;

  function createPlaceHolder(issueId) {
    var div = document.createElement("div");
    div.className = `jira-issue jira-issue-${issueId}`;
    div.innerText = "⏱";
    return div;
  }

// Add placeholder for message div on issue page
  const regex =
      /https:\/\/www\.drupal\.org\/project\/(automatic_updates|experience_builder)\/issues\/.*/g;
  if (url.match(regex)) {
    var issueId = utils.getIssueIdFromUrl(url);
    pageIssueId = issueId;
    issueIds.push(issueId);

    let messageDiv = document.createElement("div");
    messageDiv.id = "jira-issue-message";
    messageDiv.className = `messages jira-issue jira-issue-${issueId}`;

    // Create the placeholder link
    let link;
    link = document.createElement("a");
    link.setAttribute("href", jiraConfig.jira_create_url);
    link.title = "Create a Jira issue for this drupal.org issue";
    link.innerText = "⏱";

    // Add the link to the message div
    messageDiv.appendChild(link);

    // Insert the new div after any other messages, right before the #content-inner div
    const parentElement = document.querySelector("#content");
    const referenceElement = document.querySelector("#content-inner");
    parentElement.insertBefore(messageDiv, referenceElement);
  }
  var links = document.querySelectorAll("a");

// Add placeholder for all other issue links
  links.forEach(function (link) {
    var href = link.href;
    var regex = /\/project\/.*\/issues\/\d*/g;
    if (href.match(regex) && !href.includes("#")) {
      var issueId = utils.getIssueIdFromUrl(href);
      if (issueId === pageIssueId) {
        // Don't affect links to the current page.
        return;
      }
      var placeHolder = createPlaceHolder(issueId);
      link.parentElement.appendChild(placeHolder);
      if (issueIds.includes(issueId)) {
        return;
      }
      issueIds.push(issueId);
    }
  });

  function handleError(error) {
    console.log(`Error: ${error}`);
  }
  function createJiraLinks(issueIds) {
    function createJiraCreateIssueLinks() {
      document
          .querySelectorAll(".jira-issue:not(.jira-issue-found)")
          .forEach(function (div) {
            div.className += " jira-issue-found";
            div.innerText = "";
            link = document.createElement("a");
            link.setAttribute("href", jiraConfig.jira_create_url);
            link.title = "Create a Jira issue for this drupal.org issue";
            link.innerText = "Create a Jira issue";
            div.appendChild(link);
          });
    }

      // Send all issue ids on the page in 1 call.
      chrome.runtime.sendMessage(
          { call: "fetchJIraIssuesByDrupalIds", issueIds: issueIds },
          function (response) {
            response.issues.forEach(function (issue) {
              updatePlaceHoldersForIssue(issue);
            });
            createJiraCreateIssueLinks();
          }
      );
  }

  function updatePlaceHoldersForIssue(jiraIssue) {
    issueId = jiraIssue.drupalIssueId;
    var divs = document.getElementsByClassName(`jira-issue-${issueId}`);
    [].forEach.call(divs, function (div) {
      div.className += " jira-issue-found";
      let link = document.createElement("a");
      link.setAttribute("href", jiraIssue.url);
      link.title = "Open in Jira";
      link.innerText = `Jira: ${jiraIssue.key}`;
      if (jiraIssue.assigned) {
        link.innerText += ` - assigned ${jiraIssue.assigned.displayName}`;
      } else {
        link.innerText += ` - unassigned`;
      }
      link.innerText += ` - ${jiraIssue.status}`;
      if (jiraIssue.sprint) {
        link.innerText += ` #### ${jiraIssue.sprint}`;  
      }
      div.innerText = "";
      div.appendChild(link);
    });
  }
  createJiraLinks(issueIds);
})();


