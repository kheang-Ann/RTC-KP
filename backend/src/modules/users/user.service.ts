import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserRole } from './entities/user-role.entity';
import { Role } from './entities/role.entity';

@Injectable()
export class UserService {
  @InjectRepository(User)
  private userRepo: Repository<User>;

  @InjectRepository(UserRole)
  private userRoleRepo: Repository<UserRole>;

  @InjectRepository(Role)
  private roleRepo: Repository<Role>;

  private async isAdminRole(roleId: number): Promise<boolean> {
    const role = await this.roleRepo.findOne({ where: { id: roleId } });
    return role?.name === 'admin';
  }

  private hasAdminRole(user: User): boolean {
    return user.roles?.some((ur) => ur.role?.name === 'admin') ?? false;
  }

  async create(data: Partial<User>, roleId?: number): Promise<User> {
    // Prevent creating users with admin role
    if (roleId) {
      const isAdmin = await this.isAdminRole(roleId);
      if (isAdmin) {
        throw new ForbiddenException('Cannot create users with admin role');
      }
    }

    const newUser = this.userRepo.create(data);
    const savedUser = await this.userRepo.save(newUser);

    if (!roleId) {
      const studentRole = await this.roleRepo.findOne({
        where: { name: 'student' },
      });

      if (studentRole) {
        roleId = studentRole.id;
      }
    }

    if (roleId) {
      const userRole = this.userRoleRepo.create({
        user: savedUser,
        role: { id: roleId } as Role,
      });
      await this.userRoleRepo.save(userRole);
    }

    return savedUser;
  }

  async update(id: number, dto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);

    // Prevent updating admin users
    if (this.hasAdminRole(user)) {
      throw new ForbiddenException('Cannot modify admin users');
    }

    const updatedUser = this.userRepo.merge(user, dto);
    return this.userRepo.save(updatedUser);
  }

  async findAll(): Promise<User[]> {
    return this.userRepo.find({
      relations: ['roles', 'roles.role', 'department'],
    });
  }
  async findOne(id: number): Promise<User> {
    const user = await this.userRepo.findOne({
      where: { id },
      relations: ['roles', 'roles.role'],
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { email } });
  }

  async remove(id: number): Promise<void> {
    const user = await this.findOne(id);

    // Prevent deleting admin users
    if (this.hasAdminRole(user)) {
      throw new ForbiddenException('Cannot delete admin users');
    }

    const result = await this.userRepo.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
  }

  async findUserForAuth(email: string) {
    return this.userRepo
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .leftJoinAndSelect('user.roles', 'userRoles')
      .leftJoinAndSelect('userRoles.role', 'role')
      .leftJoinAndSelect('role.rolePermissions', 'rolePerms')
      .leftJoinAndSelect('rolePerms.permission', 'permission')
      .where('user.email = :email', { email })
      .getOne();
  }
}
