import {
    InMemoryFinanceUnitOfWork,
    SequentialIdGenerator,
    makeCategory,
} from '../../../testing/in-memory-finance';
import { CreateCategoryUseCase } from './create-category.usecase';
import { RenameCategoryUseCase } from './rename-category.usecase';
import { RemoveCategoryUseCase } from './remove-category.usecase';
import { ListCategoriesUseCase } from './list-categories.usecase';
import { CategoryAlreadyExistsError } from '../../errors/category-already-exists.error';
import { CategoryNotFoundError } from '../../errors/category-not-found.error';
import { SystemCategoryCannotBeRemovedError } from '@/finance/domain/errors/system-category-cannot-be-removed.error';
import { SystemCategoryCannotBeRenamedError } from '@/finance/domain/errors/system-category-cannot-be-renamed.error';

describe('Categorias (US05 / US06 / RN05)', () => {
    let uow: InMemoryFinanceUnitOfWork;
    let hasTransactions: boolean;

    const create = () =>
        new CreateCategoryUseCase(uow.categories, new SequentialIdGenerator());
    const rename = () => new RenameCategoryUseCase(uow.categories);
    const remove = () =>
        new RemoveCategoryUseCase(
            { canDelete: () => Promise.resolve(!hasTransactions) },
            uow.categories,
        );
    const list = () => new ListCategoriesUseCase(uow.categories);

    beforeEach(async () => {
        hasTransactions = false;
        uow = new InMemoryFinanceUnitOfWork();
        await uow.categories.create(
            makeCategory('sys', 'transfer', { isSystem: true }),
        );
        await uow.categories.create(makeCategory('c1', 'Mercado'));
    });

    it('cria uma categoria personalizada e ela aparece na listagem', async () => {
        const { id } = await create().execute({ userId: 'user-1', name: 'Pets' });

        const names = (await list().execute({ userId: 'user-1' })).map((c) => c.name);
        expect(names.includes('Pets')).toBe(true);
        expect(uow.categories.categories.get(id)?.isActive).toBe(true);
    });

    it('a listagem traz só categorias ativas e que não são de sistema', async () => {
        await uow.categories.create(makeCategory('off', 'Antiga', { isActive: false }));

        const names = (await list().execute({ userId: 'user-1' })).map((c) => c.name);
        expect(names).toEqual(['Mercado']);
    });

    it('rejeita nome já existente e reativa categoria inativa com o mesmo nome', async () => {
        await expect(
            create().execute({ userId: 'user-1', name: 'Mercado' }),
        ).rejects.toThrow(CategoryAlreadyExistsError);

        await uow.categories.create(makeCategory('off', 'Antiga', { isActive: false }));
        const { id } = await create().execute({ userId: 'user-1', name: 'Antiga' });

        expect(id).toBe('off');
        expect(uow.categories.categories.get('off')?.isActive).toBe(true);
    });

    it('renomeia, e recusa nome duplicado ou categoria de sistema', async () => {
        await rename().execute({ userId: 'user-1', categoryId: 'c1', name: 'Supermercado' });
        expect(uow.categories.categories.get('c1')?.name.value).toBe('Supermercado');

        await uow.categories.create(makeCategory('c2', 'Lazer'));
        await expect(
            rename().execute({ userId: 'user-1', categoryId: 'c2', name: 'Supermercado' }),
        ).rejects.toThrow(CategoryAlreadyExistsError);

        await expect(
            rename().execute({ userId: 'user-1', categoryId: 'sys', name: 'Outro' }),
        ).rejects.toThrow(SystemCategoryCannotBeRenamedError);
    });

    it('remove definitivamente a categoria sem transações', async () => {
        await remove().execute({ userId: 'user-1', categoryId: 'c1' });

        expect(uow.categories.categories.has('c1')).toBe(false);
    });

    it('apenas desativa a categoria que já tem transações (RN05)', async () => {
        hasTransactions = true;

        await remove().execute({ userId: 'user-1', categoryId: 'c1' });

        expect(uow.categories.categories.get('c1')?.isActive).toBe(false);
    });

    it('não remove categoria de sistema nem de outro usuário', async () => {
        await expect(
            remove().execute({ userId: 'user-1', categoryId: 'sys' }),
        ).rejects.toThrow(SystemCategoryCannotBeRemovedError);
        await expect(
            remove().execute({ userId: 'user-2', categoryId: 'c1' }),
        ).rejects.toThrow(CategoryNotFoundError);
    });
});
