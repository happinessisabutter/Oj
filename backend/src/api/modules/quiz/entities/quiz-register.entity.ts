import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Unique,
} from 'typeorm';
import { Quiz } from './quiz.entity';
import { User } from '../../user/entities/user.entity';

@Entity({ name: 'quiz_registers' })
@Unique('uq_quiz_user', ['quiz', 'user'])
export class QuizRegister {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id!: number;

  @ManyToOne(() => Quiz, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tid' })
  quiz!: Quiz;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'uid', referencedColumnName: 'userId' })
  user!: User;

  @Column({ name: 'status', type: 'boolean', default: true })
  status!: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updatedAt!: Date;
}
