import { useState } from "react";
import { Link } from "react-router-dom";
import { useSnackbar } from "notistack";
import {
  useFacilitiesAdmin,
  useCreateFacility,
  useUpdateFacility,
  useApproveFacility,
  useToggleFacilityStatus,
  useOrganizations,
} from "@/hooks/useApi";

import {
  Box,
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
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import { DataGrid, GridColDef } from "@mui/x-data-grid";

const STATUS_OPTIONS = [
  { value: "", label: "All" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "pending", label: "Pending" },
  { value: "rejected", label: "Rejected" },
];

const STATUS_COLOR: Record<string, "success" | "default" | "warning" | "error"> = {
  active: "success",
  inactive: "default",
  pending: "warning",
  rejected: "error",
};

const EMPTY_FORM = {
  name: "",
  shortName: "",
  organization: "",
  state: "",
  status: "active",
};

export default function Page() {
  const { enqueueSnackbar } = useSnackbar();
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [tab, setTab] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingFacility, setEditingFacility] = useState<any>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<any>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [confirmToggle, setConfirmToggle] = useState<any>(null);

  const listParams = tab === 1
    ? { ...filters, status: "pending" }
    : filters;

  const { data: facilitiesData, isLoading } = useFacilitiesAdmin(Object.keys(listParams).length ? listParams : undefined);
  const { data: orgsData } = useOrganizations();
  const createFacility = useCreateFacility();
  const updateFacility = useUpdateFacility();
  const approveFacility = useApproveFacility();
  const toggleStatus = useToggleFacilityStatus();

  const facilities = facilitiesData?.data?.facilities || facilitiesData?.data?.items || facilitiesData?.data || [];
  const pagination = facilitiesData?.data?.pagination;
  const organizations = orgsData?.data?.organizations || orgsData?.data || [];

  const openAddDialog = () => {
    setEditingFacility(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEditDialog = (row: any) => {
    setEditingFacility(row);
    setForm({
      name: row.name || "",
      shortName: row.shortName || "",
      organization: row.organization?._id || row.organization || "",
      state: row.state || "",
      status: row.status || "active",
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.name.trim()) {
      enqueueSnackbar("Facility name is required", { variant: "error" });
      return;
    }
    const payload = { ...form };
    if (editingFacility) {
      updateFacility.mutate({ id: editingFacility._id, data: payload }, {
        onSuccess: () => { enqueueSnackbar("Facility updated", { variant: "success" }); setDialogOpen(false); },
        onError: (err: any) => enqueueSnackbar(err.message || "Failed to update", { variant: "error" }),
      });
    } else {
      createFacility.mutate(payload, {
        onSuccess: () => { enqueueSnackbar("Facility created", { variant: "success" }); setDialogOpen(false); },
        onError: (err: any) => enqueueSnackbar(err.message || "Failed to create", { variant: "error" }),
      });
    }
  };

  const handleApprove = (row: any) => {
    approveFacility.mutate({ id: row._id, action: "approve" }, {
      onSuccess: () => enqueueSnackbar("Facility approved", { variant: "success" }),
      onError: (err: any) => enqueueSnackbar(err.message || "Failed to approve", { variant: "error" }),
    });
  };

  const openRejectDialog = (row: any) => {
    setRejectTarget(row);
    setRejectReason("");
    setRejectDialogOpen(true);
  };

  const handleReject = () => {
    if (!rejectReason.trim()) {
      enqueueSnackbar("Rejection reason is required", { variant: "error" });
      return;
    }
    approveFacility.mutate(
      { id: rejectTarget._id, action: "reject", reason: rejectReason },
      {
        onSuccess: () => { enqueueSnackbar("Facility rejected", { variant: "success" }); setRejectDialogOpen(false); },
        onError: (err: any) => enqueueSnackbar(err.message || "Failed to reject", { variant: "error" }),
      }
    );
  };

  const handleToggleStatus = (row: any) => {
    toggleStatus.mutate(row._id, {
      onSuccess: () => enqueueSnackbar("Status updated", { variant: "success" }),
      onError: (err: any) => enqueueSnackbar(err.message || "Failed to toggle status", { variant: "error" }),
    });
    setConfirmToggle(null);
  };

  const columns: GridColDef[] = [
    { field: "name", headerName: "Name", flex: 1 },
    { field: "shortName", headerName: "Short Name", width: 120 },
    {
      field: "organization",
      headerName: "Organization",
      flex: 1,
      valueGetter: (v: any) => v?.name || "",
    },
    { field: "state", headerName: "State", width: 100 },
    {
      field: "status",
      headerName: "Status",
      width: 110,
      renderCell: (params) => {
        const val = params.value || (params.row.isActive !== false ? "active" : "inactive");
        return <Chip label={val} color={STATUS_COLOR[val] || "default"} size="small" />;
      },
    },
    ...(tab !== 1
      ? [
          {
            field: "actions",
            headerName: "",
            width: 180,
            renderCell: (params: any) => (
              <Box className="flex gap-1">
                <Button size="small" variant="outlined" onClick={() => openEditDialog(params.row)}>
                  Edit
                </Button>
                <Button size="small" variant="outlined" color="warning" onClick={() => setConfirmToggle(params.row)}>
                  Toggle
                </Button>
              </Box>
            ),
          } as GridColDef,
        ]
      : [
          {
            field: "actions",
            headerName: "",
            width: 220,
            renderCell: (params: any) => (
              <Box className="flex gap-1">
                <Button size="small" variant="contained" color="success" onClick={() => handleApprove(params.row)}>
                  Approve
                </Button>
                <Button size="small" variant="contained" color="error" onClick={() => openRejectDialog(params.row)}>
                  Reject
                </Button>
              </Box>
            ),
          } as GridColDef,
        ]),
  ];

  return (
    <Grid container spacing={5}>
      <Grid size={12}>
        <Box className="flex items-center justify-between">
          <Box>
            <Typography variant="h1" component="h1" className="mb-0">
              Facilities
            </Typography>
            <Breadcrumbs>
              <Link color="inherit" to="/dashboards/default">
                Home
              </Link>
              <Typography variant="body2">Facilities</Typography>
            </Breadcrumbs>
          </Box>
          <Button variant="contained" onClick={openAddDialog}>
            Add Facility
          </Button>
        </Box>
      </Grid>

      <Grid size={12}>
        <Card>
          <CardContent>
            <Tabs value={tab} onChange={(_e, v) => setTab(v)} className="mb-3">
              <Tab label="All Facilities" />
              <Tab label="Pending Approval" />
            </Tabs>

            {tab === 0 && (
              <Box className="flex flex-wrap gap-3 mb-4">
                <FormControl variant="standard" size="small" className="min-w-[180px]">
                  <InputLabel>Organization</InputLabel>
                  <Select
                    value={filters.organization || ""}
                    onChange={(e) => setFilters((f) => ({ ...f, organization: e.target.value }))}
                  >
                    <MenuItem value="">All</MenuItem>
                    {organizations.map((org: any) => (
                      <MenuItem key={org._id} value={org._id}>
                        {org.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl variant="standard" size="small" className="min-w-[130px]">
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={filters.status || ""}
                    onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <MenuItem key={s.value} value={s.value}>
                        {s.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <TextField
                  variant="standard"
                  size="small"
                  label="Search"
                  className="min-w-[200px]"
                  value={filters.search || ""}
                  onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
                />
                <Button variant="text" onClick={() => setFilters({})}>
                  Clear
                </Button>
              </Box>
            )}

            <div style={{ width: "100%" }}>
              <DataGrid
                rows={Array.isArray(facilities) ? facilities : []}
                columns={columns}
                loading={isLoading || createFacility.isPending || updateFacility.isPending || approveFacility.isPending}
                rowCount={pagination?.total || 0}
                paginationMode="server"
                paginationModel={{ page: (pagination?.page || 1) - 1, pageSize: pagination?.limit || 25 }}
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
                getRowId={(row: any) => row._id}
                sx={{ "& .MuiDataGrid-cell": { py: 1 } }}
              />
            </div>
          </CardContent>
        </Card>
      </Grid>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingFacility ? "Edit Facility" : "Add Facility"}</DialogTitle>
        <DialogContent>
          <Box className="flex flex-col gap-3 mt-2">
            <TextField
              variant="standard"
              label="Name"
              fullWidth
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
            <TextField
              variant="standard"
              label="Short Name"
              fullWidth
              value={form.shortName}
              onChange={(e) => setForm((f) => ({ ...f, shortName: e.target.value }))}
            />
            <FormControl variant="standard" fullWidth>
              <InputLabel>Organization</InputLabel>
              <Select
                value={form.organization}
                onChange={(e) => setForm((f) => ({ ...f, organization: e.target.value }))}
              >
                {organizations.map((org: any) => (
                  <MenuItem key={org._id} value={org._id}>
                    {org.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              variant="standard"
              label="State"
              fullWidth
              value={form.state}
              onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))}
            />
            <FormControl variant="standard" fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
              >
                {STATUS_OPTIONS.filter((s) => s.value).map((s) => (
                  <MenuItem key={s.value} value={s.value}>
                    {s.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSave} variant="contained" disabled={createFacility.isPending || updateFacility.isPending}>
            {editingFacility ? "Save" : "Create"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onClose={() => setRejectDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Reject Facility: {rejectTarget?.name}</DialogTitle>
        <DialogContent>
          <TextField
            variant="standard"
            label="Rejection Reason"
            fullWidth
            multiline
            minRows={3}
            required
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            className="mt-2"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleReject} variant="contained" color="error" disabled={approveFacility.isPending}>
            Reject
          </Button>
        </DialogActions>
      </Dialog>

      {/* Toggle Status Confirmation */}
      <Dialog open={!!confirmToggle} onClose={() => setConfirmToggle(null)}>
        <DialogTitle>Toggle Facility Status</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to toggle the status of <strong>{confirmToggle?.name}</strong>?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmToggle(null)}>Cancel</Button>
          <Button onClick={() => handleToggleStatus(confirmToggle)} variant="contained" color="warning">
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </Grid>
  );
}
