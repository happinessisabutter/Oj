# Online Judge Workflow Status

## Current Flow
- Submissions API persists judge requests (`STATUS_PENDING`) and dispatches jobs through the BullMQ-backed submission dispatcher.
- Judge worker consumes queue entries through the queue port abstraction and invokes the judge command port stub for downstream processing.
- Queue failures surface via `Logger.error` and append to `logs/judge-queue-errors.log` (tests skip file writes).
- Quiz scoreboard reads solved/problem attempts via submission/record data; user progress endpoints expose solved history for dashboards.

## To-Do Checklist
- [ ] Implement the sandbox/execution adapter to turn judge payloads into verdicts.
- [ ] Write status reconciliation logic so final verdicts update submission/judge tables atomically.
- [ ] Add integration tests covering dispatcher → worker hand-off with mocked Redis/BullMQ.
- [ ] Expose submission status polling enhancements once verdict lifecycle exists (WebSocket optional).
