---
title: golang.org/x/sys
parent: Project Reports
color: green
dependencies:
  - name: Go
    relation: build-dependency
    criticality: critical
---

{% include dependency-graph.html slug="dependencies" subset="golang-org-x-sys" %}

# golang.org/x/sys

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-10-30<br/>
**Readiness:** green<br/>
**Scope:** RISC-V (riscv64/linux) support status for golang.org/x/sys<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

golang.org/x/sys is the Go project's sub-repository of supplemental packages for low-level interaction with the operating system. It contains `unix/` (syscall bindings), `cpu/` (CPU feature detection), `windows/`, `plan9/` and `execabs/`. It is a pure Go module with a few assembly files. Its `go.mod` declares `module golang.org/x/sys` and `go 1.26.0`, with no `require` lines, so it has no third-party dependencies ([go.mod](https://go.googlesource.com/sys/+/refs/heads/master/go.mod)). The Go port policy expects new system call support to land in x/sys before a release, because it is the official place for new system calls ([Go porting policy](https://go.dev/wiki/PortingPolicy)).

Governance:
- No foundation owns it. It is part of the Go project, which Google governs ([x/sys repository](https://go.googlesource.com/sys), [pkg.go.dev](https://pkg.go.dev/golang.org/x/sys)).
- The license is BSD-3-Clause, and the repository also ships a `PATENTS` file.
- The repository has no MAINTAINERS, OWNERS or CODEOWNERS file. It contains only `CONTRIBUTING.md`, `LICENSE`, `PATENTS`, `README.md` and `codereview.cfg`. `codereview.cfg` contains `issuerepo: golang/go`, so issues are filed in golang/go with an "x/sys:" prefix.
- Changes go through Gerrit review by the Go team. GitHub (golang/sys) is a read-only mirror, so the riscv64 changes below are Gerrit CLs and commits, not GitHub PRs.
- Top committers by commit count, with companies inferred from commit email domains only (not an official list):
  - Tobias Klauser: 600 commits, personal domain, no company identifiable.
  - Jason A. Donenfeld: 120 commits.
  - Matt Layher: 62 commits.
  - Go team members: Ian Lance Taylor, Brad Fitzpatrick, Rob Pike and Bryan C. Mills, 24 to 53 commits each.
- Since 2025-01-01, `google.com` addresses account for only 5 commits and `golang.org` addresses for 20. Most commits come from personal or other addresses.
- RISE: Google LLC is a RISE Premier Member, but neither Go nor x/sys is listed on the [RISE members page](https://riseproject.dev/members/). That page does not say whether Google's membership covers Go.

Community stance on new ports (from the porting policy page; it governs ports in the Go project as a whole):
- New ports need an accepted proposal.
- They need at least two named maintainers.
- They need a named builder owner, with the builder running before the code lands.
- Their benefit must outweigh the upkeep cost.
- riscv64 passed this bar long ago. The x/sys code has existed since 2018 (Section 2).
- The policy was cited in the x/sys freebsd/riscv64 porting discussion, [golang/go#53466](https://golang.org/issue/53466). That issue was not opened, so the details are [NEEDS VERIFICATION].

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2018-09-06 | golang/go#27532 "all: port to RISC-V" opened by Tobias Klauser. Commit 8cf3aee4 "unix: add support for linux/riscv64" (CL 133735) adds wrappers, constants and types. At the time it was usable only with gccgo. | [#27532](https://github.com/golang/go/issues/27532), [commit](https://go.googlesource.com/sys/+/8cf3aee429924738c56c34bb819c4ea8273fc434) |
| 2019-05-31 | Commit 4c3a9284 (CL 177799), Joel Sing: linux/riscv64 syscall assembly, to ease testing before the port was upstream. | [commit](https://go.googlesource.com/sys/+/4c3a928424d249a1013e789cf5e458d480bcba16) |
| 2019-08-12 | Commit 9eafafc0 (CL 189877), Tonis Tiigi: fix `epoll_event` padding on riscv64 (a correctness fix). | [commit](https://go.googlesource.com/sys.git/+/9eafafc0a87e0fd0aeeba439a4573537970c44c7) |
| 2020-01-06 | Commit 5f8ca72c (CL 213397), Tobias Klauser: stop zeroing extra registers in riscv64 syscalls, aligning with package syscall. | [commit](https://go.googlesource.com/sys/+/5f8ca72cd6325689efbbfd415c3e82ec8be1f5a4) |
| 2020-08-31 | #27532 closed as completed. Experimental support landed in Go 1.14 with improvements in Go 1.15. cgo is tracked separately in #36641. | [#27532](https://github.com/golang/go/issues/27532) |
| 2020-10-16 | CL 257917 adds the linux-riscv64-jsing builder to the dashboard (gopherbot comment on #27532). | [#27532](https://github.com/golang/go/issues/27532) |
| 2021-02-17 | Commit ed5674b6da4a (CL 288333): comment-only change saying riscv64 is supported since Go 1.14. | [commit](https://go.googlesource.com/sys/+/ed5674b6da4a95302460238cd8fdd07f7a7cd5cd) |
| 2022-07-08 | Commit 5a0f066 (CL 416394): non-Linux `archInit` stub for riscv64. Fixes #53698. | [#53698](https://github.com/golang/go/issues/53698) |
| 2022-10-13 | v0.1.0, the earliest semver tag. All pre-2023 riscv64 commits first appear in this tag. | [x/sys](https://go.googlesource.com/sys) |
| 2023-07-18 | #61416 opened by Mark Ryan: use the RISC-V Hardware Probing Interface in x/sys/unix and x/sys/cpu. | [#61416](https://github.com/golang/go/issues/61416) |
| 2023-07-26 | Commit 104d401 (CL 510795): `riscv_hwprobe` syscall. First tag v0.11.0. | [commit](https://github.com/golang/sys/commit/104d4017fa052d31a480218d213787543bc352d4) |
| 2023-09-26 | Commit 8858c72 (CL 530895): update `riscv_hwprobe` constants. | [#61416](https://github.com/golang/go/issues/61416) |
| 2024-08-23 | Commit 3283fc3f (CL 605815): `cpu.RISCV64` detection of C, V, Zba, Zbb, Zbs. First tag v0.25.0 (2024-09-04). | [commit](https://go.googlesource.com/sys/+/3283fc3f6160baf63bec24fbaa24e094e9ff6daf) |
| 2025-02-05 | golang/go commit bcfa00c: matching runtime detection in `internal/cpu`. | [#61416](https://github.com/golang/go/issues/61416) |
| 2026-05-21 | Commit 397d5f80: kernel 7.0 header refresh across about 50 files, including `*_linux_riscv64.go`. Not RISC-V-specific. | [commit](https://go.googlesource.com/sys/+/397d5f80920585bc27433d878aba498d062f81e1) |
| 2026-08-31 | Commit 613e257 (CL 800020): riscv64 hwprobe drift test for x/sys/cpu. Release page v0.48.0 lists this change. | [#61416](https://github.com/golang/go/issues/61416), [v0.48.0](https://github.com/golang/sys/releases/tag/v0.48.0) |

Corrections to commit attribution:
- `ed5674b6` is the 2021 comment-only commit. The 2018 commit is `8cf3aee4`.
- The date of 104d401 was first reported as "2023-2024". The git clone gives an author date of 2023-07-18 and a commit date of 2023-07-26.
- The year of v0.48.0 was not shown on the release page. The 613e257 merge date of 2026-08-31 supports 2026.

Key contributors, with orgs inferred from commit emails only:
- Tobias Klauser: personal domain, no company identifiable. He authored 15 of the riscv-mentioning commits.
- Joel Sing: organization not stated.
- Tonis Tiigi: organization not stated.
- Mark Ryan: `rivosinc.com` commit email (Rivos). He also wrote the RISE Go post.
- Meng Zhuo: `iscas.ac.cn` and `golangcn.org` (Institute of Software, Chinese Academy of Sciences).

Upstream status: fully upstream. All 8 riscv64 patches listed in the fetch data are merged. No out-of-tree riscv64 patches were identified. The latest commit in the researched clone is dated 2026-10-22.

## 3. Upstream Support Tier

Formal policy ([Go porting policy](https://go.dev/wiki/PortingPolicy)):
- First-class ports are darwin/amd64, darwin/arm64, linux/386, linux/amd64, linux/arm, linux/arm64, windows/386 and windows/amd64. Broken builds block releases and Google's Go team owns the builder.
- Secondary ports are kept working by their maintainers, and changes that break them are not necessarily rolled back.
- riscv64 is not named on the policy page, so it is a secondary port by default [NEEDS VERIFICATION: inferred from the page, single source].
- Broken ports can be dropped one release after being declared broken, though finding a new maintainer is preferred.

Evidence for riscv64:
- Go 1.14 shipped experimental riscv64 support, with improvements in Go 1.15 ([#27532](https://github.com/golang/go/issues/27532)).
- Official linux-riscv64 binaries have been on go.dev/dl since Go 1.21 ([RISE post](https://riseproject.dev/2025/04/04/advancing-go-on-risc-v-progress-through-the-rise-project/)) [NEEDS VERIFICATION: single source, summarized by a fetch tool].
- x/sys has no CI configuration of its own. riscv64 coverage comes from the shared x/build builders (Section 7).

| Aspect | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Go port tier | First-class (linux/amd64, windows/amd64, darwin/amd64) | First-class (linux/arm64, darwin/arm64) | Not named on policy page; secondary by default [NEEDS VERIFICATION] |
| x/sys tagged releases | Same module tags for all architectures | Same module tags | Same module tags (v0.49.0 latest) |
| x/sys CI | Data not available: x/build builders for amd64 and arm64 were not researched | Data not available: same | Post-submit native builders and compile-only trybots (Section 7) |
| x/sys/cpu feature detection | `x/sys/cpu` AVX2 detection cited as the motivation in #61416; details not researched | Sysctl-based detection on darwin and openbsd cited as prior art in #61416; details not researched | Linux hwprobe-based detection (Section 4) |

## 4. Technical Architecture and RISC-V-Specific Subsystems

x/sys uses flat per-GOOS_GOARCH files, with no `arch/riscv/` directory. It contains no JIT backends, no SIMD kernels and no crypto code. `x/sys/cpu` exposes feature flags that downstream packages can dispatch on. GC write barriers are runtime work and are not present here.

| Component | Files | riscv64 exists? | ISA extensions | Quality |
|---|---|---|---|---|
| Linux syscall assembly | `unix/asm_linux_riscv64.s` | Yes | Base ISA (ECALL) | Hand-written. `SyscallNoError` and `RawSyscallNoError` issue ECALL directly with the syscall number in A7. `Syscall`, `Syscall6`, `RawSyscall` and `RawSyscall6` JMP to package syscall. |
| BSD syscall assembly | `unix/asm_bsd_riscv64.s` | Yes | None | Thin trampolines: five JMPs to package syscall, no logic. Build tag covers darwin, freebsd, netbsd and openbsd, but only freebsd and openbsd have riscv64 files. |
| OpenBSD libc trampolines | `unix/zsyscall_openbsd_riscv64.s` | Yes | None | Generated. Named in the listing; contents not opened. |
| Linux wrappers | `unix/syscall_linux_riscv64.go` | Yes | None | Hand-written: `RISCVHWProbe`, `Select` via pselect6, `Stat`, `Lstat`, `PtraceRegs.PC` and `SetPC`. `Ustat` returns ENOSYS, as the kernel has no ustat on riscv64. |
| Linux generated tables | `zerrors_`, `zsyscall_`, `zsysnum_`, `ztypes_linux_riscv64.go` | Yes | None | Generated from kernel headers; last identified refresh is Linux 7.0. |
| FreeBSD | `syscall_`, `zerrors_`, `zsyscall_`, `zsysnum_`, `ztypes_freebsd_riscv64.go` | Yes | None | Full generated set present. |
| OpenBSD | the same set plus `zsysctl_openbsd_riscv64.go` | Yes | None | Full generated set present. |
| CPU detection, Linux | `cpu/cpu_linux_riscv64.go` | Yes | C, V, Zba, Zbb, Zbs, Zbc, Zvbb, Zvbc, Zvkb, Zvkg, Zvkt, plus derived Zvkn, Zvknc, Zvkng, Zvks, Zvksc, Zvksg | Uses `riscv_hwprobe` (Linux 6.4+) with IMA_EXT_0 and CPUPERF_0 keys. HWCAP fallback only for C. Reports `HasFastMisaligned`. Reads VLENB when V is present. |
| VLENB read | `cpu/cpu_riscv64.s`, `cpu/cpu_gc_riscv64.go` | Yes | V | Raw `WORD $0xc2202573` (`csrr vlenb, x10`), because the Go 1.25 assembler does not recognize VLENB. |
| CPU option table | `cpu/cpu_riscv64.go` | Yes | 18 option names, cache line size 64 | Settable via GODEBUG-style switches. The fetch summaries reported both "17" and "18"; the listed names number 18. |
| CPU, non-Linux | `cpu/cpu_other_riscv64.go` | Yes (not opened) | None | `archInit` stub from 2022; reports no features. |
| Tests | `cpu/riscv64_hwprobe_test.go` | Yes | n/a | Drift test keeps hwprobe constants in sync with x/sys/unix. |
| JIT | none | n/a | n/a | Not applicable to x/sys |
| SIMD kernels | none | n/a | n/a | Feature flags only |

The design rationale for the Vector rule: HWCAP is deliberately not used for V, because vendors use the same bit for incompatible RVV 0.7.1 and 1.0 (for example the SiPeed LicheePi), per [#61416](https://github.com/golang/go/issues/61416).

Comparison per component, amd64 vs arm64 vs riscv64:

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Syscall assembly (Linux) | Data not available: not researched | Data not available: not researched | Present (above) |
| CPU feature detection | Data not available: not researched (AVX2 cited as motivation) | Data not available: not researched (sysctl on darwin and openbsd cited as prior art) | Present on Linux via hwprobe; stub elsewhere |
| JIT / SIMD / crypto | Not applicable | Not applicable | Not applicable |

## 5. Build System, Cross-Compilation, and Toolchain

Consuming x/sys for riscv64 needs no native toolchain: `GOOS=linux GOARCH=riscv64 go build ./...`. There is no cmake or configure step, no `-DUSE_X=OFF` flags, and no minimum GCC or Clang version. The only environment switch is `GOLANG_SYS_BUILD=docker`, which tells the scripts they are inside the container ([unix/README.md](https://go.googlesource.com/sys/+/refs/heads/master/unix/README.md)).

Regenerating Linux files (maintainer workflow):
- Run `unix/linux/mkall.go`, which executes inside the [Dockerfile](https://go.googlesource.com/sys/+/refs/heads/master/unix/linux/Dockerfile). The host must be amd64/Linux with bash, go and docker.
- Container contents:
  - Base image: ubuntu:25.04.
  - Go: 1.26.8 (linux-amd64 tarball, SHA-256 checked).
  - Kernel headers: Linux v7.2 (shallow clone).
  - glibc: `release/2.44/master` (shallow clone).
  - Cross compiler: `gcc-riscv64-linux-gnu`.
  - Emulator: `qemu-user`.
- The `mkall.go` riscv64 entry is: GoArch `riscv64`, LinuxArch `riscv`, GNUArch `riscv64-linux-gnu`, 64-bit, little-endian, unsigned char.
- Compiler flags are `-Wall -Werror -static` and `-I<tmp>/riscv64/include`. There is no `-fsigned-char` and no `-m` flag for riscv64.
- No GCC minimum is stated. The version is whatever Ubuntu 25.04 ships, which was not checked.
- QEMU: `GORUN=qemu-riscv64` is derived from the first component of GNUArch. For riscv only, `mkall.go` sets `QEMU_UNAME=4.15`. The source comment says this fakes the uname "to allow running on Host kernel version < 4.15".
- `syscall_linux_alarm.go` is generated for every GOARCH except arm* and riscv.
- For GOOS other than Linux, `unix/mkall.sh` generates from local C headers on the target OS and architecture. It is not relevant to Linux riscv64.
- Porting a new architecture needs a hand-written `asm_${GOOS}_${GOARCH}.s`. The riscv64 files already exist.

Known build failures (all closed):
- [#53698](https://github.com/golang/go/issues/53698): `undefined: archInit` on non-Linux riscv64, fixed by CL 416394.
- [#57217](https://github.com/golang/go/issues/57217): the freebsd-riscv64-unmatched builder failed on an outdated x/sys ("undefined: Cmsghdr", "undefined: CapRights"). Closed 2022-12-13.
- [#48355](https://golang.org/issue/48355): "missing function body" on a riscv64 builder. Closed.

The Dockerfile on master references kernel v7.2, while the last kernel refresh commit identified (397d5f80, 2026-05-21) is titled "update to Linux kernel 7.0". The Dockerfile bump and the commit that regenerated the files for 7.2 were not located. [NEEDS VERIFICATION] whether the generated riscv64 files are at 7.0 or 7.2.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Linux syscall bindings | Data not available: not researched | Data not available: not researched | Complete (wrappers, assembly, generated tables) |
| FreeBSD bindings | Data not available | Data not available | Complete generated set |
| OpenBSD bindings | Data not available | Data not available | Complete generated set |
| NetBSD bindings | Data not available | Data not available | No riscv64 files in the `unix/` listing [NEEDS VERIFICATION: Go build constraints not checked] |
| Windows / Plan 9 | Data not available | Data not available | No riscv64 files |
| Hardware probing | Data not available | Data not available | `riscv_hwprobe` plus HWCAP fallback (C only) |
| CPU feature flags | Data not available | Data not available | 18 options (Section 4) |
| Non-Linux CPU features | Data not available | Data not available | None (stub) |

Functional gaps:
- hwprobe requires Linux 6.4 or later. F, D and C are detectable from 6.4. V, Zba, Zbb and Zbs need Linux 6.5, so older kernels may report them as absent ([#61416](https://github.com/golang/go/issues/61416)).
- There is no HWCAP fallback for Vector, by design.
- Misaligned-access reporting is reduced to one boolean (`HasFastMisaligned`), losing the unknown, emulated, slow and unsupported categories ([#61416](https://github.com/golang/go/issues/61416)).
- Detection logic is duplicated between x/sys/cpu and the standard library's `internal/cpu` ([#61416](https://github.com/golang/go/issues/61416)).
- The Zbc detection CL 776280 ("cpu: detect zbc extension on riscv64") was not located in the commit data. The current `cpu_riscv64.go` and `cpu_linux_riscv64.go` already include Zbc.
- A `MemfdSecret` change for riscv64 was reverted because `SYS_MEMFD_SECRET` was missing from `zsysnum_linux_riscv64.go`. `syscall_linux_riscv64.go` now lists `MemfdSecret` among its generated wrappers. Whether the revert was re-applied is [NEEDS VERIFICATION].

Performance gaps:
- No x/sys benchmark on riscv64 was found. Producing one would require running `go test -bench` on riscv64 hardware.
- Because x/sys has no SIMD kernels, the performance exposure is in downstream packages that dispatch on `x/sys/cpu` flags. That is outside this module.
- The only RISC-V performance figure found concerns the Go compiler, not x/sys. [golang/go#77541](https://github.com/golang/go/issues/77541) (open, opened 2026-02-11) reports RISC-V "about 20-40% slower than ARM64" on many CPU-bound Bent workloads, on go1.25.6, linux/riscv64, GORISCV64=rva23u64. The reporter attributes it to extra address-computation instructions caused by the 12-bit signed immediate. No CPU model or per-benchmark timings are given, and this is one user's measurement [NEEDS VERIFICATION].

Security hardening gaps: Data not available. No x/sys-specific hardening material for riscv64 was found in the research.

NaN and floating-point semantics: not applicable to a syscall and CPU-feature module. None were identified.

## 7. CI/CD Infrastructure

x/sys has no CI configuration file in its own tree. The top-level tree has only `.gitattributes`, `.gitignore`, `codereview.cfg`, `CONTRIBUTING.md`, `go.mod`, `LICENSE`, `PATENTS` and `README.md`, plus the `cpu/`, `execabs/`, `plan9/`, `unix/` and `windows/` directories. There is no `.github/`, `.gitlab-ci.yml`, cloudbuild, LUCI config or Makefile. `codereview.cfg`, `README.md` and `CONTRIBUTING.md` do not mention CI, builders or riscv64 ([repository tree](https://go.googlesource.com/sys/+/refs/heads/master)). The verification pass covered only the x/sys repository, not x/build.

riscv64 coverage comes from the shared Go build infrastructure, per [x/build dashboard/builders.go](https://go.googlesource.com/build/+/refs/heads/master/dashboard/builders.go). The final 1,725 of 101,725 characters of that file were not read, so other riscv64 builders may exist. [NEEDS VERIFICATION: single source, truncated fetch]

| Builder | Type | Runs x/sys tests? |
|---|---|---|
| `linux-riscv64-jsing` | Native full-test builder, post-submit | Yes, on master |
| `linux-riscv64-unmatched` | Native full-test builder, post-submit | Yes, on master |
| `freebsd-riscv64-unmatched` | Native full-test builder, post-submit | Yes, on master |
| `openbsd-riscv64-jsing` | Native full-test builder, post-submit | Yes, on master |
| `misc-compile-linux-riscv64` | Compile-only trybot | No, build only |
| `misc-compile-freebsd-riscv64` | Compile-only trybot | No, build only |
| `misc-compile-openbsd-riscv64-go1.23` | Compile-only trybot | No, build only |

None of the full-test riscv64 builders is a trybot. A riscv64 test failure therefore surfaces after submit, not before.

Related items, none confirmed as current:
- [golang/go#73568](https://github.com/golang/go/issues/73568), seen only as a search result, says the `gotip-freebsd-riscv64` builder had no bots running.
- [golang/go#78026](https://github.com/golang/go/issues/78026) mentions a proposed linux-riscv64 builder on a SpacemiT X60 board for `GORISCV64=rva22u64`. It was not read.
- Builder issues #81534, #80880, #80506, #73569 and [#67105](https://github.com/golang/go/issues/67105) exist but were not read.
- Evidence that x/sys CI uses RISE runners: none found.
- The Docker pipeline for regenerating tables includes QEMU user-mode for riscv64 (Section 5).
- The linux-riscv64-jsing builder was added to the dashboard by CL 257917 on 2020-10-16 ([#27532](https://github.com/golang/go/issues/27532)).

| Aspect | amd64 | arm64 | riscv64 |
|---|---|---|---|
| x/sys-owned CI config | None | None | None |
| Native post-submit test builders | Data not available | Data not available | 4 (linux x2, freebsd, openbsd) |
| Pre-submit trybots | Data not available | Data not available | Compile-only (3) |
| Hardware | Data not available | Data not available | JH7110-class names "unmatched" (SiFive HiFive Unmatched) and "jsing" are builder names; hardware models are not stated in the research |

## 8. Distribution and Release Status

- x/sys is a Go source module with no per-architecture binary. Upstream tags the module (latest v0.49.0, followed by v0.48.0 through v0.40.0) ([x/sys](https://go.googlesource.com/sys)). riscv64 support is source-level and needs no separate release.
- PyPI: no such package exists (HTTP 404). The RISE wheel builder has no Go entries and returned 404 for this name, so these checks do not apply.
- Debian: [sources.debian.org](https://sources.debian.org/) lists the source package `golang-golang-x-sys` at 0.49.0+dfsg-1 and 0.42.0-1 in forky/sid, and 0.22.0-1 in trixie. Per-architecture status was not shown [NEEDS VERIFICATION].
- Ubuntu 26.04 (resolute): not verified. The packages.ubuntu.com fetches returned HTTP 500 and the Launchpad query returned HTTP 400. The binary package is normally `golang-golang-x-sys-dev`, and source packages of this kind are normally `Architecture: all` (not verified).
- Arch Linux RISC-V: no matching package was seen, but only 100,000 of 384,810 characters of the status page were read, so this is inconclusive.
- No cross-check of riscv64 package availability was made.
- pkg.go.dev renders `x/sys/unix` v0.49.0 only for linux/amd64, windows/amd64, darwin/amd64 and js/wasm. This is a documentation-rendering limit and does not contradict the riscv64 source evidence.

What a user must do: add the module to a Go program and build with `GOOS=linux GOARCH=riscv64` (or build natively on riscv64) using a Go toolchain that supports the module's `go` directive (go 1.26.0). No x/sys-specific action is required.

## 9. Dependencies

x/sys depends on nothing but the Go toolchain: `go.mod` has no `require` lines ([go.mod](https://go.googlesource.com/sys/+/refs/heads/master/go.mod)).

| Name | Role | riscv64 build | riscv64 test | riscv64 release | Community |
|---|---|---|---|---|---|
| Go | Build dependency, critical. Compiler and runtime, `go 1.26.0` | Official linux-riscv64 binaries since Go 1.21 [NEEDS VERIFICATION: single source](https://riseproject.dev/2025/04/04/advancing-go-on-risc-v-progress-through-the-rise-project/) | Native riscv64 builders in x/build (Section 7) | Upstream (go.dev/dl) | Go project, Google. RISE funds RP001 "Accelerate the Go Runtime on RISC-V". Status report: `project-reports/go.md`. Graph status: not found, which only means the graph could not be queried. |
| gcc-riscv64-linux-gnu | Cross compiler, table regeneration only | Not checked (runs on an amd64 host) | Not applicable | Ubuntu 25.04 package | Not applicable to consumers |
| qemu-user | Emulator for running generated test programs, regeneration only | Not checked | Not applicable | Ubuntu 25.04 package | Not applicable to consumers |
| Linux kernel headers (v7.2) | Source of Linux constants, regeneration only | Not applicable | Not applicable | Shallow git clone | Not applicable |
| glibc (release/2.44/master) | Source of libc headers, regeneration only | Not applicable | Not applicable | Shallow git clone | Not applicable |

Deep-dive: x/sys has no JIT, SIMD, crypto or numerics dependencies. The Go toolchain's own dependencies were not recursed: Data not available beyond the existence of `project-reports/go.md`. The regeneration tools run only on a maintainer's amd64 host and do not affect riscv64 consumers.

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [golang/go#61416](https://github.com/golang/go/issues/61416) | x/sys/unix, x/sys/cpu: use the RISC-V Hardware Probing Interface on Linux | Open, FixPending | Low | Tracking issue. Opened 2023-07-18. All five linked changes are merged; the last is commit 613e257 (2026-08-31). mengzhuo asked on 2026-05-28 whether it can be closed. No answer in the fetched page. |
| CL 776280 | cpu: detect zbc extension on riscv64 | Unknown | Low | Search lead only. No SHA, date or merge status found. [NEEDS VERIFICATION] |
| [golang/go#78026](https://github.com/golang/go/issues/78026) | linux-riscv64 builder on SpacemiT X60 for rva22u64 | Not read | Unknown | Proposed CI hardware. |
| [golang/go#73568](https://github.com/golang/go/issues/73568) | gotip-freebsd-riscv64 builder has no bots | Not confirmed | Medium for FreeBSD coverage | Seen only in a search result. |
| [golang/go#55000](https://github.com/golang/go/issues/55000) | x/sys: does not build on linux/sparc64 | Open | Not RISC-V | Listed only as an open x/sys build issue. |
| [golang/go#77541](https://github.com/golang/go/issues/77541) | cmd/compile: riscv instruction bloat in hot loops due to large stack frame offsets | Open, Backlog | Performance, Go compiler | Not an x/sys bug. |
| #82711, #81175, #70401, #57691, #53721, #78261, #70076 | Go-on-riscv64 test and toolchain failures | Open or unknown | Not x/sys | Examples include an x/tools gocommand timeout on riscv64 (#82711, opened 2026-10-29) and TestASAN SEGV (#57691). Not read. |
| [golang/go#53698](https://github.com/golang/go/issues/53698) | x/sys: missing stub for cpu_other_riscv64 | Closed 2022-07-08 | Build failure | Fixed by CL 416394. |
| [golang/go#57217](https://github.com/golang/go/issues/57217) | freebsd-riscv64-unmatched builder failure on outdated x/sys | Closed 2022-12-13 | Build failure | Fixed by updating x/sys. |
| [golang/go#48355](https://golang.org/issue/48355) | "missing function body" on a riscv64 builder | Closed | Build failure | Not read in detail. |

Correctness bugs: no open x/sys riscv64 correctness bug was found. Closed history includes the 2019 `epoll_event` padding fix (CL 189877). Search limits: the GitHub issue search was filtered by title only, and the golang/sys issue list and commit history were not exhaustively searched, so an x/sys riscv64 issue with a generic title could be missing.

## 12. Objections and Upstream Blockers

- Stated objections to riscv64 in x/sys: none found.
- Design objections in #61416 were resolved in review. Ian Lance Taylor noted that the proposal committee cares mainly about user-visible API, that adding syscalls and types to x/sys/unix is fine, and that the new syscall might need adding to the standard library's `internal/syscall/unix`. The issue was converted from a proposal to a tracking issue on 2024-08-22.
- Technical blockers: none for the existing code. Residual limitations are kernel-version dependence for hwprobe (Linux 6.4 and 6.5), the Vector HWCAP ambiguity, and duplicated detection code between x/sys/cpu and `internal/cpu` (Section 6).
- Organizational blockers: riscv64 test builders are post-submit only, and one FreeBSD builder may be unstaffed (#73568, unconfirmed). Port health depends on port maintainers, per the secondary-port policy.
- Acceptance probability: not applicable. The code is already upstream, tagged and in the standard module. Any further riscv64 changes follow the normal Gerrit review path used by earlier changes.

## 13. Readiness Assessment

- **Color:** green
- **Release provider:** upstream

Justification: x/sys has no CI files of its own, but the shared Go build infrastructure runs its tests on native riscv64 builders after submit (linux-riscv64-jsing, linux-riscv64-unmatched, freebsd-riscv64-unmatched, openbsd-riscv64-jsing) and compile-checks it with misc-compile-*-riscv64 trybots, per [x/build dashboard/builders.go](https://go.googlesource.com/build/+/refs/heads/master/dashboard/builders.go). Upstream tags the module itself (latest [v0.49.0](https://go.googlesource.com/sys)), and it ships complete riscv64 code (asm_linux_riscv64.s, cpu_riscv64.go with hwprobe detection, per-OS z*_riscv64.go files) since 2018 ([golang/go#27532](https://github.com/golang/go/issues/27532)). It is not an optimization-purpose project (syscall and CPU-feature bindings), so no cap applies.

Pending work that could change the grade:
- [golang/go#61416](https://github.com/golang/go/issues/61416) is still open but FixPending. The latest drift-test commit 613e257 merged 2026-08-31.
- A zbc detection CL (776280) is unverified.
- [golang/go#78026](https://github.com/golang/go/issues/78026) proposes a linux-riscv64 builder on a SpacemiT X60 board for rva22u64 (unread).
- Confidence is medium. The riscv64 test builders are post-submit only (not trybots). The tail of builders.go was truncated. One verification pass found no CI config inside the x/sys repo itself; the builders were not part of that check.
- RISE funds Go-on-RISC-V work (RP001) but no RISE involvement with x/sys itself was found. The hwprobe author Mark Ryan appears on both the [RISE Go blog post](https://riseproject.dev/2025/04/04/advancing-go-on-risc-v-progress-through-the-rise-project/) and the x/sys commits (his commit email is rivosinc.com).

## 14. Investment Analysis

RISE coverage checked first:
- RISE funds RP001 "Accelerate the Go Runtime on RISC-V" ([blog post](https://riseproject.dev/2025/04/04/advancing-go-on-risc-v-progress-through-the-rise-project/)). Its listed work includes linux-riscv64 binaries, vector assembler support, runtime extension detection, GORISCV64 profiles, bitmanip code generation, bytealg, math/big and crypto assembly. Planned work is Vector, compressed instructions and testing infrastructure.
- No RISE blog post, wiki page or repository reference ties funded work to x/sys itself. None of the 8 most recent feed items read mentioned Go, x/sys or hwprobe.
- The post does not name the extension-detection mechanism and does not mention hwprobe, so the link to #61416 is indirect.
- Effort figures below are planning estimates by the author, not figures from the research.

### 14.1 Functional Enablement

x/sys riscv64 is functionally complete for Linux, FreeBSD and OpenBSD. Remaining items are small:
- Confirm whether #61416 can be closed (drift test merged, closure question open since 2026-05-28).
- Locate or land the Zbc detection CL 776280 if not merged.
- Check NetBSD riscv64 build constraints and demand before any work.
- Determine whether the Dockerfile kernel v7.2 refresh produced regenerated riscv64 files.
- No new functional work is justified by the research.

### 14.2 Performance Optimization

No x/sys performance work is indicated, because x/sys has no compute kernels. Performance depends on downstream dispatch using `x/sys/cpu` flags and on the compiler (#77541), both outside this module. Sizing for #77541: Data not available.

### 14.3 CI/CD Infrastructure

The main gap is that riscv64 tests run only post-submit. Candidate work: support the proposed rva22u64 builder discussion in [#78026](https://github.com/golang/go/issues/78026), and confirm the status of the FreeBSD builder ([#73568](https://github.com/golang/go/issues/73568)). Builder ownership sits with the Go team and x/build.

### 14.4 Ecosystem Enablement

No package ecosystem needs separate enablement, because x/sys is a source module. Downstream Go modules pick up riscv64 support automatically. How many downstream modules fail on riscv64: Data not available.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Confirm #61416 closure and the state of CL 776280 (Zbc) | 0.5 | RISE-affiliated Go contributor | Low |
| Functional | Verify generated riscv64 files match the Dockerfile kernel (7.0 vs 7.2) | 0.5 | RISE-affiliated Go contributor | Low |
| Functional | Assess NetBSD riscv64 build constraints and demand | 1 | Go team / community | Low |
| Performance | None for x/sys (compiler issue #77541 tracked in Go) | 0 | Not applicable | Low |
| CI/CD | Engage on #78026 (rva22u64 hardware builder) and the FreeBSD builder status | 2 to 4 | x/build / RISE | Medium |
| Ecosystem | None required | 0 | Not applicable | Low |

## 15. References

- [x/sys repository (go.googlesource.com)](https://go.googlesource.com/sys)
- [x/sys master tree](https://go.googlesource.com/sys/+/refs/heads/master)
- [x/sys go.mod](https://go.googlesource.com/sys/+/refs/heads/master/go.mod)
- [x/sys unix/README.md](https://go.googlesource.com/sys/+/refs/heads/master/unix/README.md)
- [x/sys unix/linux/Dockerfile](https://go.googlesource.com/sys/+/refs/heads/master/unix/linux/Dockerfile)
- [pkg.go.dev golang.org/x/sys](https://pkg.go.dev/golang.org/x/sys)
- [x/build dashboard/builders.go](https://go.googlesource.com/build/+/refs/heads/master/dashboard/builders.go)
- [Go porting policy](https://go.dev/wiki/PortingPolicy)
- [golang/go#27532 all: port to RISC-V](https://github.com/golang/go/issues/27532)
- [golang/go#61416 RISC-V Hardware Probing Interface](https://github.com/golang/go/issues/61416)
- [golang/go#53698 missing stub for cpu_other_riscv64](https://github.com/golang/go/issues/53698)
- [golang/go#57217 freebsd-riscv64-unmatched builder failure](https://github.com/golang/go/issues/57217)
- [golang/go#48355 missing function body on riscv64 builder](https://golang.org/issue/48355)
- [golang/go#53466 x/sys freebsd/riscv64](https://golang.org/issue/53466)
- [golang/go#55000 x/sys on linux/sparc64](https://github.com/golang/go/issues/55000)
- [golang/go#67105 builder issue](https://github.com/golang/go/issues/67105)
- [golang/go#73568 gotip-freebsd-riscv64 builder](https://github.com/golang/go/issues/73568)
- [golang/go#77541 riscv instruction bloat in hot loops](https://github.com/golang/go/issues/77541)
- [golang/go#78026 SpacemiT X60 builder proposal](https://github.com/golang/go/issues/78026)
- [x/sys commit 8cf3aee4, add support for linux/riscv64](https://go.googlesource.com/sys/+/8cf3aee429924738c56c34bb819c4ea8273fc434)
- [x/sys commit 4c3a9284, linux/riscv64 assembly](https://go.googlesource.com/sys/+/4c3a928424d249a1013e789cf5e458d480bcba16)
- [x/sys commit 9eafafc0, epoll_event padding](https://go.googlesource.com/sys.git/+/9eafafc0a87e0fd0aeeba439a4573537970c44c7)
- [x/sys commit 5f8ca72c, riscv64 registers](https://go.googlesource.com/sys/+/5f8ca72cd6325689efbbfd415c3e82ec8be1f5a4)
- [x/sys commit ed5674b6da4a, riscv64 comment](https://go.googlesource.com/sys/+/ed5674b6da4a95302460238cd8fdd07f7a7cd5cd)
- [x/sys commit 104d401, riscv_hwprobe](https://github.com/golang/sys/commit/104d4017fa052d31a480218d213787543bc352d4)
- [x/sys commit 3283fc3f, RISC-V extension detection](https://go.googlesource.com/sys/+/3283fc3f6160baf63bec24fbaa24e094e9ff6daf)
- [x/sys commit 397d5f80, Linux kernel 7.0 update](https://go.googlesource.com/sys/+/397d5f80920585bc27433d878aba498d062f81e1)
- [x/sys release v0.48.0](https://github.com/golang/sys/releases/tag/v0.48.0)
- [RISE: Advancing Go on RISC-V](https://riseproject.dev/2025/04/04/advancing-go-on-risc-v-progress-through-the-rise-project/)
- [RISE members](https://riseproject.dev/members/)