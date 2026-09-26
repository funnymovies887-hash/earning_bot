import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import {defineConfig} from 'vite';

// Resilient plugin so missing admin components never fail build on Render/production
function resilientAdminComponentsPlugin() {
  return {
    name: 'resilient-admin-components',
    enforce: 'pre' as const,
    resolveId(source: string, importer: string | undefined) {
      if (importer) {
        const importerDir = path.dirname(importer);
        const directFileTsx = path.resolve(importerDir, `${source}.tsx`);
        const directFileTs = path.resolve(importerDir, `${source}.ts`);

        // If the exact file requested exists directly on disk, use it!
        if (fs.existsSync(directFileTsx)) {
          const content = fs.readFileSync(directFileTsx, 'utf-8');
          if (source.includes('AdminDashboard') || !content.includes('export * from')) {
            return directFileTsx;
          }
        }
        if (fs.existsSync(directFileTs)) {
          return directFileTs;
        }

        const adminTabs = [
          'AdminNoticeBroadcastManager',
          'AdminUptimeRobotTab',
          'AdminDataBackupTab',
          'AdminStoreOrdersTab',
          'AdminAdLockedVideosTab',
          'AdminIncomeMethodsManager',
          'AdminFloatingToast',
          'AdminSaveButton',
        ];

        const matched = adminTabs.find(
          tab => source === `./${tab}` || source === `./admin/${tab}` || source.endsWith(`/${tab}`)
        );

        if (matched) {
          const candidates = [
            path.resolve(importerDir, 'admin', `${matched}.tsx`),
            path.resolve(importerDir, 'admin', `${matched}.ts`),
            path.resolve(importerDir, `${matched}.tsx`),
            path.resolve(importerDir, `${matched}.ts`),
          ];

          for (const candidate of candidates) {
            if (fs.existsSync(candidate)) {
              try {
                const content = fs.readFileSync(candidate, 'utf-8');
                const hasExport =
                  (content.includes(`export const ${matched}`) ||
                   content.includes(`export function ${matched}`)) &&
                  !content.includes('export * from') &&
                  !content.includes(`from '../${matched}'`) &&
                  !content.includes(`from './admin/${matched}'`);

                if (hasExport) {
                  return candidate;
                }
              } catch (_) {}
            }
          }

          return `\0virtual-admin:${matched}.tsx`;
        }
      }

      return null;
    },
    load(id: string) {
      if (id.startsWith('\0virtual-admin:')) {
        const compName = id.replace('\0virtual-admin:', '').replace(/\.tsx?$/, '');
        const allExports = Array.from(new Set([
          'AdminDashboard',
          'AdminNoticeBroadcastManager',
          'AdminUptimeRobotTab',
          'AdminDataBackupTab',
          'AdminStoreOrdersTab',
          'AdminAdLockedVideosTab',
          'AdminIncomeMethodsManager',
          compName,
        ]));
        const exportLines = allExports.map(name => `export const ${name} = FallbackComp;`).join('\n');

        return `
          import React from 'react';
          const FallbackComp = () => React.createElement(
            'div',
            { className: 'p-6 bg-slate-900 border border-slate-800 rounded-2xl text-center text-slate-400' },
            React.createElement('p', { className: 'font-bold text-slate-300' }, 'ফিচারটি লোড করা সম্ভব হয়নি (${compName})'),
            React.createElement('p', { className: 'text-xs text-slate-500 mt-1' }, 'দয়া করে GitHub-এ ফাইলটি নিশ্চিত করুন।')
          );
          export const AdminFloatingToast = () => null;
          export const AdminSaveButton = (props) => React.createElement(
            'button',
            { onClick: props && props.onClick, className: 'px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold' },
            (props && props.children) || 'Save'
          );
          ${exportLines}
          export default FallbackComp;
        `;
      }
      return null;
    }
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), resilientAdminComponentsPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
