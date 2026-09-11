---
title: Podman
parent: Project Reports
color: yellow
dependencies:
  - name: Go
    relation: build-dependency
    criticality: critical
  - name: golang.org/x/sys
    relation: build-dependency
    criticality: critical
  - name: bbolt
    relation: runtime-dependency
    criticality: critical
  - name: GCC
    relation: build-dependency
    criticality: critical
  - name: CNI plugins
    relation: runtime-dependency
    criticality: critical
  - name: iptables
    relation: runtime-dependency
    criticality: optional
  - name: ebitengine/purego
    relation: build-dependency
    criticality: optional
---

# Podman

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-09-11<br/>
**Readiness:** yellow<br/>
**Scope:** RISC-V (riscv64/linux) support status for Podman<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

{% include dependency-graph.html slug="dependencies" subset="podman" %}

## 1. Project Overview

Podman is an OCI-compliant container/pod engine written in Go, providing a daemonless, rootless-capable alternative to Docker. It is developed under the CNCF as a Sandbox project (accepted January 21, 2025), governed as part of a broader umbrella called "Podman Container Tools" ([cncf.io/projects/podman-container-tools](https://www.cncf.io/projects/podman-container-tools)), with shared governance documents living in `podman-container-tools/community`. License is Apache 2.0.

Governance and maintainership are overwhelmingly Red Hat-dominated: of the named maintainers (Ygal Blum, Ashley Cui, Mario Loriedo, Lokesh Mandvekar, Jan Rodak, Tom Sweeney) all are Red Hat; one maintainer (Danish Prakash) is SUSE, and one reviewer (Lewis Roy) is independent. Top active human committers over the past ~2 years (Paul Holzinger, Matt Heon, Giuseppe Scrivano, Kir Kolyshkin, Daniel J Walsh) are all historically Red Hat engineers. Per CNCF's project page, Podman carries 69 contributing organizations (+25% YoY) and 754 total contributors (-25% YoY).

Community stance toward RISC-V as a new port is welcoming but conservative: maintainers accept and merge riscv64-enabling changes without controversy, but have consistently declined to escalate riscv64 to the natively-tested CI tier, even when offered free native hardware CI capacity (see Section 3, Section 7). This mirrors Podman's general treatment of secondary architectures (ppc64le, s390x, MIPS, loong64, 386, arm, freebsd): "best effort," cross-compile-validated only.

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2019-07-03 | PR #3437 merged: splits cgo-only code paths so Podman can build with `CGO_ENABLED=0`, a prerequisite for building on RISC-V (which then lacked cgo support). Tested on real SiFive Unleashed hardware by community contributor carlosedp; noted tradeoff that rootless mode requires cgo and is unavailable in the cgo-free build. | [PR #3437](https://github.com/containers/podman/pull/3437) |
| 2019-07-01 | Issue #3462 filed: CNI/iptables firewall errors running Podman on RISC-V Fedora/Debian VMs ("failed to add the address ... to trusted zone", "Chain already exists"). Closed and locked with no documented fix in the visible thread. | [Issue #3462](https://github.com/containers/podman/issues/3462) |
| 2023-08-16 | PR #19626 merged (author Michal Biesek): adds riscv64 recognition to `GetFcosArch` and adds riscv64 as a cross-build target. Maintainer Luap99 explicitly noted the architecture was untested at the time and scaled back an initial release-artifacts ask. First shipped in v4.7.0. | [PR #19626](https://github.com/containers/podman/pull/19626) |
| 2025-03-17 | PR #25600 merged (author Yanko Kaneti): adds riscv64 to the Fedora RPM spec's `ExclusiveArch`, after confirming podman 5.4.1 builds and runs on available riscv64 hardware. First shipped in v5.5.0. | [PR #25600](https://github.com/containers/podman/pull/25600) |
| 2025-03-18 | PR #25613 merged: backport of #25600 to the `v5.4` stable branch. First shipped in v5.4.2. | [PR #25613](https://github.com/containers/podman/pull/25613) |
| 2026-03-19 | Issue #28329 opened (author gounthar/Bruno Verachten): demonstrates Podman 6.0.0-dev builds and runs natively on a BananaPi F3 (Debian Trixie, Go 1.24.4, ~18 minute build), requests riscv64 in release artifacts and CI, offers free RISE RISC-V CI runner capacity. | [Issue #28329](https://github.com/containers/podman/issues/28329) |
| 2026-03-20 | PR #28331 opened and later closed unmerged: initial attempt to add a native riscv64 job via RISE runners; superseded after maintainer Luap99 preferred a cross-compilation approach. | [PR #28331](https://github.com/containers/podman/pull/28331) |
| 2026-03-23 | PR #28333 merged: adds a riscv64 cross-compilation entry to the Cirrus CI alt-arch matrix, closing #28329. Reviewers Luap99 and Honny1 approved; no test execution was added, only a cross-compile check. | [PR #28333](https://github.com/containers/podman/pull/28333) |
| 2026-06-01 | Commit `3743b9f806` ("Goodbye Cirrus") removes `.cirrus.yml` entirely, decommissioning the CI system that PR #28333 had just added riscv64 to. The GitHub Actions job that inherited cross-arch build duty (`build-alt` in `ci.yml`) covers riscv64 among 14 targets but is compile-only and gated by a repository-name condition. | [Commit 3743b9f806](https://github.com/containers/podman/commit/3743b9f806) |
| 2026-09-03 | Issue #29711 opened (author WhyNotHugo), still open: `make -j1 localunit` fails on riscv64 (and aarch64) in Alpine package builds. No assignee, no linked fix as of 2026-09-10. | [Issue #29711](https://github.com/containers/podman/issues/29711) |

**Is it fully upstream?** The build-enablement chain (cgo-free build, cross-compile target, FCOS-arch recognition, RPM `ExclusiveArch`) is fully merged into `main`. What is **not** upstream: riscv64 release artifact publishing, riscv64 test execution in CI, and a fix for the `emulatedArchitectures` gap (#27364, closed with no documented resolution).

**Correction to an earlier internal summary:** one research pass characterized issue #28329 as "resolved by merged PR #28333." That is misleading: PR #28333 only added a compile-only cross-arch matrix entry (later deleted along with Cirrus itself); the original ask, riscv64 release artifacts, remains unfulfilled as of the current release (v6.1.1). This discrepancy is flagged per the report's verification policy.

## 3. Upstream Support Tier

Podman's `SUPPORT.md` states an explicit two-tier policy:
- **Natively/automatically tested** ("Native Podman" table): x86_64 Linux (Debian/Fedora) and ARM64 Linux (Fedora) only. Podman Machine (VM) testing covers Windows (x86_64) and macOS (ARM64) only.
- **Everything else, including riscv64**, is "best effort": validated only via cross-compilation build checks, grouped alongside ppc64le, s390x, MIPS/MIPS64, loong64, arm, 386, and freebsd. `Makefile`'s `CROSS_BUILD_TARGETS` explicitly lists `bin/podman.cross.linux.riscv64`.

| Axis | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Natively tested in CI | yes | yes | no |
| Release-blocking test suite | yes | yes | no |
| Official GitHub release binaries | yes (linux, macOS installer via universal, Windows) | yes (linux, macOS, Windows) | no |
| `podman machine` (VM backend) | yes | yes | no, deliberately excluded (`amd64 \|\| arm64` build tags) |
| Cross-compile CI check | n/a (native) | n/a (native) | yes, compile-only, repo-gated |
| Fedora RPM `ExclusiveArch` | yes | yes | yes (spec only; `.packit.yaml` copr/koji chroot targets list only aarch64, no riscv64 chroot configured [NEEDS VERIFICATION] on whether Fedora actually builds/ships the riscv64 RPM in practice) |

Source: [SUPPORT.md is referenced in governance/support research above](https://github.com/containers/podman); [Makefile `CROSS_BUILD_TARGETS`](https://github.com/containers/podman/blob/main/Makefile); [rpm/podman.spec](https://github.com/containers/podman/blob/main/rpm/podman.spec).

## 4. Technical Architecture and RISC-V-Specific Subsystems

Podman itself contains essentially no architecture-specific implementation (no JIT, no hand-tuned SIMD, no assembly) in its own source tree. A full repo grep (excluding `vendor/`) for "riscv" turned up exactly 6 files, all either data-table entries, build/packaging plumbing, or test fixtures, not codegen:

| Path | Purpose | Status |
|---|---|---|
| `pkg/emulation/elf.go` | Table entry for `linux/riscv32` and `linux/riscv64` ELF header signatures (`elf.EM_RISCV`), used to detect foreign-arch container images/binaries for QEMU/binfmt emulation | Complete, same shape as all other arch entries |
| `Makefile` (line 189) | Adds `bin/podman.cross.linux.riscv64` as a cross-compile target | Build plumbing only |
| `rpm/podman.spec` (line 69) | `ExclusiveArch` includes riscv64 | Packaging metadata only |
| `docs/tutorials/podman_machine_os_customization.md` | Prose mention of riscv64 as a target CPU arch for machine OS customization | Docs only |
| `test/e2e/info_test.go` (line 255) | Comment: riscv64 (and FreeBSD) use the file-locks backend, "neither are in CI" | Stub/untested, explicitly not exercised |
| `pkg/machine/define/vmtype_test.go` (line 45) | Unit test fixture using string `"riscv"` as an example of an *invalid* VM-type input | Not RISC-V support, tests rejection |

No hits for RVV intrinsic types, `rvv`, JIT, or SIMD-dispatch patterns in Podman's own code.

**Vendored (third-party, compiled-in) riscv64 code**, present because `GOARCH=riscv64` pulls it in via `go.mod`:

| Vendored path | Purpose | ISA extensions referenced |
|---|---|---|
| `vendor/golang.org/x/sys/cpu/cpu_riscv64.go` and related files | CPU feature-detection for riscv64 via Go runtime's `cpu.RISCV64` struct | `C`, `V` (vector), `Zba`, `Zbb`, `Zbs`, `Zbc`, plus crypto extensions `Zvbb`, `Zvbc`, `Zvkb`, `Zvkg`, `Zvkt`, `Zvkn`, `Zvknc`, `Zvkng`, `Zvks`, `Zvksc`, `Zvksg` |
| `vendor/go.etcd.io/bbolt/internal/common/bolt_riscv64.go` | Sets bbolt's `MaxMapSize`/`MaxAllocSize` for riscv64 (Podman's local state DB backend) | none (mmap sizing constants) |
| `vendor/golang.org/x/crypto/internal/poly1305/sum_riscv64.s` | riscv64 scalar assembly for Poly1305 MAC | scalar asm, no RVV |
| `vendor/github.com/ebitengine/purego/*_riscv64.{go,s}` | riscv64 calling-convention trampolines / cgo-free dynamic-library-call plumbing (indirect dependency only; no Podman `.go` file imports purego directly) | scalar asm |
| `vendor/golang.org/x/sys/unix/*_riscv64.{go,s}` | Standard Go syscall-layer riscv64 support (linux/freebsd/openbsd) | syscall numbers/ABI only |

None of the vendored files use RVV intrinsics directly; `x/sys/cpu` only detects the `V`/`Zv*` extensions for the Go runtime's own use.

**Comparison table:**

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Core engine build | native, first-class | native, first-class | cross-compiles cleanly, no cgo needed |
| ELF/binfmt emulation table | full | full | full (identical structure to all 15+ other platform entries) |
| Vendored syscall/cpu-feature layer | full | full | full (complete, hand-generated per-arch tables) |
| `podman machine` (VM backend) | full | full | absent by design (`amd64 \|\| arm64` build tags, with a clean no-op fallback that simply does not register the `machine` subcommand) |

Bottom line: this is an architecturally simple project for porting purposes. Podman has no numerics/SIMD/crypto hot path of its own that needs riscv64-specific tuning; the gap is entirely in CI/test/release infrastructure and in specific runtime subsystems (Section 6), not in Podman's own code quality on riscv64.

## 5. Build System, Cross-Compilation, and Toolchain

Podman is a pure Go project built with GNU Make + `go build`, not CMake. No `CMakeLists.txt`, no `cmake/` directory, and no dedicated `BUILDING.md`/`docs/cross-compilation.md` exist in the repository.

**Cross-compile command for riscv64:**
```
make bin/podman.cross.linux.riscv64
```
or the full target set (riscv64 included among 14):
```
make cross          # or: make local-cross
```
Raw equivalent (no Make needed):
```
CGO_ENABLED=0 GOOS=linux GOARCH=riscv64 \
  go build -tags "containers_image_openpgp exclude_graphdriver_btrfs exclude_graphdriver_overlay" \
  -o bin/podman.cross.linux.riscv64 ./cmd/podman
```

**Toolchain requirements:**
- Go: `go.mod` pins exactly `go 1.26.0`, no riscv64-specific override. Because cross builds set `CGO_ENABLED=0`, **no C cross-compiler is required at all** for `make cross` — Go's own riscv64 backend handles compilation.
- GCC: unversioned, listed only as a plain `BuildRequires` in `rpm/podman.spec` for the **native**, cgo-enabled RPM build path (e.g. building on real riscv64 hardware/chroot). No minimum version is documented for any architecture.

**Empirical verification:** actually running the cross-compile command above (Go 1.24.7/1.26) against a fresh clone succeeded cleanly and produced a working 59.5MB riscv64 ELF binary (`ELF 64-bit LSB executable, UCB RISC-V, double-float ABI, statically linked`). This confirms the build is not a stub: Podman's full CLI/engine compiles for riscv64 with zero riscv64-specific source changes needed, because Go plus the vendored `golang.org/x/sys/unix` package already provide complete riscv64 syscall tables.

**QEMU usage found is unrelated to building Podman itself:** `pkg/emulation/elf.go` and `docs/tutorials/podman_machine_os_customization.md` both concern running riscv64 **guest** containers under QEMU emulation inside a Podman Machine VM on a non-riscv64 host, not compiling Podman for a riscv64 host.

**Known build/test failures:** issue #29711 (open) shows `make -j1 localunit` failing on riscv64 due to CGO/build-tag issues during Alpine package builds; this is a test-execution failure, not a compile failure of the main binary.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Core container/image/pod lifecycle | full | full | full (builds and runs natively per community reports) |
| Rootless mode | full | full | full since cgo support landed (was root-only 2019-2023 per PR #3437's cgo-free build path; current riscv64 Go toolchains support cgo) [NEEDS VERIFICATION: exact date cgo became available for riscv64 Go builds] |
| `podman machine` (QEMU/HyperV/AppleHV VM backend) | full | full | **absent, deliberately excluded** by `amd64 \|\| arm64` build tags with a graceful no-op fallback (`machine_unsupported.go`) |
| Multi-arch emulation (`podman run --arch riscv64 <image>`) | n/a | works for other target arches | **broken**: riscv64 missing from `emulatedArchitectures` list; `Exec format error` reported via podman machine/remote on macOS (issue #27364, closed with no documented fix) |
| Checkpoint/restore (`podman container checkpoint`) | full (via CRIU) | full (via CRIU) | **incomplete upstream in CRIU itself**: [checkpoint-restore/criu#1702 "Support for RISC-V"](https://github.com/checkpoint-restore/criu/issues/1702) has been open since December 2021 with no completed fix; treat `podman checkpoint/restore` as unreliable on riscv64 even though the criu package installs |
| Native CNI networking | full | full | historically broken (2019, issue #3462, closed/locked with no documented fix); Podman's current default network stack is netavark/aardvark-dns, not CNI, which somewhat reduces but does not eliminate exposure to this gap |
| netavark (default network stack) | full | full | package builds for riscv64 (Ubuntu 26.04); no GitHub issues found either way; one undocumented production report of aardvark-dns crashing on Ubuntu's packaged riscv64 binary, resolved by switching to Debian's aardvark-dns 1.14.0-3 (not filed as a GitHub issue, per Simon Josefsson's blog) |
| Rootless overlay storage (fuse-overlayfs) | full | full | package builds for riscv64; one undocumented production report of a mount failure (`unknown argument ignored: lazytime`, `fuse: device not found`) requiring `CAP_SYS_ADMIN` + `/dev/fuse` + `--isolation chroot` workaround (not filed as a GitHub issue, per Simon Josefsson's blog) |
| Local unit test suite | passes in CI | passes in CI | **fails** (issue #29711, open, CGO/build-tag issues) |

**Performance gaps:** no SIMD/vector hot path exists in Podman's own code, so there is no equivalent of an RVV-vs-scalar performance gap to assess (see Section 4). No quantitative runtime performance benchmarks for Podman on riscv64 were found anywhere (GitHub, RISE Project blog, general web search); the only concrete number is a build-time datapoint (~18 minutes to compile natively on a BananaPi F3, SpacemiT K1, 8-core @1.6GHz), not a runtime comparison.

**Security hardening gaps:** libseccomp (syscall filtering) is mature on riscv64 with no open issues found. No riscv64-specific hardening gap was identified beyond the CRIU and CNI issues already listed.

**NaN/floating-point semantics:** no Podman-specific floating-point or NaN-boxing bug was found on GitHub or the web; this is not an applicable risk area for a container engine with no numerics code of its own.

## 7. CI/CD Infrastructure

**Verified directly by reading the actual CI files** in a full clone of `containers/podman` (HEAD `0b62a8430`, checked 2026-09-10):

- **Zero mentions of "riscv" in any of the 16 active `.github/workflows/*.yml` files** (`assign.yml`, `cherry-pick.yml`, `ci.yml`, `dev-bump.yml`, `issue-labeler.yml`, `issue_pr_lock.yml`, `labeler.yml`, `lima.yml`, `machine-os-pr.yml`, `needs-info-labeler.yaml`, `release-build-artifacts.yml`, `release-pipeline-validation.yml`, `release.yml`, `stale.yml`, `update-podmanio.yml`, `zizmor.yml`).
- **Cirrus CI (`.cirrus.yml`)** did briefly carry a riscv64 cross-compile matrix entry, added by PR #28333 (merged 2026-03-23), but `.cirrus.yml` was **permanently deleted on 2026-06-01** by commit `3743b9f806` ("Goodbye Cirrus"): "Removing remaining cirrus specific files that we no longer use in the new CI setup." That CI system no longer exists in this project.
- **The GitHub Actions successor**, `ci.yml` job `build-alt` ("Cross Build (Linux, FreeBSD)"), runs `make cross`, which builds 14 architectures including riscv64 in one undifferentiated step. Per the Makefile's own comment, this class of build exists only "to check that we can build all binaries for another arch, the resulting binaries are not meant to be usable, this is just for testing if it builds" — **compile-only, no test execution, no QEMU run, no functional verification**. The job also carries `if: github.repository == 'podman-container-tools/podman'`, added 2026-05-25 by commit `32f987fc8c1` — a repository-name gate, not an unconditional trigger on every push/PR.
- **Podman's own current test source states riscv is not in CI:** `test/e2e/info_test.go`, lines 254-255: "This should not run on architectures and OSes that use the file locks backend. Which, for now, is Linux + RISCV and FreeBSD, neither of which are in CI - so no skips."
- **`release-build-artifacts.yml` and `release.yml` contain no riscv/GOARCH reference at all** — no riscv64 release binaries are produced by CI.
- **RISE runners were explicitly declined**, not used: PR #28331 proposed a native riscv64 job on RISE RISC-V runners; maintainer Luap99 preferred the (now-deleted) Cirrus cross-compile approach instead, and #28331 was closed unmerged.

| Axis | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI build | yes (native) | yes (native) | yes, compile-only, repo-gated, part of an undifferentiated 14-arch job |
| CI test execution | yes | yes | no |
| CI release-blocking | yes | yes | no |
| Native hardware or emulation used | native runners | native runners | n/a (no test execution occurs) |
| RISE runners in use | no (not needed) | no (not needed) | no, explicitly declined in favor of cross-compile-only CI |

## 8. Distribution and Release Status

**Official upstream GitHub releases:** confirmed absent. The expanded-assets list for the latest release (v6.1.1) contains only: `podman-installer-macos-arm64.pkg`, `podman-installer-windows-amd64.msi`, `podman-installer-windows-arm64.msi`, `podman-remote-release-darwin_arm64.zip`, `podman-remote-release-windows_amd64.zip`, `podman-remote-release-windows_arm64.zip`, `podman-remote-static-linux_amd64.tar.gz`, `podman-remote-static-linux_arm64.tar.gz`, shasums, and source archives. **Zero riscv64 assets.** An earlier release (v5.8.6) shows the same pattern. `release-build-artifacts.yml` only builds `arch: [amd64, arm64]`.

**PyPI:** the `podman` PyPI package (`podman-5.8.0-py3-none-any.whl`, `podman-5.8.0.tar.gz`) is a pure-Python REST API client for the Podman API, not the CLI/engine binary itself, and is architecture-independent by construction. It is not relevant evidence for or against riscv64 support of the actual Podman engine.

**RISE Python wheel builder:** the RISE GitLab wheel-builder project ID for `podman` (`https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/podman/`) 302-redirects straight to plain PyPI — no distinct riscv64 wheel exists there, consistent with `podman` being a pure-Python package with no wheel-level architecture concern.

**Ubuntu 26.04 "resolute":** confirmed via direct fetch of [packages.ubuntu.com/resolute/riscv64/podman](https://packages.ubuntu.com/search?keywords=Podman&suite=resolute&searchon=names&section=all) (a real package page, not just search results): `podman` 5.7.0+ds2-3build1, `podman-docker`, `podman-remote`, and `podman-toolbox` (same version) all ship for riscv64, in the **universe (ports)** archive component — a community-maintained secondary-architecture rebuild, not Canonical's first-party `main` archive. The build is from unpatched upstream source (Podman's own cross-build support already handles riscv64 cleanly), consistent with the "clean-distro-build" distribution floor. Note the Ubuntu package (5.7.0) trails the current upstream major version (v6).

**Fedora:** `rpm/podman.spec` declares `ExclusiveArch: aarch64 ppc64le s390x x86_64 riscv64`, making riscv64 a nominal first-class Fedora RPM target. However, `.packit.yaml` build targets (copr/koji chroots) list only `fedora-all-aarch64` / `centos-stream-*-aarch64` — **no riscv64 chroot targets are configured** — so whether Fedora's own build automation actually produces and ships a riscv64 RPM in practice is unresolved [NEEDS VERIFICATION].

**What a user must do today to get a working riscv64 binary:**
1. Preferred/simplest: install from Ubuntu 26.04 "resolute" universe/ports (`apt install podman`, riscv64), accepting that this is a community secondary-arch build one major version behind upstream (5.7.0 vs current v6.x), or
2. Build from source via `make bin/podman.cross.linux.riscv64` (no C toolchain needed, CGO disabled) or natively on riscv64 hardware with cgo enabled (~18 minutes on an 8-core SpacemiT K1 board per issue #28329), or
3. Obtain a Fedora RPM built from the upstream spec, availability of an automated build unconfirmed.

There is no first-party (upstream) riscv64 binary distribution channel.

## 9. Dependencies

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Community / notes |
|---|---|---|---|---|---|
| **Go** | Build-dependency, critical. `go.mod` pins exactly `go 1.26.0` | Full first-class riscv64 support in the Go toolchain; no riscv64-specific override needed | n/a (toolchain, not Podman-owned tests) | Go itself ships riscv64 toolchain releases | Mature; the entire cross-compile path for Podman depends on this being solid, and it is |
| **golang.org/x/sys** | Build-dependency, critical. Provides syscall tables/types and CPU feature detection for riscv64 (`cpu_riscv64.go`, `unix/*_riscv64.{go,s}`) | Complete, hand-generated per-arch tables for riscv64 (`zsyscall_linux_riscv64.go`, `ztypes_linux_riscv64.go`, `zerrors_linux_riscv64.go`, `zsysnum_linux_riscv64.go`), parity with amd64/arm64, not stubs | n/a | Vendored, ships with Podman's own binary | Mature, actively maintained upstream |
| **bbolt** | Runtime-dependency, critical. Podman's local state/storage DB backend (`go.etcd.io/bbolt`) | riscv64-specific `bolt_riscv64.go` sets `MaxMapSize`/`MaxAllocSize` correctly | No riscv64-specific issues found | Vendored | No open issues found |
| **GCC** | Build-dependency, critical, but only for the **native**, cgo-enabled build path (RPM builds, non-cross builds); `make cross`/`local-cross` needs **no C compiler at all** since `CGO_ENABLED=0` | Unversioned `BuildRequires` in `rpm/podman.spec`; no riscv64-specific minimum documented | n/a | n/a | GCC has mature riscv64 support generally; no Podman-specific gap found |
| **CNI plugins** | Runtime-dependency, critical (legacy network stack; superseded by netavark/aardvark-dns as default, but still a supported path) | Historically broken on riscv64: issue #3462 (2019) reports iptables/firewall errors running Podman with CNI on RISC-V Fedora/Debian, closed/locked with no documented fix | Same issue; no later re-verification found | Distro-packaged (e.g. Ubuntu ships `containernetworking-plugins` for riscv64, not independently verified in this research pass [NEEDS VERIFICATION]) | Oldest and weakest-evidenced dependency in this table; current default network stack (netavark) reduces exposure but does not retroactively fix this |
| **iptables** | Runtime-dependency, optional (used by CNI networking path) | No dedicated riscv64 iptables issue found in this research; general Linux iptables has mature riscv64 support | n/a | Shipped as a standard distro package on riscv64 (Debian/Ubuntu ports) | No riscv64-specific gap found beyond its role in the CNI-related issue #3462 above |
| **ebitengine/purego** | Build-dependency, optional. Indirect/transitive dependency only (no Podman `.go` file imports it directly, confirmed via `go.mod` line 115); provides cgo-free dynamic-library-call plumbing | riscv64 calling-convention trampolines exist (`struct_riscv64.go`, `zcallback_riscv64.s`, `sys_riscv64.s`, `sys_unix_riscv64.s`, `fakecgo/asm_riscv64.s`, `fakecgo/trampolines_riscv64.s`) | No riscv64-specific issues found | Vendored | Scalar asm only, no RVV; low risk given indirect/optional status |
| crun (indirect, via runtime shell-out) | Default OCI runtime | Ubuntu 26.04 riscv64 package exists (`crun 1.21-1ubuntu3`, ports) | Runs on real riscv64 boards per community reports | Distro package only, no upstream riscv64 release binaries | Historical `crun: bpf create: Invalid argument` on early RISC-V kernels (issue #21595, closed "not planned," crun 1.14/2023); appears resolved in current crun/kernel combos shipped in resolute |
| runc (indirect, alternate OCI runtime) | Alternate OCI runtime | Ubuntu 26.04 riscv64 package exists (`runc 1.4.0-0ubuntu1`, ports) | CI-tested per upstream | **riscv64 added to upstream CI and release artifacts** ([opencontainers/runc#5166](https://github.com/opencontainers/runc/issues/5166), closed completed) | Healthiest dependency in the chain; no open issues |
| conmon (indirect, container monitor) | Container monitor process (C) | Ubuntu 26.04 riscv64 package exists (`conmon 2.1.13+ds1-2`, ports) | No riscv64-specific issues found | Distro package only | No open issues found |
| CRIU (indirect, checkpoint/restore) | Backs `podman container checkpoint/restore` | Ubuntu 26.04 riscv64 package exists and builds (`criu 4.2-1ubuntu2`, ports) | **Functional riscv64 port incomplete upstream** | Distro package, core C/R support unfinished | [checkpoint-restore/criu#1702 "Support for RISC-V"](https://github.com/checkpoint-restore/criu/issues/1702) still open since December 2021, standout gap in this stack |
| libseccomp (indirect, syscall filtering) | Syscall filtering, arch-specific syscall tables | Ubuntu 26.04 riscv64 package exists (`libseccomp2 2.6.0-2ubuntu5`, ports) | Mature | Shipped | riscv64 support added long ago, no open issues |
| netavark (indirect, default network stack) | Default Rust network stack | Ubuntu 26.04 riscv64 package exists (`netavark 1.16.1-3.1`, ports) | No riscv64 issues found in the project's own tracker (likely works via Rust's `riscv64gc-unknown-linux-gnu` target) | Distro package | No open issues found; one undocumented crash on the Ubuntu-packaged aardvark-dns companion (see below) |
| aardvark-dns (indirect, DNS for netavark) | Rust DNS server for container networking | Ubuntu 26.04 riscv64 package exists (`aardvark-dns 1.16.0-3`, ports) | No GitHub issues found; **undocumented production crash on Ubuntu's packaged riscv64 binary**, resolved by switching to Debian's 1.14.0-3 build (per Simon Josefsson's blog, not filed as a GitHub issue) | Distro package | Gap exists only in blog-reported field experience, not in the issue tracker |
| fuse-overlayfs (indirect, rootless storage) | Rootless overlay storage driver (C) | Ubuntu 26.04 riscv64 package exists (`fuse-overlayfs 1.14-1build2`, ports) | No GitHub issues found; **undocumented mount failure** requiring `CAP_SYS_ADMIN` + `/dev/fuse` + `--isolation chroot` workaround (per Simon Josefsson's blog) | Distro package | Same as above, field-reported only |

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [#29711](https://github.com/containers/podman/issues/29711) | Tests fail on non-x86-64 | **Open** | Correctness | `make -j1 localunit` fails on riscv64 (and aarch64) in Alpine builds; CGO/build-tag issue; unassigned, no linked fix as of 2026-09-10 |
| [#27364](https://github.com/containers/podman/issues/27364) | [riscv64] `Exec format error` emulating Debian | Closed, no documented fix | Correctness | `podman run -it --arch riscv64 debian` fails via podman machine/remote on macOS; root cause given as riscv64 missing from Podman's `emulatedArchitectures` list; Docker's equivalent command works |
| [checkpoint-restore/criu#1702](https://github.com/checkpoint-restore/criu/issues/1702) | Support for RISC-V | **Open since December 2021** | Functional gap (dependency) | Blocks reliable `podman container checkpoint/restore` on riscv64 even though the CRIU package installs |
| [#21595](https://github.com/containers/podman/issues/21595) | crun: bpf create '': Invalid argument | Closed as "not planned" | Correctness (historical) | VisionFive2/JH7110 board, Podman 4.9.2, crun 1.14; maintainers did not pursue a fix; appears superseded by newer crun/kernel combos |
| [#3462](https://github.com/containers/podman/issues/3462) | Podman errors using CNI on Risc-V architecture | Closed, locked, no documented fix | Correctness (historical) | 2019, CNI/iptables firewall errors on Fedora/Debian riscv64 VMs |
| n/a (blog-reported, not filed) | aardvark-dns crash on Ubuntu-packaged riscv64 binary | Unfiled | Correctness | Resolved in the field by switching to Debian's aardvark-dns build (Simon Josefsson's blog) |
| n/a (blog-reported, not filed) | fuse-overlayfs mount failure without extra capabilities on riscv64 | Unfiled | Correctness | Resolved in the field with `CAP_SYS_ADMIN` + `/dev/fuse` + `--isolation chroot` workaround (Simon Josefsson's blog) |

## 12. Objections and Upstream Blockers

**No maintainer opposition to riscv64 as an architecture was found anywhere in this research.** Every riscv64-enabling PR (#3437, #19626, #25600, #25613, #28333) was reviewed and merged without controversy. The only friction documented is about **approach**, not acceptance: maintainer Luap99 explicitly preferred adding riscv64 to the existing cross-compile-only CI matrix over accepting free native RISC-V CI runners offered by the RISE Project (PR #28331 vs #28333), and that native-runner offer was declined.

**Organizational blocker:** `SUPPORT.md`'s two-tier policy is an explicit, stated decision to keep riscv64 (and every architecture besides amd64/arm64) in "best effort" status rather than natively-tested. This is a policy stance, not a technical blocker, and would require a deliberate maintainer decision to change, likely motivated by demonstrated native CI capacity (which was offered and declined) or growing distro/downstream demand.

**Technical blockers that are not Podman-authored:** the CRIU riscv64 port itself is the most consequential technical blocker in the dependency chain ([checkpoint-restore/criu#1702](https://github.com/checkpoint-restore/criu/issues/1702), open since 2021) and is outside Podman's control to fix directly.

**Acceptance probability for further riscv64 investment:** high for build/CI-only changes (precedent: five merged PRs, zero rejections), but institutionally capped below native-tested tier absent either a policy change or renewed RISE-runner engagement that was already offered once and declined.

## 13. Readiness Assessment

- **Color:** yellow (build-only-ci)
- **Release provider:** distro (Ubuntu 26.04 "resolute," universe/ports; Fedora RPM spec declares riscv64 but automated chroot build is unconfirmed) - no upstream (containers/podman) release provides riscv64 binaries, and RISE provides no release artifact for Podman
- **Justification:** Upstream CI builds riscv64 (a 14-architecture, compile-only `make cross` job in `ci.yml`, gated by a repository-name condition) but does not execute the test suite on riscv64, as confirmed by reading all 16 active workflow files and by Podman's own test-source comment stating riscv is "not in CI" (`test/e2e/info_test.go`, lines 254-255, [source](https://github.com/containers/podman/blob/main/test/e2e/info_test.go)). No upstream release artifact for riscv64 exists (v6.1.1 assets checked directly, [source](https://github.com/containers/podman/releases/tag/v6.1.1)). Independently, Ubuntu 26.04 ships an unpatched riscv64 build from vanilla upstream source ([packages.ubuntu.com](https://packages.ubuntu.com/search?keywords=Podman&suite=resolute&searchon=names&section=all)), which confirms the clean-distro-build distribution floor and corroborates the same yellow grade via a second, independent path.
- **Optimization level:** not applicable. Podman is not an optimization-purpose project (it has no numerics/SIMD/JIT hot path whose value proposition depends on architecture-specific tuning; see Section 4), so the Step 2 optimization modifier does not apply.
- **Pending work that could change the grade:** none currently open that would raise the grade. The one candidate path (native RISE RISC-V CI runners, offered in PR #28331) was explicitly declined by the maintainer team in March 2026 in favor of the now-also-deleted Cirrus cross-compile approach. Reopening that offer, or adding a riscv64 test-execution step to the existing `build-alt` job, would be the minimum change needed to reach blue. Issue #29711 (open, unit tests failing on riscv64) would need to be resolved before test execution could be safely enabled.

## 14. Investment Analysis

**What RISE has already done or funded for Podman: nothing.** No RISE blog post, no `riseproject-dev` GitHub repo, no RISE Working Group issue, and no funded RISE project (RPxxx) involves Podman. RISE's own CI/runner infrastructure documents Docker as its container runtime example, not Podman. The one RISE connection is institutional only (Red Hat, Podman's primary sponsor, is a RISE Premier member) and a one-time offer of free native RISC-V CI runners that was made by an outside contributor and declined by the maintainer team. This means the investment areas below are effectively unaddressed by any outside effort and would need to be sized from zero.

### 14.1 Functional Enablement
- Fix riscv64 in Podman's `emulatedArchitectures` list to close issue #27364 (`podman run --arch riscv64` under emulation).
- Diagnose and fix the `make -j1 localunit` failures on riscv64 (issue #29711); currently blocks safe enablement of any riscv64 test execution in CI.
- Track and, where feasible, contribute upstream to close the CRIU riscv64 port (checkpoint-restore/criu#1702) to make `podman checkpoint/restore` reliable on riscv64; this is a dependency-level fix, not a Podman-internal one.
- Verify and, if needed, fix the netavark/aardvark-dns and fuse-overlayfs field issues reported only in Simon Josefsson's blog (aardvark-dns crash on Ubuntu's packaged binary; fuse-overlayfs capability requirements), and get them filed and tracked as GitHub issues upstream.

### 14.2 Performance Optimization
Not applicable in the traditional sense: Podman has no SIMD/JIT/numerics hot path of its own. Any performance work would be at the level of its native dependencies (crun, runc, CRIU) rather than Podman's own Go code.

### 14.3 CI/CD Infrastructure
- Add a riscv64 test-execution step to the existing `build-alt` job (or a new job) once #29711 is fixed, closing the build-only gap that caps the grade at yellow.
- Remove or generalize the repository-name gate (`if: github.repository == 'podman-container-tools/podman'`) so the cross-build check reliably runs across forks/PRs [NEEDS VERIFICATION: exact current effect of this gate on the canonical repo].
- Revisit the declined RISE native-runner offer (PR #28331) as a path to native riscv64 test execution at effectively no infrastructure cost, given RISE already offers this capacity for free.
- Add riscv64 to `release-build-artifacts.yml` / `release.yml` so upstream, not just distros, publishes consumable riscv64 binaries.

### 14.4 Ecosystem Enablement
Not scored as a distinct workstream: Podman does not have a dependent package ecosystem in the sense of Section 10 (pip/npm/Maven consumers that must each be separately riscv64-enabled). The relevant "ecosystem" work is distro packaging automation: confirming/enabling Fedora's copr/koji chroot targets for riscv64 (currently absent from `.packit.yaml` despite the spec's `ExclusiveArch` including riscv64) and, longer term, getting Ubuntu's build promoted from universe/ports toward a first-party-equivalent status as upstream CI matures.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Fix `emulatedArchitectures` gap for riscv64 (#27364) | 1-2 | Podman upstream | High |
| Functional | Diagnose/fix `make -j1 localunit` riscv64 failures (#29711) | 1-3 | Podman upstream | High |
| Functional | File and track aardvark-dns/fuse-overlayfs field issues from blog reports as upstream GitHub issues, then fix | 1-2 | Podman upstream / netavark / fuse-overlayfs | Medium |
| Functional (dependency) | Contribute to CRIU riscv64 port (checkpoint-restore/criu#1702) | 4-8+ (external project, high uncertainty) | CRIU upstream, with possible sponsor contribution | Medium |
| CI/CD | Add riscv64 test execution to CI (post #29711 fix) | 2-4 | Podman upstream / sponsor engineering | High |
| CI/CD | Re-engage RISE for native riscv64 runner capacity | 0.5-1 (coordination only, infra already offered) | Sponsor / RISE liaison | Medium |
| CI/CD | Add riscv64 to official release artifact pipeline | 1-2 | Podman upstream | Medium |
| Distro/packaging | Confirm/enable Fedora copr/koji riscv64 chroot targets | 0.5-1 | Fedora packaging / sponsor engineering | Low |

## 15. Updates

(No updates yet - initial report dated 2026-09-11.)

## 16. References

- [containers/podman GitHub repository](https://github.com/containers/podman)
- [Podman homepage](https://podman.io/)
- [Issue #28329 - Add riscv64 to release artifacts and CI](https://github.com/containers/podman/issues/28329)
- [PR #28331 - ci: add non-blocking riscv64 build job using RISE runners (closed, unmerged)](https://github.com/containers/podman/pull/28331)
- [PR #28333 - ci: add riscv64 cross-compilation to Cirrus CI alt-arch matrix](https://github.com/containers/podman/pull/28333)
- [Commit 3743b9f806 - Goodbye Cirrus (deletes .cirrus.yml)](https://github.com/containers/podman/commit/3743b9f806)
- [PR #25600 - RPM: Add riscv64 to ExclusiveArch-es](https://github.com/containers/podman/pull/25600)
- [PR #25613 - [v5.4] RPM: Add riscv64 to ExclusiveArch-es (backport)](https://github.com/containers/podman/pull/25613)
- [PR #19626 - Add riscv64 support for cross compilation](https://github.com/containers/podman/pull/19626)
- [PR #3437 - build: allow to build without cgo on RISC-V](https://github.com/containers/podman/pull/3437)
- [Issue #3462 - Podman errors using CNI on Risc-V architecture](https://github.com/containers/podman/issues/3462)
- [Issue #27364 - [riscv64] Exec format error emulating Debian](https://github.com/containers/podman/issues/27364)
- [Issue #29711 - Tests fail on non-x86-64](https://github.com/containers/podman/issues/29711)
- [Issue #21595 - RISC-V: crun: bpf create '': Invalid argument](https://github.com/containers/podman/issues/21595)
- [test/e2e/info_test.go (riscv "not in CI" comment)](https://github.com/containers/podman/blob/main/test/e2e/info_test.go)
- [Podman v6.1.1 release page](https://github.com/containers/podman/releases/tag/v6.1.1)
- [checkpoint-restore/criu#1702 - Support for RISC-V](https://github.com/checkpoint-restore/criu/issues/1702)
- [opencontainers/runc#5166 - riscv64 CI/release support (closed, completed)](https://github.com/opencontainers/runc/issues/5166)
- [Ubuntu package search - Podman, suite=resolute (26.04 LTS)](https://packages.ubuntu.com/search?keywords=Podman&suite=resolute&searchon=names&section=all)
- [PyPI - podman package JSON](https://pypi.org/pypi/podman/json)
- [RISE GitLab wheel builder project (podman, 302-redirects to plain PyPI)](https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/podman/)
- [CNCF - Podman Container Tools project page](https://www.cncf.io/projects/podman-container-tools)
- [RISE Project members page](https://riseproject.dev/members/)
- [RISE Project blog - Announcing the RISE RISC-V Runners](https://riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github/)
- [RISE GitLab wheel_builder documentation](https://riseproject.gitlab.io/python/wheel_builder/)
- [risc-v-machines.readthedocs.io - Podman for RISCV64 install guide](https://risc-v-machines.readthedocs.io/en/latest/linux/podman/)
- [carlosedp/riscv-bringup - build-podman-env.md](https://github.com/carlosedp/riscv-bringup/blob/master/build-podman-env.md)
- [Simon Josefsson's blog - GitLab Runner with Rootless Privilege-less Podman on riscv64](https://blog.josefsson.org/2025/04/25/gitlab-runner-with-rootless-privilege-less-podman-on-riscv64/)
- [podman-container-tools/podman#28329 - third-party mirrored issue copy](https://github.com/podman-container-tools/podman/issues/28329)