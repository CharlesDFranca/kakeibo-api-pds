import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Money } from '@/shared/domain/value-objects/money.vo';
import { ITransferQuery } from '../../app/contracts/transfer-query.interface';
import { TransferDetails } from '../../app/contracts/transfer-details.type';
import { TransferFilters } from '../../app/contracts/transfer-filters.type';
import { TransferEntity } from '../entities/typeorm-transfer.entity';

@Injectable()
export class TypeOrmTransferQuery implements ITransferQuery {
    constructor(
        @InjectRepository(TransferEntity)
        private readonly transferRepository: Repository<TransferEntity>,
    ) {}

    async findAllForUser(
        userId: string,
        filters?: TransferFilters,
    ): Promise<TransferDetails[]> {
        const query = this.baseQuery(userId);

        if (filters?.status) {
            query.andWhere('transfer.status = :status', {
                status: filters.status,
            });
        }

        const transfers = await query
            .orderBy('transfer.createdAt', 'DESC')
            .addOrderBy('transfer.id', 'DESC')
            .getMany();

        return transfers.map((transfer) => this.toDetails(transfer));
    }

    async findUserTransferById(
        userId: string,
        transferId: string,
    ): Promise<TransferDetails | null> {
        const transfer = await this.baseQuery(userId)
            .andWhere('transfer.id = :transferId', { transferId })
            .getOne();

        return transfer ? this.toDetails(transfer) : null;
    }

    /** Apenas transferências com as duas carteiras do usuário (RNF01). */
    private baseQuery(userId: string): SelectQueryBuilder<TransferEntity> {
        return this.transferRepository
            .createQueryBuilder('transfer')
            .innerJoinAndSelect('transfer.sourceWallet', 'sourceWallet')
            .innerJoinAndSelect(
                'transfer.destinationWallet',
                'destinationWallet',
            )
            .where('sourceWallet.userId = :userId', { userId })
            .andWhere('destinationWallet.userId = :userId', { userId });
    }

    private toDetails(transfer: TransferEntity): TransferDetails {
        return {
            id: transfer.id,
            amount: Money.fromCents(transfer.amount).amount,
            status: transfer.status,
            sourceWallet: {
                id: transfer.sourceWalletId,
                name: transfer.sourceWallet.name,
            },
            destinationWallet: {
                id: transfer.destinationWalletId,
                name: transfer.destinationWallet.name,
            },
            createdAt: transfer.createdAt,
            updatedAt: transfer.updatedAt,
        };
    }
}
