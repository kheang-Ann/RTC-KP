import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { Course } from './entities/course.entity';
@Injectable()
export class CourseService {
  @InjectRepository(Course)
  private courseRepo: Repository<Course>;

  async findAll(): Promise<Course[]> {
    return this.courseRepo.find();
  }

  async findOne(id: string): Promise<Course | null> {
    const course = await this.courseRepo.findOne({
      where: { id },
      relations: ['department', 'teacher'],
    });
    if (!course) throw new NotFoundException('Course not found');
    return course;
  }

  async create(dto: CreateCourseDto): Promise<Course> {
    const course = this.courseRepo.create(dto);
    return this.courseRepo.save(course);
  }

  async update(id: string, dto: UpdateCourseDto): Promise<Course> {
    const course = await this.courseRepo.preload({ id, ...dto });
    if (!course) throw new NotFoundException('Course not found');
    return this.courseRepo.save(course);
  }

  async remove(id: string): Promise<void> {
    const res = await this.courseRepo.delete(id);
    if (res.affected === 0) throw new NotFoundException('Course not found');
  }
}
