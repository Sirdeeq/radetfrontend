import { useState } from "react";
import { useFlags, useFlagCounts, useUpdateFlagStatus } from "@/hooks/useApi";
import { useAuth } from "@/contexts/AuthContext";
import { hasPermission } from "@/lib/permissions";
import { useSnackbar } from "notistack";

import {
  Breadcrumbs,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import { DataGrid, GridColDef } from "@mui/x-data-grid";

const PRIORITY_COLORS: Record<string, "error" | "warning" | "info" | "success" | "default"> = {
  critical: "error",
  high: "warning",
  medium: "info",
  low: "success",
  info: "default",
};

const STATUS_OPTIONS = ["Open", "Assigned", "In Progress", "Resolved", "Closed", "Escalated"];

const REPORT_TYPES = ["art_refill", "next_refill", "iit", "viral_load", "eac", "tpt", "tb_screening", "biometric", "cervical_cancer", "dsd", "data_quality"];

export default function Page() {
  const { user } = useAuth();
  const canViewDataQuality = hasPermission(user, "flags:read:data_quality");

  const [filters, setFilters] = useState<Record<string, string>>({});
  const [selectedFlag, setSelectedFlag] = useState<any>(null);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [statusNote, setStatusNote] = useState("");

  const effectiveFilters = canViewDataQuality ? filters : { ...filters, excludeType: "data_quality" };
  const { data: flagsData, isLoading } = useFlags(effectiveFilters);
  const { data: counterData } = useFlagCounts();
  const updateStatus = useUpdateFlagStatus();
  const { enqueueSnackbar } = useSnackbar();

  const flags = (flagsData?.data?.flags || []).filter((f: any) => canViewDataQuality || f.reportType !== "data_quality");
  const pagination = flagsData?.data?.pagination;
  const counters = counterData?.data;

  const handleStatusChange = () => {
    if (!selectedFlag || !newStatus) return;
    updateStatus.mutate(
      { id: selectedFlag._id, status: newStatus, note: statusNote },
      {
        onSuccess: () => {
          enqueueSnackbar("Flag status updated", { variant: "success" });
          setStatusDialogOpen(false);
          setSelectedFlag(null);
          setNewStatus("");
          setStatusNote("");
        },
        onError: (err: any) => {
          enqueueSnackbar(err.message || "Failed to update", { variant: "error" });
        },
      }
    );
  };

  const columns: GridColDef[] = [
    {
      field: "priority",
      headerName: "Priority",
      width: 100,
      renderCell: (params) => (
        <Chip
          label={params.value}
          color={PRIORITY_COLORS[params.value] || "default"}
          size="small"
        />
      ),
    },
    {
      field: "ruleCode",
      headerName: "Flag",
      flex: 1,
      valueGetter: (v: any) => String(v).replace(/_/g, " "),
    },
    {
      field: "client",
      headerName: "Client",
      flex: 1,
      valueGetter: (v: any) => v ? `${v.firstName || ""} ${v.lastName || ""}`.trim() || v.patientId || v.hospitalNumber : "",
    },
    { field: "reportType", headerName: "Report Type", width: 130, valueGetter: (v: any) => String(v).replace(/_/g, " ") },
    { field: "status", headerName: "Status", width: 120 },
    {
      field: "reason",
      headerName: "Reason",
      flex: 2,
    },
    {
      field: "createdAt",
      headerName: "Date",
      width: 120,
      valueGetter: (v: any) => v ? new Date(v).toLocaleDateString() : "",
    },
    {
      field: "actions",
      headerName: "",
      width: 120,
      renderCell: (params) => (
        <div className="flex gap-1">
          <Button
            size="small"
            variant="outlined"
            onClick={() => {
              setSelectedFlag(params.row);
              setNewStatus(params.row.status);
              setStatusDialogOpen(true);
            }}
          >
            Update
          </Button>
        </div>
      ),
    },
  ];

  return (
    <Grid container spacing={5}>
      <Grid size={12}>
        <Typography variant="h1" component="h1" className="mb-0">
          Flags
        </Typography>
        <Breadcrumbs>
          <Typography color="inherit">Home</Typography>
          <Typography variant="body2">Flags</Typography>
        </Breadcrumbs>
      </Grid>

      {counters && (
        <>
          <Grid size={{ xs: 6, sm: 3, lg: 2 }}>
            <Card className="text-center">
              <CardContent>
                <Typography variant="h4">{counters.totalOpen}</Typography>
                <Typography variant="body2" className="text-text-secondary">Total Open</Typography>
              </CardContent>
            </Card>
          </Grid>
          {Object.entries(counters.priorityCounts || {}).map(([priority, count]) => (
            <Grid key={priority} size={{ xs: 6, sm: 3, lg: 2 }}>
              <Card className="text-center">
                <CardContent>
                  <Typography variant="h4">{count as number}</Typography>
                  <Typography variant="body2" className="text-text-secondary capitalize">{priority}</Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </>
      )}

      <Grid size={12}>
        <Card>
          <CardContent>
            <div className="flex flex-wrap gap-3 mb-4">
              <FormControl variant="standard" size="small" className="min-w-[150px]">
                <InputLabel>Report Type</InputLabel>
                <Select
                  value={filters.reportType || ""}
                  onChange={(e) => setFilters((f) => ({ ...f, reportType: e.target.value }))}
                >
                  <MenuItem value="">All</MenuItem>
                  {REPORT_TYPES.filter((rt) => canViewDataQuality || rt !== "data_quality").map((rt) => (
                    <MenuItem key={rt} value={rt}>{rt.replace(/_/g, " ")}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl variant="standard" size="small" className="min-w-[120px]">
                <InputLabel>Priority</InputLabel>
                <Select
                  value={filters.priority || ""}
                  onChange={(e) => setFilters((f) => ({ ...f, priority: e.target.value }))}
                >
                  <MenuItem value="">All</MenuItem>
                  {["critical", "high", "medium", "low", "info"].map((p) => (
                    <MenuItem key={p} value={p}>{p}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl variant="standard" size="small" className="min-w-[120px]">
                <InputLabel>Status</InputLabel>
                <Select
                  value={filters.status || ""}
                  onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
                >
                  <MenuItem value="">Open</MenuItem>
                  {STATUS_OPTIONS.map((s) => (
                    <MenuItem key={s} value={s}>{s}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              {canViewDataQuality && (
                <Chip
                  label="Data Quality"
                  color="primary"
                  variant={filters.reportType === "data_quality" ? "filled" : "outlined"}
                  onClick={() => setFilters((f) => ({ ...f, reportType: f.reportType === "data_quality" ? "" : "data_quality" }))}
                  onDelete={filters.reportType === "data_quality" ? () => setFilters((f) => ({ ...f, reportType: "" })) : undefined}
                />
              )}

              <Button variant="text" onClick={() => setFilters({})}>
                Clear Filters
              </Button>
            </div>

            <div style={{ width: "100%" }}>
              <DataGrid
                rows={flags}
                columns={columns}
                loading={isLoading}
                rowCount={pagination?.total || 0}
                paginationMode="server"
                paginationModel={{ page: (pagination?.page || 1) - 1, pageSize: pagination?.limit || 25 }}
                onPaginationModelChange={(model) => {
                  setFilters((f) => ({
                    ...f,
                    page: String(model.page + 1),
                    limit: String(model.pageSize),
                  }));
                }}
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

      <Dialog open={statusDialogOpen} onClose={() => setStatusDialogOpen(false)}>
        <DialogTitle>Update Flag Status</DialogTitle>
        <DialogContent>
          {selectedFlag && (
            <div className="mb-3">
              <Typography variant="body2" className="text-text-secondary">
                {String(selectedFlag.ruleCode).replace(/_/g, " ")} — {selectedFlag.client?.firstName} {selectedFlag.client?.lastName}
              </Typography>
            </div>
          )}
          <FormControl fullWidth variant="standard" className="mb-3">
            <InputLabel>Status</InputLabel>
            <Select value={newStatus} onChange={(e) => setNewStatus(e.target.value)}>
              {STATUS_OPTIONS.map((s) => (
                <MenuItem key={s} value={s}>{s}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            fullWidth
            variant="standard"
            label="Note (optional)"
            multiline
            rows={3}
            value={statusNote}
            onChange={(e) => setStatusNote(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleStatusChange} variant="contained" disabled={updateStatus.isPending}>
            {updateStatus.isPending ? "Updating..." : "Update"}
          </Button>
        </DialogActions>
      </Dialog>
    </Grid>
  );
}
