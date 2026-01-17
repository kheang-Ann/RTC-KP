import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from '../entities/role.entity';

@Injectable()
export class RoleSeeder implements OnModuleInit {
  private readonly logger = new Logger(RoleSeeder.name);

  constructor(
    @InjectRepository(Role)
    private roleRepo: Repository<Role>,
  ) {}

  async onModuleInit() {
    await this.seedRoles();
  }

  private async seedRoles() {
    const defaultRoles = ['admin', 'teacher', 'student'];

    for (const roleName of defaultRoles) {
      const exists = await this.roleRepo.findOne({
        where: { name: roleName },
      });

      if (!exists) {
        await this.roleRepo.save({ name: roleName });
        this.logger.log(`Role '${roleName}' created`);
      }
    }

    this.logger.log('Role seeding completed');
  }
}
