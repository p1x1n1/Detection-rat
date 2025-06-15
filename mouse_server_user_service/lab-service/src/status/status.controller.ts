import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { StatusService } from './status.service';
import { Status } from './status.entity';
import { CreateStatusDto } from './dto/create-status.dtto';

@Controller('status')
export class StatusController {
    constructor(private readonly statusService: StatusService) { }

    @Post()
    createStatus(@Body() dto: CreateStatusDto): Promise<Status> {
        return this.statusService.createStatus(dto);
    }

    @Get()
    getAllStatuses(): Promise<Status[]> {
        return this.statusService.getAllStatuses();
    }

    @Get(':id')
    getStatusById(@Param('id') id: number): Promise<Status | null> {
        return this.statusService.getStatusById(id);
    }
}
