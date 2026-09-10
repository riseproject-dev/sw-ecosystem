---
title: youki
parent: Project Reports
color: orange
dependencies:
  - name: libseccomp
    relation: runtime-dependency
    criticality: optional
  - name: CRIU
    relation: runtime-dependency
    criticality: critical
  - name: libbpf
    relation: runtime-dependency
    criticality: optional
  - name: rbpf
    relation: runtime-dependency
    criticality: optional
  - name: wasmtime
    relation: runtime-dependency
    criticality: critical
  - name: wasmer
    relation: runtime-dependency
    criticality: critical
  - name: WasmEdge
    relation: runtime-dependency
    criticality: optional
  - name: flate2
    relation: runtime-dependency
    criticality: optional
---

{% include dependency-graph.html slug="dependencies" subset="youki" %}

# youki

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Readiness:** orange<br/>
**Scope:** RISC-V (riscv64/linux) support status for youki<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

[youki](https://github.com/youki-dev/youki) is an OCI-spec container runtime written in Rust, positioned as an alternative to `runc`. It is a **Cloud Native Computing Foundation (CNCF) Sandbox project**, confirmed by the repository README ("We are a Cloud Native Computing Foundation sandbox project") and by `SECURITY.md`, which routes private security reports to `cncf-youki-security@lists.cncf.io`. As a CNCF project it is itself a Linux Foundation project ("a Series of LF Projects, LLC," per the [docs site](https://youki-dev.github.io/youki/) footer). Licensed under Apache License 2.0.

**Governance:** No `MAINTAINERS`/`OWNERS`/`CODEOWNERS` file exists at repo root; governance is documented at `docs/src/community/governance.md` and `docs/src/community/maintainer.md`. Two roles exist: **Committer** (full write/merge access, still requires PR review except urgent security fixes) and **Reviewer** (triage rights, no merge rights). Promotion to Maintainer requires 2/3 of Committers to approve within 7 days (minimum 2 approvals); removal requires 2/3 within 14 days or 12 months of inactivity/Code-of-Conduct violation. A vendor-neutrality safeguard is explicit: "Votes from the same company will be counted as one vote."

**Corporate sponsors of maintainers** (from `docs/src/community/maintainer.md`, 9 total): Toru Komatsu (Preferred Networks), Thomas Schubart (Gitpod), Yashodhan (independent), Eric Fang (independent), Sascha Grunert (Red Hat), Jorge Prendes (Microsoft), Yusuke Sakurai (3-shake), Lindroos Hsu (independent, Reviewer), Yuta Nagai (CyberAgent). 3 of 9 maintainers are independent/unaffiliated; the remainder span Preferred Networks, Gitpod, Red Hat, Microsoft, 3-shake, and CyberAgent - no single vendor dominates.

**Community culture on new architecture ports:** tepid to negative in practice. [GitHub issue #369](https://github.com/youki-dev/youki/issues/369), "Decide which architectures to support, etc." (opened 2021-10-07, 34 comments, still open/unresolved as of this research), states "Obviously we are only really considering x86_64 at the moment" while raising ARM, MIPS, PowerPC, and RISC-V only as hypothetical future possibilities. No tier framework or decision was ever documented, and de facto CI/release support has settled at x86_64 + aarch64 only. The single closest approach to riscv64 - an experimental dev-tooling VM image reference - was added by the lead maintainer and then explicitly reverted about a year later (see Section 2).

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2021-09-16 | First riscv-related commit `57d436290e15732d01e43ebd2e5e147f4944bbe9`, "Adds a seccomp binding," by yihuaf (now-Committer "Eric Fang," independent). Incidental: a bulk-generated libseccomp architecture-enum mapping covering many architectures at once, not a targeted riscv effort. | Repository commit history |
| 2021-10-07 | Issue #369 opened, raising future architecture support (including RISC-V) as an open question; never resolved. | [Issue #369](https://github.com/youki-dev/youki/issues/369) |
| 2025-05-06 | Commit `9a4d4cfc`, "selinux: lima vm," by utam0k (lead maintainer, Preferred Networks) - added a Fedora riscv64 cloud-image entry to the experimental SELinux Lima-VM test setup (`experiment/selinux/lima-setup.sh`). The only concrete riscv64 infrastructure ever added to the project. | Repository commit history |
| 2026-04-17 | Commit `57999c43`, PR #3497, "fix: use correct fedora version number and deprecate riskv64 [sic] from lima-setup.sh," by Ganesh Tiwari - removed the riscv64 entry added 11 months earlier. | Repository commit history, release changelog |

**Key contributors:** yihuaf/Eric Fang (independent) authored the incidental seccomp enum entry; utam0k (Preferred Networks, lead maintainer) added and then saw removed the only dedicated riscv64 artifact (a dev-tooling VM reference); Ganesh Tiwari authored the removal.

**Is it fully upstream?** There is no riscv64 port to be "upstream" or not - no dedicated riscv64 support work has ever been proposed, opened as a PR, or merged. The port has not been started.

## 3. Upstream Support Tier

**Formal tier policy:** None exists. No `PLATFORMS.md`, `SUPPORT.md`, or `docs/platforms/` file anywhere in the repository. Issue #369 is the closest artifact to a tier policy and it remains unresolved after 5 years.

**Evidence:**
- CI: `.github/workflows/basic.yml` build/test matrix is `arch: ["x86_64", "aarch64"]` only; a second job restricts to `arch: ["x86_64"]`. No riscv64 entry in any of the 13 workflow files.
- Release-blocking: `.github/workflows/release.yaml` build matrix is `arch: ["x86_64", "aarch64"]` only.
- Official binaries: GitHub release assets for v0.6.0 and v0.7.0 are `aarch64-gnu`, `aarch64-musl`, `x86_64-gnu`, `x86_64-musl`, plus source archives - no riscv64 asset in either release.

### amd64 vs arm64 vs riscv64

| Aspect | amd64 (x86_64) | arm64 (aarch64) | riscv64 |
|---|---|---|---|
| CI build | yes | yes | no |
| CI test execution | yes | yes | no |
| Official release binary | yes (gnu + musl) | yes (gnu + musl) | no |
| Cross-compilation target (`Cross.toml`) | yes | yes | no |
| Dev-tooling (experimental Lima VM) | yes (implied by default tooling) | not explicitly tracked | was present 2025-05 to 2026-04, then removed |

## 4. Technical Architecture and RISC-V-Specific Subsystems

youki has **no JIT, no SIMD dispatch, no cryptographic hot paths, and no GC** - it is a container-lifecycle-management runtime (create/start/delete OCI containers), not a compute or codec library. A full-repo grep for `asm!`/`global_asm!` returns zero hits anywhere in the tree; youki is portable Rust throughout, for every architecture it supports. This is expected for its category and is not itself an RISC-V-specific gap.

**The one place youki hand-writes architecture-specific code** is the experimental in-tree BPF-instruction generator, `experiment/seccomp/src/instruction/` (separate from the production seccomp path, which uses the `libseccomp` C library via crate bindings):

- `arch.rs` (108 lines): `pub enum Arch { X86, AArch64 }` - exactly two variants, no `Riscv64` variant, not marked `#[non_exhaustive]`. `gen_validate()` hand-emits BPF_LD/BPF_JMP instructions keyed to `AUDIT_ARCH_X86_64` / `AUDIT_ARCH_AARCH64`.
- `consts.rs` (144 lines): defines `AUDIT_ARCH_X86_64` and `AUDIT_ARCH_AARCH64` constants. No `AUDIT_ARCH_RISCV64` constant is defined anywhere (the real Linux value would be `243 | 0xC0000000`).
- Both files include dedicated unit tests for x86 and aarch64 (`test_gen_validate_x86`, `test_gen_validate_aarch64`); no riscv64 test exists because no riscv64 code path exists.

**The production seccomp path** (`crates/libcontainer/src/seccomp/mod.rs`, 560 lines) contains one match arm, `Arch::ScmpArchRiscv64 => ScmpArch::Riscv64,` (line 74), inside a ~25-architecture exhaustive match required by Rust because the upstream `oci_spec`/`libseccomp` crate enums already define every architecture. This exists because Rust requires match exhaustiveness against an enum youki does not control, not because riscv64-specific engineering was performed. Two seccomp test fixtures (`experiment/seccomp/tests/fixtures/default.json`, `default_x86_64.json`) similarly list `SCMP_ARCH_RISCV64` and the `riscv_flush_icache` syscall generically, as copies of the standard OCI/runc/Docker default seccomp profile that enumerates every known Linux architecture by design - not youki-authored riscv64 work.

No `#[cfg(target_arch = "riscv64")]` or `cfg!(target_arch = "riscv64")` exists anywhere (only 4 `target_arch` usages total in the repo, all `x86_64`). No `AUDIT_ARCH_RISCV64` constant exists. `build.rs` performs no architecture branching.

### Component comparison: amd64 vs arm64 vs riscv64

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Production seccomp arch translation (`libcontainer/seccomp/mod.rs`) | full (generic passthrough) | full (generic passthrough) | full (generic passthrough - mechanical enum mapping, not authored effort) |
| Experimental BPF instruction generator (`experiment/seccomp/instruction/`) | full (hand-tuned `AUDIT_ARCH` constant, BPF codegen, dedicated unit test) | full (hand-tuned `AUDIT_ARCH` constant, BPF codegen, dedicated unit test) | **missing** (no enum variant, no constant, no codegen, no test) |
| Release CI / binary artifacts | full (built, tested, published) | full (built, tested, published) | **missing** (absent from build matrix, no release artifact) |
| Dedicated port/tracking issue, PR, or commit | n/a | n/a | **missing** (zero found across issues, PRs, commits) |

**Assessment:** There is no riscv64 "implementation" to grade on a full/partial/scalar scale - it does not exist. The only riscv64 characters appearing in the codebase are inherited, unavoidable enum boilerplate from third-party crates (`libseccomp`/`oci_spec`) and a copied-in default seccomp JSON fixture, not architecture-support engineering. Where youki's own code actually distinguishes architectures by hand, riscv64 is entirely absent (0 of 2 arms in the BPF generator enum). This is a pre-stub / not-started state, not a partial stub.

## 5. Build System, Cross-Compilation, and Toolchain

youki is a pure Rust/Cargo project - **there is no CMake build system**, no `CMakeLists.txt`, no riscv64 toolchain file, and no `Dockerfile.riscv64` anywhere in the repository.

- **Toolchain:** `rust-toolchain.toml` pins `channel = "1.96.0"`, `profile = "default"`. No minimum GCC/Clang version is documented (C dependencies - libseccomp, libelf, libssl - are linked via system packages or the `cross` tool's Docker images, not a hand-written toolchain file).
- **Native build (Linux only):** install `pkg-config libsystemd-dev build-essential libelf-dev libseccomp-dev libclang-dev libssl-dev` (Debian/Ubuntu) or Fedora/RHEL equivalents, then `just youki-dev` / `just youki-release` (a `justfile` drives `cargo build` via `scripts/cargo.sh`; not CMake).
- **Cross-compilation:** uses the `cross` crate (`Cross.toml`), which configures exactly **4 targets**: `x86_64-unknown-linux-gnu`, `aarch64-unknown-linux-gnu`, `x86_64-unknown-linux-musl`, `aarch64-unknown-linux-musl`, each built inside Docker via `cross/Dockerfile.gnu` or `cross/Dockerfile.musl`. **riscv64 is not a configured `cross` target**; no `Dockerfile.riscv64` exists anywhere in the tree (checked `cross/`, repo root, `.github/`, `tests/k8s/Dockerfile`).
  - `cross/Dockerfile.gnu` installs `libseccomp-dev:${CROSS_DEB_ARCH}`, `libelf-dev:${CROSS_DEB_ARCH}`, `zlib1g-dev:${CROSS_DEB_ARCH}`, `libzstd-dev:${CROSS_DEB_ARCH}` for the target Debian architecture.
  - `cross/Dockerfile.musl` pulls Alpine 3.18 static libs (`libseccomp-static`, `libelf-static`, `zlib-static`, `zstd-static`) and sets `LIBSECCOMP_LINK_TYPE=static`.
- **QEMU:** not referenced anywhere in the repository - no explicit QEMU usage is documented (the `cross` tool's Docker images may use QEMU user-mode emulation internally for non-x86 targets, but youki's own configuration never invokes it, and no riscv64 target is configured to trigger it in the first place).
- **CI:** all 13 `.github/workflows/*.yml(.yaml)` files were grepped case-insensitively for "riscv" - zero matches.
- **Known build failures:** none documented for riscv64, because riscv64 has never been attempted as a build target.

**Conclusion:** Exact riscv64 build commands, toolchain minimums, and Dockerfile content cannot be provided because none exist. Adding riscv64 support would require, at minimum, a new `riscv64gc-unknown-linux-gnu`/`musl` entry in `Cross.toml` plus a corresponding cross Dockerfile - no such work exists in the repository at HEAD `a46e6a1f9e41417c84d6511ca6ac085fec0591d3`.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Container create/start/delete (core OCI lifecycle) | yes | yes | untested/unbuilt |
| Seccomp syscall filtering (production path via `libcontainer`) | yes | yes | enum mapping present, but never built/tested on riscv64 hardware |
| Experimental BPF-instruction-generator seccomp path | yes | yes | absent (no enum variant) |
| cgroup v2 device filters via eBPF (`libbpf-sys`, feature off by default) | yes | yes (per dependency research) | untested (no upstream CI for `libbpf-sys` on riscv64 either) |
| Checkpoint/restore (CRIU, core non-optional dependency) | yes | yes | CRIU merged riscv64 upstream in v4.1 (Mar 2025) but requires Linux kernel >= 6.12-rc7 and lacks RVV vector-register save/restore |
| WASM-OCI backends (wasmtime/wasmer/wasmedge, all optional, none exercised in youki's own CI on any architecture) | untested even on amd64 within youki CI | untested even on arm64 within youki CI | additionally blocked by open riscv64 compiler-crash issues in wasmtime/wasmer Cranelift/singlepass backends |
| Official release binary | yes | yes | no |

**Functional gaps:** riscv64 cannot run youki at all today via any official channel - there is no binary, and building from source is unverified (never attempted in CI, no cross-compilation target configured).

**Performance gaps:** not measurable - no riscv64 benchmark data for youki exists in any source checked (youki's own docs, GitHub issues, or web search). See Section 11 for the specific searches performed.

**Security hardening gaps:** the production seccomp path's riscv64 enum entry has never been exercised in CI (build or test), so its correctness on riscv64 is unverified. youki's release build (per `.github/workflows/release.yaml` and `scripts/build.sh`) ships without seccomp or WASM-OCI backends enabled by default even on the two supported architectures - this is a general youki characteristic, not riscv64-specific.

**NaN / floating-point semantics issues:** none found. No RISC-V-specific floating-point or NaN-boxing correctness issue was located for youki in any search performed (see Section 11) - youki performs no floating-point-sensitive computation itself.

## 7. CI/CD Infrastructure

**No riscv64 CI exists.** Verified by direct inspection of the actual workflow files at commit `a46e6a1f9e41417c84d6511ca6ac085fec0591d3`, not just search indices:

- **Workflow directory** (`.github/workflows/`, 13 files): `basic.yml`, `benchmark_execution_time.yml`, `dependabot_auto.yaml`, `docs.yaml`, `e2e.yaml`, `integration_tests_validation.yaml`, `label.yaml`, `podman_tests.yaml`, `release.yaml`, `runc_integration_tests.yaml`, `selinux.yaml`, `tagpr.yaml`, `update_version_config.yaml`.
- Case-insensitive grep for "riscv" across every workflow file: **zero matches**. No riscv build step, test step, runner label, matrix entry, or trigger condition in any file.
- No alternate CI configuration exists: no `.gitlab-ci.yml`, `Jenkinsfile`, `.cirrus.yml`, `.circleci/`, `.travis.yml`, `azure-pipelines*`, `.drone.yml`, or `.buildkite/` anywhere in the repository.
- `basic.yml`'s actual architecture matrix (the only arch matrix in the workflow set): `arch: ["x86_64", "aarch64"]` for the musl/gnu build-and-test job, `arch: ["x86_64"]` for a second job. riscv64 is absent from both.
- No RISE runner references anywhere: no `riseproject-dev` mention, no RISE runner labels, in any workflow file or elsewhere in the repository.
- No hardware of any kind is used for riscv64 because no riscv64 job exists to use hardware.

### amd64 vs arm64 vs riscv64

| Aspect | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI build job | yes | yes | no |
| CI test execution | yes | yes | no |
| Release-blocking gate | yes | yes | no |
| RISE runner usage | no | no | no |
| Hardware/QEMU used | GitHub-hosted runner | GitHub-hosted runner (implied) | n/a |

## 8. Distribution and Release Status

**No official riscv64 binaries exist for youki through any channel checked:**

- **GitHub releases:** v0.6.0 and v0.7.0 assets are `aarch64-gnu`, `aarch64-musl`, `x86_64-gnu`, `x86_64-musl`, plus source zip/tar.gz - no riscv64 asset in either release. Notably, v0.7.0's changelog contains PR #3497, "fix: use correct fedora version number and deprecate riskv64 from lima-setup.sh" - riscv64 dev-tooling support was actively **removed**, not added.
- **Ubuntu 26.04 ("resolute"):** youki is **not packaged at all**, for any architecture. Confirmed via a project-graph SPARQL query against `deb#BinaryPackage` for `youki`/`python3-youki`/`libyouki` filtered to `inSuite = "resolute"` (empty result set), and independently via a live [packages.ubuntu.com search](https://packages.ubuntu.com/search?keywords=youki&suite=resolute&searchon=names&section=all) ("Sorry, your search gave no results").
- **PyPI:** [`https://pypi.org/pypi/youki/json`](https://pypi.org/pypi/youki/json) returns HTTP 404 Not Found - not applicable, since youki is a Rust project, not Python.
- **RISE wheel builder:** the [gitlab.com/api](https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/youki/) endpoint 302-redirects to `pypi.org/simple/youki/`, which itself 404s. No package present.
- **Arch Linux RISC-V unofficial repo** ([archriscv.felixc.at](https://archriscv.felixc.at)): no package named `youki` listed.
- **Debian/Fedora:** not separately confirmed but consistent with youki not being packaged for any general-purpose Linux distribution at all, on any architecture (source-build via cargo/`cross` only).

**What a user must do to get a working binary today:** build from source using `cargo`/`just`, with no verified path - riscv64 is not a configured `cross` target, so a user would first need to add a `riscv64gc-unknown-linux-gnu` (or `musl`) target to `Cross.toml`, author a corresponding cross Dockerfile, and resolve any resulting build issues themselves, none of which is documented or has been attempted upstream.

## 9. Dependencies

youki is pure Rust; risk to riscv64 concentrates in its optional C/JIT-backed dependencies rather than in youki's own code (no riscv64-specific issues found in youki-dev/youki itself). Important context: youki's CI release build (`just youki-release` -> `scripts/build.sh` with no `-f` flag) ships **without** seccomp or any WASM-OCI backend enabled, and `wasm-wasmtime`/`wasm-wasmer`/`wasm-wasmedge` appear in no CI workflow at all (grep across `.yml`/`.yaml`/`justfile`/`*.sh` returned zero hits) - these backends are effectively untested even on x86_64.

| Dependency | Role in youki | riscv64 build | riscv64 test | riscv64 release | Community |
|---|---|---|---|---|---|
| libseccomp (crate 0.4.0, wraps C lib) | Syscall filtering (default-on for the lib crate, off in youki's actual CI release build) | Ubuntu 26.04 riscv64 packages exist (`libseccomp2`, `libseccomp-dev`); source-level riscv64 support since v2.5.0 (2020) | no upstream CI (build or runtime) for riscv64 | Debian/Ubuntu/Arch ship riscv64 binaries | none open for riscv64; historical kernel blocker resolved 2019, PR #197 merged Feb 2020 |
| rust-criu (checkpoint/restore, core non-optional dep) | Checkpoint/restore, used unconditionally | Ubuntu 26.04 riscv64 packages exist (`criu` plus all transitive deps) | no native runtime CI upstream (cross-compile CI only) | merged upstream in CRIU v4.1 (Mar 2025) as "CRISC-V"; criu.org lists riscv as "In development" vs "Maintained" for arm64/s390x/ppc64le | requires Linux kernel >= 6.12-rc7 (ptrace fix); unimplemented RVV vector-register save/restore (untracked, silent corruption risk) |
| libbpf-sys (eBPF loading, feature off by default) | cgroup v2 device filters | Ubuntu 26.04 riscv64 packages exist (`libbpf1`, `libbpf-dev`) | no upstream CI, absent from `build.yml` matrix | distro packages only, no official upstream binary for any arch | no open libbpf-level riscv64 issues, but kernel-side BPF JIT gaps (`DENYLIST.riscv64` blocks BPF exceptions and bpf2bpf+tailcall mixing) |
| rbpf (pure-Rust eBPF VM, alternative path, feature off by default) | Alternative eBPF path | pure Rust, no C toolchain dependency, builds anywhere Rust targets riscv64gc | no riscv64-specific CI either way | crates.io only | none found |
| wasmtime (46.0.0, Cranelift JIT/AOT, optional) | WASM-OCI backend | Cranelift riscv64 backend exists but unstable | not exercised in youki's CI at all | not packaged in Ubuntu, crates.io only | 108 open issues matching "riscv64" in bytecodealliance/wasmtime, including multiple open compiler-crash reports (#12195, #13959, #11050) and unimplemented vector instructions (#7186) |
| wasmer (7.0.1, Cranelift/singlepass/LLVM, optional) | WASM-OCI backend (youki selects singlepass) | riscv64 support recent and fragile, open crashes (#6078, #5816) | not exercised in youki's CI | not packaged in Ubuntu, crates.io only | 17 riscv64-tagged issues in wasmerio/wasmer, several open; singlepass has weaker riscv64 track record than Cranelift |
| wasmedge-sdk (0.14.0, C++/LLVM, optional) | WASM-OCI backend | not packaged for Ubuntu riscv64 (checked `libwasmedge`, `libwasmedge0`); upstream riscv64 AOT/LLVM port merged and CI-green since 2023 (readiness color blue per `project-reports/wasmedge.md`) | riscv64 CI runs a curated "quick tests" subset under QEMU, HEAVY/FLAKY suites excluded; not exercised in youki's CI | no official riscv64 release binaries or OS/PyPI packages for WasmEdge itself | no open riscv64-specific correctness issues, but several open JIT/AOT correctness bugs in shared code paths unconfirmed on riscv64 |
| flate2 (1.1, compression, core dep) | Archive/tarball compression | default backend is pure-Rust `miniz_oxide`, architecture-portable by construction; zlib fallback also builds fine on riscv64 | no specific gaps known | zlib ships riscv64 distro packages, flate2 itself is crates.io-only | none found for flate2; zlib's only open riscv64 item is an unreviewed RVV-SIMD Adler32 performance PR (#1099), not a correctness blocker |

**Risk ranking:**
1. **Highest risk:** wasmtime and wasmer - both have multiple currently open riscv64 compiler-crash issues in their JIT backends, and neither is exercised anywhere in youki's own CI, so breakage would go undetected.
2. **Moderate, resolved upstream but operationally thin:** libbpf-sys/kernel eBPF JIT (kernel-level DENYLIST gaps), wasmedge-sdk (mature upstream port but zero official riscv64 binaries, reduced CI coverage).
3. **Low risk, effectively solved:** libseccomp (no open riscv64 blockers, Ubuntu-packaged) and CRIU/rust-criu (merged upstream, Ubuntu-packaged, but kernel >= 6.12-rc7 required and RVV register save/restore still missing).
4. **Negligible risk:** rbpf (pure Rust) and flate2 (pure-Rust default backend, trivially portable).

(Section 10, Ecosystem Status, is omitted: youki is a standalone container-runtime binary with no significant dependent package ecosystem - no npm/Maven/Kubernetes-operator/Python-package layer built on top of it that would require separate riscv64 enablement.)

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| n/a | No riscv64-specific issue exists | n/a | n/a | Exhaustive search (`search_issues`, `search_pull_requests`, `search_commits`, `search_code` on `youki-dev/youki`, plus direct GitHub keyword search) found zero dedicated riscv64 issues or PRs. The one issue matching a naive "RISC-V" text search, [#443 "Support for Intelrdt"](https://github.com/youki-dev/youki/issues/443), is actually about Intel RDT and unrelated (closed 2023-04-27). |
| [#369](https://github.com/youki-dev/youki/issues/369) | Decide which architectures to support, etc. | open (since 2021-10-07) | n/a (policy, not a bug) | Raises RISC-V as a hypothetical future possibility only; unresolved after 5 years, 34 comments. |
| [#1515](https://github.com/youki-dev/youki/issues/1515) | Question on youki performance benchmark | closed (2023-02-01) | n/a | General x86_64 fairness/memory-usage question about youki's own benchmark methodology; no RISC-V content. |

**Correctness bugs:** none found specific to riscv64 - because riscv64 has never been built or tested, no correctness bug report is possible in principle. This is an absence-of-data condition, not a confirmation of correctness.

**Performance data:** No riscv64 benchmark exists for youki in any source checked. What quantitative data does exist is x86_64-only: youki's own upstream benchmark (`docs/src/youki.md`, hyperfine methodology, Ubuntu 21.04/kernel 5.11/x86_64) shows youki at 198.4ms mean container create/start/delete vs runc at 352.3ms and crun at 153.5ms; a third-party OneUptime blog post (2026-02-09) shows a Kubernetes 100-replica pod-startup comparison (youki 12.453s vs runc 18.721s, x86_64 only, with the article's own caveat that results are environment-specific). Neither includes RISC-V.

## 12. Objections and Upstream Blockers

**Stated objections:** none explicit against RISC-V specifically. Issue #369 shows the project has never prioritized any architecture beyond x86_64/aarch64, treating additional architectures (ARM, MIPS, PowerPC, RISC-V) as undecided future possibilities rather than rejecting them.

**Technical blockers:**
- No `Cross.toml` target configured for riscv64gc - this must be added before any cross-build is possible.
- No riscv64 Dockerfile for the `cross` tool's Docker-based cross-compilation.
- Critical non-optional dependency `rust-criu`/CRIU requires Linux kernel >= 6.12-rc7 for riscv64 (ptrace fix) and lacks RVV vector-register save/restore, an unimplemented and untracked gap.
- Optional WASM-OCI backends (wasmtime, wasmer) have multiple open, unresolved riscv64 compiler-crash issues upstream.

**Organizational blockers:**
- No maintainer has proposed or is known to be working on riscv64 support.
- The one riscv64-adjacent artifact (Lima VM dev-tooling entry) was added by the lead maintainer and then removed roughly a year later, a mild negative signal about priority rather than an active rejection.
- No RISE project involvement was found (see Section 1/13) - no funding, no CI runner allocation, no wheel-builder or package presence connects RISE to youki.

**Acceptance probability:** Given the project's own architecture policy is unresolved after 5 years even for well-established architectures like ARM, and given no external sponsor (RISE or corporate) has stepped forward, unprompted upstream initiation of riscv64 support appears unlikely in the near term. A well-scoped external contribution (Cross.toml target + CI job + release artifact) would plausibly be accepted given the project's general openness to community PRs (per its Committer/Reviewer promotion path), but no such contribution currently exists or is in flight.

## 13. Readiness Assessment

- **Color:** orange (primary color from Step 1 - no upstream riscv64 CI)
- **Release provider:** none - no channel (upstream GitHub releases, any Linux distro, PyPI, Arch RISC-V) publishes a riscv64 build of youki
- **Optimization gap:** N/A - youki is not an optimization-purpose project. It is a container-lifecycle runtime, not a math/codec/crypto/SIMD library; it contains no ISA-specific hot-path code for any architecture (portable Rust throughout, zero `asm!`/`global_asm!` usages anywhere in the repository), so the Step 2 optimization modifier does not apply.

**Justification:** No upstream riscv64 CI exists in `youki-dev/youki` - all 13 GitHub Actions workflow files were grepped with zero riscv matches, and both [basic.yml](https://github.com/youki-dev/youki/blob/main/.github/workflows/basic.yml) and [release.yaml](https://github.com/youki-dev/youki/blob/main/.github/workflows/release.yaml) restrict their build/test matrices to `["x86_64", "aarch64"]` only. No upstream riscv64 release binary exists - v0.6.0 and v0.7.0 [release assets](https://github.com/youki-dev/youki/releases) are aarch64/x86_64 gnu/musl only - and `Cross.toml` configures only 4 non-riscv64 targets. This is not a distribution-floor case: no Linux distro packages youki for any architecture (confirmed via Ubuntu 26.04 project-graph query and a live [packages.ubuntu.com search](https://packages.ubuntu.com/search?keywords=youki&suite=resolute&searchon=names&section=all)), so the yellow/orange distribution floor does not apply - the color rests purely on the absence of upstream CI, landing at orange per Step 1 ("no upstream riscv64 CI"). This is not red: there is no positive evidence of breakage, only absence of attempt - [issue #369](https://github.com/youki-dev/youki/issues/369), open since 2021, raises riscv64 only as a hypothetical. The one historical riscv64 touchpoint (an experimental Lima VM dev-tooling entry) was added in commit `9a4d4cfc` (2025-05-06) and then explicitly removed in PR #3497 (2026-04-17, "deprecate riskv64 from lima-setup.sh"), a negative trend signal rather than positive momentum.

**Pending work that could change the grade:** None identified. No open PR, issue, or RISE-sponsored effort targets riscv64 support for youki - youki does not appear on the RISE project blog, member list, wheel builder, or in any `riseproject-dev` GitHub repository. Any grade change would require net-new upstream work: adding a riscv64 entry to `Cross.toml`/`cross/Dockerfile.*`, adding a riscv64 arm to the `basic.yml`/`release.yaml` build matrices, and publishing a riscv64 release asset - none of which currently exists or is in flight.

## 14. Investment Analysis

**RISE involvement check:** No RISE funding, CI runner allocation, or packaging work exists for youki (Section 1 research: not on riseproject.dev blog, members list, or wheel builder; no `riseproject-dev` GitHub repo relates to youki). All work items below are unaddressed by any existing effort.

### 14.1 Functional Enablement

To get a first riscv64 build: add a `riscv64gc-unknown-linux-gnu` (and optionally `-musl`) entry to `Cross.toml`, author a corresponding `cross/Dockerfile.gnu`-equivalent riscv64 Dockerfile (installing `libseccomp-dev:riscv64`, `libelf-dev:riscv64`, `zlib1g-dev:riscv64`, `libzstd-dev:riscv64`, mirroring the existing gnu Dockerfile pattern), and add a riscv64 `Riscv64` variant plus `AUDIT_ARCH_RISCV64` constant to the experimental `experiment/seccomp/src/instruction/arch.rs`/`consts.rs` module if that experimental path is to be riscv64-complete. Verify the non-optional `rust-criu` dependency's kernel >= 6.12-rc7 requirement is compatible with target riscv64 environments.

### 14.2 Performance Optimization

Not applicable in the ISA-specific sense (no SIMD/JIT hot paths in youki itself). Any performance work would be limited to verifying the optional WASM-OCI backends (wasmtime, wasmer) once their own upstream riscv64 compiler-crash issues are resolved - this is external upstream work, not youki-side.

### 14.3 CI/CD Infrastructure

Add a riscv64 arm to `basic.yml`'s build/test matrix (build + test execution, matching the existing x86_64/aarch64 job shape) and to `release.yaml`'s release-build matrix. Requires either native riscv64 runners or QEMU-based emulation in GitHub Actions (RISE's own [RISC-V Runners announcement](https://riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github/) describes free native riscv64 GitHub Actions runners with Docker-in-Docker support, though no evidence connects this offering to youki today).

### 14.4 Ecosystem Enablement

Not applicable - youki has no dependent package ecosystem of its own (it is a standalone container runtime binary, not a library with downstream consumers requiring separate enablement).

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Add riscv64gc-unknown-linux-gnu/musl targets to Cross.toml + Dockerfile | 1-2 | Upstream contributor or sponsor | High |
| Functional | Verify/patch non-optional rust-criu dependency against target kernel (>= 6.12-rc7) and confirm no RVV register-save/restore gap affects target workloads | 1-2 | Upstream contributor or sponsor | High |
| Functional | Add Riscv64 variant + AUDIT_ARCH_RISCV64 constant to experimental BPF instruction generator (if experimental path is in scope) | 0.5 | Upstream contributor | Low |
| CI/CD | Add riscv64 arm to basic.yml build+test matrix | 1 | Upstream contributor or sponsor (RISE runner allocation) | High |
| CI/CD | Add riscv64 arm to release.yaml, publish first riscv64 release asset | 0.5 | Upstream contributor or sponsor | High |
| Performance | Track upstream wasmtime/wasmer riscv64 compiler-crash issue resolution before enabling WASM-OCI backends on riscv64 | ongoing (external dependency, not directly billable) | Upstream (wasmtime/wasmer projects) | Medium |

## 15. Updates

(No updates yet - initial report dated 2026-06-17.)

## 16. References

- [youki-dev/youki repository](https://github.com/youki-dev/youki)
- [youki documentation site](https://youki-dev.github.io/youki/)
- [youki governance documentation](https://github.com/youki-dev/youki/blob/main/docs/src/community/governance.md)
- [youki maintainer list](https://github.com/youki-dev/youki/blob/main/docs/src/community/maintainer.md)
- [Issue #369: Decide which architectures to support, etc.](https://github.com/youki-dev/youki/issues/369)
- [Issue #443: Support for Intelrdt](https://github.com/youki-dev/youki/issues/443)
- [Issue #1515: Question on youki performance benchmark](https://github.com/youki-dev/youki/issues/1515)
- [PR #3497: fix: use correct fedora version number and deprecate riskv64 from lima-setup.sh](https://github.com/youki-dev/youki/pull/3497)
- [youki .github/workflows/basic.yml](https://github.com/youki-dev/youki/blob/main/.github/workflows/basic.yml)
- [youki .github/workflows/release.yaml](https://github.com/youki-dev/youki/blob/main/.github/workflows/release.yaml)
- [youki GitHub releases](https://github.com/youki-dev/youki/releases)
- [youki Cross.toml](https://github.com/youki-dev/youki/blob/main/Cross.toml)
- [youki crates/libcontainer/src/seccomp/mod.rs](https://github.com/youki-dev/youki/blob/main/crates/libcontainer/src/seccomp/mod.rs)
- [youki experiment/seccomp/src/instruction/](https://github.com/youki-dev/youki/tree/main/experiment/seccomp/src/instruction)
- [youki docs/src/youki.md (upstream benchmark)](https://github.com/youki-dev/youki/blob/main/docs/src/youki.md)
- [Ubuntu packages.ubuntu.com search for youki, suite=resolute](https://packages.ubuntu.com/search?keywords=youki&suite=resolute&searchon=names&section=all)
- [PyPI JSON API for youki (404)](https://pypi.org/pypi/youki/json)
- [RISE Python wheel builder simple index for youki](https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/youki/)
- [Arch Linux RISC-V unofficial repository](https://archriscv.felixc.at)
- [RISE project blog](https://riseproject.dev/blog/)
- [RISE Project: Announcing the RISE RISC-V Runners](https://riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github/)
- [RISE Project: RISE RISC-V Runners, six weeks in](https://riseproject.dev/2026/05/12/rise-risc-v-runners-six-weeks-in/)
- [RISE project members](https://riseproject.dev/members/)
- [OneUptime blog: youki as a Lightweight OCI Runtime for Kubernetes Pods](https://oneuptime.com/blog) (2026-02-09, exact article URL not separately captured during research)
- [MDPI Electronics: Evaluating ARM and RISC-V Architectures for High-Performance Computing with Docker and Kubernetes](https://www.mdpi.com/2079-9292/13/17/3494)
