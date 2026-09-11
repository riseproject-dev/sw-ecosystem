---
title: Lima
parent: Project Reports
color: orange
dependencies:
  - name: QEMU
    relation: runtime-dependency
    criticality: critical
  - name: gvisor
    relation: runtime-dependency
    criticality: critical
  - name: cilium/ebpf
    relation: build-dependency
    criticality: optional
---

{% include dependency-graph.html slug="dependencies" subset="lima" %}

# Lima

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-09-08<br/>
**Readiness:** orange<br/>
**Scope:** RISC-V (riscv64/linux) support status for Lima<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

Lima (Linux Machines) is a Go tool that launches Linux virtual machines on macOS, Linux, and Windows hosts, typically for running containerd/nerdctl-based container workloads without Docker Desktop. It uses QEMU (and, on Apple platforms, Apple's `vz`/`krunkit` frameworks) as its VM backend, with a small in-guest "guestagent" binary handling port forwarding and time sync inside the VM.

**Governance:** Lima is a Cloud Native Computing Foundation (CNCF) **Incubating** project, licensed Apache-2.0, following the CNCF Code of Conduct. A two-tier maintainer model (Committer / Reviewer) is documented at lima-vm.io, requiring 2/3 Committer approval for maintainer changes and mandatory DCO sign-off (with explicit AI-contribution disclosure rules).

**Corporate sponsors / maintainer affiliations:** Akihiro Suda (NTT), Jan Dubois (SUSE), Balaji Vijayakumar (Thoughtworks), Nir Soffer (IBM, Reviewer), plus several individual/unaffiliated maintainers (Anders Bjorklund, Norio Nomura, Ansuman Sahoo, Oleksandr Redko). Notable adopters include Rancher Desktop (SUSE), Finch (AWS), Podman Desktop, Intuit (via Rancher Desktop), and the Kubernetes KIND project.

**Community culture on new ports:** No dedicated written policy exists for adding new CPU architectures. The general contribution policy is "talk first, code later" (open an issue, get an approval signal, then submit a PR). Historically, new architecture support (including riscv64) has landed as maintainer-authored "experimental" templates rather than through a formal tier-promotion process. Lima is **not affiliated with the RISE project** - riseproject.dev contains zero mentions of Lima across its blog, member list, or working groups.

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2022-04-28 to 2022-05-06 | [PR #827](https://github.com/lima-vm/lima/pull/827) merged: initial experimental riscv64 support via `qemu-system-riscv64` + u-boot bootloader. First shipped in v0.11.0. | [PR #827](https://github.com/lima-vm/lima/pull/827) |
| 2022-06-26 to 2022-07-19 | [Issue #930](https://github.com/lima-vm/lima/issues/930): riscv64 template pointed to a dead Ubuntu 22.04 image URL; fixed. | [Issue #930](https://github.com/lima-vm/lima/issues/930) |
| 2022-10-28 to 2022-11-02 | [Issue #1135](https://github.com/lima-vm/lima/issues/1135): QEMU 7.1 regression broke riscv64 boot (`ramfb`/`fw_cfg` DMA); fixed by PR #1142. | [Issue #1135](https://github.com/lima-vm/lima/issues/1135) |
| 2023-03-19 | [PR #1425](https://github.com/lima-vm/lima/pull/1425) merged: fixed unit tests that hardcoded aarch64 assumptions, breaking riscv64 test paths. First in v0.15.1. | [PR #1425](https://github.com/lima-vm/lima/pull/1425) |
| 2024-05-03 | [PR #2315](https://github.com/lima-vm/lima/pull/2315) merged: documented riscv64 default `cpuType`. First in v0.22.0. | [PR #2315](https://github.com/lima-vm/lima/pull/2315) |
| 2024-10-02 | [PR #2592](https://github.com/lima-vm/lima/pull/2592) merged: switched riscv64 boot firmware from u-boot to EDK2. First in v1.0.0-beta.0. | [PR #2592](https://github.com/lima-vm/lima/pull/2592) |
| 2024-10-15 | [PR #2730](https://github.com/lima-vm/lima/pull/2730) merged: merged `experimental/riscv64` template into `default` template (still marked experimental). First in v1.0.0-beta.0. | [PR #2730](https://github.com/lima-vm/lima/pull/2730) |
| 2024-10-28 | [PR #2814](https://github.com/lima-vm/lima/pull/2814) merged: fixed incorrect `minimumLimaVersion` on riscv64-enabled templates. First in v1.0.0. | [PR #2814](https://github.com/lima-vm/lima/pull/2814) |
| 2025-04-23 to 2025-05-12 | [PR #3461](https://github.com/lima-vm/lima/pull/3461), [#3464](https://github.com/lima-vm/lima/pull/3464), [#3484](https://github.com/lima-vm/lima/pull/3484), [#3503](https://github.com/lima-vm/lima/pull/3503) merged: added Debian/Fedora riscv64 images, EFI firmware path fixes, CPU type changed to `max` (for RVA23 support), and guest-agent packaging split. First in v1.1.0-rc.0. | [PR #3484](https://github.com/lima-vm/lima/pull/3484) |
| 2026-03-18 | [PR #4753](https://github.com/lima-vm/lima/pull/4753) merged: riscv64 support for almalinux-kitten-10 template. First in v2.1.1. | [PR #4753](https://github.com/lima-vm/lima/pull/4753) |
| 2026-05-18 | [PR #4978](https://github.com/lima-vm/lima/pull/4978) merged: fixed missing image/checksum for Debian 13 riscv64. First in v2.1.2. | [PR #4978](https://github.com/lima-vm/lima/pull/4978) |
| 2026-07-08 | [PR #5201](https://github.com/lima-vm/lima/pull/5201) merged: riscv64 support for fedora-44 template. First in v2.2.0-rc.0. | [PR #5201](https://github.com/lima-vm/lima/pull/5201) |

**Key contributors:** Akihiro Suda (NTT) authored the founding commit and most subsequent riscv64 work; Anders Bjorklund (individual) contributed test fixes and early review; Joel Stanley/shenki (author of the `cpu=max` PR); Norio Nomura (individual) contributed arch-mapping fixes. No single company has funded a dedicated riscv64 port effort; all work appears to be organic maintainer/community contribution.

**Is it fully upstream?** Yes, in the narrow sense that all 13 riscv64 PRs found are merged into `lima-vm/lima` master with no forks or out-of-tree patch sets required. There is no separate riscv64 tracking issue consolidating this work - it is distributed across 13 PRs and 3 closed issues over 2022-2026. Importantly, "upstream" support here means riscv64 is supported as a **guest** architecture emulated via QEMU from an x86_64/arm64/aarch64 **host** - it does not mean Lima itself runs natively on a riscv64 host.

## 3. Upstream Support Tier

No formal, written tiering document exists (no `PLATFORMS.md`/`SUPPORT.md`; a search for `docs/platforms/` found only unrelated image assets). The de facto tiers are stated in [docs/config/multi-arch.md](https://github.com/lima-vm/lima) and [docs/releases/experimental.md](https://github.com/lima-vm/lima):

- **Non-experimental (stable):** x86_64, aarch64
- **Experimental (limited):** armv7l, ppc64le, riscv64, s390x - `containerd.user` is not auto-enabled on these because nerdctl-full is not built for them.

Evidence for the tier assignment:
- **CI:** No riscv64 job exists anywhere in CI (see Section 7). This alone would place riscv64 below tier-1 even absent the explicit "experimental" label.
- **Release-blocking status:** Not applicable - riscv64 is never built or tested, so it cannot block a release.
- **Official binaries:** No riscv64 host binary is published in GitHub Releases (see Section 8).

| Axis | amd64 (x86_64) | arm64 (aarch64) | riscv64 |
|---|---|---|---|
| Documented tier | Non-experimental (stable) | Non-experimental (stable) | Experimental |
| CI build | Yes (native runners: ubuntu-24.04, macos-15-large, windows-2025) | Yes (native macOS arm64 + emulation paths) | No |
| CI test | Yes | Yes | No |
| Official host binary | `lima-*-Linux-x86_64.tar.gz`, `lima-*-Darwin-x86_64.tar.gz`, `lima-*-Windows-AMD64.zip` | `lima-*-Darwin-arm64.tar.gz`, `lima-*-Linux-aarch64.tar.gz`, `lima-*-Windows-ARM64.zip` | None |
| containerd.user default | true | true | false (nerdctl-full not built for riscv64) |
| vz/krunkit driver support | N/A (Apple-only frameworks) | Yes | No (QEMU-only, inherent - no macOS-on-riscv64 host exists) |

Source: [website/content/en/docs/config/multi-arch.md and docs/releases/experimental.md, verified against local clone `/home/user/lima-vm/lima`](https://github.com/lima-vm/lima).

## 4. Technical Architecture and RISC-V-Specific Subsystems

Lima is a Go orchestration tool, not a runtime, compiler, or numerics library. It has **no JIT, no SIMD kernels, no cryptographic primitives, and no GC barriers of its own** - the only architecture-specific concern is (a) generating correct QEMU command-line arguments per guest architecture, and (b) cross-compiling a small, pure-Go in-guest "guestagent" binary. Actual guest-CPU execution (including any JIT, e.g. QEMU TCG) is entirely QEMU's responsibility, external to Lima's codebase.

Verified via direct repository inspection (`/home/user/lima-vm/lima`, commit `1973a8c`): **zero** `arch/riscv/` directories, **zero** `.S`/`.s` assembly files, **zero** RVV/vector intrinsics (`vfloat32m1_t`, `rvv` search: 0 results anywhere in the repo).

riscv64-specific logic that does exist, all in `pkg/driver/qemu/qemu.go` (1394 lines), is real and hand-written (not a stub), with density comparable to the aarch64 code path:

| Component | riscv64 implementation | Quality |
|---|---|---|
| CPU type selection | `"max"` (changed from `rv64` in PR #3484 to support RVA23 profile required by newer distros) | Hand-tuned, dedicated branch |
| Machine args | `virt,acpi=off,accel=...` with a code comment citing EDK2/tianocore guidance for why ACPI must be disabled | Hand-tuned, dedicated branch |
| TPM device | `tpm-tis-device` (shared logic path with aarch64/armv7l, correctly not x86_64's `tpm-crb`) | Correct, shared |
| Firmware discovery | Dedicated `qemuEdk2Arch()` mapping (`riscv64`->`riscv`) plus verified Debian (`qemu-efi-riscv64`) and Fedora (`edk2-riscv64`) package paths | Hand-tuned, verified against real installs (PR #3464) |
| Serial console | Explicit comment: "ttyS0 for Intel and RISC-V, ttyAMA0 for ARM" - correctly skips an ARM-only workaround | Correct |
| Guest agent | Pure Go, `CGO_ENABLED=0 GOOS=linux GOARCH=riscv64` cross-compile, no arch-specific subpackage | Generic Go, works by construction |

This is **not an optimization-purpose project** - riscv64 guest execution runs entirely inside QEMU's own emulation, so Section 4's "SIMD/JIT hand-tuning" axis does not apply to Lima itself. The relevant question is whether riscv64 gets dedicated orchestration logic versus silently falling into a default, and it does.

| Axis | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Dedicated QEMU driver branches | 10 references | 9 references | 7 references |
| Native hypervisor driver (non-QEMU) | N/A (no native accel needed beyond KVM/HVF passthrough) | vz, krunkit | None (QEMU only) |
| Guest agent build | Native Go cross-compile | Native Go cross-compile | Native Go cross-compile (identical mechanism) |

Source: [pkg/driver/qemu/qemu.go, local clone](https://github.com/lima-vm/lima).

## 5. Build System, Cross-Compilation, and Toolchain

Lima is a Go project (module `github.com/lima-vm/lima/v2`, `go.mod` requires **Go 1.26.0**). There is no CMake, no `BUILDING.md`, no Dockerfile anywhere in the repository (confirmed by direct search of a fresh shallow clone). Build orchestration is a plain GNU Makefile driving `go build` with `GOOS`/`GOARCH` cross-compilation.

**riscv64 guest-agent build** (the only riscv64 binary Lima produces):
```
make _output/share/lima/lima-guestagent.Linux-riscv64.gz
```
or
```
make riscv64-guestagent
```
Internally: `CGO_ENABLED=0 GOOS=linux GOARCH=riscv64 go build -o _output/share/lima/lima-guestagent.Linux-riscv64 ./cmd/lima-guestagent`. Because `CGO_ENABLED=0`, no C cross-toolchain is required at all for this artifact.

**Config knob:** `CONFIG_GUESTAGENT_ARCH_RISCV64=y` (Makefile ~line 207; the file's own comment says this "should no longer be changed"). Setting it empty disables the riscv64 guestagent build.

**Critical limitation:** the Lima **host** binary (`limactl`) is never built for riscv64. `make help-artifact` lists `artifact-<ARCH>` support for `amd64, arm64, x86_64, aarch64` only - there is no riscv64 host artifact target in the build system at all. `limactl` requires `CGO_ENABLED=1` (for `net.LookupIP()`), unlike the guestagent.

**QEMU version requirements:** v8.2.1+ (macOS) / v6.2.0+ (Linux), general minimums (not riscv64-specific, but the only documented floor). riscv64 specifically "requires QEMU 9.1 or later" per PR #2730 discussion, for EDK2 firmware (`edk2-riscv-code.fd`) availability.

**Known build failures (historical, all fixed):** dead cloud-image URL ([#930](https://github.com/lima-vm/lima/issues/930)), QEMU 7.1 `ramfb`/`fw_cfg` incompatibility ([#1135](https://github.com/lima-vm/lima/issues/1135)), incorrect `minimumLimaVersion` metadata ([PR #2814](https://github.com/lima-vm/lima/pull/2814)), missing Debian 13 image/checksum ([PR #4978](https://github.com/lima-vm/lima/pull/4978)).

**No riscv64 CI, so no riscv64 build is ever exercised automatically** - see Section 7.

Source: [Makefile, go.mod, local clone](https://github.com/lima-vm/lima).

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Host binary (`limactl`) | Yes | Yes | **No** |
| Guest boot via QEMU | Yes | Yes | Yes (experimental) |
| Native hypervisor (vz/krunkit, macOS) | N/A | Yes | No |
| Containerd auto-install | Yes | Yes | **No** (nerdctl-full not built for riscv64) |
| Distro image catalog | 27/42 `templates/_images/*.yaml` | 33/42 | **13/42** |
| CI build/test | Yes | Yes | **No** |
| Official release binary | Yes | Yes | **No** |

**Functional gaps:** No riscv64 host build means Lima cannot run natively on a riscv64 machine at all - it can only be used to launch a riscv64 **guest VM** from an x86_64/aarch64 host. Container tooling (nerdctl) is unavailable by default in riscv64 guests. Only 13 of 42 distro image definitions offer a riscv64 image, and per PR #3461, Debian's riscv64 image is an unstable/daily build, not a stable release, since Debian has no stable riscv64 release yet.

**Critical dependency gap - gVisor:** Lima's default usermode network stack (`gvisor-tap-vsock`, used across all drivers for port forwarding/DNS) depends on Google's gVisor, which has **no riscv64 platform support upstream at all** (officially supports only linux/amd64 and linux/arm64). This is a functional blocker specifically for running Lima's networking stack **on a riscv64 host** - a separate concern from riscv64-as-guest support, which is what the 13 merged PRs above actually deliver. [Source: gVisor status report, project-reports/gvisor.md]

**Performance gaps:** No numeric benchmark data exists anywhere (GitHub, general web search, riseproject.dev full blog sitemap of 34 posts - zero mention Lima). The only characterization found is qualitative, from Lima's own docs: foreign-architecture QEMU system-mode emulation is described as "extremely slow," with "Fast Mode" (QEMU user-mode emulation) recommended as an alternative; no riscv64-specific multiplier is documented.

**Security hardening gaps:** Data not available - no source discusses riscv64-specific hardening (ASLR, stack protector, CFI) differences for Lima or its guest images.

**NaN / floating-point semantics issues:** None found. A targeted search for `riscv nan floating repo:lima-vm/lima` and general web search returned no matches; explicitly not fabricated.

## 7. CI/CD Infrastructure

**No riscv64 CI exists.** Verified by directly reading all 6 workflow files in `.github/workflows/`: `codeql.yaml`, `lint-quick.yml`, `release.yml`, `scorecard.yml`, `spell.yml`, `test.yml`. A case-insensitive grep for "risc" across every workflow file returned **zero matches** - no job name, matrix entry, comment, or conditional references riscv in any form. No `.gitlab-ci.yml`, `.cirrus.yml`, or `Jenkinsfile` exists in the repository.

All CI runners are `ubuntu-24.04`, `ubuntu-22.04`, `macos-15-large` (explicitly commented "# Intel"), and `windows-2025` - no riscv64 runner, and no RISE runner reference anywhere. The `qemu-linux` integration test job (`test.yml`, 668 lines) tests templates `alpine.yaml`, `debian.yaml`, `fedora.yaml`, `archlinux.yaml`, `opensuse.yaml`, `docker.yaml` - no riscv64 entry. Critically, `hack/test-templates.sh` resolves the arch to test via `limactl info | jq -r .defaultTemplate.arch`, i.e., the **host runner's native architecture** - since all runners are x86_64/Intel, this never resolves to riscv64, and there is no `--arch=riscv64` override anywhere in the script or workflow. The riscv64 branch of `templates/default.yaml` (merged in via PR #2730) is therefore never selected, built, or booted by any CI job.

| Axis | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI build | Yes (native ubuntu-24.04/22.04, windows-2025) | Yes (native macOS arm64 for `vz`/`krunkit` jobs) | **No** |
| CI test | Yes | Yes | **No** |
| Release-blocking | Yes | Yes | N/A (no job to block on) |
| RISE runners | No | No | No |
| Hardware | Native x86_64 GitHub-hosted runners | Native Apple Silicon (macOS runners) | None used |

Source: [.github/workflows/test.yml and 5 sibling workflow files, local clone](https://github.com/lima-vm/lima).

## 8. Distribution and Release Status

**No official riscv64 host binary exists for Lima through any channel checked:**

- **GitHub Releases:** v2.2.0 assets are `lima-2.2.0-Darwin-arm64.tar.gz`, `-Darwin-x86_64`, `-Linux-aarch64`, `-Linux-x86_64`, `-Windows-AMD64.zip`, `-Windows-ARM64.zip`, plus `additional-guestagents` variants for Darwin-arm64/Darwin-x86_64/Linux-aarch64 and source archives. **No filename contains "riscv64."** One narrow exception was found by extracting `lima-additional-guestagents-2.2.0-Linux-aarch64.tar.gz`: it contains `share/lima/lima-guestagent.Linux-riscv64.gz`, a genuine, statically-linked riscv64 ELF binary (`file` output: `ELF 64-bit LSB executable, UCB RISC-V, double-float ABI`). This is the **guest-side** agent that runs inside a QEMU-emulated riscv64 VM, not a Lima host build - it is not advertised at the top level as riscv64 support and cannot be used to run `limactl` on a riscv64 machine.
- **Ubuntu 26.04 (resolute):** No package named `lima`, `python3-lima`, or `liblima` exists for any architecture, confirmed both via project-graph SPARQL query (empty result set) and a live `packages.ubuntu.com` search (10 hits, all incidental substring matches on unrelated packages like `pullimap`, `libcamlimages-ocaml`). **Lima is not packaged in Ubuntu at all.**
- **PyPI:** The `lima` PyPI package (0.5, 2015) is an unrelated Python serialization library, not lima-vm/lima. No wheels of any architecture exist for it, and it is irrelevant to this project.
- **Arch Linux RISC-V** (archriscv.felixc.at): No entry for `lima` found.
- **Fedora, Debian:** Data not available - no package tracker entry was found or searched separately; the release-channel searches above (Ubuntu, PyPI, Arch, GitHub) found no riscv64 package in any distribution.

**What a user must do to get a working riscv64 setup with Lima today:** Install Lima on an x86_64 or aarch64 host (the only host architectures with official binaries), then use `limactl create --arch=riscv64 template:default` to launch a riscv64 **guest** VM via QEMU emulation. There is no path to running Lima itself natively on a riscv64 host machine.

## 9. Dependencies

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Community/notes |
|---|---|---|---|---|---|
| QEMU (external binary, exec'd; not in go.mod) | Primary VM backend; TCG JIT for guest code when KVM/HVF unavailable | Packaged for Ubuntu 26.04 riscv64 (`qemu-system-misc`, `qemu-system-common`, `qemu-utils`) | Native riscv64 KVM accel available since Linux 6.9 | Packaged in Ubuntu resolute | Real tracker is GitLab, not GitHub Issues - GitHub search undercounts riscv64 activity. See [project-reports/qemu.md] |
| gVisor (`gvisor.dev/gvisor`, indirect via `containers/gvisor-tap-vsock`) | Default usermode network stack (all drivers) | No Ubuntu riscv64 package; not built for riscv64 at all | Upstream supports only linux/amd64, linux/arm64 - no riscv64 platform | Not released for riscv64 | **Single biggest riscv64 blocker for Lima on a riscv64 host** - no tracked riscv64 support effort found in `google/gvisor` issues. See [project-reports/gvisor.md] |
| cilium/ebpf (direct; `pkg/guestagent/ticker/ebpf_linux.go`) | In-guest BPF ticker/timer mechanism | Packaged for Ubuntu 26.04 riscv64 (`libbpf1`, `libbpf-dev`) | riscv64 BPF JIT landed in Linux ~6.9 (2024) | Available via standard riscv64 kernel/toolchain | Architecture-agnostic Go; low risk |
| pierrec/lz4 (indirect, pure-Go) | Transitive dependency, likely via tar-layer handling | N/A (pure Go, no arch-specific paths) | N/A | N/A | Low risk; not the C `lz4` library |
| golang.org/x/crypto (indirect, backs SSH via lima-vm/sshocker) | Core SSH auth/tunneling to guest | Builds on riscv64 (first-class Go GOARCH since 1.14) | No known riscv64-specific failures | Ships wherever Go ships for riscv64 | No hardware-accelerated riscv64 path exists; falls back to portable Go (functionally fine, unaccelerated) |

**Deep-dive - gVisor:** This is the only dependency that materially blocks riscv64 support, and it blocks the **host** side (running Lima's usernet networking on a riscv64 machine), not the guest side that the 13 merged PRs address. A search of `google/gvisor` issues for "riscv64" returned no riscv64-specific tracked work; comparable historical efforts (e.g., ARM64 platform support, issue #63) took multiple years from request to landing, suggesting a similar timeline would apply to riscv64 if undertaken. No open gVisor riscv64 PR or RFC was found.

**Deep-dive - QEMU:** In good packaging shape on Ubuntu 26.04 riscv64; this is upstream QEMU's own long-standing riscv64 system-emulation support, not something Lima needs to build.

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [#1135](https://github.com/lima-vm/lima/issues/1135) | QEMU 7.1 regression: `-device ramfb` requires `fw_cfg` DMA | Closed (fixed by PR #1142, 2022-11-02) | Was blocking (VM would not boot) | Correctness bug, riscv64-specific, resolved |
| [#930](https://github.com/lima-vm/lima/issues/930) | riscv64 install refers to outdated release image pointer | Closed (2022-07-19) | Was blocking | Stale URL, resolved |
| [#3321](https://github.com/lima-vm/lima/issues/3321) | Consider setting `CONFIG_GUESTAGENT_ARCH_RISCV64` to `n` for Homebrew | Closed (fixed by PR #3503, 2025-05-12) | Low (packaging/disk space) | Not a correctness bug |
| [#939](https://github.com/lima-vm/lima/issues/939) | Clock drift in Fedora 36, but not in Ubuntu/RISC-V | **Open** | Not RISC-V-specific | Mentions riscv64 only incidentally as a contrast case; no RISC-V action item |

**Zero open riscv64 correctness or performance bugs currently exist in the tracker.** No NaN/floating-point bug exists for Lima on RISC-V (explicitly searched and confirmed absent).

## 12. Objections and Upstream Blockers

**Stated objections:** None found. No maintainer has expressed opposition to riscv64 support; all 13 riscv64 PRs merged without contested review, most with single-round maintainer approval (e.g., [PR #2592](https://github.com/lima-vm/lima/pull/2592): "LGTM, and works fine on macOS aarch64 host"; [PR #3484](https://github.com/lima-vm/lima/pull/3484): approved with "Thanks").

**Technical blockers:**
1. gVisor has no riscv64 platform support - blocks Lima's default network stack on a riscv64 host (Section 9).
2. No riscv64 host binary build target exists in the Makefile at all - `limactl` itself is architecturally scoped to amd64/arm64 host builds only; adding riscv64 would require both toolchain work (CGO_ENABLED=1 build) and the gVisor dependency resolved.
3. No CI validates any riscv64 work - regressions rely entirely on community bug reports (as evidenced by the #930/#1135 bug history), a pattern likely to continue.
4. Limited stable distro images (13/42 templates, Debian riscv64 is unstable-only) constrain which guest OSes are even testable.

**Organizational blockers:** None found beyond capacity - this appears to be an under-resourced, community-driven effort with no dedicated funding or RISE involvement, rather than a resisted one.

**Acceptance probability:** High for incremental guest-side riscv64 work (13/13 PRs submitted have merged, cleanly and without objection). Low-to-unknown for host-side riscv64 support (running `limactl` natively on a riscv64 machine), since that is blocked by an external dependency (gVisor) with no known riscv64 roadmap, and no PR toward a riscv64 host build target was found in this research.

## 13. Readiness Assessment

- **Color:** orange (no upstream CI, no upstream-published riscv64 release artifact, no distro package to apply a floor against)
- **Release provider:** none (no channel checked - GitHub Releases, Ubuntu, PyPI, Arch RISC-V - publishes a consumable riscv64 build of Lima; the one genuine riscv64 ELF binary found is a guest-agent buried inside an "additional guestagents" tarball attached to a Darwin/aarch64 release, not a top-level riscv64 artifact)
- **Optimization level:** not applicable - Lima is not an optimization-purpose project (Step 2 of the color model does not trigger; its value proposition is VM orchestration via QEMU, not ISA-specific compute performance)

**Justification:** Direct inspection of all 6 GitHub Actions workflow files confirms zero riscv64 CI of any kind - no build, no boot test, no smoke test ([`.github/workflows/test.yml` and siblings](https://github.com/lima-vm/lima)). No distribution packages Lima at all (Ubuntu 26.04 resolute has no `lima` package for any architecture, confirmed via both a graph-DB query and a live [packages.ubuntu.com search](https://packages.ubuntu.com/search?keywords=Lima&suite=resolute&searchon=names&section=all)), so the distribution floor that would otherwise lift a no-CI project to yellow does not apply - there is simply no distro build to check for patches. GitHub Releases publish no riscv64 host artifact ([v2.2.0 release assets](https://github.com/lima-vm/lima/releases)) - the only real riscv64 binary produced by the project is an in-guest agent nested inside an aarch64-tagged tarball, which does not constitute a consumable riscv64 release of Lima itself. This combination (no CI, no release, no distro package) places Lima at orange per Step 1 of the color model - riscv64 support is real and functional as documented source-level orchestration code (Section 4), but entirely unvalidated by any automated process and not consumable as a packaged release for either riscv64-guest or riscv64-host use cases.

**Pending work that could change the grade:** None identified. No open PR adds riscv64 CI, no open PR adds a riscv64 host build target, and there is no RISE involvement in this project (confirmed absent across riseproject.dev blog, member list, and working groups). The steady cadence of merged riscv64 PRs (13 since 2022, most recently [PR #5201](https://github.com/lima-vm/lima/pull/5201) in July 2026) shows the guest-side riscv64 path continues to receive incremental maintenance, but nothing found in this research targets the orange-to-blue/yellow gap (CI or a released artifact) specifically.

## 14. Investment Analysis

RISE has done no work on Lima (confirmed absent from riseproject.dev). Nothing here is already covered by RISE funding or infrastructure; all items below are unaddressed.

### 14.1 Functional Enablement

The highest-value functional gap is not riscv64-guest support (already functional, per Section 4) but a riscv64 **host** build of `limactl`, currently blocked by gVisor's lack of riscv64 support. Absent a gVisor port, Lima could still gain a riscv64 host build if a non-gVisor networking fallback (e.g., disabling default usernet networking on riscv64 hosts, or wiring in an alternative like slirp4netns) were added - a scoped, Lima-side workaround that does not require waiting on gVisor upstream.

### 14.2 Performance Optimization

Not applicable in the traditional sense - Lima has no ISA-specific hot paths to optimize (Section 4). The only performance lever is QEMU's own riscv64 TCG/KVM emulation quality, which is an external dependency, not Lima code.

### 14.3 CI/CD Infrastructure

Adding a riscv64 job to `test.yml` would require either a riscv64 GitHub Actions runner (not natively available) or a QEMU-emulated riscv64 build/boot job on an existing x86_64 runner (following the pattern already used for other guest architectures in `qemu-linux`). This is the single highest-leverage, lowest-risk investment: it would upgrade the color from orange toward yellow (build-only) or blue (if paired with test execution and no release) without requiring any new host-build capability.

### 14.4 Ecosystem Enablement

Not applicable - Lima has no dependent package ecosystem (Section 10 omitted per instructions; Lima is a standalone tool, not a library with downstream consumers).

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| CI/CD | Add a QEMU-emulated riscv64 build+boot job to `test.yml`, mirroring existing `qemu-linux` template-test jobs | 1-2 | Upstream Lima maintainers | High |
| Functional | Investigate/implement a non-gVisor networking fallback for riscv64 hosts (unblocks a future `limactl` riscv64 host build) | 3-6 (excludes any gVisor-side work, which is out of Lima's control) | Upstream Lima maintainers, possibly with gVisor community coordination | Medium |
| Functional | Add a `riscv64` target to `make help-artifact` / release Makefile once CI and networking gaps above are closed | 1-2 | Upstream Lima maintainers | Medium |
| Distribution | Package Lima for a riscv64-capable distro (e.g., propose an Ubuntu/Debian package) once a host binary exists | 1-2 (packaging only, contingent on above) | Distro packagers | Low (blocked on functional work above) |

## 15. Updates

(No updates yet - initial report dated 2026-09-08.)

## 16. References

- [PR #827 - experimental support for riscv64](https://github.com/lima-vm/lima/pull/827)
- [Issue #930 - riscv64 install refers to outdated release image pointer](https://github.com/lima-vm/lima/issues/930)
- [Issue #1135 - QEMU 7.1 regression, ramfb device error](https://github.com/lima-vm/lima/issues/1135)
- [Issue #939 - Clock drift in Fedora 36, but not in Ubuntu / RISC-V](https://github.com/lima-vm/lima/issues/939)
- [Issue #3321 - Consider setting CONFIG_GUESTAGENT_ARCH_RISCV64 to n](https://github.com/lima-vm/lima/issues/3321)
- [PR #1425 - Tests fail on RISCV64 due to hardcoded AARCH64](https://github.com/lima-vm/lima/pull/1425)
- [PR #2315 - Document the cpuType default for riscv64](https://github.com/lima-vm/lima/pull/2315)
- [PR #2592 - qemu: riscv64: switch from u-boot to EDK2](https://github.com/lima-vm/lima/pull/2592)
- [PR #2730 - templates: merge experimental/{riscv64,armv7l} into default](https://github.com/lima-vm/lima/pull/2730)
- [PR #2814 - templates: fix minimumLimaVersion for riscv64-enabled templates](https://github.com/lima-vm/lima/pull/2814)
- [PR #3461 - templates: Add Debian and Fedora riscv64 images](https://github.com/lima-vm/lima/pull/3461)
- [PR #3464 - qemu: Add paths to riscv64 efi binaries](https://github.com/lima-vm/lima/pull/3464)
- [PR #3484 - Set riscv64 cpu to max](https://github.com/lima-vm/lima/pull/3484)
- [PR #3503 - Makefile: split lima-additional-guestagents tarball](https://github.com/lima-vm/lima/pull/3503)
- [PR #4753 - template:almalinux-kitten-10: support riscv64](https://github.com/lima-vm/lima/pull/4753)
- [PR #4978 - Missing image and checksum for debian-13 riscv64](https://github.com/lima-vm/lima/pull/4978)
- [PR #5201 - templates: fedora-44: support riscv64](https://github.com/lima-vm/lima/pull/5201)
- [lima-vm/lima GitHub Actions workflows](https://github.com/lima-vm/lima/tree/master/.github/workflows)
- [lima-vm/lima Releases (v2.2.0 asset list)](https://github.com/lima-vm/lima/releases)
- [Ubuntu 26.04 (resolute) package search for "Lima"](https://packages.ubuntu.com/search?keywords=Lima&suite=resolute&searchon=names&section=all)
- [PyPI lima 0.5 (unrelated package)](https://pypi.org/pypi/lima/json)
- [docs/config/multi-arch.md](https://github.com/lima-vm/lima)
- [docs/releases/experimental.md](https://github.com/lima-vm/lima)
- [Release v0.11.0 - lima-vm/lima](https://github.com/lima-vm/lima/releases/tag/v0.11.0)
- [Release v1.0.0 - lima-vm/lima](https://github.com/lima-vm/lima/releases/tag/v1.0.0)
- [riseproject.dev blog](https://riseproject.dev/blog/)
- [gVisor status report](https://github.com/riseproject-dev/sw-ecosystem) (project-reports/gvisor.md)
- [QEMU status report](https://github.com/riseproject-dev/sw-ecosystem) (project-reports/qemu.md)
- Local clone used for verification: `/home/user/lima-vm/lima` (commit `1973a8c`)
