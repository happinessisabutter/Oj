# Quiz Module Status

## Current Capabilities
- QuizService now focuses on CRUD/meta projections while delegating to dedicated services:
  * QuizProblemSetService – list/update quiz problem ordering.
  * QuizRegistrationService – register/unregister participants with guard-aware checks.
  * QuizRecordService – persist/query quiz records while validating membership.
  * QuizScoreboardService – aggregates a read-only scoreboard sorted by total AC (solved) while exposing `submitId` for drill-down.
- Quiz controller orchestrates the split services; module wiring exports all providers and secures mutations behind JWT + role checks.
- DTO outputs (summary/detail/records/registrations/scoreboard) remain entity-free. `rank` currently mirrors stored correct-rate/solved placeholder.

## API Guidance
- POST ` /quizzes` → create quiz (body: CreateQuizDto) → QuizDetailDto
- GET `  /quizzes` → list quizzes (query: QuizListQueryDto) → Paginated<QuizSummaryDto>
- GET `  /quizzes/:id` → quiz detail → QuizDetailDto
- PATCH `/quizzes/:id` → update quiz (body: UpdateQuizDto) → QuizDetailDto
- DELETE `/quizzes/:id` → remove quiz
- POST ` /quizzes/:id/register` → join quiz → QuizRegistrationDto
- DELETE `/quizzes/:id/register` → leave quiz
- GET `  /quizzes/:id/problems` → QuizProblemSummaryDto[]
- POST ` /quizzes/:id/problems` → attach problems (body items: [{ problemId, displayId }])
- PATCH `/quizzes/:id/problems` → update display ids (body items: [{ quizProblemId, displayId }])
- DELETE `/quizzes/:id/problems` → detach problems (body: { quizProblemIds: number[] })
- GET `  /quizzes/:id/registrations` → QuizRegistrationDto[]
- POST ` /quizzes/:id/records` (CreateQuizRecordDto) → QuizRecordDto
- GET `  /quizzes/:id/records` (QuizRecordQueryDto) → QuizRecordDto[]
- GET `  /quizzes/:id/scoreboard` → ScoreboardDto (columns + rows), sorted by total AC (solved); per-problem cells expose status + submitId so clients can call `/submissions/:id/cases` for detailed fail reasons.

## Pending Enhancements
- Expand problem-set service to support add/remove operations (not just display-id updates).
- Add completion stats to scoreboard rows and header aggregates.
- Integrate record updates with judge verdict callbacks to keep rank/correct-rate in sync automatically.
