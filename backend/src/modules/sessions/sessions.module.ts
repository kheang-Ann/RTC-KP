import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Session } from './entities/session.entity';
import { SessionsService } from './sessions.service';
import { SessionsController } from './sessions.controller';
import { Course } from '../courses/entities/course.entity';
import { Schedule } from '../schedules/entities/schedule.entity';
import { Student } from '../students/entities/student.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Session, Course, Schedule, Student])],
  controllers: [SessionsController],
  providers: [SessionsService],
  exports: [SessionsService],
})
export class SessionsModule {}
