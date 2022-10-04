
var tabs = document.getElementById('tabs');
if (tabs) {
    var tabLists = tabs.getElementsByTagName('ul');
    if (tabLists) {
        var tabList = tabLists.item(0);
        var node = document.createElement('li');
        var url = document.URL
        const regex = /https:\/\/www\.drupal\.org\/project\/automatic_updates\/issues\/.*/g;
        if (url.match(regex)) {
            var parts = url.split('/');
            var lastPart = parts[parts.length - 1];
            parts = lastPart.split('#');
            var issueId = parts[0];
            var jiraLink = document.createElement('a');
            var linkText = document.createTextNode("Find in jira");
            jiraLink.appendChild(linkText);
            jiraLink.title = "Search in jira";
            var search = `issues/${issueId}`;
            jiraLink.id = `jira-link-${issueId}`;
            jiraLink.href = `https://backlog.acquia.com/issues/?jql=text%20~%20%22${search}%22`;
            node.appendChild(jiraLink);
            tabList.appendChild(node);
            getJiraIssue(issueId, updateMainJiraLink)
        }
    }
}
var links = document.querySelectorAll('a');

links.forEach(function (link){
    var href = link.href;
    var regex = /\/project\/.*\/issues\/.*/g;
    if (href.match(regex)) {
        link.innerText += '***';
    }
});



//node.appendChild(document.createTextNode(issueId));



function handleError(error) {
    console.log(`Error: ${error}`);
}
function getJiraIssue(drupalIssueId, callback) {
    return new Promise(function () {
        chrome.runtime.sendMessage({call: 'fetchIssue', issue_id: issueId}, function(response) {
            if (response.issue.issueCnt === 1) {
                callback(response.issue);
            }
        });
    }, handleError);
}

function updateMainJiraLink (jiraIssue){
    var link = document.getElementById(`jira-link-${issueId}`);
    link.setAttribute('href', jiraIssue.url);
    link.title = 'Open in Jira'
    link.innerText = `Jira - ${jiraIssue.key}`;
    if (jiraIssue.assigned) {
        link.innerText += ` - assigned ${jiraIssue.assigned.displayName}`;
    }
    else {
        link.innerText += ` - unassigned`;
    }
    jiraLink.href = jiraIssue.url;
}





