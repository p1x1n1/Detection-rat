import { Controller, Post, Get, Body, Headers, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({ summary: 'Регистрация нового пользователя' })
  @ApiResponse({ status: 201, description: 'Пользователь зарегистрирован' })
  @Post('registration')
  register(@Body() dto: RegisterDto): Promise<{ token: string }> {
    return this.authService.registration(dto);
  }

  @ApiOperation({ summary: 'Авторизация пользователя' })
  @ApiResponse({ status: 200, description: 'Успешный вход' })
  @Post('login')
  login(@Body() dto: LoginDto): Promise<{ token: string }> {
    return this.authService.login(dto);
  }

  @ApiOperation({ summary: 'Получить информацию о пользователе' })
  @ApiResponse({ status: 200, description: 'Информация о пользователе' })
  @Get('user-info')
  getUserInfo(
    @Headers('authorization') authorization: string  // <-- нижний регистр
  ) {
    if (!authorization) {
      throw new UnauthorizedException('Отсутствует заголовок Authorization');
    }
    // разбиваем по пробелу, чтобы убрать "Bearer "
    const [scheme, token] = authorization.split(' ');
    if (scheme !== 'Bearer' || !token) {
      throw new UnauthorizedException('Неверный формат заголовка Authorization');
    }
    return this.authService.getUserInfo(token);
  }
}
