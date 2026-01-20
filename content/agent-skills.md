<div align="center">
  
<table><td>
  
<h2 id="claude-code-community-guide">Agent Skills Creation Guide</h2>

_A guide for creating Agent Skills for any project, based off <ins>official</ins> sources and community feedback:_

[![Agent Skills Specification](https://img.shields.io/badge/Agent_Skills_Specification-blue)](https://agentskills.io/specification)
[![What Are Skills](https://img.shields.io/badge/What_Are_Skills-blue)](https://agentskills.io/what-are-skills)
[![Anthropic Skills Repository](https://img.shields.io/badge/Anthropic_Skills_Repository-blue)](https://github.com/anthropics/skills)
[![Skill Authoring Best Practices](https://img.shields.io/badge/Skill_Authoring_Best_Practices-blue)](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices)
[![Creating Custom Skills](https://img.shields.io/badge/Creating_Custom_Skills-blue)](https://support.claude.com/en/articles/12512198-creating-custom-skills)
[![VS Code Agent Skills](https://img.shields.io/badge/VS_Code_Agent_Skills-blue)](https://code.visualstudio.com/docs/copilot/customization/agent-skills)
[![Reference Library (Validation)](<https://img.shields.io/badge/Reference_Library_(Validation)-blue>)](https://github.com/agentskills/agentskills/tree/main/skills-ref)

<kbd>
  
<h3 align="left">

| Table of Contents                                                 |     |
| ----------------------------------------------------------------- | :-: |
| [What Are Agent Skills?](#what-are-agent-skills)                  |  ✓  |
| [Directory Structure](#directory-structure)                       |  ✓  |
| [The SKILL.md File](#the-skillmd-file)                            |  ✓  |
| [Writing Effective Descriptions](#writing-effective-descriptions) |  ✓  |
| [Body Content Guidelines](#body-content-guidelines)               |  ✓  |
| [Progressive Disclosure](#progressive-disclosure)                 |  ✓  |
| [Core Authoring Principles](#core-authoring-principles)           |  ✓  |
| [Common Patterns](#common-patterns)                               |  ✓  |
| [Anti-Patterns to Avoid](#anti-patterns-to-avoid)                 |  ✓  |
| [Testing & Iteration](#testing--iteration)                        |  ✓  |
| [Checklist](#checklist)                                           |  ✓  |

</h3>

<kbd> _Claude Code Via Discord Guide [Here!](https://github.com/zebbern/claude-code-discord)_ </kbd>

</kbd>

</td></table>

</div>

## What Are Agent Skills?

Agent Skills are folders of instructions, scripts, and resources that AI agents can discover and use to perform specialized tasks accurately and efficiently.

**Key benefits:**

- **Domain expertise**: Package specialized knowledge into reusable instructions
- **New capabilities**: Give agents new abilities (creating documents, analyzing data, automating tasks)
- **Repeatable workflows**: Turn multi-step tasks into consistent processes
- **Interoperability**: Same skill works across different skills-compatible agents

---

## Directory Structure

A skill is a directory containing at minimum a `SKILL.md` file:

```
skill-name/
├── SKILL.md          # Required: instructions + metadata
├── scripts/          # Optional: executable code
├── references/       # Optional: additional documentation
└── assets/           # Optional: templates, images, data files
```

**Placement options:**

- `.github/skills/skill-name/` (for repository-scoped skills)
- `~/.skills/skill-name/` (for user-scoped skills)
- Custom locations depending on the platform [github copilot] in this case.

---

## The SKILL.md File

Every skill requires a `SKILL.md` file with YAML frontmatter followed by Markdown content.

### Required Frontmatter

```yaml
---
name: skill-name
description: What this skill does and when to use it.
---
```

### Optional Frontmatter Fields

```yaml
---
name: pdf-processing
description: Extract text and tables from PDF files, fill forms, merge documents. Use when working with PDF files or when the user mentions PDFs, forms, or document extraction.
license: Apache-2.0
metadata:
  author: your-name
  version: "1.0"
compatibility: Requires python>=3.8, pdfplumber
allowed-tools: Bash(python:*) Read
---
```

### Field Specifications

| Field           | Required | Rules                                                                                                |
| --------------- | -------- | ---------------------------------------------------------------------------------------------------- |
| `name`          | Yes      | 1-64 chars, lowercase alphanumeric + hyphens only, no consecutive hyphens, must match directory name |
| `description`   | Yes      | 1-1024 chars, describes WHAT it does AND WHEN to use it                                              |
| `license`       | No       | License name or reference to bundled file                                                            |
| `metadata`      | No       | Key-value pairs for custom properties                                                                |
| `compatibility` | No       | 1-500 chars, environment requirements                                                                |
| `allowed-tools` | No       | Space-delimited list of pre-approved tools (experimental)                                            |

### Name Field Rules

✅ **Valid names:**

```
pdf-processing
data-analysis
code-review
my-skill-v2
```

❌ **Invalid names:**

```
PDF-Processing     # uppercase not allowed
-pdf-processing    # cannot start with hyphen
pdf--processing    # consecutive hyphens not allowed
pdf_processing     # underscores not allowed
```

---

## Writing Effective Descriptions

The description is **critical** - agents use it to decide whether to activate your skill.

### Format

```
<What the skill does>. Use when <specific triggers/contexts>.
```

### Rules

1. **Write in third person** (not "I" or "you")
2. **Be specific** - include key terms and triggers
3. **Include both** what it does AND when to use it
4. **Max 1024 characters**

### Good Examples

```yaml
description: Extract text and tables from PDF files, fill forms, merge documents. Use when working with PDF files or when the user mentions PDFs, forms, or document extraction.
```

```yaml
description: Analyze Excel spreadsheets, create pivot tables, generate charts. Use when analyzing Excel files, spreadsheets, tabular data, or .xlsx files.
```

```yaml
description: Generate descriptive commit messages by analyzing git diffs. Use when the user asks for help writing commit messages or reviewing staged changes.
```

### Poor Examples

```yaml
description: Helps with PDFs.
# Too short, no triggers
```

```yaml
description: I can help you process Excel files.
# Wrong point of view
```

```yaml
description: Processes data.
# Too vague
```

---

## Body Content Guidelines

The Markdown body after frontmatter contains the actual instructions. There are no strict format requirements, but effective skills follow these patterns:

### Recommended Sections

```markdown
# Skill Title

## When to Use

- Trigger condition 1
- Trigger condition 2

## Quick Start

[Minimal example to get started]

## Step-by-Step Process

1. Step one
2. Step two
3. Step three

## Examples

[Input/output pairs]

## Error Handling

[Common issues and solutions]
```

### Token Budget

- **Keep SKILL.md under 500 lines**
- Move detailed content to separate reference files
- Only include context the agent doesn't already know

### Be Concise

**Good (50 tokens):**

```python
## Extract PDF text
# Use pdfplumber for text extraction:

import pdfplumber
with pdfplumber.open("file.pdf") as pdf:
    text = pdf.pages[0].extract_text()
```

**Bad (150+ tokens):**

```
## Extract PDF text

PDF (Portable Document Format) files are a common file format
that contains text, images, and other content. To extract text
from a PDF, you'll need to use a library. There are many
libraries available...

[Too verbose - agent already knows what PDFs are]
```

The agent already knows what PDFs are. Only add context it doesn't have.

---

## Progressive Disclosure

Skills use a three-level loading system:

### Level 1: Discovery (~100 tokens)

Only `name` and `description` are loaded at startup for ALL skills. This is how agents decide which skill to activate.

### Level 2: Activation (<5000 tokens recommended)

When a task matches a skill's description, the full `SKILL.md` body is loaded into context.

### Level 3: Execution (as needed)

Files in `scripts/`, `references/`, and `assets/` are loaded only when explicitly needed.

### Structure for Progressive Disclosure

```markdown
# PDF Processing

## Quick Start

[Basic instructions here in SKILL.md]

## Advanced Features

- **Form filling**: See [FORMS.md](references/FORMS.md) for complete guide
- **API reference**: See [REFERENCE.md](references/REFERENCE.md) for all methods
- **Examples**: See [EXAMPLES.md](references/EXAMPLES.md) for patterns
```

### Important Rules

- Keep file references **one level deep** from SKILL.md
- Don't create deeply nested reference chains
- For files over 100 lines, include a table of contents

---

## Core Authoring Principles

### 1. Concise is Key

The context window is shared with everything else. Challenge each piece of information:

- "Does the agent really need this explanation?"
- "Can I assume the agent knows this?"
- "Does this paragraph justify its token cost?"

### 2. Set Appropriate Degrees of Freedom

**High freedom** (text-based instructions) - when multiple approaches are valid:

```
## Code review process
1. Analyze the code structure
2. Check for potential bugs
3. Suggest improvements
4. Verify adherence to conventions
```

**Medium freedom** (pseudocode/templates) - when a preferred pattern exists:

```python
## Generate report
# Use this template and customize as needed:

def generate_report(data, format="markdown"):
    # Process data
    # Generate output in specified format
    pass
```

**Low freedom** (specific scripts) - when consistency is critical:

```bash
## Database migration
# Run exactly this script:

python scripts/migrate.py --verify --backup

# Do not modify the command or add additional flags.
```

### 3. Use Consistent Terminology

Choose one term and stick with it:

- ✅ Always "API endpoint" (not mixing "URL", "route", "path")
- ✅ Always "extract" (not mixing "pull", "get", "retrieve")

---

## Common Patterns

### Pattern 1: Template Pattern

```yaml
## Report structure

ALWAYS use this exact template:

# [Analysis Title]

## Executive summary
[One-paragraph overview]

## Key findings
- Finding 1 with supporting data
- Finding 2 with supporting data

## Recommendations
1. Specific actionable recommendation
```

### Pattern 2: Examples Pattern

```yaml
## Commit message format

Generate commit messages following these examples:

Example 1:
  Input: Added user authentication with JWT tokens
  Output: |
    feat(auth): implement JWT-based authentication

    Add login endpoint and token validation middleware

Example 2:
  Input: Fixed bug where dates displayed incorrectly
  Output: |
    fix(reports): correct date formatting in timezone conversion
```

### Pattern 3: Workflow Pattern

```yaml
## Form filling workflow

Copy this checklist and track progress:

Task Progress:
- [ ] Step 1: Analyze the form
- [ ] Step 2: Create field mapping
- [ ] Step 3: Validate mapping
- [ ] Step 4: Fill the form
- [ ] Step 5: Verify output

Step 1: Analyze the form
  Run: python scripts/analyze_form.py input.pdf
```

### Pattern 4: Conditional Workflow

```markdown
## Document modification

1. Determine the modification type:

   **Creating new content?** → Follow "Creation workflow" below
   **Editing existing content?** → Follow "Editing workflow" below

2. Creation workflow:
   - Use docx-js library
   - Build document from scratch

3. Editing workflow:
   - Unpack existing document
   - Modify XML directly
   - Validate after each change
```

### Pattern 5: Domain-Specific Organization

```
bigquery-skill/
├── SKILL.md (overview and navigation)
└── reference/
    ├── finance.md (revenue, billing)
    ├── sales.md (pipeline, accounts)
    ├── product.md (usage, features)
    └── marketing.md (campaigns)
```

SKILL.md points to the right file based on context.

---

## Anti-Patterns to Avoid

### ❌ Windows-Style Paths

```
# Bad
scripts\helper.py

# Good
scripts/helper.py
```

### ❌ Too Many Options

```
# Bad
"You can use pypdf, or pdfplumber, or PyMuPDF, or pdf2image..."

# Good
"Use pdfplumber for text extraction.
For scanned PDFs requiring OCR, use pdf2image instead."
```

### ❌ Time-Sensitive Information

```
# Bad
"If you're doing this before August 2025, use the old API."

# Good
## Current method
Use the v2 API endpoint.

## Old patterns (deprecated)
<details>
<summary>Legacy v1 API</summary>
...
</details>
```

### ❌ Deeply Nested References

```
# Bad
SKILL.md → advanced.md → details.md → actual_info.md

# Good
SKILL.md → advanced.md
SKILL.md → details.md
SKILL.md → reference.md
```

### ❌ Vague Names

```
# Bad
helper, utils, tools, data, files

# Good
pdf-processing, commit-generator, data-analysis
```

---

## Testing & Iteration

### Build Evaluations First

1. **Identify gaps**: Run the agent on tasks WITHOUT a skill. Document failures.
2. **Create evaluations**: Build 3 scenarios that test these gaps
3. **Establish baseline**: Measure performance without the skill
4. **Write minimal instructions**: Just enough to pass evaluations
5. **Iterate**: Execute evaluations, refine, repeat

### Evaluation Structure Example

```json
{
  "skills": ["pdf-processing"],
  "query": "Extract all text from this PDF",
  "files": ["test-files/document.pdf"],
  "expected_behavior": [
    "Successfully reads the PDF file",
    "Extracts text from all pages",
    "Saves to output.txt"
  ]
}
```

### Develop Iteratively with the Agent

1. Complete a task with the agent using normal prompting
2. Note what context you repeatedly provided
3. Ask the agent to create a skill capturing that pattern
4. Review for conciseness
5. Test with fresh agent instance
6. Iterate based on observations

### Test with Multiple Models

Different models need different levels of detail:

- **Fast models**: May need more guidance
- **Powerful models**: Avoid over-explaining

---

## Checklist

### Before Creating

- [ ] Identified a specific, repeatable task
- [ ] Documented gaps from testing without skill
- [ ] Created at least 3 evaluation scenarios

### SKILL.md Quality

- [ ] Name is lowercase with hyphens only
- [ ] Name matches directory name
- [ ] Description includes WHAT it does
- [ ] Description includes WHEN to use it
- [ ] Description is in third person
- [ ] Body is under 500 lines
- [ ] Uses consistent terminology
- [ ] Examples are concrete, not abstract

### Structure

- [ ] References are one level deep
- [ ] Large reference files have table of contents
- [ ] No deeply nested reference chains
- [ ] Uses forward slashes for paths

### Content

- [ ] No time-sensitive information
- [ ] No information the agent already knows
- [ ] Clear step-by-step instructions where needed
- [ ] Error handling included
- [ ] Workflows have checkpoints

### Testing

- [ ] Tested on representative tasks
- [ ] Tested with fresh agent instance
- [ ] Iterated based on observations
- [ ] Works across intended platforms
