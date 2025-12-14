import { Hono } from "hono";
import { getAgentByName } from 'agents';
import { ChatAgent } from './agent';
import { API_RESPONSES } from './config';
import { Env, getAppController, registerSession, unregisterSession } from "./core-utils";
/**
 * DO NOT MODIFY THIS FUNCTION. Only for your reference.
 */
export function coreRoutes(app: Hono<{ Bindings: Env }>) {
    // Use this API for conversations. **DO NOT MODIFY**
    app.all('/api/chat/:sessionId/*', async (c) => {
        try {
        const sessionId = c.req.param('sessionId');
        // FIX: Cast to `any` to prevent TS2589: Type instantiation is excessively deep and possibly infinite.
        const agent = await getAgentByName(c.env.CHAT_AGENT as any, sessionId) as any;
        const url = new URL(c.req.url);
        url.pathname = url.pathname.replace(`/api/chat/${sessionId}`, '');
        const request = new Request(url.toString(), {
            method: c.req.method,
            headers: c.req.header(),
            body: c.req.method === 'GET' || c.req.method === 'DELETE' ? undefined : c.req.raw.body
        });
        return agent.fetch(request);
        } catch (error) {
        console.error('Agent routing error:', error);
        return c.json({
            success: false,
            error: API_RESPONSES.AGENT_ROUTING_FAILED
        }, { status: 500 });
        }
    });
}
export function userRoutes(app: Hono<{ Bindings: Env }>) {
    // SuiteWaste OS Routes
    app.get('/api/sync/pull', async (c) => {
        const controller = getAppController(c.env);
        const transactions = await controller.getTransactions();
        return c.json({ documents: transactions, last_pulled_rev: new Date().getTime() });
    });
    app.post('/api/sync/push', async (c) => {
        try {
            const newDocs = await c.req.json<any[]>();
            if (!Array.isArray(newDocs)) return c.json({ success: false, error: 'Invalid payload' }, { status: 400 });
            const controller = getAppController(c.env);
            await controller.pushTransactions(newDocs);
            return c.json({ success: true, message: "Push received" });
        } catch (error) {
            console.error('Failed to process sync push:', error);
            return c.json({ success: false, error: 'Failed to process push' }, { status: 500 });
        }
    });
    app.get('/api/sync/audits', async (c) => {
        const controller = getAppController(c.env);
        const audits = await controller.getAudits();
        return c.json({ documents: audits, last_pulled_rev: new Date().getTime() });
    });
    app.post('/api/sync/audits', async (c) => {
        try {
            const newDocs = await c.req.json<any[]>();
            if (!Array.isArray(newDocs)) return c.json({ success: false, error: 'Invalid payload' }, { status: 400 });
            const controller = getAppController(c.env);
            await controller.pushAudits(newDocs);
            return c.json({ success: true, message: "Audit push received" });
        } catch (error) {
            console.error('Failed to process audit sync push:', error);
            return c.json({ success: false, error: 'Failed to process audit push' }, { status: 500 });
        }
    });
    // --- Auth Routes ---
    app.post('/api/auth/login', async (c) => {
        try {
            const body = await c.req.json();
            const controller = getAppController(c.env);
            const result = await controller.authLogin(body);
            if (result.token) {
                return c.json(result);
            }
            return c.json({ success: false, error: 'Invalid credentials' }, { status: 401 });
        } catch (error) {
            console.error('Login error:', error);
            return c.json({ success: false, error: 'Internal server error' }, { status: 500 });
        }
    });
    app.get('/api/auth/validate', async (c) => {
        try {
            const authHeader = c.req.header('Authorization');
            const token = authHeader?.split(' ')[1];
            if (!token) {
                return c.json({ valid: false }, { status: 401 });
            }
            const controller = getAppController(c.env);
            const result = await controller.validateJWT(token);
            if (result.valid) {
                return c.json(result);
            }
            return c.json({ valid: false }, { status: 401 });
        } catch (error) {
            console.error('Token validation error:', error);
            return c.json({ valid: false }, { status: 500 });
        }
    });
    // --- Existing Chat Session Routes ---
    app.get('/api/sessions', async (c) => {
        try {
            const controller = getAppController(c.env);
            const sessions = await controller.listSessions();
            return c.json({ success: true, data: sessions });
        } catch (error) {
            console.error('Failed to list sessions:', error);
            return c.json({ success: false, error: 'Failed to retrieve sessions' }, { status: 500 });
        }
    });
    app.post('/api/sessions', async (c) => {
        try {
            const body = await c.req.json().catch(() => ({}));
            const { title, sessionId: providedSessionId } = body;
            const sessionId = providedSessionId || crypto.randomUUID();
            await registerSession(c.env, sessionId, title);
            return c.json({ success: true, data: { sessionId, title } });
        } catch (error) {
            console.error('Failed to create session:', error);
            return c.json({ success: false, error: 'Failed to create session' }, { status: 500 });
        }
    });
    app.delete('/api/sessions/:sessionId', async (c) => {
        try {
            const sessionId = c.req.param('sessionId');
            const deleted = await unregisterSession(c.env, sessionId);
            if (!deleted) return c.json({ success: false, error: 'Session not found' }, { status: 404 });
            return c.json({ success: true, data: { deleted: true } });
        } catch (error) {
            console.error('Failed to delete session:', error);
            return c.json({ success: false, error: 'Failed to delete session' }, { status: 500 });
        }
    });
}