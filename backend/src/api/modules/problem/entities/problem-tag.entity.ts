import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Problem } from './problem.entity';
import { Tag } from './tag.entity';

/**
 * Join entity mapping problems to tags while allowing future metadata.
 */
@Entity({ name: 'problem_tags' })
@Unique('uq_problem_tag', ['problem', 'tag'])
export class ProblemTag {
  @PrimaryGeneratedColumn({ type: 'int' })
  id!: number;

  @ManyToOne(() => Problem, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'pid', referencedColumnName: 'id' })
  problem!: Problem;

  @ManyToOne(() => Tag, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tag_id', referencedColumnName: 'id' })
  tag!: Tag;
}
