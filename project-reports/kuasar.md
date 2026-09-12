---
title: Kuasar
parent: Project Reports
color: orange
dependencies:
  - name: wasmtime
    relation: runtime-dependency
    criticality: critical
  - name: WasmEdge
    relation: runtime-dependency
    criticality: optional
  - name: QEMU
    relation: runtime-dependency
    criticality: critical
  - name: Cloud Hypervisor
    relation: runtime-dependency
    criticality: optional
  - name: StratoVirt
    relation: runtime-dependency
    criticality: optional
  - name: youki
    relation: runtime-dependency
    criticality: critical
  - name: runc
    relation: runtime-dependency
    criticality: optional
  - name: containerd
    relation: runtime-dependency
    criticality: critical
  - name: zstd
    relation: runtime-dependency
    criticality: optional
---

{% include dependency-graph.html slug="dependencies" subset="kuasar" %}

# Kuasar

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-09-08<br/>
**Readiness:** orange<br/>
**Scope:** RISC-V (riscv64/linux) support status for Kuasar<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

Kuasar is a Rust-based multi-sandbox container runtime hosted as a **CNCF Sandbox project** (Apache 2.0 licensed), homepage [kuasar.io](https://kuasar.io/), repository [github.com/kuasar-io/kuasar](https://github.com/kuasar-io/kuasar). It provides a unified sandboxer architecture that wraps multiple isolation backends behind the containerd shim v2 / Sandbox API: microVM hypervisors (QEMU, cloud-hypervisor, StratoVirt), WebAssembly engines (wasmtime, WasmEdge), and process-based sandboxes (runc, youki via the Quark sandboxer).

**Governance.** No `GOVERNANCE.md` exists in the repository. Community roles follow an informal 4-tier ladder (Member -> Approver -> Maintainer -> Owner) documented at [kuasar.io/docs/community/membership](https://kuasar.io/docs/community/membership/), which states verbatim there is **"no formal process for review and acceptance into these roles."** Repository access control is delegated to `CODEOWNERS`, mapping subsystems (quark, shim, vmm, wasm, docs, tests) to named approver teams.

**Corporate sponsors.** Per `MAINTAINERS.md` in the repository, of 13 named maintainers, 5 are Huawei-affiliated and 4 are openEuler-affiliated (also a Huawei-adjacent ecosystem), giving Huawei/openEuler clear majority control of the top-level `maintainers` team. Remaining maintainers come from Second State (WasmEdge), Agricultural Bank of China, and QuarkSoft. Site-listed sponsors: Huawei Cloud, Agricultural Bank of China, QuarkContainer, Futurewei Technologies, openEuler, WasmEdge, iSulad, StratoVirt.

**Community culture on new ports.** No documented tier/support policy for platforms or architectures exists anywhere in the repository (README, `ROADMAP.md`, `CONTRIBUTING.md`, or `docs/proposals/`). New capabilities (e.g., new hypervisor backends) go through informal design-doc proposals in `docs/proposals/`, but none address CPU architecture ports. RISC-V does not appear as a line item in `ROADMAP.md` at all (2023H1-2025 items cover Cloud Hypervisor, QEMU, StratoVirt, WasmEdge, QuarkContainer, Wasmtime, Runc, gVisor, Firecracker). The one community-filed RISC-V attempt (issue #104, see Section 2) was treated as a closed build/tooling report rather than a tracked feature request, and a project member explicitly stated riscv64 is unsupported. Overall posture is informal and reactive, not a documented invitation for new architecture ports.

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2023-04-17 | First commit to kuasar-io/kuasar (project inception) | Repository git history |
| 2023-12-29 | External user `PengXuanyao` opens [issue #104](https://github.com/kuasar-io/kuasar/issues/104), reporting a manual, unmerged riscv64 attempt on LicheePi 4A hardware (openEuler 23.03) | [Issue #104](https://github.com/kuasar-io/kuasar/issues/104) |
| 2024-01-02 | Maintainer `Burning1020` gives a partial environment fix (containerd daemon setup); reporter finds a second, unresolved blocker: no riscv64 CentOS 7 base image exists for the rootfs build | Issue #104 comment thread |
| 2024-01-02 | Maintainer `Vanient` states: **"I'm afraid that Kuasar not supported running on riscv yet."** | Issue #104 comment thread |
| 2024-01-03 | Reporter self-closes issue #104 without a code fix landing: "I think it needs official support. I'm gonna close this issue." | [Issue #104](https://github.com/kuasar-io/kuasar/issues/104) |
| 2026-09-08 | No riscv64 tracking issue, PR, or commit exists anywhere in project history as of this research date | Exhaustive `search_issues`/`search_pull_requests`/`search_commits`/`search_code` and full local clone grep |

**Key contributors:** `PengXuanyao` (external, first-time reporter, non-maintainer), `Burning1020` (Kuasar member), `Vanient` (Kuasar member, authoritative "not supported" statement). No corporate entity has sponsored or attempted a riscv64 port.

**Is it fully upstream?** No. There is no riscv64 port, partial or otherwise. The reporter's own local patch to `vmm/sandbox/src/qemu/config.rs` (adding a `#[cfg(target_arch = "riscv64")]` QEMU binary-path constant) was never submitted as a PR and never merged. Two unrelated dependabot PRs, [#186](https://github.com/kuasar-io/kuasar/pull/186) (merged 2025-02-26) and [#191](https://github.com/kuasar-io/kuasar/pull/191) (merged 2025-02-27), matched "riscv64" search queries only because the bumped `rustix` crate's changelog text contains the unrelated line "Disable riscv64 testing" - neither PR touches Kuasar's own code or adds riscv64 support.

## 3. Upstream Support Tier

No formal tier policy exists. There is no CI evidence, no release-blocking gate, and no official binary for riscv64.

| Architecture | CI build | CI test | Official release binary | Documented support |
|---|---|---|---|---|
| x86_64 (amd64) | Yes | Yes | Yes (`kuasar-v<ver>-linux-amd64.tar.gz` in every release) | Documented, default |
| aarch64 (arm64) | [NEEDS VERIFICATION - workflow files use generic `ubuntu-latest`/`ubuntu-22.04`/`ubuntu-24.04` runners without an explicit arch matrix; aarch64 has dedicated config files but CI cross-build confirmation was not directly observed in the six workflow files read] | Same caveat | No riscv64/arm64 release asset found in any of the last 5 releases (v1.0.0 through v1.1.0) | Documented in [docs/vmm/how-to-run-kuasar-with-qemu.md](https://github.com/kuasar-io/kuasar/blob/main/docs/vmm/how-to-run-kuasar-with-qemu.md) as a supported bare-metal architecture |
| riscv64 | No | No | No | Explicitly excluded: docs state "Kuasar should be running on bare metal with x86_64 or aarch64 architecture" |

## 4. Technical Architecture and RISC-V-Specific Subsystems

Kuasar itself contains no SIMD, JIT, cryptographic, or GC-barrier code of its own - it is an orchestration/shim layer. Its only architecture-specific dispatch code is a single file selecting the default QEMU binary path per target architecture:

`vmm/sandbox/src/qemu/config.rs`:
```rust
#[cfg(target_arch = "x86_64")]
const DEFAULT_QEMU_PATH: &str = "/usr/bin/qemu-system-x86_64";
#[cfg(target_arch = "aarch64")]
const DEFAULT_QEMU_PATH: &str = "/usr/bin/qemu-system-aarch64";
```

There is **no `riscv64` arm, no fallback branch, and no `compile_error!` stub** - selecting riscv64 as a compile target would leave `DEFAULT_QEMU_PATH` undefined. This is the only Kuasar-authored file anywhere in the repository referencing `target_arch`.

| Component | amd64 | aarch64 | riscv64 |
|---|---|---|---|
| QEMU default binary path (`config.rs`) | Hardcoded const | Hardcoded const | **Absent - no arm, no stub** |
| QEMU config TOML (`vmm/sandbox/config_qemu_*.toml`) | `config_qemu_x86_64.toml` | `config_qemu_aarch64.toml`, `config_qemu_virtcca_aarch64.toml` | **None exists** |
| StratoVirt config TOML | `config_stratovirt_x86_64.toml` | `config_stratovirt_aarch64.toml` | **None exists** |
| Guest kernel build lists (`vmm/scripts/kernel/build-kernel/`) | (x86_64 default) | `mini-kernel-aarch64.list`, `micro-kernel-aarch64.list` | **None exists** |
| Install/build scripts (`scripts/install/build-and-install-kuasar-vmm.sh`) | Supported | Supported (arm64 checksum literally marked `PLACEHOLDER` [NEEDS VERIFICATION - unclear if this is a known incomplete state or intentional]) | **Not referenced** |

The only two literal occurrences of the string "riscv64" anywhere in the repository are lines 3120 and 3874 of `vmm/cloud-hypervisor_TwoNewFeatures_patch/cloud-hypervisor-v52-filebackend-external-uffd.patch`, a vendored third-party cloud-hypervisor patch file. These are pre-existing upstream cloud-hypervisor `#[cfg(any(target_arch = "aarch64", target_arch = "riscv64"))]` context lines gating unrelated struct fields (`acpi_address`, `uefi_flash`) - inherited pass-through text, not Kuasar-authored riscv64 code, and carry zero RVV/Zba/Zbb/ISA-extension-specific logic.

**Conclusion: riscv64 support is not a stub - it is entirely absent.** No directory, no config file, no kernel-build list, no CI, and no release artifact exists for riscv64 anywhere in the project.

## 5. Build System, Cross-Compilation, and Toolchain

Kuasar is a Rust/Cargo project (not CMake) - there is no `CMakeLists.txt`, no `.cmake` toolchain file, and no `cmake/` directory anywhere in the repository. The build is driven by a top-level `Makefile` wrapping `cargo build` calls per component (vmm-sandboxer, vmm-task, wasm-sandboxer, quark-sandboxer, runc-sandboxer, kuasar-ctl).

**Toolchain:** `rust-toolchain.toml` pins `channel = "1.85"` with components `rustfmt`, `clippy`, `llvm-tools`. No riscv64-specific compiler version or rationale is documented anywhere (in fact, no arch-specific toolchain guidance exists for any architecture).

**`ARCH` Makefile variable:** `ARCH ?= x86_64` (Makefile line 5), used only for `--target=${ARCH}-unknown-linux-musl` (vmm-task build) and to select `vmm/sandbox/config_${HYPERVISOR}_${ARCH}.toml`. Setting `ARCH=riscv64` would fail at `make install-vmm` because no `config_qemu_riscv64.toml` (or any riscv64 variant) exists. There is no `-DUSE_X=OFF`-style flag system (that is a CMake convention this project does not use); the closest analogs are the `HYPERVISOR` (`cloud_hypervisor` default, or `qemu`/`stratovirt`) and `ARCH` Makefile variables, neither of which offers a working riscv64 path.

**QEMU usage:** [docs/vmm/how-to-run-kuasar-with-qemu.md](https://github.com/kuasar-io/kuasar/blob/main/docs/vmm/how-to-run-kuasar-with-qemu.md) documents `apt install qemu-system-x86` for x86_64, with the sandboxer expecting `/usr/bin/qemu-system-x86_64` or `/usr/bin/qemu-system-aarch64` - no `qemu-system-riscv64` reference anywhere. The same document states explicitly: **"Kuasar should be running on bare metal with x86_64 or aarch64 architecture, with a Linux kernel version 4.8 or higher."**

**No riscv64 Dockerfiles exist.** `find . -iname "Dockerfile*"` returns only three unrelated example-workload Dockerfiles (Go and Python examples under `examples/`), none referencing architecture.

**Known build failure (issue #104):** An external user patched `DEFAULT_QEMU_PATH` locally for riscv64, and `cargo build --release` for `vmm-sandboxer` compiled successfully in 7m35s on LicheePi 4A / openEuler 23.03 (only pre-existing, unrelated warnings). The build then failed at the rootfs-image build stage (`Makefile:30: bin/kuasar.img`) for two reasons: (1) `ctr` could not dial `/run/containerd/containerd.sock` (containerd daemon not running - resolved by a maintainer's comment suggesting `CONTAINER_RUNTIME=docker make` as an alternative), and (2) **no riscv64 CentOS 7 base image exists** for the hardcoded `docker.io/library/centos:7` rootfs base - this second blocker was never resolved. See [issue #104](https://github.com/kuasar-io/kuasar/issues/104) for the full thread.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Capability | amd64 | aarch64 | riscv64 |
|---|---|---|---|
| Compile Kuasar's own Rust code | Yes | Yes | Compiles with a hand-patched `DEFAULT_QEMU_PATH` (unmerged, per issue #104) - not possible out of the box |
| QEMU sandboxer backend | Full | Full | Not possible without upstream patch; no config TOML exists |
| cloud-hypervisor sandboxer backend | Full (default) | [NEEDS VERIFICATION] | Blocked - cloud-hypervisor's own riscv64 support is mid-flight (open "Stage 2 Roadmap" [issue #6978](https://github.com/cloud-hypervisor/cloud-hypervisor/issues/6978)) |
| StratoVirt sandboxer backend | Full | Full | [NEEDS VERIFICATION] - StratoVirt's own GitHub mirror has issues disabled; real development is on Gitee/openEuler, unreachable from available tools |
| wasm-sandboxer (wasmtime, default) | Full | [NEEDS VERIFICATION] | wasmtime's Cranelift riscv64 backend exists but has multiple **open** correctness/crash issues (see Section 9) |
| wasm-sandboxer (WasmEdge, opt-in) | Full | [NEEDS VERIFICATION] | WasmEdge's riscv64 port merged in 2023, but no official riscv64 release artifact and optional plugins untested on riscv64 |
| vmm-task default OCI runtime (`youki`) | Full | [NEEDS VERIFICATION] | **No riscv64 port exists at all** - no toolchain target, no CI, no release asset; riscv64 dev-tooling was actively removed upstream ([youki PR #3497](https://github.com/containers/youki)) |
| runc-sandboxer / runc fallback OCI runtime | Full | Full | Solid - `runc.riscv64` ships in upstream v1.5.0 releases, Ubuntu-packaged |
| Guest rootfs image build | Full (CentOS 7 base) | [NEEDS VERIFICATION] | **Blocked** - no riscv64 CentOS 7 base image available (confirmed blocker in issue #104) |
| Official release binary | `linux-amd64` tarball | Not found in last 5 releases | Not published |

**Functional gap:** A user cannot run Kuasar on riscv64 today through any documented or supported path. Even with local patches, the guest rootfs image build pipeline has no riscv64 base image, and the default in-process OCI runtime (`youki`) has zero upstream riscv64 support.

**Performance gap:** No riscv64 performance data exists for Kuasar (see Section 11) - the gap cannot be quantified.

**Security hardening / NaN-FP semantics:** No riscv64-specific security or floating-point issues are documented for Kuasar itself, because no riscv64 build has ever run far enough to surface them.

## 7. CI/CD Infrastructure

**No riscv64 CI exists.** All six GitHub Actions workflow files were read in full:

| File | Trigger | Runner | Purpose |
|---|---|---|---|
| `ci.yml` | push, pull_request, nightly schedule | `ubuntu-latest` | cargo check/fmt/clippy/deny + `cargo test` |
| `vmm-ci-on-push.yml` | pull_request (path-filtered) / push (main/master) / workflow_dispatch | (orchestrates other workflows) | VMM build+e2e for `hypervisor: clh` only |
| `build-vmm-artifacts.yml` | `workflow_call` only, default `hypervisor: clh` | `ubuntu-24.04` | Builds cloud-hypervisor sandboxer/kernel/image |
| `run-vmm-e2e.yml` | `workflow_call` only, default `hypervisor: clh` | `ubuntu-24.04` | Runs cri-containerd smoke test |
| `e2e.yml` | pull_request / push (main/master) / workflow_dispatch | `ubuntu-latest` | Rust e2e framework + runc integration tests |
| `release.yaml` | `release: [published]` | `ubuntu-22.04` | Builds/packages release tarballs; output artifact literally named `kuasar-<ver>-linux-amd64` |

Every `runs-on:` value across all six files is a standard GitHub-hosted x86_64 runner. There is no self-hosted runner, no `arch:` matrix dimension, no `riscv64` runner label, and no cross-architecture QEMU emulation step targeting riscv64 anywhere (the `qemu-utils` package installed in `build-vmm-artifacts.yml` is for building the guest VM disk image, unrelated to CPU-architecture emulation). `release.yaml`'s hypervisor matrix is hardcoded to `["cloud_hypervisor"]` only. No `.gitlab-ci.yml`, `Jenkinsfile`, or `.cirrus.yml` exists anywhere in the repository.

| Architecture | CI: build | CI: test | CI: release-blocking |
|---|---|---|---|
| amd64 | Yes | Yes | Yes |
| aarch64 | [NEEDS VERIFICATION - no explicit arch matrix observed] | [NEEDS VERIFICATION] | No release asset found |
| riscv64 | No | No | No |

**RISE runners:** No reference to `riseproject-dev` or RISE runner labels found in any workflow file. Confirmed separately: no RISE Project involvement of any kind exists for Kuasar (not in RISE's blog, not in the `riseproject-dev` GitHub org, not on the [RISE wheel builder](https://riseproject.gitlab.io/python/wheel_builder/) list - which is irrelevant regardless, since Kuasar is not a Python package). The sole "Kuasar" touchpoint found anywhere in RISE-adjacent infrastructure is an unactioned backlog entry in this report repository's own internal `project-reports/.queue.yml` file, which is not evidence of RISE involvement.

## 8. Distribution and Release Status

**No riscv64 binary exists anywhere.** Verified across every channel checked:

- **GitHub releases:** the five most recent releases (v1.1.0, v1.0.1, v1.0.1-alpha1, v1.0.0, v1.0.0-alpha.1) publish only `kuasar-v<ver>-linux-amd64.tar.gz`, a `kuasar-v<ver>-vensor.tar.gz` bundle, and source archives. No filename in any release contains "riscv" or "riscv64". [Full release listing](https://github.com/kuasar-io/kuasar/releases).
- **PyPI:** [pypi.org/pypi/kuasar/json](https://pypi.org/pypi/kuasar/json) returns HTTP 404 - no PyPI project named `kuasar` exists at all (Kuasar is not distributed as a Python package).
- **RISE wheel builder / GitLab PyPI registry:** [gitlab.com project 56254198 PyPI simple index](https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/kuasar/) returns a 302 redirect falling through to the same PyPI 404 - no package registered.
- **Ubuntu 26.04 (resolute):** project graph DB query over `deb#BinaryPackage` for `kuasar`/`python3-kuasar`/`libkuasar` on riscv64 returns an empty result set. Live confirmation at [packages.ubuntu.com](https://packages.ubuntu.com/search?keywords=Kuasar&suite=resolute&searchon=names&section=all): "Sorry, your search gave no results" - no `kuasar` package exists for **any** architecture in Ubuntu 26.04, not just riscv64.
- **Arch Linux RISC-V unofficial repository:** [archriscv.felixc.at/?q=kuasar](https://archriscv.felixc.at/?q=kuasar) lists no `kuasar` package.

**What a user must do to get a working binary:** There is no working path today. A user would need to (1) manually patch `vmm/sandbox/src/qemu/config.rs` to add a riscv64 QEMU path (as the issue #104 reporter did, unmerged), (2) resolve the missing riscv64 CentOS 7 base image problem for the rootfs build pipeline (architectural gap, not a tooling fix), (3) disable the default `youki` OCI runtime feature in favor of `runc` (since `youki` has zero riscv64 port), and (4) accept that the `cloud-hypervisor` and `stratovirt` VMM backends have unverified or in-progress riscv64 status. No upstream guidance or officially sanctioned procedure exists for any of this.

## 9. Dependencies

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Community/notes |
|---|---|---|---|---|---|
| **wasmtime + Cranelift** | Default JIT/WASM engine for wasm-sandboxer (`default = ["wasmtime"]`) | Native riscv64 Cranelift backend compiles/runs | Actively unstable - open correctness bugs: [#12195](https://github.com/bytecodealliance/wasmtime/issues/12195) (ISLE panic), [#11050](https://github.com/bytecodealliance/wasmtime/issues/11050) (compile/run fails), [#13959](https://github.com/bytecodealliance/wasmtime/issues/13959) (ISLE crash), [#13078](https://github.com/bytecodealliance/wasmtime/issues/13078) (vxrm/vxsat regs not preserved), [#7186](https://github.com/bytecodealliance/wasmtime/issues/7186) (vector instrs incomplete). 108 riscv64-tagged issues total, mostly open | No confirmed official riscv64 release binaries | Not Debian/Ubuntu packaged (crates.io only) |
| **WasmEdge** | Alternate opt-in Wasm AOT engine | Not found for riscv64 in Ubuntu 26.04 (amd64/arm64 only). Upstream riscv64 port merged 2023 ([PR #2286](https://github.com/WasmEdge/WasmEdge/pull/2286)), dedicated `build_for_riscv.yml` CI | CI runs a curated 14-test "quick" subset under QEMU user-mode emulation; optional plugins excluded from riscv64 CI | Release/build workflows have zero riscv64 references - no official artifact | See [project-reports/wasmedge.md](https://github.com/riseproject-dev/sw-ecosystem) (graded blue) |
| **QEMU** | Primary microVM hypervisor backend | Ubuntu 26.04 riscv64 packaged (`qemu-system-misc`, `qemu-utils`); TCG riscv64 backend ~65-85% feature parity with x86_64/aarch64 | Native riscv64 build+test CI exists upstream | Distro-packaged | Missing i128 atomic CAS support (correctness gap for multicore guest workloads); see project-reports/qemu.md |
| **cloud-hypervisor** | Second VMM backend | Not Ubuntu-packaged for any arch (GitHub-release/cargo only). riscv64 tracked under open ["RISC-V Stage 2 RoadMap" #6978](https://github.com/cloud-hypervisor/cloud-hypervisor/issues/6978) - partial/in-progress | Closed [#7758](https://github.com/cloud-hypervisor/cloud-hypervisor/issues/7758) "Flaky test failure on riscv64" shows riscv64 CI exists but has reliability problems | No confirmed GA riscv64 release binaries | Primary blocker: #6978 open |
| **StratoVirt** | Third VMM backend | Not Debian/Ubuntu packaged any arch; distributed via openEuler | No data retrievable via GitHub (issues disabled on the GitHub mirror; real development on Gitee/openEuler) | No data retrievable | [NEEDS VERIFICATION] - StratoVirt's own docs list x86_64/aarch64 as supported; riscv64 unconfirmed |
| **youki / `libcontainer`** | **Default** in-process OCI runtime for vmm-task (`default = ["youki"]`) | Zero riscv64 port - no `Cross.toml` entry, no CI matrix entry | No riscv64 CI at all | No riscv64 release assets; riscv64 dev-tooling was actively **removed** ([PR #3497](https://github.com/containers/youki)) | **Likely default-build blocker for Kuasar's VMM sandboxer on riscv64** unless the `youki` feature is disabled in favor of `runc`. See project-reports/youki.md (graded orange) |
| **runc** | Fallback/default OCI backend for runc-sandboxer; selectable in vmm-task if youki disabled | Ubuntu 26.04 riscv64 packaged | CI confirmation ambiguous post-closure of a tracking issue | `runc.riscv64` ships in upstream v1.5.0 | No open blockers currently; see project-reports/containerd.md |
| **containerd** | Host-side orchestration layer all Kuasar shims register with | Ubuntu 26.04 riscv64 packaged; riscv64 enablement PR #6882 merged 2022, dedicated CI, tested on real SiFive hardware | No open correctness bugs (as of 2026-06-17 per report) | Distro-packaged | See project-reports/containerd.md |
| **ring** (crypto, transitive via rustls/tonic/OTLP) | Crypto primitives for OTLP/gRPC tracing export | Ubuntu 26.04 riscv64 packaged (`librust-ring-dev`) | Builds/tests fine per Debian archive presence | Ships on riscv64 | Historical riscv64 requests all closed/resolved |
| **rustls** (TLS, transitive) | TLS for OTLP/gRPC export | **Not found for riscv64** in Ubuntu 26.04 - `librust-rustls-dev` exists only for amd64/arm64, despite `ring` building fine on riscv64 | No riscv64-specific GitHub issues found | Not distro-published for riscv64; buildable from crates.io directly (likely doesn't block Kuasar's own Cargo build) | [NEEDS VERIFICATION] why the Ubuntu source package isn't building on riscv64 - looks like a packaging gap, not an upstream limitation |
| **sha2** (transitive) | Hashing | Ubuntu 26.04 riscv64 packaged | Closed issue: riscv64 falls back to portable Rust implementation (no vector/crypto intrinsics) - performance gap, not correctness | Ships fine | None blocking |
| **zstd/zstd-sys** (transitive) | Compression | Ubuntu 26.04 riscv64 packaged | Active upstream riscv64 work - RVV-vectorized fast paths merged ([PR #4399](https://github.com/facebook/zstd/pull/4399), +62% throughput on Spacemit X60) | Ships on riscv64 | See project-reports/zstd.md |
| **flate2** (transitive) | gzip/deflate | Ubuntu 26.04 riscv64 packaged | No riscv64-specific issues | Ships fine | None open |

**Deep-dive: the two highest-risk dependencies.**

1. **`youki`/`libcontainer`** is the **default** OCI runtime compiled into `vmm-task` (`default = ["youki"]` in `vmm/task/Cargo.toml`). It has no riscv64 toolchain target, no CI matrix entry, no release asset for any of v0.6.0/v0.7.0, and riscv64 dev-tooling was actively *removed* upstream rather than added ([PR #3497](https://github.com/containers/youki)). This is a plausible default-configuration build/runtime blocker for Kuasar's VMM sandboxer on riscv64 unless Kuasar's build explicitly disables the `youki` feature to fall back to the `runc` path, which has solid riscv64 support (Ubuntu-packaged, upstream CI, v1.5.0 riscv64 release binaries).

2. **`wasmtime`/Cranelift**, the default engine for `wasm-sandboxer`, has a working but immature riscv64 backend with dozens of open correctness/crash issues in Cranelift's riscv64 ISLE lowering rules (#12195, #11050, #13959, #13078, #7186). The optional WasmEdge backend has a more mature merged port (2023) but no official riscv64 release artifact and untested optional plugins.

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [#104](https://github.com/kuasar-io/kuasar/issues/104) | "make install failed on licheepi4a(riscv) openEuler 23.03" | Closed (`completed`), 2024-01-03 | N/A - build-environment report, not a code defect confirmed | Rust code compiled successfully with a local unmerged patch; failure was (1) containerd daemon not running (resolved by maintainer comment) and (2) no riscv64 CentOS 7 rootfs base image exists (never resolved). Maintainer `Vanient` explicitly stated: "Kuasar not supported running on riscv yet." |
| [#171](https://github.com/kuasar-io/kuasar/issues/171) | "arm64 support" | Open, opened 2024-11-21 | N/A - not RISC-V | False-positive match on riscv64 search; included only to note that even arm64 support is still open/roadmap-only as of last update (2025-07-10), let alone riscv64 |

No open correctness or performance bugs specific to riscv64 exist in the tracker, because no riscv64 code or CI has ever existed to generate them. A search for "riscv nan floating repo:kuasar-io/kuasar" returned 0 results.

**No published RISC-V benchmark data exists for Kuasar.** The project's only public performance report is a general x86-only comparison against Kata Containers ([kuasar.io/blog/benchmark-test-report](https://kuasar.io/blog/benchmark-test-report/), published 2023-04-18): serial single-pod boot 300-360ms (Kuasar) vs. 850-950ms (Kata); 50-pod parallel boot 930-1050ms (Kuasar) vs. 1600-1800ms (Kata); memory overhead ~15MB (Kuasar sandboxer) vs. ~18MB/pod (Kata). Test setup: CentOS 8, containerd v1.7.0, Kata v2.5.2, Cloud-Hypervisor v28.2, 500 iterations with CDF analysis. This report covers x86 infrastructure only - no arm64 or riscv64 data exists in it or anywhere else searched.

## 12. Objections and Upstream Blockers

**Stated objections.** A Kuasar member (`Vanient`) gave the project's only explicit statement on riscv64: "I'm afraid that Kuasar not supported running on riscv yet" ([issue #104](https://github.com/kuasar-io/kuasar/issues/104)). This is a statement of current non-support, not a stated technical objection to ever supporting it.

**Technical blockers, in dependency order:**
1. No riscv64 QEMU config branch in `vmm/sandbox/src/qemu/config.rs` (the reporter's fix was never upstreamed).
2. No riscv64 base image for the rootfs-image build pipeline (`docker.io/library/centos:7` has no riscv64 variant) - confirmed unresolved blocker in issue #104.
3. Default OCI runtime `youki` has zero riscv64 port upstream (Section 9).
4. `cloud-hypervisor` riscv64 support is explicitly mid-flight upstream (open Stage 2 roadmap).
5. `stratovirt` riscv64 status is unverifiable from available tooling (development happens on Gitee/openEuler).
6. Default wasm engine `wasmtime`/Cranelift has multiple open riscv64 correctness bugs.

**Organizational blockers.** No formal architecture-port process, tier policy, or proposal template exists in `docs/proposals/`. Governance is explicitly informal (per the membership doc's own admission). No RISE Project engagement or funded work touches Kuasar at all - confirmed via RISE blog search, the `riseproject-dev` GitHub org (25 repos, none Kuasar-related, 0 code-search hits outside this report repository's own backlog file), and the RISE wheel builder list.

**Acceptance probability.** Low in the near term absent external investment. There is no roadmap commitment, no assigned owner, no in-progress PR, and the one community-driven attempt was closed without a fix landing. A riscv64 port would require coordinated work across Kuasar's own arch-dispatch code plus at least three separate upstream dependencies (youki, cloud-hypervisor, wasmtime) that are themselves incomplete on riscv64.

## 13. Readiness Assessment

- **Color:** orange (no color_case sub-type cleanly applies from the standard grey/yellow/orange taxonomy: this is not a distro-floor case since no distribution ships a riscv64 package at all - the base "no upstream CI, no release, no distro" state)
- **Release provider:** none
- **Justification:** No upstream riscv64 CI exists - all six GitHub Actions workflow files use only x86_64 GitHub-hosted runners (`ubuntu-latest`/`ubuntu-22.04`/`ubuntu-24.04`), with zero riscv64 matrix legs anywhere ([`.github/workflows/`](https://github.com/kuasar-io/kuasar/tree/main/.github/workflows)). No riscv64 arch-dispatch code exists in Kuasar's own source (only x86_64/aarch64 branches in `vmm/sandbox/src/qemu/config.rs`). No riscv64 release artifact has ever been published (releases v0.5.1 through v1.1.0 ship `linux-amd64` only). No Linux distribution, PyPI, or Arch RISC-V repository packages Kuasar for riscv64 in any form, so the distribution floor does not apply. This is not a red/confirmed-broken state: the one documented attempt ([issue #104](https://github.com/kuasar-io/kuasar/issues/104)) showed Kuasar's Rust code compiling successfully on riscv64 hardware with a local patch - the blockers encountered (missing containerd daemon, missing riscv64 rootfs base image) are infrastructure/tooling gaps consistent with "no official support has been built," not evidence of a technical incompatibility. Kuasar is not an optimization-purpose project (it is a container sandboxing orchestration layer, not a math/crypto/codec library), so Step 2 of the color model does not apply and there is no optimization gap to report.
- **Pending work that could change the grade:** None identified. No open PR proposes riscv64 support. No RISE Project involvement exists (confirmed via RISE blog, `riseproject-dev` GitHub org, and the RISE wheel builder list - the sole "Kuasar" touchpoint anywhere in RISE-adjacent infrastructure is an unactioned entry in this report repository's own internal backlog file, not evidence of RISE engagement). Issue #104 remains closed without a follow-up. The grade would improve only if a maintainer or third party (a) upstreams a riscv64 QEMU config branch, (b) resolves the riscv64 rootfs base-image gap, and (c) either disables the `youki` default feature or waits for youki's own riscv64 port (currently nonexistent, Section 9).

## 14. Investment Analysis

RISE has done or funded no work on Kuasar (Section 12). All estimates below assume a from-scratch effort with no existing RISE prior to subtract.

### 14.1 Functional Enablement

Work required to get Kuasar building and running end-to-end on riscv64:
- Upstream a riscv64 branch in `vmm/sandbox/src/qemu/config.rs` (small - the reporter's unmerged patch is a starting point).
- Solve the missing riscv64 rootfs base image problem for the guest image build pipeline - either source/build a riscv64 CentOS 7 (or equivalent) base image, or re-architect the rootfs build to use a distro with riscv64 availability (e.g., Ubuntu/Debian, since CentOS itself has no official riscv64 build).
- Disable the default `youki` feature in `vmm/task/Cargo.toml` in favor of `runc`, since youki has no riscv64 port at all, or contribute a riscv64 port upstream to youki (larger, cross-project effort - see project-reports/youki.md).
- Add `config_qemu_riscv64.toml` and validate the QEMU TCG riscv64 backend against Kuasar's guest kernel/image requirements.
- Validate or defer the `cloud-hypervisor` and `stratovirt` backends, both of which have incomplete/unverifiable riscv64 status upstream, independent of Kuasar.

### 14.2 Performance Optimization

Not applicable at this stage - no riscv64 build exists to optimize, and Kuasar is not an optimization-purpose project (Section 13). Once functional enablement lands, performance work would focus on validating QEMU TCG riscv64 overhead (currently ~65-85% feature parity with x86_64/aarch64 per project-reports/qemu.md) rather than Kuasar-specific code, since Kuasar itself has no hot-path SIMD/crypto code of its own.

### 14.3 CI/CD Infrastructure

Add a riscv64 leg to `ci.yml` (cargo check/fmt/clippy/test) and, once functional enablement lands, to `vmm-ci-on-push.yml`/`build-vmm-artifacts.yml`/`run-vmm-e2e.yml`. RISE-provided GitHub Actions riscv64 runners (per the RISE blog post ["Announcing the RISE RISC-V Runners"](https://riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github/)) could reduce this cost, but no engagement with RISE has occurred to date (Section 12).

### 14.4 Ecosystem Enablement

Not applicable - see note on Section 10 omission below.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Upstream riscv64 QEMU config branch (`config.rs`, `config_qemu_riscv64.toml`) | 1-2 | [Unassigned] | Critical |
| Functional | Resolve riscv64 rootfs base-image gap (source/build riscv64 base image or re-architect rootfs pipeline) | 2-4 | [Unassigned] | Critical |
| Functional | Disable/replace default `youki` feature with `runc` fallback for riscv64 builds, or track upstream youki riscv64 port | 1-3 (Kuasar-side) / dependent on youki upstream (external, unbounded) | [Unassigned] | Critical |
| Functional | Validate/enable wasm-sandboxer on riscv64 (wasmtime correctness bugs, or default to WasmEdge) | 2-3 | [Unassigned] | High |
| Functional | Validate cloud-hypervisor and stratovirt backends on riscv64 (dependent on upstream progress, external) | 1-2 (Kuasar-side validation only) | [Unassigned] | Medium |
| CI/CD | Add riscv64 CI leg to `ci.yml`, `e2e.yml`, `vmm-ci-on-push.yml` (build + test) | 1-2 | [Unassigned] | High |
| CI/CD | Add riscv64 release artifact packaging to `release.yaml` | 0.5-1 | [Unassigned] | Medium |
| Distribution | Package Kuasar for riscv64 in a distro (e.g. Debian/Ubuntu) once functional build works | 1-2 | [Unassigned] | Low (blocked on Functional items) |

## 15. Updates
(No updates yet - initial report dated 2026-09-08.)

## 16. References

- [kuasar-io/kuasar GitHub repository](https://github.com/kuasar-io/kuasar)
- [Kuasar homepage](https://kuasar.io/)
- [Issue #104 - make install failed on licheepi4a(riscv) openEuler 23.03](https://github.com/kuasar-io/kuasar/issues/104)
- [Issue #171 - arm64 support](https://github.com/kuasar-io/kuasar/issues/171) (non-RISC-V, false-positive check)
- [PR #186 - bump rustix in /wasm](https://github.com/kuasar-io/kuasar/pull/186) (unrelated dependency bump)
- [PR #191 - bump rustix in /runc](https://github.com/kuasar-io/kuasar/pull/191) (unrelated dependency bump)
- [Kuasar CI workflows directory](https://github.com/kuasar-io/kuasar/tree/main/.github/workflows)
- [docs/vmm/how-to-run-kuasar-with-qemu.md](https://github.com/kuasar-io/kuasar/blob/main/docs/vmm/how-to-run-kuasar-with-qemu.md)
- [Kuasar community membership doc](https://kuasar.io/docs/community/membership/)
- [Kuasar benchmark test report (x86-only, vs. Kata Containers)](https://kuasar.io/blog/benchmark-test-report/)
- [Kuasar GitHub releases](https://github.com/kuasar-io/kuasar/releases)
- [PyPI kuasar package check](https://pypi.org/pypi/kuasar/json) (404, no such package)
- [Ubuntu packages.ubuntu.com search for Kuasar](https://packages.ubuntu.com/search?keywords=Kuasar&suite=resolute&searchon=names&section=all)
- [Arch Linux RISC-V unofficial repository search](https://archriscv.felixc.at/?q=kuasar)
- [RISE wheel builder package list](https://riseproject.gitlab.io/python/wheel_builder/)
- [RISE Project blog](https://riseproject.dev/blog)
- [RISE Announcing the RISC-V Runners](https://riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github/)
- [youki PR #3497 - riscv64 dev-tooling removal](https://github.com/containers/youki) [NEEDS VERIFICATION - exact PR URL/diff not directly fetched, cited from prior dependency research pass]
- [cloud-hypervisor RISC-V Stage 2 RoadMap issue #6978](https://github.com/cloud-hypervisor/cloud-hypervisor/issues/6978)
- [cloud-hypervisor issue #7758 - flaky riscv64 test failure](https://github.com/cloud-hypervisor/cloud-hypervisor/issues/7758)
- [wasmtime issue #12195](https://github.com/bytecodealliance/wasmtime/issues/12195), [#11050](https://github.com/bytecodealliance/wasmtime/issues/11050), [#13959](https://github.com/bytecodealliance/wasmtime/issues/13959), [#13078](https://github.com/bytecodealliance/wasmtime/issues/13078), [#7186](https://github.com/bytecodealliance/wasmtime/issues/7186)
- [WasmEdge riscv64 port PR #2286](https://github.com/WasmEdge/WasmEdge/pull/2286)
- [zstd RVV fast-path PR #4399](https://github.com/facebook/zstd/pull/4399)
- Internal cross-referenced project reports: project-reports/containerd.md, project-reports/qemu.md, project-reports/wasmedge.md, project-reports/youki.md, project-reports/zstd.md
