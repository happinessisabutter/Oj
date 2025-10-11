import { InjectionToken } from '@nestjs/common';
import { JudgeTaskPayload } from '../judge/dto/judgeTaskPlayload';

/**
 * judge command port
 */
export interface JudgeCommandPort {
    /**
     * 
     * @param payload 
     */
    process(payload: JudgeTaskPayload): Promise<void>;
}

export const JUDGE_COMMAND_PORT: InjectionToken = Symbol('JUDGE_COMMAND_PORT');