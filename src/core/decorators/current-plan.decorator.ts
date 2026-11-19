import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { EPlan } from '@/shared/plans/plan.enum';

export const CurrentPlan = createParamDecorator(
    (_, ctx: ExecutionContext): EPlan => {
        const request = ctx.switchToHttp().getRequest<Request>();
        return request.auth.plan;
    },
);
