import React from "react";
import { Link, Navigate, Route, Routes } from "react-router-dom";

import { Box, Button, Paper, Typography } from "@mui/material";

import ProtectedRoute from "@/components/ProtectedRoute";
import { DEFAULTS } from "@/config";
import { leftMenuBottomItems, leftMenuItems } from "@/menu-items";
import AppLayout from "@/pages/app/layout";
import AuthLayout from "@/pages/auth/layout";
import Loading from "@/pages/loading.tsx";
import NotFound from "@/pages/not-found";
import { MenuItem } from "@/types/types";

// Statically import all possible pages for build
const modules = import.meta.glob("./pages/**/page.tsx");

// Lazy load page components
const lazyLoad = (path: string) => {
  let key: string;
  if (path === "/") {
    key = "./pages/page.tsx";
  } else if (path.startsWith("/auth")) {
    key = `./pages/auth${path.substring(5)}/page.tsx`;
  } else {
    key = `./pages/app${path}/page.tsx`;
  }

  const importer = modules[key];
  if (!importer) return <Navigate to="/404" replace />;

  const Component = React.lazy(importer as () => Promise<{ default: React.ComponentType<any> }>);
  return (
    <React.Suspense fallback={<Loading />}>
      <Component />
    </React.Suspense>
  );
};

// Recursively generate routes from menu items
const generateRoutesFromMenuItems = (menuItems: MenuItem[]): React.ReactElement[] => {
  return menuItems.flatMap((item: MenuItem) => {
    const routes: React.ReactElement[] = [];
    if (item.isExternalLink || !item.href) return [];

    routes.push(<Route key={item.id} path={item.href} element={lazyLoad(item.href)} />);
    if (item.children && item.children.length > 0) {
      routes.push(...generateRoutesFromMenuItems(item.children));
    }
    return routes;
  });
};

const generateAuthRoutes = (): React.ReactElement[] => {
  return [
    <Route key="sign-in" path="sign-in" element={lazyLoad("/auth/sign-in")} />,
    <Route key="sign-up" path="sign-up" element={lazyLoad("/auth/sign-up")} />,
    <Route key="password-reset" path="password-reset" element={lazyLoad("/auth/password-reset")} />,
    <Route key="password-sent" path="password-sent" element={lazyLoad("/auth/password-sent")} />,
    <Route key="password-new" path="password-new" element={lazyLoad("/auth/password-new")} />,
    <Route key="get-verification" path="get-verification" element={lazyLoad("/auth/get-verification")} />,
    <Route key="set-verification" path="set-verification" element={lazyLoad("/auth/set-verification")} />,
    <Route key="terms-and-conditions" path="terms-and-conditions" element={lazyLoad("/auth/terms-and-conditions")} />,
    <Route key="privacy-policy" path="privacy-policy" element={lazyLoad("/auth/privacy-policy")} />,
  ];
};

const mainRoutes = generateRoutesFromMenuItems(leftMenuItems);
const bottomRoutes = generateRoutesFromMenuItems(leftMenuBottomItems);
const authRoutes = generateAuthRoutes();

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={lazyLoad("/")} />
      <Route path="/unauthorized" element={
        <Box className="flex min-h-screen items-center justify-center">
          <Paper elevation={2} className="p-8 text-center">
            <Typography variant="h4" className="mb-2">Unauthorized</Typography>
            <Typography variant="body1" className="text-text-secondary mb-4">You don't have permission to access this page.</Typography>
            <Button variant="contained" component={Link} to={DEFAULTS.appRoot}>Go to Dashboard</Button>
          </Paper>
        </Box>
      } />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          {mainRoutes}
          {bottomRoutes}
        </Route>
      </Route>
      <Route path="/auth" element={<AuthLayout />}>
        <Route index element={<Navigate to="/auth/sign-in" replace />} />
        {authRoutes}
      </Route>
      <Route path="/404" element={<NotFound />} />
      <Route path="*" element={<Navigate to="/404" replace />} />
    </Routes>
  );
};

export default AppRoutes;
