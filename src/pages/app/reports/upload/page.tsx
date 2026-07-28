import { useState, useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { Link } from "react-router-dom";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Stepper,
  Step,
  StepLabel,
  Alert,
  Chip,
  LinearProgress,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Divider,
  Stack,
  Checkbox,
  ListItemText,
  OutlinedInput,
} from "@mui/material";
import {
  Upload as UploadIcon,
  CheckCircle,
  Error as ErrorIcon,
  Description,
} from "@mui/icons-material";
import { useSnackbar } from "notistack";
import { useQueryClient } from "@tanstack/react-query";
import { api, getAccessToken } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useOrganizations, useFacilities } from "@/hooks/useApi";

const steps = ["Select File", "Configure", "Import"];

const REPORT_TYPES = [
  { value: "art_refill", label: "ART Refill / Missed Refills" },
  { value: "next_refill", label: "Next Refill / Expected Refills" },
  { value: "iit", label: "IIT / Missed appointments" },
  { value: "viral_load", label: "Viral Load" },
  { value: "eac", label: "Enhanced Adherence Counseling" },
  { value: "tpt", label: "TPT" },
  { value: "tb_screening", label: "TB Screening" },
  { value: "biometric", label: "Biometrics" },
  { value: "cervical_cancer", label: "Cervical Cancer" },
  { value: "dsd", label: "DSD" },
  { value: "other", label: "Other" },
];

const EXPORT_PERIODS = [
  { value: "full", label: "Full Period" },
  { value: "3month", label: "Last 3 Months" },
  { value: "6month", label: "Last 6 Months" },
  { value: "custom", label: "Custom Range" },
];

const formatBytes = (bytes: number) => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
};

interface DetectionResult {
  type: "radet_complete_or_line_list" | "weekly_gap" | "unrecognized";
  confidence?: number;
  sheetName?: string;
  reportType?: string;
  reportTypes?: string[];
}

interface ProgressData {
  phase: string;
  percentage: number;
  processed: number;
  total: number;
  errors: number;
  flagsGenerated: number;
}

export default function Page() {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const { user } = useAuth();
  const isAdmin = user?.role === "SUPER_ADMIN" || user?.role === "ADMIN";

  const { data: orgsData } = useOrganizations();
  const organizations: any[] = orgsData?.data?.organizations || [];

  const [selectedOrgId, setSelectedOrgId] = useState("");
  const [selectedFacilityId, setSelectedFacilityId] = useState("");
  const { data: facsData } = useFacilities(isAdmin && selectedOrgId ? { organization: selectedOrgId } : undefined);
  const facilities: any[] = facsData?.data?.facilities || [];

  const [activeStep, setActiveStep] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [detection, setDetection] = useState<DetectionResult | null>(null);
  const [detecting, setDetecting] = useState(false);

  const [reportTypes, setReportTypes] = useState<string[]>([]);
  const [manualReportType, setManualReportType] = useState("");
  const [exportPeriod, setExportPeriod] = useState("full");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [importId, setImportId] = useState<string | null>(null);
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importComplete, setImportComplete] = useState(false);

  const getAuthHeaders = useCallback(() => {
    const token = getAccessToken() || "";
    return { Authorization: `Bearer ${token}` };
  }, []);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const dropped = acceptedFiles[0];
      if (!dropped) return;

      setFile(dropped);
      setDetection(null);
      setDetecting(true);
      setActiveStep(0);

      try {
        const formData = new FormData();
        formData.append("file", dropped);
        const res = await fetch(`/api/v1/uploads/detect`, {
          method: "POST",
          headers: getAuthHeaders(),
          body: formData,
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.message || "Detection failed");
        }
        const json = await res.json();
        const det: DetectionResult = json.data ?? json;
        setDetection(det);

        if (det.type === "radet_complete_or_line_list") {
          setReportTypes(det.reportType ? [det.reportType] : []);
        } else if (det.type === "weekly_gap") {
          setReportTypes(det.reportTypes || []);
        } else {
          setReportTypes([]);
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to detect file type";
        enqueueSnackbar(message, { variant: "error" });
      } finally {
        setDetecting(false);
      }
    },
    [enqueueSnackbar, getAuthHeaders],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
        ".xlsx",
      ],
      "application/vnd.ms-excel": [".xls"],
    },
    maxFiles: 1,
    maxSize: 15 * 1024 * 1024,
  });

  useEffect(() => {
    if (!importId || !importing || importComplete) return;

    const interval = setInterval(async () => {
      try {
        const p = await api.get<ProgressData>(
          `/uploads/${importId}/progress`,
        );
        setProgress(p);

        if (p.percentage >= 100) {
          setImporting(false);
          setImportComplete(true);
          clearInterval(interval);
          queryClient.invalidateQueries({ queryKey: ["dashboard"] });
          queryClient.invalidateQueries({ queryKey: ["flags"] });
          queryClient.invalidateQueries({ queryKey: ["import-logs"] });
          enqueueSnackbar("Import completed successfully!", {
            variant: "success",
          });
        }
      } catch {
        // keep polling, transient error
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [importId, importing, importComplete, queryClient, enqueueSnackbar]);

  const canProceedStep0 = !!file && !!detection;
  const canProceedStep1 =
    (detection?.type === "unrecognized" && !!manualReportType) ||
    (detection?.type !== "unrecognized" && reportTypes.length > 0);

  const canStartImport = canProceedStep1 && (isAdmin ? !!selectedOrgId && !!selectedFacilityId : true);

  const handleStartImport = async () => {
    if (!file) return;

    setImporting(true);
    setImportError(null);
    setImportComplete(false);
    setProgress(null);
    setActiveStep(2);

    try {
      const formData = new FormData();
      formData.append("file", file);

      if (detection?.type === "unrecognized") {
        formData.append("reportType", manualReportType);
      } else {
        reportTypes.forEach((rt) => formData.append("reportTypes[]", rt));
      }

      formData.append("exportPeriod", exportPeriod);
      if (exportPeriod === "custom") {
        if (dateFrom) formData.append("dateFrom", dateFrom);
        if (dateTo) formData.append("dateTo", dateTo);
      }

      if (isAdmin) {
        if (selectedOrgId) formData.append("organizationId", selectedOrgId);
        if (selectedFacilityId) formData.append("facilityId", selectedFacilityId);
      }

      const res = await fetch(`/api/v1/uploads`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Upload failed");
      }
      const json = await res.json();
      const importIdResult: string = json.data?.importId ?? json.importId;
      setImportId(importIdResult);
    } catch (err: unknown) {
      setImporting(false);
      const message = err instanceof Error ? err.message : "Failed to start import";
      setImportError(message);
      enqueueSnackbar(message, { variant: "error" });
    }
  };

  const getReportTypeLabel = (value: string) =>
    REPORT_TYPES.find((rt) => rt.value === value)?.label || value;

  return (
    <Grid container spacing={5}>
      <Grid size={12}>
        <Typography variant="h1" component="h1" className="mb-0">
          Upload Report
        </Typography>
      </Grid>

      <Grid size={12}>
        <Stepper activeStep={activeStep} alternativeLabel>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Grid>

      {file && detection && (
        <Grid size={12}>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Description color="primary" />
              <Typography variant="body2" fontWeight={600}>
                {file.name}
              </Typography>
              <Chip label={formatBytes(file.size)} size="small" />
              <Chip
                label={detection.type.replace(/_/g, " ")}
                color={
                  detection.type === "unrecognized" ? "error" : "primary"
                }
                size="small"
              />
              {detection.confidence !== undefined && (
                <Chip
                  label={`${detection.confidence}% confidence`}
                  size="small"
                  variant="outlined"
                />
              )}
            </Stack>
          </Paper>
        </Grid>
      )}

      {activeStep === 0 && (
        <Grid size={{ xs: 12, md: 8 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" className="mb-4">
                Select Excel File
              </Typography>

              <div
                {...getRootProps()}
                style={{
                  border: `2px dashed ${isDragActive ? "#1976d2" : "#ccc"}`,
                  borderRadius: 8,
                  padding: 48,
                  textAlign: "center",
                  cursor: "pointer",
                  backgroundColor: isDragActive
                    ? "rgba(25, 118, 210, 0.04)"
                    : "transparent",
                  transition: "all 0.2s",
                }}
              >
                <input {...getInputProps()} />
                {isDragActive ? (
                  <Typography variant="body1" color="primary">
                    Drop the file here...
                  </Typography>
                ) : (
                  <div>
                    <UploadIcon
                      sx={{ fontSize: 48, color: "text.secondary", mb: 1 }}
                    />
                    <Typography variant="body1" className="mb-1">
                      Drag & drop an Excel file here, or click to select
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Supports .xlsx and .xls (max 15MB)
                    </Typography>
                  </div>
                )}
              </div>

              {detecting && (
                <Box sx={{ mt: 3 }}>
                  <LinearProgress />
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Detecting file type...
                  </Typography>
                </Box>
              )}

              {detection && !detecting && (
                <Box sx={{ mt: 3 }}>
                  {detection.type === "radet_complete_or_line_list" && (
                    <Alert severity="success" icon={<CheckCircle />}>
                      <Typography variant="body2" fontWeight={600}>
                        RADET Report / Line List detected
                      </Typography>
                      {detection.sheetName && (
                        <Typography variant="caption" display="block">
                          Sheet: {detection.sheetName}
                          {detection.reportType &&
                            ` — ${getReportTypeLabel(detection.reportType)}`}
                        </Typography>
                      )}
                    </Alert>
                  )}

                  {detection.type === "weekly_gap" && (
                    <Alert severity="info">
                      <Typography variant="body2" fontWeight={600}>
                        Weekly Gap report detected — multiple report types found:
                      </Typography>
                      <Stack
                        direction="row"
                        spacing={1}
                        sx={{ mt: 1 }}
                        flexWrap="wrap"
                        useFlexGap
                      >
                        {(detection.reportTypes || []).map((rt) => (
                          <Chip key={rt} label={getReportTypeLabel(rt)} size="small" />
                        ))}
                      </Stack>
                    </Alert>
                  )}

                  {detection.type === "unrecognized" && (
                    <Alert severity="warning" icon={<ErrorIcon />}>
                      <Typography variant="body2" fontWeight={600}>
                        Unrecognized file format
                      </Typography>
                      <Typography variant="caption">
                        Please manually select a report type to continue.
                      </Typography>
                    </Alert>
                  )}
                </Box>
              )}

              <Box sx={{ mt: 4, display: "flex", justifyContent: "flex-end" }}>
                <Button
                  variant="contained"
                  disabled={!canProceedStep0}
                  onClick={() => setActiveStep(1)}
                >
                  Next
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      )}

      {activeStep === 1 && (
        <Grid size={{ xs: 12, md: 8 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" className="mb-4">
                Configure Import
              </Typography>

              {detection?.sheetName && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Detected sheet: <strong>{detection.sheetName}</strong>
                </Typography>
              )}

              <Divider sx={{ mb: 3 }} />

              {detection?.type === "weekly_gap" && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Report Types
                  </Typography>
                  <FormControl fullWidth>
                    <InputLabel>Select Report Types</InputLabel>
                    <Select
                      multiple
                      value={reportTypes}
                      onChange={(e) =>
                        setReportTypes(
                          typeof e.target.value === "string"
                            ? e.target.value.split(",")
                            : e.target.value
                        )
                      }
                      input={<OutlinedInput label="Select Report Types" />}
                      renderValue={(selected) =>
                        (selected as string[]).length === 0
                          ? "None selected"
                          : `${(selected as string[]).length} selected`
                      }
                    >
                      {REPORT_TYPES.map((rt) => (
                        <MenuItem key={rt.value} value={rt.value}>
                          <Checkbox
                            checked={reportTypes.indexOf(rt.value) > -1}
                          />
                          <ListItemText primary={rt.label} />
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  {reportTypes.length > 0 && (
                    <Stack
                      direction="row"
                      spacing={1}
                      sx={{ mt: 1.5 }}
                      flexWrap="wrap"
                      useFlexGap
                    >
                      {reportTypes.map((rt) => (
                        <Chip
                          key={rt}
                          label={getReportTypeLabel(rt)}
                          onDelete={() =>
                            setReportTypes((prev) =>
                              prev.filter((r) => r !== rt)
                            )
                          }
                          color="primary"
                          variant="outlined"
                          size="small"
                        />
                      ))}
                    </Stack>
                  )}
                  {reportTypes.length === 0 && (
                    <Alert severity="warning" sx={{ mt: 1 }}>
                      No report types selected. Please select at least one to continue.
                    </Alert>
                  )}
                </Box>
              )}

              {detection?.type === "unrecognized" && (
                <FormControl fullWidth sx={{ mb: 3 }}>
                  <InputLabel>Report Type</InputLabel>
                  <Select
                    value={manualReportType}
                    onChange={(e) => setManualReportType(e.target.value)}
                    label="Report Type"
                  >
                    {REPORT_TYPES.map((rt) => (
                      <MenuItem key={rt.value} value={rt.value}>
                        {rt.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}

              <Divider sx={{ my: 2 }} />

              {isAdmin ? (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Organization & Facility
                  </Typography>
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                    <FormControl fullWidth>
                      <InputLabel>Organization</InputLabel>
                      <Select
                        value={selectedOrgId}
                        onChange={(e) => {
                          setSelectedOrgId(e.target.value);
                          setSelectedFacilityId("");
                        }}
                        label="Organization"
                      >
                        {organizations.map((org: any) => (
                          <MenuItem key={org._id} value={org._id}>
                            {org.name} ({org.code})
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <FormControl fullWidth>
                      <InputLabel>Facility</InputLabel>
                      <Select
                        value={selectedFacilityId}
                        onChange={(e) => setSelectedFacilityId(e.target.value)}
                        label="Facility"
                        disabled={!selectedOrgId}
                      >
                        {facilities.map((fac: any) => (
                          <MenuItem key={fac._id} value={fac._id}>
                            {fac.name} {fac.shortName ? `(${fac.shortName})` : ""}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Stack>
                </Box>
              ) : (
                user?.facility && (
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                      Upload Target
                    </Typography>
                    <Stack direction="row" spacing={1}>
                      <Chip
                        label={`Facility: ${typeof user.facility === "object" ? (user.facility as any).name : user.facility}`}
                        size="small"
                        variant="outlined"
                      />
                      {user?.organization && typeof user.organization === "object" && (
                        <Chip
                          label={`Org: ${(user.organization as any).name} (${(user.organization as any).code})`}
                          size="small"
                          variant="outlined"
                        />
                      )}
                    </Stack>
                  </Box>
                )
              )}

              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Export Period
              </Typography>
              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel>Period</InputLabel>
                <Select
                  value={exportPeriod}
                  onChange={(e) => setExportPeriod(e.target.value)}
                  label="Period"
                >
                  {EXPORT_PERIODS.map((p) => (
                    <MenuItem key={p.value} value={p.value}>
                      {p.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {exportPeriod === "custom" && (
                <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 3 }}>
                  <TextField
                    label="Date From"
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    slotProps={{ inputLabel: { shrink: true } }}
                    fullWidth
                  />
                  <TextField
                    label="Date To"
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    slotProps={{ inputLabel: { shrink: true } }}
                    fullWidth
                  />
                </Stack>
              )}

              <Divider sx={{ mb: 3 }} />

              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Button variant="outlined" onClick={() => setActiveStep(0)}>
                  Back
                </Button>
                <Button
                  variant="contained"
                  disabled={!canStartImport}
                  onClick={handleStartImport}
                >
                  Start Import
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      )}

      {activeStep === 2 && (
        <Grid size={{ xs: 12, md: 8 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" className="mb-4">
                Import Progress
              </Typography>

              {importing && !importComplete && (
                <Box>
                  <LinearProgress
                    variant={progress ? "determinate" : "indeterminate"}
                    value={progress?.percentage || 0}
                    sx={{ height: 12, borderRadius: 1, mb: 2 }}
                  />
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    sx={{ mb: 2 }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      {progress?.phase || "Starting import..."}
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {progress ? `${progress.percentage}%` : ""}
                    </Typography>
                  </Stack>

                  {progress && (
                    <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
                      <Chip
                        label={`Processed: ${progress.processed}/${progress.total}`}
                        size="small"
                        variant="outlined"
                      />
                      <Chip
                        label={`Errors: ${progress.errors}`}
                        size="small"
                        color={progress.errors > 0 ? "error" : "default"}
                        variant="outlined"
                      />
                      <Chip
                        label={`Flags: ${progress.flagsGenerated}`}
                        size="small"
                        color="primary"
                      />
                    </Stack>
                  )}
                </Box>
              )}

              {importError && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {importError}
                </Alert>
              )}

              {importComplete && (
                <Box>
                  <Alert severity="success" icon={<CheckCircle />} sx={{ mb: 3 }}>
                    Import completed successfully!
                  </Alert>

                  {progress && (
                    <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
                      <Typography variant="subtitle2" sx={{ mb: 2 }}>
                        Summary
                      </Typography>
                      <Stack
                        direction="row"
                        spacing={2}
                        flexWrap="wrap"
                        useFlexGap
                      >
                        <Chip
                          label={`Processed: ${progress.processed}`}
                          color="primary"
                          variant="outlined"
                        />
                        <Chip
                          label={`Errors: ${progress.errors}`}
                          color={progress.errors > 0 ? "error" : "default"}
                          variant="outlined"
                        />
                        <Chip
                          label={`Flags Generated: ${progress.flagsGenerated}`}
                          color="primary"
                        />
                      </Stack>
                    </Paper>
                  )}

                  <Box sx={{ display: "flex", gap: 2 }}>
                    <Button
                      variant="outlined"
                      component={Link}
                      to="/reports"
                    >
                      View Reports
                    </Button>
                    <Button
                      variant="text"
                      onClick={() => {
                        setActiveStep(0);
                        setFile(null);
                        setDetection(null);
                        setReportTypes([]);
                        setManualReportType("");
                        setExportPeriod("full");
                        setDateFrom("");
                        setDateTo("");
                        setImportId(null);
                        setProgress(null);
                        setImporting(false);
                        setImportError(null);
                        setImportComplete(false);
                      }}
                    >
                      Upload Another
                    </Button>
                  </Box>
                </Box>
              )}

              {!importing && !importError && !importComplete && (
                <Box sx={{ textAlign: "center", py: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    Ready to import.
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      )}
    </Grid>
  );
}
