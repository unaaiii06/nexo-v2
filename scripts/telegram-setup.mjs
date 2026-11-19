// Conecta tu bot de Telegram con Nexo. Ejecútalo TÚ en la Terminal:
//   npm run telegram:setup
// Te pedirá el token que te dio @BotFather. El token no se guarda en el proyecto:
// va directo a los «secrets» de Supabase y a Telegram.
import { execFileSync } from 'node:child_process';
import { readFile, writeFile, unlink } from 'node:fs/promises';
import { randomBytes } from 'node:crypto';
import { tmpdir } from 'node:os';
import path from 'node:path';
import readline from 'node:readline';
import { fileURLToPath } from 'node:url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const APP_URL = process.env.NEXO_APP_URL || 'https://unaaiii06.github.io/nexo-v2/';

async function readEnv() {
  try {
    const txt = await readFile(path.join(root, '.env.local'), 'utf8');
    return Object.fromEntries(txt.split('\n').filter((l) => l.includes('=') && !l.startsWith('#')).map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1)]));
  } catch {
    return {};
  }
}

function askHidden(question) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    rl._writeToOutput = (s) => {
      if (s.startsWith(question)) rl.output.write(s);
      else rl.output.write('*'.repeat(Math.max(0, s.length - (s.includes('\n') ? 1 : 0))) + (s.includes('\n') ? '\n' : ''));
    };
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function tg(token, method, body) {
  const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body ?? {}),
  });
  return res.json();
}

const env = await readEnv();
const projectUrl = env.VITE_SUPABASE_URL;
if (!projectUrl) {
  console.error('Primero ejecuta: npm run supabase:setup -- https://TU-PROYECTO.supabase.co TU_CLAVE_ANON');
  process.exit(1);
}
const ref = new URL(projectUrl).hostname.split('.')[0];

const token = process.env.TELEGRAM_BOT_TOKEN || (await askHidden('Pega el token de @BotFather y pulsa Enter: '));
if (!/^\d+:[\w-]{30,}$/.test(token)) {
  console.error('✗ Ese token no parece válido (formato 123456789:ABC…).');
  process.exit(1);
}

const me = await tg(token, 'getMe');
if (!me.ok) {
  console.error('✗ Telegram rechaza el token:', me.description);
  process.exit(1);
}
const bot = me.result.username;
console.log(`✓ Bot encontrado: @${bot}`);

// 1) Secretos de las funciones (vía archivo temporal para que el token no quede en el historial)
const secret = randomBytes(24).toString('hex');
const envFile = path.join(tmpdir(), `nexo-secrets-${process.pid}.env`);
await writeFile(envFile, `TELEGRAM_BOT_TOKEN=${token}\nTELEGRAM_WEBHOOK_SECRET=${secret}\nNEXO_APP_URL=${APP_URL}\n`, { mode: 0o600 });
try {
  execFileSync('supabase', ['secrets', 'set', '--project-ref', ref, '--env-file', envFile], { stdio: 'inherit' });
} finally {
  await unlink(envFile).catch(() => {});
}
console.log('✓ Secretos guardados en Supabase');

// 2) Webhook: Telegram enviará los mensajes y botones a la función
const hook = await tg(token, 'setWebhook', {
  url: `${projectUrl}/functions/v1/telegram-webhook`,
  secret_token: secret,
  allowed_updates: ['message', 'callback_query'],
  drop_pending_updates: true,
});
if (!hook.ok) {
  console.error('✗ setWebhook:', hook.description);
  process.exit(1);
}
console.log('✓ Webhook configurado');

// 3) Menú de comandos y descripción del bot
await tg(token, 'setMyCommands', {
  commands: [
    { command: 'hoy', description: 'Tareas de hoy' },
    { command: 'desconectar', description: 'Dejar de recibir avisos' },
  ],
  language_code: 'es',
});
await tg(token, 'setMyDescription', { description: 'Recordatorios de tus tareas de Nexo. Conéctalo desde Nexo → Ajustes → Telegram.' });

// 4) Nombre del bot para la app
env.VITE_TELEGRAM_BOT = bot;
await writeFile(path.join(root, '.env.local'), Object.entries(env).map(([k, v]) => `${k}=${v}`).join('\n') + '\n');
console.log(`✓ .env.local: VITE_TELEGRAM_BOT=${bot}

Último paso (publicar en GitHub con el bot):
  gh variable set VITE_TELEGRAM_BOT --body ${bot}
`);
