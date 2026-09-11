---
title: WasmEdge-QuickJS
parent: Project Reports
color: green
---

{% include dependency-graph.html slug="dependencies" subset="wasmedge-quickjs" %}

# WasmEdge-QuickJS

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-09-10<br/>
**Readiness:** green<br/>
**Scope:** RISC-V (riscv64/linux) support status for WasmEdge-QuickJS<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

WasmEdge-QuickJS ([second-state/wasmedge-quickjs](https://github.com/second-state/wasmedge-quickjs)) is a Rust crate that embeds Fabrice Bellard's QuickJS JavaScript engine (vendored as a prebuilt static library, `lib/libquickjs.a`, MIT-licensed per the bundled `LICENSE-QuickJS.txt`) and compiles it to run as a WebAssembly module inside the WasmEdge runtime. The crate targets `wasm32-wasi` exclusively; there is no native (amd64/arm64/riscv64) build of this project as such, because its output is portable WASM bytecode, not a machine-code binary.

**Governance:** The `wasmedge-quickjs` repository itself has no MAINTAINERS, OWNERS, CODEOWNERS, GOVERNANCE.md, or PLATFORMS.md file - it is a subproject with no independent governance documentation. Governance for the broader WasmEdge ecosystem lives in the parent [WasmEdge/WasmEdge repository](https://github.com/WasmEdge/WasmEdge) (`docs/GOVERNANCE.md`, `docs/CONTRIBUTOR_LADDER.md`): a lazy-consensus model with a five-tier contributor ladder (Community Participant to Maintainer), requiring a two-thirds Maintainer majority vote after a 3-5 business day public discussion to add new subprojects/repositories. WasmEdge's own governance document states "Currently all maintainers represent a single organization," which is consistent with the commit-history evidence below.

**Corporate sponsors:** License is Apache-2.0. WasmEdge (the runtime host for this project) is a CNCF Sandbox project, accepted April 28, 2021, but `wasmedge-quickjs` itself sits under the `second-state` GitHub org, not the `WasmEdge` org, and is not separately a CNCF project. **Second State** (Austin, TX) is the corporate driver: Michael Yuan (`michael@secondstate.io`, Second State co-founder/CEO) is the #4/#5 top committer with 102 combined commits across two email variants. No other named corporate sponsor is disclosed. The project is **not** a RISE Project member (checked against [riseproject.dev/members](https://riseproject.dev/members/) - neither Second State, WasmEdge, nor wasmedge-quickjs appear among the 8 Premier or 12 General Members).

**Top contributors (by commit count):** csh (88, `458761603@qq.com`), Puellaquae (87), "2021"/csh alias (82), Michael Yuan/Second State (52+50 across two emails), tcdk/csh alias (16), zzz/csh alias (11). Aside from Second State, other top contributors use personal QQ/hotmail addresses with no disclosed employer.

**Community stance on new ports:** Undocumented/silent. No CONTRIBUTING.md, no platform-support tier policy, and no issue, PR, or CI signal - positive or negative - regarding architecture ports exists anywhere in the repository.

## 2. Port History and Upstreaming Timeline

There is no RISC-V port history because no RISC-V work has ever been performed in this repository.

| Date | Event | Source |
|---|---|---|
| N/A | No riscv-related commit, issue, PR, branch, or tag exists | `git log --all -i --grep=riscv` and `-S riscv` (pickaxe): 0 genuine hits; [GitHub search: riscv repo:second-state/wasmedge-quickjs](https://github.com/second-state/wasmedge-quickjs) (issues, PRs, commits, code): 0 results across all four search types |

**Key contributors to a riscv64 port:** none - no such work exists.

**Fully upstream?** Not applicable - there is nothing to upstream, since the project's distribution artifact (portable `.wasm` bytecode) requires no architecture-specific code to run on riscv64 (see Section 4 and Section 13).

## 3. Upstream Support Tier

No formal tier policy for CPU architectures exists in this repository (see Section 1). The project's single CI workflow, [`.github/workflows/examples.yml`](https://github.com/second-state/wasmedge-quickjs/blob/main/.github/workflows/examples.yml), builds only for the `wasm32-wasi` target on a standard `ubuntu-20.04` x86_64 GitHub-hosted runner - there is no `arch:` build matrix of any kind (not amd64 vs arm64 vs riscv64), because the crate does not produce native-architecture binaries.

| | amd64 (build host) | arm64 (target host) | riscv64 (target host) |
|---|---|---|---|
| Upstream CI builds this project | Yes (CI runner is x86_64) | No dedicated job (not needed - see below) | No dedicated job (not needed - see below) |
| Upstream CI runs tests | Yes, on the x86_64 runner via WasmEdge | Not run in CI, but not architecture-gated | Not run in CI, but not architecture-gated |
| Official release binary | `.wasm` bytecode (architecture-neutral) | Same `.wasm` file | Same `.wasm` file |

The absence of per-architecture CI jobs is not a support gap for this project: since the compiled output is portable WebAssembly bytecode (confirmed in Section 4), the same `.wasm` release asset is the "binary" for every host architecture, including riscv64, provided a working WasmEdge runtime is present on that host. The host-architecture-dependent component is the WasmEdge runtime itself, which is graded separately (see [project-reports/wasmedge.md](https://github.com/second-state/wasmedge-quickjs), rated blue: riscv64 CI builds and tests pass via QEMU, but no upstream riscv64 release binary exists yet).

## 4. Technical Architecture and RISC-V-Specific Subsystems

WasmEdge-QuickJS has **no architecture-specific subsystems for any CPU family**, confirmed by three targeted GitHub code searches:

| Query | Result |
|---|---|
| `__riscv repo:second-state/wasmedge-quickjs` | 0 results |
| `__x86_64__ OR __aarch64__ repo:second-state/wasmedge-quickjs` | 0 results |
| `target_arch repo:second-state/wasmedge-quickjs` | 0 results |

`build.rs` unconditionally copies a single prebuilt `lib/libquickjs.a` into the build output with no arch-selection logic:

```rust
fn main() {
    let out_dir = std::env::var("OUT_DIR").unwrap();
    let out_dir_path = Path::new(&out_dir);
    std::fs::copy("lib/libquickjs.a", out_dir_path.join("libquickjs.a"))
        .expect("Could not copy libquickjs.a to output directory");
    ...
```

There is no JIT compiler, no hand-written SIMD, no crypto assembly, and no GC-barrier code specific to any CPU architecture in this crate - QuickJS itself runs as an interpreter compiled to WASM bytecode, and any CPU-native code paths (LLVM AOT codegen, SIMD dispatch) live one layer down in the WasmEdge runtime, not in this repository.

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| JIT / AOT codegen | Not present in this repo (WasmEdge runtime's concern) | Same | Same |
| SIMD dispatch | Not present in this repo | Same | Same |
| Crypto (hand-tuned) | Not present in this repo (delegated to `ring`/`rustls`, both compiled to wasm32-wasi bytecode here, not native) | Same | Same |
| Arch-specific assembly / intrinsics | 0 files | 0 files | 0 files |

One incidental false positive was investigated: a full-repo grep for "riscv" matched exactly one hit, inside a vendored x86-64 ELF binary (`examples/host_function/wasmedge_c/libwasmedge_c.so`). Inspection with `file`/`strings` confirmed this is a generic LLVM/lld multi-target symbol table (e.g. `LLVMInitializeRISCVTarget`) compiled into any LLVM-linked toolchain binary regardless of host or target - unrelated to RISC-V support.

## 5. Build System, Cross-Compilation, and Toolchain

**Build command:** `cargo build --target wasm32-wasi --release` (confirmed via `.cargo/config.toml`, which hardcodes `target = "wasm32-wasi"` with rustflags `--cfg wasmedge`, `--cfg tokio_unstable`, `-C target-feature=+bulk-memory`).

**Toolchain:** Rust with the `wasm32-wasi` target installed, plus a WasmEdge installation (CI uses WasmEdge 0.13.5) to execute and test the resulting `.wasm` file. There is no CMake, no `cmake/riscv64.cmake` toolchain file, no Dockerfile targeting riscv64, and no QEMU cross-emulation step anywhere in the repository - confirmed by direct filesystem inspection of the cloned repository (no `docs/`, `cmake/`, or riscv64-specific paths exist).

**Why no riscv64-specific build steps exist:** the project's own build output is a single portable `.wasm` binary; there is no `-DUSE_X=OFF`-style CMake flag surface and no per-architecture recompilation step. Running the same `.wasm` file on riscv64 requires a riscv64-native build of the **WasmEdge runtime** (a separate repository), not a riscv64-specific build of this crate.

**Known build failures:** none found - no riscv64 build has ever been attempted against this repository, so there is no failure history to report either way.

The only Dockerfile in the repository (`example_js/docker_wasm/server/Dockerfile`) is x86_64/generic and contains no riscv64 content:

```dockerfile
FROM --platform=$BUILDPLATFORM rust:1.64 AS buildbase
...
RUN curl -sSf https://raw.githubusercontent.com/WasmEdge/WasmEdge/master/utils/install.sh | bash
...
RUN /root/.wasmedge/bin/wasmedgec wasmedge_quickjs.wasm wasmedge_quickjs.wasm
```

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

Because the crate's own output is architecture-neutral WASM bytecode, there is no feature-parity gap intrinsic to WasmEdge-QuickJS itself between amd64, arm64, and riscv64 hosts - the same `.wasm` file runs identically wherever a compliant WasmEdge runtime is available.

| Feature | amd64 host | arm64 host | riscv64 host |
|---|---|---|---|
| Core JS execution (QuickJS-in-WASM) | Works (WasmEdge runtime available) | Works (WasmEdge runtime available) | Works if a WasmEdge riscv64 build is present [NEEDS VERIFICATION - no direct end-to-end test found for this specific combination] |
| WASI-NN (`wasi_nn` feature, `ggml`/OpenVINO backends) | Works | Works | Gated by WasmEdge's native `wasi_nn` plugin, which is **not tested on riscv64 CI at all** per the dependency research (Section 9) |
| Network / HTTP examples | Works | Works | Works if WasmEdge riscv64 build is present |

**Functional gaps:** none at the WasmEdge-QuickJS layer itself. The real gap is one layer down: WasmEdge's own riscv64 CI runs a curated "quick" test subset under QEMU and explicitly **excludes plugin tests, including `wasi_nn`**, from riscv64 CI (per the prior WasmEdge report referenced in Section 9). This means the `wasi_nn`/ggml feature path of WasmEdge-QuickJS, if enabled, runs on riscv64 with less upstream test coverage than the core JS path.

**Performance gaps:** WasmEdge itself uses "forced `generic-rv64` AOT codegen (no CPU-feature/RVV detection)" per the dependency research in Section 9 - this affects execution speed of the `.wasm` bytecode on riscv64 relative to amd64/arm64, but this is a WasmEdge runtime characteristic, not something WasmEdge-QuickJS controls.

**Security hardening / NaN-floating-point semantics issues:** none found specific to WasmEdge-QuickJS on riscv64 - no issue, bug report, or benchmark exists (Section 11).

## 7. CI/CD Infrastructure

**Does riscv64 CI exist for this repository? No.** Confirmed by direct inspection of the cloned repository (HEAD `fc5455234b20fcef77d0762fe447e63f710a716f`, 2024-10-16):

- Exactly one workflow file exists: [`.github/workflows/examples.yml`](https://github.com/second-state/wasmedge-quickjs/blob/main/.github/workflows/examples.yml) (198 lines). No `.gitlab-ci.yml`, `Jenkinsfile`, `.cirrus.yml`, `.circleci/`, or `.travis.yml`.
- Trigger: `workflow_dispatch` (manual), `push` to `main`, `pull_request` targeting `main`.
- Runner: `ubuntu-20.04`, a standard GitHub-hosted x86_64 runner. No self-hosted runner, no `arch:` matrix, no QEMU setup/registration step (`docker/setup-qemu-action` or similar).
- Job content: installs Rust target `wasm32-wasi`, installs WasmEdge 0.13.5 plus the `x86_64`-tagged rustls plugin (`WasmEdge-plugin-wasmedge_rustls-0.13.5-ubuntu20.04_x86_64.tar.gz`), then runs ~18 build/test steps (`cargo build --target wasm32-wasi --release [...]`), executing the resulting `.wasm` bytecode under WasmEdge - hello-world, image, modules, network/HTTP, ES6/CommonJS, three React SSR variants, WASI-NN, Rust/JS embedding, and `cargo test` for fs/crypto modules.
- No riscv-named branch or tag exists in the remote repository (`git ls-remote` checked for both).
- No RISE runner reference of any kind in this repository's CI configuration.

| | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI build job | Yes (`ubuntu-20.04`, x86_64 host, `wasm32-wasi` target) | No dedicated job | No dedicated job |
| CI test execution | Yes | No dedicated job | No dedicated job |
| Native hardware, QEMU, or cloud VM | GitHub-hosted x86_64 cloud VM | N/A | N/A |
| RISE runner usage | No | No | No |

Since the build target is `wasm32-wasi` (architecture-neutral bytecode) rather than a native CPU triple, the absence of an arm64 or riscv64 CI job reflects the project's build model, not a support gap for those architectures specifically - see Section 13 for how this is scored under the color model.

## 8. Distribution and Release Status

**Official riscv64 binaries: none exist, because none are needed.** GitHub Releases for `second-state/wasmedge-quickjs` were checked across all four tags:

| Tag | Date | Assets |
|---|---|---|
| v0.6.1-alpha | 2024-09-30 | `wasmedge_quickjs.wasm`, `modules.zip` |
| v0.6.0-alpha | 2024-06-22 | (not itemized in research) |
| v0.5.0-alpha | 2023-01-25 | `wasmedge_quickjs.wasm`, `wasmedge_quickjs_nn.wasm`, `modules.zip` |
| v0.4.0-alpha | 2022-07-21 | `wasmedge_quickjs.wasm`, `wasmedge_quickjs_tf.wasm` |

Zero asset filenames contain "riscv" or "riscv64" - all release artifacts are portable `.wasm` bytecode / module zip files, not per-architecture native binaries. The v0.6.1-alpha release notes describe the binaries as "cross-platform WebAssembly bytecode files."

**PyPI:** `https://pypi.org/pypi/wasmedge-quickjs/json` returns HTTP 404 - no package exists under this name (expected: this is a Rust/WASM project, not a Python package).

**Ubuntu:** [packages.ubuntu.com search](https://packages.ubuntu.com/search?keywords=wasmedge-quickjs&searchon=names&suite=all&section=all) returns "Sorry, your search gave no results" across all suites and all architectures - no Ubuntu package exists for this project at all, under any name variant.

**Arch Linux RISC-V (archriscv.felixc.at):** no mention of wasmedge-quickjs.

**What a user must do to get a working setup on riscv64:** download the architecture-neutral `.wasm` release asset (or build it from source with `cargo build --target wasm32-wasi --release`, which works identically on any host with a Rust toolchain), then obtain or build a working **WasmEdge runtime** for riscv64 (WasmEdge itself has no upstream riscv64 release binary either, per the referenced WasmEdge report - the user would need to build WasmEdge from source using its own riscv64 CI path as a reference).

## 9. Dependencies

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Notes |
|---|---|---|---|---|---|
| QuickJS | build-dependency, critical | N/A - vendored as prebuilt `.a`, compiled to wasm32-wasi bytecode in this crate's usage, never built natively for riscv64 here | N/A | N/A | [bellard/quickjs](https://github.com/bellard/quickjs) issue search for "riscv": 0 results. `quickjs-ng/quickjs` (the actively maintained fork, not what this repo uses) also has 0 riscv results |
| WasmEdge | runtime-dependency, critical | Yes - riscv64 CI cross-compiles and runs via QEMU | Yes - curated "quick" test subset under QEMU; plugin tests (including `wasi_nn`) excluded from riscv64 CI | No - zero riscv64 assets in any GitHub Release | Rated blue in the existing [WasmEdge project report](https://github.com/WasmEdge/WasmEdge). Forced `generic-rv64` AOT codegen, no CPU-feature/RVV detection |
| Rust | build-dependency, critical | Yes - Rust and the `wasm32-wasi` target install identically on any host architecture, including riscv64 | N/A - toolchain, not tested itself in this context | Rust upstream ships riscv64 toolchain releases [NEEDS VERIFICATION - not independently re-confirmed this pass] | Not architecture-blocking for this project since the crate's output target (`wasm32-wasi`) is architecture-neutral regardless of build-host CPU |
| ggml | test-dependency, optional (via `wasi_nn`/`ggml` Cargo feature, chained through WasmEdge's native wasi_nn plugin) | Yes, confirmed present via `ports.ubuntu.com`: `libggml-dev`, `libggml0` built for riscv64 | Yes, in the sibling llama.cpp repo's native RVV1.0 CI (RISE-funded); ggml-org/ggml's own CI has zero riscv coverage | No upstream binary for any architecture; Ubuntu universe package is the consumable release | Rated blue, optimization full, per referenced ggml report. Open issues: #1475 (SIGILL risk, sub-extension gating, unreviewed), #1571 (OpenBSD build fix, unreviewed) |
| ring (crypto beneath rustls, `tls` feature, default-on) | indirect, crypto | N/A for this project's actual usage - compiled to wasm32-wasi, native riscv64 assembly path never exercised | N/A | N/A | Upstream `briansmith/ring` riscv64 support: 32 issues, all closed (support has landed over time) - not load-bearing here |
| rustls (TLS, `tls` feature, default-on) | indirect, crypto/TLS | N/A - wasm32-wasi target | N/A | N/A | 0 riscv-specific issues found in `rustls/rustls` |
| tokio / mio / socket2 (second-state forks) | indirect, async I/O | N/A - forks target the wasm32-wasi/WasmEdge socket model | N/A | N/A | Not architecture-specific; unrelated to riscv64 |
| image / imageproc / png / jpeg-decoder (`img` feature) | indirect, image decode | N/A - pure-Rust codecs, wasm32-wasi target | N/A | N/A | No native C image library (libjpeg-turbo/libpng) is actually linked despite feature naming |
| miniz_oxide / rayon / crypto-wasi | indirect, compression/parallelism/crypto shim | N/A - wasm32-wasi target | N/A | N/A | Pure Rust; no riscv64-specific concerns found |
| llama.cpp (inference engine ggml's wasi_nn plugin links against, when the `ggml` backend is used) | indirect via ggml/WasmEdge, critical for LLM-inference use only | Yes - dedicated native riscv64 CI (`ubuntu-24.04-riscv`, RISE-funded) | Yes - `ctest` on native hardware | None - no riscv64 GitHub Release asset; PR #20991 (release binaries) open, blocked on OpenSSL | Rated blue. Open correctness bugs: #24250 (SIGILL on SiFive P550, unresolved), #22655 (crash on SpacemiT K1, unresolved) |
| OpenVINO Runtime (alternate optional wasi_nn backend) | indirect, optional | Partial | Partial | Partial | Rated blue, optimization partial, per referenced report |

**Deep-dive:** QuickJS is the only dependency with JIT/interpreter characteristics, but it is compiled to WASM bytecode in this project's usage, not natively - its own riscv64-native build status (untested upstream) is not load-bearing for WasmEdge-QuickJS's own riscv64 behavior. The load-bearing native-architecture dependency is WasmEdge (blue: CI passes, no release binary) and, only when the optional `wasi_nn`/`ggml` feature is enabled, ggml and llama.cpp (both blue, with two open unresolved riscv64 crash bugs in llama.cpp: [#24250](https://github.com/ggml-org/llama.cpp) and [#22655](https://github.com/ggml-org/llama.cpp)).

**Scope note:** libjpeg-turbo, libpng, zlib, zlib-ng, and jpegli are not actual dependencies of this project - the `image`/`imageproc` Cargo dependencies use pure-Rust codec crates, not these C libraries, despite superficially similar feature names.

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [#121](https://github.com/second-state/wasmedge-quickjs/issues/121) | Build without SIMD | Open (filed 2024-01-03) | N/A to riscv64 | Confirmed via full-text inspection: this issue concerns disabling WASM SIMD128 in the prebuilt `lib/libquickjs.a`; it contains no RISC-V content in body or comments. It surfaced only via loose semantic matching on a "riscv64" search query and is not a RISC-V issue |

No riscv64-specific issue, correctness bug, or performance bug exists in this repository. All targeted GitHub issue searches (`riscv`, `riscv64 bug`, `riscv nan floating`, `riscv64 performance`) returned zero genuine matches across the repository's full 85-issue history.

## 12. Objections and Upstream Blockers

No stated objections to a riscv64 port exist, because no riscv64 port has ever been proposed. No technical blocker specific to riscv64 has been documented in this repository - the technical analysis in Section 4 indicates none would be expected, since the crate compiles to architecture-neutral WASM bytecode. No organizational blocker (governance vote, maintainer objection) has been raised, since the topic has never come up in any issue, PR, or discussion. Acceptance probability for a hypothetical future riscv64-specific change request cannot be assessed from available data - no comparable precedent (e.g. an arm64-specific or amd64-specific PR) was surfaced to gauge maintainer receptiveness. [NEEDS VERIFICATION]

## 13. Readiness Assessment

- **Color:** green (architecture-independent)
- **Release provider:** upstream
- **Justification:** WasmEdge-QuickJS compiles exclusively to the `wasm32-wasi` target (confirmed via `.cargo/config.toml` and [`.github/workflows/examples.yml`](https://github.com/second-state/wasmedge-quickjs/blob/main/.github/workflows/examples.yml)), producing portable WebAssembly bytecode with zero architecture-specific code guards for any CPU family - confirmed by GitHub code search for `target_arch`, `__x86_64__`/`__aarch64__`, and `__riscv`, all returning 0 results. This satisfies the Step 0 architecture-independent shortcut of the color model (analogous to a platform-neutral JAR): the project's published `.wasm` release assets (e.g. `wasmedge_quickjs.wasm`) run unmodified on any host where a WasmEdge runtime is available, including riscv64, so it is classified green and does not need to be penalized for lacking dedicated riscv64 CI.
- **Pending work / caveat that could change the practical picture (not the color):** functional readiness on real riscv64 hardware is gated entirely by the separate WasmEdge runtime dependency, which is rated blue in the referenced project report - its riscv64 CI builds and tests pass (via QEMU), but WasmEdge publishes no upstream riscv64 release binary, and its own riscv64 CI explicitly excludes plugin tests (including `wasi_nn`, relevant if WasmEdge-QuickJS's optional `ggml`/wasi-nn feature is used). A user wanting to run WasmEdge-QuickJS on riscv64 today must build WasmEdge from source for that architecture; no RISE involvement, funded work, or open PR was found that would change this within either repository as of 2026-09-10 - the only related activity is an unprocessed entry in `riseproject-dev/sw-ecosystem/project-reports/.queue.yml` queuing WasmEdge-QuickJS for future grading, not evidence of active work.

## 14. Investment Analysis

RISE has not funded or performed any work specific to WasmEdge-QuickJS itself (Section 1, Section 13) - the only RISE-adjacent artifact is an unprocessed queue entry for future grading. RISE has, however, funded native riscv64 CI runners consumed by two of this project's optional-feature dependencies, llama.cpp (heaviest RISE riscv64 CI consumer, 2,589 jobs/6wk per the dependency research) and indirectly ggml - that work should not be re-sized below.

### 14.1 Functional Enablement

No functional enablement work is required for the core JS-execution path: the project's `.wasm` output already runs on any architecture with a working WasmEdge runtime, by construction (Section 4, Section 13). The only functional gap is indirect: if the optional `wasi_nn`/`ggml` feature is used, WasmEdge's own `wasi_nn` plugin is excluded from riscv64 CI testing, and llama.cpp carries two open, unresolved riscv64 crash bugs ([#24250](https://github.com/ggml-org/llama.cpp), SIGILL on SiFive P550; [#22655](https://github.com/ggml-org/llama.cpp), crash on SpacemiT K1) that would need to be fixed upstream in llama.cpp, not in WasmEdge-QuickJS.

### 14.2 Performance Optimization

Not applicable to WasmEdge-QuickJS itself - it is not an optimization-purpose project (Step 2 of the color model does not apply; `optimization_gap: N/A`). Any performance characteristics on riscv64 (e.g. WasmEdge's forced `generic-rv64` AOT codegen with no CPU-feature/RVV detection) are properties of the WasmEdge runtime dependency, not of this crate, and should be sized under a WasmEdge-focused investment analysis instead.

### 14.3 CI/CD Infrastructure

Adding a riscv64-targeted job to `examples.yml` would provide direct confirmation that the project's `.wasm` output actually executes correctly under a riscv64 WasmEdge build (closing the [NEEDS VERIFICATION] end-to-end gap noted in Section 6), but this is a validation/confidence exercise, not a functional requirement, given the architecture-neutral bytecode design. It would require: (a) a riscv64 WasmEdge build available to the CI runner (self-hosted RISE runner or QEMU), and (b) minor workflow changes to add a matrix leg.

### 14.4 Ecosystem Enablement

Not applicable - WasmEdge-QuickJS has no dependent package ecosystem (no PyPI, npm, or Maven package; Section 10 is omitted per the report's own scope rules).

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | End-to-end validation of `wasmedge_quickjs.wasm` running under a riscv64-built WasmEdge (closes the [NEEDS VERIFICATION] gap in Section 6) | 0.5-1 | WasmEdge-QuickJS or WasmEdge maintainers | Low |
| CI/CD | Add a riscv64 job to `examples.yml` using a RISE riscv64 runner or QEMU, executing the existing example/test suite | 1-2 | WasmEdge-QuickJS maintainers | Low |
| Functional (dependency, not this project) | Fix llama.cpp riscv64 crash bugs #24250 and #22655, relevant only if the `wasi_nn`/`ggml` feature is used | Not sized here - tracked under llama.cpp's own report | llama.cpp / ggml maintainers, RISE | Medium (feature-gated) |
| Functional (dependency, not this project) | WasmEdge: extend riscv64 CI to cover plugin tests (`wasi_nn`) and publish a riscv64 release binary | Not sized here - tracked under WasmEdge's own report | WasmEdge maintainers, RISE | Medium (blocks a fully "green" end-to-end WASI-NN path on riscv64) |

## 15. Updates

(No updates yet - initial report dated 2026-09-10.)

## 16. References

- [second-state/wasmedge-quickjs repository](https://github.com/second-state/wasmedge-quickjs)
- [second-state/wasmedge-quickjs CI workflow, examples.yml](https://github.com/second-state/wasmedge-quickjs/blob/main/.github/workflows/examples.yml)
- [second-state/wasmedge-quickjs issue #121, "Build without SIMD"](https://github.com/second-state/wasmedge-quickjs/issues/121)
- [second-state/wasmedge-quickjs GitHub Releases](https://github.com/second-state/wasmedge-quickjs/releases)
- [PyPI JSON API for wasmedge-quickjs (404, no package)](https://pypi.org/pypi/wasmedge-quickjs/json)
- [Ubuntu package search for wasmedge-quickjs (no results, all suites/architectures)](https://packages.ubuntu.com/search?keywords=wasmedge-quickjs&searchon=names&suite=all&section=all)
- [Arch Linux RISC-V package search](https://archriscv.felixc.at/?q=wasmedge-quickjs)
- [WasmEdge/WasmEdge repository (parent runtime project)](https://github.com/WasmEdge/WasmEdge)
- [WasmEdge governance documentation](https://github.com/WasmEdge/WasmEdge/blob/master/docs/GOVERNANCE.md)
- [RISE Project members page](https://riseproject.dev/members/)
- [RISE Project blog](https://riseproject.dev/blog/)
- [RISE Python wheel builder package list](https://riseproject.gitlab.io/python/wheel_builder/)
- [bellard/quickjs repository (vendored JS engine)](https://github.com/bellard/quickjs)
- [quickjs-ng/quickjs repository (actively maintained fork, not used by this project)](https://github.com/quickjs-ng/quickjs)
- [briansmith/ring repository (indirect crypto dependency)](https://github.com/briansmith/ring)
- [rustls/rustls repository (indirect TLS dependency)](https://github.com/rustls/rustls)
- [ggml-org/ggml repository (optional test-dependency)](https://github.com/ggml-org/ggml)
- [ggml-org/llama.cpp repository (indirect, via ggml/wasi_nn)](https://github.com/ggml-org/llama.cpp)
- Existing project reports consulted: `project-reports/wasmedge.md`, `project-reports/ggml.md`, `project-reports/llama-cpp.md`, `project-reports/openvino-runtime.md` (paths within `riseproject-dev/sw-ecosystem`)
- `riseproject-dev/sw-ecosystem/project-reports/.queue.yml` (internal backlog entry queuing WasmEdge-QuickJS for future grading)
