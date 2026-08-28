# Vertical Ecosystem Report (reusable example)

Tooling to generate a **RISC-V readiness report for a vertical** -- the full software stack behind a
product or workload (for example "Agentic AI inference serving", "OLTP databases", "web serving",
but also open-ended verticals such as IoT, embedded, or automotive). A vertical report answers one
question for decision-makers: *for the stack that makes up this product, how RISC-V-ready is each
layer, and what are the next steps?*

This differs from the per-project reports under `project-reports/`: those cover one project each; a vertical
report classifies a whole stack and rolls it up into slides-ready artifacts. The vertical reports
consume the per-project reports as a prior and adversarially verify them live.

## What is in this directory

| File | Purpose | Committed? |
|---|---|---|
| `stack-report.md` | The master prompt. Run this. Self-contained; works interactively or headless. | yes |
| `stack-report-workflow.js` | A `Workflow` script that runs stage 2 (classify + verify + synthesize) at scale, one agent per stack node. | yes |
| `render-stack-svg.py` | Renders the stack view-model (`out/<slug>.yml`) to an SVG stack diagram. Can also reconstruct the view-model from an existing scope spec + report. | yes |
| `README.md` | This file. | yes |
| `stack-reports/<slug>/` | Where generated reports live. Committed. | yes |

**Generated reports are committed.** Save them under `stack-reports/<slug>/` at the repo root.

## The vertical is whatever you define

Do not restrict the vertical to any pre-existing category. The `categories:` frontmatter in the
per-project reports is only a weak hint for finding related projects; it never constrains what a
vertical can be.

## The two-stage flow

A vertical report is produced in two stages, because the scope must be negotiated with a human but
the research is best run unattended.

### Stage 1 -- Scoping (interactive)

Open `stack-report.md` in a Claude Code session and follow it. It interviews you (what product,
which projects, which features of each matter, critical vs optional, target ISA profile, audience,
and any proprietary paths to exclude), researches the stack (reusing the dependency data in
`project-reports/*.md`), and writes a locked **scope spec** to `out/<vertical-slug>.project-reports/scope.yml`.

If there is no human to interview (a headless or batch run), the prompt degrades gracefully: it
derives the stack from research plus the `project-reports/` data, states every assumption in the spec's
`assumptions:` list, and proceeds without blocking.

The slug is derived from the vertical name: `name.toLowerCase().replace(/[\s.\/]+/g, '-')` (so
"Agentic AI" -> `agentic-ai`). Override it with an explicit `slug:` in the spec.

### Stage 2 -- Research and synthesis (unattended)

Consume the locked scope spec, classify every node in the stack for RISC-V readiness (the 6-state
color model: grey / green / blue / yellow / orange / red), adversarially verify each color, and emit the
three output artifacts into `out/<vertical-slug>.md`.

**Small stack (a handful of nodes):** just execute the Stage 2 instructions in `stack-report.md`
inline in the session. No workflow needed.

**Large stack:** run the workflow, which fans out one classification agent per node.

```js
// 1. Parse the locked scope spec (out/<slug>.project-reports/scope.yml) into a JS object -- e.g. read the YAML and
//    convert it, or hand it to the session to parse.
// 2. Invoke the workflow with that object as args:
Workflow({
  args: <the parsed scope-spec object>,
  scriptPath: "/abs/path/to/prompts/stack-report/stack-report-workflow.js"
})
```

The workflow runs three phases -- **Classify** (one agent per node, hybrid reuse-report + live
verify), **Verify** (adversarial re-check of each color-deciding fact), **Synthesize** (writes the
three artifacts) -- and returns
`{ vertical, slug, file, report, nodeCount, records, viewmodel, viewmodel_yaml }`. Write the
returned `report` string to `file` (`out/<slug>.md`) and the `viewmodel_yaml` string to
`out/<slug>.yml`:

```python
import json
data = json.load(open("<workflow-output-file>"))
item = data["result"][0]
open(item["file"], "w", encoding="utf-8").write(item["report"])
open(item["file"][:-3] + ".yml", "w", encoding="utf-8").write(item["viewmodel_yaml"])
print(item["nodeCount"], "nodes;", len(item["report"]), "chars")
```

Then render the SVG stack diagram from the view-model:

```bash
python3 render-stack-svg.py render out/<slug>.yml -o out/<slug>.svg --mark-nonupstream
```

`render-stack-svg.py` needs only Python 3 and PyYAML.

## The output: four artifacts

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
4. **Stack view-model (`<slug>.yml`)** -- a machine-readable grid (product columns x layer rows,
   each node's color/criticality/release-provider/gap) written alongside the report. Feed it to
   `render-stack-svg.py` to produce the SVG stack diagram (colored boxes, native hover tooltips
   showing each node's gap). Layout comes from the scope spec's `layers:`; colors come from the
   Artifact 2 classification records. See `stack-report.md`, Artifact 4, for the schema.

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
`skills/project-color-coding/SKILL.md`, The color model section.

## Operational notes

The Stage 2 workflow obeys the same operational rules as the per-project research workflow -- see
`CLAUDE.md` at the repo root: run only one research workflow at a time (16-plus concurrent agents
saturate the rate limit), and resume a stalled run with `resumeFromRunId` rather than restarting.
The per-project reports the workflow reads as priors are refreshed only every 3 to 6 months, so the
workflow always re-verifies the color-deciding facts live and flags any node where the live check
contradicts the stored report (`delta_vs_report`) -- that flag also tells you which per-project
report under `project-reports/` is due for a refresh.
