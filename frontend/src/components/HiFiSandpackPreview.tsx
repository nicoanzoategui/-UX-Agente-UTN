import {
    SandpackCodeEditor,
    SandpackLayout,
    SandpackPreview,
    SandpackProvider,
} from '@codesandbox/sandpack-react';

function prepareAppTsx(raw: string): string {
    const t = raw.trim();
    if (!t) {
        return `import React from "react";
export default function App() {
  return <div style={{ padding: 32, color: '#666' }}>Sin código UI generado.</div>;
}`;
    }
    if (/export\s+default\s+function\s+App\b/.test(t)) return t;

    const namedDefault = t.match(/export\s+default\s+function\s+(\w+)\s*\(/);
    if (namedDefault) {
        const comp = namedDefault[1];
        const body = t.replace(
            new RegExp(`export\\s+default\\s+function\\s+${comp}\\b`),
            `function ${comp}`
        );
        return `${body}\n\nexport default function App() {\n  return <${comp} />;\n}\n`;
    }
    return t;
}

type Props = { code: string };

export default function HiFiSandpackPreview({ code }: Props) {
    const appCode = prepareAppTsx(code);

    return (
        <div className="hi-fi-sandpack rounded-[3px] overflow-hidden border border-[#DFE1E6] bg-white">
            <SandpackProvider
                template="react-ts"
                theme="light"
                files={{
                    '/App.tsx': appCode,
                    '/index.tsx': `import React from "react";
import { createRoot } from "react-dom/client";
import { ThemeProvider, createTheme, CssBaseline } from "@mui/material";
import App from "./App";

const theme = createTheme();
const root = createRoot(document.getElementById("root")!);
root.render(
  <ThemeProvider theme={theme}>
    <CssBaseline />
    <App />
  </ThemeProvider>
);`,
                }}
                customSetup={{
                    dependencies: {
                        '@mui/material': '^5.15.0',
                        '@mui/icons-material': '^5.15.0',
                        '@emotion/react': '^11.11.0',
                        '@emotion/styled': '^11.11.0',
                        '@mui/x-data-grid': '^6.20.0',
                    },
                }}
                options={{ initMode: 'immediate' }}
            >
                <SandpackLayout>
                    <SandpackPreview
                        showOpenInCodeSandbox={false}
                        showRefreshButton
                        style={{ minHeight: 'min(62vh, 600px)', height: '100%' }}
                    />
                    <SandpackCodeEditor
                        showTabs={false}
                        showLineNumbers={false}
                        style={{ minHeight: 160, maxHeight: 220 }}
                    />
                </SandpackLayout>
            </SandpackProvider>
        </div>
    );
}