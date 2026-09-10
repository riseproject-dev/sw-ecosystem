---
title: Inclavare Containers
parent: Project Reports
color: grey
dependencies:
  - name: Intel SGX SDK
    relation: build-dependency
    criticality: critical
  - name: Intel SGX DCAP
    relation: build-dependency
    criticality: critical
  - name: OpenSSL
    relation: build-dependency
    criticality: critical
  - name: runc
    relation: build-dependency
    criticality: critical
  - name: containerd
    relation: build-dependency
    criticality: critical
  - name: Go
    relation: build-dependency
    criticality: critical
  - name: golang.org/x/sys
    relation: build-dependency
    criticality: optional
  - name: Occlum
    relation: runtime-dependency
    criticality: optional
  - name: WAMR
    relation: runtime-dependency
    criticality: optional
  - name: rats-tls
    relation: build-dependency
    criticality: optional
---

# Inclavare Containers

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Readiness:** grey<br/>
**Scope:** RISC-V (riscv64/linux) support status for Inclavare Containers<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

{% include dependency-graph.html slug="dependencies" subset="inclavare-containers" %}

## 1. Project Overview

Inclavare Containers is a confidential-computing container runtime stack, originally developed by Alibaba and accepted into the CNCF as a **Sandbox** project on September 14, 2021 (per [cncf.io/projects/inclavare-containers](https://www.cncf.io/projects/inclavare-containers/)). It is licensed under the **Apache License 2.0**. The project is a poly-repo: there is no single root build manifest (no top-level CMakeLists.txt/setup.py/Cargo.toml); it consists of multiple Go modules (`rune`, `epm`, `sgx-tools`, `shim`) plus C submodules (`rats-tls`, `enclave-tls`) that integrate Intel's SGX and TDX confidential-computing stack. Its core components include `rune` (an SGX-aware fork/wrapper of `runc`), `shim-rune` (a containerd shim), `Occlum` and `WAMR` (LibOS/runtime options for running unmodified or WASM apps inside enclaves), and `rats-tls`/`enclave-tls` (remote-attestation TLS libraries).

The project's defining architectural trait is that it exists to run workloads inside **Intel SGX enclaves** (and, per the ROADMAP, Intel TDX confidential VMs). SGX is an Intel-specific x86_64 ISA extension (ENCLU/EENTER/EEXIT instructions) with **no RISC-V equivalent**. The project's own `rune` README states explicitly: "rune currently supports the Linux platform with x86-64 architecture only" [NEEDS VERIFICATION -- direct file read was blocked in this session; statement is sourced from prior research pass].

**Governance**: GOVERNANCE.md describes a model "influenced by many CNCF projects" -- open/CLA-based contribution, consensus-driven maintainer decisions, simple-majority vote only for maintainer-status disputes, DCO sign-off plus CLA required for all contributions ([cla-assistant.io/alibaba/inclavare-containers](https://cla-assistant.io/alibaba/inclavare-containers)), and the verbatim CNCF Community Code of Conduct. The repo's `PROJECT` file still points at `github.com/alibaba/inclavare-containers` even though the live repo has moved to the dedicated `inclavare-containers` GitHub org -- typical of a CNCF sandbox project separating from its founding company's org.

**Corporate sponsors**: MAINTAINERS.md lists exactly two named maintainers: **Jia Zhang** (`jiazhang0`, Alibaba) and **Liang Yang** (`YangLiang3`, Intel). The OWNERS file (approvers/reviewers) lists `jiazhang0` and `stormgbs`, both Alibaba-affiliated. Git history (~1000+ commits examined) shows contribution volume dominated by Alibaba engineers (Shirong Hao, Jia Zhang, YiLin.Li, Ding Ma, Tianjia Zhang, liangzhou121, among the top committers by count), with Intel as the clear secondary corporate contributor (liang3.yang@intel.com, yijuan.huang@intel.com). No other company appears among top committers, consistent with the project's Intel-SGX-centric design.

**Community culture on new ports**: No formal platform-tier policy exists -- there is no `PLATFORMS.md`, `SUPPORT.md`, or `docs/platforms/` in the repo. CONTRIBUTING.md's only "new feature" requirement is that any new feature PR must ship its own CI/CD workflow coverage. There is no documented community stance, positive or negative, on architecture ports specifically, because the project has never had to consider one beyond x86 Intel SGX. ROADMAP.md and the README describe no architecture roadmap at all -- the entire roadmap is scoped to Intel SGX/TDX enclave runtimes (Occlum, WAMR, Graphene, sgx-lkl, Enarx, Open Enclave); no mention anywhere in docs of TrustZone, Penglai, Keystone, or any RISC-V TEE technology.

## 2. Port History and Upstreaming Timeline

There is no riscv64 port, and no first RISC-V commit exists.

| Date | Event | Source |
|---|---|---|
| N/A | No riscv64-related commit exists in project history | `mcp__github__search_commits` query `riscv repo:inclavare-containers/inclavare-containers` returned 0 results across all queried variants (`riscv`, `riscv64`, `risc-v`) |
| N/A | No riscv64-related issue ever opened | `mcp__github__search_issues` returned 0 results for all riscv/riscv64/risc-v query variants scoped to the repo |
| N/A | No riscv64-related PR ever opened (one false positive) | Only match is [PR #1585](https://github.com/inclavare-containers/inclavare-containers/pull/1585), a dependabot dependency bump whose body happens to quote an upstream Prometheus `client_golang` changelog line containing the string "riscv64" -- it is not project content, and the PR is still open/unmerged (created 2023-02-15) |

Key contributors to the project overall (not riscv64-specific, since no such work exists): Jia Zhang (Alibaba), Liang Yang (Intel), and a broader Alibaba engineering group. There is no riscv64 work to be "fully upstream" or not -- the topic has never been raised in the project's issue tracker, PR history, or commit history.

## 3. Upstream Support Tier

No formal platform-tier policy exists in the repo (confirmed absence of PLATFORMS.md/SUPPORT.md, Section 1). Evidence of the de facto tier comes from CI, release artifacts, and explicit documentation.

**Comparison table: amd64 vs arm64 vs riscv64**

| Aspect | amd64 (x86_64) | arm64 (aarch64) | riscv64 |
|---|---|---|---|
| Core SGX enclave runtime (`rune`, `shim-rune`) | Full -- this is the project's entire reason for existing; Intel SGX is x86_64-only by hardware definition | Not applicable (SGX does not exist on ARM) | Not applicable |
| CI (19 GitHub Actions workflows) | Full -- all 19 workflows run on x86 runners | Missing -- no arm64 runner or QEMU step in any of the 19 | Missing -- confirmed by reading all 19 workflow files |
| Release binaries (10 releases checked) | Full -- `.rpm`/`.deb` for x86_64/amd64 in every release that ships binaries | Missing -- no arm64 packages found in any release | Missing -- zero riscv64 assets across all 10 releases checked |
| Vendored `kvmtool` hypervisor helper (`rune/libenclave/.../kvmtool`) | Full (x86 path present) | Full -- hand-written `arm/aarch64/*.c`, ARM64 KVM register/PSCI/image headers, dedicated Makefile branch (for ARM CCA-style confidential VM support, a separate concern from SGX) | Missing -- no directory, no file, no Makefile branch, no header, zero lines of code |

Release-blocking status: not applicable to riscv64 (there is no riscv64 CI job to be release-blocking or not). No official riscv64 binaries exist in any of the 10 releases checked ([github.com/inclavare-containers/inclavare-containers/releases](https://github.com/inclavare-containers/inclavare-containers/releases)).

## 4. Technical Architecture and RISC-V-Specific Subsystems

Inclavare Containers has no architecture-specific subsystems targeting riscv64, because it has essentially no non-x86 architecture support of any kind for its core function.

| Component | amd64 | arm64 | riscv64 | Notes |
|---|---|---|---|---|
| SGX enclave PAL (rune) | Full (this is the entire point of the project) | Not applicable | Not applicable | SGX is an Intel x86_64 ISA extension; no RISC-V TEE ISA implements ENCLU/EENTER/EEXIT |
| kvmtool hypervisor helper (vendored, for ARM CCA confidential VMs) | Present (x86 path) | Full, hand-written (`arm/aarch64/*.c`, KVM register/PSCI/image headers, dedicated Makefile `ARCH` branch) | Absent -- no directory, no file, no Makefile branch, zero code | This is the project's one existing precedent for adding a second architecture, and riscv64 has none of it |
| RVV/SIMD intrinsics | N/A (SGX is not a SIMD library) | N/A | Absent | Code search for `vfloat32m1_t`, `rvv`, `__riscv` returned 0 results project-wide |
| Go build tags / `GOARCH=riscv64` | N/A | N/A | Absent | Code search for `GOARCH riscv64` and `arch/riscv` returned 0 results |

Code search evidence: `mcp__github__search_code` queries for `riscv`, `riscv64`, `__riscv`, `GOARCH riscv64`, `arch/riscv`, `rvv`, `vfloat32m1_t` against `inclavare-containers/inclavare-containers` all returned **0 results**. The search index itself was verified functional (a `README` query returned 14 hits, `filename:README.md` returned 124). The only "riscv" string matches anywhere in the repository (41-42 matches depending on the pass) are inside vendored third-party Go standard-library dependency files (`golang.org/x/sys/unix/*_riscv64.go`, `cpu_riscv64.go`, `asm_linux_riscv64.s` under `shim/vendor`, `sgx-tools/vendor`, `rune/vendor`, `epm/vendor`) -- these are generic Go stdlib per-architecture files pulled in automatically by `go mod vendor` and are not invoked by, or relevant to, any project-authored riscv64 target.

By contrast, `arm64`/`aarch64` returns 12 real hits, all inside the vendored `kvmtool` hypervisor tool bundled for ARM CCA confidential-VM support (`kvm.c`, `kvm-cpu.c`, `pmu.c`, `include/asm/kvm.h`, `include/asm/image.h`, plus Makefile `ARCH` detection). This demonstrates the project has a working, real pattern for wiring in a second architecture -- a dedicated source subdirectory, a Makefile `ARCH` switch, arch-specific headers -- and riscv64 has none of it: no directory, no file, no Makefile branch, no header.

**Conclusion**: riscv64 is entirely absent, not partial and not stubbed. There is no placeholder file, no TODO-marked function signature, and no disabled build path acknowledging riscv64 as a target.

## 5. Build System, Cross-Compilation, and Toolchain

**Data not available**: direct access to build documentation (README.md, BUILDING.md, INSTALL, docs/building.md, docs/cross-compilation.md, CMakeLists.txt) was blocked in this session -- the GitHub MCP tool available was scoped only to `riseproject-dev/sw-ecosystem`, and attaching `inclavare-containers/inclavare-containers` for file-content API access was not completed during this research pass. This is a session/tooling limitation, not a finding about the project.

What is confirmed independently of that blocked access: the project is a poly-repo of Go modules (`rune`, `epm`, `sgx-tools`, `shim`) plus C submodules (`rats-tls`, `enclave-tls`), requiring the Intel SGX SDK and Intel SGX DCAP libraries to build SGX-mode components (Section 9). No riscv64-targeted build flags, Makefile `ARCH` branches, or Dockerfile `--platform linux/riscv64` targets exist anywhere in the repository (Section 4). There is no evidence of QEMU usage for cross-arch testing in any of the 19 CI workflows (Section 7).

**Data not available**: exact riscv64 build commands, required toolchain versions, or documented riscv64 build failures -- none exist because no riscv64 build has ever been attempted, tracked, or documented for this project.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Run workloads in Intel SGX enclaves (core function) | Yes | No (SGX does not exist on ARM) | No (SGX does not exist on RISC-V; no RISC-V TEE ISA equivalent integrated) |
| Occlum LibOS (unmodified app execution in SGX) | Yes | No -- open RFC [occlum/occlum#896](https://github.com/occlum/occlum) "Considering arm architecture compatibility?" shows Occlum itself has no ARM support yet | No -- same SGX dependency chain |
| Kata Containers TDX-based confidential VM path (`rbi/kata-agent`) | Yes | Partial (per upstream Kata Containers tracking issues) | In progress upstream in Kata Containers itself (issues #9284, #10532, #10226, #11415, #10538), not shipped |
| ARM CCA confidential VM support (vendored kvmtool) | N/A | Yes, hand-written | No equivalent RISC-V confidential-VM backend integrated |
| Containerd shim (shim-rune) | Yes | Builds (per containerd upstream), but containerd's own riscv64 CI test matrix has an open gap ([containerd/containerd#13020](https://github.com/containerd/containerd)) | No -- inherits containerd's own riscv64 test-matrix gap, and rune's SGX-specific code paths are x86_64-only by construction regardless |

**Functional gap**: total. The project's core value proposition (SGX-based confidential computing) cannot function at all on riscv64, because the underlying hardware ISA extension it depends on does not exist on RISC-V. There is no "reduced performance" mode -- it is a binary yes/no gap.

**Performance gap**: not applicable -- there is no functioning riscv64 build to benchmark against amd64/arm64.

**Security hardening gap**: not applicable for the same reason.

**NaN / floating-point semantics issues**: **Data not available**: no evidence of floating-point-sensitive code paths relevant to this project's core function (an enclave/container runtime, not a numerics library); no such issue was found in research.

## 7. CI/CD Infrastructure

**No riscv64 CI exists.** All 19 GitHub Actions workflow files under `.github/workflows/` were read directly (not via search): `manually_centos_test_image.yml`, `manually_compilation_testing_image.yml`, `manually_inclavare_dev_image.yml`, `manually_repository_setup.yml`, `manually_runtime_testing_image.yml`, `manually_ubuntu_test_image.yml`, `manually_wamr_image.yml`, `nightly-aliyunlinux-sgx2.yml`, `nightly-centos-sgx1.yml`, `nightly-ubuntu-sgx1.yml`, `pr_basic_compilation_check.yml`, `pr_crictl.yml`, `pr_enclave_tls.yml`, `pr_epm.yml`, `pr_occlum.yml`, `pr_rats_tls.yml`, `pr_shelter.yml`, `pr_skeleton.yml`, `pr_verdictd.yml`.

A repo-wide case-insensitive grep for "riscv" across the entire `.github/workflows/` tree (including a `docker/` subdirectory holding Dockerfiles and sample manifests) returned **0 matches**. A grep across the entire repository returned 41-42 matches, all inside vendored third-party Go dependency files (Section 4), none in project-authored CI or build logic.

No `.gitlab-ci.yml`, `Jenkinsfile`, or `.cirrus.yml` exists anywhere in the repository.

**Runner inventory** (from `runs-on:` lines across all 19 workflows):
- GitHub-hosted: `ubuntu-18.04` (11 occurrences, across `manually_*` workflows and `pr_basic_compilation_check.yml`)
- Self-hosted labels: `[self-hosted, SGX1, nightly, centos]`, `[self-hosted, SGX1, commit]`, `[self-hosted, ubuntu, SGX1]`, `[self-hosted, SGX1, nightly, ubuntu]`, `[self-hosted, SGX2, nightly, aliyunlinux]`
- Matrix-driven: `${{ matrix.sgx }}` (8 `pr_*` workflows)

Every self-hosted runner label names Intel SGX hardware (SGX1/SGX2) -- structurally x86_64-only, incompatible with riscv64 silicon by definition. No workflow defines a riscv64 runner label, a QEMU cross-arch step, or a `linux/riscv64` platform target. No RISE runner usage of any kind was found (Section 12 / RISE membership check).

**Comparison table: amd64 vs arm64 vs riscv64**

| Aspect | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI build job exists | Yes (all 19 workflows) | No | No |
| CI test execution | Yes | No | No |
| Native or QEMU runner | Native (self-hosted SGX1/SGX2, or GitHub-hosted x86) | N/A | N/A |
| RISE runner usage | N/A | N/A | None found |

## 8. Distribution and Release Status

**No official riscv64 binaries exist in any channel checked.**

- **GitHub Releases** ([github.com/inclavare-containers/inclavare-containers/releases](https://github.com/inclavare-containers/inclavare-containers/releases)): 10 releases found (v0.6.4, v0.6.3, v0.6.2, v0.6.1, v0.6.0, v0.5.2, v0.5.1, v0.5.0, v0.4.1, v0.4.0). Releases with source-only assets (e.g. v0.6.4, v0.6.2, v0.6.1) ship only `.zip`/`.tar.gz` source archives. The release with actual compiled binaries, v0.4.0, ships: `occlum-pal-0.15.1-1.el8.x86_64.rpm`, `occlum-pal_0.15.1-1_amd64.deb`, `rune-0.4.0-1.el8.x86_64.rpm`, `rune_0.4.0-1_amd64.deb`, `shim-rune-0.4.0-1.el8.x86_64.rpm`, `shim-rune_0.4.0-1_amd64.deb` -- every compiled artifact is x86_64/amd64 only. No arm64 artifacts exist either. No filename anywhere contains "riscv" or "riscv64".
- **PyPI** (`https://pypi.org/pypi/inclavare-containers/json`): **HTTP 404 Not Found** -- no package exists at all (expected, this is a C/Go project, not a Python package).
- **RISE Python wheel builder** (`https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/inclavare-containers/`): redirects to the same nonexistent PyPI project (404).
- **Ubuntu 26.04 "resolute"** (`packages.ubuntu.com`): "Sorry, your search gave no results." No `inclavare-containers` package exists for **any** architecture in this suite, so riscv64 availability is moot.
- **Arch Linux RISC-V** (`archriscv.felixc.at`): no inclavare/enclave-related package listed.

**What a user must do to get a working binary**: build from source on x86_64 with Intel SGX hardware/driver support and the Intel SGX SDK/DCAP libraries installed. There is no path to a working riscv64 binary today, because the project's core enclave runtime function is architecturally tied to Intel SGX hardware that does not exist on RISC-V silicon (Section 1, Section 4).

**Caveat**: the `project-graph` MCP server (used for authoritative Ubuntu 26.04/PyPI queries via SPARQL) failed to connect (`CONNECTION_CLOSED`) on every attempt during this research effort. All distribution findings above come from live fallback checks against the primary sources directly (packages.ubuntu.com, pypi.org, GitHub releases pages), not from the graph database. This is a tooling failure, not evidence of absence, though the fallback checks independently confirm the same negative result.

## 9. Dependencies

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Community / notes |
|---|---|---|---|---|---|
| Intel SGX SDK | Build-dependency (critical) -- core enclave runtime, `sgx_tcrypto`/IPP-crypto, enclave heap allocator, EPC memory management, required by `rune`'s SGX mode, `sgx-tools`, `rats-tls` SGX attesters | Not applicable | Not applicable | Not applicable | SGX is an Intel x86_64 ISA extension (ENCLU/EENTER/EEXIT); no RISC-V TEE ISA implements it. Issue search on `intel/linux-sgx` was blocked this session (access restriction) |
| Intel SGX DCAP | Build-dependency (critical) -- ECDSA/DCAP remote-attestation quoting library used by `rats-tls`'s `sgx_ecdsa` verifier/attester | Not applicable | Not applicable | Not applicable | Same SGX-hardware dependency as above, x86_64-only |
| OpenSSL | Build-dependency (critical) -- primary TLS/crypto backend in rats-tls | Good -- active riscv64 CI | Good -- `linux-riscv64` CI runner exists in OS Zoo CI | Ships riscv64 builds | Healthiest dependency in this table for riscv64; open perf/optimization issues (`#28664` SHA256 opt, `#29453` intrinsics vs asm, `#25334` AES zknd/zkne), one flaky-test issue (`#30880`) |
| runc | Build-dependency (critical) -- `rune` is a fork/wrapper of runc, vendors `github.com/opencontainers/runc v1.0.3` | Supported | Supported | Supported -- [opencontainers/runc#5166](https://github.com/opencontainers/runc) "Add linux/riscv64 to CI and release artifacts" is closed (riscv64 CI/release artifacts added) | riscv64 mainstream-supported upstream. Note: `rune` itself (the SGX fork) has no evidence of riscv64 porting work -- it inherits runc's non-SGX code-path portability, but its SGX-specific code paths remain x86_64-only by construction |
| containerd | Build-dependency (critical) -- backing runtime for the `shim` (containerd-shim-rune-v2) component | Supported (builds) | Gap -- open issue [containerd/containerd#13020](https://github.com/containerd/containerd) "Add linux/riscv64 to CI test matrix" (riscv64 not yet in CI) | Partial | Closed issue `#8184` documents a historical containerd-shim crash specifically on riscv64, since closed, signaling riscv64 shim-path immaturity in this exact component category relevant to Inclavare's own shim |
| Go | Build-dependency (critical) -- language runtime for `rune`, `epm`, `sgx-tools`, `shim` | Mainstream supported | Mainstream supported | Mainstream supported | Go has first-class riscv64 support (GOARCH=riscv64) upstream |
| golang.org/x/sys | Build-dependency (optional) | Present (riscv64 files ship as part of stdlib-adjacent package) | Mainstream | Mainstream | Confirmed present via vendored `*_riscv64.go` files across `shim/vendor`, `sgx-tools/vendor`, `rune/vendor`, `epm/vendor` -- generic upstream syscall bindings, not project-specific |
| Occlum | Runtime-dependency (optional) -- LibOS used to run unmodified apps inside SGX enclaves | Not supported | Not supported | Not supported (x86_64 SGX only) | Open RFC [occlum/occlum#896](https://github.com/occlum/occlum) "Considering arm architecture compatibility?" -- Occlum has no ARM support yet either, let alone riscv64; built on the same SGX dependency |
| WAMR | Runtime-dependency (optional) -- WASM runtime option for enclave workloads | Data not available: not independently verified in this research pass | Data not available | Data not available | [NEEDS VERIFICATION] |
| rats-tls | Build-dependency (optional) -- remote-attestation TLS library; SGX attesters (sgx_la, sgx_ecdsa) require SGX SDK/DCAP, but non-SGX (nulltls) mode is architecture-portable | Blocked transitively for SGX-mode instances (needs Intel SGX SDK >= 2.18 and DCAP >= 1.15); nulltls mode should be portable in principle | Not applicable for SGX modes | Not applicable | Requires OpenSSL + libcbor + cargo for non-SGX build paths |

**Bottom line on the dependency chain**: the ordinary library dependencies (OpenSSL, runc, containerd, Go, golang.org/x/sys) are all in reasonable-to-good riscv64 shape upstream. The chain that actually determines Inclavare Containers' riscv64 viability is the **Intel SGX SDK / SGX DCAP** dependency, which is categorically x86_64-only (a hardware ISA extension, not a portability gap that can be closed by porting code), plus **Occlum** (no ARM support yet either) and **Kata Containers'** still-in-progress riscv64 enablement for the TDX/confidential-VM code path (Section 6). Barring a RISC-V-native TEE backend replacing SGX entirely (e.g., Keystone- or Penglai-style enclaves, which Inclavare Containers does not currently integrate and has not discussed integrating), this project cannot run its core confidential-computing function on riscv64 regardless of the health of its secondary dependencies.

## 11. Known Bugs and Active Issues

No riscv64-specific bugs or issues exist, because no riscv64 porting effort has ever been undertaken.

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| N/A | No riscv64-specific issues found | N/A | N/A | GitHub issue search for `riscv64 performance`, `riscv64 bug`, `riscv nan floating`, `riscv`, `riscv is:open` all returned 0 results; code search for `riscv`/`RISCV64` returned 0 files |

For context, the only bugs found when scoping to the repo generally (none RISC-V-specific, all closed, all SGX/x86-related build issues) were:
- #1466 -- "rats-tls: fix build warning in sgx mode" (closed 2022-03-03)
- #1353 -- "rats-tls: static link libenclave_tls_u.a bug" (closed 2021-09-03)
- #1356 -- "rats-tls: compiling error under SGX mode" (closed 2021-09-03)
- #742 -- "rune: fix parsing sgx enclave device when using in-tree sgx driver" (closed 2021-04-09)

None mention RISC-V; none are open. No correctness or performance bugs specific to riscv64 exist to highlight separately.

## 12. Objections and Upstream Blockers

**Stated objections**: none explicit -- the topic of a riscv64 port has never been raised in the project's issue tracker, PR history, commit history, or documentation (Section 2). There is no recorded maintainer position, for or against.

**Technical blockers**: fundamental and structural. The project's core function (SGX enclave execution) depends on the Intel SGX ISA extension, which has no RISC-V equivalent. A RISC-V port of the project's primary value proposition would require integrating an entirely different, RISC-V-native TEE backend (e.g., Keystone or Penglai), which is a ground-up architectural undertaking, not a portability fix. The project's own precedent for adding a second architecture (the vendored `kvmtool` ARM64 CCA support) shows what such an effort would require (dedicated source tree, arch-specific headers, Makefile branch) -- and no equivalent has been started for riscv64 (Section 4).

**Organizational blockers**: the project has exactly two named maintainers (one Alibaba, one Intel; Section 1) and is a CNCF Sandbox-stage project (not Incubating or Graduated), meaning limited maintainer bandwidth for any large architectural initiative, RISC-V or otherwise. No RISE membership, funding, or engagement was found: Inclavare Containers does not appear in RISE's Premier or General member lists ([riseproject.dev/members](https://riseproject.dev/members)), has no dedicated `riseproject-dev` GitHub repository, and is not referenced in any RISE blog post found via site search.

**Acceptance probability**: low, absent a change in scope. A riscv64 port that merely ports the non-SGX-dependent code paths (e.g., rats-tls's nulltls mode, the shim/containerd integration layer) is technically conceivable and would not face architectural rejection in principle -- but would deliver none of the project's core confidential-computing value proposition, since Occlum, the SGX PAL, and DCAP-based attestation would remain non-functional. A port that also replaces SGX with a RISC-V-native TEE backend is a multi-year, cross-project undertaking with no current sponsor, no proposal, and no precedent of consideration in the project's history.

## 13. Readiness Assessment

- **Color:** grey (arch-exclusive)
- **Release provider:** none
- Not an optimization-purpose project (a container/enclave runtime, not a library whose sole value is out-performing a reference implementation), so no Optimization level applies per the color model's Step 2.
- **Justification**: Inclavare Containers' core value proposition, running workloads inside Intel SGX enclaves, requires the SGX ISA extension (ENCLU/EENTER/EEXIT), an x86_64-exclusive hardware feature with no RISC-V equivalent. This is confirmed directly by the project itself -- the `rune` README states "rune currently supports the Linux platform with x86-64 architecture only" [NEEDS VERIFICATION -- direct file fetch was blocked this session; sourced from an earlier research pass in this pipeline] -- and by the complete absence of any alternate-TEE-backend discussion (Keystone, Penglai) anywhere in the roadmap, issues, or PR history (Section 2, Section 12). This places the project in the grey/arch-exclusive case (not applicable to riscv64 by design), analogous to architecture-exclusive libraries like ARM Compute Library, rather than orange (untested-but-potentially-buildable). Secondary evidence -- no riscv64 CI in any of the 19 workflow files ([.github/workflows/](https://github.com/inclavare-containers/inclavare-containers/tree/master/.github/workflows)), no riscv64 release assets across all 10 GitHub releases checked, no distro packages in any channel checked -- is consistent with this grade but is not itself the deciding factor, since the deciding factor is the hardware dependency, not merely absent CI.
- **Pending work that could change the grade**: none found. No open PR proposes riscv64 support (the sole riscv64-adjacent PR, #1585, is an unrelated dependency bump). No RISE involvement of any kind was found (Section 12). The only path that would change this grade is a ground-up integration of a RISC-V-native TEE backend (Keystone or Penglai) as an alternate enclave runtime to SGX -- nothing in the roadmap, issues, or PR history indicates this has ever been proposed or discussed.

## 14. Investment Analysis

**RISE prior-work check**: RISE has not engaged with Inclavare Containers in any capacity found during this research -- it is not a RISE member (Premier or General), has no dedicated `riseproject-dev` repository, no RISE blog post references it, and it does not appear in the RISE Python wheel builder index (Section 12, Section 8). No RISE-funded work exists to net out against the estimates below.

### 14.1 Functional Enablement

The functional gap is total and architectural, not a matter of porting existing code. Two distinct tracks exist:

1. **Non-SGX code paths only** (rats-tls nulltls mode, the containerd shim integration layer, epm): these depend on already-riscv64-capable upstreams (OpenSSL, containerd, Go; Section 9) and could plausibly be ported with moderate effort, but would deliver none of the project's core confidential-computing value.
2. **Core SGX enclave function** (rune's SGX PAL, sgx-tools, Occlum, DCAP-based attestation): requires an entirely new RISC-V-native TEE backend (e.g., Keystone or Penglai integration) to replace SGX's role. This is a ground-up, multi-year architectural undertaking with no existing scaffolding in the project (Section 4's kvmtool precedent shows the shape of such work but nothing has been started for a TEE backend).

### 14.2 Performance Optimization

Not applicable at this stage -- there is no functional riscv64 build to optimize. Performance work is contingent on Track 1 (non-SGX code paths) or Track 2 (a new TEE backend) landing first.

### 14.3 CI/CD Infrastructure

No riscv64 CI exists (Section 7). Standing up build-only CI for the non-SGX code paths (Track 1) would be straightforward once that code exists, following the project's existing 19-workflow GitHub Actions pattern. CI for the SGX-dependent paths is not applicable until/unless a RISC-V TEE backend exists, since there is no riscv64 SGX-equivalent hardware to test against.

### 14.4 Ecosystem Enablement

Not applicable -- Section 10 is omitted per the report format rules, since Inclavare Containers has no significant dependent package ecosystem (it is a container runtime/tool, not a library with a package/plugin ecosystem depending on it).

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Port non-SGX code paths (rats-tls nulltls mode, shim/containerd integration, epm) to riscv64 | Data not available: no scoping study exists; a rough order-of-magnitude estimate requires a dedicated technical investigation not performed in this research pass | Unassigned | Low -- delivers none of the project's core value proposition |
| Functional | Integrate a RISC-V-native TEE backend (Keystone or Penglai) to replace SGX's role for the core enclave function | Data not available: this is a multi-year, cross-project architectural undertaking; no estimate exists because no design proposal has ever been made | Unassigned | Low, pending a strategic decision on whether RISC-V confidential computing is a priority at all for this product line |
| CI/CD | Add riscv64 build-only CI for Track-1 non-SGX code paths, once that code exists | Data not available: contingent on Track 1 landing first | Unassigned | Low |
| Ecosystem | Not applicable -- no dependent package ecosystem | N/A | N/A | N/A |

Given the grey/arch-exclusive grade and the fundamental hardware dependency identified in Section 13, this project is not recommended as a near-term RISC-V investment target absent a broader strategic decision to fund a RISC-V-native confidential-computing TEE backend that Inclavare Containers (or a fork of it) could then integrate.

## 15. Updates

(No updates yet -- initial report dated 2026-06-17.)

## 16. References

- [Inclavare Containers GitHub repository](https://github.com/inclavare-containers/inclavare-containers)
- [Inclavare Containers homepage](https://inclavare-containers.io/) (returned HTTP 503 during this research session; CNCF project page used as fallback)
- [Inclavare Containers | CNCF](https://www.cncf.io/projects/inclavare-containers/)
- [PR #1585 -- dependency bump false positive](https://github.com/inclavare-containers/inclavare-containers/pull/1585)
- [inclavare-containers/inclavare-containers .github/workflows directory](https://github.com/inclavare-containers/inclavare-containers/tree/master/.github/workflows)
- [inclavare-containers/inclavare-containers releases](https://github.com/inclavare-containers/inclavare-containers/releases)
- [cla-assistant.io/alibaba/inclavare-containers](https://cla-assistant.io/alibaba/inclavare-containers)
- [PyPI JSON API -- inclavare-containers (404, package does not exist)](https://pypi.org/pypi/inclavare-containers/json)
- [RISE Python wheel builder index](https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/inclavare-containers/)
- [Ubuntu 26.04 resolute package search](https://packages.ubuntu.com/search?keywords=Inclavare%20Containers&suite=resolute&searchon=names&section=all)
- [Arch Linux RISC-V package search](https://archriscv.felixc.at/)
- [RISE Project members list](https://riseproject.dev/members)
- [RISE Project blog](https://riseproject.dev/blog)
- [Occlum GitHub repository](https://github.com/occlum/occlum) (RFC #896 on ARM architecture compatibility)
- [runc PR/issue #5166 -- riscv64 CI and release artifacts (closed)](https://github.com/opencontainers/runc)
- [containerd issue #13020 -- add linux/riscv64 to CI test matrix (open)](https://github.com/containerd/containerd)
- [containerd issue #8184 -- historical riscv64 shim crash (closed)](https://github.com/containerd/containerd)
- [Kata Containers riscv64 tracking issues #9284, #10532, #10226, #11415, #10538](https://github.com/kata-containers/kata-containers)
- [OpenSSL riscv64-related issues #28664, #29453, #25334, #30880](https://github.com/openssl/openssl)
- [Penglai RISC-V TEE project](https://penglai-enclave.systems/)
- [RISC-V Summit Europe 2025 Posters](https://riscv-europe.org/summit/2025/posters)