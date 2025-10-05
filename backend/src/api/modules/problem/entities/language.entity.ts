import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'languages' })
export class Language {
  @PrimaryGeneratedColumn({ type: 'int' })
  id!: number;

  @Column({ name: 'content_type', type: 'varchar' })
  contentType!: string;

  @Column({ name: 'name', type: 'varchar' })
  name!: string;

  @Column({ name: 'compile_command', type: 'varchar' })
  compileCommand!: string;

  @Column({ name: 'template', type: 'varchar' })
  template!: string;

  @Column({ name: 'code_template', type: 'varchar' })
  codeTemplate!: string;

  @Column({ name: 'oj', type: 'varchar' })
  oj!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updatedAt!: Date;
}
