import { Breadcrumbs, Card, CardContent, Grid, Typography } from "@mui/material";

export default function Page() {
  return (
    <Grid container spacing={5}>
      <Grid size={12}>
        <Typography variant="h1" component="h1" className="mb-0">
          Follow-ups
        </Typography>
        <Breadcrumbs>
          <Typography color="inherit">Home</Typography>
          <Typography variant="body2">Follow-ups</Typography>
        </Breadcrumbs>
      </Grid>

      <Grid size={12}>
        <Card>
          <CardContent>
            <Typography variant="h4" gutterBottom>
              Follow-up management — Coming soon
            </Typography>
            <Typography variant="body1" className="text-text-secondary">
              Follow-ups will be linked to flagged clients.
            </Typography>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}
