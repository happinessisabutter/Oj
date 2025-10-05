import {
  Controller,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UserService } from '../services/user.service';
import { PaginateDto } from 'src/common/dto/paginate.dto';
import { PaginatedResponse } from 'src/common/dto/paginated-response.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { UserResponseDto } from '../dto/user-response.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { UserRole } from '../entities/user.entity';
import { plainToClass } from 'class-transformer';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  /**
   * GET /users
   * List all users (Admin only)
   */
  @Get()
  @Roles(UserRole.ADMIN)
  async findAll(
    @Query() paginateDto: PaginateDto,
  ): Promise<PaginatedResponse<UserResponseDto>> {
    const { users, total } = await this.userService.findAll(paginateDto);
    const { page, pageSize } = paginateDto;

    const userDtos = users.map((user) =>
      plainToClass(UserResponseDto, user, { excludeExtraneousValues: true }),
    );

    return new PaginatedResponse(userDtos, total, page, pageSize);
  }

  /**
   * GET /users/:id
   * Get user by ID
   */
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<UserResponseDto> {
    const user = await this.userService.findById(id);
    return plainToClass(UserResponseDto, user, {
      excludeExtraneousValues: true,
    });
  }

  /**
   * PATCH /users/:id
   * Update user
   */
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    const user = await this.userService.update(id, updateUserDto);
    return plainToClass(UserResponseDto, user, {
      excludeExtraneousValues: true,
    });
  }

  /**
   * DELETE /users/:id
   * Delete user (Admin only)
   */
  @Delete(':id')
  @Roles(UserRole.ADMIN)
  async remove(@Param('id') id: string): Promise<void> {
    await this.userService.delete(id);
  }
}
