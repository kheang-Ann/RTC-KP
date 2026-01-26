import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { SessionsService } from './sessions.service';
import { CreateSessionDto } from './dto/create-session.to';
import { UpdateSessionDto } from './dto/update-session.dto';
import { JwtAuthGuard } from '../auth/guards/jaw-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorator/roles.decorator';

interface RequestWithUser {
  user: {
    id: number;
    email: string;
    roles: string[];
  };
}

@Controller('sessions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Post()
  @Roles('teacher', 'admin')
  async create(@Body() dto: CreateSessionDto, @Req() req: RequestWithUser) {
    return this.sessionsService.create(dto, req.user.id);
  }

  @Get()
  @Roles('teacher', 'admin')
  async findAll(@Req() req: RequestWithUser) {
    const isAdmin = req.user.roles?.includes('admin') ?? false;
    return this.sessionsService.findAll(req.user.id, isAdmin);
  }

  @Get('course/:courseId')
  @Roles('teacher', 'admin', 'student')
  async findByCourse(@Param('courseId') courseId: string) {
    return this.sessionsService.findByCourse(courseId);
  }

  @Get(':id')
  @Roles('teacher', 'admin', 'student')
  async findOne(@Param('id') id: string) {
    return this.sessionsService.findOne(id);
  }

  @Patch(':id')
  @Roles('teacher', 'admin')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateSessionDto,
    @Req() req: RequestWithUser,
  ) {
    const isAdmin = req.user.roles?.includes('admin') ?? false;
    return this.sessionsService.update(id, dto, req.user.id, isAdmin);
  }

  @Post(':id/activate')
  @Roles('teacher', 'admin')
  async activate(@Param('id') id: string, @Req() req: RequestWithUser) {
    const isAdmin = req.user.roles?.includes('admin') ?? false;
    return this.sessionsService.activateSession(id, req.user.id, isAdmin);
  }

  @Post(':id/complete')
  @Roles('teacher', 'admin')
  async complete(@Param('id') id: string, @Req() req: RequestWithUser) {
    const isAdmin = req.user.roles?.includes('admin') ?? false;
    return this.sessionsService.completeSession(id, req.user.id, isAdmin);
  }

  @Post(':id/regenerate-code')
  @Roles('teacher', 'admin')
  async regenerateCode(@Param('id') id: string, @Req() req: RequestWithUser) {
    const isAdmin = req.user.roles?.includes('admin') ?? false;
    return this.sessionsService.regenerateCode(id, req.user.id, isAdmin);
  }

  @Delete(':id')
  @Roles('teacher', 'admin')
  async remove(@Param('id') id: string, @Req() req: RequestWithUser) {
    const isAdmin = req.user.roles?.includes('admin') ?? false;
    return this.sessionsService.remove(id, req.user.id, isAdmin);
  }
}
