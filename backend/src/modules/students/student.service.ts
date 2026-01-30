import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { Student, AcademicStatus } from './entities/student.entity';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { User } from '../users/entities/user.entity';
import { UserRole } from '../users/entities/user-role.entity';
import { Role } from '../users/entities/role.entity';
import { Program } from '../programs/entities/program.entity';

@Injectable()
export class StudentService {
  constructor(
    @InjectRepository(Student)
    private studentRepo: Repository<Student>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
    @InjectRepository(UserRole)
    private userRoleRepo: Repository<UserRole>,
    @InjectRepository(Role)
    private roleRepo: Repository<Role>,
    @InjectRepository(Program)
    private programRepo: Repository<Program>,
  ) {}

  private validateAge(dob: string): void {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }
    if (age < 16) {
      throw new BadRequestException('Student must be at least 16 years old');
    }
  }

  async create(dto: CreateStudentDto, imageFile?: string): Promise<Student> {
    // Validate age
    this.validateAge(dto.dob);

    // Create user account for login
    const password = dto.password || 'student123'; // Default password
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

    // Assign student role
    const studentRole = await this.roleRepo.findOne({
      where: { name: 'student' },
    });
    if (studentRole) {
      const userRole = this.userRoleRepo.create({
        user: savedUser,
        role: studentRole,
      });
      await this.userRoleRepo.save(userRole);
    }

    // Create student record
    const student = this.studentRepo.create({
      userId: savedUser.id,
      image: imageFile || null,
      nameKhmer: dto.nameKhmer,
      nameLatin: dto.nameLatin,
      gender: dto.gender,
      dob: new Date(dto.dob),
      departmentId: dto.departmentId,
      programId: dto.programId,
      academicStatus: AcademicStatus.ACTIVE,
      academicYear: 1,
      personalEmail: dto.personalEmail,
      phoneNumbers: dto.phoneNumbers,
      emergencyPhoneNumbers: dto.emergencyPhoneNumbers,
    });

    return this.studentRepo.save(student);
  }

  async findAll(): Promise<Student[]> {
    return this.studentRepo.find({
      relations: ['department', 'program', 'user'],
      order: { id: 'DESC' },
    });
  }

  async findByUserId(userId: number): Promise<Student> {
    const student = await this.studentRepo.findOne({
      where: { userId },
      relations: ['department', 'program', 'user'],
    });
    if (!student) {
      throw new NotFoundException('Student profile not found');
    }
    return student;
  }

  async findOne(id: number): Promise<Student> {
    const student = await this.studentRepo.findOne({
      where: { id },
      relations: ['department', 'program', 'user'],
    });
    if (!student) {
      throw new NotFoundException(`Student with ID ${id} not found`);
    }
    return student;
  }

  async update(
    id: number,
    dto: UpdateStudentDto,
    imageFile?: string,
  ): Promise<Student> {
    const student = await this.findOne(id);

    // Validate age if dob is being updated
    if (dto.dob) {
      this.validateAge(dto.dob);
    }

    // Validate academic year against program duration
    if (dto.academicYear && dto.programId) {
      const program = await this.programRepo.findOne({
        where: { id: dto.programId },
      });
      if (program && dto.academicYear > program.duration) {
        throw new BadRequestException(
          `Academic year cannot exceed program duration (${program.duration} years)`,
        );
      }
    } else if (dto.academicYear) {
      const program = await this.programRepo.findOne({
        where: { id: student.programId },
      });
      if (program && dto.academicYear > program.duration) {
        throw new BadRequestException(
          `Academic year cannot exceed program duration (${program.duration} years)`,
        );
      }
    }

    // Don't allow changing academic year if status is graduation
    if (
      student.academicStatus === AcademicStatus.GRADUATION &&
      dto.academicYear &&
      dto.academicYear !== student.academicYear
    ) {
      throw new BadRequestException(
        'Cannot change academic year for graduated students',
      );
    }

    // Update user email if provided
    if (dto.email && student.userId) {
      await this.userRepo.update(student.userId, { email: dto.email });
    }

    // Update user password if provided
    if (dto.password && student.userId) {
      const salt = await bcrypt.genSalt();
      const passwordHash = await bcrypt.hash(dto.password, salt);
      await this.userRepo.update(student.userId, { passwordHash });
    }

    // Update student record
    const updateData: Partial<Student> = {};

    if (dto.nameKhmer) updateData.nameKhmer = dto.nameKhmer;
    if (dto.nameLatin) updateData.nameLatin = dto.nameLatin;
    if (dto.gender) updateData.gender = dto.gender;
    if (dto.dob) updateData.dob = new Date(dto.dob);
    if (dto.departmentId) updateData.departmentId = dto.departmentId;
    if (dto.programId) updateData.programId = dto.programId;
    if (dto.academicStatus) updateData.academicStatus = dto.academicStatus;
    if (dto.academicYear) updateData.academicYear = dto.academicYear;
    if (dto.personalEmail) updateData.personalEmail = dto.personalEmail;
    if (dto.phoneNumbers) updateData.phoneNumbers = dto.phoneNumbers;
    if (dto.emergencyPhoneNumbers)
      updateData.emergencyPhoneNumbers = dto.emergencyPhoneNumbers;
    if (imageFile) updateData.image = imageFile;

    Object.assign(student, updateData);
    return this.studentRepo.save(student);
  }

  async remove(id: number): Promise<void> {
    const student = await this.findOne(id);

    // Delete associated user account
    if (student.userId) {
      await this.userRepo.delete(student.userId);
    }

    await this.studentRepo.delete(id);
  }
}
