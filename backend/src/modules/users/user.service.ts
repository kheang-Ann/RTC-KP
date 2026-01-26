import { Injectable, NotFoundException } from '@nestjs/common';
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

  async create(data: Partial<User>, roleId?: number): Promise<User> {
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
