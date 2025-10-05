import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { ProblemTagService } from '../services/problem-tag.service';
import { AttachProblemTagsDto, DetachProblemTagsDto } from '../dto/problem-tag.dto';
import { TagResponseDto } from '../dto/tag-response.dto';
import { JwtAuthGuard } from '../../user/guards/jwt-auth.guard';
import { RolesGuard } from '../../user/guards/roles.guard';
import { CurrentUser } from '../../user/decorators/current-user.decorator';
import { UserRole } from '../../user/entities/user.entity';

/** Controller responsible for attaching and detaching tags for problems. */
@ApiTags('problems')
@Controller('problems/:problemId/tags')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProblemTagController {
  constructor(private readonly problemTagService: ProblemTagService) {}

  @Get()
  async list(
    @Param('problemId', ParseIntPipe) problemId: number,
  ): Promise<TagResponseDto[]> {
    const tags = await this.problemTagService.list(problemId);
    return plainToInstance(TagResponseDto, tags, {
      excludeExtraneousValues: true,
    });
  }

  @Post()
  async attach(
    @Param('problemId', ParseIntPipe) problemId: number,
    @Body() dto: AttachProblemTagsDto,
    @CurrentUser() user: { userId: string; userName: string; role: UserRole },
  ): Promise<TagResponseDto[]> {
    const tags = await this.problemTagService.attach(problemId, dto, user);
    return plainToInstance(TagResponseDto, tags, {
      excludeExtraneousValues: true,
    });
  }

  @Delete()
  async detach(
    @Param('problemId', ParseIntPipe) problemId: number,
    @Body() dto: DetachProblemTagsDto,
    @CurrentUser() user: { userId: string; userName: string; role: UserRole },
  ): Promise<TagResponseDto[]> {
    const tags = await this.problemTagService.detach(problemId, dto, user);
    return plainToInstance(TagResponseDto, tags, {
      excludeExtraneousValues: true,
    });
  }
}
