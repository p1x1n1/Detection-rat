import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean } from 'class-validator';

export class CreateVideoDto {
    @ApiProperty()
    name: string;

    @ApiProperty()
    description: string;

    @ApiProperty()
    date: Date;

    @ApiProperty()
    labAnimalId: number;

    @ApiProperty({ required: false, default: false })
    @IsBoolean()
    @Transform(({ value }) => value === 'true')
    isExperimentAnimal?: boolean;
}
