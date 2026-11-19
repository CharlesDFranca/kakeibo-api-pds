import { ETransactionType } from '@/finance/domain/enums/transaction-type.enum';
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
import { ETransactionDirection } from '@/finance/domain/enums/transaction-direction.enum';
import { WalletEntity } from './typeorm-wallet.entity';
import { CategoryEntity } from './typeorm-category.entity';

// Índices dos painéis e listagens (RNF03): filtros por carteira e período,
// junção por categoria e as "últimas transações".
@Entity('transactions')
@Index('IDX_transactions_wallet_date', ['walletId', 'date'])
@Index('IDX_transactions_category', ['categoryId'])
@Index('IDX_transactions_date', ['date'])
export class TransactionEntity {
    @PrimaryColumn()
    id!: string;

    @Column({ type: 'varchar', length: 200 })
    description!: string;

    @Column({ type: 'int' })
    amount!: number;

    @Column({ type: 'enum', enum: ETransactionType })
    type!: ETransactionType;

    @Column({
        type: 'enum',
        enum: ETransactionDirection,
        nullable: true,
    })
    direction!: ETransactionDirection | null;

    @Column({ type: 'timestamptz' })
    date!: Date;

    @Column()
    walletId!: string;

    @Column()
    categoryId!: string;

    @ManyToOne(() => WalletEntity, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'walletId' })
    wallet!: WalletEntity;

    @ManyToOne(() => CategoryEntity, { onDelete: 'RESTRICT' })
    @JoinColumn({ name: 'categoryId' })
    category!: CategoryEntity;

    @CreateDateColumn({ type: 'timestamptz' })
    createdAt!: Date;

    @UpdateDateColumn({ type: 'timestamptz' })
    updatedAt!: Date;
}
