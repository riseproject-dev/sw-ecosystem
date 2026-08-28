# RISC-V Vertical Ecosystem Report -- Research Prompt

**What this is.** A reusable prompt for generating a RISC-V readiness report for a *vertical* --
the full software stack behind a product or workload (for example "Agentic AI inference serving",
"OLTP databases", "web serving", "big data", but also open-ended verticals such as IoT, embedded,
or automotive). A vertical report answers one question for decision-makers: *for the stack that
makes up this product, how RISC-V-ready is each layer, and what are the next steps?*

**The vertical is whatever the user defines.** Do not restrict the vertical to any pre-existing
category list. The `categories:` frontmatter that appears in the per-project reports under
`project-reports/` is only a weak hint for finding related projects; it is never a constraint on what a
vertical can be.

**Output is ad-hoc and not committed.** This prompt and its companion workflow live under
`prompts/stack-report/` and are committed as reusable tooling. The scope spec and the report a
run produces are the operator's own research output. Save them inside version control in the
`stack-reports/<slug>/` directory. Do commit generated reports.

**Relationship to the per-project reports.** The repository already contains ~150 deep per-project
RISC-V status reports under `project-reports/<slug>.md`, one per entry in `project-reports/scope.yml`. Those reports are
the primary input to a vertical report. They are refreshed only every 3 to 6 months, so treat them
as a strong prior to be **adversarially spot-checked live**, never as ground truth. When a live
check contradicts a stored report, trust the live check and record the discrepancy (this also tells
the operator which per-project report needs a refresh).

---

## Execution model: two stages

A vertical report is produced in two stages, because the scope must be negotiated with a human but
the research is best run unattended.

**Stage 1 -- Scoping (interactive).** Interview the user, research the stack, and write a locked
*scope spec* (`<vertical-slug>.project-reports/scope.yml`). This is conversational and happens in the main session.

**Stage 2 -- Research and synthesis (unattended).** Consume the locked scope spec, classify every
node in the stack for RISC-V readiness, adversarially verify the classification, and emit the three
output artifacts. For a large stack, run this via the companion `Workflow` script
(`stack-report-workflow.js`), which fans out one research agent per node. For a small stack (a
handful of nodes) you can execute the same instructions inline without the workflow.

The two stages are separate because a `Workflow` runs unattended and cannot pause to ask the user
questions. Stage 1 front-loads every decision that needs a human, and records the outcome in the
scope spec so stage 2 can run start-to-finish without interaction.

The output slug is derived from the vertical name the same way the per-project reports derive
theirs: `slug = name.toLowerCase().replace(/[\s.\/]+/g, '-')`. So "Agentic AI" ->
`agentic-ai`, "LLM serving" -> `llm-serving`. The operator may override it with an explicit
`slug:` field in the scope spec.

---

## Stage 1: Scoping

Goal: turn a vague request ("what's the status of Agentic AI on RISC-V?") into a precise,
locked-down list of stack nodes to classify, with each node's feature scope and criticality
settled. Produce `<vertical-slug>.project-reports/scope.yml`.

### 1.1 Interview the user

Ask about the following. Ask focused questions, one topic at a time; do not dump all of these at
once. If the user has already answered something in their request, do not re-ask it.

- **Vertical definition.** What is the product or workload, in one line? (e.g. "Agentic AI
  inference serving with RAG".)
- **Named projects.** Which projects does the user already know are in the stack? (e.g. LangChain,
  vLLM, PyTorch.) These are the seeds for stack discovery.
- **Multi-product structure.** When the stack covers multiple parallel products in the same
  category (e.g., several database engines, several inference runtimes, several message
  brokers), the report can be organized as product columns with shared layers below them.
  If the named projects suggest this structure, propose the product list and ask the user to
  confirm: for example, "This vertical covers PostgreSQL, MySQL, Redis, and Memcached -- should
  I organize the report as four product columns with shared layers (Orchestration &
  Observability, System Libraries) below?" Let the user confirm, add, or drop products. Then
  propose the per-product row names (the functional layers that every product shares, e.g.,
  "Client Drivers", "Database Engine", "Extensions & Clustering") and let the user adjust.
  When writing the scope spec, use `product:` and `layer:` on each per-product layer
  entry (see the schema below). The full product list and row order are
  derived from the collection of those values. Shared layers (spanning all products) use
  `layer:` without `product:`. Omit `product:` entirely for a single, non-parallel stack.
- **Feature scope per project.** For each named project, which parts actually matter for this
  vertical? This is the single most important scoping question, because it decides how finely you
  decompose a project into nodes. Example: for PyTorch, does the user care about the whole
  framework (eager inference + `torch.compile` + training + distributed), or only CPU inference? If
  only CPU inference, then the entire `torch.compile` compiler pipeline (TorchDynamo, AOTAutograd,
  TorchInductor, Triton, torch-mlir, IREE, MLIR, LLVM) is out of scope. Record out-of-scope
  components under `out_of_scope:` in the scope spec (not under `layers:`). Out-of-scope components
  are **not** classified in stage 2 -- they never enter the color waterfall and get no color. This
  is distinct from an exclusion (proprietary/vendor-only, which is classified grey) and from grey
  itself: out-of-scope means "the user does not care about this for this vertical," not "we cannot
  assess it."
- **Criticality.** Is each node load-bearing (the vertical does not function without it) or
  optional (a nice-to-have, a fallback, or one of several interchangeable choices)? This is carried
  into every output artifact so that a red *optional* leaf reads very differently from a red
  load-bearing library.
- **Target hardware / ISA baseline.** Which RISC-V profile is the target: RVA20U64, RVA22U64,
  RVA23U64, or an ad-hoc extension set? This decides which performance gaps and ISA extensions
  matter (RVV, Zvfh, Zba/Zbb, Zvkned, etc.).
- **Audience and use.** Who reads the report and what decision does it drive? Default to an
  exec/product audience with a PowerPoint deck as the delivery format. If the user says engineering
  leadership, shift toward the more technical framing used by the per-project reports.
- **Exclusions.** Are there proprietary or vendor-only paths in the stack that will never run
  natively on RISC-V (for example the NVIDIA CUDA / cuDNN / NCCL / TensorRT GPU path)? These are
  classified grey (N/A), never red, so the stack view is not a false wall of red over a layer that
  was never going to be RISC-V-native. An exclusion *is* still shown in the stack (as grey); an
  out-of-scope component is not classified at all. Keep the two lists separate.

### 1.2 Research-driven stack discovery

Do not work from a template stack. Build the stack for *this* vertical by research, seeded by the
named projects:

1. For each named project, research it (homepage, repository, dependency manifest) to understand
   what it is and what it depends on.
2. **Reuse the per-project reports.** For each project already covered by a `project-reports/<slug>.md`,
   read that report's **Section 9 (Dependencies)** and **Section 10 (Ecosystem Status)** to harvest
   its direct and transitive dependencies and their RISC-V status. This is the fastest and most
   authoritative way to expand the stack, because the dependency recursion has already been done.
3. Expand direct dependencies, then recurse into critical dependencies (those that are not fully
   RISC-V-ready, or that have their own architecture-specific subsystems: JIT backends, SIMD
   kernels, numerics, crypto, compression, memory allocators). Recurse 2 to 3 levels for critical
   dependencies, following the same process the per-project reports use in their Section 9.
4. Organize the result as a **layered stack**, top (what the user writes) to bottom (hardware),
   in the layered shape specified by Artifact 1 (Section "Output artifacts"). Each node gets a
   one-line description, its license, its governance/owner, and its place in a layer. Capture the
   pipeline chains (e.g. the `torch.compile` lowering path) and the alternate paths (CPU vs GPU,
   x86 vs AArch64 vs RISC-V) in the scope spec's `chains:` block.
5. Present the proposed stack to the user and let them confirm inclusions, exclusions, and how deep
   to recurse. Lock the spec only after confirmation.

### 1.3 Graceful degradation (non-interactive runs)

This prompt must also work when there is no human to interview -- for example when a colleague runs
it headless, when a batch operator kicks it off, or during automated validation. In that case:

- Do **not** block waiting for answers.
- Derive the entire stack from research plus the `project-reports/` dependency data alone.
- Make reasonable default assumptions (full feature scope unless the request narrows it; critical
  for anything on the direct path from a named project to the hardware; exec/product audience;
  RVA23U64 baseline unless stated).
- **Multi-product structure**: if the named projects are clearly parallel products in the same
  category (e.g., several database engines, several runtimes), infer the product columns and
  per-product row layer names from the research. Use `product:` + `layer:` on per-product
  layer entries in the scope spec, and list the inference as an assumption.
- Record every such assumption explicitly in the scope spec's `assumptions:` list, so the reader
  knows exactly what was assumed and can correct it on a re-run.

### 1.4 Scope-spec schema

Write the locked scope to `<vertical-slug>.project-reports/scope.yml`. Schema:

```yaml
vertical: Agentic AI inference serving      # one-line vertical definition
slug: agentic-ai                            # optional; else derived from vertical name
author: "Name <email>"                      # for the report header; default to the operator
run_date: 2026-08-12                        # for the report header Date; default to today
audience: exec-product                      # exec-product (default) | eng-leadership
target_profile: RVA23U64                    # or an ad-hoc extension list
use: "Deck for leadership on where to invest in RISC-V enablement"
assumptions:                                # populated when scoping ran without user answers
  - "No user input available; stack derived from research + project-reports/ dependency data."
  - "Assumed full feature scope for each named project."
exclusions:                                 # proprietary / vendor-only -> classified grey (N/A)
  - name: "CUDA / cuDNN / NCCL / TensorRT"
    reason: "Proprietary NVIDIA GPU path; never native RISC-V."
out_of_scope:                               # user does not care about these -> NOT classified
  - name: "torch.compile pipeline (Triton, torch-mlir, IREE, MLIR, LLVM)"
    reason: "Scope is CPU eager inference only; JIT/compile path excluded by the user."

layers:                                     # ordered top -> bottom, mirrors the example outline
  # Per-product layer: use product: + layer: instead of title:.
  # product:       the column name (e.g. a database engine, a runtime)
  # layer: the row name shared across all products (e.g. "Client Drivers")
  # The full ordered product list and row order are derived from the collection of these values
  # (first-appearance order in the layers list).
  - product: PyTorch
    layer: "Frontend / Eager"
    nodes:
      - name: PyTorch ATen
        repo: https://github.com/pytorch/pytorch
        home: https://pytorch.org/
        slug: pytorch
        criticality: critical
        features_in_scope: "CPU eager inference"
        notes: "C++/Python. Check riscv64 build + any SIMD dispatch."
  # Shared layer: layer: without product:. Rendered as a full-width strip below the product grid.
  - layer: "Orchestration"
    nodes:
      - name: LangChain
        repo: https://github.com/langchain-ai/langchain
        home: https://www.langchain.com/
        slug: langchain                     # reuse project-reports/<slug>.md; omit if no report exists
        criticality: critical               # critical | optional
        features_in_scope: "chains, agents, tool use, RAG"
        notes: "Pure Python; inherits RISC-V support from CPython."
  - layer: "Inference Serving"
    nodes:
      - name: vLLM
        repo: https://github.com/vllm-project/vllm
        home: https://www.vllm.ai/
        slug: vllm
        criticality: critical
        features_in_scope: "CPU inference backend"
        # no slug field for a node with no per-project report -- simply omit it
  # ... more layers and nodes, derived from research + project-reports/ Section 9
chains:                                     # optional: pipeline chains and alternate paths
  - name: "torch.compile GPU lowering path"
    sequence: ["TorchDynamo", "AOTAutograd", "TorchInductor", "Triton", "MLIR", "LLVM"]
  - name: "CPU inference path (RISC-V)"
    sequence: ["PyTorch ATen", "oneDNN", "OpenBLAS"]
```

Field semantics mirror `project-reports/scope.yml`: `repo` is the canonical upstream repo URL (omit if none),
`home` is the homepage, and `slug` (only when a per-project report exists) points stage 2 at
`project-reports/<slug>.md` for reuse -- **omit `slug` entirely for a node with no report** (do not set it
to null or empty). Each node is one classification unit in stage 2; a single project may appear as
several nodes when its features were split during scoping.

Each layer entry is either a **per-product layer** or a **shared layer**:

- **Per-product layer**: has both `product:` (the column name) and `layer:` (the row name).
  The full ordered product list and row order are derived from first-appearance order across all
  layer entries -- there are no separate top-level `products:` or `product_layers:` fields. A
  shared-layer node may carry an optional `column:` field to place it under a specific product
  column within the shared strip.
- **Shared layer**: has `layer:` but no `product:`. Rendered as a full-width strip below the
  product grid (e.g., "Orchestration & Observability", "System Libraries").
- **Single-product vertical**: all layers have only `layer:`; no `product:` appears anywhere.

The optional `chains:` block records the pipeline chains and alternate paths that the layered
`nodes:` list cannot express on its own (a node list is flat; a chain is an ordered edge sequence).
Render `chains:` verbatim in the stack outline's "pipeline chains" section. `exclusions` are
classified grey and shown in the stack; `out_of_scope` components are never classified and appear
only as a short note so the reader knows they were deliberately dropped.

---

## Stage 2: Research and classification

Goal: assign every node in the locked scope spec a RISC-V readiness color, then emit the three
output artifacts.

### 2.1 Classification -- delegate entirely to /project-color-coding

**Use the `/project-color-coding` skill to classify each node.** That skill is the single
authoritative source for:

- The 6-state color model (Steps 0-2: architecture-independent shortcut, primary grade from
  upstream CI, optimization-purpose downgrade modifier) -- colors are grey / green / blue /
  yellow / orange / red
- The release-provider rule (who publishes the riscv64 artifact; required for green; visible note
  on every node where it is not upstream)
- The distribution floor rules (yellow for clean unpatched distro builds; orange for patched or
  uncertain distro builds)
- The research procedure (stored reports first, adversarial spot-check, fallback to live research)
- The per-node record fields (`color`, `color_case`, `release_provider`, `optimization_gap`,
  `justification`, `primary_source`, `report_date`, `verified_date`, `as_of`, `confidence`,
  `delta_vs_report`)
- All non-negotiable rules (primary source requirements, no guessing, no inferring CI from issue
  text, red only for confirmed breakage, Latin-1 only)

Do not re-derive or re-state any of those rules here. Apply them exactly as written.

---

## Output artifacts

Write all three into the generated report `<vertical-slug>.md`. Default framing is exec/product
(PowerPoint-first); shift technical depth up if the scope spec's audience is eng-leadership. The
report opens with a header block in the same style as the per-project reports. `Author` comes from
the scope spec's `author` field (default: the operator running it), `Date` from `run_date` (default:
today), and `Target profile` from `target_profile`:

```
---
title: [Vertical name] -- RISC-V Ecosystem Status
---

# [Vertical name] -- RISC-V Ecosystem Status

**Author:** [scope spec `author`]<br/>
**Date:** [scope spec `run_date`]<br/>
**Scope:** RISC-V readiness of the [vertical] software stack<br/>
**Target profile:** [scope spec `target_profile`, e.g. RVA23U64]<br/>
**Audience:** [scope spec `audience`]<br/>
**Verification policy:** Colors are assigned from primary upstream sources, adversarially verified
against the per-project reports under project-reports/. Items not verifiable against a second source are
marked [NEEDS VERIFICATION].<br/>
```

If the scope spec recorded any `assumptions:` (a degraded, non-interactive run), reproduce them in a
short "Scoping assumptions" note directly under the header so the reader can correct them.

### Artifact 1: Layered stack outline

A layered, top-to-bottom outline (top = what the user writes, bottom = hardware). This is the paste
source for a Copilot-for-PowerPoint stack diagram, so it must be clean and structured.

**Single-product verticals (only `layer:` in any layer entry, no `product:`):** Use one `##`
section per layer with sequential numbering (`## Layer 1 -- <title>`, `## Layer 2 -- <title>`,
etc.).

**Multi-product verticals (some layer entries carry `product:` + `layer:`):**
Derive the product list and row order from first-appearance order across all layer entries.
Organize layers in two groups:

1. *Per-product layers* (the product grid): one `### Layer N.x -- <Product>: <Row>` section for
   each `(product, row-layer)` pair, where `N` is the row number (1 = first distinct
   `layer:` value in source order) and `x` is a lowercase letter assigned to the product
   in first-appearance order (a, b, c, ...).
   Group all letters for the same row together before advancing to the next row:
   `Layer 1.a -- ProductA: Row1`, `Layer 1.b -- ProductB: Row1`, ...,
   `Layer 2.a -- ProductA: Row2`, etc.
   When a product has no nodes for a given row, emit the heading with the single line
   `N/A: <brief reason>` (e.g., "N/A: no dedicated client library for this protocol").
   End each row group with a "Pipeline chains and alternate paths" subsection listing the
   per-product chains for that row from `chains:`.

2. *Shared layers* (the full-width strip): one `### Layer N -- <title>` section per shared
   layer (N continues from the last row number of the product grid). End with the shared
   pipeline chains from `chains:`.

Under each layer section, **one bullet per node spanning as many lines as it needs:**

```
### Layer N.x -- <Product>: <Row title>   (multi-product)
### Layer N -- <Layer title>              (single-product or shared)

- **[Node name]** -- [color] ([criticality])
  - [one-line description of what it is]
  - License: [license]. Governance: [owner/foundation].
  - [if release_provider is not upstream:] Release provided by [provider], not upstream.
  - [if yellow/orange/red and load-bearing:] Gap: [what is missing on riscv64].
```

After all layers, reproduce the scope spec's `chains:` block as a "Pipeline chains and alternate
paths" subsection, one line per chain (`A -> B -> C -> ...`), exactly as the per-project ecosystem
diagram convention does. The reference example that inspired this format lives outside the repo (an
agentic-AI stack diagram); do not depend on that file being present -- the shape above is the whole
spec.

### Artifact 2: Status table (spreadsheet / CSV-first) plus a slide-ready summary

This artifact is **spreadsheet-first**, not slide-first: it is wide and detailed, meant for pasting
into Google Sheets / Excel or dropping into CSV. Emit two things:

**(a) Full status table** -- one markdown table, one row per node:

`Node | Layer | Criticality | Color | Release provider | Justification | Primary source | As-of | Delta-vs-report`

**(b) Slide-ready summary table** -- a narrow 4-column table that *does* paste cleanly onto a slide,
for the exec/product deck:

`Node | Color | Criticality | Release provider`

When running via the workflow, also return the full-table rows as raw data for CSV. Because the
`Justification` column contains commas and URLs, **quote every CSV field with double quotes and
escape embedded double quotes by doubling them** (RFC 4180). If a consumer needs a CSV without
free-text, drop the `Justification` and `Primary source` columns rather than emitting an unquoted,
comma-broken row.

### Artifact 3: Narrative and next steps

- **Scorecard.** A one-glance aggregate, counting critical-path nodes: "Of N critical-path nodes:
  X green, Y blue, Z yellow, W orange, V red, and U grey (N/A)." Repeat for optional nodes as a
  second line. Omit color entries with a count of zero.
- **The story.** Lead with the load-bearing red and orange nodes -- these are what block the
  vertical on RISC-V. Call out explicitly every node whose riscv64 release comes from a third party
  (RISE or other) rather than upstream, because that is a hidden dependency risk.
- **Actionable next steps.** Concrete, prioritized actions: what to do, who upstream is best
  positioned to do it, and -- critically -- where RISE (or another party) already covers the work
  (runners, board farm, funded contributors, hosted releases), so effort already underway is not
  double-counted in any investment estimate. Use the RISE checks in the `/project-color-coding` skill
  (Research procedure, step 4) to ground this.

### Artifact 4: Stack view-model (`<vertical-slug>.yml`)

A machine-readable view-model of the layered stack, written alongside `<vertical-slug>.md`. It
carries exactly the data the diagram renderer needs -- the 2D grid layout plus each node's color,
criticality, release provider, and gap text -- so the renderer never has to parse the free-text
report. Feed it to `render-stack-svg.py` (in this directory) to produce an SVG stack diagram
(product columns x layer rows, one colored box per node, native hover tooltip showing the gap):

```
python3 render-stack-svg.py render <vertical-slug>.yml -o <vertical-slug>.svg
```

The layout is derived from the scope spec's `layers:` -- not re-invented: a layer entry with
`product:` and `layer:` places its nodes in the product grid (column = `product:`, row =
`layer:`); a layer entry with only `layer:` is a **full-width shared layer** rendered below
the product grid. Column and row order follow first-appearance order across the layer entries.
Column widths are not uniform: each column is sized to its busiest cell, so a product with many
extensions is wider than a sparse one. A node in a shared layer may still be placed under a product
column -- set `column:` on that node, or let `render-stack-svg.py build` infer it from the report's
Artifact 1 per-product subsections (e.g. "Layer 4.a -- PostgreSQL: Orchestration &
Observability"); shared-layer nodes with no column render in a full-width strip beneath the
per-product cells. Each node's `color`, `criticality`, `release_provider`, and `gap` (a one-line
"what is missing on riscv64") come straight from that node's classification record (Artifact 2).
`upstream_release` is true only when `release_provider` is `upstream`.

The `color` encodes two axes at once (see the `/project-color-coding` skill): the upstream
build/test/release posture, and -- for optimization-purpose projects (compression, crypto,
allocators, SIMD kernels) -- the RISC-V optimization level; the optimization axis can only cap the
grade downward. The `legend` labels spell out both axes; the chip conveys the color, so each label
carries no color name. They render as a 2-column x 3-row grid at the top-right of the diagram
(green/blue/yellow in the left column, orange/red/grey in the right). Schema:

```yaml
title: "Databases (OLTP + OLAP + KV/cache) ..."   # the vertical name
target_profile: RVA23U64
hardware_label: "Hardware: RISC-V CPU (RVA23U64)"
columns: [PostgreSQL, MySQL, MariaDB, Redis, Memcached]   # product grid columns, in order
product_layers: ["Client Drivers", "Database Engine", "Extensions, Clustering & Proxies"]
shared_layers: ["Orchestration & Observability", "System Libraries"]
legend:                                           # all six states (fixed; reused across verticals)
  - {color: green,  label: "upstream builds+tests+releases; optimized"}
  - {color: blue,   label: "upstream builds+tests; mostly optimized"}
  - {color: yellow, label: "upstream builds; some optimized"}
  - {color: orange, label: "no upstream build, distributions only; no optimizations"}
  - {color: red,    label: "not working"}
  - {color: grey,   label: "unknown or N/A"}
nodes:
  - name: libpq
    color: blue                                   # grey | green | blue | yellow | orange | red
    criticality: critical                         # critical | optional
    column: PostgreSQL                            # product column; null for a shared strip node
    layer: "Client Drivers"                       # a layer or shared_layer title
    release_provider: Debian
    upstream_release: false                        # true only when release_provider == upstream
    gap: "Build Farm has active riscv64 workers passing full regression suite; upstream ships source only"
  # ... one entry per node, in scope order. A shared-layer node may carry a `column:` to sit
  # under that product (e.g. CloudNativePG under PostgreSQL in Orchestration & Observability).
```

If you are running Stage 2 inline (small stack), emit this file yourself. If you run the workflow,
it returns the view-model (see below) and you write it to `<vertical-slug>.yml`. For a report that
predates this artifact, `render-stack-svg.py build <project-reports/scope.yml> <report.md> -o <slug>.yml`
reconstructs the view-model from the existing scope spec and report.

---

## Running stage 2 via the Workflow

For a stack of more than a handful of nodes, stage 2 is best run with the companion script
`stack-report-workflow.js` in this directory, which fans out one classification agent per node,
runs an adversarial verification pass, and synthesizes the three artifacts. Pass the parsed scope
spec as the workflow `args`. See `README.md` in this directory for the exact invocation, and
`prompts/project-report/AGENTS.md` for the operational rules (rate limits, one workflow at a time,
resume-on-stall) that apply to any research workflow in this repository.

If the workflow script is not present, or the stack is small (a handful of nodes), just execute the
Stage 2 instructions above inline in the session -- the instructions are self-contained and do not
require the workflow. The workflow is a scaling convenience, not a dependency.
