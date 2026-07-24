import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { TaskPaginationDto } from 'src/tasks/dto/task-pagination.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly userService: UsersService) {}

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.createUser(createUserDto);
  }
  @Get()
  findAll(@Query() paginatedDto: TaskPaginationDto) {
    return this.userService.findAll(paginatedDto);
  }
  @Get('email/:email')
  findByEmail(@Param('email') email: string) {
    return this.userService.findByEmail(email);
  }
  @Delete('/:id')
  deleteByid(@Param('id') id: number) {
    return this.userService.deleteById(id);
  }

  @Get(':id/tasks')
  findUserTasks(@Param('id') id: number) {
    return this.userService.findUserTasks(id);
  }
}
