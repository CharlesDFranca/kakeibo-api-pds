import { LoginUseCase, LogoutUseCase } from '@/identity/app/use-cases/auth';
import { CurrentSessionId } from '@/core/decorators/current-session-id.decorator';
import { Public } from '@/core/decorators/public-route.decorator';
import {
    Controller,
    Post,
    HttpCode,
    HttpStatus,
    Body,
    Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { LoginDto } from '../dto/login.dto';

/**
 * Atributos do cookie de sessão.
 *
 * O front (Vercel) chama a API por um proxy no próprio domínio (`/api/*`), então o
 * cookie é "first-party" e `SameSite=Lax` funciona em Chrome, Safari e Firefox.
 * `COOKIE_SAMESITE=none` só é necessário se o front chamar a API direto, de outro
 * domínio, e nesse caso Safari/Chrome podem bloquear o cookie como de terceiros.
 */
const sessionCookieOptions = () => {
    const configured = (process.env.COOKIE_SAMESITE ?? 'lax').toLowerCase();
    const sameSite = (['lax', 'strict', 'none'] as const).find((v) => v === configured) ?? 'lax';

    return {
        httpOnly: true,
        // SameSite=None exige Secure; em localhost (http) use COOKIE_SECURE=false
        secure: sameSite === 'none' || process.env.COOKIE_SECURE !== 'false',
        sameSite,
        path: '/',
    } as const;
};

@Controller('auth')
export class AuthController {
    constructor(
        private readonly loginUseCase: LoginUseCase,
        private readonly logoutUseCase: LogoutUseCase,
    ) {}

    @Public()
    @Post('login')
    @HttpCode(HttpStatus.OK)
    async login(
        @Body() body: LoginDto,
        @Res({ passthrough: true }) response: Response,
    ): Promise<void> {
        const { sessionId } = await this.loginUseCase.execute({
            email: body.email,
            password: body.password,
        });

        response.cookie('session', sessionId, sessionCookieOptions());
    }

    @Post('logout')
    @HttpCode(HttpStatus.NO_CONTENT)
    async logout(
        @CurrentSessionId() sessionId: string,
        @Res({ passthrough: true }) response: Response,
    ) {
        await this.logoutUseCase.execute({ sessionId });

        // os atributos precisam ser os mesmos do login, senão o navegador pode ignorar a remoção
        response.clearCookie('session', sessionCookieOptions());
    }
}
