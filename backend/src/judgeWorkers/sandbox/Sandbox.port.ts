import { InjectionToken } from '@nestjs/common';
import { beforeSandboxDto } from 'src/judgeWorkers/judge/dto/beforeSandbox';
import { SandboxResultDto } from 'src/judgeWorkers/judge/dto/sandbox-results.dto';

/**
 * sandbox process port
 */
export interface SandboxPort {
  /**
   * @param submit cases with file paths
   * @returns execution result
   */
  run(input: beforeSandboxDto): Promise<SandboxResultDto>;
  executeCase
}

export const SANDBOX_PORT: InjectionToken = Symbol('SANDBOX_PORT');
