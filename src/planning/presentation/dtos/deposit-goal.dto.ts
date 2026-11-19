import { IsNotEmpty, IsNumberString, IsString, IsUUID } from 'class-validator';

export class DepositGoalDto {
    @IsString()
    @IsNotEmpty()
    @IsUUID()
    walletId!: string;

    @IsNumberString(
        { no_symbols: false },
        { message: 'amount must be a valid monetary value' },
    )
    amount!: string;
}
