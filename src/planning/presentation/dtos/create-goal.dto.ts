import { Type } from 'class-transformer';
import { IsDate, IsNotEmpty, IsNumberString, IsString } from 'class-validator';

export class CreateGoalDto {
    @IsString()
    @IsNotEmpty()
    name!: string;

    @IsNumberString(
        { no_symbols: false },
        { message: 'targetAmount must be a valid monetary value' },
    )
    targetAmount!: string;

    @Type(() => Date)
    @IsDate()
    deadline!: Date;
}
