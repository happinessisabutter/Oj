
Location: ~examtopics/judgeServer

### Judge Worker / Sandbox
- Harden sandbox: non-root, `cap-drop ALL`, seccomp, cgroups, **no network**.
- Workdir isolation `/work/<submissionId>`; read-only testcases; cleanup after run.
- Safe spawn: `execFile/spawn(argv)`; validate paths; block `..`.
- Output control: **stream + cap** stdout/stderr; OLE/RE on overflow.
- Checker correctness: CRLF/LF, Unicode normalization, token/line modes, float eps; SPJ also sandboxed.
- Distinguish compile vs run errors; map exit signals; per-language timeouts/concurrency.
- Pin toolchains; version testcases per submission; deterministic ordering.
- Logs must include `jobId/submissionId/userId/lang/stage`.

### Sandbox
