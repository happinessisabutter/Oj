import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Problem } from '../entities/problem.entity';
import { Tag } from '../entities/tag.entity';
import { ProblemTag } from '../entities/problem-tag.entity';
import { AttachProblemTagsDto, DetachProblemTagsDto } from '../dto/problem-tag.dto';
import { UserRole } from '../../user/entities/user.entity';
import { ProblemService } from './problem.service';

/**
 * Service responsible for attaching and detaching tags for problems.
 */
@Injectable()
export class ProblemTagService {
  constructor(
    @InjectRepository(ProblemTag)
    private readonly problemTagRepository: Repository<ProblemTag>,
    @InjectRepository(Problem)
    private readonly problemRepository: Repository<Problem>,
    @InjectRepository(Tag)
    private readonly tagRepository: Repository<Tag>,
    private readonly problemService: ProblemService,
  ) {}

  async list(problemId: number): Promise<Tag[]> {
    await this.ensureProblemExists(problemId);
    const relations = await this.problemTagRepository.find({
      where: { problem: { id: problemId } },
      relations: ['tag'],
      order: { id: 'ASC' },
    });
    return relations.map((relation) => relation.tag);
  }

  async attach(
    problemId: number,
    dto: AttachProblemTagsDto,
    user: { userId: string; userName: string; role: UserRole },
  ): Promise<Tag[]> {
    const problem = await this.problemService.ensureMutable(problemId, user);

    const tags = await this.findTags(dto.tagIds);
    const existingRelations = await this.problemTagRepository.find({
      where: {
        problem: { id: problem.id },
        tag: { id: In(tags.map((tag) => tag.id)) },
      },
      relations: ['tag'],
    });

    const existingTagIds = new Set(existingRelations.map(({ tag }) => tag.id));
    const toCreate = tags.filter((tag) => !existingTagIds.has(tag.id));

    if (toCreate.length) {
      const entries = toCreate.map((tag) =>
        this.problemTagRepository.create({ problem, tag }),
      );
      await this.problemTagRepository.save(entries);
    }

    return this.list(problem.id);
  }

  async detach(
    problemId: number,
    dto: DetachProblemTagsDto,
    user: { userId: string; userName: string; role: UserRole },
  ): Promise<Tag[]> {
    await this.problemService.ensureMutable(problemId, user);

    await this.problemTagRepository.delete({
      problem: { id: problemId } as any,
      tag: { id: In(dto.tagIds) } as any,
    });

    return this.list(problemId);
  }

  private async ensureProblemExists(problemId: number) {
    const problem = await this.problemRepository.findOne({ where: { id: problemId } });
    if (!problem) {
      throw new NotFoundException(`Problem ${problemId} not found`);
    }
  }

  private async findTags(tagIds: number[]) {
    const tags = await this.tagRepository.find({ where: { id: In(tagIds) } });
    if (tags.length !== tagIds.length) {
      const missing = tagIds.filter(
        (id) => !tags.some((tag) => tag.id === id),
      );
      throw new NotFoundException(`Tags not found: ${missing.join(', ')}`);
    }
    return tags;
  }
}
