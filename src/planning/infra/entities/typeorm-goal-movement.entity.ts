import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    PrimaryColumn,
    UpdateDateColumn,
} from 'typeorm';

import { GoalEntity } from './typeorm-goal.entity';
import { EGoalMovementType } from '@/planning/domain/enums/goal-movement-type.enum';

@Entity('goal_movements')
@Index('IDX_goal_movements_goal', ['goalId'])
@Index('IDX_goal_movements_wallet', ['walletId'])
@Index('IDX_goal_movements_transaction', ['transactionId'])
export class GoalMovementEntity {
    @PrimaryColumn()
    id!: string;

    @Column({ type: 'int' })
    amount!: number;

    @Column({ type: 'enum', enum: EGoalMovementType })
    type!: EGoalMovementType;

    @Column({ type: 'varchar', nullable: true })
    transactionId!: string | null;

    // RN13 – a deposit can be reverted only once (enforced at database level)
    @Column({ type: 'varchar', nullable: true, unique: true })
    revertedDepositId!: string | null;

    // Só o id: o Planning não conhece a infraestrutura do Finance.
    @Column()
    walletId!: string;

    @Column()
    goalId!: string;

    @ManyToOne(() => GoalEntity, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'goalId' })
    goal!: GoalEntity;

    @CreateDateColumn({ type: 'timestamptz' })
    createdAt!: Date;

    @UpdateDateColumn({ type: 'timestamptz' })
    updatedAt!: Date;
}
