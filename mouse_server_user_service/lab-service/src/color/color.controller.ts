import { Controller, Get, Post, Delete, Body, Param } from '@nestjs/common';
import { ColorService } from './color.service';
import { CreateColorDto } from './dto/create-color.dto';
import { Color } from './color.entity';

@Controller('color')
export class ColorController {
  constructor(private readonly colorService: ColorService) {}

  @Post()
  createColor(@Body() dto: CreateColorDto): Promise<Color> {
    return this.colorService.createColor(dto);
  }

  @Get()
  getAllColors(): Promise<Color[]> {
    return this.colorService.getAllColors();
  }

  @Get(':id')
  getColorById(@Param('id') id: number): Promise<Color | null> {
    return this.colorService.getColorById(id);
  }

  @Delete(':id')
  deleteColor(@Param('id') id: number): Promise<void> {
    return this.colorService.deleteColor(id);
  }
}
