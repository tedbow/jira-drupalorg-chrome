var imgURL = chrome.runtime.getURL("images/get_started16.png");
tabs = document.getElementById('tabs');
tabList = tabs.getElementsByTagName('ul').item(0);
var node = document.createElement('li');
url = document.URL
parts = url.split('/');
lastPart = parts[parts.length - 1];
parts = lastPart.split('#');
issueId = parts[0];
var jiraLink = document.createElement('a');
var linkText = document.createTextNode("Find in jira");
jiraLink.appendChild(linkText);
jiraLink.title = "Search in jira";
var search = `issues/${issueId}`;
jiraLink.id = `jira-link-${issueId}`;
jiraLink.href = `https://backlog.acquia.com/issues/?jql=text%20~%20%22${search}%22`;
node.appendChild(jiraLink);
//node.appendChild(document.createTextNode(issueId));

tabList.appendChild(node);

console.log('what');
chrome.runtime.sendMessage({call: 'fetchIssue', issue_id: issueId}, function(response) {
    if (response.issue.issueCnt === 1) {
        var link = document.getElementById(`jira-link-${issueId}`);
        link.setAttribute('href', response.issue.url);
        link.title = 'Open in Jira'
        link.innerText = `Jira - ${response.issue.key} - assigned ${response.issue.assigned.displayName}`;
        jiraLink.href = response.issue.url;
    }

});
