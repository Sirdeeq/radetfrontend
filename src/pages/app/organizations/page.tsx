import { useState } from "react";
import { Link } from "react-router-dom";
import { useOrganizations } from "@/hooks/useApi";

import {
  Breadcrumbs,
  Card,
  CardContent,
  Chip,
  Grid,
  Typography,
} from "@mui/material";
import { DataGrid, GridColDef } from "@mui/x-data-grid";

export default function Page() {
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 25 });

  const params: Record<string, string> = {
    page: String(paginationModel.page + 1),
    limit: String(paginationModel.pageSize),
  };

  const { data: orgsData, isLoading } = useOrganizations(params);

  const organizations = orgsData?.data?.organizations || orgsData?.data?.items || [];
  const pagination = orgsData?.data?.pagination;

  const columns: GridColDef[] = [
    { field: "name", headerName: "Name", flex: 1 },
    { field: "code", headerName: "Code", width: 120 },
    {
      field: "isActive",
      headerName: "Status",
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value ? "Active" : "Inactive"}
          color={params.value ? "success" : "default"}
          size="small"
        />
      ),
    },
  ];

  return (
    <Grid container spacing={5}>
      <Grid size={12}>
        <Typography variant="h1" component="h1" className="mb-0">
          Organizations
        </Typography>
        <Breadcrumbs>
          <Link color="inherit" to="/dashboards/default">Home</Link>
          <Typography variant="body2">Organizations</Typography>
        </Breadcrumbs>
      </Grid>

      <Grid size={12}>
        <Card>
          <CardContent>
            <div style={{ width: "100%" }}>
              <DataGrid
                rows={organizations}
                columns={columns}
                loading={isLoading}
                rowCount={pagination?.total || 0}
                paginationMode="server"
                paginationModel={paginationModel}
                onPaginationModelChange={setPaginationModel}
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
