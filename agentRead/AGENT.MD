
# OnlineJudge workflow:
Online Judge submission process. After a user logs in, the front-end sends the user’s code and problem ID to the backend. The backend validates the problem information, stores a new submission record in the database with a queued status, and publishes a lightweight judge task to the message queue. The message queue then delivers the task to an available JudgeWorker instance. The JudgeWorker fetches the full problem and test-case details from the database, compiles and executes the user’s code inside an isolated Sandbox environment, and collects execution results such as output, runtime, and memory usage. It then compares the user’s output against the expected output according to judging rules, updates the submission’s verdict and score in the database, and marks the task as completed. Finally, the frontend polls or listens through an event bus to detect when the submission status becomes “complete,” and once it does, the backend returns the final result and verdict to the user.

# problem list workflow:
User view a list of problem in each page, user click problem, backend fetch problem display expected like other oj system(eg. leetcode)

# quiz 
User able to create quiz. view the problem that they are done.(service layer able to do relevant db read)

# techstack:
Backend: NestJS + TypeORM  
Requirement: Please follow NestJS best practices:
nestjs_bestPractice.md

frontend: react and tailwind css. at this stage, i required layout and gray color main theme.
redis: uptstask
mq: bullmq
db: progresql

# folder responsibility
backend/
├─ package.json
├─ .env.example
├─ tsconfig.json
├─ docker/ (require: wihout content file)
│  ├─ Dockerfile           # multi-stage build (shared image)
│  └─ docker-compose.yml   # runs two containers: api + judge
├─ migrations/             # DB schema & seeds (run before starting apps)
│  └─ ...                 
├─ src/
│  ├─ api/                         # HTTP app (for frontend)
│  │  ├─ main.ts                   # API entrypoint (HTTP server)
│  │  └─ modules/
│  │     ├─ auth/
│  │     ├─ users/
│  │     ├─ problems/
|  |     |- quiz/
│  │     ├─ submissions/           # POST /submissions, GET /submissions/:id, SSE
│  │     │  ├─ submissions.controller.ts
│  │     │  └─ submissions.service.ts   # insert submission(status='queued'), read results
│  │     └─ contests/              # (optional) rankings, freeze rules
│  │
│  ├─ judgeWorkers/                     # background processes (no HTTP)
│  │  ├─ judge.worker.ts           # worker entrypoint (while-true loop)
│  │  └─ judge/                    # judge domain
│  │     ├─ judge.loop.ts          # dequeue/claim → run → write back
│  │     ├─ judge.service.ts       # compile/run/score; aggregates verdict
│  │     ├─ runners/               # per-language adapters (cpp, java, py...)
│  │     └─ sandbox/               # job sandbox helpers (spawn docker/nsjail)
│  │
│  ├─ libs/                        # infrastructure adapters (I/O)
│  │  ├─ infra-db/                 # ORM client & repositories (shared)
│  │  │  ├─ db.module.ts (Nest) or createDb.ts (Express)
│  │  │  └─ entities/              # Submission, TestCase, CaseResult, Problem, ...
│  │  ├─ infra-queue/              # MQ factories (BullMQ/Redis Streams/RabbitMQ)
│  │  ├─ infra-cache/              # Redis cache (optional)
│  │  ├─ infra-objstore/           # object storage (S3/minio) for logs/artifacts (development use local folder instead)
│  │  └─ config/                   # env loading & validation (zod/joi)
│  │
│  ├─ common/                      # pure code (no I/O)
│  │  ├─ dto/                      # shared DTO/types (SubmissionMsg, Verdict…)
│  │  ├─ errors/                   
│  │  └─ constants/
|  |  |-ports/                      #interfaces/abstract classes to avoid hard coupling
│  │
│  └─ ops/                         # ops-only endpoints/health/metrics
│     ├─ health.ts                 # /healthz implementations
│     └─ metrics.ts                # Prometheus exporters
│
└─ scripts/                        # tiny CLIs / admin jobs
   ├─ start-api.ts                 # optional wrapper to boot API
   ├─ start-judge.ts               # optional wrapper to boot worker
   ├─ rejudge.ts                   # enqueue rejudge tasks
   └─ sweep-stuck.ts               # requeue long 'running' submissions

## Next Steps Checklist

Data/Migrations

Add migrations for problem_tags (pid, tag_id unique) and any missing indexes:
quiz_records (tid, uid, pid), judge (uid, pid), judge_case (submit_id)
Scoreboard + Ranking

Optionally compute/display tie-breakers (e.g., earliest AC time)
Add lightweight Redis cache (TTL ~10–30s) and row-level invalidation on judge completion
Problem Set UX

Extend problem set service to support bulk add/remove validations and displayId uniqueness checks
Add reorder-by-index API if needed beyond displayId updates
Progress & History

Paginate history responses
Add first-AC timestamp and average attempts to progress summaries
Execution Pipeline

Implement judge command port adapter to call sandbox (compile/run/compare)
Status reconciliation: update judge and propagate to quiz_records on completion
Security/Hardening

Add rate limiting to auth and submission endpoints
Enable Helmet/CORS config per environment
Tighten ValidationPipe (forbidNonWhitelisted) and add DTO swagger metadata where missing
Developer Experience

Swagger docs for new endpoints (problem cases/tags, quiz problem-set, submission progress)
Unit tests: services (progress, scoreboard reducer, problem-set ops)
Integration tests: queue hand-off (mock Redis), scoreboard endpoint
Ops

Docker/compose for API + worker + Redis + Postgres
Seed scripts for tags and sample quizzes; prod-ready env templates
Documentation

Update module docs when migrations and new endpoints are added
Add a short “operational runbook” (start API, worker, Redis; env vars; health checks)
If you’d like, I can start with migrations + index scripts and wire basic Swagger for the new endpoints.

## Your next tasks (to do):



# coding style reference 
- ~/examtopics/agentRead/nestjs_bestPractice.md




 


