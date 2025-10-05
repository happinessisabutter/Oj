# Problem Module Status

## Current Capabilities
- ProblemService covers CRUD + search with repository-based filters (search, difficulty range) and exposes read-only DTOs.
- ProblemCaseService/Controller deliver full case lifecycle (list/create/update/delete) with guard-aware mutation checks.
- ProblemTagService/Controller manage many-to-many attachments through the `problem_tags` join entity, keeping tag metadata centralized.
- Module wiring (`ProblemModule`) exports the service set while registering all repositories; build passes with the new join entity and submission progress uses these relations.

## API Guidance
- GET  `/problems` (ProblemListQueryDto) → Paginated<ProblemSummaryDto>
- GET  `/problems/:id` → ProblemDetailDto
- GET  `/problems/display/:problemId` → ProblemDetailDto
- POST `/problems` (CreateProblemDto) → ProblemDetailDto
- PATCH `/problems/:id` (UpdateProblemDto) → ProblemDetailDto
- DELETE `/problems/:id`
- GET  `/problems/:problemId/cases` → ProblemCaseResponseDto[]
- POST `/problems/:problemId/cases` (CreateProblemCaseDto) → ProblemCaseResponseDto
- PATCH `/problems/:problemId/cases/:caseId` (UpdateProblemCaseDto) → ProblemCaseResponseDto
- DELETE `/problems/:problemId/cases/:caseId`
- GET  `/problems/:problemId/tags` → TagResponseDto[]
- POST `/problems/:problemId/tags` (AttachProblemTagsDto) → TagResponseDto[]
- DELETE `/problems/:problemId/tags` (DetachProblemTagsDto) → TagResponseDto[]

## Pending Enhancements
- Allow tag creation on the fly and capture metadata (addedBy, ordering) within `problem_tags`.
- Introduce caching when list/detail traffic warrants it.
- Harden editor workflows (bulk actions, audit logging) and add role-specific tests.
