---
title: Slurm
parent: Project Reports
color: yellow
dependencies:
  - name: GCC
    relation: build-dependency
    criticality: critical
  - name: GNU make
    relation: build-dependency
    criticality: critical
  - name: autoconf
    relation: build-dependency
    criticality: optional
  - name: automake
    relation: build-dependency
    criticality: optional
  - name: Munge
    relation: runtime-dependency
    criticality: critical
  - name: OpenSSL
    relation: runtime-dependency
    criticality: critical
  - name: PMIx
    relation: runtime-dependency
    criticality: optional
  - name: hwloc
    relation: runtime-dependency
    criticality: optional
  - name: json-c
    relation: runtime-dependency
    criticality: optional
  - name: libcurl
    relation: runtime-dependency
    criticality: optional
  - name: MariaDB Connector/C
    relation: runtime-dependency
    criticality: optional
  - name: readline
    relation: runtime-dependency
    criticality: optional
  - name: zlib
    relation: runtime-dependency
    criticality: optional
  - name: LZ4
    relation: runtime-dependency
    criticality: optional
  - name: HDF5
    relation: runtime-dependency
    criticality: optional
  - name: Lua
    relation: runtime-dependency
    criticality: optional
  - name: libnuma
    relation: runtime-dependency
    criticality: optional
  - name: ncurses
    relation: runtime-dependency
    criticality: optional
  - name: Tcl
    relation: test-dependency
    criticality: optional
---

# Slurm

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-09-12<br/>
**Readiness:** yellow<br/>
**Scope:** RISC-V (riscv64/linux) support status for Slurm<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

{% include dependency-graph.html slug="dependencies" subset="slurm" %}

## 1. Project Overview

Slurm (Simple Linux Utility for Resource Management) is an open-source, fault-tolerant, highly scalable cluster management and job scheduling system for Linux clusters, widely used in HPC. It is written in portable C and built with GNU Autotools (no CMake, no build-system alternatives found in the repository).

**Governance and corporate sponsorship.** Slurm has no independent foundation. It is GPLv2-licensed and governed as a single-vendor project: all patches require DCO sign-off and are "subject to review by SchedMD" per `CONTRIBUTING.md`. SchedMD was spun out of Lawrence Livermore National Laboratory and, as of the research window, **SchedMD is now part of NVIDIA** - the schedmd.com homepage states "SchedMD is now a part of NVIDIA," and core maintainer commit emails migrated from `@schedmd.com` to `@nvidia.com` starting around October 2025 (e.g. `dauble@nvidia.com` first appears 2025-10-30). `SECURITY.md` and `CODE_OF_CONDUCT.md` are now NVIDIA corporate boilerplate, and `CODEOWNERS` routes review to `@nvidia/schedmd/groups/...`. In the last 12 months of commit history by email domain, `nvidia.com` (4,577 commits) and `schedmd.com` (2,963 commits, same core team mid-migration) dominate, with a long tail from `gmail.com`, `amazon.com`, `reannz.co.nz`, `outlook.de`, `jumptrading.com`, `google.com`, and academic contributors (Purdue, Ghent University, Atos, SLB, Wolfram). NVIDIA is now the dominant corporate sponsor.

**Community culture on new ports.** `CONTRIBUTING.md` explicitly flags architecture/build-system changes as high-friction: "Changes to `configure.ac` or `auxdir/*` will take additional time to review - Slurm is built on a wide variety of distributions and architectures, and even minor differences can cause unintended consequences." Combined with the platform-tier policy (Section 3) and the fact that the only riscv-related patch merged to date is a narrow, externally volunteered fix (Section 2), the practical posture toward new architecture enablement is reactive rather than invested: small unblocking patches from outside contributors are accepted, but SchedMD/NVIDIA is not funding or driving RISC-V enablement itself.

Slurm is **not a RISE Project member**. The full RISE member list (Premier: Alibaba, Google, MediaTek, NVIDIA, Qualcomm, Red Hat, SiFive, Tenstorrent; General: Akeana, Andes, Beijing ESWIN, Beijing Institute of Open Source Chip, Canonical, Douyin Vision, Institute of Software Chinese Academy of Sciences, Microchip, NextSilicon, Quintauris, SpacemiT, ZTE) contains no SchedMD/Slurm entry ([riseproject.dev/members/](https://riseproject.dev/members/)).

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2014-11-07 | Commit `8c24712157` "run autogen.sh on ubuntu 14.10" by Danny Auble (`da@schedmd.com`) incidentally regenerates GNU autoconf boilerplate, bringing in generic riscv/riscv64 triplet recognition strings in `auxdir/config.sub` and `auxdir/config.guess`. Not deliberate Slurm-side RISC-V work. | Local git history, SchedMD/slurm |
| 2025-11-08 | Commit `c0abf6ebf4` "Add ld emulation on FreeBSD for --format=binary" (Ticket #23830), by external contributor GenericRikka (`rikka.goering@outlook.de`), adds `riscv64-*-freebsd*) LD_EMULATION="-m elf64lriscv" ;;` to `configure.ac`. A narrow FreeBSD/lld linker fix, not a Linux/riscv64 enablement effort, merged roughly a year after the NVIDIA acquisition and authored by a volunteer outside SchedMD/NVIDIA. | [SchedMD/slurm configure.ac](https://github.com/SchedMD/slurm/blob/master/configure.ac) |

No further riscv/riscv64-touching commits, issues, or pull requests exist in the repository (confirmed by `search_issues`, `search_pull_requests`, `search_commits`, and `search_code` against `SchedMD/slurm`, all returning zero results for riscv/riscv64/RISC-V, and by a full-tree grep of the cloned repository). There is no master tracking issue for a riscv64 port. **Slurm is not upstreamed for riscv64 in any meaningful sense** - the two touches above are incidental autoconf regeneration and a single FreeBSD-only linker fix; no Linux/riscv64 enablement work has occurred or is tracked.

Note: SchedMD's primary issue tracker is Bugzilla ([bugs.schedmd.com](https://bugs.schedmd.com/)), not GitHub Issues - GitHub is largely a read-only mirror. An absence of GitHub issues does not rule out discussion on Bugzilla or the slurm-users mailing list, but none was found within the GitHub search surface available to this research.

## 3. Upstream Support Tier

SchedMD's official platform-support policy (`doc/html/platforms.shtml` / [slurm.schedmd.com/platforms.html](https://slurm.schedmd.com/platforms.html)) states:

> "Linux - Slurm has been thoroughly tested on most popular Linux distributions using arm64 (aarch64), ppc64, and x86_64 architectures."

Supported/tested distros are RHEL 8-10, SLES 12/15, Debian 11-13, and Ubuntu 20.04-24.04, with no further per-distro architecture breakdown. FreeBSD and NetBSD are listed as "Limited support, not actively tested." macOS is unsupported ("ran in the past... patches would be appreciated"). **riscv64 is absent from every tier** - not listed as supported, tested, limited, or aspirational.

There is no CI of any kind in the repository to evidence a formal tier for any architecture (Section 7), and there are no official prebuilt binary release assets for any architecture (Section 8) - SchedMD ships source tarballs only.

| | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Listed as tested/supported on platforms page | Yes | Yes | No |
| Upstream CI evidence | None (no CI exists for any arch) | None | None |
| Official SchedMD binary release | No (source tarballs only, all arches) | No | No |
| Downstream distro packages | Yes (primary architecture) | Yes (primary architecture) | Yes, Ubuntu 26.04 only, tagged `[ports][universe]` (non-primary, community-maintained) |

## 4. Technical Architecture and RISC-V-Specific Subsystems

Slurm has no per-architecture backend, JIT, or SIMD kernel model at all - for any architecture, not just riscv64. It is a portable-C orchestration daemon. A full-repo inventory of architecture guards across all `.c`/`.h` files (plus configure/build files) found:

```
3 __i386__
2 __x86_64__
1 __s390x__
1 __s390__
1 __ppc64__
1 __arm__
0 riscv / riscv64 / __riscv / RISCV   (in every tracked file except vendored autoconf scripts)
```

All architecture-guards live in just three files, all vendored/third-party or narrow ABI plumbing:

1. `src/common/uthash.h` (vendored hash-table library) - `#if __i386__ || __x86_64__` selects a fast unaligned-read hash path; the `#else` branch (used by aarch64, ppc64, riscv64, everything else) uses the generic aligned-read path. Endianness is handled by a separate `#if __BIG_ENDIAN__ || SPARC || __ppc__ || __ppc64__` check; riscv64 falls through to the little-endian default (correct, but never explicitly named).
2. `src/plugins/namespace/linux/namespace_linux.c` - a `sys_clone()` raw syscall wrapper swaps two argument positions `#ifdef __x86_64__`; the `#else` branch (aarch64, ppc64, riscv64) uses the generic ABI order.
3. `src/plugins/hash/common_xkcp/brg_endian.h` (vendored XKCP/Keccak library) - explicit big-endian cases only for 32-bit `__arm__`, s390/s390x, AIX; a catch-all default assumes little-endian for everything else, including aarch64 and riscv64.

The only Slurm-authored riscv64 token in the entire codebase is the FreeBSD-only linker-emulation line in `configure.ac` (Section 2) - inert on Linux, which is the only riscv64 platform anyone actually ships. There are no assembly files anywhere in the repository (`find . -name '*.S' -o -name '*.s'` returns empty) and no SIMD intrinsics of any kind (no `immintrin.h`, `arm_neon.h`, `riscv_vector.h`).

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Syscall ABI special-casing | Yes (`sys_clone` arg order) | No (generic fallback) | No (generic fallback) |
| Hash fast-path | Yes (unaligned read) | No (generic fallback) | No (generic fallback) |
| Endianness handling | Explicit (little-endian branch) | Implicit default | Implicit default |
| SIMD/vector intrinsics | None | None | None |
| Assembly | None | None | None |
| ISA-extension-specific code (e.g. Zba/Zbb) | N/A | N/A | None |

**Verdict:** riscv64 is not an incomplete implementation - it is never named at all in any `.c`/`.h` file. It is silently absorbed into the same generic fallback paths as aarch64. Slurm has no per-architecture optimization tradition even for x86_64; the differences that exist are narrow ABI/endianness branches, not performance-relevant code. This project is not optimization-purpose (Section 13/Step 2 of the color model does not apply).

## 5. Build System, Cross-Compilation, and Toolchain

Slurm uses GNU Autotools (`configure.ac` -> `configure`), not CMake - no `CMakeLists.txt` exists anywhere in the tree. There are no Dockerfiles (`docker/`, `.ci/docker/`, `Dockerfile.riscv64` all absent; GitHub code search for `riscv64 filename:Dockerfile repo:SchedMD/slurm` returns 0 results) and no dedicated riscv64 build documentation (`BUILDING.md`, `docs/building.md`, `docs/cross-compilation.md` all absent; `INSTALL` and `README.md` are generic autotools boilerplate).

Standard build sequence (`doc/html/quickstart_admin.shtml`, generic, no arch-specific flags documented anywhere):

```
tar -xaf slurm*tar.bz2
cd slurm-<version>
./configure [options]
make install
ldconfig -n <library_location>
```

For riscv64 cross-compilation, a user would rely purely on generic autotools cross-build mechanics with no Slurm-provided hooks or documentation:

```
./configure --host=riscv64-linux-gnu CC=riscv64-linux-gnu-gcc [options]
```

Relevant `./configure` options for trimming optional dependencies (all generic, none riscv-specific): `--with-mysql_config`, `--with-json` (json-c), `--with-jwt`, `--with-yaml`, `--with-ofed`, `--with-hdf5`, `--with-lz4`, `--with-hwloc`, `--with-nvml` (CUDA), `--with-rsmi` (AMD GPU), `--with-oneapi` (Intel GPU), `--with-pmix`, `--with-freeipmi`, `--with-ucx`, `--with-rdkafka`, `--with-s2n`, `--with-bpf`, `--with-hpe-slingshot`, `--with-lua`, `--without-readline`, `--with-munge`, `--with-libcurl`.

**Compiler requirement.** The only compiler requirement asserted anywhere in the build system is C99 support (`auxdir/x_ac_c99.m4`, invoked as `X_AC_C99`). This is a feature probe (compiles a C99 for-loop-with-declaration, falls back to `-std=gnu99` if needed) - no specific minimum GCC or Clang version is stated anywhere in the repository, riscv-specific or otherwise.

**QEMU.** No mention of QEMU anywhere in the repository (README, INSTALL, `configure.ac`, `doc/html/*`, full-tree grep) - no QEMU-based testing or emulation instructions exist for any architecture.

**Known build failures on riscv64:** Data not available - no riscv64-specific build failure reports were found in SchedMD/slurm issues, PRs, or commits (all searches returned zero riscv64-related results).

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Core scheduling/orchestration (slurmctld, slurmd, slurmdbd) | Full | Full | Builds via generic C (Ubuntu ports build); upstream-untested |
| REST API (slurmrestd) | Full | Full | Builds via generic C; upstream-untested |
| GPU plugins (NVML/CUDA, RSMI/AMD, oneAPI/Intel) | Full | Full | Data not available - no riscv64 GPU-plugin testing found; independent of CPU architecture in principle but untested |
| CPU/NUMA topology-aware scheduling (via hwloc) | Full | Full | Gapped - hwloc has an open, unresolved issue for riscv64 CPU-info detection (Section 9) |
| PAM, SELinux, cgroup v2 support | Full | Full | Data not available - no riscv64-specific testing found |
| Security hardening posture | Tested per platforms.shtml | Tested per platforms.shtml | Not tested by SchedMD at all |

**Functional gaps:** The most concrete, sourced functional gap is topology/affinity accuracy: Slurm's `cons_tres` scheduling plugin and task-affinity binding rely on `hwloc` for CPU/NUMA topology detection, and hwloc has an open upstream issue (#650, "get RISC-V CPU info on Linux") indicating incomplete topology detection on riscv64 (Section 9). This directly affects Slurm's core/socket/NUMA binding correctness on riscv64 nodes, though the practical severity was not independently benchmarked.

**Performance gaps:** Data not available - no Slurm-specific scheduling-latency, job-throughput, or dispatch-overhead benchmarks comparing riscv64 to arm64/amd64 were found (Section 11 covers the adjacent HPC hardware benchmarks that exist, which measure the RISC-V CPU itself, not Slurm).

**Security hardening gaps:** Data not available - no riscv64-specific security hardening gaps (e.g., missing ASLR/stack-protector support) were found or searched with positive results; Slurm's own security posture is architecture-agnostic C.

**NaN / floating-point semantics issues:** None found. A search for "riscv nan floating repo:SchedMD/slurm" returned zero results; no such issue exists in the tracker. This report explicitly flags that the searched term does not correspond to a real, verifiable bug.

## 7. CI/CD Infrastructure

**SchedMD/slurm has no CI pipeline of any kind, for any architecture.** This was independently confirmed two ways:

1. Direct filesystem inspection of a local clone: no `.github/workflows` directory, no `.github` directory at all, no `.gitlab-ci.yml`, no `Jenkinsfile`, no `.cirrus.yml`. The only tooling-adjacent config file at the repo root is `.pre-commit-config.yaml` (a pre-commit hook config, not a CI pipeline), which contains no riscv references.
2. GitHub's own code-search index (which works across all public repos regardless of session repo-scoping): `query: "repo:SchedMD/slurm path:.github/workflows"` returns `total_count: 0`; `query: "filename:*.yml path:.github/workflows repo:SchedMD/slurm"` also returns `total_count: 0`.

There is therefore no riscv64 CI job, trigger, or runner to inspect - not build-only, not test-running, nothing. RISE RISC-V runner infrastructure is not used by Slurm (RISE's runner fleet is unrelated tooling for other projects, and no RISE involvement with Slurm was found at all - Section 12).

| | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI exists | No | No | No |
| Builds | N/A | N/A | N/A |
| Tests run | N/A | N/A | N/A |
| Release-blocking | N/A | N/A | N/A |
| Hardware/QEMU | N/A | N/A | N/A |
| RISE runners used | No | No | No |

## 8. Distribution and Release Status

**SchedMD does not publish prebuilt binaries for any architecture** - GitHub releases are source-tarball-only (this is a structural property of SchedMD's release process, not something checked and found absent specifically for riscv64; direct API access to `SchedMD/slurm` releases was blocked in this session's tooling scope, but the source-tarball-only pattern is well established and would not be expected to differ by architecture).

**PyPI.** The `slurm` package on PyPI ([pypi.org/pypi/slurm/json](https://pypi.org/pypi/slurm/json)) is an unrelated third-party Python wrapper (versions 0.1.0-0.5.1), not SchedMD's workload manager. All 26 files across all versions are `py3-none-any` wheels or `.tar.gz` source dists - architecture-independent by construction, with zero riscv64-specific artifacts (none expected or needed).

**RISE wheel builder.** The RISE-hosted PyPI mirror endpoint ([gitlab.com/api/v4/projects/56254198/packages/pypi/simple/slurm/](https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/slurm/)) 302-redirects to plain upstream PyPI - no RISE-built wheel exists for this project; it falls through to the unrelated wrapper package above.

**Ubuntu.** Directly verified via architecture-scoped package pages (not the flakier search page):
- [packages.ubuntu.com/resolute/riscv64/slurm-wlm](https://packages.ubuntu.com/resolute/riscv64/slurm-wlm) - FOUND: `slurm-wlm (25.11.2-1ubuntu2) [ports] [universe]`, 107.7 kB.
- [packages.ubuntu.com/resolute/riscv64/slurmd](https://packages.ubuntu.com/resolute/riscv64/slurmd) - FOUND: `slurmd (25.11.2-1ubuntu2) [ports] [universe]`, 265.5 kB.
- Ubuntu "mantic" also ships `slurm-client_23.02.3-2ubuntu1_riscv64.deb` ([packages.ubuntu.com/mantic/riscv64/slurm-client](https://packages.ubuntu.com/mantic/riscv64/slurm-client)).

Both `[ports]` and `[universe]` tags matter: `[ports]` means riscv64 is not one of Ubuntu's primary/release architectures (amd64, arm64) - it is built on the ports infrastructure with weaker guarantees (no guaranteed security-update SLA, community-maintained buildd). `[universe]` means it is community-maintained, not Canonical-supported. This is "available and downloadable," not "officially/first-class supported."

**Debian.** [packages.debian.org/search?keywords=slurm](https://packages.debian.org/search?keywords=slurm) lists Slurm packages; per-architecture riscv64 build status was not independently re-verified beyond the Ubuntu confirmation above [NEEDS VERIFICATION].

**Arch Linux RISC-V (archriscv).** Attempted via [archriscv.felixc.at/?q=slurm](https://archriscv.felixc.at/?q=slurm) - the `?q=` query parameter does not function as a search on the fetched page (returns a static overview page, no package list). **Unverified** - neither confirmed nor refuted.

**Fedora.** Data not available - not checked.

**What a user must do to get a working binary today:** Install from Ubuntu 26.04 ("resolute") or newer via `apt install slurm-wlm` on riscv64 hardware/VM (ports/universe tier, unmodified upstream source, no riscv64-specific patches applied). There is no SchedMD-provided riscv64 binary, container image, or documented cross-compilation path; a from-source build would require standard autotools cross-compilation (`--host=riscv64-linux-gnu`) against a self-assembled riscv64 dependency set (MUNGE, hwloc, etc. - each of which would need its own riscv64 support verified, per Section 9).

## 9. Dependencies

Slurm has no CMakeLists.txt/setup.py/go.mod/Cargo.toml/package.json - it is Autoconf/Automake. Its manifest is `configure.ac` plus `auxdir/x_ac_*.m4` (one `.m4` per optional/required external library). Slurm itself has no JIT backend, no SIMD kernels, and no numerics library of its own - it is an orchestration daemon, so the dependencies below cover build tooling, the crypto/auth layer, and optional runtime integrations.

| Dependency | Role | riscv64 build | riscv64 test/CI | riscv64 release | Notes |
|---|---|---|---|---|---|
| GCC | Build-dependency, critical | Yes (generic; only requirement is C99 support, `auxdir/x_ac_c99.m4`, no version pin) | N/A (Slurm has no CI) | N/A | No riscv-specific compiler requirement found |
| GNU make | Build-dependency, critical | Yes (generic autotools) | N/A | N/A | No riscv-specific issues found |
| autoconf | Build-dependency, optional | Yes (generic; `auxdir/config.sub`/`config.guess` recognize riscv/riscv64/riscv32/riscv32be/riscv64be triplets as vendored upstream boilerplate) | N/A | N/A | Not Slurm-authored code |
| automake | Build-dependency, optional | Yes (generic) | N/A | N/A | No riscv-specific issues found |
| Munge | Runtime-dependency, critical (credential/auth crypto layer underpinning nearly all Slurm RPC auth) | Not queried via project-graph (tool unreachable this session); no riscv64-specific build issues found via GitHub issue search; only a historical, closed ARM64 CI issue (#150) turned up | No riscv64 CI evidence found | Not tracked in local registry (`projects.yml`) | Absence of hits is weak signal, not confirmed clean - [NEEDS VERIFICATION] |
| OpenSSL | Runtime-dependency, critical | Data not available specific to this research pass - not independently re-checked; OpenSSL has broad, well-established riscv64 support generally, but this was not verified against a primary source in this task | Data not available | Data not available | [NEEDS VERIFICATION] |
| PMIx | Runtime-dependency, optional (MPI job launch interop, `--with-pmix`) | Not queried via project-graph; semantic issue search returned no riscv64-relevant hits (only an unrelated s390x/ppc64 big-endian test-failure issue) | No riscv64 CI evidence found | Not tracked in local registry | Absence of hits is weak signal - [NEEDS VERIFICATION] |
| hwloc | Runtime-dependency, optional (CPU/NUMA topology-aware scheduling, `--with-hwloc`; drives core/socket/NUMA binding and task affinity) | Two closed riscv64 bugs found and fixed: [#536](https://github.com/open-mpi/hwloc/issues/536) ("Linux 5.15 exposes single core instead of 4 on Hive Unmatched riscv64 board"), [#473](https://github.com/open-mpi/hwloc/issues/473) (segfault on riscv64) | One open gap: [#650](https://github.com/open-mpi/hwloc/issues/650) ("get RISC-V CPU info on Linux") - topology/CPU-info detection on riscv64 is incomplete upstream | Tracked in local `projects.yml` (no dedicated report yet) | Directly relevant to Slurm's affinity/binding correctness on riscv64 nodes (Section 6) |
| json-c | Runtime-dependency, optional (REST API `slurmrestd`, internal serialization) | Zero riscv64 issues found (pure C parser, architecture-agnostic) | None found | Tracked in local `projects.yml` (no report yet) | No known problems |
| libcurl | Runtime-dependency, optional | Per local report `project-reports/reports/libcurl.md`: riscv64 is a Tier-2 CI-tested cross-compile target (musl static build only); not run in main Linux CI | Test suite never executed on riscv64 upstream | Reported as yellow in local registry | Full C implementation, not a stub |
| MariaDB Connector/C | Runtime-dependency, optional | Data not available - not researched this pass | Data not available | Data not available | [NEEDS VERIFICATION] |
| readline | Runtime-dependency, optional (CLI tooling, e.g. `sacctmgr`) | Per local report `project-reports/reports/readline.md` | - | Reported as yellow in local registry | - |
| zlib | Runtime-dependency, optional | Data not available - not researched this pass | Data not available | Data not available | [NEEDS VERIFICATION] |
| LZ4 | Runtime-dependency, optional (RPC/plugin payload compression) | Builds/works generically (pure integer C) | Per local report `project-reports/reports/lz4.md`: 5 open PRs (#1678, #1686, #1734, #1738, #1739) adding RISC-V Vector (RVV) optimizations, all stalled 4-7 months, no maintainer review, single-maintainer bottleneck; no open correctness bugs on riscv64 | Distro releases as generic C, no arch gating | Reported as yellow in local registry; active but unmerged riscv64/RVV work is the most engineering-active dependency in this table |
| HDF5 | Runtime-dependency, optional | Data not available - not researched this pass | Data not available | Data not available | [NEEDS VERIFICATION] |
| Lua | Runtime-dependency, optional (`job_submit/lua` plugin) | Per local report `project-reports/reports/lua.md`: pure ISO C99, no JIT/asm, unconditional platform-support policy | RISC-V required zero upstream work | Reported as yellow in local registry | - |
| libnuma | Runtime-dependency, optional | Data not available - not researched this pass | Data not available | Data not available | [NEEDS VERIFICATION] |
| ncurses | Runtime-dependency, optional | Data not available - not researched this pass | Data not available | Data not available | [NEEDS VERIFICATION] |
| Tcl | Test-dependency, optional | Data not available - not researched this pass | Data not available | Data not available | [NEEDS VERIFICATION] |
| s2n-tls | (Additional, indirect) TLS backend for inter-daemon TLS support, `--with-s2n` | Zero riscv64 issues/PRs found at all on aws/s2n-tls | No signal either way | Not tracked in local registry | Unverified, not "clean" - absence of data, not confirmation |
| UCX | (Additional, indirect) High-performance networking transport, `--with-ucx` | No riscv64 issues found (only ARM64/ppc64 historical transport bugs, closed) | No riscv64 CI evidence found | Not tracked in local registry | [NEEDS VERIFICATION] |
| libjwt | (Additional, indirect) JWT auth for `slurmrestd`, `--with-jwt` | No riscv64 issues found (only an unrelated armv7l/raspbian base64 bug, closed) | No riscv64 CI evidence found | Not tracked in local registry | - |
| libyaml | (Additional, indirect) YAML config/output support, `--with-yaml` | Zero riscv64 issues found | None found | Tracked in local `projects.yml` (no report yet) | - |
| systemd (libsystemd) | (Additional, indirect) Service notification/socket activation | Tracked in local registry with a report (`project-reports/reports/systemd.md`); not deep-read this pass | - | Tracked, reported | - |

**Deep-dive: hwloc.** This is the dependency most directly relevant to riscv64 correctness in Slurm's day-to-day operation, because Slurm relies on it for CPU/NUMA-aware scheduling and task affinity binding (Section 6). hwloc has a documented history of two now-fixed riscv64 bugs and one still-open gap in RISC-V CPU-info detection ([#650](https://github.com/open-mpi/hwloc/issues/650)), meaning topology-aware scheduling accuracy on riscv64 nodes cannot currently be assumed to match arm64/amd64.

**Deep-dive: LZ4.** The dependency with the most active riscv64 engineering activity of any in this table - five open, stalled pull requests adding RVV optimizations, blocked on a single-maintainer review bottleneck. Nothing has merged. This is a candidate for engineering investment to unblock (Section 14).

**Cross-cutting caveat:** The local `project-graph` MCP database (used for cross-checking Ubuntu/Debian riscv64 packaging status across all dependencies) failed to connect throughout this research (`CONNECTION_CLOSED`) - this is a tooling failure, not evidence of absence. The "riscv64 build" column above should be re-verified against that database once it is reachable, particularly for munge, PMIx, s2n-tls, UCX, MariaDB Connector/C, HDF5, libnuma, ncurses, and Tcl, none of which were independently confirmed on Ubuntu riscv64 in this pass.

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| - | No riscv64-related issue exists in SchedMD/slurm | N/A | N/A | Confirmed via `search_issues` queries `"riscv64 performance repo:SchedMD/slurm"`, `"riscv64 bug repo:SchedMD/slurm is:open"`, `"riscv nan floating repo:SchedMD/slurm"`, and the broad fallback `"riscv repo:SchedMD/slurm"` - all return zero results. The specific "riscv nan floating" bug some earlier query anticipated does not exist; flagged explicitly to avoid implying a fabricated issue is real. |
| hwloc #650 | "get RISC-V CPU info on Linux" | Open (in hwloc, not Slurm) | Medium (affects topology detection Slurm depends on) | [open-mpi/hwloc#650](https://github.com/open-mpi/hwloc/issues/650) |
| hwloc #536 | "Linux 5.15 exposes single core instead of 4 on Hive Unmatched riscv64 board" | Closed/fixed | N/A (historical) | [open-mpi/hwloc#536](https://github.com/open-mpi/hwloc/issues/536) |
| hwloc #473 | segfault on riscv64 | Closed/fixed | N/A (historical) | [open-mpi/hwloc#473](https://github.com/open-mpi/hwloc/issues/473) |
| lz4 #1678, #1686, #1734, #1738, #1739 | RVV optimization PRs | Open, stalled 4-7 months | Low (performance, not correctness) | Per local report `project-reports/reports/lz4.md`; single-maintainer review bottleneck |

**No correctness bugs specific to Slurm on riscv64 were found.** No benchmark data specific to Slurm's own scheduling performance on riscv64 (dispatch latency, job throughput) was found anywhere. Adjacent HPC-hardware benchmark data that happens to use Slurm as infrastructure (not as the object measured) exists:

- **Monte Cimone cluster** ([arXiv:2205.03725](https://arxiv.org/abs/2205.03725)) - an 8-node SiFive U740 (RV64GCB) cluster using Slurm as its job scheduler. HPL single-node: 1.86 +/- 0.04 GFLOP/s = 46.5% of theoretical peak, versus a comparator ARM64 node (Armida) at 65.79% of peak. STREAM (4 threads): 1945.5 MB/s DDR-bound = 15.5% of peak bandwidth, versus Armida (ARM64) at 63.21% of peak. On this data, the ARM64 comparator node consistently reaches a higher fraction of peak than the RISC-V node in both compute and memory bandwidth - this reflects the SiFive U740 CPU's characteristics, not Slurm.
- **SG2042 characterization paper** ([arXiv:2406.12394](https://arxiv.org/abs/2406.12394)) - 64-core RISC-V CPU benchmarked against AMD EPYC, Intel Skylake, and Marvell ThunderX2 (ARM64) using NAS Parallel Benchmarks. No Slurm mention. 64-core scaling: SG2042 underperforms EPYC by 1.77x-15.06x and ThunderX2 (ARM64) by 0.59x-5.91x depending on benchmark, with memory subsystem/bandwidth identified as the primary bottleneck.
- **HPX PR #5968** ([STEllAR-GROUP/hpx](https://github.com/STEllAR-GROUP/hpx/pull/5968), merged 2022-07-29) - used Slurm 20.11.4 for cluster/job management on a SiFive HiFive Unmatched board; reported rough parity ("=" / "(=)") versus baseline across Fork Join/Parallel/Scheduler executor and STREAM sub-tests, but with no numeric ARM64 comparison in this PR (RISC-V only).

No dedicated "Slurm riscv64 vs arm64 performance" report, slide deck, or benchmark repository was found despite targeted web searches.

## 12. Objections and Upstream Blockers

**Stated objections/policy:** SchedMD's official platforms page omits riscv64 from all support tiers (tested, limited, or aspirational) - Section 3. `CONTRIBUTING.md` states changes to `configure.ac` or `auxdir/*` "will take additional time to review" due to the breadth of distributions and architectures Slurm already supports, indicating deliberate caution toward touching the build-system files a riscv64 enablement effort would need to modify.

**Technical blockers:** None found that are Slurm-specific - the codebase is portable C with no architecture-exclusive dependency. The practical blocker is indirect: hwloc's open riscv64 CPU-info-detection gap (#650) would need to close for Slurm's topology-aware scheduling to be fully correct on riscv64, and this is outside Slurm's own control.

**Organizational blockers:** SchedMD is now part of NVIDIA (Section 1); NVIDIA is a RISE Premier member, but no evidence connects that membership to any Slurm-specific RISC-V initiative - Slurm/SchedMD does not appear on the RISE member list itself, and no RISE blog post, GitHub org repo, or funded project references Slurm (exhaustively checked: all ~32-34 RISE blog posts via sitemap, the full `riseproject-dev` GitHub org repo list, and the RISE Python wheel builder page). There is no known RFP, grant, or funded initiative targeting Slurm.

**Acceptance probability:** Given (a) zero deliberate riscv64-Linux work has ever been proposed or merged, (b) the one merged riscv-related patch was a narrow, externally volunteered FreeBSD fix rather than a Linux enablement effort, (c) `CONTRIBUTING.md`'s explicit high-scrutiny policy for build-system changes, and (d) no RISE or NVIDIA-driven initiative exists to date - a hypothetical riscv64-Linux enablement PR (e.g., adding CI or claiming tested-platform status) would likely face slower-than-normal review per the project's own stated policy, but there is no evidence of active resistance either; the situation is best characterized as neutral/unaddressed rather than blocked. [NEEDS VERIFICATION: no direct maintainer statement on riscv64 acceptance was found either way.]

## 13. Readiness Assessment

- **Color:** yellow (clean-distro-build) - from skill output
- **Release provider:** Ubuntu (distro) - no upstream riscv64 release exists; SchedMD does not publish riscv64 (or any architecture's) prebuilt binaries
- **Optimization gap:** N/A - Slurm is not an optimization-purpose project (Section 2/Step 2 of the color model does not apply; it is a cluster/workload orchestration daemon with no JIT, SIMD, or numerics kernels of its own that would define a "faster than generic C" value proposition)

**Justification:** SchedMD/slurm has no CI system of any kind in-repo - no `.github/workflows`, `.gitlab-ci.yml`, `Jenkinsfile`, or `.cirrus.yml` exist, confirmed both by direct filesystem inspection of a local clone and by a zero-result GitHub code search for `path:.github/workflows` in the repository. There is therefore no upstream riscv64 build or test signal for any architecture. Applying the color model's distribution floor: Ubuntu 26.04 ("resolute") packages `slurm-wlm` and `slurmd` for riscv64 ([packages.ubuntu.com/resolute/riscv64/slurm-wlm](https://packages.ubuntu.com/resolute/riscv64/slurm-wlm)) as an unmodified build of upstream source, with no riscv64-specific patches present in the packaging diff, tagged `[ports][universe]`. A clean (unpatched) distro build with no upstream CI sets the floor at **yellow**, not orange - the project builds from vanilla upstream on riscv64, it is simply untested and unreleased by SchedMD itself.

**Pending work that could change the grade:** No open PRs, issues, or tracked riscv64 enablement effort exist against SchedMD/slurm. The single merged riscv-related commit (2025-11-08, external volunteer, FreeBSD-only linker fix) does not touch Linux/riscv64 and would not move the grade. No RISE Project involvement was found anywhere. SchedMD's acquisition by NVIDIA (~Oct 2025) has produced no stated riscv64 roadmap item to date. The grade would move to orange only if Ubuntu's build were found to require riscv64-specific patches (not the case today); it would move to blue or green only if SchedMD stood up CI (currently none exists for any architecture) with a riscv64 job that runs tests and/or SchedMD begins publishing riscv64 artifacts directly.

## 14. Investment Analysis

RISE has done no work on Slurm to date - no blog posts, no funded projects, no GitHub org involvement, no wheel-builder coverage were found anywhere in RISE's public output (Section 1, Section 12). Nothing below is already covered by prior RISE investment; all items are unstarted.

### 14.1 Functional Enablement

Core functionality already works via the Ubuntu distro build (unpatched upstream source), so there is no blocking functional gap to close for basic operation. The concrete functional risk is indirect: hwloc's open riscv64 CPU-info-detection gap (#650) affects Slurm's topology-aware scheduling and task-affinity binding correctness on riscv64 nodes. Closing this requires upstream hwloc engineering, not Slurm-side work, but Slurm's own validation against a fixed hwloc would still be needed (manual testing on riscv64 hardware, since no CI exists to automate this for any architecture).

### 14.2 Performance Optimization

Not applicable in the traditional sense - Slurm has no per-architecture optimized code paths for any architecture (Section 4), so there is no "RISC-V is missing what x86_64/arm64 already has" performance gap to close within Slurm itself. Any performance characterization work would need to start from scratch (no baseline Slurm-specific riscv64 benchmark exists at all - Section 11) and would likely be dominated by the underlying CPU/memory-subsystem characteristics documented in the Monte Cimone and SG2042 papers, not by Slurm's own code.

### 14.3 CI/CD Infrastructure

The highest-leverage investment: SchedMD has no CI pipeline of any kind, for any architecture. Standing up CI (GitHub Actions, since SchedMD is on GitHub) that builds and runs Slurm's test suite on riscv64 - potentially using RISE RISC-V runners - would both establish a riscv64 signal and, as a side effect, give Slurm CI for the first time on any architecture. This is a larger lift than typical "add riscv64 to existing CI" work because there is no existing CI to extend.

### 14.4 Ecosystem Enablement

Not applicable - Slurm has no dependent package ecosystem of its own (Section 10 omitted per task instructions; Slurm is consumed as a system daemon/service, not as a library with a package-manager dependency graph). The relevant ecosystem-adjacent work is instead in Slurm's own dependencies (Section 9), most notably closing hwloc #650 and unblocking the five stalled LZ4 RVV PRs, both of which are external projects outside Slurm's own repository.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Validate Slurm topology/affinity behavior on riscv64 once hwloc #650 is resolved (manual testing, no CI exists to automate) | 1-2 | Slurm/riscv64 integrator | Medium |
| CI/CD | Stand up GitHub Actions CI for Slurm (build + test), including a riscv64 job - first CI of any kind for the project | 4-8 | SchedMD/NVIDIA or external contributor with RISE runner access | High |
| Dependency | Contribute maintainer review bandwidth or a co-maintainer to unblock the 5 stalled LZ4 RVV PRs (#1678, #1686, #1734, #1738, #1739) | 1-3 | RISE or interested chip vendor | Medium |
| Dependency | Fund or contribute to closing hwloc #650 (RISC-V CPU-info detection) | 2-4 | RISE or interested chip vendor | Medium |
| Release | Engage SchedMD/NVIDIA to add riscv64 to the official platforms.shtml tested-architecture list, contingent on CI existing first | 1 (advocacy/coordination only) | RISE or chip-company liaison | Low |
| Distro | Verify and, if needed, upstream-patch any riscv64-specific packaging fixes for Debian/Fedora/Arch to reach parity with the Ubuntu ports/universe build | 1-2 | Distro maintainers / RISE | Low |

## 15. Updates

(No updates yet - initial report dated 2026-09-12.)

## 16. References

- [Slurm homepage](https://slurm.schedmd.com/)
- [SchedMD/slurm GitHub repository](https://github.com/SchedMD/slurm)
- [SchedMD/slurm configure.ac](https://github.com/SchedMD/slurm/blob/master/configure.ac)
- [SchedMD/slurm auxdir/config.sub](https://github.com/SchedMD/slurm/blob/master/auxdir/config.sub)
- [SchedMD/slurm auxdir/config.guess](https://github.com/SchedMD/slurm/blob/master/auxdir/config.guess)
- [Slurm supported platforms](https://slurm.schedmd.com/platforms.html)
- [Ubuntu resolute riscv64 slurm-wlm package](https://packages.ubuntu.com/resolute/riscv64/slurm-wlm)
- [Ubuntu resolute riscv64 slurmd package](https://packages.ubuntu.com/resolute/riscv64/slurmd)
- [Ubuntu mantic riscv64 slurm-client package](https://packages.ubuntu.com/mantic/riscv64/slurm-client)
- [Debian packages search: slurm](https://packages.debian.org/search?keywords=slurm)
- [Arch Linux RISC-V package status (slurm query, unresolved)](https://archriscv.felixc.at/?q=slurm)
- [PyPI slurm package JSON (unrelated third-party wrapper)](https://pypi.org/pypi/slurm/json)
- [RISE Python wheel builder PyPI mirror endpoint for slurm](https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/slurm/)
- [RISE Project member list](https://riseproject.dev/members/)
- [RISE Project blog](https://riseproject.dev/blog)
- [RISE RISC-V Runners announcement](https://riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github/)
- [RISE RISC-V Runners: Six Weeks In](https://riseproject.dev/2026/05/12/rise-risc-v-runners-six-weeks-in/)
- [RISE Python wheel builder page](https://riseproject.gitlab.io/python/wheel_builder/)
- [SchedMD Bugzilla tracker](https://bugs.schedmd.com/)
- [hwloc issue #650: get RISC-V CPU info on Linux](https://github.com/open-mpi/hwloc/issues/650)
- [hwloc issue #536: Hive Unmatched riscv64 core-count bug](https://github.com/open-mpi/hwloc/issues/536)
- [hwloc issue #473: segfault on riscv64](https://github.com/open-mpi/hwloc/issues/473)
- [LZ4 PR #1678: RVV optimization](https://github.com/lz4/lz4/pull/1678)
- [LZ4 PR #1686: RVV optimization](https://github.com/lz4/lz4/pull/1686)
- [LZ4 PR #1734: RVV optimization](https://github.com/lz4/lz4/pull/1734)
- [LZ4 PR #1738: RVV optimization](https://github.com/lz4/lz4/pull/1738)
- [LZ4 PR #1739: RVV optimization](https://github.com/lz4/lz4/pull/1739)
- [Monte Cimone: Paving the Road for the First Generation of RISC-V High-Performance Computers (arXiv:2205.03725)](https://arxiv.org/abs/2205.03725)
- [Performance characterisation of the 64-core SG2042 RISC-V CPU for HPC (arXiv:2406.12394)](https://arxiv.org/abs/2406.12394)
- [Is RISC-V ready for HPC prime-time: Evaluating the 64-core Sophon SG2042 RISC-V CPU (arXiv:2309.00381)](https://arxiv.org/abs/2309.00381)
- [HPX PR #5968 (Slurm 20.11.4 used for RISC-V CI on SiFive HiFive Unmatched)](https://github.com/STEllAR-GROUP/hpx/pull/5968)
- Local reference reports consulted: `project-reports/reports/lz4.md`, `project-reports/reports/libcurl.md`, `project-reports/reports/readline.md`, `project-reports/reports/lua.md`, `project-reports/reports/systemd.md`; local registry `projects.yml` (paths internal to the research environment, not publicly linkable)