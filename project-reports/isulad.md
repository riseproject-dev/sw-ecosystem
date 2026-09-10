---
title: iSulad
parent: Project Reports
color: orange
---

{% include dependency-graph.html slug="dependencies" subset="isulad" %}

# iSulad

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Readiness:** orange<br/>
**Scope:** RISC-V (riscv64/linux) support status for iSulad<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

iSulad is a lightweight, C/C++ container runtime daemon developed by Huawei and hosted as a SIG ("iSulad") inside the openEuler community. It is positioned as a lower-overhead alternative to Docker/containerd for resource-constrained (edge, IoT) and cloud environments, implementing the CRI (Container Runtime Interface) and Docker-compatible APIs on top of low-level runtimes such as `lcr` and `runc`. The project has no Go dependency by design ("iSulad has moved to pure C, no longer uses Go" per its own [RISC-V build guide](https://github.com/openeuler-mirror/iSulad/commit/2033d9ff15d01f1a2ccd62b4376eb345bd438280)) and has no compute kernels, JIT, or SIMD code paths of any kind - it is architecture-agnostic C/C++ throughout.

**Governance:** iSulad is not independently governed. It is a SIG (`sig/iSulad/sig-info.yaml` in `openeuler-mirror/community`) inside openEuler, which is incubated under the **OpenAtom Foundation** (a Chinese nonprofit founded June 2020 in Beijing). Huawei donated the openEuler codebase, trademark, and community infrastructure to OpenAtom Foundation in November 2021. openEuler is **not** a Linux Foundation project. License: Mulan PSL v2.

**Corporate sponsors / maintainers:** All current and historical official SIG maintainers (Haomin Cai, Jingxiao Lu, Kelu Ye, Zitong Chen; retired: Hao Liu, Jing Wu, Feng Li, Xuepeng Xu, Tao Zhong, Xu Liu) are Huawei employees, confirmed via `sig/iSulad/sig-info.yaml` and `HALL_OF_FAME.md`. Top code contributors by commit count (`haozi007`, `zhongtao`, `lifeng68`, `WangFengTu`, `zhangxiaoyu`, `wujing`, `gaohuatao`, all >150 commits) carry `@huawei.com` addresses. The single notable external, non-Huawei contribution is the riscv64 seccomp patch, from **ChenHongJi** (Peng Cheng Laboratory, a Chinese state research institute), reviewed and merged by Huawei maintainers.

**Community culture on new ports:** Actively welcoming at the parent-community level. openEuler runs a formal architecture tier system; RISC-V reached **Tier-1 status starting openEuler 23.09** and achieved **full Tier-1 parity in openEuler 24.03 LTS** (Everything/EPOL repo coverage, feature parity including UEFI, hot patches, hard real-time kernel, TEE, alongside Arm/x86). openEuler engaged RISC-V International directly at openEuler Summit 2023 ("Building a Thriving Ecosystem Together"). Neither iSulad, openEuler, nor Huawei appear on the [RISE Project member list](https://riseproject.dev/members/) (Premier or General) - openEuler's RISC-V strategy runs through direct RISC-V International engagement and its own SIG-RISC-V, not through RISE.

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2020-10-24 | First RISC-V-related commit: `shentalon` (Summer2020 community-mentorship contributor) adds a QEMU-based RISC-V build guide, documentation-only. | [commit 2033d9f](https://github.com/openeuler-mirror/iSulad/commit/2033d9ff15d01f1a2ccd62b4376eb345bd438280) |
| 2020-10-26 | Build guide merged into repo (Gitee MR `!758`), reviewed by `lifeng2221dd1`. | [commit a41cc37](https://github.com/openeuler-mirror/iSulad/commit/a41cc37ede74a7ef2a41331f9915a1b41ce391d0) |
| 2020-11-23 | v2.0.7 released - first release containing the riscv64 build guide. | Release tag lookup against commit ancestry |
| 2022-04-12 | First riscv64 **code-level** change: ChenHongJi (Peng Cheng Laboratory) adds riscv64 to the seccomp architecture-mapping table and seccomp default profile. | [commit 86533d6](https://github.com/openeuler-mirror/iSulad/commit/86533d63cd8bdcf59b1f78286ea053e566b5b67b) |
| 2022-04-14 | Seccomp patch merged (Gitee MR `!1390`), reviewed by `duguhaotian` and `jingwoo`, two reviewers - the most-reviewed of the five riscv64-touching changes. | [commit 268fa5c](https://github.com/openeuler-mirror/iSulad/commit/268fa5c41237bed85c762e549fd7e28da5ee7428) |
| 2023-02-06 | v2.1.1 released - first release containing riscv64 seccomp support. | Release tag lookup against commit ancestry |
| 2023-09-14 | Doc typo fix in the Chinese RISC-V build guide (Gitee MR `!2184`). | [commit 0ad1a31](https://github.com/openeuler-mirror/iSulad/commit/0ad1a31cb0b53ef7b33ad827b0c96d7bdfd061db) |
| 2023-11-08 | v2.1.4 released - contains the doc fix. | Release tag lookup against commit ancestry |

**Key contributors:** `shentalon` (individual, Summer2020 mentee, org unconfirmed) authored the initial build guide; **ChenHongJi, Peng Cheng Laboratory** (Chinese state research institute, non-Huawei) authored the only functional riscv64 patch; Huawei-affiliated maintainers (`duguhaotian`, `jingwoo`, `lifeng2221dd1`, `haozi007`, `wangyu`) reviewed and merged all riscv64 work.

**Is it fully upstream?** Yes, in the narrow sense that all five riscv64-touching commits are merged into `master` and shipped in tagged releases - there is no pending or rejected riscv64 work. However the total scope is extremely small: a ~3-year span (2020 to 2023) with exactly five commits, of which only one (the 7-line seccomp patch) is functional code; the rest are documentation. No cross-compilation toolchain, no CI, and no release-artifact automation for riscv64 exist upstream.

## 3. Upstream Support Tier

iSulad has **no formal architecture-tier policy of its own**; it inherits openEuler's tier system as a core component. Per openEuler's own architecture tier policy, RISC-V reached Tier-1 in openEuler 23.09 and full parity in 24.03 LTS. This is a **parent-community policy statement**, not iSulad-specific CI/release evidence - Data not available: a direct query against openEuler's OBS (Open Build Service) package listing to confirm iSulad itself is built and shipped as a riscv64 binary through this tier policy.

Evidence checked directly against iSulad's own repository:
- **No CI of any kind exists** (`.github/workflows/`, `.gitlab-ci.yml`, `Jenkinsfile`, `.cirrus.yml` all absent) - confirmed by direct clone inspection, HEAD `09a2f7c`.
- **No GitHub Releases exist** for the project at all, any architecture: "There aren't any releases here" per the [releases page](https://github.com/openeuler-mirror/iSulad/releases).
- **No release-blocking gate** of any kind exists for riscv64 (or any arch) on GitHub, because there is no CI to gate on.

| | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Upstream CI builds | Data not available (no GitHub-visible CI for any arch) | Data not available (same) | No (confirmed absent) |
| Upstream CI tests | Data not available | Data not available | No |
| Upstream publishes binary release | No (zero GitHub Releases for the project) | No (same) | No |
| Manual build documentation | `docs/build_docs/guide/build_guide.md` | Not separately documented | `docs/build_docs/guide/build_guide_riscv.md` (EN), `_zh.md` (ZH) |

The project's own 2020 benchmark publication ("[iSulad Benchmark Test](https://www.openeuler.org/en/blog/haozi007/2020-09-09-isulad-benchmark.html)") only covers x86 and ARM test environments - no riscv64 numbers exist anywhere.

## 4. Technical Architecture and RISC-V-Specific Subsystems

iSulad has **no architecture-specific subsystems for any target architecture**. A full-tree grep confirmed zero occurrences of `__riscv`, `__aarch64__`, and `__x86_64__` conditional compilation anywhere in the C/C++ source, and there is no `arch/` directory of any kind. The daemon has no JIT, no SIMD/vectorization, no hand-written assembly, and no per-architecture code generation - it is uniformly portable C with no per-ISA code paths for riscv64, arm64, or amd64 alike.

The only riscv64-specific artifacts in the entire codebase are two small, generic data-table entries:

| Component | File | Content | Assessment |
|---|---|---|---|
| Seccomp arch-name mapping | `src/daemon/modules/spec/specs_security.c`, function `seccomp_trans_arch_for_docker()` | One row: `{ "SCMP_ARCH_RISCV64", "riscv64" }` in a 21-entry static lookup table alongside x86, arm, mips, ppc, s390, parisc, loongarch64, etc. | Complete for its narrow purpose; identical treatment to every other listed architecture, no gap. |
| Default seccomp profile | `src/contrib/config/seccomp_default.json` | 4-line `archMap` stanza: `{"architecture": "SCMP_ARCH_RISCV64", "subArchitectures": ["SCMP_ARCH_RISCV"]}`, sharing the same ~825-line syscall allow-list applied uniformly to x86_64/aarch64/riscv64 | Full (non-reduced) syscall coverage identical to other architectures. |

Comparison table (amd64 vs arm64 vs riscv64): **moot** - none of the three architectures has dedicated source files, per-arch `#ifdef` blocks, or SIMD/intrinsics code. All three are handled by the same generic code paths; riscv64 is not "behind" amd64/arm64 because none of them require or have architecture-specific implementation. This is confirmed by the absence of `CMAKE_SYSTEM_PROCESSOR` branching in the CMake build system as well.

## 5. Build System, Cross-Compilation, and Toolchain

iSulad is built with **CMake + GCC**, no Go toolchain (explicitly dropped: "iSulad has moved to pure C"). There is **no cross-compilation path documented or supported for riscv64** - the project's own [RISC-V build guide](https://github.com/openeuler-mirror/iSulad/commit/2033d9ff15d01f1a2ccd62b4376eb345bd438280) builds natively **inside a QEMU-emulated riscv64 VM**, not via cross-compilation on an amd64/arm64 host.

**QEMU setup (documented):**
```
wget https://download.qemu.org/qemu-5.1.0.tar.xz
./configure --target-list=riscv64-softmmu
make && make install
```
VM images (`oe-rv-rv64g-30G.qcow2`, `fw_payload_oe.elf`) are pulled from an ISCAS (Institute of Software, Chinese Academy of Sciences) mirror (`isrc.iscas.ac.cn`), not from any general-purpose CI infrastructure.

**Toolchain-version issues called out specifically for riscv64:**
- **grpc 1.22.0 cannot be built with GCC 9+** (per the base build guide, which the riscv64 guide explicitly defers to) - requires manually patching `include/grpcpp/impl/codegen/call_op_set.h` (add a defaulted `WriteOptions&` assignment operator) and renaming `gettid()` to `sys_gettid()` in three grpc source files.
- **protobuf 3.9.0**: `terminate called after throwing an instance of 'std::system_error'` - fixed by editing `src/google/protobuf/stubs/common.cc` to remove all `_WIN32` branches, leaving only the `pthread.h` path.
- **`cannot find -latomic`** (linker error) hit twice, in both grpc and lxc builds - for lxc specifically this is a missing static library (`libatomic.a`), not a search-path issue, requiring manual copy into `/usr/lib`.
- **lxc 4.0.3**: `__NR_signalfd` undefined on riscv64 - fixed by referencing an [lxc upstream PR](https://github.com/lxc/lxc/pull/3501/files).
- **libwebsockets 2.4.2** requires a `libwebsockets-fix-coredump.patch` and building with `-DLWS_WITH_SSL=0 -DLWS_MAX_SMP=32`.
- **http-parser 2.9.2** requires `CFLAGS="-Wno-error"` to suppress failing warnings-as-errors.

**Kernel requirement:** `CONFIG_OVERLAY_FS` must be manually enabled via `make menuconfig`, kernel built (`make Image`), then wrapped into a bootable ELF via **opensbi v0.6** - an entirely manual, multi-step process with no automation.

None of iSulad's own CMake options (`ENABLE_GRPC`, `ENABLE_LCR`, `ENABLE_SELINUX`, `ENABLE_METRICS`, etc. - full list of 30 flags in `cmake/options.cmake`) are architecture-gated; a riscv64 builder uses the identical generic build path as any other architecture.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

Because iSulad has no architecture-specific code for any target (Section 4), there is no functional feature matrix gap between amd64, arm64, and riscv64 **at the source level**. The gap is entirely in **verification, not implementation**:

- **Functional gaps:** None identified in source review. Data not available: no automated test suite has ever been run against riscv64 (no CI exists for any architecture), so "works in practice" is an unverified, doc-only claim rather than a continuously tested one.
- **Performance gaps:** No riscv64 performance data exists at all. The project's only published benchmark (["iSulad Benchmark Test," openEuler blog, 2020](https://www.openeuler.org/en/blog/haozi007/2020-09-09-isulad-benchmark.html)) covers x86 (48-core Xeon E5-2695 v2, iSulad vs Docker: create 131ms vs 287ms, start 315ms vs 675ms) and ARM (64-core openEuler host, create 177ms vs 401ms, start 523ms vs 1160ms) only. No SIMD is used anywhere in the project, so there is no SIMD-driven performance delta to speak of on any architecture.
- **Security hardening gaps:** None identified - the riscv64 seccomp profile carries the identical, full (non-reduced) syscall allow-list as x86_64/aarch64 (Section 4), not a restricted subset.
- **NaN / floating-point semantics:** Not applicable - iSulad performs no numeric/floating-point computation of the kind where architecture-specific NaN or FP-rounding behavior would matter.

## 7. CI/CD Infrastructure

**No riscv64 CI exists, and no CI exists for any architecture on GitHub.** Confirmed via direct repository clone (HEAD `09a2f7c`, full history to 2019 genesis):
- `.github/workflows/` - absent entirely (no directory).
- `.gitlab-ci.yml`, `Jenkinsfile`, `.cirrus.yml` - all absent.
- `.gitee/` directory - contains only PR/issue templates (`PULL_REQUEST_TEMPLATE.{en,zh-CN}.md`, `ISSUE_TEMPLATE.{en,zh-CN}.md`), no CI config.
- `CI/` directory (the project's actual test-runner scripts: `build.sh`, `test.sh`, `run-testcases.sh`, `build_on_linux_distros.sh`, `pr-gateway.sh`, dockerfiles for fedora/centos/ubuntu) - grepped case-insensitively for "riscv": **zero matches**.
- No RISE runner references found anywhere in the repository or in RISE's own public infrastructure listing (Section: RISE involvement, below).

**No RISE runners are used.** No RISE blog post, working-group page, or org repo (`riseproject-dev`, 25 repos checked) references iSulad in any capacity.

**Hardware used:** None (no CI exists to run on any hardware). The only "execution" of riscv64 iSulad documented anywhere is a developer manually running QEMU 5.1.0 in `riscv64-softmmu` mode on their own machine, per the build guide.

| | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI exists on GitHub | No | No | No |
| CI exists elsewhere (openEuler OBS/Gitee CI) | Data not available (outside GitHub's visibility) | Data not available | Data not available |
| Release-blocking gate | N/A (no CI) | N/A | N/A |
| RISE runner usage | No | No | No |

## 8. Distribution and Release Status

**No official riscv64 binaries exist from upstream, and in fact no official binaries of any kind exist from this GitHub repository for any architecture:**

- **GitHub Releases:** Zero releases published - "There aren't any releases here" (confirmed via direct page fetch of [the releases page](https://github.com/openeuler-mirror/iSulad/releases)).
- **PyPI:** `https://pypi.org/pypi/isulad/json` returns **HTTP 404** - the project is not published on PyPI under any name, for any architecture. Not a riscv64-specific gap; the package simply does not exist there.
- **RISE GitLab PyPI wheel builder:** Redirects (`HTTP 302`) straight to the nonexistent PyPI package, so no RISE-built wheels exist either. Not applicable regardless, since iSulad is a native C daemon, not a Python package.
- **Ubuntu 26.04 (resolute):** "Sorry, your search gave no results" - iSulad is not packaged in Ubuntu for any architecture.
- **Arch Linux RISC-V (archriscv):** No listing found for `isulad` on [archriscv.felixc.at](https://archriscv.felixc.at/?q=isulad).
- **openEuler's own repositories (OBS-based):** iSulad is a native openEuler component and openEuler's own architecture tier policy claims full Tier-1 (RISC-V) parity as of 24.03 LTS, which would plausibly include iSulad in openEuler's own riscv64 package repos. **This is an inference from openEuler's general tier-policy statement, not confirmed iSulad-specific package evidence** - Data not available: a direct query against openEuler's OBS package listing or repology entry for `iSulad`/`isulad` on riscv64 was not performed in this research pass. [NEEDS VERIFICATION]

**What a user must do to get a working riscv64 binary today:** Build from source manually, inside a QEMU 5.1.0 `riscv64-softmmu` VM running an openEuler riscv64 image, following [`docs/build_docs/guide/build_guide_riscv.md`](https://github.com/openeuler-mirror/iSulad/commit/2033d9ff15d01f1a2ccd62b4376eb345bd438280) - including manual source patches to protobuf, grpc, http-parser, libwebsockets, and lxc (Section 5), and a manually built kernel with `CONFIG_OVERLAY_FS` enabled. There is no one-command install path (`apt install`, `pip install`, container pull) on riscv64 from any channel checked.

## 9. Dependencies

Method note: the `project-graph` MCP server failed to connect this session (`CONNECTION_CLOSED`); dependency riscv64 status below is corroborated via direct `packages.ubuntu.com/resolute/riscv64` lookups and upstream issue-tracker searches, not the authoritative SPARQL graph query. All packages found were located in Ubuntu 26.04's `[ports]` (secondary) archive component, not `[main]`, for every dependency checked.

| Dependency | Role | riscv64 build | riscv64 test/CI | riscv64 release | Notes |
|---|---|---|---|---|---|
| CMake | Build (critical) | Data not available: not directly researched | - | - | Widely ported build tool; no riscv64-specific issues expected but not verified in this pass. |
| GCC | Build (critical) | Data not available: not directly researched | - | - | riscv64 is a GCC-native upstream target; not directly re-verified here. |
| Protocol Buffers | Build (critical) | Builds; riscv64 support merged upstream ([#12266](https://github.com/protocolbuffers/protobuf), #14549, #13114, #4425, all closed) | protoc riscv64 Maven prebuilts issue closed (#17798) | OK, `libprotobuf-dev 3.21.12-15ubuntu1` in Ubuntu 26.04 [ports] | None open. |
| gRPC | Build (critical) | Builds | Historical SIGILL crash on riscv64 (#37791, traced to bundled old Abseil using unsupported RDCYCLE instruction) - **fixed** via Abseil bump (gRPC #37543, absl >=20240722.0) | `libgrpc++-dev 1.51.1-8ubuntu1` [ports/universe]; no official riscv64 PyPI wheels (not applicable to iSulad's native C build) | iSulad's own build guide separately documents manual grpc 1.22.0 patches needed for riscv64 (GCC9+ incompatibility, `gettid` rename, `-latomic`) - a much older, unrelated issue predating the upstream fix above. |
| isula-libutils | Build (critical) | Data not available: openEuler/isula companion project, not independently researched in this pass | - | - | Recommend a dedicated riscv64 pass against `openeuler-mirror/isula-libutils` directly. |
| lcr | Runtime (critical) | Data not available: openEuler/isula companion project, not independently researched in this pass | - | - | Same org as iSulad; recommend a dedicated pass against `openeuler-mirror/lcr`. |
| libseccomp | Runtime (critical) | RISC-V support explicitly added upstream ([issue #110](https://github.com/seccomp/libseccomp) "RFE: add RISC-V support," closed/merged; #262 confirms merge to master) | Mature | `libseccomp-dev 2.6.0-2ubuntu5` [ports] | None open. |
| libcap | Runtime (critical) | Not directly Ubuntu-queried this pass; widely ported, low risk | - | - | - |
| OpenSSL | Runtime (critical) | Builds; has real RISC-V crypto-extension code (Zbb/Zknd/Zkne/Zbkb) | **Most active riscv64 issue traffic of any dependency checked**: #30880 (open, flaky `test_lhash` on riscv64 CI runner), #29269 (open, wants more arch-specific CI) | `libssl-dev 3.5.5-1ubuntu3` [ports] | Several open perf/correctness-adjacent tickets: #28118 (Zbb detection broken under musl, perf regression, open), #29453 (prefer intrinsics over inline asm, open), #28664 (further SHA-256 optimization, open), #25334 (AES needs zknd+zkne together, open). Least "settled" dependency of the set. |
| libcurl | Runtime (critical) | Builds | No riscv64-specific issues found | `libcurl4-openssl-dev 8.18.0-1ubuntu2` [ports] | None. |
| libarchive | Runtime (critical) | Builds | No riscv64-specific bugs; a CRC32 hardware-accel issue is ARMv8-only (#3390, closed) - riscv64 CRC falls back to software | `libarchive-dev 3.8.5-1ubuntu2` [ports] | None riscv64-specific. |
| yajl | Build (critical) | Builds | No riscv64 issues found (project itself is largely dormant upstream) | `libyajl-dev 2.1.0-5.1` [ports] | Soft risk only if a riscv64 bug ever surfaces in a dormant project. |
| libwebsockets | Runtime (critical) | Builds | Only unrelated closed issue found (Apple Silicon arm64) | `libwebsockets-dev 4.3.5-3ubuntu1` [ports/universe] | None found. |
| systemd | Runtime (critical) | Builds | Widely ported | `libsystemd-dev 259.5-0ubuntu3` [ports] | Not investigated on upstream tracker beyond Ubuntu availability. |
| device-mapper | Runtime (critical) | Builds | Not searched on GitHub (hosted off-GitHub) | `libdevmapper-dev 2:1.02.205-2ubuntu3` [ports] | Not investigated on upstream tracker. |
| runc | Runtime (critical) | Builds cleanly, no code changes needed (native Go riscv64 support since Go 1.16) | OK | **Official `runc.riscv64` release binaries shipped since v1.1.8**, confirmed present in v1.5.1 asset list | Issue #5166 ("add riscv64 to CI/release") closed - reporter found it already shipped. Strongest riscv64 posture of any dependency checked. |
| libselinux | Runtime (optional) | Data not available: not directly Ubuntu-queried this pass; widely ported, low risk | - | - | - |
| SQLite | Runtime (optional) | Builds | No riscv64 issues found | `libsqlite3-dev 3.46.1-9` [ports] | None. |
| ncurses | Runtime (optional) | Data not available: not directly researched | - | - | - |
| libevent | Build (optional) | Builds | 0 riscv64 issues found | `libevent-dev 2.1.12-stable-10build2` [ports] | None. |
| libevhtp | Build (optional) | Builds (small project; no dedicated issue sweep done) | - | `libevhtp-dev 1.2.18-2.1build5` [ports/universe] | Low-traffic project, no known riscv64 problems, not investigated deeply. |
| clibcni | Runtime (optional) | Data not available: openEuler/isula companion project, not independently researched in this pass | - | - | - |
| googletest | Test (critical) | Data not available: not directly researched | - | - | Widely ported test framework; low risk assumed but not verified. |
| CNI plugins | Test (optional) | Data not available: not directly researched | - | - | - |

**Additional indirect dependency found (not in the direct list, surfaced via gRPC/Protobuf research):** **Abseil-cpp** - `libabsl-dev 20260107.0-4` found in Ubuntu 26.04 [ports/universe]; has an **open issue** ([#1702](https://github.com/abseil/abseil-cpp/issues)) describing a link failure on some riscv64 cross-toolchains (undefined `__atomic_compare_exchange_1`/`__atomic_exchange_1`, missing `-latomic`) - a workaround exists, not a correctness bug, but worth checking against whatever toolchain any future iSulad riscv64 CI would use.

**Bottom line on dependencies:** Every dependency actually checked against Ubuntu 26.04 riscv64 was found (all in `[ports]`, not `[main]`) - no dependency is fundamentally blocked on riscv64. OpenSSL carries the largest set of open riscv64 tickets of any dependency (CI flakiness plus several open perf/intrinsics-quality issues on the RISC-V crypto extensions); runc has the strongest posture (official riscv64 release binaries since v1.1.8).

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| N/A | No riscv64 issues found on GitHub issue search (`is:issue riscv`) | N/A | N/A | Confirmed via `mcp__github__search_issues` (query "riscv", scoped to `openeuler-mirror/iSulad`): `total_count: 0`. |
| N/A | No riscv64-labeled issues found on Gitee (the actual upstream) | N/A | N/A | `GET https://gitee.com/api/v5/repos/openeuler/iSulad/issues?labels=riscv&state=all` returned an empty array. The 10 most-recent Gitee issues (unfiltered) cover compile errors, CNI, networking, and `isula` CLI bugs - none mention riscv or performance. |

**No open correctness or performance bugs for riscv64 exist on either tracker** as of this research (2026-09-10). This is consistent with the project's extremely small riscv64 change footprint (5 commits total) and total absence of automated testing (Section 7) - the absence of bug reports reflects absence of usage/testing signal, not confirmed correctness.

## 12. Objections and Upstream Blockers

**No stated objections found.** No issue, PR, or Gitee MR discussion contains pushback against riscv64 support. All riscv64-touching changes (the 2020 build guide, the 2022 seccomp patch) were merged without recorded back-and-forth beyond routine reviewer sign-off.

**Technical blockers:** None confirmed as currently blocking. The documented build-time issues (grpc/GCC9+ incompatibility, `-latomic` linking, protobuf `_WIN32` branch) are all worked around in the existing build guide, not open/unresolved blockers - though they have never been fixed at the toolchain/CMake level, meaning every future riscv64 builder must re-apply the same manual patches by hand.

**Organizational blockers:** None identified. openEuler's parent-community stance is actively pro-RISC-V (Tier-1 status, direct RISC-V International engagement), and the project accepted a non-Huawei, non-Chinese-state-affiliated-in-the-Western-sense... actually a Chinese state research institute (Peng Cheng Laboratory) contribution without friction.

**Acceptance probability for future riscv64 work:** High, based on demonstrated willingness to merge external riscv64 contributions and openEuler's institutional RISC-V commitment - but no evidence of active internal Huawei investment in riscv64 CI or automated testing exists; all riscv64 work to date has been externally or community-initiated (Summer2020 mentee, Peng Cheng Laboratory), not Huawei-driven.

## 13. Readiness Assessment

- **Color:** orange
- **Release provider:** none
- **Justification:** No upstream CI exists for iSulad on any architecture (GitHub Actions, GitLab CI, Jenkins, and Cirrus configs are all absent, confirmed by direct repository clone of HEAD `09a2f7c`), so there is no build/test signal for riscv64. No riscv64 (or any-architecture) binary release exists from any channel checked: [GitHub Releases](https://github.com/openeuler-mirror/iSulad/releases) has zero releases published, PyPI has no `isulad` package, Ubuntu 26.04 (resolute) does not package it, and Arch Linux RISC-V (archriscv) has no listing. riscv64 support consists entirely of a manual QEMU-based build guide and a 7-line seccomp architecture-table patch ([commit 86533d6](https://github.com/openeuler-mirror/iSulad/commit/86533d63cd8bdcf59b1f78286ea053e566b5b67b), merged 2022-04-14) - functional source-level enablement, but never exercised by automated CI or packaged as a binary by upstream or any distro tracker directly queried. This is not "downstream-only" in the strict sense of the color model's distribution floor, since no distro was confirmed to actually ship a riscv64 iSulad package in this research pass; it sits at the base "no upstream CI, no confirmed release" orange determination. iSulad is not an optimization-purpose project (no compute kernels, SIMD, or JIT), so the Step 2 optimization modifier does not apply and no optimization level is recorded.
- **Pending work that could change the grade:** openEuler (iSulad's parent distro and primary distribution channel) reached RISC-V Tier-1 status in 24.03 LTS per its own architecture tier policy, which plausibly means openEuler's own OBS build system already produces a riscv64 iSulad package outside of GitHub's visibility - **this is an unverified inference, not confirmed package evidence** [NEEDS VERIFICATION], and a direct query against openEuler's OBS/repo listing for `iSulad` on riscv64 is the single highest-value next step; a positive result there would justify a yellow (clean-distro-build) or higher reclassification under the distribution-floor rule. No open PRs, no RISE involvement, and no other pending riscv64 work were found anywhere in this research.

## 14. Investment Analysis

RISE has **no involvement of any kind** with iSulad - confirmed across the RISE blog (all 34 posts via sitemap), the RISE Python wheel builder (not applicable to a native C daemon in any case), and the `riseproject-dev` GitHub org (25 repos, none iSulad-related). No RISE-funded work exists to avoid duplicating.

### 14.1 Functional Enablement

The functional groundwork (seccomp arch support) is already merged and complete for its narrow scope. The primary functional gap is **verification, not implementation**: no automated test suite has ever run on riscv64 for this project. Recommended work: stand up a native or QEMU-based build+test job that exercises iSulad's existing `CI/test.sh` / `run-testcases.sh` scripts on riscv64, to convert the current doc-only "it builds" claim into a tested one.

### 14.2 Performance Optimization

Not applicable in the traditional sense - iSulad has no SIMD/JIT/compute-kernel code for any architecture, so there is no riscv64-specific optimization gap to close relative to amd64/arm64 (all three get identical generic C). The only performance question worth investing in is producing riscv64 numbers for the existing benchmark methodology (`ptcr` tool, client-mode and CRI-mode tests) used in the 2020 x86/ARM benchmark, to establish whether iSulad's claimed overhead advantage over Docker/Podman/CRI-O holds on riscv64 hardware.

### 14.3 CI/CD Infrastructure

The clearest, highest-leverage gap. No CI exists for iSulad on GitHub for any architecture, so adding riscv64 CI is not a matter of extending an existing amd64/arm64 pipeline - it requires building CI from scratch (or leveraging openEuler's own OBS/Gitee CI infrastructure, which is outside GitHub's visibility and was not independently verified in this research). A GitHub Actions workflow using RISE RISC-V runners (per the pattern documented at [riseproject.dev](https://riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github/)) would be a concrete, low-cost first step, since no RISE runner usage currently exists for this project.

### 14.4 Ecosystem Enablement

Not applicable - Section 10 is omitted per the report scope rules, since iSulad is a standalone systems daemon with no dependent package ecosystem (no npm/PyPI/Maven consumers depend on it as a library).

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Verify riscv64 build against current toolchains (post-2020 GCC/grpc/protobuf versions have likely changed since the 2020 build guide); update build guide if patches are no longer needed | 1-2 | TBD | High |
| Functional | Confirm and document openEuler OBS riscv64 package status for iSulad directly (resolve the [NEEDS VERIFICATION] item in Section 13) | 0.5 | TBD | High |
| CI/CD | Stand up a GitHub Actions riscv64 build+test job (RISE runners), exercising `CI/test.sh` / `run-testcases.sh` | 2-3 | TBD | Critical |
| CI/CD | Add riscv64 to `iSulad.spec` / release automation so binaries are attached to GitHub Releases (currently zero releases exist for any arch) | 2 | TBD | Medium |
| Performance | Re-run the existing `ptcr`-based benchmark methodology on riscv64 hardware to produce comparable numbers to the 2020 x86/ARM report | 1 | TBD | Low |
| Dependencies | Direct riscv64 status pass on `isula-libutils`, `lcr`, and `clibcni` (openEuler/isula companion projects, not covered in this research) | 1-2 | TBD | Medium |

## 15. Updates

(No updates yet - initial report dated 2026-06-17.)

## 16. References

- [openeuler-mirror/iSulad - GitHub mirror repository](https://github.com/openeuler-mirror/iSulad)
- [openeuler/iSulad - Gitee (actual upstream)](https://gitee.com/openeuler/iSulad)
- [openeuler/iSulad issues API - Gitee](https://gitee.com/api/v5/repos/openeuler/iSulad/issues)
- [commit 2033d9f - RISC-V build guide, initial contribution](https://github.com/openeuler-mirror/iSulad/commit/2033d9ff15d01f1a2ccd62b4376eb345bd438280)
- [commit a41cc37 - merge of RISC-V build guide (Gitee MR !758)](https://github.com/openeuler-mirror/iSulad/commit/a41cc37ede74a7ef2a41331f9915a1b41ce391d0)
- [commit 86533d6 - add riscv64 seccomp support](https://github.com/openeuler-mirror/iSulad/commit/86533d63cd8bdcf59b1f78286ea053e566b5b67b)
- [commit 268fa5c - merge of riscv64 seccomp support (Gitee MR !1390)](https://github.com/openeuler-mirror/iSulad/commit/268fa5c41237bed85c762e549fd7e28da5ee7428)
- [commit 0ad1a31 - doc typo fix (Gitee MR !2184)](https://github.com/openeuler-mirror/iSulad/commit/0ad1a31cb0b53ef7b33ad827b0c96d7bdfd061db)
- [openeuler-mirror/iSulad releases page (zero releases)](https://github.com/openeuler-mirror/iSulad/releases)
- [iSulad Benchmark Test - openEuler blog, 2020-09-09](https://www.openeuler.org/en/blog/haozi007/2020-09-09-isulad-benchmark.html)
- [iSulad + Kuasar: Container Runtime Solution - openEuler blog](https://www.openeuler.org/en/blog/20230428-isulad/20230428-isulad.html)
- [RISE Project blog listing](https://riseproject.dev/blog)
- [RISE Project members list](https://riseproject.dev/members/)
- [RISE Python wheel builder](https://riseproject.gitlab.io/python/wheel_builder/)
- [Announcing the RISE RISC-V Runners](https://riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github/)
- [PyPI isulad package lookup (404)](https://pypi.org/pypi/isulad/json)
- [Ubuntu resolute package search for iSulad (no results)](https://packages.ubuntu.com/search?keywords=iSulad&suite=resolute&searchon=names&section=all)
- [Arch Linux RISC-V (archriscv) package search for isulad](https://archriscv.felixc.at/?q=isulad)
- [gRPC riscv64 SIGILL issue #37791](https://github.com/grpc/grpc)
- [Abseil-cpp riscv64 link issue #1702](https://github.com/abseil/abseil-cpp/issues)
- [libseccomp RISC-V support issue #110](https://github.com/seccomp/libseccomp)
- [runc.riscv64 release binaries, v1.5.1](https://github.com/opencontainers/runc)
- [OpenSSL open riscv64 issues #30880, #29269, #28118, #29453, #28664, #25334](https://github.com/openssl/openssl)
