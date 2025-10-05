import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PaginatedResponse } from 'src/common/dto/paginated-response.dto';
import { SubmissionService } from '../services/submission.service';
import { CreateSubmissionDto } from '../dto/create-submission.dto';
import { SubmissionListQueryDto } from '../dto/submission-list-query.dto';
import { Judge } from '../entities/judge.entity';
import { JudgeCase } from '../entities/judge-case.entity';
import { SubmissionProgressService } from '../services/progress.service';
import { ProblemProgressDto, ProblemSubmissionHistoryResponseDto } from '../dto/problem-progress.dto';
import { JwtAuthGuard } from '../../user/guards/jwt-auth.guard';
import { CurrentUser } from '../../user/decorators/current-user.decorator';
import { UserRole } from '../../user/entities/user.entity';

/** Controller exposing endpoints for submission creation and retrieval. */
@ApiTags('submissions')
@Controller('submissions')
export class SubmissionController {
  constructor(
    private readonly submissionService: SubmissionService,
    private readonly progressService: SubmissionProgressService,
  ) {}

  @Post()
  async create(@Body() dto: CreateSubmissionDto): Promise<Judge> {
    return this.submissionService.createSubmission(dto);
  }

  @Get()
  async findAll(
    @Query() query: SubmissionListQueryDto,
  ): Promise<PaginatedResponse<Judge>> {
    const { items, total } = await this.submissionService.findAll(query);
    return new PaginatedResponse(items, total, query.page, query.pageSize);
  }

  @Get(':id')
  async findById(@Param('id', ParseIntPipe) id: number): Promise<Judge> {
    return this.submissionService.findSubmissionById(id);
  }

  @Get(':id/cases')
  async findCases(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<JudgeCase[]> {
    return this.submissionService.findCasesBySubmission(id);
  }

  @Get('users/me/problems')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async listUserProblems(
    @CurrentUser() user: { userId: string; userName: string; role: UserRole },
    @Query('quizId') quizId?: number,
    @Query('onlySolved') onlySolved?: string,
  ): Promise<ProblemProgressDto[]> {
    return this.progressService.listUserProblems(user.userId, {
      quizId: quizId ? Number(quizId) : undefined,
      onlySolved: onlySolved === 'true',
    });
  }

  @Get('users/me/problems/:displayProblemId/history')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async getProblemHistory(
    @CurrentUser() user: { userId: string; userName: string; role: UserRole },
    @Param('displayProblemId') displayProblemId: string,
  ): Promise<ProblemSubmissionHistoryResponseDto> {
    return this.progressService.getProblemHistory(user.userId, displayProblemId);
  }
}
