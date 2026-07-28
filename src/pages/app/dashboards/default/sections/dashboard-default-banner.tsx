import { Box, Card, CardContent, Typography } from "@mui/material";

export default function DashboardDefaultBanner() {
  return (
    <Card>
      <CardContent>
        <Box className="flex flex-col items-start gap-2">
          <Typography variant="h4" component="h4" className="card-title">
            Welcome to RADET
          </Typography>
          <Typography variant="body1" component="p" className="text-text-secondary">
            Report and track issues across your applications. Use the sidebar to navigate to reports, clients, and flags.
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}
