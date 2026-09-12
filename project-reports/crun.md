---
title: crun
parent: Project Reports
color: yellow
dependencies:
  - name: json-c
    relation: runtime-dependency
    criticality: critical
  - name: libcap
    relation: runtime-dependency
    criticality: critical
  - name: libseccomp
    relation: runtime-dependency
    criticality: critical
  - name: systemd
    relation: runtime-dependency
    criticality: optional
  - name: BLAKE3
    relation: runtime-dependency
    criticality: optional
  - name: wasmer
    relation: runtime-dependency
    criticality: optional
  - name: wasmtime
    relation: runtime-dependency
    criticality: optional
  - name: WasmEdge
    relation: runtime-dependency
    criticality: optional
  - name: WAMR
    relation: runtime-dependency
    criticality: optional
  - name: Mono
    relation: runtime-dependency
    criticality: optional
  - name: libkrun
    relation: runtime-dependency
    criticality: optional
  - name: CRIU
    relation: runtime-dependency
    criticality: optional
  - name: libocispec
    relation: runtime-dependency
    criticality: critical
---

{% include dependency-graph.html slug="dependencies" subset="crun" %}

# crun

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-09-07<br/>
**Readiness:** yellow<br/>
**Scope:** RISC-V (riscv64/linux) support status for crun<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

crun is a C implementation of the OCI (Open Container Initiative) runtime specification, developed by Red Hat under the `containers` GitHub organization (alongside podman, buildah, skopeo). It is dual-licensed GPL-2.0 (CLI) and LGPL-2.1 (libcrun). Its stated differentiator versus the Go-based reference runtime `runc` is lower memory overhead and faster startup, achieved by being written in C with minimal dependencies rather than Go with a large runtime.

**Governance:** No formal foundation membership. Unlike its sibling `runc`, crun is **not** a CNCF or Linux Foundation project. There is no MAINTAINERS, OWNERS, CODEOWNERS, or SUPPORT.md file in the repository. Governance is informal, lead-maintainer style: CONTRIBUTING.md asks contributors to open an issue before large patches "to help ensure alignment," requires DCO sign-off, and defers to podman's contribution guide as the model.

**Corporate sponsors:** Overwhelmingly Red Hat. Across the full commit history (4,658 commits), Giuseppe Scrivano (project creator/lead, Red Hat) accounts for 2,239 commits (+844 under a personal email); Daniel J Walsh (Red Hat) 404; other Red Hat-affiliated contributors (Aditya R, Lokesh Mandvekar, Adrian Reber, Sascha Grunert, Sergio Lopez) add smaller but consistent totals. Kir Kolyshkin and Erik Sjolund are independent contributors with notable volume (243 and 116 commits respectively). Red Hat effectively controls crun maintainership.

**RISE relationship:** crun/containers is **not** a listed RISE member project. Red Hat LLC, however, is a RISE Premier Member (alongside Google, NVIDIA, Qualcomm, SiFive, Tenstorrent, Alibaba, MediaTek). No RISE blog post, RFP, or funded-work announcement mentions crun specifically; the only trace of "crun" in RISE-affiliated material is an incidental 2019 bug reference in this repository's own `containerd.md` report, unrelated to RISE.

**Community stance on new ports:** Welcoming and low-friction. CONTRIBUTING.md asks only that large changes be discussed via an issue first. The riscv64 port precedent (see Section 2) shows a clean, architecture-agnostic C codebase where a new port is almost entirely build/CI/packaging plumbing, reviewed and merged within a single day by the Red Hat-led maintainer team with no formal RFC or governance gate.

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2022-12-29 | PR #1107 merged: bumps `uraimo/run-on-arch-action` to a version supporting riscv64 emulated CI, laying groundwork | [PR #1107](https://github.com/containers/crun/pull/1107) |
| 2023-08-07 | PR #1259 merged: "Add support for riscv64 arch" - the foundational, de facto master enablement PR | [PR #1259](https://github.com/containers/crun/pull/1259) |
| 2023-08-21 | First release containing riscv64 support: v1.8.7 | Verified via `git tag --contains 81896b2` |
| 2024-09-26 | PR #1565 merged: "Disable criu support on riscv64" (CRIU itself had no riscv64 port yet) | [PR #1565](https://github.com/containers/crun/pull/1565) |
| 2024-10-22 | First release containing the CRIU disable: v1.18 | Verified via git tag lookup |
| 2025-04-30 | PR #1730 merged: "Revert 'Disable criu support on riscv64'" once CRIU's own riscv64 port landed in Fedora | [PR #1730](https://github.com/containers/crun/pull/1730) |
| 2025-06-27 | First release containing the CRIU re-enable: v1.22 | Verified via git tag lookup |
| 2026-09-03 | PR #2223 merged: "ci: speed up the emulated cross-arch builds" (riscv64 CI build time 31m -> 12.5m median) | [PR #2223](https://github.com/containers/crun/pull/2223) |
| Unreleased | PR #2223 not yet in a tagged release (latest tag 1.29.1 is 2026-08-12, before this merge) | Verified via git tag lookup |

**Key contributors:** Michal Biesek (independent, michalbiesek@gmail.com) authored the foundational port, PR #1259, reviewed and merged the same day by flouthoc, rhatdan (Daniel Walsh, Red Hat), and giuseppe (Giuseppe Scrivano, Red Hat lead). David Abdurachmanov (Rivos Inc.) and Kristina Hanicova (Red Hat, GitHub: KristinaHa26) drove the CRIU toggle PRs (#1565, #1730). Kir Kolyshkin (independent) authored the recent CI-speedup PR #2223.

**Is it fully upstream?** Yes. Base riscv64 build support (#1259), CRIU support (#1565/#1730), and CI performance work (#2223) are all merged to `main`. No separate formal tracking issue was ever opened for riscv64 - PR #1259 functions as the de facto master PR. The review process across all four riscv64-related PRs was fast and non-controversial; the only blocking comment in the entire history was a DCO-signoff request on #1730, resolved within the same PR by a force-push.

## 3. Upstream Support Tier

No documented/formal tier system exists in crun. In practice, the official release pipeline ([`.github/workflows/release.yaml`](https://github.com/containers/crun/blob/main/.github/workflows/release.yaml)) treats five architectures on paper-equal footing: amd64, arm64, ppc64le, riscv64, s390x - each configured to produce both a standard and a `-disable-systemd` static binary variant via Nix cross-compilation.

However, the actual **test-execution tier is not equal**: riscv64 (and armv7) receive an emulated cross-compile *build* check on every push/PR via `.github/workflows/test.yaml`, but the separate `Test:` job that runs the real functional/integration test suite (podman/containerd/OCI-validation matrix, ~20 named test jobs) has **no architecture matrix at all** and runs x86_64-only. aarch64, s390x, and ppc64le are commented out of even the build-only matrix. So among the five "release-parity" architectures, only amd64 gets full test execution in CI; arm64/ppc64le/s390x get neither build nor test CI coverage (relying entirely on the release-time Nix cross-compile); riscv64 (with armv7) gets build-only CI.

| Architecture | CI build | CI test execution | Official release binary |
|---|---|---|---|
| amd64 | yes (native, full `Test:` job) | yes | yes |
| arm64 | no (commented out of test.yaml matrix) | no | yes (via release.yaml Nix cross-compile) |
| riscv64 | yes (QEMU emulation, build-only) | no | contradictory evidence - see Section 8 |

## 4. Technical Architecture and RISC-V-Specific Subsystems

crun is a thin OCI runtime built on generic Linux syscalls (namespaces, cgroups, mounts, capabilities). A full grep of the source tree for every architecture-conditional pattern (`__x86_64__`, `__aarch64__`, `__riscv`, etc.) found only two places in the entire codebase that are architecture-sensitive at all:

1. **`tests/no_openat2.c`** - a seccomp-filter test helper needing the kernel `AUDIT_ARCH_*` constant for whichever architecture it compiles on. riscv64 is one of six architectures handled on equal footing:
   ```c
   #elif defined __riscv && __riscv_xlen == 64 && defined AUDIT_ARCH_RISCV64
   #  define FILTER_AUDIT_ARCH AUDIT_ARCH_RISCV64
   ```
2. **`src/libcrun/container.c`** - a flat array of libseccomp architecture-token strings (including `"SCMP_ARCH_RISCV64"`) used only to validate OCI spec `seccomp.architectures` entries. Actual syscall-number tables and BPF compilation are delegated entirely to the external libseccomp dependency.

There is no `arch/` directory, no assembly (`.S`/`.s`) files anywhere in the repository, no JIT backend in crun's own code, and no SIMD/vector dispatch for any architecture in crun's core runtime.

**BLAKE3 (the one component with upstream SIMD-dispatch machinery):** crun vendors BLAKE3 (used to hash/cache compiled seccomp BPF filters) but patches `blake3_impl.h` to **force-disable SIMD dispatch for every architecture uniformly**:
```c
/* libcrun specific code. Always force the portable implementation as it is fast enough for us. */
#define blake3_compress_in_place_portable blake3_compress_in_place
...
static inline size_t blake3_simd_degree(void) { return 1; }
```
Only `blake3.c` and `blake3_portable.c` are vendored - no SSE2/AVX2/AVX-512/NEON files exist in the tree at all. This is not a riscv64-specific gap: amd64 and aarch64 get the same scalar C fallback in crun's build.

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Core runtime (namespaces/cgroups/mounts/caps) | full (portable C) | full (portable C) | full (portable C) |
| Seccomp arch validation table | full | full | full (`SCMP_ARCH_RISCV64` present) |
| Test seccomp-filter helper | full | full | full (equal branch) |
| BLAKE3 hashing | scalar C (SIMD force-disabled) | scalar C (SIMD force-disabled) | scalar C (only option; no RVV backend exists upstream in BLAKE3 either) |
| CRIU checkpoint/restore | full | full | full (temporary 2024 disable fully reverted 2025) |

**Conclusion:** crun is not an optimization-purpose project (Section 13 optimization modifier does not apply). Its design leaves essentially no architecture-specific implementation surface to be missing on riscv64; every place that is architecture-sensitive treats riscv64 identically to the other supported architectures, with no stubs or TODOs.

## 5. Build System, Cross-Compilation, and Toolchain

crun uses GNU Autotools (`configure.ac`, `Makefile.am`, `autogen.sh`) - **not** CMake. No `BUILDING.md`, `docs/building.md`, or cross-compilation documentation exists in the tree.

**Standard native build (from README.md):**
```console
$ ./autogen.sh
$ ./configure
$ make
$ sudo make install
```

**riscv64 QEMU-emulated build in CI** (`.github/workflows/test.yaml`, job `build_job`): `autogen.sh` runs natively (fast) on the `ubuntu-latest` x86_64 host before entering emulation; `uraimo/run-on-arch-action@v3.2.0` then spins up a riscv64 container under QEMU user-mode emulation (binfmt_misc) and runs:
```bash
# cross_configure (tests/ci.sh)
./configure --disable-maintainer-mode --enable-embedded-blake3 --enable-werror "$@"
# cross-static: cross_build (no extra args)
# cross-shared: cross_build --enable-shared --disable-static
```
`--disable-maintainer-mode` prevents `make` from re-running autotools inside the slow emulated environment (already done natively). `--enable-embedded-blake3` bundles the portable-C BLAKE3 implementation (see Section 4). PR #2223 (merged 2026-09-03) reduced riscv64 median CI build time from 31m13s to 12m33s-12m44s by running autogen natively, parallelizing the static/shared matrix, and adding `--disable-static` to the shared build.

**True cross-compilation for release binaries** (`flake.nix` + `build-aux/release.sh`, Nix-based, no QEMU):
```nix
riscv64 = {
  system = "x86_64-linux";
  crossSystem.config = "riscv64-unknown-linux-gnu";
  enableCriu = false;
};
```
Notably, `flake.nix` still sets `enableCriu = false` for the Nix riscv64 cross-build target even though upstream CRIU itself now supports riscv64 (per PR #1730) - meaning riscv64 release binaries built via this path may ship without embedded static CRIU support despite crun's own build-time CRIU flag having been re-enabled generally. [NEEDS VERIFICATION - not confirmed whether this Nix-specific flag was updated after #1730].

**Toolchain version requirements:** No riscv64-specific GCC/Clang minimum is documented anywhere. `configure.ac` requires `AC_PREREQ([2.69])` and `AM_INIT_AUTOMAKE([1.11.2 ...])`, applicable to all architectures. The only real dependency-version floor relevant to riscv64 is inferred, not stated: `SCMP_ARCH_RISCV64` requires libseccomp >= 2.4.0 (2019, when libseccomp added riscv64 support), and `AUDIT_ARCH_RISCV64` requires kernel headers new enough to define it (~Linux 5.6-era). Neither is asserted by `configure.ac` itself - a too-old libseccomp would simply fail to compile.

**Dockerfiles:** No riscv64-specific Dockerfile exists. All 14 Dockerfiles under `tests/*/Dockerfile` are generic x86_64 CI test containers with no architecture targeting.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Core OCI runtime operations | yes | yes | yes |
| Seccomp filtering | yes | yes | yes |
| CRIU checkpoint/restore | yes | yes | yes (re-enabled per PR #1730; dependent on CRIU's own riscv64 port) |
| `--with-libkrun` (KVM microVM backend) | yes | yes | **no** - `rpm/crun.spec` gates krun support to `%ifarch aarch64 x86_64` only |
| `--with-wasmedge` (Wasm handler) | yes | yes | **no** - same `%ifarch aarch64 x86_64` gate |
| `--with-wasmer`, `--with-wasmtime`, `--with-wamr`, `--with-mono` (other experimental handlers) | available (with upstream stability caveats) | available (with upstream stability caveats) | not gated in crun's spec file the same way as krun/wasmedge, but underlying dependencies are unstable on riscv64 - see Section 9 |

**Functional gaps:** libkrun and WasmEdge integration are explicitly excluded from riscv64 builds at the packaging level (`rpm/crun.spec` `%ifarch` guards), independent of whether the underlying libraries could technically build there.

**Performance gaps:** None specific to riscv64 - BLAKE3 SIMD is disabled identically on all architectures (Section 4), so there is no riscv64-specific performance delta from missing vectorization in crun's own code.

**Security hardening gaps:** None identified specific to riscv64. Seccomp architecture validation and audit-arch filtering are complete and equivalent to other architectures (Section 4).

**NaN/floating-point semantics issues:** Not applicable - crun performs no floating-point-sensitive numerical computation.

## 7. CI/CD Infrastructure

Confirmed by direct read of all three workflow files in `.github/workflows/`: `codeql-analysis.yml`, `release.yaml`, `test.yaml`. No GitLab CI, Jenkinsfile, or Cirrus CI configuration exists anywhere in the repository.

**`test.yaml`** (`on: [push, pull_request]`): Job `build_job` runs on `ubuntu-latest` (x86_64 host) using `uraimo/run-on-arch-action@v3.2.0` for a **QEMU user-mode-emulated** cross-build of `riscv64` and `armv7` (aarch64/s390x/ppc64le are commented out of the matrix). This step runs `./tests/ci.sh cross-static`/`cross-shared`, confirmed to be a **build-only** step (autogen + configure + make) - it does not execute the actual functional/integration test suite. That test suite runs in a separate `Test:` job in the same file with **no architecture matrix at all**, i.e. x86_64-only.

**`release.yaml`** (`on: [push, pull_request]`, release job gated `if: startsWith(github.ref, 'refs/tags/')`): Builds release binaries for amd64/arm64/ppc64le/riscv64/s390x via Nix cross-compilation on `ubuntu-latest`, uploads a `crun-linux-riscv64` artifact. This is release-artifact packaging, not a correctness test - the riscv64 binary is never executed.

**`codeql-analysis.yml`**: No riscv64 reference at all; single-arch (x86_64) static analysis on push/PR to `main` plus a weekly cron.

**No native riscv64 hardware runner exists anywhere in CI.** No RISE runner reference (`riseproject-dev`, RISE-labeled runners) was found in any workflow file.

| | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI build | yes (native) | no (commented out of test.yaml matrix) | yes (QEMU emulation) |
| CI test execution | yes (full `Test:` job, ~20 test targets) | no | no |
| CI release artifact | yes | yes (Nix cross-compile) | yes, per workflow source (contradictory verification on actual published assets - Section 8) |
| Runner type | native x86_64 | none in CI (release-time cross-compile only) | QEMU emulation on x86_64 host |

This directly verified, build-only-CI finding is the deciding fact for the yellow classification in Section 13.

## 8. Distribution and Release Status

**Official upstream GitHub Releases - contradictory findings, unresolved:**
- One research pass (WebFetch of `github.com/containers/crun/releases`) found riscv64 assets present for v1.29.1 (2026-08-13): `crun-1.29.1-linux-riscv64` and `crun-1.29.1-linux-riscv64-disable-systemd`, plus `.asc` signatures, alongside amd64/arm64/ppc64le/s390x.
- A later adversarial verification pass, fetching the same URL, found the **opposite**: the v1.29.1 asset list contained only amd64, arm64, and ppc64le variants plus source archives - **no riscv64 asset**.
- Both passes used WebFetch against the same rendered HTML page; neither had authenticated GitHub API/git access to `containers/crun` in-session to settle this definitively.
- The `release.yaml` workflow **source itself**, read directly (not summarized), unambiguously loops riscv64 into its build/upload/rename steps (`for ARCH in amd64 arm64 ppc64le riscv64 s390x`) and names a `crun-${VERSION}-linux-riscv64` release asset - i.e., the release pipeline is configured to produce and publish a riscv64 asset for every tagged release.
- **[NEEDS VERIFICATION]: whether v1.29.1 (or any recent tagged release) actually has a downloadable riscv64 asset on the GitHub Releases page.** This is a genuine unresolved contradiction between two observations of the same rendered page; the directly-read workflow configuration is the stronger single source and indicates riscv64 assets should be produced, but does not itself prove any particular release's asset list.

**Ubuntu 26.04 ("resolute") - confirmed:** Verified via raw `curl`+`grep` of `packages.ubuntu.com` (not just a summarized fetch): `crun_1.21-1ubuntu3_riscv64.deb` exists and is downloadable, explicitly described as "on RISC-V 64-bit little endian (riscv64) machines." This is solid, directly-verified evidence of a real riscv64 binary package.

**PyPI - not applicable:** `https://pypi.org/pypi/crun/json` resolves to an unrelated Python pipeline tool by GitHub user L3viathan (`crun-2.13.0.tar.gz`), not the OCI runtime. crun (the C project) is not distributed via PyPI at all; any claim of PyPI riscv64 availability for this project is invalid on its face.

**RISE GitLab PyPI wheel mirror - not applicable:** Redirects (HTTP 302) to the same unrelated PyPI package. Not applicable since crun is a C binary, not a Python wheel.

**Arch Linux RISC-V - inconclusive:** `archriscv.felixc.at` is a JS-rendered SPA; static/agent fetches returned no package data. Cannot confirm or refute crun's presence there.

**What a user must do to get a working binary today:** The only channel with a directly, independently confirmed riscv64 binary is the Ubuntu distro package (`crun_1.21-1ubuntu3_riscv64.deb` on 26.04/resolute). Users on other distros or wanting the latest upstream version should check the GitHub Releases page directly for a riscv64 asset given the unresolved contradiction above, or build from source via the standard Autotools flow (Section 5), which is confirmed to work on riscv64 (PR #1259 and downstream distro builds both confirm no source-level riscv64 blockers).

## 9. Dependencies

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Community/status |
|---|---|---|---|---|---|
| json-c (>=0.14) | Required - (de)serializes OCI config.json/state JSON | portable C, no arch-specific code | no riscv issues found | ships as ordinary arch-generic package | none known |
| libcap | Required - POSIX capability management | pure syscall wrapper, arch-agnostic | not on GitHub (kernel.org-hosted) | ships wherever glibc/kernel headers exist | none known; see [libcap report](project-reports/libcap.md) |
| libseccomp | Default-on (`--disable-seccomp` to skip); also used for BLAKE3-hash-cached BPF filters | RISC-V support merged (issue #110, closed) | no open riscv64 test failures | source tarballs; riscv64 packaging via downstream distros | 4 riscv issues, all closed; see [libseccomp report](project-reports/libseccomp.md) |
| systemd (libsystemd) | Default-on (`--disable-systemd` to skip); cgroup v2 + notify-socket support | builds on riscv64 | systemd/systemd#39192: `systemd-detect-virt` on Ubuntu 25.10 riscv64/QEMU fails with permission error - open riscv64 behavioral bug relevant to crun's virt-detection path | Ubuntu ships systemd for riscv64 already | one open riscv64-relevant bug (#39192); older riscv32-only issues closed |
| BLAKE3 (embedded default) | Crypto hash for seccomp-filter caching | portable-C fallback builds fine, unoptimized | no riscv-specific failures | inherits crun's own release cadence | upstream BLAKE3-team/BLAKE3#484 "Improved RISC-V support + SIMD" open since May 2025 - no RVV backend exists |
| wasmer (optional, `--with-wasmer`) | JIT backend for OCI-wasm handler | RISC-V Cranelift backend exists but unstable | multiple open crashes: wasmerio/wasmer#6078 (cranelift crashes for RISC-V), #5816 (skip_stack_guard_page crash on riscv64gc) | no riscv64 binary releases; compile-target only | experimental/unstable on riscv64 |
| wasmtime (optional, `--with-wasmtime`) | JIT backend (Cranelift) | riscv64 is a Cranelift target with many gaps | frequent open ISLE-lowering panics through 2026 (#13959, #12195, #11050); 108 total riscv64-tagged issues | treated as secondary/tier-2 target, no dedicated release | least mature Cranelift backend relative to x86_64/aarch64 |
| WasmEdge (optional, `--with-wasmedge`; also excluded from riscv64 in `rpm/crun.spec`) | JIT/AOT backend | historical AOT runtime errors (#1708, closed) and toolchain build errors (#1694, closed) | no open riscv64 test failures | CI historically emulation-only (#3625, closed) | all 4 riscv64 issues found are closed; not gated for riscv64 by crun itself, but historically fragile |
| WAMR (optional, `--with-wamr`) | JIT/AOT/interpreter backend | native riscv64 CMake target (`WAMR_BUILD_TARGET=RISCV64`, LP64/LP64D ABI variants) | zero riscv64-tagged issues found | maintained CMake target, not experimental bolt-on | cleanest riscv64 story of the Wasm JIT dependencies |
| mono (optional, `--with-mono`) | JIT runtime (CLR) for .NET entrypoints | RISC-V port unstable: mono/mono#21117 "make failing in RISC-V" (open), #21087 "unable to configure from source on Debian RISC-V" (open) | mono/mono#21114 "make check failing on RISC-V" (open) - no clean test baseline | no riscv64 binary releases; source builds currently broken | 4 open riscv64 issues - weakest link of crun's optional integrations |
| libkrun (optional, `--with-libkrun`; excluded from riscv64 in `rpm/crun.spec`) | KVM microVM isolation backend | explicit riscv64 arch support in-tree (`src/arch/src/riscv64/*`), self-labeled "experimental (KVM)" in `AGENTS.md` | zero riscv64-tagged issues found | self-declared experimental, no separate release channel | relies on RISC-V H-extension hypervisor support, newer/less battle-tested than KVM/aarch64 |
| CRIU (optional, `--disable-criu`) | Checkpoint/restore | N/A - see below | N/A | N/A | see below and [criu report](project-reports/criu.md) |
| libocispec (git submodule, build-time codegen) | Generates OCI spec structs from JSON Schema | pure code-gen, portable C, no arch-specific code | 1 total issue found, unrelated to architecture | tracks crun's own release cadence | none found |

**Deep-dive: CRIU.** crun's own riscv64 support for CRIU is fully re-enabled upstream (PR #1730, Section 2). However [checkpoint-restore/criu#1702, "Support for RISC-V"](https://github.com/checkpoint-restore/criu/issues/1702) has been **open since December 2021 with no resolution** - meaning CRIU itself may still lack a complete riscv64 port, which would leave `crun checkpoint`/`crun restore` non-functional on riscv64 regardless of crun's own build-time flag state. This is flagged as a discrepancy worth resolving: PR #1730's stated rationale (CRIU riscv64 support "merged recently" in Fedora) implies at least partial upstream CRIU riscv64 support exists via a Fedora-specific patch set, even if the general tracking issue #1702 remains open upstream. [NEEDS VERIFICATION - the exact current state of CRIU's own riscv64 support, given the open tracking issue alongside a Fedora-sourced claim of it landing].

**Summary of riscv64 risk gradient among dependencies:** Solid (json-c, libcap, libocispec, WAMR, libseccomp, systemd with one open bug); present but experimental (libkrun); functionally present with quality gap (BLAKE3 - scalar-only universally); actively unstable optional JIT backends (wasmtime, wasmer); broken from source (mono); and either resolved or still-blocked depending on source (CRIU - contradictory signals between PR #1730's rationale and the still-open upstream tracking issue).

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [containers/crun#1414](https://github.com/containers/crun/issues/1414) | `crun: bpf create \`\`: Invalid argument` | Closed, no visible resolution/comments | Medium - blocks container startup on affected hardware | Reported on VisionFive2 (JH7110 SoC), custom kernel 6.6.0, crun 1.14. Reporter's own diagnosis and a linked Podman duplicate both point to `CONFIG_CGROUP_BPF` being disabled in the reporter's kernel build despite `CONFIG_BPF`/`CAP_BPF` present - a kernel-config gap on that specific RISC-V board, not a confirmed crun code bug. Zero maintainer engagement/comments visible on either the crun or podman copy of this issue. |
| [containers/podman#21595](https://github.com/containers/podman/issues/21595) | "RISC-V: crun: bpf create \`\`: Invalid argument" | Closed as not planned | Medium | Duplicate of #1414, filed first in podman's tracker; same environment. |
| [containers/crun#1765](https://github.com/containers/crun/issues/1765) | "use BPFProgram=device: to configure the devices cgroup" | Closed (completed) | Low (context) | Not RISC-V-specific, but proposes moving crun off the raw eBPF-generation code path implicated in #1414/#21595 toward systemd's `BPFProgram=device:` - potentially reduces future kernel-config fragility of this path across architectures including riscv64. |
| [checkpoint-restore/criu#1702](https://github.com/checkpoint-restore/criu/issues/1702) | "Support for RISC-V" | Open (since Dec 2021) | High for CRIU-dependent workflows | External dependency; if unresolved, `crun checkpoint`/`crun restore` may not function on riscv64 despite crun's own flag being re-enabled (PR #1730). See Section 9 for the discrepancy this creates. |

**Correctness bugs highlighted separately:** #1414 is the only unresolved riscv64 correctness report found, and it is distinct from the deliberate, well-reviewed arch-support and CRIU-toggle PRs in that it received zero maintainer engagement. No open riscv-tagged issue currently exists in the crun repository search (`riscv is:open repo:containers/crun` returns 0 results) - all riscv-related issues found are closed.

## 12. Objections and Upstream Blockers

**Stated objections:** None found. Across all four riscv64-relevant PRs (#1259, #1565, #1730, #2223), the only blocking review comment in the entire history was a DCO-signoff request on #1730 (lsm5: "commit needs signoff. LGTM otherwise"), resolved within the same PR via a force-push. No maintainer raised a technical objection to riscv64 support at any point.

**Technical blockers:** None internal to crun. The one real external technical blocker is CRIU's own riscv64 port maturity (checkpoint-restore/criu#1702, open since 2021) - this blocks crun's checkpoint/restore feature specifically, not the core runtime. Separately, several *optional* JIT-backend dependencies (wasmtime, wasmer, mono) have unstable or broken riscv64 support, but these handlers are opt-in build flags (`--with-wasmtime`, `--with-wasmer`, `--with-mono`), and mono/WasmEdge/libkrun are excluded from riscv64 in the RPM packaging (`%ifarch` gates) so they do not block the default riscv64 build.

**Organizational blockers:** None identified. Red Hat, which controls crun's maintainership, treats riscv64 as one of five architectures in the release pipeline. No governance gate or RFC process specific to new architecture ports exists.

**Acceptance probability for further riscv64 work:** High. The historical pattern (same-day review and merge for #1259, #1565, #1730; #2223 approved by the project lead within the PR's lifecycle) shows a low-friction path for future riscv64-related contributions. Extending the `Test:` job's architecture matrix to include riscv64 execution (now cheaper post-#2223) would be a natural, low-controversy next PR given this history.

## 13. Readiness Assessment

- **Color:** yellow (build-only-ci)
- **Release provider:** upstream (release.yaml workflow source configures riscv64 into its build/upload loop; independently, Ubuntu also ships a riscv64 `.deb`)
- Not an optimization-purpose project; optimization level is omitted per the color model.

**Justification:** crun's riscv64 support is capped at yellow because upstream CI compiles riscv64 on every push and pull request via QEMU emulation ([`test.yaml`](https://github.com/containers/crun/blob/main/.github/workflows/test.yaml), `uraimo/run-on-arch-action@v3.2.0` running `./tests/ci.sh cross-static`/`cross-shared`) but does not execute the project's actual test suite against that riscv64 build - the functional/integration `Test:` job in the same workflow file has no architecture matrix and runs exclusively on `ubuntu-latest` (x86_64). This build-but-do-not-test pattern is the direct match for the yellow classification (build-only-ci), confirmed twice independently by direct reads of the same YAML file. A genuine unresolved contradiction exists on the release-artifact question (Section 8) - one fetch of the GitHub Releases page found riscv64 assets for v1.29.1, a later fetch found none - but this does not change the color, since the missing test execution already caps it at yellow regardless of release-artifact status. Independently, Ubuntu 26.04 ("resolute") ships a genuine riscv64 `.deb` (confirmed via raw HTML fetch of [packages.ubuntu.com](https://packages.ubuntu.com/resolute/riscv64/crun/download)), which alone would satisfy the distribution floor even absent upstream CI.

**Pending work that could change the grade:** PR #2223 (merged 2026-09-03) reduced the emulated riscv64 CI build time from a 31-minute to a 12.5-minute median, which removes the practical cost objection to extending the `Test:` job's matrix to riscv64. Doing so - adding riscv64 to the actual functional/integration test job rather than only the build-only job - is the concrete next step that would move crun from yellow to blue (if it passes) or clarify a red/orange finding (if it does not). Resolving the release-asset contradiction (Section 8) by directly confirming what is currently published for a recent tagged release would also sharpen the release_provider determination, though it does not itself change the color. No RISE-funded work specific to crun was found that would accelerate either of these.

## 14. Investment Analysis

RISE has not funded any crun-specific work (Section 1, Section 12) - all sizing below assumes a from-scratch engineering allocation, not incremental work on top of existing RISE investment.

### 14.1 Functional Enablement

Core functional enablement is already complete: riscv64 builds, boots, and runs the base OCI runtime feature set, per PR #1259 and the Ubuntu distro package. The remaining functional gap is the unresolved eBPF `bpf create` failure (#1414) on at least one real RISC-V board (VisionFive2/JH7110) - this needs a root-cause investigation to distinguish a kernel-config issue (as the reporter suspected) from an actual crun code defect, since the issue was closed with zero maintainer engagement. Separately, CRIU checkpoint/restore functionality depends on an external, still-open upstream gap (checkpoint-restore/criu#1702) that is outside crun's control to fix directly, though contributing engineering time to that CRIU issue would unblock crun's own already-merged support.

### 14.2 Performance Optimization

Not applicable in the traditional SIMD/vectorization sense - crun has no architecture-specific optimized code paths for any architecture (Section 4), so there is no riscv64-specific performance gap to close relative to amd64/arm64. The only performance-adjacent items are (a) CI build time, already addressed by PR #2223, and (b) whether CRIU-external dependencies (BLAKE3, if ever un-forced from scalar mode) would benefit riscv64, which is a BLAKE3-upstream question (BLAKE3-team/BLAKE3#484) rather than a crun-specific investment.

### 14.3 CI/CD Infrastructure

The highest-leverage investment identified in this research: extend `.github/workflows/test.yaml`'s functional `Test:` job to include riscv64 in its architecture matrix, now that PR #2223 has made emulated riscv64 CI runs materially cheaper (12.5 min median vs 31 min). This would close the single gap that keeps crun at yellow instead of blue. A stretch goal, contingent on RISE or another party providing native riscv64 runners, would be to run riscv64 CI on real hardware rather than QEMU emulation, eliminating the ~2.5x-and-up build-time and correctness-fidelity penalty inherent to user-mode emulation.

### 14.4 Ecosystem Enablement

Not applicable - Section 10 is omitted, since crun is a standalone system tool (an OCI runtime binary) with no dependent package ecosystem (no Python/npm/Maven/Kubernetes-operator consumers whose own riscv64 enablement depends on crun's).

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| CI/CD | Extend `test.yaml`'s functional `Test:` job to run on riscv64 (build-only to build+test) | 1-2 | Upstream (containers/crun) or sponsor engineer via upstream PR | High |
| Functional | Root-cause investigation of eBPF `bpf create` failure (#1414) on RISC-V hardware, distinguishing kernel-config gap from crun defect | 1-2 | Upstream / hardware-access engineer (needs a RISC-V board, e.g. VisionFive2 or RISE-provided native runner) | Medium |
| Dependency (external) | Contribute to checkpoint-restore/criu#1702 to close CRIU's own riscv64 port gap, unblocking crun's already-merged checkpoint/restore support | 4-8 (external project, not crun itself; rough order-of-magnitude, unverified against CRIU's actual codebase) | Upstream CRIU project / sponsor engineer | Medium |
| Distribution | Directly confirm (via authenticated GitHub API or fresh manual check) whether current tagged GitHub Releases include a riscv64 asset, resolving the Section 8 contradiction | <1 | Any engineer with GitHub API access to containers/crun | Low |
| Ecosystem | N/A - no dependent package ecosystem | - | - | - |

## 15. Updates

(No updates yet - initial report dated 2026-09-07.)

## 16. References

- [PR #1259 - Add support for riscv64 arch](https://github.com/containers/crun/pull/1259)
- [PR #1565 - Disable criu support on riscv64](https://github.com/containers/crun/pull/1565)
- [PR #1730 - Revert "Disable criu support on riscv64"](https://github.com/containers/crun/pull/1730)
- [PR #2223 - ci: speed up the emulated cross-arch builds](https://github.com/containers/crun/pull/2223)
- [PR #1107 - build(deps): bump uraimo/run-on-arch-action from 2.3.0 to 2.5.0](https://github.com/containers/crun/pull/1107)
- [Merge commit 88a5a28 - merges PR #2223](https://github.com/containers/crun/commit/88a5a2812782b83dca9ecee7700b6d2c759cb699)
- [Issue #994 - Will you offer more CPU architecture builds like runc?](https://github.com/containers/crun/issues/994)
- [Issue #1414 - crun: bpf create \`\`: Invalid argument](https://github.com/containers/crun/issues/1414)
- [Issue #1765 - use BPFProgram=device: to configure the devices cgroup](https://github.com/containers/crun/issues/1765)
- [Issue #1400 - Upgrade to 1.14 breaks some docker containers](https://github.com/containers/crun/issues/1400)
- [Issue #1437 - BPF create error on Debian kernel >=5.10.0-26-amd64](https://github.com/containers/crun/issues/1437)
- [containers/podman#21595 - RISC-V: crun: bpf create \`\`: Invalid argument](https://github.com/containers/podman/issues/21595)
- [checkpoint-restore/criu#1702 - Support for RISC-V](https://github.com/checkpoint-restore/criu/issues/1702)
- [BLAKE3-team/BLAKE3#484 - Improved RISC-V support + SIMD](https://github.com/BLAKE3-team/BLAKE3/issues/484)
- [seccomp/libseccomp#110 - RISC-V support (RFE)](https://github.com/seccomp/libseccomp/issues/110)
- [systemd/systemd#39192 - systemd-detect-virt permission denied on Ubuntu 25.10 riscv64/QEMU](https://github.com/systemd/systemd/issues/39192)
- [wasmerio/wasmer#6078 - cranelift crashes for RISC-V](https://github.com/wasmerio/wasmer/issues/6078)
- [wasmerio/wasmer#5816 - skip_stack_guard_page crashes on riscv64gc target](https://github.com/wasmerio/wasmer/issues/5816)
- [bytecodealliance/wasmtime#12197 - Tracking: Missing ISLE lowering rules and internal panics](https://github.com/bytecodealliance/wasmtime/issues/12197)
- [mono/mono#21117 - make failing in RISC-V](https://github.com/mono/mono/issues/21117)
- [mono/mono#21114 - make check failing on RISC-V](https://github.com/mono/mono/issues/21114)
- [containers/crun .github/workflows/test.yaml](https://github.com/containers/crun/blob/main/.github/workflows/test.yaml)
- [containers/crun .github/workflows/release.yaml](https://github.com/containers/crun/blob/main/.github/workflows/release.yaml)
- [containers/crun .github/workflows/codeql-analysis.yml](https://github.com/containers/crun/blob/main/.github/workflows/codeql-analysis.yml)
- [containers/crun flake.nix](https://github.com/containers/crun/blob/main/flake.nix)
- [containers/crun rpm/crun.spec](https://github.com/containers/crun/blob/main/rpm/crun.spec)
- [containers/crun GitHub Releases](https://github.com/containers/crun/releases)
- [Ubuntu 26.04 resolute crun riscv64 package](https://packages.ubuntu.com/resolute/riscv64/crun/download)
- [PyPI crun (unrelated package, not this project)](https://pypi.org/pypi/crun/json)
- [RISE Project - Announcing the RISE RISC-V Runners](https://riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github/)
- [RISE Project - RISE RISC-V Runners: Six Weeks In](https://riseproject.dev/2026/05/12/rise-risc-v-runners-six-weeks-in/)
- [Performetriks - Performance Comparison of RUNC vs CRUN Container Runtimes (non-RISC-V figures)](https://www.performetriks.com/post/performance-comparison-of-runc-vs-crun-container-runtimes)
