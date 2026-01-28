import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Attendance } from './entities/attendance.entity';
import { AttendancesService } from './attendances.service';
import { AttendancesController } from './attendances.controller';
import { Session } from '../sessions/entities/session.entity';
import { Enrollment } from '../enrollments/entities/enrollment.entity';
import { Course } from '../courses/entities/course.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Attendance, Session, Enrollment, Course]),
  ],
  controllers: [AttendancesController],
  providers: [AttendancesService],
  exports: [AttendancesService],
})
export class AttendancesModule {}
