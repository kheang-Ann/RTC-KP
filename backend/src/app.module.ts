import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import DatabaseConfig from './config/db.config';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from './modules/users/user.module';
import { AuthModule } from './modules/auth/auth.module';
import { DepartmentModule } from './modules/departments/department.module';
import { CourseModule } from './modules/courses/course.module';
import { SessionsModule } from './modules/sessions/sessions.module';
import { AttendancesModule } from './modules/attendances/attendances.module';
import { LeaveRequestsModule } from './modules/leave-requests/leave-requests.module';
import { ProgramModule } from './modules/programs/program.module';
import { StudentModule } from './modules/students/student.module';
import { TeacherModule } from './modules/teachers/teacher.module';
import { GroupModule } from './modules/groups/group.module';
import { ScheduleModule } from './modules/schedules/schedule.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [DatabaseConfig],
      envFilePath: '../.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url: config.get('DATABASE_URL'),
        autoLoadEntities: true,
        synchronize: true, // Auto-creates tables (only for development!)
      }),
    }),
    AuthModule,
    UserModule,
    DepartmentModule,
    CourseModule,
    SessionsModule,
    AttendancesModule,
    LeaveRequestsModule,
    ProgramModule,
    StudentModule,
    TeacherModule,
    GroupModule,
    ScheduleModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
