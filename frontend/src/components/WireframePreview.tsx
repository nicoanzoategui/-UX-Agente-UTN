import { lazy, Suspense, useState } from 'react';

const HiFiSandpackPreview = lazy(() => import('./HiFiSandpackPreview'));

interface Props {
    content: string;
    type: 'svg' | 'code';
}

export default function WireframePreview({ content, type }: Props) {
    const [hiFiTab, setHiFiTab] = useState<'preview' | 'code'>('preview');

    if (type === 'svg' || content.trim().startsWith('<svg')) {
        const parts = content.split('---DESKTOP---');
        const desktopSvg = parts.length === 2 ? parts[0].trim() : content.trim();
        const mobileSvg = parts.length === 2 ? parts[1].trim() : content.trim();
        return (
            <div className="bg-[#F4F5F7] rounded-[3px] p-6 border border-[#DFE1E6] space-y-6">

                {/* Desktop */}
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <div className="flex gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]" />
                            <div className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E]" />
                            <div className="w-2.5 h-2.5 rounded-full bg-[#28C840]" />
                        </div>
                        <span className="text-[10px] uppercase font-bold text-[#7A869A] tracking-widest">Desktop — 1440px</span>
                    </div>
                    <div className="bg-white border border-[#DFE1E6] rounded-[3px] shadow-sm overflow-auto">
                        <div
                            className="w-full origin-top-left"
                            style={{ minWidth: '1440px', padding: '24px' }}
                            dangerouslySetInnerHTML={{ __html: content }}
                        />
                    </div>
                </div>

                {/* Divider */}
                <div className="border-t border-[#DFE1E6]" />

                {/* Mobile */}
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase font-bold text-[#7A869A] tracking-widest">Mobile — 375px</span>
                    </div>
                    <div className="flex justify-center">
                        <div
                            className="bg-white border border-[#DFE1E6] rounded-[3px] shadow-sm overflow-auto"
                            style={{ width: '375px' }}
                            dangerouslySetInnerHTML={{ __html: content }}
                        />
                    </div>
                </div>

            </div>
        );
    }

    return (
        <div className="space-y-3">
            <div className="flex gap-1 p-1 bg-[#EBECF0] rounded-[3px] w-fit">
                <button
                    type="button"
                    onClick={() => setHiFiTab('preview')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-[3px] transition-colors ${hiFiTab === 'preview'
                        ? 'bg-white text-[#0052CC] shadow-sm'
                        : 'text-[#5E6C84] hover:text-[#172B4D]'
                        }`}
                >
                    Vista previa
                </button>
                <button
                    type="button"
                    onClick={() => setHiFiTab('code')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-[3px] transition-colors ${hiFiTab === 'code'
                        ? 'bg-white text-[#0052CC] shadow-sm'
                        : 'text-[#5E6C84] hover:text-[#172B4D]'
                        }`}
                >
                    Código
                </button>
            </div>

            {hiFiTab === 'preview' ? (
                <Suspense
                    fallback={
                        <div className="flex items-center justify-center min-h-[320px] bg-[#F4F5F7] rounded-[3px] border border-[#DFE1E6] text-sm text-[#5E6C84]">
                            Cargando vista previa interactiva...
                        </div>
                    }
                >
                    <HiFiSandpackPreview code={content} />
                </Suspense>
            ) : (
                <div className="relative group">
                    <button
                        type="button"
                        onClick={() => navigator.clipboard.writeText(content)}
                        className="absolute top-4 right-4 px-3 py-1.5 bg-white border border-[#DFE1E6] hover:bg-[#F4F5F7] rounded-[3px] text-xs font-bold text-[#42526E] z-10 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        Copiar código
                    </button>
                    <div className="bg-[#091E42] rounded-[3px] p-6 overflow-auto max-h-[min(70vh,700px)] border border-[#091E42] shadow-inner">
                        <pre className="text-sm font-mono leading-relaxed">
                            <code className="text-[#EBECF0] whitespace-pre-wrap">{content}</code>
                        </pre>
                    </div>
                </div>
            )}
        </div>
    );
}