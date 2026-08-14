---
title: adk-go
---

# adk-go

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Scope:** RISC-V (riscv64/linux) support status for adk-go<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

adk-go (module path `google.golang.org/adk/v2`) is Google's Agent Development Kit for Go, a code-first Go toolkit for building, evaluating, and deploying AI agents. It is one of several language variants in the ADK family (alongside Python, Java, Kotlin, TypeScript). The library provides agent orchestration, tool-calling, multi-agent (A2A) communication, session/state management, and deployment tooling targeting Google Cloud Run and Vertex AI Agent Engine.

**Governance:** adk-go is a Google-owned project hosted under the `github.com/google` GitHub org, copyright "Google LLC," licensed Apache-2.0. There is no foundation affiliation (not CNCF, not Linux Foundation, not Apache Software Foundation as a project). No `GOVERNANCE.md`, `MAINTAINERS`, `OWNERS`, or `PLATFORMS.md` file exists. The only formal structure is a GitHub team, `@google/adk-go-maintainers-team`, referenced narrowly in `.github/CODEOWNERS` for dependency files (`go.mod`/`go.sum`/dependabot config) rather than general code review. Contributions require Google's CLA and follow Google's Open Source Community Guidelines; ordinary PRs go through an "internal review rotation." `CONTRIBUTING.md` states the project defers cross-cutting design decisions to adk-python ("we lean on adk-python for being the source of truth"), meaning platform/architecture policy would likely originate at the broader ADK project level, not within adk-go specifically.

**Corporate sponsor:** Google LLC is the sole corporate backer. Repo created 2025-05-05; initial commit 2025-05-19 by rakyll (Jaana Dogan, Google). Top committers (dpasiukevich 86 commits, baptmont 62, yarolegovich 37 [@google], kdroste-google 36, hyangah 35, ngeorgy 29, rakyll 22 [Google]) are predominantly Google-affiliated by username/profile signal, though several leave the `company` field blank. One external contributor identified: pawel-maciejczek (17 commits, self-reported affiliation Glovo).

**RISE relationship:** Google LLC is a RISE Premier Member (alongside Alibaba Damo, MediaTek, NVIDIA, Qualcomm, Red Hat, SiFive, Tenstorrent). This is a corporate-level RISC-V investment relationship and has no documented, project-specific connection to adk-go.

**Community culture on new ports:** No explicit stance exists because the topic has never been raised. Zero commits, issues, PRs, or discussions mention RISC-V in the project's approximately 15-month history (through 2026-08-13). By inference from `CONTRIBUTING.md`'s policy for "Large or Complex Changes," contributors proposing something like riscv64 CI coverage would be expected to open an issue first to "discuss with maintainers and the community to ensure alignment" before starting substantial work. There is no evidence of resistance to a hypothetical port, simply a complete absence of prior engagement on the subject.

**Technical profile relevant to portability:** adk-go is a pure Go application-layer library: Go 3.99M bytes / HTML 53K / JS 4K / Shell 0.9K / Dockerfile 0.8K across 996 files (533 `.go` files, 132,603 lines of Go per direct clone inspection). It contains zero C, zero assembly, zero cgo (`import "C"` count: 0), and zero `unsafe.Pointer` usage. It has no compute kernels, no JIT, no SIMD code of its own. This shapes nearly every section below: as a pure-Go SDK with no architecture-specific code, it inherits RISC-V support transitively from the upstream Go toolchain rather than requiring project-level porting work.

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2025-05-05 | Repository created | [google/adk-go](https://github.com/google/adk-go) repo metadata |
| 2025-05-19 | Initial commit by rakyll (Jaana Dogan, Google) | Repo commit history |
| 2025-12-03 | PR [#379](https://github.com/google/adk-go/pull/379) merged: switched session/database SQLite driver from `gorm.io/driver/sqlite` (CGo-based) to `github.com/glebarez/sqlite` (CGo-free, transpiled via `modernc.org`) | [adk-go PR #379](https://github.com/google/adk-go/pull/379) |
| N/A | No riscv64-specific commit, issue, PR, or discussion exists at any point in project history | Exhaustive `gh search commits/issues/prs`, GraphQL discussion search, and code search, all returning 0 results (see Section 11 and 12) |

**Key contributors:** No RISC-V-specific contributors exist since no RISC-V work has occurred. The PR most relevant to riscv64 feasibility (#379, the CGo-free SQLite switch) was not framed as a RISC-V enablement change in its own description; it removed what is typically the single biggest cross-architecture portability blocker for Go projects (a cgo native dependency) as a side effect of an unrelated architectural decision.

**Is it fully upstream?** There is no "port" to be upstream or not. adk-go itself has zero architecture-conditional code for any CPU architecture, including amd64 and arm64. Under Go's standard cross-compilation model, `GOOS=linux GOARCH=riscv64 go build ./...` should build the library using the stock toolchain, inherited automatically rather than earned through project-specific engineering. This is an inference from the dependency graph and CI configuration, not a documented, tested, or supported claim made by the project itself. No one has verified this claim on real riscv64 hardware; no benchmark, CI run, or user report was found.

## 3. Upstream Support Tier

**No formal tier policy exists.** adk-go has no `PLATFORMS.md`, `SUPPORT.md`, or equivalent document defining supported architectures at all, for any platform.

**Evidence table, amd64 vs arm64 vs riscv64:**

| Dimension | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI coverage | Yes (all 3 workflows run on `ubuntu-latest`, which is x86_64) | No CI, but referenced incidentally (issue [#1196](https://github.com/google/adk-go/issues/1196) reported on Linux/arm64; issue [#1076](https://github.com/google/adk-go/issues/1076) reported on macOS/arm64) | No CI, zero references anywhere |
| Release-blocking status | De facto only tested target | Not tested, not blocking | Not tested, not blocking, never discussed |
| Official binaries | None (GitHub Releases ship `"assets":[]` for all checked tags: v1.6.0, v2.2.0, v2.1.0, v1.5.1, v2.0.0) | None | None |
| CLI deploy target (`adkgo deploy`) | Hardcoded `GOARCH=amd64` for Cloud Run and Vertex AI Agent Engine | Not supported as a deploy target either | Not supported as a deploy target |
| Documented support claim | Implicit (CI runner architecture) | None | None |

Since the project ships no compiled release artifacts for any architecture at all (distribution is exclusively via `go get`/Go module proxy, confirmed via `proxy.golang.org/google.golang.org/adk/@v/list` returning HTTP 200 with tags v0.1.0-v2.2.0), "support tier" for riscv64 reduces to a single question: does the Go toolchain's riscv64 backend, plus every transitive dependency, compile and run this pure-Go codebase correctly. No project statement answers this question either way.

## 4. Technical Architecture and RISC-V-Specific Subsystems

adk-go has no architecture-specific subsystems of any kind. There is no JIT, no hand-written SIMD, no custom crypto implementation, no assembly, and no GC-barrier-adjacent code in the project's own source tree (this is standard for a pure-Go application; the Go runtime itself owns GC barriers and code generation, not application code).

Direct repository inspection (via shallow clone, bypassing GitHub API rate limits) confirmed:

| Check | Result |
|---|---|
| `find *_amd64.go *_arm64.go *_riscv64.go *_386.go *_arm.go *_ppc64*.go *_s390x.go` | 0 files |
| `find *_linux.go *_windows.go *_darwin.go *_unix.go` (OS-level split) | 0 files |
| `grep -rl '^//go:build'` | 0 files |
| `grep -rl '^// +build'` (old-style build tags) | 0 files |
| `grep -rl 'import "C"'` (cgo) | 0 files |
| `grep -rl 'unsafe\.'` | 0 files |
| `.c`/`.h`/`.s`/`.S` files present | 0 files |

**Comparison table per component:**

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| JIT | N/A (none exists in adk-go) | N/A | N/A |
| SIMD | N/A (none in adk-go's own code) | N/A | N/A |
| Crypto | N/A (none in adk-go's own code; delegated to `golang.org/x/crypto`, see Section 9) | N/A | N/A |
| Assembly | None | None | None |
| GC barriers | N/A (owned by Go runtime, not application code) | N/A | N/A |

The only architecture-conditional strings anywhere in the codebase are two non-build-tag, hardcoded string literals: `cmd/adkgo/internal/deploy/cloudrun/cloudrun.go:191` (`GOARCH=amd64` passed as an env var to a shelled-out `go build` invocation) and `cmd/adkgo/internal/deploy/agentengine/agentengine.go:189` (`GOARCH=amd64` inside an embedded Dockerfile template string, base image `golang:1.25`). Both target Google-managed, amd64-only cloud services (Cloud Run, Vertex AI Agent Engine) and are deployment-target constraints, not statements about adk-go library portability. Notably, arm64 has no deploy path either -- the same amd64 constant is used unconditionally for both deploy targets, so riscv64 is not being singled out for exclusion; nothing beyond amd64 is supported by the CLI's deploy subcommand.

## 5. Build System, Cross-Compilation, and Toolchain

adk-go is a standard Go module; it has no CMake, no Autotools, no `configure` script, and no C/C++ toolchain requirement of any kind.

**Verified file checks (all HTTP 404 against `google/adk-go`):** `BUILDING.md`, `INSTALL`, `docs/building.md`, `docs/cross-compilation.md`, `CMakeLists.txt`, `cmake/riscv64.cmake`, `cmake/toolchain-riscv64.cmake`, `Dockerfile.riscv64`, `docker/Dockerfile.riscv64`. No `.ci/docker/` or `docker/` directory exists.

**Documented build command** (from `README.md`): `go get google.golang.org/adk/v2`. That is the entirety of the documented installation/build guidance.

**Inferred riscv64 build command** (not documented by the project; derived from the Go toolchain's standard cross-compilation model and confirmed cgo-free dependency graph):
```
GOOS=linux GOARCH=riscv64 go build ./...
```
`go.mod` pins `go 1.26.5`. Go has shipped native `linux/riscv64` support since Go 1.14 (2020); no additional GCC/Clang cross-compiler is required because the library and its dependency chain contain zero cgo. No QEMU is needed for the build itself (QEMU would only be relevant for running tests on emulated riscv64, which no CI configuration in this repo attempts).

**The one Dockerfile in the repo** (`scripts/adk-web/Dockerfile`) builds the separate `google/adk-web` Node.js frontend using `node:iron-trixie`, with no architecture flags or riscv references; it is unrelated to the Go library or to RISC-V.

**Known build failures:** Issue [#1196](https://github.com/google/adk-go/issues/1196) documents that `adkgo deploy agentengine` hardcodes a `golang:1.25` builder image in its generated Dockerfile while `go.mod` requires `go 1.26.5`, causing `GOTOOLCHAIN=local` build failures. This is a Go-toolchain-version mismatch bug, architecture-agnostic (would fail identically on amd64/arm64/riscv64), and is not RISC-V-specific. No riscv64-specific build failure has ever been reported, because no one has been found to have attempted a riscv64 build.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Core library build (`go build ./...`) | Works (CI-verified) | Not CI-verified; no known reports of failure | Not CI-verified; no known reports of failure or success |
| Test suite (`go test -race`) | Works (CI-verified, `go.yml`) | Not CI-verified | Not CI-verified |
| `adkgo deploy cloudrun` | Works (hardcoded target) | Not supported | Not supported |
| `adkgo deploy agentengine` | Works (hardcoded target, modulo issue #1196) | Not supported | Not supported |
| Optional SQLite session backend (`glebarez/sqlite`) | Works | Works (per upstream `modernc.org/libc` arch files) | Structurally supported -- `modernc.org/libc` ships explicit `capi_linux_riscv64.go`, `ccgo_linux_riscv64.go`, `libc_musl_linux_riscv64.go`, and `modernc.org/sqlite` ships `lib/sqlite_linux_riscv64.go` -- but not independently hardware-tested in this research pass |

**Functional gaps:** The only concrete functional gap is the CLI's `adkgo deploy` subcommand, which cannot emit a riscv64 (or arm64) deployment artifact because it hardcodes `GOARCH=amd64` for both of its supported managed-cloud targets. This reflects Cloud Run's and Vertex AI Agent Engine's own amd64-only platform constraints, not a defect in adk-go's own portability.

**Performance gaps:** No SIMD exists in adk-go's own code to lose on riscv64 (Section 4), so there is no "missing vector path" performance gap at the library level. Transitively, `github.com/segmentio/asm` (SIMD-accelerated base64/sort/ASCII validation, pulled in via the modernc SQLite stack) has amd64/arm64 `.s` files only; on riscv64 every routine falls back to a generic Go implementation via the standard `_default.go` build-constraint pattern. This is a theoretical, unmeasured performance delta -- no benchmark data exists (Section 11).

**Security hardening gaps:** Data not available: no riscv64-specific security hardening documentation, CFI/PAC-equivalent feature discussion, or hardening advisory was found for adk-go or its dependency chain in this research pass.

**NaN / floating-point semantics issues:** Data not available: no floating-point or NaN-handling issue specific to riscv64 was found for adk-go. One transitive dependency test-timeout issue exists (`go-jose` [#112](https://github.com/go-jose/go-jose/issues/112), `TestOpaqueKeyRoundtripJWE` timing out on riscv64/armel/i386, closed as informational) but this is a performance/timeout characteristic of slower architectures under test, not a correctness or NaN semantics bug.

## 7. CI/CD Infrastructure

**No riscv64 CI exists.** This was directly verified by reading the full content of all workflow files, not inferred from absent search hits.

| File | Trigger | Jobs | Runner |
|---|---|---|---|
| `.github/workflows/apidiff.yml` | `pull_request` (main, v1) + `workflow_dispatch` | `apidiff` (API-compat check) | `ubuntu-latest` |
| `.github/workflows/go.yml` | `push` + `pull_request` (main, v1) + `workflow_dispatch` | `discover`, `test` (build + `go test -race`), `lint` | `ubuntu-latest` |
| `.github/workflows/nightly.yml` | `schedule` (cron `0 2 * * *`) + `workflow_dispatch` | `test`, `vulncheck` (`govulncheck`) | `ubuntu-latest` |
| `.github/actions/setup/action.yml` (composite, used by all three) | N/A | Sets up Go via `actions/setup-go` + build cache | N/A (no arch-specific logic) |

`grep -in "riscv\|risc-v"` against the decoded content of all four files returned zero matches. No `.gitlab-ci.yml`, `Jenkinsfile`, `.cirrus.yml`, `.travis.yml`, or `azure-pipelines.yml` exists at the repo root.

**RISE runners:** RISE announced free native riscv64 GitHub Actions runners, open to any repository with no allowlist, as of March 2026 (["Announcing the RISE RISC-V Runners"](https://riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github/)). As of this research (through 2026-08-14), adk-go has not adopted them; no workflow file references a riscv64 runner or the RISE runner infrastructure.

**Comparison table:**

| Dimension | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI runner | `ubuntu-latest` (all 8 jobs, all 3 workflows) | None | None |
| Cross-compile matrix entry | N/A (native) | None | None |
| QEMU emulation | Not used | Not used | Not used |
| RISE runner adoption | N/A | N/A | Not adopted |

## 8. Distribution and Release Status

**No official binaries exist for any architecture.** GitHub Releases for the 5 most recent tags checked (v1.6.0, v2.2.0, v2.1.0, v1.5.1, v2.0.0) all show `"assets":[]` -- verified via `gh api repos/google/adk-go/releases` and cross-checked with `--jq '.[] | {tag: .tag_name, assets: [.assets[].name]}'`, confirming empty asset lists across every tag. Only auto-generated `tarball_url`/`zipball_url` source archives exist.

| Channel | Status |
|---|---|
| PyPI (`pypi.org/pypi/adk-go/json`) | HTTP 404, package does not exist (expected -- adk-go is a Go package, not Python) |
| RISE wheel builder (`gitlab.com/api/v4/projects/56254198/packages/pypi/simple/adk-go/`) | Redirects to PyPI, which 404s; not present |
| Ubuntu 24.04 (noble) | "Sorry, your search gave no results"; not present |
| Debian tracker | HTTP 404; cross-checked via `packages.debian.org` search, "Sorry, your search gave no results"; not present |
| Arch Linux RISC-V (`archriscv.felixc.at`) | Directory listings for `/repo/core/`, `/repo/extra/`, `/repo/unsupported/` grepped directly; no `adk-go` package; substring false positives only (`adkey`, `adkit`, unrelated packages) |
| Go module proxy (`proxy.golang.org/google.golang.org/adk/@v/list`) | HTTP 200, versions v0.1.0-v2.2.0 present -- this is the actual and only distribution channel |

**What a user must do to get a working binary on riscv64:** Add `google.golang.org/adk/v2` to a Go module's `go.mod` (or run `go get google.golang.org/adk/v2`) and cross-compile with `GOOS=linux GOARCH=riscv64 go build`, using a stock Go >= 1.26.5 toolchain running on any host (cross-compilation does not require riscv64 hardware for the build step itself, only for execution/testing). No project-published riscv64 binary exists to download; there is nothing to "get" beyond source plus the standard Go toolchain.

## 9. Dependencies

adk-go itself has zero CGo and zero assembly. All riscv64 exposure comes from `go.mod` dependencies.

| Dependency | Role | riscv64 Build | riscv64 Test | riscv64 Release | Community/Notes |
|---|---|---|---|---|---|
| `google.golang.org/grpc` (grpc-go) | RPC transport for agent/tool/A2A communication | OK, pure Go, portable | Not CI-verified upstream | Source module | No open blocking issues found. See [reports/grpc.md](reports/grpc.md) for the C++ core (does not apply to grpc-go bindings) |
| `google.golang.org/protobuf` (protobuf-go) | Wire serialization | OK, pure Go, scalar fallback, no arch-specific code | Not CI-verified upstream for riscv64 specifically | Source module | Upstream C++ protobuf statements about riscv64 roadmap apply to the C++ implementation, not protobuf-go. See [reports/protocol-buffers.md](reports/protocol-buffers.md) |
| `go.opentelemetry.io/otel` + SDK/exporters | Tracing/metrics/logging | OK, pure Go | Cross-build CI matrix including `linux/riscv64` merged 2026-08-14 ([issue #8126](https://github.com/open-telemetry/opentelemetry-go/issues/8126)); build-only, no execution on real riscv64 hardware | Source module | See [reports/opentelemetry.md](reports/opentelemetry.md) |
| `github.com/glebarez/sqlite` + `github.com/glebarez/go-sqlite` | Optional CGo-free SQLite driver for `session/database` (used in a test file only per direct clone inspection: `session/database/service_test.go:21`) | OK, `modernc.org/libc` ships explicit `capi_linux_riscv64.go`, `ccgo_linux_riscv64.go`, `libc_musl_linux_riscv64.go`; `modernc.org/sqlite` ships `lib/sqlite_linux_riscv64.go` | No dedicated riscv64 test reports found; one open issue [#182](https://github.com/glebarez/go-sqlite/issues/182) is goreleaser-specific, not riscv64-specific | Source, CGo-free by design | None riscv64-specific open |
| `modernc.org/libc`, `modernc.org/sqlite`, `modernc.org/mathutil`, `modernc.org/memory` | Transitive CGo-free C-to-Go transpilation backing glebarez/sqlite | OK, explicit riscv64 arch files in libc and sqlite; mathutil/memory are fully portable (no arch-specific files) | Not independently verified on real riscv64 hardware in this research pass | Source module | None found |
| `golang.org/x/crypto` | TLS/JWT/hashing (transitively via go-jose, MCP SDK, gRPC creds) | OK, every performance-critical package (chacha20poly1305, salsa20, blake2b, argon2) ships `_generic.go`/`_ref.go`/`_noasm.go` fallback for non-amd64/arm64 architectures | Portable fallback only, not hand-optimized for riscv64 | Source module | 3 riscv64-tagged issues, all historical/closed |
| `golang.org/x/sys` | Low-level syscall/ABI bindings | OK, riscv64-specific files present (endian tagging, epoll padding fixes) | N/A (syscall constants) | Source module | 2 closed PRs already merged: [#38](https://github.com/golang/sys/pull/38) (endian tag), [#40](https://github.com/golang/sys/pull/40) (epoll_event padding fix) |
| `github.com/go-jose/go-jose/v4` | JWT/JOSE signing (via MCP go-sdk auth) | OK, pure Go | One known issue: `TestOpaqueKeyRoundtripJWE` times out on riscv64/armel/i386 per Debian buildd ([#112](https://github.com/go-jose/go-jose/issues/112), closed as informational, timeout/perf tuning, not a functional bug) | Source module | Closed, non-blocking |
| `github.com/segmentio/asm` | SIMD-accelerated base64/sort/ASCII validation (transitive, via segmentio/encoding, modernc stack) | OK by omission, only amd64/arm64 `.s` files exist; generic Go fallback selected on riscv64 | Untested but structurally safe (same pattern as x/crypto) | Source module | 0 riscv64 issues found |
| `github.com/cespare/xxhash/v2` | Fast hashing (transitive) | OK, `xxhash_other.go` build tag `(!amd64 && !arm64)` provides portable Go implementation | Portable fallback, not perf-optimized | Source module | 0 riscv64 issues found |
| `github.com/remyoudompheng/bigfft` | Fast big-integer FFT multiplication (via modernc.org/sqlite decimal/bigint math) | OK, no `.s` files, fully portable Go | Untested but structurally safe | Source module | 0 riscv64 issues found |
| `gorm.io/gorm` | ORM for session/database backend | OK, pure Go, no native code | Not independently verified | Source module | 0 riscv64 issues found |
| `google.golang.org/genai`, `github.com/openai/openai-go/v3`, `github.com/a2aproject/a2a-go`, `github.com/modelcontextprotocol/go-sdk`, `github.com/spf13/cobra`, `github.com/gorilla/mux`, `cloud.google.com/go/*` | Model/API clients, CLI, cloud SDKs | OK, pure Go HTTP/gRPC clients, no native code | N/A | Source module | 0 riscv64 issues found across all |

**Deep-dive, critical dependency (2-3 levels):** The heaviest transitive dependency chain is `github.com/glebarez/sqlite` -> `modernc.org/sqlite` -> `modernc.org/libc` (+ `modernc.org/mathutil`, `modernc.org/memory`). This chain was specifically adopted (PR [#379](https://github.com/google/adk-go/pull/379), merged 2025-12-03) to remove the previously-used `gorm.io/driver/sqlite`, a CGo-based driver that would have been the single biggest cross-architecture portability blocker. `modernc.org/libc` and `modernc.org/sqlite` both ship explicit `linux_riscv64.go` source files (level 1 and 2 of the chain); `mathutil` and `memory` have no arch-specific files at all and are portable by construction (level 2). No open riscv64 bug exists at any level of this chain.

## 11. Known Bugs and Active Issues

No riscv64-specific bugs exist. Exhaustive search (GitHub `gh search issues`/`gh search prs`, direct REST search API, GraphQL discussion search covering all 29 discussions, cross-repo global search, plus a positive control confirming search tooling functions correctly) found zero matches for "riscv," "riscv64," "risc-v," or "rv64" anywhere in issues, PRs, commits, code, or discussions.

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [#1238](https://github.com/google/adk-go/issues/1238) | `ParallelWorker`: fail-fast cancellation doesn't stop new items from being dispatched under `maxConcurrency` | Open | Correctness bug | Architecture-agnostic; reproduced by maintainer |
| [#1137](https://github.com/google/adk-go/issues/1137) | Data race: parallel `single_turn` dispatches of the same sub-agent write shared agent state | Open | Correctness bug (data race) | Architecture-agnostic |
| [#1076](https://github.com/google/adk-go/issues/1076) | Remote A2A task orphaned when parent task is cancelled before first remote event | Open | Correctness bug | Reported on macOS/arm64; architecture incidental to the bug |
| [#1196](https://github.com/google/adk-go/issues/1196) | `adkgo v2.1.0` deploy tooling hardcodes `golang:1.25` builder image while `go.mod` requires `go 1.26.5` | Open, active as of 2026-08-11 | Build/tooling bug | Reported on Linux/arm64; architecture-agnostic (Go toolchain version mismatch, not codegen) |
| [#561](https://github.com/google/adk-go/issues/561) | `inmemory` `State.All()` unlocked during map iteration causing "concurrent map iteration and map write" panic | Closed | Correctness bug (was) | Architecture-agnostic |

None of these five reference architecture-specific behavior; all are general concurrency or tooling bugs that would manifest identically on amd64, arm64, or riscv64.

**Correctness bugs highlighted separately:** #1238 (fail-fast race), #1137 (data race on shared agent state), and the closed #561 (unsynchronized map iteration panic) are genuine concurrency-correctness defects in the library. None has any riscv64 dimension; Go's memory model and race detector behave identically across architectures, so these bugs are not expected to differ in manifestation on riscv64 versus amd64/arm64.

## 12. Objections and Upstream Blockers

**Stated objections:** None exist. The topic of RISC-V support has never been raised in any issue, PR, discussion, or commit in the project's history.

**Technical blockers:** None identified. adk-go's own code has zero cgo, zero assembly, and zero unsafe usage; its heaviest transitive native-adjacent dependency (SQLite) was already made CGo-free before any RISC-V consideration entered the picture (PR #379, merged for unrelated architectural reasons). No dependency in the graph carries an open, riscv64-blocking issue (Section 9).

**Organizational blockers:** adk-go has no formal platform-support policy and no named maintainer group beyond a narrowly-scoped CODEOWNERS team for dependency files. The project explicitly defers cross-cutting design decisions to adk-python, meaning a riscv64-support proposal specific to adk-go might need cross-project alignment with the broader ADK effort rather than being resolvable unilaterally within this repository. `CONTRIBUTING.md`'s general policy requires opening an issue and getting maintainer alignment before "Large or Complex Changes" -- riscv64 CI addition would likely fall under this if pursued.

**Acceptance probability:** High, conditional on someone actually filing the proposal. There is no evidence of philosophical or technical resistance to RISC-V; the complete absence of engagement reflects that no one -- inside or outside Google -- has proposed it, not that it has been considered and rejected. Given (a) Google's own Premier Membership in RISE, (b) the already-cgo-free dependency graph, (c) the free RISE-hosted riscv64 GitHub Actions runners available since March 2026 with no allowlist, and (d) the project's youth and active maintenance cadence (pushed as recently as 2026-08-13), a well-formed PR adding a riscv64 build (not necessarily full test) job to `go.yml` faces low technical risk and no known organizational opposition. [NEEDS VERIFICATION: this assessment of low resistance is an inference from absence of contrary evidence, not a maintainer statement confirming willingness to accept such a PR.]

## 13. Investment Analysis

**RISE prior work check:** RISE has not funded or performed any adk-go-specific work. The only RISE artifact touching adjacent territory is the general "Advancing Go on RISC-V" toolchain effort (2025-04-04), which improves the Go compiler/runtime's riscv64 codegen broadly (benefiting every Go program including adk-go) but is not adk-go-specific. The RISE RISC-V Runners program (free native riscv64 GitHub Actions runners, since 2026-03-24) is directly usable by adk-go's maintainers at zero infrastructure cost but has not been adopted. No RISE grant, blog post, or wheel-builder listing references adk-go. Because adk-go ships no binary packages at all (source-only Go module), the RISE Python wheel builder is categorically inapplicable to this project.

### 13.1 Functional Enablement

No functional enablement work is required for the library itself. adk-go is expected to build and pass tests on riscv64 today, using the stock Go toolchain, with zero code changes, because it and its full dependency graph are cgo-free and assembly-free. The only functional gap is the `adkgo deploy` CLI subcommand's hardcoded `GOARCH=amd64`, which is irrelevant to riscv64 because Cloud Run and Vertex AI Agent Engine (its only two deploy targets) are themselves amd64-only managed services -- there is no riscv64 deploy target to enable even in principle.

### 13.2 Performance Optimization

No riscv64-specific performance optimization is applicable at the adk-go layer; the library contains no compute kernels or SIMD code to optimize. Any performance work would occur at the Go toolchain level (already RISE's ongoing scope) or in transitive dependencies with `.s` files that lack riscv64 fallbacks with equivalent performance to amd64/arm64 (e.g., `segmentio/asm`), which is out of scope for an adk-go-specific investment.

### 13.3 CI/CD Infrastructure

The concrete, actionable investment opportunity is adding a riscv64 build job to `.github/workflows/go.yml`, using RISE's free native riscv64 GitHub Actions runners (available since 2026-03-24, no allowlist required). This would need to: (a) add a matrix entry or separate job targeting a RISE-provided riscv64 runner label, (b) run at minimum `go build ./...` and ideally `go test ./...` (excluding `-race`, since the race detector's riscv64 support should be separately confirmed [NEEDS VERIFICATION: race detector riscv64 support was not verified in this research pass]), and (c) surface failures without blocking merges initially (non-required check) until confidence is established.

### 13.4 Ecosystem Enablement

Not applicable. adk-go ships no binary packages, wheels, or OS-distro packages; there is no downstream package ecosystem to enable on riscv64 beyond the Go module system itself, which already resolves riscv64 builds transparently via the standard toolchain.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| CI/CD | Add riscv64 build-only job to `go.yml` using RISE runners | 0.5-1 | External contributor or Google maintainer | Medium |
| CI/CD | Extend riscv64 job to `go test ./...` (verify race detector behavior first) | 0.5-1 | External contributor or Google maintainer | Low |
| Functional | Verify `github.com/glebarez/sqlite` session backend on real riscv64 hardware | 0.5 | External contributor | Low |
| Functional | None required for core library (already cgo-free, assembly-free) | 0 | N/A | N/A |
| Organizational | File a tracking issue per `CONTRIBUTING.md`'s "Large or Complex Changes" policy before CI work begins | 0.1 | External contributor | Medium (prerequisite/gating step for the above) |

Total estimated effort to establish basic riscv64 CI confidence: approximately 1-2 person-weeks, almost entirely CI configuration and verification rather than code changes, reflecting that no code-level porting work exists to be done.

## 14. Updates

(No updates yet -- initial report dated 2026-06-17.)

## 15. References

- [google/adk-go GitHub repository](https://github.com/google/adk-go)
- [ADK documentation homepage](https://google.github.io/adk-docs/)
- [adk-go PR #379 - CGO-independent SQLite driver](https://github.com/google/adk-go/pull/379)
- [adk-go issue #1196](https://github.com/google/adk-go/issues/1196)
- [adk-go issue #1238](https://github.com/google/adk-go/issues/1238)
- [adk-go issue #1137](https://github.com/google/adk-go/issues/1137)
- [adk-go issue #1076](https://github.com/google/adk-go/issues/1076)
- [adk-go issue #561](https://github.com/google/adk-go/issues/561)
- [RISE Project Blog - Advancing Go on RISC-V: Progress Through the RISE Project](https://riseproject.dev/2025/04/04/advancing-go-on-risc-v-progress-through-the-rise-project/)
- [RISE Project Blog - Announcing the 2025 AI RISC-V Gemini Credit Recipients](https://riseproject.dev/2025/12/17/announcing-the-2025-ai-risc-v-gemini-credit-recipients/)
- [RISE Project Blog - RISE RISC-V Runners: Six Weeks In](https://riseproject.dev/2026/05/12/rise-risc-v-runners-six-weeks-in/)
- [RISE Project Blog - Announcing the RISE RISC-V Runners](https://riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github/)
- [go-jose issue #112 - riscv64 test timeout](https://github.com/go-jose/go-jose/issues/112)
- [glebarez/go-sqlite issue #182](https://github.com/glebarez/go-sqlite/issues/182)
- [golang/sys PR #38 - riscv64 endian tag](https://github.com/golang/sys/pull/38)
- [golang/sys PR #40 - epoll_event padding fix](https://github.com/golang/sys/pull/40)
- [open-telemetry/opentelemetry-go issue #8126](https://github.com/open-telemetry/opentelemetry-go/issues/8126)
- [Go module proxy listing for google.golang.org/adk](https://proxy.golang.org/google.golang.org/adk/@v/list)
- [PyPI package page for adk-go (404, not present)](https://pypi.org/pypi/adk-go/json)
- [Debian package tracker for adk-go (404, not present)](https://tracker.debian.org/pkg/adk-go)
- [Arch Linux RISC-V port status page](https://archriscv.felixc.at/)
- Internal cross-reference: [reports/grpc.md](reports/grpc.md)
- Internal cross-reference: [reports/protocol-buffers.md](reports/protocol-buffers.md)
- Internal cross-reference: [reports/opentelemetry.md](reports/opentelemetry.md)