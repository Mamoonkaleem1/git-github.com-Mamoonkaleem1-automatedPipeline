import {
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class TasksService {
  constructor(private readonly prisma: PrismaService) {}
  async create(createTaskDto: CreateTaskDto) {
    try {
      const user = await this.prisma.user.findUnique({
        where: {
          id: createTaskDto.userId,
        },
      });

      if (!user) {
        throw new NotFoundException('User not found.');
      }

      const task = await this.prisma.task.create({
        data: {
          title: createTaskDto.title,
          description: createTaskDto.description,
          status: createTaskDto.status,
          priority: createTaskDto.priority,
          dueDate: createTaskDto.dueDate
            ? new Date(createTaskDto.dueDate)
            : null,

          user: {
            connect: {
              id: createTaskDto.userId,
            },
          },
        },

        select: {
          id: true,
          title: true,
          description: true,
          status: true,
          priority: true,
          dueDate: true,
          createdAt: true,

          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      return {
        success: true,
        message: 'Task created successfully.',
        data: task,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      console.log(error);
      throw new InternalServerErrorException('Failed to create task.');
    }
  }

  async findAll() {
    try {
      const tasks = await this.prisma.task.findMany({
        select: {
          id: true,
          title: true,
          description: true,
          status: true,
          priority: true,
          dueDate: true,
          createdAt: true,

          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },

        orderBy: {
          createdAt: 'desc',
        },
      });

      return {
        success: true,
        message: tasks.length
          ? 'Tasks fetched successfully.'
          : 'No tasks found.',
        data: tasks,
      };
    } catch (error) {
      console.error(error);

      throw new InternalServerErrorException('Failed to fetch tasks.');
    }
  }

  async findOne(id: number) {
    try {
      const task = await this.prisma.task.findUnique({
        where: {
          id,
        },

        select: {
          id: true,
          title: true,
          description: true,
          status: true,
          priority: true,
          dueDate: true,
          createdAt: true,

          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      if (!task) {
        throw new NotFoundException('Task not found.');
      }

      return {
        success: true,
        message: 'Task fetched successfully.',
        data: task,
      };
    } catch (error) {
      console.error(error);
      if (error instanceof HttpException) {
        throw error;
      }

      throw new InternalServerErrorException('Failed to fetch task.');
    }
  }

  async update(id: number, updateTaskDto: any) {
    try {
      const task = await this.prisma.task.update({
        where: { id },
        data: {
          title: updateTaskDto.title,
          description: updateTaskDto.description,
          status: updateTaskDto.status,
          priority: updateTaskDto.priority,

          dueDate: updateTaskDto.dueDate
            ? new Date(updateTaskDto.dueDate)
            : undefined,
        },
        select: {
          id: true,
          title: true,
          description: true,
          status: true,
          priority: true,
          dueDate: true,

          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      return {
        success: true,
        message: 'Task updated successfully.',
        data: task,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException('Task not found.');
      }
      console.log('err in updating task...', error.message);

      throw new InternalServerErrorException('Failed to update task.');
    }
  }
  async remove(id: number) {
    try {
      await this.prisma.task.delete({
        where: {
          id,
        },
      });

      return {
        success: true,
        message: 'Task deleted successfully.',
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException('Task not found.');
      }

      throw new InternalServerErrorException('Failed to delete task.');
    }
  }
}
