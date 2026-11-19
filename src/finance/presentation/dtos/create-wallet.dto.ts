import { IsNotEmpty, IsNumberString, IsString } from 'class-validator';

export class CreateWalletDto {
    @IsString()
    @IsNotEmpty()
    name!: string;

    @IsNumberString(
        { no_symbols: false },
        { message: 'balance must be a valid monetary value' },
    )
    balance!: string;
}
