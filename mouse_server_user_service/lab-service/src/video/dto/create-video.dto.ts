import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsNumber, IsOptional } from 'class-validator';

export class CreateVideoDto {
  @ApiProperty()
  name: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  date: Date;

  @ApiProperty({ required: false, type: Number, nullable: true })
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => (value === null || value === '' || value == 'null' || value == 'undefined' ? null : Number(value)))
  labAnimalId: number | null;

  @ApiProperty({ required: false, default: false })
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  isExperimentAnimal?: boolean;
}
