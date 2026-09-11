---
title: RAUC
parent: Project Reports
color: yellow
dependencies:
  - name: OpenSSL
    relation: build-dependency
    criticality: critical
  - name: libcurl
    relation: build-dependency
    criticality: optional
  - name: composefs
    relation: build-dependency
    criticality: optional
  - name: GLib
    relation: build-dependency
    criticality: optional
  - name: json-glib
    relation: build-dependency
    criticality: optional
  - name: D-Bus
    relation: build-dependency
    criticality: optional
  - name: libnl
    relation: build-dependency
    criticality: optional
  - name: libfdisk
    relation: build-dependency
    criticality: optional
  - name: systemd
    relation: build-dependency
    criticality: optional
  - name: glibc
    relation: build-dependency
    criticality: optional
---

{% include dependency-graph.html slug="dependencies" subset="rauc" %}

# RAUC

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-09-07<br/>
**Readiness:** yellow<br/>
**Scope:** RISC-V (riscv64/linux) support status for RAUC<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

RAUC (Robust Auto-Update Controller) is a C-based embedded-Linux update controller: it manages bootloader/software update installation, A/B slot switching, bundle signature verification, and rollback for embedded Linux devices. It is built with Meson, uses GLib/GIO as its core toolkit, and delegates cryptography (bundle signature verification via CMS, TLS transport) to OpenSSL. It is licensed LGPL-2.1 ([COPYING](https://github.com/rauc/rauc/blob/master/COPYING), with some CC0-1.0 assets).

RAUC has no foundation affiliation (not Linux Foundation, not CNCF, no SPI/Conservancy hosting) and no formal governance document (no MAINTAINERS, CODEOWNERS, or GOVERNANCE.md exists in the repository). It operates as a de facto benevolent-maintainer, corporate-anchor project: `docs/contributing.rst` describes trust being informally granted or revoked by "project maintainers," and security reports go directly to security@pengutronix.de (per [SECURITY.md](https://github.com/rauc/rauc/blob/master/SECURITY.md)), identifying Pengutronix (a German embedded-Linux consultancy) as the de facto steward.

Commit-count analysis (`git shortlog -sne`) shows the project is overwhelmingly Pengutronix-driven: Jan Lubbe (~2,151 commits) and Enrico Jorns (~2,056 commits), both Pengutronix, account for the large majority of history. Secondary corporate contributors include Ulrich Olmann, Bastian Krause/Stender, Philipp Zabel, Lars Schmidt, and Uwe Kleine-Konig (all Pengutronix); Gael Portay (Rtone, 44 commits); Rasmus Villemoes (Prevas, 23 commits); Jan Remmet (PHYTEC, 18 commits); Arnaud Rebillout and Ludovico de Nittis (Collabora, 9 commits each); and Michael Heimpold (independent, 25 commits). No RISE-affiliated silicon vendor (SiFive, Andes, etc.) has contributed to RAUC.

RAUC is **not** a RISE (riseproject.dev) member project and does not appear on the [RISE members page](https://riseproject.dev/members/), whose Premier and General members are exclusively silicon/hyperscaler organizations (Alibaba, Google, MediaTek, NVIDIA, Qualcomm, Red Hat, SiFive, Tenstorrent, Akeana, Andes, Canonical, and others). RAUC's only trace in RISE-affiliated material is a single unprocessed line item in `riseproject-dev/sw-ecosystem/project-reports/.queue.yml`, alongside roughly 200 other queued candidate projects awaiting a RISC-V readiness report; no report existed prior to this one, no dedicated repo exists, no RISE CI runners are used by or for RAUC, and no RISE-funded work touches RAUC.

There is no formal architecture-tiering document (no PLATFORMS.md, SUPPORT.md, or `docs/platforms` equivalent). Architecture support is implicit: RAUC works on any Linux target with GLib and OpenSSL, so a new architecture is not gated by policy, only by whether anyone has exercised it in CI. `docs/contributing.rst` states that contributors must "fully own" and be able to reason about their changes, and that PRs are welcome even as early work-in-progress -- consistent with a receptive-but-contributor-driven stance toward a hypothetical riscv64 CI contribution, though this is inferred from stated philosophy rather than demonstrated by an actual accepted riscv64 PR.

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2023-10-10 | [PR #1260](https://github.com/rauc/rauc/pull/1260) / commit [f68a5dc](https://github.com/rauc/rauc/commit/f68a5dcde43d52919d825085ad17f9d6a519e760) merged, authored by Jan Luebbe (Pengutronix), merged by ejoerns. Switches the CI cross-build matrix from community `multiarch/debian-debootstrap` images (Bullseye) to official multiarch Debian containers (Bookworm). Commit message notes: "riscv64 is not available for bookworm, but we'll be able to use it with the next release." | [PR #1260](https://github.com/rauc/rauc/pull/1260) |
| 2023-12-20 | First release containing the above commit: v1.11 (verified via `git merge-base --is-ancestor f68a5dc v1.11` = true; `v1.10.1`, tagged 2023-08-03, does not contain it). | Repository tags, verified locally |
| 2023-10-10 to present (2026-09-07) | No further riscv64 work of any kind (no CI matrix addition, no code, no issue, no PR) in over two and a half years. | Repo-wide grep and issue/PR search, zero additional matches |

There is no riscv64 "port" to speak of, upstreamed or otherwise -- RAUC's own C source contains zero architecture-specific code for any ISA (see Section 4), so there is nothing to port. The only unresolved item is that riscv64 has never been added to CI, despite the 2023 comment anticipating it would become possible "with the next release." No individual or organization has picked this up since; the only named contributor tied to riscv64 in any capacity is Jan Luebbe (Pengutronix), and only in the context of the CI-container note, not a port.

## 3. Upstream Support Tier

RAUC has no formal, written tier policy for architecture support. In practice, tier status is defined entirely by what is present in `.github/workflows/tests.yml`'s `cross` job matrix and `.github/workflows/container.yml`'s multi-platform build list:

```yaml
# .github/workflows/tests.yml, cross job
architecture:
- "arm/v5"
- "arm/v7"
- "arm64/v8"
- "386"
```

```yaml
# .github/workflows/container.yml
platforms: linux/amd64, linux/386, linux/arm/v5, linux/arm/v7, linux/arm64/v8
```

Both files were read in full directly from the repository (clone HEAD `1a412fe8`, 2026-08-24). riscv64 is absent from both matrices. The `cross` job runs on every push and pull request (not gated to a manual trigger), using `qemu-user-static` binfmt emulation via `podman run --platform linux/<arch>` against the prebuilt `ghcr.io/rauc/rauc/rauc-ci:latest` image, executing `meson setup` / `meson compile` / `meson test` inside the emulated container for each listed architecture.

| Architecture | CI build | CI test execution | Upstream binary release |
|---|---|---|---|
| amd64 | Yes (native `build` job, fixed container) | Yes, every push/PR | No (source tarball only) |
| arm64/v8 | Yes (`cross` job, QEMU-emulated) | Yes, every push/PR | No (source tarball only) |
| arm/v7, arm/v5, 386 | Yes (`cross` job, QEMU-emulated) | Yes, every push/PR | No (source tarball only) |
| riscv64 | **No** -- absent from both `tests.yml` and `container.yml` | **No** | No |

No architecture, including amd64, gets an upstream-published binary: GitHub Releases contain only `rauc-<version>.tar.xz` plus its `.asc` signature (verified against the 5 most recent releases: v1.15.2, v1.15.1, v1.15, v1.14, v1.13, and independently re-checked for v1.15.2 and v1.15.1 via GitHub's `expanded_assets` endpoint). This means "release" for any architecture is a distro-packaging or self-build exercise, not an upstream artifact -- see Section 8.

## 4. Technical Architecture and RISC-V-Specific Subsystems

RAUC has no architecture-specific subsystems for any ISA. There is no JIT, no SIMD/vector dispatch, no hand-written assembly, and no `#ifdef`-based architecture branching anywhere in RAUC's own source.

Verified directly:
- Full-tree case-insensitive grep for `riscv` across the entire repository: zero matches except the single incidental PR #1260 mention.
- Code search for `__riscv`, `__aarch64__`, `__x86_64__`, `__arm__`, `__i386__` across `rauc/rauc`: zero results for each.
- A local grep for `riscv|__arm__|__aarch64__|__x86_64__|__i386__|amd64|arm64` across the working tree returns exactly 3 hits, all in CI/changelog prose (Docker platform lists), none in `src/` or `include/`.
- The 65 files under `src/` and `include/` (31,620 lines) are entirely portable C using GLib/GIO/OpenSSL/libcurl/libnl. The only per-target file split is `src/bootloaders/{barebox,custom,efi,grub,uboot}.c`, organized by bootloader software, not CPU ISA -- each of those bootloaders itself spans multiple architectures.
- All cryptographic operations (bundle signature verification, hashing) are delegated to the external OpenSSL dependency; RAUC contains no in-tree cryptographic or numeric code of its own.

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| JIT | N/A (none exists) | N/A (none exists) | N/A (none exists) |
| SIMD/vector dispatch | N/A (none exists) | N/A (none exists) | N/A (none exists) |
| Hand-written assembly | None | None | None |
| Architecture-specific `#ifdef` guards | None found | None found | None found |
| Crypto | Delegated entirely to OpenSSL (external dependency) | Delegated entirely to OpenSSL | Delegated entirely to OpenSSL |

Using the full/partial/scalar/missing rubric, all three architectures score identically as "missing" -- not because riscv64 lags amd64/arm64, but because the rubric does not apply: RAUC is a portable glib-based system daemon, not a project with per-ISA hot paths. RAUC is **not an optimization-purpose project** (see Section 13); the Step 2 optimization modifier in the readiness color model does not apply to it. Whatever architecture-specific engineering exists in RAUC's dependency chain lives in OpenSSL, glibc, and the Linux kernel -- not in RAUC's own code (see Section 9 for OpenSSL's riscv64 status).

## 5. Build System, Cross-Compilation, and Toolchain

RAUC does **not** use CMake or autoconf/configure for its main build (both were checked for and confirmed absent -- no `CMakeLists.txt`, no `cmake/riscv64.cmake`, no `BUILDING.md`/`docs/building.md`/`docs/cross-compilation.md`). It uses **Meson**, minimum version `>=0.51` (from `meson.build`), targeting C11 (`c_std=gnu11`). The only autotools usage in the repo is for the optional `contrib/cgi` example, unrelated to the main tool or to riscv64.

Documented build commands (from `README.rst`):

```
git clone https://github.com/rauc/rauc
cd rauc
meson setup build
meson compile -C build   # or 'ninja -C build' on meson < 0.54.0
meson install             # optional, for target installation
```

Required dependency versions (from `meson.build`), none of which gate on architecture: GLib/GIO/GIO-unix >=2.64, OpenSSL >=3.0, libcurl >=7.81.0 (optional, `network` feature), libnl-genl-3.0 >=3.1 (optional, `streaming` feature), libfdisk >=2.29 (optional, `gpt` feature). Additional compiler warning flags are probed with `cc.get_supported_arguments()` and silently skipped on older compilers, imposing no hard minimum.

Feature flags (`meson_options.txt`): `service` (default true), `create` (default true), `network` (default true), `streaming` (default true, requires `network`), `json` (default enabled), `gpt` (default auto), `composefs` (default **disabled**), `pkcs11_engine` (default true), `tests` (default true), `fuzzing` (default false).

The CI cross job (`tests.yml`) does **not** use a cross-compiler toolchain triplet. It runs `podman run --platform linux/<arch>` with `qemu-user-static` binfmt emulation against the prebuilt `ghcr.io/rauc/rauc/rauc-ci:latest` container, performing native compilation inside the emulated environment. The test container's Dockerfile (`test/Dockerfile`, read in full) installs `gcc`/`g++` from the host's native `apt-get` -- there is no `gcc-riscv64-linux-gnu` or any other cross-toolchain package referenced anywhere in the repository, because the multi-arch CI image itself is built once per target platform via buildah/QEMU emulation, not via cross-compilation.

`./qemu-test` (top-level script) hardcodes `qemu-system-x86_64` to boot a VM for the functional test suite; this is unrelated to cross-architecture building and would not extend to a riscv64 CI job without separate work.

**No documented riscv64 build failures exist**, because riscv64 has never been attempted in RAUC's own CI or build documentation. Data not available beyond this: no riscv64-specific build log, error message, or known-failure report was found in issues, PRs, or commits. The README's claim that RAUC is "fully prepared for cross-compilation with meson" is a general statement about Meson's cross-file mechanism; RAUC upstream provides no riscv64 cross-file, no riscv64 toolchain-minimum guidance, and no riscv64 CI validation.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Bundle install / signature verification | Yes | Yes | Presumed yes (portable C, no arch gating found); unverified by CI |
| D-Bus service mode | Yes | Yes | Presumed yes; unverified by CI |
| Streaming updates (network + libnl) | Yes | Yes | Presumed yes; libcurl riscv64 is build/package-verified but not upstream test-suite-verified (Section 9) |
| GPT/partition handling (libfdisk) | Yes | Yes | Presumed yes; unverified by CI |
| composefs artifact backend (optional, off by default) | Yes (untested by RAUC CI either) | Yes (untested by RAUC CI either) | No independent riscv64 evidence found for the vendored fork RAUC uses (Section 9) |

**Functional gaps:** none identified that are specific to riscv64 as opposed to "untested on riscv64." RAUC's code has no architecture-conditional feature exclusions (Section 4); the gap is entirely one of CI verification, not implementation.

**Performance gaps:** Data not available. No riscv64 vs arm64/amd64 performance benchmark data for RAUC exists publicly -- searched via GitHub issue/PR search (`riscv64 performance`, `riscv64 bug`, `riscv nan floating`) and web search (`RAUC riscv64 benchmark`, `RAUC riscv64 vs arm64 performance 2024 2025 2026`), all returning zero RAUC-relevant results. Since RAUC has no SIMD/vector code of its own (Section 4), there is no missing-SIMD performance delta to characterize.

**Security hardening gaps:** Data not available: no riscv64-specific security hardening comparison (e.g., stack protector, CFI, PAC/BTI-equivalent) was found or searched for RAUC's own build. RAUC's cryptographic security posture depends on OpenSSL, whose riscv64 vector-crypto extension status is summarized in Section 9.

**NaN / floating-point semantics issues:** None found. GitHub issue search for `riscv nan floating` against `rauc/rauc` returned zero results, and no floating-point-related issue exists in the tracker at all [issue search scope: title/body of rauc/rauc].

## 7. CI/CD Infrastructure

**No riscv64 CI exists in rauc/rauc.** This was verified by directly reading all 9 workflow files in `.github/workflows/` (`codeql.yml`, `container.yml`, `coverity.yml`, `docs.yml`, `sanitizers.yml`, `scan-build.yml`, `scorecard-analysis.yml`, `style.yml`, `tests.yml`) from a clean clone (HEAD `1a412fe8`, confirmed via `git remote -v` and clean `git status`), and grepping the entire repository case-insensitively for "riscv" -- zero matches in any workflow file, and zero matches anywhere in the repository outside the single PR #1260 comment. No `.gitlab-ci.yml`, `Jenkinsfile`, `.cirrus.yml`, `.travis.yml`, or `azure-pipelines.yml` exist anywhere in the repository.

RAUC does not use RISE RISC-V CI runners: no reference to `riseproject-dev` or a RISE runner label appears anywhere in the CI configuration, consistent with the finding in Section 1 that RAUC has no RISE involvement at all.

| Architecture | CI build | CI test execution | Release-blocking | Runner/emulation |
|---|---|---|---|---|
| amd64 | Yes | Yes (`build` job, every push/PR) | Yes (branch protection covers cross-build names per [ejoerns' PR #1260 comment](https://github.com/rauc/rauc/pull/1260)) | Native, `ubuntu-24.04` |
| arm64/v8 | Yes | Yes (`cross` job, every push/PR) | Yes | QEMU (`qemu-user-static`) via `podman --platform` |
| arm/v7, arm/v5, 386 | Yes | Yes (`cross` job, every push/PR) | Yes | QEMU via `podman --platform` |
| riscv64 | **No** | **No** | N/A | N/A -- not in matrix |

The `container.yml` workflow, which builds the `ghcr.io/rauc/rauc/rauc-ci` multiarch test image consumed by the `cross` job, also excludes riscv64 from its platform list (`linux/amd64, linux/386, linux/arm/v5, linux/arm/v7, linux/arm64/v8`), meaning even a future test job targeting riscv64 would first need a riscv64-capable CI container to exist.

## 8. Distribution and Release Status

**Upstream (GitHub Releases):** No binaries for any architecture. Checked the 5 most recent releases (v1.15.2, v1.15.1, v1.15, v1.14, v1.13): every release publishes only `rauc-<version>.tar.xz` and its `.tar.xz.asc` signature, plus GitHub's auto-generated source zip/tar.gz. This is architecture-agnostic by nature (source-only), not evidence for or against riscv64 specifically.

**PyPI:** Not applicable. `https://pypi.org/pypi/rauc/json` and `https://pypi.org/simple/rauc/` both return HTTP 404 -- RAUC is a C project, not a Python package.

**Ubuntu 26.04 "Resolute Raccoon":** riscv64 binary confirmed available. Package `rauc` (universe), version **1.15.1-1**, architectures **amd64, arm64, armhf, ppc64el, riscv64, s390x** ([packages.ubuntu.com search](https://packages.ubuntu.com/search?keywords=RAUC&suite=resolute&searchon=names&section=all), cross-checked against the [per-architecture package page](https://packages.ubuntu.com/resolute/riscv64/rauc) and independently against [Launchpad's binary-package build records](https://launchpad.net/), which is the authoritative build-farm source of record). Three independently sourced fetches agree on the identical version number and consistent package-size data. `rauc-service` (universe, architecture: all) is also present.

**Debian:** Not independently verified for the `rauc` package itself in this research (the Debian sid/trixie riscv64 finding cited in Section 9 applies to the OpenSSL dependency, not to RAUC). Data not available: RAUC's own Debian riscv64 status was not checked against `tracker.debian.org`.

**Arch Linux (mainline `extra`):** No riscv64 build. `rauc` 1.15.2-1 is x86_64-only per [archlinux.org package search](https://archlinux.org/packages/?q=rauc).

**Arch Linux RISC-V port (archriscv.felixc.at):** `rauc` does not appear on the port's status page at all -- no one has even attempted the port on this distro (the detailed per-package API was unreachable via the session's proxy; this is a connectivity gap for that specific check, but the human-readable status overview, which was reachable, lists no `rauc` entry).

**What a user must do to get a working riscv64 binary today:** Install `rauc` from Ubuntu 26.04 "Resolute" universe once that release is generally available, or build from source via Meson themselves (Section 5) -- there is no upstream-published riscv64 binary, and no PyPI/npm/Maven/OCI channel applies to this project.

## 9. Dependencies

RAUC's dependency manifest, parsed from `meson.build` and `subprojects/*.wrap`:

| Name | Role in RAUC | riscv64 build | riscv64 test | riscv64 release | Blocking issues |
|---|---|---|---|---|---|
| OpenSSL (required, >=3.0) | Bundle signature verification (CMS), certificate handling, TLS for libcurl backend | Green -- dedicated `riscv-more-cross-compiles.yml` CI workflow, 36 riscv-specific source files, native Zbb/Zbc/Zbkb/Zknd/Zkne/Zvkb crypto-extension code paths | Green (mainline glibc target); intermittent `test_lhash` flake on riscv64 CI runners ([openssl/openssl#30880](https://github.com/openssl/openssl/issues/30880), open) | Green -- shipped in Debian sid/trixie, Ubuntu 24.04, Arch RISC-V | Non-blocking open items: [#29453](https://github.com/openssl/openssl/issues/29453) (replace inline asm with intrinsics), [#28664](https://github.com/openssl/openssl/issues/28664) (SHA-256 perf), [#25334](https://github.com/openssl/openssl/issues/25334) (Zknd/Zkne must both be present for AES), [#29269](https://github.com/openssl/openssl/issues/29269) (more arch-specific test coverage). A musl-specific detection bug ([#28118](https://github.com/openssl/openssl/issues/28118)) does not affect the glibc/Ubuntu path RAUC relies on. |
| libcurl (optional, `network`/`streaming` feature, >=7.81.0) | HTTP(S) update-source transport | Green -- Debian sid (`8.21.0~rc3-1`) and Ubuntu 24.04 (`8.5.0-2ubuntu10`) ship riscv64 builds | Yellow -- riscv64 is build-only (Tier-2) via curl's own `curl-for-win.yml` cross-compile job; curl's test suite is not run on riscv64 in any upstream CI | Green via distro packaging; no upstream prebuilt binaries for any architecture (source-only releases) | No riscv64-specific GitHub issues found. Debian sid RC has unrelated autopkgtest regressions (pycurl/trurl) blocking promotion to testing. |
| composefs (optional, off-by-default `composefs` feature; RAUC vendors a personal fork `jluebbe/composefs` rather than tracking `composefs/composefs` upstream releases) | Verified, dedup'd read-only filesystem images for RAUC's "artifact" install mode | No independent riscv64 build evidence found either way | No riscv64-specific CI/test evidence found | No riscv64-specific packaging evidence found | Zero riscv64-tagged GitHub issues on `composefs/composefs` -- absence of data, not confirmed breakage. Not tracked in a separate project report. |
| GLib/GIO, json-glib, D-Bus, libnl-genl, libfdisk, systemd, pthreads | Core plumbing (config parsing, IPC, netlink, GPT/partition handling) | Not independently researched -- none carry JIT/SIMD/numerics/crypto/compression code; all are long-established, portable-C, glibc-era packages with no known riscv64 exclusion on major distros | Not researched | Not researched | None known; out of scope of the crypto/SIMD/compression filter applied for this deep-dive. |

**Bottom line:** RAUC's only dependency with real RISC-V-specific engineering (vector-crypto SIMD assembly) is OpenSSL, which is in strong shape upstream. libcurl (optional) packages fine on riscv64 but is only cross-compile-tested, not test-suite-verified, upstream. composefs (optional, off by default, vendored fork) has no riscv64 evidence in either direction and is the one dependency that would need first-hand validation if the `composefs` feature is required for a riscv64 deployment.

The `project-graph` MCP server (which would allow cross-confirming these findings against the canonical Ubuntu 26.04 "resolute" package graph via SPARQL) was unreachable (`CONNECTION_CLOSED`) for the duration of this research. This is a tooling/connectivity gap, not evidence that the graph data disagrees with the web-sourced findings above -- [NEEDS VERIFICATION] against the project-graph database once that server is reachable.

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| N/A | No riscv64-related issues exist | N/A | N/A | GitHub issue search for `riscv`, `riscv64`, `RISC-V`, `risc-v` against `repo:rauc/rauc` returns zero results (`total_count: 0`) across every query variant tried. |
| [#995](https://github.com/rauc/rauc/issues/995) | "rauc install will make kernel crash? raucb file size is too big?" | Closed (not_planned) | N/A to RISC-V | False-positive hit on a `bug` search -- this is an **ARM64** (aarch64/maaxboard) kernel panic report, unrelated to RISC-V. |
| [#452](https://github.com/rauc/rauc/issues/452) | "Cross-compiling for ARM was recently broken" | Closed (completed) | N/A to RISC-V | False-positive hit on a `bug` search -- this is an **ARMv7** cross-compile warning-as-error issue, unrelated to RISC-V. |

No correctness bugs, no NaN/floating-point issues, and no open or closed riscv64-specific issue of any kind exists in `rauc/rauc`'s tracker as of this research.

## 12. Objections and Upstream Blockers

**Stated objections:** None found. No maintainer or contributor has stated opposition to riscv64 support anywhere in the issue tracker, PR history, or mailing-list-equivalent discussion channels searched.

**Technical blockers:** None identified in RAUC's own code (Section 4: no architecture-specific code exists to port). The nearest thing to a technical blocker was the transient one noted in [PR #1260](https://github.com/rauc/rauc/pull/1260) (Oct 2023) -- riscv64 was not yet available as an official Debian Bookworm multiarch container image at that time. Whether this container-availability gap has since been resolved (as the PR author expected "with the next release") was not independently re-verified in this research; the underlying CI matrix has simply never been updated with a riscv64 entry to test it either way, over two and a half years later.

**Organizational blockers:** RAUC's small, Pengutronix-centered maintainer base means new architecture support is purely contributor-driven -- nobody has submitted the riscv64 CI matrix addition Jan Lubbe flagged as pending back in October 2023. There is no dedicated resourcing (RISE or otherwise) currently allocated to this work (Section 1).

**Acceptance probability:** Not directly evidenced, but inferable from `docs/contributing.rst`'s stated philosophy (contributors must "fully own" changes; PRs welcome even as early work-in-progress) combined with the complete absence of any recorded resistance -- a riscv64 CI-matrix PR modeled on the existing arm64/v8 entry would likely be reviewed favorably. This is an inference from stated project culture, not a demonstrated outcome, since no such PR has ever been submitted or rejected. [NEEDS VERIFICATION]

## 13. Readiness Assessment

- **Color:** yellow (clean-distro-build)
- **Release provider:** Ubuntu (distro)
- Not an optimization-purpose project (Section 4); the Step 2 optimization-gap modifier does not apply. Optimization level: N/A.
- **Justification:** RAUC has no upstream riscv64 CI of any kind -- confirmed by direct inspection of all 9 GitHub Actions workflow files, with the `tests.yml` cross-build matrix explicitly limited to `arm/v5, arm/v7, arm64/v8, 386` ([`.github/workflows/tests.yml`](https://github.com/rauc/rauc/blob/master/.github/workflows/tests.yml)). Under the distribution floor, this would default to orange, except that Ubuntu 26.04 "Resolute" ships `rauc` 1.15.1-1 for riscv64 built from unmodified upstream source (no riscv64-specific packaging patches identified) -- confirmed via [packages.ubuntu.com](https://packages.ubuntu.com/search?keywords=RAUC&suite=resolute&searchon=names&section=all), the [per-architecture package page](https://packages.ubuntu.com/resolute/riscv64/rauc), and Launchpad build records. A clean, unpatched distro build with no upstream CI upgrades the grade from orange to **yellow**, sub-type `clean-distro-build`.
- **Pending work that could change the grade:** No open PR or issue currently targets adding riscv64 to RAUC's CI matrix. No RISE involvement exists today beyond the unprocessed `.queue.yml` entry (Section 1). The most direct path to blue would be an upstream PR adding a `riscv64/v8` (or equivalent) entry to `tests.yml`'s `cross` job and to `container.yml`'s multiarch platform list, mirroring the existing `arm64/v8` pattern -- nothing in the record suggests this would be contentious, but nobody has submitted it since the Oct 2023 PR #1260 note.

## 14. Investment Analysis

RISE has not funded, tracked, or performed any work on RAUC to date (Section 1) -- RAUC exists only as an unreviewed queue entry in `sw-ecosystem/project-reports/.queue.yml`. All items below represent net-new work; nothing here is already covered by RISE.

### 14.1 Functional Enablement

No functional enablement work is required. RAUC's code has no architecture-specific gating (Section 4), and it already builds and runs on riscv64 as a byproduct of being portable C, evidenced by Ubuntu's unpatched riscv64 build (Section 8). The only open functional question is the untested `composefs` optional feature (Section 9), which is off by default and would only need first-hand validation if a deployment specifically requires it.

### 14.2 Performance Optimization

Not applicable. RAUC is not an optimization-purpose project and contains no SIMD/vector/JIT code for any architecture to optimize (Section 4). Any performance characteristics on riscv64 are inherited entirely from its dependencies (OpenSSL, glibc, the kernel), which are out of RAUC's own scope.

### 14.3 CI/CD Infrastructure

The concrete, scoped item: add a `riscv64` (or `riscv64/v8`) entry to `.github/workflows/tests.yml`'s `cross` job matrix and to `.github/workflows/container.yml`'s multiarch platform list, following the existing `arm64/v8` pattern (QEMU-emulated build via `podman --platform`, testing against the `rauc-ci` container image). This requires first confirming that a riscv64 Debian Bookworm/Trixie official multiarch container is now available (the blocker cited in PR #1260, not independently re-verified here), then a small PR plus validation that the test suite passes under riscv64 QEMU emulation.

### 14.4 Ecosystem Enablement

Not applicable -- RAUC has no dependent package ecosystem (Section 10 omitted per report scope: it is a standalone system daemon/tool, not a library with a Python/npm/Maven/Kubernetes-operator style consumer ecosystem).

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| CI/CD | Confirm riscv64 Debian multiarch container availability, then add riscv64 to `tests.yml` cross-build matrix and `container.yml` platform list | 0.5-1 | Upstream (Pengutronix) or external contributor | Medium |
| Functional | Validate the optional `composefs` feature on riscv64 (currently off by default, no evidence either way) | 0.5 | Upstream or a riscv64-focused deployer | Low |
| Distribution | Track Debian's own riscv64 packaging status for `rauc` (not yet independently verified in this report) | 0.25 | RISE ecosystem tracking | Low |

## 15. Updates

(No updates yet -- initial report dated 2026-09-07.)

## 16. References

- [rauc/rauc GitHub repository](https://github.com/rauc/rauc)
- [RAUC documentation homepage](https://rauc.readthedocs.io/)
- [PR #1260: switch to official multiarch Debian containers](https://github.com/rauc/rauc/pull/1260)
- [Commit f68a5dc](https://github.com/rauc/rauc/commit/f68a5dcde43d52919d825085ad17f9d6a519e760)
- [.github/workflows/tests.yml](https://github.com/rauc/rauc/blob/master/.github/workflows/tests.yml)
- [.github/workflows/container.yml](https://github.com/rauc/rauc/blob/master/.github/workflows/container.yml)
- [test/Dockerfile](https://github.com/rauc/rauc/blob/master/test/Dockerfile)
- [SECURITY.md](https://github.com/rauc/rauc/blob/master/SECURITY.md)
- [docs/contributing.rst](https://github.com/rauc/rauc/blob/master/docs/contributing.rst)
- [COPYING (LGPL-2.1)](https://github.com/rauc/rauc/blob/master/COPYING)
- [Issue #995 (ARM64 kernel crash, unrelated to RISC-V)](https://github.com/rauc/rauc/issues/995)
- [Issue #452 (ARMv7 cross-compile break, unrelated to RISC-V)](https://github.com/rauc/rauc/issues/452)
- [Ubuntu 26.04 "resolute" package search for RAUC](https://packages.ubuntu.com/search?keywords=RAUC&suite=resolute&searchon=names&section=all)
- [Ubuntu resolute riscv64 rauc package page](https://packages.ubuntu.com/resolute/riscv64/rauc)
- [Arch Linux package search for rauc](https://archlinux.org/packages/?q=rauc)
- [Arch Linux RISC-V port status](https://archriscv.felixc.at/)
- [PyPI rauc (404, not applicable)](https://pypi.org/pypi/rauc/json)
- [openssl/openssl issue #30880 (riscv64 test_lhash flake)](https://github.com/openssl/openssl/issues/30880)
- [openssl/openssl issue #29453](https://github.com/openssl/openssl/issues/29453)
- [openssl/openssl issue #28664](https://github.com/openssl/openssl/issues/28664)
- [openssl/openssl issue #25334](https://github.com/openssl/openssl/issues/25334)
- [openssl/openssl issue #29269](https://github.com/openssl/openssl/issues/29269)
- [openssl/openssl issue #28118 (musl-specific, not RAUC-relevant)](https://github.com/openssl/openssl/issues/28118)
- [RISE Project members page](https://riseproject.dev/members/)
- [RISE Project blog](https://riseproject.dev/blog)
- [RISE Python wheel builder](https://riseproject.gitlab.io/python/wheel_builder/)
- [riseproject-dev/sw-ecosystem project-reports queue](https://github.com/riseproject-dev/sw-ecosystem)

---

**Note on this report's provenance:** The GitHub MCP tools available in this research session were scoped only to `riseproject-dev/sw-ecosystem`; all `rauc/rauc` GitHub API access (releases-by-API, `list_releases`, direct file reads via `mcp__github__get_file_contents`) returned access-denied and was substituted with a direct anonymous git clone of `https://github.com/rauc/rauc` (HEAD `1a412fe8`, dated 2026-08-24) plus GitHub's public HTML/`expanded_assets` endpoints. The `project-graph` MCP server was unreachable (`CONNECTION_CLOSED`) for the entire research session, so the requested SPARQL cross-check against the Ubuntu 26.04 package graph was never executed -- this is a tooling gap, not evidence against the web-sourced findings, and is flagged as [NEEDS VERIFICATION] in Sections 9 and 13 above.
