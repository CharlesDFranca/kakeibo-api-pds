import {
    IsEmail,
    IsNotEmpty,
    IsOptional,
    IsString,
    MinLength,
} from 'class-validator';

export class CreateUserDto {
    @IsOptional()
    @IsString()
    name?: string;

    @IsString()
    @IsNotEmpty()
    username!: string;

    @IsEmail()
    email!: string;

    @IsString()
    @IsNotEmpty()
    @MinLength(8)
    password!: string;
}
