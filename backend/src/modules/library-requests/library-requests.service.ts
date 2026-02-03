import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LibraryRequest, RequestStatus } from './entities/library-request.entity';
import { CreateLibraryRequestDto, UpdateLibraryRequestStatusDto } from './dto/create-library-request.dto';

@Injectable()
export class LibraryRequestsService {
  constructor(
    @InjectRepository(LibraryRequest)
    private requestRepo: Repository<LibraryRequest>,
  ) {}

  async createRequest(
    createDto: CreateLibraryRequestDto,
    requestedBy: number,
  ): Promise<LibraryRequest> {
    const request = this.requestRepo.create({
      ...createDto,
      requestedBy,
      status: RequestStatus.PENDING,
    });

    return this.requestRepo.save(request);
  }

  async findAll(
    status?: RequestStatus,
    requestedBy?: number,
  ): Promise<LibraryRequest[]> {
    const query = this.requestRepo
      .createQueryBuilder('request')
      .leftJoinAndSelect('request.requester', 'requester')
      .leftJoinAndSelect('request.approver', 'approver')
      .orderBy('request.createdAt', 'DESC');

    if (status) {
      query.andWhere('request.status = :status', { status });
    }

    if (requestedBy) {
      query.andWhere('request.requestedBy = :requestedBy', { requestedBy });
    }

    return query.getMany();
  }

  async findById(id: number): Promise<LibraryRequest> {
    const request = await this.requestRepo
      .createQueryBuilder('request')
      .leftJoinAndSelect('request.requester', 'requester')
      .leftJoinAndSelect('request.approver', 'approver')
      .where('request.id = :id', { id })
      .getOne();

    if (!request) {
      throw new NotFoundException(`Library request with id ${id} not found`);
    }

    return request;
  }

  async updateRequestStatus(
    id: number,
    updateDto: UpdateLibraryRequestStatusDto,
    approvedBy: number,
  ): Promise<LibraryRequest> {
    const request = await this.findById(id);

    if (request.status !== RequestStatus.PENDING) {
      throw new BadRequestException('Can only update pending requests');
    }

    request.status = updateDto.status;
    request.approvedBy = approvedBy;
    request.approvedAt = new Date();

    if (updateDto.rejectionReason) {
      request.rejectionReason = updateDto.rejectionReason;
    }

    return this.requestRepo.save(request);
  }

  async deleteRequest(id: number): Promise<void> {
    const request = await this.findById(id);

    if (request.status !== RequestStatus.PENDING) {
      throw new BadRequestException('Can only delete pending requests');
    }

    await this.requestRepo.remove(request);
  }

  async getPendingRequestCount(): Promise<number> {
    return this.requestRepo.count({
      where: { status: RequestStatus.PENDING },
    });
  }

  async getStats(): Promise<{
    pending: number;
    approved: number;
    rejected: number;
    fulfilled: number;
  }> {
    const pending = await this.requestRepo.count({ where: { status: RequestStatus.PENDING } });
    const approved = await this.requestRepo.count({ where: { status: RequestStatus.APPROVED } });
    const rejected = await this.requestRepo.count({ where: { status: RequestStatus.REJECTED } });
    const fulfilled = await this.requestRepo.count({ where: { status: RequestStatus.FULFILLED } });

    return { pending, approved, rejected, fulfilled };
  }
}
