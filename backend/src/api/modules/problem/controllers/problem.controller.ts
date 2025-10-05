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
import { ApiTags } from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { ProblemService } from '../services/problem.service';
import { ProblemListQueryDto } from '../dto/problem-list-query.dto';
import { PaginatedResponse } from 'src/common/dto/paginated-response.dto';
import { CreateProblemDto } from '../dto/create-problem.dto';
import { UpdateProblemDto } from '../dto/update-problem.dto';
import {
  ProblemDetailDto,
  ProblemSummaryDto,
} from '../dto/problem-response.dto';
import { JwtAuthGuard } from '../../user/guards/jwt-auth.guard';
import { RolesGuard } from '../../user/guards/roles.guard';
import { Public } from '../../user/decorators/public.decorator';
import { CurrentUser } from '../../user/decorators/current-user.decorator';
import { UserRole } from '../../user/entities/user.entity';

/** Controller exposing problem CRUD and query endpoints. */
@ApiTags('problems')
@Controller('problems')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProblemController {
  constructor(private readonly problemService: ProblemService) {}

  @Get()
  @Public()
  async findAll(
    @Query() query: ProblemListQueryDto,
  ): Promise<PaginatedResponse<ProblemSummaryDto>> {
    const { items, total } = await this.problemService.findAll(query);
    const summaries = items.map((item) =>
      plainToInstance(ProblemSummaryDto, item, {
        excludeExtraneousValues: true,
      }),
    );
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    return new PaginatedResponse(summaries, total, page, pageSize);
  }

  @Get(':id')
  @Public()
  async findById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ProblemDetailDto> {
    const detail = await this.problemService.findById(id);
    return plainToInstance(ProblemDetailDto, detail, {
      excludeExtraneousValues: true,
    });
  }

  @Get('display/:problemId')
  @Public()
  async findByProblemId(
    @Param('problemId') problemId: string,
  ): Promise<ProblemDetailDto> {
    const detail = await this.problemService.findByProblemId(problemId);
    return plainToInstance(ProblemDetailDto, detail, {
      excludeExtraneousValues: true,
    });
  }

  @Post()
  async create(
    @Body() dto: CreateProblemDto,
    @CurrentUser() user: { userId: string; userName: string; role: UserRole },
  ): Promise<ProblemDetailDto> {
    const detail = await this.problemService.createProblem(dto, user);
    return plainToInstance(ProblemDetailDto, detail, {
      excludeExtraneousValues: true,
    });
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProblemDto,
    @CurrentUser() user: { userId: string; userName: string; role: UserRole },
  ): Promise<ProblemDetailDto> {
    const detail = await this.problemService.updateProblem(id, dto, user);
    return plainToInstance(ProblemDetailDto, detail, {
      excludeExtraneousValues: true,
    });
  }

  @Delete(':id')
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: { userId: string; userName: string; role: UserRole },
  ): Promise<void> {
    await this.problemService.removeProblem(id, user);
  }
}
