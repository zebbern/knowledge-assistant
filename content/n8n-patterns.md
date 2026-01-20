# n8n Common Workflow Patterns

This document provides complete, ready-to-import JSON examples for common n8n workflow patterns.

---

## CRITICAL: Condition Structure Rules

**Every condition in IF and Switch nodes MUST have:**

1. `"version": 2` in the options object
2. A unique `id` for each condition
3. `combinator` field (usually "and" or "or")

**Correct structure:**

```json
{
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
        "id": "unique-condition-id",
        "operator": { "type": "string", "operation": "equals" },
        "leftValue": "={{ $json.field }}",
        "rightValue": "value"
      }
    ]
  },
  "options": {}
}
```

---

## Pattern 1: Webhook → Process → Respond

```json
{
  "name": "Webhook Processing",
  "nodes": [
    {
      "id": "webhook-1",
      "name": "Webhook",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 2,
      "position": [250, 300],
      "parameters": {
        "httpMethod": "POST",
        "path": "process-data",
        "responseMode": "responseNode"
      },
      "webhookId": "process-webhook"
    },
    {
      "id": "set-1",
      "name": "Transform Data",
      "type": "n8n-nodes-base.set",
      "typeVersion": 3.4,
      "position": [500, 300],
      "parameters": {
        "mode": "manual",
        "assignments": {
          "assignments": [
            {
              "id": "assign-1",
              "name": "processed",
              "value": "={{ $json.body.data.toUpperCase() }}",
              "type": "string"
            },
            {
              "id": "assign-2",
              "name": "timestamp",
              "value": "={{ new Date().toISOString() }}",
              "type": "string"
            }
          ]
        }
      }
    },
    {
      "id": "respond-1",
      "name": "Respond to Webhook",
      "type": "n8n-nodes-base.respondToWebhook",
      "typeVersion": 1.1,
      "position": [750, 300],
      "parameters": {
        "respondWith": "json",
        "responseBody": "={{ { success: true, data: $json } }}"
      }
    }
  ],
  "connections": {
    "Webhook": {
      "main": [[{ "node": "Transform Data", "type": "main", "index": 0 }]]
    },
    "Transform Data": {
      "main": [[{ "node": "Respond to Webhook", "type": "main", "index": 0 }]]
    }
  }
}
```

---

## Pattern 2: Conditional Routing (IF Node)

```json
{
  "name": "Conditional Routing",
  "nodes": [
    {
      "id": "manual-1",
      "name": "Manual Trigger",
      "type": "n8n-nodes-base.manualTrigger",
      "typeVersion": 1,
      "position": [250, 300],
      "parameters": {}
    },
    {
      "id": "if-1",
      "name": "Check Status",
      "type": "n8n-nodes-base.if",
      "typeVersion": 2.2,
      "position": [500, 300],
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
              "id": "status-check",
              "operator": { "type": "string", "operation": "equals" },
              "leftValue": "={{ $json.status }}",
              "rightValue": "active"
            }
          ]
        },
        "options": {}
      }
    },
    {
      "id": "set-active",
      "name": "Handle Active",
      "type": "n8n-nodes-base.set",
      "typeVersion": 3.4,
      "position": [750, 200],
      "parameters": {
        "mode": "manual",
        "assignments": {
          "assignments": [
            {
              "id": "a1",
              "name": "result",
              "value": "User is active",
              "type": "string"
            }
          ]
        }
      }
    },
    {
      "id": "set-inactive",
      "name": "Handle Inactive",
      "type": "n8n-nodes-base.set",
      "typeVersion": 3.4,
      "position": [750, 400],
      "parameters": {
        "mode": "manual",
        "assignments": {
          "assignments": [
            {
              "id": "a2",
              "name": "result",
              "value": "User is not active",
              "type": "string"
            }
          ]
        }
      }
    }
  ],
  "connections": {
    "Manual Trigger": {
      "main": [[{ "node": "Check Status", "type": "main", "index": 0 }]]
    },
    "Check Status": {
      "main": [
        [{ "node": "Handle Active", "type": "main", "index": 0 }],
        [{ "node": "Handle Inactive", "type": "main", "index": 0 }]
      ]
    }
  }
}
```

---

## Pattern 3: Multi-Branch Routing (Switch Node)

```json
{
  "name": "Multi-Branch Router",
  "nodes": [
    {
      "id": "webhook-1",
      "name": "Webhook",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 2,
      "position": [250, 400],
      "parameters": {
        "httpMethod": "POST",
        "path": "route-request"
      },
      "webhookId": "router-webhook"
    },
    {
      "id": "switch-1",
      "name": "Route by Type",
      "type": "n8n-nodes-base.switch",
      "typeVersion": 3.2,
      "position": [500, 400],
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
                    "id": "email-check",
                    "operator": { "type": "string", "operation": "equals" },
                    "leftValue": "={{ $json.body.type }}",
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
                    "id": "sms-check",
                    "operator": { "type": "string", "operation": "equals" },
                    "leftValue": "={{ $json.body.type }}",
                    "rightValue": "sms"
                  }
                ]
              }
            },
            {
              "output": 2,
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
                    "id": "slack-check",
                    "operator": { "type": "string", "operation": "equals" },
                    "leftValue": "={{ $json.body.type }}",
                    "rightValue": "slack"
                  }
                ]
              }
            }
          ]
        },
        "options": {
          "fallbackOutput": "extra"
        }
      }
    },
    {
      "id": "email-handler",
      "name": "Handle Email",
      "type": "n8n-nodes-base.noOp",
      "typeVersion": 1,
      "position": [750, 200],
      "parameters": {}
    },
    {
      "id": "sms-handler",
      "name": "Handle SMS",
      "type": "n8n-nodes-base.noOp",
      "typeVersion": 1,
      "position": [750, 400],
      "parameters": {}
    },
    {
      "id": "slack-handler",
      "name": "Handle Slack",
      "type": "n8n-nodes-base.noOp",
      "typeVersion": 1,
      "position": [750, 600],
      "parameters": {}
    },
    {
      "id": "fallback-handler",
      "name": "Handle Unknown",
      "type": "n8n-nodes-base.noOp",
      "typeVersion": 1,
      "position": [750, 800],
      "parameters": {}
    }
  ],
  "connections": {
    "Webhook": {
      "main": [[{ "node": "Route by Type", "type": "main", "index": 0 }]]
    },
    "Route by Type": {
      "main": [
        [{ "node": "Handle Email", "type": "main", "index": 0 }],
        [{ "node": "Handle SMS", "type": "main", "index": 0 }],
        [{ "node": "Handle Slack", "type": "main", "index": 0 }],
        [{ "node": "Handle Unknown", "type": "main", "index": 0 }]
      ]
    }
  }
}
```

---

## Pattern 4: Loop Over Items

```json
{
  "name": "Loop Processing",
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
      "id": "loop-1",
      "name": "Loop Over Items",
      "type": "n8n-nodes-base.splitInBatches",
      "typeVersion": 3,
      "position": [500, 300],
      "parameters": {
        "batchSize": 1,
        "options": {}
      }
    },
    {
      "id": "process-1",
      "name": "Process Item",
      "type": "n8n-nodes-base.set",
      "typeVersion": 3.4,
      "position": [750, 300],
      "parameters": {
        "mode": "manual",
        "assignments": {
          "assignments": [
            {
              "id": "p1",
              "name": "processed",
              "value": "={{ $json.name + ' - processed' }}",
              "type": "string"
            }
          ]
        }
      }
    }
  ],
  "connections": {
    "Manual Trigger": {
      "main": [[{ "node": "Loop Over Items", "type": "main", "index": 0 }]]
    },
    "Loop Over Items": {
      "main": [[{ "node": "Process Item", "type": "main", "index": 0 }], []]
    },
    "Process Item": {
      "main": [[{ "node": "Loop Over Items", "type": "main", "index": 0 }]]
    }
  }
}
```

---

## Pattern 5: Error Handling

```json
{
  "name": "Error Handling Pattern",
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
      "id": "http-risky",
      "name": "Risky API Call",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [500, 300],
      "parameters": {
        "method": "GET",
        "url": "https://api.example.com/data",
        "options": {
          "response": { "response": { "neverError": true } }
        }
      },
      "continueOnFail": true
    },
    {
      "id": "check-error",
      "name": "Check for Error",
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
              "id": "err-check",
              "operator": { "type": "boolean", "operation": "true" },
              "leftValue": "={{ $json.error !== undefined }}"
            }
          ]
        },
        "options": {}
      }
    },
    {
      "id": "handle-error",
      "name": "Handle Error",
      "type": "n8n-nodes-base.set",
      "typeVersion": 3.4,
      "position": [1000, 200],
      "parameters": {
        "mode": "manual",
        "assignments": {
          "assignments": [
            {
              "id": "e1",
              "name": "status",
              "value": "error",
              "type": "string"
            },
            {
              "id": "e2",
              "name": "message",
              "value": "={{ $json.error.message || 'Unknown error' }}",
              "type": "string"
            }
          ]
        }
      }
    },
    {
      "id": "handle-success",
      "name": "Handle Success",
      "type": "n8n-nodes-base.set",
      "typeVersion": 3.4,
      "position": [1000, 400],
      "parameters": {
        "mode": "manual",
        "assignments": {
          "assignments": [
            {
              "id": "s1",
              "name": "status",
              "value": "success",
              "type": "string"
            }
          ]
        }
      }
    }
  ],
  "connections": {
    "Manual Trigger": {
      "main": [[{ "node": "Risky API Call", "type": "main", "index": 0 }]]
    },
    "Risky API Call": {
      "main": [[{ "node": "Check for Error", "type": "main", "index": 0 }]]
    },
    "Check for Error": {
      "main": [
        [{ "node": "Handle Error", "type": "main", "index": 0 }],
        [{ "node": "Handle Success", "type": "main", "index": 0 }]
      ]
    }
  }
}
```

---

## Pattern 6: Merge Multiple Data Sources

```json
{
  "name": "Merge Data Sources",
  "nodes": [
    {
      "id": "trigger",
      "name": "Manual Trigger",
      "type": "n8n-nodes-base.manualTrigger",
      "typeVersion": 1,
      "position": [250, 400],
      "parameters": {}
    },
    {
      "id": "source1",
      "name": "Get Users",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [500, 300],
      "parameters": {
        "method": "GET",
        "url": "https://api.example.com/users"
      }
    },
    {
      "id": "source2",
      "name": "Get Orders",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [500, 500],
      "parameters": {
        "method": "GET",
        "url": "https://api.example.com/orders"
      }
    },
    {
      "id": "merge",
      "name": "Merge",
      "type": "n8n-nodes-base.merge",
      "typeVersion": 3,
      "position": [750, 400],
      "parameters": {
        "mode": "combine",
        "mergeByFields": {
          "values": [{ "field1": "userId", "field2": "userId" }]
        },
        "options": {}
      }
    }
  ],
  "connections": {
    "Manual Trigger": {
      "main": [
        [{ "node": "Get Users", "type": "main", "index": 0 }],
        [{ "node": "Get Orders", "type": "main", "index": 0 }]
      ]
    },
    "Get Users": {
      "main": [[{ "node": "Merge", "type": "main", "index": 0 }]]
    },
    "Get Orders": {
      "main": [[{ "node": "Merge", "type": "main", "index": 1 }]]
    }
  }
}
```

---

## Expression Quick Reference

| Expression                            | Description                  |
| ------------------------------------- | ---------------------------- |
| `{{ $json.fieldName }}`               | Access current item's field  |
| `{{ $json.nested.field }}`            | Access nested field          |
| `{{ $json.array[0] }}`                | Access array element         |
| `{{ $('NodeName').item.json.field }}` | Access another node's output |
| `{{ $input.all() }}`                  | Get all input items          |
| `{{ $input.first() }}`                | Get first input item         |
| `{{ $now.toISO() }}`                  | Current timestamp            |
| `{{ $execution.id }}`                 | Current execution ID         |
| `{{ $workflow.id }}`                  | Current workflow ID          |
