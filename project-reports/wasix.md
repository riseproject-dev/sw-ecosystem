---
title: WASIX
parent: Project Reports
color: orange
dependencies:
  - name: Wasmer
    relation: runtime-dependency
    criticality: critical
  - name: Rust
    relation: build-dependency
    criticality: critical
---

# WASIX

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Readiness:** orange<br/>
**Scope:** RISC-V (riscv64/linux) support status for WASIX<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

{% include dependency-graph.html slug="dependencies" subset="wasix" %}

## 1. Project Overview

WASIX is a WASI (WebAssembly System Interface) extension developed and led by Wasmer Inc. that adds POSIX-like syscalls (threading, `fork`, sockets) to WebAssembly modules, enabling programs such as `curl` and `bash` to run inside a WebAssembly sandbox. It is described in Wasmer's own announcement as a feature set for threading, sockets, `fork`, and POSIX compatibility, with no architecture (riscv64/arm64/x86_64) mentioned anywhere in that announcement ([Announcing WASIX](https://wasmer.io/posts/announcing-wasix)).

The repository named in scope for this report, [wasix-org/wasix-witx](https://github.com/wasix-org/wasix-witx), is a WITX interface-specification repository: markdown docs (`README.md`, `Charter.md`, `Contributing.md`, `Proposals.md`) plus a small Rust workspace (`tools/witx`, `tools/witx-cli`) that parses and validates `.witx` files. It defines the WASIX ABI; it does not itself contain a runtime, JIT, or any architecture-specific code. This was confirmed by a full recursive case-insensitive grep of the live default branch (commit `0dfbd35a0f30f3fe7fd3b3ab5a50dc4191d5caed`) for `riscv`, `__riscv`, `x86_64`, and `aarch64` -- all returned zero matches, confirming the repo has no architecture-specific code for any CPU architecture, not riscv64 specifically.

**Governance:** No foundation membership was found. wasix.org carries no governance-model, foundation, or license text on its homepage -- it presents as product marketing, footered "(c) 2026 Wasmer Inc." WASIX is not W3C-standardized; it is an independent, Wasmer-led superset of WASI, explicitly forked from WebAssembly/WASI (credited to the Bytecode Alliance as the parent spec). A `Charter.md` fetch returned content describing W3C WebAssembly Community Group WASI-Subgroup governance (chair selection and charter amendments via full CG vote); this reads as boilerplate inherited from the upstream WASI repository template rather than WASIX-specific governance, and could not be independently confirmed to actually govern this repo [NEEDS VERIFICATION].

**Corporate sponsors:** The single identifiable corporate sponsor and maintainer is **Wasmer Inc.** (copyright holder on wasix.org, drives the `wasix-org` GitHub organization). No other named corporate maintainers or sponsor logos were found. Individual contributors visible in commit-history summaries include Arshia001, zebreus, and maminrayej, with no stated company affiliations found for any of them [NEEDS VERIFICATION -- single source].

**Community culture on new ports:** Within `wasix-witx` itself there is no activity of any kind related to riscv64 -- zero issues, zero pull requests, zero commits, and no CI. The only signal of an active porting culture toward RISC-V exists in the separate, implementing runtime Wasmer, which merged "rudimentary" riscv64gc Singlepass support in January 2026 ([wasmerio/wasmer PR #5711](https://github.com/wasmerio/wasmer/pull/5711)) and has continued landing riscv64 correctness fixes since.

**RISE Project membership:** WASIX is not a RISE Project member. Neither Wasmer nor WASIX appears among the 8 Premier members or 12 General members listed at [riseproject.dev/members](https://riseproject.dev/members/). No RISE blog post mentions WASIX (all 33 posts at [riseproject.dev/blog](https://riseproject.dev/blog/) were checked full-text). The only trace of "WASIX" in RISE-affiliated sources is an unactioned entry in an internal, third-party tracking queue maintained in a separate repository (`riseproject-dev/sw-ecosystem`, file `project-reports/.queue.yml`), not a RISE-funded or RISE-announced deliverable.

## 2. Port History and Upstreoming Timeline

Because `wasix-org/wasix-witx` contains zero riscv-related commits, issues, or pull requests (confirmed via `search_commits`, `search_issues`, and `search_pull_requests` scoped to this repo, all returning 0 results, plus a full-repo content grep), there is no port-history timeline to report for the WASIX interface-specification repo itself. The dated milestones below belong to the reference runtime, **Wasmer**, which is the actual implementation surface where riscv64 support is being built:

| Date | Event | Source |
|---|---|---|
| 2020 | Early feature request: cross-compilation to RISC-V via cargo opened against Wasmer | [wasmerio/wasmer#1448](https://github.com/wasmerio/wasmer/issues/1448) |
| Date not stated in source | Tracking issue opened: "Added RISC-V Support to Cranelift Compiler" | [wasmerio/wasmer#3306](https://github.com/wasmerio/wasmer/issues/3306) |
| 2026-01-14 | Singlepass backend gains "rudimentary" riscv64gc support; passes all 104 spec tests; uses far-jump pseudo-instructions due to the 20-bit near-jump limit on RV64 | [wasmerio/wasmer PR #5711](https://github.com/wasmerio/wasmer/pull/5711) |
| 2026-05-19 | Structural riscv64 issues documented and closed: unaligned load/store not disallowed by Cranelift codegen; trap handling relies on OS signal handlers, which is problematic on signal-less riscv64 targets | [wasmerio/wasmer#6024](https://github.com/wasmerio/wasmer/issues/6024) |

**Key contributors with organizational affiliation:** Data not available -- no named individual was found tied specifically to riscv64 work with a stated company affiliation.

**Is WASIX riscv64 support fully upstream?** For `wasix-witx` itself, the question does not apply -- there is no riscv-specific work to upstream in an architecture-agnostic interface specification. For the implementing runtime (Wasmer), riscv64 support is merged into the upstream default branch but is self-labeled "experimental" (see Section 3) and carries open correctness bugs (see Section 11); it is not at parity with x86_64/aarch64.

## 3. Upstream Support Tier

No formal tier policy (no `PLATFORMS.md`, `SUPPORT.md`, or FAQ tier language) was found for WASIX, either in `wasix-witx` or on wasix.org.

`wasix-witx` itself has no CI evidence of any kind -- build, test, or release -- for any architecture. This was confirmed by direct inspection of the live default branch: no `.github` directory exists at all (not present among the repo's top-level entries), therefore no `.github/workflows/`; no `Jenkinsfile`, `.cirrus.yml`, or `.gitlab-ci.yml` anywhere in the tree; a repo-wide `find` for `*.yml`/`*.yaml` returned nothing.

| Architecture | wasix-witx CI | Wasmer (reference runtime) Singlepass status |
|---|---|---|
| amd64 (x86_64) | No CI exists in this repo | Listed without caveat in Wasmer's Singlepass README |
| arm64 (aarch64) | No CI exists in this repo | Listed without caveat in Wasmer's Singlepass README |
| riscv64 | No CI exists in this repo | Explicitly labeled "(experimental)" in Wasmer's Singlepass README |

## 4. Technical Architecture and RISC-V-Specific Subsystems

`wasix-witx` has zero architecture-specific code for any CPU architecture -- confirmed by code search returning zero matches for `riscv`, `__riscv`, `x86_64`, and `aarch64` in the repo. It contains WITX interface-specification documents and a portable Rust WITX parser tool (`witx-cli`, dependencies: `anyhow`, `log`, `thiserror`, `wast`, `rayon` -- pure-Rust, architecture-agnostic); there is no JIT, SIMD, crypto, assembly, or GC-barrier code in this repository.

The architecture-specific implementation surface that actually executes WASIX-targeted WebAssembly modules is the reference runtime **Wasmer**, a separate project with its own report (`project-reports/wasmer.md`, color: green per that report). Its riscv64-relevant subsystems, per the research findings:

- **Singlepass JIT:** hand-written `emitter_riscv.rs`, using `dynasm!` macro-based assembler generation targeting `riscv64`/`.feature g`, matched by `MachineRiscv` in `machine.rs`. Self-documented in Wasmer's `lib/compiler-singlepass/README.md` as "(experimental)" versus unqualified entries for x86_64 and aarch64.
- **Cranelift JIT:** riscv64 wiring exists (`classify_return_type_riscv64`, `Architecture::Riscv64` match arms in `abi.rs`, `object_file.rs`, `misc.rs`, `mapped_binary.rs`, `unwind.rs`) but carries two open correctness bugs: an ISLE `gen_bitcast` panic on SIMD-extension ops ([wasmerio/wasmer#6078](https://github.com/wasmerio/wasmer/issues/6078), open) and a SIGSEGV in the `skip_stack_guard_page` test, reproduced both under QEMU and on real riscv64 hardware ([wasmerio/wasmer#5816](https://github.com/wasmerio/wasmer/issues/5816), open).
- **LLVM JIT:** riscv64 wiring exists but `tests/ignores.txt` explicitly skips riscv64+llvm for `static_function`, `static_function_with_env`, `spec::multi_value::binary`, `spec::multi_value::block`, and `spec::simd::simd_align` -- i.e., calling-convention/ABI handling, multi-value returns, and SIMD alignment are known-broken and excluded from the LLVM-backend test gate.
- **WASM SIMD:** absent on all Wasmer backends for riscv64 -- no RVV/vector codegen exists in Cranelift, LLVM, or Singlepass.
- **AOT compilation (`create-exe`):** compiling to a native executable for `riscv64-unknown-linux-gnu` segfaults ([wasmerio/wasmer#5951](https://github.com/wasmerio/wasmer/issues/5951), open, GDB backtrace shows crash in `__GI___libc_free`).

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Singlepass JIT | Full, hand-tuned (`emitter_x64.rs`), no caveat | Full, hand-tuned (`emitter_arm64.rs`), no caveat | Present, hand-tuned (`emitter_riscv.rs`), labeled "experimental" |
| Cranelift JIT | Full | Full | Wired in; 2 open correctness bugs |
| LLVM JIT | Full | Full | Wired in; calling-convention/multi-value/SIMD-alignment tests skipped |
| WASM SIMD | Supported | Supported | Absent on all backends |
| AOT (`create-exe`) | Working | Working | Segfaults (open bug) |

## 5. Build System, Cross-Compilation, and Toolchain

`wasix-witx` has no build system for compiled, architecture-specific software. Confirmed absent by direct inspection of the live repo: `BUILDING.md`, `INSTALL`, `docs/building.md`, `CMakeLists.txt`, any `cmake/` directory, and any Dockerfile. The repo's only build artifacts are two `Cargo.toml` manifests (`tools/witx`, `tools/witx-cli`) for a portable WITX-parsing dev tool with pure-Rust, architecture-agnostic dependencies. There are consequently no exact cmake/configure commands, no documented minimum GCC/Clang version, no `-DUSE_X=OFF`-style flags, and no QEMU usage instructions in this repository -- this build infrastructure category does not exist here.

Host-toolchain availability for the broader ecosystem (not this repo's own build pipeline) was checked against Ubuntu 26.04 (resolute) riscv64 packages: `rustc` (1.93.1ubuntu1), `llvm-22` (1:22.1.2-1ubuntu1), `clang-22` (1:22.1.2-1ubuntu1), and the `gcc-riscv64-linux-gnu` cross toolchain (4:15.2.0-5ubuntu1) are all present. This means the host toolchains needed to build Rust/LLVM-based WASIX tooling exist on riscv64, even though `wasix-witx` has no build pipeline that exercises them.

For context only, Wasmer's own cross-compilation rig (a separate project) uses a dedicated Docker cross-build image (`.github/cross-linux-riscv64/Dockerfile`) with `build_openssl.sh` and a `config.toml` wired to a `qemu-riscv64` runner, plus a dedicated `linux-riscv64` CI job in `.github/workflows/build.yml`. This is Wasmer's build infrastructure, not `wasix-witx`'s.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

`wasix-witx` defines the WASIX ABI/interface text only; it has no runtime behavior of its own to gap-analyze between architectures -- the interface specification is identical regardless of host CPU. Practical WASIX feature coverage on riscv64 depends entirely on the implementing runtime, Wasmer.

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Singlepass JIT execution | Yes | Yes | Yes (experimental) |
| Cranelift JIT execution | Yes | Yes | Yes, with 2 open correctness bugs |
| LLVM JIT execution | Yes | Yes | Yes, with calling-convention/multi-value/SIMD-alignment gaps (tests skipped) |
| WASM SIMD | Yes | Yes | No |
| AOT native executable (`create-exe`) | Yes | Yes | Segfaults (open bug) |
| Upstream release artifact | Yes | Yes | Yes (`wasmer-linux-riscv64.tar.gz`) |

**Functional gaps:** WASM SIMD is absent on riscv64 across all Wasmer backends; multi-value function returns and calling-convention/ABI handling are test-skipped under the LLVM backend on riscv64; AOT compilation to a native executable crashes.

**Performance gaps:** Data not available for a riscv64-specific quantitative delta. Searches for "WASIX riscv64 vs arm64 performance" and "WASIX riscv64 benchmark site:github.com" returned nothing WASIX-specific. Generic Wasmer instruction-level microbenchmarks exist only for x86_64 -- e.g., [wasmerio/wasmer#6083](https://github.com/wasmerio/wasmer/issues/6083) (`f64.convert_i64_u`, roughly 200x slower than WasmEdge/WAMR on the x86_64 LLVM backend) and [wasmerio/wasmer#5771](https://github.com/wasmerio/wasmer/issues/5771) (`f64.min`, roughly 100x slower on x86_64) -- and these are cited only as evidence of general LLVM-backend performance-class issues, not riscv64 data.

**Security hardening gaps:** Data not available -- no riscv64-specific security-hardening comparison (stack protector, CFI, ASLR behavior) was found for WASIX or Wasmer.

**NaN / floating-point semantics:** No NaN-canonicalization or floating-point semantics bug was found filed against Wasmer or any `wasix-org` repository. General RISC-V NaN-boxing issues exist in unrelated projects (SpiderMonkey Wasm baseline, Valgrind, Unicorn) but nothing filed against wasmer/wasix-org repos.

## 7. CI/CD Infrastructure

`wasix-witx` has no CI of any kind. Direct inspection of the live default branch (commit `0dfbd35a0f30f3fe7fd3b3ab5a50dc4191d5caed`) confirms: no `.github` directory, no `.github/workflows/`, no `Jenkinsfile`, `.cirrus.yml`, or `.gitlab-ci.yml` anywhere in the tree. A repo-wide search for `*.yml`/`*.yaml` returned nothing. No RISE runners are used, because there is no CI pipeline for them to run in.

| | amd64 | arm64 | riscv64 |
|---|---|---|---|
| wasix-witx CI (build) | No CI exists | No CI exists | No CI exists |
| wasix-witx CI (test) | No CI exists | No CI exists | No CI exists |
| wasix-witx CI (release) | No CI exists | No CI exists | No CI exists |
| Wasmer (reference runtime) CI, cited for context | Full build+test+release | Full build+test+release | Build+release via QEMU cross-build; LLVM backend excluded (`ENABLE_LLVM=0`); Cranelift-only tests gate |

## 8. Distribution and Release Status

`wasix-witx` has no GitHub releases at all -- the releases page states "There aren't any releases here" ([wasix-org/wasix-witx/releases](https://github.com/wasix-org/wasix-witx/releases)). No PyPI, npm, Maven, or OCI artifacts are published from this repo; it is a spec/tooling repo, not a distributable package.

A PyPI package literally named `wasix` exists ([pypi.org/pypi/wasix/json](https://pypi.org/pypi/wasix/json)) but appears to be a separate, largely dormant project: only two source sdists were ever published (`wasix-0.1.0.tar.gz`, `wasix-0.1.1.tar.gz`, latest 0.1.1, published 2022-11-24), no wheels, no riscv64 artifact, nothing since 2022 [NEEDS VERIFICATION: whether this PyPI project is actually affiliated with `wasix-org`]. The RISE GitLab wheel builder has no `wasix` package of its own -- [its PyPI simple index for wasix](https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/wasix/) returns HTTP 302, redirecting straight to pypi.org.

On Ubuntu 26.04 (resolute), the related package **`wasix-libc`** (upstream `wasix-org/wasix-libc`, a different repository from `wasix-witx`) is packaged at version `2025.12.24.1+ds-1`, universe section, listing riscv64 among its architectures (amd64, arm64, armhf, ppc64el, riscv64, s390x) -- confirmed at [packages.ubuntu.com](https://packages.ubuntu.com/search?keywords=WASIX&suite=resolute&searchon=names&section=all). This was cross-verified against Launchpad's build-farm records directly: builder `bos03-riscv64-025`, build `#32275870`, status "Successfully built", built 2026-02-14 (duration 31m36s), at [launchpad.net/ubuntu/+source/wasix-libc/2025.12.24.1+ds-1](https://launchpad.net/ubuntu/+source/wasix-libc/2025.12.24.1+ds-1). Caveat: this build sits in the **resolute-proposed** pocket, not yet migrated to the release pocket, per that same Launchpad build page. An older Ubuntu packaging entry, `wasix-libc 2024.07.08.1+ds-1`, was also referenced as a queued/target-architecture listing ([launchpad.net](https://launchpad.net/ubuntu/+source/wasix-libc/2024.07.08.1+ds-1)).

The Arch Linux RISC-V port has no `wasix` package -- a raw grep of [archriscv.felixc.at/?q=wasix](https://archriscv.felixc.at/?q=wasix) returned zero matches.

Wasmer itself (the runtime) is not packaged in any Ubuntu suite at all (`packages.ubuntu.com/resolute/riscv64/wasmer` returns no package match, any suite); it is distributed only as a GitHub release tarball, `wasmer-linux-riscv64.tar.gz`, which is available for riscv64.

**What a user must do today:** There is no upstream `wasix-witx` release to install -- none exists. To execute WASIX-targeted WebAssembly modules on a riscv64 host, a user would need to (a) obtain the Wasmer runtime's riscv64 GitHub release tarball (available, but not distro-packaged), and (b) target modules built against `wasix-libc`, whose Ubuntu riscv64 package currently sits only in the resolute-proposed pocket, not the stable release.

## 9. Dependencies

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Notes |
|---|---|---|---|---|---|
| Wasmer | Reference runtime that executes WASIX-targeted WebAssembly modules (runtime-dependency, critical) | Yes, dedicated `linux-riscv64` CI job | Cranelift-backend tests pass in CI; LLVM backend excluded from riscv64 CI (`ENABLE_LLVM=0`) | Yes, ships `wasmer-linux-riscv64.tar.gz` on every GitHub release | Singlepass riscv64 labeled "(experimental)"; open bugs [#6078](https://github.com/wasmerio/wasmer/issues/6078), [#5816](https://github.com/wasmerio/wasmer/issues/5816), [#5951](https://github.com/wasmerio/wasmer/issues/5951); no WASM SIMD on riscv64 on any backend |
| Rust | Toolchain used to build WASIX-side tooling (`witx-cli` parser) and Wasmer itself (build-dependency, critical) | Yes, Ubuntu 26.04 riscv64 ships `rustc` 1.93.1ubuntu1 | Rust is riscv64 Tier 2 upstream, per internal report `project-reports/rust.md` (color: blue) | Distro-provided (Ubuntu) | No WASIX-specific riscv64 issues found against Rust |

**Deep dive -- critical sub-dependencies of Wasmer** (the runtime that carries the actual JIT/SIMD/crypto workload; recursed per the underlying research):

- **Cranelift** (bytecodealliance/wasmtime), default JIT backend: native riscv64 target ships; two open crashes reconfirmed live -- [#6078](https://github.com/wasmerio/wasmer/issues/6078) (ISLE `gen_bitcast` panic on SIMD-extension ops) and [#5816](https://github.com/wasmerio/wasmer/issues/5816) (SIGSEGV, memory-safety, `skip_stack_guard_page`).
- **LLVM** (via `inkwell`), optional high-performance JIT backend: requires exact LLVM 22 (confirmed present, Ubuntu 26.04 riscv64: `llvm-22` 1:22.1.2-1ubuntu1, `clang-22` 1:22.1.2-1ubuntu1); explicitly excluded from Wasmer's own riscv64 CI (`ENABLE_LLVM=0`).
- **Singlepass**, via `dynasm`/`dynasmrt`: fast baseline JIT assembler; `emitter_riscv.rs` exists but whether it is fully wired into the Makefile's riscv64 build path is a contradicted finding in the underlying Wasmer report [NEEDS VERIFICATION, per `project-reports/wasmer.md`].
- **WASM SIMD:** absent on all Wasmer backends for riscv64 (no RVV/vector codegen in Cranelift, LLVM, or Singlepass); no workaround planned per the research findings.
- **OpenSSL** (via Wasmer's curl/libcurl cross-build toolchain): built from source pinned to 3.1.1, static, `no-asm`; distro `openssl`/`libssl-dev` confirmed present Ubuntu 26.04 riscv64 (3.5.5-1ubuntu3); AES/GHASH constant-time issues on riscv64 are noted in the internal `libcurl.md` report Section 9, rated High/security severity.
- **corosensei**, fiber/coroutine context switching: explicit riscv64/riscv32 arch module exists, no issues found.
- **gcc-riscv64-linux-gnu** cross toolchain: confirmed present Ubuntu 26.04 riscv64 (4:15.2.0-5ubuntu1).

**Rust's own downstream/related packages relevant to this stack:**

- **tokio** (async IO runtime, ported): upstream `tokio-rs/tokio` has one closed riscv64 bug, [tokio-rs/tokio#6355](https://github.com/tokio-rs/tokio/issues/6355), "Segmentation fault in `park_timeout()` on riscv64" (closed).
- **mio** (non-blocking IO, ported): no riscv64-specific issues found on `tokio-rs/mio`.
- **curl** (URL transfer, ported): no riscv64-blocking issues on `curl/curl`; several GCC-13 `-Warray-bounds` warnings specifically triggered by riscv64 builds, all silenced; `curl`/`libcurl4t64` confirmed present Ubuntu 26.04 riscv64 (8.18.0-1ubuntu2).
- **cpython** (Python interpreter, ported): upstream CPython has a real riscv64 bug history -- [python/cpython#133304](https://github.com/python/cpython/issues/133304), `PyFloat_Pack4`/`Unpack4` SNaN roundtrip failure on the riscv64 buildbot (data-corruption class, fixed by PR #133328); the riscv64 buildbot is tagged "unstable" with no Tier-3 promotion; `python3` confirmed present Ubuntu 26.04 riscv64 (3.14.3-0ubuntu2, distro-built not upstream).

## 11. Known Bugs and Active Issues

`wasix-witx` itself has zero issues of any kind related to riscv64 -- confirmed by 0 results across `search_issues`, `search_pull_requests`, and `search_commits` scoped to this repo, plus a full repo content grep. All entries below belong to the implementing runtime, Wasmer.

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [wasmerio/wasmer#5816](https://github.com/wasmerio/wasmer/issues/5816) | `wast::spec::skip_stack_guard_page::cranelift` crashes on riscv64gc target | Open | High (correctness/crash) | SIGSEGV reproduced under QEMU and on real riscv64 hardware |
| [wasmerio/wasmer#6078](https://github.com/wasmerio/wasmer/issues/6078) | `simd_generated_ext_ops::cranelift` crashes for RISC-V | Open | High (correctness/crash) | Cranelift ISLE panic: "no rule matched for term `gen_bitcast`" in `isa/riscv64/inst.isle`; follow-up to #5687 |
| [wasmerio/wasmer#5951](https://github.com/wasmerio/wasmer/issues/5951) | `create-exe` for `riscv64-unknown-linux-gnu` segfaults | Open | High (correctness/crash) | `wasmer create-exe --target riscv64-unknown-linux-gnu --llvm` segfaults in `__GI___libc_free` (Wasmer 6.1.0) |
| [wasmerio/wasmer#6024](https://github.com/wasmerio/wasmer/issues/6024) | Testing cranelift on RISC-V | Closed (2026-05-19) | Medium | Documented two structural issues: unaligned load/store not disallowed by codegen; trap handling relies on OS signal handlers, problematic without OS signal support |
| [wasmerio/wasmer#6000](https://github.com/wasmerio/wasmer/issues/6000) | RISC-V LLVM compiler tests fail | Closed | Medium | Adding exception support to the LLVM compiler broke riscv64 relocations (`R_RISCV_ADD32`, `R_RISCV_SUB32`, `R_RISCV_32_PCREL`, `R_RISCV_SET6`, `R_RISCV_SUB6` unsupported) |
| [wasmerio/wasmer#5811](https://github.com/wasmerio/wasmer/issues/5811) | `spec::simd` with Cranelift should be ignored on riscv64 per `ignores.txt` but isn't | Closed | Medium | 110/113 SIMD tests failed with "entered unreachable code" in `cranelift-codegen` riscv64 inst args; ignore-list wasn't honored |
| [wasmerio/wasmer#5810](https://github.com/wasmerio/wasmer/issues/5810) | `huge_number_of_arguments_fn` stuck on riscv64gc | Closed (fixed via PR #5866) | Medium | Cranelift test hangs under QEMU on riscv64gc versus approximately 1 second on AArch64 |
| [wasmerio/wasmer#5711](https://github.com/wasmerio/wasmer/pull/5711) | Singlepass: add support for riscv64 target | Merged 2026-01-14 | N/A (feature) | Adds "rudimentary" riscv64gc support; passed all 104 spec tests; uses far-jump pseudo-instructions due to the 20-bit near-jump limit on RV64; flagged as needing further performance optimization |
| [wasmerio/wasmer#3306](https://github.com/wasmerio/wasmer/issues/3306) | Added RISC-V Support to Cranelift Compiler | Closed/merged | N/A (feature) | Original feature-tracking issue |
| [wasmerio/wasmer#1448](https://github.com/wasmerio/wasmer/issues/1448) | Cross compilation to RISCV using cargo | Closed | N/A (feature request) | Early (2020) request |

**Correctness bugs, highlighted separately:** [wasmerio/wasmer#5816](https://github.com/wasmerio/wasmer/issues/5816) (SIGSEGV), [wasmerio/wasmer#6078](https://github.com/wasmerio/wasmer/issues/6078) (Cranelift panic on SIMD-extension ops), and [wasmerio/wasmer#5951](https://github.com/wasmerio/wasmer/issues/5951) (create-exe segfault) are all open, confirmed crash/correctness defects specific to riscv64, distinct from the performance issues noted elsewhere.

## 12. Objections and Upstream Blockers

No stated organizational objection to riscv64 support was found for WASIX or Wasmer.

**Technical blockers** (from findings): Cranelift ISLE codegen gaps for SIMD-extension bitcast operations ([#6078](https://github.com/wasmerio/wasmer/issues/6078)); memory-safety/stack-guard-page handling on riscv64 ([#5816](https://github.com/wasmerio/wasmer/issues/5816)); LLVM backend calling-convention/ABI and relocation handling for riscv64 ([#6000](https://github.com/wasmerio/wasmer/issues/6000), and the `tests/ignores.txt` skip list); complete absence of WASM SIMD codegen on riscv64 across all backends; AOT compilation (`create-exe`) crash ([#5951](https://github.com/wasmerio/wasmer/issues/5951)).

**Organizational blockers:** WASIX itself (`wasix-witx`) has no governance-level engagement with riscv64 at all -- zero issues, zero pull requests, zero CI, zero discussion found in the repo. No RISE Project funding or membership exists for WASIX or Wasmer (confirmed against [riseproject.dev/members](https://riseproject.dev/members/) and [riseproject.dev/leadership](https://riseproject.dev/leadership/)); WASIX appears only as an unactioned entry in an internal, third-party tracking queue (`riseproject-dev/sw-ecosystem`, file `project-reports/.queue.yml`), not as RISE-funded work.

**Acceptance probability:** Data not available in a form that supports a quantitative estimate. Qualitatively, the reference runtime (Wasmer) has already merged basic riscv64 support and is actively fixing bugs (recent history: [#5711](https://github.com/wasmerio/wasmer/pull/5711), plus follow-on fixes referenced in the research as #6020 and #6072), indicating an open, receiving-contributions posture at the runtime level -- even though WASIX's own ABI-spec repo shows no riscv64-specific activity to accept or reject, there being nothing architecture-specific in that repo to begin with.

## 13. Readiness Assessment

- **Color:** orange (downstream-only)
- **Release provider:** Ubuntu, resolute-proposed pocket (not yet promoted to general release) -- not upstream
- Not an optimization-purpose project (WASIX is a POSIX-syscall ABI/interface specification, not a performance-differentiated library); Step 2 of the color model does not apply, so no optimization level is reported in this header.
- **Justification:** `wasix-org/wasix-witx` has no upstream CI of any kind (no `.github/workflows/`, no alternative CI config) and no GitHub releases at all -- confirmed by direct inspection of the live repository and its [releases page](https://github.com/wasix-org/wasix-witx/releases) ("There aren't any releases here"). With no upstream CI, the distribution floor applies: the related `wasix-libc` package is built for riscv64 on Ubuntu 26.04 (resolute), confirmed via [Launchpad's build record](https://launchpad.net/ubuntu/+source/wasix-libc/2025.12.24.1+ds-1) (builder `bos03-riscv64-025`, build #32275870, "Successfully built"), but this build is unmigrated in the `-proposed` pocket and its patch status relative to upstream was not confirmed -- placing it in the "patched/unknown" distribution-floor case, which caps at orange rather than yellow.
- **Pending work that could change the grade:** The reference runtime Wasmer (a separately graded project, color green per `project-reports/wasmer.md`) continues to land riscv64 fixes (most recently PR #5711 merging Singlepass riscv64gc support), which improves the practical ability to execute WASIX programs on riscv64 even though it does not change `wasix-witx`'s own grade. If the `wasix-libc` Ubuntu package migrates from resolute-proposed to the release pocket, and/or if `wasix-org` stands up any CI for `wasix-witx` itself (currently none exists), this grade should be re-evaluated. No RISE involvement currently exists to accelerate this (see Section 12).

## 14. Investment Analysis

RISE has not funded or engaged with WASIX in any capacity found in this research (Section 1, Section 12) -- there is no existing RISE work to net out of the estimates below. Separately, the reference runtime Wasmer already carries substantial, independently-funded riscv64 work (merged Singlepass support, dedicated CI, GitHub release artifacts); this analysis focuses on what remains for the WASIX layer specifically and does not re-size Wasmer's own riscv64 backlog, which belongs to its own report.

### 14.1 Functional Enablement

- Stand up basic CI in `wasix-witx` (currently none exists for any architecture) so that the WITX spec and its parser tool (`witx-cli`) are validated on riscv64 hosts, closing the "no upstream CI at all" gap that currently caps this project's color.
- Track and help resolve the three open riscv64 correctness bugs in Wasmer that block reliable execution of WASIX-targeted modules: [#6078](https://github.com/wasmerio/wasmer/issues/6078) (Cranelift SIMD-ext panic), [#5816](https://github.com/wasmerio/wasmer/issues/5816) (SIGSEGV), and [#5951](https://github.com/wasmerio/wasmer/issues/5951) (create-exe segfault).
- Work with Canonical/Ubuntu to promote the `wasix-libc` riscv64 build out of the resolute-proposed pocket into general release.

### 14.2 Performance Optimization

- No WASM SIMD codegen exists on riscv64 across any Wasmer backend (Cranelift, LLVM, Singlepass). Closing this requires RVV-based codegen work in Cranelift and/or LLVM's riscv64 backend -- this is upstream Wasmer/Cranelift/LLVM work, not something addressable within `wasix-witx`.
- No riscv64-specific performance benchmark data exists for WASIX or Wasmer (Section 6); establishing a baseline benchmark suite is a prerequisite to any further performance investment decision.

### 14.3 CI/CD Infrastructure

- `wasix-witx` has zero CI. Minimum viable investment: add a GitHub Actions workflow that builds and runs the `witx-cli`/`witx` Rust tool crate on riscv64 (native or QEMU), matching the pattern already used by Wasmer's `linux-riscv64` job.
- No RISE runner usage exists for WASIX today; engaging RISE's RISC-V CI runners (referenced in RISE's own [Runners announcement](https://riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github/)) could provide native riscv64 hardware for this CI at no infrastructure cost, subject to RISE approving WASIX as an eligible project (no such engagement currently exists, per Section 1).

### 14.4 Ecosystem Enablement

Section 10 is omitted from this report: WASIX/Wasmer is a runtime plus ABI specification and does not have a significant dependent package ecosystem (Python packages, npm packages, Kubernetes operators, Maven JARs) that must each be individually enabled on riscv64, per the report's scoping rules.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Stand up riscv64 CI for `wasix-witx`'s `witx-cli` tool crate | 1-2 | wasix-org | Medium |
| Functional | Fix Wasmer #6078 (Cranelift ISLE `gen_bitcast` panic on riscv64 SIMD-ext ops) | Data not available -- effort estimate requires Cranelift/ISLE domain expertise not established in findings | Wasmer / Cranelift upstream | Critical |
| Functional | Fix Wasmer #5816 (SIGSEGV in `skip_stack_guard_page` on riscv64gc) | Data not available | Wasmer / Cranelift upstream | Critical |
| Functional | Fix Wasmer #5951 (`create-exe` riscv64 segfault) | Data not available | Wasmer upstream | High |
| Distribution | Promote `wasix-libc` riscv64 build from resolute-proposed to release | Data not available -- packaging/QA process, not engineering estimate | Canonical / Ubuntu | Medium |
| Performance | Establish riscv64 baseline benchmark suite for WASIX/Wasmer (none currently exists) | 2-3 | Wasmer or third party | Medium |
| Performance | RVV-based WASM SIMD codegen for riscv64 (absent on all backends) | Data not available -- substantial compiler-backend investment, no estimate supportable from findings | Cranelift/LLVM/Wasmer upstream | Low (given absence of benchmark baseline to justify prioritization) |

## 15. Updates

(No updates yet -- initial report dated 2026-06-17.)

## 16. References

- [wasix-org/wasix-witx (repository)](https://github.com/wasix-org/wasix-witx)
- [wasix.org (homepage)](https://wasix.org/)
- [wasix-org/wasix-witx releases page](https://github.com/wasix-org/wasix-witx/releases)
- [Announcing WASIX (Wasmer blog)](https://wasmer.io/posts/announcing-wasix)
- [PyPI: wasix package JSON API](https://pypi.org/pypi/wasix/json)
- [PyPI simple index: wasix](https://pypi.org/simple/wasix/)
- [RISE GitLab wheel builder PyPI index: wasix](https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/wasix/)
- [Ubuntu packages search: WASIX, suite resolute](https://packages.ubuntu.com/search?keywords=WASIX&suite=resolute&searchon=names&section=all)
- [Launchpad: wasix-libc 2025.12.24.1+ds-1 (Ubuntu source package)](https://launchpad.net/ubuntu/+source/wasix-libc/2025.12.24.1+ds-1)
- [Launchpad: wasix-libc 2024.07.08.1+ds-1 (Ubuntu source package)](https://launchpad.net/ubuntu/+source/wasix-libc/2024.07.08.1+ds-1)
- [Arch Linux RISC-V port search: wasix](https://archriscv.felixc.at/?q=wasix)
- [RISE Project blog listing](https://riseproject.dev/blog/)
- [RISE Project members](https://riseproject.dev/members/)
- [RISE Project leadership](https://riseproject.dev/leadership/)
- [RISE Project RISC-V Runners announcement](https://riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github/)
- [RISE blog: A Glimpse Into V8 Development for RISC-V](https://riseproject.dev/2025/12/09/a-glimpse-into-v8-development-for-risc-v/)
- [wasmerio/wasmer#6083](https://github.com/wasmerio/wasmer/issues/6083)
- [wasmerio/wasmer#5771](https://github.com/wasmerio/wasmer/issues/5771)
- [wasmerio/wasmer#6234](https://github.com/wasmerio/wasmer/issues/6234)
- [wasmerio/wasmer#5816](https://github.com/wasmerio/wasmer/issues/5816)
- [wasmerio/wasmer#6078](https://github.com/wasmerio/wasmer/issues/6078)
- [wasmerio/wasmer#5951](https://github.com/wasmerio/wasmer/issues/5951)
- [wasmerio/wasmer#6024](https://github.com/wasmerio/wasmer/issues/6024)
- [wasmerio/wasmer#6000](https://github.com/wasmerio/wasmer/issues/6000)
- [wasmerio/wasmer#5811](https://github.com/wasmerio/wasmer/issues/5811)
- [wasmerio/wasmer#5810](https://github.com/wasmerio/wasmer/issues/5810)
- [wasmerio/wasmer PR #5711](https://github.com/wasmerio/wasmer/pull/5711)
- [wasmerio/wasmer#3306](https://github.com/wasmerio/wasmer/issues/3306)
- [wasmerio/wasmer#1448](https://github.com/wasmerio/wasmer/issues/1448)
- [wasmerio/wasmer#6401 (checked, confirmed not RISC-V specific)](https://github.com/wasmerio/wasmer/issues/6401)
- [tokio-rs/tokio#6355](https://github.com/tokio-rs/tokio/issues/6355)
- [python/cpython#133304](https://github.com/python/cpython/issues/133304)
- Internal report: `project-reports/wasmer.md` (color: green)
- Internal report: `project-reports/libcurl.md` (color: yellow)
- Internal report: `project-reports/python.md` (color: blue)
- Internal report: `project-reports/rust.md` (color: yellow, cited in dependency research; note discrepancy against Section 9's "Tier 2 upstream, color: blue" citation elsewhere in the underlying research -- both readings trace to the same file and were not reconciled by the source research)
- Internal tracking file: `riseproject-dev/sw-ecosystem`, `project-reports/.queue.yml` (WASIX listed as queued, unactioned)