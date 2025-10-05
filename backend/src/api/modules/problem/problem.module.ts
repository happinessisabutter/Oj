import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Problem } from './entities/problem.entity';
import { ProblemController } from './controllers/problem.controller';
import { ProblemService } from './services/problem.service';
import { ProblemCase } from './entities/problem-case.entity';
import { ProblemTag } from './entities/problem-tag.entity';
import { Tag } from './entities/tag.entity';
import { ProblemCaseService } from './services/problem-case.service';
import { ProblemTagService } from './services/problem-tag.service';
import { ProblemCaseController } from './controllers/problem-case.controller';
import { ProblemTagController } from './controllers/problem-tag.controller';
import { JwtAuthGuard } from '../user/guards/jwt-auth.guard';
import { RolesGuard } from '../user/guards/roles.guard';

@Module({
  imports: [TypeOrmModule.forFeature([Problem, ProblemCase, ProblemTag, Tag])],
  controllers: [ProblemController, ProblemCaseController, ProblemTagController],
  providers: [
    ProblemService,
    ProblemCaseService,
    ProblemTagService,
    JwtAuthGuard,
    RolesGuard,
  ],
  exports: [ProblemService],
})
export class ProblemModule {}
