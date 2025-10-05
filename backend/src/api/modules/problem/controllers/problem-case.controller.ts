import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { ProblemCaseService } from '../services/problem-case.service';
import { CreateProblemCaseDto } from '../dto/create-problem-case.dto';
import { UpdateProblemCaseDto } from '../dto/update-problem-case.dto';
import { ProblemCaseResponseDto } from '../dto/problem-case-response.dto';
import { JwtAuthGuard } from '../../user/guards/jwt-auth.guard';
import { RolesGuard } from '../../user/guards/roles.guard';
import { CurrentUser } from '../../user/decorators/current-user.decorator';
import { UserRole } from '../../user/entities/user.entity';

/** Controller exposing lifecycle endpoints for problem test cases. */
@ApiTags('problems')
@Controller('problems/:problemId/cases')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProblemCaseController {
  constructor(private readonly problemCaseService: ProblemCaseService) {}

  @Get()
  async list(
    @Param('problemId', ParseIntPipe) problemId: number,
  ): Promise<ProblemCaseResponseDto[]> {
    const cases = await this.problemCaseService.listCases(problemId);
    return plainToInstance(ProblemCaseResponseDto, cases, {
      excludeExtraneousValues: true,
    });
  }

  @Post()
  async create(
    @Param('problemId', ParseIntPipe) problemId: number,
    @Body() dto: CreateProblemCaseDto,
    @CurrentUser() user: { userId: string; userName: string; role: UserRole },
  ): Promise<ProblemCaseResponseDto> {
    const created = await this.problemCaseService.createCase(problemId, dto, user);
    return plainToInstance(ProblemCaseResponseDto, created, {
      excludeExtraneousValues: true,
    });
  }

  @Patch(':caseId')
  async update(
    @Param('problemId', ParseIntPipe) problemId: number,
    @Param('caseId', ParseIntPipe) caseId: number,
    @Body() dto: UpdateProblemCaseDto,
    @CurrentUser() user: { userId: string; userName: string; role: UserRole },
  ): Promise<ProblemCaseResponseDto> {
    const updated = await this.problemCaseService.updateCase(problemId, caseId, dto, user);
    return plainToInstance(ProblemCaseResponseDto, updated, {
      excludeExtraneousValues: true,
    });
  }

  @Delete(':caseId')
  async remove(
    @Param('problemId', ParseIntPipe) problemId: number,
    @Param('caseId', ParseIntPipe) caseId: number,
    @CurrentUser() user: { userId: string; userName: string; role: UserRole },
  ): Promise<void> {
    await this.problemCaseService.deleteCase(problemId, caseId, user);
  }
}
