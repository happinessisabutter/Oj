import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { Problem } from '../../problem/entities/problem.entity';
import { Judge, JudgeStatus } from '../entities/judge.entity';
import { JudgeCase } from '../entities/judge-case.entity';
import { CreateSubmissionDto } from '../dto/create-submission.dto';
import { SubmissionListQueryDto } from '../dto/submission-list-query.dto';
import { SUBMISSION_DISPATCHER } from '../../../../port/queue/judge-queue.port';
import type { SubmissionDispatcherPort } from '../../../../port/queue/judge-queue.port';
import { JudgeTaskPayload } from '../../../../judgeWorkers/judge/judge.types';

/** Handles submission persistence and queue dispatch responsibilities. */
@Injectable()
export class SubmissionService {
  constructor(
    @InjectRepository(Judge)
    private readonly judgeRepository: Repository<Judge>,
    @InjectRepository(JudgeCase)
    private readonly judgeCaseRepository: Repository<JudgeCase>,
    @InjectRepository(Problem)
    private readonly problemRepository: Repository<Problem>,
    @Inject(SUBMISSION_DISPATCHER)
    private readonly submissionDispatcher: SubmissionDispatcherPort,
  ) {}

  async createSubmission(dto: CreateSubmissionDto): Promise<Judge> {
    const problem = await this.problemRepository.findOne({
      where: { id: dto.problemId },
    });

    if (!problem) {
      throw new NotFoundException(`Problem ${dto.problemId} not found`);
    }

    const submission = this.judgeRepository.create({
      displayPid: dto.displayProblemId ?? problem.problemId,
      pid: problem.id,
      problem,
      uid: dto.userId,
      username: dto.username,
      code: dto.code,
      language: dto.language,
      ip: dto.ip ?? '0.0.0.0',
      submitTime: new Date(),
      status: JudgeStatus.STATUS_PENDING,
      errorMessage: null,
      time: null,
      memory: null,
      length: dto.code.length,
      judgerIp: null,
    });

    const saved = await this.judgeRepository.save(submission);

    const payload: JudgeTaskPayload = {
      submissionId: saved.submitId,
      problemId: saved.displayPid,
      language: saved.language,
    };
    await this.submissionDispatcher.dispatch(payload);

    return saved;
  }

  async findSubmissionById(submitId: number): Promise<Judge> {
    const submission = await this.judgeRepository.findOne({
      where: { submitId },
      relations: { problem: true },
    });

    if (!submission) {
      throw new NotFoundException(`Submission ${submitId} not found`);
    }

    return submission;
  }

  async findCasesBySubmission(submitId: number): Promise<JudgeCase[]> {
    return this.judgeCaseRepository.find({
      where: { judge: { submitId } },
      order: { id: 'ASC' },
    });
  }

  async findAll(query: SubmissionListQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const { userId, problemId, displayProblemId, status } = query;

    const baseWhere: FindOptionsWhere<Judge> = {};

    if (userId) {
      baseWhere.uid = userId;
    }

    if (problemId) {
      baseWhere.pid = problemId;
    }

    if (displayProblemId) {
      baseWhere.displayPid = displayProblemId;
    }

    if (typeof status === 'number') {
      baseWhere.status = status;
    }

    const [items, total] = await this.judgeRepository.findAndCount({
      where: baseWhere,
      order: { submitTime: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return { items, total };
  }
}
