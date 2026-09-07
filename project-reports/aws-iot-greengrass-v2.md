---
title: AWS IoT Greengrass v2
parent: Project Reports
color: red
---

# AWS IoT Greengrass v2

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Readiness:** red<br/>
**Scope:** RISC-V (riscv64/linux) support status for AWS IoT Greengrass v2<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

AWS IoT Greengrass v2 is Amazon's edge-runtime product for deploying and managing IoT applications ("components") on customer devices, with two active codebases under the `aws-greengrass` GitHub org:

- [`aws-greengrass-nucleus`](https://github.com/aws-greengrass/aws-greengrass-nucleus) - the classic runtime, a pure Java/Maven application (1,597 commits since 2019-07-09). This is the artifact this report grades, since it is the product actually marketed as "AWS IoT Greengrass v2" at [aws.amazon.com/greengrass](https://aws.amazon.com/greengrass/).
- [`aws-greengrass-lite`](https://github.com/aws-greengrass/aws-greengrass-lite) - a newer, from-scratch C reimplementation of the same V2 IPC protocol for constrained devices (1,363 commits). Referenced here only where it materially affects the riscv64 story for Greengrass v2, since it is a separate codebase.

**Governance:** No foundation affiliation (no CNCF/Linux Foundation/Eclipse), no charter, no MAINTAINERS/OWNERS/CODEOWNERS file, no technical steering committee, in either repo. License is Apache-2.0 on both. Governance is de facto single-vendor.

**Corporate sponsorship:** Amazon is the sole corporate backer. Commit-author-domain analysis: `aws-greengrass-nucleus` is 709 `amazon.com` + 1 `amazon.de` commits versus 173 `gmail.com` and 85 `norquay.com` (the personal domain of James Gosling, an AWS engineer at the time of those commits); `aws-greengrass-lite` is 1,212 `amazon.com` + 37 `amazon.de` of 1,363 total commits (over 91%). No other named corporation (Google, Red Hat, Arm, Qualcomm, SiFive) contributes commits to either repo.

**RISE membership:** AWS/Amazon/Greengrass does not appear on the [RISE Project members list](https://riseproject.dev/) (Premier: Alibaba Damo, Google, MediaTek, NVIDIA, Qualcomm, Red Hat, SiFive, Tenstorrent; General: Akeana, Andes, Beijing ESWIN, Beijing Institute of Open Source Chip, Canonical, Douyin Vision, ISCAS, Microchip, NextSilicon, Quintauris, SpacemiT, ZTE).

**Community culture on new ports:** New architecture support in the related `aws-greengrass-lite` codebase was added by a single Amazon engineer (Thomas Roos) with no visible public issue/PR discussion, external contributor involvement, or RFC process. The pattern is engineer-initiated, internally-reviewed, and not community-solicited or foundation-vetted (see Section 2).

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| N/A | No riscv64 commit, PR, or issue of any kind exists in `aws-greengrass-nucleus` at any point in its history | [full commit-log search, zero hits](https://github.com/aws-greengrass/aws-greengrass-nucleus) |
| 2025-11-12 | First riscv64 commit in the related `aws-greengrass-lite` repo: "Add support for RISC-V 64 architecture," commit `9a629a8`, author Thomas Roos (`throos@amazon.de`) | `aws-greengrass-lite` git history |
| 2025-11-26 | Same author adds a defensive caveat commit, "README.md: add some warning about RISCV support" (commit `03c3924`) | `aws-greengrass-lite` git history |
| 2025-07-23 | `aws-crt-cpp: workaround compile failure for qemuriscv64` merged in the Yocto meta-layer, fixing a `R_RISCV_JAL` relocation-truncation link error via static linking | [meta-aws PR #13066](https://github.com/aws4embeddedlinux/meta-aws/pull/13066) |
| 2025-12-03 | `build-test-recipe.yml: enable greengrass-lite for riscv testing` - turns on riscv64 CI testing specifically for greengrass-lite (not classic Nucleus) | [meta-aws PR #14364](https://github.com/aws4embeddedlinux/meta-aws/pull/14364) |
| 2026-01-20 | `aws-sdk-cpp: enable RISCV 64 support` merged | [meta-aws PR #14746](https://github.com/aws4embeddedlinux/meta-aws/pull/14746) |
| 2026-01-22 | `enable-riscv-tests` master PR merged; explicitly marks `greengrass-bin` (classic Nucleus) and `corretto-bin` (the JVM Nucleus requires) as "incompatible with RISC-V" | [meta-aws PR #14801](https://github.com/aws4embeddedlinux/meta-aws/pull/14801) |
| 2026-01-27 | `maven: fix NOT compatible with RISCV` - narrows a `COMPATIBLE_HOST:riscv64 = "null"` restriction to `COMPATIBLE_MACHINE`, unblocking riscv64 as a Yocto SDK build host (not as a Maven target package) | [meta-aws PR #14840](https://github.com/aws4embeddedlinux/meta-aws/pull/14840) |
| 2026-05-14 | `aws-greengrass-lite` benchmark-harness PR explicitly lists riscv64 as "out of scope" for official resource-limit measurement | [aws-greengrass-lite PR #1117](https://github.com/aws-greengrass/aws-greengrass-lite/pull/1117) |

**Key contributors:** Thomas Roos (Amazon, `amazon.de`) authored essentially all riscv64-related work across both `aws-greengrass-lite` and the `aws4embeddedlinux/meta-aws` Yocto layer. Mengtan Ge (Amazon, `amazon.com`) authored the benchmark-harness PR that excludes riscv64. No external (non-Amazon) contributor is involved anywhere in this history.

**Is it fully upstream?** No, for two independent reasons. First, for classic Nucleus (`aws-greengrass-nucleus`, the actual "Greengrass v2" product), there is no port at all - zero commits, zero code. Second, even the riscv64 enablement that exists is confined to the C rewrite (`aws-greengrass-lite`) and to a downstream Yocto meta-layer, is flagged "Experimental (not fully tested)" in the `aws-greengrass-lite` README, is limited to the `master-next` Yocto branch, and every attempted backport to stable Yocto release branches (`kirkstone-next`, `scarthgap-next`, `walnascar-next`/`whinlatter-next`) failed on cherry-pick conflicts.

## 3. Upstream Support Tier

No formal, written tier policy exists (no PLATFORMS.md/SUPPORT.md/docs/platforms/ in either repo). The de facto tiering, inferred from CI, documentation, and release evidence:

- **Tier 1 (documented, CI-tested where CI exists, benchmarked):** x86_64, aarch64, armv7l.
- **Tier 2 / not supported (classic Nucleus):** riscv64 has zero code, zero CI, zero documentation, and is explicitly marked "incompatible with RISC-V" in AWS's own Yocto meta-layer ([meta-aws PR #14801](https://github.com/aws4embeddedlinux/meta-aws/pull/14801)).
- **Tier "experimental" (Greengrass Lite only, a different codebase):** riscv64 compiles and runs but is excluded from official CI test matrices, the Nix flake's supported systems, and the official benchmark/resource-limit publication ([aws-greengrass-lite PR #1117](https://github.com/aws-greengrass/aws-greengrass-lite/pull/1117)).

### Comparison: amd64 vs arm64 vs riscv64 (aws-greengrass-nucleus)

| Architecture | Upstream CI | Official binaries | Documented support | Notes |
|---|---|---|---|---|
| amd64/x86_64 | Yes (`ubuntu-latest`, `windows-latest`) | No dedicated arch binary (pure Java jar/installer) | Yes | Default JVM target |
| arm64/aarch64 | No (all workflows run on `ubuntu-latest`/`windows-latest`, i.e. x86_64) | No dedicated arch binary | Yes (per AWS docs) | Runs on any JVM despite no CI coverage |
| riscv64 | No | None | Not mentioned anywhere in AWS documentation | Explicitly marked "incompatible with RISC-V" downstream ([meta-aws PR #14801](https://github.com/aws4embeddedlinux/meta-aws/pull/14801)) |

## 4. Technical Architecture and RISC-V-Specific Subsystems

Nucleus is a pure-Java control-plane application (Maven, `src/main/java/com/aws/greengrass/...`) with no JIT, no SIMD, no hand-written assembly, and no native codegen of its own - the JVM abstracts the CPU ISA away. There is exactly one architecture-aware source file in the entire codebase:

**`src/main/java/com/aws/greengrass/config/PlatformResolver.java`** (293 lines; arch-detection logic in `getArchInfo()` lines 137-152 and `getArchDetailInfo()` lines 154-175):

```java
private static String getArchInfo() {
    String arch = System.getProperty("os.arch").toLowerCase();
    if ("x86_64".equals(arch) || "amd64".equals(arch)) {
        return ARCH_AMD64;
    }
    if ("i386".equals(arch) || "x86".equals(arch)) {
        return ARCH_X86;
    }
    if (arch.contains("arm")) {
        return ARCH_ARM;
    }
    if ("aarch64".equals(arch)) {
        return ARCH_AARCH64;
    }
    return UNKNOWN_KEYWORD;   // riscv64 falls through here
}
```

This function is used only for component-manifest platform matching (choosing which recipe variant to deploy) - metadata string matching, not code generation. There is no riscv branch; a riscv64 JVM (`os.arch=riscv64`) resolves to `"unknown"`, so any component recipe with architecture-specific manifest entries fails to match/deploy on a riscv64 Nucleus instance.

### Comparison table: amd64 vs arm64 vs riscv64 (Nucleus architecture handling)

| Architecture | Dedicated source files | Detection branch | Result |
|---|---|---|---|
| amd64/x86_64 | 0 (shared `PlatformResolver.java`) | `x86_64`/`amd64` -> `ARCH_AMD64` | Full platform-manifest matching |
| arm64/aarch64 | 0 (shared `PlatformResolver.java`) | `aarch64` -> `ARCH_AARCH64`, plus ARM sub-variant detection (`SUPPORTED_ARM_ARCH_DETAILS`) | Full platform-manifest matching |
| riscv64 | 0 | None - falls through to `UNKNOWN_KEYWORD` | Manifest matching fails; not a partial stub, a complete absence of a RISC-V code path |

Since this is a JVM control-plane and not a compute/SIMD library, the full/partial/minimal/absent optimization rubric (Step 2 of the color model) does not apply in the ISA-extension sense - see Section 13 for why this project is not classified as optimization-purpose.

## 5. Build System, Cross-Compilation, and Toolchain

`aws-greengrass-nucleus` builds with `mvn install` (JDK 8+) and has no `CMakeLists.txt`, `Dockerfile`, or toolchain files - it is architecture-independent at the build-tool level and requires no cross-compilation, since there is no native compilation step.

**Practical blocker is not the build system but the runtime.** Per [meta-aws PR #14801](https://github.com/aws4embeddedlinux/meta-aws/pull/14801), the Yocto recipe for `corretto-bin` (Amazon's JVM distribution, Nucleus's required runtime) is marked incompatible with riscv64 because Amazon Corretto ships no riscv64 binaries. `greengrass-bin` is marked incompatible for the stated reason: "AWS does not provide pre-built Greengrass binaries for this architecture." There is no cmake/Dockerfile/toolchain file to document for Nucleus itself because the blocker sits one layer down, at binary distribution of its JVM dependency.

**QEMU usage:** None found for Nucleus. In the separate `aws-greengrass-lite` repo, QEMU appears only via `docker/setup-qemu-action@v3` in `.github/workflows/deb-packaging-multi-arch.yml`, used for armv7/aarch64 emulation on x86_64 runners - riscv64 is absent from every matrix entry in that workflow [NEEDS VERIFICATION - this is describing a different repo than the graded project, included here for context on the sibling codebase].

**Known build failures (sibling codebase, for context):** `aws-crt-cpp` (a C++ analog of the same AWS Common Runtime that Nucleus's Java dependency `aws-crt-java` wraps) hit a documented riscv64 link error - `relocation truncated to fit: R_RISCV_JAL against symbol 'AES_set_encrypt_key'` - fixed by forcing static linking ([meta-aws PR #13066](https://github.com/aws4embeddedlinux/meta-aws/pull/13066)). No equivalent fix has been applied to `aws-crt-java` itself (see Section 9).

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Capability | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Nucleus runs at all | Yes | Yes | No - no JVM binary available (Corretto has no riscv64 build) |
| Platform-manifest arch matching | Yes (`ARCH_AMD64`) | Yes (`ARCH_AARCH64`) | No - falls through to `UNKNOWN_KEYWORD` |
| Cloud MQTT/TLS connectivity (`aws-crt-java`) | Yes (prebuilt JNI `.so`) | Yes (prebuilt JNI `.so`) | No - no riscv64 classifier exists; enablement PR closed unmerged in 2023 |
| Native syscall/telemetry (JNA/oshi) | Yes | Yes | Available in principle - JNA ships official riscv64 binaries since 5.13.0, but untested with Nucleus specifically |
| Official binary/installer | Yes | Yes | No |

**Functional gap:** Complete - Nucleus cannot run on riscv64 today because its required JVM (Corretto) has no riscv64 binary and its cloud-connectivity native dependency (`aws-crt-java`) has no riscv64 build.

**Performance gap:** Not applicable - there is no working riscv64 deployment to benchmark against amd64/arm64. No performance data exists in any channel searched (GitHub, AWS docs, RISE blog, academic literature).

**Security hardening gap:** Not applicable for the same reason - no riscv64-specific TLS/crypto stack (`aws-lc`, `s2n-tls`) has landed; see Section 9.

**NaN/floating-point semantics issues:** None found or applicable - Nucleus is a pure-Java control plane with no numeric kernels; the related `aws-greengrass-lite` C codebase's only documented riscv64 correctness issue is unrelated to floating point (an unaligned-atomics bus-error bug in a KVS dependency, fixed by forcing `ALIGNED_MEMORY_MODEL=ON`, per [meta-aws PR #14801](https://github.com/aws4embeddedlinux/meta-aws/pull/14801)).

## 7. CI/CD Infrastructure

**No riscv64 CI exists for `aws-greengrass-nucleus`.** Verified by cloning the repository (commit `ba8bfc47e24b07bfb64a2daee55f0da96291b6ee`) and reading all five workflow files in full, plus a repo-wide `grep -rni "riscv"` returning zero matches:

| File | Trigger | Runner(s) | riscv references |
|---|---|---|---|
| `codeql.yml` | `pull_request` (all branches), `schedule` (cron `34 1 * * 5`) | `ubuntu-latest` | none |
| `externalPR.yml` | `workflow_run` (after "Java CI" completes) | `ubuntu-latest` | none |
| `flakeFinder.yaml` | `push` to `main` | `ubuntu-latest` | none |
| `maven.yml` (name: "Java CI") | `push` to `main`/tags, `pull_request` | matrix: `ubuntu-latest`, `windows-latest` | none |
| `otfUats.yaml` | `pull_request` | matrix: `ubuntu-latest` (delegates to AWS CodeBuild `NucleusUatCodeBuildLinux`) | none |

No `.gitlab-ci.yml`, `Jenkinsfile`, or `.cirrus.yml` exist in the repository. No QEMU emulation, no cross-compilation targets, no riscv64 runners, and no RISE runner references anywhere.

### Comparison table: amd64 vs arm64 vs riscv64 CI

| Architecture | Build | Test | Release-blocking |
|---|---|---|---|
| amd64/x86_64 | Yes (`ubuntu-latest`, `windows-latest`) | Yes | Yes |
| arm64/aarch64 | No (no ARM runner in any workflow) | No | No |
| riscv64 | No | No | No |

For the sibling `aws-greengrass-lite` repo (a different codebase), riscv64 was added to a Yocto downstream build/test matrix ([meta-aws PR #14364](https://github.com/aws4embeddedlinux/meta-aws/pull/14364)), but this is not `aws-greengrass-nucleus` CI and does not affect this project's grade. No RISE-hosted RISC-V CI runners are used anywhere in this history.

## 8. Distribution and Release Status

**GitHub releases:** Checked v2.18.3, v2.18.2, v2.18.1, v2.18.0, v2.17.0 at [aws-greengrass-nucleus/releases](https://github.com/aws-greengrass/aws-greengrass-nucleus/releases). Every release has exactly two assets - `<tag>.zip` and `<tag>.tar.gz` - GitHub's auto-generated source archives only. No prebuilt binaries of any kind for any architecture; consistent with Nucleus being installed via a Java installer/JAR rather than per-architecture native artifacts. No filename contains "riscv" in any checked release.

**PyPI:** [`https://pypi.org/pypi/aws-iot-greengrass-v2/json`](https://pypi.org/pypi/aws-iot-greengrass-v2/json) returns HTTP 404 - no such package exists under this name at all (Greengrass is not distributed as a PyPI wheel).

**Ubuntu 26.04 (resolute):** [packages.ubuntu.com search](https://packages.ubuntu.com/search?keywords=AWS%20IoT%20Greengrass%20v2&suite=resolute&searchon=names&section=all) returns no matching package.

**Arch Linux RISC-V port:** No matching package found on `archriscv.felixc.at` [NEEDS VERIFICATION - client-side search JS could not be executed by the fetch tooling used, so this is inconclusive rather than a hard negative].

**RISE wheel builder:** N/A - redirects to the same nonexistent PyPI package.

**What a user must do to get a working binary today:** Nothing works. There is no official riscv64 build, no distro package, and per the Yocto meta-layer's own `greengrass-bin` recipe, the build is explicitly excluded because the required JVM (Corretto) has no riscv64 binary. A user would need to (a) obtain or build an alternative riscv64 JVM, (b) resolve the unmerged `aws-crt-java`/`s2n-tls` riscv64 native-library gap (Section 9), and (c) manually assemble and test the Nucleus jar against that stack - none of which is documented or supported by AWS.

## 9. Dependencies

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Community status |
|---|---|---|---|---|---|
| Amazon Corretto (JVM) | Required runtime for Nucleus | No riscv64 binaries | N/A | Not released | Marked incompatible with RISC-V in Yocto meta-layer ([meta-aws PR #14801](https://github.com/aws4embeddedlinux/meta-aws/pull/14801)) |
| `aws-crt-java` (`software.amazon.awssdk.crt:aws-crt` v0.45.0) | JNI wrapper for AWS Common Runtime (MQTT/HTTP/TLS to IoT Core) | Not found in Maven Central artifacts | None found | Not released for riscv64 | Enablement [PR #283](https://github.com/awslabs/aws-crt-java/pull/283) opened Feb 2021, tested on SiFive Unmatched, closed unmerged Aug 2023; no successor PR found |
| `s2n-tls` (statically linked in aws-crt) | TLS implementation | No official build; Alpine community package exists independently | Not in upstream CI matrix | Not released upstream | [PR #2619](https://github.com/aws/s2n-tls/pull/2619) opened Feb 2021, 2 approvals, closed unmerged Mar 2022 after conflicting with an unrelated refactor; no successor PR found |
| `aws-lc` (crypto backend, via `aws-lc-rs`) | libcrypto/libssl replacement | Partial: `riscv64gc-unknown-linux-gnu` supported for glibc target; musl target fails | Included in `aws-lc-rs` CI for gnu target only | No pregenerated riscv64 `aws-lc-sys` bindings ([aws-lc-rs#874](https://github.com/aws/aws-lc-rs/issues/874)) | Open ask, unresolved for musl; no dedicated riscv64 CI in the C library's own pipeline |
| JNA / JNA-Platform (v5.13.0) | Native syscall bridge (used directly and via `oshi-core`) | Official riscv64 native binary shipped since 5.13.0 | Ubuntu ports build implies distro-level CI; upstream JNA riscv64 CI unconfirmed | Released - Ubuntu 26.04 (resolute) carries `libjna-java`/`libjna-jni` 5.15.0-1build1 riscv64 | Known glibc >=2.34 coupling ([jna#1557](https://github.com/java-native-access/jna/issues/1557)); not a blocker on modern Ubuntu |
| `oshi-core` (v6.4.4) | Native system/hardware info via JNA | Not packaged separately; rides on JNA's riscv64 support | No dedicated CI evidence | Released via Maven Central (pure-Java jar) | Inherits any JNA riscv64 gaps |
| Bouncy Castle (`bcpkix-jdk15on` v1.70) | Certificate/PKCS handling | Pure Java, arch-independent | N/A | Fully available (`libbcpkix-java` 1.80-3 in Ubuntu 26.04, arch:all) | Not a riscv64 risk |
| Jackson (`jackson-databind`, `jackson-dataformat-yaml`) | JSON/YAML serialization | Pure Java, arch-independent | N/A | Fully available (`libjackson2-databind-java` in Ubuntu 26.04) | Not a riscv64 risk |
| Apache HttpClient (via AWS SDK v2) | HTTP transport | Pure Java | N/A | Fully available | Not a riscv64 risk |

**Deep-dive - the gating chain:** The dependency chain that actually blocks riscv64 support is `aws-crt-java -> s2n-tls -> aws-lc`, the AWS Common Runtime native stack used for MQTT/TLS to IoT Core. All three components had RISC-V enablement PRs opened as early as 2021; all were closed unmerged between 2022 and 2023, with no documented replacement effort since ([aws-crt-java#283](https://github.com/awslabs/aws-crt-java/pull/283), [s2n-tls#2619](https://github.com/aws/s2n-tls/pull/2619)). By contrast, the JNA/oshi native-syscall path is materially healthier - JNA has shipped official riscv64 binaries since 5.13.0 and Ubuntu 26.04 independently packages a riscv64 build.

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| N/A | No riscv64-related issue or PR exists in `aws-greengrass-nucleus` | N/A | N/A | Confirmed by GitHub issue/PR/commit search returning zero results across every query variant tried (`riscv`, `riscv64`, `risc-v`) |
| [aws-crt-java#283](https://github.com/awslabs/aws-crt-java/pull/283) | "support for RISC-V architecture" | Closed, unmerged (Aug 2023) | Blocking (critical dependency) | Opened Feb 2021, tested on SiFive Unmatched; maintainer asked for a fresh PR, none followed |
| [s2n-tls#2619](https://github.com/aws/s2n-tls/pull/2619) | "RISC-V Architecture Support" | Closed, unmerged (Mar 2022) | Blocking (critical dependency) | 2 approvals but conflicted with an unrelated SIKE_r2->SIKE_r3 refactor that deleted the touched files |
| [aws-lc-rs#874](https://github.com/aws/aws-lc-rs/issues/874) | riscv64 `aws-lc-sys` bindings / musl build failures | Open | Medium | gnu target works, musl does not; no dedicated riscv64 CI in aws-lc's own pipeline |
| [jna#1557](https://github.com/java-native-access/jna/issues/1557) | glibc >=2.34 dependency for riscv64 `.so` | Reported | Low | Minor compatibility footgun on older riscv64 base images; not blocking on modern distros |

**Correctness bugs:** None found for Nucleus itself - there is no code path to be incorrect on riscv64 because none exists. The one adjacent correctness bug found (in the separate `aws-greengrass-lite`/dependency chain) is an unaligned-atomics bus error in the Amazon KVS SDK, fixed via `ALIGNED_MEMORY_MODEL=ON` gating ([meta-aws PR #14801](https://github.com/aws4embeddedlinux/meta-aws/pull/14801)) - not part of Nucleus's own codebase.

## 12. Objections and Upstream Blockers

**Stated objections:** AWS's own Yocto embedded-Linux meta-layer explicitly marks `greengrass-bin` (classic Nucleus) "incompatible with RISC-V," with the stated reason "AWS does not provide pre-built Greengrass binaries for this architecture" ([meta-aws PR #14801](https://github.com/aws4embeddedlinux/meta-aws/pull/14801)).

**Technical blockers:**
1. Amazon Corretto (the JVM Nucleus requires) publishes no riscv64 binaries - a build-blocking dependency with no riscv64 port.
2. `aws-crt-java` (native MQTT/TLS connectivity to IoT Core) has no riscv64 build; its enablement PR was closed unmerged in 2023 with no successor.
3. `s2n-tls` (TLS implementation underlying aws-crt) has no riscv64 build; its enablement PR was closed unmerged in 2022, killed by an unrelated refactor, with no successor.
4. `aws-lc`/`aws-lc-rs` musl-target riscv64 builds fail; only the glibc target is covered, and only in a downstream Rust wrapper's CI, not the C library's own pipeline.

**Organizational blockers:** Single-vendor governance with no foundation, no CODEOWNERS, and no external-contributor pathway visible in this history; all riscv64-adjacent work (in the separate `aws-greengrass-lite` codebase) was done by one Amazon engineer with no public RFC or issue discussion. No RISE membership, funding, or blog coverage exists for this project.

**Acceptance probability:** Low in the near term for classic Nucleus specifically. The blocking dependencies (Corretto, aws-crt-java, s2n-tls) are AWS-controlled and have shown no sustained riscv64 investment since 2021-2023 enablement attempts were abandoned. The only active riscv64 momentum in the Greengrass family is in the architecturally separate `aws-greengrass-lite` C rewrite, which is itself labeled "Experimental (not fully tested)" and confined to unreleased Yocto branches.

## 13. Readiness Assessment

- **Color:** red
- **Release provider:** none
- **Justification:** `aws-greengrass-nucleus` has zero riscv64 code, zero riscv64 CI (verified by reading all five GitHub Actions workflow files, all running only on `ubuntu-latest`/`windows-latest` x86_64), and zero riscv64 releases (only GitHub auto-generated source archives exist for any architecture). More decisively, AWS's own Yocto embedded-Linux meta-layer explicitly marks this exact artifact ("greengrass-bin") "incompatible with RISC-V" because its hard dependency, Amazon Corretto (the JVM), publishes no riscv64 binaries - a build-blocking dependency with no riscv64 port, which meets the red bar of confirmed non-functionality per an explicit, technically-grounded upstream-adjacent statement ([meta-aws PR #14801](https://github.com/aws4embeddedlinux/meta-aws/pull/14801)). This is not classified as architecture-independent (Step 0 green) despite Nucleus being pure Java bytecode, because its required JVM runtime and its critical native cloud-connectivity dependency (`aws-crt-java`) both lack riscv64 support in practice - it does not "run on riscv64 by construction."
- **Optimization purpose:** Not applicable. Nucleus is a control-plane orchestration runtime, not a performance-differentiated library (no SIMD, JIT, or hand-tuned kernels of its own); the optimization-gap modifier does not apply, and no `Optimization level` is reported.
- **Pending work that could change the grade:** The related `aws-greengrass-lite` C rewrite has active, if experimental, riscv64 enablement (README-flagged "Experimental," excluded from official CI test matrix and benchmarks) and a chain of merged Yocto meta-layer PRs from Jul 2025 to Jan 2026 (#13066, #14364, #14746, #14801, #14840) - all authored by a single Amazon engineer, all confined to `master-next`, with every backport to stable Yocto branches failing on cherry-pick conflicts. Should AWS choose to converge classic Greengrass v2 onto the Lite runtime, or should Corretto/`aws-crt-java`/`s2n-tls` gain riscv64 support, the grade for the Greengrass v2 product line could improve - but none of that work currently targets `aws-greengrass-nucleus` itself, and no open PR or issue tracks it.

## 14. Investment Analysis

RISE has done no work on this project: it is not a RISE member, has no RISE blog coverage, no RISE-funded engineering, and no RISE benchmark data ([riseproject.dev/blog](https://riseproject.dev/blog), 33 posts scanned, none Greengrass-related; [riseproject.gitlab.io wheel builder](https://riseproject.gitlab.io/python/wheel_builder/), 87 packages, none Greengrass-related). All sizing below is therefore new work, not a discount on existing RISE investment.

### 14.1 Functional Enablement

The floor requirement is a working riscv64 JVM (Corretto or an OpenJDK riscv64 build) plus a functioning `aws-crt-java` native library on riscv64. The latter requires reviving and completing the `aws-crt-java` -> `s2n-tls` -> `aws-lc` chain, each of which has an unmerged 2021-2023 enablement attempt to restart from rather than begin from scratch.

### 14.2 Performance Optimization

Not applicable in the traditional SIMD/kernel sense - Nucleus is a pure-Java control plane. Any performance work would be JVM-level (interpreter/JIT performance on riscv64), which is outside this project's own codebase and depends on upstream OpenJDK/Corretto riscv64 maturity, not on Nucleus changes.

### 14.3 CI/CD Infrastructure

Adding a riscv64 job to the existing five-workflow GitHub Actions setup (`maven.yml`) is low effort once a working riscv64 JVM and native dependency stack exist; the blocker is functional enablement (14.1), not CI plumbing.

### 14.4 Ecosystem Enablement

Not applicable as a standalone section (see note on Section 10 below) - Nucleus's "ecosystem" is AWS-published component recipes, which are configuration/manifest data, not a package registry requiring separate riscv64 builds.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Add riscv64 to `PlatformResolver.java` (`ARCH_RISCV64` constant, `getArchInfo()`/`getArchDetailInfo()` branches) | 1 | Nucleus maintainers | Critical (prerequisite for any manifest matching, but not sufficient alone) |
| Functional | Restart and land `aws-crt-java` riscv64 native build ([revive PR #283](https://github.com/awslabs/aws-crt-java/pull/283)) | 6-10 | AWS CRT team | Critical |
| Functional | Restart and land `s2n-tls` riscv64 support ([revive PR #2619](https://github.com/aws/s2n-tls/pull/2619)), rebased past the SIKE refactor | 4-8 | AWS s2n team | Critical |
| Functional | Fix `aws-lc`/`aws-lc-rs` riscv64 musl build ([aws-lc-rs#874](https://github.com/aws/aws-lc-rs/issues/874)) | 3-5 | AWS crypto team | High |
| Functional | Secure or build a riscv64 Corretto JVM distribution | 8-12 | Amazon Corretto team | Critical |
| CI/CD | Add riscv64 job (build + test) to `maven.yml` once a working JVM/native stack exists | 1-2 | Nucleus maintainers | Medium (gated by functional work) |
| Distribution | Publish riscv64 installer/JAR bundle to match x86_64/aarch64/armv7l release process | 1-2 | Nucleus maintainers | Medium (gated by functional work) |

## 15. Updates

(No updates yet - initial report dated 2026-06-17.)

## 16. References

- [aws-greengrass/aws-greengrass-nucleus (GitHub repository)](https://github.com/aws-greengrass/aws-greengrass-nucleus)
- [AWS IoT Greengrass homepage](https://aws.amazon.com/greengrass/)
- [aws-greengrass-nucleus releases](https://github.com/aws-greengrass/aws-greengrass-nucleus/releases)
- [aws-greengrass-nucleus PlatformResolver.java](https://github.com/aws-greengrass/aws-greengrass-nucleus/blob/main/src/main/java/com/aws/greengrass/config/PlatformResolver.java)
- [aws-greengrass-nucleus .github/workflows/codeql.yml](https://github.com/aws-greengrass/aws-greengrass-nucleus/blob/main/.github/workflows/codeql.yml)
- [aws-greengrass-nucleus .github/workflows/externalPR.yml](https://github.com/aws-greengrass/aws-greengrass-nucleus/blob/main/.github/workflows/externalPR.yml)
- [aws-greengrass-nucleus .github/workflows/flakeFinder.yaml](https://github.com/aws-greengrass/aws-greengrass-nucleus/blob/main/.github/workflows/flakeFinder.yaml)
- [aws-greengrass-nucleus .github/workflows/maven.yml](https://github.com/aws-greengrass/aws-greengrass-nucleus/blob/main/.github/workflows/maven.yml)
- [aws-greengrass-nucleus .github/workflows/otfUats.yaml](https://github.com/aws-greengrass/aws-greengrass-nucleus/blob/main/.github/workflows/otfUats.yaml)
- [aws-greengrass/aws-greengrass-lite (GitHub repository)](https://github.com/aws-greengrass/aws-greengrass-lite)
- [aws-greengrass-lite PR #1117 - benchmark harness and resource-limits documentation](https://github.com/aws-greengrass/aws-greengrass-lite/pull/1117)
- [meta-aws PR #13066 - aws-crt-cpp qemuriscv64 compile workaround](https://github.com/aws4embeddedlinux/meta-aws/pull/13066)
- [meta-aws PR #14364 - enable greengrass-lite for riscv testing](https://github.com/aws4embeddedlinux/meta-aws/pull/14364)
- [meta-aws PR #14746 - aws-sdk-cpp enable RISCV 64 support](https://github.com/aws4embeddedlinux/meta-aws/pull/14746)
- [meta-aws PR #14801 - enable-riscv-tests master PR](https://github.com/aws4embeddedlinux/meta-aws/pull/14801)
- [meta-aws PR #14840 - maven fix NOT compatible with RISCV](https://github.com/aws4embeddedlinux/meta-aws/pull/14840)
- [aws-crt-java PR #283 - support for RISC-V architecture (closed unmerged)](https://github.com/awslabs/aws-crt-java/pull/283)
- [s2n-tls PR #2619 - RISC-V Architecture Support (closed unmerged)](https://github.com/aws/s2n-tls/pull/2619)
- [aws-lc-rs issue #874 - riscv64 aws-lc-sys bindings / musl build](https://github.com/aws/aws-lc-rs/issues/874)
- [java-native-access/jna issue #1557 - glibc 2.34 dependency for riscv64](https://github.com/java-native-access/jna/issues/1557)
- [PyPI aws-iot-greengrass-v2 (404, package does not exist)](https://pypi.org/pypi/aws-iot-greengrass-v2/json)
- [Ubuntu 26.04 (resolute) package search - no match](https://packages.ubuntu.com/search?keywords=AWS%20IoT%20Greengrass%20v2&suite=resolute&searchon=names&section=all)
- [RISE Project blog](https://riseproject.dev/blog)
- [RISE Project homepage and members list](https://riseproject.dev/)
- [RISE Python wheel builder](https://riseproject.gitlab.io/python/wheel_builder/)