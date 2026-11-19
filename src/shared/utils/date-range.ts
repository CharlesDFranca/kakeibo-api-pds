const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Início do período. "2026-11-14" vira 2026-11-14T00:00:00.000Z; um
 * timestamp completo é mantido como foi informado.
 */
export function parseRangeStart(value: string): Date {
    return new Date(value);
}

/**
 * Fim do período, inclusivo. Uma data sem hora ("2026-11-14") cobre o dia
 * inteiro (até 23:59:59.999Z); um timestamp completo é mantido.
 */
export function parseRangeEnd(value: string): Date {
    if (DATE_ONLY.test(value)) {
        return new Date(`${value}T23:59:59.999Z`);
    }

    return new Date(value);
}
