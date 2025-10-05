import { InjectionToken } from '@nestjs/common';
import { JudgeTaskPayload } from '../../judgeWorkers/judge/judge.types';

export interface JudgeCommandPort {
  process(payload: JudgeTaskPayload): Promise<void>;
}

export const JUDGE_COMMAND_PORT: InjectionToken = Symbol('JUDGE_COMMAND_PORT');
