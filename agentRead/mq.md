
---

## 0) How to Use
- All sections are **normative** unless marked “optional”.
- Target stack: **NestJS (v10+) + BullMQ + Redis (Upstash/Redis Cloud) + PostgreSQL + Go-based sandbox**.
- Scope includes **MQ/queue**, **Judge Worker**, and **Backend Cache** rules.
- Keep implementation language **TypeScript**; avoid raw Express.

---

## 1) Response Contract (strict)
1. **Phase A — Exhaustive bullets**: list all applicable rules/steps/edge cases (no prose).
2. **Phase B — Code**: concrete NestJS/BullMQ snippets, SQL guards, sandbox spawn patterns.
3. **Phase C — Tests**: Jest/e2e test names + 1–2 line setup hints per rule.
4. **Phase D — Design (optional)**: 3 options (Simple/Pragmatic/Ambitious) + tradeoffs + recommendation.
5. **Never**: string-built shells; DB writes w/o `FROM`-state guard; large blobs in jobs/cache; secrets in cache; single timeout; unlimited outputs.
6. **If token-limited**: end with `CONTINUE-N` and resume exactly there next reply.
7. **Style**: terse; identifiers > prose; avoid repetition; cross-reference (e.g., “see §3.1.4”).

---

## 2) Hard “Do-Not” Rules
- Do **not** enqueue without `jobId=submissionId`.
- Do **not** update status without `WHERE id=? AND status='<FROM>'`.
- Do **not** build shell commands via string concatenation; use `spawn/execFile(argv)`.
- Do **not** read full stdout/stderr into memory; **stream + cap** bytes.
- Do **not** enable network in sandbox (unless strict whitelist).
- Do **not** put source/log blobs/tokens/PII into Redis or shared cache.
- Do **not** cache submission status with TTL > **5s**.
- Do **not** rely on Pub/Sub events as truth; fetch state from Redis/DB.

---

## 3) Non-Negotiables (merged essentials)

### 3.1 MQ / Queue (BullMQ + Redis)
- Idempotency: `jobId=submissionId`; DB unique index.
- State guards on every write (FROM-state WHERE clause).
- DB↔enqueue **double-write** safety: outbox or compensation.
- Retries: exponential backoff; **retryable** (infra) vs **non-retryable** (CE/invalid lang).
- Dual timeouts: MQ job timeout + sandbox wall/CPU limits.
- Concurrency & limiter: global + per language caps; avoid CPU storms.
- Watchdog + stalled handler: recover `RUNNING` stuck jobs.
- DLQ: move after max attempts; admin requeue flow.
- Small payloads only: IDs (codeId/artifactId/testcaseRev).
- Observability: queue depth, p95 wait/runtime, fail/stalled; structured logs.
- Namespacing: distinct Redis keys per env; consistent queue names.
- Backpressure: slow/refuse POST when depth > threshold.



### 3.3 Backend Cache (per module)
- L1 in-process **LRU**; optional L2 **Redis** for shared reads.
- Key format: `ns:entity:selector#v<rev>`; prefer **revision bump** invalidation.
- Problem list/detail/templates cached; submission **status** short TTL (3–5s).
- Do not cache secrets/PII/blobs; user-scoped keys for private data.
- SWR + single-flight on hot keys; negative cache for 404 (short TTL).

---

## 4) Prompt #1 — MQ Pitfalls (exhaustive)
- Double-write inconsistency (DB vs enqueue); missing outbox/compensation.
- No idempotency key; duplicate clicks create multiple jobs.
- Missing guarded transitions; illegal state jumps/rewinds.
- Stuck `RUNNING`; no watchdog/stalled handler/timeout.
- Misclassifying errors; CE/invalid language retried.
- No backoff; hammering Redis/worker on repeated failures.
- Single timeout only; sleep/IO bypass CPU cap.
- Over-concurrency; no limiter; CPU thrash.
- Queue name mismatch; wrong Redis URL/TLS/region.
- Free-tier limits (requests/conn) silently throttle.
- `removeOnComplete` mis-set; Redis bloat or zero audit trail.
- Fat payloads (source/logs) in jobs.
- No DLQ; max-attempt failures vanish.
- Using events as truth; UI state wrong.
- No backpressure; API accepts unlimited POSTs.
- Cancel/start race; no per-submission serialization.
- Shared Redis namespace across envs.
- No metrics; no depth/latency/failure visibility.
- Requeue loses attempts/context.
- Event listener leaks; memory growth.

---

## 5) Prompt #2 — Judge Worker Pitfalls (exhaustive)
- Weak sandboxing (root, network on, broad caps).
- No seccomp/cgroups; unbounded syscalls/CPU/mem/pids/files.
- Shell injection via string-built commands.
- Path traversal; `../../` escapes workdir.
- Single timeout; missing wall or CPU limit.
- No output caps; buffer entire stdout/stderr → OOM.
- Checker not sandboxed; SPJ crash/exploits.
- EOL/Unicode mismatch; false WA.
- Floating-point rules absent; tiny eps misjudged.
- Locale differences; decimal/collation issues.
- Unpinned toolchains; flaky verdicts.
- Temp leak; no cleanup of `/work/<id>`.
- Env leakage; host secrets exposed.
- Over-permissive mounts; testcases writable.
- No per-language concurrency; compile storms.
- No compile/run error distinction; noisy retries.
- Ignoring signals/exit code; mis-mapped verdicts.
- Unbounded stdin; memory blowups.
- Nondeterministic testcase order.
- Rejudge races; artifacts overwrite.
- Write-after-terminal; late write wins.
- Inaccurate metering; no peak RSS.
- Loose file quotas; inode exhaustion.
- Missing progress/heartbeat; false “stalled”.
- Over-verbose logs; disk churn.
- Random seeds; nondeterministic solutions.
- Large artifacts stored inline in DB; slow queries.
- No early-stop; run all tests after decisive WA/TLE.
- Crash cleanup gaps; orphaned processes/containers.

---

## 6) Prompt #3 — Backend Cache Strategy (per module, LRU-ready)

### 6.1 Core
- L1 LRU (fast, per-process); optional L2 Redis (shared).
- Keys include `#v<rev>`; prefer **version bump** invalidation.
- SWR + single-flight; negative cache for misses.

### 6.2 User
- L1 only: `user:profile:<id>#v<rev>` TTL 5m; avoid tokens/PII in L2.
- On update: bump `user.rev` or delete exact key.

### 6.3 Problem
- List: `problem:list:<hash(query)>#v<catalogRev>` TTL 10m; SWR; L2 ok.
- Detail: `problem:item:<id>#v<problemRev>` TTL 60m; support ETag/304.
- Templates: `problem:tpl:<lang>#v<tplRev>` TTL 24h.
- Catalog (per user): `catalog:list:<userId>#v<userCatalogRev>` TTL 5m; prefer L1.
- On edits: bump respective revs.

### 6.4 Submission
- Status: `submission:status:<id>` TTL 3–5s; worker overwrites/deletes on terminal.
- My list: `submission:list:<userId>:<page>#v<userSubmitRev>` TTL 30–60s; L1 preferred.

### 6.5 Worker local
- `tc:meta:<problemId>#v<tcRev>` TTL 1h; `lang:spec:<lang>#v<langSpecRev>` TTL 12h.
- Do not cache verdicts/logs; store in DB/object-store.

### 6.6 Pitfalls
- Long TTL for status → stale “Running”.
- Shared cache keys without user-scope → leakage.
- Wildcard deletes on hot path → Redis scan costs; prefer version bump.

---

## 7) Prompt #4 — Implementation & Test Contract

### 7.1 Mandatory Guards (code-level)
- **Idempotent enqueue**
```ts
await queue.add('evaluate', { submissionId }, {
  jobId: submissionId,
  attempts: 3,
  backoff: { type: 'exponential', delay: 2000 },
  timeout: langTimeoutMs,
  removeOnComplete: 100,
});
```

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

