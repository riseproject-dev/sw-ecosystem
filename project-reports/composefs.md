---
title: composefs
parent: Project Reports
color: yellow
---

{% include dependency-graph.html slug="dependencies" subset="composefs" %}

# composefs

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-09-11<br/>
**Readiness:** yellow<br/>
**Scope:** RISC-V (riscv64/linux) support status for composefs<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

composefs is a read-only, integrity-verified, content-addressed filesystem designed for container and OSTree image storage, layering an EROFS-formatted metadata image over content-addressed object storage with Linux fs-verity for integrity checking. It was created by Alexander Larsson and Giuseppe Scrivano, both Red Hat engineers, and was accepted into the CNCF Sandbox on 2025-01-21.

**Repository location note:** the task specified [containers/composefs](https://github.com/containers/composefs), but that path no longer resolves. The project now lives at [composefs/composefs](https://github.com/composefs/composefs) (C implementation) and [composefs/composefs-rs](https://github.com/composefs/composefs-rs) (Rust implementation). This report covers the C implementation, which is the primary artifact distributed by Linux distributions.

**Governance:** composefs is hosted as "composefs, a Series of LF Projects, LLC" (Linux Foundation umbrella structure), not as an independent foundation. Governance is informal: `MAINTAINERS.md` lists a single "Approver" role with no separate charter, tiering document, or RFC process (`GOVERNANCE.md` does not exist). License is multi-licensed: BSD-2-Clause, GPL-2.0-only, GPL-2.0-or-later, LGPL-2.1-or-later, Apache-2.0.

**Corporate sponsors / maintainers** (from `MAINTAINERS.md`):

| Maintainer | GitHub | Company |
|---|---|---|
| Alexander Larsson | alexlarsson | Red Hat |
| Giuseppe Scrivano | giuseppe | Red Hat |
| Colin Walters | cgwalters | Red Hat |
| Jan Lubbe | jluebbe | Pengutronix |

3 of 4 maintainers are Red Hat employees; recent commit activity is dominated by `cgwalters`, `jeckersb` (both Red Hat/bootc ecosystem), and an automated `bootc-dev` sync bot. The project is de facto Red Hat/bootc-driven with one independent (Pengutronix) maintainer.

**Community culture on new ports:** The only recorded interaction on architecture support is a maintainer's cost/benefit objection to adding riscv64 CI (detailed in Section 2/12) -- not a rejection of riscv64 as a target, but skepticism that dedicated CI coverage was worth the build-time cost given the codebase's near-total lack of architecture-specific logic. `CONTRIBUTING.md` states only that composefs "should be buildable on nearly any relatively modern Linux OS/distribution", with no stated architecture-tiering policy.

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2023-08-13 | Contributor michalbiesek opens PR #174, "ci: add riscv64 support", adding a riscv64 entry (via QEMU emulation using `uraimo/run-on-arch-action`) to the GitHub Actions build matrix | [PR #174](https://github.com/composefs/composefs/pull/174) |
| 2023-08-14 | Maintainer alexlarsson objects on cost/benefit grounds; author agrees and closes the PR unmerged | [PR #174](https://github.com/composefs/composefs/pull/174) |
| 2025-01-21 | composefs accepted into CNCF Sandbox | Research findings (cncf.io/projects/composefs) |
| 2026-04-23 (approx.) | Ubuntu 26.04 "resolute" ships `composefs`, `libcomposefs1`, `libcomposefs-dev` version 1.0.8-3 for riscv64 in universe | [packages.ubuntu.com](https://packages.ubuntu.com/search?keywords=composefs&suite=resolute&searchon=names&section=all) |

**Key contributors:** michalbiesek (external contributor, sole author of the only riscv64-related change attempt; `author_association: NONE` per GitHub). No composefs maintainer (all Red Hat / Pengutronix) has authored riscv64-related work.

**Is it fully upstream?** No. There is no riscv64 support in upstream CI, upstream documentation, or upstream release artifacts. The single riscv64-related contribution (PR #174) was closed unmerged. Zero commits mentioning "riscv" exist anywhere in the project's full git history (1125 commits checked via `git log --all -i --grep="riscv"`).

## 3. Upstream Support Tier

composefs has no formal, written architecture-tier policy (`PLATFORMS.md`, `SUPPORT.md`, `docs/platforms/` do not exist in the repository). Architecture support is de facto defined by what CI exercises: x86_64 only.

| Axis | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Upstream CI builds | Yes (`ubuntu-24.04` runners) | No matrix entry | No matrix entry |
| Upstream CI runs tests | Yes | No | No |
| Upstream official release binary | No (source tarball only, all releases) | No | No |
| Release-blocking gate | Yes (x86_64 is the only tested arch) | N/A | N/A |
| Distro packaging (unmodified source) | Yes | [NEEDS VERIFICATION - not directly checked in this research pass] | Yes (Ubuntu 26.04 resolute, v1.0.8-3, universe) |

Evidence: all three live CI workflow files (`.github/workflows/builds.yaml`, `test.yaml`, `ci-bootc.yml`) run exclusively on `ubuntu-24.04`/`ubuntu-latest` GitHub-hosted x86_64 runners, confirmed by direct byte-for-byte reads of each file plus a full-history `git log --all --diff-filter=A --name-only -- '.github/workflows/*'` scan covering every workflow file that ever existed (including the since-deleted `rust.yml`). No `.gitlab-ci.yml`, `Jenkinsfile`, or `.cirrus.yml` exist.

## 4. Technical Architecture and RISC-V-Specific Subsystems

composefs has **no architecture-specific subsystems of any kind**. This was confirmed by exhaustive source review, not inference:

- No `.S` assembly files exist anywhere in the C repository.
- `grep -riE '__riscv|__x86_64__|__aarch64__|__arm__|__powerpc|__s390x__|__i386__'` across the full C source tree returned zero hits in any source file.
- No SIMD intrinsics, no JIT, no hand-rolled checksum/hash routines with per-arch dispatch.
- fs-verity digest computation (SHA-256) is delegated entirely to OpenSSL (libcrypto) via the EVP API in `lcfs-fsverity.c`, with a pure-C SHA-256 fallback if OpenSSL is unavailable at build time.
- Byte-order handling (`libcomposefs/lcfs-internal.h`, `erofs_fs_wrapper.h`) uses portable glibc/BSD macros (`htole16/32/64`, `le16toh`) that work identically on any architecture with zero per-arch code.
- `meson.build` contains only feature/OS-detection checks (`endian.h` variants, `MOUNT_ATTR_IDMAP`, `FSCONFIG_CMD_CREATE`) -- no `$host_cpu` or architecture-name branching.

The Rust implementation (`composefs/composefs-rs`) has exactly one `target_arch` conditional in the entire repository, in `crates/composefs-ioctls/src/mount.rs`, carving out a divergent `mount_setattr` syscall number for MIPS variants. riscv64 falls into the generic default branch (syscall 442), which is the architecturally correct value under Linux's generic `asm-generic/unistd.h` table (shared with arm64, ppc64le, s390x, and coincidentally x86_64). This is confirmed correct, not a gap.

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Core FS format (EROFS writer/reader), digest/byte-order logic | Full - generic C, no arch code | Full - same generic C | Full - identical code path, no arch-specific logic anywhere |
| `mount_setattr` syscall number (composefs-rs) | Full (442, generic default) | Full (442, generic default) | Full (442, generic default) - correctly derived from the generic ABI, not a guess |
| Hardware-accelerated hashing / SIMD | Absent (delegated to OpenSSL, out of composefs's own scope) | Absent (same) | Absent (same) - not a riscv64-specific gap |

**Conclusion:** because there is no architecture-specific implementation surface to begin with, composefs's C and Rust code cannot be "partial" or "stub" on riscv64 in the way an optimization-purpose project could be. This is not an optimization-purpose project (Section 13 confirms the Step 2 modifier does not apply).

## 5. Build System, Cross-Compilation, and Toolchain

composefs is built with **Meson/Ninja**, not CMake -- no `CMakeLists.txt` exists anywhere in the repository, and no riscv64 cross-toolchain file (`cmake/riscv64.cmake` or equivalent) exists.

Standard build commands used throughout CI (identical for every tested distro/arch):

```bash
meson setup build --prefix=/usr -Dfuse=disabled   # or --werror, -Db_sanitize=address,undefined
meson compile -C build
meson test -C build
DESTDIR=$(pwd)/instroot meson install -C build
```

Only two Meson options exist at all (`meson_options.txt`): `man` and `fuse` (both feature, default `auto`) -- no architecture-related build flags. Dependency installation (`hacking/installdeps.sh`) is a plain Debian/Fedora package-manager script with no per-arch or toolchain-version conditionals.

**No riscv64 cross-compilation material exists in the repository** at all: no Dockerfile for riscv64 (the only Dockerfile-shaped file, `ci/Containerfile.c9s-bootc`, is CentOS Stream 9 / x86_64-generic with no arch pinning), no QEMU cross-arch step, no cross-file (`meson setup --cross-file=<file>` is Meson's standard mechanism for this, but no such file exists in-tree). A riscv64 build today would have to use plain native `meson setup` on riscv64 hardware/QEMU, or Meson's generic cross-file mechanism built from scratch.

**Known build failures:** none documented -- there is no riscv64 CI to surface any, and no riscv64-tagged build-failure issues were found (Section 11).

**Toolchain versions/why:** [NEEDS VERIFICATION - no minimum GCC/Clang/Meson version tied to riscv64 specifically was found; `meson.build` states no arch-specific compiler requirement].

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Core EROFS image creation/mounting | Yes | Yes (untested by upstream CI) | Yes (untested by upstream CI; confirmed working via Ubuntu distro build, Section 8) |
| fs-verity integrity verification | Yes | Yes (untested by upstream CI) | Yes - delegates to kernel fs-verity + OpenSSL, no riscv64-specific gap identified |
| `composefs-fuse` userspace mount tool (optional, needs libfuse3) | Yes | [NEEDS VERIFICATION] | Ubuntu 26.04 ships `fuse3 3.18.2-1` for riscv64 (ports); no composefs-specific riscv64 fuse testing found |
| Upstream automated test execution | Yes | No | No |

**Functional gaps:** none identified as riscv64-specific -- the codebase has no arch-conditional logic that could produce a functional gap distinct from any other untested architecture.

**Performance gaps:** not applicable -- composefs has no SIMD/vectorized hot paths on any architecture (Section 4); there is nothing riscv64-specific to be missing performance-wise.

**Security hardening gaps:** none specific to composefs's own code was identified. The one security-relevant dependency concern is inherited from OpenSSL (Section 9): AES T-table fallback is not constant-time on silicon lacking Zkn/Zvkned vector-crypto extensions, which describes the majority of currently deployed riscv64 chips. This is a dependency-level concern, not a composefs code issue, since composefs's own crypto usage is limited to SHA-256 digests via OpenSSL's EVP API (not AES).

**NaN / floating-point semantics issues:** none found. composefs performs no floating-point computation relevant to its filesystem/digest logic; no NaN-related issue or discussion was found in any search (Section 11).

## 7. CI/CD Infrastructure

**No riscv64 CI exists for composefs, in any form, at any point in the project's history.** This was independently verified twice (initial pass and adversarial re-verification against a fresh full, non-shallow clone, HEAD `ec2573a0f68f548ae91f3e10acc990a08f9122dc`, 1125 commits):

- `.github/workflows/builds.yaml` (56 lines) -- matrix: ubuntu-24.04, ubuntu-22.04, fedora-41, centos-stream9 containers; every entry `runs-on: ubuntu-24.04`.
- `.github/workflows/test.yaml` (168 lines) -- jobs `clang-format`, `build`, `build-noasan`, `build-baseline`, `build-latest-clang`, `integration`, `distcheck`, `required-checks`; every job `runs-on: ubuntu-24.04` or `ubuntu-latest`.
- `.github/workflows/ci-bootc.yml` (31 lines) -- single job `c9s-bootc-e2e`, `runs-on: ubuntu-24.04`.
- No `.gitlab-ci.yml`, `Jenkinsfile`, or `.cirrus.yml` exist.
- `git log --all -i -S"riscv" -- '.github' 'ci' '*.yml' '*.yaml' 'Jenkinsfile' '.gitlab-ci.yml' '.cirrus.yml'` returns zero commits across the entire history -- the string "riscv" has never been added to or removed from any CI/workflow file.
- The only riscv64 string matches anywhere in the working tree are in `tests/fuzzing/data/alpine` and `tests/fuzzing/data/fedora`, static rpmdb/apk fixture snapshots referencing riscv64 package-manager metadata paths (e.g. `/usr/lib/rpm/platform/riscv64-linux`) -- test fixture data, not CI configuration.

No RISE runners are referenced anywhere in the CI configuration. composefs-rs's CI (`ci.yml` and 5 other workflow files) is likewise all `ubuntu-24.04`/`ubuntu-latest`; its `os: 'arch'` matrix entries refer to the Arch Linux distro, not CPU architecture.

| | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI builds | Yes | No | No |
| CI runs tests | Yes | No | No |
| CI hardware | GitHub-hosted x86_64 | N/A | N/A (no QEMU cross-arch step exists) |
| RISE runners used | N/A | No | No |

## 8. Distribution and Release Status

**Upstream GitHub releases (composefs/composefs): source-only.** The `v1.0.8` release page (latest) lists exactly 3 assets: `composefs-1.0.8.tar.xz`, `Source code (zip)`, `Source code (tar.gz)`. No prebuilt binary of any architecture, riscv64 included, has ever been attached to a composefs release.

**PyPI: no package exists.** `https://pypi.org/pypi/composefs/json` returns HTTP 404 (confirmed via both WebFetch and direct curl). composefs has no PyPI distribution under this name -- not a riscv64-specific gap, there is simply nothing published.

**RISE Python wheel builder: nothing to mirror**, consistent with the PyPI 404 -- `https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/composefs/` redirects to `pypi.org/simple/composefs/`, which itself 404s.

**Ubuntu 26.04 (resolute): riscv64 package confirmed present**, and independently verified at the strongest evidentiary tier available:
- [packages.ubuntu.com](https://packages.ubuntu.com/resolute/riscv64/composefs) lists `composefs (1.0.8-3) [universe]`, with `libcomposefs1` and `libcomposefs-dev` at the same version, all listing supported architectures `amd64 arm64 armhf ppc64el riscv64 s390x`.
- The actual `.deb` was downloaded from `http://ports.ubuntu.com/pool/universe/c/composefs/composefs_1.0.8-3_riscv64.deb` (32902 bytes, exact match to the site's stated size).
- `sha256sum` of the downloaded file matched the checksum published on packages.ubuntu.com exactly.
- `dpkg-deb -I` on the downloaded file confirmed a valid Debian binary package with `Architecture: riscv64`, `Package: composefs`, `Version: 1.0.8-3`, `Depends: libc6 (>= 2.38), libcomposefs1 (>= 1.0.8)`.

**Arch Linux RISC-V (archriscv.felixc.at): inconclusive** -- the site's search UI could not be queried programmatically via the methods available in this research pass; not independently verified. [NEEDS VERIFICATION]

**What a user must do to get a working riscv64 binary today:** install from Ubuntu 26.04 "resolute" universe (`apt install composefs`). No other channel (PyPI, RISE wheel builder, upstream GitHub releases, Debian, Fedora, Arch -- the latter two not checked in this pass) was confirmed to provide a riscv64 binary. A user on any other distribution or Ubuntu version would need to build from source via Meson (Section 5), with no upstream-provided cross-compilation guidance.

## 9. Dependencies

| Name | Role | riscv64 build | riscv64 test | riscv64 release | Community/notes |
|---|---|---|---|---|---|
| Meson | Build-dependency (critical) - the entire build system; no CMake, no autotools | Meson itself is architecture-independent (Python tool) | N/A | N/A (installed via distro package manager) | No riscv64-specific issues found; composefs's own build files contain zero arch-conditional Meson logic |
| OpenSSL | Build-dependency (critical) - `dependency('libcrypto')`, required and unconditional; provides SHA-256 for fs-verity digests via EVP API in `lcfs-fsverity.c`; a pure-C SHA-256 fallback exists if `HAVE_OPENSSL` is unset | Green - active riscv64 port since May 2022 (upstream PR merged), full Zvk vector-crypto suite merged; Ubuntu 26.04 resolute ships `libssl-dev 3.5.5-1ubuntu3 [ports]` | Mostly green - QEMU-only CI (no native riscv64 runners); SSL test-suite hangs at `HARNESS_JOBS>=38` (open issue) | Green - Debian sid/trixie, Ubuntu (24.04 and 26.04 ports), Arch RISC-V all ship current riscv64 builds | Critical/security: AES T-table fallback not constant-time on silicon lacking Zkn/Zvkned (affects the majority of deployed riscv64 chips; fix PRs open, unmerged as of this research). musl `RISCV_HAS_ZBB()` broken (open issue, unowned). `no-deprecated` cross-compile fails on all branches (fix PR open, unmerged). See dedicated status report at project-reports/openssl.md for full detail |
| FUSE | Build-dependency, optional (`dependency('fuse3', version: '>=3.10.0', required: get_option('fuse'))`) - only backs the optional `composefs-fuse` userspace-mount tool; the primary `mkcomposefs`/`mount.composefs` tools use the kernel EROFS+overlay path and do not need it | Ubuntu 26.04 resolute ships `fuse3 3.18.2-1 [ports]` for riscv64 | Not separately trackable - no riscv64-specific libfuse issues found | Ubuntu ports riscv64 build present per the above | Semantic search on `libfuse/libfuse` for "riscv64" and "riscv" returned zero results - no known riscv64-specific blockers, but also no dedicated riscv64 CI/testing evidence found for libfuse itself |

**Deep-dive note:** OpenSSL is the only dependency with crypto-relevant code and the only one with a recursed, existing status report in this tracking system (`project-reports/openssl.md`) documenting two open security-relevant riscv64 issues (constant-time AES fallback, musl `RISCV_HAS_ZBB()`). composefs's own use of OpenSSL is limited to SHA-256 (EVP_sha256/EVP_Digest*), not AES, so the AES constant-time issue does not directly affect composefs's fs-verity digest path, but would affect any consumer relying on OpenSSL more broadly on the same system.

**Methodology caveat:** the `project-graph` MCP server returned `CONNECTION_CLOSED` throughout this research (a connectivity failure, not evidence of absence). Ubuntu-availability figures above were obtained via manual `packages.ubuntu.com` checks (including a downloaded, checksum-verified `.deb` for composefs itself) as a substitute, and should be re-verified against the graph once that server's connection is restored.

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [PR #174](https://github.com/composefs/composefs/pull/174) | ci: add riscv64 support | Closed, not merged | N/A (not a bug) | Not a correctness bug - a CI-coverage proposal closed by mutual agreement between contributor and maintainer (Section 12) |

No open or closed GitHub issue in either `composefs/composefs` or `composefs/composefs-rs` mentions riscv64, riscv, or "risc-v" (confirmed via repo-scoped lexical search returning `total_count: 0` for all query variants, and separately via the repos' own README text). No correctness bugs, no NaN/floating-point issues, and no performance regressions tied to RISC-V were found in any search of GitHub issues, WebSearch, or riseproject.dev's own site search ("Sorry, no results were found" for "composefs").

**Correctness bugs:** none found specific to riscv64 -- consistent with there being no riscv64-specific code path to contain a bug (Section 4).

## 12. Objections and Upstream Blockers

**Stated objection (the only one on record):** maintainer alexlarsson, in closing PR #174 (2023-08-14):

> "Is there any particular reason to run CI on riscv64? Like, does it test some codepath that otherwise would not get tested, such as big endian? Very little in this code is arch dependent, so if this is just gonna cause CI to be slower, or more likely to fail due to some risc CI machine limit, I don't quite see the point of this."

Author michalbiesek's response, same day:

> "The primary intention was to extend the CI testing with a new architecture, but I understand your arguments. I will close this PR."

**Nature of the blocker:** this is a cost/benefit objection, not a technical or correctness objection. The maintainer's stated premise (minimal architecture-dependent code, so riscv64 CI adds QEMU-emulation build time/flakiness risk without meaningfully increasing coverage) is independently confirmed accurate by the Section 4 source analysis -- composefs genuinely has no architecture-specific code paths to exercise.

**Organizational blockers:** none beyond the single maintainer's stated preference above. No RFC, no tracking issue, no renewed proposal exists since August 2023.

**Acceptance probability for renewed riscv64 CI proposal:** Given the stated objection is about marginal CI value rather than technical feasibility, and given that Ubuntu has since (as of Ubuntu 26.04) successfully packaged composefs for riscv64 from unmodified upstream source with no reported build issues, a renewed proposal framed around release-artifact publication (rather than CI-matrix expansion for its own sake) or around distribution-parity concerns may find a different reception than PR #174 did. This is an assessment of likely reception, not a documented upstream statement -- [NEEDS VERIFICATION] against any future upstream response.

## 13. Readiness Assessment

- **Color:** yellow (clean-distro-build)
- **Release provider:** Ubuntu (distro)
- Not an optimization-purpose project (Section 4/6 confirm composefs has no SIMD/vectorization/performance-tuning subject matter); the Step 2 optimization modifier does not apply and no Optimization level is reported.
- **Justification:** composefs has no upstream riscv64 CI of any kind -- confirmed by reading all three live GitHub Actions workflow files plus a full 1125-commit history scan showing riscv64 was never added ([builds.yaml](https://github.com/composefs/composefs/blob/main/.github/workflows/builds.yaml), [test.yaml](https://github.com/composefs/composefs/blob/main/.github/workflows/test.yaml), [ci-bootc.yml](https://github.com/composefs/composefs/blob/main/.github/workflows/ci-bootc.yml)). Per the distribution floor rule, the absence of upstream CI is upgraded from "no support signal" to yellow because Ubuntu 26.04 "resolute" ships `composefs`, `libcomposefs1`, and `libcomposefs-dev` (v1.0.8-3, universe) for riscv64 built from unmodified upstream source -- no riscv64-specific patches were needed or found, consistent with the maintainer's own stated rationale (Section 12) that the codebase has "very little architecture dependent code," which Section 4's exhaustive source grep independently confirms (zero arch-specific files, zero assembly, zero SIMD/JIT dispatch anywhere in the C or Rust implementations). This is a clean-distro-build floor case, not upstream-published: `release_provider` is Ubuntu, not composefs upstream, so green is not reachable regardless of code quality until upstream itself runs riscv64 CI and/or publishes a riscv64 release artifact.
- **Pending work that could change the grade:** none currently in flight. PR #174 (the only riscv64 CI attempt) was closed unmerged in 2023 with no successor proposal. No RISE blog post, RISE-funded work item, or RISE tracking-repo entry exists for composefs beyond an unwritten queued report in this tracking system's own `project-reports/.queue.yml` (`riseproject-dev/sw-ecosystem`) -- i.e., composefs has not yet received RISE attention. A renewed upstream CI PR, or upstream noticing and validating the existing clean Ubuntu riscv64 build, would be the most direct path to blue or green.

## 14. Investment Analysis

**Check of existing RISE involvement:** confirmed via direct search of riseproject.dev's blog (11 posts enumerated, none mention composefs), the RISE Python wheel builder (composefs absent from its ~89-package list), the `riseproject-dev` GitHub org (25 repos, none composefs-specific; no RISE Runner workflow references composefs), and this tracking system's own `sw-ecosystem` repo (composefs is queued for a report but has none written, and appears only as an unverified optional dependency inside `project-reports/rauc.md` and `project-reports/ostree-rpm-ostree.md`). **No RISE-funded work exists for composefs today** -- none of the following work items are already covered by RISE and all should be sized as net-new.

### 14.1 Functional Enablement

No functional gap exists to close -- composefs already builds and runs correctly on riscv64 via Ubuntu's clean distro build, and the codebase has no architecture-specific logic that could be functionally incomplete. The remaining functional-enablement work is verification, not development: confirming `composefs-fuse` (the optional libfuse3-backed tool) and the full integration test suite pass on native riscv64 hardware, since upstream has never run them there.

### 14.2 Performance Optimization

Not applicable. composefs has no SIMD/vectorized/hand-tuned hot paths on any architecture (Section 4); there is no riscv64-specific performance-optimization work to size.

### 14.3 CI/CD Infrastructure

The core gap. Reopening a riscv64 CI lane (functionally identical to the code already written and closed in PR #174, updated for the current `uraimo/run-on-arch-action` version and current workflow structure) is the direct, low-cost path to move composefs from yellow toward blue. Given the maintainer's stated concern was QEMU emulation cost/flakiness, RISE-provided native riscv64 runners (Section 7 notes none are in use) would directly address the objection that blocked PR #174 and materially improve acceptance odds.

### 14.4 Ecosystem Enablement

Section 10 is omitted per task scope -- composefs is a standalone system library/CLI tool with no dependent package ecosystem (no PyPI package exists at all, and its Rust/Python bindings are in-tree consumers, not a broad downstream ecosystem requiring separate riscv64 enablement).

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| CI/CD | Reopen/reintroduce riscv64 CI matrix entry (build+test), using RISE native riscv64 runners instead of QEMU to address the maintainer's original flakiness/cost objection | 0.5-1 | Upstream contributor or RISE, with upstream maintainer buy-in | Medium |
| Functional | Verify `composefs-fuse` and full integration/test suite pass on native riscv64 hardware (currently untested by upstream; only inferred correct via clean Ubuntu build) | 0.5 | Upstream or a riscv64-focused deployer | Low |
| Distribution | Confirm/track riscv64 package status on Debian, Fedora, and Arch Linux RISC-V (only Ubuntu 26.04 was directly verified in this report) | 0.25 | Upstream or a riscv64-focused deployer | Low |
| Dependency | Track OpenSSL's open riscv64 constant-time AES and musl `RISCV_HAS_ZBB()` issues, since composefs depends on OpenSSL for its crypto path (see project-reports/openssl.md) | (tracked under OpenSSL's own report, not composefs) | Upstream OpenSSL | Medium |

## 15. Updates

(No updates yet -- initial report dated 2026-09-11.)

## 16. References

- [composefs/composefs GitHub repository](https://github.com/composefs/composefs)
- [composefs/composefs-rs GitHub repository](https://github.com/composefs/composefs-rs)
- [PR #174 - "ci: add riscv64 support" (closed, not merged)](https://github.com/composefs/composefs/pull/174)
- [.github/workflows/builds.yaml](https://github.com/composefs/composefs/blob/main/.github/workflows/builds.yaml)
- [.github/workflows/test.yaml](https://github.com/composefs/composefs/blob/main/.github/workflows/test.yaml)
- [.github/workflows/ci-bootc.yml](https://github.com/composefs/composefs/blob/main/.github/workflows/ci-bootc.yml)
- [composefs v1.0.8 release page](https://github.com/composefs/composefs/releases/tag/v1.0.8)
- [PyPI JSON API for "composefs" (404 - package does not exist)](https://pypi.org/pypi/composefs/json)
- [RISE Python wheel builder mirror for "composefs" (redirects to PyPI, 404)](https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/composefs/)
- [Ubuntu 26.04 "resolute" package page for composefs (riscv64 confirmed)](https://packages.ubuntu.com/resolute/riscv64/composefs)
- [Ubuntu ports archive - composefs_1.0.8-3_riscv64.deb](http://ports.ubuntu.com/pool/universe/c/composefs/composefs_1.0.8-3_riscv64.deb)
- [composefs MAINTAINERS.md](https://github.com/composefs/composefs/blob/main/MAINTAINERS.md)
- [CNCF composefs project page](https://www.cncf.io/projects/composefs/)
- [RISE Project members page](https://riseproject.dev/members/)
- [RISE Project blog index](https://riseproject.dev/blog/)
- [RISE Python wheel builder full package list](https://riseproject.gitlab.io/python/wheel_builder/)
- [OpenSSL riscv64 status report (this tracking system)](project-reports/openssl.md)
- [RAUC status report - composefs as optional dependency, unverified riscv64 evidence](project-reports/rauc.md)
- [ostree/rpm-ostree status report - composefs as optional dependency, "Not verified"](project-reports/ostree-rpm-ostree.md)
