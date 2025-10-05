import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Unique,
  Index,
} from 'typeorm';
import { Quiz } from './quiz.entity';
import { Problem } from '../../problem/entities/problem.entity';

@Entity({ name: 'quiz_problems' })
@Unique('uq_quiz_problem', ['quiz', 'problem'])
export class QuizProblem {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id!: number;

  @ManyToOne(() => Quiz, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tid' })
  quiz!: Quiz;

  @ManyToOne(() => Problem)
  @JoinColumn({ name: 'pid', referencedColumnName: 'id' })
  problem!: Problem;

  @Index('idx_qp_quiz_display')
  @Column({ name: 'display_id', type: 'varchar' })
  displayId!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updatedAt!: Date;
}
