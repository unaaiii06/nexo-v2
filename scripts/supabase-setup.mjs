// Configura la conexión con Supabase.
// Uso:  npm run supabase:setup -- https://TU-PROYECTO.supabase.co TU_CLAVE_ANON
//  · Escribe .env.local (para npm run dev / build en tu Mac)
//  · Genera supabase/cron.generated.sql con la URL ya puesta
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const [url, key] = process.argv.slice(2);

if (!url || !key || !/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/.test(url)) {
  console.error('Uso: npm run supabase:setup -- https://TU-PROYECTO.supabase.co TU_CLAVE_ANON');
  process.exit(1);
}
const projectUrl = url.replace(/\/$/, '');

export async function readEnv() {
  try {
    const txt = await readFile(path.join(root, '.env.local'), 'utf8');
    return Object.fromEntries(txt.split('\n').filter((l) => l.includes('=') && !l.startsWith('#')).map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1)]));
  } catch {
    return {};
  }
}

const env = await readEnv();
env.VITE_SUPABASE_URL = projectUrl;
env.VITE_SUPABASE_ANON_KEY = key;
await writeFile(path.join(root, '.env.local'), Object.entries(env).map(([k, v]) => `${k}=${v}`).join('\n') + '\n');

const cron = await readFile(path.join(root, 'supabase/cron.sql'), 'utf8');
await writeFile(path.join(root, 'supabase/cron.generated.sql'), cron.replaceAll('__PROJECT_URL__', projectUrl));

const ref = new URL(projectUrl).hostname.split('.')[0];
console.log(`✓ .env.local actualizado
✓ supabase/cron.generated.sql listo

Siguientes pasos:
  1. Supabase → SQL Editor: pega y ejecuta supabase/setup.sql
  2. supabase login            (una vez)
  3. supabase functions deploy --project-ref ${ref}
  4. Supabase → SQL Editor: pega y ejecuta supabase/cron.generated.sql
  5. npm run telegram:setup`);
