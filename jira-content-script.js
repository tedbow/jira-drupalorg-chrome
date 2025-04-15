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
                    // Open the link in new tab.
                    link.setAttribute("target", "_blank");
                    
                    // Create a container to hold all the content with proper styling
                    const linkContent = document.createElement('div');
                    linkContent.style.cssText = `
                        display: inline-block;
                        white-space: nowrap;
                    `;
                    
                    // Add the droplet icon
                    const icon = document.createElement('span');
                    icon.innerText = '💧';
                    linkContent.appendChild(icon);
                    
                    // Add username with special styling for unassigned
                    if(issue.hasOwnProperty('drupalUserName')) {
                        const separator = document.createElement('span');
                        separator.innerText = ': ';
                        linkContent.appendChild(separator);
                        
                        const username = document.createElement('span');
                        if (issue.drupalUserName === '(UNASSIGNED)') {
                            username.innerText = issue.drupalUserName;
                            username.style.cssText = `
                                color: #d04437;
                                font-weight: bold;
                                background-color: rgba(255, 235, 230, 0.7);
                                padding: 0 3px;
                                border-radius: 3px;
                                display: inline-block;
                            `;
                        } else {
                            username.innerText = issue.drupalUserName;
                        }
                        linkContent.appendChild(username);
                    }
                    
                    // Add status if available
                    if(issue.hasOwnProperty('drupalStatus')) {
                        const statusSeparator = document.createElement('span');
                        statusSeparator.innerText = ': ';
                        linkContent.appendChild(statusSeparator);
                        
                        const status = document.createElement('span');
                        status.innerText = issue.drupalStatus;
                        linkContent.appendChild(status);
                    }
                    
                    // Add the content to the link
                    link.appendChild(linkContent);
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
                        // Create a container for the tags
                        const tagsContainer = document.createElement("div");
                        tagsContainer.className = 'drupal-issue-tags-container';
                        tagsContainer.style.cssText = `
                            clear: both;
                            margin: 5px 0;
                            width: 100%;
                        `;
                        tagsContainer.appendChild(tags);
                        // Try to find suitable parent for insertion that can accommodate wider elements
                        let targetElement = div;
                        // Try to find a parent with enough width, go up to 3 levels
                        for (let i = 0; i < 3; i++) {
                            if (targetElement.parentElement) {
                                targetElement = targetElement.parentElement;
                            } else {
                                break;
                            }
                        }
                        
                        // Insert after the target element
                        if (targetElement.nextSibling) {
                            targetElement.parentNode.insertBefore(tagsContainer, targetElement.nextSibling);
                        } else {
                            targetElement.parentNode.appendChild(tagsContainer);
                        }

                    }
                    // Create a container for the link to ensure it has enough space
                    const linkContainer = document.createElement("div");
                    linkContainer.className = 'drupal-issue-link-container';
                    linkContainer.style.cssText = `
                        clear: both;
                        margin: 5px 0;
                        min-height: 22px;
                        width: 100%;
                    `;
                    linkContainer.appendChild(link);
                    // Try to find suitable parent for insertion that can accommodate wider elements
                    let targetElement = div;
                    // Try to find a parent with enough width, go up to 3 levels
                    for (let i = 0; i < 3; i++) {
                        if (targetElement.parentElement) {
                            targetElement = targetElement.parentElement;
                        } else {
                            break;
                        }
                    }
                    
                    // Insert after the target element
                    if (targetElement.nextSibling) {
                        targetElement.parentNode.insertBefore(linkContainer, targetElement.nextSibling);
                    } else {
                        targetElement.parentNode.appendChild(linkContainer);
                    }


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
