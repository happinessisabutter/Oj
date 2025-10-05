# 🧠 Agent Prompt — High-Density Build Spec (OJ: MQ + Judge + Cache)

**Scope**: Modular-monolith Online Judge with four backend modules: User, Problem,Submission (MQ), Judge Worker.  
**Stack**: NestJS v10+, BullMQ + Redis (Upstash/Redis Cloud), PostgreSQL, Go-based sandbox (HOJ-style).  
**Scale**: ≤ ~1k users; 2 servers (API + Worker).  
**Risk hotspots to optimize for**: queue consistency, idempotency + guarded state updates, retry taxonomy, stalled recovery, sandbox isolation, dual timeouts, output/IO caps, checker correctness, cache invalidation, backpressure/admission control, observability.

---

## 0) Response Contract (strict)
1. Phase A — Exhaustive bullets only (no prose) covering rules, edge cases, and guard conditions; keep identifiers exact.  
2. Phase B — Implementation guidance without long code; only assertive “must include” levers (e.g., jobId=submissionId, WHERE status='RUNNING', stream+cap outputs).  
3. Phase C — Tests: list Jest/e2e test names with 1–2 line setup hints mapping to the rules.  
4. Phase D (optional) — Three design options (Simple/Pragmatic/Ambitious) + trade-offs + recommendation, aligned to simplicity > cost > performance unless overridden.  
5. Never: shell strings; DB writes without FROM-state guards; large blobs/secrets/PII in Redis or shared cache; single timeout; unlimited stdout/stderr; relying on Pub/Sub as source of truth.  
6. If output limit reached: end with CONTINUE-1 (or N) and resume exactly there next reply, no repetition or omissions.  
7. Style: terse bullets, exact identifiers, cross-reference sections by §number.

---

## 1) Hard “Do-Not” Rules (non-negotiable)
- Do not enqueue without idempotency: jobId=submissionId.  
- Do not update submission status without a FROM-state predicate: WHERE id=? AND status='<FROM>'.  
- Do not build shell commands via string concatenation; use argv-based execution only.  
- Do not buffer full stdout/stderr; must stream and enforce byte caps.  
- Do not enable network inside sandbox (unless specific egress allowlist).  
- Do not put source code, logs, tokens, or PII into Redis or shared cache.  
- Do not cache submission status with TTL > 5s.  
- Do not use queue events as authoritative state; query Redis/DB for truth.  
- Do not reuse queue names or Redis namespaces across environments.  
- Do not perform wildcard/SCAN deletes in hot paths for cache invalidation.

---

## 2) MQ / Dispatch — Required Behavior
### 2.1 Delivery & Idempotency
- Accept at-least-once delivery; achieve effective exactly-once by jobId=submissionId and unique constraint on submissionId.  
- Enforce idempotent finalization by guarding terminal writes with WHERE status='RUNNING'.

### 2.2 Double-Write Safety
- Handle DB↔enqueue divergence with an outbox row committed in the same transaction as the submission record.  
- A relay consumes outbox rows, enqueues jobs, marks SENT; idempotent by submissionId; retry with exponential backoff.

### 2.3 Retry Policy & Classification
- Classify errors into retryable (infra transient, sandbox crash, Redis hiccup) and non-retryable (compile error, invalid language, payload policy violation).  
- Retryable attempts=3 with exponential backoff (e.g., 2s, 4s, 8s); non-retryable = 0 retry, immediate terminal status.  
- MQ job timeout must be ≤ sandbox wall-clock limit to avoid “worker still running after MQ timeout”.

### 2.4 State Machine & Guards
- States: PENDING → QUEUED → RUNNING → COMPLETED | FAILED | CANCELLED.  
- Start transition must include WHERE status='QUEUED'.  
- Terminal transition must include WHERE status='RUNNING'.  
- Disallow illegal transitions and rewinds; rejudge must mint a new submissionId (old archived).

### 2.5 Concurrency & Limiting
- Global limiter caps jobs per second across workers to protect CPU.  
- Per-language concurrency: heavy compiles (C++/Java) lower than interpreted runs (Python/JS).  
- Optional per-user in-flight cap = 1 to prevent single-user hogging; or per-user priority bands.

### 2.6 Stalled & Watchdog
- Enable BullMQ stalled detection; stalled jobs are retried if attempts remain.  
- Watchdog cron requeues RUNNING older than a threshold (e.g., 5 minutes) back to QUEUED with a reason note.

### 2.7 Admission Control / Backpressure
- When queueDepth exceeds high-watermark: respond 202 with Retry-After or 429, and log admission decisions.  
- Daily quota per user; refused requests must be unambiguous and observable.  
- Health gate: if worker unhealthy, either delay enqueue or refuse with explicit guidance.

### 2.8 Payload Discipline
- Job payloads carry only identifiers (submissionId, codeId, problemId, testcaseRevision); never raw code or logs.  
- Persist artifacts and logs in DB/object storage; jobs reference them by id.

### 2.9 Namespacing & Environment
- Queue names must be environment-scoped (e.g., judge:prod vs judge:stage).  
- Redis URLs must be distinct per environment with TLS (rediss://) and authentication.

### 2.10 Observability
- Metrics: queue depth, enqueued/s, started/s, p95 wait time (enqueue→start), p95 runtime (start→finish), success %, stalled count, DLQ size.  
- Logs: include requestId, jobId, submissionId, userId, language, and stage for every lifecycle step.

---

## 3) Judge Worker — Required Behavior
### 3.1 Sandbox Hardening
- Run as non-root UID/GID with capabilities dropped (cap-drop ALL), strict seccomp profile, and cgroups for CPU/memory/pids/files.  
- Disable network inside sandbox by default; if allowed, restrict to an explicit egress allowlist.  
- Testcases mounted read-only; workdir is an isolated directory per submission; guaranteed cleanup after run; block path traversal and parent directory references.

### 3.2 Resource Limits & Timeouts
- Enforce both wall-clock and CPU timeouts; tuned per language.  
- Enforce combined stdout+stderr cap (1–5 MB depending on language/problem class); cap file count and total temp size.  
- Enforce stdin/input size limits to prevent memory blowups.

### 3.3 Process Execution Safety
- Use argv-based exec; reject or sanitize any argument containing path traversal or shell metacharacters.  
- Stream stdout/stderr; on cap breach, terminate the process and set a verdict consistent with Output Limit Exceeded or Resource Kill.  
- Collect exit status and signal mapping reliably even on forced termination.

### 3.4 Compile/Run Pipeline
- Define per-language pipelines; compiles may have lower concurrency than runs.  
- Deterministic testcase order; pin testcaseRevision at submission time.  
- Separate build artifacts from runtime workspace to simplify cleanup.

### 3.5 Checker Correctness
- Provide line-mode and token-mode comparisons with configurable whitespace policy (ignore trailing whitespace, optional space collapsing).  
- Normalize EOL to LF; handle BOM/Unicode normalization; document Unicode expectations.  
- Float comparison supports absolute and relative epsilon; epsilon is per problem or per tag.  
- SPJ (special judge) must run inside sandbox with the same limits; streaming compare for very large outputs to avoid RAM spikes.  
- Early-stop policy configurable (e.g., stop on first decisive WA/TLE for efficiency).

### 3.6 Error Mapping & Taxonomy
- Map signals to verdicts: hard kill due to limits vs program error vs checker failure must be distinguishable.  
- Separate compile-time errors (CE) from runtime RE/TLE/OLE explicitly; CE is non-retryable.

### 3.7 Toolchain Pinning & Supply Chain
- Pin compilers/interpreters and libraries; immutable execution images; periodic updates with CVE review.  
- Ensure no host credentials or environment secrets are present inside the sandbox runtime.

---

## 4) Backend Cache — Strategy for Scope/Scale
### 4.1 Principles
- Two-tier approach: L1 in-process LRU for fastest reads; optional L2 Redis for shared reads across instances.  
- Key format: ns:entity:selector#v<rev>; prefer revision bump invalidation on writes.  
- Use SWR (stale-while-revalidate) and single-flight to suppress cache stampedes; use short negative cache windows for misses.

### 4.2 What to Cache
- Problem list: problem:list:<hash(query)>#v<catalogRev>, TTL ≈ 10m, SWR allowed, L2 ok.  
- Problem detail: problem:item:<problemId>#v<problemRev>, TTL ≈ 60m, enable HTTP ETag/If-None-Match for 304s.  
- Language templates: problem:tpl:<language>#v<tplRev>, TTL ≈ 24h.  
- User catalog lists: catalog:list:<userId>#v<userCatalogRev>, TTL ≈ 5m, prefer L1 only.  
- Submission status: submission:status:<submissionId>, TTL 3–5s, overwritten/invalidated on terminal state.

### 4.3 What Not to Cache
- Secrets, PII, tokens, raw code, raw logs; never place in L2 shared cache.  
- Authoritative write paths; DB remains source of truth.

### 4.4 Invalidation
- On edits: bump the relevant revision (problemRev, catalogRev, tplRev).  
- Avoid wildcard/SCAN invalidation in hot paths; prefer revision suffix changes.  
- Keep status TTL short to avoid visible staleness during job completion.

---

## 5) Admission Control & Quotas (Cross-Cutting)
- High-watermark backpressure: at threshold, slow down or reject POSTs with explicit Retry-After.  
- Per-user daily submission quota; per-user in-flight cap = 1; optional priority bands (admin > paid > free).  
- Document and observe admission decisions to avoid silent drops.

---

## 6) Observability & Ops (Cross-Cutting)
- Structured logs at every phase with requestId, jobId, submissionId, userId, lang, stage; redact secrets.  
- Metrics to expose: queue depth, enqueued/s, started/s, p95 wait, p95 runtime, success rate, failure rate by class, stalled count, DLQ depth, cache hit/miss rates.  
- Health checks: API health, worker health (progress heartbeats), Redis connectivity, DB connectivity.  
- Minimal dashboards: queue depth and p95 wait time; stalled/DLQ alarms; cache hit ratio on Problem endpoints.

---

## 7) Test Matrix (names + hints)
- idempotent_enqueue_single_job — enqueue same submissionId twice; expect single processing path and single terminal verdict.  
- guarded_transition_blocks_illegal_update — attempt terminal write from non-RUNNING; expect no rows updated and no state change.  
- retryable_errors_backoff_and_cap — simulate transient infra fault; observe 3 attempts with exponential delays.  
- nonretryable_compile_error_terminal_once — compile failure yields CE; no retries; terminal set once.  
- stalled_job_recovered_by_watchdog — kill worker mid-run; job becomes stalled; watchdog requeues to QUEUED and it completes later.  
- dual_timeouts_wall_and_cpu — sleep-heavy and CPU-busy programs both terminate under respective limits with correct verdicts.  
- output_cap_prevents_oom — program emits > cap bytes; process is terminated; verdict indicates OLE/ResourceKill; worker uptime unaffected.  
- checker_eol_unicode_float_epsilon — CRLF/LF/BOM and float epsilon cases behave per policy; WA/AC outcomes deterministic.  
- sandbox_blocks_argv_injection_and_path_traversal — argv injection attempt and path traversal strings fail validation and cannot escape workdir.  
- cache_revision_bump_invalidation — problem update increments problemRev; prior cache keys naturally miss; new content served.  
- status_cache_freshness_under_5s — terminal status visible to clients within ≤5 seconds of write-back.  
- backpressure_activates_on_high_depth — artificially raise queue depth; POST receives 202/429 and Retry-After; metric shows admission.  
- outbox_survives_enqueue_failure — simulate enqueue failure; outbox row persists; relay retries and enqueues idempotently.

---

## 8) Acceptance (Definition of Done)
- Duplicate submissions cannot produce multiple processed jobs or mixed terminal states.  
- Illegal state transitions are blocked by FROM-state guards and audited.  
- Retry taxonomy is respected: CE/invalid language never retried; infra errors backoff-retried and capped.  
- Infinite loops and huge outputs terminate within limits without crashing the worker; verdicts are correct and explainable.  
- Stalled and crash scenarios recover via stalled handling or watchdog; no permanent RUNNING zombies.  
- Cache keeps problem reads fast and consistent via revision bumps; submission status never appears stale beyond 5 seconds.  
- Observability is actionable: metrics and logs support incident diagnosis without additional instrumentation.

---

## 9) Prioritized Risk Controls (apply in this order)
1) Idempotent enqueue + guarded state writes.  
2) Dual timeouts (wall + CPU) + output/IO caps + streaming.  
3) Retry classification + stalled handling + watchdog + DLQ.  
4) Per-language concurrency + global limiter.  
5) Outbox pattern for DB↔MQ safety.  
6) Cache revision bump and short TTL for status.  
7) Backpressure and per-user quotas.  
8) Metrics/logs/health checks and minimal dashboards.

---

## 10) Design Mode (optional, when asked)
- Produce three approaches: Simple (ship ≤10 days), Pragmatic (adds monitoring/scale hooks), Ambitious (future-proof).  
- Compare complexity, time, cost, reliability, operability, risks.  
- Recommend one based on simplicity > cost > performance, unless user overrides.  
- Provide a 7–10 day milestone plan and list assumptions with lightweight validations.  
- Map acceptance checks to §8 to ensure safety.

---

## 11) Pagination Protocol for Your Output
- If you cannot finish within the response limit, end with CONTINUE-1.  
- The next message must start with CONTINUE-1 RESUME and continue exactly there, no duplication or omissions.  
- Repeat numbering sequentially until the document is complete.
