import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { UserService } from '../users/user.service';
import { RegisterDto } from './dto/register.dto';
import bcrypt from 'bcryptjs';
import { LoginDto } from './dto/login.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RefreshToken } from '../users/entities/refresh-toke.entity';
import { JwtService } from '@nestjs/jwt';
import { randomBytes } from 'crypto';
import { Student } from '../students/entities/student.entity';
import { Teacher } from '../teachers/entities/teacher.entity';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    @InjectRepository(RefreshToken)
    private refreshTokens: Repository<RefreshToken>,
    @InjectRepository(Student)
    private studentRepo: Repository<Student>,
    @InjectRepository(Teacher)
    private teacherRepo: Repository<Teacher>,
    private jwt: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existingUser = await this.userService.findByEmail(dto.email);
    if (existingUser) throw new ConflictException('Email already existed');

    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(dto.password, salt);

    const user = await this.userService.create({
      ...dto,
      passwordHash: hashedPassword,
    });
    return { message: 'registered', userId: user.id };
  }

  async login(dto: LoginDto) {
    const user = await this.userService.findUserForAuth(dto.email);

    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const roleNames = user.roles.map((ur) => ur.role.name);
    const permissionKeys = [
      ...new Set(
        user.roles.flatMap((ur) =>
          ur.role.rolePermissions.map((rp) => rp.permission.key),
        ),
      ),
    ];

    // Get student/teacher info if applicable
    let studentId: number | null = null;
    let groupId: number | null = null;
    let teacherId: number | null = null;

    if (roleNames.includes('student')) {
      const student = await this.studentRepo.findOne({
        where: { userId: user.id },
        select: ['id', 'groupId'],
      });
      if (student) {
        studentId = student.id;
        groupId = student.groupId;
      }
    }

    if (roleNames.includes('teacher')) {
      const teacher = await this.teacherRepo.findOne({
        where: { userId: user.id },
        select: ['id'],
      });
      if (teacher) {
        teacherId = teacher.id;
      }
    }

    const accessToken = await this.jwt.signAsync(
      {
        sub: user.id,
        email: user.email,
        roles: roleNames,
        permissions: permissionKeys,
        studentId,
        groupId,
        teacherId,
      },
      {
        secret: process.env.JWT_ACCESS_SECRET,
        expiresIn: process.env.JWT_ACCESS_EXPIRES ?? '60m',
      } as any,
    );

    const refreshToken = randomBytes(48).toString('hex');
    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.refreshTokens.save({
      tokenHash: refreshTokenHash,
      user: { id: user.id },
      expiresAt: expiresAt,
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        nameKhmer: user.nameKhmer,
        nameLatin: user.nameLatin,
        roles: roleNames,
        studentId,
        groupId,
        teacherId,
      },
    };
  }
}
