import { PartialType } from "@nestjs/swagger";

export class CreateUserDto {
    login: string;
    email: string;
    name: string;
    firstname?: string;
    lastname?: string;
    password: string;
    phone: string;
    imagePath?: string;
    roleId: number;
}


export class UpdateUserDto extends PartialType(CreateUserDto) { }