import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { SandboxPort } from 'src/judgeWorkers/sandbox/Sandbox.port';
import { JudgeStatus } from 'src/api/modules/submission/entities/judge.entity';
import { verdictMap } from 'src/judgeWorkers/utils/contract/constant';

import { SandboxResultDto } from 'src/judgeWorkers/judge/dto/sandbox-results.dto';
import { AxiosRequestConfig } from 'axios';

//DTO for create submission request
interface Judge0SubmissionRequest {
  source_code: string;
  language_id: number;
  stdin: string;
}

// DTO for Judge0's submission response
interface Judge0SubmissionResponse {
  token: string;
}

// DTO for Judge0's get result response
interface Judge0ResultResponse {
  stdout: string | null;
  stderr: string | null;
  status_id: number;
  language_id: number;
  time: string | null;
  memory: number | null;
  message: string | null;
  compile_output: string | null;
}
//
@Injectable()
export class Judge0Adapter implements SandboxPort {
  private readonly logger = new Logger(Judge0Adapter.name);
  private readonly judge0Url: string;
  private readonly judge0ApiKey: string; 

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.judge0Url = this.configService.get<string>('JUDGE0_URL') !;
    this.judge0ApiKey = this.configService.get<string>('JUDGE0_API_KEY') !;
  }

  async run(input: Judge0SubmissionRequest): Promise<SandboxResultDto> {
    try {
      const submissionToken = await this.createSubmission(input);
      const result = await this.pollForResult(submissionToken);
      return this.mapToInternalResult(result);
    } catch (error) {
      this.logger.error('Failed to execute job on Judge0', error.stack);
      return {
        status: JudgeStatus.STATUS_SYSTEM_ERROR,
        stdout: null,
        stderr: 'Failed to communicate with the judge.',
        time: null,
        memory: null,
        message: 'Judge0 execution failed.',
      };
    }
  }

  private async createSubmission(
    input: beforeSandboxDto,
  ): Promise<string> {
    const url = `${this.judge0Url}/submissions/?base64_encoded=false&wait=false`;
    const payload = {
      source_code: input.sourceCode,
      language_id: input.languageID,
      stdin: input.stdin,
    };

    const config: AxiosRequestConfig = { // Add this config
      headers: {
        'x-rapidapi-key': this.judge0ApiKey,
        'x-rapidapi-host': new URL(this.judge0Url).hostname,
        'Content-Type': 'application/json',
      },
    };

    const response = await firstValueFrom(
      this.httpService.post<Judge0SubmissionResponse>(url, payload, config), // Pass the config
    );
    return response.data.token;
  }

  private async pollForResult(token: string): Promise<Judge0ResultResponse> {
    const url = `${this.judge0Url}/submissions/${token}?base64_encoded=false&fields=stdout,stderr,status_id,language_id,time,memory,message,compile_output`;

    const config: AxiosRequestConfig = { // Add this config
      headers: {
        'x-rapidapi-key': this.judge0ApiKey,
        'x-rapidapi-host': new URL(this.judge0Url).hostname,
      },
    };

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const response = await firstValueFrom(
        this.httpService.get<Judge0ResultResponse>(url, config), // Pass the config
      );
      const status = response.data.status_id;

      // Status 1 (In Queue) and 2 (Processing) mean we need to wait.
      if (status > 2) {
        return response.data;
      }

      // Wait for a short period before polling again.
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
  }

  private mapToInternalResult(
    judge0Result: Judge0ResultResponse,): SandboxResultDto {
    const internalStatus =
      verdictMap[judge0Result.status_id] ?? JudgeStatus.STATUS_SYSTEM_ERROR;

    return {
      status: internalStatus,
      stdout: judge0Result.stdout,
      stderr: judge0Result.stderr || judge0Result.compile_output,
      time: judge0Result.time ? parseFloat(judge0Result.time) : null,
      memory: judge0Result.memory,
      message: judge0Result.message,
    };
  }
}
