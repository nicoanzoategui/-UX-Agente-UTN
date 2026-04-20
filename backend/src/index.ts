import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { assertProductionAuthConfig, config, corsAllowedOrigins } from './config/env.js';
import { initDatabase, queryOne } from './db/database.js';
import { apiRateLimit } from './middleware/api-rate-limit.js';
import agentRoutes from './routes/agent.routes.js';
import authRoutes from './routes/auth.routes.js';
import cardsRoutes from './routes/cards.routes.js';
import figmaBuildRoutes from './routes/figma-build.routes.js';

assertProductionAuthConfig();

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkgPath = join(__dirname, '..', 'package.json');
const SERVICE_VERSION =
    (JSON.parse(readFileSync(pkgPath, 'utf-8')) as { version?: string }).version ?? '0.0.0';

const app = express();

/** Railway (y otros reverse proxy) terminan TLS; sin esto `req.ip` y rate limit pueden fallar. */
const trustProxy =
    config.TRUST_PROXY || Boolean(process.env.RAILWAY_ENVIRONMENT || process.env.FLY_APP_NAME);
if (trustProxy) {
    app.set('trust proxy', 1);
}

const allowedOrigins = corsAllowedOrigins();

const corsExposedHeaders = [
    'Content-Disposition',
    'Retry-After',
    'X-RateLimit-Limit',
    'X-RateLimit-Remaining',
    'X-RateLimit-Reset',
] as const;

/**
 * En desarrollo Vite puede tomar 5174, 5175, etc. si el puerto default está ocupado;
 * un `FRONTEND_URL` fijo a :5173 hace fallar el fetch (el navegador lo muestra como red/CORS).
 */
function devLocalhostOrigin(origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void): void {
    if (!origin) {
        callback(null, true);
        return;
    }
    if (allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
    }
    try {
        const u = new URL(origin);
        const okHost = u.hostname === 'localhost' || u.hostname === '127.0.0.1';
        const okProto = u.protocol === 'http:' || u.protocol === 'https:';
        if (okHost && okProto) {
            callback(null, true);
            return;
        }
    } catch {
        /* URL inválida */
    }
    callback(new Error('Not allowed by CORS'));
}

/**
 * Producción: lista explícita + dominios Figma (el plugin a veces envía `https://figma.com` sin `www`,
 * u orígenes sandboxed como la cadena literal `null`). Sin `Access-Control-Allow-Origin` el fetch del * plugin falla con "Failed to fetch" aunque el servidor responda 200.
 */
function productionCorsOrigin(origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void): void {
    if (!origin) {
        callback(null, true);
        return;
    }
    if (allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
    }
    if (origin === 'null') {
        callback(null, true);
        return;
    }
    try {
        const { hostname, protocol } = new URL(origin);
        if (protocol !== 'https:' && protocol !== 'http:') {
            callback(new Error('Not allowed by CORS'));
            return;
        }
        if (hostname === 'figma.com' || hostname.endsWith('.figma.com')) {
            callback(null, true);
            return;
        }
        /** PaaS (new-feats): front y API son subdominios hermanos; si FRONTEND_URL no coincide al pie de la letra, el fetch falla sin CORS. */
        if (protocol === 'https:' && hostname.endsWith('.new-feats.redtecnologica.org')) {
            callback(null, true);
            return;
        }
    } catch {
        /* URL inválida */
    }
    callback(new Error('Not allowed by CORS'));
}

app.use(
    cors({
        origin: config.NODE_ENV === 'production' ? productionCorsOrigin : devLocalhostOrigin,
        credentials: true,
        exposedHeaders: [...corsExposedHeaders],
    })
);
app.use(cookieParser());
app.use(express.json({ limit: '32mb' }));

app.use('/api', apiRateLimit);

app.use('/api/auth', authRoutes);
app.use('/api/cards', cardsRoutes);
app.use('/api', figmaBuildRoutes);
app.use('/api', agentRoutes);

/** 200 siempre si el proceso responde (ALB/AWS exige 200–399; 503 marca el target unhealthy). */
app.get('/health', async (_req, res) => {
    const timestamp = new Date().toISOString();
    const base = {
        service: 'framework-ux-backend',
        version: SERVICE_VERSION,
        timestamp,
    };
    try {
        await queryOne('SELECT 1 as ok');
        res.json({ status: 'ok', database: 'ok', ...base });
    } catch {
        res.status(200).json({ status: 'degraded', database: 'error', ...base });
    }
});

async function start() {
    try {
        await initDatabase();

        const server = app.listen(Number(config.PORT), '0.0.0.0', () => {
            console.log(`✓ Framework UX backend on 0.0.0.0:${config.PORT}`);
        });

        const shutdown = (signal: string) => {
            console.log(`\n${signal} recibido, cerrando servidor…`);
            server.close(() => {
                console.log('Servidor HTTP cerrado');
                process.exit(0);
            });
            setTimeout(() => {
                console.error('Timeout al cerrar; saliendo');
                process.exit(1);
            }, 10_000).unref();
        };

        process.on('SIGINT', () => shutdown('SIGINT'));
        process.on('SIGTERM', () => shutdown('SIGTERM'));
    } catch (error) {
        console.error('Failed to start:', error);
        process.exit(1);
    }
}

start();
