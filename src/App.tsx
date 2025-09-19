import { AppShell } from '@mantine/core';
import { ErrorBoundary, useMedplum } from '@medplum/react';
import { BaseClient, ClientFactory, LAUNCH } from '@TopologyHealth/smarterfhir';
import { Dispatch, ReactNode, SetStateAction, Suspense, createContext, useContext, useEffect, useRef, useState } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { Footer } from './components/Footer';
import { Header } from './components/Header';
import { Loading } from './components/Loading';
import { LandingPage } from './pages/landing';
import { RegisterPage } from './pages/RegisterPage';
import { SignInPage } from './pages/SignInPage';
import { Router } from './Router';

// New AuthConfigContext
type AuthConfig = {
  authorizeEndpoint: string;
  tokenEndpoint: string;
  clientId: string;
  scopes: string;
  useSmartConfig: boolean;
};

type AuthConfigContextType = {
  authConfig: AuthConfig;
  setAuthConfig: Dispatch<SetStateAction<AuthConfig>>;
};

const AuthConfigContext = createContext<AuthConfigContextType | undefined>(undefined);


export const AuthConfigProvider = ({ children }: { children: ReactNode }) => {
  const [authConfig, setAuthConfig] = useState<AuthConfig>(() => {
    if (typeof window !== 'undefined') {
      const authorizeEndpoint = sessionStorage.getItem('authorizeEndpoint') || '';
      const tokenEndpoint = sessionStorage.getItem('tokenEndpoint') || '';
      const clientId = sessionStorage.getItem('clientId') || '';
      const scopes = sessionStorage.getItem('scopes') || '';
      const useSmartConfig = sessionStorage.getItem('useSmartConfig') === 'true';
      return { authorizeEndpoint, tokenEndpoint, clientId, scopes, useSmartConfig };
    }
    console.log("Warning: window is undefined, could not load auth config from session storage");
    return { authorizeEndpoint: '', tokenEndpoint: '', clientId: '', scopes: '', useSmartConfig: false };
  });

  useEffect(() => {
    sessionStorage.setItem('authorizeEndpoint', authConfig.authorizeEndpoint);
    sessionStorage.setItem('tokenEndpoint', authConfig.tokenEndpoint);
    sessionStorage.setItem('clientId', authConfig.clientId);
    sessionStorage.setItem('scopes', authConfig.scopes);
    sessionStorage.setItem('useSmartConfig', authConfig.useSmartConfig.toString());
  }, [authConfig]);

  // Set defaults
  // useEffect(() => {
  //   if (!authConfig.clientId) {
  //     setAuthConfig(prev => ({ ...prev, clientId: process.env.NEXT_PUBLIC_DEFAULT_CLIENT_ID ?? 'sample_id' }));
  //   }
  //   if (!authConfig.scopes) {
  //     setAuthConfig(prev => ({ ...prev, scopes: process.env.NEXT_PUBLIC_DEFAULT_SCOPES ?? 'openid' }));
  //   }
  // }, []);

  return (
    <AuthConfigContext.Provider value={{ authConfig, setAuthConfig }}>
      {children}
    </AuthConfigContext.Provider>
  );
};

export const SmartClientContext = createContext<any>(null);

export const useSmartClient = () => useContext<{ smartClient: BaseClient | undefined, setSmartClient: Dispatch<SetStateAction<BaseClient | undefined>> }>(SmartClientContext);

export async function mySmartClientInstantiator() {
  try {
    const clientFactory = new ClientFactory();
    return clientFactory.createEMRClient(LAUNCH.STANDALONE)
      .then(client => {
        return client;
      })
  } catch (error) {
    console.error("Error creating Smart Client:", error);
  }
}

export const SmartClientProvider = ({ children }: { children: ReactNode }) => {
  const [smartClient, setSmartClient] = useState<BaseClient | undefined>(undefined)
  const smartClientAttempted = useRef(false)

  useEffect(() => {
    // if (typeof window !== 'undefined') {
    //   return;
    // }
    if (smartClientAttempted.current) return;
    smartClientAttempted.current = true;
    mySmartClientInstantiator().then(smartClient => {
      if (smartClient instanceof BaseClient) {
        setSmartClient(smartClient)
      }
      if (!smartClient) console.log('no smart client was found')
    })
  }, [])

  return (
    <SmartClientContext.Provider value={{ smartClient, setSmartClient }}>
      {children}
    </SmartClientContext.Provider>
  );
};


export function App(): JSX.Element | null {
  const location = useLocation();
  const medplum = useMedplum();
  const [client, setClient] = useState<BaseClient | null>(null);

  if (medplum.isLoading()) {
    return null;
  }

  if (!medplum.getProfile()) {
    return (
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="signin" element={<SignInPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="*" element={<Navigate replace to="/" />} />
      </Routes>
    );
  }

  return (

    <AuthConfigProvider>
      <SmartClientProvider>
        <AppShell padding={0} fixed={true} header={<Header />} footer={<Footer />}>
          <ErrorBoundary key={location.pathname}>
            <Suspense fallback={<Loading />}>
              <Router />
            </Suspense>
          </ErrorBoundary>
        </AppShell>
      </SmartClientProvider>
    </AuthConfigProvider>
  );
}

