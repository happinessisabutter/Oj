## Current Functionality

### Problem

CRUD with DTO validation and ownership checks
Search + filters (text, exact/min/max difficulty)
Test case lifecycle: list/create/update/delete
Tags many-to-many via problem_tags; attach/detach endpoints
DTO responses (summary/detail/case meta/tag names)

### Quiz

CRUD/meta with category validation; rank used as correct-rate placeholder
Problem set management: attach, reorder, detach; list with displayId
Registration join/leave; list registrations
Records: create (validates membership and quiz-problem), list with filters
Scoreboard: read-only aggregation, sorted by total AC; per-cell includes status + submitId for drill-down

### Submission

Persist submissions; enqueue judge jobs via BullMQ adapter (ports)
List/get submission, list case results for a submission
Progress: per-user problem summary (solved, attempts, last status), and history with fail reasons

### Judge Workflow (ports + worker)

Producer/consumer decoupled via queue ports; BullMQ adapter implementation
Worker loop consumes jobs and calls judge command port (execution black-box for now)
MQ failures logged via Nest Logger + file log in logs/judge-queue-errors.log (tests skip)
Cross-cutting

JWT auth + RBAC guards; Public decorator for open routes
Global ValidationPipe; repository-first data access
Env-driven config; TypeORM datasource wired with new entities
Module status docs for Problem, Quiz, Submission, OJ workflow