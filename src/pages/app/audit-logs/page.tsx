import { useState } from "react";
import { useAuditLogs } from "@/hooks/useApi";

import {
  Breadcrumbs,
  Button,
  Card,
  CardContent,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import { DataGrid, GridColDef } from "@mui/x-data-grid";

export default function Page() {
  const [filters, setFilters] = useState<Record<string, string>>({});

  const { data: logsData, isLoading } = useAuditLogs(filters);

  const logs = logsData?.data?.logs || [];
  const pagination = logsData?.data?.pagination;

  const columns: GridColDef[] = [
    {
      field: "user",
      headerName: "User",
      flex: 1,
      valueGetter: (v: any) =>
        v ? `${v.firstName || ""} ${v.lastName || ""}`.trim() || v.email : "",
    },
    { field: "action", headerName: "Action", width: 150 },
    { field: "resource", headerName: "Resource", width: 130 },
    { field: "resourceId", headerName: "Resource ID", width: 150 },
    {
      field: "createdAt",
      headerName: "Date",
      width: 160,
      valueGetter: (v: any) =>
        v ? new Date(v).toLocaleString() : "",
    },
    { field: "details", headerName: "Details", flex: 2 },
  ];

  return (
    <Grid container spacing={5}>
      <Grid size={12}>
        <Typography variant="h1" component="h1" className="mb-0">
          Audit Logs
        </Typography>
        <Breadcrumbs>
          <Typography color="inherit">Home</Typography>
          <Typography variant="body2">Audit Logs</Typography>
        </Breadcrumbs>
      </Grid>

      <Grid size={12}>
        <Card>
          <CardContent>
            <div className="flex flex-wrap gap-3 mb-4">
              <FormControl variant="standard" size="small" className="min-w-[150px]">
                <InputLabel>Action</InputLabel>
                <Select
                  value={filters.action || ""}
                  onChange={(e) =>
                    setFilters((f) => ({ ...f, action: e.target.value }))
                  }
                >
                  <MenuItem value="">All</MenuItem>
                  {["create", "update", "delete", "login", "logout", "export"].map(
                    (a) => (
                      <MenuItem key={a} value={a}>
                        {a}
                      </MenuItem>
                    )
                  )}
                </Select>
              </FormControl>

              <FormControl variant="standard" size="small" className="min-w-[150px]">
                <InputLabel>Resource</InputLabel>
                <Select
                  value={filters.resource || ""}
                  onChange={(e) =>
                    setFilters((f) => ({ ...f, resource: e.target.value }))
                  }
                >
                  <MenuItem value="">All</MenuItem>
                  {["client", "flag", "user", "facility", "organization", "upload"].map(
                    (r) => (
                      <MenuItem key={r} value={r}>
                        {r}
                      </MenuItem>
                    )
                  )}
                </Select>
              </FormControl>

              <TextField
                variant="standard"
                size="small"
                label="Date From"
                type="date"
                slotProps={{ inputLabel: { shrink: true } }}
                value={filters.dateFrom || ""}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, dateFrom: e.target.value }))
                }
              />

              <TextField
                variant="standard"
                size="small"
                label="Date To"
                type="date"
                slotProps={{ inputLabel: { shrink: true } }}
                value={filters.dateTo || ""}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, dateTo: e.target.value }))
                }
              />

              <Button variant="text" onClick={() => setFilters({})}>
                Clear Filters
              </Button>
            </div>

            <div style={{ width: "100%" }}>
              <DataGrid
                rows={logs}
                columns={columns}
                loading={isLoading}
                rowCount={pagination?.total || 0}
                paginationMode="server"
                paginationModel={{
                  page: (pagination?.page || 1) - 1,
                  pageSize: pagination?.limit || 25,
                }}
                onPaginationModelChange={(model) =>
                  setFilters((f) => ({
                    ...f,
                    page: String(model.page + 1),
                    limit: String(model.pageSize),
                  }))
                }
                pageSizeOptions={[10, 25, 50]}
                disableRowSelectionOnClick
                autoHeight
                getRowId={(row) => row._id}
                sx={{ "& .MuiDataGrid-cell": { py: 1 } }}
              />
            </div>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}
