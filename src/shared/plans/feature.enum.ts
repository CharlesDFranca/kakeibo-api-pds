/**
 * Funcionalidades que dependem do plano. As demais (autenticação, carteiras,
 * categorias, receitas/despesas, histórico e resumo financeiro) são de todos
 * os planos e não aparecem aqui.
 */
export enum EFeature {
    TRANSFERS = 'TRANSFERS',
    CATEGORY_ANALYSIS = 'CATEGORY_ANALYSIS',
    GOALS = 'GOALS',
    NOTIFICATIONS = 'NOTIFICATIONS',
}
