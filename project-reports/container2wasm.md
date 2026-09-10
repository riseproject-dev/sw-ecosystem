---
title: container2wasm
parent: Project Reports
color: blue
dependencies:
  - name: QEMU
    relation: build-dependency
    criticality: critical
  - name: TinyEMU
    relation: build-dependency
    criticality: critical
  - name: Linux kernel
    relation: build-dependency
    criticality: critical
  - name: OpenSBI
    relation: build-dependency
    criticality: critical
  - name: riscv-pk
    relation: build-dependency
    criticality: critical
  - name: GCC
    relation: build-dependency
    criticality: critical
  - name: GNU binutils
    relation: build-dependency
    criticality: critical
  - name: busybox
    relation: build-dependency
    criticality: critical
  - name: runc
    relation: build-dependency
    criticality: critical
  - name: tini
    relation: build-dependency
    criticality: optional
  - name: Wasmtime
    relation: test-dependency
    criticality: critical
  - name: WAMR
    relation: test-dependency
    criticality: critical
  - name: Wasmer
    relation: test-dependency
    criticality: critical
  - name: Wazero
    relation: test-dependency
    criticality: critical
  - name: WasmEdge
    relation: test-dependency
    criticality: critical
  - name: Docker
    relation: test-dependency
    criticality: critical
---

# container2wasm

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Readiness:** blue<br/>
**Scope:** RISC-V (riscv64/linux) support status for container2wasm<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

{% include dependency-graph.html slug="dependencies" subset="container2wasm" %}

## 1. Project Overview

container2wasm is a Go CLI (`c2w`/`c2w-net`) plus a large multi-stage Docker build pipeline that converts an OCI container image into a WebAssembly binary by embedding a full system emulator (Bochs for x86_64, TinyEMU or QEMU for riscv64, QEMU for aarch64) that boots a Linux guest and runs the container inside it. The output runs under WASI runtimes (Wasmtime, WAMR, Wasmer, Wazero, WasmEdge) or in a browser via an Emscripten-compiled build.

**Governance:** container2wasm is a **CNCF Sandbox** project, accepted January 21, 2025 [(CNCF project page reference in research findings)]. `GOVERNANCE.md` adopts the CNCF Code of Conduct and defines a single role, Committer, with full repo write access. The `MAINTAINERS` file lists exactly one entry: `ktock` (Kohei Tokunaga), whose GitHub profile lists his employer as NTT. This makes container2wasm, despite CNCF Sandbox status, **effectively a single-maintainer, single-company (NTT-affiliated) project**. A CNCF-page figure citing "180 contributing organizations / 462 contributors" is inconsistent with this single-name `MAINTAINERS` file and is flagged as likely a templated/aggregate metric mismatched to this project rather than a verified fact [NEEDS VERIFICATION].

**License:** Project code is Apache 2.0. Generated WASM images bundle third-party components under mixed licenses (GPLv2/v3 for the Linux kernel, LGPL v2.1, MIT, Apache 2.0).

**Community culture on new ports:** There is no formal tier policy for accepting new architectures (`PLATFORMS.md`, `SUPPORT.md`, `docs/platforms/` all absent, confirmed via code search). Architecture support (x86_64, riscv64, aarch64) has historically been added ad hoc by the sole maintainer through same-day, single-commit, undiscussed PRs (e.g. PR [#374](https://github.com/container2wasm/container2wasm/pull/374)). Community-submitted feature PRs that touch riscv64 tooling face slower, maintainer-gated review (PR [#306](https://github.com/container2wasm/container2wasm/pull/306), PR [#64](https://github.com/container2wasm/container2wasm/pull/64), both still open after a year-plus).

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| (predates commit-message search coverage) | riscv64 support (via TinyEMU) already exists as a core architecture; exact introducing commit not found by commit-message search | Inferred from PR [#111](https://github.com/container2wasm/container2wasm/pull/111) description |
| 2023-08-15/17 | PR [#111](https://github.com/container2wasm/container2wasm/pull/111) "x86: refactor: unify init logic to riscv's one" merged - confirms riscv64/TinyEMU init logic was the original template that the x86/Bochs path was later refactored to match | [PR #111](https://github.com/container2wasm/container2wasm/pull/111), commit [664776a](https://github.com/container2wasm/container2wasm/commit/664776a6e6b1f3c3b830dad56a201e11c68c617d) |
| 2023-06-08 | PR [#64](https://github.com/container2wasm/container2wasm/pull/64) "tinyemu: Slirp Socket support on WAMR" opened (touches the riscv64/TinyEMU emulator directly); still **open** as of research date | [PR #64](https://github.com/container2wasm/container2wasm/pull/64) |
| 2023-06-24 | Issue [#75](https://github.com/container2wasm/container2wasm/issues/75) opened, reporting riscv64/alpine Node.js hello-world taking ~16s on a 4-core/4GB device; closed as "completed" 2025-02-13 with no visible maintainer resolution comment | [Issue #75](https://github.com/container2wasm/container2wasm/issues/75) |
| 2024-08-14 | PR [#306](https://github.com/container2wasm/container2wasm/pull/306) "no-conversion without imagemounter" opened, using riscv64 as its worked example; still **open**, gated on maintainer-requested rebase, a squashfs-vs-isofs default decision, `filepath.IsAbs` validation, docs, and lint fixes | [PR #306](https://github.com/container2wasm/container2wasm/pull/306) |
| 2024-12-26 / 2025-01-02 | PR [#374](https://github.com/container2wasm/container2wasm/pull/374) "QEMU: support riscv64 containers" authored and merged same-day by ktock, adding a second (QEMU-based) riscv64 emulation backend alongside TinyEMU | [PR #374](https://github.com/container2wasm/container2wasm/pull/374), commit [a3518f6](https://github.com/container2wasm/container2wasm/commit/a3518f664cc551bf6706de3d93be58f56530c135) |
| 2025-01-21 | container2wasm accepted into CNCF Sandbox | Research findings (CNCF status reference) |
| 2025-01-30 | v0.8.0 tagged - first release containing the QEMU riscv64 backend (PR #374) | Research findings (git tag correlation) |
| 2025-11-09 | Issue [#535](https://github.com/container2wasm/container2wasm/issues/535) opened: QEMU riscv64 VirtFS mounts return permission-denied on the `--to-js`/Emscripten path; **open**, unresolved, no maintainer reply | [Issue #535](https://github.com/container2wasm/container2wasm/issues/535) |

**Key contributor:** Kohei Tokunaga (`ktock`), NTT - author of essentially all riscv64-related merged work (PR #111, PR #374, plus the original TinyEMU integration). No other organization has landed riscv64-relevant code.

**Is it fully upstream?** Yes for both emulation backends (TinyEMU and QEMU) - both are merged into `main` and shipped in tagged releases (v0.8.0 onward for the QEMU path; TinyEMU riscv64 support predates the earliest tag checked). No riscv64 support lives only in a fork or unmerged branch, though two riscv64-touching feature PRs (#306, #64) remain open and unmerged.

## 3. Upstream Support Tier

There is no formal, written tier policy. In practice, riscv64 is treated as one of the two **primary/recommended** target architectures (alongside x86_64) in the README, ahead of aarch64 and other architectures which run through an additional in-guest emulation layer.

Evidence of tier:
- **CI**: riscv64 is exercised in real, PR/push-blocking CI (`.github/workflows/tests.yml`) - not merely present but a required check on every push to `main` and every pull request (no `workflow_dispatch`-only or tag-only gating).
- **Release-blocking**: the `test` and `browser` CI jobs run on the same trigger as everything else; there is no evidence riscv64 failures are treated as non-blocking or allowed-to-fail (`fail-fast: false` applies per-matrix-leg reporting, not a skip of riscv64).
- **Official binaries**: none. GitHub Releases ship only `linux-amd64` and `linux-arm64` tarballs of the `c2w`/`c2w-net` tool itself; there is no riscv64 *host* build of container2wasm (riscv64 is a supported *guest/target* container architecture, not a host platform the tool ships for).

| Architecture | CI builds | CI tests | Backends | Official host release | Notes |
|---|---|---|---|---|---|
| amd64 (x86_64) | Yes | Yes | Bochs, QEMU | Yes (`linux-amd64` tarball) | Reference architecture |
| arm64 (aarch64) | Yes | Yes | QEMU only | Yes (`linux-arm64` tarball) | One backend fewer than riscv64; appears in only 3 of 8 test files vs riscv64's 8 of 8 |
| riscv64 | Yes | Yes (real `make test` execution via QEMU user-mode emulation on x86_64 runners) | TinyEMU + QEMU (two backends, more than aarch64) | **No** riscv64 host tarball published | Broadest CI test-file coverage of any secondary architecture; no upstream riscv64 release artifact |

## 4. Technical Architecture and RISC-V-Specific Subsystems

container2wasm itself is a **build/orchestration layer**, not an emulator implementation. Direct repository inspection (code search for `riscv`, `riscv64`, `vfloat32m1_t`, `rvv`, `extension:S`, `path:arch/riscv`, `Zba OR Zbb OR Zicsr`) found **zero RVV/SIMD intrinsics, zero RISC-V assembly (`.S`) files, and no `arch/riscv/` directory** in this repository. The actual CPU-emulation source code (where ISA-extension-specific code would live) resides in two separate forked repositories pulled at build time, not vendored here:

- [`ktock/tinyemu-c2w`](https://github.com/ktock/tinyemu-c2w) - patched fork of Bellard's TinyEMU, containing `riscv_cpu32.c`/`riscv_cpu64.c`/`riscv_machine.c` (the RV32/RV64 instruction-set interpreter)
- [`ktock/qemu-wasm`](https://github.com/ktock/qemu-wasm) - patched fork of QEMU, containing QEMU's `target/riscv/` tree

Neither fork's internals were accessible for direct inspection in this research pass (out of session scope); this report grades **container2wasm's own repository**, where the riscv64 "architecture-specific" surface is entirely build/toolchain glue: `gcc-riscv64-linux-gnu` cross-compilation, Linux kernel `ARCH=riscv` build config, and string-based architecture dispatch (`"riscv64"` vs `"amd64"`) in Go orchestration code (`cmd/create-spec/main.go`, `extras/imagemounter/main.go`, `tests/integration/utils/utils.go`).

This project is **not optimization-purpose** (see Section 13) - its value proposition (running a container inside a WASM sandbox) does not depend on RISC-V-specific codegen inside this repository, so the Step 2 optimization-coverage modifier does not apply here. Any JIT/SIMD-quality questions belong to the QEMU and TinyEMU upstream projects, which are graded separately (see Section 9).

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Guest CPU emulation backend(s) | Bochs (interpreter), QEMU (JIT) | QEMU (JIT) only | TinyEMU (interpreter) + QEMU (JIT) - two backends |
| ISA-extension-specific code in this repo | None (build/glue only) | None (build/glue only) | None (build/glue only) |
| Dockerfile build stages (approx.) | Not enumerated in findings | 20 riscv64-parallel stages [NEEDS VERIFICATION - count sourced from a single research pass] | 27 stages, structurally parallel to aarch64 at every step |
| Default platform in Go CLI | Overrides the default | Requires extra `--pack`/`NO_BINFMT` handling | Default platform string (`"linux/riscv64"`) in `cmd/create-spec/main.go`; needs zero special-casing, unlike aarch64 |

## 5. Build System, Cross-Compilation, and Toolchain

There is **no CMake** anywhere in this repository (confirmed: no `CMakeLists.txt`, no `BUILDING.md`, `INSTALL`, `docs/building.md`, or `docs/cross-compilation.md`). The entire build is driven by one multi-stage `Dockerfile` (1064 lines, BuildKit syntax `docker/dockerfile:1.5`) invoked via Docker Buildx by the Go CLI `c2w`.

**Toolchain versions and why (from `Dockerfile` `ARG`s):**

| Component | Version | Why |
|---|---|---|
| `WASI_SDK_VERSION` | 19 | Provides `clang` targeting `wasm32-wasi`, used to compile TinyEMU to WASM |
| `WASI_VFS_VERSION` | v0.3.0 | Packs the guest rootfs/kernel image into the WASI binary |
| `WIZER_VERSION` | pinned commit | Pre-initializes/snapshots the WASM instance (boots the kernel once at build time) |
| `EMSDK_VERSION` | 3.1.40 | Emscripten for TinyEMU's `--to-js` browser build |
| `EMSDK_VERSION_QEMU` | 4.0.10 | Separate, newer Emscripten for the QEMU-based `--to-js` build |
| `BINARYEN_VERSION` | 114 | `wasm-opt`, bundled with emsdk |
| Host cross toolchain | `gcc-riscv64-linux-gnu` / `libc-dev-riscv64-cross` (Ubuntu 22.04 apt packages) | Compiles the riscv64 guest userspace: BBL, Linux kernel, busybox, runc, tini, vmtouch |
| `rust:1.74.1-bullseye` | - | Builds `wasi-vfs` and `wizer` (Rust tools) |
| `gcc:14` | - | Native host build of `qemu-system-riscv64` (used only to snapshot pre-boot VM state) |
| `golang:1.26-bookworm` | Go 1.26 | Builds `init`, `create-spec`, `c2w-net`, `get-qemu-state`; `GOARCH=riscv64` cross-compiles the riscv64 `init` |
| Linux kernel | v6.1 | Guest kernel for the riscv64 VM |
| `runc` | v1.3.0 | Container runtime inside the guest |
| `busybox` | 1.36.1 | Guest userspace utilities |
| `tini` | v0.19.0 | Guest init/reaper |
| `riscv-pk` (BBL) | pinned commit | Berkeley Boot Loader, source-patched (HTIF MMIO addresses hardcoded for TinyEMU) |
| TinyEMU fork | `ktock/tinyemu-c2w` @ pinned commit | Patched TinyEMU |
| QEMU fork | `ktock/qemu-wasm` @ pinned commit | Patched QEMU-Wasm |
| `tonistiigi/binfmt` | `qemu-v6.1.0` | Provides riscv64 qemu-user binaries for foreign-arch containers |

Top-level: Go 1.19+ to build the `c2w`/`c2w-net` CLI itself (`make && sudo make install`).

**Two distinct riscv64 build paths**, both defined in the same Dockerfile:
- **TinyEMU path** (default WASI output): `gcc-riscv64-linux-gnu-base` -> `bbl-dev` -> `linux-riscv64-dev` -> `busybox-riscv64-dev`/`runc-riscv64-dev`/`tini-riscv64-dev`/`vmtouch-riscv64-dev` -> `rootfs-riscv64-dev` -> `vm-riscv64-dev` -> `tinyemu-dev-common` (WASI-SDK clang build) -> `tinyemu-dev-wizer`/`-native` -> `tinyemu-dev-packed` -> `wasi-riscv64`. TinyEMU compile disables `CONFIG_FS_NET`, `CONFIG_SDL`, `CONFIG_INT128`, `CONFIG_X86EMU`, `CONFIG_SLIRP`.
- **QEMU path** (`c2w --to-js --target-arch=riscv64`): a native riscv64 QEMU build (`gcc:14`, only to snapshot pre-boot state via `get-qemu-state`), plus an Emscripten-compiled riscv64 QEMU (`--cpu=wasm32 --with-coroutine=fiber`, `-sASYNCIFY=1 -sTOTAL_MEMORY=2300MB -sWASM_BIGINT`, etc.) that is the actual browser-runnable artifact. Guest firmware: `opensbi-riscv64-generic-fw_dynamic.bin`.

**Exact CLI invocation:**
```
docker buildx build --progress=plain \
  --build-arg TARGETARCH=riscv64 --build-arg TARGETPLATFORM=linux/riscv64 \
  --platform=linux/amd64 [-f Dockerfile] [--target=js] \
  --output type=local,dest=<destDir> <src-image-context>
```
`--platform=linux/amd64` here is the BuildKit host's own platform; riscv64 selection happens entirely via `TARGETARCH`/`TARGETPLATFORM` build-args, which pick riscv64-suffixed Dockerfile stages (`FROM wasi-$TARGETARCH`, `FROM js-$TARGETARCH`). This is target-select via build-arg, not classic host cross-compilation.

**QEMU usage in the build:** `tonistiigi/binfmt:qemu-v6.1.0` provides `qemu-user` binaries installed into the riscv64 guest rootfs (so non-riscv64/non-x86_64 images can run doubly-emulated inside the riscv64 guest); `ktock/qemu-wasm` is used only for `--to-js` output, with a native `gcc:14` build (state-snapshot only) and an Emscripten build (the shipped artifact).

**Known build failures:** No riscv64-specific build failures were found in the issue tracker beyond the runtime bug in Section 11 (issue #535, which is a runtime VirtFS permission bug, not a build failure).

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Native (non-doubly-emulated) container support | Yes (Bochs, QEMU) | Yes (QEMU) | Yes (TinyEMU, QEMU) - "recommended" tier per README |
| WASI-output path (`c2w`, no `--to-js`) | Yes | Yes | Yes |
| Browser (`--to-js`) output path | Yes | Yes | Yes, but with an **open, unresolved correctness bug** (issue #535: QEMU VirtFS mounts return permission-denied on Alpine and Debian riscv64 images) |
| Directory-mapping support | Yes | Yes | Yes, since v0.4.0 per README |
| Public browser demo | Not confirmed in findings | Not confirmed in findings | Yes - [ktock's riscv64-vim demo](https://ktock.github.io/container2wasm-demo/riscv64-vim.html) |
| VM migration/snapshot optimization (`QEMU_MIGRATION`) | Applies to QEMU path generically | Applies to QEMU path generically | Applies to QEMU path generically |
| Host tool release binary | Yes (`linux-amd64` tarball) | Yes (`linux-arm64` tarball) | **No** |

**Functional gaps:** The only confirmed functional gap is issue #535 - VirtFS mounts fail with permission-denied on the QEMU/riscv64 `--to-js` path, on both Alpine and Debian riscv64 guest images. This affects the browser/Emscripten output mode specifically; the TinyEMU/WASI path is not reported as affected.

**Performance gaps:** The only quantitative data point is anecdotal: issue [#75](https://github.com/container2wasm/container2wasm/issues/75) reports ~16 seconds to run a Node.js "hello world" inside `riscv64/alpine` on a 4-core/4GB host (TinyEMU backend, June 2023). No riscv64-vs-arm64 or riscv64-vs-amd64 quantitative comparison was found anywhere (README, issues, CNCF materials, or web search) [NEEDS VERIFICATION - single anecdotal data point, no controlled benchmark]. A KubeCon EU 2026 lightning-talk deck shows a Bochs-interpreter-vs-QEMU-JIT gzip-compression benchmark (~3x speedup, ~40 to ~13 time units on an unlabeled axis) but this compares emulation backend generally on x86_64, not riscv64 specifically, and the deck's chart is a rasterized image with no extractable exact figures.

**Security hardening gaps:** Data not available - no riscv64-specific security-hardening comparison (e.g., stack protector, CFI, seccomp coverage differences between architectures) was found in the research.

**NaN/floating-point semantics issues:** No container2wasm-specific NaN/floating-point issue was found. A related but distinct bug exists upstream in Firefox/SpiderMonkey (Mozilla Bugzilla [#1975867](https://bugzilla.mozilla.org/show_bug.cgi?id=1975867), "Improper Float32 architectural NaN-boxing when popping from stack on riscv64"), resolved fixed for Firefox 143. This affects Firefox's own WASM baseline compiler running *on* a riscv64 host, not container2wasm's TinyEMU/QEMU guest emulation, and is not confirmed to have ever affected container2wasm output.

## 7. CI/CD Infrastructure

**riscv64 CI exists and is confirmed by direct read of `.github/workflows/tests.yml`** (full file content captured in research; workflow files present: `fossa.yml`, `release.yml`, `tests.yml` - only `tests.yml` references riscv64). No `.gitlab-ci.yml`, `Jenkinsfile`, or `.cirrus.yml` exist.

**Trigger:** `push` to `main` and every `pull_request` - not tag-only, not `workflow_dispatch`-only.

**Runner:** All jobs run on `ubuntu-24.04`, a standard x86_64 GitHub-hosted runner. There is **no native riscv64 runner and no RISE runner involvement** (confirmed: no `riseproject-dev` references, no RISE runner labels anywhere in the workflow or in the broader RISE-involvement search, Section 12). riscv64 execution is achieved purely through QEMU user-mode emulation, registered via:
```
docker run --privileged --rm tonistiigi/binfmt --install riscv64
```

**Jobs exercising riscv64:**
- `test` job: matrix `target: ["TestWasmtime","TestWamr","TestWasmer","TestWazero","TestWasmedge","TestTools"]` x `arch: ["x86_64","(riscv64|aarch64)"]`, running `make test` (`go test -run <target>/.*arch=<arch>.*`) - real test execution, not build-only.
- `browser` job: matrix `arch: ["x86_64","riscv64","aarch64"]`, running `TestBrowsers/.*arch=riscv64.*` via `make test`.
- `build` job: `runs-on: ubuntu-24.04`, builds the `c2w`/`c2w-net` CLI binaries generically (not per-guest-arch); verifies they are static via `ldd`.

Both the `test` and `browser` jobs run actual functional test suites against riscv64 (emulated via QEMU user-mode on x86_64 hardware), not merely a cross-compile check. riscv64 appears in all 8 integration/test files (`wamr`, `wasmer`, `wazero`, `wasmtime`, `wasmedge`, `tools`, `browsers`, `benchmark`), versus aarch64 which appears in only 3 of 8 - riscv64 has the broadest secondary-architecture test coverage in this project.

| | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI builds | Yes | Yes | Yes |
| CI runs test suite | Yes | Yes | Yes (via QEMU user-mode emulation, `tonistiigi/binfmt`) |
| Native hardware runner | Yes (`ubuntu-24.04` is native x86_64) | No (emulated) | No (emulated) |
| RISE runner usage | No | No | No - confirmed no RISE involvement anywhere in this project (Section 12) |
| Test-file coverage | Full (8/8) | Partial (3/8) | Full (8/8) |
| Release-blocking | Yes (same trigger as all jobs) | Yes | Yes |

## 8. Distribution and Release Status

**No official riscv64 binary of the `c2w`/`c2w-net` tool exists in any channel checked.**

- **GitHub Releases:** checked v0.6.3 through the latest, v0.8.4 (2026-03-16). Assets are `c2w-net-proxy.wasm`, `container2wasm-v0.8.4-linux-amd64.tar.gz`, `container2wasm-v0.8.4-linux-arm64.tar.gz`, `SHA256SUMS`, and source archives. **No riscv64 asset in any release**, and no release-note mentions of riscv64 across all 10 releases checked.
- **PyPI:** `https://pypi.org/pypi/container2wasm/json` returns HTTP 404 - **no package exists at all** (this is a Go tool, not a Python package; not merely "no riscv64 wheel").
- **RISE Python wheel builder:** redirects to the same 404 PyPI URL - no package present.
- **Ubuntu 26.04 (resolute):** `packages.ubuntu.com` search returns "Sorry, your search gave no results" for `container2wasm` across all architectures, not only riscv64.
- **Arch Linux RISC-V** (`archriscv.felixc.at`): no listing found.
- **Debian/Fedora:** Data not available - not checked in the research findings provided.

**What a user must do to get a working riscv64 setup:** There is no "riscv64 binary of container2wasm" to obtain, because the tool itself only ships amd64/arm64 host builds. A user on any host architecture builds `c2w` from source (`make && sudo make install`, requiring Go 1.19+) and then uses it to target riscv64 *containers* (`c2w --target-arch=riscv64 <image> out.wasm`), which is a fully supported, CI-tested path regardless of the host's own architecture, since the riscv64 guest is emulated inside the WASM output rather than requiring a riscv64 host.

**Important distinction:** "riscv64 support" in this project means riscv64 is a supported *guest/target* container architecture (emulated via TinyEMU or QEMU inside the wasm artifact) - not that the `c2w` tool itself has been ported to run natively on a riscv64 *host*. No CI job or release artifact addresses a riscv64-host build of `c2w` at all.

**Note on the graded color:** the CI verdict in Section 7 (build yes / test yes) governs the primary color per Step 1 of the readiness model; the absence of any upstream-published riscv64 artifact is what caps this project at blue rather than green (see Section 13).

## 9. Dependencies

Source: `go.mod` (direct Go deps) and `Dockerfile` `ARG`/`FROM` declarations (build-time deps), per research findings. The `project-graph` MCP server failed to connect for the entire research session (`CONNECTION_CLOSED`), so no Ubuntu 26.04 package-graph corroboration could be run for any dependency below - flagged, not treated as a null result.

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Notes |
|---|---|---|---|---|---|
| QEMU | Build-dependency, critical (fork `ktock/qemu-wasm`; JIT emulation backend for `--to-js` riscv64 path, and for the native riscv64 state-snapshot build) | Yes - riscv64 TCG backend upstream since QEMU 2.12; GitLab CI cross-compiles riscv64-softmmu/-linux-user | Partial - one CI job runs `check-tcg` on riscv64; no native riscv64 CI runner | No official upstream binary; distro-packaged (Debian sid `qemu` "Installed" on riscv64) | See `project-reports/qemu.md` (color: yellow) per research findings |
| TinyEMU | Build-dependency, critical (fork `ktock/tinyemu-c2w`; default WASI-output riscv64 emulator, custom `riscv_cpu32.o`/`riscv_cpu64.o`/`riscv_machine.o` objects) | Yes, compiled via WASI-SDK clang | Exercised through container2wasm's own CI, not separately | No independent upstream release for this fork | Personal ktock fork, low-traffic, zero riscv64-tagged issues/PRs found - weak evidence either way |
| Linux kernel | Build-dependency, critical (guest kernel, v6.1, `ARCH=riscv` build) | Yes - riscv is a first-class upstream Linux architecture | Yes (upstream Linux CI/testing, generally) | Distro-packaged widely | Config: `config/tinyemu/linux_rv64_config`, `config/qemu/linux_rv64_config` |
| OpenSBI | Build-dependency, critical (`opensbi-riscv64-generic-fw_dynamic.bin`, guest firmware for the QEMU path) | Data not available - not independently verified in this research pass | Data not available | Distro-packaged (`qemu-efi-riscv64`-adjacent firmware packages exist on Ubuntu) | No dedicated project-report entry found |
| riscv-pk (BBL) | Build-dependency, critical (Berkeley Boot Loader, pinned commit, source-patched for hardcoded HTIF MMIO addresses to work with TinyEMU) | Yes, but **requires a container2wasm-side source patch** to build for this use case | Exercised through container2wasm's own CI | No independent release channel checked | Patch requirement is project-specific, not necessarily indicative of upstream riscv64 health |
| GCC | Build-dependency, critical (`gcc-riscv64-linux-gnu` cross-compiler via Ubuntu 22.04 apt, plus native `gcc:14` for host riscv64 QEMU build) | Yes - riscv64 is a mainline GCC target | Yes (upstream GCC testing, generally) | Distro-packaged (Ubuntu `gcc-riscv64-linux-gnu`) | Standard cross-toolchain package |
| GNU binutils | Build-dependency, critical (assembler/linker for the riscv64 cross-toolchain) | Yes - riscv64 is a mainline binutils target | Yes (upstream binutils testing, generally) | Distro-packaged | Paired with the GCC cross-toolchain package |
| busybox | Build-dependency, critical (guest userspace utilities, v1.36.1, cross-compiled riscv64-linux-gnu) | Yes | Exercised through container2wasm's own CI | Distro-packaged in essentially all riscv64 Linux distros | - |
| runc | Build-dependency, critical (OCI runtime; container2wasm cross-compiles a static riscv64 `runc` in-Dockerfile, v1.3.0) | Yes (riscv64 enablement PR #3446 upstream, 2022) | **No** - CI builds riscv64 but does not execute the upstream runc test suite; issue #5166 "add riscv64 to CI" opened 2026-03-12, closed unresolved | No dedicated upstream riscv64 release artifact | See `project-reports/runc.md` (color: yellow) per research findings |
| tini | Build-dependency, optional (guest init/reaper, v0.19.0, cross-compiled riscv64-linux-gnu) | Data not available - not independently verified | Data not available | No dedicated project-report entry found | - |
| Wasmtime | Test-dependency, critical (one of six WASI runtimes container2wasm's CI tests riscv64 output against) | Data not available in this pass | Exercised as a container2wasm CI test target, not verified independently upstream | Data not available | - |
| WAMR | Test-dependency, critical (WASI runtime test target; also the subject of open PR #64 for TinyEMU Slirp socket integration) | Data not available in this pass | Exercised as a container2wasm CI test target | Data not available | - |
| Wasmer | Test-dependency, critical (WASI runtime test target) | Data not available in this pass | Exercised as a container2wasm CI test target | Data not available | - |
| Wazero | Test-dependency, critical (WASI runtime test target; also referenced in PR #306's proposed squashfs-mount examples) | Pure Go - inherits Go's riscv64 support | Exercised as a container2wasm CI test target | Data not available | - |
| WasmEdge | Test-dependency, critical (WASI runtime test target) | Data not available in this pass | Exercised as a container2wasm CI test target | Data not available | - |
| Docker | Test-dependency, critical (Buildx-based build pipeline, and `tonistiigi/binfmt` for riscv64 binfmt registration in CI) | riscv64 Docker Engine/Buildx builds are widely available upstream | Used as the CI build/test harness itself (`docker run --privileged tonistiigi/binfmt --install riscv64`) | Distro/upstream-packaged for riscv64 | - |
| containerd | Indirect (`go.mod` direct import, v1.7.32; OCI platform-matching in the `c2w` CLI itself) | Yes (PR #6882, 2022, tested on real SiFive hardware per research findings) | Unclear from available excerpt | Unclear from available excerpt | See `project-reports/containerd.md` (color: yellow) per research findings; report flags PR #13124 as highest-leverage open unblock |
| gvisor-tap-vsock | Indirect (`go.mod` direct import, fork `ktock/gvisor-tap-vsock`; user-space host<->VM networking for the `c2w` CLI) | Pure Go, inherits Go's riscv64 support; underlying gVisor netstack riscv64 gaps worked around upstream (e.g. missing `PTRACE_SYSEMU`, PR #13030) | gVisor's own Bazel riscv64 `config_setting` exists but is not referenced by CI - regressions go undetected | Not separately released | See `project-reports/gvisor.md` (no color graded in stored report per research findings) |
| libseccomp | Indirect (build dep of QEMU, and of runc's currently-commented-out seccomp step in the Dockerfile) | Yes | No - riscv64 validated only by downstream distro packagers (Debian/Ubuntu/Arch), not upstream CI | No dedicated upstream riscv64 artifact | See `project-reports/libseccomp.md` (color: yellow) per research findings |
| libffi | Indirect (critical GLib/QEMU FFI dependency; separately built for Emscripten/WASM) | Yes | Yes | Data not available | See `project-reports/libffi.md` (color: blue) per research findings |
| zlib | Indirect (compression, statically built for the Emscripten glib/QEMU WASM port) | Yes | Yes | No dedicated riscv64 release artifact | See `project-reports/zlib.md` (color: blue) per research findings |
| GLib | Indirect (critical QEMU build dependency; separate Emscripten/WASM port built in the Dockerfile) | Data not available - hosted on GitLab, not covered by GitHub-scoped searches this pass | Data not available | Data not available | No project-report entry found |
| pixman | Indirect (critical QEMU build dependency for display/VGA emulation; separate Emscripten/WASM port, pinned v0.42.2) | Data not available - hosted on GitLab, not covered by GitHub-scoped searches this pass | Data not available | Data not available | No project-report entry found |
| wasi-sdk | Indirect (Clang/LLVM toolchain, version 19, used to compile TinyEMU to WASM) | An issue titled "Add riscv64 host platform support" was found in state **closed**; detail not retrievable (repo not attached to session) | Data not available | Data not available | [NEEDS VERIFICATION] |
| Binaryen | Indirect (`wasm-opt`, bundled via emsdk, version 114; post-processes compiled wasm) | Yes - one historical host-portability fix merged (PR #6410); no separate codegen backend to "port" | Not run in any known CI per research findings | Source-tarball only; rebuilds successfully downstream per research findings | No riscv-related open issues found |

## 10. Ecosystem Status

Not applicable. container2wasm is a standalone Go CLI tool and Dockerfile-based build pipeline with no dependent package ecosystem (no npm/PyPI/Maven consumers depend on it as a library). Section omitted per instructions.

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [#535](https://github.com/container2wasm/container2wasm/issues/535) | Emscripten + QEMU (--to-js): VirtFS completely inaccessible | Open (since 2025-11-09) | **Correctness bug** | QEMU VirtFS mounts (root and `/pack`) return permission-denied on both Alpine and Debian riscv64 images, following the documented qemu-wasm example. Directly implicates the QEMU riscv64 backend added in PR #374. No maintainer response as of research date. |
| [#75](https://github.com/container2wasm/container2wasm/issues/75) | [Question] Better Performance | Closed (completed, 2025-02-13) | Performance report, not a bug | ~16s Node.js hello-world on riscv64/alpine (4-core/4GB host, June 2023); closed ~20 months after opening with no visible maintainer resolution comment on the fetched page - likely a stale-issue sweep rather than an active fix. |
| [#306](https://github.com/container2wasm/container2wasm/pull/306) (PR) | no-conversion without imagemounter | Open (since 2024-08-14) | Feature, not a bug | Uses riscv64 as its worked example; blocked on maintainer-requested rebase, a squashfs-vs-isofs default decision, `filepath.IsAbs` validation, `/ext/bundle` docs, and lint fixes. |
| [#64](https://github.com/container2wasm/container2wasm/pull/64) (PR) | tinyemu: Slirp Socket support on WAMR | Open (since 2023-06-08) | Feature, not a bug | Touches the riscv64/TinyEMU emulator's networking directly; open 2+ years, blocked on design agreement around flag naming/opt-in behavior for the socket feature, not a hard technical blocker. |

**Correctness bugs highlighted separately:** Issue #535 is the only confirmed, open, riscv64-specific correctness bug in this project. It affects the QEMU/`--to-js` browser output path; the TinyEMU/WASI path is not reported as affected by this or any other open correctness issue.

A search for `nan`/`floating point` in the issue tracker returned zero matches for this repository. A related bug exists in Firefox/SpiderMonkey (Bugzilla #1975867, resolved fixed) but does not mention or implicate container2wasm (see Section 6).

## 12. Objections and Upstream Blockers

**Stated objections:** None found. No maintainer or contributor has stated an objection to riscv64 support; on the contrary, riscv64 is documented as one of the two "recommended" architectures and its TinyEMU init logic served as the template the x86/Bochs path was later refactored to match (PR #111).

**Technical blockers:**
- Issue #535 (QEMU VirtFS permission-denied on riscv64) is unresolved and unaddressed by any maintainer response found.
- PR #306 (riscv64-relevant feature) is blocked on a maintainer-requested rebase, a squashfs-vs-isofs default decision, input validation, documentation, and lint fixes - all addressable engineering work, not a fundamental objection.
- PR #64 (riscv64/TinyEMU networking feature) is blocked on design agreement (flag naming/opt-in semantics), not a hard technical wall.

**Organizational blockers:** The project is effectively single-maintainer (ktock/NTT), which caps review bandwidth and explains why two riscv64-touching community PRs have sat open for a year or more. There is no evidence of any organization actively resisting or deprioritizing riscv64 work; the bottleneck is maintainer capacity, not policy.

**RISE involvement:** None found anywhere - confirmed via RISE blog site-search (`riseproject.dev/?s=container2wasm`: zero results), the RISE members list (container2wasm is not a member; RISE membership is a corporate-consortium construct that projects like this do not join), the `riseproject-dev` GitHub org (no `container2wasm` repo among its 25 repos), and the RISE Python wheel builder (not applicable - Go tool, no PyPI package). The only GitHub hit under `riseproject-dev` was this tracking repository's own internal research queue (`riseproject-dev/sw-ecosystem/project-reports/.queue.yml`) listing container2wasm as a candidate to be researched - not evidence of funding or adoption.

**Acceptance probability (of further riscv64 improvements upstream):** High for maintainer-authored fixes (historical precedent: PR #111 and PR #374 were both same-day merges by the sole maintainer), but slow for community-submitted riscv64-adjacent feature work given the single-maintainer review bottleneck evidenced by PR #306 and PR #64 remaining open for a year-plus each.

## 13. Readiness Assessment

- **Color:** blue
- **Release provider:** none
- **Optimization gap:** N/A - container2wasm is not an optimization-purpose project under the color model's Step 2 test. Its value (running a container inside a WASM sandbox) does not depend on RISC-V-specific codegen inside this repository; the actual CPU-emulation code lives in separately-graded upstream forks (`ktock/tinyemu-c2w`, `ktock/qemu-wasm`), not in container2wasm itself. Step 2 therefore does not apply and the CI-based primary color (Step 1) is not capped.
- **Justification:** Upstream CI (`.github/workflows/tests.yml`, confirmed by direct file read) both builds riscv64 and runs the real functional test suite against it - the `test` job matrix (`arch: ["x86_64","(riscv64|aarch64)"]`) executes `make test` across six WASI runtime backends (Wasmtime, WAMR, Wasmer, Wazero, WasmEdge, plus Tools), and the `browser` job matrix (`arch: ["x86_64","riscv64","aarch64"]`) runs `TestBrowsers` for riscv64 - both are release-blocking on every push to `main` and every pull request, run via QEMU user-mode emulation (`docker run --privileged --rm tonistiigi/binfmt --install riscv64`) on standard `ubuntu-24.04` GitHub-hosted runners. Per the color model's Step 1 table (build yes, test yes, release artifact no), this places the project at **blue**. It is not green because upstream does not publish a riscv64 release artifact for the `c2w`/`c2w-net` tool itself: GitHub Releases (checked v0.6.3 through the latest v0.8.4, [releases page](https://github.com/container2wasm/container2wasm/releases)) ship only `linux-amd64` and `linux-arm64` host tarballs, and no other channel (PyPI - package does not exist at all; Ubuntu 26.04 resolute - no results; Arch RISC-V - no listing) provides one either, so `release_provider` is `none`.
- **Pending work that could change the grade:** Landing a riscv64 host release artifact (currently absent from every channel checked) would be the single change that could move this project to green, since CI already meets the test-execution bar. Resolving issue [#535](https://github.com/container2wasm/container2wasm/issues/535) (open QEMU VirtFS correctness bug on riscv64) would remove the one confirmed functional gap in the currently-tested riscv64 paths, though it does not by itself change the color since it affects a specific feature (VirtFS mounting under `--to-js`) rather than the CI-tested baseline. No RISE involvement or funded work was found that would affect this grade (Section 12).

## 14. Investment Analysis

RISE has no confirmed involvement with container2wasm (Section 12) - no funded work, no runner contribution, no blog coverage. All sizing below is therefore uncapped by any existing RISE contribution.

### 14.1 Functional Enablement
Fix issue [#535](https://github.com/container2wasm/container2wasm/issues/535) (QEMU riscv64 VirtFS permission-denied on `--to-js`) - the only confirmed open correctness bug specific to riscv64. Root-causing this requires debugging the QEMU-Wasm fork's VirtFS/9p implementation under the Emscripten/WASI environment, which is outside container2wasm's own repository (fork `ktock/qemu-wasm`) - scope and effort cannot be sized without first reproducing the bug against that fork, which was not accessible in this research pass. Effort: Data not available - requires a reproduction and root-cause pass before sizing.

### 14.2 Performance Optimization
No controlled riscv64 performance data exists beyond a single anecdotal report (~16s Node.js hello-world, issue #75, 2023). Before sizing any optimization work, a reproducible benchmark suite comparing riscv64 (TinyEMU and QEMU backends) against amd64/arm64 on equivalent hardware is needed - none currently exists. Effort: Data not available pending a benchmarking pass; establishing the benchmark harness itself is estimated at 1-2 person-weeks.

### 14.3 CI/CD Infrastructure
CI is already at parity or better than aarch64 (8/8 test-file coverage vs 3/8 for aarch64; both build and test execution present). The one gap is that riscv64 (like all architectures here) runs on emulated QEMU user-mode inside x86_64 GitHub-hosted runners rather than native hardware - moving to native riscv64 CI runners (e.g. via a RISE-hosted runner, none currently in use per Section 12) would increase confidence in test fidelity and could reduce CI time, but is not required to change the current color grade. Effort: 1 person-week to integrate a native riscv64 runner into the existing matrix, contingent on runner availability (e.g. RISE runners, not currently used by this project).

### 14.4 Ecosystem Enablement
Not applicable - see Section 10.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Reproduce and fix issue #535 (QEMU riscv64 VirtFS permission-denied) | Data not available - needs reproduction pass first | Data not available | High |
| Functional | Publish an official riscv64 host release artifact for `c2w`/`c2w-net` (or document why one is unnecessary given riscv64 is a guest-only target) | 1-2 (packaging/CI matrix addition, assuming build already succeeds cross-arch) | Data not available | Medium |
| Performance | Build a reproducible riscv64 vs amd64/arm64 benchmark harness | 1-2 | Data not available | Medium |
| CI/CD | Evaluate native riscv64 CI runner (e.g. RISE runners) to replace QEMU-emulated CI | 1 | Data not available | Low |
| Governance | Reduce single-maintainer review bottleneck for riscv64-touching community PRs (#306, #64 open 1+ year each) | Not a sizeable engineering task - organizational/process issue | Data not available | Medium |

## 15. Updates
(No updates yet - initial report dated 2026-06-17.)

## 16. References

- [container2wasm/container2wasm GitHub repository](https://github.com/container2wasm/container2wasm)
- [PR #374 - QEMU: support riscv64 containers](https://github.com/container2wasm/container2wasm/pull/374)
- [Commit a3518f6 - QEMU: support riscv64 containers](https://github.com/container2wasm/container2wasm/commit/a3518f664cc551bf6706de3d93be58f56530c135)
- [Merge commit da372f2 - PR #374](https://github.com/container2wasm/container2wasm/commit/da372f28342f73be1857e1ab5f67eae56280b021)
- [PR #306 - no-conversion without imagemounter](https://github.com/container2wasm/container2wasm/pull/306)
- [PR #111 - x86: refactor: unify init logic to riscv's one](https://github.com/container2wasm/container2wasm/pull/111)
- [Commit 664776a - x86: refactor: unify init logic to riscv's one](https://github.com/container2wasm/container2wasm/commit/664776a6e6b1f3c3b830dad56a201e11c68c617d)
- [Merge commit c7d33c5 - PR #111](https://github.com/container2wasm/container2wasm/commit/c7d33c571e2c99814a6426410712e9a2cf2b9a65)
- [PR #64 - tinyemu: Slirp Socket support on WAMR](https://github.com/container2wasm/container2wasm/pull/64)
- [PR #104 - build(deps): bump golang.org/x/sys 0.10.0->0.11.0](https://github.com/container2wasm/container2wasm/pull/104)
- [Issue #535 - Emscripten + QEMU (--to-js): VirtFS completely inaccessible](https://github.com/container2wasm/container2wasm/issues/535)
- [Issue #75 - [Question] Better Performance](https://github.com/container2wasm/container2wasm/issues/75)
- [Issue #437 - ./c2w sagemath/sagemath:latest sagemath.wasm Failed (unrelated, matched incidentally)](https://github.com/container2wasm/container2wasm/issues/437)
- [Issue #183 - Failed (could not compile cap-primitives) (unrelated, matched incidentally)](https://github.com/container2wasm/container2wasm/issues/183)
- [Issue #155 - Impossible to run with mac M1 (largely unrelated, matched incidentally)](https://github.com/container2wasm/container2wasm/issues/155)
- [Issue #297 - performance-loss question, open/unanswered](https://github.com/container2wasm/container2wasm/issues/297)
- [container2wasm GitHub Releases](https://github.com/container2wasm/container2wasm/releases)
- [PyPI JSON API for "container2wasm" (404, package does not exist)](https://pypi.org/pypi/container2wasm/json)
- [PyPI simple index for "container2wasm" (404)](https://pypi.org/simple/container2wasm/)
- [RISE GitLab wheel-builder PyPI proxy for "container2wasm" (redirects to PyPI 404)](https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/container2wasm/)
- [Ubuntu package search for "container2wasm" on resolute (no results)](https://packages.ubuntu.com/search?keywords=container2wasm&suite=resolute&searchon=names&section=all)
- [Arch Linux RISC-V package search for "container2wasm" (no results)](https://archriscv.felixc.at/?q=container2wasm)
- [RISE Project members page](https://riseproject.dev/members/)
- [RISE Project blog search for "container2wasm" (no results)](https://riseproject.dev/?s=container2wasm)
- [RISE Project blog search for "wasm" (one unrelated hit: V8 RISC-V development)](https://riseproject.dev/?s=wasm)
- [RISE blog post - A Glimpse Into V8 Development for RISC-V](https://riseproject.dev/2025/12/09/a-glimpse-into-v8-development-for-risc-v/)
- [KubeCon+CloudNativeCon EU 2026 lightning-talk deck - container2wasm: Running Containers On Wasm Environments](https://hosted-files.sched.co/kccnceu2026/b8/container2wasm.pdf)
- [WasmCon 2024 talk - Distributing and Running Containers for Wasm-Enabled Environments (YouTube)](https://www.youtube.com/watch?v=oyK6_WTcXvQ)
- [ktock's public riscv64 browser demo (vim)](https://ktock.github.io/container2wasm-demo/riscv64-vim.html)
- [ktock/tinyemu-c2w fork (TinyEMU riscv64 emulator core)](https://github.com/ktock/tinyemu-c2w)
- [ktock/qemu-wasm fork (QEMU riscv64/Emscripten backend)](https://github.com/ktock/qemu-wasm)
- [Mozilla Bugzilla #1975867 - Improper Float32 architectural NaN-boxing when popping from stack on riscv64 (Firefox/SpiderMonkey, unrelated to container2wasm)](https://bugzilla.mozilla.org/show_bug.cgi?id=1975867)