import { HttpException, HttpStatus, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UserService } from '../user/user.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { User } from '../user/user.entity';

@Injectable()
export class AuthService {
    constructor(
        private readonly userService: UserService,
        private readonly jwtService: JwtService
    ){}

    async login(userDto: LoginDto){
        const user = await this.validateUser(userDto);
        const { token } = await this.generateToken(user);
        return { token, user };
    }

    private async validateUser(userDto: LoginDto) {
        // Ищем пользователя в таблице `users`
        const user = await this.userService.getUserByLoginForValidate(userDto.login);

        if (!user) {
            throw new UnauthorizedException({ message: 'Пользователь не найден' });
        }
        console.log('user', user, userDto);

        // Проверяем пароль
        const passwordEquals = await bcrypt.compare(userDto.password, user.password);
        if (!passwordEquals) {
            throw new UnauthorizedException({ message: 'Некорректный пароль' });
        }

        return user;
    }

    async registration(userDto: RegisterDto){
        // Проверяем, существует ли пользователь
        const existingUser = await this.userService.getUserByLogin(userDto.login);
        if (existingUser) {
            throw new HttpException('Пользователь с таким логином уже существует!', HttpStatus.BAD_REQUEST);
        }

        const user = await this.userService.createUser(userDto);

        // Генерируем токен
        const { token } = await this.generateToken(user);
        return { token, user };
    }

    private async generateToken(user: User){
        const payload = { email: user.email, login: user.login };
        return {
            token: this.jwtService.sign(payload)
        };
    }

    async getUserInfo(token: string) {
        let userLogin;
        // console.log('token');
        try {
            const decoded = this.jwtService.verify(token);
            userLogin = decoded.login;
        } catch (e) {
            throw new UnauthorizedException('Неверный токен');
        }

        const user = await this.userService.getUserByLogin(userLogin);

        if (!user) {
            throw new UnauthorizedException('Пользователь не найден');
        }

        return user;
    }
}
