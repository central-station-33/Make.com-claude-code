## Retool API Access
- Base URL: https://api.retool.com/api/v2
- Auth: Bearer token
- Key env var: RETOOL_API_KEY
- Use header: Authorization: Bearer $RETOOL_API_KEY

## Available endpoints
- GET /resources — list all resources
- GET /spaces — list spaces/apps
- POST /workflows/{workflowId}/startTrigger — trigger a workflow
