import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { LabAnimal } from '../lab-animal/lab-animal.entity';

@Entity()
export class Color {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  colorName: string;

  @OneToMany(() => LabAnimal, (animal) => animal.color)
  animals: LabAnimal[];
}
