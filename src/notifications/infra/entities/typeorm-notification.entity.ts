import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    PrimaryColumn,
} from 'typeorm';
import { UserEntity } from '@/identity/infra/entities/typeorm-user.entity';
import { ENotificationType } from '@/notifications/domain/entities/notification.entity';

@Entity('notifications')
@Index('IDX_notifications_user_created', ['userId', 'createdAt'])
export class NotificationEntity {
    @PrimaryColumn()
    id!: string;

    @Column()
    userId!: string;

    @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'userId' })
    user!: UserEntity;

    @Column({ type: 'enum', enum: ENotificationType })
    type!: ENotificationType;

    @Column({ type: 'varchar', length: 150 })
    title!: string;

    @Column({ type: 'varchar', length: 500 })
    message!: string;

    @Column({ type: 'timestamptz', nullable: true })
    readAt!: Date | null;

    @CreateDateColumn({ type: 'timestamptz' })
    createdAt!: Date;
}
