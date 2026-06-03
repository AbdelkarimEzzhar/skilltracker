interface DeepSeekMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

interface DeepSeekOptions {
    temperature?: number;
    maxTokens?: number;
}

interface DeepSeekChatResponse {
    choices?: Array<{
        message?: {
            content?: string;
        };
    }>;
}

export class DeepSeekApiError extends Error {
    status: number;
    apiCode?: string;

    constructor(message: string, status: number, apiCode?: string) {
        super(message);
        this.name = 'DeepSeekApiError';
        this.status = status;
        this.apiCode = apiCode;
    }
}

type AIProvider = 'groq' | 'deepseek';

interface ProviderSettings {
    apiKey?: string;
    baseURL: string;
    model: string;
    name: string;
}

const getAIProvider = (): AIProvider =>
    (process.env.AI_PROVIDER || 'groq').toLowerCase() === 'deepseek' ? 'deepseek' : 'groq';

const getProviderSettings = (provider: AIProvider): ProviderSettings => {
    if (provider === 'deepseek') {
        return {
            apiKey: process.env.DEEPSEEK_API_KEY,
            baseURL: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com',
            model: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
            name: 'DeepSeek',
        };
    }

    return {
        apiKey: process.env.GROQ_API_KEY,
        baseURL: process.env.GROQ_BASE_URL || 'https://api.groq.com/openai/v1',
        model: process.env.GROQ_MODEL || 'llama-3.1-8b-instant',
        name: 'Groq',
    };
};

const getActiveProvider = (): ProviderSettings => getProviderSettings(getAIProvider());

export const isDeepSeekEnabled = (): boolean => Boolean(getActiveProvider().apiKey?.trim());
export const getActiveAIProvider = (): string => getActiveProvider().name;

export const callDeepSeekChat = async (
    messages: DeepSeekMessage[],
    options: DeepSeekOptions = {}
): Promise<string> => {
    const provider = getActiveProvider();
    const apiKey = provider.apiKey?.trim();

    if (!apiKey) {
        throw new Error(`${provider.name.toUpperCase()} API key is not configured`);
    }

    const response = await fetch(`${provider.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model: provider.model,
            messages,
            temperature: options.temperature ?? 0.4,
            max_tokens: options.maxTokens ?? 700,
        }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        let apiCode: string | undefined;
        let message = `${provider.name} API error (${response.status})`;

        try {
            const parsed = JSON.parse(errorText) as {
                error?: { message?: string; code?: string };
            };
            apiCode = parsed?.error?.code;
            if (parsed?.error?.message) {
                message = `${provider.name} API error (${response.status}): ${parsed.error.message}`;
            } else {
                message = `${provider.name} API error (${response.status}): ${errorText}`;
            }
        } catch (_error) {
            message = `${provider.name} API error (${response.status}): ${errorText}`;
        }

        throw new DeepSeekApiError(message, response.status, apiCode);
    }

    const data = (await response.json()) as DeepSeekChatResponse;
    const content = data?.choices?.[0]?.message?.content?.trim();
    if (!content) {
        throw new Error(`${provider.name} returned an empty response`);
    }

    return content;
};

export const isDeepSeekBillingError = (error: unknown): boolean => {
    if (!(error instanceof DeepSeekApiError)) return false;
    if (error.status === 402 || error.status === 429) return true;
    const code = (error.apiCode || '').toLowerCase();
    return code.includes('insufficient') || code.includes('quota');
};
