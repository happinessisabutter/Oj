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
import { Judge } from './judge.entity';

/**
 * JudgeCase entity represents a single test case result for a submission.
 * It stores information about the input, expected output, user's output,
 * execution time, memory usage, and status of the test case.
 */
@Entity({ name: 'judge_case' })
export class JudgeCase {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id!: number;

  @Column({ name: 'submit_id', type: 'bigint' })
  submitId!: number;

  @ManyToOne(() => Judge)
  @JoinColumn({ name: 'submit_id', referencedColumnName: 'submitId' })
  judge!: Judge;

  @Column({ name: 'problem_id', type: 'varchar' })
  problemId!: string;

  // problemId is a display id, like "P1000", not the primary key id
  // so we reference Problem.problemId instead of Problem.id
  // see Problem entity for details
  @ManyToOne(() => Problem)
  @JoinColumn({ name: 'problem_id', referencedColumnName: 'problemId' })
  problem!: Problem;

  @Column({ name: 'userId', type: 'uuid' })
  userId!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId', referencedColumnName: 'userId' })
  user!: User;

  @Column({ type: 'varchar' })
  status!: string;

  @Column({ type: 'int', nullable: true })
  time!: number | null;

  @Column({ type: 'int', nullable: true })
  memory!: number | null;

  @Column({ name: 'case_id', type: 'varchar' })
  caseId!: string;

  @Column({ name: 'input_data', type: 'varchar' })
  inputData!: string;

  @Column({ name: 'output_data', type: 'varchar' })
  outputData!: string;

  @Column({ name: 'user_output', type: 'text', nullable: true })
  userOutput!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updatedAt!: Date;
}
