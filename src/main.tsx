import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from '@/app/App';
import { ErrorBoundary } from '@/app/ErrorBoundary';
import { ProgressProvider } from '@/modules/progress/ProgressProvider';
import { registerPwa } from '@/modules/pwa/registerPwa';
import { registerHardwareBack } from '@/modules/native/hardwareBack';
import '@/styles/fonts.css';
import '@/styles/tokens.css';
import '@/styles/base.css';

const container = document.getElementById('root');

if (!container) {
  throw new Error('No se encontró el elemento #root.');
}

createRoot(container).render(
  <StrictMode>
    <ErrorBoundary>
      <ProgressProvider>
        <App />
      </ProgressProvider>
    </ErrorBoundary>
  </StrictMode>,
);

registerPwa();
void registerHardwareBack();
