import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Status } from './status.entity';
import { Repository } from 'typeorm';
import { CreateStatusDto } from './dto/create-status.dtto';

@Injectable()
export class StatusService {
    constructor(
        @InjectRepository(Status)
        private readonly statusRepository: Repository<Status>,
    ) { }

    async createStatus(dto: CreateStatusDto): Promise<Status> {
        const status = this.statusRepository.create(dto);
        return this.statusRepository.save(status);
    }

    async getAllStatuses(): Promise<Status[]> {
        return this.statusRepository.find({ relations: ['experiments'] });
    }

    async getStatusById(id: number): Promise<Status | null> {
        return this.statusRepository.findOne({ where: { id }, relations: ['experiments'] });
    }

    async getStatusByStatusName(statusName: string): Promise<Status | null> {
        return this.statusRepository.findOne({ where: { statusName }, relations: ['experiments'] });
    }
}
