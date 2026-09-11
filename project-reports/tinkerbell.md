---
title: Tinkerbell
parent: Project Reports
color: orange
dependencies:
  - name: golang.org/x/crypto
    relation: runtime-dependency
    criticality: critical
  - name: containerd
    relation: runtime-dependency
    criticality: critical
---

{% include dependency-graph.html slug="dependencies" subset="tinkerbell" %}

# Tinkerbell

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-09-08<br/>
**Readiness:** orange<br/>
**Scope:** RISC-V (riscv64/linux) support status for Tinkerbell<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

Tinkerbell (github.com/tinkerbell/tinkerbell, homepage [tinkerbell.org](https://tinkerbell.org/)) is a bare-metal provisioning engine written entirely in Go. It bundles four historically separate subsystems into one monorepo: Smee (DHCP/PXE/iPXE boot service), Tootles (metadata service), HookOS (in-memory OS used during provisioning), and Tink (the workflow/orchestration engine). It was accepted into the Cloud Native Computing Foundation (CNCF) at the Sandbox maturity tier on November 10, 2020, and remains at Sandbox (not Incubating or Graduated).

**Governance:** documented in `tinkerbell/org/GOVERNANCE.md` (referenced from the main repo README). Role ladder is Contributor to Member to Reviewer to Approver to Maintainer to Admin, escalating in tenure and PR-review requirements, decided by a consensus-seeking process rather than pure voting. Sponsorship guidance recommends (not mandates) sponsors from multiple member companies. In practice `.github/CODEOWNERS` and `.github/settings.yml` are both gated to a single owner, `@jacobweinstock`.

**Corporate backing:** dominated by Equinix. The project originated at Packet (acquired by Equinix, now Equinix Metal); lead maintainer Jacob Weinstock (~1,726 commits) and the next several highest-committing humans (Manuel Mendez ~420, Kelly Deng 160, Amy Tobey 111, Nahum Shalman 50) all carry Equinix/Packet email domains. AWS is the other significant corporate contributor (Aravind Ramalingam, ~56 commits, `@amazon.com`), consistent with AWS's EKS Anywhere using Tinkerbell/Cluster API Provider Tinkerbell (CAPT) for bare-metal provisioning. `docs/ADOPTERS.md` self-reports Colony (Konstruct.io), AWS EKS Anywhere, and Rackdog as production users, but this is not a formal sponsor tier.

**Community culture on new ports:** there is no written `PLATFORMS.md`/`SUPPORT.md` architecture-support policy anywhere in the repo or org. Architecture support is de facto defined by the Makefile's `GOARCH` targets and CI matrix, both of which currently cover only amd64 and arm64. There has never been any issue, PR, or commit in the `tinkerbell` org requesting or discussing a RISC-V port, so there is no documented stance, positive or negative, on adding one - the topic has simply never been raised.

## 2. Port History and Upstreaming Timeline

No RISC-V port exists and no genuine RISC-V enablement work has ever been attempted.

| Date | Event | Source |
|---|---|---|
| 2021-04-23 | Commit `37b0b4ac` (Manuel Mendez, Equinix) adds the literal string `arch: "riscv"` to a DHCP unit test as the example value for an explicitly **unrecognized/unsupported** architecture test case | [Local git history, commit 37b0b4ac](https://github.com/tinkerbell/tinkerbell) |
| 2021-10-11 | Commit `b63e4ade` (Jacob Weinstock) reverts the above, removing the string again | [Local git history, commit b63e4ade](https://github.com/tinkerbell/tinkerbell) |
| 2023-10-30 | Dependabot bump of `opencontainers/image-spec` (merged into `tinkerbell/tink#823`, pre-monorepo) quotes an upstream changelog line about riscv64 being added to the OCI image-spec architecture list - incidental, not Tinkerbell code | [commit ed313ca](https://github.com/tinkerbell/tinkerbell/commit/ed313caf642d939d0cfea8d6314d780149750227) |
| 2024-09-05 | Dependabot bump of `golang.org/x/sys` (merged into `tinkerbell/smee#513`, pre-monorepo) quotes an upstream changelog mentioning "cpu: add support for detecting RISC-V extensions" - incidental, Go stdlib only | [commit 2488c9e](https://github.com/tinkerbell/tinkerbell/commit/2488c9e740438d46cd3cf760b1621e5f18e14990) |
| 2025-05-07 | PR #157, `golang.org/x/sys` bump, quotes upstream riscv64 crypto-extension-detection changelog text; **closed unmerged**, superseded by Dependabot | [PR #157](https://github.com/tinkerbell/tinkerbell/pull/157) |
| 2026-05-28 | PR #775, `golang.org/x/sys` bump, quotes upstream "cpu: detect zbc extension on riscv64" changelog text; **merged**, first shipped in tag v0.24.0 | [PR #775](https://github.com/tinkerbell/tinkerbell/pull/775) |
| 2026-09-02 | PR #937, `golang.org/x/crypto` bump, quotes upstream "provide optimised assembly for riscv64" changelog text; **closed unmerged** | [PR #937](https://github.com/tinkerbell/tinkerbell/pull/937) |

All six items above are incidental: five are Dependabot Go-module version bumps whose PR bodies quote upstream changelog text that happens to mention riscv64 (Go stdlib CPU-feature detection or the OCI image-spec architecture list), and the sixth is a one-line test-fixture placeholder for an "unrecognized architecture" that was added and then reverted. None touch Tinkerbell's own source, build system, or CI. **There is no RISC-V port, in progress or completed, and nothing is upstream.**

## 3. Upstream Support Tier

No formal tier policy document exists. Architecture support is defined entirely by what the Makefile and `.github/workflows/ci.yaml` build and test.

| | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI builds | Yes | Yes (native `ubuntu-24.04-arm` runners) | No |
| CI tests | Yes | Yes | No |
| Release-blocking | Yes | Yes | N/A |
| Official binaries | Yes (`tinkerbell-embedded-linux-amd64`, container images) | Yes (`tinkerbell-embedded-linux-arm64`, container images) | No |

Source: [`.github/workflows/ci.yaml`](https://github.com/tinkerbell/tinkerbell/blob/main/.github/workflows/ci.yaml) and [`.github/workflows/ipxe.yaml`](https://github.com/tinkerbell/tinkerbell/blob/main/.github/workflows/ipxe.yaml), read directly at HEAD `733792cc0e07ba01b7ae82eae989c5935537ddda`; `Makefile` GOARCH targets.

## 4. Technical Architecture and RISC-V-Specific Subsystems

Tinkerbell has no architecture-specific subsystems for any target, riscv64 included. It is a pure-Go application (no cgo; `CGO_ENABLED=0` per the Makefile) with no JIT, no SIMD, no hand-written assembly, and no compute kernels of its own. Code-search confirmed zero `.S` assembly files, zero `arch/riscv/`-style directories, and zero build-tagged per-architecture Go files (`*_amd64.go`, `*_arm64.go`, `*_riscv64.go`) anywhere in the repository - "architecture support" in this codebase means exclusively which `GOARCH` values the Makefile cross-compiles.

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Hand-tuned assembly / SIMD | None (not applicable to this project type) | None | None |
| JIT | None | None | None |
| Crypto acceleration | Delegated to stdlib/BMC libs | Delegated to stdlib/BMC libs | Delegated to stdlib/BMC libs (would work if built) |
| Build target exists | Yes | Yes | No |

The absence of RISC-V-specific code is consistent with the project's nature (an orchestration/provisioning tool, not a numerics or codec library) rather than being a gap specific to RISC-V - amd64 and arm64 equally have no such code, they simply have a build target and CI coverage that riscv64 lacks.

## 5. Build System, Cross-Compilation, and Toolchain

Tinkerbell is a pure Go project (`go.mod` requires Go 1.26.3); there is no CMake, no C/C++ compiler requirement, and no `BUILDING.md`/`INSTALL.md`. Build system is `make` wrapping `go build`.

- **Current build targets:** only `GOARCH=amd64` and `GOARCH=arm64` are defined in the `Makefile` (`out/tinkerbell-linux-amd64`, `out/tinkerbell-linux-arm64`, equivalent `-embedded-` and `tink-agent-` variants). No `riscv64` target exists to invoke.
- **Container images:** built via `docker buildx` with `docker/setup-qemu-action@v4` in CI, but QEMU is invoked generically ("Add support for more platforms with QEMU (optional)") and is only ever exercised for the amd64/arm64 matrix already defined - no riscv64 platform string appears anywhere in the workflow.
- **Dockerfiles** (`Dockerfile.tinkerbell`, `Dockerfile.agent`) are architecture-parametrized via `TARGETOS`/`TARGETARCH` build args and would in principle accept `riscv64` if a matching `out/tinkerbell-linux-riscv64` binary existed, but no such binary is ever produced.
- **Known build failures on riscv64:** none documented, because no riscv64 build has ever been attempted upstream.
- **To add riscv64 support**, work would need to start with a `GOARCH=riscv64` target in the `Makefile` and a corresponding CI matrix leg - there is currently no groundwork for it anywhere in the `tinkerbell` org.

Source: [`Makefile`](https://github.com/tinkerbell/tinkerbell/blob/main/Makefile), [`.github/workflows/ci.yaml`](https://github.com/tinkerbell/tinkerbell/blob/main/.github/workflows/ci.yaml) lines 327-330, `Dockerfile.tinkerbell`/`Dockerfile.agent` (root of repo).

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Capability | amd64 | arm64 | riscv64 |
|---|---|---|---|
| `tinkerbell` server binary | Yes | Yes | No |
| `tink-agent` binary | Yes | Yes | No |
| Embedded (single-binary) build | Yes | Yes | No |
| Container images | Yes | Yes (native runner) | No |
| iPXE boot binaries (`ipxe.efi`, `undionly.kpxe`, `snp-*.efi`) | Yes (x86_64) | Yes | No |
| IANA-architecture-to-iPXE-binary mapping table (`docs/technical/smee/IPXE_ARCH_MAP.md`) | Covers x86 BIOS/UEFI | Covers ARM32/64 UEFI incl. Raspberry Pi netboot, plus legacy (Itanium, Alpha, Xscale) | No riscv64 entry |

**Functional gap:** a riscv64 machine cannot run the Tinkerbell control-plane binaries at all (nothing to build or download), and cannot be *provisioned as a target* either, since Smee's iPXE architecture map has no riscv64 entry and HookOS (the in-memory provisioning OS) ships no riscv64 image. Note the map is user-overridable at runtime via `--ipxe-override-arch-mapping` without a code change, so the mechanism is designed to be extensible, but Tinkerbell itself does not ship a riscv64 iPXE binary, agent binary, or container image to point that override at.

**Performance gap:** not applicable - there is no riscv64 build to benchmark, and no SIMD/vectorized hot path exists in this project for any architecture.

**Security hardening gap:** not evaluable - no riscv64 build exists to assess.

**NaN/floating-point semantics:** not applicable to this project's domain (bare-metal provisioning orchestration, no numerics).

## 7. CI/CD Infrastructure

No riscv64 CI exists, in any form (build-only, test, or otherwise), on any trigger. Verified by directly reading the only two GitHub Actions workflow files in the repo, and by confirming the absence of `.gitlab-ci.yml`, `.cirrus.yml`, and any `Jenkinsfile`.

- **`.github/workflows/ci.yaml`** (`on: push` to `main`/`v**` tags, and every `pull_request`): `build-embedded-binaries` matrix is exactly `goarch: amd64` and `goarch: arm64` (two entries). `build-container-images`/`build-publish-container-images` `runs-on` matrix is `ubuntu-latest` (amd64) and `ubuntu-24.04-arm` (native arm64 hardware runner, no QEMU emulation used for either). `build-binaries` runs `make cross-compile[-agent]` with no arch axis of its own; whatever architectures result come from the Makefile (amd64/arm64 only).
- **`.github/workflows/ipxe.yaml`** (`on: push` to `main`, path-filtered): builds `snp-arm64.efi`, `snp-x86_64.efi`, `ipxe.efi`, `undionly.kpxe`, `ipxe.iso`, `ipxe-efi.img` - x86_64 and arm64 only.
- A repo-wide `grep -rniE "riscv"` across the entire checkout (code, CI, docs, Makefile) returned zero matches.
- No RISE RISC-V runners are referenced anywhere in the workflows or org.

| | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI builds | Yes | Yes | No |
| CI tests | Yes | Yes | No |
| Native hardware runner | No (ubuntu-latest, x86_64 cloud VM) | Yes (`ubuntu-24.04-arm`) | N/A |
| Release-blocking | Yes | Yes | N/A |

Source: [`.github/workflows/ci.yaml`](https://github.com/tinkerbell/tinkerbell/blob/main/.github/workflows/ci.yaml), [`.github/workflows/ipxe.yaml`](https://github.com/tinkerbell/tinkerbell/blob/main/.github/workflows/ipxe.yaml), local clone at HEAD `733792cc0e07ba01b7ae82eae989c5935537ddda`, fetched fresh 2026-09-08.

## 8. Distribution and Release Status

No riscv64 binary, package, or artifact exists for Tinkerbell (the bare-metal provisioning project) on any channel checked.

| Channel | Result |
|---|---|
| GitHub Releases (v0.23.0-v0.25.0) | Only `tinkerbell-embedded-linux-amd64` and `tinkerbell-embedded-linux-arm64` published; no riscv64 asset in any checked release |
| Ubuntu 26.04 "resolute" | No `tinkerbell` package exists at all, for any architecture ("Sorry, your search gave no results" on [packages.ubuntu.com](https://packages.ubuntu.com/search?keywords=Tinkerbell&suite=resolute&searchon=names&section=all)) |
| Arch Linux RISC-V port | Not listed on [archriscv.felixc.at](https://archriscv.felixc.at/?q=tinkerbell) |
| PyPI | The `tinkerbell` PyPI package (v0.2.0) is an unrelated pure-Python project sharing the name by coincidence; ships only `py3-none-any` wheels and sdist - architecture-independent, no compiled artifact, and not the bare-metal provisioning project |
| RISE Python wheel builder | The GitLab package-registry query for `tinkerbell` redirects to plain PyPI (no RISE-built entry exists) |
| OCI container images | amd64 and arm64 platform tags only (confirmed via CI matrix; no `linux/riscv64` platform string anywhere) |

**What a user must do to get a working binary today:** nothing works - there is no supported path to run Tinkerbell on riscv64. A user would need to add a `GOARCH=riscv64` target to the Makefile, add a CI/build recipe, cross-compile the `tinkerbell` and `tink-agent` binaries themselves, build a riscv64 container image locally, and separately solve the HookOS/iPXE riscv64-provisioning-target gap (Section 6) before Tinkerbell could provision a riscv64 machine at all.

## 9. Dependencies

Tinkerbell is a pure-Go project (Go 1.26.3, `CGO_ENABLED=0`); dependencies are Go modules, not distro-packaged C/C++ libraries, so most rows below have no Ubuntu apt package to check against the project graph.

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Community/blocking issues |
|---|---|---|---|---|---|
| Go toolchain (`go 1.26.3`) | Compiler/runtime | Yes - native `GOARCH=riscv64` since Go 1.14; found in Ubuntu 26.04 riscv64 (`golang-go`) | Mostly green, but one active regression | Official Go releases ship riscv64 binaries | Open: [golang/go#81175](https://github.com/golang/go/issues/81175) (linker relocation-offset failure on coverage-instrumented `TestScript/cover_atomic_pkgall` builds, opened 2026-08-27); active builder-flakiness tracking in #79067-#79069, #80880 |
| `bytedance/sonic` v1.15.0 (indirect, via gin's JSON codec) | JIT JSON encode/decode | Falls through to pure-Go `compat.go` path on riscv64 (JIT gated to amd64/arm64 only) - builds and runs, no JIT acceleration | No riscv64-specific issues found | Library only | None found |
| `twitchyliquid64/golang-asm` v0.15.1 (indirect) | sonic's JIT assembler | Not compiled into a riscv64 build of sonic at all | N/A | N/A | Effectively inert on riscv64 |
| `klauspost/compress` v1.19.1 (indirect) | zstd/s2/flate compression | Compiles via pure-Go fallback; no riscv64 asm | No riscv64 signal in issues | Library only | None found |
| `klauspost/cpuid/v2` v2.3.0 (indirect) | CPU feature detection | Explicit riscv64 support: `detect_riscv64.go`, `os_linux_riscv64.go`, `riscv_isa.go` | No issues found | Library only | None |
| `golang.org/x/crypto` v0.55.0 (direct) | TLS/SSH/crypto | Builds via generic `mac_noasm.go` fallback path (poly1305) | No riscv64-specific issues | Library only | None found |
| `golang.org/x/arch` v0.22.0 (indirect) | Instruction-encoding tables | Dedicated `riscv64/` disassembler package exists | No issues found | Library only | None |
| `go.etcd.io/bbolt` v1.5.0 (indirect, embedded etcd) | mmap-based KV store | Uses `golang.org/x/sys/unix` mmap syscalls with riscv64 support | No riscv64 signal, positive or negative | Library only | None found |
| `pierrec/lz4/v4` v4.1.26 (indirect) | LZ4 compression | No dedicated asm for riscv64 or arm64; falls back to Go | No riscv64-specific issues | Library only | None found - correctness fine, no SIMD speedup |
| `quic-go/quic-go` v0.59.1 (indirect) | QUIC/HTTP3 transport | No data found either way | No data found | Library only | Unverified rather than proven-good |
| `containerd/containerd/v2` v2.3.4 (direct) | Container/OCI/CNI plumbing | Release-class architecture since v1.6.8 (2022-05-03), release binaries ship; found in Ubuntu 26.04 riscv64 (`containerd`) | **Not CI-tested** - tracking issue open | Release binaries ship for riscv64 today | Open: [containerd/containerd#13020](https://github.com/containerd/containerd/issues/13020) (opened 2026-03-12, riscv64 not yet in CI matrix); open PR #13124 working to add it |

**Summary:** the dependency stack is essentially riscv64-clean at the source level - every performance-sensitive dependency examined (sonic's JIT, klauspost's compression/cpuid, x/crypto, lz4) degrades gracefully to a portable Go implementation on riscv64 rather than failing to build, and none showed a riscv64 blocking issue in its own tracker. The two real gaps are structural and project-level, not dependency-level: (1) Tinkerbell's own Makefile/CI has no riscv64 target at all, and (2) containerd, the one dependency with actual OS distribution and a project-graph hit, ships riscv64 release binaries but still lacks CI test coverage (open issue #13020) - the main residual risk in the transitive stack, should Tinkerbell ever add a riscv64 build.

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| N/A | No riscv64 issues exist in `tinkerbell/tinkerbell` or `tinkerbell/tink` | N/A | N/A | Confirmed via `search_issues`/`search_pull_requests` for `riscv`, `riscv64`, `RISC-V` scoped to both repos - zero results |
| [golang/go#81175](https://github.com/golang/go/issues/81175) | riscv64 linker "J-type instruction relocation offset" failure on coverage-instrumented builds | Open (as of 2026-08-27) | Transitive/toolchain | Would only matter if Tinkerbell's own CI ever adds `-coverprofile` on a riscv64 build |
| [containerd/containerd#13020](https://github.com/containerd/containerd/issues/13020) | riscv64 not yet in containerd's CI test matrix despite shipping release binaries | Open (opened 2026-03-12) | Transitive dependency risk | PR #13124 (open) working to close this |

No correctness bugs, NaN/floating-point bugs, or performance bugs specific to Tinkerbell-on-RISC-V exist anywhere, because no RISC-V enablement work for Tinkerbell itself has ever been attempted - there is nothing to have a bug in yet.

## 12. Objections and Upstream Blockers

**Stated objections:** none found. There is zero recorded community discussion (no issues, PRs, or commits) requesting or discussing a RISC-V port anywhere in the `tinkerbell` org. This is not evidence of resistance - the topic appears never to have been raised at all.

**Technical blockers:** none identified beyond the absence of groundwork - no `GOARCH=riscv64` Makefile target, no CI matrix leg, no riscv64 entry in the iPXE architecture map (`docs/technical/smee/IPXE_ARCH_MAP.md`), and no riscv64 HookOS image. The dependency stack itself (Section 9) presents no blocking issue.

**Organizational blockers:** the project's single-owner CODEOWNERS/settings gating (`@jacobweinstock`) means any new architecture target would need that maintainer's buy-in; there is no evidence of an existing relationship with RISE, Equinix, or AWS around RISC-V that would create organizational pressure to add it.

**Acceptance probability:** [NEEDS VERIFICATION] - cannot be assessed from available evidence since no proposal has ever been made. The project does demonstrate willingness to support new architectures generically (the iPXE arch-map is user-overridable at runtime without code changes, and arm64 was added as a first-class native-runner target alongside amd64), which is a positive signal for extensibility, but this is inference, not a stated position.

## 13. Readiness Assessment

- **Color:** orange (no upstream CI)
- **Release provider:** none - no upstream, distro, RISE, or third-party riscv64 release exists for Tinkerbell on any channel checked (Section 8)
- **Optimization gap:** N/A - Tinkerbell is not an optimization-purpose project. It is a bare-metal provisioning/orchestration tool with no JIT, SIMD, or compute-kernel hot paths of its own (Section 4); running it on RISC-V with only generic Go code would deliver its full stated value, so the Step 2 optimization modifier does not apply.
- **Justification:** Tinkerbell has no upstream riscv64 CI - both GitHub Actions workflow files (`ci.yaml`, `ipxe.yaml`) define build matrices limited to `amd64` and `arm64` only, with zero occurrences of "riscv" anywhere in the repository tree. There is also no distribution floor to apply: Tinkerbell is not packaged by Ubuntu, Debian, Fedora, or Arch Linux RISC-V on any architecture, so there is no clean-distro-build or downstream-only signal to lift the grade above the base "no upstream CI" case. Per the color model's Step 1 table, no upstream CI plus no distro package plus no confirmed breakage places this project at orange (not yellow, since there is no unpatched distro build to apply the floor; not red, since nothing is confirmed broken - riscv64 has simply never been attempted).
- **Pending work that could change the grade:** none identified. No open PR or issue in the `tinkerbell` org proposes riscv64 support, and no RISE blog post, working group, funded project (RFP/RP-series), or runner/provisioning infrastructure references or uses Tinkerbell in any way - the only appearance of "Tinkerbell" anywhere in the `riseproject-dev` GitHub org is as an un-actioned candidate name in this reporting queue itself.

## 14. Investment Analysis

RISE has not funded, discussed, or otherwise touched Tinkerbell in any capacity (Section 13). All work items below start from zero prior art and are sized on that basis.

### 14.1 Functional Enablement

- Add `GOARCH=riscv64` cross-compile targets to `Makefile` for `tinkerbell`, `tink-agent`, and the embedded binary variants.
- Add a riscv64 leg to `build-embedded-binaries` and `build-container-images`/`build-publish-container-images` in `.github/workflows/ci.yaml`, most likely via QEMU emulation initially (no native riscv64 GitHub-hosted runner exists today, unlike the native `ubuntu-24.04-arm` used for arm64).
- Add a riscv64 entry to `docs/technical/smee/IPXE_ARCH_MAP.md` and confirm/build a riscv64 iPXE binary (`snp-riscv64.efi` or equivalent) in `.github/workflows/ipxe.yaml` - required before Tinkerbell can provision a riscv64 *target* machine, not just run its own control plane on riscv64.
- Build/verify a riscv64 HookOS image, since the in-memory provisioning OS used during workflows is a separate artifact not covered by the Tinkerbell binary build alone. [NEEDS VERIFICATION: HookOS build process was not directly researched in this pass.]
- Validate the dependency stack (Section 9) compiles cleanly end-to-end on riscv64; expected low-risk given every checked dependency degrades to a portable Go path, but containerd's lack of riscv64 CI coverage (`containerd/containerd#13020`) means its riscv64 behavior is unverified upstream and should be smoke-tested directly.

### 14.2 Performance Optimization

Not applicable. Tinkerbell has no SIMD/JIT/compute-kernel hot paths for any architecture (Section 4); there is no optimization work to size beyond what generic Go compilation already provides.

### 14.3 CI/CD Infrastructure

- Stand up riscv64 CI, initially via QEMU emulation matching the existing generic `docker/setup-qemu-action@v4` setup already present in the workflow (currently unused for any riscv64 target).
- Evaluate RISE RISC-V runners (referenced in RISE's own blog series, e.g. "Announcing the RISE RISC-V Runners" and "RISE RISC-V Runners: Six Weeks In" - see Section 16) as a lower-latency alternative to QEMU emulation once functional enablement lands, to bring riscv64 CI to native-hardware parity with the existing `ubuntu-24.04-arm` arm64 runners.
- Add riscv64 to the release-blocking matrix only after test execution (not just build) is confirmed working, to avoid the yellow-tier "build-only" ceiling.

### 14.4 Ecosystem Enablement

Not applicable - Section 10 is omitted per the report format rules. Tinkerbell is a standalone Go application/tool with no dependent package ecosystem (no PyPI/npm/Maven consumers building against it) that would require separate riscv64 enablement.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Add `GOARCH=riscv64` Makefile targets (tinkerbell, tink-agent, embedded variants) | 0.5-1 | Upstream maintainer or contributor PR | Critical |
| Functional | Add riscv64 CI matrix leg (build + test) via QEMU | 1-2 | Upstream maintainer or contributor PR | Critical |
| Functional | Add riscv64 entry to IPXE_ARCH_MAP.md and build riscv64 iPXE binary | 1-2 | Upstream maintainer or contributor PR | High |
| Functional | Build/verify riscv64 HookOS image | 1-3 (unverified scope) | Upstream maintainer or contributor PR | High |
| Functional | Validate dependency stack end-to-end on riscv64 (esp. containerd given open #13020) | 0.5-1 | Contributor PR | Medium |
| CI/CD | Evaluate/adopt RISE RISC-V runners for native-hardware CI | 0.5-1 | Contributor PR + RISE coordination | Medium |
| Release | Publish riscv64 release binaries and container images once CI is green | 0.5 | Upstream maintainer | Medium |

## 15. Updates

(No updates yet - initial report dated 2026-09-08.)

## 16. References

- [tinkerbell/tinkerbell repository](https://github.com/tinkerbell/tinkerbell)
- [Tinkerbell homepage](https://tinkerbell.org/)
- [`.github/workflows/ci.yaml`](https://github.com/tinkerbell/tinkerbell/blob/main/.github/workflows/ci.yaml)
- [`.github/workflows/ipxe.yaml`](https://github.com/tinkerbell/tinkerbell/blob/main/.github/workflows/ipxe.yaml)
- [Makefile](https://github.com/tinkerbell/tinkerbell/blob/main/Makefile)
- [PR #937 - bump golang.org/x/crypto 0.54.0 to 0.55.0](https://github.com/tinkerbell/tinkerbell/pull/937)
- [PR #775 - bump golang.org/x/sys 0.44.0 to 0.45.0](https://github.com/tinkerbell/tinkerbell/pull/775)
- [PR #157 - bump golang.org/x/sys 0.32.0 to 0.33.0](https://github.com/tinkerbell/tinkerbell/pull/157)
- [Commit 2488c9e - bump golang.org/x/sys 0.24.0 to 0.25.0 (originally tinkerbell/smee#513)](https://github.com/tinkerbell/tinkerbell/commit/2488c9e740438d46cd3cf760b1621e5f18e14990)
- [Commit ed313ca - bump opencontainers/image-spec 1.1.0-rc4 to 1.1.0-rc5 (originally tinkerbell/tink#823)](https://github.com/tinkerbell/tinkerbell/commit/ed313caf642d939d0cfea8d6314d780149750227)
- [tinkerbell/tinkerbell PR #513 (current, unrelated EMBEDDED.md doc PR)](https://github.com/tinkerbell/tinkerbell/pull/513)
- [tinkerbell/tinkerbell PR #823 (current, unrelated Mergify merge-queue PR)](https://github.com/tinkerbell/tinkerbell/pull/823)
- [docs/technical/smee/IPXE_ARCH_MAP.md](https://github.com/tinkerbell/tinkerbell/blob/main/docs/technical/smee/IPXE_ARCH_MAP.md)
- [docs/ADOPTERS.md](https://github.com/tinkerbell/tinkerbell/blob/main/docs/ADOPTERS.md)
- [Ubuntu 26.04 "resolute" package search for Tinkerbell](https://packages.ubuntu.com/search?keywords=Tinkerbell&suite=resolute&searchon=names&section=all)
- [Arch Linux RISC-V port package index](https://archriscv.felixc.at/?q=tinkerbell)
- [PyPI tinkerbell package JSON](https://pypi.org/pypi/tinkerbell/json)
- [RISE Python wheel-builder GitLab package registry query for tinkerbell](https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/tinkerbell/)
- [golang/go#81175 - riscv64 linker relocation-offset failure on coverage builds](https://github.com/golang/go/issues/81175)
- [containerd/containerd#13020 - riscv64 not yet in CI test matrix](https://github.com/containerd/containerd/issues/13020)
- [RISE Project blog](https://riseproject.dev/blog)
- [RISE Project homepage](https://riseproject.dev/)
- [RISE blog - Announcing the RISE RISC-V Runners](https://riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github/)
- [RISE blog - RISE RISC-V Runners: Six Weeks In](https://riseproject.dev/2026/05/12/rise-risc-v-runners-six-weeks-in/)
- Local clone used for source inspection: `/home/user/tinkerbell/tinkerbell` (shallow clone, HEAD `733792cc0e07ba01b7ae82eae989c5935537ddda`, fetched 2026-09-08)
