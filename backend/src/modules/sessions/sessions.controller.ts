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
    sub: number; // JWT uses 'sub' for user ID
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
    const isAdmin = req.user.roles?.includes('admin') ?? false;
    return this.sessionsService.create(dto, req.user.sub, isAdmin);
  }

  @Get()
  @Roles('teacher', 'admin')
  async findAll(@Req() req: RequestWithUser) {
    const isAdmin = req.user.roles?.includes('admin') ?? false;
    return this.sessionsService.findAll(req.user.sub, isAdmin);
  }

  @Get('upcoming')
  @Roles('student')
  async findUpcoming(@Req() req: RequestWithUser) {
    return this.sessionsService.findUpcomingForStudent(req.user.sub);
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
    return this.sessionsService.update(id, dto, req.user.sub, isAdmin);
  }

  @Post(':id/activate')
  @Roles('teacher', 'admin')
  async activate(@Param('id') id: string, @Req() req: RequestWithUser) {
    const isAdmin = req.user.roles?.includes('admin') ?? false;
    return this.sessionsService.activateSession(id, req.user.sub, isAdmin);
  }

  @Post(':id/complete')
  @Roles('teacher', 'admin')
  async complete(@Param('id') id: string, @Req() req: RequestWithUser) {
    const isAdmin = req.user.roles?.includes('admin') ?? false;
    return this.sessionsService.completeSession(id, req.user.sub, isAdmin);
  }

  @Post(':id/regenerate-code')
  @Roles('teacher', 'admin')
  async regenerateCode(@Param('id') id: string, @Req() req: RequestWithUser) {
    const isAdmin = req.user.roles?.includes('admin') ?? false;
    return this.sessionsService.regenerateCode(id, req.user.sub, isAdmin);
  }

  @Post('cleanup/expired')
  @Roles('teacher', 'admin')
  async closeExpired() {
    const count = await this.sessionsService.closeExpiredSessions();
    return { closedCount: count };
  }

  @Delete(':id')
  @Roles('teacher', 'admin')
  async remove(@Param('id') id: string, @Req() req: RequestWithUser) {
    const isAdmin = req.user.roles?.includes('admin') ?? false;
    return this.sessionsService.remove(id, req.user.sub, isAdmin);
  }
}
