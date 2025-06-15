import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from 'typeorm';
import { Color } from '../color/color.entity';
import { Video } from 'src/video/video.entity';
import { User } from 'src/user/user.entity';

@Entity()
export class LabAnimal {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  age: number;

  @Column()
  sex: boolean; // Например, "Male" / "Female"

  @Column({ nullable: true })
  name?: string;

  @Column({ type: 'float', nullable: true })
  weight?: number; // Вес в кг

  @Column({ nullable: true })
  imagePath?: string;

  @ManyToOne(() => Color, (color) => color.animals)
  color: Color;

  @OneToMany(() => Video, (v) => v.labAnimal)
  videos: Video[];

  @ManyToOne(() => User, (user) => user.labAnimals)
  user: User;
}
