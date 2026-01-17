import { Module } from '@nestjs/common';
import { User } from './entities/user.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Role } from './entities/role.entity';
import { UserRole } from './entities/user-role.entity';
import { UserService } from './user.service';
import { Permission } from './entities/permission.entity';
import { RolePermission } from './entities/role-permission';
import { RefreshToken } from './entities/refresh-toke.entity';
import { UserController } from './user.controller';
import { RoleSeeder } from './seeds/role.seeder';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Role,
      Permission,
      UserRole,
      RolePermission,
      RefreshToken,
    ]),
  ],
  controllers: [UserController],
  providers: [UserService, RoleSeeder],
  exports: [UserService],
})
export class UserModule {}
