import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { RoleService } from './role.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { Role } from './role.entity';

@Controller('role')
export class RoleController {
    constructor(private readonly roleService: RoleService) { }

    @Post()
    createRole(@Body() dto: CreateRoleDto): Promise<Role> {
        return this.roleService.createRole(dto);
    }

    @Get()
    getAllRoles(): Promise<Role[]> {
        return this.roleService.getAllRoles();
    }

    @Get(':id')
    getRoleById(@Param('id') id: number): Promise<Role | null> {
        return this.roleService.getRoleById(id);
    }
}
