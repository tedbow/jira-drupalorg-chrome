(async () => {
  const src = chrome.runtime.getURL("config.js");
  const { jiraConfig } = await import(src);


  var tabs = document.getElementById("tabs");
  var issueIds = [];
  var pageIssueId;
  function createPlaceHolder(issueId) {
    var div = document.createElement("div");
    div.className = `jira-issue jira-issue-${issueId}`;
    div.innerText = "⏱";
    return div;
  }

// Add placeholder for tabs section
  if (tabs) {
    var tabLists = tabs.getElementsByTagName("ul");
    if (tabLists) {
      var tabList = tabLists.item(0);
      var node = document.createElement("li");
      var url = document.URL;
      const regex =
          /https:\/\/www\.drupal\.org\/project\/automatic_updates\/issues\/.*/g;
      if (url.match(regex)) {
        var issueId = getIssueIdFromUrl(url);
        pageIssueId = issueId;
        issueIds.push(issueId);
        node.appendChild(createPlaceHolder(issueId));
        tabList.appendChild(node);
      }
    }
  }
  var links = document.querySelectorAll("a");

// Add placeholder for all other issue links
  links.forEach(function (link) {
    var href = link.href;
    var regex = /\/project\/.*\/issues\/\d*/g;
    if (href.match(regex) && !href.includes("#")) {
      var issueId = getIssueIdFromUrl(href);
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
            link.setAttribute("href", main.jiraConfig.jira_create_url);
            link.title = "Create a Jira issue for this drupal.org issue";
            link.innerText = "Create a Jira issue";
            div.appendChild(link);
          });
    }

    return new Promise(function () {
      // Send all issue ids on the page in 1 call.
      chrome.runtime.sendMessage(
          { call: "fetchJIraIssues", issueIds: issueIds },
          function (response) {
            response.issues.forEach(function (issue) {
              updatePlaceHoldersForIssue(issue);
            });
            createJiraCreateIssueLinks();
          }
      );
    }, handleError);
  }

  function updatePlaceHoldersForIssue(jiraIssue) {
    issueId = jiraIssue.drupalIssueId;
    var divs = document.getElementsByClassName(`jira-issue-${issueId}`);
    [].forEach.call(divs, function (div) {
      div.className += " jira-issue-found";
      link = document.createElement("a");
      link.setAttribute("href", jiraIssue.url);
      link.title = "Open in Jira";
      link.innerText = `Jira: ${jiraIssue.key}`;
      if (jiraIssue.assigned) {
        link.innerText += ` - assigned ${jiraIssue.assigned.displayName}`;
      } else {
        link.innerText += ` - unassigned`;
      }
      div.innerText = "";
      div.appendChild(link);
    });
  }
  createJiraLinks(issueIds);
})();


