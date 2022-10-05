
var tabs = document.getElementById('tabs');
var issueIds = [];
var pageIssueId;
function createPlaceHolder(issueId) {
    var div = document.createElement('div');
    div.className = `jira-issue jira-issue-${issueId}`;
    div.innerText = "⏱";
    return div;

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
            pageIssueId = issueId;
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



//node.appendChild(document.createTextNode(issueId));



function handleError(error) {
    console.log(`Error: ${error}`);
}
function createJiraLinks(issueIds) {
    return new Promise(function () {
        chrome.runtime.sendMessage({call: 'fetchIssue', issueIds: issueIds}, function(response) {
            response.issues.forEach(function (issue) {
                updateMainJiraLink(issue);
            });
        });
    }, handleError);
}

function updateMainJiraLink (jiraIssue){
    issueId = jiraIssue.drupalIssueId;
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
createJiraLinks(issueIds);





