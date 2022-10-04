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
jiraLink.title = "my title text";
var search = `issues/${issueId}`;
jiraLink.href = `https://backlog.acquia.com/issues/?jql=text%20~%20%22${search}%22`;
node.appendChild(jiraLink);
//node.appendChild(document.createTextNode(issueId));

tabList.appendChild(node);

console.log('what');
chrome.runtime.sendMessage({call: 'fetchIssue', issue_id: issueId}, function(response) {
    console.log(response.farewell);
});
