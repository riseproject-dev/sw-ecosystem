---
title: Go
parent: Project Reports
categories:
  - runtimes
  - containers
---

# Go

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Scope:** RISC-V (riscv64/linux) support status for Go<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

---

## 1. Project Overview

Go is a compiled, garbage-collected systems programming language developed and maintained by Google. It is not affiliated with any independent foundation (no CNCF, Linux Foundation, or similar body). The project is governed by a small core team of Google employees. Final merge authority rests with the Google core team; the contribution process requires +2 Code-Review approval from a Go maintainer. Significant language or runtime changes require a formal accepted proposal. Go is not a RISE Project member. RISE Premier Members include Google, Red Hat, NVIDIA, SiFive, Qualcomm, MediaTek, Andes Tech, Tenstorrent, and DAMO Academy (Alibaba).

- **Repository:** [https://github.com/golang/go](https://github.com/golang/go)
- **Homepage:** [https://golang.org/](https://golang.org/)
- **License:** BSD 3-Clause
- **Language:** Go (self-hosted compiler), C (cgo bridge), Assembly

---

## 2. Port History and Upstreaming Timeline

The linux/riscv64 port was a community-driven effort initiated by Tobias Klauser (Cilium/Isovalent) and completed primarily by Joel Sing (OpenBSD developer). An early out-of-tree port existed at `github.com/riscv/riscv-go` but was abandoned by 2018, which motivated the upstream effort.

| Date | Event | Source |
|---|---|---|
| 2018-04-11 | First RISC-V commit: `go/build, runtime/internal/sys: reserve RISC-V arch names` (Tobias Klauser) | commit `9446eaa9443c` |
| 2018-04-18 | `debug/elf: add riscv64 relocations` (Tobias Klauser), references out-of-tree port | commit `96f6cc15949c` |
| 2018-09-06 | Issue [#27532](https://github.com/golang/go/issues/27532) "all: port to RISC-V" filed as official tracking issue | issue #27532 |
| 2019-09-07 | Joel Sing submits assembler and register definitions for `cmd/internal/obj/riscv` | upstream Gerrit |
| 2020-01-22 | Joel Sing adds missing runtime code for linux/riscv64 | upstream Gerrit |
| Feb 2020 | **Go 1.14:** First official release with `linux/riscv64`, marked **experimental** | Go 1.14 release notes |
| ~2020 | CGo support added for the riscv port, issue [#36641](https://github.com/golang/go/issues/36641) closed | issue #36641 |
| 2024-01-25 | `openbsd/riscv64` port completed, issue [#55999](https://github.com/golang/go/issues/55999) closed | issue #55999 |
| 2025-02-20 | Plugin build mode (`-buildmode=plugin`) implemented for riscv64 (Gerrit CL 420114) | commit `cdc9560` |
| 2026 (current) | Active development: vector ISA, compressed instructions, crypto, jump tables, atomic intrinsics | tracker below |

The port graduated from experimental status at some point after Go 1.14. The exact release that removed the experimental caveat is not recorded in the research findings. Data not available: precise Go version when linux/riscv64 was promoted from experimental to secondary port.

---

## 3. Upstream Support Tier

Go defines two port tiers.

**First-class ports** (broken builds block releases, Google-owned builders required): darwin/amd64, darwin/arm64, linux/386, linux/amd64, linux/arm, linux/arm64, windows/386, windows/amd64.

**Secondary ports** (broken builds do not block releases, community-maintained builders): `linux/riscv64` is a **secondary port**. The consequences are:

- A broken riscv64 build does not require a release rollback or delay.
- The port requires at least two named maintainers listed in the golang/port-maintainers GitHub team subgroups.
- Port-specific changes must be reviewed by a port maintainer before merge.
- If a builder fails repeatedly with no fix in progress, the port may be removed in the next release.

The supported GOOS/GOARCH combinations for riscv64 are:

| GOOS | GOARCH | CGo | Status |
|---|---|---|---|
| linux | riscv64 | yes | supported |
| freebsd | riscv64 | yes | **Broken** ([go.dev/issue/76475](https://github.com/golang/go/issues/76475)) |
| openbsd | riscv64 | yes | supported |

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

The Go toolchain is self-hosted. RISC-V support spans the following subsystems.

### 4.1 Compiler Backend

- **`src/cmd/compile/internal/riscv64/ssa.go`** (~650 lines): SSA code generation. Covers RV64I, M (mul/div), A (atomics LR/SC/AMO), F/D (float/FMA), Zba (SH1ADD/SH2ADD/SH3ADD), Zbb (CLZ/CTZ/CPOP/REV8/MIN/MAX/ANDN/ORN/XNOR), Zicond (CZEROEQZ/CZERONEZ).
- **`src/cmd/compile/internal/ssa/rewriteRISCV64.go`** (11,227 lines, auto-generated): Full generic-to-RISC-V SSA translation. Zba/Zbb rules are gated on `GORISCV64 >= 22`.
- **`src/cmd/compile/internal/ssa/rewriteRISCV64latelower.go`** (~330 lines, auto-generated): Late-lowering -- fuses AND/OR/XOR+NOT into Zbb ANDN/ORN/XNOR; shift-extend elision.

### 4.2 Assembler Object Backend

- **`src/cmd/internal/obj/riscv/cpu.go`** (~950 lines): All register constants (X0-X31, F0-F31, V0-V31), instruction mnemonics, relocation types, rounding modes, `EncodeVectorType()`. Covers RV64I, Zicsr, Zicond, M, Zalrsc, Zaamo, F/D/Q, C, Zba/Zbb/Zbc/Zbs, V, Zvbb/Zvbc, Privileged ISA.
- **`src/cmd/internal/obj/riscv/inst.go`** (2,191 lines, auto-generated): `encode()` maps ~1,080+ instruction mnemonics to raw opcode tuples across 29 extension families.
- **`src/cmd/internal/obj/riscv/obj.go`** (2,500+ lines): Full assembler pass including compressed instructions (CA/CB/CI/CIW/CJ/CL/CR/CS/CSS), vector config (Vsetvli/Vsetivli/Vsetvl), all R/I/S/B/U/J-type variants.

The compressed instruction (RVC) support was added in November 2025 via commits `9859b43` and `b9ef063`.

### 4.3 Linker

- **`src/cmd/link/internal/riscv64/asm.go`** (~430 lines): ELF relocations, PLT/GOT, trampolines. Handles R_RISCV_CALL, R_RISCV_JAL, R_RISCV_PCREL_HI20/LO12, R_RISCV_GOT_HI20, R_RISCV_TLS_IE/LE, R_RISCV_RVC_BRANCH/JUMP, R_RISCV_ADD32/SUB32, R_RISCV_RELAX.

### 4.4 Runtime

- **`src/runtime/asm_riscv64.s`** (~820 lines): Entry points, goroutine control, stack management, CGo interop, GC write barriers, reflection dispatch (27 CALLFN variants), `cputicks` via RDTIME.
- **`src/internal/cpu/cpu_riscv64_linux.go`** (~97 lines): Runtime extension detection via `riscv_hwprobe` syscall (syscall 258). Detects: V, Zbb, Zbc, Zvbb, Zvbc, Zvkb, Zvkg, Zvkned, Zvknha/b, Zvksed, Zvksh, Zvkt, and fast-misaligned. Note: AT_HWCAP V-bit detection is used but documented as unreliable across vendors.
- **`src/runtime/cgo/gcc_riscv64.S`** (~72 lines): `crosscall1` -- saves 14 integer + 12 float callee-saved registers for GCC-to-Go ABI bridge.

### 4.5 Standard Library -- RISC-V-Specific Assembly

| Package | File | ISA Extensions | Notes |
|---|---|---|---|
| `crypto/internal/fips140/sha256` | `sha256block_riscv64.s` (~175 lines) | Zbb (RORW) | Scalar only -- no Zvknha/b |
| `crypto/internal/fips140/sha512` | `sha512block_riscv64.s` (~215 lines) | Zbb (ROR) | Scalar only -- no Zvknhb |
| `crypto/internal/fips140/bigmod` | `nat_riscv64.s` (~90 lines) | M (MUL/MULHU) | `addMulVVW{1024,1536,2048}` |
| `math` | `dim_riscv64.s`, `exp_riscv64.s`, `floor_riscv64.s` | D, FMA | `FMAXD`/`FMIND`, `FMADDD`/`FNMSUBD` |
| `internal/bytealg` | `indexbyte_riscv64.s` | RV64I | Optimization open, PR [#79997](https://github.com/golang/go/pull/79997) pending |
| `internal/bytealg` | memequal | V (rva23u64) | Vectorized, merged (commit `75ea2d05`) |
| `reflect` | `float32reg_riscv64.s` | F, D | NaN-box handling |

### 4.6 ISA Extension Coverage Summary

| Extension | Assembler | Compiler codegen | Runtime detection | Stdlib assembly |
|---|---|---|---|---|
| RV64I (base) | Yes | Yes | N/A | Yes |
| M (multiply) | Yes | Yes | N/A | Yes (bigmod) |
| A / Zalrsc / Zaamo (atomics) | Yes | Yes | N/A | -- |
| F/D (float) | Yes | Yes | N/A | Yes (math) |
| C (compressed) | Yes | -- | N/A | -- |
| Zba | Yes | Yes (rva22u64+) | -- | -- |
| Zbb | Yes | Yes | Yes | Yes (sha256, sha512) |
| Zbc | Yes | -- | Yes | -- |
| Zbs | Yes | -- | -- | -- |
| Zicond | Yes | Yes | -- | -- |
| Zicsr | Yes | -- | N/A | -- |
| V (RVV 1.0) | Yes (full) | -- | Yes | Yes (bytealg) |
| Zvbb/Zvbc | Yes (encoding) | -- | Yes | -- |
| Zvkg/Zvkned/Zvknha/b/Zvksed/Zvksh/Zvkt | Yes (encoding) | -- | Yes | -- |

---

## 5. Build System, Cross-Compilation, and Toolchain

Go uses its own `make.bash` / `all.bash` build system. There are no CMake files, no Dockerfiles, and no GitHub Actions workflow files in the repository.

### 5.1 GORISCV64 Environment Variable

Controls the minimum RISC-V ISA profile for generated code. Invalid values produce a fatal build error.

| Value | Meaning | Default |
|---|---|---|
| `rva20u64` | RVA20U64 mandatory extensions only | Yes |
| `rva22u64` | RVA22U64 mandatory extensions | -- |
| `rva23u64` | RVA23U64 mandatory extensions (Go 1.23+) | -- |

The value is passed to the assembler as `-D GORISCV64_rva20u64` (etc.) so assembly can perform conditional compilation per profile.

### 5.2 Build Commands

Native build on a riscv64 host:
```bash
cd src && ./all.bash
```

Cross-compile from x86-64 (CGo disabled):
```bash
export GOOS=linux GOARCH=riscv64 GORISCV64=rva20u64 CGO_ENABLED=0
cd src && ./make.bash
```

Cross-compile with CGo (requires riscv64 C toolchain):
```bash
export GOOS=linux GOARCH=riscv64 CGO_ENABLED=1
export CC_FOR_TARGET=riscv64-linux-gnu-gcc
cd src && ./make.bash
```

### 5.3 Bootstrap Compiler Requirements

Go 1.4 does not support linux/riscv64. A newer binary release or cross-compiled bootstrap tree is required. General rule: Go 1.N requires Go 1.(N-2, rounded to even) as bootstrap.

### 5.4 C Compiler Requirements

- CGo requires a C compiler. Typical cross-compiler: `riscv64-linux-gnu-gcc` (Debian package: `gcc-riscv64-linux-gnu`).
- Cross-compilation disables cgo by default unless `CGO_ENABLED=1` is explicitly set.
- `freebsd/riscv64` CGo is marked supported in the platform matrix but the port is `Broken` (issue [#76475](https://github.com/golang/go/issues/76475)).

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

### 6.1 Build Modes

| Build mode | linux/riscv64 | linux/arm64 | Notes |
|---|---|---|---|
| `exe` (default) | Yes | Yes | -- |
| `pie` (external linker) | Yes | Yes | External linker required |
| `pie` (internal linker) | **No** | Yes | Blocked; CLs 741860+742200 pending |
| `plugin` | Yes | Yes | Added Go 1.25 (CL 420114, merged 2025-02-20) |
| `shared` | **No** | Yes | Not implemented |
| `c-archive` | Yes | Yes | -- |
| `c-shared` | Yes | Yes | -- |

### 6.2 Sanitizers and Instrumentation

| Feature | linux/riscv64 | linux/arm64 | Notes |
|---|---|---|---|
| Race detector (`-race`) | Yes | Yes | Builder too slow for regular racebuild ([#78258](https://github.com/golang/go/issues/78258)) |
| Address sanitizer (`-asan`) | Yes | Yes | TestASAN failures reported ([#57691](https://github.com/golang/go/issues/57691), open) |
| Memory sanitizer (`-msan`) | **No** | Yes | Requires compiler-rt support; not available for riscv64 |
| Thread sanitizer (TSAN) | Partial | Yes | TestTSAN/tsan8 failing ([#76816](https://github.com/golang/go/issues/76816), open) |
| Fuzzing instrumentation | **No** | Yes | riscv64 excluded from `FuzzInstrumented` list (issue [#14565](https://github.com/golang/go/issues/14565) TODO in source) |
| DWARF `prologue_end` | Yes | Yes | Added Oct 2024 (commit `b45c7f1`) |

### 6.3 Crypto and FIPS

| Feature | linux/riscv64 | linux/arm64 | Notes |
|---|---|---|---|
| Pure-Go crypto (stdlib) | Yes | Yes | -- |
| Scalar assembly crypto (sha256, sha512) | Yes | Yes | riscv64 uses Zbb rotation, added Go 1.23 |
| Vector/SIMD crypto (AES, GCM, ChaCha20) | **No** | Yes | No Zvkned/Zvknha/b assembly yet |
| BoringCrypto (`GOEXPERIMENT=boringcrypto`) | **No** | Yes | No `goboringcrypto_linux_riscv64.syso` exists |
| FIPS140 with `-buildmode=pie` | **Broken** | Yes | Issue [#74683](https://github.com/golang/go/issues/74683), fix CLs posted but not merged |
| `x/crypto` SIMD paths (ChaCha20, Poly1305) | **No** | Yes | Pure Go fallback used; arm64/ppc64x/s390x have SIMD |

### 6.4 Performance vs arm64

The only quantified comparison in the research findings comes from issue [#77541](https://github.com/golang/go/issues/77541) (Feb 2026):

- **~20-40% execution slowdown on riscv64 vs arm64** on CPU-intensive workloads, measured via `golang.org/x/benchmarks` Bent suite on Go 1.25.6 with `GORISCV64=rva23u64`.
- Root cause: RISC-V's 12-bit signed immediate range forces 3 instructions per large-stack-offset access where ARM64 uses 1. The SSA backend treats these multi-instruction sequences as cheap to rematerialize, causing them to be recomputed every loop iteration.
- Affected workloads: wazero interpreter benchmarks (`string_manipulation_size_50`, `random_mat_mul_size_20`), kanzi-go SBRT Transform hot loops.

The crypto/sha256 assembler optimization (commit `6d55a017`, Go 1.23) measured on a StarFive VisionFive 2:

| Benchmark | Before | After | Delta |
|---|---|---|---|
| Hash8Bytes/New | 7.820 us | 5.193 us | -33.6% |
| Hash1K/New | 108.03 us | 66.12 us | -38.8% |
| Hash8K/New | 808.5 us | 493.0 us | -39.0% |
| Hash1K throughput | 9.041 MiB/s | 14.772 MiB/s | +63.4% |

The vectorized `internal/bytealg` memequal (commit `75ea2d05`, requires `GORISCV64=rva23u64`) measured on a Banana Pi F3:

| Benchmark | Before | After | Delta |
|---|---|---|---|
| Equal/4K | 925.5 ns | 561.4 ns | -39.3% |
| Equal/4M | 3.110 ms | 2.463 ms | -20.8% |
| EqualBothUnaligned/4096_1 | 956.6 ns | 571.4 ns | -40.3% |
| Geomean timing | -- | -- | -13.9% |
| Geomean throughput | -- | -- | +17.2% |

Data not available: no published full-suite comparison of Go riscv64 vs arm64 across a representative application workload (e.g., HTTP server throughput, JSON parsing, GC-heavy workloads).

---

## 7. CI/CD Infrastructure

Go does not use GitHub Actions, `.cirrus.yml`, `Jenkinsfile`, or `.travis.yml`. The `.github/` directory contains only `ISSUE_TEMPLATE/`, `CODE_OF_CONDUCT.md`, `PULL_REQUEST_TEMPLATE`, and `SUPPORT.md` -- no workflow files exist.

All CI runs via the `build.golang.org` coordinator, configured in [`golang.org/x/build/dashboard/builders.go`](https://github.com/golang/build/blob/master/dashboard/builders.go).

### 7.1 Active riscv64 Builders

All RISC-V builders are **reverse buildlets running on physical hardware** -- no QEMU, no cloud VMs.

| Builder name | Hardware | RAM/Cores | Owner | OS | Timeout scale |
|---|---|---|---|---|---|
| `linux-riscv64-unmatched` | SiFive HiFive Unmatched | 16 GB, 4 cores | mengzhuo (PLCT Lab) | Linux | 4x |
| `linux-riscv64-jsing` | SiFive HiFive Unleashed | 8 GB, 4 cores | 4a6f656c (Joel Sing) | Linux | 4x |
| `freebsd-riscv64-unmatched` | SiFive HiFive Unmatched | 16 GB, 4 cores, FreeBSD 13.1-RELEASE | mengzhuo (PLCT Lab) | FreeBSD | 4x |
| `openbsd-riscv64-jsing` | physical reverse buildlet | -- | 4a6f656c (Joel Sing) | OpenBSD | 3x |

All builders apply `riscvDistTestPolicy`, which skips the `api` and `reboot` dist tests (same policy as MIPS). `linux-riscv64-unmatched` and `freebsd-riscv64-unmatched` use a private Go proxy (builder is behind a firewall).

Three of mengzhuo's linux-riscv64-rva22u64 Banana Pi F3 bots (bbw-1, bbw-2, bbw-3) are currently broken ([#79067](https://github.com/golang/go/issues/79067), [#79068](https://github.com/golang/go/issues/79068), [#79069](https://github.com/golang/go/issues/79069), opened 2026-04-30).

### 7.2 Cross-Compilation Builders (no execution)

```
addMiscCompile("freebsd", "riscv64")
addMiscCompileGo1(23, "openbsd", "riscv64", "-go1.23")
addMiscCompile("linux", "riscv64")
```

Note: `golang.org/x/build` itself is excluded from riscv64 misc-compile due to issue #58307.

### 7.3 LUCI Migration Status

riscv64 builders are **not yet migrated to LUCI**, unlike ppc64, loong64, and wasm which have been ported. All riscv64 CI remains on the old `build.golang.org` coordinator system [NEEDS VERIFICATION].

### 7.4 RISE Runners

RISE provides free native RISC-V CI on GitHub Actions (`ubuntu-24.04-riscv` label, Scaleway EM-RV1 hardware). As of the May 2026 "six weeks in" report, the Go upstream project is **not** listed among the 197 organizations using RISE RISC-V Runners for its own CI. The RISE blog post from September 2024 confirms Go received Scaleway bare-metal RISC-V infrastructure for development use.

---

## 8. Distribution and Release Status

| Source | riscv64 Present | Version / Notes |
|---|---|---|
| [go.dev/dl (official upstream)](https://go.dev/dl/) | Yes | `go1.26.4.linux-riscv64.tar.gz`, `go1.25.11.linux-riscv64.tar.gz`, `go1.26.4.openbsd-riscv64.tar.gz`, `go1.25.11.freebsd-riscv64.tar.gz` |
| [Arch Linux RISC-V mirror](https://riscv.mirror.pkgbuild.com/repo/extra/) | Yes | `go-2:1.26.4-1-riscv64.pkg.tar.zst` (40 MB), built 2026-06-03 |
| [Debian (buildd)](https://buildd.debian.org/status/package.php?p=golang-defaults) | Yes | `golang-defaults 2:1.26~1`, status: Installed, built on `rv-manda-04` |
| Ubuntu 24.04 Noble | Yes | `golang-1.22` stack, riscv64 listed as supported arch |
| GitHub release assets | N/A | Go does not ship binaries as GitHub release assets |

linux/riscv64 binaries have been available from go.dev/dl since Go 1.21, per the RISE blog post "Advancing Go on RISC-V" (April 2025).

---

## 9. Dependencies

### 9.1 Go Module Dependencies (golang.org/x/*)

Go is largely self-hosted with few external dependencies when built with `CGO_ENABLED=0`.

| Module | Role | riscv64 Status | Notes |
|---|---|---|---|
| `golang.org/x/crypto` | Extended crypto (ChaCha20, Poly1305, Curve25519, BLAKE2b) used directly by stdlib | Builds (pure Go fallback) | No riscv64 assembly for ChaCha20/Poly1305/Curve25519; arm64/ppc64x/s390x have SIMD paths |
| `golang.org/x/net` | HTTP/2, QUIC, DNS, websocket | Builds, passes | No known riscv64-specific open issues |
| `golang.org/x/sys` | Low-level OS syscall wrappers | Builds, passes | Two abandoned PRs from 2019 (epoll_event padding fix, endian_little tag) -- whether underlying issues were resolved through another path requires verification [NEEDS VERIFICATION] |
| `golang.org/x/text` | Unicode and text processing | Builds, passes | No known riscv64-specific issues |

### 9.2 Optional C / Platform Dependencies

| Dependency | Role | riscv64 Status | Notes |
|---|---|---|---|
| BoringCrypto (`google/boringssl` `.syso`) | FIPS-validated crypto backend (`GOEXPERIMENT=boringcrypto`) | **Not supported** | No `goboringcrypto_linux_riscv64.syso` exists; only linux/amd64 and linux/arm64 have pre-compiled `.syso` files |
| glibc | System C library for cgo and dynamic linking | Functional since glibc 2.27 (2018) | -- |
| OpenSSL (`GODEBUG=fips140=on`) | FIPS crypto backend alternative | Builds where OpenSSL 3.x is available | Depends on OpenSSL riscv64 assembly completeness |
| C compiler (gcc/clang) | Required for cgo builds only | Functional | Both gcc and clang support riscv64 |

---

## 10. Ecosystem Status

### 10.1 RISE Project Involvement

RISE funded **RP001: Accelerate the Go Runtime on RISC-V**, executed by Ludovic Henry and Mark Ryan (RIVOS Inc.). Deliverables documented in the [April 2025 RISE blog post](https://riseproject.dev/2025/04/04/advancing-go-on-risc-v-progress-through-the-rise-project/):

- Vector ISA assembler support (integer arithmetic, FP ops, bitwise ops)
- Dynamic runtime probing for available extensions (`riscv_hwprobe`)
- Vectorized `internal/bytealg` (memory equality)
- Build-time RISC-V profiles (RVA20, RVA22, RVA23)
- Reduced instruction count via Bitmanip extension
- Handcoded riscv64 assembler routines for `math/big`
- Scalar assembler routines for md5, sha256, sha512
- Plugin support for riscv64

RISE also provided Scaleway EM-RV1 bare-metal RISC-V CI infrastructure to the Go project (September 2024).

### 10.2 Key Active Contributors

| Contributor | Handle | Affiliation | Role |
|---|---|---|---|
| Meng Zhuo | @mengzhuo | PLCT Lab | linux-riscv64-unmatched builder owner (x2); freebsd-riscv64-unmatched builder owner; high commit volume in obj/riscv |
| Joel Sing | @4a6f656c | Independent/OpenBSD | linux-riscv64-joelsing and openbsd-riscv64-jsing builder owner; highest commit count in obj/riscv in research period |
| Mark Ryan | @markdryan | Data not available: company affiliation not found in research | Active assembler contributor (CSR maps, vector fixes, documentation) |
| Tobias Klauser | @tklauser | Cilium/Isovalent | Authored first RISC-V commits (arch reservation, ELF relocations) |

---

## 11. Known Bugs and Active Issues

### 11.1 Open Correctness Bugs

| Issue | Title | Severity | Status |
|---|---|---|---|
| [#78161](https://github.com/golang/go/issues/78161) | runtime: memory corruption leading to panic on linux/riscv64 | Critical | Open, Backlog, no assignee, help wanted. Compiler inlining miscompile on riscv64 (workaround: `-gcflags '-l'`). Actively blocking Alpine Linux package builds. |
| [#74683](https://github.com/golang/go/issues/74683) | FIPS140 broken on RISC-V with `-buildmode=pie` | Critical (FIPS deployments) | Open, Backlog, assigned @mengzhuo. Fix CLs posted (CL 741860, 742200, 748040) and partially verified on MilkV Megrez, but binary still crashes at runtime in a later test; not merged. |
| [#79275](https://github.com/golang/go/issues/79275) | cmd/link: J-type instruction relocation offset out of range | High (build failure) | Open, assigned @cherrymui. Fix CL 777120 (ByteDance) passed TryBot on PS2 (2026-05-20); awaiting Code-Review +2 from Cherry Mui or Joel Sing. |
| [#68862](https://github.com/golang/go/issues/68862) | runtime: SIGSEGV in preemptone (riscv64) | High | Open, assigned @mengzhuo. Root cause: faulty BananaPi-F3/SpacemiT K1 SoC builder hardware with kernel-level mmap hang bug on kernel 6.6.36. Blocked on SpacemiT kernel fix. |
| [#76816](https://github.com/golang/go/issues/76816) | TestTSAN/tsan8 failed on riscv64 | Medium | Open |
| [#57691](https://github.com/golang/go/issues/57691) | runtime: TestASAN fails with SEGV on linux/riscv64 | Medium | Open (since Jan 2023) |
| [#64791](https://github.com/golang/go/issues/64791) | syscall: TestExec failures with SIGSEGV on riscv64 | Medium | Open |

### 11.2 Open Performance Issues

| Issue | Title | Impact | Status |
|---|---|---|---|
| [#77541](https://github.com/golang/go/issues/77541) | Instruction bloat in hot loops -- large stack frame offsets | ~20-40% vs arm64 | Open, NeedsInvestigation |
| [#79298](https://github.com/golang/go/issues/79298) | Redundant LUI+ADD recomputation for large riscv stack offsets | Structural inefficiency, ~10 wasted instructions per access sequence | Open |
| [#78258](https://github.com/golang/go/issues/78258) | linux-riscv64 builder too slow to run racebuild | Blocks race-enabled testing | Open |

### 11.3 Open Feature / Infrastructure Issues

| Issue | Title | Notes |
|---|---|---|
| [#79997](https://github.com/golang/go/issues/79997) | internal/bytealg: optimize indexbyte_riscv64.s | PR [#79997](https://github.com/golang/go/pull/79997) open |
| [#79584](https://github.com/golang/go/issues/79584) | cmd/compile: add intrinsic rule for sync atomic and/or 32/64 on RISCV64 | PR [#79584](https://github.com/golang/go/pull/79584) open, one unresolved Gerrit comment |
| [#78918](https://github.com/golang/go/issues/78918) | hash/crc32: add crc32 assembly support for riscv64 | PR [#78918](https://github.com/golang/go/pull/78918) open |
| [#78515](https://github.com/golang/go/issues/78515) | cmd/compile: implement jump table on riscv64 | PR [#78515](https://github.com/golang/go/pull/78515) open, has CR+2 [NEEDS VERIFICATION] |
| [#77328](https://github.com/golang/go/issues/77328) | cmd/internal/obj/riscv: add Zvkned extension support | Open, PR [#77326](https://github.com/golang/go/pull/77326) previously abandoned |
| [#76475](https://github.com/golang/go/issues/76475) | build: freebsd/riscv64 port is broken | Open |
| [#76065](https://github.com/golang/go/issues/76065) | proposal: add flag for riscv optional extension support | Open |
| [#75577](https://github.com/golang/go/issues/75577) | Zicond codegen | Merged 2026-02-24 (Go 1.27) |
| [#64074](https://github.com/golang/go/pull/64074) | runtime: implement stackcheck for riscv64 | PR open since Nov 2023, has CR+2 [NEEDS VERIFICATION] |
| [#79069](https://github.com/golang/go/issues/79069)/[68](https://github.com/golang/go/issues/79068)/[67](https://github.com/golang/go/issues/79067) | x/build: bots linux-riscv64-rva22u64-bbw-1/2/3 broken | Open since April 2026 |

### 11.4 Notably Closed/Fixed Bugs

| Issue | Title | Resolution |
|---|---|---|
| [#64917](https://github.com/golang/go/issues/64917) | cmd/compile: uint32(math.NaN()) returns -1 on riscv64 | Fixed Jan 2024 -- NaN float-to-uint32 gave wrong result unique to riscv64 |
| [#74606](https://github.com/golang/go/issues/74606) | cmd/compile: riscv performance regression | Fixed Jul 2025 -- inlining heuristic caused ~4x benchmark variance |
| [#76654](https://github.com/golang/go/issues/76654) | Incorrect use of T0/X5 register causing RAS mismatch | Fixed (Go 1.27) |
| [#79270](https://github.com/golang/go/issues/79270) | plugin: build failure on riscv64 | Fixed 2026-05-19 |
| [#78045](https://github.com/golang/go/issues/78045) | go1.26 SIGILL on riscv64 with vector support | Fixed |
| [#77209](https://github.com/golang/go/issues/77209) | cmd/link: wrong dynamic loader path on Linux riscv64 | Fixed |

---

## 12. Objections and Upstream Blockers

**Objection 1: The port is secondary tier -- a broken build does not block releases.**
Assessment: True. This is the correct characterization of the current status. The Go team has accepted this explicitly. Breakage goes to Backlog, not to a release gate. The practical consequence is that issues like #78161 (memory corruption) and #74683 (FIPS PIE broken) may remain open across multiple release cycles. Engineering leadership must weigh whether secondary-tier status is acceptable for production deployments or whether investment is needed to drive first-class status -- which would require Google buy-in.

**Objection 2: BoringCrypto is unavailable on riscv64.**
Assessment: Confirmed. `GOEXPERIMENT=boringcrypto` has no riscv64 `.syso`. This blocks any deployment that mandates FIPS using the BoringCrypto path. The alternative FIPS path (`GOFIPS140=v1.0.0` with the native Go FIPS module) is broken with `-buildmode=pie` on riscv64 (issue #74683). Fix CLs exist (from Joel Sing) but are not merged as of June 2026. A deployment requiring both FIPS and PIE on riscv64 is currently not possible with the Go toolchain.

**Objection 3: There is a structural 20-40% performance gap vs arm64 on CPU-intensive workloads.**
Assessment: Confirmed (single source: issue #77541). The root cause is architectural -- RISC-V's narrow immediate range combined with the current SSA cost model. Two open issues (#77541, #79298) document the problem. No fix CL has been posted. This is a compiler engineering problem, not a hardware limitation, and is addressable with SSA improvements.

**Objection 4: The CI builders are fragile community-donated hardware.**
Assessment: Confirmed. Three of the four riscv64 builders are owned by a single individual (mengzhuo/PLCT Lab). The BananaPi-F3 hardware has triggered hardware-level mmap bugs (#68862). The `freebsd/riscv64` port is formally broken (#76475). If mengzhuo's machines go offline, linux/riscv64 CI coverage drops to a single SiFive HiFive Unleashed (8 GB, 4 cores) owned by Joel Sing. The builder timeout scale of 4x already indicates the hardware is marginal.

**Objection 5: Several significant PRs have stalled.**
Assessment: Confirmed. PRs for jump tables (#78515, CR+2 but not merged), stackcheck (#64074, open since November 2023), Zba compiler support (#76211, open since November 2025), unaligned memory access optimization (#77207, on Hold), and crc32 assembly (#78918) are all pending without active reviewer engagement. This reflects the limited bandwidth of the riscv64 maintainer team.

---

## 13. Investment Analysis

### 13.1 Functional Enablement

| Work Item | Current State | Required Work | Priority |
|---|---|---|---|
| Fix FIPS140 + PIE on riscv64 (#74683) | Fix CLs exist (CL 741860, 742200, 748040), partially verified, not merged | Review and submit existing CLs; validate on additional hardware | Critical |
| Fix memory corruption / inlining miscompile (#78161) | Open, no CL, help wanted | Bisect compiler inlining path on riscv64; fix SSA or ABI handling | Critical |
| Fix J-type relocation overflow (#79275) | Fix CL 777120 passed TryBot; awaiting +2 | Reviewer attention from Cherry Mui or Joel Sing | High |
| Internal PIE linker support | CLs 741860+742200 prerequisite for FIPS fix | Reviewer bandwidth | High |
| Repair broken CI builders (#79067-69) | 3 of 4 linux builders broken | Hardware replacement or migration to cloud (Scaleway EM-RV1 via RISE) | High |
| freebsd/riscv64 port (#76475) | Broken | Diagnose and fix; evaluate whether to promote or remove | Medium |
| BoringCrypto riscv64 | Not supported | Build `goboringcrypto_linux_riscv64.syso` from BoringSSL; FIPS validation scope TBD | Medium (FIPS-mandatory deployments) |

### 13.2 Performance Optimization

| Work Item | Current State | Required Work | Priority |
|---|---|---|---|
| Fix instruction bloat in hot loops (#77541, #79298) | Root cause identified, no CL | SSA cost model improvements; LICM for large stack frame base addresses | High |
| Land jump table codegen (#78515) | Has CR+2, not merged | Reviewer submission | High |
| Land atomic intrinsics for sync/atomic And/Or (#79584) | PR open, 1 unresolved comment | Minor iteration + reviewer | Medium |
| Land Zba compiler codegen (#76211) | PR open Nov 2025 | Reviewer attention | Medium |
| Vectorized crypto via Zvkned/Zvknha/b (AES, SHA via vector) | No CL exists (#77328 for Zvkned assembler) | Write assembly; issue #79958 (Zvbb SIMD) marked "Not Planned" | Medium |
| Optimize `x/crypto` (ChaCha20, Poly1305) for riscv64 | Pure Go fallback only | Write assembly similar to arm64 implementation | Medium |
| Optimize hash/crc32 (#78918) | PR open | Review and merge | Low |
| Optimize `internal/bytealg` indexbyte (#79997) | PR open | Review and merge | Low |
| Optimize P256 crypto (#77069) | PR open | Review and merge | Low |

### 13.3 CI/CD Infrastructure

| Work Item | Current State | Required Work | Priority |
|---|---|---|---|
| Repair broken bots (#79067-69) | 3 bots offline | Replace BananaPi-F3 hardware or migrate to Scaleway EM-RV1 via RISE | High |
| Enable racebuild on riscv64 (#78258) | Builder times out (~2h13m) | Faster hardware (Scaleway EM-RV1) or parallelism | Medium |
| LUCI migration | riscv64 not yet migrated | Port builder definitions; coordinate with Google infra team | Low |
| Add openbsd/riscv64 LUCI builder (#73569) | Builder missing | Provision hardware + LUCI registration | Low |
| Add freebsd/riscv64 LUCI builder (#73568) | Builder missing | Depends on port stability | Low |

### 13.4 Ecosystem Enablement

| Work Item | Current State | Required Work | Priority |
|---|---|---|---|
| Fuzzing instrumentation on riscv64 | Not implemented | Port coverage-guided fuzzing (afl/pcguard) to riscv64 | Medium |
| MSan support on riscv64 | Not supported | Requires compiler-rt port; upstream to llvm and Go | Low |
| Shared library build mode (`-buildmode=shared`) | Not supported | Linker work | Low |

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Fix FIPS140 + PIE (#74683) | 2-4 (review + validate existing CLs) | Reviewer (Cherry Mui / Joel Sing) + QA | Critical |
| Functional | Fix memory corruption / inlining miscompile (#78161) | 4-8 (bisect + fix) | Compiler engineer with riscv64 knowledge | Critical |
| Functional | Fix J-type relocation overflow (#79275) | 1 (reviewer submission) | Cherry Mui / Joel Sing | High |
| Infrastructure | Repair broken CI bots (#79067-69) | 1-2 (hardware + config) | mengzhuo / RISE | High |
| Performance | Fix instruction bloat in hot loops (#77541, #79298) | 6-10 (SSA cost model) | Go compiler engineer (riscv64) | High |
| Functional | Land jump table codegen (#78515) | 1 (reviewer submission) | Joel Sing / Cherry Mui | High |
| Performance | Land Zba codegen (#76211) | 1 (reviewer) | riscv64 maintainer | Medium |
| Performance | Land atomic intrinsics (#79584) | 1 (minor iteration + review) | newborn22 + reviewer | Medium |
| Performance | Vectorized crypto (Zvkned/Zvknha/b) | 8-16 (write assembly + tests) | Crypto + riscv64 engineer | Medium |
| Performance | x/crypto SIMD (ChaCha20, Poly1305) | 4-8 | Go crypto engineer | Medium |
| Functional | BoringCrypto riscv64 `.syso` | 4-8 + FIPS validation (separate) | BoringSSL + FIPS lab | Medium |
| Infrastructure | Enable racebuild on riscv64 (#78258) | 1-2 (hardware) | mengzhuo / RISE | Medium |
| Functional | Fuzzing instrumentation | 8-16 | Go runtime engineer | Medium |
| Infrastructure | LUCI migration | 2-4 | Google infra + riscv64 maintainer | Low |

---

## 14. Updates

No updates yet -- initial report dated 2026-06-17.

---

## 15. References

- [golang/go repository](https://github.com/golang/go)
- [Issue #27532: all: port to RISC-V (closed)](https://github.com/golang/go/issues/27532)
- [Issue #78161: runtime memory corruption on linux/riscv64](https://github.com/golang/go/issues/78161)
- [Issue #74683: FIPS140 broken with -buildmode=pie on riscv64](https://github.com/golang/go/issues/74683)
- [Issue #79275: J-type relocation offset out of range](https://github.com/golang/go/issues/79275)
- [Issue #77541: instruction bloat in hot loops](https://github.com/golang/go/issues/77541)
- [Issue #79298: redundant LUI+ADD recomputation](https://github.com/golang/go/issues/79298)
- [Issue #68862: SIGSEGV in preemptone](https://github.com/golang/go/issues/68862)
- [Issue #76475: freebsd/riscv64 port broken](https://github.com/golang/go/issues/76475)
- [Issue #78258: linux-riscv64 builder too slow for racebuild](https://github.com/golang/go/issues/78258)
- [PR #79584: atomic intrinsics for sync/atomic And/Or](https://github.com/golang/go/pull/79584)
- [PR #78515: jump table on riscv64](https://github.com/golang/go/pull/78515)
- [PR #64074: stackcheck for riscv64 (open since 2023)](https://github.com/golang/go/pull/64074)
- [Gerrit CL 777120: fix JAL overflow for runtime packages](https://go.dev/cl/777120)
- [golang.org/x/build dashboard/builders.go](https://github.com/golang/build/blob/master/dashboard/builders.go)
- [RISE Project blog: Advancing Go on RISC-V (April 2025)](https://riseproject.dev/2025/04/04/advancing-go-on-risc-v-progress-through-the-rise-project/)
- [RISE Project blog: Leveraging Scaleway (September 2024)](https://riseproject.dev/2024/09/09/leveraging-scaleway-to-support-the-risc-v-software-ecosystem/)
- [RISE Project blog: RISC-V Runners six weeks in (May 2026)](https://riseproject.dev/2026/05/12/rise-risc-v-runners-six-weeks-in/)
- [go.dev/dl: Go downloads](https://go.dev/dl/)