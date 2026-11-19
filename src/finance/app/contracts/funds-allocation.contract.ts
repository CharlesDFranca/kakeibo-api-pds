/**
 * Porta do Finance: "este dinheiro está comprometido com outra coisa?".
 *
 * O Finance não sabe QUEM compromete o dinheiro (hoje, as metas do contexto
 * Planning; amanhã, orçamentos). Cada contexto interessado implementa
 * `IFundsAllocationSource` e se registra no Finance. Assim a dependência
 * aponta de Planning para Finance, nunca o contrário (DIP entre contextos).
 */
export interface IFundsAllocationSource {
    /** A carteira tem dinheiro comprometido (ex.: aportes ativos em metas)? */
    isWalletAllocated(userId: string, walletId: string): Promise<boolean>;

    /** A transação está ligada a uma movimentação de outro contexto? */
    isTransactionAllocated(
        userId: string,
        transactionId: string,
    ): Promise<boolean>;
}

/** Agrega todas as fontes registradas; é o que o Finance consulta. */
export interface IFundsAllocationRegistry extends IFundsAllocationSource {
    register(source: IFundsAllocationSource): void;
}
