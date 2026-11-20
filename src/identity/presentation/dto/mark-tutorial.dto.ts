import { IsIn } from 'class-validator';
import { TUTORIAL_IDS } from '@/identity/domain/tutorial-ids';

export class MarkTutorialDto {
    @IsIn(TUTORIAL_IDS)
    tutorial!: string;
}
