import { EPlan } from '@/shared/plans/plan.enum';
import {
    Column,
    CreateDateColumn,
    Entity,
    PrimaryColumn,
    UpdateDateColumn,
} from 'typeorm';

@Entity('users')
export class UserEntity {
    @PrimaryColumn()
    id!: string;

    @Column({ type: 'varchar', length: 100 })
    name!: string;

    @Column({ type: 'varchar', unique: true })
    email!: string;

    @Column({ type: 'varchar', length: 30, unique: true })
    username!: string;

    @Column({ type: 'varchar' })
    password!: string;

    @Column({ type: 'enum', enum: EPlan, default: EPlan.FREE })
    plan!: EPlan;

<<<<<<< HEAD
    @Column({ type: 'jsonb', default: () => "'[]'" })
    seenTutorials!: string[];
=======
    @Column({ type: 'boolean', default: false })
    tutorialCompleted!: boolean;
>>>>>>> 2b80e84bd9c98cbe154a3c87146c227be8c3320f

    @CreateDateColumn({ type: 'timestamptz' })
    createdAt!: Date;

    @UpdateDateColumn({ type: 'timestamptz' })
    updatedAt!: Date;
}
