import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import '@/components/pwa/install'; // catch the install prompt as early as possible
import { AppProviders } from '@/app/providers';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AppProviders />
  </StrictMode>
);
