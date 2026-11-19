import { SetMetadata } from '@nestjs/common';
import { EFeature } from '@/shared/plans/feature.enum';

export const REQUIRES_FEATURE_KEY = 'requiresFeature';

/** Restringe a rota (ou o controller inteiro) a planos que liberam a feature. */
export const RequiresFeature = (feature: EFeature) =>
    SetMetadata(REQUIRES_FEATURE_KEY, feature);
