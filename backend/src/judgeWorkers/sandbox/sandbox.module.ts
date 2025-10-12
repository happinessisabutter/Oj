import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { SANDBOX_PORT } from 'src/judgeWorkers/sandbox/port/Sandbox.port';
import { Judge0Adapter } from './adapter/judge0.adapter';

@Module({
  imports: [
    HttpModule, // For making API calls to Judge0
    ConfigModule, // To get the Judge0 URL from environment variables
  ],
  providers: [
    {
      provide: SANDBOX_PORT,
      useClass: Judge0Adapter, // <-- This is the only line to change to swap sandbox
    },
  ],
  exports: [SANDBOX_PORT], // Export the port so other modules can inject it
})
export class SandboxModule {}