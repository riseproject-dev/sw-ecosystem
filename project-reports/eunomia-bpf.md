---
title: eunomia-bpf
parent: Project Reports
color: orange
---

{% include dependency-graph.html slug="dependencies" subset="eunomia-bpf" %}

# eunomia-bpf

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-09-11<br/>
**Readiness:** orange<br/>
**Scope:** RISC-V (riscv64/linux) support status for eunomia-bpf<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

eunomia-bpf is an eBPF development toolchain: an eBPF-to-bytecode compiler (`ecc`), a BPF loader/CLI (`ecli`), and a WASM-based eBPF runtime (`wasm-bpf`). It is not a SIMD/JIT/numerics library in its own right - the JIT, verifier, and codegen complexity it depends on lives in LLVM, libbpf, and Wasmtime.

**Governance:** No foundation affiliation. There is no MAINTAINERS, OWNERS, CODEOWNERS, GOVERNANCE, SUPPORT.md, or PLATFORMS.md file anywhere in the repository. CONTRIBUTING.md describes an informal review process ("members of the team will review your code... at least one member of the project team will ultimately approve") with no named maintainer tiers or council. License is MIT.

**RISE Project membership:** Confirmed absent. eunomia-bpf is not listed among the [RISE Premier or General members](https://riseproject.dev/members/), and none of the 34 posts on the [RISE blog](https://riseproject.dev/blog) (enumerated via the site's WordPress sitemap) reference eunomia-bpf, eBPF, or BPF in any form.

**Corporate sponsors:** None identifiable. Top contributors by commit count are individuals with no published employer affiliation: yunwei37 (Yusheng Zheng, project founder/lead, 304+42 commits), Littlefisher619 (50), ocfox (43), Officeyutong (42+28), oluceps (24, author of the RISC-V port), yang miao (22+3), Team317 (20+13). This reads as an individual/academic-led project rather than a corporately sponsored one.

**Community culture on new ports:** Informal, PR-driven, no special RFC/tiering process. MIPS, PowerPC, and RISC-V vmlinux/BTF support were all added together in one ordinary contributor commit and reviewed the same way as any other feature PR.

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2023-01-29 | Issue #112 opened by maintainer yunwei37: "[FEATURE] Add riscv and other platforms support" | [Issue #112](https://github.com/eunomia-bpf/eunomia-bpf/issues/112) |
| 2023-02-22/23 | Contributor oluceps logs raw riscv64 example-program test failures in a gist (pre-implementation groundwork) | [Gist](https://gist.github.com/oluceps/c9b51315fc438607c415f78c7c0d5add) |
| 2023-02-26 | Discussion #147 opened by oluceps: "Platforms Support Status Tracking" - compatibility test matrix across aarch64/riscv64/mips/powerpc | [Discussion #147](https://github.com/eunomia-bpf/eunomia-bpf/discussions/147) |
| 2023-02-26 | Issue #146 opened by oluceps: "CI test enhancement for RISC-V and MIPS, aarch64, etc." proposing `run-on-arch-action` for riscv64 CI | [Issue #146](https://github.com/eunomia-bpf/eunomia-bpf/issues/146) |
| 2023-03-04 | Companion PR eunomia-bpf/wasm-bpf#52 opened (ships riscv64 vmlinux.h) | [wasm-bpf#52](https://github.com/eunomia-bpf/wasm-bpf/pull/52) |
| 2023-03-04 | PR #152 opened by oluceps: "Add RISC-V and MIPS support for eunomia-bpf" | [PR #152](https://github.com/eunomia-bpf/eunomia-bpf/pull/152) |
| 2023-03-05 | PR #152 and wasm-bpf#52 merged same day by yunwei37; Issue #112 closed as completed | [PR #152](https://github.com/eunomia-bpf/eunomia-bpf/pull/152) |
| 2023-03-07 | v0.3.4 tagged - first release whose source history includes the RISC-V commit | Git tag verification against clone |
| 2026-03-08 | Issue #146 closed as "completed" - but riscv64 CI was never actually implemented (verified: zero riscv64 references in any of 15 current `.github/workflows/` files) | [Issue #146](https://github.com/eunomia-bpf/eunomia-bpf/issues/146) |
| 2026-09-03 | eunomia-bpf/bpftime#664 opened: "[FEATURE] Basic support for RISCV" | [bpftime#664](https://github.com/eunomia-bpf/bpftime/issues/664) |
| 2026-09-08 | bpftime#664 closed as completed | [bpftime#664](https://github.com/eunomia-bpf/bpftime/issues/664) |

**Key contributors:** oluceps (`i@oluceps.uk`) implemented the riscv/mips port and went on to be a regular contributor through late 2023 (CI, ecc/ecli work), not a one-off drive-by port; no employer affiliation found. yunwei37 (Yusheng Zheng), the project founder, personally reviewed and merged PR #152 the same day it landed.

**Is it fully upstream?** Partially. The source-level change (arch-name mapping plus a genuinely-generated riscv64 vmlinux.h BTF header) is merged to `master` and has shipped in every release since v0.3.4 as buildable source. It was never wired into CI (issue #146, which proposed exactly this, was closed without implementation) and no riscv64 binary has ever been published in a GitHub Release. Several example programs were documented as broken on riscv64 at merge time (Discussion #147) with no found follow-up fix.

## 3. Upstream Support Tier

No formal platform-support tier policy exists (no PLATFORMS.md, no documented tier language beyond an unrelated internal marketing document). The README states Docker images are provided "for x86_64 and aarch64" only, and release workflows only build/publish `x86_64-unknown-linux-gnu` and `aarch64-unknown-linux-gnu` targets.

| | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI build | Yes (native `ubuntu-latest`/`ubuntu-22.04` runners) | Yes (QEMU cross-compile via `run-on-arch-action`, `ecc-image-aarch64.yml`) | No |
| CI test execution | Data not available: workflow content beyond job/runner inventory was not read line-by-line for test-step semantics | Data not available: same limitation | No (no job exists) |
| Release-blocking | Implied (primary target) | Yes (dedicated aarch64 image workflow) | N/A - no job |
| Official binaries | `ecc`, `ecc-x86_64`, `ecli`, `ecli-x86_64-unknown-linux-gnu.tar.gz` | `ecc-aarch64`, `ecli-aarch64` | None in any of the last 5 releases checked (v1.0.34-v1.0.38) |

## 4. Technical Architecture and RISC-V-Specific Subsystems

eunomia-bpf has no JIT, SIMD, crypto, GC, or hand-written assembly of its own. Code search for `__riscv`, `cfg(target_arch)`, `target_arch`, RVV intrinsics, and `.S` files returned zero matches. The only architecture-specific code in the repository consists of two arch-name-mapping shims used solely to select which pre-generated `vmlinux.h` BTF header to build against:

- `compiler/Makefile:9` - a `sed` chain: `... | sed 's/riscv64/riscv/'` selecting `../third_party/vmlinux/$(ARCH)/vmlinux.h`
- `compiler/cmd/src/helper.rs` `get_target_arch()` - a Rust `match` with `"riscv64" => "riscv"` as one arm among x86_64/aarch64/powerpc64/mips64

Both are generic string-mapping code, identical in kind and weight to every other architecture's arm - there is no riscv-specific branching, tuning, or fallback logic.

A genuinely-generated data artifact was added alongside the shim: `third_party/vmlinux/riscv/vmlinux_519.h` (110,564 lines, 2.36 MB, 11,248 struct/union/typedef declarations, generated via `bpftool btf dump c` against a riscv64 Linux 5.19 kernel's BTF) - comparable in scale to the x86 (128,607 lines) and arm64 (160,927 lines) equivalents shipped alongside it, now hosted in the separate `eunomia-bpf/vmlinux` submodule.

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Arch-name mapping shim | Generic match arm | Generic match arm | Generic match arm (identical mechanism) |
| vmlinux.h BTF header | Full (128,607 lines) | Full (160,927 lines) | Full (110,564 lines) - genuinely generated, not a stub |
| JIT / codegen | Delegated to LLVM/libbpf/kernel | Delegated to LLVM/libbpf/kernel | Delegated to LLVM/libbpf/kernel (see Section 9 for their riscv64 status) |

The real architecture-specific risk for eunomia-bpf therefore lives entirely in its dependencies (Section 9), not in code it owns.

## 5. Build System, Cross-Compilation, and Toolchain

**Build system:** No CMake exists anywhere in the repository (zero `CMakeLists.txt` files) - despite the original tracking issue #112 explicitly requesting riscv64 support "under CMake," the build system was moved entirely to GNU Make (drives `ecc`) plus Cargo/Rust (`ecli`, `bpf-loader-rs`, `eunomia-sdks`). No BUILDING.md, INSTALL, or docs/cross-compilation.md exists in-repo; the README points to an external docs site.

**Toolchain used at implementation time (PR #152 author's stated test environment):** Ubuntu 22.10 (Kinetic Kudu), riscv64, cargo 1.67.0, clang 15.0.6. No minimum-version requirement is documented anywhere for riscv64 (none is documented for aarch64 either).

**QEMU usage:** QEMU cross-compilation (`uraimo/run-on-arch-action@v2`) is used only with `arch: aarch64` in `ecc-binary.yml`, `ecc-image-aarch64.yml`, and `ecli-binary.yaml`. No riscv64 invocation exists anywhere, even though `run-on-arch-action` itself supports a riscv64 option.

**Dockerfiles:** Only `ecli/dockerfile`, `compiler/dockerfile`, and `compiler/dockerfile.aarch64` exist. No `dockerfile.riscv64`.

**Known build failures:** None documented at compile time - PR #152's author reports the source built successfully on riscv64. Known failures are at runtime (load/attach), documented in Section 6.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

Discussion #147's compatibility test matrix (run against the `examples/` suite on Ubuntu 22.10 riscv64) found 12 of 16 examples pass; 4 fail:

| Example | Exact error |
|---|---|
| `bootstrap` | `"unknown func bpf_probe_read_str#45"`, `"BPF program load failed: Invalid argument"` |
| `fentry-link` | `"failed to auto-attach: -524"` (ENOTSUPP) |
| `lsm-connect` | `"failed to auto-attach: -524"`, `"unknown type: __u32"` |
| `mdflush` | `"failed to auto-attach: -524"` plus `preserve_access_index` attribute warnings |
| `opensnoop` | `"failed to determine tracepoint 'syscalls/sys_enter_open' perf event ID: No such file or directory"` |

For comparison, aarch64 hit near-identical `-524` auto-attach failures and the same missing-tracepoint issue on the same test VM in the same matrix, suggesting these are kernel/verifier-support gaps on the specific test kernel rather than eunomia-bpf-specific riscv64 bugs [NEEDS VERIFICATION - not independently re-tested against a current kernel]. No follow-up issue or PR addressing these four failures was found.

**Performance gaps:** No RISC-V performance benchmark data exists for eunomia-bpf. The project's own benchmark suite, `eunomia-bpf/bpf-benchmark`, only supports `ARCH=x86` (local KVM) and `ARCH=arm64` (AWS) - riscv64 is not a supported target and is not mentioned anywhere in its README.

**Security hardening gaps:** Data not available: no eunomia-bpf-specific security-hardening comparison across architectures was found in any source searched.

**NaN / floating-point semantics:** No issue mentioning NaN or floating-point behavior on RISC-V was found in eunomia-bpf or bpftime issue trackers (explicit searches returned zero hits). General qualitative industry commentary exists (unrelated to eunomia-bpf specifically): a [The New Stack article](https://thenewstack.io/the-risc-architecture-frontier-is-ebpf-ready-for-arm64-and-risc-v/) (2026-02-10) quotes Grafana Labs and Isovalent/Cisco engineers stating the RISC-V eBPF JIT is "younger" than x86/arm64, "results in more verbose instruction sequences," and shows "slightly higher CPU usage per probe execution" at "10k+ events/sec" - no numeric figures given, and eunomia-bpf is not mentioned in the article.

## 7. CI/CD Infrastructure

**No riscv64 CI exists.** Verified by reading all 15 files in `.github/workflows/` directly: `build-static-bpf-loader-c-wrapper.yml`, `c-cpp-lint.yml`, `codeql-analysis.yml`, `ecc-binary.yml`, `ecc-image-aarch64.yml`, `ecc-image-x86_64.yml`, `ecli-binary.yaml`, `ecli-image.yml`, `eunomia-bpf.yml`, `example-publlish.yml`, `examples.yml`, `greetings.yml`, `labeler.yml`, `nix.yml`, `release-coordinator.yml`. `grep -rin "riscv" .github/workflows/` returns zero matches (exit code 1). No `.gitlab-ci.yml`, `Jenkinsfile`, or `.cirrus.yml` exists at repo root.

No RISE runner usage was found anywhere in the CI configuration.

| | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Runner | `ubuntu-latest`, `ubuntu-22.04` (native) | `ubuntu-24.04-arm` (native, some jobs) + `run-on-arch-action` QEMU (others) | None |
| Build job exists | Yes | Yes (`ecc-image-aarch64.yml`, `compiler/dockerfile.aarch64`) | No |
| Test execution | Data not available (job-level test semantics not fully enumerated) | Data not available (same) | N/A - no job |
| RISE runners used | No | No | No |

## 8. Distribution and Release Status

**GitHub Releases:** Checked v1.0.34 through v1.0.38 (5 most recent releases). Asset list is identical in pattern across all: `ecc`, `ecc-aarch64`, `ecc-x86_64`, `ecli`, `ecli-aarch64`, `ecli-x86_64-unknown-linux-gnu.tar.gz`, source zip/tar.gz, release attestation JSON. **Zero riscv64 assets in any release.**

**PyPI:** `https://pypi.org/pypi/eunomia-bpf/json` returns HTTP 404. A PyPI search for "eunomia" returns zero results. The package does not exist on PyPI under any name, for any architecture.

**RISE wheel builder:** `https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/eunomia-bpf/` redirects (HTTP 302) to the same missing PyPI page. No RISE-built wheel exists.

**Ubuntu 26.04 (resolute):** `packages.ubuntu.com` search for `eunomia-bpf` returns "Sorry, your search gave no results" - not packaged for any architecture, not just riscv64.

**Arch Linux RISC-V:** Not applicable - eunomia-bpf is not an official Arch Linux package to begin with, so the Arch RISC-V rebuild-of-official-repo channel does not apply.

**What a user must do today to get a working riscv64 binary:** Build from source manually, following the precedent set by PR #152's author (Ubuntu 22.10 riscv64, cargo 1.67.0, clang 15.0.6). No automated, packaged, or officially-published path exists on any channel checked.

## 9. Dependencies

| Dependency | Role in eunomia-bpf | riscv64 build | riscv64 test | riscv64 release | Community / notes |
|---|---|---|---|---|---|
| **Rust** | Language/toolchain for `ecli`, `bpf-loader-rs`, `eunomia-sdks`, `compiler/cmd` | Data not available in this research pass (not directly researched as a standalone dependency here) | Data not available | Data not available | Direct build-dependency, critical |
| **cargo** | Rust build/package manager driving all Rust-workspace crates | Data not available in this research pass | Data not available | Data not available | Direct build-dependency, critical |
| **LLVM** | Compiles eBPF C source to BPF bytecode via `clang`/`clang-sys` crates in `compiler/cmd` (ecc-rs); required at build time for any BPF object libbpf loads | Ubuntu 26.04 (resolute) ships `llvm`/`llvm-17` through `llvm-22` for riscv64 (corroborated via packages.ubuntu.com; project-graph query could not be run - CONNECTION_CLOSED) | riscv64 absent from LLVM's required pre-merge CI (`premerge.yaml`); only `libc/**`-scoped QEMU execution exists | No riscv64 binaries in upstream LLVM GitHub Releases; Ubuntu (resolute) is the release path | Several open correctness bugs on riscv64 codegen reported in a companion dependency report (`project-reports/llvm.md`) - NaN sign handling, miscompiles at -O2/-O3, infinite loop with stack-clash-protection, asm-goto crash |
| **libbpf** | Loads/verifies BPF objects, BTF/CO-RE, map/program management (via `libbpf-rs` and the `third_party/bpftool` C submodule) | Ubuntu 24.04 ships `libbpf1`/`libbpf-dev`/`libbpfcc`/`libbpfcc-dev` for riscv64 (project-graph query not run - CONNECTION_CLOSED; corroborated via Debian buildd) | No upstream riscv64 CI (no build.yml entry, no vmtest); distro QA only | Source archives only upstream; riscv64 binary available only via Debian/Ubuntu packages | No open riscv64 issues in libbpf itself; kernel JIT gaps affect libbpf users (1-/2-byte RMW atomics unsupported, bpf2bpf+tailcall mixing denylisted on riscv64, BPF exceptions unsupported as of an unmerged 2026-06-21 patch) - see `project-reports/libbpf.md` |
| **bpftool** | Bundled C submodule (`third_party/bpftool`) providing the BTF-dump tooling used to generate `vmlinux.h` headers, and bundling libbpf in C | Data not available: not independently researched beyond its libbpf-bundling role | Data not available | Data not available | Direct build-dependency, critical |
| **wasm-bpf** | WASM-based eBPF loader runtime; companion repo `eunomia-bpf/wasm-bpf`, PR #52 shipped MIPS/riscv64/PowerPC `vmlinux.h` and was a prerequisite merged same day as PR #152 | Merged riscv64 support alongside eunomia-bpf#152 (PR eunomia-bpf/wasm-bpf#52, tested on Debian 11 bullseye/mipsel by the author, riscv64 vmlinux.h shipped but not independently riscv64-tested in that PR's stated environment) | No dedicated CI found | No dedicated riscv64 release found | Direct build-dependency, critical; pulls in **Wasmtime** transitively via `wasm-bpf-rs` |
| **Linux kernel** | Runtime target: BPF verifier, JIT, tracepoint/attach infrastructure that all eunomia-bpf examples exercise | N/A (not a build artifact of eunomia-bpf) | Kernel-side riscv64 BPF gaps documented indirectly via example failures (Section 6) and via libbpf's kernel JIT gap notes above | N/A | Direct build-dependency, critical; the `-524`/ENOTSUPP attach failures and missing-tracepoint failure in Section 6 are most plausibly kernel/BTF-side limitations on the specific test kernel used, not eunomia-bpf bugs [NEEDS VERIFICATION] |
| Wasmtime (indirect, via wasm-bpf-rs, default-on) | JIT/AOT engine for the WASM-based eBPF loader path (`ecli-lib`'s default-on `native-client` feature) | Genuine QEMU-executed riscv64 test job exists upstream, conditionally gated | Yes, when the gated job runs | **Yes** - official `wasmtime-v48.0.1-riscv64gc-linux.tar.xz` published on GitHub Releases | Tier 3 ("not production ready" per Wasmtime's own tiering); 8 open correctness bugs including two soundness-relevant (unaligned-atomic bus error, partial OOB writes); Winch baseline JIT has zero riscv64 backend - see `project-reports/wasmtime.md` |
| OpenSSL (indirect, via `reqwest` in `ecli-lib`) | TLS backend for OCI-registry pull/push | Ubuntu 24.04 core `openssl` supports riscv64 | Mature unconditional cross-compile CI plus a 13-configuration matrix via QEMU | Source-only upstream; riscv64 via Debian/Ubuntu/Arch packages | Critical security gap: AES T-table fallback used on hardware lacking Zkn/Zvkned is not constant-time (fix PRs open, unmerged) - see `project-reports/openssl.md` |
| zlib (indirect, transitive via libbpf/bpftool BTF decompression, and `flate2` in `compiler/cmd`) | Compressed-BTF decompression, object compression in ecc-rs | Ubuntu 24.04 `zlib1g`/`zlib1g-dev` for riscv64 | No dedicated Linux riscv64 CI (only OpenBSD/riscv64 via QEMU) | Source-only upstream; riscv64 via distro packages | No correctness issues; performance-only gap (RVV Adler32 PR open 8+ months, unreviewed) - see `project-reports/zlib.md` |

Deep-dive companion reports referenced above: `project-reports/libbpf.md`, `project-reports/llvm.md`, `project-reports/wasmtime.md`, `project-reports/openssl.md`, `project-reports/zlib.md`.

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [Issue #112](https://github.com/eunomia-bpf/eunomia-bpf/issues/112) | Add riscv and other platforms support | Closed (completed), 2023-03-05 | N/A (feature request) | Resolved by PR #152 |
| [Issue #146](https://github.com/eunomia-bpf/eunomia-bpf/issues/146) | CI test enhancement for RISC-V and MIPS, aarch64, etc. | Closed (completed), 2026-03-08 | Medium (no regression protection) | riscv64 CI never actually implemented despite closure; only aarch64 CI materialized (verified by direct repo grep) |
| [PR #152](https://github.com/eunomia-bpf/eunomia-bpf/pull/152) | Add RISC-V and MIPS support for eunomia-bpf | Merged, 2023-03-05 | N/A | Source-level support only; no CI/release follow-through |
| [Gist (oluceps, Feb 2023)](https://gist.github.com/oluceps/c9b51315fc438607c415f78c7c0d5add) | riscv test of eunomia-bpf (errors) | Informal, not a filed issue | High (correctness) | 4 of 16 examples fail to load/attach on riscv64: `bootstrap`, `fentry-link`, `lsm-connect`, `mdflush`, `opensnoop` |
| [bpftime#664](https://github.com/eunomia-bpf/bpftime/issues/664) | Basic support for RISCV (sibling repo, not eunomia-bpf itself) | Closed (completed), 2026-09-08 | N/A | Most recent RISC-V-related activity found; comment content not accessible this session |

**Correctness bugs, highlighted:** The four example-program failures documented in the Feb 2023 gist and Discussion #147 (bootstrap verifier rejection `"unknown func bpf_probe_read_str#45"`, three ENOTSUPP/-524 attach failures on fentry-link/mdflush/lsm-connect, one missing-tracepoint failure on opensnoop) have no follow-up fix issue or PR found in this research. Whether they remain reproducible on a current riscv64 kernel is unverified [NEEDS VERIFICATION].

## 12. Objections and Upstream Blockers

No maintainer objection to riscv64 support was found - the request (#112) was accepted and substantially implemented within about five weeks (2023-01-29 to 2023-03-05).

**Technical blockers:** The four documented example failures appear most consistent with kernel/BTF/tracepoint limitations on the specific riscv64 test kernel used at the time (aarch64 hit near-identical `-524` failures and the same missing-tracepoint issue in the same test pass per Discussion #147), rather than eunomia-bpf-specific defects [NEEDS VERIFICATION - not independently re-tested].

**Organizational blockers:** eunomia-bpf is an individual/academic-led project with no foundation, no corporate sponsor, and no RISE membership. It has an informal review process with no named platform-support policy. The CI-hardening request that would have closed the riscv64 gap (#146) sat open for nearly three years before being closed without implementation, indicating low bandwidth/priority rather than active rejection.

**Acceptance probability:** Likely high for a properly scoped riscv64 CI PR, given the maintainer's track record (yunwei37 personally reviewed and merged PR #152 the same day it was opened) and the project's informal, low-friction contribution model. However, no committed maintainer bandwidth for riscv64 specifically is evident from the historical record.

## 13. Readiness Assessment

- **Color:** orange
- **Release provider:** none
- Optimization gap: N/A - eunomia-bpf is not an optimization-purpose project (it is a BPF compiler/loader/runtime wrapper; JIT and SIMD complexity live in its dependencies, not in code it owns).
- **Justification:** No riscv64 CI exists in any of the 15 GitHub Actions workflow files (`grep -rin "riscv" .github/workflows/` returns zero matches), no riscv64 GitHub Release binary has ever been published (checked v1.0.34 through v1.0.38), and no distribution packages eunomia-bpf at all - not PyPI ([404](https://pypi.org/pypi/eunomia-bpf/json)), not Ubuntu 26.04 resolute ("no results"), not Arch Linux. Source-level riscv64 build support was merged via [PR #152](https://github.com/eunomia-bpf/eunomia-bpf/pull/152) in 2023, but this path is manual, never CI-verified, and documented at merge time to have 4 of 16 example programs failing to load or attach on real riscv64 hardware ([Discussion #147](https://github.com/eunomia-bpf/eunomia-bpf/discussions/147)). No distribution floor upgrade applies because no distro ships the package at all, patched or unpatched, so the project sits at the base "no upstream CI" orange rather than any yellow distro-floor case.
- **Pending work that could change the grade:** [Issue #146](https://github.com/eunomia-bpf/eunomia-bpf/issues/146) originally requested exactly the riscv64 CI job needed (via `run-on-arch-action`, mirroring the existing aarch64 job) but was closed in 2026-03-08 without implementation - reopening and completing that work would be a direct path to yellow (build-only) or blue (if tests are also run and pass). Sibling-repo activity ([bpftime#664](https://github.com/eunomia-bpf/bpftime/issues/664), opened and closed within the past week as of this report) shows renewed RISC-V interest in the eunomia-bpf ecosystem, but its scope and outcome could not be verified in this session. No RISE involvement or funding was found for eunomia-bpf.

## 14. Investment Analysis

RISE has done no work on eunomia-bpf: it is absent from the RISE member list, all 34 RISE blog posts, and the RISE Python wheel builder. All investment below is unclaimed.

### 14.1 Functional Enablement

Re-test the four documented example-program failures (`bootstrap` verifier rejection, `fentry-link`/`mdflush`/`lsm-connect` ENOTSUPP attach failures, `opensnoop` missing tracepoint) against a current riscv64 kernel, since the original test was run against a 5.19-era kernel in Feb 2023 and over three years of kernel BPF/riscv64 JIT maturation may have already resolved some of them (see libbpf and LLVM's own riscv64 progress noted in their dependency reports). Triage which failures are genuinely eunomia-bpf/libbpf CO-RE bugs versus kernel/BTF environment gaps, and file/fix accordingly.

### 14.2 Performance Optimization

Not applicable at the eunomia-bpf layer - it owns no SIMD, JIT, or numeric kernels. Any RISC-V performance work belongs in its dependencies (LLVM riscv64 codegen quality, Wasmtime's riscv64 Cranelift backend, libbpf/kernel JIT), which are tracked separately in their own project reports.

### 14.3 CI/CD Infrastructure

Implement the riscv64 CI job originally scoped in #146: extend `run-on-arch-action` usage with `arch: riscv64` alongside the existing `arch: aarch64` jobs in `ecc-image-aarch64.yml`, `ecc-binary.yml`, and `ecli-binary.yaml`, and add a riscv64 example-execution step (mirroring the manual testing already done in Discussion #147) so regressions are caught automatically rather than relying on one-off manual verification.

### 14.4 Ecosystem Enablement

Add riscv64 release artifacts (`ecc-riscv64`, `ecli-riscv64`) to `release-coordinator.yml`, following the existing `-aarch64` binary naming and publishing pattern, so a working riscv64 binary becomes available without requiring users to build from source manually.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Re-test and triage the 4 documented example failures against a current riscv64 kernel | 1-2 | Data not available: no committed owner identified | High |
| CI/CD | Add riscv64 job to existing `run-on-arch-action` workflows (build + example execution) | 1-2 | Data not available: no committed owner identified | High |
| Ecosystem | Add riscv64 binaries to `release-coordinator.yml` release pipeline | 0.5-1 | Data not available: no committed owner identified | Medium |
| Functional | Fix or upstream-report any confirmed eunomia-bpf/libbpf CO-RE defects found in the re-test above | Data not available - depends on re-test findings | Data not available | Medium |

## 15. Updates

(No updates yet - initial report dated 2026-09-11.)

## 16. References

- [Issue #112 - Add riscv and other platforms support](https://github.com/eunomia-bpf/eunomia-bpf/issues/112)
- [PR #152 - Add RISC-V and MIPS support for eunomia-bpf](https://github.com/eunomia-bpf/eunomia-bpf/pull/152)
- [Issue #146 - CI test enhancement for RISC-V and MIPS, aarch64, etc.](https://github.com/eunomia-bpf/eunomia-bpf/issues/146)
- [Discussion #147 - Platforms Support Status Tracking](https://github.com/eunomia-bpf/eunomia-bpf/discussions/147)
- [wasm-bpf PR #52 - MIPS support for cpp runtime](https://github.com/eunomia-bpf/wasm-bpf/pull/52)
- [Gist - riscv test of eunomia-bpf (errors)](https://gist.github.com/oluceps/c9b51315fc438607c415f78c7c0d5add)
- [eunomia-bpf/bpftime issue #664 - Basic support for RISCV](https://github.com/eunomia-bpf/bpftime/issues/664)
- [eunomia-bpf/eunomia-bpf repository](https://github.com/eunomia-bpf/eunomia-bpf)
- [eunomia-bpf GitHub Releases](https://github.com/eunomia-bpf/eunomia-bpf/releases)
- [PyPI package lookup - eunomia-bpf (404)](https://pypi.org/pypi/eunomia-bpf/json)
- [RISE GitLab wheel builder redirect check](https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/eunomia-bpf/)
- [Ubuntu package search - eunomia-bpf (resolute, no results)](https://packages.ubuntu.com/search?keywords=eunomia-bpf&suite=resolute&searchon=names&section=all)
- [RISE Project members](https://riseproject.dev/members/)
- [RISE Project blog](https://riseproject.dev/blog)
- [The New Stack - The RISC architecture frontier: Is eBPF ready for ARM64 and RISC-V?](https://thenewstack.io/the-risc-architecture-frontier-is-ebpf-ready-for-arm64-and-risc-v/)
- [eunomia-bpf/bpf-benchmark repository](https://github.com/eunomia-bpf/bpf-benchmark)
- Companion dependency reports: `project-reports/libbpf.md`, `project-reports/llvm.md`, `project-reports/wasmtime.md`, `project-reports/openssl.md`, `project-reports/zlib.md`
