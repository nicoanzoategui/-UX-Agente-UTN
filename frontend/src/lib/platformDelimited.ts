/** Parsea bloques ---SCREEN_N--- o ---TSX_N--- devueltos por el backend. */
export function splitPlatformDelimitedBlocks(raw: string, kind: 'SCREEN' | 'TSX'): string[] {
    const re = new RegExp(`---${kind}_(\\d+)---`, 'gi');
    const parts = raw.trim().split(re);
    const blocks: string[] = [];
    for (let i = 2; i < parts.length; i += 2) {
        const chunk = parts[i]?.trim();
        if (chunk) blocks.push(chunk);
    }
    return blocks;
}
