import { Controller, Get, Logger } from '@nestjs/common';
import { Public } from './core/decorators/public-route.decorator';

@Controller('health')
export class HealthController {
    private readonly logger = new Logger(HealthController.name);

    @Public()
    @Get()
    check() {
        this.logger.log('Keep-alive ping recebido do GitHub Actions');
        return { status: 'ok' };
    }
}
