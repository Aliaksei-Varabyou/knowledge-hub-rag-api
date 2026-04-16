import { Injectable, NotFoundException } from '@nestjs/common';
import { Category } from 'src/common/types';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class CategoryService {
  constructor(private prisma: PrismaService) {}

  async findAll(): Promise<Category[]> {
    return this.prisma.category.findMany();
  }

  async findById(id: string): Promise<Category | undefined> {
    return await this.prisma.category.findUnique({
      where: { id },
    });
  }

  async findByIdOrThrow(id: string): Promise<Category | never> {
    const category = await this.findById(id);
    if (!category) {
      throw new NotFoundException(`Category with ID "${id}" not found`);
    }
    return category;
  }

  async create(createCategoryDto: CreateCategoryDto): Promise<Category> {
    return this.prisma.category.create({
      data: {
        name: createCategoryDto.name,
        description: createCategoryDto.description,
      },
    });
  }

  async update(
    id: string,
    updateCategoryDto: UpdateCategoryDto,
  ): Promise<Category> {
    const category = await this.findByIdOrThrow(id);
    return this.prisma.category.update({
      where: { id },
      data: {
        name:
          updateCategoryDto.name !== undefined
            ? updateCategoryDto.name
            : category.name,
        description:
          updateCategoryDto.description !== undefined
            ? updateCategoryDto.description
            : category.description,
      },
    });
  }

  async delete(id: string): Promise<void> {
    await this.findByIdOrThrow(id);
    this.prisma.$transaction(async (tx) => {
      await tx.article.updateMany({
        where: { categoryId: id },
        data: { categoryId: null },
      });

      return tx.category.delete({
        where: { id },
      });
    });
  }
}
