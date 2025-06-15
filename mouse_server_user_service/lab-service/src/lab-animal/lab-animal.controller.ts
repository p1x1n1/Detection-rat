import {
  Controller, Get, Post, Delete, Body, Param, UseInterceptors,
  UploadedFile, Patch, UseGuards
} from '@nestjs/common';
import { LabAnimalService } from './lab-animal.service';
import { CreateLabAnimalDto } from './dto/create-lab-animal.dto';
import { LabAnimal } from './lab-animal.entity';
import { FileInterceptor } from '@nestjs/platform-express';
import { FileService } from '../file/file.service';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser, JwtUserPayload } from 'src/auth/jwt.strategy';

@Controller('lab-animal')
@UseGuards(AuthGuard('jwt'))
export class LabAnimalController {
  constructor(
    private readonly labAnimalService: LabAnimalService,
    private readonly fileService: FileService
  ) {}

  @Post()
  @UseInterceptors(FileInterceptor('image', {
    limits: { fileSize: 5 * 1024 * 1024 },
  }))
  createLabAnimal(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: CreateLabAnimalDto,
    @CurrentUser() user: JwtUserPayload
  ): Promise<LabAnimal> {
    const imagePath = this.fileService.saveFile(file);
    return this.labAnimalService.createLabAnimal(dto, imagePath, user);
  }

  @Get()
  getAllLabAnimals(@CurrentUser() user: JwtUserPayload): Promise<LabAnimal[]> {
    return this.labAnimalService.getAllLabAnimals(user);
  }

  @Get(':id')
  getLabAnimalById(
    @Param('id') id: number,
    @CurrentUser() user: JwtUserPayload
  ): Promise<LabAnimal | null> {
    return this.labAnimalService.getLabAnimalById(id, user);
  }

  @Delete(':id')
  deleteLabAnimal(
    @Param('id') id: number,
    @CurrentUser() user: JwtUserPayload
  ): Promise<void> {
    return this.labAnimalService.deleteLabAnimal(id, user);
  }

  @Patch(':id')
  @UseInterceptors(FileInterceptor('image', {
    limits: { fileSize: 5 * 1024 * 1024 },
  }))
  updateLabAnimal(
    @Param('id') id: number,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: Partial<CreateLabAnimalDto>,
    @CurrentUser() user: JwtUserPayload
  ): Promise<LabAnimal> {
    const imagePath = file ? this.fileService.saveFile(file) : undefined;
    return this.labAnimalService.updateLabAnimal(id, dto, imagePath, user);
  }
}
