import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Color } from './color.entity';
import { CreateColorDto } from './dto/create-color.dto';

@Injectable()
export class ColorService {
  constructor(
    @InjectRepository(Color)
    private readonly colorRepository: Repository<Color>,
  ) {}

  async createColor(dto: CreateColorDto): Promise<Color> {
    const color = this.colorRepository.create(dto);
    return this.colorRepository.save(color);
  }

  async getAllColors(): Promise<Color[]> {
    return this.colorRepository.find({ relations: ['animals'] });
  }

  async getColorById(id: number): Promise<Color | null> {
    return this.colorRepository.findOne({ where: { id }, relations: ['animals'] });
  }

  async deleteColor(id: number): Promise<void> {
    await this.colorRepository.delete(id);
  }
}
