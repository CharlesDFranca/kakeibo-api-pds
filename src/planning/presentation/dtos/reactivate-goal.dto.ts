import { Type } from 'class-transformer';
import { IsDate } from 'class-validator';

export class ReactivateGoalDto {
    @Type(() => Date)
    @IsDate()
    deadline!: Date;
}
