(async () => {
    let configSrc = chrome.runtime.getURL("config.js");
    let commonSrc = chrome.runtime.getURL("common.js");

    let jiraConfig = {};

    try {
      ({ jiraConfig } = await import(configSrc));
    } catch (error) {
      console.error(`Failed to import '${configSrc}': ${error.message}`);
      if (error.message.includes("Failed to fetch dynamically imported module")) {
        console.error(
          "Config file 'config.js' not found in jira-drupalorg-chrome extension. See 'config.example.js' in its root directory for instructions for creating one."
        );
      }
      return;
    }

    // Enable/disable this feature in `config.js`.
    if (
      jiraConfig &&
      jiraConfig.hasOwnProperty('enable_jira_enhancements')
      && jiraConfig.enable_jira_enhancements === false
    ) {
      return;
    }

    const { utils } = await import(commonSrc);

    //.aui-header-primary .aui-nav
    document.querySelectorAll('#ak-jira-navigation').forEach(function (el){
        const link = document.createElement('div');
        //link.setAttribute('href', '*');
        link.innerText = "drupal.org";
        link.id = "drupal-org-trigger"
        link.className = 'drupal-trigger-active'
        link.onclick = function() {triggerDrupalIntegration()};
        const divE = document.createElement('div');
        divE.appendChild(link);
        el.appendChild(divE);
    });


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
