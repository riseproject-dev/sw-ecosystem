---
title: Falco
parent: Project Reports
color: orange
dependencies:
  - name: falcosecurity/libs
    relation: runtime-dependency
    criticality: critical
  - name: jemalloc
    relation: runtime-dependency
    criticality: optional
  - name: mimalloc
    relation: runtime-dependency
    criticality: optional
  - name: gperftools
    relation: runtime-dependency
    criticality: optional
  - name: OpenSSL
    relation: runtime-dependency
    criticality: critical
  - name: zlib
    relation: runtime-dependency
    criticality: optional
  - name: libcurl
    relation: runtime-dependency
    criticality: optional
---

{% include dependency-graph.html slug="dependencies" subset="falco" %}

# Falco

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Readiness:** orange<br/>
**Scope:** RISC-V (riscv64/linux) support status for Falco<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

Falco is a CNCF graduated runtime security and threat-detection tool: a userspace daemon (`falcosecurity/falco`) that consumes kernel syscall events via a driver (kernel module, legacy eBPF, or modern eBPF probe) and evaluates them against a rules engine. It was created by Sysdig in 2016, donated to CNCF in 2018/2019, and graduated in 2022. License is Apache 2.0.

Governance is documented in `falcosecurity/evolution/GOVERNANCE.md`: a role ladder (Community Member -> Contributor -> Reviewer -> Maintainer -> Core Maintainer), lazy consensus for routine decisions, a supermajority (2/3) vote for governance changes, and a "40% rule" capping any single organization's voting power. Despite the anti-capture rule, Sysdig holds a numeric majority of core-maintainer seats: roughly 12 of 19 core maintainers are Sysdig staff, with the remainder from Kong, Chainguard, Wireshark Foundation, Replit, Red Hat, Idiap Research Institute, and Yubo. Among 24 additional maintainers, contributors from IBM, Amazon, Secureworks, OVHcloud, and academic institutions (Ca' Foscari University of Venice) appear. `ADOPTERS.md` separately credits AWS, IBM, and Red Hat as top contributing organizations and lists 30+ production adopters (GitLab, Shopify, Vinted, Booz Allen Hamilton).

No formal CPU-architecture tier policy exists in the reviewed governance repos. New architecture ports go through the same `kind/feature`, DCO, CI, and `lgtm`+`approved` gate as any other change; reviews for such ports have historically run 3-4 months. All recent architecture ports (riscv64, ppc64le, loongarch64) have been contributor-driven rather than roadmap-driven, with Sysdig maintainers acting primarily as reviewers.

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2022-06-15 | Debian maintainer dkogan reports riscv64 build failure (FTBFS) in falcosecurity-libs userspace code, with a patch | [libs#399](https://github.com/falcosecurity/libs/issues/399) |
| 2022-06-17 | libs#399 closed, patch upstreamed | [libs#399](https://github.com/falcosecurity/libs/issues/399) |
| 2023-06-26 | Xeonacid opens tracking issue "Add RISC-V Support" | [libs#1175](https://github.com/falcosecurity/libs/issues/1175) |
| 2023-06-29 | Xeonacid opens PR adding kernel-module (kmod) driver riscv64 support, submitted as draft with 11 failing tests | [libs#1181](https://github.com/falcosecurity/libs/pull/1181) |
| 2023-10-13 | libs#1181 merged into milestone `7.0.0+driver`, after root cause (a buffer paged out by the kernel during userspace argument retrieval) was found and fixed by FedeDP | [libs#1181](https://github.com/falcosecurity/libs/pull/1181) |
| 2023-11-29 | `falcosecurity/libs` commit "Rename powerpc macro and include riscv64 syscall headers" by mdafsanhossain (IBM) | Commit `6b48071` per prior research pass, [NEEDS VERIFICATION] (raw commit page not independently re-fetched in this pass) |
| 2026-07-05 | libs#1175 last active comment; issue remains open | [libs#1175](https://github.com/falcosecurity/libs/issues/1175) |

**Key contributors and organizations:** Xeonacid (independent contributor, offered PLCT Lab RISC-V hardware/CI per PR discussion) authored the only merged riscv64 driver code. FedeDP and andreaterzolo (Sysdig) reviewed and approved. IBM contributed a related riscv64 syscall-header rename alongside its own ppc64le port.

**Is it fully upstream?** No. Only the kernel-module driver merged (libs#1181), explicitly scoped as partial: "Fixes partially #1175 (Only kernel module is supported, but not eBPF probe)." The modern eBPF probe -- Falco's officially preferred driver -- has zero riscv64 support: no `vmlinux.h`/BTF definitions directory exists for riscv64 under `driver/modern_bpf/definitions/` (only `aarch64/`, `ppc64le/`, `s390x/`, `x86_64/` exist). The tracking issue #1175 remains open specifically because of this gap. Falco's own community meeting notes (`falcosecurity/community`, release-0.37.0.md) describe the state candidly: "support to powerpc for modern ebpf and riscv64 for kernel module - almost untested but at least it should compile and run."

Critically, none of this work exists in the `falcosecurity/falco` repository itself -- it lives entirely in the dependency repo `falcosecurity/libs`. The `falco` daemon repo contains zero riscv64 code, zero riscv64 CI, and exactly one riscv64 mention anywhere in its tree: a driver-support matrix in `proposals/20251215-legacy-bpf-grpc-output-gvisor-engine-deprecation.md` listing riscv64 as **EXPERIMENTAL** (kernel-module only, kernel >= 5.0, eBPF N/A).

## 3. Upstream Support Tier

No formal tier policy document exists. Evidence of tier is inferred from CI presence, release-blocking status, and official binary publication.

| Axis | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Upstream CI builds | Yes | Yes | No |
| Upstream CI runs tests | Yes | Yes | No |
| Blocking on release | Yes | Yes | N/A (no job exists) |
| Official binary published | Yes (rpm/deb/tgz/static-tgz) | Yes (rpm/deb/tgz/static-tgz) | No |
| Driver support | kmod, legacy eBPF (removed repo-wide), modern eBPF | kmod, modern eBPF | kmod only (EXPERIMENTAL); modern eBPF N/A |

Source: [`reusable_build_packages.yaml`](https://github.com/falcosecurity/falco/blob/master/.github/workflows/reusable_build_packages.yaml) declares its `arch` input as "x86_64 or aarch64" with no third option; all 20 workflow files in `.github/workflows/` were read directly and contain zero riscv references. The one repo-wide riscv64 mention is the EXPERIMENTAL status line in the deprecation proposal doc cited above.

## 4. Technical Architecture and RISC-V-Specific Subsystems

Falco itself (the daemon in `falcosecurity/falco`) has no architecture-specific source code for any CPU architecture -- it is the arch-agnostic userspace consumer. All arch-specific code (syscall tables, feature gates, eBPF BTF definitions) lives in the dependency repo `falcosecurity/libs`, which is what was audited here.

| Component | riscv64 exists? | ISA extensions | Quality |
|---|---|---|---|
| Kernel-module driver syscall table (`driver/syscall_compat_riscv64.h`) | Yes | N/A (kernel syscall ABI, not SIMD) | Machine-generated, 997 lines, comparable in size to x86_64 (1135), aarch64 (994), s390x (1153), ppc64le (1225); not a stub -- no TODO/FIXME/stub markers found |
| Feature gates (`driver/feature_gates.h`) | Yes | N/A | riscv64 included in `CAPTURE_SCHED_PROC_FORK` gate across kmod (`CONFIG_RISCV`), modern eBPF (`__TARGET_ARCH_riscv`), and userspace (`__riscv`) contexts -- genuine, not decorative |
| riscv-specific syscalls wired in (`driver/syscall_table.c`) | Yes | N/A | 2 syscalls (`__NR_riscv_flush_icache`, `__NR_riscv_hwprobe`) |
| Modern eBPF probe BTF/vmlinux headers (`driver/modern_bpf/definitions/`) | **No** | N/A | Directory does not exist for riscv64 (exists only for aarch64, ppc64le, s390x, x86_64) -- cannot compile for this arch at all |
| Legacy eBPF probe | N/A for all archs | N/A | `driver/bpf/` removed repo-wide; moot for every architecture, not riscv64-specific |
| Falco daemon itself | No arch-specific code exists for any arch | N/A | Falco is a pure userspace consumer of the driver output; nothing to compare |

Source: [`falcosecurity/libs` driver directory](https://github.com/falcosecurity/libs/tree/master/driver), [`libs/README.md` support matrix](https://github.com/falcosecurity/libs/blob/master/README.md).

## 5. Build System, Cross-Compilation, and Toolchain

Falco's root `CMakeLists.txt` does not special-case riscv64:
```cmake
if(EMSCRIPTEN)
    set(FALCO_TARGET_ARCH "wasm")
else()
    set(FALCO_TARGET_ARCH ${CMAKE_SYSTEM_PROCESSOR})
endif()
```
Architecture is derived generically from `CMAKE_SYSTEM_PROCESSOR`; there is no riscv64-specific branch, flag, or guard. No arch-specific minimum GCC/Clang version is enforced anywhere in `cmake/modules/CompilerFlags.cmake` (only `cmake_minimum_required(VERSION 3.5.1)` for CMake itself).

`falcosecurity/libs` accepts riscv64 as a recognized `TARGET_ARCH` in `driver/CMakeLists.txt`, gated only by minimum kernel version 5.0 for the kernel module (`set(kmod_min_kver_map_riscv64 5.0)`). However, no riscv64 CMake cross-compile toolchain file exists anywhere in the repo -- only an aarch64 template exists (`cmake/toolchains/linux-cross-aarch64.cmake`); a riscv64 equivalent would have to be authored by hand.

**To build Falco for riscv64 today**, a user would need to:
1. Author a `cmake/toolchains/linux-cross-riscv64.cmake` modeled on the aarch64 template, pointing at a `riscv64-linux-gnu-gcc`/`g++` toolchain.
2. Run `cmake -DCMAKE_TOOLCHAIN_FILE=<file> -DCMAKE_SYSTEM_PROCESSOR=riscv64 -DUSE_BUNDLED_DEPS=ON ..` against the root `CMakeLists.txt`.
3. Disable the eBPF driver build option (no modern-eBPF headers exist for riscv64) and fall back to kmod-only or no driver.
4. Validate the result with no upstream QEMU-based CI or test harness to check against -- this is self-directed, unverified engineering work.

**No QEMU usage** for riscv64 exists in `falcosecurity/falco` or `falcosecurity/libs`. The only org-wide riscv64+QEMU reference found is in the unrelated `falcosecurity/syscalls-bumper` repo's own Go-based release workflow, not a build/test path for Falco.

**Known build failure (historical, fixed):** `falcosecurity/libs#399` documented a riscv64 FTBFS in the userspace libs, fixed via a Debian packaging patch (`fix-riscv64-ftbfs.patch`) and upstreamed by 2022-06-17.

Source: [`falcosecurity/falco` root CMakeLists.txt](https://github.com/falcosecurity/falco/blob/master/CMakeLists.txt), [`falcosecurity/libs` driver/CMakeLists.txt](https://github.com/falcosecurity/libs/blob/master/driver/CMakeLists.txt).

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Kernel-module driver | Full | Full | Experimental, "almost untested" per maintainer comment |
| Legacy eBPF probe | Removed repo-wide (all archs) | Removed repo-wide (all archs) | N/A (moot) |
| Modern eBPF probe | Full | Full | **Missing entirely** -- no BTF/vmlinux headers |
| Official pre-built binary (rpm/deb/tgz) | Yes | Yes | **No** |
| CI test execution | Yes | Yes | **No** |
| Performance benchmarks published | N/A (baseline) | N/A (baseline) | **None found anywhere** (Falco blog, docs, RISE blog, GitHub, general web all searched) |

**Functional gap:** A riscv64 user is limited to the kernel-module driver only, cannot use the modern eBPF probe at all, and has no self-test evidence the kmod path is even reliable ("almost untested but at least it should compile and run" -- maintainer comment on release-0.37.0.md).

**Performance gap:** No data exists to quantify -- no benchmarks of any kind (events/sec, CPU%, memory, latency) have been published for Falco on riscv64.

**Security hardening gap:** Not directly assessed for Falco's own code, but Falco's dependency chain includes an unresolved, security-relevant gap: OpenSSL's AES/GHASH T-table fallback is not constant-time on riscv64 hardware lacking Zkn/Zvkned extensions ([openssl#31080](https://github.com/openssl/openssl/issues/31080), [openssl#31082](https://github.com/openssl/openssl/pull/31082), unmerged) -- a side-channel risk on most shipping riscv64 silicon, inherited via libcurl (TLS output/plugin-fetch paths).

**NaN/floating-point semantics:** No riscv64-specific floating-point correctness issues were found for Falco or its direct dependency chain in this research pass.

## 7. CI/CD Infrastructure

**No riscv64 CI exists** in `falcosecurity/falco`, confirmed by reading all 20 files in `.github/workflows/` (bump-libs.yaml, ci.yml, codeql.yaml, codespell.yml, engine-version-weakcheck.yaml, format.yaml, helm-check.yaml, insecure-api.yaml, master.yaml, release.yaml, reusable_build_dev.yaml, reusable_build_docker.yaml, reusable_build_packages.yaml, reusable_fetch_version.yaml, reusable_publish_docker.yaml, reusable_publish_packages.yaml, reusable_test_packages.yaml, reusable_test_packages_with_evtgen.yaml, scorecard.yaml, staticanalysis.yaml) and confirming the absence of `.gitlab-ci.yml`, `Jenkinsfile`, and `.cirrus.yml`. `git grep -ni "riscv"` across the full tracked repository returns exactly one hit, and it is the proposal-doc EXPERIMENTAL table line, not a CI file.

`falcosecurity/libs` (the driver repo) also has zero riscv64 references across `drivers_ci.yml`, `e2e_ci.yml`, `driverkit.yml`, and `latest-kernel.yml`.

**No RISE runner usage.** Per PR discussion on [libs#1181](https://github.com/falcosecurity/libs/pull/1181), author Xeonacid noted GitHub Actions "don't support riscv self-hosted runner at this time" as the explicit reason no riscv64 CI job was added -- this predates RISE's later "RISE RISC-V Runners" announcement (2026-03-24 per RISE blog), and no subsequent PR has added one.

| Axis | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI builds | Yes | Yes | No |
| CI runs tests | Yes | Yes | No |
| Release-blocking | Yes | Yes | N/A |
| Runner type | GitHub-hosted (`ubuntu-latest`) | GitHub-hosted (`ubuntu-22.04-arm`) | None |

Source: [`.github/workflows/reusable_build_packages.yaml`](https://github.com/falcosecurity/falco/blob/master/.github/workflows/reusable_build_packages.yaml), [`.github/workflows/reusable_build_dev.yaml`](https://github.com/falcosecurity/falco/blob/master/.github/workflows/reusable_build_dev.yaml).

## 8. Distribution and Release Status

**No riscv64 binary or package for the Falco daemon exists on any channel checked:**

- **Falco's own distribution channel** (`download.falco.org`, backed by S3 bucket `falco-distribution`): `packages/bin/` contains only `aarch64/` and `x86_64/` subdirectories; `packages/deb/stable/` (162 keys enumerated) contains only `-aarch64` and `-x86_64` filenames; full-text search for "riscv" across a 1000-key bucket page returned zero matches.
- **GitHub Releases**: checked 0.44.1, 0.44.0, 0.43.1, 0.43.0 and release candidates -- asset types are `rpm-x86_64`, `deb-x86_64`, `tgz-x86_64`, `tgz-static-x86_64`, `rpm-aarch64`, `deb-aarch64`, `tgz-aarch64` only. No riscv64 asset in any release.
- **Debian/Ubuntu archives**: no package literally named `falco` (or `python3-falco`, `libfalco`) exists in Ubuntu 26.04 (resolute) or Debian at all -- the daemon is not in native distro archives on any architecture; it ships only via Falco's own APT/YUM repo (above). What does exist for riscv64 is `libfalcosecurity0`, `libfalcosecurity0-dev`, `libfalcosecurity0t64` -- these are the userspace *library* components (packaged independently by Debian, consistent with the historical FTBFS patch in libs#399), not the Falco daemon/CLI binary.
- **PyPI**: the `falco` PyPI package (0.4.0, pure-Python wheel) is an unrelated Python SDK/client project that happens to share the name -- confirmed not to be falcosecurity's Falco.
- **Arch Linux RISC-V** (`archriscv.felixc.at`): Falco is not listed at all.
- **Falco's own official driver support matrix** ([falcosecurity.github.io/libs/matrix](https://falcosecurity.github.io/libs/matrix/)) lists only AMD64 and ARM64 as officially supported/tested architectures; riscv64 is absent from the supported list entirely.

**What a user must do to get a working binary:** There is none to get. A user would have to build Falco from source using a self-authored riscv64 CMake toolchain file (see Section 5), and even then would be limited to the experimental, largely-untested kernel-module driver, since no official upstream, distro, or third-party riscv64 binary exists for the Falco daemon on any channel checked.

Source: [download.falco.org S3 bucket listing](https://falco-distribution.s3-eu-west-1.amazonaws.com/), [falcosecurity/falco releases](https://github.com/falcosecurity/falco/releases), [Ubuntu packages.ubuntu.com search](https://packages.ubuntu.com/search?keywords=Falco&suite=resolute&searchon=names&section=all), [PyPI falco package](https://pypi.org/pypi/falco/json), [falcosecurity driver support matrix](https://falcosecurity.github.io/libs/matrix/).

## 9. Dependencies

Falco pulls (per root `CMakeLists.txt` / `cmake/modules/`): `falcosecurity-libs` (core libscap/libsinsp + driver, from `falcosecurity/libs`), `jemalloc`, `mimalloc`, `gperftools` (all opt-in, `USE_*` flags default OFF), `OpenSSL`, `curl` (bundling `zlib` + OpenSSL), `yaml-cpp`, `nlohmann/json`, `cxxopts`, `cpp-httplib`. TBB, RE2, jsoncpp, valijson, uthash, libelf are vendored inside `falcosecurity/libs` and not independently package-relevant.

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Community/notes |
|---|---|---|---|---|---|
| **falcosecurity/libs** | Core syscall-capture backend (kmod, eBPF) | kmod only, experimental | No upstream CI | No official binary | Tracking issue [libs#1175](https://github.com/falcosecurity/libs/issues/1175) open since 2023-06-26; modern eBPF has zero riscv64 support |
| jemalloc (optional, off by default) | Allocator | Present in Ubuntu 26.04 riscv64 (`libjemalloc2`, `libjemalloc-dev`) | No upstream CI | Debian sid, Ubuntu 24.04/26.04 | Open doc-gap issue [jemalloc#2399](https://github.com/jemalloc/jemalloc/issues/2399) "cross build for RISCV64?", 3+ years unanswered |
| mimalloc (optional, off by default) | Allocator | Present in Ubuntu 26.04 riscv64; works via generic-C fallback, no dedicated TLS/atomic-yield fast path | No upstream CI | Ubuntu 24.04/26.04 universe, Debian sid | Two unreviewed riscv64 PRs open: [mimalloc#1299](https://github.com/microsoft/mimalloc/pull/1299) (VA-detection segfault fix), [#1319](https://github.com/microsoft/mimalloc/pull/1319) (TLS/yield) |
| gperftools (optional, off by default) | CPU profiler | Present in Ubuntu 26.04 riscv64 | Not confirmed | Ubuntu 26.04 riscv64 present | Historical closed issue [gperftools#1359](https://github.com/gperftools/gperftools/issues/1359) "Broken on riscv64: Cannot calculate stack trace"; exact fix commit not re-confirmed [NEEDS VERIFICATION] |
| OpenSSL | TLS (webserver/gRPC outputs, plugin fetch via curl) | Present in Ubuntu 26.04 riscv64; mature port (scalar Zbb/Zkn + Zvk vector-crypto, RV64GC Montgomery mult) | QEMU-only, conditionally-triggered CI, no native riscv64 runner | Debian sid, Ubuntu 24.04/26.04, Arch RISC-V | **Open security-relevant gap**: AES/GHASH T-table fallback not constant-time on riscv64 without Zkn/Zvkned ([openssl#31080](https://github.com/openssl/openssl/issues/31080), unmerged fix [#31082](https://github.com/openssl/openssl/pull/31082)) |
| zlib | Compression (via bundled curl) | Present in Ubuntu 26.04 riscv64; pure portable C | riscv64 CI exists only for OpenBSD, not Linux | Ubuntu 24.04/26.04, Debian sid, Arch RISC-V, Alpine | Performance-only gap: CRC-32 has no riscv64 hardware path; RVV Adler-32 PR [madler/zlib#1099](https://github.com/madler/zlib/pull/1099) unreviewed since Oct 2025 |
| libcurl | HTTP client (plugin/artifact fetch) | Present in Ubuntu 26.04 riscv64; pure C, no SIMD | Build-only CI (cross-compiled on x86_64 host); main `linux.yml` test suite never runs on riscv64 | Debian sid (RC, blocked from testing migration by autopkgtest regressions), Ubuntu 24.04/26.04 | Zero open riscv64-specific curl issues; risk inherited from OpenSSL and zstd (disabled 4-way Huffman decode on riscv64, [zstd#4622](https://github.com/facebook/zstd/issues/4622), performance only) |

**Deep-dive: `falcosecurity/libs`.** This is the single most material riscv64 blocker for Falco, independent of the otherwise-healthy userspace dependency chain (allocators, TLS, compression, HTTP). Tracking issue [#1175](https://github.com/falcosecurity/libs/issues/1175) is still open; the only merged code, [#1181](https://github.com/falcosecurity/libs/pull/1181), explicitly covers kernel-module only. Debian carries an out-of-tree riscv64 FTBFS patch (`debian/patches/fix-riscv64-ftbfs.patch`, referenced in closed [libs#399](https://github.com/falcosecurity/libs/issues/399)) needed to build even the non-driver userspace parts at one point -- indicating downstream fixes were required beyond upstream source at least once historically.

Source: [`falcosecurity/falco` CMakeLists.txt](https://github.com/falcosecurity/falco/blob/master/CMakeLists.txt), [packages.ubuntu.com resolute search](https://packages.ubuntu.com/search?suite=resolute&searchon=names&keywords=), individual dependency issue/PR links cited above.

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [libs#1175](https://github.com/falcosecurity/libs/issues/1175) | Add RISC-V Support (tracking) | Open (since 2023-06-26, active through 2026-07-05) | Feature gap | Umbrella issue; eBPF probe support remains the open item |
| [libs#1181](https://github.com/falcosecurity/libs/pull/1181) | feat(driver): Add RISC-V kernel module support | Merged 2023-10-13 | N/A (resolved) | Scoped to kmod only; author reported 11 failing tests at submission (`clone3X_*`, `execveatX_*`, `spliceE`, dynamic-snaplen actions), root-caused and fixed by FedeDP before merge (kernel paging out a buffer mid-argument-retrieval) |
| [libs#399](https://github.com/falcosecurity/libs/issues/399) | Build failure on riscv64 and patch | Closed 2022-06-17 | Resolved | Debian FTBFS fix, `fix-riscv64-ftbfs.patch`, upstreamed |
| Debian Bug #1068731 [NEEDS VERIFICATION, secondary source] | FTBFS on riscv64 and ppc64el (`luaL_setfuncs` not declared, LuaJIT 5.1 lacks riscv64 support) | Fixed (switched dependency to `liblua5.3-dev`) | Resolved | Found via [mail-archive.com Debian bug listing](https://www.mail-archive.com/debian-bugs-rc@lists.debian.org/msg677146.html), not cross-checked against Debian's own BTS directly |
| [openssl#31080](https://github.com/openssl/openssl/issues/31080) | AES/GHASH non-constant-time fallback on riscv64 without Zkn/Zvkned | Open | Security-relevant (inherited dependency, not Falco code itself) | Unmerged fix at [openssl#31082](https://github.com/openssl/openssl/pull/31082) |

**Correctness bugs specific to Falco itself on riscv64:** none found. Searches of `falcosecurity/falco` for "riscv nan floating", "riscv64 performance", and "riscv64 bug" returned zero genuine matches (only unrelated false positives from semantic search).

## 12. Objections and Upstream Blockers

**No stated objections to riscv64 support were found.** The port has proceeded on a contributor-driven basis with Sysdig maintainers acting as reviewers, not blockers. Review of [libs#1181](https://github.com/falcosecurity/libs/pull/1181) shows FedeDP (Sysdig) engaging constructively -- suggesting the `CAPTURE_SCHED_PROC_FORK` feature-gate pattern (reused from the ARM64/s390x fix) and eventually root-causing the page-fault bug that unblocked merge.

**Technical blockers:**
1. No riscv64 self-hosted GitHub Actions runner was available at the time of the PR (stated directly by the PR author, Xeonacid, in review discussion) -- this is why no riscv64 CI job exists to this day, though RISE's "RISE RISC-V Runners" (announced 2026-03-24 per RISE's own blog) could now remove this blocker if adopted.
2. Modern eBPF probe support requires authoring riscv64 BTF/`vmlinux.h` definitions, which do not exist -- this is unstarted work, not a blocked PR.
3. No riscv64 CMake cross-compile toolchain file exists in either `falcosecurity/falco` or `falcosecurity/libs` -- a prerequisite for any CI job to even attempt a build.

**Organizational blockers:** None identified. Falco is not a RISE member project and has received no RISE funding, hardware access, or working-group attention found in this research (RISE blog, member list, GitHub org, wheel-builder listing all checked -- zero Falco references).

**Acceptance probability:** High for incremental work following the existing pattern (the kmod port was merged after thorough review in ~3.5 months), but there is no evidence of active maintainer-side prioritization -- the tracking issue has sat open for over 3 years with the last confirmed substantive comment activity as of 2026-07-05, and no PR advancing eBPF-probe support was found.

## 13. Readiness Assessment

- **Color:** orange (no upstream CI for riscv64 in either `falcosecurity/falco` or `falcosecurity/libs`; no upstream riscv64 release artifact on any channel; no distro package exists for the Falco daemon itself to apply a distribution floor against -- only unrelated supporting libraries (`libfalcosecurity0*`) are packaged for riscv64 by Debian/Ubuntu, not the daemon)
- **Release provider:** none (no upstream, distro, RISE, or third-party channel publishes a working riscv64 Falco binary)
- **Optimization level:** not applicable -- Falco is a runtime security/syscall-capture and policy-evaluation daemon, not an optimization-purpose project per the color model's Step 2 test (it would still deliver its core security value using only generic scalar code; there is no SIMD/crypto-performance differentiator that defines its value proposition). Optimization gap: N/A.
- **Justification:** Falco's own repository has zero riscv64 CI (confirmed by reading all 20 GitHub Actions workflow files) and zero riscv64 release artifacts on any channel (GitHub Releases, Falco's own APT/YUM repo, Debian/Ubuntu, PyPI, Arch RISC-V all checked). The dependency repo that owns the actual capture backend, `falcosecurity/libs`, has a merged but explicitly partial riscv64 port (kernel-module driver only, [libs#1181](https://github.com/falcosecurity/libs/pull/1181)) that the project's own maintainers describe as "almost untested," with the modern eBPF probe -- the officially preferred driver -- having no riscv64 support at all and the umbrella tracking issue [libs#1175](https://github.com/falcosecurity/libs/issues/1175) still open after more than 3 years.
- **Pending work that could change the grade:** [libs#1175](https://github.com/falcosecurity/libs/issues/1175) remains open and active (last activity 2026-07-05) and is the natural home for any eBPF-probe riscv64 work; RISE's newly announced "RISE RISC-V Runners" (2026-03-24, per RISE's own blog) could remove the stated CI-runner blocker if `falcosecurity/falco` or `falcosecurity/libs` adopts them, but no evidence was found that either project has done so. No RISE funding, hardware access, or working-group engagement with Falco specifically was found anywhere in this research.

## 14. Investment Analysis

RISE has not funded, sponsored, or otherwise engaged with Falco in any capacity found in this research (blog, member list, GitHub org, wheel-builder listing all checked with zero results). All sizing below is therefore full incremental scope, not a delta against existing RISE work.

### 14.1 Functional Enablement
- Author a riscv64 CMake cross-compile toolchain file for `falcosecurity/falco` (modeled on the existing aarch64 template) -- small effort, unblocks manual/local builds.
- Complete modern-eBPF probe support in `falcosecurity/libs`: author riscv64 BTF/`vmlinux.h` definitions under `driver/modern_bpf/definitions/riscv64/` and wire through the CMake arch-mapping logic -- this is the single largest functional gap and the actual content of open issue [libs#1175](https://github.com/falcosecurity/libs/issues/1175).
- Validate and stabilize the existing kernel-module driver, which is self-described by maintainers as "almost untested" -- requires real riscv64 hardware or reliable QEMU/CI to move past "should compile and run."

### 14.2 Performance Optimization
Not applicable in the traditional sense -- Falco is not an optimization-purpose project and has no riscv64-specific hot-path code to tune. The closest analog is validating that the syscall-capture path performs acceptably on riscv64 hardware, for which zero benchmark data currently exists anywhere.

### 14.3 CI/CD Infrastructure
- Stand up a riscv64 build (and ideally test) job in `falcosecurity/falco`'s and `falcosecurity/libs`'s GitHub Actions workflows. The historical blocker (no riscv64 GitHub-hosted or self-hosted runner) may now be addressable via RISE's "RISE RISC-V Runners" (announced 2026-03-24) -- this should be evaluated first since it could substantially reduce this line item's cost, but has not yet been evaluated or adopted by either repo as far as this research found.
- Add the riscv64-specific `kmod_min_kver_map_riscv64` gate and eBPF-disable logic to the release-package build matrix once the above CI exists, to produce an actual publishable riscv64 binary via `download.falco.org`.

### 14.4 Ecosystem Enablement
Not applicable -- see note on Section 10 omission below.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Author riscv64 CMake toolchain file for `falcosecurity/falco` | 0.5-1 | Falco/libs maintainers or contributor | High |
| Functional | Complete modern-eBPF probe riscv64 support (BTF/vmlinux.h definitions) in `falcosecurity/libs` | 4-8 | falcosecurity/libs maintainers + riscv64-familiar contributor | Critical |
| Functional | Validate/stabilize existing kmod driver on real riscv64 hardware | 2-4 | falcosecurity/libs maintainers | High |
| CI/CD | Stand up riscv64 build+test CI job (evaluate RISE RISC-V Runners first) | 2-3 | Falco/libs maintainers, possibly RISE | High |
| CI/CD | Wire riscv64 into release-package build/publish matrix | 1-2 | Falco maintainers | Medium |
| Dependency | Track/upstream OpenSSL AES/GHASH constant-time fix for riscv64 ([openssl#31080](https://github.com/openssl/openssl/issues/31080)) | N/A (external dependency, monitor only) | OpenSSL upstream | Medium |

## 15. Updates
(No updates yet -- initial report dated 2026-06-17.)

## 16. References

- [falcosecurity/falco repository](https://github.com/falcosecurity/falco)
- [falco.org homepage](https://falco.org/)
- [falcosecurity/falco proposal: legacy BPF/gRPC output/gvisor engine deprecation (riscv64 EXPERIMENTAL matrix)](https://github.com/falcosecurity/falco/blob/master/proposals/20251215-legacy-bpf-grpc-output-gvisor-engine-deprecation.md)
- [falcosecurity/libs#1175 - Add RISC-V Support (tracking issue)](https://github.com/falcosecurity/libs/issues/1175)
- [falcosecurity/libs#1181 - feat(driver): Add RISC-V kernel module support (merged PR)](https://github.com/falcosecurity/libs/pull/1181)
- [falcosecurity/libs#399 - Build failure on riscv64 and patch (closed issue)](https://github.com/falcosecurity/libs/issues/399)
- [falcosecurity/libs driver/CMakeLists.txt](https://github.com/falcosecurity/libs/blob/master/driver/CMakeLists.txt)
- [falcosecurity/libs README.md support matrix](https://github.com/falcosecurity/libs/blob/master/README.md)
- [falcosecurity driver support matrix](https://falcosecurity.github.io/libs/matrix/)
- [falcosecurity/falco .github/workflows/reusable_build_packages.yaml](https://github.com/falcosecurity/falco/blob/master/.github/workflows/reusable_build_packages.yaml)
- [falcosecurity/falco .github/workflows/reusable_build_dev.yaml](https://github.com/falcosecurity/falco/blob/master/.github/workflows/reusable_build_dev.yaml)
- [falcosecurity/falco GitHub Releases](https://github.com/falcosecurity/falco/releases)
- [download.falco.org S3 bucket (falco-distribution)](https://falco-distribution.s3-eu-west-1.amazonaws.com/)
- [Ubuntu 26.04 (resolute) package search for Falco](https://packages.ubuntu.com/search?keywords=Falco&suite=resolute&searchon=names&section=all)
- [PyPI falco package (unrelated project)](https://pypi.org/pypi/falco/json)
- [Arch Linux RISC-V package search](https://archriscv.felixc.at/)
- [falcosecurity/evolution GOVERNANCE.md](https://github.com/falcosecurity/evolution/blob/main/GOVERNANCE.md)
- [falcosecurity/evolution MAINTAINERS.md](https://github.com/falcosecurity/evolution/blob/main/MAINTAINERS.md)
- [falcosecurity/falco ADOPTERS.md](https://github.com/falcosecurity/falco/blob/master/ADOPTERS.md)
- [falcosecurity/community meeting notes, release-0.37.0.md](https://github.com/falcosecurity/community)
- [jemalloc#2399 - cross build for RISCV64?](https://github.com/jemalloc/jemalloc/issues/2399)
- [mimalloc#1299 - riscv64 VA-detection PR](https://github.com/microsoft/mimalloc/pull/1299)
- [mimalloc#1319 - riscv64 TLS/yield PR](https://github.com/microsoft/mimalloc/pull/1319)
- [gperftools#1359 - Broken on riscv64: Cannot calculate stack trace](https://github.com/gperftools/gperftools/issues/1359)
- [openssl#31080 - AES/GHASH non-constant-time fallback on riscv64](https://github.com/openssl/openssl/issues/31080)
- [openssl#31082 - unmerged fix for #31080](https://github.com/openssl/openssl/pull/31082)
- [madler/zlib#1099 - RVV Adler-32 PR](https://github.com/madler/zlib/pull/1099)
- [facebook/zstd#4622 - disabled 4-way Huffman decode on riscv64](https://github.com/facebook/zstd/issues/4622)
- [Debian Bug #1068731 - FTBFS on riscv64 and ppc64el (mail-archive.com mirror)](https://www.mail-archive.com/debian-bugs-rc@lists.debian.org/msg677146.html)
- [RISE project blog](https://riseproject.dev/blog)
- [RISE project members page](https://riseproject.dev/members)
- [RISE Python wheel builder listing](https://riseproject.gitlab.io/python/wheel_builder/)

---

**Note on Section 10:** Omitted. Falco is a standalone daemon/tool with a driver dependency, not a project with a significant dependent package ecosystem (npm, PyPI, Maven, Kubernetes operators, etc.) that itself requires separate riscv64 enablement.
