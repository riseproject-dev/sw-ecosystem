# RISC-V Ecosystem Status Report -- Research Prompt Template

**Usage:** Pick a project from `scope.yml` (the project registry) and pass its fields to the `Workflow` tool (see execution model below).

Each `scope.yml` entry has three fields:

- `name`: the project display name, e.g. "Node.js", "PyTorch", "OpenJDK"
- `repo`: the canonical upstream repository URL (absent for projects with no public repo, e.g. Geekbench)
- `home`: the project homepage URL

The output report path is derived from the name: `project-reports/<slug>.md`, where `slug` is the lowercased name with spaces, dots, and slashes replaced by hyphens (e.g. "Apache Flink" -> `project-reports/apache-flink.md`, "Open vSwitch" -> `project-reports/open-vswitch.md`).

**See `CLAUDE.md` in the repo root for the complete operator guide**, including:
- How `scope.yml` maps to workflow args and how to find projects without a report yet
- Rate limiting recovery procedures (resume with `resumeFromRunId`)
- How to monitor workflow progress via the journal file
- How to write, verify, and commit each report
- All known issues and workarounds from the 2026-06 generation session

---

## Execution model

Do not use `/deep-research` for this prompt -- it loads instructions but does not self-execute. Instead, invoke the `Workflow` tool directly with the pre-built script at `prompts/project-report/project-report-workflow.js`. Pass one `scope.yml` entry as the single element of `args` (the `repo` and `home` fields map straight through; the script derives the output path from `name`):

```js
Workflow({
  args: [{
    "name": "<project-name>",                        // scope.yml: name
    "repo": "https://<project-repository>/",         // scope.yml: repo
    "home": "https://<project-homepage>/"            // scope.yml: home
  }],
  scriptPath: "/abs/path/to/prompts/project-report/project-report-workflow.js"
})
```

The script derives the output path as `project-reports/<slug>.md`. To override it, add an absolute `"slug"` field to the args object. The script runs four phases sequentially (8 search agents, 4 fetch agents, 3 verify agents, 1 synthesize agent = 16 total). On completion the workflow returns a JSON object with `{name, file, report, totalChars}`. Write `report` to `file` and verify before committing.

For a non-GitHub project (sourceware.org, kernel.org, googlesource.com), the `repo` URL is not a github.com URL and the script automatically switches to WebSearch + WebFetch instead of GitHub MCP tools. For a project with no `repo` at all, the script falls back to the `home` URL for web searches.

**Phase 1 -- Search (sequential, 8 agents):** Issues/PRs, CI config files, package availability, RISE involvement, arch-specific source code, governance, dependencies, performance benchmarks and bugs.

**Phase 2 -- Fetch (sequential, 4 agents):** Deep-read of the 5 most important issues/PRs, PR merge status verification via API, build documentation, RISE details and benchmark data.

**Phase 3 -- Verify (sequential, 3 adversarial agents):** Confirm CI status from actual YAML, confirm package availability from registry APIs, assess arch code completeness.

**Phase 4 -- Synthesize (1 agent):** Writes the complete report text from all gathered findings. Returns the report as plain text; the calling session writes it to disk.

---

## Research instructions

You are a highly technical, principal software engineer writing a fact-based technical assessment for engineering leadership at a chip company evaluating RISC-V investment. The audience is experienced engineers and their managers. Write with precision. No hedging, no marketing language, no filler.

Research the project named in the `scope.yml` entry (using its `repo`) and generate the report at the derived `project-reports/<slug>.md` path.

Search exhaustively: GitHub/GitLab issues, PRs, commits, mailing lists, bug trackers, CI configuration files, build scripts, release notes, changelogs, blog posts, conference slides, foundation governance documents, and any other primary sources. Use sub-agents to parallelize the search. Go deep.

**RISE Project resources -- check these for every report.** The [RISE Project](https://riseproject.dev) (RISC-V Software Ecosystem) is a Linux Foundation project and the primary industry consortium coordinating RISC-V software enablement across the open-source ecosystem. Its members include Qualcomm, SiFive, Red Hat, Canonical, Google, and others. RISE directly funds and coordinates upstream work. For every report, check the following:

- **RISE project portfolio and active work:** Search [riseproject.dev](https://riseproject.dev) (especially the blog at `riseproject.dev/blog`) and the [riseproject-dev GitHub organization](https://github.com/riseproject-dev) for forks, CI repos, and issue trackers related to this specific project. The Confluence wiki at `lf-rise.atlassian.net` requires authentication and is not publicly fetchable -- do not attempt to fetch it. Document what RISE has already done or committed to, so the investment analysis in Section 13 does not double-count work that is already underway.
- **RISE RISC-V Runners:** RISE operates a pool of GitHub Actions-compatible riscv64 CI runners available to open-source projects at no cost. Check whether this project already uses RISE runners (look in `riseproject-dev` for a fork with CI), has an open request to adopt them (look in the project's CI issue tracker), or has CI gaps where RISE runners would directly unblock work. If RISE runners are available for this project, note it explicitly in Section 7 and Section 13.3 rather than sizing custom hardware provisioning.
- **RISE Board Farm:** RISE maintains a collection of physical RISC-V development boards for community testing and benchmarking. Check whether contributors to this project have used board farm access (look for board farm mentions in issues, PR descriptions, and blog posts). List specific boards available that are relevant to this project's hardware requirements.
- **RISE Optimization Guide:** RISE publishes guidance on RISC-V ISA extensions, compiler flags, and software optimization techniques at [riseproject.dev](https://riseproject.dev). Check whether this project's build system, contribution guide, or RISC-V-specific code references it. If not, note whether following it would close any of the performance gaps in Section 6.
- **RISE Python Package Index** (GitLab project at [gitlab.com/riseproject/python](https://gitlab.com/riseproject/python), browsable index at [riseproject.gitlab.io/python/wheel_builder/](https://riseproject.gitlab.io/python/wheel_builder/), installable via `pip install --extra-index-url https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple <package>`): RISE builds and hosts riscv64 Python wheels for packages that do not yet publish official riscv64 wheels on PyPI. To check whether a specific package is available, fetch the GitLab packages API directly: `https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/<package-name>/`. This is more reliable than the human-readable index page. This check is relevant for any project that is itself a Python package, ships Python bindings, or depends on Python packages. Check it before marking any Python package as "not available on riscv64."

**Verifying PR merge status.** A PR that appears "merged" in an issue comment, a tracking spreadsheet, or a project blog post may have been closed without merging. Always verify against the GitHub API: fetch `https://api.github.com/repos/<owner>/<repo>/pulls/<number>` and check `"merged_at"`. A null `merged_at` with `"state": "closed"` means the PR was closed without merging. Do not rely on labels, comments, or cross-references in other issues to determine merge status.

**Verifying Linux distribution packages.** Use the following canonical URLs to check riscv64 package availability for each distro rather than leaving results as [NEEDS VERIFICATION]:

- Ubuntu: `https://packages.ubuntu.com/search?keywords=<package>&searchon=names&suite=noble&section=all`
- Debian: `https://tracker.debian.org/pkg/<source-package>` (shows per-arch build status)
- Fedora: `https://packages.fedoraproject.org/pkgs/<source-package>/<binary-package>/`
- Arch Linux RISC-V: `https://archriscv.felixc.at/?q=<package>`

**Non-negotiable constraints:**

- Every factual claim must be traceable to a primary upstream source. Claims not verifiable against a second source must be marked `[NEEDS VERIFICATION]`.
- Never fill gaps with plausible guesses. If data is not available for a section, say so explicitly and describe what you searched.
- The report is self-contained. It does not depend on the content of any other status report. You may write "See the [Foo](project-reports/foo.md) status report for details on Foo" to point a reader to a related report, but do not pull content from it and do not assume the reader has read it.
- Only generate Latin-1 characters. Do not use em-dashes; use a hyphen or comma instead. Write like a human.
- Output is a Markdown file. Use the simplest, default formatting. Every URL in the report must be a Markdown link: `[descriptive text](https://url)`. Never write bare URLs.

**Update cadence:** This report is updated approximately every 6 months. When updating an existing report, do not rewrite it. Add a new "Update - YYYY-MM-DD" subsection inside the Updates section (see Section 14), describing only what changed since the previous version. All original content stays in place.

---

## Report sections

Generate the following sections in order. Every section is required.

When Updating the report, write the report from scratch. Do not reference previous versions, do not mention how it this report was before; the only version that matters is the last one, it must be self-contained.

### Header block

```
---
title: [PROJECT_NAME]
---

# [PROJECT_NAME]

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** YYYY-MM-DD<br/>
**Scope:** [one-line description of what this report covers]<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source.<br/>
Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>
```

---

### 1. Project Overview

- Technical description: what the project is and what it does, in one paragraph written for an engineer who has not used it.
- Governance: is the project a member of a foundation (Linux Foundation, Eclipse, CNCF, Apache, PyTorch Foundation, NumFOCUS, OpenSSF, RISC-V International, or other)? What does membership entail in practice? Is the project a member of, or a recipient of investment from, the RISE Project? Document any formal relationship.
- Corporate sponsors and primary backers: which companies fund and drive the project? Which companies have significant maintainer presence? Which companies are notable by their absence?
- Community culture on new platforms: how does the project historically respond to new architecture ports? Are ports welcomed, required to prove value, gated behind feature flags, or resisted? Cite specific examples: accepted PRs, rejected PRs, mailing list threads, or stated policies.

---

### 2. Port History and Upstreaming Timeline

- Milestone table: columns are Date, Event, Source. Cover: first RISC-V mention in the project, first patch or PR, first merge, and all major subsequent events through the report date.
- Key contributors: who has done the RISC-V work? For each contributor, identify the individual and the organization they represent. Cite PR authorship, commit logs, or mailing list posts. Check the [RISE project portfolio](https://riseproject.dev) and the [riseproject-dev GitHub organization](https://github.com/riseproject-dev) to identify whether any of the contributors are RISE-funded and which organizations sponsor that work.
- Timeline comparison table: when was riscv64 support first merged vs arm64 and amd64? Express the gap in years.
- Is the port fully upstream, or does it live in a fork or staging branch?

---

### 3. Upstream Support Tier

- Does the project have a formal platform tier or porting policy? Describe it precisely.
- What tier is linux/riscv64 assigned to, formally or by inference?
- Evidence: is riscv64 in the CI matrix? Are riscv64 failures release-blocking? Are official binaries published for riscv64?
- Comparison table: amd64 vs arm64 vs riscv64, across: official binary, CI pipeline, release-blocking, formal tier.

---

### 4. Technical Architecture and RISC-V-Specific Subsystems

- Describe the components that are architecture-specific: JIT or AOT compiler backends, SIMD or vectorized kernels, cryptographic intrinsics, assembly stubs, ABI-specific calling convention code, signal handling, stack walking, garbage collector write barriers, or anything else that requires per-architecture implementation.
- For each such component: does a RISC-V implementation exist? Is it complete? Which ISA extensions does it use or require (RVV, Zba, Zbb, Zbc, Zbs, Zicond, Zvkned, Zvfh, Zvfbfmin, or other)?
- For components that exist on riscv64: are they implemented in architecture-neutral C/C++, C intrinsics, or hand-written assembly? Note the quality difference: intrinsics and hand-written assembly on arm64 and amd64 typically outperform compiler-generated code from C intrinsics.
- Comparison table: for each architecture-specific component, amd64 vs arm64 vs riscv64. Mark each cell: full (hand-tuned assembly), partial (C intrinsics), scalar (C fallback), or missing.
- ISA profile targeting: which RISC-V profile does the project target as its minimum baseline: RVA20U64, RVA22U64, RVA23U64, or an ad-hoc set of extensions? Does the build system expose a way to target a specific profile? Cross-reference the [RISE Optimization Guide](https://riseproject.dev) for the recommended ISA baseline and extension set for this class of software; note whether the project's choices align with or diverge from those recommendations.

---

### 5. Build System, Cross-Compilation, and Toolchain

- How to build for linux/riscv64, both natively and via cross-compilation. Provide the exact documented commands.
- Cross-compilation support: is it documented and tested? What toolchain (riscv64-linux-gnu-gcc, clang --target=riscv64-linux-gnu) is required?
- Required compiler versions: state the exact minimum GCC and Clang versions and the specific reason each version is required (e.g., which intrinsic, attribute, or language feature first appeared in that release).
- QEMU support: is QEMU-based cross-testing documented? What QEMU version is required? What is the performance overhead of QEMU-based testing at this project's test suite scale?
- Known build failures, workarounds, or requirements that are not documented upstream.
- ABI considerations: is the project sensitive to the RISC-V psABI version? Are there known ABI incompatibilities between toolchain versions or kernel versions?

---

### 6. Feature Coverage and Gap Analysis vs arm64 and amd64

This section drives the investment analysis.

- Feature matrix table: one row per significant feature or capability, three columns (amd64, arm64, riscv64). Mark each cell: full, partial, or missing.
- For every "partial" or "missing" cell on riscv64, explain what is missing and why.
- Separate clearly:
  - **Functional gaps**: features absent on riscv64 that affect correctness or completeness (a user cannot do X on riscv64 at all).
  - **Performance gaps**: features that exist but run without architecture-specific optimization. Where benchmarks exist, state the measured delta. Where they do not exist, estimate the expected delta from the gap (e.g., "scalar fallback on VLEN=256 hardware is expected to be 4-8x slower than RVV-optimized code for this operation"). Check whether RISE has published benchmark data or performance analysis for this project at [riseproject.dev](https://riseproject.dev) or in RISE blog posts.
- Security hardening: are security features available and enabled on riscv64? This includes: stack canaries, ASLR, CFI/shadow call stack, pointer authentication equivalents, hardened allocators, and any project-specific sandbox or isolation mechanism. Note gaps vs arm64 and amd64.
- Floating-point and NaN semantics: RISC-V allows different NaN canonicalization behavior from x86_64 and arm64. Are there known test failures or correctness issues caused by this?

---

### 7. CI/CD Infrastructure

- Does the project have CI runners for linux/riscv64? Identify the CI system. Read the actual CI workflow files (e.g., `.github/workflows/*.yml`) to confirm -- do not infer from issue text.
- If yes: is CI release-blocking? What does it cover (build only, unit tests, integration tests, benchmarks)? How is the hardware provisioned (physical board, QEMU, cloud VM)? Are RISE RISC-V Runners used? If so, document which workflows and what coverage they provide.
- If no: how long has riscv64 been absent from CI? What was the observable impact (name specific bugs that persisted due to lack of CI, with durations)? Has RISE offered runners to this project? Is there an open request to the RISE Project to provision runners here?
- Open proposals or PRs to add riscv64 CI: who proposed them, what is their current status, what is the blocker?
- What RISC-V hardware do contributors actually test on? List specific boards and chips mentioned in issues and PRs (e.g., SpacemiT K3, SG2044, VisionFive2, BananaPi BPI-F3). Cross-reference against the RISE Board Farm to identify whether those boards are available there.
- Comparison table: amd64 vs arm64 vs riscv64, across: CI system, release-blocking, pre-merge verification.

---

### 8. Distribution and Release Status

- Official releases: does the project publish binary artifacts for riscv64 (tarballs, packages, container images, wheels, JARs, npm packages, etc.)? List which release channels include riscv64 and which do not.
- Per package manager: for each relevant distribution channel (PyPI, npm, Maven Central, crates.io, Go module proxy, Homebrew, Conda-forge, OCI registries), is a riscv64 artifact available? At what version? Verify against the registry API directly (e.g., `https://pypi.org/pypi/<package>/json` for PyPI). If the project is a Python package and is absent from official PyPI, check the RISE Python wheel builder GitLab API (`https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/<package>/`) for an unofficial riscv64 wheel and document its version and any known caveats.
- Per Linux distribution: for each of Ubuntu 24.04 LTS, Fedora Rawhide, Debian 13 (Trixie), Arch Linux RISC-V: verify riscv64 availability using the canonical URLs listed in the research instructions above. State the package name, version, and build status for riscv64 specifically.
- If riscv64 is absent from official releases: what must a user do to obtain a working binary (build from source, use a third-party build, etc.)? How long does a from-source build take on available RISC-V hardware?

---

### 9. Dependencies

This section documents the dependency graph with respect to RISC-V. Apply the following process:

**Step 1 -- Direct dependencies.** List every significant direct dependency: build dependencies, runtime dependencies, and optional dependencies that affect performance or functionality. For each:

- Is it built, tested, and released on riscv64? (yes / partial / no, with evidence)
- Who maintains it and what community governs it?
- If a status report exists for it, note "See the [Foo](project-reports/foo.md) status report" -- but do not import its content here.
- Are there open issues, PRs, or blockers for riscv64 support?

**Step 2 -- Recurse into critical dependencies.** For any dependency that is (a) not fully supported on riscv64, or (b) has its own architecture-specific subsystems, apply Step 1 to its direct dependencies. Recurse to at least 2 levels for critical dependencies; 3 levels where the architecture-specific work is deep (e.g., a numerics or crypto library that itself depends on a hardware-specific BLAS or an AES acceleration library).

**Step 3 -- Summary table.** Begin the section with a summary table listing every dependency covered (direct and key transitive), with columns: name, role, riscv64 build status, riscv64 test status, riscv64 release status, community.

For trivial or purely platform-neutral dependencies (e.g., a pure-C JSON parser with no architecture-specific code), a one-line entry is sufficient. Focus depth on dependencies with JIT backends, SIMD kernels, numerics, cryptography, compression, or memory allocators.

---

### 10. Ecosystem Status

Include this section only if the project has a significant ecosystem of packages, plugins, extensions, or dependent projects (for example: Python packages, npm packages, Kubernetes operators and container images, Maven ecosystem JARs, ONNX Runtime execution providers, browser extensions).

- What is the ecosystem? How large is it?
- Overall riscv64 status: what fraction of the most critical ecosystem components are built, tested, and released on riscv64? Use concrete numbers where available (e.g., "12 of the top 50 PyPI packages by download count publish a riscv64 wheel").
- For each high-impact ecosystem member: is it built, tested, and released on riscv64? Cite evidence (PyPI JSON API, GitHub releases, CI configs).
- Shared infrastructure: is there ecosystem-wide infrastructure for riscv64 builds? (e.g., manylinux riscv64 wheel builders, foundation-operated build farms, shared GitHub Actions runners). Who operates it? Check specifically: whether RISE runners are available to ecosystem packages, whether RISE's wheel builder covers any of the critical packages (verify via the GitLab API), and whether RISE has funded enablement work in any ecosystem members. Document this before sizing the investment in the bullet below.
- Blockers: what prevents broader ecosystem riscv64 support? Is it the core project, a critical dependency, the toolchain, or the absence of CI hardware?
- Apply the dependency recursion from Section 9 to the most important ecosystem members that are not yet riscv64-ready.
- Investment required to bring the critical ecosystem to riscv64: give a rough estimate.

---

### 11. Known Bugs and Active Issues

- A table of known bugs and issues in the upstream tracker. Columns: ID, title, status (open/closed), severity (Critical/High/Medium/Low), notes. Group by severity.
- Highlight correctness bugs (wrong results, crashes, silent data corruption) separately from performance and toolability issues.
- For open issues: what is blocking resolution? Is there an assignee? Is upstream interested?
- For recently closed issues: confirm whether the fix has landed in a released version.

---

### 12. Objections and Upstream Blockers

- Are there stated objections from upstream maintainers to supporting riscv64? Cite specific issues or mailing list threads.
- Are there technical blockers (a dependency that must be fixed first, a spec ambiguity, an ABI concern)?
- Are there organizational blockers (maintainers willing to accept patches but not maintain them, CI cost concerns, CI provider limitations)?
- What is the realistic probability that upstream will accept riscv64 contributions? What evidence supports that assessment?

---

### 13. Investment Analysis

This section is the primary output for resource allocation decisions. Be specific.

**Before sizing any investment item, check what RISE has already done or committed to.** Review [riseproject.dev](https://riseproject.dev) (blog posts are the most up-to-date public source) and the [riseproject-dev GitHub organization](https://github.com/riseproject-dev). The Confluence wiki is behind authentication -- skip it. For each work item below, note: (a) whether RISE has already completed it, (b) whether it is in progress under a RISE-funded contributor, or (c) whether RISE infrastructure (runners, board farm, wheel builder) would reduce the effort. Do not size work that is already covered. Do not ignore RISE-covered items -- document them as "covered by RISE" so leadership has a complete picture.

**13.1 Functional enablement** -- work required to make the project build, pass its test suite, and produce correct results on riscv64. For each item: brief description, effort in person-weeks, whether it must be contributed upstream or can be done downstream, and who in the upstream community is best positioned to do it. Note whether RISE is already funding equivalent work.

**13.2 Performance optimization** -- work required to bring riscv64 performance within an acceptable range of arm64 and amd64. For each item: which gap it closes, target ISA extensions (RVV, Zba, etc.), implementation approach (C intrinsics vs hand-written assembly), estimated effort, and expected performance improvement. Check the [RISE Optimization Guide](https://riseproject.dev) for relevant guidance that could reduce the effort estimate.

**13.3 CI/CD infrastructure** -- work required to add riscv64 to the project's CI pipeline. Before estimating hardware provisioning cost, check whether RISE RISC-V Runners (see `riseproject-dev` GitHub org for active CI forks) can cover this project's CI needs at no additional infrastructure cost. If RISE runners are available, reduce the effort estimate accordingly and note the dependency on RISE runner availability.

**13.4 Ecosystem enablement** (if applicable) -- cost to bring the critical ecosystem to riscv64. Check the RISE Python wheel builder (verify via GitLab API) for packages already covered. Identify which remaining gaps RISE could close vs which require independent investment.

**13.5 Summary table**

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | ... | ... | ... | Critical/High/Medium/Low |
| Performance | ... | ... | ... | ... |
| CI/CD | ... | ... | ... | ... |
| Ecosystem | ... | ... | ... | ... |

---

### 14. References

A complete list of every source cited in the report. Format:

```
- [Project Issue #NNNN -- Title](URL)
- [Author, "Title", Date](URL)
- [Commit ABCDEF -- Short description](URL)
```

List sources in the order they first appear in the report.
