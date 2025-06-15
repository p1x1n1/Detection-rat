import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Role } from './role.entity';
import { Repository } from 'typeorm';
import { CreateRoleDto } from './dto/create-role.dto';

@Injectable()
export class RoleService {
    constructor(
        @InjectRepository(Role)
        private readonly roleRepository: Repository<Role>,
      ) {}
    async createRole(dto: CreateRoleDto): Promise<Role> {
        const role = this.roleRepository.create(dto);
        return this.roleRepository.save(role);
    }

    async getAllRoles(): Promise<Role[]> {
        return this.roleRepository.find({ relations: ['users'] });
    }

    async getRoleById(id: number): Promise<Role | null> {
        return this.roleRepository.findOne({ where: { id }, relations: ['users'] });
    }
}
