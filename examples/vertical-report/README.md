# Vertical Ecosystem Report (reusable example)

Tooling to generate a **RISC-V readiness report for a vertical** -- the full software stack behind a
product or workload (for example "Agentic AI inference serving", "OLTP databases", "web serving",
but also open-ended verticals such as IoT, embedded, or automotive). A vertical report answers one
question for decision-makers: *for the stack that makes up this product, how RISC-V-ready is each
layer, and what are the next steps?*

This differs from the per-project reports under `reports/`: those cover one project each; a vertical
report classifies a whole stack and rolls it up into slides-ready artifacts. The vertical reports
consume the per-project reports as a prior and adversarially verify them live.

## What is in this directory

| File | Purpose | Committed? |
|---|---|---|
| `vertical-report.md` | The master prompt. Run this. Self-contained; works interactively or headless. | yes |
| `vertical-report-workflow.js` | A `Workflow` script that runs stage 2 (classify + verify + synthesize) at scale, one agent per stack node. | yes |
| `README.md` | This file. | yes |
| `out/` | Where you save the generated scope spec and report. Git-ignored. | no |

**Generated reports are ad-hoc and are not committed.** They are research you run for your own use
case. Save them under `out/` (git-ignored) or anywhere outside the repo. Do not commit them.

## The vertical is whatever you define

Do not restrict the vertical to any pre-existing category. The `categories:` frontmatter in the
per-project reports is only a weak hint for finding related projects; it never constrains what a
vertical can be.

## The two-stage flow

A vertical report is produced in two stages, because the scope must be negotiated with a human but
the research is best run unattended.

### Stage 1 -- Scoping (interactive)

Open `vertical-report.md` in a Claude Code session and follow it. It interviews you (what product,
which projects, which features of each matter, critical vs optional, target ISA profile, audience,
and any proprietary paths to exclude), researches the stack (reusing the dependency data in
`reports/*.md`), and writes a locked **scope spec** to `out/<vertical-slug>.scope.yml`.

If there is no human to interview (a headless or batch run), the prompt degrades gracefully: it
derives the stack from research plus the `reports/` data, states every assumption in the spec's
`assumptions:` list, and proceeds without blocking.

The slug is derived from the vertical name: `name.toLowerCase().replace(/[\s.\/]+/g, '-')` (so
"Agentic AI" -> `agentic-ai`). Override it with an explicit `slug:` in the spec.

### Stage 2 -- Research and synthesis (unattended)

Consume the locked scope spec, classify every node in the stack for RISC-V readiness (the 6-state
color model: grey / green / blue / yellow / orange / red), adversarially verify each color, and emit the
three output artifacts into `out/<vertical-slug>.md`.

**Small stack (a handful of nodes):** just execute the Stage 2 instructions in `vertical-report.md`
inline in the session. No workflow needed.

**Large stack:** run the workflow, which fans out one classification agent per node.

```js
// 1. Parse the locked scope spec (out/<slug>.scope.yml) into a JS object -- e.g. read the YAML and
//    convert it, or hand it to the session to parse.
// 2. Invoke the workflow with that object as args:
Workflow({
  args: <the parsed scope-spec object>,
  scriptPath: "C:/Users/ludohenr/git/sw-ecosystem/examples/vertical-report/vertical-report-workflow.js"
})
```

The workflow runs three phases -- **Classify** (one agent per node, hybrid reuse-report + live
verify), **Verify** (adversarial re-check of each color-deciding fact), **Synthesize** (writes the
three artifacts) -- and returns `{ vertical, slug, file, report, nodeCount, records }`. Write the
returned `report` string to `file` (`out/<slug>.md`):

```python
import json
data = json.load(open("<workflow-output-file>"))
item = data["result"][0]
open(item["file"], "w", encoding="utf-8").write(item["report"])
print(item["nodeCount"], "nodes;", len(item["report"]), "chars")
```

## The output: three artifacts

Every generated report contains, in order:

1. **Layered stack outline** -- top-to-bottom, one section per layer, each node tagged with its
   color, criticality, license, governance, and a "release provided by \<provider\>" note where the
   riscv64 release is not from upstream. Plus the pipeline chains. This is the paste source for a
   Copilot-for-PowerPoint stack diagram.
2. **Status table** -- a wide, spreadsheet/CSV-first table (one row per node with justification and
   sources), plus a narrow 4-column slide-ready summary.
3. **Narrative and next steps** -- an aggregate scorecard, the load-bearing red/orange nodes as the
   story, the third-party-release dependencies called out, and a prioritized, actionable next-steps
   list that credits work RISE (or others) already cover so it is not double-counted.

## The color model in one paragraph

Each node gets one color. **grey** = N/A (proprietary/vendor-only) or unknown. **green** = upstream
builds, tests, passes, and publishes the riscv64 release itself; everything is in place and
optimized. **blue** = upstream builds and tests pass but no upstream riscv64 release (a third party
such as RISE ships it -- flagged); for optimization-purpose projects, primary hot paths have
RISC-V-specific code. **yellow** = upstream CI includes a build step but no test gate, or a
distribution ships the package from unpatched upstream source with no upstream CI; for
optimization-purpose projects, some RISC-V-specific code exists but key paths still fall back to
scalar C. **orange** = no upstream CI, no upstream release; only available through a distribution
that may need riscv64-specific patches; or an optimization-purpose project with no RISC-V-specific
code at all (scalar fallback). **red** = confirmed broken or known non-functional on riscv64. Red is
not the default for missing CI -- use orange or yellow for untested-but-buildable projects. Pure
Python / noarch nodes are green by construction. Green is reserved for releases published directly
by upstream -- a RISE-hosted wheel keeps a node blue with a visible note, which matters because many
packages are usable on riscv64 today only because RISE ships the wheel. Full rules are in
`color-coding.md`, The color model section.

## Operational notes

The Stage 2 workflow obeys the same operational rules as the per-project research workflow -- see
`CLAUDE.md` at the repo root: run only one research workflow at a time (16-plus concurrent agents
saturate the rate limit), and resume a stalled run with `resumeFromRunId` rather than restarting.
The per-project reports the workflow reads as priors are refreshed only every 3 to 6 months, so the
workflow always re-verifies the color-deciding facts live and flags any node where the live check
contradicts the stored report (`delta_vs_report`) -- that flag also tells you which per-project
report under `reports/` is due for a refresh.
