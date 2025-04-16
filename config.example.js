
// copy this file to config.js and update the domain to start.
// jira_create_url doesn't work now😭
const jiraConfig = {
    // JIRA configuration
    "jira_create_url":
        "https://my-domain.atlassian.net/secure/CloneIssueDetails!default.jspa?id=12345",
    "jira_base_url": "https://my-domain.atlassian.net/",
    "show_sprint_value": 0, //set this to true if you want to show sprint as well
    "sprint_custom_field_id": "customfield_xxxxx", //set this value to your custom field value from JIRA
    
    // Drupal.org API configuration
    "drupal_user_cache_days": 7, // Number of days to cache Drupal usernames (default is 7)
    "taxonomy_term_cache_days": 30 // Number of days to cache taxonomy terms (default is 30)
};
export { jiraConfig };
