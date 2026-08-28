---
title: perf_data_converter
parent: Project Reports
---

# perf_data_converter

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Scope:** RISC-V (riscv64/linux) support status for perf_data_converter<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

---

## 1. Project Overview

perf_data_converter is a command-line tool that converts Linux `perf.data` binary profiling files into [pprof](https://github.com/google/pprof) protobuf format (`profile.proto`). The primary binary is `perf_to_profile`. The tool is used to feed perf-collected profiles into Google-internal and open-source profile analysis pipelines.

**Governance:** None. The repository carries an explicit disclaimer: "THIS IS NOT AN OFFICIAL GOOGLE PRODUCT." There is no foundation affiliation, no CODEOWNERS file, no SUPPORT.md, no PLATFORMS.md, and no formal tier policy. The project is an informal public mirror of a Google-internal repository (Piper monorepo).

**Development model:** All substantive changes arrive as Copybara syncs from Google's internal monorepo, each tagged with a `PiperOrigin-RevId`. External contributors cannot submit architecture ports via pull requests; the maintainers state explicitly: "perf data converter and quipper projects do not use GitHub pull requests." External contributors must file an issue or submit internally through Google. The most recent PR (PR #201) merged August 11, 2026 and is a routine internal sync.

**Corporate maintainers:** Confirmed Google employees dominate the commit history. Notable contributors include Alexey Alexandrov (Google), Raul Silvera (Google), and approximately four other Google-affiliated accounts accounting for the majority of commits [NEEDS VERIFICATION for individual affiliation of lannadorai and s-kanev]. Zachary Marcus (24 commits) was previously at Google and is now at QuEra Computing [NEEDS VERIFICATION].

**License:** BSD-3-Clause.

**Community culture on new ports:** No signal of interest in RISC-V. No open issue, no mailing list discussion, no external contributor has raised riscv64. The contribution model makes unsolicited arch ports structurally difficult - there is no PR review path. Port acceptance is ad hoc; the ARM SPE decoder (the only arch-specific addition to date) was added via an internal Google change (issue #178, October 2024, PiperOrigin-RevId: 684550232) with no public design review.

**RISE membership:** Not a member. Not listed on [riseproject.dev](https://riseproject.dev).

---

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| - | No RISC-V port initiated, no tracking issue filed, no commits referencing riscv | Full scan of 201 issues/PRs and all commits in google/perf_data_converter |
| October 2024 | ARM SPE decoder added (arm_spe_decoder.cc/h) - the only arch-specific addition in project history | [Issue #178](https://github.com/google/perf_data_converter/issues/178) |
| 2021-10-20 | AOSP mirror `riscv-android-src/platform-external-perf_data_converter` last updated (not upstream, not RISE-affiliated) | GitHub search result |

No RISC-V port exists. No contributors have been identified as working on one from any organization.

---

## 3. Upstream Support Tier

No formal tier policy document exists. Port support is entirely implicit and inferred from CI and release artifacts.

| Dimension | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI | ubuntu-22.04 runner, every PR | None | None |
| Official binaries | None (no releases exist) | None | None |
| Testdata (perf.data samples) | Yes (x86 perf binary used in BUILD comments) | Yes (armv7-3.4, armv7.perf_3.14 in testdata/) | None |
| ISA-specific decoder | None needed (generic) | ArmSpeDecoder (448 lines, full implementation) | None |
| Release-blocking gate | Yes (CI must pass) | No | No |

amd64 is the only tested platform. arm64 has testdata but no CI. riscv64 has nothing.

Note on functional coverage: the core perf.data parsing and pprof conversion pipeline is architecture-agnostic by design. The `architecture` field in `perf_data.proto` is a free-form string. A `perf record` session on a RISC-V machine produces a `perf.data` file that perf_data_converter can parse and convert today without any code changes. The only missing functionality is auxtrace decoding (hardware tracing extensions), which does not yet have a widely deployed RISC-V equivalent.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

The codebase contains no JIT, no SIMD, no cryptographic computation, no GC barriers, and no architecture-specific assembly. It is a pure data parsing and serialization tool.

| Component | Description | amd64 | arm64 | riscv64 |
|---|---|---|---|---|
| perf.data parser (standard events) | Reads binary perf.data format; architecture is a metadata string | Full | Full | Full (no changes needed) |
| pprof serialization | Writes profile.proto via protobuf | Full | Full | Full (no changes needed) |
| ARM SPE auxtrace decoder | Decodes ARM Statistical Profiling Extension records from perf auxtrace data | N/A | Full (448-line hand-written decoder in arm_spe_decoder.cc) | None (no RISC-V hardware tracing extension widely deployed) |
| Endianness handling | `is_cross_endian_` flag in PerfReader; `__LITTLE_ENDIAN_BITFIELD`/`__BIG_ENDIAN_BITFIELD` in perf_event.h | Native (LE) | Native (LE) | Native (LE) |
| `PERF_REGS_MAX` | Arch-dependent register count, currently `#if 0` guarded in the codebase | Undefined/disabled | Undefined/disabled | Undefined/disabled |

No ISA-specific work is required for perf_data_converter's primary use case on riscv64. The only component that would need future development is an auxtrace decoder for any RISC-V hardware tracing extension (SBI PMU, N-Trace) if and when those become relevant, which is not a near-term concern.

---

## 5. Build System, Cross-Compilation, and Toolchain

**Build system:** Bazel (Bzlmod, `MODULE.bazel`). CMake is not used; there are no CMakeLists.txt files, no cmake/ directory, no toolchain files, and no Dockerfiles.

**System dependencies (installed via apt):**
- `g++`, `git`, `libelf-dev`, `libcap-dev`, `libssl-dev`, `linux-tools-$(uname -r)`

**Minimum compiler per README.md:** g++-5 or clang-7.

**CI compiler:** g++-12 (from `ppa:ubuntu-toolchain-r/test`, on ubuntu-22.04 x86-64). A separate clang build uses Docker image `gcr.io/google.com/absl-177019/linux_hybrid-latest:20260131` (x86-64 only).

**Build commands:**
```
bazel build src:perf_to_profile
bazel build //src:all //src/quipper:all
bazel test //src:all //src/quipper:all
```

**riscv64 cross-compilation:** No support exists. No Bazel platform or toolchain definition for riscv64 is present. Cross-compiling for riscv64 would require upstream work to:
1. Add a Bazel platform/toolchain definition for riscv64-linux-gnu.
2. Resolve the `PERF_REGS_MAX` arch-dependency (currently disabled with `#if 0` but would need a riscv64 value if register capture is needed).
3. Provide a riscv64-capable protoc binary (protobuf maintainers do not ship an official riscv64 prebuilt - see Section 9).

**QEMU usage:** None. No QEMU steps exist anywhere in the CI or build configuration.

**Known build failures on riscv64:** None recorded (the tool has never been built for riscv64 in any public context found).

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Parse standard perf events (cycles, instructions, cache misses) | Yes | Yes | Yes (architecture-agnostic; works today) |
| Convert to pprof profile.proto | Yes | Yes | Yes |
| ARM SPE auxtrace decoding | N/A | Yes | N/A (no equivalent HW feature deployed) |
| Intel PT / BTS handling | Documented in proto comments | N/A | N/A |
| Large file handling (>3 GB perf.data) | Crash (Issue #141, integer overflow) | Unknown | Unknown |
| Branch stack conversion (modern kernels) | Partial gap (Issue #151, missing fields) | Unknown | Unknown |
| Symbol preservation | Bug (Issue #81, symbols dropped) | Unknown | Unknown |

**Functional gaps unique to riscv64:** None. The tool works on riscv64 perf.data input files for standard perf events without modification.

**Performance gaps:** None applicable. The tool is I/O and protobuf serialization bound. No SIMD, no compute-intensive path.

**Security hardening gaps:** Not applicable; the tool performs no cryptographic operations and has no memory-safety hardening (stack canaries, CFI) in its own code.

**NaN/floating-point semantics:** Not applicable; no floating-point computation.

---

## 7. CI/CD Infrastructure

**CI file:** [`.github/workflows/ci.yaml`](https://github.com/google/perf_data_converter/blob/master/.github/workflows/ci.yaml) - the only CI file in the repository.

**Triggers:** push to `copybara_staging`, pull_request to `master`, `workflow_dispatch`.

| Dimension | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI exists | Yes | No | No |
| Runner | ubuntu-22.04 (x86-64) | - | - |
| Architecture matrix | None (single runner) | - | - |
| QEMU emulation | No | - | - |
| Cross-compilation | No | - | - |
| RISE-provided runners | No | - | - |

The word "riscv" does not appear anywhere in the CI configuration. There is no matrix, no second job, and no additional workflow files.

---

## 8. Distribution and Release Status

**GitHub Releases:** None. The GitHub API returns an empty array `[]`. No release has ever been published. No binary assets exist for any architecture.

**PyPI:** HTTP 404. The package does not exist on PyPI. No wheels of any kind.

**RISE wheel builder:** Not present. The RISE wheel builder covers 80+ packages (numpy, scipy, safetensors, tiktoken, etc.) but not perf_data_converter.

**Ubuntu (Noble 24.04):** Not packaged. The package does not exist in the Ubuntu 24.04 suite.

**Debian:** Not packaged. Both `tracker.debian.org/pkg/perf_data_converter` and `tracker.debian.org/pkg/perf-data-converter` return HTTP 404.

**Arch Linux RISC-V ([archriscv.felixc.at](https://archriscv.felixc.at)):** Not packaged.

**What a user must do to get a working binary on riscv64:**
1. Install Bazel and a riscv64 C++ toolchain.
2. Clone the repository.
3. Build protoc from source (no official riscv64 prebuilt exists - see Section 9).
4. Run `bazel build src:perf_to_profile` with a riscv64 platform definition (not yet upstream - requires local toolchain configuration work).

No single-step installation path exists for riscv64.

---

## 9. Dependencies

| Dependency | Role | riscv64 Build | riscv64 Test | riscv64 Release | Blocking Issues |
|---|---|---|---|---|---|
| [abseil-cpp](https://github.com/abseil/abseil-cpp) | Core utilities: strings, containers, sync, stack traces | Builds; dedicated `stacktrace_riscv-inl.inc` upstream since 2021 | Mostly pass; SEGFAULT in hashtablez sampler test (Issue #2002, open); SwisstableCollisions failure on kWidth==8 (Issue #2142, open) | Released (20260107.1 used); no riscv64 binary artifacts | Issue #1702 (open): linker error `undefined reference to __atomic_compare_exchange_1` with GCC 11.x cross-toolchains; workaround: link `-latomic` |
| [protobuf](https://github.com/protocolbuffers/protobuf) | Serialization for perf_data.proto and profile.proto | Builds (generic C++ path) | No upstream riscv64 CI; community reports build success | No official riscv64 `protoc` prebuilt; maintainers explicitly declined riscv64 support (Issue #17798 closed without fix; PR #23205 closed by author, no review) | Must build protoc from source; this complicates bootstrapping but does not block runtime use |
| [BoringSSL](https://github.com/google/boringssl) | SHA1/SHA256 hashing for build-ID computation in quipper | Builds; `OPENSSL_RISCV64` macro defined; android_riscv64_compile_only CI gate | QEMU-based test runner added 2024-07-09; no committed native test results | No prebuilt releases; pulled from googlesource at pinned commit | No CPU feature detection; no SIMD/crypto extension dispatch (no Zvk, Zkn, etc.); FIPS module does not support riscv64; all crypto is generic C fallback - correct but slower than amd64/arm64 |
| [zlib](https://github.com/madler/zlib) | Profile data compression in builder.cc | Builds; pure-C portable implementation | Tests pass on OpenBSD/riscv64 since v1.3.2 (merged 2026-01-28) | Ships in all major distros for riscv64 | No blocking issues; RVV-accelerated Adler32 PR #1099 (ZTE, open) offers minor gain but is not merged and not a blocker |
| [googletest](https://github.com/google/googletest) | Test framework (test-only) | Builds; no riscv64-specific code | Issue #3756 (open since 2022): `GetThreadCountTest.ReturnsCorrectValue` fails on riscv64; not a consumer-facing breakage | Distributed as source; no binary releases | Issue #3756 does not affect perf_data_converter tests (they do not call GetThreadCount()) |
| libelf (elfutils, system) | ELF binary introspection in quipper | Fully supported; riscv64 backend upstream since elfutils 0.171 (2018) | All ELF features (core files, DWARF, SHT_RISCV_ATTRIBUTES) upstream and tested | Ships in all major distros | No blocking issues |
| [gflags](https://github.com/gflags/gflags) | Command-line flag parsing | Builds; pure portable C++ | No riscv64-specific issues known | Distributed as source and in distros | No blocking issues |

**Most significant dependency concern:** protobuf's refusal to ship an official riscv64 `protoc` prebuilt (Issue #17798, closed without fix; maintainers on record as not supporting riscv64) complicates build bootstrapping. The C++ runtime builds and works; only the `protoc` code generator binary lacks an official prebuilt. Building protoc from source on riscv64 is the required workaround.

**BoringSSL performance note:** All SHA hashing in build-ID computation runs on generic C fallback on riscv64 with no hardware acceleration. This is a correctness-correct but slower path relative to amd64 and arm64. Not a blocker.

---

## 11. Known Bugs and Active Issues

Issues are listed from the public tracker. None are riscv64-specific.

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [#81](https://github.com/google/perf_data_converter/issues/81) | perf_to_profile drops perf symbols | Open | High - correctness | Symbols lost during conversion; affects all architectures |
| [#141](https://github.com/google/perf_data_converter/issues/141) | perf_to_profile crashes on 3 GB perf.data file | Open | High - correctness | SIGABRT from protobuf `size too big: 18446744072542064660`; 64-bit integer overflow or bad offset read; affects all architectures |
| [#151](https://github.com/google/perf_data_converter/issues/151) | branch stack reader needs updating for new kernel fields | Open | Medium - correctness | `perf_branch_entry` struct missing `type`, `spec`, `new_type`, `priv` fields added in newer kernels; patch proposed but not merged |
| [#163](https://github.com/google/perf_data_converter/issues/163) | error when convert perf record data to profile | Open | Medium - correctness | `perf_file_section.offset` reads as `15762598695796815` (0x37F800000011004F); suspicious byte-swap pattern that could indicate an endianness or struct padding issue; no reporter has tested on riscv64; architecture not specified by reporter |
| [#176](https://github.com/google/perf_data_converter/issues/176) | Build warnings with GCC 14 | Open | Low - build quality | `-Wstringop-overflow=` warnings in bundled protobuf; not riscv64-specific |
| [#197](https://github.com/google/perf_data_converter/issues/197) | Add sample labels flag to perf_to_profile | Open | Low - feature gap | Enhancement request |

**Correctness bugs requiring attention before production use on any platform:** Issues #81 (symbol dropping) and #141 (crash on large files) are unresolved and affect all architectures including riscv64. Issue #163's offset value (0x37F800000011004F) has a byte-swap pattern that warrants investigation specifically on riscv64, though no riscv64 reporter has confirmed it [NEEDS VERIFICATION].

---

## 12. Objections and Upstream Blockers

**Contribution model blocker:** The project explicitly does not accept GitHub pull requests. All changes flow from Google's internal Piper monorepo. An external contributor cannot file a riscv64 CI PR and get it reviewed. Any riscv64 work requires either (a) a Google employee agreeing to take it through internal review and Copybara-sync it out, or (b) Google accepting the external contribution via some alternate path. There is no documented mechanism for the latter.

**Organizational blocker:** There is no RISE funding, no open tracking issue, and no stated Google interest in riscv64 support. The project is not an official Google product. There is no product or business reason visible publicly that would motivate a Google engineer to prioritize riscv64.

**Technical blockers:** None that are fundamental. The tool is architecture-agnostic for its primary function. The absence of a riscv64 Bazel toolchain definition is a build-system gap, not a deep technical problem. The `PERF_REGS_MAX` disabled guard would need a riscv64 value but is currently not exercised.

**Protobuf prebuilt blocker:** protobuf maintainers explicitly do not support riscv64 for `protoc` prebuilts. This is documented (Issue #17798 closed without fix). Building from source is the workaround; it is not a fundamental blocker but increases bootstrapping friction.

**Acceptance probability for a riscv64 CI patch:** Low via pull request (PRs are not accepted). A riscv64 CI job filed as an issue and taken through Google internal review has an unknown acceptance probability given no signal of interest from maintainers.

---

## 13. Investment Analysis

RISE has no involvement with this project. No work has been done or funded.

### 13.1 Functional Enablement

No functional changes are required for riscv64. The tool already parses riscv64 `perf.data` files and converts them to pprof format today, because architecture is a metadata string. Functional enablement is complete by design.

The only forward-looking functional gap is an auxtrace decoder for RISC-V hardware tracing (N-Trace or SBI PMU auxtrace). This is not a near-term requirement given the current state of riscv64 hardware tracing deployment. Estimated effort when relevant: 2-4 person-weeks to implement a decoder comparable to arm_spe_decoder.cc, contingent on a RISC-V auxtrace format specification being available.

### 13.2 Performance Optimization

Not applicable. The tool has no SIMD, no compute-intensive path. BoringSSL's generic C fallback for SHA hashing is functionally correct and the performance delta is negligible for profiling workflows.

### 13.3 CI/CD Infrastructure

Adding riscv64 CI requires resolving the contribution model problem first (no PR path). If a Google contact can be engaged, the CI change itself is low effort.

Effort to write a riscv64 CI job (QEMU-based, ubuntu-22.04): 0.5 person-weeks.
Effort to get it merged upstream via Google internal review path: unknown; depends on Google stakeholder engagement.

### 13.4 Ecosystem Enablement

Not applicable. perf_data_converter has no dependent package ecosystem. It is a standalone tool with no plugin system, no library API consumers, and no distribution packages on any platform.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Verify riscv64 perf.data parse correctness on actual RISC-V hardware (smoke test with representative perf.data) | 0.5 | Any riscv64 hardware owner | High |
| Functional | Investigate Issue #163 offset anomaly on riscv64 (potential endianness bug) | 1 | Contributor with riscv64 access | Medium |
| Functional | RISC-V auxtrace decoder (N-Trace/SBI PMU) | 2-4 | Contributor with RISC-V tracing expertise | Low (future, no deployed HW tracing standard yet) |
| CI/CD | Add riscv64 QEMU-based CI job to .github/workflows/ci.yaml | 0.5 | Contributor + Google stakeholder | Medium |
| Build | Add Bazel riscv64 platform/toolchain definition for cross-compilation | 1 | Contributor | Medium |
| Distribution | Package perf_to_profile binary for Debian/Ubuntu riscv64 | 2 | Distro packager | Low |

---

## 14. Updates

No updates yet -- initial report dated 2026-06-17.

---

## 15. References

- [google/perf_data_converter repository](https://github.com/google/perf_data_converter)
- [CI configuration: .github/workflows/ci.yaml](https://github.com/google/perf_data_converter/blob/master/.github/workflows/ci.yaml)
- [Issue #81: perf_to_profile drops perf symbols](https://github.com/google/perf_data_converter/issues/81)
- [Issue #141: crash on 3 GB perf.data file](https://github.com/google/perf_data_converter/issues/141)
- [Issue #151: branch stack reader missing fields](https://github.com/google/perf_data_converter/issues/151)
- [Issue #163: offset read anomaly](https://github.com/google/perf_data_converter/issues/163)
- [Issue #176: GCC 14 build warnings](https://github.com/google/perf_data_converter/issues/176)
- [Issue #178: ARM SPE decoder addition](https://github.com/google/perf_data_converter/issues/178)
- [protobuf Issue #17798: riscv64 protoc prebuilt declined](https://github.com/protocolbuffers/protobuf/issues/17798)
- [abseil-cpp Issue #1702: undefined reference to __atomic_compare_exchange_1 on riscv64](https://github.com/abseil/abseil-cpp/issues/1702)
- [abseil-cpp Issue #2002: SEGFAULT in hashtablez sampler on riscv64](https://github.com/abseil/abseil-cpp/issues/2002)
- [abseil-cpp Issue #2142: SwisstableCollisions failure on kWidth==8 platforms](https://github.com/abseil/abseil-cpp/issues/2142)
- [googletest Issue #3756: GetThreadCountTest failure on riscv64](https://github.com/google/googletest/issues/3756)
- [zlib PR #1099: RVV-accelerated Adler32 (open)](https://github.com/madler/zlib/pull/1099)
- [RISE project member list](https://riseproject.dev)
- [RISE wheel builder package list](https://riseproject.gitlab.io/python/wheel_builder/)
- [riscv-android-src/platform-external-perf_data_converter (AOSP mirror, not upstream)](https://github.com/riscv-android-src/platform-external-perf_data_converter)