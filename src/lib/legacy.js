// Lectura de los datos de Nexo 1 guardados en ESTE navegador (mismo dominio).
// Funciona en el Mac (Safari/Chrome). En el iPhone, cada app de la pantalla de inicio
// tiene su propio almacenamiento, así que allí se usa Exportar (v1) → Importar (v2).

export function listV1Profiles() {
  try {
    const reg = JSON.parse(localStorage.getItem('nexo:profiles') || 'null');
    if (!reg?.profiles?.length) return [];
    return reg.profiles
      .map((p) => {
        const raw = localStorage.getItem(`nexo:v1:${p.id}`);
        if (!raw) return null;
        const data = JSON.parse(raw);
        return { id: p.id, name: p.name, tasks: Array.isArray(data.tasks) ? data.tasks.length : 0, data };
      })
      .filter(Boolean);
  } catch {
    return [];
  }
}
