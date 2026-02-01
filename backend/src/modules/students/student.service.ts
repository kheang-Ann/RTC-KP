import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
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
import { LeaveRequest } from '../leave-requests/entities/leave-request.entity';

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
    @InjectRepository(LeaveRequest)
    private leaveRequestRepo: Repository<LeaveRequest>,
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

    // Check for duplicate email
    const existingEmail = await this.studentRepo.findOne({
      where: { personalEmail: dto.personalEmail },
    });
    if (existingEmail) {
      throw new ConflictException(
        `Student with email '${dto.personalEmail}' already exists`,
      );
    }

    // Check for duplicate phone numbers (simple-array stores as comma-separated string)
    for (const phone of dto.phoneNumbers) {
      const existingPhone = await this.studentRepo
        .createQueryBuilder('student')
        .where('student.phoneNumbers = :phone', { phone })
        .orWhere('student.phoneNumbers LIKE :phoneStart', {
          phoneStart: `${phone},%`,
        })
        .orWhere('student.phoneNumbers LIKE :phoneMiddle', {
          phoneMiddle: `%,${phone},%`,
        })
        .orWhere('student.phoneNumbers LIKE :phoneEnd', {
          phoneEnd: `%,${phone}`,
        })
        .getOne();
      if (existingPhone) {
        throw new ConflictException(
          `Phone number '${phone}' is already registered to another student`,
        );
      }
    }

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
    console.log('Update student DTO:', JSON.stringify(dto, null, 2));
    const student = await this.findOne(id);

    // Validate age if dob is being updated
    if (dto.dob) {
      this.validateAge(dto.dob);
    }

    // Check for duplicate email (excluding current student)
    if (dto.personalEmail) {
      const existingEmail = await this.studentRepo.findOne({
        where: { personalEmail: dto.personalEmail },
      });
      if (existingEmail && existingEmail.id !== id) {
        throw new ConflictException(
          `Student with email '${dto.personalEmail}' already exists`,
        );
      }
    }

    // Check for duplicate phone numbers (excluding current student, simple-array stores as comma-separated string)
    if (dto.phoneNumbers) {
      for (const phone of dto.phoneNumbers) {
        const existingPhone = await this.studentRepo
          .createQueryBuilder('student')
          .where('student.id != :id', { id })
          .andWhere(
            '(student.phoneNumbers = :phone OR student.phoneNumbers LIKE :phoneStart OR student.phoneNumbers LIKE :phoneMiddle OR student.phoneNumbers LIKE :phoneEnd)',
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
            `Phone number '${phone}' is already registered to another student`,
          );
        }
      }
    }

    // Validate academic year against program duration
    if (dto.academicYear !== undefined && dto.programId !== undefined) {
      const program = await this.programRepo.findOne({
        where: { id: dto.programId },
      });
      if (program && dto.academicYear > program.duration) {
        throw new BadRequestException(
          `Academic year cannot exceed program duration (${program.duration} years)`,
        );
      }
    } else if (dto.academicYear !== undefined) {
      // Use existing program or new program if provided
      const programId =
        dto.programId !== undefined ? dto.programId : student.programId;
      const program = await this.programRepo.findOne({
        where: { id: programId },
      });
      if (program && dto.academicYear > program.duration) {
        throw new BadRequestException(
          `Academic year cannot exceed program duration (${program.duration} years)`,
        );
      }
    } else if (dto.programId !== undefined) {
      // Changing program - validate current academic year against new program
      const program = await this.programRepo.findOne({
        where: { id: dto.programId },
      });
      if (program && student.academicYear > program.duration) {
        throw new BadRequestException(
          `Current academic year (${student.academicYear}) exceeds new program duration (${program.duration} years). Please reduce the academic year first.`,
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

    // Update user department if provided
    if (dto.departmentId && student.userId) {
      await this.userRepo.update(student.userId, {
        departmentId: dto.departmentId,
      });
    }

    // Update user name if provided
    if (student.userId && (dto.nameKhmer || dto.nameLatin)) {
      const userUpdateData: Partial<{ nameKhmer: string; nameLatin: string }> =
        {};
      if (dto.nameKhmer) userUpdateData.nameKhmer = dto.nameKhmer;
      if (dto.nameLatin) userUpdateData.nameLatin = dto.nameLatin;
      await this.userRepo.update(student.userId, userUpdateData);
    }

    // Update student record
    const updateData: Partial<Student> = {};

    if (dto.nameKhmer) updateData.nameKhmer = dto.nameKhmer;
    if (dto.nameLatin) updateData.nameLatin = dto.nameLatin;
    if (dto.gender) updateData.gender = dto.gender;
    if (dto.dob) updateData.dob = new Date(dto.dob);
    if (dto.departmentId !== undefined)
      updateData.departmentId = dto.departmentId;
    if (dto.programId !== undefined) updateData.programId = dto.programId;
    if (dto.academicStatus) updateData.academicStatus = dto.academicStatus;
    if (dto.academicYear !== undefined)
      updateData.academicYear = dto.academicYear;
    if (dto.personalEmail) updateData.personalEmail = dto.personalEmail;
    if (dto.phoneNumbers) updateData.phoneNumbers = dto.phoneNumbers;
    if (dto.emergencyPhoneNumbers)
      updateData.emergencyPhoneNumbers = dto.emergencyPhoneNumbers;
    if (imageFile) updateData.image = imageFile;

    // Clear relation objects to ensure FK updates work correctly
    // TypeORM uses relation objects over FK columns when both are present
    if (dto.departmentId !== undefined) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      (student as any).department = undefined;
    }
    if (dto.programId !== undefined) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      (student as any).program = undefined;
    }

    Object.assign(student, updateData);
    return this.studentRepo.save(student);
  }

  async remove(id: number): Promise<void> {
    const student = await this.findOne(id);

    // Check for related leave requests
    const leaveRequestsCount = await this.leaveRequestRepo.count({
      where: { studentId: id },
    });
    if (leaveRequestsCount > 0) {
      throw new BadRequestException(
        `Cannot delete student. Please delete ${leaveRequestsCount} leave request(s) first.`,
      );
    }

    // Delete associated user account
    if (student.userId) {
      await this.userRepo.delete(student.userId);
    }

    await this.studentRepo.delete(id);
  }
}
