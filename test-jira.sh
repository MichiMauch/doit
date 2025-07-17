#!/bin/bash

# Ersetze diese Werte mit deinen echten Jira-Daten
JIRA_URL="https://your-domain.atlassian.net"
JIRA_EMAIL="your-email@example.com"
JIRA_TOKEN="your-api-token"
PROJECTS='["TEST", "PROJ"]'

curl -X POST http://localhost:3001/api/jira/test \
  -H "Content-Type: application/json" \
  -d "{
    \"url\": \"$JIRA_URL\",
    \"email\": \"$JIRA_EMAIL\",
    \"token\": \"$JIRA_TOKEN\",
    \"projects\": $PROJECTS
  }" | jq .