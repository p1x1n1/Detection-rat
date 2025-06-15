import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LabAnimal } from './lab-animal.entity';
import { CreateLabAnimalDto } from './dto/create-lab-animal.dto';
import * as path from 'path';
import * as fs from 'fs/promises';
import { JwtUserPayload } from 'src/auth/jwt.strategy';

@Injectable()
export class LabAnimalService {
  constructor(
    @InjectRepository(LabAnimal)
    private readonly labAnimalRepository: Repository<LabAnimal>,
  ) {}

  async createLabAnimal(dto: CreateLabAnimalDto, imagePath: string, user: JwtUserPayload): Promise<LabAnimal> {
    const labAnimal = this.labAnimalRepository.create({
      age: dto.age,
      sex: dto.sex,
      name: dto.name,
      weight: dto.weight,
      imagePath,
      color: { id: dto.colorId },
      user: { login: user.login },
    });

    return this.labAnimalRepository.save(labAnimal);
  }

  async getAllLabAnimals(user: JwtUserPayload): Promise<LabAnimal[]> {
    return this.labAnimalRepository.find({
      where: { user: { login: user.login } },
      relations: ['color', 'videos'],
    });
  }

  async getLabAnimalById(id: number, user: JwtUserPayload): Promise<LabAnimal | null> {
    const animal = await this.labAnimalRepository.findOne({
      where: { id },
      relations: ['color', 'videos', 'user'],
    });

    if (!animal) throw new NotFoundException(`Животное с id=${id} не найдено`);
    if (animal.user?.login !== user.login) throw new ForbiddenException('Нет доступа');

    return animal;
  }

  async deleteLabAnimal(id: number, user: JwtUserPayload): Promise<void> {
    const animal = await this.getLabAnimalById(id, user);
    await this.labAnimalRepository.remove(animal);
  }

  async updateLabAnimal(
    id: number,
    dto: Partial<CreateLabAnimalDto>,
    newImagePath: string | undefined,
    user: JwtUserPayload
  ): Promise<LabAnimal> {
    const animal = await this.getLabAnimalById(id, user);

    animal.name = dto.name ?? animal.name;
    animal.age = dto.age ?? animal.age;
    animal.weight = dto.weight ?? animal.weight;
    animal.sex = dto.sex ?? animal.sex;

    if (dto.colorId) {
      animal.color = { id: dto.colorId } as any;
    }

    if (newImagePath) {
      if (animal.imagePath) {
        const oldPath = path.join(process.cwd(), 'static', animal.imagePath.replace(/^\/?static\/?/, ''));
        try {
          await fs.unlink(oldPath);
        } catch (e) {
          console.warn(`Не удалось удалить старое изображение: ${oldPath}`);
        }
      }

      animal.imagePath = newImagePath;
    }

    return this.labAnimalRepository.save(animal);
  }
}
