/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  ParseIntPipe,
  Query,
  Patch,
  Request,
} from '@nestjs/common';
import { LibraryRequestsService } from './library-requests.service';
import {
  CreateLibraryRequestDto,
  UpdateLibraryRequestStatusDto,
} from './dto/create-library-request.dto';
import { JwtAuthGuard } from '../auth/guards/jaw-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorator/roles.decorator';
import { RequestStatus } from './entities/library-request.entity';

@Controller('library-requests')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LibraryRequestsController {
  constructor(private libraryRequestsService: LibraryRequestsService) {}

  @Post()
  async createRequest(
    @Body() createDto: CreateLibraryRequestDto,
    @Request() req: any,
  ) {
    const request = await this.libraryRequestsService.createRequest(
      createDto,
      req.user.sub,
    );

    return {
      message: 'Request created successfully',
      request,
    };
  }

  @Get()
  async getAllRequests(
    @Request() req: any,
    @Query('status') status?: RequestStatus,
    @Query('myRequests') myRequests?: boolean,
  ) {
    const isAdmin = req.user.roles?.includes('admin');
    // Admins see all requests by default, non-admins only see their own
    const requestedBy = isAdmin && !myRequests ? undefined : req.user.sub;
    const requests = await this.libraryRequestsService.findAll(
      status,
      requestedBy,
    );

    return {
      count: requests.length,
      requests,
    };
  }

  @Get('stats')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async getStats() {
    return this.libraryRequestsService.getStats();
  }

  @Get('pending-count')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async getPendingCount() {
    const count = await this.libraryRequestsService.getPendingRequestCount();
    return { pendingCount: count };
  }

  @Get(':id')
  async getRequest(@Param('id', ParseIntPipe) id: number) {
    return this.libraryRequestsService.findById(id);
  }

  @Patch(':id/status')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async updateRequestStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateLibraryRequestStatusDto,
    @Request() req: any,
  ) {
    const request = await this.libraryRequestsService.updateRequestStatus(
      id,
      updateDto,
      req.user.sub,
    );

    return {
      message: 'Request status updated successfully',
      request,
    };
  }

  @Delete(':id')
  async deleteRequest(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any,
  ) {
    const request = await this.libraryRequestsService.findById(id);

    // Allow deletion if user is requester or admin
    if (
      request.requestedBy !== req.user.sub &&
      !req.user.roles?.includes('admin')
    ) {
      throw new Error('Unauthorized');
    }

    await this.libraryRequestsService.deleteRequest(id);

    return { message: 'Request deleted successfully' };
  }
}
