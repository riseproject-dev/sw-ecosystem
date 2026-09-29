---
title: Whole-Stack Reports
nav_order: 2
has_children: true
---

# Stack Reports

RISC-V readiness assessments for full software stacks. Each report declares `roots:` project-report
slugs in its frontmatter; Jekyll aggregates those projects and their dependency graphs into the
page's generated graph JSON. Every root's direct dependencies are included; beyond that first hop,
only runtime dependencies are traversed.
