import { useState } from "react";
import { Link } from "react-router-dom";
import { useReportRecords } from "@/hooks/useApi";
import {
  Breadcrumbs,
  Card,
  CardContent,
  Grid,
  Typography,
} from "@mui/material";
import { DataGrid, GridColDef } from "@mui/x-data-grid";

type ReportDataGridPageProps = {
  reportType: string;
  title: string;
};

function formatDataFields(data: any): string {
  if (!data || typeof data !== "object") return "—";
  const entries = Object.entries(data);
  if (entries.length === 0) return "—";
  return entries
    .slice(0, 3)
    .map(([k, v]) => `${k.replace(/_/g, " ")}: ${v}`)
    .join(", ");
}

export default function ReportDataGridPage({ reportType, title }: ReportDataGridPageProps) {
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 25 });

  const params: Record<string, string> = {
    reportType,
    page: String(paginationModel.page + 1),
    limit: String(paginationModel.pageSize),
  };

  const { data, isLoading } = useReportRecords(params);
  const records = data?.data?.records || data?.data || [];
  const pagination = data?.data?.pagination;

  const columns: GridColDef[] = [
    {
      field: "client",
      headerName: "Client Name",
      flex: 1,
      valueGetter: (v: any) =>
        v ? `${v.firstName || ""} ${v.lastName || ""}`.trim() || v.patientId || "" : "",
    },
    {
      field: "patientId",
      headerName: "Patient ID",
      width: 150,
      valueGetter: (_v: any, row: any) => row.client?.patientId || row.patientId || "",
    },
    {
      field: "facility",
      headerName: "Facility",
      flex: 1,
      valueGetter: (v: any) => v?.name || "",
    },
    {
      field: "status",
      headerName: "Status",
      width: 120,
    },
    {
      field: "needsReview",
      headerName: "Needs Review",
      width: 120,
      valueGetter: (v: any) => (v ? "Yes" : "No"),
    },
    {
      field: "data",
      headerName: "Key Data",
      flex: 2,
      valueGetter: (v: any) => formatDataFields(v),
    },
    {
      field: "createdAt",
      headerName: "Date Imported",
      width: 140,
      valueGetter: (v: any) => (v ? new Date(v).toLocaleDateString() : ""),
    },
  ];

  return (
    <Grid container spacing={5}>
      <Grid size={12}>
        <Typography variant="h1" component="h1" className="mb-0">
          {title}
        </Typography>
        <Breadcrumbs>
          <Link color="inherit" to="/dashboards/default">
            Home
          </Link>
          <Link color="inherit" to="/reports">
            Reports
          </Link>
          <Typography variant="body2">{title}</Typography>
        </Breadcrumbs>
      </Grid>

      <Grid size={12}>
        <Card>
          <CardContent>
            <div style={{ width: "100%" }}>
              <DataGrid
                rows={Array.isArray(records) ? records : []}
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
