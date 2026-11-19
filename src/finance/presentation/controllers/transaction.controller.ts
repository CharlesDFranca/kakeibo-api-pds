import {
    RegisterTransactionUseCase,
    ListTransactionsUseCase,
    DeleteTransactionUseCase,
} from '@/finance/app/use-cases/transactions';
import { CurrentUserId } from '@/core/decorators/current-user-id.decorator';
import {
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    Post,
    Query,
} from '@nestjs/common';
import {
    parseRangeEnd,
    parseRangeStart,
} from '@/shared/utils/date-range';
import { CreateTransactionDto } from '../dtos/create-transaction.dto';
import { ListTransactionsDto } from '../dtos/list-transaction.dto';

@Controller('transactions')
export class TransactionController {
    constructor(
        private readonly createTransactionUseCase: RegisterTransactionUseCase,
        private readonly listTransactionsUseCase: ListTransactionsUseCase,
        private readonly deleteTransactionUseCase: DeleteTransactionUseCase,
    ) {}

    @Post()
    @HttpCode(HttpStatus.CREATED)
    async create(
        @CurrentUserId() userId: string,
        @Body() body: CreateTransactionDto,
    ) {
        const transaction = await this.createTransactionUseCase.execute({
            userId,
            amount: body.amount,
            description: body.description,
            date: new Date(body.date),
            type: body.type,
            categoryId: body.categoryId,
            walletId: body.walletId,
        });

        return transaction;
    }

    @Get()
    @HttpCode(HttpStatus.OK)
    async list(
        @CurrentUserId() userId: string,
        @Query() query: ListTransactionsDto,
    ) {
        return this.listTransactionsUseCase.execute({
            userId,
            filters: {
                categoryIds: query.categoryIds,
                walletIds: query.walletIds,
                startDate: query.startDate
                    ? parseRangeStart(query.startDate)
                    : undefined,
                endDate: query.endDate
                    ? parseRangeEnd(query.endDate)
                    : undefined,
                type: query.type,
            },
        });
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    async delete(
        @CurrentUserId() userId: string,
        @Param('id') transactionId: string,
    ) {
        await this.deleteTransactionUseCase.execute({ userId, transactionId });
    }
}
