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
import { WalletEntity } from './typeorm-wallet.entity';
import { TransactionEntity } from './typeorm-transaction.entity';
import { ETransferStatus } from '@/finance/domain/enums/transfer-status.enum';

@Entity('transfers')
@Index('IDX_transfers_source_wallet', ['sourceWalletId'])
@Index('IDX_transfers_destination_wallet', ['destinationWalletId'])
export class TransferEntity {
    @PrimaryColumn()
    id!: string;

    @Column({ type: 'int' })
    amount!: number;

    @Column()
    sourceWalletId!: string;

    @Column()
    destinationWalletId!: string;

    @Column()
    sourceTransactionId!: string;

    @Column()
    destinationTransactionId!: string;

    @Column({ type: 'enum', enum: ETransferStatus })
    status!: ETransferStatus;

    @CreateDateColumn({ type: 'timestamptz' })
    createdAt!: Date;

    @UpdateDateColumn({ type: 'timestamptz' })
    updatedAt!: Date;

    @ManyToOne(() => WalletEntity, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'sourceWalletId' })
    sourceWallet!: WalletEntity;

    @ManyToOne(() => WalletEntity, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'destinationWalletId' })
    destinationWallet!: WalletEntity;

    @ManyToOne(() => TransactionEntity, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'sourceTransactionId' })
    sourceTransaction!: TransactionEntity;

    @ManyToOne(() => TransactionEntity, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'destinationTransactionId' })
    destinationTransaction!: TransactionEntity;
}
