const jiraConfig = {
  "jira_create_url":
    "https://backlog.acquia.com/secure/CloneIssueDetails!default.jspa?id=12348176",
  "jira_base_url": "https://backlog.acquia.com/"
};
const utils = {
  "getIssueIdFromUrl":
   function (url) {
    let parts = url.split("/");
    let lastPart = parts[parts.length - 1];
    parts = lastPart.split("#");
    return parts[0];
  }
}
export { jiraConfig, utils };
