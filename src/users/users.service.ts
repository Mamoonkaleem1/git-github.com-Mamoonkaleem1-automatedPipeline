import {
  ConflictException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';
import { Prisma } from '@prisma/client';
import { TaskPaginationDto } from 'src/tasks/dto/task-pagination.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async createUser(createUserDto: CreateUserDto) {
    try {
      // Hash password
      const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

      // Create user
      const user = await this.prisma.user.create({
        data: {
          ...createUserDto,
          password: hashedPassword,
        },

        // Never expose password
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return {
        success: true,
        message: 'User created successfully.',
        data: user,
      };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('User already exists with this email.');
      }

      throw new InternalServerErrorException('Failed to create user.');
    }
  }
  async findAll(paginationDto: TaskPaginationDto) {
    const { page, limit } = paginationDto;

    const skip = (page - 1) * limit;

    const [users, totalItems] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        skip,
        take: limit,

        select: {
          id: true,
          name: true,
          email: true,

          _count: {
            select: {
              tasks: true,
            },
          },
        },

        orderBy: {
          createdAt: 'desc',
        },
      }),

      this.prisma.user.count(),
    ]);

    const totalPages = Math.ceil(totalItems / limit);

    const formattedUsers = users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      totalTasks: user._count.tasks,
    }));

    return {
      success: true,
      message: 'Users fetched successfully.',
      data: formattedUsers,
      meta: {
        page,
        limit,
        totalItems,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }
  async findByEmail(email: string) {
    return await this.prisma.user.findUnique({
      where: {
        email,
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });
  }

  async deleteById(id: number) {
    try {
      await this.prisma.user.delete({
        where: {
          id,
        },
      });

      return {
        success: true,
        message: 'User deleted successfully.',
      };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException('User not found.');
        }
      }

      throw new InternalServerErrorException('Failed to delete user.');
    }
  }
  async findUserTasks(id: number) {
    try {
      const userTasks = await this.prisma.user.findUnique({
        where: {
          id,
        },
        include: {
          tasks: {
            orderBy: {
              createdAt: 'desc',
            },
          },
        },
      });

      return {
        success: true,
        message: 'user with tasks fetched.',
        userTasks,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      console.log('err in findining user task...', error.message);
      throw new InternalServerErrorException('err in findining user task.');
    }
  }
}
