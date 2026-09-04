export const meta = {
  name: 'stack-report',
  description: 'RISC-V vertical ecosystem report: classify each stack node red/orange/yellow/blue/green/grey, verify, derive its dependency edges, synthesize the report + dependency graph',
  phases: [
    { title: 'Classify', detail: 'One agent per node: hybrid reuse-report + live-verify color classification' },
    { title: 'Verify', detail: 'Adversarial re-check of each node color-deciding fact' },
    { title: 'Edges', detail: 'One agent per node: explicit deps from project-graph-mcp + project-reports, implicit deps from web research' },
    { title: 'Synthesize', detail: 'Write the report (3 artifacts) and the dependency graph JSON from node verdicts + edges' },
  ],
}

// args = the parsed scope spec object written by Stage 1 (see stack-report.md, Section 1.4).
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

// Structured per-node dependency-edge record. "target" is either another node's name in this
// stack (matched case-insensitively downstream) or a short descriptive name for a dependency
// that is not itself a scoped stack node (rendered as an external/grey leaf in the graph).
const EDGE_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    edges: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          target: { type: 'string', description: 'dependency name; use another node\'s name from this stack EXACTLY when it is one of them, else a short specific name for an external dependency' },
          type: { type: 'string', enum: ['explicit', 'implicit'] },
          relation: { type: 'string', description: 'short label, e.g. build-dependency, runtime-dependency, requires-to-be-useful, client-of, extension-of' },
          evidence: { type: 'string', enum: ['project-graph', 'project-report', 'web-search'] },
          note: { type: 'string', description: 'one sentence of evidence/justification, with a markdown source link when available' },
        },
        required: ['target', 'type', 'relation', 'evidence', 'note'],
      },
    },
  },
  required: ['edges'],
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

// ── Classify -> Verify -> Edges, per node, no barrier between stages ──
phase('Classify')
const processed = await pipeline(
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

STEP 0 -- Query the project graph for Ubuntu 26.04 riscv64 availability (fast, structured ground truth).
Use mcp__project-graph__project_graph_query to check whether an Ubuntu 26.04 (Resolute) binary package
for "${node.name}" exists on riscv64. Try the most plausible Ubuntu package names (e.g. "${node.name.toLowerCase()}", "python3-${node.name.toLowerCase().replace(/[\s.\s\/]+/g,'-')}", "lib${node.name.toLowerCase().replace(/[\s.\s\/]+/g,'-')}").
  SELECT ?pkgName ?suite WHERE {
    ?pkg a <https://purl.org/packagegraph/ontology/deb#BinaryPackage> ;
         <https://purl.org/packagegraph/ontology/core#packageName> ?pkgName ;
         <https://purl.org/packagegraph/ontology/core#targetArchitecture> ?arch ;
         <https://purl.org/packagegraph/ontology/deb#inSuite> ?suite .
    ?arch <https://purl.org/packagegraph/ontology/core#architectureName> "riscv64" .
    FILTER(?suite = "resolute")
    FILTER(?pkgName IN ("${node.name.toLowerCase()}", "python3-${node.name.toLowerCase().replace(/[\s.\/]+/g,'-')}", "lib${node.name.toLowerCase().replace(/[\s.\/]+/g,'-')}"))
  }
A non-empty result = Ubuntu 26.04 ships this package for riscv64; record the package name and suite.
Use this as a strong prior for the release_provider (set to "ubuntu") and as the
color floor: if no upstream CI is found but Ubuntu 26.04 ships riscv64 unpatched, the floor is yellow.
If the graph returns no results, proceed with STEP 1 and live research as normal.

STEP 1 -- Apply the /project-color-coding skill.
Invoke the /project-color-coding skill to get the complete color model, release-provider rule,
research procedure, per-node record fields, and non-negotiable rules. Follow them exactly.

STEP 2 -- Classify this node following the procedure in that file.
The file tells you to: check project-reports/<slug>.md first (if one exists), adversarially spot-check
the most important color-deciding fact, and fall back to live research only when needed.
Integrate the graph query result from STEP 0 as additional evidence alongside the stored report and
live research (graph result is authoritative for Debian riscv64 binary availability).

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

  // Stage 3: dependency-edge discovery (explicit + implicit)
  (verifiedRecord, node) => agent(`Find the dependencies of ONE node in a RISC-V vertical software stack: "${node.name}".
Both EXPLICIT dependencies (formal package/build/runtime dependencies) and IMPLICIT dependencies
(other stack nodes this one needs to be present/running to actually be useful, even without a
formal package dependency -- e.g. an exporter needs the service it scrapes, a client needs its
server, an extension needs its host engine).

Node context:
- Layer: ${node.layer}
- Repo: ${node.repo || '(none)'}
- Homepage: ${node.home || '(none)'}
- Per-project report slug (if a project-reports/<slug>.md exists): ${node.slug || '(none)'}

OTHER NODES IN THIS STACK (use one of these names EXACTLY as "target" when the dependency is one
of them; otherwise give a short, specific name for the external dependency instead):
${JSON.stringify(nodes.filter(n => n.name !== node.name).map(n => n.name))}

${ghHint(node.repo)}

STEP 1 -- Explicit dependencies from the project graph (fast, structured ground truth).
Use mcp__project-graph__project_graph_query with core:hasDependency to enumerate "${node.name}"'s
direct package dependencies. Try the most plausible Ubuntu package name(s) for "${node.name}"
(e.g. "${node.name.toLowerCase()}", "lib${node.name.toLowerCase().replace(/[\s.\/]+/g,'-')}"):
  SELECT ?depName WHERE {
    ?pkg <https://purl.org/packagegraph/ontology/core#packageName> "<ubuntu-package-name-guess>" ;
         <https://purl.org/packagegraph/ontology/core#hasDependency> ?dep .
    ?dep <https://purl.org/packagegraph/ontology/core#dependencyTarget> ?target .
    ?target <https://purl.org/packagegraph/ontology/core#packageName> ?depName
  }
For each dependency the graph returns: if it matches one of OTHER NODES IN THIS STACK, record it
(type "explicit", evidence "project-graph"). Only record it as an EXTERNAL (out-of-stack) explicit
dependency if it is a notable, load-bearing dependency -- skip generic base-system noise (libc6,
base-files, etc.) unless this node's own purpose IS to be that system library.

STEP 2 -- Explicit dependencies from the per-project report.
${node.slug ? `Read project-reports/${node.slug}.md, Section 9 (Dependencies). Extract every dependency it documents as an edge: type "explicit", evidence "project-report", relation matching what the section describes (e.g. "build-dependency", "runtime-dependency", "linked-library"), note = a one-sentence paraphrase of what that subsection says.` : 'No per-project report exists for this node (no `slug` field) -- skip this step.'}

STEP 3 -- Implicit dependencies ("needs this to be useful").
Beyond formal dependencies, does "${node.name}" need any OTHER NODE IN THIS STACK to be present,
running, or available to actually be useful? Use WebSearch/WebFetch/the project homepage/README to
confirm before reporting one. Only report an implicit edge whose target is one of OTHER NODES IN
THIS STACK -- implicit edges are for in-stack context only, never external.

STEP 4 -- Return the structured edges list.
Do not invent a dependency you found no evidence for; if a step finds nothing, contribute no edges
for it. Never report "${node.name}" depending on itself. Every "note" is one sentence, with a
markdown link [text](url) when a source URL exists.`,
    { schema: EDGE_SCHEMA, label: `edges:${node.name}`, phase: 'Edges' })
    .then(result => ({ ...verifiedRecord, edges: (result && result.edges) || [] })),
)

const goodNodes = processed.filter(Boolean)
log(`Classify+Verify+Edges complete: ${goodNodes.length}/${nodes.length} nodes classified`)
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
title: ${spec.vertical || slug}
parent: Whole-Stack Reports
---

# ${spec.vertical || slug}

**Author:** ${spec.author || 'RISC-V Ecosystem WG'}<br/>
**Date:** ${spec.run_date || '(run date)'}<br/>
**Scope:** RISC-V readiness of the ${spec.vertical || slug} software stack<br/>
**Target profile:** ${targetProfile}<br/>
**Audience:** ${spec.audience || 'exec-product'}<br/>
**Verification policy:** Colors are assigned from primary upstream sources, adversarially verified against the per-project reports under project-reports/. Items not verifiable against a second source are marked [NEEDS VERIFICATION].<br/>

{% include dependency-graph.html slug="${slug}" %}

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

// ── Build Artifact 4: the dependency graph (nodes + explicit/implicit edges) ──
// Node id: a stable slug of the node's display name.
function nodeId(name) {
  return String(name).toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'node'
}

// Every node links to its project-reports page, whether or not that page exists yet -- clicking a
// node is meant to always open project-reports/<slug>.html, 404ing when there is no report there
// rather than silently falling back to a repo/home URL. `baseSlug` should be the node's own
// project-reports slug candidate: the scope spec's `slug:` when given, else the node id (stripped
// of the "--external" suffix for a one-hop external leaf node). Root-relative with the site's fixed
// baseurl (_config.yml: baseurl: "/sw-ecosystem"), not relative to the stack report's own path, so
// the link is correct regardless of how deep the linking page is nested.
function reportUrl(baseSlug) {
  return `/sw-ecosystem/project-reports/${baseSlug}.html`
}

function buildGraphJson(spec, records, slug, profile) {
  // Two-level index for CLASSIFICATION data: recByPair[layer][name] disambiguates a node
  // listed under two per-product layers with the SAME name (e.g. "MariaDB Connector/C" appears
  // under both the MySQL and MariaDB Client Drivers layers) -- each has its own independently
  // classified record; recByName[name] is the fallback for older/collapsed data.
  const recByPair = new Map(), recByName = new Map()
  for (const r of records) {
    if (!recByPair.has(r.layer)) recByPair.set(r.layer, new Map())
    recByPair.get(r.layer).set(r.name, r)
    if (!recByName.has(r.name)) recByName.set(r.name, r)
  }
  const lookupRec = (name, fullLabel) =>
    (recByPair.get(fullLabel) && recByPair.get(fullLabel).get(name)) || recByName.get(name) || {}

  // Node ids must be unique per scope INSTANCE, not per name -- the same package can
  // legitimately appear as two separate nodes (one per product column). uniqueId() also
  // guards against two differently-worded external dependency names slugifying to the same id.
  const seenIds = new Set()
  function uniqueId(base) {
    let id = base, n = 2
    while (seenIds.has(id)) { id = `${base}-${n}`; n++ }
    seenIds.add(id)
    return id
  }

  const idByPair = new Map()        // "<fullLabel> <name>" -> node id, precise per scope instance
  const idsByNormName = new Map()   // normalized display name -> [node ids] sharing that name
  function registerName(norm, id) {
    const arr = idsByNormName.get(norm)
    if (arr) { if (!arr.includes(id)) arr.push(id) } else idsByNormName.set(norm, [id])
  }

  const nodes = []
  for (const l of spec.layers || []) {
    const isProductLayer = !!(l.product && l.layer)
    const productColumn = isProductLayer ? l.product : null
    const layerTitle = isProductLayer ? l.layer : (l.layer || '')
    const fullLabel = layerLabel(l)
    for (const n of l.nodes || []) {
      const rec = lookupRec(n.name, fullLabel)
      const norm = String(n.name).toLowerCase().trim()
      const baseId = nodeId(n.slug || n.name)
      const id = uniqueId(productColumn ? `${baseId}--${nodeId(productColumn)}` : baseId)
      idByPair.set(fullLabel + ' ' + n.name, id)
      registerName(norm, id)
      nodes.push({
        id,
        name: n.name,
        layer: layerTitle,
        column: productColumn || n.column || null,
        criticality: n.criticality || rec.criticality || 'critical',
        color: rec.color || 'grey',
        release_provider: rec.release_provider || 'none',
        upstream_release: String(rec.release_provider || '').trim().toLowerCase() === 'upstream',
        gap: rec.justification || '',
        in_scope: true,
        repo: n.repo || null,
        home: n.home || null,
        report: reportUrl(n.slug || baseId),
      })
    }
  }
  // Excluded (proprietary/vendor-only) nodes also get a graph node so their grey status is visible.
  for (const e of spec.exclusions || []) {
    const norm = String(e.name).toLowerCase().trim()
    if (idsByNormName.has(norm)) continue
    const baseId = nodeId(e.name)
    const id = uniqueId(baseId)
    registerName(norm, id)
    nodes.push({
      id, name: e.name, layer: 'Excluded (proprietary / vendor-only)', column: null,
      criticality: 'n/a', color: 'grey', release_provider: 'none', upstream_release: false,
      gap: e.reason || '', in_scope: true, repo: null, home: null, report: reportUrl(baseId),
    })
  }

  // Resolve every discovered edge target against the in-scope node-id map (case-insensitive);
  // anything unmatched becomes (or reuses) an external grey leaf node -- the "one-hop external
  // dependency" case, so implicit context stays visible even for a dependency outside this stack.
  // A source resolves precisely via its own (layer, name); a target is given only by name (the
  // edge-discovery prompt has no layer-qualified name to point at), so it fans out to every node
  // instance sharing that name -- correct for the rare same-name-in-two-products case, a no-op
  // fan-out of one for everything else. External targets dedupe by slug, not raw text, so two
  // differently-worded mentions of the same external package ("Google Benchmark" / "google
  // benchmark") merge into one leaf node instead of two near-duplicates.
  const externalIds = new Map()   // slug -> node id
  const edgeIndex = new Map()     // `${source}|${target}|${type}` -> merged edge (with evidenceSet)
  for (const rec of records) {
    const sourceId = idByPair.get(rec.layer + ' ' + rec.name) ||
      (idsByNormName.get(String(rec.name).toLowerCase().trim()) || [])[0]
    if (!sourceId) continue
    for (const e of rec.edges || []) {
      const targetNorm = String(e.target || '').toLowerCase().trim()
      if (!targetNorm) continue
      let targetIds = idsByNormName.get(targetNorm)
      if (!targetIds) {
        const externalBaseId = nodeId(e.target)
        let targetId = externalIds.get(externalBaseId)
        if (!targetId) {
          targetId = uniqueId(externalBaseId + '--external')
          externalIds.set(externalBaseId, targetId)
          nodes.push({
            id: targetId, name: e.target, in_scope: false, color: 'grey',
            layer: null, column: null, criticality: 'n/a', release_provider: 'none',
            upstream_release: false, gap: '', repo: null, home: null,
            report: reportUrl(externalBaseId),
          })
        }
        targetIds = [targetId]
      }
      for (const targetId of targetIds) {
        if (targetId === sourceId) continue
        const key = `${sourceId}|${targetId}|${e.type}`
        const existing = edgeIndex.get(key)
        if (existing) {
          existing.evidenceSet.add(e.evidence)
          if (e.note && existing.note.indexOf(e.note) === -1) existing.note += '; ' + e.note
        } else {
          edgeIndex.set(key, {
            source: sourceId, target: targetId, type: e.type, relation: e.relation || '',
            evidenceSet: new Set([e.evidence]), note: e.note || '',
          })
        }
      }
    }
  }
  const edges = Array.from(edgeIndex.values()).map(e => ({
    source: e.source, target: e.target, type: e.type, relation: e.relation,
    evidence: e.evidenceSet.size === 1 ? Array.from(e.evidenceSet)[0] : Array.from(e.evidenceSet),
    note: e.note,
  }))

  return { vertical: spec.vertical || slug, slug, target_profile: profile, nodes, edges }
}

const graph = buildGraphJson(spec, allRecords, slug, targetProfile)

return [{
  vertical: spec.vertical || slug,
  slug,
  file: `stack-reports/${slug}/${slug}.md`,
  report,
  nodeCount: allRecords.length,
  records: allRecords,
  graph,                                   // Artifact 4 object: write to <slug>/<slug>.graph.json
  graph_json: JSON.stringify(graph, null, 2),   // ready-to-write JSON string
}]
