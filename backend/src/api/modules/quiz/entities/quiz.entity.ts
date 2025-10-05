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
import { QuizCategory } from './quiz-category.entity';

@Entity({ name: 'quizzes' })
export class Quiz {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id!: number;

  @Column({ type: 'varchar' })
  title!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  // Author username (FK to User.userName)
  @Column({ name: 'author', type: 'varchar' })
  author!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'author', referencedColumnName: 'userName' })
  authorUser!: User;

  // Ordering
  @Column({ name: 'rank', type: 'int', default: 0 })
  rank!: number;

  // Availability flag
  @Column({ name: 'status', type: 'boolean', default: true })
  status!: boolean;

  @ManyToOne(() => QuizCategory, { nullable: true })
  @JoinColumn({ name: 'category_id' })
  category!: QuizCategory | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updatedAt!: Date;
}
