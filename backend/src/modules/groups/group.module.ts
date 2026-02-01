import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GroupController } from './group.controller';
import { GroupService } from './group.service';
import { Group } from './entities/group.entity';
import { Student } from '../students/entities/student.entity';
import { Program } from '../programs/entities/program.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Group, Student, Program])],
  controllers: [GroupController],
  providers: [GroupService],
  exports: [GroupService],
})
export class GroupModule {}
