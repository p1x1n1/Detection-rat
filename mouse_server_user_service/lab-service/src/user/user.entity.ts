import { Entity, Column, ManyToOne, PrimaryColumn, OneToMany, BeforeInsert, BeforeUpdate, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Role } from '../role/role.entity';
import { Experiment } from '../experiment/experiment.entity';
import * as bcrypt from 'bcrypt';
import { LabAnimal } from 'src/lab-animal/lab-animal.entity';
import { Video } from 'src/video/video.entity';

@Entity()
export class User {
  @PrimaryColumn()
  login: string;

  @Column({ unique: true })
  email: string;

  @Column()
  name: string;

  @Column()
  firstname: string;

  @Column()
  lastname: string;

  @Column({ select: false }) // Скрываем пароль при выборке
  password: string;

  @Column()
  phone: string;

  @Column({nullable: true})
  imagePath: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Role, (role) => role.users)
  role: Role;

  @OneToMany(() => Experiment, (experiment) => experiment.user)
  experiments: Experiment[];

  @OneToMany(() => Video, (v) => v.user)
  videos: Video[];

  @OneToMany(() => LabAnimal, (la) => la.user)
  labAnimals: LabAnimal[];

  // Хеширование пароля перед сохранением
  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword() {
    if (this.password) {
      this.password = await bcrypt.hash(this.password, 10);
    }
  }
}
