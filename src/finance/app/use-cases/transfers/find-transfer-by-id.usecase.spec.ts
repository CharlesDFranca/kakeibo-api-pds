import { FindTransferByIdUseCase } from './find-transfer-by-id.usecase';
import { ListTransfersUseCase } from './list-transfers.usecase';
import type { ITransferQuery } from '../../contracts/transfer-query.interface';
import { TransferDetails } from '../../contracts/transfer-details.type';
import { ETransferStatus } from '@/finance/domain/enums/transfer-status.enum';
import { TransferNotFoundError } from '../../errors/transfer-not-found.error';

const details: TransferDetails = {
    id: 't1',
    amount: '10.00',
    status: ETransferStatus.COMPLETED,
    sourceWallet: { id: 'w1', name: 'Banco' },
    destinationWallet: { id: 'w2', name: 'Dinheiro' },
    createdAt: new Date(),
    updatedAt: new Date(),
};

describe('Consulta de transferências (ECUS10)', () => {
    const query: ITransferQuery = {
        findAllForUser: (userId, filters) =>
            Promise.resolve(
                userId === 'user-1' &&
                    (!filters?.status || filters.status === details.status)
                    ? [details]
                    : [],
            ),
        findUserTransferById: (userId, transferId) =>
            Promise.resolve(
                userId === 'user-1' && transferId === 't1' ? details : null,
            ),
    };

    it('lista as transferências do usuário', async () => {
        const result = await new ListTransfersUseCase(query).execute({
            userId: 'user-1',
        });

        expect(result).toEqual([details]);
    });

    it('lista vazia quando não há transferências ou o status não confere', async () => {
        const useCase = new ListTransfersUseCase(query);

        expect(await useCase.execute({ userId: 'outro' })).toEqual([]);
        expect(
            await useCase.execute({
                userId: 'user-1',
                filters: { status: ETransferStatus.REVERTED },
            }),
        ).toEqual([]);
    });

    it('retorna os dados de uma transferência', async () => {
        const result = await new FindTransferByIdUseCase(query).execute({
            userId: 'user-1',
            transferId: 't1',
        });

        expect(result.id).toBe('t1');
    });

    it('retorna erro quando a transferência não existe ou é de outro usuário', async () => {
        const useCase = new FindTransferByIdUseCase(query);

        await expect(
            useCase.execute({ userId: 'user-1', transferId: 'x' }),
        ).rejects.toThrow(TransferNotFoundError);
        await expect(
            useCase.execute({ userId: 'outro', transferId: 't1' }),
        ).rejects.toThrow(TransferNotFoundError);
    });
});
