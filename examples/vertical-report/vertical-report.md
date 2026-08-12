# RISC-V Vertical Ecosystem Report -- Research Prompt

**What this is.** A reusable prompt for generating a RISC-V readiness report for a *vertical* --
the full software stack behind a product or workload (for example "Agentic AI inference serving",
"OLTP databases", "web serving", "big data", but also open-ended verticals such as IoT, embedded,
or automotive). A vertical report answers one question for decision-makers: *for the stack that
makes up this product, how RISC-V-ready is each layer, and what are the next steps?*

**The vertical is whatever the user defines.** Do not restrict the vertical to any pre-existing
category list. The `categories:` frontmatter that appears in the per-project reports under
`reports/` is only a weak hint for finding related projects; it is never a constraint on what a
vertical can be.

**Output is ad-hoc and not committed.** This prompt and its companion workflow live under
`examples/vertical-report/` and are committed as reusable tooling. The scope spec and the report a
run produces are the operator's own research output. Save them outside version control (the
suggested default is the gitignored `examples/vertical-report/out/` directory). Do not commit
generated reports.

**Relationship to the per-project reports.** The repository already contains ~150 deep per-project
RISC-V status reports under `reports/<slug>.md`, one per entry in `scope.yml`. Those reports are
the primary input to a vertical report. They are refreshed only every 3 to 6 months, so treat them
as a strong prior to be **adversarially spot-checked live**, never as ground truth. When a live
check contradicts a stored report, trust the live check and record the discrepancy (this also tells
the operator which per-project report needs a refresh).

---

## Execution model: two stages

A vertical report is produced in two stages, because the scope must be negotiated with a human but
the research is best run unattended.

**Stage 1 -- Scoping (interactive).** Interview the user, research the stack, and write a locked
*scope spec* (`<vertical-slug>.scope.yml`). This is conversational and happens in the main session.

**Stage 2 -- Research and synthesis (unattended).** Consume the locked scope spec, classify every
node in the stack for RISC-V readiness, adversarially verify the classification, and emit the three
output artifacts. For a large stack, run this via the companion `Workflow` script
(`vertical-report-workflow.js`), which fans out one research agent per node. For a small stack (a
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
settled. Produce `<vertical-slug>.scope.yml`.

### 1.1 Interview the user

Ask about the following. Ask focused questions, one topic at a time; do not dump all of these at
once. If the user has already answered something in their request, do not re-ask it.

- **Vertical definition.** What is the product or workload, in one line? (e.g. "Agentic AI
  inference serving with RAG".)
- **Named projects.** Which projects does the user already know are in the stack? (e.g. LangChain,
  vLLM, PyTorch.) These are the seeds for stack discovery.
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
2. **Reuse the per-project reports.** For each project already covered by a `reports/<slug>.md`,
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
- Derive the entire stack from research plus the `reports/` dependency data alone.
- Make reasonable default assumptions (full feature scope unless the request narrows it; critical
  for anything on the direct path from a named project to the hardware; exec/product audience;
  RVA23U64 baseline unless stated).
- Record every such assumption explicitly in the scope spec's `assumptions:` list, so the reader
  knows exactly what was assumed and can correct it on a re-run.

### 1.4 Scope-spec schema

Write the locked scope to `<vertical-slug>.scope.yml`. Schema:

```yaml
vertical: Agentic AI inference serving      # one-line vertical definition
slug: agentic-ai                            # optional; else derived from vertical name
author: "Name <email>"                      # for the report header; default to the operator
run_date: 2026-08-12                        # for the report header Date; default to today
audience: exec-product                      # exec-product (default) | eng-leadership
target_profile: RVA23U64                    # or an ad-hoc extension list
use: "Deck for leadership on where to invest in RISC-V enablement"
assumptions:                                # populated when scoping ran without user answers
  - "No user input available; stack derived from research + reports/ dependency data."
  - "Assumed full feature scope for each named project."
exclusions:                                 # proprietary / vendor-only -> classified grey (N/A)
  - name: "CUDA / cuDNN / NCCL / TensorRT"
    reason: "Proprietary NVIDIA GPU path; never native RISC-V."
out_of_scope:                               # user does not care about these -> NOT classified
  - name: "torch.compile pipeline (Triton, torch-mlir, IREE, MLIR, LLVM)"
    reason: "Scope is CPU eager inference only; JIT/compile path excluded by the user."
layers:                                     # ordered top -> bottom, mirrors the example outline
  - title: "Orchestration"
    nodes:
      - name: LangChain
        repo: https://github.com/langchain-ai/langchain
        home: https://www.langchain.com/
        slug: langchain                     # reuse reports/<slug>.md; omit if no report exists
        criticality: critical               # critical | optional
        features_in_scope: "chains, agents, tool use, RAG"
        notes: "Pure Python; inherits RISC-V support from CPython."
  - title: "Inference Serving"
    nodes:
      - name: vLLM
        repo: https://github.com/vllm-project/vllm
        home: https://www.vllm.ai/
        slug: vllm
        criticality: critical
        features_in_scope: "CPU inference backend"
        # no slug field for a node with no per-project report -- simply omit it
  # ... more layers and nodes, derived from research + reports/ Section 9
chains:                                     # optional: pipeline chains and alternate paths
  - name: "torch.compile GPU lowering path"
    sequence: ["TorchDynamo", "AOTAutograd", "TorchInductor", "Triton", "MLIR", "LLVM"]
  - name: "CPU inference path (RISC-V)"
    sequence: ["PyTorch ATen", "oneDNN", "OpenBLAS"]
```

Field semantics mirror `scope.yml`: `repo` is the canonical upstream repo URL (omit if none),
`home` is the homepage, and `slug` (only when a per-project report exists) points stage 2 at
`reports/<slug>.md` for reuse -- **omit `slug` entirely for a node with no report** (do not set it
to null or empty). Each node is one classification unit in stage 2; a single project may appear as
several nodes when its features were split during scoping. The optional `chains:` block records the
pipeline chains and alternate paths that the layered `nodes:` list cannot express on its own (a node
list is flat; a chain is an ordered edge sequence). Render `chains:` verbatim in the stack outline's
"pipeline chains" section. `exclusions` are classified grey and shown in the stack; `out_of_scope`
components are never classified and appear only as a short note so the reader knows they were
deliberately dropped.

---

## Stage 2: Research and classification

Goal: assign every node in the locked scope spec a RISC-V readiness color, with a justification, a
source, an as-of date, and a confidence -- then emit the three output artifacts.

### 2.1 The 5-state color model

Every node gets exactly one color. Evaluate the waterfall top to bottom; the first rule that
matches wins. Note the distinction that drives the whole model: **orange means no upstream test
gate** (upstream may ship something broken on riscv64 without knowing), while **blue and green mean
upstream tests riscv64** (upstream knows when it breaks). Green additionally means upstream ships
the release.

0. **Architecture-independent shortcut (evaluate first).** If the node ships no compiled,
   architecture-specific code -- a pure-Python `py3-none-any` wheel, a pure-Python sdist, a
   platform-neutral JVM jar, a `noarch` package -- then it runs on riscv64 by construction and needs
   no riscv64-specific port, CI, or release. Classify it **green** with `release_provider: upstream`
   and confidence high, and note "architecture-independent; inherits riscv64 from its runtime
   (CPython, JVM, etc.)." Do not penalize it for having no riscv64 CI: there is no
   architecture-specific code for such CI to test. (This is why a pure-Python framework like
   LangChain is green even though its CI runs only on x86.) A node that ships *any* compiled
   artifact -- a C/C++/Rust extension, a native wheel, a binary -- does not take this shortcut; fall
   through to the rules below.

1. **grey -- N/A or unknown.** The node is not classifiable. This covers two cases, and you must
   state which one applies:
   - *N/A:* a proprietary or vendor-only path that cannot be native RISC-V (matches an `exclusions`
     entry). A proprietary component's RISC-V readiness is unknowable to us and irrelevant to a
     native-RISC-V investment decision. (Grey is **not** the bucket for out-of-scope nodes -- those
     are excluded during scoping and never reach the waterfall. See Section 1.1.)
   - *Unknown:* research turned up insufficient data to classify. State exactly what was searched.
2. **green.** Upstream builds it, runs its test suite, the tests pass, **and upstream itself
   publishes an official riscv64 release artifact**. This is the only fully-supported state
   (officially supported even if the project runs a tier system and riscv64 is not Tier 1). A
   release published by anyone other than upstream does **not** qualify for green -- see the
   release-provider rule.
3. **blue.** Upstream builds it, runs its test suite, and the tests pass on riscv64, but upstream
   publishes **no release** for riscv64. Upstream at least knows when something breaks, but a
   downstream consumer must pin the right revision. This state **includes** the important case where
   a third party (RISE or another) provides a consumable riscv64 release: the node stays blue and
   carries a provider annotation (see the release-provider rule).
4. **orange -- builds on riscv64 but no upstream test gate.** The node has working riscv64 support
   (it builds, and either a downstream distro/conda build, a third-party build, or upstream's own
   release ships it) but **upstream does not validate riscv64 by running its test suite**. Two
   sub-cases, both orange, and you state which applies:
   - *downstream-only:* built and tested only downstream (a Linux distribution, conda, vendored in a
     consumer we know works), with no upstream riscv64 build at all.
   - *upstream-ships-untested:* upstream builds and even releases a riscv64 artifact (so
     `release_provider` may be `upstream`), but upstream CI only builds it and never runs the test
     suite on riscv64. The artifact exists; its correctness is unverified by upstream.
   In both cases the risk is identical: no upstream test gate, so upstream can break riscv64 silently.
5. **red -- not obtainable on riscv64 without building it yourself.** Either the project does not
   build on riscv64, or no riscv64 port exists, or riscv64 support exists in source but **no
   consumable artifact is produced by anyone** -- not upstream, not a distro, not conda, not a third
   party such as RISE -- and no downstream builds and tests it. Building it yourself from source is
   not a release and is not a downstream test signal, so a source-only node stays red. **Do not
   inflate the color to reflect source maturity:** when substantial riscv64 support is merged
   upstream but there is still no CI, no release, and no downstream build (as is common for a young
   port), keep it red and carry the nuance in the justification ("upstream source-supported; builds
   from source; no CI, no release, no downstream build"). The color measures what a consumer can
   obtain and trust, not how much code has landed. The line between red and orange is exactly this:
   orange requires a *downstream or third party that actually builds/tests/ships* it; red is when the
   only path is your own source build.

**Strict-downgrade modifiers.** Apply these after picking a color from the waterfall (they never
apply to the architecture-independent shortcut in rule 0, which has no arch-specific code to test):

- **Build-only upstream CI.** If upstream CI *builds* riscv64 but does not *run the test suite*
  (for example a cross-compile-only or QEMU-build-only job), the node cannot be blue or green.
  **Cap it at orange** (the *upstream-ships-untested* sub-case). A build that is never tested is not
  a tested build.
- **Partial test failures.** If the test suite runs upstream on riscv64 but some tests fail (for
  example NaN-canonicalization or floating-point-semantics failures), **downgrade one level**
  (green -> blue, blue -> orange). Record the specific failing tests in the justification.

Every classification carries an **as-of date** (when the deciding fact was last verified) and a
**confidence** (high / medium / low), so staleness is visible on the slide.

### 2.2 The release-provider rule

Green is reserved for release artifacts published **directly by upstream**. Track *who publishes the
consumable riscv64 release* in a `release_provider` field on every node. Values:
`upstream` | `RISE` | `<distro name>` | `third-party` | `none`.

- `release_provider: upstream` is a prerequisite for green.
- **Any node whose consumable riscv64 release comes from someone other than upstream carries a
  visible note** -- "release provided by \<provider\>, not upstream" -- in both the stack outline and
  the status table, **regardless of its color**. This is most consequential for blue (upstream tests
  but a third party ships the release), but it applies equally to an orange node whose only artifact
  is a distro build (note "release provided by Debian sid") or a third-party build. The note makes a
  hidden dependency on a non-upstream provider visible on the slide.

**RISE is the primary third-party provider today, and it hosts far more than one kind of artifact.**
The [RISE Python wheel builder](https://gitlab.com/riseproject/python/wheel_builder) is one example
(riscv64 Python wheels), but RISE also hosts other release forms -- container images, prebuilt
binaries, other package types -- and, separately, provides free native riscv64 CI runners, a
board farm of physical RISC-V hardware, and directly funded upstream work. Two consequences:

- **Provider detection must look beyond Python wheels.** Do not conclude `release_provider: none`
  just because there is no RISE wheel; check whether RISE (or another party) hosts the artifact in
  any form relevant to this node.
- **Separate the release flag from the enablement story.** RISE-provided CI, hardware, and funding
  are *not* a release artifact -- they belong in the next-steps narrative (Section 2.5), where they
  matter because they tell the reader which work is already underway and must not be double-counted
  in an investment estimate.

The upstream-vs-third-party distinction is **critical for Python packages today**: many nodes are
usable on riscv64 *only* because RISE ships the wheel. Leadership must see that dependency
explicitly, and not mistake a RISE-hosted wheel for upstream support that could disappear the moment
RISE stops building it.

### 2.3 Per-node research procedure (hybrid)

For each node, do the least work that produces a defensible color:

1. **If `reports/<slug>.md` exists, reuse it.** Read it and extract the color-deciding facts:
   Section 3 (Upstream Support Tier), Section 7 (CI/CD), Section 8 (Distribution and Release
   Status), and the report's `Date:` header. Record that header as `report_date` -- it is the age of
   your prior, not proof of current state.
2. **Adversarially verify the color-deciding facts live.** Do not take the stored report at face
   value; it may be up to 6 months stale. Re-check only the handful of facts the color depends on,
   against primary sources (see 2.4). Record the date of your live checks as `verified_date`. If a
   live check contradicts the stored report, trust the live check and set `delta_vs_report` for that
   node. You do not have to re-verify every fact: state which facts you re-checked live and which you
   carried over from the report. A fact carried from the report is dated `report_date`; a fact you
   re-checked is dated `verified_date`. The node's `as_of` is the **oldest** date among the facts
   that actually decided its color (so freshness is never overstated).
3. **If no report exists, run a light targeted probe.** Answer only the questions the color depends
   on: Does upstream publish a riscv64 release? Does upstream CI build *and test and pass* riscv64?
   Is it built and tested downstream? Does a third party provide a release? Do not attempt a full
   per-project report -- that is a separate, heavier workflow. All facts here are dated
   `verified_date` (there is no prior).

Do **not** run the full 16-agent per-project research workflow for each node. The vertical report is
a classification exercise, not 30 fresh deep reports.

### 2.4 Primary sources and verification (reused from the per-project prompt)

Use these canonical checks. They are the same ones the per-project research prompt uses; they are
authoritative and fast.

- **Upstream CI.** Read the actual CI workflow files (`.github/workflows/*.yml`, `.gitlab-ci.yml`,
  Jenkinsfile, `.cirrus.yml`). Confirm from file content, never from issue text, whether a riscv64
  job exists, what triggers it, whether it runs on native hardware or QEMU, and crucially whether it
  **runs the test suite** or only builds.
- **PR merge status.** A PR described as "merged" in a comment or tracking issue may have been closed
  unmerged. Verify against the API: fetch `https://api.github.com/repos/<owner>/<repo>/pulls/<n>` and
  check `merged_at` (null + `state: closed` means closed without merging).
- **Release artifacts and who publishes them.**
  - PyPI: `https://pypi.org/pypi/<package>/json` -- look for `riscv64` in the `urls[].filename`.
  - RISE Python wheel builder:
    `https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/<package>/`.
  - GitHub releases: list release assets; look for `riscv64` in asset filenames.
  - For non-Python artifacts, check the project's own release channel (OCI registry, tarball
    downloads, etc.) and whether RISE or another third party hosts a riscv64 build.
- **Linux distribution build status** (downstream signal for orange):
  - Ubuntu: `https://packages.ubuntu.com/search?keywords=<pkg>&searchon=names&suite=noble&section=all`
  - Debian: `https://tracker.debian.org/pkg/<source-package>` (per-arch build status)
  - Fedora: `https://packages.fedoraproject.org/pkgs/<source>/<binary>/`
  - Arch Linux RISC-V: `https://archriscv.felixc.at/?q=<package>`
- **RISE involvement** (for the release-provider flag and the next-steps narrative). Check
  [riseproject.dev](https://riseproject.dev) and its [blog](https://riseproject.dev/blog), the
  [riseproject-dev GitHub org](https://github.com/riseproject-dev) (CI forks, board-farm usage),
  and the wheel builder above. The Confluence wiki at `lf-rise.atlassian.net` requires
  authentication -- do not attempt to fetch it.

**Non-negotiable rules** (inherited from the per-project prompt):

- Every factual claim traces to a primary source. A claim you cannot verify against a second source
  is marked `[NEEDS VERIFICATION]`. **Exception for authoritative negatives:** a direct absence
  check against the canonical registry *is* the authoritative source -- e.g. the PyPI JSON API
  listing no riscv64 wheel, or a code search returning no riscv64 files. One such check is
  sufficient for a negative color fact; it does not need a second source and does not get a
  `[NEEDS VERIFICATION]` tag. Reserve `[NEEDS VERIFICATION]` for positive claims that rest on a
  single non-authoritative source (a comment, a blog post, a tracking issue).
- Never fill a gap with a plausible guess. If a node cannot be classified, it is grey (unknown), and
  you state what you searched.
- Latin-1 characters only. No em-dashes; use a hyphen or a comma. Every URL is a markdown link
  `[text](url)`, never a bare URL.

### 2.5 Per-node output record

Each node produces this record, which feeds the three artifacts:

- `name`, `layer`, `criticality`
- `color` (grey / green / blue / orange / red); for grey, which case (N/A vs unknown); for orange,
  which sub-case (downstream-only vs upstream-ships-untested)
- `release_provider` (upstream / RISE / \<distro\> / third-party / none)
- `justification` -- one to three sentences, with the deciding fact and a markdown source link
- `primary_source` -- the single most authoritative URL for the color
- `report_date` -- the `Date:` header of `reports/<slug>.md`, or `none` if no report was used
- `verified_date` -- date of your live checks for this node, or `none` if nothing was re-checked
- `as_of` -- the oldest date among the facts that actually decided the color (never overstate
  freshness: if the color rests on a fact carried from the report, `as_of` is `report_date`)
- `confidence` -- high / medium / low
- `delta_vs_report` -- set when a live check contradicted `reports/<slug>.md`; name the discrepancy
  (use `none` when there was no contradiction, and `n/a` when there was no report)

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
against the per-project reports under reports/. Items not verifiable against a second source are
marked [NEEDS VERIFICATION].<br/>
```

If the scope spec recorded any `assumptions:` (a degraded, non-interactive run), reproduce them in a
short "Scoping assumptions" note directly under the header so the reader can correct them.

### Artifact 1: Layered stack outline

A layered, top-to-bottom outline (top = what the user writes, bottom = hardware). This is the paste
source for a Copilot-for-PowerPoint stack diagram, so it must be clean and structured. Format: one
`##` section per layer, and under each layer **one bullet per node spanning as many lines as it
needs** (do not try to cram every attribute onto a single physical line -- there are too many). Use
this exact per-node shape:

```
## Layer N -- [Layer title]

- **[Node name]** -- [color] ([criticality])
  - [one-line description of what it is]
  - License: [license]. Governance: [owner/foundation].
  - [if release_provider is not upstream:] Release provided by [provider], not upstream.
  - [if orange/red/blue and load-bearing:] Gap: [what is missing on riscv64].
```

After the layers, reproduce the scope spec's `chains:` block as a "Pipeline chains and alternate
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
  X green, Y blue, Z orange, W red, and V grey (N/A)." Repeat for optional nodes as a second line.
- **The story.** Lead with the load-bearing red and orange nodes -- these are what block the
  vertical on RISC-V. Call out explicitly every node whose riscv64 release comes from a third party
  (RISE or other) rather than upstream, because that is a hidden dependency risk.
- **Actionable next steps.** Concrete, prioritized actions: what to do, who upstream is best
  positioned to do it, and -- critically -- where RISE (or another party) already covers the work
  (runners, board farm, funded contributors, hosted releases), so effort already underway is not
  double-counted in any investment estimate. Reuse the RISE checks from Section 2.4 to ground this.

---

## Running stage 2 via the Workflow

For a stack of more than a handful of nodes, stage 2 is best run with the companion script
`vertical-report-workflow.js` in this directory, which fans out one classification agent per node,
runs an adversarial verification pass, and synthesizes the three artifacts. Pass the parsed scope
spec as the workflow `args`. See `README.md` in this directory for the exact invocation, and
`CLAUDE.md` at the repo root for the operational rules (rate limits, one workflow at a time,
resume-on-stall) that apply to any research workflow in this repository.

If the workflow script is not present, or the stack is small (a handful of nodes), just execute the
Stage 2 instructions above inline in the session -- the instructions are self-contained and do not
require the workflow. The workflow is a scaling convenience, not a dependency.
