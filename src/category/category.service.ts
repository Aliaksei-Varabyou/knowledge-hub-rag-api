import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { PrismaService } from 'prisma/prisma.service';
import { Category } from 'generated/prisma/client';

@Injectable()
export class CategoryService {
  constructor(private prisma: PrismaService) {}

  async findAll(): Promise<Category[]> {
    return this.prisma.category.findMany();
  }

  async findById(id: string): Promise<Category | null> {
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
      data: createCategoryDto,
    });
  }

  async update(
    id: string,
    updateCategoryDto: UpdateCategoryDto,
  ): Promise<Category> {
    await this.findByIdOrThrow(id);
    return this.prisma.category.update({
      where: { id },
      data: updateCategoryDto,
    });
  }

  async delete(id: string): Promise<void> {
    try {
      await this.prisma.category.delete({
        where: { id },
      });
    } catch {
      throw new NotFoundException(`Category with ID "${id}" not found`);
    }
  }
}
