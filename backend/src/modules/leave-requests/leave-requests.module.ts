import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LeaveRequestsController } from './leave-requests.controller';
import { LeaveRequestsService } from './leave-requests.service';
import { LeaveRequest } from './entities/leave-request.entity';
import { Course } from '../courses/entities/course.entity';
import { Enrollment } from '../enrollments/entities/enrollment.entity';
import { Attendance } from '../attendances/entities/attendance.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([LeaveRequest, Course, Enrollment, Attendance]),
  ],
  controllers: [LeaveRequestsController],
  providers: [LeaveRequestsService],
  exports: [LeaveRequestsService],
})
export class LeaveRequestsModule {}
