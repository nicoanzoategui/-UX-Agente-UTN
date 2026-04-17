import { useState } from 'react';
import type { PrototypeScreenSpec } from '../../../lib/workflowSession';

type ScreenRow = { index: number; title: string; objective: string; interaction: string };

function buildRows(
    prototypeScreens: PrototypeScreenSpec[] | undefined | null,
    flowSteps: string[]
): ScreenRow[] {
    if (prototypeScreens && prototypeScreens.length === 6) {
        return prototypeScreens.map((s, i) => ({
            index: i + 1,
            title: s.title || `Pantalla ${i + 1}`,
            objective: s.subtitle || 'Pantalla lógica del flujo para esta iniciativa.',
            interaction: [s.note, ...(s.bullets || []).map((b) => `• ${b}`)].filter(Boolean).join('\n') || 'Ver detalle en user flow y en contenido.',
        }));
    }
    const steps = flowSteps.length
        ? flowSteps
        : ['Definir paso 1', 'Definir paso 2', 'Definir paso 3', 'Definir paso 4', 'Definir paso 5', 'Definir paso 6'];
    const out: ScreenRow[] = [];
    for (let i = 0; i < 6; i++) {
        const text = steps[i] ?? `Paso ${i + 1} (completar en diseño)`;
        out.push({
            index: i + 1,
            title: `Pantalla ${i + 1}`,
            objective: text,
            interaction: `El usuario avanza en el flujo según este paso: ${text}`,
        });
    }
    return out;
}

export default function HandoffScreensTab({
    prototypeScreens,
    flowSteps,
    flowStepLabels,
    hifiWireframesHtml,
}: {
    prototypeScreens?: PrototypeScreenSpec[] | null;
    flowSteps: string[];
    /** Subtítulo opcional por pantalla (misma longitud que wireframes HiFi). */
    flowStepLabels?: string[] | null;
    hifiWireframesHtml?: string[] | null;
}) {
    const [carousel, setCarousel] = useState(0);
    const hifi = hifiWireframesHtml?.filter(Boolean) ?? [];
    const n = hifi.length;

    if (n > 0) {
        const safe = Math.min(carousel, n - 1);
        const stepTitle = flowStepLabels?.[safe]?.trim();
        return (
            <div className="doc-content p-6 max-h-[640px] overflow-y-auto bg-white">
                <h3 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b-2 border-purple-600">
                    Prototipado
                </h3>
                <p className="text-gray-600 mb-4 text-sm">
                    Vista previa HTML (desktop) generada en el paso «Prototipado» (Tailwind CDN).
                </p>
                {stepTitle ? (
                    <p className="text-sm font-medium text-gray-800 mb-2" title={stepTitle}>
                        Paso: {stepTitle}
                    </p>
                ) : null}
                <div className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                    <div className="p-3 max-h-[520px] overflow-y-auto">
                        <iframe
                            title={`Prototipo ${safe + 1}`}
                            className="w-full min-h-[480px] bg-white border border-gray-200 rounded"
                            srcDoc={hifi[safe]}
                            sandbox="allow-scripts allow-same-origin"
                        />
                    </div>
                    <div className="bg-gray-800 text-white px-4 py-3 flex items-center justify-between">
                        <span className="text-sm">
                            Pantalla <span className="font-semibold">{safe + 1}</span> de {n}
                        </span>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => setCarousel((c) => Math.max(0, c - 1))}
                                className="px-3 py-1.5 bg-gray-700 rounded hover:bg-gray-600 text-sm ux-focus"
                            >
                                ← Anterior
                            </button>
                            <button
                                type="button"
                                onClick={() => setCarousel((c) => Math.min(n - 1, c + 1))}
                                className="px-3 py-1.5 bg-gray-700 rounded hover:bg-gray-600 text-sm ux-focus"
                            >
                                Siguiente →
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const rows = buildRows(prototypeScreens, flowSteps);

    return (
        <div className="doc-content p-6 max-h-[600px] overflow-y-auto bg-white">
            <h3 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b-2 border-purple-600">Listado de pantallas</h3>
            <p className="text-gray-600 mb-6">
                Mapa de pantallas lógicas (derivado del análisis y la solución). Generá wireframes HiFi en el flujo para ver previews
                aquí.
            </p>

            <div className="space-y-6">
                {rows.map((row, i) => (
                    <div
                        key={row.index}
                        className={`border-2 rounded-lg p-5 ${i === 0 ? 'border-purple-200 bg-purple-50' : 'border-gray-200'}`}
                    >
                        <div className="flex items-start justify-between mb-3">
                            <div>
                                <h4 className="text-lg font-bold text-gray-900">
                                    Pantalla {row.index}: {row.title}
                                </h4>
                            </div>
                            {i === 0 ? (
                                <span className="px-3 py-1 bg-purple-600 text-white rounded-full text-xs font-medium">
                                    Punto de entrada
                                </span>
                            ) : (
                                <span className="px-3 py-1 bg-gray-200 text-gray-700 rounded-full text-xs font-medium">
                                    Paso {row.index}
                                </span>
                            )}
                        </div>
                        <div className="space-y-3 text-sm">
                            <div>
                                <p className="font-semibold text-gray-900">Objetivo en el flujo</p>
                                <p className="text-gray-700 whitespace-pre-wrap">{row.objective}</p>
                            </div>
                            <div>
                                <p className="font-semibold text-gray-900">Interacción / notas</p>
                                <p className="text-gray-700 whitespace-pre-wrap">{row.interaction}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
