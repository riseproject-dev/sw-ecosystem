---
title: clusterfuzz
---

# clusterfuzz

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Scope:** RISC-V (riscv64/linux) support status for clusterfuzz<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

ClusterFuzz ([google/clusterfuzz](https://github.com/google/clusterfuzz)) is a Python (plus Go and Node.js) scalable fuzzing infrastructure: an App Engine web UI paired with a cloud-orchestrated bot fleet that runs fuzzing engines against target projects, triages crashes, and manages bug lifecycle. It is the execution backend for OSS-Fuzz, Google's free continuous-fuzzing service for open-source projects. It is not itself a fuzzing engine, compiler, or runtime; it is a job-scheduling and infrastructure-orchestration control plane.

**Governance.** ClusterFuzz has no foundation affiliation. It is not part of the Linux Foundation, OpenSSF, or any neutral governance body; [google.github.io/clusterfuzz](https://google.github.io/clusterfuzz/) contains no charter, TSC, or foundation reference. License is Apache-2.0. The entire repository is owned by a single GitHub team, `@google/clusterfuzz`, per CODEOWNERS, with no MAINTAINERS/OWNERS file and no per-subsystem maintainer split. CONTRIBUTING.md requires a Google CLA (`cla.developers.google.com`) and adherence to "Google's Open Source Community Guidelines," a corporate-controlled contribution gate rather than a community-governed one.

**Corporate sponsors and maintainers.** All top contributors are Google employees or Google-affiliated, confirmed via GitHub profile company fields:

| Contributor | Commits | Company |
|---|---|---|
| jonathanmetzman | 912 | Google |
| oliverchang (Oliver Chang) | 787 | Google (DeepMind); co-founder of OSS-Fuzz, founder of OSV.dev |
| inferno-chromium (Abhishek Arya) | 667 | Google |
| mbarbella-chromium | 162 | Chromium/Google-affiliated |
| Dor1s (Max Moroz) | 104 | now Instacart (historically Google/OSS-Fuzz) |

There is no second corporate co-maintainer with committer standing. This contrasts with multi-vendor governed projects (LLVM, Linux kernel). Repository metadata shows 91 open issues at time of research; the repo is not archived, default branch `master`.

**Community culture on new architectures.** The project's track record on non-x86_64 architecture requests, even for ARM64 (a far more mature target than RISC-V), is thin engagement followed by stale-bot closure: issue [#1753](https://github.com/google/clusterfuzz/issues/1753) (ARM/QEMU support request, open 3.5 years, closed with an explicit policy statement rejecting emulation), [#3495](https://github.com/google/clusterfuzz/issues/3495) (ARM memory-tagging hardware request, one maintainer reply then auto-closed stale), and [#4856](https://github.com/google/clusterfuzz/issues/4856) (ARM dev-environment request, zero maintainer response despite two explicit "don't close" pleas, auto-closed stale). Full detail in Section 12. No RISC-V equivalent of any of these issues has ever been filed.

## 2. Port History and Upstreaming Timeline

There is no RISC-V port, and no milestone to report. Exhaustive search across GitHub issue search, PR search (state-filtered issue search, which covers PRs), commit search, and code search for the terms `riscv`, `riscv64`, `risc-v`, and `rv64` all returned zero results in `google/clusterfuzz`. A full manual dump of all 4,534 PRs (open, closed, and merged, paginated) in the repository's history was also searched client-side for "risc"/"rv64" substrings and matched zero titles. Branch names (300 branches) were also checked with zero matches.

| Date | Event | Source |
|---|---|---|
| N/A | No RISC-V-related commit, PR, issue, or code reference exists in this repository's history | GitHub search/issues, search/prs, search/commits, search/code, all `repo:google/clusterfuzz`, zero results across all query variants |

**Key contributors with RISC-V work:** none exist, because no RISC-V work exists.

**Is it fully upstream?** Not applicable, there is nothing to upstream. No fork, branch, or external patchset targeting RISC-V for ClusterFuzz was found on GitHub (`search(query: "clusterfuzz riscv", type: REPOSITORY)` returned 0 repositories).

## 3. Upstream Support Tier

ClusterFuzz has no formal tiered-support document (no `PLATFORMS.md`). The de facto tier policy is a hard-coded architecture gate in `local/install_deps_linux.bash`:

```bash
# Check if the architecture is supported.
if ! uname -m | egrep -q "i686|x86_64"; then
  echo "Only x86 architectures are currently supported" >&2
  exit
fi
```

This line was introduced in the script's first version, commit `bd803b61` ("Make unit tests and dependency setup work on macOS," Oliver Chang, 2019-02-03), and is unchanged on current `master` (the file was last touched 2026-08-14 for an unrelated apt-package change). `docs/getting-started/prerequisites.md` restates it verbatim: "Note: Only x86 architectures are currently supported." Docker base images (`docker/base/Dockerfile`) only add the `i386` dpkg architecture; no multi-arch manifests exist anywhere in the repository.

| Aspect | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Host/dev environment supported | Yes, the only architecture accepted by `install_deps_linux.bash` | No, explicitly rejected; QEMU/emulation rejected in [#1753](https://github.com/google/clusterfuzz/issues/1753); no evidence of a completed native-hardware follow-through was found on GitHub; dev-environment request [#4856](https://github.com/google/clusterfuzz/issues/4856) closed unanswered | No, not mentioned anywhere in the codebase or issue tracker |
| CI runners | Yes, all 5 GitHub Actions workflows | Not found in any workflow | Not found in any workflow |
| Official GitHub release binaries | None, 0 assets on every release checked, any architecture | None | None |
| PyPI wheel | `py3-none-any` (universal, pure Python) | Same universal wheel | Same universal wheel |
| Packaging platform matrix (`src/local/butler/constants.py`) | Yes: `manylinux2014_x86_64`, `win_amd64`, `macosx_10_14_x86_64`/`macosx_10_12_x86_64` | Absent | Absent |
| Fuzzing target architecture (OSS-Fuzz `ARCHITECTURES` list, which gates what ClusterFuzz can build/run) | Yes, `x86_64` is the default | Yes, `aarch64` is listed | No, absent from `['i386', 'x86_64', 'aarch64']` |
| Formal tier/policy document | None; de facto tier enforced only by the hard-coded x86 check | None | None |

## 4. Technical Architecture and RISC-V-Specific Subsystems

ClusterFuzz's own codebase contains no JIT, no SIMD-dependent code, no cryptographic primitives, and no hand-written assembly for any instruction set. It is a Python/Go/JS orchestration service that invokes external fuzz targets and sanitizers rather than containing compiled, architecture-specific code paths of its own. `src/clusterfuzz/_internal/platforms/` contains only OS-level subdirectories (`android`, `chromeos`, `fuchsia`, `kubernetes`, `linux`, `mac`, `windows`), no `arch/` or ISA-named directories (no riscv, x86, arm, or aarch64 folders exist). There are no `.S` assembly files anywhere in the repository.

Four concrete architecture-relevant code artifacts do exist, and are the closest thing to "architecture-specific subsystems" in this project:

| Component | Purpose | amd64 | arm64 | riscv64 |
|---|---|---|---|---|
| `get_cpu_arch()` (`system/environment.py`) | Desktop/server CPU architecture detection for job-scheduling | Not implemented; returns `None` for all non-Android platforms, marked with a "FIXME: Add support for desktop architectures as needed" comment | Not implemented; same `None` fallback | Not implemented; same `None` fallback |
| `is_supported_cpu_arch_for_job()` (`bot/tasks/commands.py`) | Gates whether a bot accepts a fuzzing task per the job's `CPU_ARCH` field | No-op pass: `cpu_arch` is always `None` for desktop platforms, so the function unconditionally returns `True` | No-op pass, identical mechanism | No-op pass, identical mechanism; nothing in this gate would block a riscv64 bot from picking up work, but nothing recognizes it as riscv64 either |
| `is_valid_arch()` stack-symbolizer allowlist (`src/appengine/handlers/testcase_detail/show.py`, vendored from LLVM's `asan_symbolize.py`) | Recognizes an architecture string when symbolizing a crash address | Present: `"i386"`, `"x86_64"`, `"x86_64h"` | Present: `"arm"`, `"armv6"`, `"armv7"`, `"armv7s"`, `"armv7k"`, `"arm64"` | Absent from the 13-entry allowlist (which also includes `powerpc64`, `powerpc64le`, `s390x`, `s390`) |
| `guess_arch()` fallback (same file) | Guesses architecture from address-string length when not explicit | Only value ever returned (`x86_64` or `i386`) | Never returned | Never returned |
| Packaging `PLATFORMS` matrix (`src/local/butler/constants.py`) | Defines pip wheel platform tags built at release time | `manylinux2014_x86_64`, `win_amd64`, `macosx_10_14_x86_64` | Absent (arm64/aarch64 Linux is excluded too) | Absent |
| Android CPU-arch detection (`platforms/android/settings.py`) | Working implementation via `adb get_property('ro.product.cpu.abi')` | N/A, Android-specific path | Works, real Android arm64 devices as fuzzing targets | N/A; no riscv64 Android device target found in the fleet model |

Because `get_cpu_arch()` returns `None` for every non-Android platform, the practical implication is that a hypothetical riscv64 Linux bot would neither be blocked by, nor recognized by, ClusterFuzz's own scheduling code today, the gate is a pass-through no-op regardless of architecture. Separately, even if a riscv64 bot produced a crash, the stack symbolizer's `is_valid_arch()` allowlist does not include `riscv64`, so ClusterFuzz's own crash-symbolization code path would not recognize the architecture string. This is a concrete, currently-uncovered gap, not a stub or TODO specific to RISC-V, it simply was never added, the same way `arm64` was added to this specific list only because Android crash-fixture data required it.

Data not available: no JIT, SIMD, or cryptographic subsystem comparison applies, because none exist in this project's own code. Any such comparison belongs to the fuzzing engines ClusterFuzz drives (see Section 9) or to the individual OSS-Fuzz target projects being fuzzed, not to ClusterFuzz itself.

## 5. Build System, Cross-Compilation, and Toolchain

ClusterFuzz has no CMake build system, and no `BUILDING.md`, `docs/building.md`, or `docs/cross-compilation.md` (all return 404). The only "build" tooling is `butler.py`, a Python-based developer CLI, plus roughly 60 Dockerfiles under `docker/`. None of the Dockerfiles reference `riscv64`, `arm64`, or `aarch64` anywhere; they are plain `FROM ubuntu:20.04`/`ubuntu:24.04` with `apt-get install`, no `--platform` flags, no multi-arch `buildx` usage, only per-Ubuntu-version variants (`ubuntu-20-04.Dockerfile` / `ubuntu-24-04.Dockerfile`).

There is no cross-compilation mechanism of any kind in this project, not "riscv64 is unsupported among several cross-compile targets," but rather the project has no concept of a cross-compilation target at all: no `TARGET_ARCH` flag, no `-DUSE_X=OFF`-style build flag (there is no CMake to have such flags), and no QEMU usage for ClusterFuzz's own build or test process. The only QEMU references found in the repository are: (a) Fuchsia's `undercoat.py`, which manages `qemu-system-x86_64` processes as fuzzing-target test infrastructure, unrelated to cross-building ClusterFuzz itself, and (b) an unrelated syzkaller test fixture referencing `linux/arm64` as a fuzzing target platform.

The runtime architecture gate is `local/install_deps_linux.bash`, which exits immediately with "Only x86 architectures are currently supported" if `uname -m` does not match `i686|x86_64` (see Section 3 for the exact code and history).

Toolchain versions required, per the Docker images: Python 3.11.4 (built from source), OpenJDK 17 (plus 15 for legacy Jazzer targets), Node.js 20.x, Ruby 3.3.1, Go (latest, via `golang.org/doc/install`), and `patchelf` 0.9 (compiled from source, used for MemorySanitizer RPATH patching). None of these version pins are riscv64-specific; they are the generic x86_64 toolchain baseline for the project.

**Known build failures:** none are documented for riscv64, because no build attempt has ever been recorded (no issue, PR, or commit references an attempt). This is an absence of evidence, not evidence of a working build; the explicit x86-only exit in `install_deps_linux.bash` means a riscv64 build would fail at the very first dependency-installation step, before reaching any compiler invocation.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Native host execution of the ClusterFuzz bot/service stack | Yes | No, rejected as a host architecture; the only documented path forward (native GCE ARM instances, per the [#1753](https://github.com/google/clusterfuzz/issues/1753) closing comment) has no evidence of a completed, publicly tracked implementation | No |
| CPU_ARCH job-scheduling recognition | N/A, default pass-through | N/A, mechanism only implemented for Android | N/A, mechanism only implemented for Android; a riscv64 Linux bot would pass the gate unconditionally but would not be explicitly recognized |
| Crash stack-trace architecture symbolization | Yes (`is_valid_arch` allowlist) | Yes (`is_valid_arch` allowlist, though used in Android/test-fixture contexts, not as a host architecture) | No, absent from the allowlist |
| Official PyPI package | `py3-none-any` (universal) | Same universal wheel | Same universal wheel, no functional gap for this specific artifact since it is pure Python |
| Release build platform matrix | Included | Excluded | Excluded |
| Fuzzing target architecture (OSS-Fuzz `ARCHITECTURES`) | Included (default) | Included | Excluded, this is the structural blocker: OSS-Fuzz's own `infra/constants.py` declares `ARCHITECTURES = ['i386', 'x86_64', 'aarch64']`, so ClusterFuzz cannot build or run OSS-Fuzz targets for riscv64 regardless of any change to ClusterFuzz's own platform code |

**Performance gaps:** not applicable within ClusterFuzz's own codebase, since it has no SIMD-dependent or otherwise performance-sensitive compiled code of its own. Any performance-gap question shifts entirely to the fuzzing-engine layer it drives (libFuzzer/ASan riscv64 instrumentation gaps, detailed in Section 9) rather than to ClusterFuzz itself.

**Security hardening gaps:** the only security-hardening-adjacent architecture discussion found in the issue tracker is ARM Memory Tagging Extension (MTE) support, raised in [#3495](https://github.com/google/clusterfuzz/issues/3495) and blocked by lack of MTE-capable ARM server hardware. This is ARM-specific and unrelated to RISC-V; no RISC-V security-hardening topic (pointer masking, CFI, etc.) was found anywhere in the project.

**NaN / floating-point semantics:** Data not available. No research pass found or searched specifically for floating-point or NaN-payload semantic differences relevant to ClusterFuzz on riscv64. This is out of scope for ClusterFuzz's own code (it has no floating-point logic of its own); such a concern would apply to the individual fuzzed target projects, not to this repository.

## 7. CI/CD Infrastructure

No riscv64 CI exists. This was independently confirmed twice: once via full-content fetch and grep of all five GitHub Actions workflow files, and once via a repeat, independent pass fetching the same five files again and re-confirming zero matches.

| File | Trigger | Runner | Purpose | riscv lines found |
|---|---|---|---|---|
| `codeql-analysis.yml` | push/PR on `master` | `ubuntu-latest` | CodeQL static analysis, matrix over go/javascript/python | None |
| `kubernetes-e2e-tests.yaml` | `workflow_dispatch` only | `ubuntu-24.04` | Runs `./local/tests/kubernetes_e2e_test.bash` | None |
| `publish-to-pypi.yaml` | `release: published` | `ubuntu-latest` | Builds a wheel via `./build.sh`, publishes to PyPI | None |
| `staleness.yml` | hourly cron | `ubuntu-latest` | Closes stale issues/PRs (bot maintenance, not a build) | None |
| `tests.yaml` | `pull_request` | `ubuntu-24.04` | Runs `./local/tests/ci_tests.bash` | None |

No `.gitlab-ci.yml`, `Jenkinsfile`, `.cirrus.yml`, `.travis.yml`, `.circleci/` directory, or Azure Pipelines configuration exists anywhere in the repository. All jobs across all five workflows run on GitHub-hosted `ubuntu-latest`/`ubuntu-24.04` (x86_64) runners; there is no self-hosted runner, no QEMU/binfmt emulation step, no `linux/riscv64` platform string, and no architecture-based matrix dimension of any kind (CodeQL's only matrix axis is language: go/javascript/python).

| Aspect | amd64 | arm64 | riscv64 |
|---|---|---|---|
| GitHub Actions runners | `ubuntu-latest`/`ubuntu-24.04`, all 5 workflows | None found in any workflow | None found in any workflow |
| Self-hosted runners | None (all GitHub-hosted) | None | None |
| QEMU/emulation in CI | Not applicable | None; QEMU-based ARM support was explicitly rejected as an approach in [#1753](https://github.com/google/clusterfuzz/issues/1753) | None |
| Non-GitHub CI systems | Do not exist in this repo | Do not exist | Do not exist |
| RISE RISC-V Runners usage | Not applicable | Not applicable | None found; RISE announced a "RISE RISC-V Runners" free native-CI program on its blog (2026-03-24, [riseproject.dev](https://riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github/)), but no evidence this project has adopted it |
| Open architecture-adjacent CI/dev issue | N/A | [#5308](https://github.com/google/clusterfuzz/issues/5308), open: "docs: add Dev Containers CLI workflow and ARM64 workaround," docs/workaround level only, not integrated CI | None filed |

## 8. Distribution and Release Status

**GitHub Releases.** Every release checked, the 5 most recent (`v2.37.1`, `v2.37.0`, `v2.36.2`, `v2.36.1`, `v2.36.0`) plus 8 additional releases spot-checked across the project's history (`v2.16.0`, `v2.15.1`, `v2.24.0`, `v2.24.1`, `v2.24.2`, `v2.33.6`, `v2.33.8`, `v2.35.3`), has zero attached assets. This was independently re-confirmed for the 3 most recent releases in a second pass. ClusterFuzz has never published a binary release artifact on GitHub, for any architecture; it is deployed as an App Engine service plus a Python package, not distributed as downloadable OS/architecture-specific binaries.

**PyPI.** [pypi.org/pypi/clusterfuzz/json](https://pypi.org/pypi/clusterfuzz/json) confirms the latest version is 2.6.0, uploaded 2023-02-08, not yanked. All 18 wheel files across every historical version (0.0.1a0 through 2.6.0), plus every `.tar.gz` sdist, use the tag `py3-none-any`, pure Python, architecture-independent. No riscv64-specific filename exists because none is needed: the package ships no compiled extensions. It installs on riscv64 today via `pip install clusterfuzz` with no architecture-specific gap for this artifact.

**RISE wheel builder.** A request to the RISE GitLab package registry ([gitlab.com/api/v4/projects/56254198/packages/pypi/simple/clusterfuzz/](https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/clusterfuzz/)) 302-redirects straight to `pypi.org/simple/clusterfuzz/`, meaning RISE has not built or mirrored a dedicated wheel for this package; the fetch falls straight through to stock PyPI, which is expected since the package needs no architecture-specific build.

**Ubuntu 24.04 (noble).** [packages.ubuntu.com](https://packages.ubuntu.com/search?keywords=clusterfuzz&suite=noble&searchon=names&section=all) returns "Sorry, your search gave no results." ClusterFuzz is not packaged in Ubuntu at all, for any architecture; the riscv64 question is moot.

**Debian.** [tracker.debian.org/pkg/clusterfuzz](https://tracker.debian.org/pkg/clusterfuzz) returns HTTP 404. Cross-checked via [packages.debian.org](https://packages.debian.org/search?keywords=clusterfuzz&searchon=names&suite=all&section=all) (all suites, all sections, all architectures): "Sorry, your search gave no results." Also checked `sources.debian.org`'s search API, which returned `{"query":"clusterfuzz","results":{"exact":null,"other":[]}}`. No source package exists in Debian on any architecture.

**Arch Linux / Arch Linux RISC-V.** Official Arch Linux package search ([archlinux.org/packages/?q=clusterfuzz](https://archlinux.org/packages/?q=clusterfuzz)) returns "0 matching packages found." AUR RPC search returns `{"resultcount":0,"results":[]}`. Direct listing of the archriscv mirror's `core/os/riscv64/` and `extra/os/riscv64/` directories shows no clusterfuzz entries. Since archriscv is a rebuild of mainline Arch's existing package set, and clusterfuzz has zero presence in Arch's `core`/`extra`/`community` repositories for any architecture, it categorically cannot exist in the riscv64 rebuild either (proof by transitivity).

### Summary Table

| Channel | riscv64 present? | Notes |
|---|---|---|
| GitHub Releases | No | No release of any architecture has ever had binary assets |
| PyPI | Yes (universal) | Pure-Python `py3-none-any` wheel runs on any architecture including riscv64; no compiled extensions, so no arch-specific gap exists |
| RISE wheel builder (GitLab) | No | No RISE-built package exists; request redirects to stock PyPI |
| Ubuntu 24.04 (noble) | No | Package not in Ubuntu at all |
| Debian | No | Package not in Debian at all |
| Arch Linux / Arch Linux RISC-V | No | Not in Arch core/extra/AUR or the RISC-V port |

**What a user must do to get a working binary:** run `pip install clusterfuzz` on any architecture, including riscv64; this already works today because the package is pure Python. There is no OS-level package and no GitHub release binary to obtain for any architecture, so the "get a working binary" question only has an answer at the PyPI/pip layer.

## 9. Dependencies

| Dependency | Role in ClusterFuzz | riscv64 Build | riscv64 Test | riscv64 Release | Blocking Issues |
|---|---|---|---|---|---|
| **libFuzzer** (LLVM compiler-rt) | Primary fuzzing engine, driven via `bot/fuzzers/libFuzzer/engine.py`; most-used engine for OSS-Fuzz targets | Builds (RISC-V is an LLVM upstream target) | Degraded: LLVM issue [#156912](https://github.com/llvm/llvm-project/issues/156912) (open) marks libFuzzer+ASan tests `UNSUPPORTED` on RISC-V; ASan itself hits assertion failures on riscv64 with vector-extension code ([#164803](https://github.com/llvm/llvm-project/issues/164803), open) | Ships with LLVM/Clang riscv64 releases, with known instrumentation gaps | Coverage instrumentation (SanitizerCoverage) and ASan are both less reliable on riscv64 than x86_64/arm64; no dedicated tracking issue, follows the general LLVM RISC-V backend bug backlog (166+ open riscv64 issues in llvm/llvm-project) |
| **AFL++** (AFLplusplus) | Fuzzing engine, driven via `bot/fuzzers/afl/engine.py` | Builds | Historically broken, now fixed: LTO/persistent-mode test failures on riscv64 ([#2064](https://github.com/AFLplusplus/AFLplusplus/issues/2064), [#2145](https://github.com/AFLplusplus/AFLplusplus/issues/2145), [#2056](https://github.com/AFLplusplus/AFLplusplus/issues/2056)) were all closed/fixed; [#2712](https://github.com/AFLplusplus/AFLplusplus/issues/2712) added QEMU-based riscv64 CI and fixed remaining LTO issues (closed 2026-02) | No official prebuilt binaries (source-only project) | No open blocking issues found; riscv64 CI now exercised via QEMU |
| **honggfuzz** | Fuzzing engine, driven via `bot/fuzzers/honggfuzz/engine.py` | Builds; native `__riscv` ptrace/register support exists in `linux/trace.c` (`user_regs_64`, `epc` register handling) | No riscv64-specific issues found; zero open or closed riscv64 issues in the repository | No official prebuilt binaries (source-only) | None found; architecture support appears organically maintained, no dedicated tracking issue |
| **Centipede** | Fuzzing engine referenced in `bot/fuzzers/centipede/` | N/A | N/A | N/A | Repository archived (google/centipede), merged into [google/fuzztest](https://github.com/google/fuzztest) per that project's own README; FuzzTest has zero riscv64 issues on record, riscv64 status of the successor project is effectively unresearched |
| **atheris** (Python fuzzing via libFuzzer bindings) | Referenced fuzzing engine for Python targets | Not established | Zero riscv64 issues in google/atheris | Not established | No upstream activity found; likely inherits libFuzzer's riscv64 gaps since it wraps libFuzzer via a native extension |
| **gRPC** (`grpcio`) | RPC layer, pinned `grpcio==1.62.2`/`1.74.0`/`1.83.0` across Pipfiles | Builds from source; historically hit SIGILL ([#37791](https://github.com/grpc/grpc/issues/37791), closed) and `__atomic_compare_exchange_1` link errors ([#35839](https://github.com/grpc/grpc/issues/35839), closed) on riscv64 | No riscv64 CI in grpc/grpc | No riscv64 PyPI wheel, confirmed absent from `grpcio` 1.83.0 release assets; must build from source | Open tracking issue [grpc/grpc#41591](https://github.com/grpc/grpc/issues/41591) (P2, no maintainer response since Feb 2026); infrastructure blockers (manylinux/cibuildwheel riscv64 support) are resolved, remaining blocker is maintainer inaction. See project-reports/grpc.md |
| **Protocol Buffers** (`protobuf`) | Wire serialization, pinned `protobuf==4.23.4` | Builds from source (pure-Python fallback also available) | No riscv64 CI | Pure-Python wheel only (`protobuf-7.35.1-py3-none-any.whl`); no native riscv64 binary wheel | Maintainer stated riscv64 "not on our roadmap" (Aug 2025); two contributor PRs adding riscv64 protoc prebuilts were rejected/closed. See project-reports/protocol-buffers.md |
| **cryptography** (pyca/cryptography, via `google-auth`/`oauth2client` chain) | TLS/crypto for Google Cloud API auth, pinned `cryptography==37.0.4` | Builds from source (approx. 8 minutes on RISC-V hardware per upstream testing) | Community-tested on BananaPi F3 (SpacemiT K1); no upstream CI | No riscv64 PyPI wheel, confirmed absent from `cryptography` 50.0.0 release assets | Issue [pyca/cryptography#14460](https://github.com/pyca/cryptography/issues/14460) closed "not_planned"; maintainers declined riscv64 wheels citing insufficient RISC-V hardware performance (cannot meet CI time/concurrency requirements); a RISE runner offer was evaluated and rejected as too slow |
| **psutil** | Process/system monitoring, pinned `psutil==5.9.4`, imported in `heartbeat.py`, `shell.py`, `process_handler.py` (core bot process management) | Builds from source cleanly (verified: `psutil-7.2.2.tar.gz` sdist installs on riscv64) | CI workflow added then closed ([giampaolo/psutil#2833](https://github.com/giampaolo/psutil/issues/2833), [#2834](https://github.com/giampaolo/psutil/pull/2834)), exposed 3 test failures ([#2557](https://github.com/giampaolo/psutil/issues/2557), open) | No riscv64 PyPI wheel; maintainer explicitly declined (riscv64 is approx. 0.00%, roughly 2,200 of 30-day downloads vs. 84% x86_64); ppc64le/s390x were judged to justify wheels but riscv64 did not | Deprioritized on download-volume grounds, not technical grounds; source build works, so no functional blocker for ClusterFuzz today, only a build-time cost |
| **redis** (Python client + Redis server, memoization/caching) | Optional cache backend (`base/memoize.py`, `REDIS_HOST`/`REDIS_PORT`), pinned `redis==4.6.0`/`6.4.0` | Server builds cleanly, no riscv64-specific failures | No riscv64 CI in redis/redis upstream | No official riscv64 binary release; distro packages available | Two open community PRs (#15204, #15273) unreviewed since May 2026; no formal support tier. See project-reports/redis.md |
| **kubernetes** (Python client) | GKE/K8s orchestration client for bot fleet management (`k8s/service.py`, `remote_task/`) | Client is pure Python, no compiled extensions, no architecture-specific build concern | N/A (pure Python) | N/A (pure Python wheel, architecture-independent) | Upstream Kubernetes (the cluster/control-plane project, not the Python client) has real riscv64 gaps, see project-reports/kubernetes.md; not a blocker for the Python client library itself |
| **pymemcache** | Memcached client, in `Pipfile.lock` | Pure Python | N/A | N/A | None, pure Python |
| **grpcio-status / googleapis-common-protos / google-cloud-\*** | GCP API clients (Datastore, Storage, Logging, Monitoring) | Inherit grpcio's riscv64 build gap transitively (native grpcio extension is a dependency) | Inherit grpcio limitations | Inherit grpcio's missing riscv64 wheel | Same root cause as grpcio above, see project-reports/grpc.md |

**Deep-dive: the fuzzing-engine chain (the correctness-risk path).** libFuzzer's SanitizerCoverage and AddressSanitizer instrumentation on riscv64 have open, unresolved correctness/support gaps at the LLVM level: [#156912](https://github.com/llvm/llvm-project/issues/156912) marks libFuzzer+ASan tests as `UNSUPPORTED` on RISC-V, and [#164803](https://github.com/llvm/llvm-project/issues/164803) documents ASan assertion failures on riscv64 with vector-extension code, both open. These sit within a broader backlog of 166+ open riscv64 issues in llvm/llvm-project. Because libFuzzer is the most-used engine for OSS-Fuzz targets, this is the most consequential dependency gap: even where a riscv64 build of a fuzz target succeeds, crash-detection fidelity (the actual value ClusterFuzz provides) is degraded relative to x86_64/arm64. By contrast, AFL++ has resolved its riscv64 issues through QEMU-based CI (closed as of 2026-02), and honggfuzz already has native riscv64 ptrace/register support with no reported issues, indicating the engine layer is unevenly mature: not a single uniform blocker, but a per-engine risk profile.

**Deep-dive: the Python-packaging chain (the deployment-friction path).** grpcio, protobuf (native extension path), cryptography, and psutil all lack riscv64 PyPI wheels, forcing from-source builds for every ClusterFuzz bot deployed on riscv64. None of these is a hard build blocker (source builds are confirmed to work for all four), but psutil's and cryptography's maintainers have explicitly declined to add riscv64 wheels, citing download-volume and CI-performance objections respectively, meaning this friction is unlikely to be resolved upstream without RISE or a chip vendor directly funding maintainer-facing infrastructure work. grpcio's blocker differs in character: it is unresolved maintainer inaction on an already-open tracking issue ([grpc/grpc#41591](https://github.com/grpc/grpc/issues/41591)) rather than a stated technical or policy objection, making it the most plausible near-term fix among the three.

**The structural blocker above the dependency layer.** None of the above matters unless OSS-Fuzz itself is willing to run targets on riscv64. `google/oss-fuzz`'s `infra/constants.py` explicitly declares:

```python
DEFAULT_ARCHITECTURE = 'x86_64'
ARCHITECTURES = ['i386', 'x86_64', 'aarch64']
```

riscv64 is absent from this list. This is the authoritative, current statement that ClusterFuzz/OSS-Fuzz has no RISC-V fuzzing target architecture today, independent of whether every dependency in the table above were riscv64-clean. Four incidental "riscv" string hits inside `oss-fuzz` were checked and are unrelated to running fuzzing infrastructure on RISC-V hardware: `projects/xnnpack/build.sh` (`-DXNN_ENABLE_RISCV_VECTOR=1`, a build flag for XNNPACK's own RVV kernels), `projects/llvm/build.sh` (builds `llvm-isel-fuzzer--riscv64-O2`, which fuzzes LLVM's RISC-V instruction-selection backend while running on x86_64 host hardware), `projects/binutils/generate_seeds.py` (generates riscv64/riscv32 ELF seed corpora as fuzzing test inputs, not execution targets), and `projects/unicorn/build.sh` (builds `libriscv64-softmmu.a` as one of many CPU-emulation targets being fuzzed, unrelated to host architecture).

**No dependency constitutes an absolute build blocker for ClusterFuzz on riscv64.** The practical risk is fuzzing-quality degradation from libFuzzer/ASan's riscv64 immaturity, packaging friction from missing wheels for grpcio/protobuf/cryptography/psutil, and, above all, the OSS-Fuzz `ARCHITECTURES` list omitting riscv64 entirely, which is the fact that actually prevents any of this from mattering in production today.

Section 10 (Ecosystem Status) is omitted. ClusterFuzz is a standalone fuzzing-infrastructure service with a single pure-Python PyPI package and no dependent plugin/extension/package ecosystem that third parties build on top of (unlike, for example, a language runtime or package manager). The "ecosystem" question that does apply here, whether the projects ClusterFuzz fuzzes can be built for riscv64, is a property of each individual OSS-Fuzz target project's own build scripts, not of a ClusterFuzz-owned package ecosystem, and is out of scope for this report.

## 11. Known Bugs and Active Issues

No riscv64-specific bug, correctness issue, or performance issue exists in google/clusterfuzz. This was confirmed via GitHub issue search for `riscv64 performance repo:google/clusterfuzz`, `riscv64 bug repo:google/clusterfuzz`, and `riscv nan floating repo:google/clusterfuzz`, all zero results, plus a repo-wide code search for `riscv`/`riscv64`, zero matches.

The table below lists the architecture-support-adjacent issues that exist in the repository (all are ARM-related; none is RISC-V), since these are the closest analog and the material that would govern any future RISC-V request:

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [#1753](https://github.com/google/clusterfuzz/issues/1753) | Add support for fuzzing ARM targets on ClusterFuzz using QEMU / Unicorn | Closed (2023-11-16) | Feature request | Filed by a Google maintainer (inferno-chromium) in Apr 2020, open 3.5 years; closed by jonathanmetzman with explicit policy: "We're not going to do this in the end. We will do non-emulated support using ARM instances on GCE." No public PR/issue implementing the GCE ARM follow-through was found |
| [#3495](https://github.com/google/clusterfuzz/issues/3495) | Consider using ARM hardware for Memory Tagging and for testing of ARM-specific code | Closed, auto-closed as stale (2025-01-31) | Feature request | One substantive maintainer reply (Jan 2024): "I don't think memory tagging is supported by any ARM server hardware though." No further engagement before stale-bot closure |
| [#4856](https://github.com/google/clusterfuzz/issues/4856) | Support for ARM-based Development Environments | Closed, auto-closed as stale (2026-01-17) | Feature request | Filed Jul 2025 by a Snowflake engineer; zero maintainer response despite two explicit "don't close please" comments; closed anyway by stale-bot |
| [#2766](https://github.com/google/clusterfuzz/issues/2766) | Support for syzkaller for generic linux-based kernels | Closed (2022-08-30) | Feature request | Maintainer (oliverchang) response: "the syzkaller support is not generic, and currently only works for Android." Directly surfaces the `get_cpu_arch()` "FIXME: Add support for desktop architectures as needed" code path described in Section 4 |
| [#5308](https://github.com/google/clusterfuzz/issues/5308) | docs: add Dev Containers CLI workflow and ARM64 workaround | Open | Documentation/workaround | Confirms arm64 dev-environment friction remains a live, tracked topic; no riscv64 equivalent has ever surfaced |

**Correctness bugs:** none specific to riscv64 exist in this repository, because no riscv64 code path exists to contain a correctness bug. The correctness-relevant bugs that would affect a riscv64 ClusterFuzz deployment live entirely in dependencies (Section 9): LLVM [#156912](https://github.com/llvm/llvm-project/issues/156912) and [#164803](https://github.com/llvm/llvm-project/issues/164803) for libFuzzer/ASan reliability on riscv64.

## 12. Objections and Upstream Blockers

**Stated objections.**
1. Explicit, repeated x86-only gate in `local/install_deps_linux.bash`, unchanged since 2019-02-03 (commit `bd803b61`), restated in `docs/getting-started/prerequisites.md`. This is a standing, enforced policy statement, not merely an absence of support.
2. Explicit rejection of emulation as an approach to new-architecture support, stated in the [#1753](https://github.com/google/clusterfuzz/issues/1753) closing comment: "We're not going to do this in the end. We will do non-emulated support using ARM instances on GCE." Applied to ARM, but stated as a general project position.
3. OSS-Fuzz's `infra/constants.py` `ARCHITECTURES = ['i386', 'x86_64', 'aarch64']` is a maintained, current allowlist that omits riscv64. This is the single most consequential objection in the whole report because it sits upstream of everything else: no amount of ClusterFuzz-side or dependency-side readiness matters if OSS-Fuzz will not schedule riscv64 fuzzing targets at all.

**Technical blockers.**
1. No cloud vendor offers a RISC-V equivalent of the "native ARM instances on GCE" path that Google stated as its preferred non-x86 architecture-support model. Under the project's own stated policy, this blocks a RISC-V port even if one were volunteered, absent a change in that policy or in cloud RISC-V VM availability.
2. libFuzzer/ASan riscv64 instrumentation gaps (LLVM [#156912](https://github.com/llvm/llvm-project/issues/156912), [#164803](https://github.com/llvm/llvm-project/issues/164803), open) would degrade fuzzing effectiveness even if scheduling and build issues were solved.
3. Missing riscv64 PyPI wheels for grpcio, protobuf, cryptography, and psutil impose from-source build overhead on every bot deployment (Section 9); none are hard blockers, but they compound deployment friction.
4. `get_cpu_arch()` is a stubbed no-op for all non-Android platforms (`system/environment.py`, "FIXME: Add support for desktop architectures as needed"), unchanged for at least 4 years per the [#2766](https://github.com/google/clusterfuzz/issues/2766) thread. A real riscv64 (or any new desktop architecture) integration would need to implement this from scratch, not extend an existing partial implementation.
5. The stack-trace symbolizer's `is_valid_arch()` allowlist (`show.py`) does not include `riscv64`; a riscv64 crash could not be symbolized correctly by ClusterFuzz's own UI code without adding it.

**Organizational blockers.**
1. Single-company (Google-only) governance and CODEOWNERS ownership with no external co-maintainer, meaning a RISC-V initiative has no natural non-Google sponsor already embedded in the maintainer group.
2. The project's demonstrated response pattern to non-x86 architecture requests, even for the far more mainstream ARM64, is minimal-to-zero maintainer engagement followed by stale-bot auto-closure ([#3495](https://github.com/google/clusterfuzz/issues/3495), [#4856](https://github.com/google/clusterfuzz/issues/4856)). A RISC-V feature request filed the same way (an issue with no accompanying PR) should be expected to receive the same treatment.
3. ClusterFuzz is not a RISE member project. Only Google LLC appears on the RISE members list, as a Premier Member, alongside Alibaba, MediaTek, NVIDIA, Qualcomm, Red Hat, SiFive, and Tenstorrent. This is Google's general corporate RISC-V involvement and carries no ClusterFuzz-specific signal. No RISE working group (the Security Software WG, the closest analog, tracks only a single project, `rp016-opensbi-tee`) has any fuzzing or ClusterFuzz/OSS-Fuzz initiative in its docs tree.

**Acceptance probability.** Based on the [#1753](https://github.com/google/clusterfuzz/issues/1753)/[#3495](https://github.com/google/clusterfuzz/issues/3495)/[#4856](https://github.com/google/clusterfuzz/issues/4856) pattern, an unsolicited RISC-V feature request with no accompanying working PR has a low probability of proactive maintainer engagement. The stated project policy (native hardware over emulation) combined with the absence of a mature RISC-V cloud VM offering comparable to GCE's ARM instances means that even a working PR against ClusterFuzz's own code would not be sufficient on its own; the OSS-Fuzz `ARCHITECTURES` allowlist would also need to change, which is a separate repository under the same Google-only governance model. [NEEDS VERIFICATION]: whether a working PR with a demonstrated native (non-emulated) riscv64 execution environment would change maintainer responsiveness; no such PR has been attempted, so this is inferred from the ARM precedent rather than directly observed for RISC-V.

## 13. Investment Analysis

**RISE-funded work check.** No RISE blog post (all 28-33 posts checked across the blog's full history via RSS feed and sitemap, spanning 2024-05 through 2026-08) mentions ClusterFuzz, OSS-Fuzz, or fuzzing, with one narrow exception: "Stack-Clash Security Checker for RISC-V" (2024-07-17), which covers an unrelated static-analysis tool (Annobin/Annocheck) and explicitly does not mention ClusterFuzz. No RISE GitHub org repository (51 repositories checked in `riseproject-dev`) is ClusterFuzz-related. The closest adjacent work is `riseproject-dev/compiler-fuzz-ci`, a csmith/creduce/cvise-based fuzzer targeting GCC/LLVM RISC-V vector codegen, which is a different, custom harness unrelated to Google's ClusterFuzz/OSS-Fuzz service. No RISE RFP/project number (RP0xx) references ClusterFuzz. **Conclusion: zero RISE-funded work exists on this project to date; all investment items below are unclaimed.**

### 13.1 Functional Enablement

Work required before ClusterFuzz could run any fuzzing job on riscv64 hardware at all:
- Implement `get_cpu_arch()` for non-Android desktop/Linux platforms (currently a stubbed `None` return).
- Add `riscv64` to the stack-trace symbolizer's `is_valid_arch()` allowlist in `show.py`.
- Remove or update the x86-only gate in `local/install_deps_linux.bash` and the corresponding `docs/getting-started/prerequisites.md` statement.
- Add a riscv64 entry to the packaging `PLATFORMS` matrix in `src/local/butler/constants.py` (currently x86_64/amd64-only, also excluding arm64/aarch64).
- Secure the prerequisite that OSS-Fuzz's `infra/constants.py` `ARCHITECTURES` list add `riscv64`. This is an OSS-Fuzz-repository change, not a ClusterFuzz-repository change, but is a hard precondition for any of the above to matter in production.
- Resolve or work around the missing riscv64 PyPI wheels for grpcio, protobuf's native extension, cryptography, and psutil (source builds work today, but add deployment time and CI complexity to every bot image).

### 13.2 Performance Optimization

Not primarily a ClusterFuzz-repository concern, since ClusterFuzz has no compiled, architecture-specific code of its own. The relevant performance work is entirely at the fuzzing-engine layer: closing the libFuzzer/ASan riscv64 instrumentation and coverage-tracking gaps (LLVM [#156912](https://github.com/llvm/llvm-project/issues/156912), [#164803](https://github.com/llvm/llvm-project/issues/164803)), which is LLVM upstream work, not ClusterFuzz work, and would need to be tracked and resourced as part of a separate LLVM/RISC-V investment rather than counted against this project.

### 13.3 CI/CD Infrastructure

- Add a riscv64 leg (native hardware, not QEMU, per the project's stated policy) to `tests.yaml` and `codeql-analysis.yml`, contingent on functional enablement above being complete.
- Evaluate RISE's "RISE RISC-V Runners" free native-CI-on-GitHub program (announced 2026-03-24) as the native-hardware substrate that would satisfy the project's stated "no emulation" policy; no evidence this project has evaluated or adopted it yet.
- Given Google's stated preference for native cloud VM instances (the GCE-ARM precedent from [#1753](https://github.com/google/clusterfuzz/issues/1753)), a parallel ask is whether Google Cloud offers or plans a RISC-V VM instance type; absent that, RISE-donated hardware/runners would need to substitute, which is a policy deviation from precedent and would need explicit maintainer buy-in.

### 13.4 Ecosystem Enablement

Not applicable as a ClusterFuzz-repository work item (Section 10 omitted; no dependent package ecosystem). The adjacent, larger-scope ecosystem question, riscv64 coverage across the hundreds of individual OSS-Fuzz target projects' own build scripts, is out of scope for a ClusterFuzz-focused investment and would need to be sized per-project (each OSS-Fuzz `projects/*/build.sh` is independent).

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Implement `get_cpu_arch()` for non-Android desktop platforms | 1-2 | ClusterFuzz maintainer or external contributor with Google CLA | Medium |
| Functional | Add `riscv64` to stack-symbolizer `is_valid_arch()` allowlist | <1 | Same | Low |
| Functional | Remove/update x86-only gate in `install_deps_linux.bash` and docs | <1 | Same | Medium |
| Functional | Add riscv64 to packaging `PLATFORMS` matrix | 1 | Same | Low |
| Functional | Add `riscv64` to OSS-Fuzz `infra/constants.py` `ARCHITECTURES` (separate repo, hard precondition) | 2-4 (mostly negotiation/validation, not code) | OSS-Fuzz maintainer (overlapping Google team) | Critical |
| Functional | Resolve/work around missing riscv64 wheels for grpcio, protobuf, cryptography, psutil in bot deployment images | 2-3 | Chip-vendor or RISE-funded contributor | Medium |
| Performance | Close libFuzzer/ASan riscv64 instrumentation gaps | Out of scope for this project; see LLVM investment sizing | LLVM upstream | High (but not owned here) |
| CI/CD | Add native riscv64 CI leg to `tests.yaml`/`codeql-analysis.yml` | 2-3 | ClusterFuzz maintainer, contingent on functional work | Medium |
| CI/CD | Evaluate/adopt RISE RISC-V Runners for native hardware | 1 | RISE-affiliated contributor | Medium |
| Organizational | Secure Google maintainer sponsorship for a RISC-V PR (precedent shows unsolicited issues stall) | Not a person-week estimate; a relationship/advocacy prerequisite | Chip-vendor RISE liaison | Critical |

**Overall assessment.** The single highest-leverage, highest-priority item is not a ClusterFuzz code change at all: it is getting `riscv64` added to OSS-Fuzz's `ARCHITECTURES` list, since every other item in this table is moot in production without it. The remaining ClusterFuzz-side functional items are individually small (each under 2 person-weeks) but require a working PR plus active Google-maintainer sponsorship to have any realistic chance of merging, given the project's documented pattern of near-zero engagement on unsolicited non-x86 architecture requests.

## 14. Updates

(No updates yet, initial report dated 2026-06-17.)

## 15. References

- [google/clusterfuzz](https://github.com/google/clusterfuzz) (repository)
- [google.github.io/clusterfuzz](https://google.github.io/clusterfuzz/) (documentation site)
- [google/clusterfuzz issue #1753](https://github.com/google/clusterfuzz/issues/1753), "Add support for fuzzing ARM targets on ClusterFuzz using QEMU / Unicorn"
- [google/clusterfuzz issue #3495](https://github.com/google/clusterfuzz/issues/3495), "Consider using ARM hardware for Memory Tagging and for testing of ARM-specific code"
- [google/clusterfuzz issue #4856](https://github.com/google/clusterfuzz/issues/4856), "Support for ARM-based Development Environments"
- [google/clusterfuzz issue #2766](https://github.com/google/clusterfuzz/issues/2766), "Support for syzkaller for generic linux-based kernels"
- [google/clusterfuzz issue #5308](https://github.com/google/clusterfuzz/issues/5308), "docs: add Dev Containers CLI workflow and ARM64 workaround"
- [google/oss-fuzz](https://github.com/google/oss-fuzz) (sibling repository, fuzzing target definitions)
- [google/oss-fuzz infra/constants.py](https://github.com/google/oss-fuzz/blob/master/infra/constants.py) (`ARCHITECTURES` allowlist)
- [google/oss-fuzz projects/llvm/build.sh](https://github.com/google/oss-fuzz/blob/master/projects/llvm/build.sh)
- [google/oss-fuzz projects/binutils/generate_seeds.py](https://github.com/google/oss-fuzz/blob/master/projects/binutils/generate_seeds.py)
- [google/oss-fuzz projects/unicorn/build.sh](https://github.com/google/oss-fuzz/blob/master/projects/unicorn/build.sh)
- [google/oss-fuzz projects/xnnpack/build.sh](https://github.com/google/oss-fuzz/blob/master/projects/xnnpack/build.sh)
- [google/centipede](https://github.com/google/centipede) (archived, merged into fuzztest)
- [google/fuzztest](https://github.com/google/fuzztest) (Centipede successor project)
- [google/atheris](https://github.com/google/atheris)
- [PyPI clusterfuzz JSON API](https://pypi.org/pypi/clusterfuzz/json)
- [PyPI clusterfuzz simple index](https://pypi.org/simple/clusterfuzz/)
- [RISE GitLab wheel builder for clusterfuzz](https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/clusterfuzz/)
- [Ubuntu package search: clusterfuzz](https://packages.ubuntu.com/search?keywords=clusterfuzz&suite=noble&searchon=names&section=all)
- [Debian package tracker: clusterfuzz](https://tracker.debian.org/pkg/clusterfuzz)
- [Debian package search: clusterfuzz](https://packages.debian.org/search?keywords=clusterfuzz&searchon=names&suite=all&section=all)
- [Arch Linux RISC-V port status](https://archriscv.felixc.at/?q=clusterfuzz)
- [Arch Linux package search: clusterfuzz](https://archlinux.org/packages/?q=clusterfuzz)
- [AUR RPC search: clusterfuzz](https://aur.archlinux.org/rpc/?v=5&type=search&arg=clusterfuzz)
- [llvm/llvm-project issue #156912](https://github.com/llvm/llvm-project/issues/156912), libFuzzer+ASan tests `UNSUPPORTED` on RISC-V
- [llvm/llvm-project issue #164803](https://github.com/llvm/llvm-project/issues/164803), ASan assertion failures on riscv64 with vector-extension code
- [AFLplusplus issue #2064](https://github.com/AFLplusplus/AFLplusplus/issues/2064)
- [AFLplusplus issue #2145](https://github.com/AFLplusplus/AFLplusplus/issues/2145)
- [AFLplusplus issue #2056](https://github.com/AFLplusplus/AFLplusplus/issues/2056)
- [AFLplusplus issue #2712](https://github.com/AFLplusplus/AFLplusplus/issues/2712), QEMU-based riscv64 CI
- [grpc/grpc issue #37791](https://github.com/grpc/grpc/issues/37791)
- [grpc/grpc issue #35839](https://github.com/grpc/grpc/issues/35839)
- [grpc/grpc issue #41591](https://github.com/grpc/grpc/issues/41591)
- [pyca/cryptography issue #14460](https://github.com/pyca/cryptography/issues/14460)
- [giampaolo/psutil issue #2833](https://github.com/giampaolo/psutil/issues/2833)
- [giampaolo/psutil pull #2834](https://github.com/giampaolo/psutil/pull/2834)
- [giampaolo/psutil issue #2557](https://github.com/giampaolo/psutil/issues/2557)
- [riseproject.dev members page](https://riseproject.dev/members/)
- [riseproject.dev RISE RISC-V Runners announcement (2026-03-24)](https://riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github/)
- [riseproject.dev Stack-Clash security checker post (2024-07-17)](https://riseproject.dev/2024/07/17/stack-clash-security-checker-for-risc-v/)
- [riseproject-dev/compiler-fuzz-ci](https://github.com/riseproject-dev/compiler-fuzz-ci)
- [riseproject-dev/security-software-wg](https://github.com/riseproject-dev/security-software-wg)