# Memory Store

This directory contains memories created by Claude using the MCP Memory Server.

## Directory Structure

- /entities: Information about specific people, organizations, or objects
- /concepts: Information about abstract ideas, processes, or knowledge
- /sessions: Information about specific conversations or meetings
- index.json: Search index for efficient memory retrieval
- metadata.json: Metadata about the memory store

## File Format

Each memory is stored as a markdown file with frontmatter metadata:

```markdown
---
id: "unique-id"
title: "Memory Title"
type: "entity|concept|session"
tags: ["tag1", "tag2"]
created: "2023-06-15T14:30:00Z"
updated: "2023-06-15T14:30:00Z"
related: ["other-memory-id1", "other-memory-id2"]
importance: 0.8
---

# Memory Title

Content of the memory...
```

Created on: 2026-01-05T03:50:18.400Z
