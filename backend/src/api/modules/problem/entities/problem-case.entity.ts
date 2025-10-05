import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Problem } from './problem.entity';

export enum CaseStatus {
  AVAILABLE = '0 available',
  NOT_AVAILABLE = '1 no available',
}

@Entity({ name: 'problem_cases' })
export class ProblemCase {
  @PrimaryGeneratedColumn({ type: 'int' })
  id!: number;

  @Column({ name: 'pid', type: 'int' })
  problemId!: number;

  @ManyToOne(() => Problem)
  @JoinColumn({ name: 'pid', referencedColumnName: 'id' })
  problem!: Problem;

  @Column({ name: 'input', type: 'varchar' })
  input!: string;

  @Column({ name: 'output', type: 'varchar' })
  output!: string;

  @Column({ name: 'status', type: 'varchar' })
  status!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updatedAt!: Date;
}
