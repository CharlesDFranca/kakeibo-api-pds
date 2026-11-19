/**
 * Sentido do efeito de uma movimentação do tipo TRANSFER no saldo da carteira.
 * Receitas e despesas já têm o sentido implícito no tipo.
 */
export enum ETransactionDirection {
    IN = 'IN',
    OUT = 'OUT',
}
