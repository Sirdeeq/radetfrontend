import { Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { BrowserRouter } from "react-router-dom";

import { Box, StyledEngineProvider } from "@mui/material";

import BackgroundWrapper from "@/components/layout/containers/background-wrapper";
import SnackbarWrapper from "@/components/layout/containers/snackbar-wrapper";
import { AuthProvider } from "@/contexts/AuthContext";
import LayoutContextProvider from "@/components/layout/layout-context";
import Loading from "@/pages/loading";
import AppRoutes from "@/routes";
import ThemeProvider from "@/theme/theme-provider";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false },
  },
});

const App = () => {
  const { i18n } = useTranslation();

  return (
    <BrowserRouter>
      <StyledEngineProvider enableCssLayer>
        <Box lang={i18n.language} className="font-mulish font-urbanist relative overflow-hidden antialiased">
          <div id="initial-loader">
            <div className="spinner"></div>
          </div>

          <ThemeProvider>
            <QueryClientProvider client={queryClient}>
              <AuthProvider>
                <LayoutContextProvider>
                <BackgroundWrapper />
                <SnackbarWrapper>
                  <Suspense fallback={<Loading />}>
                    <AppRoutes />
                  </Suspense>
                </SnackbarWrapper>
              </LayoutContextProvider>
            </AuthProvider>
          </QueryClientProvider>
          </ThemeProvider>
        </Box>
      </StyledEngineProvider>
    </BrowserRouter>
  );
};

export default App;
