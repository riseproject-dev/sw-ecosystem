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
//          exclusions?, out_of_scope?,
//          layers: [{layer, product?, nodes: [{name, repo?, home?, slug?,
//          criticality, features_in_scope?, notes?}]}], chains? }
// Per-product layer: has both product: and layer:. Shared/single-product layer: layer: only.
const spec = args || {}
const slug = spec.slug || (spec.vertical || 'vertical').toLowerCase().replace(/[\s.\/]+/g, '-')
const targetProfile = spec.target_profile || 'RVA23U64'

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
    report_date: { type: 'string', description: 'Date: header of project-reports/<slug>.md, or none' },
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
// Each layer entry has layer: and optionally product:. The canonical .layer key on each node is
// "<product> -- <layer>" for per-product entries, or just "<layer>" for shared/single-product ones.
function layerLabel(l) {
  if (l.product && l.layer) return `${l.product} -- ${l.layer}`
  return l.layer || ''
}
const nodes = []
for (const l of spec.layers || []) {
  for (const n of l.nodes || []) nodes.push({ ...n, layer: layerLabel(l) })
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
- Per-project report slug (if a project-reports/<slug>.md exists): ${node.slug || '(none)'}
- Target RISC-V profile: ${targetProfile}

${ghHint(node.repo)}

STEP 1 -- Apply the /project-color-coding skill.
Invoke the /project-color-coding skill to get the complete color model, release-provider rule,
research procedure, per-node record fields, and non-negotiable rules. Follow them exactly.

STEP 2 -- Classify this node following the procedure in that file.
The file tells you to: check project-reports/<slug>.md first (if one exists), adversarially spot-check
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

STEP 1 -- Apply the /project-color-coding skill.
Invoke the /project-color-coding skill to get the complete color model, release-provider rule,
and all verification sources.

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

// Derive the layer heading convention from the scope spec for the synthesize prompt.
// Multi-product: "### Layer N.x -- <Product>: <Row>" for product-grid rows (N = row index 1-based,
// x = lowercase letter for product in first-appearance order); "### Layer N -- <Title>" for shared.
// Single-product: "## Layer N -- <Title>" for every layer.
const isMultiProduct = (spec.layers || []).some(l => l.product && l.layer)
// Derive ordered products and layers from first-appearance for the prompt.
const _products = [], _productLayers = []
for (const l of spec.layers || []) {
  if (l.product && l.layer) {
    if (!_products.includes(l.product)) _products.push(l.product)
    if (!_productLayers.includes(l.layer)) _productLayers.push(l.layer)
  }
}
const layerHeadingInstructions = isMultiProduct ? `
MULTI-PRODUCT LAYER HEADING CONVENTION (mandatory -- do not invent a different scheme):
- Products (columns) in order: ${JSON.stringify(_products)} -- assigned letters a, b, c, ... in that order.
- Per-product row layers in order: ${JSON.stringify(_productLayers)} -- numbered 1, 2, 3, ... in that order.
- Per-product layer headings: "### Layer N.x -- <Product>: <Row>" where N is the row number and x is the product letter.
  Example: first row of first product = "### Layer 1.a -- ${_products[0] || 'ProductA'}: ${_productLayers[0] || 'Row1'}"; first row of second product = "### Layer 1.b -- ${_products[1] || 'ProductB'}: ${_productLayers[0] || 'Row1'}".
  Group all product letters for the same row together before incrementing N. When a product has no nodes for a row, emit the heading with a single "N/A: <brief reason>" line.
  End each row group (all letters for one N) with a "Pipeline chains and alternate paths" subsection for that row's chains.
- Shared layer headings: "### Layer N -- <Title>" where N continues after the last row number. End with the shared pipeline chains.
` : `
SINGLE-PRODUCT LAYER HEADING CONVENTION: Use "## Layer N -- <Title>" with sequential N.
`

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

${layerHeadingInstructions}
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
**Verification policy:** Colors are assigned from primary upstream sources, adversarially verified against the per-project reports under project-reports/. Items not verifiable against a second source are marked [NEEDS VERIFICATION].<br/>

(If scoping assumptions are non-empty, add a short "Scoping assumptions" note here.)

## Artifact 1: Layered stack outline

Use the LAYER HEADING CONVENTION specified above. Under each layer heading, one bullet per node:
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

// ── Build Artifact 4: the stack view-model (consumed by render-stack-svg.py) ──
// Layout comes from spec.layers: a title "<Product> -- <Row>" places its nodes in the product
// grid (before "--" is a column, after is a per-product row-layer); a title without "--" is a
// full-width shared layer. Color / provider / gap come from the verified node records, joined by
// name. One node entry per scope instance (a node listed under two columns appears twice, same
// color) so it matches render-stack-svg.py's own `build`.
function parseReportColumns(reportText, columns) {
  // A shared-layer node may still sit under a product column when the synthesized
  // report's Artifact 1 splits the shared layer into per-product subsections
  // ("### Layer 4.a -- PostgreSQL: ...", then bullets under
  // "### Layer 4.a -- Orchestration & Observability"). Return {node: product}.
  // Mirrors parse_report_columns() in render-stack-svg.py so workflow output and a
  // from-files rebuild agree.
  const colSet = new Set(columns)
  const mapping = {}, letterToProduct = {}
  let current = null
  for (const line of String(reportText || '').split('\n')) {
    const h = line.match(/^#{2,4}\s+Layer\s+\d+(?:\.([a-z]))?\s+--\s+(.+?)\s*$/)
    if (h) {
      const letter = h[1], title = h[2]
      if (letter && title.includes(':')) {
        const product = title.split(':', 1)[0].trim()
        letterToProduct[letter] = product
        current = colSet.has(product) ? product : null
      } else if (letter && letterToProduct[letter]) {
        current = colSet.has(letterToProduct[letter]) ? letterToProduct[letter] : null
      } else {
        current = null
      }
      continue
    }
    const b = line.match(/^-\s+\*\*(.+?)\*\*/)
    if (b && current && !(b[1].trim() in mapping)) mapping[b[1].trim()] = current
  }
  return mapping
}

function buildViewModel(spec, records, slug, profile, reportText) {
  // Two-level index: recByPair[layer][name] disambiguates a node listed under two
  // columns; recByName[name] is the fallback. records carry `layer` (the full scope
  // layer title) from the classify agents.
  const recByPair = new Map(), recByName = new Map()
  for (const r of records) {
    if (!recByPair.has(r.layer)) recByPair.set(r.layer, new Map())
    recByPair.get(r.layer).set(r.name, r)
    if (!recByName.has(r.name)) recByName.set(r.name, r)
  }
  const lookup = (name, title) =>
    (recByPair.get(title) && recByPair.get(title).get(name)) || recByName.get(name) || {}

  // Derive columns (products) and productLayers from first-appearance order across layer entries.
  // Per-product layers: product: + layer:. Shared/single-product layers: layer: only.
  const columns = [], productLayers = [], sharedLayers = []
  for (const l of spec.layers || []) {
    if (l.product && l.layer) {
      if (!columns.includes(l.product)) columns.push(l.product)
      if (!productLayers.includes(l.layer)) productLayers.push(l.layer)
    } else if (l.layer && !sharedLayers.includes(l.layer)) {
      sharedLayers.push(l.layer)
    }
  }
  const reportColumns = parseReportColumns(reportText, columns)

  const nodes = []
  for (const l of spec.layers || []) {
    const isProductLayer = !!(l.product && l.layer)
    const productColumn = isProductLayer ? l.product : null
    const layerTitle = isProductLayer ? l.layer : (l.layer || '')
    const label = isProductLayer ? `${l.product} -- ${l.layer}` : (l.layer || '')
    for (const n of l.nodes || []) {
      const rec = lookup(n.name, label)
      const provider = rec.release_provider || 'none'
      // Product-layer node: column from product:. Shared-layer node: explicit
      // `column:` on the scope node, else the report's per-product placement.
      const column = productColumn || n.column || reportColumns[n.name] || null
      nodes.push({
        name: n.name,
        color: rec.color || 'grey',
        criticality: n.criticality || 'critical',
        column,
        layer: layerTitle,
        release_provider: provider,
        upstream_release: String(provider).trim().toLowerCase() === 'upstream',
        gap: rec.justification || '',
      })
    }
  }

  return {
    title: spec.vertical || slug,
    target_profile: profile,
    hardware_label: `Hardware: RISC-V CPU (${profile})`,
    columns, product_layers: productLayers, shared_layers: sharedLayers,
    // Each label spells out both axes (upstream build/test/release posture and, for
    // optimization-purpose projects, the RISC-V optimization level); the chip conveys the
    // color, so the label carries no color name. Rendered as a 2-column x 3-row grid at top-right.
    legend: [
      { color: 'green', label: 'upstream builds+tests+releases; optimized' },
      { color: 'blue', label: 'upstream builds+tests; mostly optimized' },
      { color: 'yellow', label: 'upstream builds; some optimized' },
      { color: 'orange', label: 'no upstream build, distributions only; no optimizations' },
      { color: 'red', label: 'not working' },
      { color: 'grey', label: 'unknown or N/A' },
    ],
    nodes,
  }
}

// Minimal YAML emitter for the view-model shape (top-level scalars, arrays of scalars, and arrays
// of flat objects). Every string is double-quoted and escaped, so the output is always valid YAML
// regardless of colons/brackets/quotes in gap text. No external YAML dependency in the sandbox.
function ymlDump(vm) {
  const scalar = (v) => {
    if (v === null || v === undefined) return 'null'
    if (typeof v === 'boolean') return v ? 'true' : 'false'
    if (typeof v === 'number') return String(v)
    return '"' + String(v).replace(/\\/g, '\\\\').replace(/"/g, '\\"')
      .replace(/\n/g, '\\n').replace(/\t/g, '\\t') + '"'
  }
  const lines = []
  for (const key of Object.keys(vm)) {
    const val = vm[key]
    if (Array.isArray(val)) {
      if (val.length === 0) { lines.push(key + ': []'); continue }
      lines.push(key + ':')
      for (const item of val) {
        if (item && typeof item === 'object') {
          Object.keys(item).forEach((k, i) =>
            lines.push((i === 0 ? '  - ' : '    ') + k + ': ' + scalar(item[k])))
        } else {
          lines.push('  - ' + scalar(item))
        }
      }
    } else {
      lines.push(key + ': ' + scalar(val))
    }
  }
  return lines.join('\n') + '\n'
}

const viewmodel = buildViewModel(spec, allRecords, slug, targetProfile, report)

return [{
  vertical: spec.vertical || slug,
  slug,
  file: `examples/vertical-report/out/${slug}.md`,
  report,
  nodeCount: allRecords.length,
  records: allRecords,
  viewmodel,                     // Artifact 4 object: write to out/<slug>.yml (yaml.safe_dump)
  viewmodel_yaml: ymlDump(viewmodel),   // ready-to-write YAML string (no PyYAML needed)
}]
