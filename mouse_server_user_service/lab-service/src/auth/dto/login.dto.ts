import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'testuser', description: 'Логин пользователя' })
  login: string;

  @ApiProperty({ example: 'securepass', description: 'Пароль' })
  password: string;
}
