---
title: QEMU
categories:
  - runtimes
  - iaas
---

# QEMU

**Author:** Ludovic HENRY `<ludovic.henry@qti.qualcomm.com>`
**Date:** 2026-06-17
**Scope:** RISC-V (riscv64/linux) support status for QEMU
**Audience:** Technical leadership, resource allocation strategy
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].

---

## 1. Project Overview

QEMU is a machine emulator and virtualizer supporting full system emulation (softmmu) and user-mode process emulation (linux-user). It is the de facto standard open-source emulator used for cross-architecture CI, OS bootstrapping, and embedded hardware prototyping. Development is hosted at [gitlab.com/qemu-project/qemu](https://gitlab.com/qemu-project/qemu); the GitHub repository at [github.com/qemu/qemu](https://github.com/qemu/qemu) is a read-only mirror with PRs and issues disabled.

**Governance.** QEMU is a project of [Software Freedom Conservancy](https://sfconservancy.org/) (nonprofit fiscal sponsor). There is no steering committee or formal approval board. Decisions are made via the qemu-devel mailing list using a patch-based workflow. The project lead is Peter Maydell (Linaro). The MAINTAINERS file assigns per-subsystem ownership with four tiers: Supported (paid), Maintained (volunteer), Odd Fixes, and Orphan/Obsolete.

**Corporate involvement.** Active corporate contributors on record in MAINTAINERS include Linaro (Peter Maydell, Alex Bennee), Red Hat (Michael S. Tsirkin, Markus Armbruster, Daniel Berrange), Google (Palmer Dabbelt on RISC-V), Western Digital (Alistair Francis on RISC-V), Qualcomm OSS (Daniel Henrique Barboza on RISC-V), Alibaba (Liu Zhiwei on RISC-V, XThead extensions), and VRULL (Christoph Muellner, Philipp Tomsich on XThead and XVentana vendor extensions). CI infrastructure is sponsored by AWS, DigitalOcean, Equinix, and IBM LinuxONE per the QEMU documentation.

**Community stance on new ports.** QEMU accepts new architecture ports through standard mailing list review with no formal gatekeeping beyond requiring a named maintainer in MAINTAINERS and GPG-signed pull requests. The acceptance of multiple vendor extensions (XThead, XVentana, XMips) demonstrates openness to RISC-V-specific additions when a named maintainer is available.

---

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2018-03-09 | First upstream merge into QEMU (tag `riscv-qemu-upstream-v8.2`, merged by Peter Maydell) | [QEMU git log](https://gitlab.com/qemu-project/qemu/-/commits/master) |
| 2018-03-02 | MAINTAINERS entry for RISC-V added, listing Michael Clark and Palmer Dabbelt (SiFive), Sagar Karandikar (UC Berkeley), Bastian Koppelmann (Paderborn) | [MAINTAINERS commit 4dc62b15](https://gitlab.com/qemu-project/qemu/-/commit/4dc62b15) |
| 2024-04-23 | QEMU 9.0: Zacas, amocas, RVA22 profiles, Zaamo, Zalrsc, Ztso, SMBIOS support, ACPI (SRAT, SLIT, AIA, PLIC) | [QEMU 9.0 changelog](https://wiki.qemu.org/ChangeLog/9.0) |
| 2024-09-03 | QEMU 9.1: Privileged spec v1.13, Zve32x, Zve64x, Zimop, Zcmop, Zama16b, Zabha, Zawrs, Smcntrpmf | [QEMU 9.1 changelog](https://wiki.qemu.org/ChangeLog/9.1) |
| 2024-12-11 | QEMU 9.2: IOMMU on virt machine, control-flow integrity extensions, Svvptc, OpenTitan Zb*, vector unit-stride/whole-register ld/st performance improvement | [QEMU 9.2 changelog](https://wiki.qemu.org/ChangeLog/9.2) |
| 2025-04-23 | QEMU 10.0: riscv-iommu-sys devices, svukte, ssstateen, smrnmi, smdbltrp/ssdbltrp, supm/sspm, Ascalon and Xiangshan Nanhu CPU models | [QEMU 10.0 changelog](https://wiki.qemu.org/ChangeLog/10.0) |
| 2025-08-26 | QEMU 10.1: Ziccif, Svrsw60t59b, Kunminghu CPU and platform support | [QEMU 10.1 changelog](https://wiki.qemu.org/ChangeLog/10.1) |
| 2025-12-24 | QEMU 10.2: Numerous emulation fixes (no specific ISA extension list published) | [QEMU 10.2 changelog](https://wiki.qemu.org/ChangeLog/10.2) |
| 2026-04-22 | QEMU 11.0: Zilsd, Zclsd, Zalasr, Smpmpmt, CSR register visibility in `info registers` | [QEMU 11.0 changelog](https://wiki.qemu.org/ChangeLog/11.0) |
| 2026-06-16 | Merged: T-Head C908 CPU, K230 board, big-endian RISC-V support, PMA access fault fix, mstatus.FS dirty-on-FP-exception fixes | [qemu/qemu git log June 2026](https://github.com/qemu/qemu/commits/master) |

The RISC-V port originated at SiFive and UC Berkeley (Michael Clark, Palmer Dabbelt) and has been fully upstream since QEMU 2.12 (2018). There are no downstream forks carrying RISC-V-specific patches outside of the Arch RISC-V community overlay (see Section 8).

---

## 3. Upstream Support Tier

**Formal tier.** Per the MAINTAINERS file, the RISC-V TCG target (`target/riscv`) is listed as **Supported** -- meaning a paid person is responsible for it. The XThead extensions are also Supported; XVentana is Maintained (volunteer). The virt machine and sifive_u/e machines are the primary Supported targets.

The Shakti C machine was deprecated in May 2026 (commit `0e466ba`), demonstrating active curation.

**Comparison.**

| Criterion | amd64 | arm64 | riscv64 |
|---|---|---|---|
| MAINTAINERS tier | Supported | Supported | Supported |
| Release-blocking | Yes | Yes | Yes [NEEDS VERIFICATION -- no explicit statement found] |
| Dedicated maintainer | Peter Maydell (Linaro) | Peter Maydell + team | Palmer Dabbelt (Google), Alistair Francis (WDC) |
| Native CI runner | Yes | Yes (custom runner) | No |
| KVM CI job | Yes | Yes | No (proposed patch not merged) |
| Official binaries | Source only | Source only | Source only |
| Downstream packages | Debian, Fedora, Arch | Debian, Fedora, Arch | Debian (patched), Arch overlay (patched) |

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

QEMU's RISC-V implementation spans four major code trees: `target/riscv/` (TCG instruction emulation), `tcg/riscv64/` (JIT backend to generate riscv64 host code), `hw/riscv/` (machine/board models), and `linux-user/riscv/` (user-mode ABI).

### 4.1 TCG Instruction Translation (`target/riscv/`)

52 source files, approximately 1.24 MB. Implements all ratified RISC-V extensions as of QEMU 11.0. The translation engine dispatches via `insn32.decode` (full coverage of RV32I/64I/128I, MAFDQCH, V, Zb*, Zk*, Zvk*, Zicbom/p/z, Zicfiss, Zimop, Zacas, Zalasr, Zawrs, Zicond, Zfbfmin, Zvfbfmin, Zvfbfwma) and `insn16.decode` (C extension, Zcb). The `insn_trans/` subdirectory contains 35 instruction-translator `.c.inc` files, one per extension group. No TODOs or stub functions were found in `translate.c` (1,505 lines) or `vector_helper.c` (5,873 lines, the largest single file at 236 KB). Two minor TODOs in `csr.c` (6,795 lines) affect RV128 restriction checks and do not affect RV64 operation.

Vendor extension coverage: XThead (Ba/Bb/Bs/Cmo/CondMov/FMemIdx/Fmv/Mac/MemIdx/MemPair/Sync, 75 instructions), XVentana (CondOps), XMips (P8700 Cbop/Cmov/Lsp), XLRBR (CRC32).

CPU profiles implemented: rva22u64, rva22s64, rva23u64, rva23s64.

Quality: hand-coded in portable C; no RVV C intrinsics (`vfloat32m1_t`) anywhere in this tree. The vector emulator uses `uint8_t`/`uint64_t` arrays and TCG IR throughout. This is correct and complete, but means the emulator cannot exploit RVV acceleration on a riscv64 host when running inside another QEMU instance or on native hardware.

### 4.2 TCG JIT Backend (`tcg/riscv64/`)

3,147 lines of host-code-generation logic producing native riscv64 machine code from TCG IR.

| Component | Status | Notes |
|---|---|---|
| Core TCG ops | Full | `tcg_out_op` covers all standard IR ops |
| i128 atomic load/store | Missing | `TCG_TARGET_HAS_qemu_ldst_i128 = 0`; x86_64 has this |
| Vector bitwise ops | Partial | `andc_vec`, `orc_vec`, `nand_vec`, `nor_vec` all set to 0 |
| Host CPU feature detection | Present | Detects Zba, Zbb, Zbs, Zicond, Zve64x at runtime via `cpuinfo.h` |
| Zba/Zbb codegen | Present | Uses host Zba/Zbb instructions when available |

The riscv64 TCG backend is at roughly 65-85% of the feature coverage of the x86_64 backend (4,599 lines) and the aarch64 backend (3,592 lines) as measured by the `tcg-target-has.h` feature flags. The missing i128 atomic support is a correctness gap for guests that rely on 128-bit compare-and-swap on multi-core emulation.

### 4.3 KVM Backend (`target/riscv/kvm/`)

3 files, 2,231 lines total. Functional for basic KVM guest execution: 65+ ISA extensions synced via `KVM_GET/SET_ONE_REG`, AIA interrupt controller, vector register sync with dynamic VLENB, SBI exit handling.

**Known stubs (functional TODOs in `kvm-cpu.c`):**
- `kvm_arch_insert_hw_breakpoint()` returns `-EINVAL`
- `kvm_arch_remove_hw_breakpoint()` returns `-EINVAL`
- `kvm_arch_remove_all_hw_breakpoints()` is an empty function

Hardware watchpoint and breakpoint support via KVM is completely absent. The x86_64 KVM backend has 20 files / 391 KB with TDX support, Xen emulation, and HyperV stubs; the RISC-V KVM backend has no equivalent advanced virtualization features.

**Comparison: JIT and virtualization backends.**

| Backend | amd64 | arm64 | riscv64 |
|---|---|---|---|
| TCG JIT backend | Full (4,599 lines) | Full (3,592 lines) | Partial (3,147 lines, missing i128/some vec ops) |
| KVM support | Full + TDX + HyperV | Full | Partial (no hw breakpoints, no advanced virt) |
| Host SIMD acceleration | AVX2/SSE4 used | NEON used | Not used (no RVV intrinsics) |
| Vector bitwise ops in TCG | Full | Full | Incomplete (4 ops missing) |

### 4.4 Machine Models (`hw/riscv/`)

28 files, 486 KB. Production-quality for primary targets. Boards: virt (generic, 72 KB, supports PCI, virtio, AIA, IOMMU, ACPI), sifive_u (HiFive Unleashed, 39 KB), microchip_pfsoc (PolarFire SoC, 33 KB), k230 (Kendryte K230, added June 2026, 21 KB), spike (reference, 11 KB), opentitan (OpenTitan, 15 KB), xiangshan_kmh (XiangShan Kunminghu, 8 KB). The RISC-V IOMMU implementation in `riscv-iommu.c` is 97 KB and is spec-compliant with active development (23 open conformance bugs as of 2026-06-26, none of which block basic operation).

ARM has 124 files / 2.13 MB of board coverage. RISC-V is thin by comparison, covering development-relevant targets only.

### 4.5 Disassembler (`disas/riscv.c`)

2,000+ lines. Full coverage of base ISA, V, Zb*, Zk*, Zvk*, Zicfiss, CMO, Zimop, Zcmop, Zawrs, BF16, Zacas, plus separate files for XThead, XVentana, and XLRBR vendor extensions. Three open correctness bugs in Capstone (used as an alternate disassembler) affect riscv64 instruction decoding in the `disas` monitor command; see Section 11.

---

## 5. Build System, Cross-Compilation, and Toolchain

**Build system.** QEMU uses Meson with a `./configure` wrapper. All builds must be out-of-tree:

```sh
mkdir build && cd build
../configure [options]
make
```

**Exact configure command for riscv64 cross-compilation** (from the `debian-riscv64-cross` container definition):

```sh
./configure \
  --cross-prefix=riscv64-linux-gnu- \
  --target-list=riscv64-softmmu,riscv64-linux-user \
  --enable-fdt=system
```

Environment variables set in the CI container:
```
ABI=riscv64-linux-gnu
MESON_OPTS=--cross-file=riscv64-linux-gnu
RUST_TARGET=riscv64gc-unknown-linux-gnu
QEMU_CONFIGURE_OPTS=--cross-prefix=riscv64-linux-gnu-
DEF_TARGET_LIST=riscv64-softmmu,riscv64-linux-user
ENABLE_RUST=1
```

**Required toolchain versions** (from `meson.build`):

| Component | Minimum | Reason |
|---|---|---|
| GCC | 10.4 | Required for C11 atomics and `_Static_assert` in TCG IR code |
| Clang | 10.0 (XCode Clang 15.0) | Same |
| Python | 3.9 | configure/venv stage |
| Meson | 1.5.0 (CI pins 1.8.1 via pip) | Feature-detection API stabilized at 1.5 |
| Rust | 1.83.0 | Only with `--enable-rust` |
| glib-2.0 | 2.66.0 | GObject introspection API used in QEMU object model |
| libfdt | 1.5.1 | FDT overlay API |

The cross-compiler is `gcc-riscv64-linux-gnu` from Debian 13 (`debian:13-slim` base image). The container uses `dpkg --add-architecture riscv64` and installs approximately 70 `*-dev:riscv64` packages via `apt-get`.

**GCC 16 note.** GCC >= 16 auto-links `libatomic`; QEMU explicitly disables this with `-fno-link-libatomic`.

**Clang 17 note.** Known SEGV with `-fzero-call-used-regs` (llvm-project issue #75168); not riscv64-specific.

**Known build failures.** GitLab issue [#3483](https://gitlab.com/qemu-project/qemu/-/work_items/3483) ("FTBFS: Building for RISC-V with `--disable-tcg` fails") was open as of 2026-05-08. A 24-patch series by Daniel Henrique Barboza ("target/riscv: move TCG files and fix --disable-tcg", v2 submitted 2026-06-24) is pending merge and directly addresses this. Builds with default options (TCG enabled) are not affected.

The Arch RISC-V overlay carries an `updpatch` for QEMU at 10.1.0-1, confirming that the package requires RISC-V-specific patches to build in that environment. The exact patch set is not documented in the research findings.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 | Gap type |
|---|---|---|---|---|
| System emulation (softmmu) | Full | Full | Full | None |
| User-mode emulation (linux-user) | Full | Full | Full | None |
| KVM guest virtualization | Full | Full | Partial (no hw breakpoints) | Functional |
| TCG JIT to host | Full | Full | Partial (missing i128 atomic, 4 vec bitwise ops) | Functional/Performance |
| Host SIMD acceleration of TCG | AVX2/SSE4 | NEON | None (no RVV) | Performance |
| Hardware debug via KVM | Full | Full | Stub (returns -EINVAL) | Functional |
| Big-endian execution | Full | Full | Added June 2026 | None (gap closed) |
| ACPI support | Full | Full | virt machine only | Minor |
| KVM CI validation | Yes | Yes | No (patch pending) | CI gap |
| Native runner in CI | Yes | Yes | No | CI gap |
| Vector extension emulation (RVV) | N/A | N/A | Full (5,873-line helper) | None |
| Crypto extensions (Zk*, Zvk*) | N/A | N/A | Full | None |
| Hypervisor extension (H) | N/A | N/A | Partial (open bugs #3621, #3622) | Correctness |
| IOMMU emulation | N/A | N/A | Partial (23 open conformance bugs) | Correctness |

**Performance gaps.** The TCG JIT backend generates riscv64 host code without using RVV intrinsics. For compute-heavy workloads running inside a QEMU instance on riscv64 hardware, the TCG generator cannot vectorize operations using the host's vector units. The display path via pixman has no RVV SIMD backend; pixel operations fall back to scalar C. No quantitative speedup data is available from any published source -- the zhanyue191/benchmark GitHub repository runs benchmarks on qemu-riscv64 but result files are not accessible.

**Floating-point and NaN semantics.** No open riscv64-specific NaN issues were found. `csr.c` has a minor TODO for RV128 SXL/MXL handling that does not affect RV64. The mstatus.FS dirty-on-exception bug was fixed in June 2026 (commits `66e4d35` and `055b0d8` for vector and scalar FP respectively).

---

## 7. CI/CD Infrastructure

QEMU's CI is on GitLab ([gitlab.com/qemu-project/qemu](https://gitlab.com/qemu-project/qemu)). The GitHub mirror carries only `.github/workflows/lockdown.yml`, a bot that auto-closes PRs with a redirect to GitLab. There is no riscv64 CI in GitHub Actions.

**Cross-compilation build jobs** (`.gitlab-ci.d/crossbuilds.yml`):

```yaml
cross-riscv64-system:
  extends: .cross_system_build_job
  needs:
    - job: riscv64-debian-cross-container
  variables:
    IMAGE: debian-riscv64-cross

cross-riscv64-user:
  extends: .cross_user_build_job
  needs:
    - job: riscv64-debian-cross-container
  variables:
    IMAGE: debian-riscv64-cross
```

Both jobs cross-compile QEMU for riscv64 on x86 shared runners. The `MAKE_CHECK_ARGS` variable is not set for these jobs, meaning the test step is a no-op. These jobs produce riscv64 binaries but do not execute them or run any test suite.

**Build+test jobs** (`.gitlab-ci.d/buildtest.yml`): Several native x86 jobs include `riscv64-softmmu` or `riscv32-softmmu` as a build target:
- `build-system-debian`: `riscv64-softmmu` target, `check-build` only
- `build-system-fedora`: `riscv32-softmmu` target, `check-build` + `check-doc`
- `build-some-softmmu`: `riscv64-softmmu` with `--enable-debug`, runs `check-tcg` (actual TCG correctness tests)
- `tsan-build`: `riscv64-softmmu` with ThreadSanitizer + Clang
- `crash-test-fedora`: runs `scripts/device-crash-test` against `qemu-system-riscv32`

**OpenSBI firmware build** (`.gitlab-ci.d/opensbi.yml`): Dedicated job builds `opensbi-riscv32-generic-fw_dynamic.bin` and `opensbi-riscv64-generic-fw_dynamic.bin`.

**Custom runners** (`.gitlab-ci.d/custom-runners/`): Contains `ubuntu-24.04-aarch64.yml`, `ubuntu-24.04-s390x.yml`, `debian-13-ppc64le.yml`. No riscv64 file exists. There is no native riscv64 runner.

**Proposed but not merged.** Daniel Henrique Barboza submitted patch `[v2,24/24] gitlab-ci.d/crossbuilds: add riscv64 KVM-only build job` on 2026-06-24 (v1: 2026-06-22). As of 2026-06-26, the patch is in patchwork state "New" and has not been merged. The `cross-riscv64-kvm-only` job does not exist in the committed file.

**RISE runners.** The RISE project announced native RISC-V CI runners (Scaleway EM-RV1 hardware) in March 2026. QEMU is not listed as a RISE-supported project and does not use RISE runners. The RISE announcement explicitly cited QEMU emulation as insufficient for native hardware validation ("emulators like QEMU are invaluable for development, but they can't catch the real-world issues"), positioning the RISE runners as an alternative, not as infrastructure for QEMU itself.

**Comparison.**

| CI dimension | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Build CI | Yes | Yes | Yes (cross-build on x86) |
| Test execution in CI | Yes | Yes | Partial (check-tcg in build-some-softmmu, cross jobs test-free) |
| Native runner | Yes | Yes | No |
| KVM-specific CI job | Yes | Yes | No (patch pending) |
| TSAN CI | Yes | No | Yes (included in tsan-build) |
| RISE runners | No | No | No (QEMU not in RISE) |

---

## 8. Distribution and Release Status

**Official binaries.** The QEMU project distributes source tarballs only via [download.qemu.org](https://download.qemu.org/). The GitHub mirror has no releases. There are no architecture-specific pre-built binaries distributed by the QEMU project for any architecture, including riscv64.

**PyPI.** The `qemu` package on PyPI is a stub at version `0.0.0a1`, distributed as a pure-Python wheel (`py3-none-any`). It contains no compiled binary. This package is unrelated to QEMU emulator binaries.

**Debian.** Version 1:11.0.1+ds-1 is in Debian sid with build status "Installed" on riscv64, built on builder `rv-manda-03`. Two open FTBFS bugs are on record but did not block the current build. The `qemu-efi-riscv64` package (UEFI firmware for RISC-V virtual machines) is an explicit riscv64-targeted package in Ubuntu Noble. This represents QEMU compiled to run on a riscv64 host (emulating other architectures), not a QEMU emulator for riscv64 guests.

**Arch Linux RISC-V.** The community overlay at [archriscv.felixc.at](https://archriscv.felixc.at) carries QEMU at version 10.1.0-1, tagged as `updpatch` (requires RISC-V-specific patches to build). The current upstream version is 11.0.1. The version lag is one full major release. Sub-packages tracked include `qemu-system-riscv`, `qemu-system-riscv-firmware`, `qemu-user`, `qemu-user-static`.

**What a user must do to get a working riscv64 binary.** Build from source on Debian/Ubuntu using the cross-toolchain (`gcc-riscv64-linux-gnu`), or use the Debian `qemu` package on a riscv64 host. There is no pre-built riscv64 QEMU binary available from any official channel.

---

## 9. Dependencies

### 9.1 Summary Table

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Notes |
|---|---|---|---|---|---|
| glib-2.0 (>= 2.66) | Core event loop, object model | Yes | Yes | Debian trixie 2.84.4 | No gaps |
| zlib | Block compression | Yes | Yes | Debian trixie 1.3.1 | No gaps |
| pixman (>= 0.21.8) | Framebuffer pixel ops | Yes (scalar) | Yes | Debian trixie 0.44.0 | No RVV SIMD backend |
| zstd (>= 1.4.0) | Migration/snapshot compression | Yes | Yes | Debian trixie | PR #4622 (RVV HUF decompression, perf only) open |
| capstone (>= 3.0.5) | Disassembler backend | Yes | Yes | Debian trixie 5.0.7 | 3 open correctness bugs |
| gnutls (>= 3.7.5) | VNC/NBD TLS | Yes | Yes | Debian trixie | No riscv64-specific issues found |
| nettle/hogweed (>= 3.7.3) | Crypto primitives (gnutls backend) | Yes | Yes | Debian trixie 3.10.1 | No riscv64-specific issues found |
| liburing (>= 0.3) | io_uring block backend | Yes | Yes | Debian trixie | No gaps; io_uring on riscv64 since Linux 5.1 |
| libseccomp (>= 2.3.0) | Syscall sandbox | Yes | Yes | Debian trixie | riscv64 support since libseccomp 2.4.0 (2019) |
| libslirp | User-mode networking | Yes | Yes | Debian trixie 4.8.0 | Pure C, no arch SIMD |
| libcurl (>= 7.29.0) | CURL block driver | Yes | Yes | Debian trixie | No open riscv64 issues |
| libpng (>= 1.6.34) | VNC screenshots | Yes | Limited | Debian trixie | No RVV backend; no known build issues |
| snappy | Optional block compression | Yes | Yes | Debian trixie | PR #208 merged 2025-07-29 |
| virglrenderer | VirtIO GPU 3D | Yes (build) | No hardware | Debian trixie | No riscv64 GPU hardware for testing |
| spice-server (>= 0.15.0) | SPICE remote display | Yes (build) | No hardware | Debian trixie | Testing is emulator-only |
| libusb-1.0 (>= 1.0.13) | USB passthrough | Yes | Yes | Debian trixie | No known gaps |
| libssh (>= 0.8.7) | SSH block driver | Yes | Yes | Debian trixie | No known gaps |
| OpenSBI | RISC-V firmware (bundled) | Yes | Yes | Built from submodule in CI | Dedicated `build-opensbi` CI job; riscv32 and riscv64 |

### 9.2 Deep-Dive: pixman

pixman provides CPU-accelerated pixel operations for QEMU's VGA framebuffer and VNC display path. The library has SIMD backends for x86 (MMX, SSE2, SSSE3) and ARM (NEON, Helium). There is no RVV backend for riscv64. On a riscv64 host, all display rendering falls back to scalar C. No upstream issue has been filed specifically for adding an RVV backend to pixman. This is a performance gap for interactive QEMU sessions on riscv64 hardware; it does not affect headless server emulation.

### 9.3 Deep-Dive: zstd

zstd is used for live migration compression and block snapshot compression. One open performance PR ([#4622](https://github.com/facebook/zstd/pull/4622), "huf_decompress: enable 4-way fast loop on riscv64") targets improved Huffman decompression performance on riscv64. The unaligned memory access PR (#4524) is closed/merged. Live migration compression will benefit from PR #4622 once merged but the current riscv64 path is functional.

### 9.4 Deep-Dive: capstone

Capstone is used as an optional alternate disassembler backend in QEMU (`disas` monitor command, `qemu-user` instruction tracing). Three open issues affect riscv64:

- [#2887](https://github.com/capstone-engine/capstone/issues/2887): crash when RISC-V support disabled at compile time
- [#2959](https://github.com/capstone-engine/capstone/issues/2959): compressed instruction alias handling
- [#2407](https://github.com/capstone-engine/capstone/issues/2407): incorrect operand data for `ret`

None are build blockers. They affect debug and developer experience when using QEMU's disassembler on riscv64 guests.

---

## 11. Known Bugs and Active Issues

### 11.1 Correctness Bugs (Open)

| ID | Title | Filed | Severity |
|---|---|---|---|
| [#3622](https://gitlab.com/qemu-project/qemu/-/work_items/3622) | SRET in VU-mode raises illegal-instruction instead of virtual-instruction | 2026-06-26 | Hypervisor conformance |
| [#3621](https://gitlab.com/qemu-project/qemu/-/work_items/3621) | Svinval instructions in VU-mode raise illegal-instruction instead of virtual-instruction | 2026-06-26 | Hypervisor conformance |
| [#3578](https://gitlab.com/qemu-project/qemu/-/work_items/3578) | Device MMIO .unaligned restriction not enforced under TCG | 2026-06-18 | Device emulation correctness |
| [#3526](https://gitlab.com/qemu-project/qemu/-/work_items/3526) | amocas with rd=x0 followed by beq involving x0 not taken | 2026-06-02 | Atomics correctness |
| [#3544](https://gitlab.com/qemu-project/qemu/-/work_items/3544) | VLE32FF.V modifies vl when element 0 faults | 2026-06-11 | Vector correctness |
| [#3545](https://gitlab.com/qemu-project/qemu/-/work_items/3545) | TCG plugin crashes qemu-system-riscv64 on vtype register read | 2026-06-11 | Stability |
| [#3519](https://gitlab.com/qemu-project/qemu/-/work_items/3519) | RVV dot product with `__atomic_thread_fence` fails under qemu-riscv64-user | 2026-05-27 | Vector + atomics interaction |
| [#3501](https://gitlab.com/qemu-project/qemu/-/work_items/3501) | Zicbom instructions do not check PMA permissions | 2026-05-16 | Memory model correctness |
| [#3411](https://gitlab.com/qemu-project/qemu/-/work_items/3411) | Writes to minstret CSR silently ignored | 2026-04-20 | CSR correctness |
| [#3432](https://gitlab.com/qemu-project/qemu/-/work_items/3432) | vmv.s.x and vfmv.s.f leave tail elements unchanged with rvv_ta_all_1s=true | 2026-04-23 | Vector tail policy |
| [#1606](https://gitlab.com/qemu-project/qemu/-/work_items/1606) | fence.i is not functional | 2023-04-17 | Long-standing correctness bug |
| [#3483](https://gitlab.com/qemu-project/qemu/-/work_items/3483) | FTBFS: Building with --disable-tcg fails | 2026-05-08 | Build system |

### 11.2 RISC-V IOMMU Conformance Bugs (Open, 23 total)

A systematic conformance testing campaign filed 23 IOMMU bugs between 2026-06-15 and 2026-06-26. Representative examples:

| ID | Title | Filed |
|---|---|---|
| [#3577](https://gitlab.com/qemu-project/qemu/-/work_items/3577) | Read transaction faulting in second stage recorded as write (wrong TTYP) | 2026-06-18 |
| [#3575](https://gitlab.com/qemu-project/qemu/-/work_items/3575) | Command with reserved bit set processed instead of reporting illegal | 2026-06-18 |
| [#3574](https://gitlab.com/qemu-project/qemu/-/work_items/3574) | IOTINVAL.GVMA with AV=1 does not invalidate two-stage IOATC entry | 2026-06-18 |
| [#3573](https://gitlab.com/qemu-project/qemu/-/work_items/3573) | MSI vector mask bit (msi_vec_ctl_x.M) ignored | 2026-06-18 |
| [#3562](https://gitlab.com/qemu-project/qemu/-/work_items/3562) | Fault record for MSI-translation fault has iotval = iotval2 = 0 | 2026-06-17 |
| [#3561](https://gitlab.com/qemu-project/qemu/-/work_items/3561) | MRIF pending-bit doubleword address computed wrong; pending bit never set for index >= 64 | 2026-06-17 |

None of these block basic QEMU use. They affect workloads that depend on the RISC-V IOMMU emulation for PCIe device assignment or security isolation testing. No patches have been submitted for any of the 23 open IOMMU bugs as of 2026-06-26.

### 11.3 Recently Fixed (2026-05 to 2026-06)

| ID | Title | Fixed |
|---|---|---|
| [#3543](https://gitlab.com/qemu-project/qemu/-/work_items/3543) | SFENCE.INVAL.IR in U-mode does not raise illegal-instruction | 2026-06-11 |
| [#3502](https://gitlab.com/qemu-project/qemu/-/work_items/3502) | Page-table walk implicit accesses bypass PMA checks | 2026-05-16 |
| [#3503](https://gitlab.com/qemu-project/qemu/-/work_items/3503) | Misaligned AMOs raise wrong fault type | 2026-05-16 |
| [#3470](https://gitlab.com/qemu-project/qemu/-/work_items/3470) | vxrm csrw preserves upper bits instead of zeroing | 2026-06-16 |
| [#3133-3140](https://gitlab.com/qemu-project/qemu/-/work_items/3133) | Hypervisor extension: incorrect handling of hvip/mip/vsie | 2026-05-24 |
| [#3208](https://gitlab.com/qemu-project/qemu/-/work_items/3208) | Missing overlap detection for vector widening reduction | 2026-05-24 |

---

## 12. Objections and Upstream Blockers

**No organizational objections** to RISC-V in QEMU were found. The RISC-V port has been upstream since 2018 and has two paid maintainers.

**Technical blockers.**

1. `--disable-tcg` build failure ([#3483](https://gitlab.com/qemu-project/qemu/-/work_items/3483)): A 24-patch refactor (Daniel Henrique Barboza, v2 submitted 2026-06-24) is pending. This is the primary active upstream blocker. Until merged, KVM-only builds targeting riscv64 as both host and hypervisor cannot be cleanly built.

2. IOMMU conformance gap: 23 open bugs filed in a single week. No patches are in flight for most of them. For use cases requiring RISC-V IOMMU correctness (PCIe passthrough testing, IOMMU driver development), QEMU is not a reliable reference implementation at present.

3. KVM hardware breakpoints: Three stub functions in `kvm-cpu.c` that return `-EINVAL`. Any toolchain or debugger relying on hardware watchpoints via KVM on a riscv64 host will silently receive errors.

4. VU-mode exception routing ([#3621](https://gitlab.com/qemu-project/qemu/-/work_items/3621), [#3622](https://gitlab.com/qemu-project/qemu/-/work_items/3622)): Hypervisor conformance testing that relies on correct exception cause codes in VU-mode will produce wrong results. Root cause is a missing VU-mode check in privilege-check helper functions; no patch submitted as of 2026-06-26.

**Acceptance probability.** High. Fixes for #3483 and the VU-mode bugs are in active development. The IOMMU bugs are in a subsystem that has an active maintainer (Daniel Henrique Barboza). The KVM breakpoint stubs require kernel-side KVM infrastructure that is not yet widely available on riscv64 hardware, which is why they remain stubs.

---

## 13. Investment Analysis

RISE has no funded work on QEMU. The single RISE mention of QEMU (March 2026 Runners announcement) positions QEMU as a baseline that native hardware CI must replace. The RISE Simulator/Emulator working group lead is Daniel Barboza (Ventana Micro), who is the same person as Daniel Henrique Barboza (Qualcomm OSS) -- an active QEMU RISC-V reviewer and contributor -- but this is individual volunteer work, not a funded RISE deliverable.

### 13.1 Functional Enablement

**Fix VU-mode exception routing** (issues #3621, #3622): The root cause is a one-line reorder in `op_helper.c` and one shared helper function in `insn_trans/trans_svinval.c.inc`. Both are mechanical fixes following an established pattern (the U-mode fix in #3543 was merged 2026-06-11 and sets the precedent). No patch has been submitted; the engineering is straightforward.

**Fix KVM hardware breakpoints**: The three stub functions in `kvm-cpu.c` require coordinated work with the Linux kernel KVM RISC-V implementation. This is a multi-component effort and depends on kernel-side readiness.

**Resolve IOMMU conformance bugs**: 23 open bugs, zero patches in flight for most. The bugs are well-characterized (each has reproduction scripts and root-cause analysis). Patches exist for the FCTL.BE bug (#3576 addressed by DHB 2026-06-25 series). The remaining 22 require individual fixes.

### 13.2 Performance Optimization

**RVV SIMD backend for pixman**: Pixman's scalar fallback on riscv64 affects display throughput for interactive QEMU sessions on riscv64 hardware. A new pixman backend using RVV intrinsics would benefit any QEMU user running graphical VMs on riscv64. No upstream issue exists for this. Effort: medium (pixman has clear SIMD backend structure from NEON and SSE2 implementations).

**TCG JIT RVV codegen for vector ops**: The TCG backend at `tcg/riscv64/tcg-target.c.inc` does not use RVV for the four missing vector bitwise operations (`andc_vec`, `orc_vec`, `nand_vec`, `nor_vec`). Adding these would improve TCG throughput for guests running code that maps to these ops. Effort: low to medium.

**TCG i128 atomic load/store**: `TCG_TARGET_HAS_qemu_ldst_i128 = 0`. Implementing this requires `amocas.q` (Zacas, 128-bit compare-and-swap) on the riscv64 host. Effort: medium; depends on hardware availability.

**zstd RVV HUF decompression** (PR [#4622](https://github.com/facebook/zstd/pull/4622)): This is an upstream zstd PR, not a QEMU-specific issue. Reviewing and helping land it would benefit QEMU's live migration performance on riscv64.

### 13.3 CI/CD Infrastructure

**Native riscv64 CI runner**: Currently absent. All riscv64 testing is cross-compiled on x86. Adding a custom runner (`.gitlab-ci.d/custom-runners/ubuntu-24.04-riscv64.yml`) following the pattern of the existing aarch64 and s390x runners would enable native test execution. This requires hardware (Scaleway EM-RV1 or equivalent) and a GitLab runner registration. The RISE Runners infrastructure could serve this purpose if a QEMU project runner were registered.

**KVM-only CI job**: The patch series (v2, Daniel Henrique Barboza, 2026-06-24) proposing `cross-riscv64-kvm-only` in `crossbuilds.yml` is pending. Reviewing and helping merge this series costs minimal engineering effort and closes a CI gap.

### 13.4 Ecosystem Enablement

Not applicable. QEMU is a standalone tool with no dependent package ecosystem of its own that would require riscv64 enablement.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner candidate | Priority |
|---|---|---|---|---|
| Functional | Fix VU-mode exception routing (#3621, #3622) | 1 | QEMU RISC-V maintainer / any contributor | Critical |
| Functional | Fix --disable-tcg FTBFS (#3483) | 2 (review/test assist) | Daniel Henrique Barboza (patch in flight) | Critical |
| Functional | Resolve IOMMU conformance bugs (22 remaining) | 8-12 | QEMU RISC-V IOMMU maintainer | High |
| Functional | KVM hardware breakpoints (kvm-cpu.c stubs) | 4-6 (QEMU + kernel coordination) | Alistair Francis / KVM maintainer | Medium |
| Performance | RVV SIMD backend for pixman | 6-8 | pixman maintainer + riscv64 contributor | Medium |
| Performance | TCG JIT RVV codegen (4 missing vec ops) | 2-3 | tcg/riscv64 contributor | Low |
| Performance | TCG i128 atomic (amocas.q) | 3-4 | tcg/riscv64 contributor | Low |
| CI/CD | Native riscv64 CI runner registration | 1-2 (infra setup) | QEMU infra team + hardware provider | High |
| CI/CD | Merge KVM-only CI job (DHB patch series) | 1 (review only) | QEMU CI maintainer | High |
| CI/CD | Add test execution to cross-riscv64-* CI jobs | 2 | QEMU CI maintainer | Medium |

---

## 14. Updates

No updates yet -- initial report dated 2026-06-17.

---

## 15. References

- [QEMU GitLab repository](https://gitlab.com/qemu-project/qemu)
- [QEMU GitHub mirror (read-only)](https://github.com/qemu/qemu)
- [QEMU homepage](https://www.qemu.org/)
- [GitLab issues: Target > RISCV label](https://gitlab.com/qemu-project/qemu/-/issues?label_name[]=Target+%3E+RISCV)
- [Patchwork qemu-devel: riscv patches](https://patchwork.kernel.org/project/qemu-devel/list/?q=riscv)
- [Issue #3622: SRET in VU-mode wrong exception](https://gitlab.com/qemu-project/qemu/-/work_items/3622)
- [Issue #3621: Svinval in VU-mode wrong exception](https://gitlab.com/qemu-project/qemu/-/work_items/3621)
- [Issue #3578: MMIO unaligned not enforced under TCG](https://gitlab.com/qemu-project/qemu/-/work_items/3578)
- [Issue #3577: IOMMU read faulting in second stage recorded as write](https://gitlab.com/qemu-project/qemu/-/work_items/3577)
- [Issue #3483: FTBFS with --disable-tcg](https://gitlab.com/qemu-project/qemu/-/work_items/3483)
- [Issue #1606: fence.i not functional](https://gitlab.com/qemu-project/qemu/-/work_items/1606)
- [Patch v2: target/riscv move TCG files and fix --disable-tcg](https://patchwork.kernel.org/project/qemu-devel/list/?q=riscv)
- [Debian buildd riscv64 qemu status](https://buildd.debian.org/status/package.php?p=qemu&suite=sid)
- [Ubuntu Noble qemu packages](https://packages.ubuntu.com/search?suite=noble&keywords=qemu)
- [Arch RISC-V package status](https://archriscv.felixc.at/.status/status.htm)
- [RISE RISC-V Runners announcement](https://riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github/)
- [RISE Yocto blog post mentioning qemuriscv64](https://riseproject.dev/2026/06/05/improving-riscv-support-in-the-yocto-project/)
- [zstd PR #4622: huf_decompress riscv64 4-way loop](https://github.com/facebook/zstd/pull/4622)
- [capstone issue #2407: incorrect operand data for ret](https://github.com/capstone-engine/capstone/issues/2407)
- [capstone issue #2887: crash when RISC-V support disabled](https://github.com/capstone-engine/capstone/issues/2887)
- [QEMU 9.0 changelog](https://wiki.qemu.org/ChangeLog/9.0)
- [QEMU 9.2 changelog](https://wiki.qemu.org/ChangeLog/9.2)
- [QEMU 10.0 changelog](https://wiki.qemu.org/ChangeLog/10.0)
- [QEMU 11.0 changelog](https://wiki.qemu.org/ChangeLog/11.0)