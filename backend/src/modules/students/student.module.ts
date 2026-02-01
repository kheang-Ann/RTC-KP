import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { Student } from './entities/student.entity';
import { StudentController } from './student.controller';
import { StudentService } from './student.service';
import { User } from '../users/entities/user.entity';
import { UserRole } from '../users/entities/user-role.entity';
import { Role } from '../users/entities/role.entity';
import { Program } from '../programs/entities/program.entity';
import { LeaveRequest } from '../leave-requests/entities/leave-request.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Student,
      User,
      UserRole,
      Role,
      Program,
      LeaveRequest,
    ]),
    MulterModule.register({
      dest: './uploads/students',
    }),
  ],
  controllers: [StudentController],
  providers: [StudentService],
  exports: [StudentService],
})
export class StudentModule {}
