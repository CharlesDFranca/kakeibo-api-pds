import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CoreModule } from '@/core/core.module';

import { FINANCE_TOKENS } from './finance.tokens';
import { FinanceController } from './presentation/controllers/finance.controller';
import { WalletController } from './presentation/controllers/wallet.controller';
import { TransactionController } from './presentation/controllers/transaction.controller';
import { CategoryController } from './presentation/controllers/category.controller';

import { CreateWalletUseCase } from './app/use-cases/wallets/create-wallet.usecase';
import { ListWalletsUseCase } from './app/use-cases/wallets/list-wallets.usecase';
import { DeleteWalletUseCase } from './app/use-cases/wallets/delete-wallet.usecase';
import { RenameWalletUseCase } from './app/use-cases/wallets/rename-wallet.usecase';
import { RegisterTransactionUseCase } from './app/use-cases/transactions/register-transaction.usecase';
import { ListTransactionsUseCase } from './app/use-cases/transactions/list-transactions.usecase';
import { CreateCategoryUseCase } from './app/use-cases/categories/create-category.usecase';
import { ListCategoriesUseCase } from './app/use-cases/categories/list-categories.usecase';

import { WalletEntity } from './infra/entities/typeorm-wallet.entity';
import { TransactionEntity } from './infra/entities/typeorm-transaction.entity';
import { CategoryEntity } from './infra/entities/typeorm-category.entity';

import { TypeOrmWalletRepository } from './infra/repositories/typeorm-wallet.repository';
import { TypeOrmTransactionRepository } from './infra/repositories/typeorm-transaction.repository';
import { TypeOrmTransferRepository } from './infra/repositories/typeorm-transfer.repository';
import { TypeOrmCategoryRepository } from './infra/repositories/typeorm-category.repository';
import { TypeOrmTransactionQuery } from './infra/queries/typeorm-transaction.query';
import { TypeOrmTransferQuery } from './infra/queries/typeorm-transfer.query';
import { ListTransfersUseCase } from './app/use-cases/transfers/list-transfers.usecase';
import { FindTransferByIdUseCase } from './app/use-cases/transfers/find-transfer-by-id.usecase';
import { FundsAllocationRegistry } from './app/services/funds-allocation.registry';
import { WalletDeletionPolicy } from './app/services/wallet-deletion.policy';
import { TypeOrmFinanceUnitOfWork } from './infra/database/typeorm-finance.uow';
import { FinanceFacadeService } from './app/services/finance-facade.service';
import { TransferFundsUseCase } from './app/use-cases/transfers/transfer-funds.usecase';
import { RevertTransferUseCase } from './app/use-cases/transfers/revert-transfer.usecase';
import { DeleteTransactionUseCase } from './app/use-cases/transactions/delete-transaction.usecase';
import { TransferController } from './presentation/controllers/transfer.controller';
import { TransferEntity } from './infra/entities/typeorm-transfer.entity';
import { CategoryDeletionPolicy } from './app/services/category-deletion.policy';
import { RemoveCategoryUseCase } from './app/use-cases/categories/remove-category.usecase';
import { RenameCategoryUseCase } from './app/use-cases/categories/rename-category.usecase';
import { GetFinanceDashboardUseCase } from './app/use-cases/dashboard';
import { TypeOrmFinanceDashboardQuery } from './infra/queries/typeorm-finance-dashboard.query';

@Module({
    imports: [
        CoreModule,
        TypeOrmModule.forFeature([
            WalletEntity,
            TransactionEntity,
            CategoryEntity,
            TransferEntity,
        ]),
    ],
    controllers: [
        FinanceController,
        WalletController,
        TransactionController,
        CategoryController,
        TransferController,
    ],
    providers: [
        CreateWalletUseCase,
        ListWalletsUseCase,
        DeleteWalletUseCase,
        RenameWalletUseCase,
        RegisterTransactionUseCase,
        ListTransactionsUseCase,
        CreateCategoryUseCase,
        RemoveCategoryUseCase,
        RenameCategoryUseCase,
        ListCategoriesUseCase,
        TransferFundsUseCase,
        RevertTransferUseCase,
        ListTransfersUseCase,
        FindTransferByIdUseCase,
        DeleteTransactionUseCase,
        GetFinanceDashboardUseCase,

        {
            provide: FINANCE_TOKENS.WALLET_DELETION_POLICY,
            useClass: WalletDeletionPolicy,
        },

        {
            provide: FINANCE_TOKENS.CATEGORY_DELETION_POLICY,
            useClass: CategoryDeletionPolicy,
        },

        {
            provide: FINANCE_TOKENS.WALLET_REPOSITORY,
            useClass: TypeOrmWalletRepository,
        },
        {
            provide: FINANCE_TOKENS.TRANSACTION_REPOSITORY,
            useClass: TypeOrmTransactionRepository,
        },
        {
            provide: FINANCE_TOKENS.CATEGORY_REPOSITORY,
            useClass: TypeOrmCategoryRepository,
        },
        {
            provide: FINANCE_TOKENS.TRANSFER_REPOSITORY,
            useClass: TypeOrmTransferRepository,
        },
        {
            provide: FINANCE_TOKENS.TRANSACTION_QUERY,
            useClass: TypeOrmTransactionQuery,
        },
        {
            provide: FINANCE_TOKENS.TRANSFER_QUERY,
            useClass: TypeOrmTransferQuery,
        },
        {
            provide: FINANCE_TOKENS.FINANCE_DASHBOARD_QUERY,
            useClass: TypeOrmFinanceDashboardQuery,
        },
        {
            provide: FINANCE_TOKENS.UNIT_OF_WORK,
            useClass: TypeOrmFinanceUnitOfWork,
        },

        {
            provide: FINANCE_TOKENS.FACADE,
            useClass: FinanceFacadeService,
        },

        // Outros contextos (ex.: Planning) se registram aqui para informar
        // dinheiro comprometido; o Finance não depende deles.
        {
            provide: FINANCE_TOKENS.FUNDS_ALLOCATION,
            useClass: FundsAllocationRegistry,
        },
    ],
    exports: [FINANCE_TOKENS.FACADE, FINANCE_TOKENS.FUNDS_ALLOCATION],
})
export class FinanceModule {}
