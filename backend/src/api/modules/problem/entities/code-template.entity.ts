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
import { Language } from './language.entity';

@Entity({ name: 'code_templates' })
export class CodeTemplate {
  @PrimaryGeneratedColumn({ type: 'int' })
  id!: number;

  @Column({ name: 'pid', type: 'int' })
  problemId!: number;

  @ManyToOne(() => Problem)
  @JoinColumn({ name: 'pid', referencedColumnName: 'id' })
  problem!: Problem;

  @Column({ name: 'lid', type: 'int' })
  languageId!: number;

  @ManyToOne(() => Language)
  @JoinColumn({ name: 'lid', referencedColumnName: 'id' })
  language!: Language;

  @Column({ name: 'code_template', type: 'varchar' })
  codeTemplate!: string;

  @Column({ name: 'status', type: 'boolean', default: false })
  status!: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updatedAt!: Date;
}
