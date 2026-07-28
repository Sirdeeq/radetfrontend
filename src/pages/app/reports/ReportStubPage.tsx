import { Link } from "react-router-dom";
import { Breadcrumbs, Typography, Card, CardContent, Grid } from "@mui/material";

type ReportPageProps = {
  title: string;
  description: string;
};

export default function ReportStubPage({ title, description }: ReportPageProps) {
  return (
    <Grid container spacing={5}>
      <Grid size={12}>
        <Typography variant="h1" component="h1" className="mb-0">{title}</Typography>
        <Breadcrumbs>
          <Link color="inherit" to="/dashboards/default">Home</Link>
          <Link color="inherit" to="/reports">Reports</Link>
          <Typography variant="body2">{title}</Typography>
        </Breadcrumbs>
      </Grid>
      <Grid size={12}>
        <Card>
          <CardContent>
            <Typography variant="body1" className="text-text-secondary">
              {description}
            </Typography>
            <Typography variant="body2" className="text-text-secondary mt-2">
              Data for this report type will appear here after uploading {title.replace(/ /g, " ").toLowerCase()} data via the
              {" "}<Link to="/reports/upload" className="text-primary">Upload</Link> page.
            </Typography>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}
