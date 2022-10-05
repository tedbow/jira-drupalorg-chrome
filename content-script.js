
var tabs = document.getElementById('tabs');
var issueIds = [];
function createPlaceHolder(issueId) {
    var div = document.createElement('div');
    div.className = `jira-issue jira-issue-${issueId}`;
    div.innerText = "⏱";
    return div;

}

function getIssueIdFromUrl(url) {
    var parts = url.split('/');
    var lastPart = parts[parts.length - 1];
    parts = lastPart.split('#');
    return parts[0];
}

if (tabs) {
    var tabLists = tabs.getElementsByTagName('ul');
    if (tabLists) {
        var tabList = tabLists.item(0);
        var node = document.createElement('li');
        var url = document.URL
        const regex = /https:\/\/www\.drupal\.org\/project\/automatic_updates\/issues\/.*/g;
        if (url.match(regex)) {
            var issueId = getIssueIdFromUrl(url);
            issueIds.push(issueId);
            node.appendChild(createPlaceHolder(issueId));
            tabList.appendChild(node);
        }
    }
}
var links = document.querySelectorAll('a');

links.forEach(function (link){
    var href = link.href;
    var regex = /\/project\/.*\/issues\/.*/g;
    if (href.match(regex)) {
        var issueId = getIssueIdFromUrl(href);
        if (issueIds.includes(issueId)) {
            return;
        }
        issueIds.push(issueId);
        var placeHolder = createPlaceHolder(issueId);
        link.append(placeHolder);
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
    var divs = document.getElementsByClassName(`jira-issue-${issueId}`);
    [].forEach.call(divs, function (div) {
        link = document.createElement('a');
        link.setAttribute('href', jiraIssue.url);
        link.title = 'Open in Jira'
        link.innerText = `Jira - ${jiraIssue.key}`;
        if (jiraIssue.assigned) {
            link.innerText += ` - assigned ${jiraIssue.assigned.displayName}`;
        }
        else {
            link.innerText += ` - unassigned`;
        }
        div.innerText = '';
        div.appendChild(link);
    });

}





