(async () => {
    let src = chrome.runtime.getURL("config.js");
    const { jiraConfig } = await import(src);
    src = chrome.runtime.getURL("common.js");
    const { utils } = await import(src);

    // Create a fixed position container at the top of the page
    const topContainer = document.createElement('div');
    topContainer.id = 'drupal-org-persistent-container';
    topContainer.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100px;
        background-color: #f5f5f5;
        border-bottom: 1px solid #ddd;
        padding: 5px 10px;
        z-index: 10000;
        display: flex;
        align-items: center;
        height: 30px;
    `;

    // Add a link to #drupal-org-persistent-container that will remove the element.
    const closeLink = document.createElement('a');
    closeLink.innerText = "X";
    closeLink.style.cssText = `
        cursor: pointer;
        margin-left: auto;
        font-weight: bold;
        color: #0074bd;
    `;
    closeLink.onclick = function() {
        topContainer.remove();
        document.querySelectorAll('#drupal-org-persistent-container').forEach(el => el.remove());
    }
    topContainer.appendChild(closeLink);

    // Create the drupal.org link
    const link = document.createElement('div');
    link.innerText = "drupal.org";
    link.id = "drupal-org-trigger";
    link.className = 'drupal-trigger-active';
    link.style.cssText = `
        cursor: pointer;
        padding: 3px 10px;
        border-radius: 3px;
        background-color: #0074bd;
        color: white;
        font-weight: bold;
    `;
    link.onclick = function() {triggerDrupalIntegration()};

    // Add the link to the container
    topContainer.appendChild(link);

    // Add the container to the document body
    document.body.prepend(topContainer);

    function triggerDrupalIntegration() {
        const triggerElement = document.getElementById('drupal-org-trigger');
        triggerElement.className = 'drupal-trigger-waiting';
        const oldTriggerText = triggerElement.innerText;
        triggerElement.innerText = '💧⏱....'
        document.querySelectorAll('.drupal-issue-link').forEach(el => el.remove());
        let ids = [];
        
        //This is for the listing page
        document.querySelectorAll('a[data-testid="native-issue-table.common.ui.issue-cells.issue-key.issue-key-cell"]').forEach(function (div) {
            jiraid = div.getAttribute('href').replace('/browse/','')
            ids.push(jiraid);
            div.setAttribute("data-issue-id", jiraid);
        });

        //This is for the sprint page
        document.querySelectorAll('div[data-testid="platform-card.common.ui.key.key"] > div > a').forEach(function (div) {
            jiraid = div.getAttribute('href').replace('/browse/','')
            ids.push(jiraid);
            div.setAttribute("data-issue-id", jiraid);
        });

        //This is for the issue page on JIRA
        document.querySelectorAll('a[data-testid="issue.views.issue-base.foundation.breadcrumbs.current-issue.item"]').forEach(function (div) {
            jiraid = div.getAttribute('href').replace('/browse/','')
            ids.push(jiraid);
            div.setAttribute("data-issue-id", jiraid);
        });
        

        function createDrupalLink(issue) {
            document.querySelectorAll(`a[data-issue-id="${issue.key}"]`).forEach(function (div) {
                if (issue.drupalUrl) {
                    let link = document.createElement("a");
                    link.className = 'drupal-issue-link';
                    link.setAttribute("href", issue.drupalUrl);
                    link.title = "Open on Drupal.org";
                    link.innerText = `💧`;
                    if(issue.hasOwnProperty('drupalUserName')) {
                        link.innerText += `: ${issue.drupalUserName}`;
                    }
                    if(issue.hasOwnProperty('drupalStatus')) {
                        link.innerText += `: ${issue.drupalStatus}`;
                    }
                    if (issue.hasOwnProperty('drupalOrgTags') && Array.isArray(issue.drupalOrgTags)) {
                        const tags = document.createElement("ul");
                        tags.className = 'drupal-issue-tags';
                        // If "Sprint" is not in tags make it clear.
                        if (!issue.drupalOrgTags.includes("Sprint")) {
                            const li = document.createElement("li");
                            li.innerText = "NOT Tagged Sprint";
                            li.style.color = "red";
                            tags.appendChild(li);
                        }
                        issue.drupalOrgTags.forEach(function (tag) {
                            const li = document.createElement("li");
                            li.innerText = tag;
                            tags.appendChild(li);
                        });
                        div.after(tags);

                    }
                    div.after(link);


                }

            });
        }


        // Send all issue ids on the page in 1 call.
        chrome.runtime.sendMessage(
            { call: "fetchJIraIssuesByIds", ids: ids },
            function (response) {
                response.issues.forEach(function (issue) {
                    createDrupalLink(issue);
                });
                triggerElement.className = 'drupal-trigger-active';
                triggerElement.innerText = oldTriggerText;
            }
        );
    }



})();
