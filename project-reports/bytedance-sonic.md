---
title: bytedance/sonic
parent: Project Reports
color: orange
dependencies:
  - name: Go
    relation: build-dependency
    criticality: critical
  - name: klauspost/cpuid
    relation: runtime-dependency
    criticality: critical
  - name: cloudwego/base64x
    relation: runtime-dependency
    criticality: critical
  - name: twitchyliquid64/golang-asm
    relation: runtime-dependency
    criticality: optional
  - name: golang.org/x/arch
    relation: runtime-dependency
    criticality: optional
  - name: golang.org/x/sys
    relation: runtime-dependency
    criticality: optional
  - name: QEMU
    relation: test-dependency
    criticality: optional
---

{% include dependency-graph.html slug="dependencies" subset="bytedance-sonic" %}

# bytedance/sonic

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-11-17<br/>
**Readiness:** orange (optimization-absent)<br/>
**Optimization level:** absent<br/>
**Scope:** RISC-V (riscv64/linux) support status for bytedance/sonic<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

[bytedance/sonic](https://github.com/bytedance/sonic) is a Go JSON library. Its speed comes from amd64 AVX2/SSE native code and a JIT, and from arm64 NEON native code and a JIT. The native code is generated from C sources in `native/` through asm2asm/clang. The license is Apache-2.0.

Governance is single-company. The repository is ByteDance-owned. No foundation membership was found. There is no MAINTAINERS, OWNERS, CODEOWNERS, PLATFORMS.md or SUPPORT.md file. CONTRIBUTING.md requires git-flow, Conventional Commits and an issue-first PR flow.

Maintainers (from commit emails, 610 commits): liuq19 merges nearly all recent commits. Yi Duan, chenzhuoyu and others are also ByteDance. Since 2025-01-01, 78 of about 98 commits come from bytedance.com addresses. Huawei (hanchao, about 14 commits) contributed the arm64 JIT and SVE work in December 2025. Baidu (zhangming12) has 7 commits.

RISE: sonic is not a RISE project. The [RISE members page](https://riseproject.dev/members/) lists "Douyin Vision Co., Ltd." (bytedance.page) as a General Member. The relationship to ByteDance is not confirmed.

Community stance on new ports: third-party arm64 work was accepted (Huawei, December 2025; a gitcode contributor added the asm2arm tool; merged to main 2026-05-13). No public RISC-V interest beyond three PRs was found. A native riscv64 port would need maintainer buy-in, because the native code is generated from C via asm2asm/clang.

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2025-04-15 | Commit 1e6d4fd "add rv64 support" adds `internal/rt/asm_riscv64.s`. The date is odd next to PR #958's 2026-06-26 creation date. [NEEDS VERIFICATION] | [commit](https://github.com/bytedance/sonic/commit/1e6d4fda9a6124f916c2f8a6ad90c4cf56365555) |
| 2026-06-26 | PR #958 (BoyaoWang430) opened and closed unmerged the same day | [PR #958](https://github.com/bytedance/sonic/pull/958) |
| 2026-06-26 | PR #959 (liuq19) opened. First version used RISE `ubuntu-24.04-riscv` runners (Go 1.25) | [PR #959](https://github.com/bytedance/sonic/pull/959) |
| 2026-06-26 | Commits 1acb09d (RISE-runner workflow) and f001568 (go1.22 riscv64 test) | [1acb09d](https://github.com/bytedance/sonic/commit/1acb09dcc7b0a01e1e88cca8740f3474be733278), [f001568](https://github.com/bytedance/sonic/commit/f0015681aac09881fd4a718c44a0844e5d5f06fc) |
| 2026-07-29 | PR #959 commit b921ae1 "ci: add RISC-V QEMU compile and smoke tests" | [PR #959](https://github.com/bytedance/sonic/pull/959) |
| 2026-10-16 | PR #998 opened (riscv64 `found bad pointer in Go heap` fix) | [PR #998](https://github.com/bytedance/sonic/pull/998) |
| 2026-10-20 | PR #998 merged by liuq19 | [PR #998](https://github.com/bytedance/sonic/pull/998) |
| 2026-10-26 | PR #959 commit 6eb5028 merges main | [PR #959](https://github.com/bytedance/sonic/pull/959) |
| 2026-10-27 | v1.15.5 released; its notes list #998 | [releases](https://github.com/bytedance/sonic/releases) |
| 2026-11-06 | PR #959 last updated, still open, `mergeable_state` blocked | [PR #959](https://github.com/bytedance/sonic/pull/959) |

Key contributors: liuq19 (ByteDance, sole maintainer actor on riscv64 work) and BoyaoWang430 (external, #958). No human reviewer commented on any of the three PRs; only bots (Copilot, Codex, Codecov, CLA assistant) did.

Fully upstream? No. riscv64 works only through the existing `encoding/json` fallback. No native riscv64 code exists. Only the GC fix (#998) is merged. The CI PR (#959) is open.

First riscv commit on main: none. `git log --grep` for riscv, risc-v and rv64 on a clone with all refs found nothing. No RISC-V issue exists.

Discrepancy: one listing shows a merge commit `47b1052c3f740092e1a6456c8f5f0366d88ccb59` for #958, but the GitHub API reports `merged: false` and the head commit is on the contributor's fork. Treat #958 as unmerged.

## 3. Upstream Support Tier

There is no formal tier policy. Support is defined by build tags and CI. The README states "CPU: AMD64 / (ARM64, need go1.20 above)". riscv64 is not listed.

Build tags: amd64 (go1.17+) and arm64 (go1.20+) get the JIT/native path, `(amd64 && go1.17 && !go1.28) || (arm64 && go1.20 && !go1.28)`. Everything else, including riscv64, compiles the fallback, `(!amd64 && !arm64) || go1.28 || !go1.17 || (arm64 && !go1.20)`.

| Aspect | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Native/SIMD path | Yes (AVX2/SSE) | Yes (NEON, go1.20+) | None |
| JIT | Yes | Yes (added December 2025, commit cf05f5f) | None |
| CI on main | test-x86, compatibility, fuzzing, benchmark | test-arm64, compatibility | None |
| Official binaries | Go source only | Go source only | Go source only |
| Listed in README | Yes | Yes (go1.20+) | No |

## 4. Technical Architecture and RISC-V-Specific Subsystems

riscv64 has no native implementation at all (checked at commit 4640e45). `find -name '*riscv*'` returns nothing. `riscv` appears only in the GOARCH-name list in `tools/asm2arm/arm.py`, which is not a RISC-V backend. No code for `riscv`, `riscv64`, `rvv` or `vfloat32m1_t` exists. No RVV, Zba or Zbb use exists. Whether any `//go:build riscv64` tags exist is unknown. [NEEDS VERIFICATION]

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| SIMD parsing, skip, validation (`native/*.c` compiled to asm) | Hand-tuned reference, machine-translated asm | NEON asm in `internal/native/neon/` | Missing |
| JIT decoder and encoder | Yes | Yes | Missing |
| Number conversion (`f64toa`, `i64toa`, `vnumber`) | Native asm | Native asm | Missing |
| `MoreStack` / `internal/rt` | `asm_amd64.s` | arm64 files | Scalar: generic `asm_compat.s` stub (`!noasm,!amd64`) |
| Public APIs (decoder, encoder, AST, utf8, unquote) | Sonic code | Sonic code | `encoding/json` fallback, not sonic code |

File counts: 68 files named `*amd64*`, about 70 named `*arm64*` (23 `.s` files, nearly all in `internal/native/neon/`), 0 for riscv64.

Fallback files used by riscv64: `compat.go`, `ast/api_compat.go`, `decoder/decoder_compat.go`, `encoder/encoder_compat.go`, `internal/encoder/alg/spec_compat.go`, `unquote/unquote_fallback.go`, `utf8/utf8_fallback.go`, `internal/compat/warn.go`. `compat.go` sets `apiKind = UseStdJSON`, and `Pretouch` does nothing.

GC barrier-related issue: the fallback scanners created a one-past-the-end `unsafe.Pointer`. See Section 11 (#998).

## 5. Build System, Cross-Compilation, and Toolchain

Sonic is pure Go. There is no CMake, Dockerfile, configure script or build documentation for riscv64. No BUILDING.md, INSTALL or cross-compilation doc exists. `go.mod` declares `go 1.18`. The README says Go 1.24.0 is not supported (golang/go#71672); use a newer Go or `-ldflags="-checklinkname=0"`. No C toolchain is needed for the fallback.

Observed build state on `main` (clone at 4640e45):
- The root package builds with `GOARCH=riscv64 go build .`.
- `GOARCH=riscv64 go build ./...` fails. `internal/decoder/api` imports `internal/native`, and all its Go files are excluded by build constraints (dispatch files exist only for amd64 and arm64). Output was cut at the first error, so other failing packages are not known. Per-package builds are not verified.
- PR #958 reported `internal/rt/fastmem.go:145:6: missing function body`. On `main`, `internal/rt/asm_compat.s` supplies the `MoreStack` stub, so #958's file is not needed. That `main` state was verified from the clone; the reason #958 was closed is not recorded.

Commands (inferred from standard Go tooling, not from repo docs; not confirmed):

    GOOS=linux GOARCH=riscv64 go test -c .
    qemu-riscv64 ./sonic.test -test.v

The existing `scripts/qemu.sh` is amd64 only. It builds QEMU 6.2.0 and runs `qemu-x86_64 -cpu max ./sonic.test -test.v`.

Under QEMU, PR #959 runs Go 1.22.12 and Go 1.26.5. `-race` on linux/riscv64 needs Go 1.26 (review thread by copilot-pull-request-reviewer on #959). PR #998 used QEMU 8.2.2 with Go 1.26.9 and 1.27.2.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Sonic decoder/encoder | Yes | Yes | No, `encoding/json` |
| JIT | Yes | Yes | No |
| `Pretouch` | Effective | Effective | No-op |
| SIMD skip/validate | Yes | Yes | No |
| Root package builds | Yes | Yes | Yes |
| `go build ./...` | Yes | Not stated | Fails (see Section 5) |

Functional gaps: sonic-specific behavior is absent on riscv64. Example: PR #998 skipped the native-only `UseUnicodeErrors` assertion when the build uses the `encoding/json` fallback, so semantics differ from the native path.

Performance gaps: Data not available. No riscv64 benchmark figures are published. The [OpenBenchmarking page](https://openbenchmarking.org/test/pts/sonicjson-1.0.0) has no numbers. By construction, riscv64 gets `encoding/json` performance, so sonic's speedup does not apply.

Reference data from other architectures (not riscv64): PR #645 (merged 2024-07-08) reports that the new non-JIT arm64 decoder/encoder runs about 1.7x JIT on Unmarshal/Interface and 1.0x on Unmarshal/Concrete, and 0.7x and 0.6x on Marshal/Interface and Marshal/Concrete. Geomean decoder time dropped 34.88% versus main on the amd64 run. n=5, benchstat, Intel Xeon Platinum 8260. Issue #786: the maintainer stated arm64 JIT was missing (April 2025) and decoding on ARM is "very close to x86". This is [NEEDS VERIFICATION] for riscv64 relevance.

Security hardening gaps: Data not available.

NaN / floating-point semantics: Data not available.

## 7. CI/CD Infrastructure

No riscv64 CI exists on `main`. All files in `.github/workflows` at commit 4640e45 were checked (`benchmark.yml`, `compatibility_test-windows.yml`, `compatibility_test.yml`, `fuzzing.yml`, `lint.yml`, `test-arm64.yml`, `test-x86.yml`, `.ignore_words`). A case-insensitive grep for riscv, risc-v and qemu found nothing. No `.gitlab-ci.yml`, `Jenkinsfile` or `.cirrus.yml` exists. All workflows trigger only on `pull_request`.

| Aspect | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Workflow | `test-x86.yml`, `compatibility_test.yml` | `test-arm64.yml`, `compatibility_test.yml` | None on main |
| Runners | ubuntu-latest, windows-latest, macos-15-intel | ubuntu-24.04-arm, macos-15 | None (PR #959: ubuntu-24.04 with QEMU) |
| Go versions | 1.18, 1.21, 1.25, 1.27.0-rc.2 (test-x86) | 1.18 to 1.25 plus 1.27.0-rc.2 (compat) | PR #959: 1.22.12 and 1.26.5 (`-race`) |
| Native hardware | Yes | Yes | No |

PR #959 (open) adds `.github/workflows/test-riscv64.yml` (110 lines): `ubuntu-24.04`, `docker/setup-qemu-action@v4`, `riscv64/ubuntu:24.04` container. The compile step runs `go test -run "^$"` on about 20 packages plus `./issue_test` and `./generic_test`. The test step runs only `TestCompat(UnmarshalStd|MarshalStd|EncoderStd|DecoderStd)`. The stated reason for skipping the full suite is that stress tests such as `ast.TestGC_Encode` are too slow under QEMU. The PR says native validation would still need a RISC-V runner. Its two outdated unresolved Codex review threads asked to drop `-race` for Go 1.25 and to exclude native-only internal packages. The earlier draft used RISE `ubuntu-24.04-riscv` runners; the current one does not. The reason for the switch is stated as avoiding dependence on the RISE self-hosted runner GitHub App.

RISE: no confirmed use of RISE runners and no RISE funding for sonic. The [RISE runners announcement](https://riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github/) (2026-03-24) was not fetched in full and is not known to mention sonic. No RISE blog post mentions sonic.

## 8. Distribution and Release Status

No riscv64 binary or package was found in any channel:
- Project graph (Ubuntu resolute riscv64): empty. PyPI: HTTP 404 (not applicable; Go library).
- Ubuntu 26.04 has no bytedance/sonic package. The `sonic`/`libsonic*` packages are unrelated speech-synthesis software.
- Arch RISC-V: inconclusive (page may render with JavaScript).
- GitHub releases (v1.15.5, loader/v0.5.3, v1.15.4): release assets are unknown; notes mention no riscv64 build. v1.15.5 (2026-10-27) notes list #998.
- Go module proxy: `@latest` is v1.15.5, source only.
- A Debian package `golang-github-bytedance-sonic-dev` was not queried. It would be an architecture-independent source package.

To get a working build: `go get` the module and build with `GOARCH=riscv64`. Only the `encoding/json` fallback runs. Build the root package, not `./...`.

## 9. Dependencies

Manifest `go.mod` also lists bytedance/gopkg v0.1.3, bytedance/sonic/loader v0.5.3, davecgh/go-spew and stretchr/testify (test only). None of the Go modules has a `-dev` package for riscv64 in Ubuntu 26.04 under the guessed names (graph: not found). Go modules are built from source, so this does not block `go build`.

| Name | Role | riscv64 build | riscv64 test | riscv64 release | Community |
|---|---|---|---|---|---|
| Go | build-dependency, critical | Supported (the compiler targets riscv64; see [project-reports/go.md](project-reports/go.md)). Sonic needs 1.18+ in `go.mod` | PR #959 uses 1.22.12 and 1.26.5 under QEMU | Not checked here | Listed in projects.yml with a report |
| klauspost/cpuid | runtime-dependency, critical (v2.2.9) | Likely yes: issue #158 "Support RISC-V" closed as completed 2026-06-16; the fix is unconfirmed [NEEDS VERIFICATION] | Unknown | Unknown | No report |
| cloudwego/base64x | runtime-dependency, critical (v0.1.6) | Unknown. amd64 asm implies a pure-Go fallback is needed (inferred, not checked) | Unknown | Unknown | No riscv64 status found |
| twitchyliquid64/golang-asm | runtime-dependency, optional (v0.15.1) | Unknown. Old fork of the Go assembler; not checked | Unknown | Unknown | No riscv64 status found |
| golang.org/x/arch | runtime-dependency, optional (2021 pseudo-version) | Unknown | Unknown | Unknown | Unknown |
| golang.org/x/sys | runtime-dependency, optional | Supported (riscv64 files exist) | Unknown | Unknown | See [project-reports/golang-org-x-sys.md](project-reports/golang-org-x-sys.md) |
| QEMU | test-dependency, optional | Not applicable | Used by PR #959 (docker/setup-qemu-action@v4); #998 used QEMU 8.2.2; `scripts/qemu.sh` builds 6.2.0 for amd64 | Not applicable | Emulation only, no native hardware |
| bytedance/gopkg | Utility library | Pure Go (assumed) | Unknown | Unknown | Unknown |
| bytedance/sonic/loader | JIT code loader | Unknown | Unknown | Unknown | Unknown |

Deep dive: the dependencies tied to numerics, SIMD or JIT are cloudwego/base64x, golang-asm and loader. All have unknown riscv64 status. Because the fallback path avoids the JIT, golang-asm and loader are likely not exercised on riscv64 [NEEDS VERIFICATION]. Whether the root package imports base64x or cpuid on riscv64 builds was not checked. cpuid must at least compile.

## 11. Known Bugs and Active Issues

No riscv64 issue exists on GitHub (searches for `riscv`, `riscv64` and "risc-v rv64 RISC-V support" found no real hits). Discarded as not RISC-V: #405 (linux/arm int overflow, closed), #78 (no AVX2 SIGILL, closed), #538 (loong64 build error, closed), #227 (Apple M1, closed).

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [#998](https://github.com/bytedance/sonic/pull/998) | fix(ast): avoid GC-visible end pointers in fallback scanners | Merged 2026-10-20, in v1.15.5 | High (runtime fatal error) | Correctness bug, see below |
| [#959](https://github.com/bytedance/sonic/pull/959) | ci: add RISC-V QEMU compile and smoke tests | Open, blocked | Medium | CI only. Blocking reason unknown (branch protection and checks not inspected) |
| [#958](https://github.com/bytedance/sonic/pull/958) | fix(rt): support riscv64 fallback build | Closed unmerged | Low | `MoreStack` stub; `main` has `asm_compat.s` |
| [#970](https://github.com/bytedance/sonic/issues/970) | arm64 CPU-profiling "traceback stuck" crash | Open | Not riscv64 | Native-code unwinding; unlikely to apply to riscv64 |

Correctness bug (fixed): on linux/riscv64, `found bad pointer in Go heap`. Cause: a one-past-the-end `unsafe.Pointer` from `rt.IndexChar(src, len(src))` stayed live across a GC safe point after inlining. The fix derives start and end scan addresses from the string base with `uintptr` arithmetic. Files: `ast/decode.go`, `internal/utils/skip.go`, `ast/decode_gc_test.go`, `api_test.go` (+102/-17). Validation under QEMU 8.2.2:

| Go | Unpatched | Patched |
|---|---|---|
| 1.26.9 | 20/20 failed | 20/20 passed |
| 1.27.2 | 20/20 failed | 20/20 passed |

A Codex P1 review thread noted the same pattern when `pos == len(src)` (for example `ast/search.go:_ValidSyntax`); it is resolved, and the final body says start addresses are also derived from the base pointer. Codecov reported 76% patch coverage. Release mapping to v1.15.5 is inferred from dates and the release notes, and the tag content was not confirmed.

The original report that this class of bug has similar sites elsewhere in the fallback code is not made; other occurrences were not audited. Floating-point issues: none found.

## 12. Objections and Upstream Blockers

- Stated objections: none found. No maintainer comment on any riscv64 PR; only bot comments.
- Technical blockers for native work: native code is generated from C through asm2asm/clang for amd64/arm64 only. There is no riscv64 dispatch file in `internal/native/`. A riscv64 port would require a new backend and generator support (inference from the repo structure, not a stated maintainer position).
- `go build ./...` fails on riscv64 (Section 5); #959 review threads flagged this and the threads remain unresolved but outdated.
- Organizational: single-company governance, issue-first PR rule. The sole active riscv64 contributor is liuq19. #958 was closed without a recorded reason.
- Acceptance probability: Data not available. The maintainer has himself authored the CI PR and the GC fix, which indicates acceptance of fallback-level support. No evidence on native ports. The arm64 precedent shows third-party ports are accepted.

## 13. Readiness Assessment

- **Color:** orange (optimization-absent)
- **Release provider:** none
- **Optimization level:** absent. Scalar fallback only: no riscv64 native/SIMD/JIT code, and it falls back to `encoding/json`, so sonic's speedup does not apply.
- Operations lacking RISC-V implementations: SIMD parsing, skip and validation, number conversion, the JIT decoder and encoder, and quote/unquote native code. Extensions that would be relevant to a native port: RVV (vector). Zba and Zbb are also candidates for scalar bit operations. [NEEDS VERIFICATION]: no sonic-side work on any extension exists. A separate repository, sonic-cpp, has [PR #141](https://github.com/bytedance/sonic-cpp/pull/141) "riscv: use zbb support riscv" (merged 2026-07-17 state unconfirmed). It is not sonic.

Justification: there is no riscv64 CI on main. All workflows in [.github/workflows](https://github.com/bytedance/sonic/tree/main/.github/workflows) are x86/arm64 only, and no distro or upstream riscv64 artifact exists, so the primary grade is orange. Sonic's value is JSON speed via amd64 AVX2/SSE and arm64 NEON/JIT. riscv64 has zero native code and only runs through the `encoding/json` fallback (compat.go), so the optimization cap is also orange. It is not red: the root package builds and the fallback works (a riscv64 GC bug was fixed in [PR #998](https://github.com/bytedance/sonic/pull/998), released in v1.15.5).

Pending work: open [PR #959](https://github.com/bytedance/sonic/pull/959) (liuq19, ByteDance maintainer) adds a QEMU-based riscv64 workflow: compile-only for most packages, runs only 4 TestCompat* fallback tests, Go 1.22.12 and 1.26.5 `-race`. If merged it would give build plus partial smoke tests, still on emulation, and would not change the optimization cap. An earlier draft used RISE ubuntu-24.04-riscv runners, but the current one does not. PR #958 (asm stub for MoreStack) closed unmerged; main already has asm_compat.s. No native riscv64 work or tracking issue exists. `GOARCH=riscv64 go build ./...` fails because `internal/decoder/api` imports `internal/native`, which has no riscv64 files.

## 14. Investment Analysis

RISE check: no RISE funding or runner use for sonic was found. RISE has a free [RISC-V runners service](https://github.com/riseproject-dev/riscv-runner) (announced 2026-03-24) that could supply native hardware. The effort figures below are my estimates, not from the research findings.

### 14.1 Functional Enablement
Make `go build ./...` pass on riscv64 (build constraints around `internal/decoder/api` and `internal/native`), and audit other fallback code for GC-visible end pointers like the one fixed in #998. Support in #959 and #998 already covers the root package smoke path. Do not size #958 (not needed on main).

### 14.2 Performance Optimization
A native riscv64 backend (RVV and scalar bit-manipulation extensions) means a riscv64 target in the asm2asm/C pipeline plus dispatch and a decision on JIT. No upstream design exists, and the maintainers have not been engaged. Benchmarks first: no riscv64 baseline exists, so measure the `encoding/json` fallback on hardware before sizing a port.

### 14.3 CI/CD Infrastructure
Land and extend #959. Add a native-hardware job on RISE runners (a prior draft already targeted `ubuntu-24.04-riscv`). Add a push or schedule trigger, since all workflows run only on `pull_request`.

### 14.4 Ecosystem Enablement
Verify riscv64 builds and tests of cpuid, base64x, golang-asm and x/arch (all unknown). Section 10 is omitted: no dependent package ecosystem that must be enabled on riscv64 applies.

### 14.5 Summary Table
| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Fix `go build ./...` on riscv64; audit fallback for GC-pointer bugs | 1-2 | Sonic maintainers / contributor | High |
| Functional | Verify riscv64 build and test of base64x, cpuid, golang-asm, x/arch | 1-2 | Contributor | High |
| Performance | Benchmark fallback on native riscv64 hardware | 1 | Contributor | Medium |
| Performance | Native riscv64 backend (RVV, bit-manip) with upstream design issue | 20+ (rough estimate) | Contributor with maintainer buy-in | Low until demand shown |
| CI/CD | Merge #959, add native RISE-runner job and push/schedule trigger | 1-2 | liuq19 / contributor | High |

## 15. References

- [bytedance/sonic repository](https://github.com/bytedance/sonic)
- [Workflows directory](https://github.com/bytedance/sonic/tree/main/.github/workflows)
- [PR #958](https://github.com/bytedance/sonic/pull/958)
- [PR #959](https://github.com/bytedance/sonic/pull/959)
- [PR #998](https://github.com/bytedance/sonic/pull/998)
- [PR #645 (aarch64)](https://github.com/bytedance/sonic/pull/645)
- [Issue #405](https://github.com/bytedance/sonic/issues/405)
- [Issue #78](https://github.com/bytedance/sonic/issues/78)
- [Issue #538](https://github.com/bytedance/sonic/issues/538)
- [Issue #970](https://github.com/bytedance/sonic/issues/970)
- [Issue #786](https://github.com/bytedance/sonic/issues/786)
- [Commit 1e6d4fd](https://github.com/bytedance/sonic/commit/1e6d4fda9a6124f916c2f8a6ad90c4cf56365555)
- [Commit 1acb09d](https://github.com/bytedance/sonic/commit/1acb09dcc7b0a01e1e88cca8740f3474be733278)
- [Commit f001568](https://github.com/bytedance/sonic/commit/f0015681aac09881fd4a718c44a0844e5d5f06fc)
- [sonic releases](https://github.com/bytedance/sonic/releases)
- [RISE members](https://riseproject.dev/members/)
- [RISE RISC-V Runners announcement](https://riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github/)
- [riseproject-dev/riscv-runner](https://github.com/riseproject-dev/riscv-runner)
- [sonic-cpp PR #141](https://github.com/bytedance/sonic-cpp/pull/141)
- [OpenBenchmarking sonicjson](https://openbenchmarking.org/test/pts/sonicjson-1.0.0)
