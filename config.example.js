
// copy this file to config.js and update the domain to start.
// jira_create_url doesn't work now😭
const jiraConfig = {
    "jira_create_url":
        "https://my-domain.atlassian.net/secure/CloneIssueDetails!default.jspa?id=12345",
    "jira_base_url": "https://my-domain.atlassian.net/",
    "show_sprint_value": 0; //set this to true if you want to show sprint as well
    "sprint_custom_field_id": "customfield_xxxxx"; //set this value to your custom field value from JIRA
    // Enable/disable enhancements to drupal.org.
    "enable_drupalorg_enhancements": true,
    // Enable/disable enhancements to Jira at `jira_base_url`.
    "enable_jira_enhancements": true
};
export { jiraConfig };
