import { IsUUID } from 'class-validator';

export class RegenerateCodeDto {
  @IsUUID()
  sessionId: string;
}
