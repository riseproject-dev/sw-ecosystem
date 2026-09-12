---
title: NCCL
parent: Project Reports
color: red
dependencies:
  - name: CUDA
    relation: runtime-dependency
    criticality: critical
  - name: GNU make
    relation: build-dependency
    criticality: critical
  - name: CMake
    relation: build-dependency
    criticality: optional
  - name: Python
    relation: build-dependency
    criticality: optional
  - name: rdma-core
    relation: runtime-dependency
    criticality: optional
  - name: GDRCopy
    relation: runtime-dependency
    criticality: optional
---

{% include dependency-graph.html slug="dependencies" subset="nccl" %}

# NCCL

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-09-12<br/>
**Readiness:** red<br/>
**Scope:** RISC-V (riscv64/linux) support status for NCCL<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

NCCL (NVIDIA Collective Communications Library) is a GPU-to-GPU collective communication library (all-reduce, all-gather, broadcast, reduce, reduce-scatter, point-to-point) used to synchronize gradients and activations across multi-GPU and multi-node training/inference clusters. It is a CUDA library: `CMakeLists.txt` declares `project(NCCL ... LANGUAGES CUDA CXX C)` and requires `find_package(CUDAToolkit REQUIRED)`. Collective logic executes on the GPU; host-side C/C++ code handles topology discovery, transport selection (NVLink, PCIe, InfiniBand/RoCE via `rdma-core`, GPUDirect RDMA via `gdrcopy`), and synchronization primitives.

**Governance:** Single-vendor NVIDIA project. No foundation (not CNCF, not Linux Foundation). No `MAINTAINERS`, `OWNERS`, or `CODEOWNERS` file exists in the repository. Governance is informal and NVIDIA-internal: substantial features require a design doc reviewed by unnamed "NCCL maintainers," with merge decisions made solely by NVIDIA. There is no external board, TSC, or public maintainer roster.

**License:** Apache-2.0 for most of the project, with some files retaining original BSD licensing, plus third-party-licensed borrowed files (`LICENSE.txt`, `ThirdPartyNotices.txt`). All new contributions require Apache-2.0 + DCO sign-off per `CONTRIBUTING.md`.

**Corporate sponsors / contribution profile** (sampled ~1,348 commits): nvidia.com accounts for ~90% of commits (1,207). The largest external contributor is amazon.com (42 commits, likely EFA/AWS transport work), followed by gmail.com (23, individual), google.com (7), fb.com/Meta (7), qq.com (6), bytedance.com (4), alibaba-inc.com (4), and single-commit contributors from microsoft.com, coreweave.com, deepmind.com, IBM (de.ibm.com), antgroup.com, Barcelona Supercomputing Center (bsc.es), zhaoxin.com, xiaomi.com, tu-dresden.de, and trailofbits.com. All top-20 individual authors by commit count are NVIDIA employees (lead: Sylvain Jeaugey, 141 commits). There are no external "corporate maintainers" in a formal sense.

**Stance on new ports:** `CONTRIBUTING.md` states explicitly: "Architecture-specific code: NCCL supports specific GPU architectures and network configurations. Contributions targeting unsupported architectures may not be accepted unless there's a clear plan for ongoing maintenance." Platform support is listed as a welcome contribution category, but must go through issue -> design discussion -> maintainer review -> implementation -> PR, with NVIDIA holding final approval.

**RISE relationship:** NVIDIA Corporation is a RISE (riseproject.dev) Premier Member at the corporate level, alongside Alibaba Damo, Google, MediaTek, Qualcomm, Red Hat, SiFive, and Tenstorrent. This is a company-level membership; no RISE blog post, wiki page, working-group repository, or Python wheel builder listing mentions NCCL anywhere.

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2024-02-19 | [PR #1183](https://github.com/NVIDIA/nccl/pull/1183) opened by contributor Xeonacid: single-line change adding `__riscv` to the existing `__aarch64__` branch of `wc_store_fence()` | [PR #1183](https://github.com/NVIDIA/nccl/pull/1183) |
| 2026-05-09 | Xeonacid responds to an automated stale-check bot: "It's still needed." | [PR #1183](https://github.com/NVIDIA/nccl/pull/1183) |
| 2026-06-03 | Maintainer AddyLaddy (NVIDIA) states in-flight aarch64 changes will modify `wc_store_fence()`, proposes a distinct `#elif defined(__riscv)` block using `asm volatile("fence ow,ow" : : : "memory")`, and says "I think we'd [need] a few more changes than just that to support RISC-V. So I think a specific RISC-V PR should be created." | [PR #1183](https://github.com/NVIDIA/nccl/pull/1183) |
| 2026-06-03 | Xeonacid agrees to wait for the aarch64 changes to land first | [PR #1183](https://github.com/NVIDIA/nccl/pull/1183) |
| 2026-08-23 | NVIDIA discloses at Hot Chips 2026 that CUDA platform support is coming to RISC-V (RVA23 profile, NVLink Fusion, SiFive named as an NVLink Fusion RISC-V CPU partner); NCCL and DOCA named as software NVIDIA intends to support for future RISC-V CUDA hosts | [Chips and Cheese](https://chipsandcheese.com/p/hot-chips-2026-cuda-targets-risc), [ServeTheHome](https://www.servethehome.com/nvidia-risc-v-for-nvidia-gpus-at-hot-chips-2026/), [Tom's Hardware](https://www.tomshardware.com/pc-components/gpus/nvidias-cuda-platform-now-supports-risc-v-support-brings-open-source-instruction-set-to-ai-platforms-joining-x86-and-arm) |
| 2026-09-12 (as of this report) | PR #1183 remains open, unmerged. No follow-up "dedicated RISC-V PR" has been filed. No CUDA riscv64 toolkit has shipped. | [PR #1183](https://github.com/NVIDIA/nccl/pull/1183) |

**Key contributors:** Xeonacid (individual contributor, author of the only RISC-V-related patch); AddyLaddy (NVIDIA maintainer, reviewing/blocking party).

**Is it fully upstream?** No. Zero riscv64 code has ever been merged into NVIDIA/nccl. `git log --all -i --grep=riscv` and `git log -S riscv` across the full fetched history (1,348 commits, 2015-11-17 to 2026-08-28) return zero matches. The only riscv64-related artifact in the repository's entire history is the still-open PR #1183.

## 3. Upstream Support Tier

No formal tier policy document exists (no `PLATFORMS.md`, `SUPPORT.md`, or `docs/platforms/`). Support is de facto defined by what CUDA and NCCL's CMake/Makefile actually build and what NVIDIA publishes as releases.

| Axis | amd64 (x86_64) | arm64 (aarch64) | riscv64 |
|---|---|---|---|
| Upstream CI builds | N/A - no CI exists for any architecture (see Section 7) | N/A | N/A |
| Upstream CI tests | N/A | N/A | N/A |
| Official binary/release | Yes (CUDA Toolkit + NCCL ship for x86_64 hosts) | Yes (aarch64/SBSA hosts) | No - no CUDA riscv64 host toolkit exists; no NCCL riscv64 artifact anywhere |
| Distro packages | Ubuntu 26.04: `libnccl2`, `libnccl-dev` (amd64) | Not listed for aarch64 in the checked Ubuntu 26.04 search (only amd64, ppc64el appeared) | None (Ubuntu 26.04, Arch RISC-V, PyPI all confirmed absent) |
| Host CPU support in CUDA Toolkit | Yes | Yes | No (announced at Hot Chips 2026, not shipped) [NEEDS VERIFICATION: exact GA date] |

There is no GitHub Actions, GitLab CI, Jenkins, or Cirrus configuration anywhere in the repository for **any** architecture, so "upstream CI" as a support-tier signal does not exist for amd64 or arm64 either - support for those architectures is evidenced instead by official CUDA Toolkit host support and Ubuntu package availability, not by CI.

## 4. Technical Architecture and RISC-V-Specific Subsystems

NCCL branches by host CPU architecture in exactly four places. Verified by cloning `NVIDIA/nccl` at HEAD `fd168324a3dc0c9080fd4881b6c7f4bb252a95a2` (2026-08-28) and reading source directly.

| Component | File | x86_64 | aarch64 | ppc64 | riscv64 |
|---|---|---|---|---|---|
| `wc_store_fence()` (write-combining store fence, used by GDRCopy paths) | `src/include/gdrwrap.h:36-45` | Full - `_mm_sfence()` intrinsic | Full - `asm("dsb st")` | Full - `asm("sync")` | **Missing** - no `#elif`, no `#else`; the function is left undeclared for `__riscv` |
| CPU architecture tag for topology XML | `src/graph/xml.cc:488-500` (`getXmlFromCpu`) | Full - sets `"x86_64"` | Full - sets `"arm64"` | Full - sets `"ppc64"` | **Missing** - falls into `#else` branch: `WARN("Unknown CPU architecture"); return ncclInternalError;` (a deliberate hard error) |
| CPU vendor/model detection (CPUID-based) | `src/graph/xml.cc:503+` | Full (CPUID) | Skipped (not arch-specific to arm; same as ppc/riscv) | Skipped | Skipped |
| GDR recv-flush memory ordering | `src/transport/net.cc:1668`, `src/transport/coll_net.cc:1223` | Full - hand-tuned `mfence` + explicit PCIe read via inline asm | Scalar/portable `#else` fallback (`std::atomic_thread_fence` + `ncclGdrCudaRead`) | Same scalar fallback | Same scalar fallback (shares the generic "not x86_64" branch by accident, not by riscv64-targeted design) |

`wc_store_fence()` is called unconditionally at 10 call sites across `gdrwrap.cc` (2), `enqueue.cc` (1), `net.cc` (4), and `coll_net.cc` (3). Since no riscv64 branch defines it, any riscv64 compile that reaches those translation units fails with an undefined-identifier error - this is a compile-time blocker, not a runtime stub. No `#error` or empty-stub fallback exists either; the identifier simply is not declared for `__riscv`.

File-count comparison: x86_64-specific code spans 4 files (`xml.cc`, `gdrwrap.h`, `net.cc`, `coll_net.cc`); aarch64-specific code spans 2 files (`xml.cc`, `gdrwrap.h`); ppc64-specific code spans 2 files (`xml.cc`, `gdrwrap.h`); riscv64-specific code spans **0 files**.

A full case-insensitive `grep -rli riscv` across all `.cc/.h/.cu/.cuh` files in the repository returns zero hits. There is no `arch/riscv/` directory, no RISC-V assembly, no RVV/SIMD dispatch code, and no ISA-extension usage (Zba, Zbb, etc.) anywhere. NCCL has no CPU SIMD kernel architecture of the kind a RISC-V vector port would slot into - its performance-critical code runs on the GPU as CUDA kernels, not on the host CPU.

**Note:** NCCL is not an optimization-purpose project under the color-coding model's Step 2 test (Section 13) - the value it delivers (GPU collective communication) does not depend on these host-side CPU code paths being architecture-tuned. The gaps documented above are correctness/build blockers, not missing performance optimizations.

## 5. Build System, Cross-Compilation, and Toolchain

**Build commands** (from `README.md`, x86_64/aarch64 only):
```shell
$ cd nccl
$ make -j src.build                          # default: /usr/local/cuda
$ make src.build CUDA_HOME=<path to cuda>    # custom CUDA path
$ make -j src.build NVCC_GENCODE="-gencode=arch=compute_90,code=sm_90"  # narrow arch for faster build
```
CMake equivalent (`CMakeLists.txt`, `cmake_minimum_required(VERSION 3.25)`): `cmake -S . -B build -DCMAKE_BUILD_TYPE=Release && cmake --build build`.

**Why riscv64 cannot be cross-compiled today:** `CMakeLists.txt` does `project(NCCL ... LANGUAGES CUDA CXX C)` and `find_package(CUDAToolkit REQUIRED)`. NCCL cannot build without `nvcc`. NVIDIA's CUDA Toolkit has never shipped an official riscv64 host-compiler target (supported hosts are historically x86_64, aarch64/SBSA, and ppc64le). This is an upstream-CUDA-level blocker, not something fixable in NCCL's own Makefiles/CMake. `CMAKE_SYSTEM_NAME` handling in `CMakeLists.txt` only branches on `Windows` vs `Linux` (`else() message(FATAL_ERROR "Unsupported OS...")`), and compiler detection only recognizes MSVC vs GNU/Clang - there is no host-CPU-architecture gating at all, because GPU architecture targeting happens via `CMAKE_CUDA_ARCHITECTURES` (SM targets like `sm_90`), independent of host ISA.

**Docker:** Only one Dockerfile exists in the entire repository, `contrib/nccl_ubx/Dockerfile`, which explicitly supports only `linux/amd64` and `linux/arm64` (`TARGETARCH`-based CUDA-arch auto-selection).

**QEMU:** No mentions anywhere in the repository (docs, CI, Docker, Makefiles) - there is no CI to run QEMU jobs in the first place.

**Known build failures:** If `wc_store_fence()` code paths (Section 4) were reached during a hypothetical riscv64 host build, compilation fails on an undeclared identifier. This is upstream source-code evidence of confirmed breakage, independent of the CUDA host-toolkit blocker.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Build at all | Yes | Yes | No - blocked by absent CUDA riscv64 host toolkit and by an undeclared `wc_store_fence()` identifier |
| GPU collective operations (all-reduce, etc.) | Yes | Yes | No |
| GPUDirect RDMA (gdrcopy) | Yes | Yes | No - gdrcopy's own support matrix lists only x86_64, ppc64le, arm64 (Section 9) |
| InfiniBand/RoCE transport (rdma-core/libibverbs, dlopen'd) | Yes | Yes | Not exercised - moot without a working NCCL build, though rdma-core itself packages for riscv64 in Ubuntu since 22.04 |
| DOCA GPUNetIO / GIN transport | Yes | Not confirmed by this research | No - DOCA host-arch support is x86_64/aarch64 only per NVIDIA docs; proprietary, not on public GitHub |
| CPU topology XML generation | Full vendor/model detection | Full arch tag ("arm64") | Hard error: `WARN("Unknown CPU architecture"); return ncclInternalError` |

**Functional gaps:** Complete - NCCL cannot build, let alone run, on a riscv64 host today. There is no partial-functionality state to describe.

**Performance gaps:** Not applicable - no working build exists to benchmark. Data not available: no NCCL riscv64 performance measurement of any kind exists in any source checked (GitHub, general web, RISE blog).

**Security hardening gaps:** Data not available: no riscv64-specific security review or hardening documentation exists because no riscv64 build exists.

**NaN / floating-point semantics issues:** Data not available: no floating-point-semantics issue reports specific to riscv64 were found (searches for "riscv nan floating repo:NVIDIA/nccl" returned zero results); this is unsurprising given collective-op math executes on the GPU, not the RISC-V host CPU, so host ISA floating-point semantics are not in NCCL's own scope.

## 7. CI/CD Infrastructure

**No CI of any kind exists in NVIDIA/nccl, for any architecture.** Verified directly against HEAD `fd168324a3dc0c9080fd4881b6c7f4bb252a95a2`:
- `.github/workflows/` - directory does not exist. `.github/` contains only `ISSUE_TEMPLATE/` and `pull_request_template.md`.
- No `.gitlab-ci.yml`, `Jenkinsfile`, `.cirrus.yml`, `.travis.yml`, `.circleci/`, or `azure-pipelines.yml` at repo root.
- A full case-insensitive `grep -ri riscv` (excluding `.git`) across the entire repository tree finds exactly one match: `bindings/nccl4py/uv.lock`, which lists a `coverage` (Python test-coverage tool) package's prebuilt `musllinux_1_2_riscv64` wheel filename as one of many platform variants available on PyPI. This is a transitive Python test-dependency lockfile entry, not CI configuration - it defines no build/test job, trigger, or runner.
- No RISE RISC-V runner references exist anywhere (none could exist, since no CI workflow files exist to reference them).

| Axis | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI exists | No (no CI for any arch) | No | No |
| Builds | N/A | N/A | N/A |
| Tests | N/A | N/A | N/A |
| Release-blocking | N/A | N/A | N/A |
| RISE runners used | N/A | N/A | No |

## 8. Distribution and Release Status

**No official riscv64 binaries exist for NCCL through any channel checked:**

- **GitHub Releases:** Direct API/asset enumeration was blocked by session sandboxing (403, repo not attached), so exact asset filenames could not be listed [NEEDS VERIFICATION: raw asset list]. Fetched release-page titles (NCCL v2.31.2-1, v2.30.7-1, v2.30.4-1, v2.30.3-1, v2.29.7, plus NCCL4Py/NCCL EP releases) show NVIDIA ships source tags, not per-architecture prebuilt binaries, so there is no indication any riscv64-named asset exists.
- **PyPI:** The package name "nccl" does not exist at all - `https://pypi.org/pypi/nccl/json` returns HTTP 404, confirmed by direct curl.
- **RISE Python wheel builder:** No wheel exists - the GitLab package-registry query for "nccl" redirects to the (404) PyPI page, consistent with no upstream package to mirror.
- **Ubuntu 26.04 ("resolute"):** Real NCCL packages `libnccl-dev` and `libnccl2` list architectures amd64 and ppc64el only - no riscv64. (An unrelated substring match, `libvncclient1`, a VNC client library, does list riscv64 - this is a false positive on the "ncc" substring, not evidence of NCCL riscv64 support.)
- **Arch Linux RISC-V (archriscv):** Zero "nccl" matches across the `core`, `extra`, and `community` riscv64 package directory listings at `mirrors.felixc.at/archriscv/`.

**What a user must do to get a working binary today:** Nothing works. There is no path to a functioning riscv64 NCCL build because the transitive hard dependency, the CUDA Toolkit, has no riscv64 host release (Section 9). A user cannot self-build around this gap; it requires an NVIDIA CUDA Toolkit release for riscv64 hosts first.

## 9. Dependencies

| Dependency | Role | riscv64 Build | riscv64 Test | riscv64 Release | Notes / Blocking issues |
|---|---|---|---|---|---|
| **CUDA** | Runtime-dependency, critical. NCCL is literally a CUDA library (`LANGUAGES CUDA CXX C`, `find_package(CUDAToolkit REQUIRED)`) | No riscv64 host toolkit exists; closed-source, not a distro package | Not possible | Not released for riscv64 | **This is the actual gate for NCCL on riscv64.** NVIDIA announced CUDA-on-RISC-V at Hot Chips 2026 (RVA23 profile, NVLink Fusion, SiFive partnership) but nothing has shipped as of 2026-09-12. Sources: [Tom's Hardware](https://www.tomshardware.com/pc-components/gpus/nvidias-cuda-platform-now-supports-risc-v-support-brings-open-source-instruction-set-to-ai-platforms-joining-x86-and-arm), [RISC-V International](https://riscv.org/blog/nvidia-to-bring-cuda-platform-support-to-the-risc-v/), [ServeTheHome](https://www.servethehome.com/nvidia-risc-v-for-nvidia-gpus-at-hot-chips-2026/), [The Register](https://www.theregister.com/2025/07/21/nvidia_cuda_riscv) |
| **GNU make** | Build-dependency, critical (default build driver per `README.md`) | Universal on riscv64 (part of standard toolchains, Debian/Ubuntu riscv64) | Full | Shipped | None - not itself a riscv64 gap |
| **CMake** | Build-dependency, optional (`cmake_minimum_required(VERSION 3.25)`, alternative to Make) | Fully available on riscv64 (Ubuntu/Debian package CMake for riscv64) | N/A (build tool) | Shipped | None |
| **Python** | Build-dependency, optional (`find_package(Python3)` in CMake; also used by `bindings/nccl4py`) | Fully available on riscv64 | N/A (build tool) | Shipped | None for the interpreter itself; `bindings/nccl4py/uv.lock` contains the repository's only "riscv64" string match, an unrelated `coverage` package wheel entry |
| **rdma-core** | Runtime-dependency, optional (dlopen'd `libibverbs.so`/`libibverbs.so.1` and `libmlx5.so`/`libmlx5.so.1` for InfiniBand/RoCE transport, `src/misc/ibvsymbols.cc`, `src/misc/mlx5dvsymbols.cc`) | Built for riscv64 continuously from Ubuntu Jammy (22.04, v39.0-1) through Plucky (25.04, v56.0-4ubuntu1) per packages.ubuntu.com/Launchpad; not confirmed specifically for 26.04 "resolute" [NEEDS VERIFICATION] | Not separately verified; distro riscv64 buildds compile+package it | Shipping in Ubuntu riscv64 since 22.04 | No riscv64 GitHub issues found on `linux-rdma/rdma-core`. Moot for NCCL until the CUDA blocker clears, since this transport is exercised only inside a running NCCL process |
| **GDRCopy** | Runtime-dependency, optional (dlopen'd `libgdrapi.so`, `src/misc/gdrwrap.cc`, GPUDirect RDMA memory pinning/mapping) | Upstream `NVIDIA/gdrcopy` README/releases list supported architectures as x86_64, ppc64le, arm64 only - riscv64 absent | Not applicable - unsupported architecture | Not released for riscv64 | No riscv64 issues found on `NVIDIA/gdrcopy`. Requires an NVIDIA-supplied kernel driver (`gdrdrv`) and a CUDA host, so it inherits the CUDA riscv64 blocker and has never itself been ported |

**Cross-reference:** `libnuma` is used only for reading `/sys/devices/system/node/.../cpumap` (no linked library dependency, not a build/runtime blocker) and is tracked separately at `project-reports/libnuma.md`, where riscv64 support is reported as essentially complete. `NVTX` (header-only, Apache-2.0+LLVM-exception profiling annotations bundled per `ThirdPartyNotices.txt`) and DOCA GPUNetIO/GDAKI (vendored proprietary in-tree code at `src/transport/net_ib/gdaki/doca-gpunetio`, x86_64/aarch64-only per NVIDIA docs) are additional dependencies surfaced by source inspection but are not in the direct-dependency list supplied for this report; NVTX carries no known riscv64 issue, and DOCA is not released for riscv64.

**Bottom line:** Every dependency that is riscv64-clean today (GNU make, CMake, Python, and largely rdma-core) is irrelevant to the outcome, because the one dependency that gates everything - CUDA - has no riscv64 host release. GDRCopy is independently unavailable on riscv64 regardless of CUDA's status.

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [PR #1183](https://github.com/NVIDIA/nccl/pull/1183) | Add wc_store_fence support for RISC-V | Open, unmerged (opened 2024-02-19, last activity 2026-06-03) | Blocking (partial fix only) | Single-line patch adding a `wc_store_fence()` branch for `__riscv`. Maintainer AddyLaddy states this alone is insufficient for real RISC-V support and requested a separate, more complete RISC-V PR; none has been filed in the 2.5+ years since. |

No other riscv64-related issue or PR exists in NVIDIA/nccl. Searches for "riscv64 performance," "riscv64 bug," and "riscv nan floating" against the repository returned either zero results or only generic, unrelated performance/bug reports on x86/AMD/H800/A100 hardware with no actual riscv64 mention. There is no correctness bug specific to riscv64 to highlight separately, because no riscv64 build exists to have produced one.

## 12. Objections and Upstream Blockers

**Stated objections:** None explicitly opposing RISC-V. Maintainer AddyLaddy's position on PR #1183 is procedural, not a rejection: the single-line fence patch is "not enough" and a dedicated, more complete RISC-V PR is needed, ideally after an in-flight (unlinked) aarch64 rework of the same function lands.

**Technical blockers:**
1. CUDA Toolkit has no riscv64 host support (announced direction only, not shipped as of 2026-09-12) - this is the primary, project-external blocker.
2. `wc_store_fence()` is undeclared for `__riscv` and is called unconditionally at 10 sites - a compile-time blocker independent of the CUDA gap.
3. CPU-architecture detection in `src/graph/xml.cc` explicitly returns `ncclInternalError` for any architecture outside x86_64/aarch64/ppc64.
4. GDRCopy (optional but commonly used for GPUDirect RDMA) has no riscv64 port and depends on both a CUDA host and an NVIDIA kernel driver.
5. DOCA GPUNetIO (proprietary, vendored in-tree) supports only x86_64/aarch64 hosts.

**Organizational blockers:** NCCL's governance is fully internal to NVIDIA (no external board, no public maintainer roster); `CONTRIBUTING.md` requires "a clear plan for ongoing maintenance" for contributions targeting unsupported architectures, and any substantial platform-support work must pass through NVIDIA's own design-doc and maintainer-review process. Despite NVIDIA being a RISE Premier Member at the corporate level, no RISE-affiliated work, funding, or CI runner usage tied to NCCL was found anywhere.

**Acceptance probability:** Low to moderate, but gated entirely on NVIDIA's own CUDA-for-RISC-V roadmap. NVIDIA has publicly signaled intent (Hot Chips 2026: NCCL and DOCA named as software planned for future RISC-V CUDA hosts, RVA23 profile, NVLink Fusion, SiFive as a named RISC-V CPU partner), so the objection is not architectural hostility but sequencing - RISC-V NCCL support cannot precede RISC-V CUDA support, and PR #1183's own thread shows the maintainer waiting on unrelated aarch64 work before even accepting the minimal fence fix.

## 13. Readiness Assessment

- **Color:** red (confirmed via /project-color-coding skill)
- **Release provider:** none
- **Justification:** NCCL hard-requires the CUDA Toolkit (`CMakeLists.txt`: `LANGUAGES CUDA CXX C`, `find_package(CUDAToolkit REQUIRED)`), and CUDA has no released riscv64 host support as of 2026-09-12 - a build-blocking dependency with no riscv64 port, which the color model's Red criteria list explicitly. Independently, NCCL's own source confirms breakage rather than mere untested status: `wc_store_fence()` (`src/include/gdrwrap.h`) is undeclared for `__riscv` and is called unconditionally at 10 call sites, so any riscv64 compile fails on an undefined identifier; CPU-architecture detection in `src/graph/xml.cc` explicitly returns `ncclInternalError` with "Unknown CPU architecture" outside x86_64/aarch64/ppc64. No upstream riscv64 CI exists at all (no `.github/workflows` directory in the repository), and no riscv64 package exists on PyPI (no "nccl" package, HTTP 404), Ubuntu 26.04 (`libnccl2`/`libnccl-dev`: amd64, ppc64el only), or Arch Linux RISC-V. Primary sources: [NVIDIA/nccl PR #1183](https://github.com/NVIDIA/nccl/pull/1183); NCCL's `CMakeLists.txt` CUDA requirement; [Tom's Hardware on CUDA-RISC-V](https://www.tomshardware.com/pc-components/gpus/nvidias-cuda-platform-now-supports-risc-v-support-brings-open-source-instruction-set-to-ai-platforms-joining-x86-and-arm).
- **Optimization purpose:** Not applicable. NCCL's value proposition is GPU-to-GPU collective communication executed on CUDA hardware, not host-CPU numeric optimization; the Step 2 optimization-purpose modifier of the color model does not apply, so no Optimization level is reported for this project.
- **Pending work that could change the grade:** (1) PR #1183 remains open; if merged after the aarch64 `wc_store_fence()` rework maintainer AddyLaddy referenced actually lands, and if the "few more changes" he described materialize in a dedicated RISC-V PR, the compile-time blocker in Section 4 would close - but this alone cannot move the grade above orange/yellow while CUDA itself has no riscv64 host release. (2) NVIDIA's Hot Chips 2026 disclosure (NCCL and DOCA named as planned software for RISC-V CUDA hosts, SiFive as an NVLink Fusion partner) is the single most consequential unlock to watch: a shipped CUDA riscv64 Toolkit would remove the primary blocker and let the grade be reassessed against Sections 4-9 as they stand at that time. (3) No RISE involvement with NCCL was found; RISE engagement (CI runners, wheel/package hosting, or funded upstream work) is not currently a factor and would need to start from zero.

## 14. Investment Analysis

**What RISE has already done or funded:** Nothing specific to NCCL. RISE's public output (blog, wheel builder, org repositories) contains zero mentions of NCCL. RISE's relevant adjacent work is entirely CPU/toolchain-focused (Python, PyTorch riscv64 port, OpenJDK/SLEEF, V8, Go, LLVM, Rust tier-1, Yocto, RVV kernels) and does not touch GPU collective-communication libraries. No work below should be treated as already covered by RISE.

### 14.1 Functional Enablement

The dominant blocker is entirely outside NCCL's own repository: a CUDA Toolkit riscv64 host release must exist before any NCCL riscv64 work is meaningful. Once (if) that ships, NCCL-side functional work is comparatively small: (a) land a complete `__riscv` implementation of `wc_store_fence()` (the PR #1183 thread already sketches the primitive: `asm volatile("fence ow,ow" : : : "memory")`, but the maintainer indicated additional unspecified changes are needed), and (b) add a riscv64 branch to `getXmlFromCpu()` in `src/graph/xml.cc` so topology detection does not hard-error. Both are small, well-scoped source changes once a target toolchain exists to validate them against.

### 14.2 Performance Optimization

Not applicable in the traditional SIMD/kernel sense - NCCL's collective-op performance is a function of GPU and network hardware, not host CPU ISA. No RISC-V-specific optimization work is meaningful until a functional build exists; even then, the host-side hot paths affected (memory fences, topology XML) are correctness-critical, not performance-differentiating in the way SIMD kernels are.

### 14.3 CI/CD Infrastructure

NCCL has no CI of any kind today, for any architecture - there is no existing CI pipeline to extend with a riscv64 job. Any CI investment would need to build NCCL's first-ever CI pipeline from scratch (build + test on x86_64/arm64 as a baseline) before a riscv64 job could be added to it, and any such job is moot without CUDA riscv64 hardware or a compatible emulator, neither of which exists.

### 14.4 Ecosystem Enablement

Not applicable - Section 10 is omitted per the report's scope rules; NCCL is a system-level runtime library with dlopen'd optional native dependencies (Section 9), not a project with a dependent package ecosystem (npm/PyPI/Maven consumers) requiring separate riscv64 enablement tracking. (`nccl4py`, the one Python-facing binding found in the repo, is itself unreleased on PyPI and out of scope here.)

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Complete `wc_store_fence()` `__riscv` implementation (extend PR #1183) and add a riscv64 branch to `getXmlFromCpu()` | 1-2 (blocked on CUDA riscv64 availability for validation) | NVIDIA / community (Xeonacid has already contributed the starting patch) | Low (cannot proceed meaningfully until CUDA riscv64 ships) |
| Functional | Track and validate GDRCopy riscv64 port (currently x86_64/ppc64le/arm64 only) | Data not available - depends entirely on NVIDIA's own gdrcopy roadmap, not sizeable from available research | NVIDIA | Low (blocked upstream) |
| Functional | Track CUDA Toolkit riscv64 host release (external dependency, not NCCL-owned work) | Data not available - owned entirely by NVIDIA's CUDA team, no public timeline found beyond the Hot Chips 2026 announcement | NVIDIA | Critical (this is the actual gating item for every other row) |
| CI/CD | Build NCCL's first CI pipeline (any architecture) as a prerequisite to adding riscv64 CI | Data not available - no baseline CI exists to estimate an incremental riscv64 addition against | NVIDIA | Low (secondary to the CUDA blocker) |
| Monitoring | Track NVIDIA's Hot Chips 2026 CUDA-RISC-V disclosure for a shipped Toolkit release, and re-open PR #1183 discussion once the referenced aarch64 rework lands | 0.5 (recurring watch, not build effort) | RISE / whoever owns this tracking effort | Medium (informs when the above items become actionable) |

## 15. Updates

(No updates yet - initial report dated 2026-09-12.)

## 16. References

- [NVIDIA/nccl PR #1183 - "Add wc_store_fence support for RISC-V"](https://github.com/NVIDIA/nccl/pull/1183)
- [NVIDIA/nccl repository](https://github.com/NVIDIA/nccl)
- [NVIDIA NCCL homepage](https://developer.nvidia.com/nccl)
- [NVIDIA/nccl roadmap issue #1896 "NCCL Roadmap Q4 2025"](https://github.com/NVIDIA/nccl/issues/1896)
- [NVIDIA/gdrcopy repository](https://github.com/NVIDIA/gdrcopy)
- [linux-rdma/rdma-core repository](https://github.com/linux-rdma/rdma-core)
- [Ubuntu 26.04 (resolute) package search: NCCL](https://packages.ubuntu.com/search?keywords=NCCL&suite=resolute&searchon=names&section=all)
- [Arch Linux RISC-V package mirror](https://mirrors.felixc.at/archriscv/)
- [PyPI JSON API: nccl (404, package does not exist)](https://pypi.org/pypi/nccl/json)
- [RISE Python wheel builder package list](https://riseproject.gitlab.io/python/wheel_builder/)
- [RISE Project homepage](https://riseproject.dev)
- [RISE Project blog](https://riseproject.dev/blog)
- [RISE Project members page](https://riseproject.dev/members/)
- [Chips and Cheese: Hot Chips 2026 - CUDA Targets RISC-V](https://chipsandcheese.com/p/hot-chips-2026-cuda-targets-risc)
- [ServeTheHome: NVIDIA RISC-V for NVIDIA GPUs at Hot Chips 2026](https://www.servethehome.com/nvidia-risc-v-for-nvidia-gpus-at-hot-chips-2026/)
- [HotHardware: NVIDIA Confirms CUDA Support Is Coming To RISC-V](https://hothardware.com/news/nvidia-confirms-cuda-support-is-coming-to-risc-v-and-its-a-huge-deal)
- [Tom's Hardware: Nvidia's CUDA platform now supports RISC-V](https://www.tomshardware.com/pc-components/gpus/nvidias-cuda-platform-now-supports-risc-v-support-brings-open-source-instruction-set-to-ai-platforms-joining-x86-and-arm)
- [RISC-V International: NVIDIA to bring CUDA platform support to RISC-V](https://riscv.org/blog/nvidia-to-bring-cuda-platform-support-to-the-risc-v/)
- [The Register: NVIDIA CUDA RISC-V coverage](https://www.theregister.com/2025/07/21/nvidia_cuda_riscv)
- [project-reports/libnuma.md (internal cross-reference for the libnuma dependency)](https://github.com/NVIDIA/nccl) [NEEDS VERIFICATION: internal report path, not a public URL]
