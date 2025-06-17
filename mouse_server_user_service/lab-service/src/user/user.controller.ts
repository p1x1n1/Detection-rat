import { Body, Controller, Delete, Get, Param, Patch, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto, UpdateUserDto } from './dto/create-user.dto';
import { User } from './user.entity';
import { FileInterceptor } from '@nestjs/platform-express';
import { FileService } from 'src/file/file.service';

@Controller('users')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly fileService: FileService
  ) { }

  @Post()
  @UseInterceptors(FileInterceptor('image', {
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  }))
  createUser(@UploadedFile() file: Express.Multer.File, @Body() dto: CreateUserDto): Promise<User> {
    const imagePath = this.fileService.saveFile(file);
    dto.imagePath = imagePath;
    return this.userService.createUser(dto);
  }

  @Patch(':login')
  @UseInterceptors(FileInterceptor('image', { limits: { fileSize: 5 * 1024 * 1024 } }))
  updateUser(
    @Param('login') login: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UpdateUserDto,
  ): Promise<User> {
    console.log ('image', file)
    let imagePath;
    if (file) {
      imagePath = this.fileService.saveFile(file);
    }
    console.log('update user', imagePath)
    return this.userService.updateUser(login, dto, imagePath );
  }

  @Get()
  getAllUsers(): Promise<User[]> {
    return this.userService.getAllUsers();
  }

  @Get(':login')
  getUserByLogin(@Param('login') login: string): Promise<User> {
    return this.userService.getUserByLogin(login);
  }

  @Delete(':login')
  deleteUser(@Param('login') login: string): Promise<void> {
    return this.userService.deleteUser(login);
  }
}
