import { Controller, Get } from '@nestjs/common';
import { Public } from './core/decorators/public-route.decorator';

@Controller('health')
export class HealthController {
    @Public()
    @Get()
    check() {
        return { status: 'ok' };
    }
}
