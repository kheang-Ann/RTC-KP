import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { Teacher } from './entities/teacher.entity';
import { CreateTeacherDto } from './dto/create-teacher.dto';
import { UpdateTeacherDto } from './dto/update-teacher.dto';
import { User } from '../users/entities/user.entity';
import { UserRole } from '../users/entities/user-role.entity';
import { Role } from '../users/entities/role.entity';

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
  ) {}

  async create(dto: CreateTeacherDto, imageFile?: string): Promise<Teacher> {
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

    // Update teacher record
    const updateData: Partial<Teacher> = {};

    if (dto.nameKhmer) updateData.nameKhmer = dto.nameKhmer;
    if (dto.nameLatin) updateData.nameLatin = dto.nameLatin;
    if (dto.gender) updateData.gender = dto.gender;
    if (dto.dob) updateData.dob = new Date(dto.dob);
    if (dto.departmentId) updateData.departmentId = dto.departmentId;
    if (dto.personalEmail) updateData.personalEmail = dto.personalEmail;
    if (dto.phoneNumbers) updateData.phoneNumbers = dto.phoneNumbers;
    if (imageFile) updateData.image = imageFile;

    Object.assign(teacher, updateData);
    return this.teacherRepo.save(teacher);
  }

  async remove(id: number): Promise<void> {
    const teacher = await this.findOne(id);

    // Delete associated user account
    if (teacher.userId) {
      await this.userRepo.delete(teacher.userId);
    }

    await this.teacherRepo.delete(id);
  }
}
