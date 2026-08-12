import { NextRequest, NextResponse } from 'next/server';
import { isbeService } from '@/infrastructure/isbe/IsbeServiceImpl';

// Sencillo limitador por IP en memoria (reinicia con el proceso)
type Bucket = { count: number; resetAt: number };
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minuto
const RATE_LIMIT_MAX = 20; // 20 req/min por IP
const ipBuckets = new Map<string, Bucket>();

function getClientIp(req: NextRequest): string {
  const xff = req.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0].trim();
  const realIp = req.headers.get('x-real-ip');
  if (realIp) return realIp.trim();
  try {
    return (req as any).ip || 'unknown';
  } catch {
    return 'unknown';
  }
}

function checkRateLimit(ip: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const bucket = ipBuckets.get(ip);
  if (!bucket || now > bucket.resetAt) {
    ipBuckets.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true };
  }
  if (bucket.count < RATE_LIMIT_MAX) {
    bucket.count += 1;
    return { allowed: true };
  }
  return { allowed: false, retryAfter: Math.ceil((bucket.resetAt - now) / 1000) };
}

const HASH_RE = /^0x[0-9a-fA-F]{64}$/;

// Proxy público del hash timestamp de ISBE: la API de ISBE requiere el
// IBS_TOKEN de la organización (secreto de servidor), así que el cliente
// nunca la llama directamente — pasa siempre por aquí, igual que
// /api/checker/[statusId] hace de proxy del checker de Ethereum.
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ hash: string }> }
) {
  const ip = getClientIp(req);
  const rl = checkRateLimit(ip);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Demasiadas solicitudes. Inténtalo de nuevo en unos segundos.' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfter || 60) } }
    );
  }

  const { hash } = await params;
  if (!hash || !HASH_RE.test(hash)) {
    return NextResponse.json({ error: 'Hash inválido' }, { status: 400 });
  }

  try {
    const result = await isbeService.getHashStatus(hash);
    return NextResponse.json({ hash, exists: result.exists, timestamp: result.timestamp });
  } catch (err) {
    console.error('Error consultando estado ISBE:', err);
    return NextResponse.json({ error: 'No se pudo consultar el estado en ISBE' }, { status: 502 });
  }
}
