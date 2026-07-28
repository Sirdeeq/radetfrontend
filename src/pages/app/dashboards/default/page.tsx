import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useDashboard, useFlagCounts } from "@/hooks/useApi";
import { hasPermission } from "@/lib/permissions";

import {
  Breadcrumbs,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  LinearProgress,
  Typography,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";

const PRIORITY_COLORS: Record<string, "error" | "warning" | "info" | "success" | "default"> = {
  critical: "error",
  high: "warning",
  medium: "info",
  low: "success",
  info: "default",
};

export default function Page() {
  const { user } = useAuth();
  const canViewDataQuality = hasPermission(user, "flags:read:data_quality");
  const { data: dashboardData, isLoading } = useDashboard();
  const { data: counterData } = useFlagCounts();

  const data = dashboardData?.data;
  const counters = counterData?.data;

  const userName = user ? `${user.firstName}` : "User";

  return (
    <Grid container spacing={5}>
      <Grid size={12}>
        <Typography variant="h1" component="h1" className="mb-0">
          Welcome {userName}!
        </Typography>
        <Breadcrumbs>
          <Link color="inherit" to="/dashboards/default">Home</Link>
          <Typography variant="body2">Dashboard</Typography>
        </Breadcrumbs>
      </Grid>

      <Grid size={12}>
        {isLoading && <LinearProgress />}
      </Grid>

      <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
        <Card>
          <CardContent>
            <Typography variant="body2" className="text-text-secondary mb-1">Open Flags</Typography>
            <Typography variant="h3">{counters?.totalOpen ?? data?.openFlags ?? 0}</Typography>
            <Link to="/flags" className="text-primary text-sm font-semibold">View all</Link>
          </CardContent>
        </Card>
      </Grid>
      <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
        <Card>
          <CardContent>
            <Typography variant="body2" className="text-text-secondary mb-1">Total Clients</Typography>
            <Typography variant="h3">{data?.totalClients ?? 0}</Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
        <Card>
          <CardContent>
            <Typography variant="body2" className="text-text-secondary mb-1">Active Flags</Typography>
            <Typography variant="h3">{data?.totalFlags ?? 0}</Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
        <Card>
          <CardContent>
            <Typography variant="body2" className="text-text-secondary mb-1">Recent Imports</Typography>
            <Typography variant="h3">{data?.recentImports?.length ?? 0}</Typography>
          </CardContent>
        </Card>
      </Grid>

      {counters?.priorityCounts && (
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" className="mb-3">Flags by Priority</Typography>
              <div className="flex flex-wrap gap-2">
                {Object.entries(counters.priorityCounts).map(([priority, count]) => (
                  <Chip
                    key={priority}
                    label={`${priority}: ${count}`}
                    color={PRIORITY_COLORS[priority] || "default"}
                    variant="outlined"
                  />
                ))}
                {Object.keys(counters.priorityCounts).length === 0 && (
                  <Typography variant="body2" className="text-text-secondary">No open flags</Typography>
                )}
              </div>
            </CardContent>
          </Card>
        </Grid>
      )}

      {counters?.reportTypeCounts && (
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" className="mb-3">Flags by Report Type</Typography>
              <div className="flex flex-wrap gap-2">
                {Object.entries(counters.reportTypeCounts)
                  .filter(([type]) => canViewDataQuality || type !== "data_quality")
                  .map(([type, count]) => (
                  <Chip
                    key={type}
                    label={`${type.replace(/_/g, " ")}: ${count}`}
                    variant="outlined"
                    size="small"
                  />
                ))}
                {Object.keys(counters.reportTypeCounts).length === 0 && (
                  <Typography variant="body2" className="text-text-secondary">No flags</Typography>
                )}
              </div>
            </CardContent>
          </Card>
        </Grid>
      )}

      {data?.recentImports && data.recentImports.length > 0 && (
        <Grid size={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" className="mb-3">Recent Imports</Typography>
              <div style={{ width: "100%" }}>
                <DataGrid
                  rows={data.recentImports}
                  columns={[
                    { field: "fileName", headerName: "File", flex: 1 },
                    { field: "reportType", headerName: "Report Type", flex: 1, valueGetter: (v: any) => String(v).replace(/_/g, " ") },
                    { field: "imported", headerName: "Imported", width: 90 },
                    { field: "flagsGenerated", headerName: "Flags", width: 80 },
                    { field: "errors", headerName: "Errors", width: 80 },
                    { field: "status", headerName: "Status", width: 100 },
                  ]}
                  pageSizeOptions={[5, 10, 25]}
                  initialState={{ pagination: { paginationModel: { pageSize: 5 } } }}
                  disableRowSelectionOnClick
                  autoHeight
                  getRowId={(row) => row._id}
                />
              </div>
            </CardContent>
          </Card>
        </Grid>
      )}

      <Grid size={12} className="flex gap-2">
        <Button variant="contained" component={Link} to="/reports/upload">
          Upload Report
        </Button>
        <Button variant="outlined" component={Link} to="/flags">
          View Flags
        </Button>
      </Grid>
    </Grid>
  );
}
