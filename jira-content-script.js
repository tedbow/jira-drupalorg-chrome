(async () => {
    const src = chrome.runtime.getURL("common.js");
    const { jiraConfig, utils } = await import(src);

    //.aui-header-primary .aui-nav
    document.querySelectorAll('.aui-header-primary .aui-nav').forEach(function (el){
        const link = document.createElement('a');
        link.setAttribute('href', '*');
        link.innerText = "DRUPAL";
        
        const li = document.createElement('li');
        li.appendChild(link);
        el.appendChild(li);
    });
    let ids = [];
    document.querySelectorAll('div[data-issue-id]').forEach(function (div) {
       ids.push(div.getAttribute('data-issue-id'));
    });

    function createDrupalLink(issue) {
        document.querySelectorAll(`div[data-issue-id="${issue.id}"]`).forEach(function (div) {
            if (issue.drupalUrl) {
                let link = document.createElement("a");
                link.setAttribute("href", issue.drupalUrl);
                link.title = "Open on Drupal.org";
                link.innerText = `Open on Drupal.org`;
            }

        });
    }

/*    chrome.runtime.sendMessage(
        { call: "fetchJIraIssuesByIds", ids: ids },
        function (response) {
            response.issues.forEach(function (issue) {
                createDrupalLink(issue);
            });
        }
    );*/


})();
