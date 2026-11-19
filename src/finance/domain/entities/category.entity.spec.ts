import { Name } from '@/shared/domain/value-objects/name.vo';
import { makeCategory } from '../../testing/in-memory-finance';
import { SystemCategoryCannotBeRenamedError } from '../errors/system-category-cannot-be-renamed.error';

describe('Category', () => {
    it('permite renomear uma categoria personalizada', () => {
        const category = makeCategory('c1', 'Food');

        category.rename(new Name('Mercado'));

        expect(category.name.value).toBe('Mercado');
    });

    it('não permite renomear uma categoria de sistema', () => {
        const category = makeCategory('c2', 'transfer', { isSystem: true });

        expect(() => category.rename(new Name('Outro nome'))).toThrow(
            SystemCategoryCannotBeRenamedError,
        );
        expect(category.name.value).toBe('transfer');
    });

    it('categorias de sistema não podem ser removidas', () => {
        expect(
            makeCategory('c3', 'adjustment', { isSystem: true }).canBeRemoved(),
        ).toBe(false);
        expect(makeCategory('c4', 'Food').canBeRemoved()).toBe(true);
    });

    it('pode ser desativada e reativada', () => {
        const category = makeCategory('c5', 'Food');

        category.deactivate();
        expect(category.isActive).toBe(false);

        category.activate();
        expect(category.isActive).toBe(true);
    });
});
