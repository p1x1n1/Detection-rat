import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
    login: string;
    email: string;
    name: string;
    firstname?: string;
    lastname?: string;
    password: string;
    phone: string;
    roleId: number;
}
