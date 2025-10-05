declare module '@nestjs/bullmq' {
  import type { DynamicModule } from '@nestjs/common';

  interface BullRootModuleOptions {
    connection?: Record<string, unknown>;
  }

  interface RegisterQueueOptions {
    name: string;
  }

  export class BullModule {
    static forRoot(options: BullRootModuleOptions): DynamicModule;
    static registerQueue(...queues: RegisterQueueOptions[]): DynamicModule;
  }

  export function InjectQueue(queueName: string): ParameterDecorator;
}

declare module 'bullmq' {
  export interface QueueOptions<T = any> {
    connection?: Record<string, unknown>;
  }

  export interface Job<T = any> {
    id?: string | number;
    data: T;
  }

  export class Queue<T = any> {
    name: string;
    opts: QueueOptions<T>;
    constructor(name: string, opts?: QueueOptions<T>);
    add(name: string, data: T, opts?: Record<string, unknown>): Promise<void>;
  }

  export type Processor<T = any> = (job: Job<T>) => Promise<void>;

  export class Worker<T = any> {
    constructor(name: string, processor: Processor<T>, opts?: QueueOptions<T>);
    on(event: 'completed', handler: (job: Job<T>) => void): void;
    on(
      event: 'failed',
      handler: (job: Job<T> | undefined, err: Error) => void,
    ): void;
    close(): Promise<void>;
  }
}
