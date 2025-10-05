# Submission Module Status

## Current Capabilities
- SubmissionService handles submission persistence, queue dispatch (BullMQ via port abstraction), listing, and case retrieval.
- SubmissionProgressService aggregates per-user problem progress (solved flag, attempts, latest status) and exposes history of submissions with fail reasons.
- Auth-protected progress/history endpoints leverage `JwtAuthGuard`; queue adapters log failures to `logs/judge-queue-errors.log`.
- Module wires Judge, JudgeCase, Problem, and QuizRecord repositories alongside queue ports for cross-module reporting (scoreboard/drill-down).

## API Guidance
- POST ` /submissions` (CreateSubmissionDto) → Judge
- GET `  /submissions` (SubmissionListQueryDto) → Paginated<Judge>
- GET `  /submissions/:id` → Judge
- GET `  /submissions/:id/cases` → JudgeCase[]
- GET `  /submissions/users/me/problems?quizId&onlySolved` (auth) → ProblemProgressDto[]
- GET `  /submissions/users/me/problems/:displayProblemId/history` (auth) → ProblemSubmissionHistoryResponseDto
- GET `  /submissions/:submitId/cases` → detailed case results (reuse for scoreboard drill-down)

## Pending Enhancements
- Enrich progress summaries with time-series analytics (e.g., first AC time, average attempts).
- Add caching for frequent progress queries if usage grows.
- Surface pagination for history endpoint when users have large submission counts.
