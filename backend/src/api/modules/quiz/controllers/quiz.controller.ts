import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PaginatedResponse } from 'src/common/dto/paginated-response.dto';
import { QuizService } from '../services/quiz.service';
import { QuizProblemSetService } from '../services/quiz-problem-set.service';
import { QuizRegistrationService } from '../services/quiz-registration.service';
import { QuizRecordService } from '../services/quiz-record.service';
import { CreateQuizDto } from '../dto/create-quiz.dto';
import { QuizListQueryDto } from '../dto/quiz-list-query.dto';
import { QuizRecordQueryDto } from '../dto/quiz-record-query.dto';
import {
  QuizSummaryDto,
  QuizDetailDto,
  QuizProblemSummaryDto,
  QuizRegistrationDto,
  QuizRecordDto,
} from '../dto/quiz-response.dto';
import { UpdateQuizDto } from '../dto/update-quiz.dto';
import { CreateQuizRecordDto } from '../dto/create-quiz-record.dto';
import {
  AttachQuizProblemsDto,
  DetachQuizProblemsDto,
  UpdateQuizProblemDisplayDto,
} from '../dto/update-quiz-problems.dto';
import { JwtAuthGuard } from '../../user/guards/jwt-auth.guard';
import { RolesGuard } from '../../user/guards/roles.guard';
import { Public } from '../../user/decorators/public.decorator';
import { CurrentUser } from '../../user/decorators/current-user.decorator';
import { UserRole } from '../../user/entities/user.entity';
import { QuizScoreboardService } from '../services/quiz-scoreboard.service';
import { ScoreboardDto } from '../dto/scoreboard.dto';

/** Controller orchestrating quiz CRUD, registration, and record endpoints. */
@ApiTags('quizzes')
@Controller('quizzes')
@UseGuards(JwtAuthGuard, RolesGuard)
export class QuizController {
  constructor(
    private readonly quizService: QuizService,
    private readonly quizProblemSetService: QuizProblemSetService,
    private readonly quizRegistrationService: QuizRegistrationService,
    private readonly quizRecordService: QuizRecordService,
    private readonly quizScoreboardService: QuizScoreboardService,
  ) {}

  @Post()
  async create(
    @Body() dto: CreateQuizDto,
    @CurrentUser() user: { userId: string; userName: string; role: UserRole },
  ): Promise<QuizDetailDto> {
    return this.quizService.createQuiz(dto, user);
  }

  @Get()
  @Public()
  async findAll(
    @Query() query: QuizListQueryDto,
  ): Promise<PaginatedResponse<QuizSummaryDto>> {
    const { items, total } = await this.quizService.findAll(query);
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    return new PaginatedResponse(items, total, page, pageSize);
  }

  @Get(':id')
  @Public()
  async findById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<QuizDetailDto> {
    return this.quizService.findById(id);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateQuizDto,
    @CurrentUser() user: { userId: string; userName: string; role: UserRole },
  ): Promise<QuizDetailDto> {
    return this.quizService.updateQuiz(id, dto, user);
  }

  @Delete(':id')
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: { userId: string; userName: string; role: UserRole },
  ): Promise<void> {
    await this.quizService.removeQuiz(id, user);
  }

  @Post(':id/register')
  async register(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: { userId: string; userName: string; role: UserRole },
  ): Promise<QuizRegistrationDto> {
    return this.quizRegistrationService.registerParticipant(id, user);
  }

  @Delete(':id/register')
  async unregister(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: { userId: string; userName: string; role: UserRole },
  ): Promise<void> {
    await this.quizRegistrationService.unregisterParticipant(id, user);
  }

  @Get(':id/problems')
  @Public()
  async findProblems(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<QuizProblemSummaryDto[]> {
    return this.quizProblemSetService.listProblems(id);
  }

  @Post(':id/problems')
  async attachProblems(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AttachQuizProblemsDto,
    @CurrentUser() user: { userId: string; userName: string; role: UserRole },
  ): Promise<void> {
    await this.quizService.ensureMutable(id, user);
    await this.quizProblemSetService.attachProblems(id, dto.items ?? []);
  }

  @Patch(':id/problems')
  async updateProblemDisplayIds(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateQuizProblemDisplayDto,
    @CurrentUser() user: { userId: string; userName: string; role: UserRole },
  ): Promise<void> {
    await this.quizService.ensureMutable(id, user);
    await this.quizProblemSetService.updateDisplayIds(id, dto.items ?? []);
  }

  @Delete(':id/problems')
  async detachProblems(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: DetachQuizProblemsDto,
    @CurrentUser() user: { userId: string; userName: string; role: UserRole },
  ): Promise<void> {
    await this.quizService.ensureMutable(id, user);
    await this.quizProblemSetService.detachProblems(id, dto);
  }

  @Get(':id/registrations')
  async findRegistrations(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<QuizRegistrationDto[]> {
    return this.quizRegistrationService.listRegistrations(id);
  }

  @Post(':id/records')
  async createRecord(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateQuizRecordDto,
    @CurrentUser() user: { userId: string; userName: string; role: UserRole },
  ): Promise<QuizRecordDto> {
    return this.quizRecordService.createRecord(id, dto, user);
  }

  @Get(':id/records')
  @Public()
  async findRecords(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: QuizRecordQueryDto,
  ): Promise<QuizRecordDto[]> {
    return this.quizRecordService.findRecords(id, query);
  }

  @Get(':id/scoreboard')
  @Public()
  async getScoreboard(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ScoreboardDto> {
    return this.quizScoreboardService.getScoreboard(id);
  }
}
