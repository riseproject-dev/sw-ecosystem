---
name: project-color-coding
description: Grade RISC-V readiness for a list of projects using the green/blue/yellow/orange/red/grey color model. Use when asked to classify, grade, or color-code projects for RISC-V support.
---

# RISC-V Project Color Grading

**What this is.** A skill for assigning a RISC-V readiness color to each project
in a given list. The output is a classification table -- one row per project -- suitable for
slides or dashboards. Each color reflects two things: the upstream CI posture for RISC-V, and
for projects whose purpose is performance optimization, whether RISC-V-specific optimizations
actually exist and cover the primary hot paths.

**The list is whatever you supply.** Pass any set of projects as arguments to this skill, or
provide them in your next message: GitHub repos, named libraries, or entries from `scope.yml`.
The skill is generic -- it does not require per-project reports under `project-reports/reports/` but will
reuse them as a prior when they exist.

**This differs from the vertical-report.** The vertical-report classifies a full layered stack
for a specific product workload. This skill classifies an arbitrary flat list of projects,
with the added optimization-purpose modifier that vertical-report does not apply.

---

## Execution model

For a small list (fewer than ~10 projects), execute inline in the session: research each
project in turn (starting from `project-reports/reports/<slug>.md` if it exists), then write the output table
and justifications.

For a large list, use a companion workflow script that fans out one classification agent per
project in parallel. Pass the project list as the workflow `args`.

The repository at `project-reports/reports/` contains deep per-project status reports for ~250 projects.
Most projects you will classify already have a report there. Always check `project-reports/reports/` first
before doing any internet research -- the reports encode Section 3 (CI tier), Section 7
(CI/CD), Section 8 (distribution), and Section 4 (architecture-specific code) in detail.
Internet research is the fallback for projects not yet in `project-reports/reports/`, or for spot-checking
a single color-deciding fact that may have changed since the report was written.

---

## The color model

Each project gets exactly one color from: **green / blue / yellow / orange / red / grey**.

The color encodes two axes simultaneously: (1) the upstream CI and release posture, and (2)
for optimization-purpose projects, whether RISC-V-specific optimizations cover the operations
that justify using the project over a simpler alternative. The CI posture sets the primary
color; the optimization modifier can only cap downward, never raise it.

Evaluate the steps below top to bottom. The first step that produces a definitive result wins.

### Step 0 -- Architecture-independent shortcut

If the project ships no compiled, architecture-specific code -- a pure-Python `py3-none-any`
wheel, a `noarch` package, a platform-neutral JVM jar -- it runs on riscv64 by construction.
Classify it **green**, note "architecture-independent; inherits riscv64 from its runtime", and
stop. Do not penalize it for lacking riscv64 CI.

A project that ships *any* compiled artifact (C/C++/Rust extension, native wheel, binary, JNI
library) does not take this shortcut; fall through to Step 1.

### Step 1 -- Primary grade from upstream CI

Read the actual CI workflow files for the project (see Research procedure). Assign a primary
color from this table:

| Color  | Upstream CI: builds riscv64 | Upstream CI: test suite passes on riscv64 | Upstream publishes riscv64 artifact |
|--------|----------------------------|-------------------------------------------|-------------------------------------|
| green  | yes                        | yes                                       | yes                                 |
| blue   | yes                        | yes                                       | no                                  |
| yellow | yes (build step, no tests) | no                                        | no / either                         |
| orange | no upstream CI             | no                                        | no                                  |
| red    | N/A -- project is broken or known non-functional on riscv64 |
| grey   | N/A -- unknown / proprietary / vendor-locked |

**CI evidence rule.** A job that builds riscv64 but does not run the test suite
(cross-compile-only, QEMU-build-only without test execution) counts as build-only. Build-only
CI sets the primary color to **yellow**, not blue or green.

**Release-provider rule.** Green is reserved for artifacts published **directly by upstream**.
Track who publishes the consumable riscv64 release in a `release_provider` field. Values:
`upstream` | `RISE` | `<distro name>` | `third-party` | `none`.

- `release_provider: upstream` is a prerequisite for green.
- Any node whose consumable riscv64 release comes from someone other than upstream carries a
  visible note -- "release provided by \<provider\>, not upstream" -- regardless of its color.
  This is most consequential for blue (upstream tests but a third party ships the release).
- RISE hosts more than Python wheels (also container images, prebuilt binaries). Do not conclude
  `release_provider: none` just because there is no RISE wheel; check all release channels.
- RISE-provided CI runners, board farm, and funded upstream work are **not** release artifacts --
  they belong in the next-steps narrative. Keep the two separate.

**Distribution floor.** If upstream CI is absent (no riscv64 CI at all), but a Linux
distribution (Ubuntu, Debian, Fedora, Arch RISC-V) or a third party (RISE, conda-forge)
builds and ships a riscv64 package, the project is not entirely unsupported. Apply the floor:

- If the distribution builds from **unmodified upstream source** (no riscv64-specific patches
  in the packaging diff): upgrade from "no CI" to **yellow** (sub-type: `clean-distro-build`).
  A clean distro build confirms the project builds on riscv64 even without upstream CI.
- If the distribution ships the package but **with riscv64-specific patches** to fix build or
  runtime issues, or if patch status is unknown: upgrade to **orange** (sub-type:
  `downstream-only`). The project is available but build quality on vanilla upstream is unclear.

Distribution availability cannot upgrade above yellow for unpatched builds, and above orange
for patched or uncertain builds. Blue and green require upstream CI with test execution.

**Red.** Use red only when riscv64 support is confirmed broken or explicitly non-functional:
a known ABI incompatibility, a build-blocking dependency with no riscv64 port, a runtime
crash that is documented as a known issue and unresolved, or explicit upstream statements that
the architecture is unsupported. Red is not a default for missing CI -- use orange or yellow
when the project is simply untested but buildable.

**Grey.** Use grey only when the project is proprietary/vendor-locked (cannot run on RISC-V
natively by design) or when research turns up insufficient data to classify it. State which
case applies and what was searched.

### Step 2 -- Optimization-purpose modifier

This modifier applies only to projects whose **primary stated purpose is to make a specific
algorithm faster than a reference implementation**. The test: if the project ran on RISC-V
using only generic C code with no architecture-specific optimizations, would it still deliver
the value that justifies using it over a simpler alternative?

Projects where the answer is "no" are optimization-purpose and trigger this step:
- Memory allocators that claim to outperform the system allocator (tcmalloc, jemalloc, mimalloc)
- SIMD/vectorization libraries (highway, SLEEF, xsimd)
- Neural network inference kernel libraries (XNNPACK, NNPACK)
- Compression libraries where speed -- not compression ratio -- is the primary value proposition
- Cryptography libraries where the stated differentiator is hardware-accelerated performance

Projects where the answer is "yes" do **not** trigger this step: test frameworks, sandboxes,
security-first crypto libraries, general-purpose language runtimes, observability tools, etc.

For borderline projects (speed is important but not the only value), use judgment and state the
reasoning clearly in the justification.

**If this step is triggered**, research what RISC-V-specific optimizations the project has:
look for architecture-specific source files (`*riscv*`, `*rvv*`, `*rv64*`, files under
`arch/riscv/` or equivalent), RVV intrinsics usage, RISC-V assembly, or documented RISC-V
code paths in the build system. Compare with what the project provides for arm64 and amd64
(the reference: are the hot paths hand-tuned on those architectures?).

Assign one of four optimization levels, then apply the cap:

| RISC-V optimization level | Description | Cap on primary color |
|--------------------------|-------------|---------------------|
| **Full** | All primary hot paths have RISC-V-specific implementations (RVV intrinsics, RISC-V assembly, Zb* extensions). Coverage is comparable to arm64 and amd64 for the operations that define this project's value. | No change |
| **Partial** ("some of the way") | RISC-V-specific code covers the main differentiating operations and the project delivers genuine RISC-V-specific value. Some secondary hot paths fall back to scalar C, but the key algorithms are implemented. | Cap at **blue** |
| **Minimal** ("so-so") | Some RISC-V-specific code exists, but the most important hot paths that define this project's value proposition still fall back to scalar C. The RISC-V-specific code is there but does not cover the critical paths. | Cap at **yellow** |
| **Absent** | No RISC-V-specific code at all. All paths use generic scalar C; there are no architecture-specific files, no RVV intrinsics, no RISC-V assembly anywhere in the project. | Cap at **orange** |

"Partial" vs "minimal" is a judgment call. The guiding question: does the RISC-V-specific code
cover the operations that actually justify the project's existence? For example, if a SIMD
library has an RVV backend implementing all its primary vector operations (even if only a single
SIMD tier vs multiple tiers on amd64), that is "partial". If it has only a handful of
optimized functions out of dozens that matter, that is "minimal". State the specific operations
affected and the ISA extensions that would close the gap.

The optimization modifier can only cap downward, never upgrade. Note that absent optimization
caps at **orange** (not red): red is reserved for genuinely broken projects, not for
optimization-purpose projects whose RISC-V code path is simply the scalar fallback.

---

## Research procedure

For each project, do the least work that produces a defensible color. Always start with the
stored report (step 1 below) before going to the internet -- the reports encode deep research
and save significant time. Only fall back to live internet research (steps 2-5) when no report
exists or when a specific color-deciding fact needs freshness verification.

### 1. Reuse the existing per-project report (PRIMARY source -- always check first)

The repository contains deep per-project RISC-V status reports under `project-reports/reports/<slug>.md`,
where the slug is the project name lowercased with spaces, dots, and slashes replaced by
hyphens (e.g. `google/highway` -> `project-reports/reports/highway.md`, `google/tcmalloc` ->
`project-reports/reports/tcmalloc.md`). These reports are the result of extensive prior research and are
the authoritative starting point.

**For every project in the list, check whether `project-reports/reports/<slug>.md` exists before doing any
internet research.** If it exists:

1. Read the report's `**Date:**` header to establish the report age (`report_date`).
2. Read **Section 3 (Upstream Support Tier)** -- contains the CI/release comparison table.
3. Read **Section 7 (CI/CD Infrastructure)** -- contains the definitive CI workflow analysis,
   including which files were read, what riscv64 jobs exist, and whether they build-only or
   run tests.
4. Read **Section 8 (Distribution and Release Status)** -- contains per-distro riscv64
   package availability with versions, and whether upstream patches were required.
5. For optimization-purpose projects (Step 2 of the color model), also read **Section 4
   (Technical Architecture and RISC-V-Specific Subsystems)** -- contains the RISC-V
   architecture-specific code inventory and comparison table against arm64/amd64.

Extract the color-deciding facts from these sections and assign a preliminary color.
Record `report_date` as the age of this prior.

**Adversarial spot-check.** The reports are refreshed approximately every 6 months, so they
may be stale on fast-moving facts. After assigning a preliminary color, re-check only the
single most important color-deciding fact against a primary source (the CI workflow file, a
registry API, or a distro tracker). This one check is sufficient: if it matches the report,
record `verified_date` and proceed. If it contradicts the report, trust the live check, update
the color, and set `delta_vs_report` describing the discrepancy.

If no report exists, proceed directly to steps 2-5 below (live internet research only).

### 2. CI workflow files (fallback: no report exists, or spot-checking)

Fetch and read the CI configuration directly:
- GitHub Actions: list `.github/workflows/*.yml` and read the riscv64-relevant jobs
- GitLab CI: `.gitlab-ci.yml`
- Other: Jenkinsfile, `.cirrus.yml`, `Makefile` CI targets

For each riscv64 job, determine:
- Does it only build (cross-compile, or docker-build with no test step)?
- Does it run the test suite and report pass/fail?
- Is the riscv64 job required to pass before a PR merges (release-blocking)?
- Is it running on native hardware, QEMU, or a cloud VM?
- Does it use RISE RISC-V runners (check for references to `riseproject-dev` or RISE runner labels)?

Do not infer CI status from issue comments, PR descriptions, or project README claims. Read the
files.

### 3. Release artifacts (fallback: no report exists, or spot-checking)

Check whether upstream publishes riscv64 binaries:
- GitHub/GitLab releases: look for `riscv64` in asset filenames
- PyPI: `https://pypi.org/pypi/<package>/json` -- look for `riscv64` in `urls[].filename`
- RISE Python wheel builder: `https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/<package>/`
- npm, Maven Central, OCI registry, or other channels relevant to the project
- GitHub Container Registry or DockerHub: look for a `riscv64` or `linux/riscv64` platform tag

### 4. Linux distribution availability (fallback: no report exists, or spot-checking)

Check riscv64 package availability using these authoritative URLs:
- Ubuntu 24.04: `https://packages.ubuntu.com/search?keywords=<pkg>&searchon=names&suite=noble&section=all`
- Debian: `https://tracker.debian.org/pkg/<source-package>` (shows per-arch build status)
- Fedora: `https://packages.fedoraproject.org/pkgs/<source>/<binary>/`
- Arch Linux RISC-V: `https://archriscv.felixc.at/?q=<package>`

When a distro package exists, check whether riscv64-specific patches are present in the
packaging repository (the `.debian/` directory on Debian/Ubuntu, the spec file on Fedora).
Patches that fix riscv64 build failures indicate the project does not build from vanilla
upstream source on riscv64 -- apply the patched distribution floor (orange, not yellow).

If upstream CI is absent but any of these show a riscv64 package, apply the distribution floor
(see Step 1).

### 5. RISC-V-specific optimizations (fallback: no report exists, or optimization-purpose project with no Section 4)

If the project is optimization-purpose (Step 2 of the color model) and no Section 4 exists in
the stored report, check for:
- Architecture-specific source files: search the repository for `riscv`, `rvv`, `rv64`, or
  files under an `arch/`, `cpu/`, `targets/`, or `ops/` directory with RISC-V naming
- Usage of RVV intrinsics (`<riscv_vector.h>`, `__riscv_vadd`, etc.) or RISC-V assembly
- Build system flags that enable RISC-V-specific code paths (CMake options, Bazel constraints,
  `#ifdef __riscv`)
- Project documentation: does the architecture matrix (README, docs, CI matrix) mention RISC-V
  as a supported target with optimized paths?

Compare explicitly with what exists for arm64 and amd64. State which ISA extensions are used
on RISC-V (RVV, Zba, Zbb, Zvkned, etc.) and which are missing. Assign one of the four
optimization levels (full / partial / minimal / absent) from Step 2.

---

## Output format

Produce the following sections in order. The summary table and per-project justifications are the
human-readable output. The per-node record fields below are the structured data that downstream
consumers (such as the vertical-report workflow) read to build the layered stack outline, status
tables, and narrative.

### 1. Per-node record fields

Each classified project produces a record with these fields. Fill all of them; they feed every
downstream artifact.

- `name` -- the project name as given in the input list
- `color` -- grey / green / blue / yellow / orange / red
- `color_case` -- sub-type clarifier:
  - for grey: `N/A` (proprietary) or `unknown` (insufficient data)
  - for yellow: `build-only-ci` (upstream CI builds but does not test) or `clean-distro-build`
    (no upstream CI; distro builds from unpatched source)
  - for orange: `downstream-only` (no upstream CI; distro ships, possibly with patches) or
    `optimization-absent` (upstream CI passes but optimization-purpose project has no
    RISC-V-specific code)
  - empty for green, blue, and red
- `release_provider` -- `upstream` | `RISE` | `<distro name>` | `third-party` | `none`
- `optimization_gap` -- for non-optimization-purpose projects: `N/A`; for optimization-purpose
  projects: `full`, `partial -- <what is missing>`, `minimal -- <what primary paths lack coverage>`,
  or `absent -- scalar fallback only`
- `justification` -- one to three sentences with the deciding fact and a markdown source link
- `primary_source` -- the single most authoritative URL for the color
- `report_date` -- the `Date:` header of `project-reports/reports/<slug>.md`, or `none` if no report was used
- `verified_date` -- date of the adversarial spot-check, or `none` if nothing was re-checked live
- `as_of` -- the **oldest** date among the facts that actually decided the color (never overstate
  freshness: a fact carried from the stored report is dated `report_date`; a fact verified live is
  dated `verified_date`)
- `confidence` -- `high` / `medium` / `low`
- `delta_vs_report` -- the discrepancy if a live check contradicted `project-reports/reports/<slug>.md`; `none` if
  the spot-check confirmed the report; `n/a` if no report was used

### 2. Summary table

One row per project. Use this exact set of columns:

| Project | Color | CI: build | CI: test | CI: release | Optimization gap | Distro availability | Report date | Delta vs report | Notes |
|---------|-------|-----------|----------|-------------|-----------------|---------------------|-------------|-----------------|-------|

Column definitions:
- **Color**: green / blue / yellow / orange / red / grey
- **CI: build / test / release**: yes / no / N/A
- **Optimization gap**: "N/A" for non-optimization-purpose projects; for optimization-purpose
  projects: "full" / "partial -- [what is missing]" / "minimal -- [what is missing]" /
  "absent -- scalar fallback" / "unknown"
- **Distro availability**: comma-separated list of distros with confirmed riscv64 packages
  (e.g., "Ubuntu 24.04, Debian sid") or "none"
- **Report date**: the `Date:` header from `project-reports/reports/<slug>.md`, or "none" if no report was used
- **Delta vs report**: "none" if the spot-check confirmed the report; a short description of
  the discrepancy if a live check contradicted it; "n/a" if no report was used
- **Notes**: one short phrase capturing the color-deciding fact or most important caveat
  (e.g., "build-only CI, no test execution"; "RVV backend covers primary ops, partial gap";
  "downstream-only: Ubuntu packages it"; "ring 0.16 blocks riscv64 TLS build")

### 3. Per-project justification

For each project that is not green, write one paragraph:
- What the primary color-deciding fact is and where it was found (link to the CI file, the
  distro tracker, or the release page that settled the question)
- For optimization-purpose projects: what specific operations lack RISC-V-specific code, which
  optimization level was assigned (partial / minimal / absent), and what ISA extensions (RVV,
  Zba/Zbb, Zvkned, etc.) would close the gap
- Any pending work (open PRs, open issues, RISE involvement) that could change the grade

For green projects, a one-line note is sufficient.

### 4. Source list

List every source used, one per line. Distinguish stored reports from live checks:

```
- [ProjectName] -- project-reports/reports/<slug>.md (report date: YYYY-MM-DD)
- [ProjectName] -- [description of live check](URL) (verified: YYYY-MM-DD)
```

---

## Non-negotiable rules

- Every color decision traces to a primary source. A claim not verifiable against a second
  source is marked `[NEEDS VERIFICATION]`.
- Never infer CI status from issue text, PR descriptions, or README claims. Read the workflow
  files.
- Never guess. If data is unavailable, assign grey (unknown) and state what was searched.
- Red is for confirmed breakage only. If a project has no CI and no distro package, default
  to orange or grey -- not red -- unless there is positive evidence it does not work.
- For PR merge status verification: fetch `https://api.github.com/repos/<owner>/<repo>/pulls/<n>`
  and check `merged_at`. A null `merged_at` with `state: closed` means closed without merging.
- Latin-1 characters only. No em-dashes; use a hyphen or comma. Every URL is a markdown link
  `[text](url)`, never a bare URL.
- The optimization modifier can only cap downward, never upgrade. Do not interpret a partial
  or minimal optimization as a reason to raise the CI-based primary grade.
- Record the distribution patch status explicitly. Do not apply the yellow distribution floor
  without checking whether riscv64-specific patches exist in the distro's packaging repository.
