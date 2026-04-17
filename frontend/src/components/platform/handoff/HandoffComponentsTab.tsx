import { useState } from 'react';
import { useToast } from '../../../context/ToastContext';

function CompCard({ title, source, usage }: { title: string; source: string; usage: string }) {
    return (
        <div className="bg-gray-50 rounded p-3 border border-gray-200">
            <p className="font-medium text-sm text-gray-900">{title}</p>
            <p className="text-xs text-gray-600">{source}</p>
            <p className="text-xs text-gray-700 mt-2 whitespace-pre-wrap">{usage}</p>
        </div>
    );
}

function shortLabel(s: string, max: number): string {
    const t = s.replace(/\s+/g, ' ').trim();
    if (t.length <= max) return t;
    return `${t.slice(0, max - 1)}…`;
}

export default function HandoffComponentsTab({
    howItSolves,
    opportunities,
    tsxMuiScreens,
    flowStepLabels,
}: {
    howItSolves: string[];
    opportunities: string[];
    tsxMuiScreens?: string[] | null;
    /** Etiquetas del flujo por pantalla (misma cantidad que TSX cuando aplica). */
    flowStepLabels?: string[] | null;
}) {
    const toast = useToast();
    const [tab, setTab] = useState(0);
    const tsx = tsxMuiScreens?.filter(Boolean) ?? [];
    const nTsx = tsx.length;

    async function copyCurrent() {
        const code = tsx[tab];
        if (!code) return;
        try {
            await navigator.clipboard.writeText(code);
            toast('Código TSX copiado.', 'success');
        } catch {
            toast('No se pudo copiar.', 'error');
        }
    }

    if (nTsx > 0) {
        const safe = Math.min(tab, nTsx - 1);
        const labels = flowStepLabels ?? [];
        return (
            <div className="doc-content p-6 max-h-[640px] overflow-y-auto bg-white">
                <h3 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b-2 border-purple-600">
                    Código TSX (MUI v5)
                </h3>
                <p className="text-gray-600 mb-4 text-sm">
                    Componentes generados por pantalla. Revisá imports y dependencias antes de integrar en tu app.
                </p>
                <div className="flex flex-wrap gap-2 mb-3 items-center">
                    {tsx.map((_, i) => (
                        <button
                            key={i}
                            type="button"
                            onClick={() => setTab(i)}
                            className={`px-3 py-1.5 text-sm font-medium rounded max-w-[220px] truncate ${
                                safe === i
                                    ? 'bg-white text-purple-600 border border-purple-600'
                                    : 'text-gray-600 hover:bg-gray-100 border border-transparent'
                            }`}
                            title={labels[i] ?? `Pantalla ${i + 1}`}
                        >
                            {labels[i] ? shortLabel(labels[i], 22) : `Pantalla ${i + 1}`}
                        </button>
                    ))}
                    <button
                        type="button"
                        onClick={() => void copyCurrent()}
                        className="ml-auto px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 ux-focus shrink-0"
                    >
                        Copiar código pantalla {safe + 1}
                    </button>
                </div>
                <pre className="text-xs bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto max-h-[420px] overflow-y-auto whitespace-pre-wrap">
                    {tsx[safe]}
                </pre>
            </div>
        );
    }

    const fromSolution = howItSolves.map((t, i) => ({
        title: `Patrón de producto ${i + 1}`,
        source: 'Cómo resuelve la solución elegida',
        usage: t.replace(/^•\s*/, ''),
    }));
    const fromAnalysis = opportunities.slice(0, 8).map((t, i) => ({
        title: `Oportunidad ${i + 1}`,
        source: 'Análisis de contexto',
        usage: t.replace(/^•\s*/, ''),
    }));
    const items = [...fromSolution, ...fromAnalysis];

    return (
        <div className="doc-content p-6 max-h-[600px] overflow-y-auto bg-white">
            <h3 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b-2 border-purple-600">
                Patrones y piezas sugeridas
            </h3>
            <p className="text-gray-600 mb-6">
                Derivado del análisis y de la solución documentada. Si generaste código TSX en otro flujo, aparecerá aquí;
                si no, usá la pestaña Pantallas para los HTML de prototipado.
            </p>

            {items.length === 0 ? (
                <p className="text-sm text-gray-600">No hay datos suficientes. Revisá que el análisis y la ideación estén completos.</p>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {items.map((it, i) => (
                        <CompCard key={`${it.title}-${i}`} title={it.title} source={it.source} usage={it.usage} />
                    ))}
                </div>
            )}
        </div>
    );
}
