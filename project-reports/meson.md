---
title: Meson
parent: Project Reports
color: green
dependencies:
  - name: Python
    relation: runtime-dependency
    criticality: critical
  - name: Ninja
    relation: build-dependency
    criticality: critical
  - name: setuptools
    relation: build-dependency
    criticality: optional
  - name: tqdm
    relation: runtime-dependency
    criticality: optional
  - name: mypy
    relation: test-dependency
    criticality: optional
---

{% include dependency-graph.html slug="dependencies" subset="meson" %}

# Meson

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-10-30<br/>
**Readiness:** green<br/>
**Scope:** RISC-V (riscv64/linux) support status for Meson<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

Meson is a build system implemented in pure Python. Per the manifests (`pyproject.toml`, `setup.cfg`, `setup.py`), it supports Python 3.10 to 3.14 and is packaged with setuptools. It has no hard runtime dependencies. Its optional extras are `ninja>=1.8.2`, `tqdm` (progress) and `mypy` (typing). It has no JIT backend, SIMD code, numerics, crypto, compression or memory allocator. Its practical dependency chain is a Python interpreter plus a Ninja-compatible backend. The repository is [mesonbuild/meson](https://github.com/mesonbuild/meson) and the homepage is [mesonbuild.com](https://mesonbuild.com/). The commit examined is `95cc93bb`.

**License and contribution terms.**
- The license is Apache-2.0, per Wikipedia [NEEDS VERIFICATION: single source, not cross-checked against the repository LICENSE file].
- No CLA is required, per mesonbuild.com.

**Governance** (from the project Contributing page; the page's URL was not captured in the research):
- Every change goes through a GitHub pull request and needs a fully green CI run.
- Every PR must be approved by a commit-rights holder who is not the submitter.
- Commit-rights holders can approve docs changes, non-functional bug fixes, refactors, new dependency types, new tool support, and new compilers for existing languages.
- A project-leader decision is needed for new modules, new Meson language functions, syntax changes, backward-incompatible changes, and support for new languages.
- Any developer may revert a merge that breaks CI. Apple CI is the one noted exception because it is unreliable.
- No maintainer roster is published. Wikipedia lists Jussi Pakkanen as the developer, and the Contributing page refers to an unnamed "project lead".
- MAINTAINERS, OWNERS and CODEOWNERS files were not checked.

**Foundation and sponsors.**
- No foundation or fiscal sponsor (SPI, Linux Foundation or similar) was found on mesonbuild.com or Wikipedia. The Legal page returned 404.
- Meson should be treated as an independent, community-run project.
- Maintainer employers could not be established. Observed contributors are Sam James (`thesamesam`, `@gentoo.org` address), Khem Raj (`kraj`, gmail address) and Jussi Pakkanen (`jpakkane`). No company affiliation was found for any of them, so no corporate maintainers are listed.
- Meson is not mentioned on riseproject.dev or its members page. Premier members are Alibaba Damo, Google, MediaTek, NVIDIA, Qualcomm, Red Hat, SiFive and Tenstorrent. General members include Canonical and Andes. Gentoo is not listed.

**Community stance on new ports.** No explicit policy exists. The Contributing page stresses that Meson must run early when bootstrapping a system from scratch. Support for new compilers in existing languages needs only commit-rights approval, which suggests low friction for new targets. Communication channels are Matrix, OFTC IRC and GitHub Discussions.

## 2. Port History and Upstreaming Timeline

Meson has no architecture-specific implementation to port. "RISC-V support" consists of CPU-family recognition, cross-file handling and ordinary bug fixes. All of it is upstream.

| Date | Event | Source |
|---|---|---|
| 2018-07-14 | Khem Raj authors commit `6fafbad6d5ba591075a72e4726af647cece7020d`, "mesonbuild: Recognise risc-v architecture" (PR #3889 opened) | [PR #3889](https://github.com/mesonbuild/meson/pull/3889) |
| 2018-07-21 | PR #3889 merged; Jussi Pakkanen is the committer | [PR #3889](https://github.com/mesonbuild/meson/pull/3889) (search metadata; merge status not independently verified) |
| 2019-09-24 | Issue #5950 "Unknown CPU family riscv" opened (5 comments); closed 2019-10-06 | [Issue #5950](https://github.com/mesonbuild/meson/issues/5950) |
| 2022-07-22 | Issue #10625, riscv64-unknown-elf-gcc fails the "can compile programs" sanity check (7 comments); closed 2022-07-26 | [Issue #10625](https://github.com/mesonbuild/meson/issues/10625) |
| 2023 (date not stated; message ID suggests July) | QEMU hotfix "meson: Fix cross-building for RISCV host": a cross-compiled RISC-V host was reported as generic `riscv`. QEMU re-added `riscv` to its supported CPUs. Meson maintainers did not treat it as a Meson bug. | [QEMU thread](https://lore.kernel.org/all/CAFEAcA9f0_dYHR9AbPdZxnk3Fk5Pqcwvv94PvLXOUTxSC8p=4g@mail.gmail.com/T/), [patchew](https://patchew.org/QEMU/20230711085409.53309-1-philmd@linaro.org) |
| 2023-08-29 | Issue #12172 "Unknown CPU family riscv in meson build" opened and closed the same day (1 comment) | [Issue #12172](https://github.com/mesonbuild/meson/issues/12172) |
| 2026-03-11 | Sam James authors commit `bc071a42af9b9ca83c499ced5d26bf5b179ed240` (PR #15613), which builds a shared library for `find_library` link tests. The message cites "two different riscv ld bugs" hit by the earlier attempt #15601. | [PR #15613](https://github.com/mesonbuild/meson/pull/15613), [commit](https://github.com/mesonbuild/meson/commit/bc071a42af9b9ca83c499ced5d26bf5b179ed240) |
| 2026-08-11 | PR #15613 recorded as merged (search metadata) | [PR #15613](https://github.com/mesonbuild/meson/pull/15613) |
| 2026-10-13 | RISE publishes the SpeexDSP post. Initiative RP020 added a Meson build to SpeexDSP. This is not a change to Meson itself. | [RISE blog](https://riseproject.dev/2026/10/13/accelerating-audio-processing-with-speexdsp-optimizations-for-risc-v/) |

**Merge status of #15613.** The commit is authored 2026-03-11 and recorded as merged 2026-08-11, a gap of five months. The `merged_at` and `merge_commit_sha` values were not read, so the merge status of #15613 and #15601 is [NEEDS VERIFICATION]. #15601 was never returned by any search.

**Key contributors:** Khem Raj (first RISC-V commit author), Jussi Pakkanen (committer), Sam James (Gentoo address; most recent RISC-V-related commit). Their employers are not established.

**Fully upstream?** Yes. No out-of-tree riscv64 patch set was found, and no RISE-built riscv64 artifact exists or is needed.

## 3. Upstream Support Tier

Meson has no formal platform tier policy. The Contributing page defines no tiers. The only explicit support rule is for Python: all non-EOL CPython versions are supported, and the core may not depend on anything outside the standard library. PLATFORMS.md, SUPPORT.md and `docs/platforms/` were not checked. The site links a "Platform notes" page that was not fetched.

Evidence for riscv64:
- `riscv32` and `riscv64` have been recognized CPU families since 2018.
- Both are documented in `docs/markdown/Reference-tables.md` as "32/64 bit RISC-V Open ISA".
- Distros ship Meson on riscv64 (Section 8).
- No official binaries exist. Upstream publishes only a pure-Python wheel and an sdist.
- No riscv64 CI exists (Section 7).

| Aspect | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CPU-family recognition | Data not available: not searched | Data not available: not searched. A third-party MR indicates Meson does not normalize `arm64` to `aarch64` [NEEDS VERIFICATION] ([dav1d MR 1041](https://code.videolan.org/videolan/dav1d/-/merge_requests/1041)) | Yes, `riscv32` and `riscv64` in `mesonbuild/envconfig.py` |
| Formal tier | None defined | None defined | None defined |
| Upstream CI | `nonnative.yml` runs on `ubuntu-latest` (x86_64) containers; full per-arch job list not enumerated | Data not available: arm64 job search returned nothing, which is not a reliable negative | None found (Section 7) |
| Official binaries | `py3-none-any` wheel and sdist (arch-independent) | Same | Same |
| Release-blocking | Data not available | Data not available | Not release-blocking (no riscv64 CI) |

## 4. Technical Architecture and RISC-V-Specific Subsystems

Meson is pure Python. It has no JIT, SIMD, crypto, assembly, intrinsics or GC barriers. Searches against `mesonbuild/meson` at `95cc93bb` returned 4 files for `riscv`, the same 4 for `riscv64`, and 0 files for `vfloat32m1_t`, `rvv` and `__riscv`. Searches for `.S` files, `arch/` directories, JIT backends and Zba/Zbb were not run. No hit pointed at such code. File contents could not be fetched through the GitHub tool, so line counts are not available.

| Component | amd64 | arm64 | riscv64 | ISA extensions | Quality |
|---|---|---|---|---|---|
| CPU-family list (`mesonbuild/envconfig.py`) | Not applicable (pure Python) | Not applicable | `riscv32` and `riscv64` in the known-family list; `riscv64` also in a second list next to `ppc64` and `s390x` | none | Complete as metadata |
| Cross-file generation (`mesonbuild/scripts/env2mfile.py`) | Data not available | Data not available | `'riscv64': 'riscv64'` in the Android CPU-name map | none | Partial: Android map verified; Debian and other targets not verified |
| Docs (`docs/markdown/Reference-tables.md`) | Data not available | Data not available | "riscv32 / riscv64" listed | none | Documentation only |
| Unit tests (`unittests/internaltests.py`) | Data not available | Data not available | Clang version test with `Target: riscv64-unknown-linux-gnu`; a comment lists riscv64 among families where the name and `uname -m` agree | none | Test fixtures only; no dedicated riscv64 coverage confirmed |
| Assembly, intrinsics, C fallbacks | Not applicable | Not applicable | Not applicable | none | Not applicable |

A search for `TODO OR FIXME riscv` matched only `envconfig.py`. The file could not be read, so it is unknown whether the match is a real TODO [NEEDS VERIFICATION].

## 5. Build System, Cross-Compilation, and Toolchain

**Native install.** Meson is pure Python, so no compilation is needed. The upstream wheel `meson-1.12.1-py3-none-any.whl` installs on riscv64 with pip and needs Python 3.10 or newer. A Ninja-compatible backend is required for the default build backend.

**Cross-compilation.** Meson uses `meson setup` with a cross file and has no CMake build of its own. `env2mfile` generates cross files. Meson's cross-file `exe_wrapper` is the conventional place for a QEMU wrapper, but this was not confirmed from the docs.

The following were not retrieved: `docs/Cross-compilation.md`, README, BUILDING/INSTALL, and any Dockerfile. A search for `riscv64 repo:mesonbuild/meson filename:Dockerfile` returned 0 results.

Data not available: exact `meson setup` commands, minimum GCC or Clang versions for riscv64, and Meson's own QEMU usage.

**Third-party examples of Meson riscv64 cross builds under QEMU user-mode** (CI of other projects, not Meson's own):
- [Sakura286/BoxFort fork](https://github.com/Sakura286/BoxFort/commit/e04455025)
- [jeffdaily/parasail workflow](https://github.com/jeffdaily/parasail/actions/runs/5943527035/workflow)
- pytorch/cpuinfo riscv64 CI under QEMU (no URL captured)

**Known build failures.**
- [Issue #10625](https://github.com/mesonbuild/meson/issues/10625): a bare-metal `riscv64-unknown-elf-gcc` cross compiler failed Meson's sanity check. It is closed.
- [PR #15613](https://github.com/mesonbuild/meson/pull/15613): `find_library` link tests were changed to build a shared library so undefined references are tolerated. The earlier attempt #15601 hit "two different riscv ld bugs". These are linker bugs, not Meson bugs.
- The generic `riscv` cpu_family name in cross builds (QEMU hotfix, issue #12172) is handled by using `riscv32` or `riscv64` [NEEDS VERIFICATION: maintainer position comes from web search results, since issue bodies could not be read].
- [libffi meson-port MR 18](https://gitlab.freedesktop.org/gstreamer/meson-ports/libffi/-/merge_requests/18) is a project-level fix for riscv64, not a Meson change.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

Meson's features are architecture-independent Python code. No feature was found that is available on amd64 or arm64 and missing on riscv64.

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Configure, build, install, test | Yes | Yes | Yes by construction (pure Python on a working CPython). No riscv64 test run by upstream. |
| CPU-family detection | Data not available | Data not available | Yes |
| Cross-file generation (`env2mfile`) | Data not available | Data not available | Android verified; others not verified |
| Native CI coverage | Yes (x86_64 runners) | Data not available | None found |

**Functional gaps:** none found. Five RISC-V-titled issues or PRs were found, and none is open.

**Performance gaps:** no Meson benchmark on riscv64 was found.
- An OpenBenchmarking result, [2502116-NE-RISCVDEV102](https://openbenchmarking.org/result/2502116-NE-RISCVDEV102), ran "Timed Mesa Compilation" on a StarFive VisionFive 2 (4 cores, 8 GB, Fedora 41, GCC 14.2.1, Python 3.13.0). A 448 s figure appeared near the CPython chart, but the page returned HTTP 403, so the number, test and units are unverified [NEEDS VERIFICATION].
- Context only, and not Meson: in a Rust compile benchmark ([tinycomputers.io](https://tinycomputers.io/posts/the-orangepi-rv2.html)), the Orange Pi RV2 (Ky X1, 8 cores) averaged 650.60 s, against 62.35 s for the Orange Pi 5 Max (RK3588, 8 cores). That is about 10.4x slower [NEEDS VERIFICATION: single source]. It suggests that wall-clock time for Meson-driven builds on current riscv64 boards is dominated by compiler and hardware speed rather than by Meson itself. This is an inference, not a measurement of Meson.
- Other general RISC-V performance material found says nothing about Meson: [Phoronix RVV benchmarks](https://phoronix.com/review/risc-v-rvv-vector-benchmarks), [Ben Houston](https://benhouston3d.com/blog/risc-v-in-2024-is-slow), [arXiv 2507.22451](https://arxiv.org/pdf/2507.22451).
- Issue #11322 ("meson setup takes 2.5 minutes for a shared build, against 3 seconds for static") is closed and has no RISC-V indication in its title. Its body was not read.

**Security hardening gaps:** Data not available: no hardening-related searches were run, and Meson contains no native code.

**NaN / floating-point semantics:** no issues found. The query "riscv nan floating" returned only #14954 (open, unrelated), #12172, #10625 and #5950.

## 7. CI/CD Infrastructure

**Upstream Meson CI.** A shallow read-only clone at commit `95cc93bb` found:
- 13 workflow files in `.github/workflows/`: cygwin.yml, file_format.yml, images.yml, lint.yml, macos.yml, msys2.yml, nightly.yml, nonnative.yml, os_comp.yml, stable_builddir.yml, unusedargs_missingreturn.yml, website.yml and windows.yml.
- `azure-pipelines.yml` at the repository root.
- No `.gitlab-ci.yml`, `Jenkinsfile` or `.cirrus.yml`.
- A case-insensitive grep for `riscv`, `risc-v` and `rv64` across `.github`, `ci` and `azure-pipelines.yml` returned zero matches.
- `nonnative.yml` runs on `ubuntu-latest` (x86_64) in the `mesonbuild/ubuntu-rolling` and `mesonbuild/cuda-cross` containers. Its triggers were not read in full.

**No riscv64 CI.** The clone-based grep above is the only direct evidence, and it supports "no riscv64 CI". A code search for `aarch64 OR arm64 path:.github` also returned nothing, so an empty search is not a reliable negative, and no second source confirms the absence [NEEDS VERIFICATION]. The workflow list above (13 files) is the one used.

**RISE runners.**
- The RISE service is free and managed. It is used with `runs-on: ubuntu-24.04-riscv`. Jobs run in ephemeral Kubernetes pods on bare-metal Scaleway EM-RV1 RISC-V servers, one job per node ([announcement](https://riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github/)).
- No Meson project is named as a runner user, and the post names no users at all.
- RP020 testing used physical boards (Banana Pi BPI-F3 with SpacemiT K1, VLEN 256, and Canaan K230, VLEN 128), not the runners.

| Aspect | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Linux CI in upstream repo | Yes (`ubuntu-latest` jobs) | Data not available | None found |
| Runner type | GitHub-hosted x86_64 | Data not available | Not applicable; RISE runner `ubuntu-24.04-riscv` is available but unused |
| Emulation (QEMU) | Not applicable | Data not available | None found in CI |
| Test coverage | Full test suite on x86_64 | Data not available | None |

## 8. Distribution and Release Status

| Channel | riscv64 status | Version | Evidence |
|---|---|---|---|
| PyPI | No riscv64-specific file; pure `py3-none-any` wheel plus sdist installs on riscv64 | 1.12.1 | [PyPI JSON](https://pypi.org/pypi/meson/json) |
| Ubuntu 26.04 (resolute) | Available (arch:all package listed against the riscv64 series), universe component, published 2026-03-07 | 1.10.1-1ubuntu2 | Launchpad API `getPublishedBinaries` query. packages.ubuntu.com returned HTTP 500, so no second source. [NEEDS VERIFICATION] |
| Arch Linux RISC-V | Available in `[extra]`; `meson-python-0.22.1-1` also present | 1.12.1-2 | [extra.db](https://archriscv.felixc.at/repo/extra/extra.db) |
| Alpine v3.23 riscv64 | Available | 1.9.1 | [Alpine package page](https://pkgs.alpinelinux.org/package/v3.23/main/riscv64/meson) |
| Alpine edge riscv64 | Listed | Data not available | [Alpine edge](https://pkgs.alpinelinux.org/package/edge/main/riscv64/meson) |
| Ubuntu Focal riscv64 | Listed | Data not available | [Launchpad](https://launchpad.net/ubuntu/focal/riscv64/meson) |
| AUR | `meson-cross-riscv64-linux-gnu` (cross-compilation configuration) | Data not available | [AUR](https://aur.archlinux.org/packages/meson-cross-riscv64-linux-gnu) |
| GitHub releases | Unverified; no asset list seen | Data not available | Meson is not known to ship binary assets (unverified) |
| RISE wheel builder | Not listed; none needed | Not applicable | [wheel builder](https://riseproject.gitlab.io/python/wheel_builder/) lists no meson; the RISE GitLab PyPI index URL redirected to upstream PyPI |
| Debian, Fedora | Data not available: not searched | Data not available | Not applicable |

Both the PyPI and Arch evidence agree on 1.12.1. Distro versions differ widely (1.9.1 on Alpine, 1.10.1 on Ubuntu), so users who need the latest release should install from PyPI.

**What a user must do:** on a riscv64 system with Python 3.10 or newer, run `pip install meson ninja` (or use the distro package). No compilation or custom wheel is needed. Building projects with Meson also requires a working C/C++ toolchain on riscv64.

## 9. Dependencies

| Name | Role | riscv64 build | riscv64 test | riscv64 release | Community |
|---|---|---|---|---|---|
| Python | Runtime dependency (critical). Meson needs CPython 3.10 or newer. | Unverified from Meson sources. An existing report is said to grade Python blue [NEEDS VERIFICATION: single source]. | Unverified | RISE blog post "[Python Now Officially Supports RISC-V](https://riseproject.dev/2026/08/24/python-now-officially-supports-risc-v/)" (2026-08-24); post body not read [NEEDS VERIFICATION] | Python's own tree includes libffi, OpenSSL, libmpdec and mimalloc, outside Meson's scope. See `project-reports/python.md` in this repository. |
| Ninja | Build dependency (critical). Default build backend, declared as the `ninja` extra. | Unverified. A search for "riscv64 repo:ninja-build/ninja" returned no riscv64 issues. Its one hit, #2284 ("Linux aarch64 binaries"), is about aarch64. | Unverified | Unverified | No report file exists in this repository for Ninja. |
| setuptools | Build dependency (optional). Used to package Meson. | Data not available: not researched | Data not available | Data not available | Pure Python |
| tqdm | Runtime dependency (optional). Progress bars (`progress` extra). | Pure Python; not expected to need porting [NEEDS VERIFICATION] | Unverified | Unverified | No report file exists in this repository. |
| mypy | Test dependency (optional). Type checking (`typing` extra), development only. | Unverified | Unverified | Unverified | Not in projects.yml. |
| typing_extensions | Conditional (Python older than 3.8). Obsolete, since Meson requires 3.10 or newer. | Not applicable | Not applicable | Not applicable | Not applicable |

Per-package riscv64 availability for the dependencies was not looked up. The likely Ubuntu names to check against suite `resolute` are `meson`, `python3`, `ninja-build`, `python3-tqdm` and `mypy`.

**Deep dive on dependencies with JIT, SIMD, crypto or numerics:** none of Meson's declared dependencies are such code. Python is the only dependency that carries them, and that analysis belongs to the Python report. Other Ninja-compatible backends exist: CMake (no report file) and Samurai (not listed). Meson's riscv64 readiness depends almost entirely on Python and Ninja.

## 11. Known Bugs and Active Issues

No open RISC-V-specific Meson issue was found. Issue and PR bodies were not read, so statuses come from search metadata.

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [#3889](https://github.com/mesonbuild/meson/pull/3889) | mesonbuild: Recognise risc-v architecture | Merged 2018-07-21 | Low (historical) | First RISC-V enablement |
| [#5950](https://github.com/mesonbuild/meson/issues/5950) | Unknown CPU family riscv | Closed 2019-10-06 | Low | Historical |
| [#10625](https://github.com/mesonbuild/meson/issues/10625) | cc1: error, Compiler riscv64-unknown-elf-gcc can not compile programs | Closed 2022-07-26 | Low | Cross-compiler sanity check |
| [#12172](https://github.com/mesonbuild/meson/issues/12172) | Unknown CPU family riscv in meson build | Closed 2023-08-29 | Low | Maintainers reportedly want `riscv32` or `riscv64` rather than generic `riscv` [NEEDS VERIFICATION] |
| [#15613](https://github.com/mesonbuild/meson/pull/15613) | Build a shared library for find_library link tests | Merged 2026-08-11 per search metadata [NEEDS VERIFICATION] | Low | RISC-V only through riscv ld bugs; earlier attempt #15601 not retrievable |
| [#13741](https://github.com/mesonbuild/meson/issues/13741) | Inconsistent host_machine.cpu() for Debian ppc64el cross vs. native | Open | Unknown | CPU-family detection on ppc64; whether riscv64 is affected was not checked |
| [#14954](https://github.com/mesonbuild/meson/issues/14954) | `--strip` has no effect on `meson install` for static libraries | Open | Low | Not RISC-V |

**Correctness bugs:** none found. No issue was found for NaN or floating-point handling, miscompilation or wrong results on riscv64.

## 12. Objections and Upstream Blockers

- **Stated objections:** none found. The only position noted is that generic `riscv` should not be used as a CPU family, with `riscv32` or `riscv64` used instead. This position comes from web search results only [NEEDS VERIFICATION].
- **Technical blockers:** none found. Linker bugs seen in PR #15613 sit in riscv `ld`, not in Meson.
- **Organizational blockers:** none found. The Contributing page gives commit-rights holders authority over most changes, including new compilers for existing languages. There is no tier policy to satisfy.
- **Acceptance probability:** not applicable. RISC-V recognition has been upstream since 2018, and no outstanding RISC-V patch set was found.
- **Limit of this analysis:** issue and PR comment threads could not be read, so any maintainer objection stated only in comments is not captured.

## 13. Readiness Assessment

- **Color:** green
- **Release provider:** upstream
- **Optimization-purpose project:** no

**Justification.** Step 0 of the grading applies: Meson is architecture-independent and inherits riscv64 from its runtime (CPython). Meson is pure Python, and upstream publishes only a `py3-none-any` wheel and an sdist on [PyPI](https://pypi.org/pypi/meson/json) (1.12.1), with no compiled artifacts, so it runs on riscv64 by construction. riscv32 and riscv64 have been recognized CPU families since 2018 ([PR #3889](https://github.com/mesonbuild/meson/pull/3889)). Distros also ship it on riscv64 (Ubuntu 26.04 resolute meson 1.10.1, Arch Linux RISC-V meson 1.12.1), and the absence of riscv64 CI is not penalized under Step 0.

**Pending work that could change the grade.**
- No open RISC-V-specific Meson issues were found.
- The most recent RISC-V-related change is [PR #15613](https://github.com/mesonbuild/meson/pull/15613), which touched RISC-V only because of linker bugs. Its merge status was not verified.
- RISE has no direct involvement with Meson. It funded RP020 (SpeexDSP), which added a Meson build to that project.
- Several facts remain unverified: GitHub release assets, per-dependency package availability, and the claim of no riscv64 CI. None of these affects the Step 0 grade.
- Python and Ninja determine practical riscv64 behavior, and Ninja has no report file.

## 14. Investment Analysis

**RISE prior work.** RISE has not funded or published work on Meson itself. The only related item is RP020 (SpeexDSP, 40,000 EUR, status "Completed Project"; authors Tristan Matthews and Tyler Kim; technical lead Nathan Egge), which added a Meson build alongside Autotools and CMake to enable checkasm integration ([RISE blog](https://riseproject.dev/2026/10/13/accelerating-audio-processing-with-speexdsp-optimizations-for-risc-v/)). It reported float resampler speedups of 3.71x (Clang 18) and 3.59x (GCC 13), and fixed-point speedups of 2.69x (Clang 18) and 4.88x (GCC 13), on the SpacemiT K1. These are SpeexDSP results, not Meson results, and no SpeexDSP repository, PR or commit is linked. No `riseproject-dev` repository for Meson exists. Of the 43 repositories, the checked ones that mention Meson only list it as a build requirement. The effort figures below are this assessment's estimates and are not drawn from upstream data.

### 14.1 Functional Enablement

No functional gap was found, so no porting work is needed. Remaining items are verification: confirm the merge status of PR #15613 and PR #15601 and read the issue threads, once repository access is available.

### 14.2 Performance Optimization

Meson has no architecture-specific code to optimize. The useful work is measurement. Run the same Meson project's `meson setup`, configure and build phases on riscv64 and arm64 hardware to produce the Meson-specific comparison that does not exist today.

### 14.3 CI/CD Infrastructure

Meson has no riscv64 CI. A job using the RISE `ubuntu-24.04-riscv` runner that runs Meson's test suite would turn "riscv64 works by construction" into evidence. It would need an upstream proposal to the maintainers, and the Contributing page requires a green CI run for every PR.

### 14.4 Ecosystem Enablement

Many projects in this repository's reports use Meson as their build system (for example gstreamer, qemu, cairo, freetype, libxml2 and postgresql). The Meson work they need is on the Python and Ninja side, plus a working C/C++ toolchain. Ninja has no report file and should get one.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Verify merge status of #15613 and #15601 and read issue threads #5950, #10625, #12172 | 0.5 | Internal | Low |
| Functional | Write the missing Ninja project report and confirm riscv64 status of Ninja and setuptools | 1 | Internal / RISE | Medium |
| Performance | Measure Meson configure and build phases, riscv64 vs arm64 on identical project | 1 | Internal | Low |
| CI/CD | Propose and land a riscv64 job on RISE runners running Meson's test suite | 2 to 3 | Upstream Meson / RISE | Medium |
| Ecosystem | Re-run dependency queries against the project graph once reachable | 0.5 | Internal | Low |

## 15. References

- [Meson repository](https://github.com/mesonbuild/meson)
- [Meson homepage](https://mesonbuild.com/)
- [PR #3889, Recognise risc-v architecture](https://github.com/mesonbuild/meson/pull/3889)
- [Issue #5950, Unknown CPU family riscv](https://github.com/mesonbuild/meson/issues/5950)
- [Issue #10625, riscv64-unknown-elf-gcc cannot compile programs](https://github.com/mesonbuild/meson/issues/10625)
- [Issue #12172, Unknown CPU family riscv in meson build](https://github.com/mesonbuild/meson/issues/12172)
- [PR #15613, find_library link tests](https://github.com/mesonbuild/meson/pull/15613)
- [Commit bc071a42af9b9ca83c499ced5d26bf5b179ed240](https://github.com/mesonbuild/meson/commit/bc071a42af9b9ca83c499ced5d26bf5b179ed240)
- [Issue #13741, host_machine.cpu() ppc64el](https://github.com/mesonbuild/meson/issues/13741)
- [Issue #14954, --strip static libraries](https://github.com/mesonbuild/meson/issues/14954)
- [PyPI JSON for meson](https://pypi.org/pypi/meson/json)
- [Arch Linux RISC-V extra.db](https://archriscv.felixc.at/repo/extra/extra.db)
- [Alpine v3.23 riscv64 meson](https://pkgs.alpinelinux.org/package/v3.23/main/riscv64/meson)
- [Alpine edge riscv64 meson](https://pkgs.alpinelinux.org/package/edge/main/riscv64/meson)
- [Ubuntu Focal riscv64 meson (Launchpad)](https://launchpad.net/ubuntu/focal/riscv64/meson)
- [AUR meson-cross-riscv64-linux-gnu](https://aur.archlinux.org/packages/meson-cross-riscv64-linux-gnu)
- [RISE blog: SpeexDSP optimizations for RISC-V](https://riseproject.dev/2026/10/13/accelerating-audio-processing-with-speexdsp-optimizations-for-risc-v/)
- [RISE blog: Python Now Officially Supports RISC-V](https://riseproject.dev/2026/08/24/python-now-officially-supports-risc-v/)
- [RISE blog: RISE RISC-V Runners announcement](https://riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github/)
- [RISE Python wheel builder](https://riseproject.gitlab.io/python/wheel_builder/)
- [RISE project site](https://riseproject.dev)
- [RISE members](https://riseproject.dev/members/)
- [QEMU thread: meson: Fix cross-building for RISCV host](https://lore.kernel.org/all/CAFEAcA9f0_dYHR9AbPdZxnk3Fk5Pqcwvv94PvLXOUTxSC8p=4g@mail.gmail.com/T/)
- [patchew: QEMU meson RISCV host fix](https://patchew.org/QEMU/20230711085409.53309-1-philmd@linaro.org)
- [libffi meson-port MR 18, riscv64](https://gitlab.freedesktop.org/gstreamer/meson-ports/libffi/-/merge_requests/18)
- [dav1d MR 1041, arm64 cpu_family workaround](https://code.videolan.org/videolan/dav1d/-/merge_requests/1041)
- [Sakura286/BoxFort Meson riscv64 QEMU CI](https://github.com/Sakura286/BoxFort/commit/e04455025)
- [jeffdaily/parasail riscv64 cross-build workflow](https://github.com/jeffdaily/parasail/actions/runs/5943527035/workflow)
- [OpenBenchmarking result 2502116-NE-RISCVDEV102](https://openbenchmarking.org/result/2502116-NE-RISCVDEV102)
- [Orange Pi RV2 Rust compile benchmark](https://tinycomputers.io/posts/the-orangepi-rv2.html)
- [Phoronix RVV vector benchmarks](https://phoronix.com/review/risc-v-rvv-vector-benchmarks)
- [Ben Houston, RISC-V in 2024 is slow](https://benhouston3d.com/blog/risc-v-in-2024-is-slow)
- [arXiv 2507.22451, RISC-V PMU profiling](https://arxiv.org/pdf/2507.22451)