import { CurrentUserId } from '@/core/decorators/current-user-id.decorator';
import { TransferFundsUseCase } from '@/finance/app/use-cases/transfers/transfer-funds.usecase';
import { RevertTransferUseCase } from '@/finance/app/use-cases/transfers/revert-transfer.usecase';
import { ListTransfersUseCase } from '@/finance/app/use-cases/transfers/list-transfers.usecase';
import { FindTransferByIdUseCase } from '@/finance/app/use-cases/transfers/find-transfer-by-id.usecase';
import {
    Controller,
    Get,
    Post,
    HttpCode,
    HttpStatus,
    Body,
    Param,
    Query,
} from '@nestjs/common';
import { CreateTransferDto } from '../dtos/create-transfer.dto';
import { ListTransfersDto } from '../dtos/list-transfers.dto';
import { RequiresFeature } from '@/core/decorators/requires-feature.decorator';
import { EFeature } from '@/shared/plans/feature.enum';

@RequiresFeature(EFeature.TRANSFERS)
@Controller('transfers')
export class TransferController {
    constructor(
        private readonly createTransferUseCase: TransferFundsUseCase,
        private readonly revertTransferUseCase: RevertTransferUseCase,
        private readonly listTransfersUseCase: ListTransfersUseCase,
        private readonly findTransferByIdUseCase: FindTransferByIdUseCase,
    ) {}

    @Post()
    @HttpCode(HttpStatus.CREATED)
    async create(
        @CurrentUserId() userId: string,
        @Body()
        body: CreateTransferDto,
    ) {
        return this.createTransferUseCase.execute({
            userId,
            amount: body.amount,
            destinationWalletId: body.destinationWalletId,
            sourceWalletId: body.sourceWalletId,
        });
    }

    @Get()
    @HttpCode(HttpStatus.OK)
    async list(
        @CurrentUserId() userId: string,
        @Query() query: ListTransfersDto,
    ) {
        return this.listTransfersUseCase.execute({
            userId,
            filters: { status: query.status },
        });
    }

    @Get(':id')
    @HttpCode(HttpStatus.OK)
    async findById(
        @CurrentUserId() userId: string,
        @Param('id') transferId: string,
    ) {
        return this.findTransferByIdUseCase.execute({ userId, transferId });
    }

    @Post(':id/revert')
    @HttpCode(HttpStatus.OK)
    async revert(
        @CurrentUserId() userId: string,
        @Param('id') transferId: string,
    ) {
        await this.revertTransferUseCase.execute({
            userId,
            transferId,
        });
    }
}
