import { IsArray, IsInt } from 'class-validator';

export class AddStudentsToGroupDto {
  @IsArray()
  @IsInt({ each: true })
  studentIds: number[];
}
