import { IsEnum } from 'class-validator';
import { EPlan } from '@/shared/plans/plan.enum';

export class ChangePlanDto {
    @IsEnum(EPlan)
    plan!: EPlan;
}
