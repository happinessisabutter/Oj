import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Problem } from '../../problem/entities/problem.entity';
import { User } from '../../user/entities/user.entity';
import { Judge } from '../../submission/entities/judge.entity';

@Entity({ name: 'quiz_records' })
export class QuizRecord {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id!: number;

  @Column({ name: 'tid', type: 'bigint', nullable: true })
  tid!: number | null;

  @Column({ name: 'tpid', type: 'bigint', nullable: true })
  tpid!: number | null;

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

  @Column({ name: 'submit_id', type: 'bigint', nullable: true })
  submitId!: number | null;

  @ManyToOne(() => Judge)
  @JoinColumn({ name: 'submit_id', referencedColumnName: 'submitId' })
  judge!: Judge | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updatedAt!: Date;
}
