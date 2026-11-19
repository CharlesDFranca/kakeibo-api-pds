import { parseRangeEnd, parseRangeStart } from './date-range';

describe('date-range', () => {
    it('data sem hora no início vale 00:00 UTC', () => {
        expect(parseRangeStart('2026-11-14').toISOString()).toBe(
            '2026-11-14T00:00:00.000Z',
        );
    });

    it('data sem hora no fim cobre o dia inteiro', () => {
        expect(parseRangeEnd('2026-11-14').toISOString()).toBe(
            '2026-11-14T23:59:59.999Z',
        );
    });

    it('timestamp completo é mantido', () => {
        expect(parseRangeEnd('2026-11-14T10:30:00.000Z').toISOString()).toBe(
            '2026-11-14T10:30:00.000Z',
        );
        expect(parseRangeStart('2026-11-14T10:30:00.000Z').toISOString()).toBe(
            '2026-11-14T10:30:00.000Z',
        );
    });

    it('início e fim do mesmo dia formam um período válido', () => {
        const start = parseRangeStart('2026-11-14');
        const end = parseRangeEnd('2026-11-14');

        expect(start.getTime() <= end.getTime()).toBe(true);
    });
});
