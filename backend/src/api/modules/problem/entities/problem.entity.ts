import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';

export enum JudgeMode {
  NORMAL = 'normal',
  SPI = 'spi',
  INTERACTIVE = 'interactive',
}

export enum SpiCode {
  SPI = 'spi',
  INTERACTIVE = 'interactive',
  PROGRAM_CODE = 'program_code',
}

@Entity({ name: 'problems' })
export class Problem {
  [x: string]: any;
  @PrimaryGeneratedColumn({ type: 'int' })
  id!: number;

  @Column({ name: 'judge_mode', type: 'varchar', default: JudgeMode.SPI })
  judgeMode!: string;

  /**
   * it is a display id for problem, like "P1000" different from "id" which is a primary key
   */
  @Column({ name: 'problem_id', type: 'varchar', unique: true })
  problemId!: string;

  @Column({ type: 'varchar' })
  title!: string;

  @Column({ type: 'varchar', nullable: true })
  author!: string | null;

  @Column({ name: 'time_limit', type: 'int', default: -1, nullable: true })
  timeLimit!: number | null;

  @Column({ name: 'memory_limit', type: 'double precision', nullable: true })
  memoryLimit!: number | null;

  @Column({ name: 'stack_limit', type: 'int', default: 128 })
  stackLimit!: number;

  @Column({ name: 'stem', type: 'varchar' })
  stem!: string;

  /**
   * Text description of the input format. 
   * Explain what the program will read (structure, ranges, constraints)
   */
  @Column({ name: 'input', type: 'varchar' })
  input!: string;

  /**
   * Text description of the output format. 
   * Explain what the program will read (structure, ranges, constraints)
   */
  @Column({ name: 'output', type: 'varchar' })
  output!: string;

  /**
   * Example I/O
   */
  @Column({ name: 'example', type: 'varchar' })
  example!: string;

  @Column({ name: 'source', type: 'varchar' })
  source!: string;

  @Column({ name: 'difficulty', type: 'float', default: 0 })
  difficulty!: number;

  @Column({ name: 'spi_code', type: 'varchar', default: SpiCode.SPI })
  spiCode!: string;

  @Column({ name: 'spi_language', type: 'varchar' })
  spiLanguage!: string;

  @Column({ name: 'user_extra_file', type: 'varchar' })
  userExtraFile!: string;

  @Column({ name: 'judge_extra_file', type: 'varchar' })
  judgeExtraFile!: string;

  @Column({ name: 'is_remove_end_blank', type: 'boolean', default: false })
  isRemoveEndBlank!: boolean;

  @Column({ name: 'open_case_result', type: 'boolean', default: false })
  openCaseResult!: boolean;

  @Column({ name: 'case_version', type: 'varchar' })
  caseVersion!: string;

  @Column({ name: 'is_upload_case', type: 'boolean', default: false })
  isUploadCase!: boolean;

  // last modified user
  @Column({ name: 'modified_user', type: 'varchar' })
  modifiedUser!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updatedAt!: Date;
}
