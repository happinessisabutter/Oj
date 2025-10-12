import { InjectionToken } from '@nestjs/common';
import { JudgeTaskPayload } from '../../judgeWorkers/judge/model/judgeTaskPlayload';

export type JudgeQueueHandler = (payload: JudgeTaskPayload) => Promise<void>;

/**
 * producer + consumer port
 */
export interface SubmissionDispatcherPort {
  dispatch(payload: JudgeTaskPayload): Promise<void>;
}

export interface JudgeQueueConsumerPort {
  start(handler: JudgeQueueHandler): Promise<void>;
  stop(): Promise<void>;
}

export const SUBMISSION_DISPATCHER: InjectionToken = Symbol('SUBMISSION_DISPATCHER');
export const JUDGE_QUEUE_CONSUMER_PORT: InjectionToken = Symbol('JUDGE_QUEUE_CONSUMER_PORT');
