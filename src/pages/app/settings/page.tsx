import { useState } from "react";
import { Link } from "react-router-dom";
import {
  useOrganizations,
  useFacilities,
  useCreateOrganization,
  useCreateFacility,
} from "@/hooks/useApi";
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
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import { DataGrid, GridColDef } from "@mui/x-data-grid";

export default function Page() {
  const [tab, setTab] = useState(0);

  return (
    <Grid container spacing={5}>
      <Grid size={12}>
        <Typography variant="h1" component="h1" className="mb-0">
          Settings
        </Typography>
        <Breadcrumbs>
          <Link color="inherit" to="/dashboards/default">
            Home
          </Link>
          <Typography variant="body2">Settings</Typography>
        </Breadcrumbs>
      </Grid>

      <Grid size={12}>
        <Card>
          <CardContent>
            <Tabs value={tab} onChange={(_, v) => setTab(v)} className="mb-4">
              <Tab label="Organizations" />
              <Tab label="Facilities" />
            </Tabs>
            {tab === 0 && <OrganizationsSection />}
            {tab === 1 && <FacilitiesSection />}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}

function OrganizationsSection() {
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");

  const { data, isLoading } = useOrganizations();
  const createOrg = useCreateOrganization();
  const { enqueueSnackbar } = useSnackbar();

  const orgs = data?.data?.organizations || data?.data || [];

  const handleCreate = () => {
    createOrg.mutate(
      { name, code },
      {
        onSuccess: () => {
          enqueueSnackbar("Organization created", { variant: "success" });
          setCreateOpen(false);
          setName("");
          setCode("");
        },
        onError: (err: any) => {
          enqueueSnackbar(err.message || "Failed to create", { variant: "error" });
        },
      }
    );
  };

  const columns: GridColDef[] = [
    { field: "name", headerName: "Name", flex: 1 },
    { field: "code", headerName: "Code", width: 120 },
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
  ];

  return (
    <>
      <div className="flex justify-between items-center mb-3">
        <Typography variant="h6">Organizations</Typography>
        <Button variant="contained" onClick={() => setCreateOpen(true)}>
          Create Organization
        </Button>
      </div>
      <div style={{ width: "100%" }}>
        <DataGrid
          rows={Array.isArray(orgs) ? orgs : []}
          columns={columns}
          loading={isLoading}
          disableRowSelectionOnClick
          autoHeight
          getRowId={(row) => row._id}
          sx={{ "& .MuiDataGrid-cell": { py: 1 } }}
        />
      </div>

      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create Organization</DialogTitle>
        <DialogContent>
          <div className="flex flex-wrap gap-3 mt-2">
            <TextField
              variant="standard"
              label="Name"
              fullWidth
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <TextField
              variant="standard"
              label="Code (optional)"
              fullWidth
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateOpen(false)}>Cancel</Button>
          <Button onClick={handleCreate} variant="contained" disabled={createOrg.isPending}>
            {createOrg.isPending ? "Creating..." : "Create"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

function FacilitiesSection() {
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [organizationId, setOrganizationId] = useState("");

  const { data: facData, isLoading: facLoading } = useFacilities();
  const { data: orgData } = useOrganizations();
  const createFac = useCreateFacility();
  const { enqueueSnackbar } = useSnackbar();

  const facilities = facData?.data?.facilities || facData?.data || [];
  const orgs = orgData?.data?.organizations || orgData?.data || [];

  const handleCreate = () => {
    createFac.mutate(
      { name, code, organization: organizationId },
      {
        onSuccess: () => {
          enqueueSnackbar("Facility created", { variant: "success" });
          setCreateOpen(false);
          setName("");
          setCode("");
          setOrganizationId("");
        },
        onError: (err: any) => {
          enqueueSnackbar(err.message || "Failed to create", { variant: "error" });
        },
      }
    );
  };

  const columns: GridColDef[] = [
    { field: "name", headerName: "Name", flex: 1 },
    { field: "code", headerName: "Code", width: 120 },
    {
      field: "organization",
      headerName: "Organization",
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
  ];

  return (
    <>
      <div className="flex justify-between items-center mb-3">
        <Typography variant="h6">Facilities</Typography>
        <Button variant="contained" onClick={() => setCreateOpen(true)}>
          Create Facility
        </Button>
      </div>
      <div style={{ width: "100%" }}>
        <DataGrid
          rows={Array.isArray(facilities) ? facilities : []}
          columns={columns}
          loading={facLoading}
          disableRowSelectionOnClick
          autoHeight
          getRowId={(row) => row._id}
          sx={{ "& .MuiDataGrid-cell": { py: 1 } }}
        />
      </div>

      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create Facility</DialogTitle>
        <DialogContent>
          <div className="flex flex-wrap gap-3 mt-2">
            <TextField
              variant="standard"
              label="Name"
              fullWidth
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <TextField
              variant="standard"
              label="Code (optional)"
              fullWidth
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
            <FormControl variant="standard" fullWidth>
              <InputLabel>Organization</InputLabel>
              <Select
                value={organizationId}
                onChange={(e) => setOrganizationId(e.target.value)}
              >
                {Array.isArray(orgs) &&
                  orgs.map((org: any) => (
                    <MenuItem key={org._id} value={org._id}>
                      {org.name}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateOpen(false)}>Cancel</Button>
          <Button onClick={handleCreate} variant="contained" disabled={createFac.isPending}>
            {createFac.isPending ? "Creating..." : "Create"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
