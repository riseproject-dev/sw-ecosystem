export const meta = {
  name: 'vertical-report',
  description: 'RISC-V vertical ecosystem report: classify each stack node red/orange/blue/green/grey, verify, synthesize 3 artifacts',
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

// The 5-state color model, quoted verbatim so each agent classifies to the same rubric.
const COLOR_RULES = `RISC-V READINESS COLOR MODEL (evaluate the waterfall top to bottom; first match wins).
Core distinction: ORANGE means no upstream test gate (upstream may ship something broken on riscv64
without knowing); BLUE and GREEN mean upstream tests riscv64; GREEN additionally means upstream ships the release.

0. ARCHITECTURE-INDEPENDENT SHORTCUT (evaluate first). If the node ships no compiled, architecture-specific
   code (pure-Python py3-none-any wheel or sdist, platform-neutral JVM jar, noarch package), it runs on
   riscv64 by construction. Classify GREEN, release_provider=upstream, confidence high, and note
   "architecture-independent; inherits riscv64 from its runtime". Do NOT penalize it for lacking riscv64 CI.
   A node shipping ANY compiled artifact (C/C++/Rust extension, native wheel, binary) does NOT take this shortcut.

1. GREY -- N/A or unknown. Not classifiable. State which case:
   - N/A: proprietary/vendor-only path that cannot be native RISC-V (matches an exclusions entry).
   - unknown: research turned up insufficient data; state exactly what was searched.
   (Grey is NOT for out-of-scope nodes -- those are dropped during scoping and never classified.)

2. GREEN. Upstream builds it, runs its test suite, tests pass, AND upstream itself publishes an official
   riscv64 release artifact. Only fully-supported state. A release published by anyone other than upstream
   does NOT qualify for green.

3. BLUE. Upstream builds + runs tests + tests pass on riscv64, but upstream publishes NO release. Includes
   the case where a third party (RISE or other) provides the consumable riscv64 release: node stays blue and
   carries a "release provided by <provider>, not upstream" annotation.

4. ORANGE -- builds on riscv64 but no upstream test gate. Node has working riscv64 support (it builds, and a
   downstream/third-party build or upstream's own release ships it) but upstream does NOT validate riscv64 by
   running its test suite. Two sub-cases (state which):
   - downstream-only: built and tested only downstream (distro, conda, vendored), no upstream riscv64 build.
   - upstream-ships-untested: upstream builds and maybe releases a riscv64 artifact (release_provider may be
     upstream), but upstream CI only builds it, never runs the test suite on riscv64.

5. RED -- not obtainable on riscv64 without building it yourself. Either it does not build on riscv64, or no riscv64
   port exists, or riscv64 support exists in source but NO consumable artifact is produced by anyone (not upstream, not
   a distro, not conda, not a third party such as RISE) AND no downstream builds/tests it. Building it yourself from
   source is not a release and not a downstream test signal, so a source-only node stays RED. Do NOT inflate the color
   to reflect source maturity: when substantial riscv64 support is merged upstream but there is still no CI, no release,
   and no downstream build, keep it RED and carry the nuance in justification ("upstream source-supported; builds from
   source; no CI, no release, no downstream build"). The red/orange line: orange requires a downstream or third party
   that actually builds/tests/ships it; red is when the only path is your own source build.

STRICT-DOWNGRADE MODIFIERS (apply after picking a color; never apply to the rule-0 shortcut):
- Build-only upstream CI: if upstream CI builds riscv64 but does not run the test suite (cross-compile-only or
  QEMU-build-only), the node cannot be blue/green. CAP AT ORANGE (upstream-ships-untested sub-case).
- Partial test failures: if the suite runs upstream on riscv64 but some tests fail (e.g. NaN-canonicalization),
  DOWNGRADE ONE LEVEL (green->blue, blue->orange). Record the specific failing tests in justification.

RELEASE-PROVIDER RULE: release_provider is one of upstream|RISE|<distro>|third-party|none. release_provider=upstream
is a prerequisite for green. ANY node whose consumable riscv64 release comes from someone other than upstream
carries a "release provided by <provider>, not upstream" note, regardless of color. RISE hosts more than Python
wheels (also container images, prebuilt binaries) so do not conclude release_provider=none just because there is
no RISE wheel. RISE-provided CI/hardware/funding is NOT a release artifact -- it belongs in the next-steps narrative.`

const VERIFY_URLS = `PRIMARY SOURCES (verify from these, never from issue text):
- Upstream CI: read actual workflow files (.github/workflows/*.yml, .gitlab-ci.yml, Jenkinsfile, .cirrus.yml).
  Confirm whether a riscv64 job exists, native vs QEMU, and crucially whether it RUNS THE TEST SUITE or only builds.
- PR merge status: GET https://api.github.com/repos/<owner>/<repo>/pulls/<n> and check merged_at
  (null + state=closed means closed WITHOUT merging).
- Release artifacts + who publishes them:
  - PyPI: https://pypi.org/pypi/<package>/json -- look for "riscv64" in urls[].filename.
  - RISE Python wheel builder: https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/<package>/
  - GitHub releases: list assets, look for "riscv64" in filenames.
  - Non-Python: check the project's own release channel (OCI registry, tarballs) and whether RISE/another party hosts a riscv64 build.
- Linux distro build status (downstream signal for orange):
  - Ubuntu: https://packages.ubuntu.com/search?keywords=<pkg>&searchon=names&suite=noble&section=all
  - Debian: https://tracker.debian.org/pkg/<source-package>  (per-arch build status)
  - Fedora: https://packages.fedoraproject.org/pkgs/<source>/<binary>/
  - Arch Linux RISC-V: https://archriscv.felixc.at/?q=<package>
- RISE involvement: https://riseproject.dev , https://riseproject.dev/blog , github.com/riseproject-dev .
  Do NOT fetch the Confluence wiki at lf-rise.atlassian.net (auth-gated).
AUTHORITATIVE NEGATIVE: a direct absence check against the canonical registry (PyPI JSON with no riscv64 wheel,
code search returning no riscv64 files) IS the authoritative source -- one such check suffices for a negative and
needs no [NEEDS VERIFICATION] tag. Reserve [NEEDS VERIFICATION] for positive claims resting on a single non-authoritative source.`

// Structured per-node record schema -- forces uniform output from every classify/verify agent.
const NODE_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    name: { type: 'string' },
    layer: { type: 'string' },
    criticality: { type: 'string', enum: ['critical', 'optional', 'n/a'] },
    color: { type: 'string', enum: ['grey', 'green', 'blue', 'orange', 'red'] },
    color_case: { type: 'string', description: 'for grey: N/A|unknown; for orange: downstream-only|upstream-ships-untested; else empty' },
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
- Target RISC-V profile: ${targetProfile}

${ghHint(node.repo)}

HYBRID PROCEDURE:
1. If a per-project report exists at reports/${node.slug || '<none>'}.md, Read it (use the Read tool) and extract the
   color-deciding facts: Section 3 (Upstream Support Tier), Section 7 (CI/CD), Section 8 (Distribution and Release).
   Record its "Date:" header as report_date. This is your prior, possibly up to 6 months stale. If you cannot access
   the file, proceed with live research only and set report_date=none.
2. Adversarially verify the color-deciding facts live against primary sources below. Record verified_date. If a live
   check contradicts the stored report, trust the live check and set delta_vs_report to name the discrepancy.
3. If no report exists, run a light targeted probe answering only: does upstream publish a riscv64 release? does
   upstream CI build AND test AND pass riscv64? is it built/tested downstream? does a third party provide a release?

${COLOR_RULES}

${VERIFY_URLS}

Set as_of to the OLDEST date among the facts that actually decided the color (do not overstate freshness: a fact
carried from the report is dated report_date; a fact you re-checked is dated verified_date). Every URL in justification
must be a markdown link [text](url), never bare. No em-dashes. Return the structured record.`,
    { schema: NODE_SCHEMA, label: `classify:${node.name}`, phase: 'Classify' }),

  // Stage 2: adversarial verify
  (classified, node) => agent(`ADVERSARIAL VERIFICATION of one node's RISC-V readiness color. Be a skeptic: try to REFUTE the assigned color.

Node: "${node.name}" (repo ${node.repo || 'none'}, slug ${node.slug || 'none'}).
Proposed classification:
${JSON.stringify(classified, null, 2)}

${ghHint(node.repo)}

Your job:
- Re-check the single color-deciding fact against the primary source (below). If the proposed color claims upstream
  TESTS riscv64 (blue/green), open the actual CI workflow file and confirm a test step exists and runs on riscv64 --
  do not accept a build-only job. If green, confirm the release artifact is published BY UPSTREAM (not RISE/distro).
- Apply the strict-downgrade modifiers rigorously. Build-only CI caps at orange. Partial test failures downgrade one level.
- If you cannot substantiate the proposed color, correct it (usually downward) and explain why in justification.

${COLOR_RULES}

${VERIFY_URLS}

Return the FINAL corrected structured record (same schema). Keep name and layer unchanged. Update color, color_case,
release_provider, justification, primary_source, as_of, confidence, and delta_vs_report to reflect your verdict.`,
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
  - [if load-bearing and not green] Gap: <what is missing on riscv64>.
Then a "Pipeline chains and alternate paths" subsection rendering each chain as "A -> B -> C".

## Artifact 2: Status table

(a) Full table, one row per node:
| Node | Layer | Criticality | Color | Release provider | Justification | Primary source | As-of | Delta-vs-report |
(b) Slide-ready summary table:
| Node | Color | Criticality | Release provider |

## Artifact 3: Narrative and next steps

- Scorecard: "Of N critical-path nodes: X green, Y blue, Z orange, W red, V grey (N/A)." Second line for optional nodes.
- The story: lead with load-bearing red/orange nodes (what blocks the vertical on RISC-V). Call out every node whose
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
