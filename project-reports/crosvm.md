---
title: crosvm
---

# crosvm

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Scope:** RISC-V (riscv64/linux) support status for crosvm<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

---

## 1. Project Overview

crosvm is a virtual machine monitor (VMM) written in Rust, originally developed by Google for ChromeOS (Crostini container runtime) and Android (ARCVM). It has since expanded to Android TerminalApp, the Cuttlefish virtual device platform, and Windows. It implements the KVM hypervisor interface directly via ioctls, provides virtio device emulation, and enforces per-process seccomp-BPF sandboxing via minijail.

The authoritative repository is `chromium.googlesource.com/crosvm/crosvm`. The GitHub repository at `github.com/google/crosvm` is a read-only mirror. GitHub issues are disabled; bug tracking uses Google's internal Buganizer (b/ URLs). GitHub pull requests are not accepted; all code review occurs on [Chromium Gerrit](https://chromium-review.googlesource.com/c/crosvm/crosvm/). Contributors must sign the Google CLA.

Governance is Google-controlled. The `OWNERS` file routes review to `crosvm-reviews@google.com`. Named owners are all Google or Chromium employees: `dtor@chromium.org`, `keiichiw@chromium.org`, `stevensd@chromium.org`, `takayas@chromium.org`, `uekawa@chromium.org`, `zihanchen@google.com`, `fmayle@google.com`, `auradkar@google.com`, `nkgold@google.com`, `rizhang@google.com`, `idanr@google.com`. A crosvm council (`drmasquatch@google.com`, `fmayle@google.com`, `keiichiw@chromium.org`, `khei@google.com`, `nkgold@google.com`) has special authority over `Cargo.lock` changes. All named owners are Google employees.

The license is BSD-3-Clause. Google is a Premier Member of the RISE Project. crosvm has no RISE-specific funding, no RISE blog coverage, and no RISE Working Group tracking as of August 2026.

---

## 2. Port History and Upstreaming Timeline

The riscv64 port was initiated entirely by Dylan Reid (Google). It landed in November 2021 as a batch of five commits on a single day.

| Date | Event | Source |
|---|---|---|
| 2021-11-02 | Initial riscv64 crate, KVM hypervisor support, irqchip, build integration added by Dylan Reid (Google) | [commit f30889ca](https://github.com/google/crosvm/commit/f30889ca), [commit 5c0f9797](https://github.com/google/crosvm/commit/5c0f9797), [commit 38d12428](https://github.com/google/crosvm/commit/38d12428) |
| 2022-05-17 | Initial KVM bindings generated from Linux 6.2 + AIA patches | [commit 94f82931](https://github.com/google/crosvm/commit/94f82931) |
| 2022-11-28 | Seccomp policies for riscv64 added | [commit 0594d03d](https://github.com/google/crosvm/commit/0594d03d) |
| 2023-02-08 | riscv64 added to dev container | [commit 36af53e2](https://github.com/google/crosvm/commit/36af53e2) |
| 2023-04-26 | riscv64 platform tooling added | [commit 965f99a7](https://github.com/google/crosvm/commit/965f99a7) |
| 2023-05-04 | riscv64 postsubmit CI builder added | [commit 63ae7f76](https://github.com/google/crosvm/commit/63ae7f76) |
| 2023-05-22 | IrqChip snapshot/restore stub added for riscv64 | [commit 3a53bce8](https://github.com/google/crosvm/commit/3a53bce8) |
| 2023-05-31 | riscv64 added to official build documentation | [commit 929acf65](https://github.com/google/crosvm/commit/929acf65) |
| 2023-08-01 | riscv64 added to presubmit CI (CQ required) | [commit 35828a10](https://github.com/google/crosvm/commit/35828a10) |
| 2023-11-08 | riscv64 CI builder disabled due to unstable Debian riscv64 cross-compilation containers | [commit 594c3a07](https://github.com/google/crosvm/commit/594c3a07), BUG=b:304875018 |
| 2024-06-26 to 2024-11-18 | Multiple build-break fixes (RunnableLinuxVm, FdtPosition, variable types, inline refactoring) | [commit 650b0ec7](https://github.com/google/crosvm/commit/650b0ec7) et al. |
| 2024-09-26 | Correctness fix: `get_one_reg` was mutating through a shared reference (latent UB) | [commit 2a96ff0f](https://github.com/google/crosvm/commit/2a96ff0f) |
| 2025-03-17 | riscv64 CI re-enabled (postsubmit); dev container rebuilt with riscv64 deps; 16-month gap closed | [commit 1882d385](https://github.com/google/crosvm/commit/1882d385), [Gerrit 6363077](https://chromium-review.googlesource.com/c/crosvm/crosvm/+/6363077) |
| 2025-03-18 | Dylan Reid (Rivos Inc.) tested on real riscv64 hardware, confirmed "looks good" | [Gerrit 6363077](https://chromium-review.googlesource.com/c/crosvm/crosvm/+/6363077) post-merge comment |
| 2025-03-19 | riscv64 presubmit (CQ required) re-enabled after 10+ stable postsubmit runs | [commit 0e1264a4](https://github.com/google/crosvm/commit/0e1264a4) |
| 2025-04-15 | FDT correctness fix: interrupt-map-mask had excess cells (same bug in aarch64) | [commit e1ebf3d7](https://github.com/google/crosvm/commit/e1ebf3d7) |
| 2025-11-14 | Rust 1.88 clippy compatibility fix for riscv64 FDT and lib source files | [commit 0f1a11bf](https://github.com/google/crosvm/commit/0f1a11bf) |

The port is fully upstream in the main branch. There is no separate riscv64 fork or out-of-tree patch set. The `riscv64/` directory is structured identically to `x86_64/` and `aarch64/` directories, constituting a first-class architecture crate in the workspace.

The re-enable commit message for Gerrit 6363077 credits Dylan Reid at `dgreid@rivosinc.com`, confirming ongoing Rivos Inc. involvement even after the initial port.

---

## 3. Upstream Support Tier

crosvm has no published tier policy document. The `docs/book/src/contributing/style_guide_platform_specific_code.md` discusses code organization but uses only Linux/Android vs. Windows as examples; it makes no reference to CPU architecture tiers.

In practice, riscv64 occupies a de facto lower tier than x86_64 and aarch64:

| Criterion | amd64 (x86_64) | arm64 (aarch64) | riscv64 |
|---|---|---|---|
| Architecture crate LOC (`lib.rs`) | 3017 | 1808 | 587 |
| CI type | Presubmit (CQ required) + postsubmit | Presubmit (CQ required) + postsubmit | Presubmit (CQ required) + postsubmit |
| Native hardware runner | No (QEMU VM) | No (QEMU VM) | No (QEMU user-space emulation only) |
| Integration test VM | Yes (`qemu-system-x86_64`) | Yes (`qemu-system-aarch64`) | No |
| Official binaries | None | None | None |
| Protected VM support | Yes | Yes | No (`ProtectedVmUnsupported`) |
| GDB stub | Implemented | Implemented | All 9 methods `unimplemented!()` |
| VCPU snapshot/restore | Implemented | Implemented | `Err("not yet implemented")` |
| Seccomp policies | 48 files | 35 files | 17 files |
| CI gap (build-only period) | None | None | 16 months (Nov 2023 - Mar 2025) |

The critical structural difference is that riscv64 tests run via `qemu-riscv64` (user-space emulation) whereas x86_64 and aarch64 use full QEMU system VMs with KVM acceleration. This means riscv64 integration tests that require a running guest do not execute in CI.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

crosvm is a VMM: its architecture-specific code handles memory layout, vCPU initialization, device tree generation, interrupt controller configuration, and the KVM ioctl interface. There is no JIT compiler, no garbage collector, and no cryptographic library within crosvm itself.

**Memory layout (riscv64):** Physical DRAM at `0x8000_0000`, kernel offset 8 MB. Guest physical address bits hardcoded to 48 (sv48 paging). No sv39/sv57 selection mechanism.

**vCPU initialization:** Standard RISC-V Linux boot convention. Hart ID in A0, FDT address in A1, PC set to kernel load address.

**Interrupt controller:** AIA (Advanced Interrupt Architecture) - IMSIC (per-hart MSI controllers at `0x0800_0000 + hart * 0x1000`) and APLIC (MSI-only mode, zero wired interrupt sources). Hardware-accelerated via `KVM_DEV_TYPE_RISCV_AIA`. Supports up to 2047 interrupt IDs (`IMSIC_MAX_INT_IDS`). Only `AIA_MODE_HWACCEL` and `AIA_MODE_AUTO` are supported.

**ISA extensions advertised to the guest** (via FDT `riscv,isa` string): `rv64iafdcsu_smaia_ssaia`. The Vector extension (V) is not in the FDT ISA string and crosvm does not call `KVM_REG_RISCV_VECTOR` despite the KVM bindings containing the full `__riscv_v_ext_state` definition.

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| SIMD dispatch / intrinsics | AVX/AVX2/AVX-512 paths (where applicable) | NEON paths (where applicable) | None - no RVV, no Zb extensions, no SIMD anywhere in riscv64 source |
| Assembly files | Present (e.g., context switch, syscall stubs) | Present | None - all pure Rust |
| JIT code generation | N/A (crosvm is a VMM, not a JIT engine) | N/A | N/A |
| Crypto acceleration | N/A | N/A | N/A |
| Interrupt controller | x2APIC / split IRQCHIP | GIC-v2/v3 | AIA (APLIC + IMSIC), implemented |
| Paging mode | 4-level/5-level | 48-bit VA | sv48 hardcoded |
| Protected VM | Yes (pKVM) | Yes (pKVM) | No |
| GDB remote debug | Implemented | Implemented | Stub only (`unimplemented!()`) |
| vCPU state save/restore | Implemented | Implemented | `Err("not yet implemented")` |
| FP/Vector vCPU save/restore | Implemented | Implemented | Not implemented (bindings present, not called) |
| Hotplug PCI | Implemented | Implemented | `Err(Unsupported)` with "not verified" comment |

The KVM bindings (`kvm_sys/src/riscv64/bindings.rs`, 1866 lines) include `KVM_REG_RISCV_VECTOR`, `__riscv_v_ext_state` (with vstart, vl, vtype, vcsr, vlenb, datap), and F/D/Q FP extension state structs. None of these are called from the Rust implementation layers above. Live migration of a riscv64 guest requires VCPU state save/restore; this is not implemented.

---

## 5. Build System, Cross-Compilation, and Toolchain

crosvm uses Cargo exclusively. There are no CMakeLists.txt, Makefile, or cmake toolchain files.

**Rust target triple:** `riscv64gc-unknown-linux-gnu`

**Pinned toolchain** (`rust-toolchain` file):
```toml
[toolchain]
channel = "1.88.0"
components = [ "rustfmt", "clippy", "llvm-tools-preview" ]
```

**Cross-compilation linker and runner** (`.cargo/config.debian.toml`):
```toml
[target.riscv64gc-unknown-linux-gnu]
linker = "riscv64-linux-gnu-gcc"
runner = "qemu-riscv64"
```

`pkg-config` has no riscv64 wrapper; paths are set manually via environment variables in the Cargo config.

**Required Debian packages** (from `tools/deps/install-riscv64-debs`):
```
binutils-riscv64-linux-gnu
g++-riscv64-linux-gnu
libcap-dev:riscv64
libwayland-dev:riscv64
qemu-user-static
```

Requires `dpkg --add-architecture riscv64` and the Debian Ports repository, because riscv64 is not in the standard Debian archive.

**Build commands:**
```bash
cargo build --target riscv64gc-unknown-linux-gnu
cargo build --target riscv64gc-unknown-linux-gnu --features all-riscv64
```

The `all-riscv64` feature set is minimal compared to `all-x86_64`:
```toml
all-riscv64 = ["gdb", "default"]
```
No audio, GPU, kvm_sys, or display features are included.

**Test execution:**
```bash
./tools/run_tests --platform=riscv64
```
Unit tests run via `qemu-riscv64` (user-space emulation). There is no `qemu-system-riscv64` VM configured for integration tests; `tools/presubmit` comments explicitly state "Allow running riscv unit tests only."

**Official dev container:** `gcr.io/crosvm-infra/crosvm_dev`. All riscv64 cross-compilation tooling is pre-installed in the unified container (not a separate riscv64-specific image).

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 | Gap severity |
|---|---|---|---|---|
| Boot Linux guest | Yes | Yes | Yes | None |
| virtio-blk | Yes | Yes | Yes | None |
| virtio-net | Yes | Yes | Yes | None |
| virtio-fs | Yes | Yes | Yes | None |
| virtio-balloon | Yes | Yes | Yes | None |
| PCI MMIO bus | Yes | Yes | Yes (fixed base) | Minor - base not configurable (`PciMemNotConfigurable`) |
| Serial console | Yes | Yes | Yes (IRQ wiring incomplete - TODO in source) | Minor |
| AIA/GIC interrupt controller | N/A | GICv2/v3 | AIA (APLIC+IMSIC) | None (different arch requirement) |
| Protected VM (pKVM/CVM) | Yes | Yes | No | Blocking for confidential compute |
| GDB remote debug | Yes | Yes | No (all `unimplemented!()`) | Blocks kernel debug workflows |
| vCPU snapshot/restore | Yes | Yes | No (`Err("not yet implemented")`) | Blocks live migration, save/restore |
| IrqChip snapshot/restore | Yes | Yes | No (`anyhow::bail!` stub) | Same as above |
| Hotplug PCI | Yes | Yes | No (`Err(Unsupported)`) | Blocks dynamic device attachment |
| GPU / virtio-gpu | Yes | Yes | No (libvda, libva, ffmpeg excluded from build) | Blocks GPU passthrough workloads |
| VA-API video decode | Yes | Yes | No (libva excluded) | Blocks hardware video decode |
| vhost-user | Yes | Yes | No (vmm_vhost excluded) | Blocks vhost-user network/storage backends |
| XHCI / USB | Yes | Yes | No seccomp policy | Likely broken in sandboxed mode |
| Wayland display | Yes | Yes | No seccomp policy | Blocks display forwarding |
| Audio (CRAS/AAUDIO/VIOS) | Yes | Yes | No seccomp policy | Blocks audio |
| SCSI | Yes | Yes | No seccomp policy | Blocks SCSI disks |
| FP/Vector vCPU state save | Yes | Yes | No (bindings present, not called) | Blocks migration; correctness risk if RVV guests run |
| pvclock | Yes | Yes | No (excluded crate, no policy) | Blocks precision timekeeping |
| io_uring sandboxing | Yes | Yes | Yes (policy includes io_uring syscalls) | None |
| vfio_platform | No | Yes | Yes (Jan 2026 commit 03e3e09e) | None |
| Hypercall infrastructure | Yes | Yes | Yes (Dec 2025 commit db6ce534) | None |

**Security hardening:** The seccomp policy gap (17 policies vs. 35 for aarch64, 48 for x86_64) means devices that have policies on other architectures will fail to function in riscv64 sandboxed mode. Absent policies are not a build failure; they cause runtime failure when crosvm attempts to launch the device process with seccomp enabled.

**Performance gaps:** No SIMD dispatch or assembly paths exist anywhere in riscv64-specific code. For a VMM this is less significant than for a compute library, since the hot path is in the kernel KVM module, not in the VMM process itself.

---

## 7. CI/CD Infrastructure

CI uses Google's LUCI/BuildBucket system exclusively. There is no GitHub Actions CI. The `.github/` directory contains only a stale-PR closer and a PR template.

Two LUCI builders for riscv64 are defined in `infra/config/generated/cr-buildbucket.cfg`:

- **`ci/linux_riscv64`** (postsubmit): triggers on every commit to `refs/heads/main` of `chromium.googlesource.com/crosvm/crosvm`
- **`try/linux_riscv64`** (presubmit/CQ): listed as a required verifier in `infra/config/generated/commit-queue.cfg`; every proposed change must pass before landing

Both builders run on `x86-64` Ubuntu bots (cross-compilation; no native riscv64 hardware). The `test_arch: "riscv64"` property is passed to the `build_linux` recipe.

**What the riscv64 builder executes** (from `tools/impl/test_config.py` and `tools/presubmit`):
- `clippy_riscv64`: clippy with `--platform riscv64 --no-default-features`
- `crosvm_build_default_riscv64`: build with default features, no test execution
- `crosvm_build_no_default_riscv64`: build with no features
- `crosvm_tests_riscv64`: `./tools/run_tests --verbose --platform riscv64` via `qemu-riscv64` user-space emulation

No QEMU system VM (`--dut=vm`) is configured for riscv64. Integration tests do not run in CI.

No RISE runners are used for crosvm. RISE runner infrastructure was not referenced in any crosvm CI configuration. [NEEDS VERIFICATION: whether RISE LUCI runners are available to crosvm at all.]

| Criterion | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Presubmit CI (CQ required) | Yes | Yes | Yes (re-enabled 2025-03-19) |
| Postsubmit CI | Yes | Yes | Yes (re-enabled 2025-03-17) |
| Hardware runner | No (QEMU VM) | No (QEMU VM) | No (QEMU user-space only) |
| Integration tests in CI | Yes | Yes | No |
| Unit tests in CI | Yes | Yes | Yes |
| CI gap | None | None | 16 months (2023-11-08 to 2025-03-17) |
| CI system | LUCI | LUCI | LUCI |
| GitHub Actions | No | No | No |

---

## 8. Distribution and Release Status

crosvm publishes zero GitHub releases. The `gh api repos/google/crosvm/releases` endpoint returns an empty array. No binary artifacts of any kind are distributed upstream.

**Distribution package status:**

| Channel | riscv64 Status | Notes |
|---|---|---|
| GitHub Releases | Not available | No releases at all for any architecture |
| Debian | Not packaged | `tracker.debian.org/pkg/crosvm` returns 404 |
| Ubuntu | Not packaged | `packages.ubuntu.com` search returns no results |
| Arch Linux RISC-V | Not found | `archriscv.felixc.at` search and directory listing returned empty |
| nixpkgs | Declared, unverified | `meta.platforms` includes `"riscv64-linux"` in `package.nix`; Hydra riscv64 build status not confirmed; Repology build log links show only x86_64-linux and aarch64-linux |
| PyPI | Not applicable | crosvm is not a Python package |
| AUR | Source-only | AUR `crosvm-git` builds from source on host architecture; not riscv64-specific |

To obtain a riscv64 binary, a user must build from source using the dev container or manually install the Debian cross-compilation toolchain and Rust target, then run `cargo build --target riscv64gc-unknown-linux-gnu`. No distribution ships a pre-built riscv64 crosvm binary through a confirmed, tested channel.

---

## 9. Dependencies

| Dependency | Role | riscv64 Build | riscv64 Test | riscv64 Release | Notes |
|---|---|---|---|---|---|
| Linux KVM | Hypervisor backend for all VM/VCPU operations | Supported since Linux 5.9; AIA in 6.4 (2023) | QEMU emulation in CI | Mainline kernel, all distros | VCPU snapshot/restore unimplemented; protected VM not supported |
| minijail (google/minijail) | Seccomp-BPF sandbox enforcement per device process | Full (`AUDIT_ARCH_RISCV64` defined) | Part of crosvm CI | Ships in ChromeOS and Linux distros | No blocking issues |
| libseccomp | Seccomp filter backend for minijail | Full since v2.5.0 (July 2020) | Full test suite passes on real RISC-V hardware (5,229 tests, 0 failures) | v2.5.0+ in all distros | No riscv64 blockers. See [project-reports/libseccomp.md](/usr2/luhenry/git/sw-ecosystem/project-reports/libseccomp.md) |
| gdbstub + gdbstub_arch (daniel5151/gdbstub) | GDB remote debug stub for guest kernel | riscv64 arch implemented (`Riscv64`, `Rv64i` types in `gdbstub_arch/src/riscv/`) | No dedicated riscv64 CI upstream | Published on crates.io | GDB feature not functional in crosvm on riscv64 (all `GdbOps` methods are `unimplemented!()`); upstream open: #29 missing RegId impls, #148 LLDB target.xml compat |
| scudo (LLVM compiler-rt) | Optional memory allocator (`scudo` feature) | `SCUDO_RISCV64 1` defined; 39-bit VMA config present | LLVM CI includes riscv64 compiler-rt | Ships with LLVM/Clang | No blocking issues |
| zstd (via gyscos/zstd-rs, optional `zstd-disk`) | Compressed disk image support | Builds on riscv64; RVV vectorization merged (PRs #4399, #4435, #4502); 64-bit detection fix (#4525) | QEMU-based RVV CI (vlen=128/256/512) merged in PR #4435 | Ships in distros | 5 open riscv64 optimization PRs stalled (performance only, not build blockers). See [project-reports/zstd.md](/usr2/luhenry/git/sw-ecosystem/project-reports/zstd.md) |
| protobuf (optional `composite-disk`/`registered_events`) | Composite disk format, registered events | Rust crate v3.x builds (arch-agnostic) | No upstream riscv64 CI | No riscv64 `protoc` binary on Maven/PyPI | Upstream maintainers explicitly stated riscv64 not on roadmap (issues #17798, PR #12244 closed). Runtime Rust crate is fine. See [project-reports/protocol-buffers.md](/usr2/luhenry/git/sw-ecosystem/project-reports/protocol-buffers.md) |
| rutabaga_gfx (published from crosvm tree, optional `gpu`) | GPU/virtio-gpu abstraction over virglrenderer/gfxstream | No riscv64-specific code (pure Rust abstraction); C lib deps unconfirmed | Not tested on riscv64 | No riscv64 artifact | virglrenderer and gfxstream are C libs with no known riscv64 CI; GPU feature is effectively untested on riscv64 |
| FFmpeg (optional `media`, excluded from riscv64 CI build) | Hardware video encode/decode | In the upstream FFmpeg project: full builds, RVV-accelerated codecs landed | No upstream QEMU CI for riscv64 (patch submitted March 2026, unmerged at time of research) | Ships in distros | Excluded from crosvm's `DO_NOT_BUILD_RISCV64` list, meaning it does not build in crosvm's riscv64 CI at all. See [project-reports/ffmpeg.md](/usr2/luhenry/git/sw-ecosystem/project-reports/ffmpeg.md) |
| libc (Rust crate) | FFI bindings to Linux syscalls | Full riscv64 support | Tested in libc CI | crates.io | None |
| p9 | virtio-9P filesystem passthrough | Pure Rust, arch-agnostic | Not specifically tested | crates.io | None |
| GDB (system tool, integration tests) | Guest kernel debug sessions | Fully upstream; riscv64 gdbserver since 2020 | Tested in upstream GDB CI | Ships in all distros | No blocking issues. See [project-reports/gdb.md](/usr2/luhenry/git/sw-ecosystem/project-reports/gdb.md) |

**Critical dependency gap:** The exclusion of `vmm_vhost` and `ffmpeg` from `DO_NOT_BUILD_RISCV64` means those features do not compile in the riscv64 build. `vmm_vhost` is required for vhost-user backends (high-performance virtio for production environments). `ffmpeg` blocks hardware video decode. These are not build failures in CI; they are architectural feature omissions from the riscv64 build.

---

## 11. Known Bugs and Active Issues

GitHub issues are disabled for this project. The internal Google Buganizer is not publicly accessible. Known issues are derived from source code analysis and commit messages.

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| b:304875018 | riscv64 CI builder stability | Resolved (2025-03-17) | High | Builder was disabled for 16 months due to unstable Debian riscv64 cross-compilation containers; re-enabled after container infrastructure stabilized |
| b:410929974 | interrupt-map-mask has excess cells in FDT | Fixed (2025-04-21) | Medium | FDT had N device copies of the mask instead of one; Linux silently ignored extra cells but non-Linux DT consumers could misinterpret; affected both aarch64 and riscv64 |
| b:455879436 | Rust 1.88 clippy errors in riscv64 source | Fixed (2025-11-17) | Low | Format string style changes required by new lint |
| (source) | `get_one_reg` mutating through shared reference (UB) | Fixed (2024-10-01) | Medium | `*const u64` passed to `KVM_GET_ONE_REG` ioctl; compiler could cache the unwritten value; fixed to `*mut u64` with `ioctl_with_mut_ref` |
| (source) | Serial IRQ wiring incomplete | Open | Low | `TODO: the IRQ numbers are bogus since the events aren't actually wired up` in `riscv64/src/lib.rs` line 249 |
| (source) | vCPU snapshot/restore not implemented | Open | High | `Err(anyhow!("not yet implemented"))` in `VcpuRiscv64::snapshot()` and `restore()` - blocks live migration |
| (source) | IrqChip snapshot/restore not implemented | Open | High | `anyhow::bail!("snapshot not yet implemented for riscv64")` in `IrqChipRiscv64` - same blocker |
| (source) | GDB stub entirely unimplemented | Open | Medium | All 9 `GdbOps` methods call `unimplemented!()` - blocks guest kernel debugging |
| (source) | FP and Vector vCPU state not saved or restored | Open | Medium | KVM bindings expose `KVM_REG_RISCV_VECTOR` and `__riscv_v_ext_state`; crosvm never calls them; correctness risk if guests use RVV or FP |
| (source) | Protected VM not supported | Open | High for CVM use cases | `ProtectedVmUnsupported` returned unconditionally |

**Correctness risk: FP/Vector vCPU state.** The KVM bindings include `KVM_REG_RISCV_VECTOR` with `RISCV_MAX_VLENB = 8192` and the full `__riscv_v_ext_state` struct. crosvm does not call any of these register save/restore paths. If a guest uses floating-point or vector instructions (any standard Linux guest does use FP), and crosvm is used for snapshot/restore or live migration, the saved state will be incomplete, producing incorrect guest behavior on restore. On aarch64 and x86_64, full FP/SIMD register state is saved. This is not currently reachable because snapshot/restore itself is not implemented on riscv64, but it is a pre-existing gap that will need to be filled when snapshot/restore is implemented.

---

## 12. Objections and Upstream Blockers

**Organizational:** All maintainers are Google employees. External contribution requires Google CLA and Gerrit review. There is no stated policy blocking riscv64 work; the architecture exists in the codebase and is actively maintained. No objections to riscv64 work were found in public commit messages or review discussions.

**Technical blockers for production use:**
1. No integration tests run on riscv64. The `qemu-riscv64` user-space emulator does not run the full VM stack. Device emulation, MMIO, and interrupt delivery cannot be tested in CI as structured today.
2. No native or full-system QEMU riscv64 runner exists in the LUCI pool. Adding one requires coordination with Google infrastructure teams.
3. Protected VM support is absent; any use case requiring pKVM or confidential computing is blocked.
4. Live migration (snapshot/restore) is not implemented; production environments that require VM portability cannot use crosvm on riscv64.
5. vhost-user backends (`vmm_vhost`) are excluded from the riscv64 build. High-performance networking and storage (DPDK, SPDK-backed virtio) require vhost-user.

**External: Debian Ports instability.** The 16-month CI outage was caused by unstable Debian riscv64 cross-compilation container infrastructure. This was resolved by March 2025, but any future Debian riscv64 port instability will cause a similar outage since the builder is cross-compilation only.

---

## 13. Investment Analysis

RISE has no tracked investment in crosvm. All work described below is available for external contribution.

### 13.1 Functional Enablement

- **VCPU snapshot/restore:** Implement `VcpuRiscv64::snapshot()` and `restore()` in `hypervisor/src/riscv64.rs`, including FP (`KVM_REG_RISCV_FP_F`/`KVM_REG_RISCV_FP_D`) and Vector (`KVM_REG_RISCV_VECTOR`) register state save/restore using `KVM_GET_ONE_REG`/`KVM_SET_ONE_REG`. Same for `IrqChipRiscv64`. This is the prerequisite for live migration.
- **GDB stub:** Implement the 9 `GdbOps` methods in `riscv64/src/lib.rs` (register read/write, memory read/write, single-step, hardware breakpoints). The gdbstub_arch crate already provides the riscv64 register definitions; this is wiring work in the crosvm layer.
- **vmm_vhost enablement:** Identify and resolve the dependency issue that causes `vmm_vhost` to be excluded from `DO_NOT_BUILD_RISCV64`. This unlocks vhost-user backends.
- **Serial IRQ wiring:** Fix the TODO in `riscv64/src/lib.rs` line 249 where serial IRQ numbers are noted as non-functional.
- **Seccomp policy expansion:** Add the 18 missing policy files (XHCI, SCSI, Wayland, audio, vhost-user, GPU, video, coiommu, pvclock, swap monitor) to `jail/seccomp/riscv64/`. Each requires identifying the correct riscv64 syscall numbers for the device's access pattern.

### 13.2 Performance Optimization

No SIMD or assembly opportunities exist in crosvm itself, as it is a VMM and the hot path is in the kernel. Performance investment should go to the guest-visible components (KVM, virtio driver performance in the guest kernel) rather than the VMM process.

### 13.3 CI/CD Infrastructure

- **QEMU system VM for riscv64:** Add a `qemu-system-riscv64` VM runner to `tools/testvm.py` (matching the x86_64 and aarch64 pattern). This enables `--dut=vm` integration tests in CI. Requires a riscv64 QEMU disk image and LUCI bot configuration changes.
- **Native runner:** Acquire or request riscv64 hardware in the LUCI pool. This removes cross-compilation overhead and enables the full test matrix. Requires coordination with Google infra.

### 13.4 Ecosystem Enablement

crosvm has no dependent package ecosystem. Section 10 is omitted.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | VCPU FP + Vector register snapshot/restore | 4 | Chip company / Rivos | Critical |
| Functional | IrqChip snapshot/restore | 2 | Chip company / Rivos | Critical |
| Functional | GDB stub implementation | 3 | Chip company | High |
| Functional | vmm_vhost build enablement | 2 | Chip company | High |
| Functional | Seccomp policy expansion (18 missing policies) | 3 | Chip company | High |
| Functional | Serial IRQ wiring fix | 1 | Chip company | Medium |
| CI/CD | QEMU system VM runner for riscv64 integration tests | 4 | Chip company + Google infra | High |
| CI/CD | Native riscv64 LUCI runner (hardware acquisition + provisioning) | 6 | Chip company + Google infra | Medium |
| Performance | N/A (VMM hot path is in kernel, not VMM process) | 0 | - | Low |

---

## 14. Updates

No updates yet - initial report dated 2026-06-17.

---

## 15. References

- [crosvm GitHub mirror](https://github.com/google/crosvm)
- [crosvm Chromium Gerrit](https://chromium-review.googlesource.com/c/crosvm/crosvm/)
- [crosvm homepage](https://google.github.io/crosvm/)
- [Commit: initial riscv64 crate (2021-11-02)](https://github.com/google/crosvm/commit/f30889ca)
- [Commit: initial KVM bindings (2022-05-17)](https://github.com/google/crosvm/commit/94f82931)
- [Commit: riscv64 postsubmit CI added (2023-05-04)](https://github.com/google/crosvm/commit/63ae7f76)
- [Commit: riscv64 presubmit CI added (2023-08-01)](https://github.com/google/crosvm/commit/35828a10)
- [Commit: CI disabled (2023-11-08)](https://github.com/google/crosvm/commit/594c3a07)
- [Gerrit: CI re-enabled (2025-03-17)](https://chromium-review.googlesource.com/c/crosvm/crosvm/+/6363077)
- [Commit: CI re-enabled (2025-03-17)](https://github.com/google/crosvm/commit/1882d385)
- [Commit: riscv64 presubmit re-enabled (2025-03-19)](https://github.com/google/crosvm/commit/0e1264a4)
- [Gerrit: get_one_reg UB fix (2024-09-26)](https://chromium-review.googlesource.com/c/crosvm/crosvm/+/5893919)
- [Commit: get_one_reg UB fix](https://github.com/google/crosvm/commit/2a96ff0f)
- [Gerrit: interrupt-map-mask FDT fix (2025-04-15)](https://chromium-review.googlesource.com/c/crosvm/crosvm/+/6460473)
- [Commit: interrupt-map-mask FDT fix](https://github.com/google/crosvm/commit/e1ebf3d7)
- [Gerrit: Rust 1.88 clippy fix (2025-11-14)](https://chromium-review.googlesource.com/c/crosvm/crosvm/+/7159248)
- [Commit: Rust 1.88 clippy fix](https://github.com/google/crosvm/commit/0f1a11bf)
- [nixpkgs crosvm package.nix](https://github.com/NixOS/nixpkgs/blob/master/pkgs/by-name/cr/crosvm/package.nix)
- [RISE Project members](https://riseproject.dev/members/)
- [Repology: crosvm packages](https://repology.org/project/crosvm/packages)
- [gdbstub crate](https://github.com/daniel5151/gdbstub)