export const meta = {
  name: 'vertical-report',
  description: 'RISC-V vertical ecosystem report: classify each stack node red/orange/yellow/blue/green/grey, verify, synthesize 3 artifacts',
  phases: [
    { title: 'Classify', detail: 'One agent per node: hybrid reuse-report + live-verify color classification' },
    { title: 'Verify', detail: 'Adversarial re-check of each node color-deciding fact' },
    { title: 'Synthesize', detail: 'Write the 3 artifacts (stack outline, status table, narrative) from node verdicts' },
  ],
}

// args = the parsed scope spec object written by Stage 1 (see vertical-report.md, Section 1.4).
// Shape: { vertical, slug?, author?, run_date?, audience?, target_profile?, use?, assumptions?,
//          exclusions?, out_of_scope?, layers: [{title, nodes: [{name, repo?, home?, slug?,
//          criticality, features_in_scope?, notes?}]}], chains? }
const spec = args || {}
const slug = spec.slug || (spec.vertical || 'vertical').toLowerCase().replace(/[\s.\/]+/g, '-')
const targetProfile = spec.target_profile || 'RVA23U64'

// Classification rules live exclusively in examples/color-coding/color-coding.md.
// Each classify/verify agent reads that file directly (via the Read tool) rather than
// receiving an inline copy. This ensures the workflow stays in sync with color-coding.md
// without needing to update two places.
const COLOR_CODING_PATH = 'examples/color-coding/color-coding.md'

// Structured per-node record schema -- forces uniform output from every classify/verify agent.
const NODE_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    name: { type: 'string' },
    layer: { type: 'string' },
    criticality: { type: 'string', enum: ['critical', 'optional', 'n/a'] },
    color: { type: 'string', enum: ['grey', 'green', 'blue', 'yellow', 'orange', 'red'] },
    color_case: { type: 'string', description: 'for grey: N/A|unknown; for yellow: build-only-ci|clean-distro-build; for orange: downstream-only|optimization-absent; else empty' },
    release_provider: { type: 'string', description: 'upstream|RISE|<distro>|third-party|none' },
    justification: { type: 'string', description: '1-3 sentences with the deciding fact and a markdown source link' },
    primary_source: { type: 'string', description: 'single most authoritative URL' },
    report_date: { type: 'string', description: 'Date: header of reports/<slug>.md, or none' },
    verified_date: { type: 'string', description: 'date of live checks, or none' },
    as_of: { type: 'string', description: 'oldest date among color-deciding facts' },
    confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
    delta_vs_report: { type: 'string', description: 'the discrepancy if a live check contradicted the report; else none or n/a' },
  },
  required: ['name', 'layer', 'criticality', 'color', 'release_provider', 'justification', 'primary_source', 'as_of', 'confidence', 'delta_vs_report'],
}

function ghHint(repo) {
  if (!repo) return 'No repo URL. Use WebSearch + WebFetch against the homepage and registries.'
  const m = repo.match(/github\.com\/([^/]+)\/([^/]+)/)
  if (m) {
    const owner = m[1], name = m[2].replace(/\.git$/, '')
    return `On GitHub at ${owner}/${name}. Use the GitHub MCP tools (search_issues, search_pull_requests, search_code, get_file_contents, list_releases, pull_request_read) for CI files, releases, PR merge status.`
  }
  return `Not on GitHub (${repo}). Use WebSearch + WebFetch; read CI config and release pages directly.`
}

// ── Flatten nodes from layers; pre-classify exclusions as grey; drop out_of_scope ──
const nodes = []
for (const layer of spec.layers || []) {
  for (const n of layer.nodes || []) nodes.push({ ...n, layer: layer.title })
}
log(`Vertical: ${spec.vertical || '(unnamed)'} | slug: ${slug} | ${nodes.length} nodes to classify | profile ${targetProfile}`)
if ((spec.out_of_scope || []).length) log(`Out of scope (not classified): ${(spec.out_of_scope).map(o => o.name).join('; ')}`)

const exclusionRecords = (spec.exclusions || []).map(e => ({
  name: e.name,
  layer: 'Excluded (proprietary / vendor-only)',
  criticality: 'n/a',
  color: 'grey',
  color_case: 'N/A',
  release_provider: 'none',
  justification: `Grey (N/A): ${e.reason} Proprietary/vendor-only path; RISC-V readiness is not assessable and is out of the native-RISC-V investment decision.`,
  primary_source: '',
  report_date: 'none',
  verified_date: 'none',
  as_of: spec.run_date || '',
  confidence: 'high',
  delta_vs_report: 'n/a',
}))

if (nodes.length === 0) {
  log('ABORT: scope spec has no nodes under layers[].nodes. Nothing to classify.')
  return [{ vertical: spec.vertical, slug, status: 'FAILED', reason: 'No nodes in scope spec.' }]
}

// ── Classify -> Verify, per node, no barrier between stages ──
phase('Classify')
const verified = await pipeline(
  nodes,

  // Stage 1: classify
  (node) => agent(`Classify the RISC-V readiness of ONE node in a vertical software stack: "${node.name}".

Node context:
- Layer: ${node.layer}
- Criticality: ${node.criticality || 'critical'}
- Repo: ${node.repo || '(none)'}
- Homepage: ${node.home || '(none)'}
- Features in scope for this vertical: ${node.features_in_scope || '(whole project)'}
- Scoping notes: ${node.notes || '(none)'}
- Per-project report slug (if a reports/<slug>.md exists): ${node.slug || '(none)'}
- Target RISC-V profile: ${targetProfile}

${ghHint(node.repo)}

STEP 1 -- Read the classification rules.
Use the Read tool to read the file at path: ${COLOR_CODING_PATH}
This file defines the complete color model, release-provider rule, research procedure,
per-node record fields, and non-negotiable rules. Follow it exactly.

STEP 2 -- Classify this node following the procedure in that file.
The file tells you to: check reports/<slug>.md first (if one exists), adversarially spot-check
the most important color-deciding fact, and fall back to live research only when needed.

STEP 3 -- Return the structured record.
Every URL in justification must be a markdown link [text](url), never bare. No em-dashes.
Set as_of to the OLDEST date among the facts that actually decided the color.`,
    { schema: NODE_SCHEMA, label: `classify:${node.name}`, phase: 'Classify' }),

  // Stage 2: adversarial verify
  (classified, node) => agent(`ADVERSARIAL VERIFICATION of one node's RISC-V readiness color. Be a skeptic: try to REFUTE the assigned color.

Node: "${node.name}" (repo ${node.repo || 'none'}, slug ${node.slug || 'none'}).
Proposed classification:
${JSON.stringify(classified, null, 2)}

${ghHint(node.repo)}

STEP 1 -- Read the classification rules.
Use the Read tool to read the file at path: ${COLOR_CODING_PATH}
This file defines the complete color model, release-provider rule, and all verification sources.

STEP 2 -- Re-check the single color-deciding fact against the primary source from that file.
- If the proposed color claims upstream TESTS riscv64 (blue/green), open the actual CI workflow
  file and confirm a test step exists and runs on riscv64 -- do not accept a build-only job (build-only caps at yellow).
- If yellow, verify that the CI job (or distro build) exists but has no test execution step.
- If green, confirm the release artifact is published BY UPSTREAM (not RISE/distro).
- Apply the strict-downgrade modifiers from the file rigorously.
- If you cannot substantiate the proposed color, correct it (usually downward).

STEP 3 -- Return the FINAL corrected structured record (same schema).
Keep name and layer unchanged. Update color, color_case, release_provider, justification,
primary_source, as_of, confidence, and delta_vs_report to reflect your verdict.`,
    { schema: NODE_SCHEMA, label: `verify:${node.name}`, phase: 'Verify' }),
)

const goodNodes = verified.filter(Boolean)
log(`Classify+Verify complete: ${goodNodes.length}/${nodes.length} nodes classified`)
if (goodNodes.length === 0) {
  log('ABORT: no nodes classified (tools unavailable or rate-limited). Not writing report.')
  return [{ vertical: spec.vertical, slug, status: 'FAILED', reason: 'Zero nodes classified.' }]
}

const allRecords = [...goodNodes, ...exclusionRecords]

// ── Synthesize the 3 artifacts ──
phase('Synthesize')
log(`Synthesizing report for ${slug} from ${allRecords.length} node records ...`)

const report = await agent(`You are writing a RISC-V vertical ecosystem status report. Your final text output IS the report
(do not call tools). Audience: ${spec.audience || 'exec-product'} (PowerPoint-first unless eng-leadership). Write with
precision, no marketing language, no filler. Latin-1 only, no em-dashes (use hyphen or comma). Every URL is a markdown
link [text](url), never bare.

VERTICAL: ${spec.vertical || slug}
TARGET PROFILE: ${targetProfile}
USE: ${spec.use || '(not specified)'}
SCOPING ASSUMPTIONS (reproduce under the header if non-empty): ${JSON.stringify(spec.assumptions || [])}
OUT OF SCOPE (note as deliberately dropped, do not classify): ${JSON.stringify((spec.out_of_scope || []).map(o => o.name))}
PIPELINE CHAINS (render verbatim in the stack outline): ${JSON.stringify(spec.chains || [])}

NODE CLASSIFICATION RECORDS (the source of truth for every color; do not invent facts not present here):
${JSON.stringify(allRecords, null, 2)}

Write the report with this exact structure:

---
title: ${spec.vertical || slug} -- RISC-V Ecosystem Status
---

# ${spec.vertical || slug} -- RISC-V Ecosystem Status

**Author:** ${spec.author || 'RISC-V Ecosystem WG'}<br/>
**Date:** ${spec.run_date || '(run date)'}<br/>
**Scope:** RISC-V readiness of the ${spec.vertical || slug} software stack<br/>
**Target profile:** ${targetProfile}<br/>
**Audience:** ${spec.audience || 'exec-product'}<br/>
**Verification policy:** Colors are assigned from primary upstream sources, adversarially verified against the per-project reports under reports/. Items not verifiable against a second source are marked [NEEDS VERIFICATION].<br/>

(If scoping assumptions are non-empty, add a short "Scoping assumptions" note here.)

## Artifact 1: Layered stack outline

One "## Layer N -- <title>" section per layer, top (orchestration) to bottom (hardware). Under each layer, one bullet
per node spanning as many lines as needed:
- **<name>** -- <color> (<criticality>)
  - <one-line description>
  - License: <license>. Governance: <owner/foundation>.
  - [if release_provider != upstream] Release provided by <provider>, not upstream.
  - [if load-bearing and color is yellow/orange/red] Gap: <what is missing on riscv64>.
Then a "Pipeline chains and alternate paths" subsection rendering each chain as "A -> B -> C".

## Artifact 2: Status table

(a) Full table, one row per node:
| Node | Layer | Criticality | Color | Release provider | Justification | Primary source | As-of | Delta-vs-report |
(b) Slide-ready summary table:
| Node | Color | Criticality | Release provider |

## Artifact 3: Narrative and next steps

- Scorecard: "Of N critical-path nodes: X green, Y blue, Z yellow, W orange, V red, U grey (N/A)." Second line for optional nodes. Omit color entries with a count of zero.
- The story: lead with load-bearing red and orange nodes (what blocks or degrades the vertical on RISC-V), then yellow nodes (no test gate). Call out every node whose
  riscv64 release comes from a third party (RISE or other) rather than upstream -- a hidden dependency risk.
- Actionable next steps: concrete, prioritized actions; who upstream is best positioned; and where RISE (or another
  party) already covers the work (runners, board farm, funded contributors, hosted releases) so effort already underway
  is not double-counted.

Base every factual claim on the node records above. Where a record lacks data, write "Data not available" rather than guessing.`,
  { label: `synthesize:${slug}`, phase: 'Synthesize' })

return [{
  vertical: spec.vertical || slug,
  slug,
  file: `examples/vertical-report/out/${slug}.md`,
  report,
  nodeCount: allRecords.length,
  records: allRecords,
}]
