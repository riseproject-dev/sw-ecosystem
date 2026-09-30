---
title: Go
parent: Project Reports
color: green
dependencies:
  - name: golang.org/x/sys
    relation: runtime-dependency
    criticality: critical
  - name: golang.org/x/crypto
    relation: runtime-dependency
    criticality: optional
  - name: Linux kernel
    relation: runtime-dependency
    criticality: critical
  - name: glibc
    relation: runtime-dependency
    criticality: optional
  - name: BoringSSL
    relation: runtime-dependency
    criticality: optional
  - name: GCC
    relation: build-dependency
    criticality: optional
---

{% include dependency-graph.html slug="dependencies" subset="go" %}

# Go

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-09-30<br/>
**Readiness:** green<br/>
**Scope:** RISC-V (riscv64/linux) support status for Go<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

Go is a compiled, garbage-collected systems programming language and self-hosted toolchain (compiler, assembler, linker, runtime) developed and maintained by a team at Google, with contributions from the open source community. It is not affiliated with any independent foundation (no CNCF, Linux Foundation, or similar governance body); go.dev describes Go as "supported by Google."

Governance is centralized: significant language or runtime changes require a formal, accepted change proposal, releases follow a 6-month cycle with a 3-month feature freeze, and code review requires +2 approval from a Go maintainer. The clearest corporate-control mechanism is procedural: per the contribution guide, two Google employees must be involved in every change (as uploader or +1 reviewer) "for compliance and supply chain security reasons," meaning even community-authored patches require Google sign-off before merge. Copyright is held by Google LLC; the license is BSD 3-Clause.

Google LLC is a Premier Member of the RISE Project (RISC-V Software Ecosystem), alongside Alibaba Damo, MediaTek, NVIDIA, Qualcomm, Red Hat, SiFive, and Tenstorrent. Go itself is not a RISE member (RISE membership is by organization, not by language project), and riseproject.dev makes no mention of Go/golang on its homepage.

Community stance toward new architecture ports is structurally welcoming but disciplined: Go's documented porting policy (go.dev/wiki/PortingPolicy) requires an accepted proposal, at least two named maintainers, a dedicated builder maintainer, and a working builder before a new port is merged. The riscv64 port, led by an independent, non-Google contributor, reached inclusion within roughly 18 months of serious work starting, evidencing that the bar is real but not prohibitive for a well-resourced effort.

- **Repository:** [github.com/golang/go](https://github.com/golang/go)
- **Homepage:** [golang.org](https://golang.org/)
- **License:** BSD 3-Clause
- **Language:** Go (self-hosted compiler), C (cgo bridge), Plan 9-style assembly

## 2. Port History and Upstreaming Timeline

The linux/riscv64 port was initiated by Tobias Klauser (Cilium/Isovalent, independent of Google) and implemented primarily by Joel Sing (independent developer, OpenBSD project), building on a since-abandoned out-of-tree prototype, `riscv-go` (based on Go 1.8). Early prep work and review also involved Google engineers (Benjamin Barenblat, Michael Yenik, Cherry Zhang).

| Date | Event | Source |
|---|---|---|
| 2018-04-11 | First RISC-V commit: reserve `riscv`/`riscv64` GOARCH names, citing HiFive Unleashed and Debian/Fedora RISC-V ports (Tobias Klauser) | commit `9446eaa9443c` |
| 2018-04-18 | `debug/elf: add riscv64 relocations` (Tobias Klauser) | commit `96f6cc15949c` |
| 2018-09-06 | Issue [#27532](https://github.com/golang/go/issues/27532) "all: port to RISC-V" filed as master tracking issue | issue #27532 |
| 2019-09 | Joel Sing begins submitting the assembler, register definitions, compiler backend, linker, runtime, syscall, math/big, and reflect support via Gerrit CLs | Gerrit history referenced in issue #27532 |
| Feb 2020 (Go 1.14) | First official release with `linux/riscv64` support | Go 1.14 release notes |
| 2020-08 | PR [#41063](https://github.com/golang/go/pull/41063) "doc: add linux/riscv64 valid combination" merged, marking linux/riscv64 as an officially documented port | PR #41063 |
| 2021-02 | cgo support for riscv64 merged (PR [#41930](https://github.com/golang/go/pull/41930)); issue [#36641](https://github.com/golang/go/issues/36641) ("add cgo support to the riscv port") closed | PR #41930, issue #36641 |
| 2022-06 | Plugin build mode enabled for riscv64 (PR [#53029](https://github.com/golang/go/pull/53029)) | PR #53029 |
| Go 1.19 (2022) | Register-based calling convention extended to riscv64 | RISC-V Bytes (Daniel Mangum), proposal #18597 |
| Go 1.21 (2023) | linux-riscv64 becomes an officially downloadable binary target at [go.dev/dl](https://go.dev/dl/) | RISE blog post (April 2025) |
| 2023-2024 | freebsd/riscv64 (issue [#53466](https://github.com/golang/go/issues/53466)) and openbsd/riscv64 (issue [#55999](https://github.com/golang/go/issues/55999)) ports added | issues #53466, #55999 |
| 2025-01 | Issue [#71105](https://github.com/golang/go/issues/71105), the umbrella compressed-instruction proposal, opened and formally Proposal-Accepted, driving the current wave of extension-support PRs | issue #71105 |
| 2025-2026 | Continuous extension work: Zicond, Zbc, Zfa, CMO, Zicbop, compressed instructions, jump tables, framepointer, atomic intrinsics (210+ commits found in commit search) | commit search, PR list below |
| 2026-09-30 | RVV SIMD intrinsics under `GOEXPERIMENT` proposed (issue [#81892](https://github.com/golang/go/issues/81892)), newest open riscv64 issue found | issue #81892 |

The port is fully upstream: there is no out-of-tree riscv64 fork in active use, and an active `@golang/riscv64` maintainer team exists (confirmed by governance/membership issues [#79815](https://github.com/golang/go/issues/79815) and [#74742](https://github.com/golang/go/issues/74742)). Data not available: the precise Go release that formally reclassified linux/riscv64 from "experimental" to "secondary port" was not identified in research findings.

## 3. Upstream Support Tier

Go's documented policy (go.dev/wiki/PortingPolicy) defines two tiers:

**First-class ports** (release-blocking, Google-owned builders, officially documented installs): darwin/amd64, darwin/arm64, linux/386, linux/amd64, linux/arm, linux/arm64, windows/386, windows/amd64.

**Secondary ports** (lower priority; "a change that breaks a secondary port will not necessarily be rolled back"; maintained by the port's named maintainers; a builder failing repeatedly with no fix in progress can get the port removed): `linux/riscv64` is a secondary port, as is essentially every other architecture Go supports.

Evidence of upstream investment despite secondary-tier status: upstream CI builds and runs the full `dist` test suite on dedicated, physical native riscv64 hardware builders (`linux-riscv64-unmatched`, `linux-riscv64-jsing`, per [golang.org/x/build/dashboard/builders.go](https://github.com/golang/build/blob/master/dashboard/builders.go)), and upstream publishes official riscv64 binary releases directly from [go.dev/dl](https://go.dev/dl/).

| GOOS | GOARCH | CGo | Status |
|---|---|---|---|
| linux | riscv64 | yes | supported |
| freebsd | riscv64 | yes | Broken ([#76475](https://github.com/golang/go/issues/76475), open) |
| openbsd | riscv64 | yes | supported |

| Dimension | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Tier | First-class | First-class (linux/darwin) | Secondary |
| Release-blocking | Yes | Yes | No |
| Official go.dev/dl binaries | Yes | Yes | Yes (since Go 1.21) |
| Native CI hardware | Cloud VMs | Cloud VMs + Apple hardware | Community-donated physical boards |
| LUCI migration | Complete | Complete | Not complete (open: [#81534](https://github.com/golang/go/issues/81534), [#80880](https://github.com/golang/go/issues/80880)) |

## 4. Technical Architecture and RISC-V-Specific Subsystems

The toolchain is self-hosted; riscv64 support spans compiler, assembler, linker, and runtime as a mature, non-stub architecture port. Line counts and TODO/FIXME density below were verified directly against a live clone of `golang/go` at commit `01e4798b9842e9df4d8fa2bfcd34f5fed522ffdb` (2026-09-30).

### 4.1 Compiler backend

- `src/cmd/compile/internal/riscv64/ssa.go` (1,190 lines): SSA-to-machine-code lowering. Covers RV64I, M, A (atomics), F/D, Zba, Zbb, Zicond.
- `src/cmd/compile/internal/ssa/rewrite/riscv64/rewriteRISCV64.go` (11,871 lines, generated): generic-to-RISC-V SSA rewrite rules; the largest riscv64-specific file in the repository.
- `src/cmd/compile/internal/ssa/_gen/RISCV64Ops.go` (588 lines): SSA opcode/register-mask generator source.
- `src/cmd/compile/internal/riscv64/ggen.go`, `gsubr.go`, `galign.go`: stack-zeroing codegen, misc subroutines, architecture init.

There is no `simdssa.go` equivalent for riscv64 (amd64 has 4,400 lines, arm64 has 759 across NEON/SVE); riscv64 has no compiler-level auto-vectorization or SIMD-intrinsic code generation path. The V (RVV) extension exists only at the assembler-encoding level, never reached by the compiler's automatic lowering.

### 4.2 Assembler object backend

- `src/cmd/internal/obj/riscv/obj.go` (5,344 lines): instruction encoder/optimizer, including compressed-instruction (RVC) support and RVV `rVVV`/`rVIV`/`rVVi` vector encodings.
- `src/cmd/internal/obj/riscv/inst.go` (2,233 lines, generated): opcode/funct3/funct7 encoding tables, including all vector-op mnemonics (`VORVV`, `VXORVV`, `VANDVI`, etc.).
- `src/cmd/internal/obj/riscv/cpu.go` (1,835 lines): register/opcode constants, special-operand definitions including `SPOP_RVV_BEGIN..SPOP_RVV_END`.
- `src/cmd/internal/obj/riscv/anames.go` (1,022 lines, generated), `doc.go` (344 lines), `list.go` (68 lines).

Combined, the assembler backend is approximately 9,400 lines, comparable in scale to amd64's ~11,500 and arm64's ~10,600 equivalents. TODO/FIXME density is low: 4 markers total across riscv64 compiler+assembler+linker code, versus 19 for the equivalent arm64 files, and no `panic("not implemented")` guards exist in the core compile/assemble/link/runtime paths.

### 4.3 Linker

- `src/cmd/link/internal/riscv64/asm.go` (781 lines): ELF relocation handling (approximately 18 `R_RISCV_*` types), PLT/GOT, trampolines.
- `src/cmd/link/internal/riscv64/obj.go` (73 lines), `l.go` (14 lines).

`machoreloc1` in the riscv64 linker is a literal `log.Fatalf("machoreloc1 not implemented")` stub; this is architecturally correct (no darwin/riscv64 port exists) rather than a gap, since arm64's equivalent is implemented only because darwin/arm64 exists.

### 4.4 Runtime

- `src/runtime/asm_riscv64.s` (979 lines): goroutine switch, syscall trampolines, `_rt0_riscv64_lib`, GC write barriers, reflection dispatch.
- `src/internal/cpu/cpu_riscv64.go` / `cpu_riscv64_linux.go` / `cpu_riscv64.s` / `cpu_riscv64_other.go` (185 lines total): runtime extension detection via the Linux `riscv_hwprobe` syscall. Detected features: `HasFastMisaligned`, `HasV` (RVV 1.0), `HasZbb`, `HasZbc`, and the vector-crypto set `Zvbb`, `Zvbc`, `Zvkg`, `Zvkned`, `Zvknha`, `Zvknhb`, `Zvksed`, `Zvksh`, `Zvkt`, plus `VLENB`.
- `src/runtime/cgo/gcc_riscv64.S` (the only capital-`.S` file in the riscv64 tree): cgo crossing-call thunks, saving 14 integer + 12 float callee-saved registers.
- Full OS port across three kernels: `os_linux_riscv64.go`, `vdso_linux_riscv64.go`, `vdso_freebsd_riscv64.go`, `defs_{linux,freebsd,openbsd}_riscv64.go`, `sys_{linux,freebsd,openbsd}_riscv64.s`.

### 4.5 Standard library assembly (hand-optimized hot paths)

RVV vector assembly is hand-written in a narrow set of performance-critical routines, each gated by a runtime `HasV` check with a scalar fallback:

| File | Extension | Status |
|---|---|---|
| `crypto/internal/fips140/subtle/xor_riscv64.s` | V (RVV 1.0) | Complete; vector XOR loop with scalar fallback |
| `internal/chacha8rand/chacha8_riscv64.s` | V (RVV) | Complete; `VADDVV`/`VXORVV`/`VSLLVI`/`VSRLVI` ChaCha8 core |
| `internal/bytealg/equal_riscv64.s` | V (RVV) | Complete; vector memequal with scalar fallback |
| `internal/bytealg/compare_riscv64.s` | V (RVV) | Complete; vector compare with scalar fallback |
| `internal/bytealg/indexbyte_riscv64.s` | V (RVV) | Complete; vector IndexByte with scalar fallback; further optimization PR [#79997](https://github.com/golang/go/pull/79997) open |
| `internal/bytealg/count_riscv64.s` | scalar | Complete (calls indexbyte) |
| `crypto/internal/fips140/sha256/sha256block_riscv64.s` | Zbb (scalar rotate) | Complete, scalar only, no Zvknha |
| `crypto/internal/fips140/sha512/sha512block_riscv64.s` | Zbb (scalar rotate) | Complete, scalar only, no Zvknhb |
| `crypto/md5/md5block_riscv64.s` | scalar | Complete, plain scalar |
| `crypto/internal/fips140/bigmod/nat_riscv64.s` | M (MUL/MULHU) | Complete |
| `runtime/memmove_riscv64.s`, `memclr_riscv64.s` | scalar | Complete |

Feature bits exist in `internal/cpu` for `Zvbb`, `Zvbc`, `Zvkg`, `Zvkned`, `Zvknha`, `Zvknhb`, `Zvksed`, `Zvksh`, `Zvkt` (vector crypto) but are not yet consumed by any `.s` file found in the repository: no AES/GCM riscv64 assembly exists anywhere (`crypto/internal/fips140/aes/`, `.../gcm/` have zero riscv64 files, versus arm64's `aes_arm64.s`, `ctr_arm64.s`, `gcm_arm64.s` using ARM Crypto Extensions).

### 4.6 SIMD/JIT dispatch

Go's generics-based SIMD package `src/simd/archsimd/` has real backends only for amd64 (AVX/AVX2/AVX-512) and arm64 (NEON/SVE), plus a wasm stub. The generator's `arch.go` contains only an aspirational comment: "a future RVV target is scalable and owns its package." RVV is explicitly deferred, not implemented, at the generics-SIMD layer, though tracked as a live proposal (issue [#81892](https://github.com/golang/go/issues/81892), opened 2026-09-30). Go is ahead-of-time compiled only; there is no JIT in Go itself, so JIT-backend comparisons are not applicable.

| Component | riscv64 | amd64 | arm64 |
|---|---|---|---|
| Scalar compiler codegen | Full, hand-tuned | Full | Full |
| Vector/SIMD compiler codegen (`simdssa.go`) | Missing | Full (4,400 lines) | Full (759 lines, NEON/SVE) |
| Assembler/object encoder | Full, hand-tuned (9,412 lines) | Full (~11,462 lines) | Full (~10,634 lines) |
| Linker | Full, hand-tuned (781 lines) | Full (741 lines) | Full (1,473 lines) |
| Runtime entry + cgo bridge | Full | Full | Full |
| AES/GCM crypto assembly | Missing | Full | Full |
| Vector-crypto (Zvk*) assembly | Missing (detection only) | N/A | Full (ARM Crypto Extensions) |

## 5. Build System, Cross-Compilation, and Toolchain

Go uses its own `make.bash` / `all.bash` build system. There are no CMake files, no Dockerfiles, and no GitHub Actions workflow files anywhere in the repository (verified directly, see Section 7).

### 5.1 GORISCV64 environment variable

Controls the minimum RISC-V ISA profile for generated code; invalid values are a fatal build error.

| Value | Meaning | Default |
|---|---|---|
| `rva20u64` | RVA20U64 mandatory extensions only | Yes |
| `rva22u64` | RVA22U64 mandatory extensions | No |
| `rva23u64` | RVA23U64 mandatory extensions | No |

Separately, issue [#71105](https://github.com/golang/go/issues/71105) (Proposal-Accepted) is changing what `rva20u64` itself means: because RISC-V International's board subsequently made the C (compressed-instruction) extension mandatory in both RVA20 and RVA22 profiles, Go's original decision to exclude compressed instructions from `rva20u64` is being reversed. This is the umbrella issue that the current wave of compressed-instruction PRs references via "Updates #71105."

### 5.2 Build commands

Native build on a riscv64 host:
```
cd src && ./all.bash
```

Cross-compile from x86-64 (cgo disabled):
```
export GOOS=linux GOARCH=riscv64 GORISCV64=rva20u64 CGO_ENABLED=0
cd src && ./make.bash
```

Cross-compile with cgo (requires a riscv64 C toolchain):
```
export GOOS=linux GOARCH=riscv64 CGO_ENABLED=1
export CC_FOR_TARGET=riscv64-linux-gnu-gcc
cd src && ./make.bash
```

### 5.3 Bootstrap and C compiler requirements

Go 1.4 does not support linux/riscv64; a newer binary release or cross-compiled bootstrap tree is required (general rule: Go 1.N requires Go 1.(N-2, rounded to even) as bootstrap). Cgo requires a C compiler; the typical cross-compiler is `riscv64-linux-gnu-gcc` (Debian package `gcc-riscv64-linux-gnu`). Cross-compilation disables cgo by default unless `CGO_ENABLED=1` is set explicitly. `freebsd/riscv64` is listed as cgo-supported in the platform matrix but the port itself is broken ([#76475](https://github.com/golang/go/issues/76475)).

### 5.4 Known build failures

- [#70401](https://github.com/golang/go/issues/70401): build failure on `gotip-linux-riscv64` (open).
- [#79270](https://github.com/golang/go/issues/79270): `plugin` build mode failure on riscv64 ("consistent failure"); closed 2026-05-19.
- [#74734](https://github.com/golang/go/issues/74734) / [#73516](https://github.com/golang/go/issues/73516): riscv64 cannot build on FreeBSD with cgo, including a Go 1.23 backport; closed.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

### 6.1 Build modes

| Build mode | linux/riscv64 | linux/arm64 | Notes |
|---|---|---|---|
| `exe` (default) | Yes | Yes | |
| `pie` (external linker) | Yes | Yes | |
| `pie` (internal linker) | No | Yes | Blocked; CLs 741860, 742200 pending |
| `plugin` | Yes | Yes | Enabled via PR [#53029](https://github.com/golang/go/pull/53029) |
| `shared` | No | Yes | Not implemented |
| `c-archive` / `c-shared` | Yes | Yes | |

### 6.2 Sanitizers and instrumentation

| Feature | linux/riscv64 | linux/arm64 | Notes |
|---|---|---|---|
| Race detector (`-race`) | Yes | Yes | riscv64 builder too slow for regular racebuild ([#78258](https://github.com/golang/go/issues/78258)) |
| Address sanitizer (`-asan`) | Yes | Yes | `TestASAN` fails with SEGV on riscv64 ([#57691](https://github.com/golang/go/issues/57691), open since Jan 2023) |
| Memory sanitizer (`-msan`) | No | Yes | Requires compiler-rt support not available for riscv64 |
| Thread sanitizer (TSAN) | Partial | Yes | `TestTSAN/tsan8` failing ([#76816](https://github.com/golang/go/issues/76816), open) |
| Fuzzing instrumentation | No | Yes | riscv64 excluded from `FuzzInstrumented` list |

### 6.3 Crypto and FIPS

| Feature | linux/riscv64 | linux/arm64 | Notes |
|---|---|---|---|
| Pure-Go crypto (stdlib) | Yes | Yes | |
| Scalar assembly crypto (sha256, sha512, md5) | Yes | Yes | riscv64 uses Zbb rotation; scalar only |
| Vector/SIMD crypto (AES, GCM, ChaCha20, vector hashing) | No | Yes | No Zvkned/Zvknha/b assembly exists; confirmed by direct source inspection (Section 4.6) |
| BoringCrypto (`GOEXPERIMENT=boringcrypto`) | No | Yes | No `goboringcrypto_linux_riscv64.syso` exists; only linux/amd64 and linux/arm64 have precompiled `.syso` files |
| FIPS140 with `-buildmode=pie` | Broken | Yes | [#74683](https://github.com/golang/go/issues/74683), open; fix CLs (741860, 742200, 748040) posted but not merged as of research date |
| `x/crypto` SIMD paths (ChaCha20, Poly1305) | No | Yes | Pure Go fallback used; arm64/ppc64x/s390x have SIMD assembly |

### 6.4 Performance vs arm64

The best-documented gap is quantified in issue [#77541](https://github.com/golang/go/issues/77541) [NEEDS VERIFICATION, single primary source]: approximately 20-40% execution slowdown on riscv64 versus arm64 on CPU-intensive workloads, measured via the `golang.org/x/benchmarks` Bent suite on Go 1.25.6 with `GORISCV64=rva23u64`. Root cause: RISC-V's 12-bit signed immediate range forces a 3-instruction sequence (LUI+ADD recomputation) for large stack-frame offsets where arm64 uses a single instruction; the SSA backend's cost model treats this sequence as cheap enough to rematerialize on every loop iteration rather than hoist it, so it is recomputed repeatedly in hot loops. A structurally related issue, [#79298](https://github.com/golang/go/issues/79298) ("redundant LUI+ADD recomputation on large stack offsets"), is open with no fix landed.

A second, independently documented slowdown: issue [#50615](https://github.com/golang/go/issues/50615) (open) reports `bytes`/`strings` package tests taking 100-300 seconds on a riscv64 builder versus 1-2 seconds on other architectures (roughly 100x), and the `cmd/go` test suite taking approximately 300 seconds on riscv64 versus approximately 30 seconds elsewhere (roughly 10x) despite `cmd/go` having far more integration tests than `bytes` alone, implying a riscv64-specific slowdown (suspected cause: unoptimized string/byte primitives, not confirmed).

Measured (not merely proposed) optimizations, both requiring `GORISCV64=rva23u64`:

Crypto/sha256 assembler optimization (commit `6d55a017`, Go 1.23), measured on a StarFive VisionFive 2:

| Benchmark | Before | After | Delta |
|---|---|---|---|
| Hash8Bytes/New | 7.820 us | 5.193 us | -33.6% |
| Hash1K/New | 108.03 us | 66.12 us | -38.8% |
| Hash8K/New | 808.5 us | 493.0 us | -39.0% |
| Hash1K throughput | 9.041 MiB/s | 14.772 MiB/s | +63.4% |

Vectorized `internal/bytealg` memequal (commit `75ea2d05`), measured on a Banana Pi F3:

| Benchmark | Before | After | Delta |
|---|---|---|---|
| Equal/4K | 925.5 ns | 561.4 ns | -39.3% |
| Equal/4M | 3.110 ms | 2.463 ms | -20.8% |
| EqualBothUnaligned/4096_1 | 956.6 ns | 571.4 ns | -40.3% |
| Geomean timing | - | - | -13.9% |
| Geomean throughput | - | - | +17.2% |

Data not available: no published full-suite, third-party comparison of Go riscv64 versus arm64 across a representative application workload (HTTP server throughput, JSON parsing, GC-heavy workloads) was found in either the RISE blog materials or general web search.

### 6.5 Floating-point / correctness

No open NaN-handling or floating-point correctness bug specific to riscv64 was found in the current open-issue set beyond a capability gap: riscv64 lacks a true softfloat mode (issue [#75015](https://github.com/golang/go/issues/75015), open proposal) -- unlike MIPS, binaries built with `softfloat` on riscv64 still emit FPU instructions in assembly, so FPU-less riscv64 hardware cannot run them. A previously reported NaN-conversion bug (`uint32(math.NaN())` returning -1 on riscv64) was fixed in January 2024. Separately, two real compiler-correctness (miscompilation) bugs were found in this research pass; see Section 11.1.

## 7. CI/CD Infrastructure

**Go does not use GitHub Actions for its actual CI, on any architecture.** This was directly verified against a shallow clone of `golang/go` (HEAD `01e4798b9842e9df4d8fa2bfcd34f5fed522ffdb`, 2026-09-30): the `.github/` directory contains only `CODE_OF_CONDUCT.md`, `ISSUE_TEMPLATE/*.yml` (issue-form schemas, not workflows), `PULL_REQUEST_TEMPLATE`, and `SUPPORT.md`. There is no `.github/workflows/` directory at all, and no `.gitlab-ci.yml`, `Jenkinsfile`, or `.cirrus.yml` either. GitHub is a read-only mirror plus issue tracker; actual code review happens on Gerrit ([go-review.googlesource.com](https://go-review.googlesource.com)), and actual multi-platform CI is driven by Go's own LUCI-based build system (`golangbuild`), configured in the separate `golang.org/x/build` repository.

### 7.1 Active riscv64 builders

All RISC-V builders are reverse buildlets running on physical hardware, not QEMU or cloud VMs, per [golang.org/x/build/dashboard/builders.go](https://github.com/golang/build/blob/master/dashboard/builders.go):

| Builder name | Hardware | RAM/Cores | Owner | OS | Timeout scale |
|---|---|---|---|---|---|
| `linux-riscv64-unmatched` | SiFive HiFive Unmatched | 16 GB, 4 cores | mengzhuo (PLCT Lab) | Linux | 4x |
| `linux-riscv64-jsing` | SiFive HiFive Unleashed | 8 GB, 4 cores | Joel Sing | Linux | 4x |
| `freebsd-riscv64-unmatched` | SiFive HiFive Unmatched, FreeBSD 13.1-RELEASE | 16 GB, 4 cores | mengzhuo (PLCT Lab) | FreeBSD | 4x |
| `openbsd-riscv64-jsing` | physical reverse buildlet | - | Joel Sing | OpenBSD | 3x |

All builders apply `riscvDistTestPolicy`, which skips the `api` and `reboot` dist tests (the same policy applied to MIPS). Three additional `linux-riscv64-rva22u64-mengzhuo--bbw-{1,2,3}` (Banana Pi F3) bots are reported broken ([#79067](https://github.com/golang/go/issues/79067), [#79068](https://github.com/golang/go/issues/79068), [#79069](https://github.com/golang/go/issues/79069), open since April 2026), and `openbsd-riscv64-jsing` itself has an open "bot reported broken" issue ([#80506](https://github.com/golang/go/issues/80506)).

### 7.2 Cross-compilation-only coverage

`freebsd/riscv64` and `openbsd/riscv64` (Go 1.23+) are additionally exercised via misc-compile-only builders (compile, no execution); `golang.org/x/build` itself is excluded from riscv64 misc-compile due to a separate issue.

### 7.3 LUCI migration status

riscv64 builders have not been migrated to LUCI, unlike ppc64, loong64, and wasm, which have completed migration. This is corroborated by two open feature requests as of the research date: [#81534](https://github.com/golang/go/issues/81534) ("x/build: add LUCI linux-riscv64 builders with ISCAS," opened 2026-09-15) and [#80880](https://github.com/golang/go/issues/80880) ("x/build: add LUCI linux-riscv64 builder," opened 2026-08-14). Both being open and unresolved directly confirms riscv64 LUCI migration is still pending.

### 7.4 RISE Runners

RISE provides free native RISC-V CI on GitHub Actions ("RISE RISC-V Runners," Scaleway EM-RV1 hardware), announced March 2026 and reported on again in May 2026 ("six weeks in," covering 197 organizations at that point). The Go upstream project is not listed among organizations using RISE RISC-V Runners for its own CI as of that report; separately, RISE provided Scaleway EM-RV1 bare-metal RISC-V CI infrastructure to the Go project directly (September 2024 blog post), which is distinct infrastructure from the shared GitHub Actions runner service.

| Dimension | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI system | LUCI (`golang.org/x/build`) | LUCI | Legacy `build.golang.org` coordinator; LUCI migration pending ([#81534](https://github.com/golang/go/issues/81534), [#80880](https://github.com/golang/go/issues/80880)) |
| Hardware | Cloud VMs | Cloud VMs + Apple hardware | Physical, community-donated boards (3 of 4 core builders owned by one maintainer) |
| GitHub Actions used | No | No | No |

## 8. Distribution and Release Status

| Source | riscv64 present | Version / notes |
|---|---|---|
| [go.dev/dl](https://go.dev/dl/) (official upstream) | Yes | `go1.27.1.linux-riscv64.tar.gz`, `go1.27.1.openbsd-riscv64.tar.gz`, `go1.26.8.linux-riscv64.tar.gz`, `go1.26.8.openbsd-riscv64.tar.gz`, `go1.27.0.linux-riscv64.tar.gz`, `go1.26.7.linux-riscv64.tar.gz`, and the same pattern back through the 1.25.x series; also `freebsd-riscv64` tarballs (e.g. `go1.25.11.freebsd-riscv64.tar.gz`) |
| GitHub Releases (`github.com/golang/go/releases`) | N/A | Go does not publish binaries through GitHub Releases at all; the releases page shows "There aren't any releases here." All official distribution is via go.dev/dl tarballs |
| Ubuntu 26.04 ("resolute") | Yes | Confirmed via the Launchpad archive API (`packages.ubuntu.com` returned HTTP 503 throughout research and could not be used directly): `golang-go` version `2:1.26~1`, `distro_arch_series=ubuntu/resolute/riscv64`, status Published, published 2026-03-17 |
| Debian (buildd) | Yes | `golang-defaults 2:1.26~1`, status Installed, built on the `rv-manda-04` riscv64 buildd |
| Arch Linux RISC-V port | Contradictory, likely currently unavailable | An earlier build (`go-2:1.26.4-1-riscv64.pkg.tar.zst`, 40 MB, built 2026-06-03) previously existed on the mirror, but the port's own build-status tracker (`archriscv.felixc.at/.status/status.htm`), checked in this research pass, explicitly lists **"go - DEP MISSING: go=2:1.26.6 (make)"**, cited as a missing build dependency blocking the `dagger` package. This indicates the `go` package has since dropped out of the Arch RISC-V repo (a regression from a previously-built state, not a claim that it never built); current availability should be re-verified directly before relying on it [NEEDS VERIFICATION] |
| PyPI (`pypi.org/pypi/go/json`) | Not applicable | The `go` PyPI package is an unrelated namesake ("Quick directory changing," by Trent Mick), not the Go language; confirms PyPI is not a distribution channel for Go and has no riscv64 artifact of any kind |

A user on riscv64 gets a working Go toolchain by downloading the appropriate `go1.2X.Y.linux-riscv64.tar.gz` from go.dev/dl and extracting it, or via their distribution's package manager where riscv64 builds exist (confirmed: Debian, Ubuntu 26.04; unconfirmed/possibly regressed: Arch Linux RISC-V).

## 9. Dependencies

Go is largely self-hosted; most of its true runtime dependencies are OS/kernel-level rather than library-level. The table below covers every dependency specified for this assessment plus additional dependencies surfaced by research (`golang.org/x/net`, `golang.org/x/text`, OpenSSL), none of which were independently re-verified against live GitHub issue data in this pass because this session's GitHub access was scoped to `riseproject-dev/sw-ecosystem` only and could not reach `golang/go`, `google/boringssl`, or other dependency repositories directly.

| Dependency | Relation | Criticality | riscv64 status | Notes |
|---|---|---|---|---|
| golang.org/x/sys | runtime-dependency | critical | Builds, passes | Low-level OS syscall wrappers; two abandoned 2019 PRs (epoll_event padding fix, endian_little tag) whose resolution status could not be re-verified this pass [NEEDS VERIFICATION] |
| golang.org/x/crypto | runtime-dependency | optional | Builds (pure-Go fallback) | Extended crypto (ChaCha20, Poly1305, Curve25519, BLAKE2b); no riscv64 SIMD assembly exists, unlike the arm64/ppc64x/s390x paths |
| Linux kernel | runtime-dependency | critical | Functional | Required for the riscv64 syscall ABI, vdso, and the `riscv_hwprobe` syscall (258) used for runtime extension detection. Data not available: the minimum Linux kernel version required for full riscv64 hwprobe support was not identified in research findings |
| glibc | runtime-dependency | optional | Functional since glibc 2.27 (2018) | System C library for cgo and dynamic linking; present in all major riscv64 distributions |
| BoringSSL | runtime-dependency | optional | Not supported | Consumed via Go's BoringCrypto integration (`GOEXPERIMENT=boringcrypto`); no `goboringcrypto_linux_riscv64.syso` exists -- only linux/amd64 and linux/arm64 have precompiled `.syso` files. This blocks any deployment requiring FIPS validation via the BoringCrypto path on riscv64 |
| GCC | build-dependency | optional | Functional | Required only for cgo builds; `riscv64-linux-gnu-gcc` is available (Debian package `gcc-riscv64-linux-gnu`); clang also supports riscv64 as an alternative |
| golang.org/x/net (indirect) | runtime-dependency | optional | Builds, passes | HTTP/2, QUIC, DNS, websocket; no known riscv64-specific open issues |
| golang.org/x/text (indirect) | runtime-dependency | optional | Builds, passes | Unicode/text processing; no known riscv64-specific issues |
| OpenSSL (indirect, alternate FIPS path) | runtime-dependency | optional | Conditional | Alternative FIPS crypto backend via `GODEBUG=fips140=on`; availability depends entirely on the completeness of OpenSSL's own riscv64 assembly, not verified in this pass |

Go's own riscv64-specific bugs (memory corruption [#78161](https://github.com/golang/go/issues/78161), FIPS+PIE [#74683](https://github.com/golang/go/issues/74683), the ~20-40% performance gap [#77541](https://github.com/golang/go/issues/77541)) are internal to the Go toolchain itself, not dependency issues, and are covered in Sections 6 and 11.

## 11. Known Bugs and Active Issues

### 11.1 Correctness bugs

| Issue | Title | Status | Notes |
|---|---|---|---|
| [#80127](https://github.com/golang/go/issues/80127) | cmd/compile: riscv64 miscompiles struct copy, corrupting a []byte slice field | Closed, fixed, backported ([#80477](https://github.com/golang/go/issues/80477), [#80478](https://github.com/golang/go/issues/80478)) | Confirmed compiler correctness bug, default-optimization-only (bug disappears under `-N -l`), found via Kubernetes-style test failures. A `RawExtension{Raw: []byte}` field embedded in a struct was corrupted on a second struct-copy on riscv64 only; amd64 unaffected. Fixed and backported to Go 1.25/1.26 |
| [#78161](https://github.com/golang/go/issues/78161) | runtime: memory corruption leading to panic on linux/riscv64 | Open, no assignee, help wanted, NeedsInvestigation | SIGSEGV inside `fmt.(*buffer).writeString` on go1.26.1 / MilkV Pioneer (Alpine); a struct field held a corrupted value (1342943200 instead of 77). Inserting an unused statement made the bug disappear, strongly suggesting a compiler code-layout/inlining bug analogous to #80127 rather than a hardware fault; unresolved as of research date |
| [#77328](https://github.com/golang/go/issues/77328) | cmd/internal/obj/riscv: add Zvkned extension support | Open | Vector-crypto extension support gap; a prior PR (#77326) was abandoned |

### 11.2 Performance issues

| Issue | Title | Impact | Status |
|---|---|---|---|
| [#77541](https://github.com/golang/go/issues/77541) | Instruction bloat in hot loops from large stack-frame offsets | ~20-40% vs arm64 | Open, NeedsInvestigation, root-caused, no fix CL |
| [#79298](https://github.com/golang/go/issues/79298) | Redundant LUI+ADD recomputation on large riscv stack offsets | Structural inefficiency | Open |
| [#50615](https://github.com/golang/go/issues/50615) | bytes,strings tests appear to take ~100x as long on riscv | ~100x on targeted tests, ~10x on cmd/go suite | Open, NeedsInvestigation |
| [#78258](https://github.com/golang/go/issues/78258) | linux-riscv64 builder too slow to run racebuild | Blocks race-enabled testing | Open |

### 11.3 Open feature / infrastructure issues

| Issue | Title | Notes |
|---|---|---|
| [#81892](https://github.com/golang/go/issues/81892) | simd/archsimd: support RISC-V RVV SIMD intrinsics under GOEXPERIMENT | Open, newest riscv64 issue found (2026-09-30) |
| [#81534](https://github.com/golang/go/issues/81534) / [#80880](https://github.com/golang/go/issues/80880) | x/build: add LUCI linux-riscv64 builders | Both open; LUCI migration not complete |
| [#76475](https://github.com/golang/go/issues/76475) | build: freebsd/riscv64 port is broken | Open, whole-port breakage |
| [#74683](https://github.com/golang/go/issues/74683) | FIPS140 broken on RISC-V with -buildmode=pie | Open, assigned; fix CLs (741860, 742200, 748040) posted, partially verified on MilkV Megrez, not merged |
| [#68862](https://github.com/golang/go/issues/68862) | runtime: SIGSEGV in preemptone (riscv64) | Open; suspected BananaPi-F3/SpacemiT K1 kernel-level mmap bug, blocked on vendor kernel fix |
| [#75015](https://github.com/golang/go/issues/75015) | proposal: runtime softfloat for RISCV target | Open proposal; riscv64 lacks a true softfloat mode, unlike MIPS |
| [#76065](https://github.com/golang/go/issues/76065) | proposal: add flag to support riscv optional extensions | Open proposal |
| [#74540](https://github.com/golang/go/issues/74540) | proposal: add GORISCV64=g | Open proposal |
| [#61416](https://github.com/golang/go/issues/61416) | x/sys/unix, x/sys/cpu: use RISC-V Hardware Probing Interface on Linux | Open |
| [#57691](https://github.com/golang/go/issues/57691) | TestASAN fails with SEGV on unknown address on linux/riscv64 | Open since Jan 2023 |
| [#53721](https://github.com/golang/go/issues/53721) | runtime crash on linux-riscv64-jsing during bootstrap | Open, NeedsInvestigation |
| [#79067](https://github.com/golang/go/issues/79067) / [#79068](https://github.com/golang/go/issues/79068) / [#79069](https://github.com/golang/go/issues/79069) | x/build: bots linux-riscv64-rva22u64-mengzhuo--bbw-1/2/3 broken | Open since April 2026 |
| [#80506](https://github.com/golang/go/issues/80506) | x/build: bot openbsd-riscv64-jsing reported broken | Open |

### 11.4 Notable pull requests

**Open:** Zicbop assembly ([#81193](https://github.com/golang/go/pull/81193)), base64 riscv64 assembly ([#81160](https://github.com/golang/go/pull/81160)), crc32 riscv64 assembly ([#78918](https://github.com/golang/go/pull/78918)), CMO extension assembly ([#77152](https://github.com/golang/go/pull/77152)), Zfa extension assembly ([#76996](https://github.com/golang/go/pull/76996)), Zihintntl/zawrs/spin-lock support ([#76178](https://github.com/golang/go/pull/76178), [#76181](https://github.com/golang/go/pull/76181), [#76183](https://github.com/golang/go/pull/76183)), Zba compiler support ([#76211](https://github.com/golang/go/pull/76211)), P256mul optimization ([#77069](https://github.com/golang/go/pull/77069)), indexbyte/memequal optimizations ([#79997](https://github.com/golang/go/pull/79997), [#79998](https://github.com/golang/go/pull/79998)), predictable prologue ([#63498](https://github.com/golang/go/pull/63498), long-lived since 2023), `X1` named as `RA` ([#52258](https://github.com/golang/go/pull/52258), long-lived since 2022).

**Merged (verified against master commit history via `GitHub-Pull-Request` trailers, since GitHub's own "merged" flag is unreliable for this repository -- see note below):** jump table implementation ([#78515](https://github.com/golang/go/pull/78515), commit `8e35b7dc52`, targets Go 1.28 dev), stackcheck implementation ([#64074](https://github.com/golang/go/pull/64074), commit `e68a67f6de`, Go 1.28 dev, open on GitHub since November 2023 before landing), Zicond codegen ([#75577](https://github.com/golang/go/pull/75577), commit `ca94cf1247`, Go 1.27 released), Zbc extension detection ([#78862](https://github.com/golang/go/pull/78862), commit `122eb7d035`, Go 1.27 released), stackcheck removal for openbsd/riscv64 ([#80553](https://github.com/golang/go/pull/80553), commit `d50f3c4fa8`, Go 1.28 dev), async preemption ([#38146](https://github.com/golang/go/pull/38146), Go 1.15), plugin support ([#53029](https://github.com/golang/go/pull/53029), Go 1.19), cgo support ([#41930](https://github.com/golang/go/pull/41930)).

**Methodology note:** Go develops on Gerrit, not GitHub; GitHub PRs are auto-mirrored and closed (never GitHub-"merged") once the corresponding Gerrit CL submits. A literal `is:merged` search across all riscv64-titled PRs returns zero results even though several of those PRs are verifiably on master today. Merge status above was independently confirmed via `search_commits` matching each commit's `GitHub-Pull-Request: golang/go#NNNNN` trailer, not via GitHub's PR-merged flag.

### 11.5 Other notable closed/fixed bugs

| Issue | Title | Resolution |
|---|---|---|
| [#64917](https://github.com/golang/go/issues/64917) | cmd/compile: uint32(math.NaN()) returns -1 on riscv64 | Fixed Jan 2024 |
| [#74606](https://github.com/golang/go/issues/74606) | cmd/compile: riscv performance regression | Fixed Jul 2025, inlining heuristic caused ~4x benchmark variance |
| [#76654](https://github.com/golang/go/issues/76654) | Incorrect use of T0/X5 register causing RAS mismatch | Fixed (Go 1.27) |
| [#79270](https://github.com/golang/go/issues/79270) | plugin: build failure on riscv64 | Fixed 2026-05-19 |
| [#78045](https://github.com/golang/go/issues/78045) | go1.26 SIGILL on riscv64 with vector support | Fixed |
| [#77209](https://github.com/golang/go/issues/77209) | cmd/link: wrong dynamic loader path on Linux riscv64 | Fixed |
| [#73591](https://github.com/golang/go/issues/73591) | cmd/link: RISC-V mapping symbols aren't handled correctly | Fixed via PR [#73592](https://github.com/golang/go/pull/73592), closed 2026-05-04 |
| [#75350](https://github.com/golang/go/issues/75350) | cmd/compile, cmd/asm: add support for Zicond extension | Closed 2026-03-11 |
| [#80847](https://github.com/golang/go/issues/80847) | cmd/asm: riscv64 VRORVI rejects valid immediate values from 32 to 63 | Fixed, closed 2026-08-19 |
| [#72840](https://github.com/golang/go/issues/72840) | cmd/link: panic on riscv64 with CGO enabled due to empty container symbol | Fixed |

## 12. Objections and Upstream Blockers

**Objection 1: The port is secondary tier -- a broken build does not block releases.** Confirmed as the correct, explicit characterization of current status per Go's own porting policy. Breakage goes to Backlog, not a release gate. The practical consequence is that issues like #78161 (memory corruption) and #74683 (FIPS+PIE broken) can remain open across multiple release cycles. Engineering leadership must weigh whether secondary-tier status is acceptable for production deployments, or whether investment is needed to drive first-class status, which would require Google buy-in given Google's two-reviewer merge-control mechanism (Section 1).

**Objection 2: BoringCrypto and vector crypto are unavailable on riscv64.** Confirmed. `GOEXPERIMENT=boringcrypto` has no riscv64 `.syso`. The alternative native-Go FIPS path (`GOFIPS140`) is itself broken with `-buildmode=pie` on riscv64 (#74683); fix CLs exist but are unmerged. A deployment requiring both FIPS and PIE on riscv64 is not currently possible with the Go toolchain. Separately, no AES/GCM or vector-crypto (Zvkned/Zvknha/b) assembly exists at all for riscv64, confirmed by direct source inspection (Section 4.5/4.6).

**Objection 3: There is a structural, unaddressed 20-40% performance gap versus arm64 on CPU-intensive workloads.** Confirmed by a single primary source (#77541) [NEEDS VERIFICATION, corroborating benchmark not independently reproduced]; root cause (SSA cost-model mishandling of RISC-V's narrow immediate range) is architecturally identified and addressable via compiler engineering, but no fix CL has been posted for either #77541 or the related #79298. A second, separately documented slowdown (#50615, ~100x on specific test suites) suggests the performance gap is broader than the single quantified benchmark captures.

**Objection 4: CI hardware is fragile and community-donated, not vendor-grade.** Confirmed: 3 of 4 core riscv64 builders are owned by a single individual (mengzhuo/PLCT Lab); the fourth is owned by another individual contributor (Joel Sing). Additional Banana Pi F3 bots have triggered hardware-level bugs (#68862) and are currently reported broken (#79067-69). The `freebsd/riscv64` port is formally broken (#76475). If the PLCT Lab-owned machines go offline, linux/riscv64 CI coverage would drop to a single 8 GB, 4-core SiFive HiFive Unleashed board. LUCI migration, which could bring more robust/scalable infrastructure, remains open and unstarted per #81534/#80880.

**Objection 5: Multiple significant PRs took a long time to land, and some remain stalled.** Confirmed with an important correction: several PRs previously appearing stalled on GitHub (jump tables #78515, stackcheck #64074, Zicond codegen #75577, Zbc detection #78862, openbsd stackcheck removal #80553) have in fact merged via Gerrit and landed in Go 1.27 (released) or Go 1.28 (dev), despite showing as "closed" rather than "merged" on GitHub's own UI -- this is a structural quirk of Go's Gerrit-mirrored workflow, not evidence of stalled review. Genuinely still-open and unlanded: predictable-prologue (#63498, open since 2023), `X1` register naming (#52258, open since 2022), Zba compiler codegen (#76211), and the Zvkned vector-crypto assembler support (#77328, prior attempt #77326 abandoned).

## 13. Readiness Assessment

- **Color:** green
- **Release provider:** upstream
- **Justification:** Go's linux/riscv64 port has upstream CI that builds and runs the full dist test suite on dedicated native hardware builders (linux-riscv64-unmatched, linux-riscv64-jsing per [golang.org/x/build/dashboard/builders.go](https://github.com/golang/build/blob/master/dashboard/builders.go)), and upstream publishes official riscv64 binary releases directly at [go.dev/dl](https://go.dev/dl/) (e.g. go1.26.4.linux-riscv64.tar.gz). Go is a general-purpose language/compiler toolchain, not a RISC-V-optimization-purpose project, so the optimization-gap modifier (Step 2) does not apply.
- **Pending work that could change the grade:** Open: memory-corruption bug on linux/riscv64 (golang/go#78161, unresolved, compiler-inlining related), freebsd/riscv64 port broken (golang/go#76475), FIPS140+PIE breakage on riscv64 (golang/go#74683, fix CLs posted but unmerged), ~20-40% perf gap vs arm64 rooted in SSA stack-offset handling (golang/go#77541, root-caused, unfixed), and the umbrella compressed-instruction proposal (golang/go#71105) driving many in-flight PRs (Zicbop #81193, CRC32 #78918, base64 #81160, jump tables #78515). RISE Project funded RP001 "Accelerate the Go Runtime on RISC-V" (Ludovic Henry, Mark Ryan) and separately provided Scaleway EM-RV1 bare-metal CI hardware to the Go project. riscv64 remains a "secondary port" under Go's official tiering (not release-blocking), with CI hardware concentrated on community-donated machines (3 of 4 core riscv64 builders owned by a single maintainer, mengzhuo/PLCT Lab).

## 14. Investment Analysis

RISE has already funded substantive upstream work under Project RP001 ("Accelerate the Go Runtime on RISC-V," Ludovic Henry and Mark Ryan): vectorized `internal/bytealg`, handcoded `math/big` and crypto (md5, sha256, sha512) assembly, RVA20/RVA22/RVA23 build-profile support, riscv64 plugin support, dynamic hardware-extension probing, and provision of Scaleway EM-RV1 bare-metal CI hardware. None of the effort estimates below duplicate that already-completed work.

### 14.1 Functional Enablement

| Work item | Current state | Required work | Priority |
|---|---|---|---|
| Fix FIPS140 + PIE on riscv64 (#74683) | Fix CLs exist (741860, 742200, 748040), partially verified, not merged | Review and submit existing CLs; validate on additional hardware | Critical |
| Fix memory corruption / inlining miscompile (#78161) | Open, no CL, help wanted | Bisect compiler inlining path on riscv64; likely related in class to the now-fixed #80127 | Critical |
| BoringCrypto riscv64 `.syso` | Not supported | Build `goboringcrypto_linux_riscv64.syso` from BoringSSL; FIPS validation scope TBD | Medium (FIPS-mandatory deployments) |
| freebsd/riscv64 port (#76475) | Broken | Diagnose and fix; evaluate whether to promote or remove | Medium |
| Land Zvkned vector-crypto assembler support (#77328) | Open, prior attempt (#77326) abandoned | New implementation + review | Medium |

### 14.2 Performance Optimization

| Work item | Current state | Required work | Priority |
|---|---|---|---|
| Fix instruction bloat in hot loops (#77541, #79298) | Root cause identified, no CL | SSA cost-model improvements; hoist large-stack-offset LUI+ADD sequences out of loops | High |
| Investigate bytes/strings ~100x slowdown (#50615) | Open, NeedsInvestigation, no root cause confirmed | Profile bytes/strings primitives on riscv64 hardware | High |
| Land Zba compiler codegen (#76211) | PR open | Reviewer attention | Medium |
| Vectorized crypto via Zvkned/Zvknha/b (AES, GCM, vector hashing) | No assembly exists | Write assembly and tests | Medium |
| `x/crypto` SIMD (ChaCha20, Poly1305) | Pure Go fallback only | Write riscv64 assembly analogous to arm64 implementation | Medium |
| Merge remaining open extension-support PRs (#81193 Zicbop, #81160 base64, #78918 crc32, #77152 CMO, #76996 Zfa, #76178/76181/76183) | Open, part of the #71105 compressed-instruction wave | Reviewer bandwidth | Low-Medium |

### 14.3 CI/CD Infrastructure

| Work item | Current state | Required work | Priority |
|---|---|---|---|
| Repair broken CI bots (#79067-69, #80506) | Multiple bots reported broken | Hardware replacement or migration to cloud (Scaleway EM-RV1 via RISE) | High |
| Diversify builder ownership | 3 of 4 core builders owned by one maintainer | Add independently-owned/vendor-supported hardware | High |
| Enable racebuild on riscv64 (#78258) | Builder too slow | Faster hardware or parallelism | Medium |
| LUCI migration (#81534, #80880) | Not started, both issues open | Port builder definitions; coordinate with Google infra team | Medium |

### 14.4 Ecosystem Enablement

| Work item | Current state | Required work | Priority |
|---|---|---|---|
| Fuzzing instrumentation on riscv64 | Not implemented | Port coverage-guided fuzzing to riscv64 | Medium |
| RVV SIMD intrinsics (`simd/archsimd`) for riscv64 (#81892) | Open proposal, no implementation | Design and implement RVV backend for the generics SIMD package | Medium-Low |
| MSan support on riscv64 | Not supported | Requires an upstream compiler-rt port | Low |
| Shared library build mode (`-buildmode=shared`) | Not supported | Linker work | Low |

### 14.5 Summary Table

| Area | Work item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Fix FIPS140 + PIE (#74683) | 2-4 (review + validate existing CLs) | Reviewer + QA | Critical |
| Functional | Fix memory corruption / inlining miscompile (#78161) | 4-8 (bisect + fix) | Compiler engineer with riscv64 knowledge | Critical |
| Performance | Investigate bytes/strings ~100x slowdown (#50615) | 2-4 (profiling + fix) | Go runtime/compiler engineer | High |
| Performance | Fix instruction bloat in hot loops (#77541, #79298) | 6-10 (SSA cost model) | Go compiler engineer (riscv64) | High |
| Infrastructure | Repair and diversify CI bots (#79067-69, #80506) | 2-4 (hardware + config) | mengzhuo / RISE | High |
| Functional | BoringCrypto riscv64 `.syso` | 4-8 + separate FIPS validation | BoringSSL + FIPS lab | Medium |
| Performance | Vectorized crypto (Zvkned/Zvknha/b) | 8-16 (write assembly + tests) | Crypto + riscv64 engineer | Medium |
| Performance | x/crypto SIMD (ChaCha20, Poly1305) | 4-8 | Go crypto engineer | Medium |
| Infrastructure | Enable racebuild (#78258) | 1-2 (hardware) | mengzhuo / RISE | Medium |
| Infrastructure | LUCI migration (#81534, #80880) | 2-4 | Google infra + riscv64 maintainer | Medium |
| Ecosystem | Fuzzing instrumentation | 8-16 | Go runtime engineer | Medium |
| Ecosystem | RVV SIMD intrinsics (#81892) | 8-16 (design + implement) | Go compiler engineer + RISE | Medium-Low |
| Functional | freebsd/riscv64 port repair (#76475) | 2-4 | riscv64 maintainer | Medium |

## 15. References

- [golang/go repository](https://github.com/golang/go)
- [Issue #27532: all: port to RISC-V (closed, master tracking issue)](https://github.com/golang/go/issues/27532)
- [Issue #71105: cmd/compile: change GORISCV64=rva20u64 to include compressed instructions (umbrella proposal)](https://github.com/golang/go/issues/71105)
- [Issue #80127: cmd/compile: riscv64 miscompiles struct copy, corrupting a []byte slice field](https://github.com/golang/go/issues/80127)
- [Issue #78161: runtime: memory corruption leading to panic on linux/riscv64](https://github.com/golang/go/issues/78161)
- [Issue #74683: crypto/internal/fips140,cmd/link: fips140 broken on RISC-V with -buildmode=pie](https://github.com/golang/go/issues/74683)
- [Issue #77541: instruction bloat in hot loops from large stack-frame offsets](https://github.com/golang/go/issues/77541)
- [Issue #79298: redundant LUI+ADD recomputation on large riscv stack offsets](https://github.com/golang/go/issues/79298)
- [Issue #50615: bytes,strings tests appear to take ~100x as long on riscv](https://github.com/golang/go/issues/50615)
- [Issue #76475: build: freebsd/riscv64 port is broken](https://github.com/golang/go/issues/76475)
- [Issue #78258: linux-riscv64 builder too slow to run racebuild](https://github.com/golang/go/issues/78258)
- [Issue #68862: runtime: SIGSEGV in preemptone (riscv64)](https://github.com/golang/go/issues/68862)
- [Issue #81892: simd/archsimd: support RISC-V RVV SIMD intrinsics under GOEXPERIMENT](https://github.com/golang/go/issues/81892)
- [Issue #81534: x/build: add LUCI linux-riscv64 builders with ISCAS](https://github.com/golang/go/issues/81534)
- [Issue #80880: x/build: add LUCI linux-riscv64 builder](https://github.com/golang/go/issues/80880)
- [Issue #75015: proposal: runtime: softfloat for RISCV target](https://github.com/golang/go/issues/75015)
- [PR #78515: jump table implementation on riscv64](https://github.com/golang/go/pull/78515)
- [PR #64074: runtime: implement stackcheck for riscv64](https://github.com/golang/go/pull/64074)
- [PR #75577: cmd/compile/internal/ssa: add codegen for Zicond extension on riscv64](https://github.com/golang/go/pull/75577)
- [PR #81193: cmd/internal/obj/riscv: add assembly support for Zicbop on RISCV64](https://github.com/golang/go/pull/81193)
- [PR #53029: cmd/link: enable go plugin support for riscv64](https://github.com/golang/go/pull/53029)
- [PR #41063: doc: add linux/riscv64 valid combination](https://github.com/golang/go/pull/41063)
- [golang.org/x/build dashboard/builders.go](https://github.com/golang/build/blob/master/dashboard/builders.go)
- [go.dev/wiki/PortingPolicy](https://go.dev/wiki/PortingPolicy)
- [RISE Project blog: Advancing Go on RISC-V (April 2025)](https://riseproject.dev/2025/04/04/advancing-go-on-risc-v-progress-through-the-rise-project/)
- [RISE Project blog: Leveraging Scaleway (September 2024)](https://riseproject.dev/2024/09/09/leveraging-scaleway-to-support-the-risc-v-software-ecosystem/)
- [RISE Project blog: RISC-V Runners six weeks in (May 2026)](https://riseproject.dev/2026/05/12/rise-risc-v-runners-six-weeks-in/)
- [RISE Project members](https://riseproject.dev/members/)
- [go.dev/dl: Go downloads](https://go.dev/dl/)
- [RISC-V Bytes: Go 1.19's Register-Based Calling Convention (Daniel Mangum)](https://danielmangum.com/posts/risc-v-bytes-go-1-19-register-calling/)
- [golang/go proposal #18597 (register-based calling convention)](https://github.com/golang/go/issues/18597)
- [Arch Linux RISC-V port build status](https://archriscv.felixc.at/.status/status.htm)