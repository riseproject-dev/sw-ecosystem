
export const meta = {
  name: 'update-project-report',
  description: 'Deep research RISC-V ecosystem status report -- sequential, GitHub MCP for GitHub projects',
  phases: [
    { title: 'Search', detail: 'Sequential: GitHub MCP searches + web searches for non-GitHub sources' },
    { title: 'Fetch', detail: 'Sequential: deep reads of issues, PR status, build docs, RISE details' },
    { title: 'Verify', detail: 'Sequential: adversarial CI, package, and arch-code checks' },
    { title: 'Synthesize', detail: 'Write full report grounded in live findings only' },
  ],
}

const proj = args[0]
const ABORT_THRESHOLD = 1000

const slug = proj.slug || proj.name.toLowerCase().replace(/[\s.\/]+/g, '-')

// Parse owner/repo from URL for GitHub projects
// e.g. https://github.com/llvm/llvm-project -> owner=llvm, repo=llvm-project
// For non-GitHub projects (kernel.org, sourceware.org) ghOwner/ghRepo will be null
let ghOwner = null
let ghRepo = null
const ghMatch = proj.repo.match(/github\.com\/([^/]+)\/([^/]+)/)
if (ghMatch) {
  ghOwner = ghMatch[1]
  ghRepo = ghMatch[2].replace(/\.git$/, '')
}
log(`Project: ${proj.name} | GitHub: ${ghOwner ? ghOwner+'/'+ghRepo : 'NO (non-GitHub project)'}`)

// ── Phase 1: Search (fully sequential) ────────────────────────────────────
phase('Search')

log(`[1/8] Searching issues/PRs for ${proj.name} ...`)
const s1 = await agent(`Search for all RISC-V related issues and PRs for "${proj.name}".

${ghOwner ? `
This project is on GitHub at ${ghOwner}/${ghRepo}. Use the GitHub MCP tools for ALL GitHub operations:
- Use mcp__github__search_issues with query "riscv repo:${ghOwner}/${ghRepo}" to find issues
- Use mcp__github__search_issues with query "riscv64 repo:${ghOwner}/${ghRepo}" to find more
- Use mcp__github__search_pull_requests with query "riscv repo:${ghOwner}/${ghRepo}" to find PRs
- Use mcp__github__search_pull_requests with query "riscv64 repo:${ghOwner}/${ghRepo}" for more PRs
- Use mcp__github__search_commits with query "riscv repo:${ghOwner}/${ghRepo}" to find related commits
- For any tracking issue found, use mcp__github__issue_read with method "get" to fetch full content
- For any tracking issue, use mcp__github__issue_read with method "get_comments" to fetch all comments
` : `
This project is NOT on GitHub. Use WebSearch and WebFetch:
- WebSearch for "site:${proj.repo.replace(/https?:\/\//,'')} riscv64"
- WebSearch for "${proj.name} riscv64 patch"
- WebSearch for "${proj.name} riscv site:lore.kernel.org" if it is a kernel project
- Fetch the mailing list archives if available
`}

Also: WebSearch for "site:github.com ${proj.name} riscv64" and "${proj.name} riscv64 support"

For each issue/PR/commit found: record number/SHA, title, date, status (open/closed/merged), 2-sentence summary, direct URL.
Look for a master tracking issue for the riscv64 port.
If truly zero results, say "ZERO RISCV RESULTS: confirmed by searching [list what you searched]".`, {label: `${proj.name}:issues-prs`, phase: 'Search'})

log(`[2/8] Fetching CI configuration for ${proj.name} ...`)
const s2 = await agent(`Find and read all CI configuration for "${proj.name}" related to riscv64.

${ghOwner ? `
This project is on GitHub at ${ghOwner}/${ghRepo}. Use GitHub MCP tools:
- Use mcp__github__get_file_contents with owner="${ghOwner}", repo="${ghRepo}", path=".github/workflows" to list all workflow files
- For EACH workflow file listed, use mcp__github__get_file_contents to fetch its full content
- Search each file content for: "riscv", "riscv64", "linux/riscv64", "RISCV"
- Return the COMPLETE content of any file containing riscv references
- Check trigger conditions (on: push, pull_request, workflow_dispatch, schedule)
- Check runner type (ubuntu-latest = x86, riscv64 runner, QEMU)
Also check for .gitlab-ci.yml, Jenkinsfile, .cirrus.yml using mcp__github__get_file_contents
` : `
This project is NOT on GitHub. Use WebFetch:
- Fetch ${proj.repo} main page and look for CI links
- WebSearch for "${proj.name} riscv64 CI buildbot jenkins gitlab"
- For kernel projects, check https://lore.kernel.org for CI discussion
`}

If zero riscv64 CI found, say "NO RISCV64 CI: confirmed by reading [files checked]".`, {label: `${proj.name}:ci-config`, phase: 'Search'})

log(`[3/8] Checking package/release availability for ${proj.name} ...`)
const s3 = await agent(`Research binary package and release availability for "${proj.name}" on riscv64.

${ghOwner ? `
Use GitHub MCP to check releases:
- Use mcp__github__list_releases with owner="${ghOwner}", repo="${ghRepo}", perPage=5
- List ALL asset filenames from each release. Does any filename contain "riscv64" or "riscv"?
` : `
Check the project's release page via WebFetch: ${proj.repo}
`}

Also check these via WebFetch (not GitHub MCP):
1. PyPI: https://pypi.org/pypi/${proj.name.toLowerCase().replace(/[\s.]+/g,'-')}/json -- check "urls" array for "riscv64" in filenames
2. RISE wheel builder: https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/${proj.name.toLowerCase().replace(/[\s.]+/g,'-')}/
3. Ubuntu 24.04: https://packages.ubuntu.com/search?keywords=${encodeURIComponent(proj.name)}&suite=noble&searchon=names&section=all
4. Debian tracker: https://tracker.debian.org/pkg/${proj.name.toLowerCase().replace(/[\s.]+/g,'-')} -- find riscv64 build status row
5. Arch Linux RISC-V: https://archriscv.felixc.at/?q=${encodeURIComponent(proj.name.toLowerCase())}

For each source: state the URL fetched, what you found, whether riscv64 is present.`, {label: `${proj.name}:packages`, phase: 'Search'})

log(`[4/8] Checking RISE Project involvement for ${proj.name} ...`)
const s4 = await agent(`Research RISE Project involvement with "${proj.name}".

Use WebFetch for all of the following:
1. Fetch https://riseproject.dev/blog -- scan ALL post titles and summaries for "${proj.name}"
2. If posts mention it, fetch the full post URL and extract all technical details
3. WebSearch "RISE project ${proj.name} riscv64" and "riseproject.dev ${proj.name}"
4. Fetch https://riseproject.gitlab.io/python/wheel_builder/ -- is "${proj.name}" listed?

${ghOwner ? `
Use GitHub MCP to check riseproject-dev org:
- Use mcp__github__search_repositories with query "${proj.name} org:riseproject-dev" to find related repos
- If a repo is found, use mcp__github__get_file_contents to fetch its README
` : `
WebSearch for "${proj.name} riscv64 site:github.com/riseproject-dev"
`}

Return every RISE blog post (date + URL), every riseproject-dev repo, RISE runner usage, funded work.
If nothing found: "NO RISE INVOLVEMENT: confirmed by checking [URLs searched]".`, {label: `${proj.name}:rise`, phase: 'Search'})

log(`[5/8] Searching arch-specific code for ${proj.name} ...`)
const s5 = await agent(`Find ALL architecture-specific code for "${proj.name}" relevant to RISC-V.

${ghOwner ? `
Use GitHub MCP search tools:
- mcp__github__search_code with query "riscv repo:${ghOwner}/${ghRepo}" -- list all matching files
- mcp__github__search_code with query "vfloat32m1_t repo:${ghOwner}/${ghRepo}" -- RVV intrinsics
- mcp__github__search_code with query "rvv repo:${ghOwner}/${ghRepo}" -- RVV references
- mcp__github__search_code with query "riscv64 repo:${ghOwner}/${ghRepo}" -- riscv64 references
- For each file found, use mcp__github__get_file_contents to fetch its actual content
- Report: path, line count, purpose, ISA extensions used (RVV, Zba, Zbb, etc.), complete or stub
` : `
Use WebFetch to search the source:
- WebSearch "site:${proj.repo.replace(/https?:\/\//,'')} riscv"
- WebSearch "${proj.name} riscv64 assembly kernel source"
- Fetch known arch directories if they exist
`}

Check for: arch/riscv/ directories, .S assembly files, JIT backends, SIMD dispatch for riscv64.
If zero: "NO RISCV ARCH CODE: confirmed by searching [queries run]".`, {label: `${proj.name}:arch-code`, phase: 'Search'})

log(`[6/8] Researching governance for ${proj.name} ...`)
const s6 = await agent(`Research governance, corporate sponsors, and port history for "${proj.name}".

${ghOwner ? `
Use GitHub MCP tools:
- mcp__github__get_file_contents with owner="${ghOwner}", repo="${ghRepo}", path="MAINTAINERS" (or OWNERS, CODEOWNERS)
- mcp__github__list_commits with owner="${ghOwner}", repo="${ghRepo}", perPage=30 -- identify top contributors
- mcp__github__search_commits with query="riscv repo:${ghOwner}/${ghRepo}" -- find first riscv commit
- Look for PLATFORMS.md, SUPPORT.md, docs/platforms/ using mcp__github__get_file_contents
` : `
Use WebFetch:
- Fetch ${proj.repo} for MAINTAINERS file
- WebSearch "${proj.name} riscv64 maintainer governance"
`}

Also use WebFetch:
- Fetch ${proj.home} -- extract governance model, foundation membership, license
- Fetch https://riseproject.dev -- check if project is a RISE member

Return: foundation, corporate maintainers with companies, first riscv commit date/author, tier policy, community stance on new ports.`, {label: `${proj.name}:governance`, phase: 'Search'})

log(`[7/8] Researching dependencies for ${proj.name} ...`)
const s7 = await agent(`Research critical dependencies of "${proj.name}" and their riscv64 status.

${ghOwner ? `
Use GitHub MCP to fetch the dependency manifest:
- mcp__github__get_file_contents with owner="${ghOwner}", repo="${ghRepo}", path="CMakeLists.txt" (or setup.py, go.mod, Cargo.toml, package.json -- try each)
- Parse to identify major dependencies with JIT backends, SIMD, numerics, crypto, compression, or memory allocators
- For each such dependency that is also on GitHub, use mcp__github__search_issues with query "riscv64 repo:<owner>/<repo>" to check for riscv64 issues
` : `
Use WebFetch to find the build/dependency files at ${proj.repo}
`}

For any dependency that is also listed in scope.yml (our RISC-V Ecosystem project scope), note:
"See status report at project-reports/<dependency-slug>.md" (slug = lowercased name with spaces/dots/slashes replaced by hyphens)

Return a dependency table: name, role, riscv64 build status, riscv64 test status, riscv64 release status, blocking issues.`, {label: `${proj.name}:deps`, phase: 'Search'})

log(`[8/8] Searching perf benchmarks and bugs for ${proj.name} ...`)
const s8 = await agent(`Search for performance benchmarks and known bugs for "${proj.name}" on RISC-V.

${ghOwner ? `
Use GitHub MCP tools:
- mcp__github__search_issues with query "riscv64 performance repo:${ghOwner}/${ghRepo}"
- mcp__github__search_issues with query "riscv64 bug repo:${ghOwner}/${ghRepo}" (state: open)
- mcp__github__search_issues with query "riscv nan floating repo:${ghOwner}/${ghRepo}"
` : `
WebSearch "${proj.name} riscv64 bug" and "${proj.name} riscv64 performance issue"
`}

Also use WebFetch:
- WebSearch "${proj.name} riscv64 benchmark" and "${proj.name} riscv performance 2024 2025 2026"
- Fetch https://riseproject.dev/blog and look for performance posts about this project

Return: all benchmark data with sources and exact numbers, all open correctness/performance bugs with issue numbers.`, {label: `${proj.name}:perf-bugs`, phase: 'Search'})

const searches = [s1, s2, s3, s4, s5, s6, s7, s8]
const validSearches = searches.filter(Boolean)
const totalSearchLen = validSearches.join('').length
log(`Search phase complete: ${totalSearchLen} chars from ${validSearches.length} agents`)

if (totalSearchLen < ABORT_THRESHOLD) {
  log(`ABORT: Search returned only ${totalSearchLen} chars -- tools unavailable or rate-limited. Not writing report.`)
  return [{ name: proj.name, status: 'FAILED', reason: `Search returned only ${totalSearchLen} chars.` }]
}

const searchResults = validSearches.join('\n\n═══ SEARCH BOUNDARY ═══\n\n')

// ── Phase 2: Fetch (fully sequential) ─────────────────────────────────────
phase('Fetch')

log(`[1/4] Deep-reading key issues for ${proj.name} ...`)
const f1 = await agent(`For "${proj.name}" -- deep-read the most important riscv64 issues and PRs.

Based on this search data:
${searchResults.substring(0, 6000)}

${ghOwner ? `
Use GitHub MCP tools to fetch full content:
- Identify the 5 most important riscv64 issues/PRs (tracking issues, correctness bugs, CI additions, major features)
- For each issue: use mcp__github__issue_read with method="get" to fetch the full body
- For each issue: use mcp__github__issue_read with method="get_comments" to fetch all comments
- For each PR: use mcp__github__pull_request_read with method="get" for full details
- For each PR: use mcp__github__pull_request_read with method="get_review_comments" for review discussion
- Extract: exact error messages, proposed solutions, who is blocking/unblocking, prerequisite issues
` : `
Use WebFetch to read the full content of the most important issues/threads.
`}

Return the full extracted content for each issue/PR with its URL.`, {label: `${proj.name}:fetch-issues`, phase: 'Fetch'})

log(`[2/4] Verifying PR merge status for ${proj.name} ...`)
const f2 = await agent(`For "${proj.name}" -- verify all riscv64 PR merge statuses.

Based on this search data:
${searchResults.substring(0, 4000)}

${ghOwner ? `
For EVERY riscv64-related PR mentioned, use GitHub MCP:
- mcp__github__pull_request_read with method="get", owner="${ghOwner}", repo="${ghRepo}", pullNumber=<N>
- Check "merged_at" in the response: null + state="closed" means CLOSED WITHOUT MERGING
- Check "merged_at": not null means MERGED on that date
- Check state="open" means STILL OPEN
- For merged PRs: use mcp__github__get_commit with the merge_commit_sha to confirm the merge
` : `
WebFetch the PR/patch URLs to confirm their status.
`}

Return a table: PR/patch number | title | status (open/merged/closed-unmerged) | merged_at date | first release.`, {label: `${proj.name}:pr-status`, phase: 'Fetch'})

log(`[3/4] Fetching build docs for ${proj.name} ...`)
const f3 = await agent(`For "${proj.name}" -- fetch all build system documentation for riscv64.

${ghOwner ? `
Use GitHub MCP tools:
- mcp__github__get_file_contents with owner="${ghOwner}", repo="${ghRepo}", path="README.md"
- Try each of: "BUILDING.md", "INSTALL", "docs/building.md", "docs/cross-compilation.md"
- mcp__github__get_file_contents for "CMakeLists.txt" -- search content for "riscv"
- Look for cross-compilation toolchain file: try "cmake/riscv64.cmake", "cmake/toolchain-riscv64.cmake"
- Search for riscv64 Dockerfiles: try ".ci/docker/", "docker/", "Dockerfile.riscv64"
  using mcp__github__search_code with query "riscv64 repo:${ghOwner}/${ghRepo} filename:Dockerfile"
` : `
Use WebFetch to fetch build documentation from ${proj.repo}
`}

Return exact cmake/configure commands for riscv64, required toolchain versions (exact GCC/Clang minimums and why), known -DUSE_X=OFF flags, QEMU usage. Include full Dockerfile content if found.`, {label: `${proj.name}:build-docs`, phase: 'Fetch'})

log(`[4/4] Fetching RISE details and benchmarks for ${proj.name} ...`)
const f4 = await agent(`For "${proj.name}" -- fetch RISE Project details and published performance data.

Use WebFetch for all of the following:
1. Fetch full content of any RISE blog posts mentioning "${proj.name}"
2. Fetch https://riseproject.dev and extract the full member/project list
3. WebSearch "${proj.name} riscv64 vs arm64 performance 2024 2025 2026"
4. Fetch any linked benchmark reports or slides found in search results
5. WebSearch "${proj.name} riscv64 benchmark site:github.com"

Return: full text of RISE blog posts about this project, all quantitative benchmark data with methodology, RISE member list.`, {label: `${proj.name}:rise-deep`, phase: 'Fetch'})

const validFetches = [f1, f2, f3, f4].filter(Boolean)
log(`Fetch phase complete: ${validFetches.join('').length} chars`)
const fetchResults = validFetches.join('\n\n═══ FETCH BOUNDARY ═══\n\n')

// ── Phase 3: Verify (fully sequential) ────────────────────────────────────
phase('Verify')
const allFindings = searchResults + '\n\n══════ FETCHED SOURCES ══════\n\n' + fetchResults

log(`[1/3] Adversarially verifying CI for ${proj.name} ...`)
const v1 = await agent(`ADVERSARIAL VERIFICATION -- CI status for "${proj.name}".
Your job is to REFUTE any claim that riscv64 CI exists. Be a skeptic.

Evidence so far:
${allFindings.substring(0, 7000)}

${ghOwner ? `
Use GitHub MCP to verify directly:
- mcp__github__get_file_contents with owner="${ghOwner}", repo="${ghRepo}", path=".github/workflows" to list all workflow files
- For EACH workflow file, fetch its full content and search for "riscv"
- Paste the EXACT lines containing "riscv" from the YAML
- Check trigger: "on: push"? "on: pull_request"? "workflow_dispatch" only? Specific labels/tags only?
- Check runner type: ubuntu-latest (x86), arm runner, or dedicated riscv64 runner?
- Check what the job does: build only, or also runs tests? Uses QEMU?
` : `
Use WebFetch to check any CI configuration files at ${proj.repo}
`}

Final verdict: state EXACTLY what CI exists for riscv64 based on actual file content only. Reject any claim not backed by a file you read.`, {label: `${proj.name}:verify-ci`, phase: 'Verify'})

log(`[2/3] Adversarially verifying packages for ${proj.name} ...`)
const v2 = await agent(`ADVERSARIAL VERIFICATION -- binary/package availability for "${proj.name}" on riscv64.
Your job is to REFUTE any claim that a riscv64 binary exists. Be a skeptic.

Evidence so far:
${allFindings.substring(0, 7000)}

Use WebFetch to verify directly:
1. Fetch https://pypi.org/pypi/${proj.name.toLowerCase().replace(/[\s.]+/g,'-')}/json -- does any "urls[].filename" contain "riscv64"?
2. Fetch Debian tracker: https://tracker.debian.org/pkg/${proj.name.toLowerCase().replace(/[\s.]+/g,'-')} -- exact riscv64 build status row
3. Fetch https://archriscv.felixc.at/?q=${encodeURIComponent(proj.name.toLowerCase())} -- is it listed with a version?

${ghOwner ? `
Use GitHub MCP to verify releases:
- mcp__github__list_releases with owner="${ghOwner}", repo="${ghRepo}", perPage=3
- List EVERY asset filename. Does any contain "riscv64"?
` : ''}

Final verdict: for each distribution channel, state whether riscv64 is available with exact evidence from API/page response.`, {label: `${proj.name}:verify-packages`, phase: 'Verify'})

log(`[3/3] Adversarially verifying arch code completeness for ${proj.name} ...`)
const v3 = await agent(`ADVERSARIAL VERIFICATION -- architecture-specific code completeness for "${proj.name}".
Your job is to assess whether the riscv64 implementation is complete or just a stub.

Evidence so far:
${allFindings.substring(0, 7000)}

${ghOwner ? `
Use GitHub MCP to fetch actual source files:
- For each riscv64 source file identified in the search phase, use mcp__github__get_file_contents to fetch its actual content
- Count actual lines. Are there TODO/FIXME/stub/not implemented comments?
- Use mcp__github__search_code with query="#ifdef __riscv repo:${ghOwner}/${ghRepo}" to find architecture guards
- Compare: how many amd64-specific files exist vs arm64 vs riscv64? List them.
` : `
Use WebFetch to fetch the content of key riscv64 source files identified in the search phase.
`}

Final verdict: rate each arch-specific component as: full (hand-tuned), partial (C intrinsics), scalar (C fallback), or missing.`, {label: `${proj.name}:verify-arch`, phase: 'Verify'})

const validVerifications = [v1, v2, v3].filter(Boolean)
log(`Verify phase complete: ${validVerifications.join('').length} chars`)

const fullContext = allFindings + '\n\n══════ VERIFICATIONS ══════\n\n' + validVerifications.join('\n\n═══ VERIFY BOUNDARY ═══\n\n')

// ── Phase 4: Synthesize ───────────────────────────────────────────────────
phase('Synthesize')
log(`Synthesizing report for ${proj.name} (${fullContext.length} chars of findings) ...`)

const report = await agent(`You are a highly technical, principal software engineer writing a fact-based assessment for engineering leadership at a chip company evaluating RISC-V investment. Write with precision. No hedging, no marketing language, no filler.

CRITICAL RULES:
1. Base EVERY factual claim on the research findings below. If findings do not contain data for something, write: "Data not available: [describe what was searched]."
2. Do NOT use training knowledge to fill gaps. Do NOT invent PR numbers, dates, or benchmark figures.
3. Where findings are contradictory, cite both and note the discrepancy.
4. Mark any claim from only one source as [NEEDS VERIFICATION].
5. Your final text output IS the report. Do not call any tools. Just write the report text.
6. Section 10 (Ecosystem Status) -- include only if the project has a significant ecosystem of packages, plugins, or extensions that must also be enabled on riscv64 (e.g., Python packages, npm packages, Kubernetes operators, Maven JARs). Skip it for system libraries, runtimes, and standalone tools that have no dependent package ecosystem.

Project: ${proj.name}
Repository: ${proj.repo}
Homepage: ${proj.home}

LIVE RESEARCH FINDINGS (${fullContext.length} chars -- use ONLY these as your source of facts):
${fullContext.substring(0, 90000)}

Write the COMPLETE report. Formatting rules:
- Latin-1 characters only, no em-dashes (use hyphen or comma)
- Every URL as a Markdown link [text](url), never bare URLs
- Use the simplest Markdown formatting
- Omit Section 10 entirely if the project has no significant package ecosystem

---
title: ${proj.name}
---

# ${proj.name}

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Scope:** RISC-V (riscv64/linux) support status for ${proj.name}<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

Technical description, governance, corporate sponsors, community culture on new ports.

## 2. Port History and Upstreaming Timeline

Milestone table (Date | Event | Source), key contributors with orgs, is it fully upstream?

## 3. Upstream Support Tier

Formal tier policy, evidence (CI, release-blocking, official binaries).
Comparison table: amd64 vs arm64 vs riscv64.

## 4. Technical Architecture and RISC-V-Specific Subsystems

Architecture-specific components (JIT, SIMD, crypto, assembly, GC barriers).
For each: does riscv64 implementation exist, which ISA extensions, quality (hand-tuned/intrinsics/scalar/missing)?
Comparison table per component: amd64 vs arm64 vs riscv64.

## 5. Build System, Cross-Compilation, and Toolchain

Exact build commands, required toolchain versions and WHY, QEMU usage, known build failures.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

Feature matrix table. Functional gaps (can't do X at all). Performance gaps (delta from missing SIMD).
Security hardening gaps. NaN / floating-point semantics issues.

## 7. CI/CD Infrastructure

Does riscv64 CI exist? Read actual CI YAML files. RISE runners? Hardware used?
Comparison table: amd64 vs arm64 vs riscv64.

## 8. Distribution and Release Status

Official binaries for riscv64? PyPI, npm, Maven, OCI? Ubuntu/Debian/Fedora/Arch packages?
What must a user do to get a working binary?

## 9. Dependencies

Summary table (name | role | riscv64 build | riscv64 test | riscv64 release | community).
Deep-dive on dependencies with JIT, SIMD, crypto, or numerics. Recurse 2-3 levels for critical deps.

## 10. Ecosystem Status

(Include ONLY if the project has a significant dependent package ecosystem.)
Ecosystem size, riscv64 coverage fraction, RISE wheel builder coverage, shared infrastructure.

## 11. Known Bugs and Active Issues

Table: ID | title | status | severity | notes. Highlight correctness bugs separately.

## 12. Objections and Upstream Blockers

Stated objections, technical blockers, organizational blockers, acceptance probability.

## 13. Investment Analysis

Before sizing: check what RISE has already done or funded. Do not size work already covered.

### 13.1 Functional Enablement
### 13.2 Performance Optimization
### 13.3 CI/CD Infrastructure
### 13.4 Ecosystem Enablement
### 13.5 Summary Table
| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | ... | ... | ... | Critical/High/Medium/Low |

## 14. Updates
(No updates yet -- initial report dated 2026-06-17.)

## 15. References

Complete list of every source cited. Format: [descriptive text](URL).`, {label: `${proj.name}:synthesize`, phase: 'Synthesize'})

return [{ name: proj.name, file: `project-reports/${slug}.md`, report, totalChars: fullContext.length }]
