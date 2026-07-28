import { useState } from "react";
import { Link } from "react-router-dom";
import { useUsers, useCreateUser, useUpdateUser } from "@/hooks/useApi";
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
  FormControlLabel,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import { DataGrid, GridColDef } from "@mui/x-data-grid";

const ROLES = ["SUPER_ADMIN", "ADMIN", "ME", "DEC", "CM", "PN", "VLC", "SUPERVISOR", "USER"];

const ROLE_COLORS: Record<string, "error" | "warning" | "info" | "success" | "default" | "primary"> = {
  SUPER_ADMIN: "error",
  ADMIN: "warning",
  ME: "info",
  DEC: "primary",
  CM: "success",
  PN: "info",
  VLC: "default",
  SUPERVISOR: "warning",
  USER: "default",
};

const EMPTY_FORM = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  role: "",
  organization: "",
  facility: "",
  phone: "",
};

const EMPTY_EDIT_FORM = {
  firstName: "",
  lastName: "",
  role: "",
  phone: "",
  isActive: true,
};

export default function Page() {
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editUser, setEditUser] = useState<any>(null);
  const [createForm, setCreateForm] = useState(EMPTY_FORM);
  const [editForm, setEditForm] = useState(EMPTY_EDIT_FORM);

  const { data: usersData, isLoading } = useUsers(filters);
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const { enqueueSnackbar } = useSnackbar();

  const users = usersData?.data?.users || usersData?.data || [];
  const pagination = usersData?.data?.pagination;

  const handleCreate = () => {
    createUser.mutate(createForm, {
      onSuccess: () => {
        enqueueSnackbar("User created successfully", { variant: "success" });
        setCreateOpen(false);
        setCreateForm(EMPTY_FORM);
      },
      onError: (err: any) => {
        enqueueSnackbar(err.message || "Failed to create user", { variant: "error" });
      },
    });
  };

  const handleEdit = () => {
    if (!editUser) return;
    updateUser.mutate(
      { id: editUser._id, data: editForm },
      {
        onSuccess: () => {
          enqueueSnackbar("User updated successfully", { variant: "success" });
          setEditOpen(false);
          setEditUser(null);
        },
        onError: (err: any) => {
          enqueueSnackbar(err.message || "Failed to update user", { variant: "error" });
        },
      }
    );
  };

  const openEditDialog = (user: any) => {
    setEditUser(user);
    setEditForm({
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      role: user.role || "",
      phone: user.phone || "",
      isActive: user.isActive !== false,
    });
    setEditOpen(true);
  };

  const columns: GridColDef[] = [
    {
      field: "name",
      headerName: "Name",
      flex: 1,
      valueGetter: (_v: any, row: any) => `${row.firstName || ""} ${row.lastName || ""}`.trim(),
    },
    { field: "email", headerName: "Email", flex: 1.5 },
    {
      field: "role",
      headerName: "Role",
      width: 140,
      renderCell: (params) => (
        <Chip label={params.value} color={ROLE_COLORS[params.value] || "default"} size="small" />
      ),
    },
    {
      field: "organization",
      headerName: "Organization",
      flex: 1,
      valueGetter: (v: any) => v?.name || "—",
    },
    {
      field: "facility",
      headerName: "Facility",
      flex: 1,
      valueGetter: (v: any) => v?.name || "—",
    },
    {
      field: "isActive",
      headerName: "Status",
      width: 100,
      renderCell: (params) => (
        <Chip
          label={params.value !== false ? "Active" : "Inactive"}
          color={params.value !== false ? "success" : "default"}
          size="small"
        />
      ),
    },
    {
      field: "actions",
      headerName: "",
      width: 80,
      renderCell: (params) => (
        <Button size="small" variant="outlined" onClick={() => openEditDialog(params.row)}>
          Edit
        </Button>
      ),
    },
  ];

  return (
    <Grid container spacing={5}>
      <Grid size={12}>
        <Typography variant="h1" component="h1" className="mb-0">
          Users
        </Typography>
        <Breadcrumbs>
          <Link color="inherit" to="/dashboards/default">
            Home
          </Link>
          <Typography variant="body2">Users</Typography>
        </Breadcrumbs>
      </Grid>

      <Grid size={12}>
        <Card>
          <CardContent>
            <div className="flex flex-wrap gap-3 mb-4">
              <TextField
                variant="standard"
                size="small"
                label="Search"
                className="min-w-[200px]"
                value={filters.search || ""}
                onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
              />
              <FormControl variant="standard" size="small" className="min-w-[150px]">
                <InputLabel>Role</InputLabel>
                <Select
                  value={filters.role || ""}
                  onChange={(e) => setFilters((f) => ({ ...f, role: e.target.value }))}
                >
                  <MenuItem value="">All</MenuItem>
                  {ROLES.map((r) => (
                    <MenuItem key={r} value={r}>
                      {r}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl variant="standard" size="small" className="min-w-[120px]">
                <InputLabel>Status</InputLabel>
                <Select
                  value={filters.isActive || ""}
                  onChange={(e) => setFilters((f) => ({ ...f, isActive: e.target.value }))}
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="true">Active</MenuItem>
                  <MenuItem value="false">Inactive</MenuItem>
                </Select>
              </FormControl>
              <Button variant="text" onClick={() => setFilters({})}>
                Clear
              </Button>
              <Button variant="contained" onClick={() => setCreateOpen(true)}>
                Create User
              </Button>
            </div>

            <div style={{ width: "100%" }}>
              <DataGrid
                rows={Array.isArray(users) ? users : []}
                columns={columns}
                loading={isLoading}
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
                getRowId={(row) => row._id}
                sx={{ "& .MuiDataGrid-cell": { py: 1 } }}
              />
            </div>
          </CardContent>
        </Card>
      </Grid>

      {/* Create User Dialog */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create User</DialogTitle>
        <DialogContent>
          <div className="flex flex-wrap gap-3 mt-2">
            <TextField
              variant="standard"
              label="First Name"
              fullWidth
              value={createForm.firstName}
              onChange={(e) => setCreateForm((f) => ({ ...f, firstName: e.target.value }))}
            />
            <TextField
              variant="standard"
              label="Last Name"
              fullWidth
              value={createForm.lastName}
              onChange={(e) => setCreateForm((f) => ({ ...f, lastName: e.target.value }))}
            />
            <TextField
              variant="standard"
              label="Email"
              fullWidth
              value={createForm.email}
              onChange={(e) => setCreateForm((f) => ({ ...f, email: e.target.value }))}
            />
            <TextField
              variant="standard"
              label="Password"
              type="password"
              fullWidth
              value={createForm.password}
              onChange={(e) => setCreateForm((f) => ({ ...f, password: e.target.value }))}
            />
            <FormControl variant="standard" fullWidth>
              <InputLabel>Role</InputLabel>
              <Select
                value={createForm.role}
                onChange={(e) => setCreateForm((f) => ({ ...f, role: e.target.value }))}
              >
                {ROLES.map((r) => (
                  <MenuItem key={r} value={r}>
                    {r}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              variant="standard"
              label="Organization"
              fullWidth
              value={createForm.organization}
              onChange={(e) => setCreateForm((f) => ({ ...f, organization: e.target.value }))}
            />
            <TextField
              variant="standard"
              label="Facility"
              fullWidth
              value={createForm.facility}
              onChange={(e) => setCreateForm((f) => ({ ...f, facility: e.target.value }))}
            />
            <TextField
              variant="standard"
              label="Phone"
              fullWidth
              value={createForm.phone}
              onChange={(e) => setCreateForm((f) => ({ ...f, phone: e.target.value }))}
            />
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateOpen(false)}>Cancel</Button>
          <Button
            onClick={handleCreate}
            variant="contained"
            disabled={createUser.isPending}
          >
            {createUser.isPending ? "Creating..." : "Create"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit User</DialogTitle>
        <DialogContent>
          <div className="flex flex-wrap gap-3 mt-2">
            <TextField
              variant="standard"
              label="First Name"
              fullWidth
              value={editForm.firstName}
              onChange={(e) => setEditForm((f) => ({ ...f, firstName: e.target.value }))}
            />
            <TextField
              variant="standard"
              label="Last Name"
              fullWidth
              value={editForm.lastName}
              onChange={(e) => setEditForm((f) => ({ ...f, lastName: e.target.value }))}
            />
            <FormControl variant="standard" fullWidth>
              <InputLabel>Role</InputLabel>
              <Select
                value={editForm.role}
                onChange={(e) => setEditForm((f) => ({ ...f, role: e.target.value }))}
              >
                {ROLES.map((r) => (
                  <MenuItem key={r} value={r}>
                    {r}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              variant="standard"
              label="Phone"
              fullWidth
              value={editForm.phone}
              onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={editForm.isActive}
                  onChange={(e) => setEditForm((f) => ({ ...f, isActive: e.target.checked }))}
                />
              }
              label="Active"
            />
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)}>Cancel</Button>
          <Button
            onClick={handleEdit}
            variant="contained"
            disabled={updateUser.isPending}
          >
            {updateUser.isPending ? "Saving..." : "Save"}
          </Button>
        </DialogActions>
      </Dialog>
    </Grid>
  );
}
