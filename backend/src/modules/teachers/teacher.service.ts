/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { Teacher } from './entities/teacher.entity';
import { CreateTeacherDto } from './dto/create-teacher.dto';
import { UpdateTeacherDto } from './dto/update-teacher.dto';
import { User } from '../users/entities/user.entity';
import { UserRole } from '../users/entities/user-role.entity';
import { Role } from '../users/entities/role.entity';
import { Course } from '../courses/entities/course.entity';

@Injectable()
export class TeacherService {
  constructor(
    @InjectRepository(Teacher)
    private teacherRepo: Repository<Teacher>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
    @InjectRepository(UserRole)
    private userRoleRepo: Repository<UserRole>,
    @InjectRepository(Role)
    private roleRepo: Repository<Role>,
    @InjectRepository(Course)
    private courseRepo: Repository<Course>,
  ) {}

  async create(dto: CreateTeacherDto, imageFile?: string): Promise<Teacher> {
    // Check for duplicate email
    const existingEmail = await this.teacherRepo.findOne({
      where: { personalEmail: dto.personalEmail },
    });
    if (existingEmail) {
      throw new ConflictException(
        `Teacher with email '${dto.personalEmail}' already exists`,
      );
    }

    // Check for duplicate phone numbers (simple-array stores as comma-separated string)
    for (const phone of dto.phoneNumbers) {
      const existingPhone = await this.teacherRepo
        .createQueryBuilder('teacher')
        .where('teacher.phoneNumbers = :phone', { phone })
        .orWhere('teacher.phoneNumbers LIKE :phoneStart', {
          phoneStart: `${phone},%`,
        })
        .orWhere('teacher.phoneNumbers LIKE :phoneMiddle', {
          phoneMiddle: `%,${phone},%`,
        })
        .orWhere('teacher.phoneNumbers LIKE :phoneEnd', {
          phoneEnd: `%,${phone}`,
        })
        .getOne();
      if (existingPhone) {
        throw new ConflictException(
          `Phone number '${phone}' is already registered to another teacher`,
        );
      }
    }

    // Create user account for login
    const password = dto.password || 'teacher123'; // Default password
    const salt = await bcrypt.genSalt();
    const passwordHash = await bcrypt.hash(password, salt);

    const user = this.userRepo.create({
      email: dto.personalEmail,
      nameKhmer: dto.nameKhmer,
      nameLatin: dto.nameLatin,
      passwordHash,
      isActive: true,
      departmentId: dto.departmentId,
    });
    const savedUser = await this.userRepo.save(user);

    // Assign teacher role
    const teacherRole = await this.roleRepo.findOne({
      where: { name: 'teacher' },
    });
    if (teacherRole) {
      const userRole = this.userRoleRepo.create({
        user: savedUser,
        role: teacherRole,
      });
      await this.userRoleRepo.save(userRole);
    }

    // Create teacher record
    const teacher = this.teacherRepo.create({
      userId: savedUser.id,
      image: imageFile || null,
      nameKhmer: dto.nameKhmer,
      nameLatin: dto.nameLatin,
      gender: dto.gender,
      dob: new Date(dto.dob),
      departmentId: dto.departmentId,
      personalEmail: dto.personalEmail,
      phoneNumbers: dto.phoneNumbers,
    });

    return this.teacherRepo.save(teacher);
  }

  async findAll(): Promise<Teacher[]> {
    return this.teacherRepo.find({
      relations: ['department', 'user'],
      order: { id: 'DESC' },
    });
  }

  async findByUserId(userId: number): Promise<Teacher> {
    const teacher = await this.teacherRepo.findOne({
      where: { userId },
      relations: ['department', 'user'],
    });
    if (!teacher) {
      throw new NotFoundException('Teacher profile not found');
    }
    return teacher;
  }

  async findOne(id: number): Promise<Teacher> {
    const teacher = await this.teacherRepo.findOne({
      where: { id },
      relations: ['department', 'user'],
    });
    if (!teacher) {
      throw new NotFoundException(`Teacher with ID ${id} not found`);
    }
    return teacher;
  }

  async update(
    id: number,
    dto: UpdateTeacherDto,
    imageFile?: string,
  ): Promise<Teacher> {
    const teacher = await this.findOne(id);

    // Check for duplicate email (excluding current teacher)
    if (dto.personalEmail) {
      const existingEmail = await this.teacherRepo.findOne({
        where: { personalEmail: dto.personalEmail },
      });
      if (existingEmail && existingEmail.id !== id) {
        throw new ConflictException(
          `Teacher with email '${dto.personalEmail}' already exists`,
        );
      }
    }

    // Check for duplicate phone numbers (excluding current teacher, simple-array stores as comma-separated string)
    if (dto.phoneNumbers) {
      for (const phone of dto.phoneNumbers) {
        const existingPhone = await this.teacherRepo
          .createQueryBuilder('teacher')
          .where('teacher.id != :id', { id })
          .andWhere(
            '(teacher.phoneNumbers = :phone OR teacher.phoneNumbers LIKE :phoneStart OR teacher.phoneNumbers LIKE :phoneMiddle OR teacher.phoneNumbers LIKE :phoneEnd)',
            {
              phone,
              phoneStart: `${phone},%`,
              phoneMiddle: `%,${phone},%`,
              phoneEnd: `%,${phone}`,
            },
          )
          .getOne();
        if (existingPhone) {
          throw new ConflictException(
            `Phone number '${phone}' is already registered to another teacher`,
          );
        }
      }
    }

    // Update user email if provided
    if (dto.email && teacher.userId) {
      await this.userRepo.update(teacher.userId, { email: dto.email });
    }

    // Update user password if provided
    if (dto.password && teacher.userId) {
      const salt = await bcrypt.genSalt();
      const passwordHash = await bcrypt.hash(dto.password, salt);
      await this.userRepo.update(teacher.userId, { passwordHash });
    }

    // Update user department if provided
    if (dto.departmentId !== undefined && teacher.userId) {
      const newDepartmentId = Number(dto.departmentId);
      // Check if department is actually changing
      if (newDepartmentId !== teacher.departmentId) {
        // Check for courses assigned to this teacher
        const coursesCount = await this.courseRepo.count({
          where: { teacherId: teacher.userId },
        });
        if (coursesCount > 0) {
          throw new BadRequestException(
            `Cannot change department. Teacher is assigned to ${coursesCount} course(s). Please reassign or remove the teacher from all courses first.`,
          );
        }
      }

      await this.userRepo.update(teacher.userId, {
        departmentId: newDepartmentId,
      });
    }

    // Update user name if provided
    if (teacher.userId && (dto.nameKhmer || dto.nameLatin)) {
      const userUpdateData: Partial<{ nameKhmer: string; nameLatin: string }> =
        {};
      if (dto.nameKhmer) userUpdateData.nameKhmer = dto.nameKhmer;
      if (dto.nameLatin) userUpdateData.nameLatin = dto.nameLatin;
      await this.userRepo.update(teacher.userId, userUpdateData);
    }

    // Update teacher record
    const updateData: Partial<Teacher> = {};

    if (dto.nameKhmer) updateData.nameKhmer = dto.nameKhmer;
    if (dto.nameLatin) updateData.nameLatin = dto.nameLatin;
    if (dto.gender) updateData.gender = dto.gender;
    if (dto.dob) updateData.dob = new Date(dto.dob);
    if (dto.departmentId) {
      updateData.departmentId = Number(dto.departmentId);
      // Clear the loaded relation so TypeORM uses departmentId
      teacher.department = undefined as any;
    }
    if (dto.personalEmail) updateData.personalEmail = dto.personalEmail;
    if (dto.phoneNumbers) updateData.phoneNumbers = dto.phoneNumbers;
    if (imageFile) updateData.image = imageFile;

    Object.assign(teacher, updateData);
    return this.teacherRepo.save(teacher);
  }

  async remove(id: number): Promise<void> {
    const teacher = await this.findOne(id);

    // Check for course dependencies
    if (teacher.userId) {
      const coursesCount = await this.courseRepo.count({
        where: { teacherId: teacher.userId },
      });
      if (coursesCount > 0) {
        throw new ConflictException(
          `Cannot delete teacher. Please remove the teacher from ${coursesCount} course(s) first.`,
        );
      }
    }

    // Delete associated user account
    if (teacher.userId) {
      await this.userRepo.delete(teacher.userId);
    }

    await this.teacherRepo.delete(id);
  }
}
