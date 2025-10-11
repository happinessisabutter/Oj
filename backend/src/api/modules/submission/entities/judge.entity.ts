import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { Problem } from '../../problem/entities/problem.entity';

export enum JudgeStatus {
  STATUS_NOT_SUBMITTED = -10,
  STATUS_SUBMITTING = 9,
  STATUS_PENDING = 6,
  STATUS_JUDGING = 7,

  STATUS_COMPILE_ERROR = -2,
  STATUS_PRESENTATION_ERROR = -3,
  STATUS_WRONG_ANSWER = -1,
  STATUS_ACCEPTED = 0,
  STATUS_CPU_TIME_LIMIT_EXCEEDED = 1,
  STATUS_REAL_TIME_LIMIT_EXCEEDED = 2,
  STATUS_MEMORY_LIMIT_EXCEEDED = 3,
  STATUS_RUNTIME_ERROR = 4,
  STATUS_SYSTEM_ERROR = 5,
  
  STATUS_PARTIALLY_ACCEPTED = 8,
  STATUS_SUBMITTED_FAILED = 10,
}

/**
 * Judge entity represents a submission made by a user for a specific problem.
 * It stores information about the submission such as the problem ID, user ID,
 * submission time, status, error messages, execution time, memory usage,
 * code length, programming language, and IP addresses.
 */
@Entity({ name: 'judge' })
export class Judge {
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'submit_id' })
  submitId!: number;

  @Column({ name: 'display_pid', type: 'varchar' })
  displayPid!: string;

  @Column({ name: 'pid', type: 'int' })
  pid!: number;

  @ManyToOne(() => Problem)
  @JoinColumn({ name: 'pid', referencedColumnName: 'id' })
  problem!: Problem;

  @Column({ name: 'uid', type: 'uuid' })
  uid!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'uid', referencedColumnName: 'userId' })
  user!: User;

  @Column({ type: 'varchar' })
  username!: string;

  @Column({ name: 'submit_time', type: 'timestamp with time zone' })
  submitTime!: Date;

  @Column({ type: 'int', default: JudgeStatus.STATUS_NOT_SUBMITTED })
  status!: number;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage!: string | null;

  @Column({ type: 'int', nullable: true })
  time!: number | null;

  @Column({ type: 'int', nullable: true })
  memory!: number | null;

  @Column({ type: 'int', nullable: true })
  length!: number | null;

  @Column({ type: 'text' })
  code!: string;

  @Column({ type: 'varchar' })
  language!: string;

  @Column({ name: 'judger_ip', type: 'varchar', nullable: true })
  judgerIp!: string | null;

  @Column({ type: 'varchar' })
  ip!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updatedAt!: Date;
}
