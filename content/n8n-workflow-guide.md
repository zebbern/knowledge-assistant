# n8n Workflow JSON Generation Guide

This document provides the complete structure and examples for generating n8n workflow JSON that can be imported directly into n8n.

## ⚠️ CRITICAL OUTPUT RULES

**ALWAYS format workflow JSON in a markdown code block like this:**

\`\`\`json
{
"name": "Workflow Name",
"nodes": [...],
"connections": {...}
}
\`\`\`

**NEVER output JSON as plain text without the code block markers!**

**For Discord webhooks: Use HTTP Request node, NOT the Discord node!** The Discord node requires bot credentials. HTTP Request is simpler for webhooks.

---

## Basic Workflow Structure

Every n8n workflow JSON has this structure:

```json
{
  "name": "Workflow Name",
  "nodes": [],
  "connections": {},
  "active": false,
  "settings": {
    "executionOrder": "v1"
  },
  "versionId": "1",
  "meta": {
    "instanceId": "generated"
  },
  "tags": []
}
```

## Node Structure

Each node follows this pattern:

```json
{
  "id": "unique-uuid-here",
  "name": "Node Display Name",
  "type": "n8n-nodes-base.nodetype",
  "typeVersion": 1,
  "position": [x, y],
  "parameters": {}
}
```

### Position Guidelines

- Start nodes at position [250, 300]
- Space nodes 250 pixels apart horizontally
- Align nodes at same Y position for linear flows

## Connection Structure

Connections define how nodes link together:

```json
{
  "connections": {
    "Source Node Name": {
      "main": [
        [
          {
            "node": "Target Node Name",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  }
}
```

For nodes with multiple outputs (like IF):

```json
{
  "IF Node Name": {
    "main": [
      [{ "node": "True Branch Node", "type": "main", "index": 0 }],
      [{ "node": "False Branch Node", "type": "main", "index": 0 }]
    ]
  }
}
```

---

## Common Trigger Nodes

### Manual Trigger (Start workflows manually)

```json
{
  "id": "trigger-1",
  "name": "Manual Trigger",
  "type": "n8n-nodes-base.manualTrigger",
  "typeVersion": 1,
  "position": [250, 300],
  "parameters": {}
}
```

### Webhook Trigger (HTTP endpoint)

```json
{
  "id": "webhook-1",
  "name": "Webhook",
  "type": "n8n-nodes-base.webhook",
  "typeVersion": 2,
  "position": [250, 300],
  "parameters": {
    "httpMethod": "POST",
    "path": "my-webhook-path",
    "responseMode": "onReceived",
    "responseData": "allEntries"
  },
  "webhookId": "unique-webhook-id"
}
```

### Schedule Trigger (Cron)

```json
{
  "id": "schedule-1",
  "name": "Schedule Trigger",
  "type": "n8n-nodes-base.scheduleTrigger",
  "typeVersion": 1.2,
  "position": [250, 300],
  "parameters": {
    "rule": {
      "interval": [
        {
          "field": "hours",
          "hoursInterval": 1
        }
      ]
    }
  }
}
```

---

## Data Processing Nodes

### Set Node (Set/Transform data)

```json
{
  "id": "set-1",
  "name": "Set Data",
  "type": "n8n-nodes-base.set",
  "typeVersion": 3.4,
  "position": [500, 300],
  "parameters": {
    "mode": "manual",
    "duplicateItem": false,
    "assignments": {
      "assignments": [
        {
          "id": "assignment-1",
          "name": "fieldName",
          "value": "fieldValue",
          "type": "string"
        },
        {
          "id": "assignment-2",
          "name": "numberField",
          "value": "={{ $json.someNumber * 2 }}",
          "type": "number"
        }
      ]
    }
  }
}
```

### Code Node (JavaScript)

```json
{
  "id": "code-1",
  "name": "Code",
  "type": "n8n-nodes-base.code",
  "typeVersion": 2,
  "position": [500, 300],
  "parameters": {
    "mode": "runOnceForAllItems",
    "jsCode": "// Process all items\nconst results = [];\nfor (const item of $input.all()) {\n  results.push({\n    json: {\n      processed: item.json.data,\n      timestamp: new Date().toISOString()\n    }\n  });\n}\nreturn results;"
  }
}
```

### Function Node (Run Once Per Item)

```json
{
  "id": "code-per-item",
  "name": "Transform Item",
  "type": "n8n-nodes-base.code",
  "typeVersion": 2,
  "position": [500, 300],
  "parameters": {
    "mode": "runOnceForEachItem",
    "jsCode": "// Transform single item\nreturn {\n  json: {\n    ...item.json,\n    newField: item.json.existingField.toUpperCase()\n  }\n};"
  }
}
```

---

## Conditional Logic Nodes

### IF Node

**CRITICAL:** The conditions structure MUST include `"version": 2` in options, and each condition MUST have a unique `id` field!

```json
{
  "id": "if-1",
  "name": "IF",
  "type": "n8n-nodes-base.if",
  "typeVersion": 2.2,
  "position": [750, 300],
  "parameters": {
    "conditions": {
      "options": {
        "version": 2,
        "leftValue": "",
        "caseSensitive": true,
        "typeValidation": "strict"
      },
      "combinator": "and",
      "conditions": [
        {
          "id": "condition-uuid-1",
          "operator": {
            "type": "string",
            "operation": "equals"
          },
          "leftValue": "={{ $json.status }}",
          "rightValue": "active"
        }
      ]
    },
    "options": {}
  }
}
```

**Multiple conditions example (AND logic):**

```json
{
  "id": "if-multi",
  "name": "Check Multiple Conditions",
  "type": "n8n-nodes-base.if",
  "typeVersion": 2.2,
  "position": [750, 300],
  "parameters": {
    "conditions": {
      "options": {
        "version": 2,
        "leftValue": "",
        "caseSensitive": true,
        "typeValidation": "strict"
      },
      "combinator": "and",
      "conditions": [
        {
          "id": "cond-1",
          "operator": { "type": "string", "operation": "contains" },
          "leftValue": "={{ $json.message }}",
          "rightValue": "urgent"
        },
        {
          "id": "cond-2",
          "operator": { "type": "boolean", "operation": "true" },
          "leftValue": "={{ $json.isActive }}"
        }
      ]
    },
    "options": {}
  }
}
```

### Switch Node (Multiple branches)

**CRITICAL:** Switch node rules MUST include `"version": 2` in options, and each condition MUST have a unique `id` field!

```json
{
  "id": "switch-1",
  "name": "Switch",
  "type": "n8n-nodes-base.switch",
  "typeVersion": 3.2,
  "position": [750, 300],
  "parameters": {
    "mode": "rules",
    "rules": {
      "rules": [
        {
          "output": 0,
          "conditions": {
            "options": {
              "version": 2,
              "leftValue": "",
              "caseSensitive": true,
              "typeValidation": "strict"
            },
            "combinator": "and",
            "conditions": [
              {
                "id": "rule0-cond1",
                "operator": { "type": "string", "operation": "equals" },
                "leftValue": "={{ $json.type }}",
                "rightValue": "email"
              }
            ]
          }
        },
        {
          "output": 1,
          "conditions": {
            "options": {
              "version": 2,
              "leftValue": "",
              "caseSensitive": true,
              "typeValidation": "strict"
            },
            "combinator": "and",
            "conditions": [
              {
                "id": "rule1-cond1",
                "operator": { "type": "string", "operation": "equals" },
                "leftValue": "={{ $json.type }}",
                "rightValue": "sms"
              }
            ]
          }
        }
      ]
    },
    "options": {}
  }
}
```

**Available condition operators by type:**

| Data Type    | Operations                                                                                                                                                                  |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **string**   | `equals`, `notEquals`, `contains`, `notContains`, `startsWith`, `notStartsWith`, `endsWith`, `notEndsWith`, `regex`, `notRegex`, `empty`, `notEmpty`, `exists`, `notExists` |
| **number**   | `equals`, `notEquals`, `gt` (greater than), `lt` (less than), `gte` (>=), `lte` (<=), `empty`, `notEmpty`, `exists`, `notExists`                                            |
| **boolean**  | `true`, `false`, `equals`, `notEquals`, `exists`, `notExists`, `empty`, `notEmpty`                                                                                          |
| **dateTime** | `equals`, `notEquals`, `after`, `before`, `afterOrEquals`, `beforeOrEquals`, `exists`, `notExists`, `empty`, `notEmpty`                                                     |
| **array**    | `contains`, `notContains`, `lengthEquals`, `lengthNotEquals`, `lengthGt`, `lengthLt`, `lengthGte`, `lengthLte`, `empty`, `notEmpty`, `exists`, `notExists`                  |
| **object**   | `exists`, `notExists`, `empty`, `notEmpty`                                                                                                                                  |

---

## HTTP Nodes

### HTTP Request Node

```json
{
  "id": "http-1",
  "name": "HTTP Request",
  "type": "n8n-nodes-base.httpRequest",
  "typeVersion": 4.2,
  "position": [500, 300],
  "parameters": {
    "method": "POST",
    "url": "https://api.example.com/endpoint",
    "sendHeaders": true,
    "headerParameters": {
      "parameters": [
        {
          "name": "Content-Type",
          "value": "application/json"
        },
        {
          "name": "Authorization",
          "value": "Bearer {{ $credentials.apiKey }}"
        }
      ]
    },
    "sendBody": true,
    "bodyParameters": {
      "parameters": [
        {
          "name": "data",
          "value": "={{ $json.payload }}"
        }
      ]
    }
  }
}
```

### HTTP Request with JSON Body

```json
{
  "id": "http-json",
  "name": "API Call",
  "type": "n8n-nodes-base.httpRequest",
  "typeVersion": 4.2,
  "position": [500, 300],
  "parameters": {
    "method": "POST",
    "url": "https://api.example.com/data",
    "sendBody": true,
    "specifyBody": "json",
    "jsonBody": "={{ JSON.stringify({ user: $json.userId, action: $json.action }) }}"
  }
}
```

### Discord Webhook (Use HTTP Request, NOT Discord Node!)

**IMPORTANT:** For Discord webhooks, always use HTTP Request node. The Discord node requires bot credentials which is more complex.

```json
{
  "id": "discord-webhook",
  "name": "Send to Discord",
  "type": "n8n-nodes-base.httpRequest",
  "typeVersion": 4.2,
  "position": [500, 300],
  "parameters": {
    "method": "POST",
    "url": "YOUR_DISCORD_WEBHOOK_URL_HERE",
    "sendBody": true,
    "specifyBody": "json",
    "jsonBody": "={{ JSON.stringify({ content: $json.message }) }}"
  }
}
```

**Discord webhook with rich embed:**

```json
{
  "id": "discord-embed",
  "name": "Send Discord Embed",
  "type": "n8n-nodes-base.httpRequest",
  "typeVersion": 4.2,
  "position": [500, 300],
  "parameters": {
    "method": "POST",
    "url": "YOUR_DISCORD_WEBHOOK_URL_HERE",
    "sendBody": true,
    "specifyBody": "json",
    "jsonBody": "={{ JSON.stringify({ content: 'Notification', embeds: [{ title: $json.title, description: $json.description, color: 3447003 }] }) }}"
  }
}
```

---

## Loop and Iteration Nodes

### Split In Batches

```json
{
  "id": "batch-1",
  "name": "Split In Batches",
  "type": "n8n-nodes-base.splitInBatches",
  "typeVersion": 3,
  "position": [500, 300],
  "parameters": {
    "batchSize": 10,
    "options": {}
  }
}
```

### Loop Over Items (using Code)

```json
{
  "id": "loop-code",
  "name": "Loop Process",
  "type": "n8n-nodes-base.code",
  "typeVersion": 2,
  "position": [500, 300],
  "parameters": {
    "mode": "runOnceForEachItem",
    "jsCode": "// Process each item individually\nconst item = $input.item;\nreturn {\n  json: {\n    ...item.json,\n    processed: true\n  }\n};"
  }
}
```

---

## Data Output Nodes

### Respond to Webhook

```json
{
  "id": "respond-1",
  "name": "Respond to Webhook",
  "type": "n8n-nodes-base.respondToWebhook",
  "typeVersion": 1.1,
  "position": [1000, 300],
  "parameters": {
    "respondWith": "json",
    "responseBody": "={{ $json }}"
  }
}
```

### No Operation (End node)

```json
{
  "id": "noop-1",
  "name": "No Op",
  "type": "n8n-nodes-base.noOp",
  "typeVersion": 1,
  "position": [1000, 300],
  "parameters": {}
}
```

---

## Integration Nodes

### Discord Node

```json
{
  "id": "discord-1",
  "name": "Discord",
  "type": "n8n-nodes-base.discord",
  "typeVersion": 2,
  "position": [750, 300],
  "parameters": {
    "operation": "sendMessage",
    "channelId": { "__rl": true, "value": "channel-id-here", "mode": "id" },
    "content": "={{ $json.message }}"
  },
  "credentials": {
    "discordBotApi": {
      "id": "credential-id",
      "name": "Discord Bot"
    }
  }
}
```

### Slack Node

```json
{
  "id": "slack-1",
  "name": "Slack",
  "type": "n8n-nodes-base.slack",
  "typeVersion": 2.2,
  "position": [750, 300],
  "parameters": {
    "operation": "post",
    "channel": { "__rl": true, "value": "#general", "mode": "name" },
    "text": "={{ $json.message }}"
  },
  "credentials": {
    "slackApi": {
      "id": "credential-id",
      "name": "Slack"
    }
  }
}
```

### Email (Gmail) Node

```json
{
  "id": "gmail-1",
  "name": "Gmail",
  "type": "n8n-nodes-base.gmail",
  "typeVersion": 2.1,
  "position": [750, 300],
  "parameters": {
    "operation": "send",
    "sendTo": "={{ $json.email }}",
    "subject": "={{ $json.subject }}",
    "emailType": "text",
    "message": "={{ $json.body }}"
  },
  "credentials": {
    "gmailOAuth2": {
      "id": "credential-id",
      "name": "Gmail"
    }
  }
}
```

---

## Complete Example Workflows

### Example 1: Webhook to Discord

```json
{
  "name": "Webhook to Discord",
  "nodes": [
    {
      "id": "webhook-1",
      "name": "Webhook",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 2,
      "position": [250, 300],
      "parameters": {
        "httpMethod": "POST",
        "path": "notify",
        "responseMode": "onReceived"
      },
      "webhookId": "webhook-uuid"
    },
    {
      "id": "set-1",
      "name": "Format Message",
      "type": "n8n-nodes-base.set",
      "typeVersion": 3.4,
      "position": [500, 300],
      "parameters": {
        "mode": "manual",
        "assignments": {
          "assignments": [
            {
              "id": "a1",
              "name": "formattedMessage",
              "value": "=New notification: {{ $json.body.message }}",
              "type": "string"
            }
          ]
        }
      }
    },
    {
      "id": "discord-1",
      "name": "Send to Discord",
      "type": "n8n-nodes-base.discord",
      "typeVersion": 2,
      "position": [750, 300],
      "parameters": {
        "operation": "sendMessage",
        "channelId": { "__rl": true, "value": "YOUR_CHANNEL_ID", "mode": "id" },
        "content": "={{ $json.formattedMessage }}"
      },
      "credentials": {
        "discordBotApi": { "id": "cred-id", "name": "Discord Bot" }
      }
    }
  ],
  "connections": {
    "Webhook": {
      "main": [[{ "node": "Format Message", "type": "main", "index": 0 }]]
    },
    "Format Message": {
      "main": [[{ "node": "Send to Discord", "type": "main", "index": 0 }]]
    }
  },
  "active": false,
  "settings": { "executionOrder": "v1" }
}
```

### Example 2: Scheduled API Poll

```json
{
  "name": "Scheduled API Poll",
  "nodes": [
    {
      "id": "schedule-1",
      "name": "Every Hour",
      "type": "n8n-nodes-base.scheduleTrigger",
      "typeVersion": 1.2,
      "position": [250, 300],
      "parameters": {
        "rule": {
          "interval": [{ "field": "hours", "hoursInterval": 1 }]
        }
      }
    },
    {
      "id": "http-1",
      "name": "Fetch Data",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [500, 300],
      "parameters": {
        "method": "GET",
        "url": "https://api.example.com/data"
      }
    },
    {
      "id": "if-1",
      "name": "Has New Data?",
      "type": "n8n-nodes-base.if",
      "typeVersion": 2,
      "position": [750, 300],
      "parameters": {
        "conditions": {
          "conditions": [
            {
              "id": "c1",
              "leftValue": "={{ $json.items.length }}",
              "rightValue": 0,
              "operator": { "type": "number", "operation": "gt" }
            }
          ],
          "combinator": "and"
        }
      }
    },
    {
      "id": "code-1",
      "name": "Process Data",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [1000, 200],
      "parameters": {
        "mode": "runOnceForAllItems",
        "jsCode": "return $input.all().flatMap(item => \n  item.json.items.map(i => ({ json: i }))\n);"
      }
    },
    {
      "id": "noop-1",
      "name": "No Data",
      "type": "n8n-nodes-base.noOp",
      "typeVersion": 1,
      "position": [1000, 400],
      "parameters": {}
    }
  ],
  "connections": {
    "Every Hour": {
      "main": [[{ "node": "Fetch Data", "type": "main", "index": 0 }]]
    },
    "Fetch Data": {
      "main": [[{ "node": "Has New Data?", "type": "main", "index": 0 }]]
    },
    "Has New Data?": {
      "main": [
        [{ "node": "Process Data", "type": "main", "index": 0 }],
        [{ "node": "No Data", "type": "main", "index": 0 }]
      ]
    }
  },
  "active": false,
  "settings": { "executionOrder": "v1" }
}
```

---

## Expression Syntax Reference

n8n uses expressions in `={{ }}` format:

- `{{ $json.fieldName }}` - Access current item's JSON data
- `{{ $json.nested.field }}` - Access nested fields
- `{{ $json['field-with-dashes'] }}` - Access fields with special characters
- `{{ $input.first().json }}` - Get first input item
- `{{ $input.all() }}` - Get all input items
- `{{ $node["Node Name"].json }}` - Access output from specific node
- `{{ $now }}` - Current timestamp
- `{{ $today }}` - Today's date
- `{{ $vars.variableName }}` - Access workflow variables
- `{{ $execution.id }}` - Current execution ID

---

## Best Practices for Workflow Generation

1. **Use UUIDs for node IDs** - Generate unique IDs like "node-abc123"
2. **Position nodes logically** - Left to right flow, 250px spacing
3. **Name nodes descriptively** - "Fetch User Data" not "HTTP Request"
4. **Include error handling** - Use IF nodes or try-catch in Code nodes
5. **Use the latest typeVersion** - Check examples for current versions
6. **Credential placeholders** - Use generic names, user will configure

When generating workflows:

- Always wrap the complete JSON in a markdown code block with ```json
- Ensure all node names in connections match exactly
- Include the proper structure with nodes, connections, and settings
- Use meaningful names for better user understanding

---

## Complete Example: Discord Webhook Notification

This is a complete, ready-to-import workflow that sends a test message to Discord:

```json
{
  "name": "Discord Webhook Test",
  "nodes": [
    {
      "id": "trigger-1",
      "name": "Manual Trigger",
      "type": "n8n-nodes-base.manualTrigger",
      "typeVersion": 1,
      "position": [250, 300],
      "parameters": {}
    },
    {
      "id": "set-1",
      "name": "Create Message",
      "type": "n8n-nodes-base.set",
      "typeVersion": 3.4,
      "position": [500, 300],
      "parameters": {
        "mode": "manual",
        "assignments": {
          "assignments": [
            {
              "id": "a1",
              "name": "message",
              "value": "Hello from n8n! Test at {{ $now }}",
              "type": "string"
            }
          ]
        }
      }
    },
    {
      "id": "http-1",
      "name": "Send to Discord",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [750, 300],
      "parameters": {
        "method": "POST",
        "url": "PASTE_YOUR_DISCORD_WEBHOOK_URL_HERE",
        "sendBody": true,
        "specifyBody": "json",
        "jsonBody": "={{ JSON.stringify({ content: $json.message }) }}"
      }
    }
  ],
  "connections": {
    "Manual Trigger": {
      "main": [[{ "node": "Create Message", "type": "main", "index": 0 }]]
    },
    "Create Message": {
      "main": [[{ "node": "Send to Discord", "type": "main", "index": 0 }]]
    }
  },
  "active": false,
  "settings": { "executionOrder": "v1" },
  "versionId": "1",
  "meta": { "instanceId": "generated" },
  "tags": []
}
```

**To use:** Replace `PASTE_YOUR_DISCORD_WEBHOOK_URL_HERE` with your actual Discord webhook URL, then import into n8n and click "Execute Workflow".
