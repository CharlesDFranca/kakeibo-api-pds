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

    @Column({ type: 'jsonb', default: () => "'[]'" })
    seenTutorials!: string[];

    @CreateDateColumn({ type: 'timestamptz' })
    createdAt!: Date;

    @UpdateDateColumn({ type: 'timestamptz' })
    updatedAt!: Date;
}
