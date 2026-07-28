import { Breadcrumbs, Card, CardContent, Grid, Typography } from "@mui/material";

export default function Page() {
  return (
    <Grid container spacing={5}>
      <Grid size={12}>
        <Typography variant="h1" component="h1" className="mb-0">
          KPIs
        </Typography>
        <Breadcrumbs>
          <Typography color="inherit">Home</Typography>
          <Typography variant="body2">KPIs</Typography>
        </Breadcrumbs>
      </Grid>

      <Grid size={12}>
        <Card>
          <CardContent>
            <Typography variant="h4" gutterBottom>
              Key Performance Indicators — Coming soon
            </Typography>
            <Typography variant="body1" className="text-text-secondary">
              KPIs will display programme performance metrics.
            </Typography>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}
