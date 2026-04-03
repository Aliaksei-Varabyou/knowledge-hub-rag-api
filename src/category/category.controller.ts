import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { CategoryService } from './category.service';
import { isValidUUID } from 'src/common/utils';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Controller('category')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}
  
  @Get()
  async getAllCategories() {
    return await this.categoryService.findAll();
  }

  @Get(':id')
  async getCategoryById(@Param('id') id: string) {
    if (!isValidUUID(id)) {
      throw new BadRequestException('Invalid ID format');
    }
    const category = await this.categoryService.findByIdOrThrow(id);
    return category;
  }

  @Post()
  async createCategory(@Body() createCategoryDto: CreateCategoryDto) {
    return await this.categoryService.create(createCategoryDto);
  }

  @Put(':id')
  async updateCategory(@Param('id') id: string, @Body() updateCategoryDto: UpdateCategoryDto) {
    if (!isValidUUID(id)) {
      throw new BadRequestException('Invalid ID format');
    }
    return await this.categoryService.update(id, updateCategoryDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteCategory(@Param('id') id: string) {
    if (!isValidUUID(id)) {
      throw new BadRequestException('Invalid ID format');
    }
    return await this.categoryService.delete(id);
  }

}
