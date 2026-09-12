---
title: Mewz
parent: Project Reports
color: orange
dependencies:
  - name: Zig
    relation: build-dependency
    criticality: critical
  - name: QEMU
    relation: test-dependency
    criticality: critical
  - name: Newlib
    relation: runtime-dependency
    criticality: critical
  - name: lwIP
    relation: runtime-dependency
    criticality: critical
  - name: Wasker
    relation: runtime-dependency
    criticality: critical
---

# Mewz

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-09-10<br/>
**Readiness:** orange<br/>
**Scope:** RISC-V (riscv64/linux) support status for Mewz<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

{% include dependency-graph.html slug="dependencies" subset="mewz" %}

## 1. Project Overview

Mewz ([github.com/mewz-project/mewz](https://github.com/mewz-project/mewz)) is a lightweight unikernel execution environment for running WebAssembly/WASI applications with high isolation and portability, described in the paper "Mewz: Lightweight Execution Environment for WebAssembly with High Isolation and Portability using Unikernels" ([arXiv:2411.01129](https://arxiv.org/abs/2411.01129)), authored by Soichiro Ueda, Ai Nozaki, Daisuke Kotani, and Yasuo Okabe. It is written in Zig, licensed GPL-3.0, and has 685 stars / 19 forks on GitHub as of the research window.

**Governance:** Mewz has no foundation affiliation (not CNCF, Linux Foundation, Bytecode Alliance, or similar). No `MAINTAINERS`, `OWNERS`, `CODEOWNERS`, `GOVERNANCE.md`, `PLATFORMS.md`, or `SUPPORT.md` file exists in the repository. The `mewz-project` GitHub org publishes no public members list, no org description, and no funding/sponsor links.

**Contributors (full 137-commit history):**
- **Saza-ku / Saza** (`the.latticeheart@gmail.com`) - approximately 117 of 137 commits, the effective sole maintainer. GitHub bio: "A newbie infrastructure engineer," no company listed.
- **ainozaki** - 6 commits; email domain `hal.ipc.i.u-tokyo.ac.jp` (University of Tokyo HAL lab), an academic affiliation, not corporate.
- **Naoki MATSUMOTO** (`naoki@pibvt.net`) - 3 commits, personal domain.
- **HeDui** - 1 commit.
- **dependabot[bot]** - 10 automated commits.

No contributor's commits are attributed to a named corporate employer. This reads as a single-maintainer academic/independent open-source project rather than a governed, corporately-sponsored one.

**Corporate sponsors:** None found.

**RISE membership:** Mewz/mewz-project is not mentioned anywhere on [riseproject.dev](https://riseproject.dev), including the Members page (which lists only corporate chip/hyperscaler members such as Google, NVIDIA, Qualcomm, SiFive, Red Hat, etc., not software projects) or the full 34-post RISE blog archive.

**Community culture on new ports:** No tiered-platform policy exists (no `PLATFORMS.md`/`SUPPORT.md`, no `docs/platforms` directory), because only one platform (x86_64/QEMU) is supported at all. No open issue, PR, or discussion in the project's history proposes a RISC-V or any other new architecture port - the topic does not appear to have been raised.

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| N/A | No RISC-V port has ever been started | Full-history `git log -i -S"riscv"` and `-i --grep` across all 137 commits, plus a full-tree grep for "riscv"/"risc-v", both return zero matches |

There is no first RISC-V commit, no RISC-V branch, and no key contributors working on a port, because none exists. Mewz is **not** upstream-available on riscv64 in any form - the project is fully x86_64-only, not partially or fully ported.

## 3. Upstream Support Tier

No formal tier policy exists. There is no CI evidence, no release-blocking gate, and no official binary for any architecture other than x86_64.

| Aspect | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI builds | Yes ([`.github/workflows/ci.yaml`](https://github.com/mewz-project/mewz/blob/main/.github/workflows/ci.yaml), `ubuntu-latest`) | No evidence of arm64 CI or code found | No |
| CI tests | Yes (`./scripts/integration-test.sh --ci` under QEMU) | N/A | No |
| Official binaries | Source-only (GitHub release tarballs/zips, no compiled binaries at all) | N/A | No |
| Architecture code | Full (boot, interrupt, APIC, PCI, linker script) | None found | None |

Mewz does not build a compiled release binary for any architecture - GitHub releases v0.1.0 through v0.1.3 carry only the generic GitHub auto-generated `.zip`/`.tar.gz` source archives, with no filenames containing "riscv," "arm64," or any architecture tag.

## 4. Technical Architecture and RISC-V-Specific Subsystems

Mewz has **no architecture-abstraction layer at all** - it is a single-architecture (x86_64-only) design, not a portable codebase with a missing RISC-V backend. `src/` is flat, with no `arch/` subdirectory of any kind:

```
src/ (flat, no arch/ subdirectory, no arch/x86_64, arch/riscv64, arch/aarch64)
  args.zig, boot.S, c/, drivers/, fs.zig, fuse.zig, heap.zig, http_client.zig,
  interrupt.S, interrupt.zig, ioapic.zig, lapic.zig, log.zig, lwip.zig, main.zig,
  mem.zig, multiboot.zig, nameresolve.zig, panic.zig, param.zig, pci.zig,
  picirq.zig, poll.zig, rand.zig, stream.zig, sync.zig, tcpip.zig, timer.zig,
  uart.zig, util.zig, vfs.zig, wasi.zig, wasi/, x64.ld, x64.zig
```

A repo-wide, case-insensitive grep for `riscv|risc-v|risc_v` across every file in the repository (not just workflows) returns **zero matches**. A grep across every `.zig`/`.S`/`.c`/`.h` file for `riscv|aarch64|arm64` also returns **zero matches**. Not one `#ifdef`, comment, stub function, or dead branch mentions RISC-V or ARM anywhere in the codebase.

**Architecture-specific components inventory (all x86_64-only, no riscv64 equivalents, not even stubs):**

| File | Lines | Purpose | riscv64 status |
|---|---|---|---|
| `src/x64.zig` | 176 | Port I/O (`in`/`out`/`insl`), SSE/AVX enable via inline x86 asm | Missing |
| `src/boot.S` | 271 | Multiboot entry, long-mode setup | Missing |
| `src/interrupt.S` | 176 | IDT stub table | Missing |
| `src/interrupt.zig` | 169 | IDT/interrupt handling | Missing |
| `src/ioapic.zig` | 67 | I/O APIC (x86-only device) | Missing (needs PLIC equivalent) |
| `src/lapic.zig` | 96 | Local APIC (x86-only device) | Missing |
| `src/picirq.zig` | 10 | Legacy 8259 PIC | Missing |
| `src/multiboot.zig` | 70 | Multiboot header parsing (x86 boot protocol) | Missing |
| `src/pci.zig` | 297 | PCI config space access via x86 port I/O | Missing (not portable as-is; riscv64 typically uses MMIO-based PCIe config) |
| `src/x64.ld` | - | x86_64 linker script | Missing |

`build.zig` (lines 104-108) hardcodes the target with no override option:

```zig
const target = b.resolveTargetQuery(.{
    .cpu_arch = .x86_64,
    .os_tag = .freestanding,
    .ofmt = .elf,
});
```

There is no `-Dtarget`/`-Darch` build flag, no matrix, and no conditional target selection anywhere in the build system.

**Component comparison table:**

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Boot/entry code | Full (multiboot2, `boot.S`) | Missing | Missing |
| Interrupt/trap handling | Full (IDT, `interrupt.S`) | Missing | Missing |
| Interrupt controller | Full (LAPIC/IOAPIC/PIC) | Missing | Missing (would need PLIC) |
| Port I/O / MMIO primitives | Full (`x64.zig`) | Missing | Missing |
| PCI enumeration | Full (port-I/O based) | Missing | Missing |
| Linker script / memory layout | Full (`x64.ld`) | Missing | Missing |
| SIMD/JIT/crypto | Not applicable (Wasm AOT compilation delegated to Wasker, see Section 9) | N/A | N/A |

There is no partial or scalar-fallback tier to report for riscv64: the codebase contains not even a placeholder module, `#ifdef` branch, or build-flag stub for it. A riscv64 port would require introducing an architecture-abstraction layer from scratch: boot code, trap/interrupt handling, an arch-neutral I/O layer, a PLIC driver, and a new linker script/build target.

## 5. Build System, Cross-Compilation, and Toolchain

Mewz uses **Zig's native build system** (`build.zig`), not CMake or Make at the top level. CMake is used only as a sub-build for the bundled lwIP dependency (`lwip-wrapper/CMakeLists.txt`), invoked internally by `scripts/build-lwip.sh`.

**Build commands (from CI, [`.github/workflows/ci.yaml`](https://github.com/mewz-project/mewz/blob/main/.github/workflows/ci.yaml)):**
```
zig build -Dtest=true -Doptimize=ReleaseFast
./scripts/integration-test.sh --ci
```

**Toolchain (from the root `Dockerfile`):**
```dockerfile
FROM ghcr.io/mewz-project/wasker:latest
ARG ZIG_VERSION=zig-x86_64-linux-0.16.0-dev.2979+e93834410
ENV PATH="/usr/bin/zig:${PATH}"
WORKDIR /mewz
RUN apt-get update && \
    apt-get install -y curl xz-utils qemu-system qemu-system-common qemu-utils git cmake libstdc++6 build-essential && \
    apt-get clean && rm -rf /var/lib/apt/lists/*
RUN curl -SL https://ziglang.org/builds/${ZIG_VERSION}.tar.xz \
    | tar -xJC /tmp && mv /tmp/${ZIG_VERSION} /usr/bin/zig
COPY . .
RUN ./scripts/build-newlib.sh && ./scripts/build-lwip.sh
ENTRYPOINT [ "./scripts/run.sh" ]
```

Even the Zig toolchain download is arch-named for the build host (`zig-x86_64-linux-...`) - there is no equivalent riscv64 zig download reference anywhere, and `build.zig`'s only user-facing options are `-Dapp-obj`, `-Dlog-level`, `-Ddir`, `-Dmount`, `-Dargs`, and `-Dtest` (no `-Darch` / `-DUSE_*` toggle exists at all).

**QEMU usage:** `scripts/run-qemu.sh` hardcodes `qemu-system-x86_64`, `-cpu Icelake-Server`, and links `src/x64.ld`. There is no riscv64 machine/CPU path. The `-cpu Icelake-Server` flag also bakes AVX2/AVX-512-class host CPU features into Wasker's AOT-compiled Wasm output (see Section 9).

**Newlib:** `scripts/build-newlib.sh` hardcodes `configure --target=x86_64-elf`. Upstream newlib generically supports `riscv32-elf`/`riscv64-elf` configure targets (used ubiquitously by `riscv-gnu-toolchain`), so this is a pure Mewz-side configuration gap, not an upstream newlib limitation.

**Known build failures on riscv64:** None documented, because no riscv64 build has ever been attempted. There is no `BUILDING.md`, `INSTALL`, `docs/building.md`, or `docs/cross-compilation.md` in the repository at all.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Boots at all | Yes | No | No |
| Runs Wasm/WASI workloads | Yes | No | No |
| Networking (virtio-net via lwIP) | Yes | No | No |
| Integration test suite passes | Yes (CI-verified) | N/A | N/A |
| Published performance data | Yes (30% improvement vs. Wasm-runtime-on-Linux-VM baseline, x86_64 only, per [arXiv:2411.01129](https://arxiv.org/abs/2411.01129)) | None | None |

**Functional gaps:** Total. Mewz cannot boot, run, or execute any workload on riscv64 today - there is no functional gap analysis to perform on specific features because the entire platform layer (boot, interrupts, memory management primitives, PCI, linker script) is absent.

**Performance gaps:** Not applicable - no riscv64 build exists to benchmark.

**Security hardening gaps:** Not evaluated - no riscv64 build exists. [NEEDS VERIFICATION: whether Mewz's isolation model (a core value proposition per its paper) has any architecture-specific hardening assumptions beyond x86_64 paging.]

**NaN / floating-point semantics issues:** Data not available: no riscv64 build exists to test, and no floating-point-specific code or issue was found in the research.

One data point illustrating the depth of x86_64-specific assumptions: a closed bug, #43 ("Not to set bit 8 in PML4E, PDPTE"), concerns x86_64 4-level paging structures (PML4E/PDPTE) specifically. RISC-V's Sv39/Sv48 paging scheme has no direct equivalent to these x86 page-table-entry structures, meaning even memory-management code would need a substantial rewrite, not a port.

## 7. CI/CD Infrastructure

**No riscv64 CI exists.** The repository has exactly one CI workflow file, `.github/workflows/ci.yaml` - confirmed by direct clone and filesystem inspection (`git clone --depth 1 https://github.com/mewz-project/mewz.git`, HEAD `5c58a56`), and by the absence of `.gitlab-ci.yml`, `Jenkinsfile`, or `.cirrus.yml` in the repository root.

**Full content of `.github/workflows/ci.yaml`:**
```yaml
name: CI

on:
  push:
    branches:
      - main
    paths-ignore:
      - '**/*.md'
  pull_request:
    paths-ignore:
      - '**/*.md'

jobs:
  run-integration-test:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout mewz
        uses: actions/checkout@v7
        with:
          repository: mewz-project/mewz
          submodules: true

      - uses: mlugg/setup-zig@v2
        with:
          version: master
          cache: true

      - name: Install packages for running tests
        uses: awalsh128/cache-apt-pkgs-action@v1.6.3
        with:
          packages: qemu-system mtools virtiofsd

      - name: Cache mewz
        uses: actions/cache@v6
        with: {path: zig-cache, key: ${{ runner.os }}-mewz}

      - name: Cache Newlib
        uses: actions/cache@v6
        with: {path: build/newlib, key: ${{ runner.os }}-mewz-newlib}

      - name: Cache lwIP
        uses: actions/cache@v6
        with: {path: build/lwip, key: ${{ runner.os }}-mewz-lwip}

      - name: Build Mewz
        run: zig build -Dtest=true -Doptimize=ReleaseFast

      - name: Run tests
        run: |
          ./scripts/integration-test.sh --ci
```

- **Trigger:** `push` to `main` (excluding markdown-only diffs) and `pull_request` (same exclusion). No `workflow_dispatch`, no schedule.
- **Runner:** `ubuntu-latest`, a standard GitHub-hosted x86_64 runner. No self-hosted runner, no `arch:`/matrix key, no riscv64 runner label anywhere.
- **Job type:** build-and-test (not build-only) - `zig build -Dtest=true -Doptimize=ReleaseFast` followed by `./scripts/integration-test.sh --ci`, which actually executes tests under QEMU.
- `qemu-system` (the generic metapackage covering all QEMU target architectures) is installed via apt, but nothing in the workflow selects a riscv64 QEMU binary, target triple, or cross-compilation flag - it is a plain default-target (x86_64) build/test.
- **RISE runners:** No reference to `riseproject-dev`, RISE runner labels, or any RISE infrastructure anywhere in the workflow or repository.

**Comparison table:**

| Aspect | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI builds | Yes | No CI | No CI |
| CI tests | Yes (QEMU integration test) | N/A | N/A |
| CI release gate | Implicit (PR must pass before merge to `main`) | N/A | N/A |
| Hardware/runner | `ubuntu-latest` GitHub-hosted | N/A | N/A |
| RISE runner usage | No | No | No |

## 8. Distribution and Release Status

**No official binaries exist for any architecture.** Mewz's GitHub releases (v0.1.0 through v0.1.3, dated 2023-12-29 through 2025-07-31) carry only generic GitHub auto-generated source archives (`.zip`, `.tar.gz`) - confirmed via the `expanded_assets` endpoint for all four releases. No filename contains "riscv," "x86_64," "amd64," or any architecture tag. Mewz is a source-only distributed unikernel OS project; users build it themselves via the Zig build system and Dockerfile described in Section 5.

- **PyPI:** `https://pypi.org/pypi/mewz/json` returns **HTTP 404 Not Found** - no package named "mewz" exists on PyPI for any architecture. The riscv64 question is moot here; nothing is published at all.
- **npm:** Not applicable - Mewz is not a JavaScript/npm-distributed project.
- **Maven:** Not applicable.
- **OCI/container images:** The root `Dockerfile` builds a dev/build image (`ghcr.io/mewz-project/wasker:latest` base), but this is a build environment, not a Mewz release artifact; no evidence of a published multi-arch OCI image for Mewz itself was found.
- **Ubuntu 26.04 (Resolute):** `https://packages.ubuntu.com/search?keywords=Mewz&suite=resolute&searchon=names&section=all` returns "Sorry, your search gave no results" - no package named Mewz in any architecture.
- **Debian, Fedora:** Data not available: no dedicated lookups reported in findings beyond Ubuntu; given PyPI/Ubuntu/Arch all return zero results and Mewz is source-only, it is reasonable to infer the same for these but this was not directly checked.
- **Arch Linux RISC-V port (archriscv.felixc.at):** No package search feature returns any hit for "mewz"; the string does not appear anywhere on the site.
- **RISE Python wheel builder:** `https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/mewz/` redirects (HTTP 302) to the PyPI page, which is itself a 404. No RISE-built wheels exist (moot, since Mewz is not a Python package).

**What a user must do to get a working binary:** Clone the repository, install the Zig toolchain (pinned nightly version per the Dockerfile), build newlib and lwIP from the bundled submodules/scripts (`scripts/build-newlib.sh`, `scripts/build-lwip.sh`), and run `zig build`. There is no pre-built binary distribution channel for any architecture, x86_64 included - this is universal to the project's source-only nature, not an riscv64-specific gap.

## 9. Dependencies

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Notes |
|---|---|---|---|---|---|
| Zig | Build-dependency (critical) - compiles the kernel (`use_llvm=true`, freestanding target) | Zig's own tier system: riscv64-freestanding is Tier 2 (LLVM-backed codegen; self-hosted backend missing several features per [ziglang/zig#21519](https://github.com/ziglang/zig/issues/21519)) | Live Forgejo CI for Zig itself has no riscv64 job as of this research (a riscv64-linux lane, PR #24385, was merged then later dropped) | Upstream Zig publishes riscv64 tarballs directly (0.16.0 stable and 0.17.0-dev nightly confirmed reachable) | Mewz-specific gap: `Dockerfile` pins `zig-x86_64-linux-...` - even the build-host toolchain download is x86_64-only |
| QEMU | Test-dependency (critical) - runs/tests the kernel under emulation | riscv64 `target/riscv` is a "Supported" tier in QEMU's own MAINTAINERS file (paid maintainer); `virt` machine actively developed | No native riscv64 CI runner in QEMU's own GitLab CI (riscv64 testing is cross-compiled on x86 there) | Debian sid ships `qemu` for riscv64 (2 open non-blocking FTBFS bugs); no official pre-built riscv64-hosted binary from upstream | Mewz-specific gap: `run-qemu.sh` hardcodes `qemu-system-x86_64`, `-cpu Icelake-Server` (bakes AVX2/AVX-512-class host features into Wasker's AOT output), and `isa-debug-exit` (no ISA bus on riscv64 `virt` - would need e.g. `sifive_test`/syscon instead). No riscv64 machine/CPU path exists in Mewz's scripts |
| Newlib | Runtime-dependency (critical) - statically-linked C library and heap allocator for the kernel and WASI code | Upstream newlib generically supports `riscv32-elf`/`riscv64-elf` configure targets (used ubiquitously by `riscv-gnu-toolchain`) | N/A - always built from source per-project | N/A | Mewz-specific gap only: `scripts/build-newlib.sh` hardcodes `configure --target=x86_64-elf`. This is a pure Mewz-side configuration gap, not an upstream limitation. Hosted on Sourceware Bugzilla, not GitHub, so issue search coverage is more limited [NEEDS VERIFICATION: exact riscv64-elf newlib maturity] |
| lwIP | Runtime-dependency (critical) - TCP/IP networking stack (virtio-net) | `lwip-wrapper/CMakeLists.txt` pins no target architecture/toolchain file - portable ISO C compiled with `-ffreestanding`, using whatever host compiler CMake picks up | GitHub search for `riscv` in `lwip-tcpip/lwip`: 0 issues/PRs (no positive or negative signal) | N/A | Likely not a blocker - architecture-agnostic C code would very likely build for riscv64 automatically once Zig and newlib are retargeted, but this is unverified since no attempt has been made |
| Wasker | Build-dependency (critical) - Wasm-to-native AOT compiler (`mewz-project/wasker`, sibling repo), Mewz's JIT-equivalent backend via Rust `inkwell`/LLVM 22 | Rides on LLVM's riscv64 availability (LLVM riscv64 backend is mainline and "de facto core target," Ubuntu-packaged) but Wasker's own `compiler.rs::get_host_target_machine()` always targets the build host's native triple (`Target::initialize_native` + `get_default_triple` + `get_host_cpu_features`) - no explicit cross-compile-to-riscv64 path exists in the code | GitHub search `riscv`/`riscv64` in `mewz-project/wasker`: 0 issues/PRs | N/A | Needs either code changes to accept an explicit target triple, or must be run natively on a riscv64 host with LLVM's RISCV target (present by default in LLVM). Also silently bakes host SIMD features into codegen (matching the `Icelake-Server` AVX-512 assumption in Section 5) - porting would need equivalent LLVM RVV (RISC-V Vector) codegen support, which is upstream-available in LLVM but wholly unexercised in Wasker today |

**Deep-dive - LLVM (transitive dependency via Zig and Wasker):** LLVM is used both as Zig's codegen backend (`use_llvm=true`) and as Wasker's AOT Wasm compiler backend (`inkwell`/`llvm-sys`, LLVM 22). Ubuntu 26.04 (Resolute) ships `llvm`, `llvm-17` through `llvm-22` (plus `-dev` packages) for riscv64. The riscv64 LLVM backend is mainline / "de facto core target," but is **not** in LLVM's required pre-merge CI gate (zero riscv64 references found in `premerge.yaml`/`.ci/*`); only narrow QEMU execution testing is scoped to `libc/**`. No upstream riscv64 release binaries exist; Ubuntu is the effective release provider for LLVM on riscv64. None of this is Mewz-specific.

**Bottom line on dependencies:** No dependency is individually a hard riscv64 blocker at the upstream level - Zig (Tier 2 freestanding), LLVM (mainline, Ubuntu-packaged), QEMU (Supported tier), newlib (generic `riscv64-elf` target), and lwIP (architecture-agnostic) all have viable upstream riscv64 paths. The entire gap is in **Mewz's own code and configuration**: a hardcoded `.cpu_arch = .x86_64` in `build.zig`, x86-only boot/interrupt/paging code, a hardcoded x86_64 newlib `--target`, a hardcoded `qemu-system-x86_64` test harness, and a sibling AOT compiler (Wasker) with no cross-compilation mode at all.

## 11. Known Bugs and Active Issues

No riscv64-specific bugs or issues exist, because no riscv64 work has been attempted. GitHub issue search for `riscv` (title+body) in `mewz-project/mewz` returns 0 results, confirmed independently via three separate GitHub search tools (`search_issues`, `search_pull_requests`, `search_code`) using direct `repo:` query-string qualifiers to bypass a session tooling restriction, and cross-checked with a sanity query (`is:pr`, no keyword filter) that returned a large legitimate result set, confirming the zero-counts are genuine.

**Open issues in mewz-project/mewz (for reference; none RISC-V-related):**

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| #111 | Make Mewz tickless | Open | N/A | Not architecture-related |
| #109 | Wire lwIP backlog APIs into sock_accept | Open | N/A | Not architecture-related |
| #89 | Use std HTTP Client | Open | N/A | Not architecture-related |
| #66 | Handle file descriptors as usize | Open (PR) | N/A | Not architecture-related |
| #65 | Integration test fails on Codespaces | Open (bug) | N/A | Not architecture-related |
| #53 | Devcontainer fails with zig build | Open | N/A | Not architecture-related |
| #49 | Replace Waiter with hlt | Open | N/A | Not architecture-related |
| #9 | UDP support | Open | N/A | Not architecture-related |
| #8 | lwIP error handling | Open | N/A | Not architecture-related |
| #7 | Max TCP connections option | Open | N/A | Not architecture-related |
| #3 | Handle file descriptors as usize | Open | N/A | Not architecture-related |
| #2 | RingBuffer overflow panic | Open (bug) | N/A | Not architecture-related |
| #1 | WASI preview1 coverage tracker | Open | N/A | Not architecture-related |

**Correctness bugs highlighted separately:** #43 ("Not to set bit 8 in PML4E, PDPTE," closed) is worth flagging as an architecture-depth signal even though it is closed and x86_64-specific: it demonstrates how deeply the codebase's memory-management assumptions are tied to x86_64 4-level paging (PML4E/PDPTE structures), which have no direct RISC-V Sv39/Sv48 equivalent.

## 12. Objections and Upstream Blockers

**Stated objections:** None found. The topic of a RISC-V port has never been raised in any issue, PR, discussion, or commit message.

**Technical blockers:**
- No architecture-abstraction layer exists in the codebase at all (single-arch design) - this is the primary blocker. A port requires greenfield work: new boot code, trap/interrupt handling, an arch-neutral I/O layer, a PLIC driver, and a new linker script/build target, rather than filling in a gap in an existing portable structure.
- Wasker (the Wasm AOT compiler dependency) has no cross-compilation mode - it always targets the build host's native triple, which would need code changes to accept an explicit target triple before it could produce riscv64 code.
- Mewz's own build-support scripts (newlib configure target, QEMU invocation, Zig toolchain download) hardcode x86_64 throughout, layered on top of the missing architecture-abstraction layer.

**Organizational blockers:**
- Single-maintainer project (Saza-ku, ~117/137 commits) with no corporate sponsor, no foundation, and no RISE membership. There is no institutional capacity signaled for undertaking a from-scratch architecture port.
- No RISE engagement of any kind (blog, wheel builder, membership, working group repo) was found for Mewz.

**Acceptance probability:** Data not available in the form of any maintainer statement. Given the project's academic origin (arXiv paper, University of Tokyo affiliation for one contributor) and permissive-looking commit history (dependabot automation present, PRs from multiple contributors merged), a well-scoped external contribution introducing a RISC-V architecture layer would plausibly be considered on its technical merits, but this is inference, not a documented maintainer position - [NEEDS VERIFICATION].

## 13. Readiness Assessment

- **Color:** orange (no standard sub-case cleanly applies - not `downstream-only`, since no distro ships Mewz for any architecture at all, and not `optimization-absent`, since Mewz is not an optimization-purpose project per the Step 2 test)
- **Release provider:** none (no upstream riscv64 artifact; no distro package; no PyPI, npm, or OCI channel exists for Mewz at all; no RISE involvement)
- **Optimization-purpose applicability:** Not applicable. Mewz's primary value proposition is isolation and portability via the unikernel model for running Wasm/WASI workloads, not out-accelerating a reference implementation through architecture-specific hot-path code (SIMD, crypto, allocator tuning). The paper's reported 30% performance improvement over a Wasm-runtime-on-Linux-VM baseline ([arXiv:2411.01129](https://arxiv.org/abs/2411.01129)) is attributed to the unikernel architecture itself (reduced OS overhead, direct hardware access), not to riscv64-specific (or even architecture-specific) optimization work. Step 2 of the color model therefore does not trigger, and no optimization level is assigned.
- **Justification:** Zero riscv64 CI exists - the sole workflow, [`.github/workflows/ci.yaml`](https://github.com/mewz-project/mewz/blob/main/.github/workflows/ci.yaml), runs only on `ubuntu-latest` (x86_64) with no architecture matrix, no self-hosted riscv64 runner, and no build/test step selecting a riscv64 target. `build.zig` hardcodes `.cpu_arch = .x86_64` with no override flag, and no distribution channel (Ubuntu 26.04 Resolute, Arch RISC-V, PyPI, RISE wheel builder) carries a Mewz package for any architecture, so the distribution floor described in the color model does not apply either - there is no distro build to fall back on. This is not a confirmed-broken (red) state, since riscv64 has never been attempted rather than attempted-and-failed; it is also not an unknown-unknown (grey) state, since the absence of any riscv64 code, CI, issue, PR, or package is exhaustively and positively confirmed across every channel checked, rather than simply unresearched.
- **Pending work that could change the grade:** None found. No open issue, PR, branch, or RISE engagement references RISC-V for this project as of 2026-09-10. Any grade change would require a maintainer or external contributor to start from zero: introducing an architecture-abstraction layer, riscv64 boot/interrupt/PLIC code, a retargeted newlib build, a riscv64 QEMU test harness, and a cross-compilation path in the Wasker AOT compiler.

## 14. Investment Analysis

**RISE prior work check:** No RISE involvement of any kind was found for Mewz (see Sections 1 and 12) - no blog post, no wheel builder listing, no working-group repository, no membership. Nothing has been funded or done by RISE for this project. All work items below are therefore fully unaddressed and not double-counted against any existing RISE effort.

### 14.1 Functional Enablement

The entire functional surface must be built from scratch:
- Design and implement an architecture-abstraction layer in `src/` (currently flat, x86_64-only).
- Implement riscv64 boot code (OpenSBI/UEFI entry, equivalent to `boot.S`'s multiboot2 x86_64 stub).
- Implement riscv64 trap/interrupt handling (equivalent to `interrupt.S`/`interrupt.zig`'s IDT-based design).
- Implement a PLIC driver (equivalent to `lapic.zig`/`ioapic.zig`/`picirq.zig`'s x86 APIC/PIC stack).
- Implement riscv64 port I/O / MMIO primitives (equivalent to `x64.zig`).
- Rework PCI enumeration for riscv64's MMIO-based PCIe config space (current `pci.zig` uses x86 port I/O, not portable as-is).
- Write a riscv64 linker script (equivalent to `x64.ld`).
- Add a `-Dtarget=riscv64` (or similar) option to `build.zig` and retarget the newlib build (`scripts/build-newlib.sh` currently hardcodes `--target=x86_64-elf`; needs `riscv64-elf` or equivalent).
- Add cross-compilation support to Wasker (`compiler.rs::get_host_target_machine()` needs an explicit-target-triple code path instead of always using the build host's native triple).
- Rework memory-management code away from x86_64 4-level-paging assumptions (PML4E/PDPTE) toward RISC-V's Sv39/Sv48 scheme.

### 14.2 Performance Optimization

Not applicable at this stage - there is no functional riscv64 build to optimize. Once functional enablement lands, the Wasker AOT compiler's silent host-SIMD-feature baking (currently tuned toward `Icelake-Server` AVX-512-class assumptions) would need an RVV (RISC-V Vector) equivalent codegen path in LLVM to reach comparable performance to the x86_64 build; this is upstream-available in LLVM but currently wholly unexercised by Wasker.

### 14.3 CI/CD Infrastructure

- Add a riscv64 job to `.github/workflows/ci.yaml`, either cross-compiled or using a native/self-hosted riscv64 runner (potentially a RISE RISC-V Runner, though no such engagement currently exists for this project).
- Retarget the QEMU test harness (`scripts/run-qemu.sh` and `scripts/integration-test.sh`) to `qemu-system-riscv64` with the `virt` machine, replacing the x86-only `isa-debug-exit` device with a riscv64-appropriate equivalent (e.g. `sifive_test`/syscon).

### 14.4 Ecosystem Enablement

Not applicable - Mewz has no dependent package ecosystem (no PyPI/npm/Maven consumers depend on it; it is a standalone unikernel OS project). Section 10 is omitted per the reporting rules.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Design and implement riscv64 architecture-abstraction layer (boot, trap/interrupt, PLIC, MMIO I/O, PCI, linker script) | Data not available: no prior port or scoping estimate exists for this project; sizing would require a dedicated engineering estimate [NEEDS VERIFICATION] | Unassigned | Critical |
| Functional | Add `-Dtarget=riscv64` to `build.zig`; retarget newlib build to `riscv64-elf` | Data not available: no scoping estimate exists [NEEDS VERIFICATION] | Unassigned | Critical |
| Functional | Add explicit cross-compilation target support to Wasker (`compiler.rs`) | Data not available: no scoping estimate exists [NEEDS VERIFICATION] | Unassigned | Critical |
| Functional | Rework memory-management code from x86_64 paging (PML4E/PDPTE) to RISC-V Sv39/Sv48 | Data not available: no scoping estimate exists [NEEDS VERIFICATION] | Unassigned | High |
| CI/CD | Add riscv64 job to `.github/workflows/ci.yaml` (build + QEMU test) | Data not available: no scoping estimate exists [NEEDS VERIFICATION] | Unassigned | High |
| CI/CD | Retarget QEMU test harness to `qemu-system-riscv64`/`virt` machine, replace `isa-debug-exit` | Data not available: no scoping estimate exists [NEEDS VERIFICATION] | Unassigned | Medium |
| Performance | RVV codegen path in Wasker's LLVM-based AOT compiler | Data not available: blocked on functional enablement landing first [NEEDS VERIFICATION] | Unassigned | Low (post-functional) |

No effort estimates could be derived from the research findings - this report deliberately does not invent person-week figures absent a scoping exercise, per the verification policy in the header.

## 15. Updates

(No updates yet - initial report dated 2026-09-10.)

## 16. References

- [Mewz repository](https://github.com/mewz-project/mewz)
- [Mewz CI workflow, ci.yaml](https://github.com/mewz-project/mewz/blob/main/.github/workflows/ci.yaml)
- [Mewz paper, arXiv:2411.01129](https://arxiv.org/abs/2411.01129)
- [Mewz paper HTML version](https://arxiv.org/html/2411.01129v1)
- [Wasker repository (sibling project)](https://github.com/mewz-project/wasker)
- [ziglang/zig issue #21519, self-hosted riscv64 backend gaps](https://github.com/ziglang/zig/issues/21519)
- [PyPI JSON API for "mewz" (404, package does not exist)](https://pypi.org/pypi/mewz/json)
- [Ubuntu package search for "Mewz" in Resolute (no results)](https://packages.ubuntu.com/search?keywords=Mewz&suite=resolute&searchon=names&section=all)
- [Arch Linux RISC-V port hub](https://archriscv.felixc.at/)
- [RISE Project members page](https://riseproject.dev)
- [RISE wheel builder proxy for "mewz" (redirects to 404)](https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/mewz/)