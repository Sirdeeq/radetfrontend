import { useState } from "react";
import { Link } from "react-router-dom";
import { useFlags, useUpdateFlagStatus } from "@/hooks/useApi";
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

export default function Page() {
  const [selectedFlag, setSelectedFlag] = useState<any>(null);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [statusNote, setStatusNote] = useState("");

  const { data: flagsData, isLoading } = useFlags({});
  const updateStatus = useUpdateFlagStatus();
  const { enqueueSnackbar } = useSnackbar();

  const allFlags = flagsData?.data?.flags || [];
  const assignedFlags = allFlags.filter(
    (f: any) => f.status === "Assigned" || f.status === "In Progress" || f.status === "Escalated"
  );

  const openCount = allFlags.filter((f: any) => f.status === "Open").length;
  const inProgressCount = allFlags.filter((f: any) => f.status === "In Progress").length;
  const escalatedCount = allFlags.filter((f: any) => f.status === "Escalated").length;

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
      headerName: "Flag Code",
      flex: 1,
      valueGetter: (v: any) => String(v).replace(/_/g, " "),
    },
    {
      field: "client",
      headerName: "Client Name",
      flex: 1,
      valueGetter: (v: any) =>
        v ? `${v.firstName || ""} ${v.lastName || ""}`.trim() || v.patientId || "" : "",
    },
    {
      field: "reportType",
      headerName: "Report Type",
      width: 130,
      valueGetter: (v: any) => String(v).replace(/_/g, " "),
    },
    { field: "status", headerName: "Status", width: 120 },
    {
      field: "createdAt",
      headerName: "Date Created",
      width: 130,
      valueGetter: (v: any) => (v ? new Date(v).toLocaleDateString() : ""),
    },
    {
      field: "actions",
      headerName: "",
      width: 130,
      renderCell: (params) => (
        <Button
          size="small"
          variant="outlined"
          onClick={() => {
            setSelectedFlag(params.row);
            setNewStatus(params.row.status);
            setStatusDialogOpen(true);
          }}
        >
          Update Status
        </Button>
      ),
    },
  ];

  return (
    <Grid container spacing={5}>
      <Grid size={12}>
        <Typography variant="h1" component="h1" className="mb-0">
          Worklists
        </Typography>
        <Breadcrumbs>
          <Link color="inherit" to="/dashboards/default">
            Home
          </Link>
          <Typography variant="body2">Worklists</Typography>
        </Breadcrumbs>
      </Grid>

      <Grid size={{ xs: 6, sm: 4 }}>
        <Card className="text-center">
          <CardContent>
            <Typography variant="h4">{openCount}</Typography>
            <Typography variant="body2" className="text-text-secondary">
              Open
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid size={{ xs: 6, sm: 4 }}>
        <Card className="text-center">
          <CardContent>
            <Typography variant="h4">{inProgressCount}</Typography>
            <Typography variant="body2" className="text-text-secondary">
              In Progress
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid size={{ xs: 6, sm: 4 }}>
        <Card className="text-center">
          <CardContent>
            <Typography variant="h4">{escalatedCount}</Typography>
            <Typography variant="body2" className="text-text-secondary">
              Escalated
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid size={12}>
        <Card>
          <CardContent>
            <div style={{ width: "100%" }}>
              <DataGrid
                rows={assignedFlags}
                columns={columns}
                loading={isLoading}
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
                {String(selectedFlag.ruleCode).replace(/_/g, " ")} —{" "}
                {selectedFlag.client?.firstName} {selectedFlag.client?.lastName}
              </Typography>
            </div>
          )}
          <FormControl fullWidth variant="standard" className="mb-3">
            <InputLabel>Status</InputLabel>
            <Select value={newStatus} onChange={(e) => setNewStatus(e.target.value)}>
              {STATUS_OPTIONS.map((s) => (
                <MenuItem key={s} value={s}>
                  {s}
                </MenuItem>
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
