import { GoogleGenerativeAI } from '@google/generative-ai';
import type { EnhancedGenerateContentResponse } from '@google/generative-ai';
import { config } from '../config/env.js';
import { SYSTEM_PROMPT, getPromptForLevel } from '../prompts/system-prompt.js';

const genAI = new GoogleGenerativeAI(config.GEMINI_API_KEY || '');

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

function parseRetryAfterSeconds(message: string): number | null {
    const m = message.match(/retry\s+in\s+([\d.]+)\s*s/i);
    if (m) return Math.ceil(parseFloat(m[1]));
    return null;
}

function isRateLimitError(message: string): boolean {
    return (
        message.includes('429') ||
        /too\s+many\s+requests/i.test(message) ||
        /resource_exhausted/i.test(message) ||
        /quota exceeded/i.test(message)
    );
}

function looksLikeQuotaHardStop(message: string): boolean {
    return (
        /limit:\s*0\b/i.test(message) &&
        (/free_tier|GenerateRequestsPerDay|PerDay/i.test(message) || /quota exceeded/i.test(message))
    );
}

function extractGeminiText(response: EnhancedGenerateContentResponse, modelId: string): string {
    const feedback = response.promptFeedback;
    if (feedback?.blockReason) {
        throw new Error(`Gemini bloqueó el prompt (${modelId}): blockReason=${feedback.blockReason}`);
    }
    const candidates = response.candidates;
    if (!candidates?.length) {
        throw new Error(`Gemini no devolvió candidatos (${modelId}). promptFeedback=${JSON.stringify(feedback ?? null)}`);
    }
    const finish = candidates[0]?.finishReason;
    if (finish && finish !== 'STOP' && finish !== 'MAX_TOKENS') {
        console.warn(`Gemini finishReason=${finish} (model=${modelId})`);
    }
    try {
        return response.text();
    } catch (e: unknown) {
        const hint = (e as Error)?.message || String(e);
        throw new Error(`Gemini no entregó texto (${modelId}): ${hint}. finishReason=${finish ?? 'n/a'}`);
    }
}

export interface DesignMeta {
    layout: string;
    components: string[];
    decisions: string[];
    states: Record<string, boolean>;
}

export interface DesignResult {
    content: string;
    meta?: DesignMeta;
}

export async function generateDesign(
    userStory: string,
    level: 1 | 2 | 3,
    feedback?: string,
    previousDesign?: string
): Promise<DesignResult> {
    const key = config.GEMINI_API_KEY?.trim();
    if (!key) throw new Error('GEMINI_API_KEY no está definida o está vacía.');

    const modelId = config.GEMINI_MODEL;
    const model = genAI.getGenerativeModel({
        model: modelId,
        generationConfig: { temperature: 0.7, maxOutputTokens: 8192 }
    });

    const prompt = getPromptForLevel(level, userStory, feedback, previousDesign);
    const history = [
        { role: 'user' as const, parts: [{ text: SYSTEM_PROMPT }] },
        { role: 'model' as const, parts: [{ text: 'Entendido. Estoy listo para generar diseños UX/UI siguiendo todas las reglas y principios establecidos.' }] },
    ];

    const maxAttempts = 4;
    let lastMsg = '';

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        const chat = model.startChat({ history });
        try {
            const result = await chat.sendMessage(prompt);
            const raw = extractGeminiText(result.response, modelId);
            return extractDesignContent(raw, level);
        } catch (e: unknown) {
            lastMsg = (e as Error)?.message || String(e);
            const hint =
                `Fallo la llamada a Gemini (${modelId}): ${lastMsg}\n\n` +
                `Si ves 429 o cuota: probá GEMINI_MODEL=gemini-2.5-flash en backend/.env.`;

            if (!isRateLimitError(lastMsg) || attempt === maxAttempts) throw new Error(hint);
            if (looksLikeQuotaHardStop(lastMsg)) throw new Error(`${hint}\n\nCuota agotada.`);

            const sec = parseRetryAfterSeconds(lastMsg) ?? 55;
            const waitMs = Math.min(Math.max(sec * 1000, 3000), 120_000);
            console.warn(`Gemini rate limit, intento ${attempt}/${maxAttempts}, esperando ${Math.round(waitMs / 1000)}s…`);
            await sleep(waitMs);
        }
    }

    throw new Error(`Gemini: agotados los reintentos (${modelId}). Último error: ${lastMsg}`);
}

function extractDesignContent(response: string, level: number): DesignResult {
    if (level === 3) {
        const codeMatch = response.match(/```(?:tsx?|jsx?|typescript|javascript)?\n([\s\S]*?)```/);
        const content = codeMatch
            ? codeMatch[1].trim()
            : (response.match(/((?:export\s+)?(?:default\s+)?function\s+\w+[\s\S]*)/))?.[1]?.trim() ?? response;

        let meta: DesignMeta | undefined;
        const jsonMatch = response.match(/```json\n([\s\S]*?)```/);
        if (jsonMatch) {
            try {
                meta = JSON.parse(jsonMatch[1].trim());
            } catch {
                console.warn('No se pudo parsear el bloque JSON de metadatos');
            }
        }

        return { content, meta };
    } else {
        const svgMatch = response.match(/<svg[\s\S]*?<\/svg>/);
        if (svgMatch) return { content: svgMatch[0] };

        const codeMatch = response.match(/```(?:svg|xml)?\n([\s\S]*?)```/);
        if (codeMatch) return { content: codeMatch[1].trim() };

        return { content: response };
    }
}