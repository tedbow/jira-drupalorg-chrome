function getIssueIdFromUrl(url) {
    let parts = url.split('/');
    let lastPart = parts[parts.length - 1];
    parts = lastPart.split('#');
    return parts[0];
}
