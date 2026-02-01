import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Program } from './entities/program.entity';
import { ProgramController } from './program.controller';
import { ProgramService } from './program.service';
import { Student } from '../students/entities/student.entity';
import { Group } from '../groups/entities/group.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Program, Student, Group])],
  controllers: [ProgramController],
  providers: [ProgramService],
  exports: [ProgramService],
})
export class ProgramModule {}
