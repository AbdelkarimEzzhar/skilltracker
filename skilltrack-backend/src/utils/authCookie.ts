import type { CookieOptions } from 'express';

export const getAuthCookieOptions = (): CookieOptions => {
    const isProduction = process.env.NODE_ENV === 'production';
    const sameSiteEnv = (process.env.COOKIE_SAME_SITE || '').toLowerCase();

    let sameSite: CookieOptions['sameSite'] = isProduction ? 'none' : 'lax';
    if (sameSiteEnv === 'lax' || sameSiteEnv === 'strict' || sameSiteEnv === 'none') {
        sameSite = sameSiteEnv;
    }

    const secure =
        process.env.COOKIE_SECURE === 'true' ||
        (process.env.COOKIE_SECURE !== 'false' && (isProduction || sameSite === 'none'));

    return {
        httpOnly: true,
        secure,
        sameSite,
        maxAge: 7 * 24 * 60 * 60 * 1000,
    };
};
