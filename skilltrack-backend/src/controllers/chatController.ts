import { Request, Response } from 'express';
import {
    callDeepSeekChat,
    getActiveAIProvider,
    isDeepSeekBillingError,
    isDeepSeekEnabled,
} from '../services/deepseekService';

export type ChatMode = 'basic' | 'groq';

export interface ChatHistoryMessage {
    role: 'user' | 'assistant';
    content: string;
}

interface ChatRequestBody {
    message?: string;
    mode?: ChatMode;
    history?: ChatHistoryMessage[];
}

interface CareerTrack {
    keywords: string[];
    response: string;
}

const careerTracks: Record<string, CareerTrack> = {
    cloud: {
        keywords: ['cloud', 'cloud engineer', 'aws', 'azure', 'gcp', 'devops', 'sre'],
        response:
            'Great goal. For a Cloud/DevOps path, focus on Linux + networking fundamentals, one cloud provider (AWS/Azure/GCP), Docker, Kubernetes, CI/CD, and infrastructure as code (Terraform). Start by earning one associate cloud cert and building 2 portfolio projects (deploy app + monitoring stack).',
    },
    data: {
        keywords: ['data engineer', 'data scientist', 'data analyst', 'machine learning', 'ai engineer', 'ml engineer'],
        response:
            'Excellent choice. For a Data/AI path, build strong Python + SQL first, then statistics, data pipelines, and ML basics. Practice with end-to-end projects (clean data, model, dashboard, deploy). A strong roadmap is: SQL + Pandas -> visualization -> ML -> MLOps/deployment.',
    },
    software: {
        keywords: ['software engineer', 'backend', 'frontend', 'full stack', 'web developer', 'mobile developer'],
        response:
            'Nice target. For Software Engineering, choose one core stack and master fundamentals: algorithms, APIs, databases, testing, Git, and system design basics. Build 3 real projects with authentication, CRUD, and deployment, then document them in your portfolio.',
    },
    cybersecurity: {
        keywords: ['cybersecurity', 'security engineer', 'soc analyst', 'pentester', 'ethical hacker'],
        response:
            'Great direction. For Cybersecurity, focus on networking, Linux, security foundations, threat analysis, and secure coding. Start with labs (CTF, OWASP, SIEM basics), then pick a track: blue team (defense) or red team (offense).',
    },
    product: {
        keywords: ['product manager', 'project manager', 'scrum master', 'business analyst'],
        response:
            'Great path. For Product/Project roles, strengthen problem framing, user research, prioritization, analytics, and communication. Build case studies from real features: define KPI, propose roadmap, and measure outcomes.',
    },
};

const detectCareerTrack = (message: string): CareerTrack | null => {
    const lowerCaseMessage = message.toLowerCase();
    const tracks = Object.values(careerTracks);

    for (const track of tracks) {
        if (track.keywords.some((keyword) => lowerCaseMessage.includes(keyword))) {
            return track;
        }
    }

    return null;
};

const extractDesiredCareer = (message: string): string | null => {
    const patterns = [
        /(?:want to become|i want to become|become|career goal is|my goal is|i want to be)\s+(?:a|an)?\s*([a-zA-Z\s/-]{3,40})/i,
        /(?:je veux devenir|devenir)\s+(?:un|une)?\s*([a-zA-Z\s/-]{3,40})/i,
    ];

    for (const pattern of patterns) {
        const match = message.match(pattern);
        const career = match?.[1]?.trim();
        if (career) {
            return career;
        }
    }

    return null;
};

const MAX_HISTORY_MESSAGES = 20;

const normalizeHistory = (history: unknown): ChatHistoryMessage[] => {
    if (!Array.isArray(history)) return [];

    return history
        .filter(
            (item): item is ChatHistoryMessage =>
                Boolean(item) &&
                typeof item === 'object' &&
                (item.role === 'user' || item.role === 'assistant') &&
                typeof item.content === 'string' &&
                item.content.trim().length > 0
        )
        .map((item) => ({
            role: item.role,
            content: item.content.trim(),
        }))
        .slice(-MAX_HISTORY_MESSAGES);
};

const buildContextText = (message: string, history: ChatHistoryMessage[]): string => {
    const recentUserMessages = history
        .filter((item) => item.role === 'user')
        .slice(-3)
        .map((item) => item.content);

    return [...recentUserMessages, message].join('\n');
};

const getChatbotResponse = (message: string, history: ChatHistoryMessage[] = []): string => {
    const contextText = buildContextText(message, history);
    const lowerCaseMessage = message.toLowerCase();
    const lowerContext = contextText.toLowerCase();
    const detectedTrack = detectCareerTrack(contextText) || detectCareerTrack(message);
    const desiredCareer = extractDesiredCareer(message) || extractDesiredCareer(contextText);

    if (detectedTrack) {
        return detectedTrack.response;
    }

    const hasPriorUserMessages = history.some((item) => item.role === 'user');

    if (
        !hasPriorUserMessages &&
        (lowerCaseMessage.includes('hello') || lowerCaseMessage.includes('hi'))
    ) {
        return 'Hello there! How can I assist you with your career path today?';
    }
    if (
        lowerCaseMessage.includes('deepseek') ||
        lowerCaseMessage.includes('groq') ||
        lowerCaseMessage.includes('are you ai') ||
        lowerCaseMessage.includes('which model') ||
        lowerCaseMessage.includes('what model')
    ) {
        const provider = getActiveAIProvider();
        return `I can run with ${provider} when API credit is available. Right now I am using local fallback guidance mode, but I can still help you with a concrete career roadmap.`;
    }
    if (lowerCaseMessage.includes('recommend') || lowerContext.includes('recommend')) {
        const contextualTrack = detectCareerTrack(contextText);
        if (hasPriorUserMessages && contextualTrack) {
            return `${contextualTrack.response}\n\nBased on our conversation, I can also help you turn this into weekly milestones on your SkillTrack roadmap.`;
        }
        return 'I can help with that. To give you the best recommendations, could you tell me about your current skills and career goals?';
    }
    if (lowerCaseMessage.includes('roadmap')) {
        return 'You can view your personalized career roadmap on the "My Roadmap" page. It is generated based on your goals.';
    }
    if (lowerCaseMessage.includes('skill')) {
        return 'You can manage your skills on the "My Skills" page. Adding your skills helps me give you better recommendations.';
    }
    if (desiredCareer) {
        return `Awesome target: ${desiredCareer}. I suggest a 3-step plan: (1) identify the top 6 required skills for this role, (2) build 2 practical portfolio projects, and (3) set a 12-week roadmap with weekly milestones. If you want, I can help you build that roadmap now.`;
    }
    if (lowerCaseMessage.includes('bye')) {
        return 'Goodbye! Feel free to reach out if you have more questions.';
    }

    return "I'm sorry, I'm not sure how to answer that yet. I am still in training. Try asking me about recommendations, your roadmap, or your skills.";
};

const normalizeChatMode = (mode: unknown): ChatMode =>
    mode === 'groq' ? 'groq' : 'basic';

const buildGroqMessages = (message: string, history: ChatHistoryMessage[]) => {
    const systemMessage = {
        role: 'system' as const,
        content:
            'You are SkillTrack AI career coach. Give concise, practical answers for students, with actionable steps and concrete skills/resources. Remember context from earlier messages in this conversation.',
    };

    const historyMessages = history.map((item) => ({
        role: item.role,
        content: item.content,
    }));

    return [...[systemMessage], ...historyMessages, { role: 'user' as const, content: message }];
};

export const handleChatMessage = async (req: Request<{}, {}, ChatRequestBody>, res: Response) => {
    const message = req.body?.message?.trim();
    const mode = normalizeChatMode(req.body?.mode);
    const history = normalizeHistory(req.body?.history);

    if (!message) {
        return res.status(400).json({ error: 'Message is required' });
    }

    if (mode === 'basic') {
        const reply = getChatbotResponse(message, history);
        return res.status(200).json({ reply, source: 'fallback', mode });
    }

    if (!isDeepSeekEnabled()) {
        const provider = getActiveAIProvider();
        return res.status(200).json({
            reply: `${provider} mode is not configured. Add your API key on the server, or switch to Basic mode for local career guidance.`,
            source: 'fallback',
            mode,
            reason: 'provider_not_configured',
        });
    }

    try {
        const provider = getActiveAIProvider();
        const aiReply = await callDeepSeekChat(buildGroqMessages(message, history), {
            temperature: 0.5,
            maxTokens: 550,
        });

        return res.status(200).json({ reply: aiReply, source: provider.toLowerCase(), mode });
    } catch (error) {
        if (isDeepSeekBillingError(error)) {
            const provider = getActiveAIProvider();
            console.warn(`Chatbot Groq mode unavailable: ${provider} billing/credit issue.`);
            return res.status(200).json({
                reply: `${provider} is unavailable (API credit or quota). Switch to Basic mode or try again later.\n\n${getChatbotResponse(message, history)}`,
                source: 'fallback',
                mode,
                reason: 'provider_billing',
            });
        }

        console.error('Chatbot error:', error);
        return res.status(200).json({
            reply: `Groq mode failed. Switch to Basic mode or try again.\n\n${getChatbotResponse(message, history)}`,
            source: 'fallback',
            mode,
            reason: 'provider_error',
        });
    }
};
