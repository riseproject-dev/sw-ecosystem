---
title: golang.org/x/crypto
parent: Project Reports
color: orange
dependencies:
  - name: Go
    relation: build-dependency
    criticality: critical
  - name: golang.org/x/sys
    relation: runtime-dependency
    criticality: critical
  - name: golang.org/x/term
    relation: runtime-dependency
    criticality: optional
  - name: golang.org/x/net
    relation: runtime-dependency
    criticality: optional
---

{% include dependency-graph.html slug="dependencies" subset="golang-org-x-crypto" %}

# golang.org/x/crypto

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-10-30<br/>
**Readiness:** orange<br/>
**Scope:** RISC-V (riscv64/linux) support status for golang.org/x/crypto<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

golang.org/x/crypto is the Go project's supplementary cryptography module. Its [repository](https://go.googlesource.com/crypto) and [pkg.go.dev page](https://pkg.go.dev/golang.org/x/crypto) describe it as holding supplementary Go cryptography packages. The master tree has 32 package directories, including `chacha20`, `sha3`, `blake2b`, `curve25519`, `ssh`, `bcrypt` and `argon2`. The top level has only `.gitattributes`, `.gitignore`, `codereview.cfg`, `CONTRIBUTING.md`, `go.mod`, `go.sum`, `LICENSE`, `PATENTS` and `README.md`. There is no C code, no CMake or configure system, no Makefile and no Dockerfile.

- **Language and toolchain:** Pure Go plus Go-assembler (`.s`) kernels. `go.mod` declares `go 1.26.0`.
- **License:** BSD-3-Clause, with a separate PATENTS file.
- **Governance:** Data not available: the repo has no MAINTAINERS or OWNERS file, and the README and CONTRIBUTING.md name no maintainer roster. Code review is on Gerrit. Issues go to the main Go tracker with the prefix "x/crypto:" (`codereview.cfg` contains `issuerepo: golang/go`). The README says cryptography contributions get extra scrutiny and may take longer to review.
- **Foundation:** None. x/crypto is a Go team repository under Google. The [RISE members page](https://riseproject.dev/members/) lists Google as a Premier member, but it does not list Go or x/crypto as a RISE project.
- **Contributors by commit activity (inferred, not an official roster) [NEEDS VERIFICATION]:**
  - Go team and Google: Roland Shoemaker, Filippo Valsorda (independent since leaving Google), Neal Patel, Michael Pratt, Brad Fitzpatrick, and the Gopher Robot bot. There are also 13 commits from google.com addresses since 2024.
  - Independents: Nicola Murino (about 76 commits since 2025, mostly ssh), Daniel McCarney and Sean Liao.
  - Other companies: Loongson (11 commits from loongson.cn since 2024, for example the blake2s loong64 SIMD change) and IBM (3 commits, likely s390x/ppc64).
- **Dependents count:** Data not available: no source gave a dependents count for x/crypto.
- **Culture on new ports:** There is no x/crypto-specific policy. The [Go porting policy](https://go.dev/wiki/PortingPolicy) applies to GOOS/GOARCH ports. Go accepts new ports conditionally: the upkeep must be justified, and the port needs named maintainers and a builder. For x/crypto, assembly for a new architecture arrives as ordinary Gerrit contributions from outside companies, as with the Loongson and ISCAS changes.

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2018-09-06 | golang/go #27532 "all: port to RISC-V" opened. CL 133735 "unix: add support for linux/riscv64" linked the same day. | [#27532](https://github.com/golang/go/issues/27532) |
| 2020-01-19 | golang/go #36641 "all: add cgo support to the riscv port" opened. | [#36641](https://github.com/golang/go/issues/36641) |
| 2020-08-31 | #27532 closed. Experimental support arrived in Go 1.14 and stability improved in Go 1.15. | [#27532](https://github.com/golang/go/issues/27532) |
| 2020-10-16 | CL 257917 added a linux-riscv64 builder to the dashboard. | [#27532](https://github.com/golang/go/issues/27532) |
| 2020-11-03 | #36641 closed (commit 393f2bb). cgo on linux/riscv64 was documented for Go 1.16. | [#36641](https://github.com/golang/go/issues/36641) |
| Go 1.21 | linux-riscv64 binaries published on go.dev/dl. | [RISE post](https://riseproject.dev/2025/04/04/advancing-go-on-risc-v-progress-through-the-rise-project/) |
| 2025-04-04 | RISE post on RP001 "Accelerate the Go Runtime on RISC-V". It covers the standard library `crypto` (md5, sha256, sha512) and does not mention x/crypto. | [RISE post](https://riseproject.dev/2025/04/04/advancing-go-on-risc-v-progress-through-the-rise-project/) |
| 2025-10-27 | golang/go #76065 (RISC-V optional-extension flag proposal) opened. Still open. | [#76065](https://github.com/golang/go/issues/76065) |
| 2026-01-23 | Gerrit CL 738760 (poly1305 riscv64 assembly) created. | [Gerrit](https://go-review.googlesource.com/c/crypto/+/738760) |
| 2026-01-24 | Commit 5ed4944 authored. A full-history `git log -S riscv64` finds it as the first x/crypto commit mentioning riscv64. | [commit](https://go.googlesource.com/crypto/+/5ed494470b06afb7621b303b04e38366d5863942) |
| 2026-01-27 | golang/go #77328 (Zvkned assembler support) opened. Still open. | Research findings (issue number only, no URL retrieved) |
| 2026-08-04 | CL 738760 submitted (Gerrit "Submitted" 05:01:12 UTC; git committer time 2026-08-03 22:01:12 -0700, which is the same instant). | [commit](https://go.googlesource.com/crypto/+/5ed494470b06afb7621b303b04e38366d5863942) |
| 2026-08-11 | v0.55.0 tagged. It is the earliest tag containing 5ed4944. | Bare clone, `git tag --contains` |
| 2026-10-09 | v0.58.0 tagged (latest tag found). | Same clone |

**Key contributors**
- The poly1305 author is shown as Julian Zhu (julian.oerv@isrc.iscas.ac.cn) on googlesource and as HeliC829 on GitHub. The Institute of Software, Chinese Academy of Sciences (ISCAS) affiliation is inferred from the email domain [NEEDS VERIFICATION]. The two names are presumably the same person, but no source states this. ISCAS is a General member of RISE. No source links this commit to RISE.
- The reviewers are Dmitri Shuralyov, Meng Zhuo and Mark Freeman.
- Mark Ryan authored the [x/sys/cpu RISC-V detection commit](https://github.com/golang/sys/commit/3283fc3f6160baf63bec24fbaa24e094e9ff6daf) and wrote the RISE Go post with Ludovic Henry.

**Is it fully upstream?** Yes. The only riscv64-specific change is merged to master and released in v0.55.0. No out-of-tree patches were found.

## 3. Upstream Support Tier

**Formal policy.** x/crypto has no tier policy of its own. The [Go porting policy](https://go.dev/wiki/PortingPolicy) lists these first-class ports:
- darwin/amd64 and darwin/arm64
- linux/386, linux/amd64, linux/arm and linux/arm64
- windows/386 and windows/amd64

linux/riscv64 is not on that list, so it is a secondary port. Breakage of a secondary port does not block releases or force rollbacks. Port maintainers fix it. A broken port can be removed if its builder keeps failing and nobody maintains it.

**Evidence**
- **CI:** Gerrit changes to x/crypto go through the Go project's shared LUCI TryBots (the commit carries a `LUCI-TryBot-Result` trailer). That trailer does not show riscv64 is among the builders. See Section 7.
- **Release-blocking:** Data not available: no source states whether riscv64 failures in the x/crypto subrepo block anything. The porting policy says secondary-port breakage does not block releases.
- **Official binaries:** x/crypto ships no binaries, only git tags. The Go toolchain has had linux-riscv64 binaries on go.dev/dl since Go 1.21.

| Aspect | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Go port tier | First-class | First-class | Secondary |
| x/crypto-specific CI config | None in repo (shared Go infrastructure) | None in repo | None in repo |
| Confirmed builder running x/crypto tests | Data not available: builder pages not read | Data not available | Not confirmed |
| Hand-written assembly kernels in x/crypto | argon2, blake2b, blake2s, chacha20poly1305, poly1305, salsa20 | chacha20 | poly1305 |

## 4. Technical Architecture and RISC-V-Specific Subsystems

The research found exactly one riscv64 assembly kernel in x/crypto: `internal/poly1305/sum_riscv64.s`. This was confirmed by a fresh clone at HEAD 16804593e8b0 (2026-10-26), using `find -iname '*riscv*'`, a grep for `riscv`, and a grep of `go:build` tags. There is no `arch/riscv/` directory.

**poly1305 riscv64 implementation**
- The file is 158 lines, copyright 2026, and implements `func update(state *macState, msg []byte)`. The commit as a whole is +160/-2 across three files, so the first findings' "160 lines" for the `.s` file is a rounding of the commit total.
- Build tags: `sum_asm.go` is now `gc && !purego && (amd64 || loong64 || ppc64 || ppc64le || riscv64)`. `mac_noasm.go` excludes riscv64.
- It uses plain scalar X-registers. h0-h2 and r0-r1 stay in registers. It processes 16-byte blocks and does the 64x64-to-128-bit products with `MUL`/`MULHU`. The mod 2^130-5 reduction uses shifts and masks. A `tail` path builds the final partial block byte by byte.
- A `LOAD64U` macro builds unaligned 64-bit loads from eight byte loads. The aligned path uses direct 8-byte loads.
- It uses no RVV, Zba, Zbb or Zbs. It is unconditional, with no runtime feature gate. `cpu.RISCV64` exists in x/sys, but the assembly does not call it.
- The commit page did not show the Go-side declaration of `update` or `macState`. The wrapper was not independently checked for compilation, but the commit passed LUCI TryBots.

**Per-component comparison (from file listings)**

| Component | amd64 | arm64 | riscv64 | riscv64 quality |
|---|---|---|---|---|
| `internal/poly1305` (also used by `chacha20poly1305`, `nacl/secretbox`) | assembly | none in listing | assembly | Hand-written scalar, RV64I + M only |
| `chacha20` | none in listing | assembly | none | Pure-Go fallback (`chacha_noasm.go`) |
| `chacha20poly1305` | assembly | none in listing | none of its own | Generic, plus poly1305 asm via internal package |
| `blake2b` | SSE and AVX2 assembly | none in listing | none | Pure-Go fallback |
| `blake2s` | 386 and amd64 assembly | none in listing | none | Pure-Go fallback |
| `salsa20/salsa` | assembly | none in listing | none | Pure-Go fallback |
| `argon2` (blamka) | assembly | none in listing | none | Pure-Go fallback |
| `sha3` | none | none | none | Pure Go on all architectures |
| `curve25519` | none (3 files, no arch-specific) | none | none | Pure Go on all architectures |
| Vector-crypto (RVV, Zvk*) | n/a | n/a | missing | No riscv64 vector code in any directory read |

**Caveats.** The "pure-Go fallback" ratings come from the absence of riscv64 files and tags. The contents of each package's `noasm`/`generic` files and the `_asm/` generator directories were not read. loong64 and ppc64x/s390x have assembly in several packages, so riscv64 is behind loong64 in kernel coverage (loong64 has argon2, blake2b, blake2s, chacha20, poly1305 and salsa20).

**Adjacent infrastructure**
- [golang/sys commit 3283fc3](https://github.com/golang/sys/commit/3283fc3f6160baf63bec24fbaa24e094e9ff6daf) adds `cpu.RISCV64`. It detects C, V, Zba, Zbb, Zbs and `HasFastMisaligned`, using the `riscv_hwprobe` syscall (Linux 6.4+) and falling back to HWCAP, but only for C. The commit message says V, Zba, Zbb and Zbs can only be detected on a 6.5 kernel or later. It reports only extensions present on all cores. It has no Zvk* detection.
- The third-party [emmansun/gmsm v0.45.0](https://github.com/emmansun/gmsm/releases/tag/v0.45.0) (released 2026-10-04) ships RVV 1.0 + Zvk paths for ML-KEM, ML-DSA, SM3, SM4, ZUC and others, with its own detection of VLENB, Zvbb, Zvkb, Zvbc, Zvkg, Zvksed and Zvksh. Its riscv64 vector crypto paths require Go 1.27+. It is not x/crypto, but it shows the work is feasible in Go assembly.

## 5. Build System, Cross-Compilation, and Toolchain

The repo has no build documentation beyond a README that points to Gerrit and pkg.go.dev. `CONTRIBUTING.md` only asks issue reporters for their Go version and processor architecture.

**Toolchain**
- `go.mod` declares `go 1.26.0`. It has no `toolchain` directive in the fetched copy. The reason for 1.26.0 is not documented in the repo.
- There is no C code, so no cgo and no cross C compiler is needed. There is no GCC or Clang minimum.

**Commands.** These come from the standard Go toolchain, not from repo docs.
- Cross-compile on another host: `GOOS=linux GOARCH=riscv64 go build ./...`
- Cross-compile a package's tests: `GOOS=linux GOARCH=riscv64 go test -c ./chacha20/` (repeat per package)
- Native build on a riscv64 machine: `go build ./...`

**QEMU.** The repo has no QEMU documentation. `go test -exec qemu-riscv64 ./...` with `GOARCH=riscv64` should work, because `go test -exec` accepts a runner. This was not verified against the repo [NEEDS VERIFICATION].

**Known build failures.** Data not available: none were found for x/crypto on riscv64. The GitHub issue search "x/crypto riscv64" returned 86 results, mostly build-failure noise, and only the first 25 were seen. None of those 25 was a riscv64 x/crypto issue. Two downstream items are not x/crypto:
- gocryptfs [issue #666](https://github.com/rfjakob/gocryptfs/issues/666) (`undefined: xorBlock`) was in `github.com/jacobsa/crypto/cmac`.
- FreeBSD ports bumped golang.org/x/{crypto,net,sys} to versions new enough to build on riscv64-freebsd. No x/crypto change was attributed to that.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Capability | amd64 | arm64 | riscv64 |
|---|---|---|---|
| All 32 packages build | Expected | Expected | Expected via pure-Go fallbacks; not verified by a riscv64 test run in this research |
| Poly1305 assembly | Yes | No (generic) | Yes (scalar) |
| ChaCha20 assembly | No (per listing) | Yes | No |
| BLAKE2b/2s, salsa20, argon2 assembly | Yes | No (per listing) | No |
| Vector or crypto-extension kernels | AVX2 in blake2b | None | None |
| Runtime feature detection used by x/crypto asm | Not examined | Not examined | None (poly1305 is unconditional) |

**Functional gaps.** None found. Every package that lacks a riscv64 kernel has a pure-Go fallback. Correctness of those fallbacks on riscv64 was not tested in this research.

**Performance gaps**
- The only measured riscv64 data is the poly1305 commit's benchmark, run by its author on `goos: linux`, `goarch: riscv64`, GOMAXPROCS=4, n=10, p=0.000 on every row. The CPU is not named.
  - Time geomean went from 10.14 us to 6.925 us (-31.68%).
  - Throughput geomean went from 485.5 MiB/s to 710.7 MiB/s (+46.37%).
  - Aligned 1K and 2M gained roughly 83-94%, for example 2M from 551.4 to 1063.8 MiB/s.
  - Unaligned inputs gained only +12% to +28% (for example 2MUnaligned 548.9 to 701.8 MiB/s), so a gap remains for unaligned data. The time range across all rows is -11.05% to -48.55%. One earlier summary quoted "26-48%", which describes only the aligned subset.
- The time table header says `sum1305-new` and the throughput table header says `sum1305-new-3`. Both are in the same commit message.
- Data not available: no riscv64 benchmarks exist for chacha20, chacha20poly1305, curve25519, argon2, blake2, sha3 or scrypt in x/crypto, and no riscv64-vs-arm64 or riscv64-vs-amd64 comparison exists from RISE or the Go project.
- Related standard-library figures (not x/crypto), from search-result snippets only [NEEDS VERIFICATION]:
  - sha256: about -33% on a StarFive VisionFive 2.
  - sha1: about -54% for 8 KB hashes ([golang-checkins](https://groups.google.com/g/golang-checkins/c/gCqTA4JYP-w)).
  - `crypto/subtle` xorBytes vector: benchmarked on a Banana Pi F3, with the figures not retrievable.
- Compiler-level performance: golang/go #77541 (opened 2026-02-11, open) reports RISC-V about 20-40% slower than ARM64 on many Bent benchmarks (go1.25.6, GORISCV64=rva23u64), due to instruction bloat from 12-bit immediate offset splitting in hot loops. It affects all Go code, including x/crypto's pure-Go paths.

**Security hardening gaps.** Data not available: no source analyzed constant-time behaviour of the riscv64 poly1305 assembly or of the pure-Go paths on riscv64. The assembly uses `MUL`/`MULHU`, and whether they are constant-time on specific riscv64 cores was not examined.

**NaN / floating-point semantics.** Data not available: no floating-point issue was found. The riscv64 assembly uses integer X-registers only.

## 7. CI/CD Infrastructure

**What exists.** x/crypto uses the Go project's shared infrastructure: LUCI TryBots on Gerrit and the build.golang.org dashboard. The repo contains no CI config of its own. The checks that found none:
- `.github` returns HTTP 404.
- There is no `.gitlab-ci.yml`, `.travis.yml`, `Jenkinsfile`, cloudbuild or luci entry in the root tree.
- `codereview.cfg` contains only `issuerepo: golang/go`, which is Gerrit review configuration and not CI.
- The README mentions no CI, riscv64, builders or trybots.

**riscv64 specifically**
- The [build.golang.org subrepo page](https://build.golang.org/?repo=golang.org%2fx%2fcrypto) showed only the commit list, with no builder columns. `farmer.golang.org/builders` was never read. So it is unverified whether any riscv64 builder runs x/crypto tests.
- riscv64 builder issues in golang/go x/build are all open or in progress, and all describe the main Go tree:
  - #73568: `linux-riscv64-rva22u64` on a SpacemiT X60, in progress.
  - #80880: LUCI linux-riscv64 builder.
  - #81534: LUCI linux-riscv64 builders with ISCAS.
  - #67105: openbsd-riscv64.
  - #78026: a FreeBSD riscv64 builder reported with no bots running.
- One OpenBSD/riscv64 log showed the standard-library `crypto/*` packages passing. That is not the x/crypto module.
- A linux-riscv64 builder was added to the dashboard in 2020 (CL 257917). Whether it runs subrepo tests was not established.
- RISE runners: no evidence of x/crypto using them. RISE does operate a `riscv-runner` project, and no repo in the riseproject-dev organization (70 repos, pages 1-3 read) is named for x/crypto.
- Hardware used for the poly1305 benchmark: not named in the commit.

| Aspect | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Repo-local CI config | None | None | None |
| LUCI TryBot on Gerrit changes | Yes (shared infrastructure) | Data not available: builder list not read | Not confirmed |
| Builder status for x/crypto | Data not available | Data not available | Unverified; builders open in x/build |
| RISE runner use | None found | None found | None found |

## 8. Distribution and Release Status

| Channel | riscv64 status | Evidence |
|---|---|---|
| Upstream release | Source tags only. Latest found is v0.58.0 (2026-10-09). The poly1305 riscv64 assembly first shipped in v0.55.0. | [repo](https://go.googlesource.com/crypto) |
| Go module proxy / `go get` | Builds from source on riscv64 with the Go toolchain. Not verified here. | Section 5 |
| Ubuntu 26.04 (resolute) | `golang-golang-x-crypto-dev`, version `1:0.47.0-1`, `Architecture: all`, listed in the [riscv64 universe index](http://ports.ubuntu.com/ubuntu-ports/dists/resolute/universe/binary-riscv64/Packages.gz). It is an architecture-independent source package, not a compiled riscv64 binary. [NEEDS VERIFICATION: single source] | Verification pass |
| Debian | Source package `golang-go.crypto` is in sid and forky at `1:0.58.0-1` ([sources.debian.org](https://sources.debian.org/api/src/golang-go.crypto/)). This is not riscv64 evidence. | Verification pass |
| Fedora | Data not available: not searched. | - |
| Arch Linux RISC-V | Inconclusive. The query returned no package listing at all, which does not show absence. | Verification pass |
| PyPI | None. It is a Go module, and `pypi.org/pypi/golang-org/x/crypto/json` returned 404. | Research |
| RISE Python wheel builder | Not listed. The [wheel builder](https://riseproject.gitlab.io/python/wheel_builder/) covers Python wheels only. | Research |
| packages.ubuntu.com web search | HTTP 500, unusable. | Research |

The Ubuntu `-dev` package at 0.47.0 predates v0.55.0, so by tag ordering it does not contain the poly1305 riscv64 assembly. This is derived from the version numbers, not from inspecting the package. Debian's 0.58.0 does include it by the same logic.

**What a user must do to get a working binary.** x/crypto is a library with no binaries. A user needs a Go toolchain for linux/riscv64 (binaries from go.dev/dl since Go 1.21, or the distro `golang-1.26` package, which was not confirmed). The user depends on `golang.org/x/crypto` at v0.55.0 or later to get the poly1305 assembly, and builds the application from source.

## 9. Dependencies

| Name | Role | riscv64 build | riscv64 test | riscv64 release | Community |
|---|---|---|---|---|---|
| Go | build-dependency, critical | Supported secondary port (linux/riscv64 since Go 1.14 experimental, stable in 1.15, cgo in 1.16). `go 1.26.0` required. | Not verified for the x/crypto module | linux-riscv64 binaries on go.dev/dl since Go 1.21. Ubuntu `golang-1.26` not confirmed. | Go team, plus RISE RP001, ISCAS, others |
| golang.org/x/sys | runtime-dependency, critical | v0.49.0. `unix/` has linux, freebsd and openbsd riscv64 files (`zsyscall_linux_riscv64.go`, `zsysnum_linux_riscv64.go`, `asm_linux_riscv64.s`). | Not verified | Not verified. Follows the Go module release process. | Go team. `cpu.RISCV64` by Mark Ryan. |
| golang.org/x/term | runtime-dependency, optional | v0.47.0. Built on x/sys, expected to work. Not checked. | Not verified | Not verified | Go team |
| golang.org/x/net | runtime-dependency, optional | v0.60.0 (marked `tagx:ignore` in go.mod). Pure Go, expected to build. Not checked. | Not verified | Not verified | Go team |
| golang.org/x/text | indirect | v0.43.0. Pure Go, expected to build. Not checked. | Not verified | Not verified | Go team |

No graph results exist for any row. "Not verified" means not tested, not "known to fail".

**Deep dive: Go toolchain (critical)**
- Profile selection (RVA20, RVA22, RVA23) and runtime extension detection were added through RP001 per the [RISE post](https://riseproject.dev/2025/04/04/advancing-go-on-risc-v-progress-through-the-rise-project/).
- A past miscompilation bug (golang/go #64285, large shifts on riscv64) first surfaced as a failing `internal/chacha8rand` TestMarshal. It was fixed in Go 1.22 by CL 545035 (see Section 11).
- Remaining open design questions for optional extensions are in #76065 (Section 12).

**Deep dive: golang.org/x/sys (critical, SIMD/crypto-relevant)**
- `cpu.RISCV64` is the hook any future x/crypto vector path would use. Its `HasV` is derived from hwprobe on kernels 6.5+. It deliberately does not trust the HWCAP 'V' bit, because vendors used it for both the unratified 0.7.1 Vector spec and RVV 1.0, which are binary incompatible.
- It has no detection for Zvbb, Zvkb, Zvkned or the other Zvk* extensions, which vector-crypto code (for example chacha20 with Zvkb) would need.
- `x/sys/cpu` cannot depend on `x/sys/unix`, so the hwprobe keys are duplicated locally (syscall 258).

Data not available for x/term, x/net and x/text beyond go.mod versions: no riscv64-specific searches were run on them.

## 11. Known Bugs and Active Issues

**No open correctness or performance bug filed against x/crypto on riscv64 was found.** Limits: the Gerrit review pages returned nothing usable, the `label:arch-riscv` combined search returned zero results, and the open-issue list below came from keyword searches and may be incomplete. Only the first 25 of 86 results for "x/crypto riscv64" were inspected.

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| golang/go #77541 | cmd/compile: riscv instruction bloat in hot loops due to large stack frame offsets | Open (Backlog) | Medium | Performance, arch-riscv. About 20-40% slower than ARM64 on Bent benchmarks. Not x/crypto-specific, no fix merged. |
| golang/go #76065 | proposal: cmd/compile: add a flag to support riscv optional extension | Open | Medium | Blocks the design of extension-gated assembly. See [issue](https://github.com/golang/go/issues/76065). |
| golang/go #77328 | cmd/internal/obj/riscv: add Zvkned extension support | Open | Medium | Assembler support needed for vector AES. |
| golang/go #81892 | simd/archsimd: support RISC-V RVV SIMD intrinsics under a GOEXPERIMENT | Open | Low | Opened 2026-09-30. |
| golang/go #73568 | x/build: linux-riscv64-rva22u64 builder on SpacemiT X60 | Open, in progress | High for CI | Main-tree builder. |
| golang/go #80880, #81534, #67105 | x/build: LUCI linux-riscv64 builder; with ISCAS; openbsd-riscv64 | Open | High for CI | Not confirmed to run subrepo tests. |
| golang/go #78026 | FreeBSD riscv64 builder reported with no bots running | Reported | Low | Not x/crypto. |
| golang/go #81935 | proposal: add GORISCV64OGO environment variable | Open | Low | Toolchain. |
| golang/go #82711 | x/tools gocommand test times out on riscv64 | Open | Low | Not x/crypto. |
| golang/go #81175 | cmd/go `TestScript/cover_atomic_pkgall` broken on riscv64 | Open | Low | Not x/crypto. |
| golang/go #73682 | x/arch riscv64asm test stalls on linux/s390x | Open | Low | Not x/crypto. |
| golang/go #36632 | x/crypto: add BLAKE3 support | Open (since 2020-01-18) | Low | Feature request. Relation to riscv64 not checked. |
| golang/go #82660 | arm64 assembly for argon2 blamka | Open (2026-10-28) | Low | x/crypto but not riscv64. Suggests argon2 has no riscv64 assembly either, not confirmed. |

**Correctness bugs (highlighted)**
- golang/go #64285, "cmd/compile: large shifts miscompiled on riscv64". Opened 2023-11-20, closed 2023-12-01 as fixed in Go 1.22 by CL 545035. The cause was riscv64 rewrite rules (CL 528975 and CL 535115) that turned 32-bit right shifts into SRLW/SRAW (or SRLIW/SRAIW) even when the shift count was 32 or more. Example: `uint64(uint32 0xbadbaad) >> 56` printed 11 instead of 0. It surfaced as a failing `internal/chacha8rand` TestMarshal. ChaCha8 was reverted by CL 543895 and re-landed on 2023-12-05. It is a standard-library and compiler bug, not an x/crypto bug, but it shows that compiler miscompilation can silently affect crypto code on riscv64.
- No open riscv64 correctness bug was found.

## 12. Objections and Upstream Blockers

**Stated objections.** None specific to x/crypto riscv64. The one riscv64 contribution was accepted with three reviewers. The related design discussion in [#76065](https://github.com/golang/go/issues/76065) shows these positions:
- Jorropo (Member) opposes per-extension configuration to avoid an extension matrix of optimizations. He proposes `GORISCV64` with appended extensions (for example `RVA20U64,Zicond`) and build tags such as `riscv64.Zicond`.
- markdryan asks who would build with optional extensions, since distros target fixed profiles. He notes about 92 non-RV32 extensions versus GOARM64's two.
- mengzhuo uses chacha20 as the motivating example, needing V plus Zvkb, with many profile and extension combinations (for example `rva20u64,v,zvkb`), and says extension-specific code is too complicated for users as proposed.
- wangpc-pp supports the `GORISCV64` approach and says some extensions are RV32-only.
- There is no consensus or decision on the proposal.

**Technical blockers for vector crypto**
- #76065 undecided, so there is no agreed build-time or tag mechanism for extension-gated code.
- `x/sys/cpu` has no Zvk*, Zvbb or Zvkb detection. gmsm works around this with its own detection.
- Assembler support for vector crypto extensions: Zvkned (#77328) is open.
- RVV intrinsics (#81892) are open.
- gmsm's vector crypto paths need Go 1.27+. markdryan's comments suggest Zacas support is unlikely before Go 1.27 (different extension).
- Unaligned input is a weaker case for the current poly1305 assembly. `HasFastMisaligned` exists in `x/sys/cpu` but is not used.

**Organizational blockers**
- No confirmed riscv64 builder running x/crypto tests (Section 7). The porting policy requires named maintainers and a builder for a port.
- Crypto code gets extra review scrutiny and review can be slow (README).
- RISE has no direct x/crypto work. RP001 covers the runtime and standard-library `crypto/*`.
- Timing of the next RISC-V profile is disputed: wangpc-pp says RVA30 is probably about four years away, markdryan cites a slide saying 2-3 years, and wangpc-pp is less optimistic given RVA23 was released at the end of 2024.

**Acceptance probability.** No quantitative source exists. Qualitatively, scalar assembly contributions with benchmarks have precedent (poly1305 riscv64, loong64 SIMD blake2s). Vector-extension paths depend on #76065 and have no precedent in x/crypto.

## 13. Readiness Assessment

- **Color:** orange (no-upstream-ci)
- **Release provider:** upstream

**Justification.** The [x/crypto repository](https://go.googlesource.com/crypto) contains no CI configuration of its own, and no riscv64 builder was confirmed to run its tests. The [build.golang.org subrepo page](https://build.golang.org/?repo=golang.org%2fx%2fcrypto) showed no per-builder results, and the riscv64 LUCI builders in x/build (#73568, #80880, #81534) are still open. The Step 0 shortcut does not apply because the module ships riscv64 assembly ([poly1305 commit 5ed4944](https://github.com/golang/crypto/commit/5ed494470b06afb7621b303b04e38366d5863942)). That commit was benchmarked on linux/riscv64, but contributor benchmarks are not CI. riscv64 is a secondary Go port, and every other package falls back to pure Go. Confidence is low to medium, and the grade is conservative.

**Note on the distro floor.** Ubuntu 26.04 lists `golang-golang-x-crypto-dev` 1:0.47.0-1 as `Architecture: all` in the riscv64 universe index (Section 8). That is a source package and does not show a riscv64 build or test, and a clean distro build would not move orange to yellow without an upstream CI confirmation.

**Pending work that could change the grade**
- Open x/build issues for riscv64 LUCI builders: #73568 (linux-riscv64-rva22u64 on a SpacemiT X60), #80880, #81534 (ISCAS) and #67105 (openbsd-riscv64). If these builders run subrepo tests, x/crypto could reach blue. It would move to blue or green once a riscv64 builder is confirmed to run x/crypto tests.
- Related open issues: #76065 (the GORISCV64 optional-extension proposal, relevant to future chacha20 vector work), #77328 (Zvkned assembler support) and #81892 (RVV SIMD intrinsics).
- No x/crypto riscv64 issue or PR is open.
- RISE has no direct x/crypto involvement.
- Retry the Ubuntu 26.04 and Debian package lookups, which would settle patch status.
- The stored project-reports file for this project does not exist, so no report-date prior was used.

## 14. Investment Analysis

**RISE coverage check.** RISE funds RP001 "Accelerate the Go Runtime on RISC-V", scoped to the runtime, compiler and standard library. It delivered hand-coded scalar assembly for `crypto` md5, sha256 and sha512, plus `math/big`, `internal/bytealg`, vector assembler support and profile selection. The RISE wiki lists planned standard-library work (`crypto/aes`, `crypto/subtle`, `crypto/internal/edwards25519/field`, `math/big`), but its pages could not be opened. None of this covers x/crypto, so none of the items below is already funded by RISE. The effort figures below are estimates for this assessment, not figures from the research. They assume engineers already familiar with Go assembly and Gerrit.

### 14.1 Functional Enablement

- Run the full x/crypto test suite on native riscv64 hardware and under QEMU (`go test -exec qemu-riscv64`), and record pass/fail per package. No evidence shows this has been done, and it is the cheapest way to confirm the pure-Go fallbacks work.
- Test the poly1305 assembly on more than one core, including cores with slow misaligned access, since the benchmark CPU is unnamed.

### 14.2 Performance Optimization

- Establish a riscv64 vs arm64 baseline for chacha20, chacha20poly1305, blake2b/2s, salsa20, argon2 and sha3. No such data exists.
- Improve the unaligned poly1305 path, using `cpu.RISCV64.HasFastMisaligned` where available.
- Add scalar riscv64 assembly for chacha20 if the baseline shows the compiler output is the bottleneck. This is not established.
- Add vector chacha20 (V + Zvkb). This requires extension detection and a build-tag decision, so it is blocked on #76065 and on Zvk* detection in `x/sys/cpu`.
- Vector AES (Zvkned) belongs mainly to the standard library and depends on #77328. It is not an x/crypto item.

### 14.3 CI/CD Infrastructure

- Engage the x/build riscv64 LUCI builder issues (#73568, #80880, #81534) and confirm that subrepo tests, including x/crypto, run on them.
- Provide or sponsor riscv64 hardware for those builders. ISCAS and SpacemiT are already involved in the open issues.

### 14.4 Ecosystem Enablement

x/crypto is a source library, so dependents rebuild it on riscv64 without per-package enablement. The main gap is distro currency: Ubuntu 26.04 carries 0.47.0 while upstream is at v0.58.0. A package refresh would deliver the poly1305 assembly to Ubuntu users. A Fedora and Arch check is also needed.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Native and QEMU test run of all packages, plus triage | 1-2 | Internal engineering | High |
| CI/CD | Confirm and enable x/crypto tests on riscv64 LUCI builders (x/build #73568, #80880, #81534) | 2-4 | Go infrastructure, ISCAS, SpacemiT, hardware sponsor | Critical |
| Performance | riscv64 vs arm64 baseline benchmarks across packages | 1-2 | Internal engineering | High |
| Performance | Improve unaligned poly1305 path | 1-2 | Internal engineering or ISCAS | Medium |
| Performance | Scalar chacha20 riscv64 assembly (only if baseline justifies) | 3-4 | Internal engineering | Medium |
| Performance | Zvk* and Zvbb detection in `x/sys/cpu` | 2-3 | Internal engineering with Go team review | Medium |
| Performance | Vector chacha20 (V + Zvkb), after #76065 resolves | 6-10 | Internal engineering | Low until blockers clear |
| Ecosystem | Request Ubuntu and Debian package refresh, check Fedora and Arch | 0.5-1 | Distro maintainers | Low |

## 15. References

- [golang.org/x/crypto repository (go.googlesource.com)](https://go.googlesource.com/crypto)
- [golang.org/x/crypto on pkg.go.dev](https://pkg.go.dev/golang.org/x/crypto)
- [poly1305 riscv64 commit 5ed4944 (GitHub)](https://github.com/golang/crypto/commit/5ed494470b06afb7621b303b04e38366d5863942)
- [poly1305 riscv64 commit 5ed4944 (googlesource)](https://go.googlesource.com/crypto/+/5ed494470b06afb7621b303b04e38366d5863942)
- [Gerrit CL 738760](https://go-review.googlesource.com/c/crypto/+/738760)
- [sum_riscv64.s on master](https://go.googlesource.com/crypto/+/refs/heads/master/internal/poly1305/sum_riscv64.s)
- [chacha20 directory listing](https://go.googlesource.com/crypto/+/refs/heads/master/chacha20/)
- [build.golang.org x/crypto subrepo page](https://build.golang.org/?repo=golang.org%2fx%2fcrypto)
- [golang/sys commit 3283fc3, cpu: add support for detecting RISC-V extensions](https://github.com/golang/sys/commit/3283fc3f6160baf63bec24fbaa24e094e9ff6daf)
- [golang/go #27532, all: port to RISC-V](https://github.com/golang/go/issues/27532)
- [golang/go #36641, all: add cgo support to the riscv port](https://github.com/golang/go/issues/36641)
- [golang/go #76065, proposal: RISC-V optional extension flag](https://github.com/golang/go/issues/76065)
- [Go porting policy](https://go.dev/wiki/PortingPolicy)
- [RISE: Advancing Go on RISC-V](https://riseproject.dev/2025/04/04/advancing-go-on-risc-v-progress-through-the-rise-project/)
- [RISE members](https://riseproject.dev/members/)
- [RISE project home](https://riseproject.dev)
- [RISE feed](https://riseproject.dev/feed/)
- [RISE Python wheel builder](https://riseproject.gitlab.io/python/wheel_builder/)
- [riseproject-dev GitHub organization repositories](https://github.com/orgs/riseproject-dev/repositories)
- [RVI Summit EU 2026 slides (Ludovic Henry, Nathan)](https://riseproject.dev/wp-content/uploads/sites/25/2026/06/RVI-Summit-EU-2026-Ludovic-Nathan.pdf)
- [emmansun/gmsm v0.45.0](https://github.com/emmansun/gmsm/releases/tag/v0.45.0)
- [crypto/sha1 riscv64 change (golang-checkins)](https://groups.google.com/g/golang-checkins/c/gCqTA4JYP-w)
- [crypto/subtle xorBytes riscv64 commit (mirror)](https://remotebranch.eu/Stowage/go/commit/f532f87a98)
- [golang/go issue 22809 (arm64 chacha20poly1305, historical)](https://golang.org/issue/22809)
- [Ubuntu resolute riscv64 universe Packages.gz](http://ports.ubuntu.com/ubuntu-ports/dists/resolute/universe/binary-riscv64/Packages.gz)
- [Debian sources: golang-go.crypto](https://sources.debian.org/api/src/golang-go.crypto/)
- [gocryptfs issue #666](https://github.com/rfjakob/gocryptfs/issues/666)
- [golang-nuts thread on riscv64 support status](https://groups.google.com/g/golang-nuts/c/m4OF6nieGro/m/b-Ld_mynBAAJ)
- [golang-openpgp thread on maintainership](https://groups.google.com/g/golang-openpgp/c/_P6AmeCmD9w)