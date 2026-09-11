---
title: bootc
parent: Project Reports
color: red
dependencies:
  - name: Rust
    relation: build-dependency
    criticality: critical
  - name: OSTree / rpm-ostree
    relation: runtime-dependency
    criticality: critical
  - name: systemd
    relation: runtime-dependency
    criticality: critical
---

# bootc

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-09-11<br/>
**Readiness:** red<br/>
**Scope:** RISC-V (riscv64/linux) support status for bootc<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

{% include dependency-graph.html slug="dependencies" subset="bootc" %}

## 1. Project Overview

bootc is a Rust userspace tool for deploying and managing bootable, atomically-updated Linux systems from OCI/Docker container images. It is layered on top of OSTree (content-addressed OS versioning) and, in newer releases, a native "composefs" (EROFS + fs-verity) OCI storage backend. It is not a compiler, runtime, or numerics library: it has no JIT, no SIMD/vectorized code paths, and no GC, for any architecture.

**Governance:** bootc is a Cloud Native Computing Foundation (CNCF) Sandbox project, accepted 2025-01-21, listed under the "Container Runtime" category. `GOVERNANCE.md` establishes a Maintainer Council model using `cncf/gitvote` for maintainer votes, CNCF Code of Conduct, and Linux Foundation LFX Zoom infrastructure for meetings. License is dual MIT OR Apache-2.0. Canonical docs live at [bootc.dev/bootc](https://bootc.dev/bootc/) (the older `containers.github.io/bootc/` URL now 404s, reflecting the project's move to the standalone `bootc-dev` GitHub org as part of the CNCF donation).

**Corporate sponsorship:** despite `GOVERNANCE.md`'s stated value of "Community over Product or Company," `MAINTAINERS.md` shows 100% of current Approvers (Chris Kyrouac, Colin Walters, John Eckersberg, Xiaofeng Wang, Gursewak Mangat, Joseph Marrero) and all four "Community Manager" liaisons are Red Hat employees. `git shortlog -sne --all` on the cloned repository shows the top contributor is Colin Walters/Red Hat with 2,836 commits, followed by John Eckersberg/Red Hat (318) and Joseph Marrero/Red Hat (295+26). One visibly active non-Red Hat contributor exists (Pragyan Poudyal, 202+17 commits, gmail address). This is a single-vendor governance profile typical of a young CNCF Sandbox project.

**Community culture on new ports:** no formal `PLATFORMS.md`, `SUPPORT.md`, or `docs/platforms/` exists in the repository. Architecture support is defined implicitly in code via `cfg`/match arms. `CONTRIBUTING.md` only requires an issue-first discussion for *large* changes; a one-line architecture-support fix does not meet that bar. The one riscv64 contribution that has landed (see Section 2) was treated as an ordinary, low-friction PR with no pushback on the concept of riscv64 support itself.

**RISE Project involvement:** none found. bootc is not listed as a RISE member project, does not appear in any of 34 scanned [RISE blog posts](https://riseproject.dev/blog) (via the site's sitemap), has no repository or code reference under the `riseproject-dev` GitHub org (25 repos checked), is not in the [RISE wheel builder](https://riseproject.gitlab.io/python/wheel_builder/) package list, and has no RISE runner usage in its CI (it has no riscv64 CI at all - see Section 7). The only trace of RISE awareness is an unwritten, queued project-report entry in `riseproject-dev/sw-ecosystem/project-reports/.queue.yml` [NEEDS VERIFICATION - internal queue file, not a published RISE artifact].

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2022-11-30 | Repository created | Repository history |
| 2022-12-07 | Commit `96235751` ("Enable cargo vendor-filterer") by Colin Walters (Red Hat) adds `riscv64gc-unknown-linux-gnu` to the Cargo vendoring target-platform list. Not functional support - only affects dependency vendoring. | Local clone `git log` |
| 2025-10-20 | Commit `4e04eb95` by Colin Walters (Red Hat) adds `ROOT_RISCV32`/`ROOT_RISCV64`/`USR_RISCV32`/`USR_RISCV64` (and verity variants) as Discoverable Partition Specification GUID constants. | Local clone `git log` |
| 2026-04-03 | [PR #2125](https://github.com/bootc-dev/bootc/pull/2125) opened by external contributor `woltere` (Wolter Eldering, `wolter@eldering.online`), who reports owning actual riscv64 hardware. | [PR #2125](https://github.com/bootc-dev/bootc/pull/2125) |
| 2026-04-16 | PR #2125 merged as commit [`47c3620`](https://github.com/bootc-dev/bootc/commit/47c362089bfeb300442932f70e4f6d19c33753b8), approved by Colin Walters (Red Hat), merged by Joseph Marrero (Red Hat). Adds a 2-line `cfg(target_arch = "riscv64")` branch to `this_arch_root()` so the crate recognizes `ROOT_RISCV64`. | [Commit 47c3620](https://github.com/bootc-dev/bootc/commit/47c362089bfeb300442932f70e4f6d19c33753b8) |
| 2026-05-01 | Released in v1.15.2; GitHub release notes explicitly credit "fix: add riscv64 to this_arch_root by @woltere in #2125." | [GitHub Releases](https://github.com/bootc-dev/bootc/releases) |
| 2026-09-11 | No follow-up PR or tracking issue exists for the acknowledged remaining gap (`ARCH_USES_EFI`). | Exhaustive PR/issue/commit search, this report |

**Key contributors:** Colin Walters (Red Hat) authored the GUID-constant groundwork; the only functional fix was authored by an external community contributor (woltere) who owns riscv64 hardware, not by a Red Hat maintainer; Red Hat maintainers approved and merged it.

**Is it fully upstream?** No. Exactly one merged PR exists in the entire project history that touches riscv64 logic. It fixed a compile-time `compile_error!("Unsupported architecture")` in one lookup function, but the actual `bootc install` code path was left broken (see Section 4). The PR's own reviewer (gemini-code-assist bot) and a maintainer (jmarrero) flagged that `ARCH_USES_EFI` in `crates/lib/src/install.rs` and `install/baseline.rs` also needed riscv64 handling; the author agreed to follow up, but as of 2026-09-11 (five months after merge) no follow-up PR or issue exists.

## 3. Upstream Support Tier

No formal tier policy document exists (`PLATFORMS.md`, `SUPPORT.md`, and `docs/platforms/` are all absent from the repository tree). Architecture support is inferred purely from `cfg`/match-arm coverage in source: currently x86_64, aarch64, ppc64/ppc64le, and s390x are handled in the install path; riscv64 is recognized only for partition-GUID lookup, not for install. No architecture's binaries are published in GitHub Releases at all - releases ship only source and vendored-dependency tarballs (`bootc-<ver>.tar.zstd`, `bootc-<ver>-vendor.tar.zstd`), confirmed across the last 10 releases checked (v1.16.3 to v1.16.12). This means "official binary" support does not formally exist for *any* architecture; what matters for riscv64 specifically is whether the source builds and functions, which it does not (Section 4).

| Aspect | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Upstream CI build | yes (standard `ubuntu-latest` runners) | yes | no |
| Upstream CI test | yes | yes | no |
| `bootc install` partition-table generation (`baseline.rs`) | implemented | implemented | `anyhow::bail!("Unsupported architecture: riscv64")` |
| `ARCH_USES_EFI` | true | true | false (excluded) |
| GrubCC bootloader path | implemented | implemented | explicit bail |
| Official GitHub-release binary | none (source-only) | none (source-only) | none (source-only) |

## 4. Technical Architecture and RISC-V-Specific Subsystems

bootc has no JIT, SIMD, or GC-barrier code of any kind - it is a systems/install tool, not a numerics or codegen project. Its only architecture-conditional code concerns partition-table layout, GUID identification, and bootloader selection, verified by reading the source at HEAD (`089a0aeb4146424c744346b99f1387fe2edee62e`, 2026-09-10):

| Component | File | riscv64 status |
|---|---|---|
| Root/`/usr` partition GUID lookup (`this_arch_root()`) | `crates/lib/src/discoverable_partition_specification.rs` | Implemented, correct (PR #2125). All 12 riscv32/riscv64 GUID constants present and spec-accurate, mirrored in a documentation fixture. |
| Partition-table generator (`bootc install`) | `crates/lib/src/install/baseline.rs` (~lines 288-307) | **Missing.** Branches only on `x86_64`, `powerpc64`, `aarch64`/`s390x`; riscv64 falls to `else { anyhow::bail!("Unsupported architecture: {}", ...) }`. `bootc install` fails immediately on riscv64. |
| EFI/ESP detection (`ARCH_USES_EFI`) | `crates/lib/src/install.rs:227` | **Missing.** `cfg!(any(target_arch = "x86_64", target_arch = "aarch64"))` excludes riscv64. |
| Bootloader install dispatch | `crates/lib/src/bootc_composefs/boot.rs` (~lines 1637-1716) | **Missing.** Explicit `s390x` branch (zipl) and Grub/GrubCC branch exist; no riscv64 branch. riscv64 would silently fall through to the generic, untested `install_systemd_boot` path. The GrubCC binary-name match explicitly bails with `"GrubCC not supported for: {arch}"` for riscv64. |
| Dockerfile bootloader-package stage | top-level `Dockerfile` (~lines 108-120) | **Missing.** Only handles `x86_64`/`aarch64` for GRUB EFI package download; all else (including riscv64) hits `echo "Unsupported architecture: $(uname -m)" >&2; exit 1`. |

There are no ISA-extension-specific (RVV, Zba/Zbb, Zicsr, etc.) code paths anywhere in the repository - not applicable, since bootc performs no vectorized or numerically intensive work on any architecture.

| Aspect | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Partition GUID lookup | full | full | full (as of PR #2125) |
| Install partitioning | full | full | absent (hard runtime failure) |
| EFI install | full | full | absent |
| Bootloader dispatch | full (Grub/GrubCC) | full (Grub/GrubCC) | absent (falls to untested generic path, GrubCC explicitly rejected) |

## 5. Build System, Cross-Compilation, and Toolchain

bootc is a Rust workspace (`Cargo.toml` with `[workspace] members = ["crates/*"]`, 10 member crates), built with `cargo build` / `make`, and packaged into container images via a `Justfile` + multi-stage `Dockerfile` (default base `quay.io/centos-bootc/centos-bootc:stream10`). **There is no CMakeLists.txt, no `cmake/` directory, no `BUILDING.md`, `INSTALL`, or `docs/cross-compilation.md` anywhere in the repository** - confirmed absent by direct tree inspection of the clone.

No riscv64-specific documentation exists anywhere in `docs/src/` (installation.md, bootc-install.md, filesystem.md, bootloaders.md, etc. all have zero riscv mentions). `CONTRIBUTING.md` states only that "a Rust and C compiler" are required, with no version pinned and no MSRV declared in `Cargo.toml`. QEMU appears in the `Justfile` only for generic x86_64 install-testing (Anaconda liveimg), not for any riscv64 cross-testing. `contrib/packaging/bootc.spec` has only `ExcludeArch: %{ix86}` (32-bit x86 excluded) - no riscv-related exclusions or notes.

**Known build failures:** none specific to riscv64 were found in issue search. The crate *does* compile for `riscv64gc-unknown-linux-gnu` as of PR #2125 (the earlier `compile_error!("Unsupported architecture")` was removed for that one function); the failure mode on riscv64 is a clean compile followed by a guaranteed runtime failure on `bootc install` (Section 4), not a build break.

Data not available: no exact cross-compilation command, minimum toolchain version, or riscv64 Dockerfile exists upstream to report, because none of these have been created for riscv64.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| `bootc install` (to disk) | works | works | **fails at runtime** ("Unsupported architecture: riscv64") |
| `bootc install to-existing-root` (via `this_arch_root`) | works | works | GUID lookup works (PR #2125), but unreachable in practice since `bootc install` itself fails first for a fresh install |
| EFI/ESP setup | works | works | not implemented (`ARCH_USES_EFI` excludes riscv64) |
| GRUB/GrubCC bootloader | works | works | explicit bail |
| systemd-boot fallback | n/a (uses Grub path) | n/a | untested generic fallback path (no riscv64 branch, unverified whether it functions) |
| Official release binary | none (source-only) | none (source-only) | none (source-only) |
| Distro package | Data not available (not the focus of this report) | Data not available | not found in Ubuntu 26.04 "resolute" or any other Ubuntu suite under `bootc`, `python3-bootc`, or `libbootc` |

**Functional gap:** the core `bootc install` workflow - the primary command the tool exists to provide - cannot run on riscv64 at all; it exits with an explicit "Unsupported architecture" error before writing a partition table.

**Performance gaps:** Data not available. No bootc-specific riscv64 vs arm64/amd64 performance benchmark data exists in any source checked (GitHub search, web search, riseproject.dev blog). A Phoronix article on general Fedora RISC-V *build-farm* speed (Binutils ~143 min on RISC-V vs ~29 min on x86_64 with 8 cores + LTO) was found but is unrelated to bootc's own runtime or install performance - [Phoronix: "Current RISC-V CPUs Being Too Slow Causes Headaches For Fedora"](https://www.phoronix.com/news/RISC-V-Slow-Fedora-Packages).

**Security hardening gaps:** Data not available - no riscv64-specific security/hardening research was found or conducted for bootc specifically.

**NaN / floating-point semantics:** Data not available. Targeted searches ("riscv nan floating repo:bootc-dev/bootc") returned zero results; bootc has no floating-point-heavy code paths relevant to this question.

## 7. CI/CD Infrastructure

**No riscv64 CI exists.** Verified directly by reading all 9 GitHub Actions workflow files in `.github/workflows/` (`auto-review.yml`, `autovendor.yml`, `build-and-publish.yml`, `ci.yml`, `crates-release.yml`, `docs.yml`, `labeler.yml`, `release.yml`, `scheduled-release.yml`) with a case-insensitive grep for "riscv" against each file individually: zero matches in every file. `.gitlab-ci.yml`, `Jenkinsfile`, and `.cirrus.yml` are all confirmed absent from the repository root. Every `runs-on:` line across all 9 workflows resolves to `ubuntu-latest`, `ubuntu-24.04`, or `ubuntu-slim` - no arm, no riscv64, no self-hosted or QEMU-based runner anywhere. No reference to `riseproject-dev` or a RISE runner label exists in any workflow.

| Aspect | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI build job | yes (`ubuntu-latest`) | Data not available (not confirmed present in this research pass - amd64 is the only architecture confirmed via runner labels) | no |
| CI test execution | yes | Data not available | no |
| RISE runner usage | no | no | no |
| Hardware used | GitHub-hosted `ubuntu-latest`/`ubuntu-24.04` runners | n/a | n/a |

## 8. Distribution and Release Status

**No official riscv64 binaries exist for bootc, through any channel checked:**

- **GitHub Releases:** the last 10 releases checked (v1.16.3 through v1.16.12, plus v1.15.2 which contains PR #2125) each ship exactly two assets - `bootc-<ver>.tar.zstd` and `bootc-<ver>-vendor.tar.zstd` (source and vendored-dependency tarballs). **No architecture-specific binaries of any kind** are published - not amd64, not arm64, not riscv64. [GitHub Releases](https://github.com/bootc-dev/bootc/releases).
- **PyPI:** `bootc` does not exist as a package. `https://pypi.org/pypi/bootc/json` returns HTTP 404. This is expected - bootc is a native Rust binary, not a Python package - and is included here only to confirm the channel was checked and is not applicable.
- **RISE wheel builder:** redirects through to the same 404'ing PyPI URL; no package present.
- **Ubuntu 26.04 "resolute":** confirmed absent under `bootc`, `python3-bootc`, and `libbootc` - each query returns "No such package." A broader source-package search across all Ubuntu suites (jammy, noble, questing, resolute) found no exact `bootc` match; only unrelated fuzzy matches (`bootcd`, `pibootctl`, `qbootctl`, `systemd-bootchart`).
- **AlmaLinux:** a web search surfaced AlmaLinux downstream packaging referencing PR #2125 (`git.almalinux.org`), but this was not verified to specifically include riscv64 build/package support [NEEDS VERIFICATION - single web-search reference, not independently confirmed].

**What a user must do to get a working binary today:** build bootc from source themselves on riscv64 hardware or via cross-compilation (no documented cross-compilation path exists - Section 5). Even after a successful self-build, `bootc install` will fail at runtime with "Unsupported architecture: riscv64" due to the unresolved gap in `install/baseline.rs` (Section 4) - there is no path to a working install today short of patching bootc's own source.

## 9. Dependencies

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Community/notes |
|---|---|---|---|---|---|
| Rust | Build-dependency, critical. Toolchain for the entire workspace. | riscv64gc-unknown-linux-gnu is a Tier-2 Rust target; bootc's own crate compiles on it as of PR #2125. | Data not available: no bootc-specific riscv64 test execution exists (no CI). | Source-only crate structure; works wherever the riscv64gc target works. | No MSRV pinned in `Cargo.toml`; `CONTRIBUTING.md` states only "a Rust and C compiler" required. |
| OSTree / rpm-ostree | Runtime-dependency, critical. bootc's atomic-deployment engine is built on top of libostree; rpm-ostree's own README states its "development focus has shifted to bootc and dnf5." | Portable autotools+GLib C, no arch-specific code found; zero riscv64 issues found upstream. | **No upstream CI runs on riscv64 at all** - GitHub Actions is x86_64-only; Packit covers only x86_64/aarch64. Zero test coverage. | Absent from every upstream CI/release matrix - not excluded, simply never targeted. | Existing project report rates it Yellow ("clean-distro-build" only) per `project-reports/ostree-rpm-ostree.md`; that report's own conclusion: "No RISE runner references were found in any CI file" for ostree/rpm-ostree either. |
| systemd | Runtime-dependency, critical. Defines the Discoverable Partitions Specification (DPS) that bootc's GUID constants implement, and provides `systemd-boot`, the generic bootloader bootc's `boot.rs` falls back to for architectures without an explicit branch (including riscv64). | Data not available: systemd-specific riscv64 CI/build status was not independently researched in this report's dependency pass. | Data not available. | Data not available. | Not covered by the dependency-research pass in this report; flagged for follow-up. |
| composefs-rs (`composefs-ctl`, tag v0.9.2) | Critical. bootc's newer EROFS + fs-verity native OCI-image storage backend (`crates/lib/src/bootc_composefs/`), increasingly load-bearing. | Zero riscv64 issues found in `composefs/composefs-rs` (0 results) - absence of issues likely reflects "never tried" rather than confirmed working. | No CI evidence either way. | No release/packaging evidence found. | Highest-uncertainty dependency identified in this report. Young project (v0.9.x). Also depends on Linux kernel EROFS + fs-verity riscv64 support, a kernel-side question not checked in this pass. Not tracked with its own project report. |
| openssl / openssl-sys (v0.10.72) | SHA256 hashing for content-addressed boot entries and SELinux labeling (`crates/lib/src/bootc_composefs/{boot,selinux}.rs`, `crates/etc-merge`). | Builds on riscv64; has a dedicated `OPENSSL_riscvcap`/Zknd-Zkne-Zknh asm/intrinsics fast path under active development upstream. | Upstream runs dedicated linux-riscv64 CI ("OS Zoo"); one flaky-test issue open (#30880). | Long-standing `linux64-riscv64` target; ships in every major distro including Ubuntu riscv64 ports. | 66 riscv64 issues total upstream; open ones are perf/capability-detection work-in-progress or musl-specific (does not affect bootc's gnu target). None block a correct riscv64 build. |
| zstd / zstd-sys (v0.13.3, vendors facebook/zstd via `ostree-ext`) | OCI image layer compression/decompression. | Portable C, vendored/built directly - no arch gating. | No dedicated riscv64 CI lane found. | Already ships in Ubuntu riscv64 ports (`libzstd1`). | facebook/zstd: 5 open issues, all enhancement/perf (e.g. RVV support for XXH3 not yet added, scalar fallback works); none are build blockers. |
| flate2 (v1.1.9, via `libz-sys`/`miniz_oxide`) | gzip fallback decode path for OCI layers/metadata. | Pure portable C or pure Rust (miniz_oxide) - no asm. | No riscv64-specific failures found. | Ubuntu riscv64 has shipped `zlib1g(-dev)` for years. | No riscv64-specific issues found in `madler/zlib` or `rust-lang/flate2-rs`. |
| sha2 (RustCrypto, v0.10.9/0.11.0) | Digest algorithm implementations used alongside/underneath the crypto stack. | Builds via portable-Rust fallback. | No open riscv64 CI failures. | Source-only crate; works wherever the riscv64gc-linux-gnu Rust target works. | `RustCrypto/hashes` issue #328 "sha2: performance issue on RISC-V" (closed) - riscv64 lacks a SIMD/asm-accelerated path and falls back to the slow portable implementation. Correctness is fine; performance is a known, accepted gap. |
| crc32fast (v1.5.0, transitive) | CRC32 checksum validation. | Portable Rust, builds fine. | No riscv64-specific failures found. | Source-only crate, no gating. | Zero riscv64 issues exist in `srijs/rust-crc32fast` at all - nobody has added a hardware-accelerated riscv64 path; falls back to the software table implementation (perf-only gap). |
| rustix (v1.1.4) | Low-level Linux syscalls (mount, fs, process control) used directly by bootc's OS-deployment logic. | Builds on riscv64gc-**gnu** (bootc's declared target per `vendor-filter.platforms = ["*-unknown-linux-gnu"]`). | Closed issue #400 (mmap_anonymous exhausted memory on riscv64gc-unknown-linux-gnu for large sizes) - found and fixed upstream, evidence of active riscv64 triage. | Tier-2 Rust target; source-only crate. | Open issue #1462 is specific to riscv64gc-linux-unknown-**musl** (does not affect bootc, which targets gnu), but signals general riscv64+musl ecosystem immaturity. |
| GLib/GIO (gtk-rs-core, v0.20.12, transitive via `ostree` crate) | GObject-based plumbing required by the ostree bindings. | Zero riscv64 issues in `gtk-rs/gtk-rs-core`. | No failures found. | GLib C library long-shipped for riscv64 in Debian/Ubuntu ports. | None found. |
| selinux crate (v0.5.0, libselinux bindings) | SELinux context labeling during composefs boot setup (`bootc_composefs/selinux.rs`). | Zero riscv64 issues in `koutheir/selinux`. | No failures found. | libselinux ships wherever SELinux-enabled riscv64 distros exist (e.g. Fedora's riscv64 secondary arch). | None found. |

**Assessment:** the compression/crypto/checksum leaf dependencies (openssl, zstd, flate2/zlib, sha2, crc32fast) are in good shape on riscv64 - correctness is fine, with only missing hardware-acceleration fast paths (performance, not correctness gaps). The real risk sits one layer up, in bootc's two foundational native dependencies: OSTree has zero upstream riscv64 CI/testing (a silent gap, consistent with the existing `project-reports/ostree-rpm-ostree.md` rating of Yellow), and composefs-rs - bootc's newer, increasingly load-bearing storage backend - has no riscv64 signal at all, positive or negative.

Note: this report is not an optimization-purpose classification, so Section 10 (Ecosystem Status) is omitted - bootc is a standalone system tool with no dependent package ecosystem (no npm/PyPI/Maven consumers depend on it as a library).

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [PR #2125](https://github.com/bootc-dev/bootc/pull/2125) | fix: add riscv64 to this_arch_root | Merged 2026-04-16 | N/A (fix, not a bug) | Fixes partition-GUID recognition only; does not fix `bootc install`. |
| Unresolved gap (no tracking issue exists) | `ARCH_USES_EFI` and `install/baseline.rs` not updated for riscv64 | **Open, untracked** | **Critical (correctness)** | Confirmed by direct source read of `install/baseline.rs` and `install.rs:227` at HEAD. `bootc install` unconditionally fails on riscv64 with `anyhow::bail!("Unsupported architecture: riscv64")`. Acknowledged in PR #2125 review by both the author and a maintainer, but no GitHub issue or follow-up PR exists to track it as of 2026-09-11. [NEEDS VERIFICATION as a tracked "bug" - this is a source-code-confirmed defect, not an open GitHub issue with its own number, since no such issue exists.] |
| [Issue #112](https://github.com/bootc-dev/bootc/issues/112) | Build fails on s390x | Closed (completed), 2023-08-12 to 2023-08-15 | N/A - not riscv64 | Not actually about RISC-V; surfaced only because it touches the same `baseline.rs` EFI-partition-constant code area later touched for riscv64 (`EFIPN`/`EFIPN_SIZE_MB`). Fixed via PR #114. |
| [Issue #578](https://github.com/bootc-dev/bootc/issues/578) | bootc enablement for ppc64le | Closed, 2024-06-01 to 2024-08-01 | N/A - not riscv64 | Shows the pattern other non-x86/arm64 architectures have followed for enablement; not riscv64-specific. |

**Correctness bug highlighted separately:** the `baseline.rs` unconditional `bail!` on riscv64 is the single most important finding in this report. It means bootc's primary function - installing a bootable system - does not work on riscv64 today, despite the partition-GUID identification code (a secondary/later-stage function) having been fixed. No GitHub issue tracks this specific defect.

No bootc-specific riscv64 performance benchmark data or NaN/floating-point bug reports were found in any channel searched (GitHub issue/code search, web search, riseproject.dev blog).

## 12. Objections and Upstream Blockers

**Stated objections:** none found. The riscv64 partition-GUID PR was reviewed and merged without objection to the concept of riscv64 support; reviewer comments (gemini-code-assist bot, maintainer jmarrero) were constructive, identifying remaining gaps rather than opposing the change. Maintainer cgwalters (Red Hat) suggested only a future refactor toward table-driven architecture branching rather than raising any objection to riscv64 specifically.

**Technical blockers (all confirmed by direct source inspection, Section 4):**
1. `crates/lib/src/install/baseline.rs` partition-table generator bails unconditionally on riscv64.
2. `ARCH_USES_EFI` in `crates/lib/src/install.rs:227` excludes riscv64.
3. `crates/lib/src/bootc_composefs/boot.rs` has no riscv64 bootloader-dispatch branch; GrubCC explicitly bails.
4. No riscv64 CI exists to catch regressions or validate any future fix.
5. composefs-rs (Section 9), bootc's newer storage backend, has zero riscv64 signal and depends on kernel-side EROFS + fs-verity support on riscv64, which was not independently verified.

**Organizational blockers:** the author of PR #2125 (an external, non-maintainer contributor with actual riscv64 hardware) committed during review to submitting the `ARCH_USES_EFI` follow-up, but none has landed in the five months since merge (2026-04-16 to 2026-09-11) [NEEDS VERIFICATION - absence of a follow-up does not by itself establish why; could reflect low priority, contributor bandwidth, or simply no further riscv64-hardware-driven need surfacing]. No Red Hat maintainer has independently picked up the remaining work, consistent with riscv64 not currently being a roadmap priority for the dominant corporate sponsor.

**Acceptance probability:** the precedent of ppc64le (Issue #578) and s390x (Issue #112) enablement, both of which were eventually completed, suggests architecture-enablement PRs are readily accepted by this project's maintainers when a motivated contributor does the work. Given that pattern, riscv64 completion is plausible if a contributor (the original author or another party) resumes the effort, but progress has stalled with no tracking issue and no open PR as of this report's date.

## 13. Readiness Assessment

- **Color:** red
- **Release provider:** none
- **Optimization gap:** N/A - bootc is not an optimization-purpose project (no SIMD/JIT/vectorized code paths for any architecture; it is a systems/install tool).
- **Justification:** riscv64 support is confirmed broken/non-functional at the primary function level, not merely untested. Direct source inspection of `crates/lib/src/install/baseline.rs` at HEAD shows the `bootc install` partition-table generator unconditionally executes `anyhow::bail!("Unsupported architecture: {}", ...)` for riscv64 - the tool's core purpose fails at runtime. This sits alongside zero riscv64 CI anywhere (confirmed by reading all 9 GitHub Actions workflow files, [`.github/workflows/`](https://github.com/bootc-dev/bootc/tree/main/.github/workflows)) and zero riscv64 release artifacts across GitHub Releases, PyPI, and Ubuntu 26.04. The single merged riscv64 change, [PR #2125](https://github.com/bootc-dev/bootc/pull/2125), fixed only a secondary partition-GUID-lookup function and explicitly left the install path broken, a gap acknowledged in the PR's own review thread and never resolved.
- **Pending work that could change the grade:** PR #2125's author committed during review to a follow-up PR adding riscv64 to `ARCH_USES_EFI` in `crates/lib/src/install.rs`, but none has landed as of 2026-09-11. No RISE Project involvement was found anywhere that could accelerate this. If the acknowledged `baseline.rs`/`ARCH_USES_EFI`/`boot.rs` gaps were closed and validated (even without CI), the grade would move to orange (distribution/CI floor still absent) or yellow if a clean unmodified-source distro build were confirmed; upstream CI with passing tests would be required to reach blue, and an upstream-published riscv64 artifact to reach green - though bootc currently publishes no architecture-specific binaries for *any* architecture, so green would require a broader upstream release-process change as well.

## 14. Investment Analysis

RISE has not funded or touched bootc in any way (Section 1) - all of the following work is currently unaddressed by any party.

### 14.1 Functional Enablement

- Patch `crates/lib/src/install/baseline.rs` to generate a valid riscv64 partition table instead of bailing.
- Add riscv64 to `ARCH_USES_EFI` in `crates/lib/src/install.rs`, and validate the EFI/ESP creation path end-to-end on riscv64 hardware or a riscv64 UEFI-capable QEMU target.
- Add a riscv64 bootloader-dispatch branch in `crates/lib/src/bootc_composefs/boot.rs` (either extend GrubCC support or explicitly validate/harden the generic `systemd-boot` fallback path for riscv64).
- Update the top-level `Dockerfile`'s bootloader-package-download stage to handle riscv64 instead of exiting with "Unsupported architecture."
- Verify composefs-rs's EROFS + fs-verity storage backend functions on riscv64, including the kernel-side EROFS/fs-verity riscv64 support question, which this report did not independently verify.

### 14.2 Performance Optimization

Not applicable at this stage - bootc has no riscv64-specific performance data or optimization gaps to close (Section 6), and functional enablement (14.1) must land first before performance is a meaningful axis. The dependency-layer performance gaps identified (missing SHA2/CRC32 hardware acceleration on riscv64, Section 9) are pre-existing upstream gaps in third-party crates, not bootc-specific work.

### 14.3 CI/CD Infrastructure

- Add a riscv64 build-and-test job to `.github/workflows/ci.yml`, ideally using RISE's free native riscv64 GitHub runners ([RISE RISC-V Runners](https://riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github/)) rather than QEMU emulation, since a runner-based, hardware-validated CI job is a prerequisite for any color upgrade above orange/yellow.
- No such job exists today; this is greenfield work with no prior art in the repository to build on.

### 14.4 Ecosystem Enablement

Not applicable - bootc has no dependent package ecosystem (Section 10 omitted per this report's scope rules).

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Fix `install/baseline.rs` partition-table generation for riscv64 | 1-2 | Upstream (bootc-dev) | Critical |
| Functional | Add riscv64 to `ARCH_USES_EFI`; validate EFI/ESP path | 1-2 | Upstream (bootc-dev) | Critical |
| Functional | Add riscv64 bootloader-dispatch branch in `boot.rs`; validate systemd-boot/GrubCC fallback | 2-3 | Upstream (bootc-dev) | Critical |
| Functional | Update `Dockerfile` bootloader-package stage for riscv64 | <1 | Upstream (bootc-dev) | High |
| Functional | Verify composefs-rs EROFS + fs-verity works on riscv64 (incl. kernel-side support) | 2-4 (includes upstream kernel/composefs-rs investigation) | Upstream (composefs-rs) / bootc-dev | High |
| CI/CD | Add riscv64 build+test job to `ci.yml`, ideally on RISE runners | 1-2 | Upstream (bootc-dev), potentially RISE-assisted | High |
| Dependencies | Track OSTree upstream riscv64 CI status (currently Yellow, no CI) as a co-blocker | ongoing monitoring, not new work | Upstream (ostreedev) | Medium |

## 15. Updates

(No updates yet - initial report dated 2026-09-11.)

## 16. References

- [bootc-dev/bootc repository](https://github.com/bootc-dev/bootc)
- [bootc.dev documentation](https://bootc.dev/bootc/)
- [PR #2125: fix: add riscv64 to this_arch_root](https://github.com/bootc-dev/bootc/pull/2125)
- [Commit 47c3620](https://github.com/bootc-dev/bootc/commit/47c362089bfeb300442932f70e4f6d19c33753b8)
- [Issue #112: Build fails on s390x](https://github.com/bootc-dev/bootc/issues/112)
- [Issue #578: bootc enablement for ppc64le](https://github.com/bootc-dev/bootc/issues/578)
- [bootc-dev/bootc GitHub Actions workflows](https://github.com/bootc-dev/bootc/tree/main/.github/workflows)
- [bootc-dev/bootc GitHub Releases](https://github.com/bootc-dev/bootc/releases)
- [PyPI bootc package lookup (404)](https://pypi.org/pypi/bootc/json)
- [RISE Python wheel builder](https://riseproject.gitlab.io/python/wheel_builder/)
- [RISE Project blog](https://riseproject.dev/blog)
- [RISE RISC-V Runners announcement](https://riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github/)
- [Phoronix: Current RISC-V CPUs Being Too Slow Causes Headaches For Fedora](https://www.phoronix.com/news/RISC-V-Slow-Fedora-Packages)
- Local sw-ecosystem project reports referenced: `/home/user/sw-ecosystem/project-reports/ostree-rpm-ostree.md`, `/home/user/sw-ecosystem/project-reports/openssl.md`, `/home/user/sw-ecosystem/project-reports/zstd.md`, `/home/user/sw-ecosystem/project-reports/zlib.md`
- Local verification clone: `/home/user/bootc-dev/bootc` (HEAD `089a0aeb4146424c744346b99f1387fe2edee62e`, 2026-09-10)