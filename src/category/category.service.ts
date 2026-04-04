import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Category } from 'src/common/types';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { ArticleService } from 'src/article/article.service';

@Injectable()
export class CategoryService {
  private categories: Category[] = []
  constructor(private articleService: ArticleService) {}

  async findAll(): Promise<Category[]> {
    return this.categories;
  }

  findById(id: string): Category | undefined {
    return this.categories.find(category => category.id === id);
  }

  async findByIdOrThrow(id: string): Promise<Category | never> {
    const category  = await this.findById(id);
    if (!category) {
      throw new NotFoundException(`Category with ID "${id}" not found`);
    }
    return category;
  }

  async create(createCategoryDto: CreateCategoryDto): Promise<Category> {
    const category: Category = {
      id: randomUUID(),
      name: createCategoryDto.name,
      description: createCategoryDto.description
    }
    this.categories.push(category);
    return category;
  }

  async update(id: string, updateCategoryDto: UpdateCategoryDto): Promise<Category> {
    const category = await this.findByIdOrThrow(id);
    category.name = updateCategoryDto.name !== undefined ? updateCategoryDto.name : category.name;
    category.description = updateCategoryDto.description !== undefined ? updateCategoryDto.description : category.description;

    return category;
  }

  async delete(id: string): Promise<void> {
    await this.findByIdOrThrow(id);
    this.articleService.clearCategory(id);
    this.categories = this.categories.filter(category => category.id !== id);
  }
}
