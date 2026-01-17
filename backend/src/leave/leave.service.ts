import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Leave, LeaveStatus } from './entities/leave.entity';
import { CreateLeaveDto } from './dto/create-leave.dto';
import { UpdateLeaveDto } from './dto/update-leave.dto';
import { LeaveFilterDto } from './dto/leave-filter.dto';

@Injectable()
export class LeaveService {
  constructor(
    @InjectRepository(Leave)
    private leaveRepository: Repository<Leave>,
  ) {}

  async create(createLeaveDto: CreateLeaveDto): Promise<Leave> {
    const startDate = new Date(createLeaveDto.startDate);
    const endDate = new Date(createLeaveDto.endDate);

    if (endDate < startDate) {
      throw new BadRequestException('End date must be after start date');
    }

    const days = this.calculateDays(startDate, endDate);

    const leave = this.leaveRepository.create({
      ...createLeaveDto,
      days,
      status: LeaveStatus.PENDING,
    });

    return await this.leaveRepository.save(leave);
  }

  async findAll(filters?: LeaveFilterDto): Promise<Leave[]> {
    const query = this.leaveRepository.createQueryBuilder('leave');

    if (filters?.type) {
      query.andWhere('leave.type = :type', { type: filters.type });
    }

    if (filters?.status) {
      query.andWhere('leave.status = :status', { status: filters.status });
    }

    if (filters?.employeeId) {
      query.andWhere('leave.employeeId = :employeeId', { employeeId: filters.employeeId });
    }

    if (filters?.startDate && filters?.endDate) {
      query.andWhere('leave.startDate BETWEEN :startDate AND :endDate', {
        startDate: filters.startDate,
        endDate: filters.endDate,
      });
    }

    query.orderBy('leave.createdAt', 'DESC');

    return await query.getMany();
  }

  async findOne(id: string): Promise<Leave> {
    const leave = await this.leaveRepository.findOne({ where: { id } });
    if (!leave) {
      throw new NotFoundException(`Leave request with ID ${id} not found`);
    }
    return leave;
  }

  async update(id: string, updateLeaveDto: UpdateLeaveDto): Promise<Leave> {
    const leave = await this.findOne(id);

    if (updateLeaveDto.status && updateLeaveDto.status !== LeaveStatus.PENDING) {
      updateLeaveDto.reviewedAt = new Date();
    }

    Object.assign(leave, updateLeaveDto);
    return await this.leaveRepository.save(leave);
  }

  async approve(id: string, reviewedBy: string, comments?: string): Promise<Leave> {
    return await this.update(id, {
      status: LeaveStatus.APPROVED,
      reviewedBy,
      reviewComments: comments,
    });
  }

  async reject(id: string, reviewedBy: string, comments?: string): Promise<Leave> {
    return await this.update(id, {
      status: LeaveStatus.REJECTED,
      reviewedBy,
      reviewComments: comments,
    });
  }

  async cancel(id: string): Promise<Leave> {
    const leave = await this.findOne(id);
    
    if (leave.status !== LeaveStatus.PENDING) {
      throw new BadRequestException('Only pending leave requests can be cancelled');
    }

    return await this.update(id, { status: LeaveStatus.CANCELLED });
  }

  async remove(id: string): Promise<void> {
    const result = await this.leaveRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Leave request with ID ${id} not found`);
    }
  }

  async getLeaveBalance(employeeId: string): Promise<any> {
    const currentYear = new Date().getFullYear();
    const startOfYear = new Date(currentYear, 0, 1);
    const endOfYear = new Date(currentYear, 11, 31);

    const approvedLeaves = await this.leaveRepository.find({
      where: {
        employeeId,
        status: LeaveStatus.APPROVED,
        startDate: Between(startOfYear, endOfYear),
      },
    });

    const balance = {
      sick: 12,
      annual: 15,
      personal: 7,
    };

    approvedLeaves.forEach(leave => {
      if (balance[leave.type] !== undefined) {
        balance[leave.type] -= leave.days;
      }
    });

    return balance;
  }

  private calculateDays(startDate: Date, endDate: Date): number {
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays + 1; // Include both start and end dates
  }
}