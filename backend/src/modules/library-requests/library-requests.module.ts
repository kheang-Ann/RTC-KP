import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LibraryRequest } from './entities/library-request.entity';
import { LibraryRequestsService } from './library-requests.service';
import { LibraryRequestsController } from './library-requests.controller';

@Module({
  imports: [TypeOrmModule.forFeature([LibraryRequest])],
  providers: [LibraryRequestsService],
  controllers: [LibraryRequestsController],
  exports: [LibraryRequestsService],
})
export class LibraryRequestsModule {}
