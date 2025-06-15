import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { CreateUserDto, UpdateUserDto } from './dto/create-user.dto';

@Injectable()
export class UserService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
    ) { }

    async createUser(dto: CreateUserDto): Promise<User> {
        // const salt = await bcrypt.genSalt(10);
        // const hashedPassword = await bcrypt.hash(dto.password, salt);

        const user = this.userRepository.create(dto);
        return this.userRepository.save(user);
    }

    async updateUser(login: string, dto: UpdateUserDto): Promise<User> {
        // 1) preload создаёт новый Entity и загружает существующий по PK (login)
        const user = await this.userRepository.preload({
          login,
          ...dto,
        });
        if (!user) {
          throw new NotFoundException(`Пользователь с логином ${login} не найден`);
        }
        // 2) если нужно — здесь можно ещё захешировать пароль и т.п.
    
        return this.userRepository.save(user);
      }

    async getAllUsers(): Promise<User[]> {
        return this.userRepository.find({ relations: ['role'] });
    }

    async getUserByLogin(login: string): Promise<User | null> {
        return this.userRepository.findOne({ where: { login }, relations: ['role'] });
    }

    async getUserByLoginForValidate(login: string): Promise<User | null> {
        return this.userRepository.createQueryBuilder('user')
        .addSelect('user.password') // Добавляем выборку пароля
        .leftJoinAndSelect('user.role', 'role') // Подключаем роль пользователя
        .where('user.login = :login', { login })
        .getOne();
    }

    async deleteUser(login: string): Promise<void> {
        await this.userRepository.delete({ login });
    }
}
