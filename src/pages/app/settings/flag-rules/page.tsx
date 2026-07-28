import { useState } from "react";
import { Link } from "react-router-dom";
import {
  useFlagRulesConfigs,
  useFlagRulesConfig,
  useUpdateFlagRulesConfig,
  useTestFlagRules,
} from "@/hooks/useApi";
import { useSnackbar } from "notistack";

import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import SaveIcon from "@mui/icons-material/Save";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Breadcrumbs,
  Button,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Skeleton,
  Switch,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import { DataGrid, GridColDef } from "@mui/x-data-grid";

const REPORT_TYPES = [
  { key: "art_refill", label: "ART Refill" },
  { key: "next_refill", label: "Next Refill" },
  { key: "iit", label: "IIT Tracking" },
  { key: "viral_load", label: "Viral Load" },
  { key: "eac", label: "EAC" },
  { key: "tpt", label: "TPT" },
  { key: "tb_screening", label: "TB Screening" },
  { key: "biometric", label: "Biometrics" },
  { key: "cervical_cancer", label: "Cervical Cancer" },
  { key: "dsd", label: "DSD" },
  { key: "data_quality", label: "Data Quality" },
  { key: "other", label: "Other" },
];

const PRIORITY_COLORS: Record<string, "default" | "info" | "warning" | "error" | "success"> = {
  low: "success",
  medium: "info",
  high: "warning",
  critical: "error",
};

interface Column {
  key: string;
  label: string;
  dataType: string;
  required: boolean;
  aliases: string[];
}

interface Formula {
  key: string;
  label: string;
  inputFields: string[];
  expression: string;
  description: string;
}

interface FlagRule {
  code: string;
  label: string;
  priority: string;
  condition: string;
  usesFields: string[];
  reasonTemplate: string;
  recommendation: string;
  active: boolean;
}

export default function Page() {
  const [selectedType, setSelectedType] = useState<string>("");
  const { data: configsData, isLoading: configsLoading } = useFlagRulesConfigs();

  const configs = configsData?.data?.configs || [];

  return (
    <Grid container spacing={5}>
      <Grid size={12}>
        <Typography variant="h1" component="h1" className="mb-0">
          Flag Rules & Formulas
        </Typography>
        <Breadcrumbs>
          <Link color="inherit" to="/dashboards/default">
            Home
          </Link>
          <Link color="inherit" to="/settings">
            Settings
          </Link>
          <Typography variant="body2">Flag Rules</Typography>
        </Breadcrumbs>
      </Grid>

      <Grid size={12}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 4 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" className="mb-2">
                  Report Types
                </Typography>
                {configsLoading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} variant="rounded" height={44} className="mb-1" />
                  ))
                ) : (
                  <div className="flex flex-col gap-1">
                    {REPORT_TYPES.map((rt) => {
                      const cfg = configs.find((c: any) => c.reportType === rt.key);
                      return (
                        <Card
                          key={rt.key}
                          variant="outlined"
                          sx={{
                            borderColor: selectedType === rt.key ? "primary.main" : "divider",
                            borderWidth: selectedType === rt.key ? 2 : 1,
                          }}
                        >
                          <CardActionArea onClick={() => setSelectedType(rt.key)} sx={{ py: 1, px: 2 }}>
                            <div className="flex items-center justify-between">
                              <Typography variant="body2" fontWeight={selectedType === rt.key ? 700 : 400}>
                                {rt.label}
                              </Typography>
                              {cfg && (
                                <div className="flex gap-1">
                                  <Chip label={`${cfg.columns?.length || 0} cols`} size="small" variant="outlined" />
                                  <Chip label={`${cfg.flagRules?.length || 0} rules`} size="small" variant="outlined" />
                                </div>
                              )}
                            </div>
                          </CardActionArea>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 8 }}>
            {selectedType ? (
              <ConfigPanel reportType={selectedType} />
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <Typography variant="h6" color="text.secondary">
                    Select a report type to view and configure
                  </Typography>
                </CardContent>
              </Card>
            )}
          </Grid>
        </Grid>
      </Grid>
    </Grid>
  );
}

function ConfigPanel({ reportType }: { reportType: string }) {
  const [tab, setTab] = useState(0);
  const { data: configData, isLoading } = useFlagRulesConfig(reportType);
  const { enqueueSnackbar } = useSnackbar();
  const updateConfig = useUpdateFlagRulesConfig();

  const config = configData?.data?.config;

  const handleSave = (section: string, data: any) => {
    updateConfig.mutate(
      { reportType, data },
      {
        onSuccess: () => {
          enqueueSnackbar(`${section} updated successfully`, { variant: "success" });
        },
        onError: (err: any) => {
          enqueueSnackbar(err.message || "Failed to save", { variant: "error" });
        },
      }
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent>
          <Skeleton variant="rounded" height={400} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} className="mb-4">
          <Tab label={`Columns (${config?.columns?.length || 0})`} />
          <Tab label={`Formulas (${config?.formulas?.length || 0})`} />
          <Tab label={`Flag Rules (${config?.flagRules?.length || 0})`} />
        </Tabs>

        {tab === 0 && (
          <ColumnsTab
            columns={config?.columns || []}
            onSave={(cols) => handleSave("Columns", { columns: cols })}
          />
        )}
        {tab === 1 && (
          <FormulasTab
            formulas={config?.formulas || []}
            columns={config?.columns || []}
            onSave={(f) => handleSave("Formulas", { formulas: f })}
          />
        )}
        {tab === 2 && (
          <FlagRulesTab
            rules={config?.flagRules || []}
            columns={config?.columns || []}
            onSave={(r) => handleSave("Flag Rules", { flagRules: r })}
          />
        )}
      </CardContent>

      <TestPanel reportType={reportType} columns={config?.columns || []} />
    </Card>
  );
}

function ColumnsTab({ columns, onSave }: { columns: Column[]; onSave: (c: Column[]) => void }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [form, setForm] = useState<Column>({ key: "", label: "", dataType: "string", required: false, aliases: [] });
  const [localColumns, setLocalColumns] = useState<Column[]>(columns);

  const handleAdd = () => {
    setEditIdx(null);
    setForm({ key: "", label: "", dataType: "string", required: false, aliases: [] });
    setDialogOpen(true);
  };

  const handleEdit = (idx: number) => {
    setEditIdx(idx);
    setForm({ ...localColumns[idx] });
    setDialogOpen(true);
  };

  const handleSaveItem = () => {
    const next = [...localColumns];
    if (editIdx !== null) {
      next[editIdx] = form;
    } else {
      next.push(form);
    }
    setLocalColumns(next);
    setDialogOpen(false);
  };

  const handleDelete = (idx: number) => {
    const next = localColumns.filter((_, i) => i !== idx);
    setLocalColumns(next);
  };

  const handleSaveAll = () => {
    onSave(localColumns);
  };

  const cols: GridColDef[] = [
    { field: "key", headerName: "Field Key", flex: 1 },
    { field: "label", headerName: "Label", flex: 1 },
    {
      field: "dataType",
      headerName: "Data Type",
      width: 120,
      renderCell: (params) => <Chip label={params.value} size="small" color="primary" variant="outlined" />,
    },
    {
      field: "required",
      headerName: "Required",
      width: 100,
      renderCell: (params) => (
        <Chip
          label={params.value ? "Required" : "Optional"}
          size="small"
          color={params.value ? "warning" : "default"}
          variant="outlined"
        />
      ),
    },
    {
      field: "aliases",
      headerName: "Aliases",
      flex: 1,
      valueGetter: (_v: unknown, row: Column) => (row.aliases || []).join(", "),
    },
    {
      field: "actions",
      headerName: "",
      width: 100,
      renderCell: (params) => (
        <div>
          <IconButton size="small" onClick={() => handleEdit(params.row.id)}>
            Edit
          </IconButton>
          <IconButton size="small" color="error" onClick={() => handleDelete(params.row.id)}>
            <DeleteIcon fontSize="small" />
          </IconButton>
        </div>
      ),
    },
  ];

  const rows = localColumns.map((c, i) => ({ ...c, id: c.key || i }));

  return (
    <>
      <div className="flex justify-between items-center mb-3">
        <Typography variant="h6">Columns</Typography>
        <div className="flex gap-2">
          <Button variant="outlined" startIcon={<AddIcon />} onClick={handleAdd}>
            Add Column
          </Button>
          <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSaveAll}>
            Save
          </Button>
        </div>
      </div>
      <DataGrid
        rows={rows}
        columns={cols}
        disableRowSelectionOnClick
        autoHeight
        getRowId={(row) => row.id}
        sx={{ "& .MuiDataGrid-cell": { py: 1 } }}
      />

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editIdx !== null ? "Edit Column" : "Add Column"}</DialogTitle>
        <DialogContent>
          <div className="flex flex-col gap-3 mt-2">
            <TextField
              variant="standard"
              label="Field Key"
              fullWidth
              value={form.key}
              onChange={(e) => setForm({ ...form, key: e.target.value })}
            />
            <TextField
              variant="standard"
              label="Label"
              fullWidth
              value={form.label}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
            />
            <FormControl variant="standard" fullWidth>
              <InputLabel>Data Type</InputLabel>
              <Select
                value={form.dataType}
                onChange={(e) => setForm({ ...form, dataType: e.target.value })}
              >
                <MenuItem value="string">String</MenuItem>
                <MenuItem value="number">Number</MenuItem>
                <MenuItem value="date">Date</MenuItem>
                <MenuItem value="enum">Enum</MenuItem>
              </Select>
            </FormControl>
            <FormControlLabel
              control={
                <Switch
                  checked={form.required}
                  onChange={(e) => setForm({ ...form, required: e.target.checked })}
                />
              }
              label="Required"
            />
            <TextField
              variant="standard"
              label="Aliases (comma-separated)"
              fullWidth
              value={(form.aliases || []).join(", ")}
              onChange={(e) =>
                setForm({ ...form, aliases: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })
              }
            />
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveItem} variant="contained">
            {editIdx !== null ? "Update" : "Add"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

function FormulasTab({
  formulas,
  columns,
  onSave,
}: {
  formulas: Formula[];
  columns: Column[];
  onSave: (f: Formula[]) => void;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [form, setForm] = useState<Formula>({ key: "", label: "", inputFields: [], expression: "", description: "" });
  const [localFormulas, setLocalFormulas] = useState<Formula[]>(formulas);

  const handleAdd = () => {
    setEditIdx(null);
    setForm({ key: "", label: "", inputFields: [], expression: "", description: "" });
    setDialogOpen(true);
  };

  const handleEdit = (idx: number) => {
    setEditIdx(idx);
    setForm({ ...localFormulas[idx] });
    setDialogOpen(true);
  };

  const handleSaveItem = () => {
    const next = [...localFormulas];
    if (editIdx !== null) {
      next[editIdx] = form;
    } else {
      next.push(form);
    }
    setLocalFormulas(next);
    setDialogOpen(false);
  };

  const handleDelete = (idx: number) => {
    setLocalFormulas(localFormulas.filter((_, i) => i !== idx));
  };

  const cols: GridColDef[] = [
    { field: "key", headerName: "Key", flex: 1 },
    { field: "label", headerName: "Label", flex: 1 },
    {
      field: "inputFields",
      headerName: "Input Fields",
      flex: 1,
      renderCell: (params) => (
        <div className="flex flex-wrap gap-1">
          {(params.value || []).map((f: string) => (
            <Chip key={f} label={f} size="small" variant="outlined" />
          ))}
        </div>
      ),
    },
    { field: "expression", headerName: "Expression", flex: 1 },
    { field: "description", headerName: "Description", flex: 1 },
    {
      field: "actions",
      headerName: "",
      width: 100,
      renderCell: (params) => (
        <div>
          <IconButton size="small" onClick={() => handleEdit(params.row.id)}>
            Edit
          </IconButton>
          <IconButton size="small" color="error" onClick={() => handleDelete(params.row.id)}>
            <DeleteIcon fontSize="small" />
          </IconButton>
        </div>
      ),
    },
  ];

  const rows = localFormulas.map((f, i) => ({ ...f, id: f.key || i }));

  return (
    <>
      <div className="flex justify-between items-center mb-3">
        <Typography variant="h6">Formulas</Typography>
        <div className="flex gap-2">
          <Button variant="outlined" startIcon={<AddIcon />} onClick={handleAdd}>
            Add Formula
          </Button>
          <Button variant="contained" startIcon={<SaveIcon />} onClick={() => onSave(localFormulas)}>
            Save
          </Button>
        </div>
      </div>
      <DataGrid
        rows={rows}
        columns={cols}
        disableRowSelectionOnClick
        autoHeight
        getRowId={(row) => row.id}
        sx={{ "& .MuiDataGrid-cell": { py: 1 } }}
      />

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editIdx !== null ? "Edit Formula" : "Add Formula"}</DialogTitle>
        <DialogContent>
          <div className="flex flex-col gap-3 mt-2">
            <TextField
              variant="standard"
              label="Key"
              fullWidth
              value={form.key}
              onChange={(e) => setForm({ ...form, key: e.target.value })}
            />
            <TextField
              variant="standard"
              label="Label"
              fullWidth
              value={form.label}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
            />
            <FormControl variant="standard" fullWidth>
              <InputLabel>Input Fields</InputLabel>
              <Select
                multiple
                value={form.inputFields}
                onChange={(e) => setForm({ ...form, inputFields: e.target.value as string[] })}
                renderValue={(selected) => (selected as string[]).join(", ")}
              >
                {columns.map((col) => (
                  <MenuItem key={col.key} value={col.key}>
                    {col.label} ({col.key})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              variant="standard"
              label="Expression"
              fullWidth
              multiline
              rows={3}
              value={form.expression}
              onChange={(e) => setForm({ ...form, expression: e.target.value })}
            />
            <TextField
              variant="standard"
              label="Description"
              fullWidth
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveItem} variant="contained">
            {editIdx !== null ? "Update" : "Add"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

function FlagRulesTab({
  rules,
  columns,
  onSave,
}: {
  rules: FlagRule[];
  columns: Column[];
  onSave: (r: FlagRule[]) => void;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [form, setForm] = useState<FlagRule>({
    code: "",
    label: "",
    priority: "medium",
    condition: "",
    usesFields: [],
    reasonTemplate: "",
    recommendation: "",
    active: true,
  });
  const [localRules, setLocalRules] = useState<FlagRule[]>(rules);

  const handleAdd = () => {
    setEditIdx(null);
    setForm({
      code: "",
      label: "",
      priority: "medium",
      condition: "",
      usesFields: [],
      reasonTemplate: "",
      recommendation: "",
      active: true,
    });
    setDialogOpen(true);
  };

  const handleEdit = (idx: number) => {
    setEditIdx(idx);
    setForm({ ...localRules[idx] });
    setDialogOpen(true);
  };

  const handleSaveItem = () => {
    const next = [...localRules];
    if (editIdx !== null) {
      next[editIdx] = form;
    } else {
      next.push(form);
    }
    setLocalRules(next);
    setDialogOpen(false);
  };

  const handleDelete = (idx: number) => {
    setLocalRules(localRules.filter((_, i) => i !== idx));
  };

  const handleToggleActive = (idx: number) => {
    const next = [...localRules];
    next[idx] = { ...next[idx], active: !next[idx].active };
    setLocalRules(next);
  };

  const cols: GridColDef[] = [
    { field: "code", headerName: "Code", flex: 1 },
    { field: "label", headerName: "Label", flex: 1 },
    {
      field: "priority",
      headerName: "Priority",
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value}
          size="small"
          color={PRIORITY_COLORS[params.value] || "default"}
          variant="filled"
        />
      ),
    },
    { field: "condition", headerName: "Condition", flex: 1 },
    {
      field: "active",
      headerName: "Active",
      width: 80,
      renderCell: (params) => (
        <Switch
          checked={params.value}
          size="small"
          onChange={() => {
            const idx = localRules.findIndex((r) => r.code === params.row.code);
            if (idx !== -1) handleToggleActive(idx);
          }}
        />
      ),
    },
    {
      field: "actions",
      headerName: "",
      width: 100,
      renderCell: (params) => (
        <div>
          <IconButton size="small" onClick={() => handleEdit(params.row.id)}>
            Edit
          </IconButton>
          <IconButton size="small" color="error" onClick={() => handleDelete(params.row.id)}>
            <DeleteIcon fontSize="small" />
          </IconButton>
        </div>
      ),
    },
  ];

  const rows = localRules.map((r, i) => ({ ...r, id: r.code || i }));

  return (
    <>
      <div className="flex justify-between items-center mb-3">
        <Typography variant="h6">Flag Rules</Typography>
        <div className="flex gap-2">
          <Button variant="outlined" startIcon={<AddIcon />} onClick={handleAdd}>
            Add Rule
          </Button>
          <Button variant="contained" startIcon={<SaveIcon />} onClick={() => onSave(localRules)}>
            Save
          </Button>
        </div>
      </div>
      <DataGrid
        rows={rows}
        columns={cols}
        disableRowSelectionOnClick
        autoHeight
        getRowId={(row) => row.id}
        sx={{ "& .MuiDataGrid-cell": { py: 1 } }}
      />

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editIdx !== null ? "Edit Flag Rule" : "Add Flag Rule"}</DialogTitle>
        <DialogContent>
          <div className="flex flex-col gap-3 mt-2">
            <TextField
              variant="standard"
              label="Code"
              fullWidth
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
            />
            <TextField
              variant="standard"
              label="Label"
              fullWidth
              value={form.label}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
            />
            <FormControl variant="standard" fullWidth>
              <InputLabel>Priority</InputLabel>
              <Select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
              >
                <MenuItem value="low">Low</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="high">High</MenuItem>
                <MenuItem value="critical">Critical</MenuItem>
              </Select>
            </FormControl>
            <TextField
              variant="standard"
              label="Condition (JS expression)"
              fullWidth
              multiline
              rows={3}
              value={form.condition}
              onChange={(e) => setForm({ ...form, condition: e.target.value })}
            />
            <FormControl variant="standard" fullWidth>
              <InputLabel>Uses Fields</InputLabel>
              <Select
                multiple
                value={form.usesFields}
                onChange={(e) => setForm({ ...form, usesFields: e.target.value as string[] })}
                renderValue={(selected) => (selected as string[]).join(", ")}
              >
                {columns.map((col) => (
                  <MenuItem key={col.key} value={col.key}>
                    {col.label} ({col.key})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              variant="standard"
              label="Reason Template"
              fullWidth
              value={form.reasonTemplate}
              onChange={(e) => setForm({ ...form, reasonTemplate: e.target.value })}
            />
            <TextField
              variant="standard"
              label="Recommendation"
              fullWidth
              value={form.recommendation}
              onChange={(e) => setForm({ ...form, recommendation: e.target.value })}
            />
            <FormControlLabel
              control={
                <Switch checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
              }
              label="Active"
            />
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveItem} variant="contained">
            {editIdx !== null ? "Update" : "Add"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

function TestPanel({
  reportType,
  columns,
}: {
  reportType: string;
  columns: Column[];
}) {
  const [expanded, setExpanded] = useState(false);
  const [sampleRow, setSampleRow] = useState<Record<string, string>>({});
  const testRules = useTestFlagRules();
  const [result, setResult] = useState<any>(null);

  const handleRunTest = () => {
    const parsed: Record<string, any> = {};
    for (const [k, v] of Object.entries(sampleRow)) {
      if (v === "") {
        parsed[k] = null;
      } else {
        parsed[k] = v;
      }
    }

    testRules.mutate(
      { reportType, sampleRow: parsed },
      {
        onSuccess: (data: any) => {
          setResult(data?.data);
        },
        onError: () => {
          setResult(null);
        },
      }
    );
  };

  return (
    <Accordion expanded={expanded} onChange={(_, exp) => setExpanded(exp)} sx={{ mx: 2, mb: 2 }}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography variant="h6">Test with Sample Row</Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Grid container spacing={2} className="mb-4">
          {columns.map((col) => (
            <Grid key={col.key} size={{ xs: 12, sm: 6, md: 4 }}>
              <TextField
                variant="standard"
                label={col.label}
                fullWidth
                value={sampleRow[col.key] || ""}
                onChange={(e) => setSampleRow({ ...sampleRow, [col.key]: e.target.value })}
                placeholder={col.dataType}
              />
            </Grid>
          ))}
        </Grid>

        <Button
          variant="contained"
          onClick={handleRunTest}
          disabled={testRules.isPending}
          className="mb-3"
        >
          {testRules.isPending ? "Running..." : "Run Test"}
        </Button>

        {result && (
          <div className="flex flex-col gap-3">
            {Object.keys(result.computedValues || {}).length > 0 && (
              <div>
                <Typography variant="subtitle2" className="mb-1">
                  Computed Values
                </Typography>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(result.computedValues).map(([k, v]) => (
                    <Chip key={k} label={`${k}: ${JSON.stringify(v)}`} variant="outlined" size="small" />
                  ))}
                </div>
              </div>
            )}

            {(result.firedFlags || []).length > 0 && (
              <div>
                <Typography variant="subtitle2" className="mb-1">
                  Fired Flags
                </Typography>
                {result.firedFlags.map((flag: any, i: number) => (
                  <Alert key={i} severity={flag.priority === "critical" ? "error" : flag.priority === "high" ? "warning" : "info"} className="mb-1">
                    <strong>{flag.label}</strong> ({flag.code}) — {flag.reason}
                    {flag.recommendation && <><br />Recommendation: {flag.recommendation}</>}
                  </Alert>
                ))}
              </div>
            )}

            {(result.firedFlags || []).length === 0 && (
              <Alert severity="success">No flags fired for this sample row.</Alert>
            )}
          </div>
        )}
      </AccordionDetails>
    </Accordion>
  );
}
