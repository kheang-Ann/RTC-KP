import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { Role } from '../entities/role.entity';
import { UserRole } from '../entities/user-role.entity';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AdminSeeder implements OnModuleInit {
  private readonly logger = new Logger(AdminSeeder.name);

  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
    @InjectRepository(Role)
    private roleRepo: Repository<Role>,
    @InjectRepository(UserRole)
    private userRoleRepo: Repository<UserRole>,
  ) {}

  async onModuleInit() {
    // Delay to ensure RoleSeeder runs first
    await new Promise((resolve) => setTimeout(resolve, 100));
    await this.seedAdmin();
  }

  private async seedAdmin() {
    const adminEmail = 'admin@rtckp.kh';
    const adminPassword = 'helloworld';

    // Check if admin user already exists
    const existingAdmin = await this.userRepo.findOne({
      where: { email: adminEmail },
    });

    if (existingAdmin) {
      this.logger.log('Admin user already exists, skipping...');
      return;
    }

    // Find admin role
    const adminRole = await this.roleRepo.findOne({
      where: { name: 'admin' },
    });

    if (!adminRole) {
      this.logger.error(
        'Admin role not found. Please ensure RoleSeeder runs first.',
      );
      return;
    }

    // Create admin user
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    const adminUser = this.userRepo.create({
      email: adminEmail,
      nameKhmer: 'អ្នកគ្រប់គ្រង',
      nameLatin: 'Administrator',
      passwordHash: hashedPassword,
      isActive: true,
    });

    await this.userRepo.save(adminUser);

    // Assign admin role
    const userRole = this.userRoleRepo.create({
      user: adminUser,
      role: adminRole,
    });

    await this.userRoleRepo.save(userRole);

    this.logger.log(`Admin user created: ${adminEmail}`);
  }
}
