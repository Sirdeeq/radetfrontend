import { useState } from "react";
import { useClients, useFacilities } from "@/hooks/useApi";

import {
  Breadcrumbs,
  Button,
  Card,
  CardContent,
  Chip,
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

  const { data: clientsData, isLoading } = useClients(filters);
  const { data: facilitiesData } = useFacilities();

  const clients = clientsData?.data?.clients || [];
  const pagination = clientsData?.data?.pagination;
  const facilities = facilitiesData?.data?.facilities || [];

  const columns: GridColDef[] = [
    { field: "patientId", headerName: "Patient ID", width: 140 },
    { field: "hospitalNumber", headerName: "Hospital Number", width: 150 },
    {
      field: "name",
      headerName: "Name",
      flex: 1,
      valueGetter: (_v: any, row: any) =>
        `${row.firstName || ""} ${row.lastName || ""}`.trim(),
    },
    { field: "sex", headerName: "Sex", width: 80 },
    { field: "artStatus", headerName: "ART Status", width: 120 },
    {
      field: "facility",
      headerName: "Facility",
      flex: 1,
      valueGetter: (v: any) => v?.name || "",
    },
    {
      field: "caseManager",
      headerName: "Case Manager",
      width: 150,
      valueGetter: (v: any) =>
        v ? `${v.firstName || ""} ${v.lastName || ""}`.trim() : "",
    },
    {
      field: "needsReview",
      headerName: "Needs Review",
      width: 130,
      renderCell: (params) =>
        params.value ? (
          <Chip label="Yes" color="warning" size="small" />
        ) : (
          <Chip label="No" size="small" />
        ),
    },
    {
      field: "actions",
      headerName: "",
      width: 100,
      renderCell: () => (
        <Button size="small" variant="outlined">
          Edit
        </Button>
      ),
    },
  ];

  return (
    <Grid container spacing={5}>
      <Grid size={12}>
        <Typography variant="h1" component="h1" className="mb-0">
          Clients
        </Typography>
        <Breadcrumbs>
          <Typography color="inherit">Home</Typography>
          <Typography variant="body2">Clients</Typography>
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
                placeholder="Name, Patient ID, Hospital #"
                value={filters.search || ""}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, search: e.target.value }))
                }
              />

              <FormControl variant="standard" size="small" className="min-w-[180px]">
                <InputLabel>Facility</InputLabel>
                <Select
                  value={filters.facilityId || ""}
                  onChange={(e) =>
                    setFilters((f) => ({ ...f, facilityId: e.target.value }))
                  }
                >
                  <MenuItem value="">All</MenuItem>
                  {facilities.map((fac: any) => (
                    <MenuItem key={fac._id} value={fac._id}>
                      {fac.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Button variant="text" onClick={() => setFilters({})}>
                Clear Filters
              </Button>
            </div>

            <div style={{ width: "100%" }}>
              <DataGrid
                rows={clients}
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
