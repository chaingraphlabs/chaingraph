---
name: skill-authoring
description: Guidelines for creating and organizing Claude Code skills for the ChainGraph project. Use when creating new skills, updating existing skills, or organizing the skill tree. Covers naming conventions, description writing, skill composition, and tree organization.
---

# ChainGraph Skill Authoring Guide

This skill provides guidelines for creating and maintaining Claude Code skills for the ChainGraph monorepo.

## Skill Tree Philosophy

Skills in ChainGraph form a **composition graph**, not a hierarchy. Multiple skills trigger simultaneously based on task context. Design skills to compose well together.

```
FOUNDATION          PACKAGE CONTEXT       TECHNOLOGY         FEATURES
     │                    │                   │                  │
     ▼                    ▼                   ▼                  ▼
chaingraph-concepts → frontend-architecture → effector-patterns → port-system
                   → executor-architecture → dbos-patterns     → subscription-sync
                   → types-architecture    → xyflow-patterns   → optimistic-updates
```

## Naming Conventions

### DO
- Use lowercase with hyphens: `effector-patterns`, `port-system`
- Use clear, self-explanatory names
- Group by conceptual area, not package prefix

### DON'T
- No prefixes like `pkg-`, `lib-`, `feat-` (clutters the list)
- No abbreviations that aren't universally known
- No version numbers in names

### Naming Categories

| Category | Pattern | Examples |
|----------|---------|----------|
| Foundation | `{concept}` | `chaingraph-concepts` |
| Package | `{package}-architecture` | `frontend-architecture`, `executor-architecture` |
| Technology | `{tech}-patterns` | `effector-patterns`, `dbos-patterns` |
| Feature | `{feature}` or `{feature}-{aspect}` | `port-system`, `subscription-sync` |
| Meta | `skill-{purpose}` | `skill-authoring`, `skill-maintenance` |

## Directory Structure

```
.claude/skills/
├── {skill-name}/
│   ├── SKILL.md           # Required: Main skill content
│   ├── reference.md       # Optional: Detailed reference (if SKILL.md > 400 lines)
│   └── examples.md        # Optional: Code examples
```

Keep `SKILL.md` under 500 lines. Use supporting files for deep dives.

## Description Writing (CRITICAL)

The `description` field determines when Claude triggers the skill. Write it strategically:

### Structure
```yaml
description: |
  {What this skill covers} - {key concepts}.
  Use when {trigger conditions}.
  {Additional context}.
  Triggers: {comma-separated keywords}
```

### Example
```yaml
description: |
  Effector state management patterns and CRITICAL anti-patterns.
  Use when writing Effector stores, events, effects, samples, or
  any reactive state code. Contains anti-patterns to avoid.
  Triggers: effector, store, createStore, createEvent, createEffect,
  sample, combine, domain, useUnit, $store
```

### Description Best Practices

1. **Include trigger keywords** - Words users naturally say
2. **Mention file paths** - `apps/chaingraph-frontend`, `packages/chaingraph-executor`
3. **Flag CRITICAL content** - Use caps for must-know information
4. **List related concepts** - Helps semantic matching
5. **Keep under 1024 chars** - Claude Code limit

## Skill Content Structure

### Required Sections

```markdown
# {Skill Title}

Brief overview (2-3 sentences).

## Key Concepts
Core concepts the agent must understand.

## Patterns
Code patterns to follow with examples.

## Anti-Patterns (if applicable)
What to AVOID with examples of wrong vs right.

## Key Files
| File | Purpose |
|------|---------|
| `path/to/file` | What it does |

## Quick Reference
Concise lookup table or checklist.
```

### Optional Sections

- `## Examples` - Detailed code examples
- `## Common Tasks` - Step-by-step for frequent operations
- `## Troubleshooting` - Common issues and solutions
- `## Related Skills` - Links to related skills

## Skill Composition Principles

### 1. Single Responsibility
Each skill covers ONE coherent knowledge domain. Don't mix unrelated concepts.

### 2. Composable Knowledge
Skills should work together. A frontend port bug might trigger:
- `chaingraph-concepts` (what ports ARE)
- `frontend-architecture` (where the code IS)
- `effector-patterns` (HOW stores work)
- `port-system` (port-SPECIFIC knowledge)

### 3. Layered Depth
- **Foundation skills**: Brief, always relevant
- **Package skills**: Architecture overview
- **Technology skills**: Deep patterns, anti-patterns
- **Feature skills**: Specific subsystem knowledge

### 4. No Duplication
Don't repeat information across skills. Reference other skills instead:
```markdown
For Effector patterns, see the `effector-patterns` skill.
```

## When to Create a New Skill

Create a new skill when:
- A knowledge domain is large enough (>100 lines of guidance)
- Agents frequently need this knowledge for specific tasks
- The knowledge is reusable across multiple task types
- Existing skills don't cover this area well

DON'T create a skill for:
- One-off information (put in CLAUDE.md instead)
- Package-specific details that fit in existing package skill
- Information that changes frequently (becomes stale)

## Skill Tree Organization

### Current Categories

| Category | Purpose | Current Skills |
|----------|---------|----------------|
| Foundation | Universal ChainGraph knowledge | `chaingraph-concepts` |
| Package | Package-specific architecture | `frontend-architecture`, `executor-architecture`, `types-architecture` |
| Technology | Library/framework patterns | `effector-patterns`, `dbos-patterns`, `xyflow-patterns` |
| Feature | Cross-cutting subsystems | `port-system`, `subscription-sync`, `optimistic-updates` |
| Meta | Skill governance | `skill-authoring`, `skill-maintenance` |

### Adding New Categories

Only add a category if:
- 3+ skills would belong to it
- It represents a distinct knowledge domain
- Existing categories don't fit

## Quality Checklist

Before committing a new skill:

- [ ] Name follows conventions (lowercase, hyphens, no prefixes)
- [ ] Description under 1024 chars with trigger keywords
- [ ] SKILL.md under 500 lines
- [ ] Has Key Concepts section
- [ ] Has Patterns section with code examples
- [ ] Anti-patterns documented if applicable
- [ ] Key Files table included
- [ ] No duplication with existing skills
- [ ] Tested: would this trigger for the intended tasks?

## Maintaining Consistency

### When Updating Skills
- Keep the same structure
- Update examples to match current codebase
- Add new patterns discovered during development
- Remove deprecated patterns

### Version Tracking
Skills don't have versions. Keep them evergreen by:
- Updating when architecture changes
- Removing obsolete information
- Adding new patterns as they emerge

## Example: Creating a New Skill

Task: Create skill for "node-creation" (creating new ChainGraph nodes)

1. **Check if needed**: Is this knowledge large enough? Yes, 100+ lines.
2. **Choose name**: `node-creation` (clear, follows pattern)
3. **Write description**:
   ```yaml
   description: |
     Creating new ChainGraph nodes with decorators. Use when
     implementing new node types in packages/chaingraph-nodes.
     Covers @Node, @Input, @Output, port decorators, execute().
     Triggers: create node, new node, @Node, BaseNode, execute
   ```
4. **Structure content**: Key Concepts → Patterns → Anti-Patterns → Key Files
5. **Review checklist**: All items checked
6. **Test mentally**: "Create an AI node" - would this trigger? Yes.
