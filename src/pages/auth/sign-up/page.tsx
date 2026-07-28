import { useEffect, useState, useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSnackbar } from "notistack";

import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Collapse,
  Divider,
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  TextField,
  Typography,
} from "@mui/material";

import Logo from "@/components/logo/logo";
import NiCheck from "@/icons/nexture/ni-check";
import NiCross from "@/icons/nexture/ni-cross";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";

const ROLES = ["Case Manager", "Peer Navigator", "DEC", "M&E", "VLC"];

const INITIAL_FORM = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  username: "",
  password: "",
  confirmPassword: "",
  organizationId: "",
  facilityId: "",
  newFacilityName: "",
  role: "",
  department: "",
  staffId: "",
};

export default function Page() {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [facilities, setFacilities] = useState<any[]>([]);
  const [loadingOrgs, setLoadingOrgs] = useState(true);
  const [loadingFacilities, setLoadingFacilities] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [signupRequiresApproval, setSignupRequiresApproval] = useState(false);
  const [addingNewFacility, setAddingNewFacility] = useState(false);
  const [fuzzyMatches, setFuzzyMatches] = useState<any[]>([]);
  const [fuzzyLoading, setFuzzyLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setLoadingOrgs(true);
    api.get<any>("/lookups/organizations").then((res) => {
      setOrganizations(res.data?.organizations || res.organizations || []);
    }).catch(() => {}).finally(() => setLoadingOrgs(false));
  }, []);

  useEffect(() => {
    if (!form.organizationId) {
      setFacilities([]);
      return;
    }
    setLoadingFacilities(true);
    setForm((f) => ({ ...f, facilityId: "", newFacilityName: "" }));
    setAddingNewFacility(false);
    setFuzzyMatches([]);
    api.get<any>(`/lookups/facilities?organization=${form.organizationId}`)
      .then((res) => {
        const list = res.data?.facilities || res.facilities || [];
        setFacilities(list);
        if (list.length === 0) {
          setAddingNewFacility(true);
        }
      })
      .catch(() => setFacilities([]))
      .finally(() => setLoadingFacilities(false));
  }, [form.organizationId]);

  const handleFuzzyMatch = useCallback((name: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!name.trim()) {
      setFuzzyMatches([]);
      return;
    }
    debounceRef.current = setTimeout(() => {
      setFuzzyLoading(true);
      api.get<any>(`/facilities/fuzzy-match?name=${encodeURIComponent(name)}&organizationId=${form.organizationId}`)
        .then((res) => setFuzzyMatches(res.data?.matches || res.matches || []))
        .catch(() => setFuzzyMatches([]))
        .finally(() => setFuzzyLoading(false));
    }, 500);
  }, [form.organizationId]);

  const handleChange = (field: string, value: string) => {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => { const n = { ...e }; delete n[field]; return n; });

    if (field === "newFacilityName") {
      handleFuzzyMatch(value);
    }
  };

  const handleOrgChange = (orgId: string) => {
    handleChange("organizationId", orgId);
  };

  const handleFacilitySelect = (value: string) => {
    if (value === "__new__") {
      setAddingNewFacility(true);
      setForm((f) => ({ ...f, facilityId: "", newFacilityName: "" }));
    } else {
      setAddingNewFacility(false);
      setForm((f) => ({ ...f, facilityId: value, newFacilityName: "" }));
      setFuzzyMatches([]);
    }
  };

  const handleFuzzySuggestionClick = (match: any) => {
    setForm((f) => ({ ...f, facilityId: match._id, newFacilityName: "" }));
    setFuzzyMatches([]);
    setAddingNewFacility(false);
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!form.firstName.trim()) e.firstName = "Required";
    if (!form.lastName.trim()) e.lastName = "Required";
    if (!form.email.trim()) e.email = "Required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Invalid email format";
    if (!form.phone.trim()) e.phone = "Required";
    if (!form.username.trim()) e.username = "Required";
    if (!form.password) e.password = "Required";
    else {
      if (form.password.length < 8) e.password = "At least 8 characters";
      else if (!/[A-Z]/.test(form.password) || !/[a-z]/.test(form.password)) e.password = "Needs uppercase and lowercase";
      else if (!/[^A-Za-z0-9 ]/.test(form.password)) e.password = "Needs a special character";
    }
    if (!form.confirmPassword) e.confirmPassword = "Required";
    else if (form.password !== form.confirmPassword) e.confirmPassword = "Passwords do not match";
    if (!form.organizationId) e.organizationId = "Required";
    if (!addingNewFacility && !form.facilityId) e.facilityId = "Required";
    if (addingNewFacility && !form.newFacilityName.trim()) e.newFacilityName = "Required";
    if (!form.role) e.role = "Required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const getPasswordStrength = () => {
    const p = form.password;
    let score = 0;
    if (p.length >= 8) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[a-z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[^A-Za-z0-9 ]/.test(p)) score++;
    return score;
  };

  const strengthLabel = (s: number) => {
    if (s <= 2) return { text: "Weak", color: "error" as const };
    if (s <= 3) return { text: "Fair", color: "warning" as const };
    if (s <= 4) return { text: "Good", color: "info" as const };
    return { text: "Strong", color: "success" as const };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const payload: any = {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        username: form.username.trim(),
        password: form.password,
        organizationId: form.organizationId,
        role: form.role,
      };
      if (addingNewFacility && form.newFacilityName.trim()) {
        payload.requestedFacilityName = form.newFacilityName.trim();
      } else if (form.facilityId) {
        payload.facilityId = form.facilityId;
      }
      if (form.department.trim()) payload.department = form.department.trim();
      if (form.staffId.trim()) payload.staffId = form.staffId.trim();

      const res = await api.post<any>("/auth/signup", payload);
      const data = res.data || res;
      if (data.requiresApproval) {
        setSignupRequiresApproval(true);
        setSignupSuccess(true);
      } else {
        enqueueSnackbar("Account created! Please sign in.", { variant: "success" });
        navigate("/auth/sign-in");
      }
    } catch (err: any) {
      enqueueSnackbar(err.message || "Signup failed. Please try again.", { variant: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  const isPasswordValid = (check: string) => {
    switch (check) {
      case "length": return form.password.length >= 8;
      case "case": return /[A-Z]/.test(form.password) && /[a-z]/.test(form.password);
      case "special": return /[^A-Za-z0-9 ]/.test(form.password);
      default: return false;
    }
  };

  if (signupSuccess && signupRequiresApproval) {
    return (
      <Box className="bg-waves flex min-h-screen w-full items-center justify-center bg-cover bg-center p-4">
        <Paper elevation={3} className="bg-background-paper shadow-darker-xs w-[32rem] max-w-full rounded-4xl py-14">
          <Box className="flex flex-col items-center gap-6 px-8 sm:px-14">
            <Logo classNameMobile="hidden" />
            <Typography variant="h4" component="h1" className="text-center">
              Thanks for signing up!
            </Typography>
            <Alert severity="info" className="w-full">
              Your account is pending approval. You will receive access once an administrator reviews your request. You
              will be notified via email when your account is approved.
            </Alert>
            <Link to="/auth/sign-in" className="link-primary link-underline-hover font-semibold">
              Go to Sign In
            </Link>
          </Box>
        </Paper>
      </Box>
    );
  }

  const strength = getPasswordStrength();
  const { text: strengthText, color: strengthColor } = strengthLabel(strength);

  return (
    <Box className="bg-waves flex min-h-screen w-full items-center justify-center bg-cover bg-center p-4">
      <Paper elevation={3} className="bg-background-paper shadow-darker-xs w-[32rem] max-w-full rounded-4xl py-14">
        <Box className="flex flex-col gap-4 px-8 sm:px-14">
          <Box className="flex flex-col">
            <Box className="mb-8 flex justify-center">
              <Logo classNameMobile="hidden" />
            </Box>

            <Box className="flex flex-col">
              <Typography variant="h1" component="h1" className="mb-2">
                Sign up
              </Typography>
              <Typography variant="body1" className="text-text-primary mb-6">
                Create your account in just a few steps.
              </Typography>

              <Box component="form" onSubmit={handleSubmit} className="flex flex-col gap-4">
                <Box className="flex gap-3">
                  <TextField
                    variant="standard"
                    label="First Name"
                    required
                    fullWidth
                    value={form.firstName}
                    onChange={(e) => handleChange("firstName", e.target.value)}
                    error={!!errors.firstName}
                    helperText={errors.firstName}
                  />
                  <TextField
                    variant="standard"
                    label="Last Name"
                    required
                    fullWidth
                    value={form.lastName}
                    onChange={(e) => handleChange("lastName", e.target.value)}
                    error={!!errors.lastName}
                    helperText={errors.lastName}
                  />
                </Box>

                <TextField
                  variant="standard"
                  label="Email"
                  type="email"
                  required
                  fullWidth
                  value={form.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  error={!!errors.email}
                  helperText={errors.email}
                />

                <TextField
                  variant="standard"
                  label="Phone Number"
                  required
                  fullWidth
                  value={form.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  error={!!errors.phone}
                  helperText={errors.phone}
                />

                <TextField
                  variant="standard"
                  label="Username"
                  required
                  fullWidth
                  value={form.username}
                  onChange={(e) => handleChange("username", e.target.value)}
                  error={!!errors.username}
                  helperText={errors.username}
                />

                <TextField
                  variant="standard"
                  label="Password"
                  type="password"
                  required
                  fullWidth
                  autoComplete="new-password"
                  value={form.password}
                  onChange={(e) => handleChange("password", e.target.value)}
                  error={!!errors.password}
                  helperText={errors.password}
                />

                {form.password && (
                  <Box className="flex flex-col gap-1">
                    <Box className="flex items-center gap-2">
                      <Box className="flex-1 h-1.5 rounded-full bg-grey-100 overflow-hidden">
                        <Box
                          className="h-full rounded-full transition-all"
                          sx={{ width: `${(strength / 5) * 100}%`, bgcolor: `${strengthColor}.main` }}
                        />
                      </Box>
                      <Typography variant="caption" className={`text-${strengthColor}`}>
                        {strengthText}
                      </Typography>
                    </Box>
                    <Box className="flex flex-wrap gap-x-4 gap-y-1">
                      <Box className="flex items-center gap-1">
                        <Box
                          className={cn(
                            "h-3.5 w-3.5 rounded-sm flex items-center justify-center",
                            isPasswordValid("length") ? "bg-success text-text-contrast" : "bg-grey-100"
                          )}
                        >
                          {isPasswordValid("length") ? <NiCheck size="tiny" /> : <NiCross size="tiny" />}
                        </Box>
                        <Typography variant="caption" className={cn(isPasswordValid("length") && "text-success font-semibold")}>
                          8+ characters
                        </Typography>
                      </Box>
                      <Box className="flex items-center gap-1">
                        <Box
                          className={cn(
                            "h-3.5 w-3.5 rounded-sm flex items-center justify-center",
                            isPasswordValid("case") ? "bg-success text-text-contrast" : "bg-grey-100"
                          )}
                        >
                          {isPasswordValid("case") ? <NiCheck size="tiny" /> : <NiCross size="tiny" />}
                        </Box>
                        <Typography variant="caption" className={cn(isPasswordValid("case") && "text-success font-semibold")}>
                          Upper & lower
                        </Typography>
                      </Box>
                      <Box className="flex items-center gap-1">
                        <Box
                          className={cn(
                            "h-3.5 w-3.5 rounded-sm flex items-center justify-center",
                            isPasswordValid("special") ? "bg-success text-text-contrast" : "bg-grey-100"
                          )}
                        >
                          {isPasswordValid("special") ? <NiCheck size="tiny" /> : <NiCross size="tiny" />}
                        </Box>
                        <Typography variant="caption" className={cn(isPasswordValid("special") && "text-success font-semibold")}>
                          Special char
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                )}

                <TextField
                  variant="standard"
                  label="Confirm Password"
                  type="password"
                  required
                  fullWidth
                  autoComplete="new-password"
                  value={form.confirmPassword}
                  onChange={(e) => handleChange("confirmPassword", e.target.value)}
                  error={!!errors.confirmPassword}
                  helperText={errors.confirmPassword}
                />

                <FormControl variant="standard" fullWidth error={!!errors.organizationId}>
                  <InputLabel>Implementing Partner *</InputLabel>
                  <Select
                    value={form.organizationId}
                    onChange={(e) => handleOrgChange(e.target.value)}
                    disabled={loadingOrgs}
                  >
                    {loadingOrgs ? (
                      <MenuItem value="" disabled>
                        <CircularProgress size={18} /> <span className="ml-2">Loading...</span>
                      </MenuItem>
                    ) : (
                      organizations.map((org: any) => (
                        <MenuItem key={org._id} value={org._id}>
                          {org.name}
                        </MenuItem>
                      ))
                    )}
                  </Select>
                  {errors.organizationId && <FormHelperText>{errors.organizationId}</FormHelperText>}
                </FormControl>

                <Collapse in={!!form.organizationId}>
                  <Box className="flex flex-col gap-1">
                    {addingNewFacility ? (
                      <Box className="flex flex-col gap-1">
                        <TextField
                          variant="standard"
                          label="Facility Name"
                          required
                          fullWidth
                          value={form.newFacilityName}
                          onChange={(e) => handleChange("newFacilityName", e.target.value)}
                          error={!!errors.newFacilityName}
                          helperText={errors.newFacilityName || "Please make sure this is the correct, official name of your hospital/facility"}
                        />
                        {fuzzyLoading && (
                          <Box className="flex items-center gap-2">
                            <CircularProgress size={14} />
                            <Typography variant="caption" className="text-text-secondary">Searching...</Typography>
                          </Box>
                        )}
                        {fuzzyMatches.length > 0 && (
                          <Box className="flex flex-wrap gap-1 mt-1">
                            <Typography variant="caption" className="text-text-secondary w-full">Did you mean:</Typography>
                            {fuzzyMatches.map((m: any) => (
                              <Chip
                                key={m._id}
                                label={m.name}
                                size="small"
                                clickable
                                onClick={() => handleFuzzySuggestionClick(m)}
                                variant="outlined"
                              />
                            ))}
                          </Box>
                        )}
                      </Box>
                    ) : (
                      <FormControl variant="standard" fullWidth error={!!errors.facilityId}>
                        <InputLabel>Facility *</InputLabel>
                        <Select
                          value={form.facilityId}
                          onChange={(e) => handleFacilitySelect(e.target.value)}
                          disabled={loadingFacilities}
                        >
                          {loadingFacilities ? (
                            <MenuItem value="" disabled>
                              <CircularProgress size={18} /> <span className="ml-2">Loading...</span>
                            </MenuItem>
                          ) : (
                            <>
                              {facilities.map((f: any) => (
                                <MenuItem key={f._id} value={f._id}>
                                  {f.name}
                                </MenuItem>
                              ))}
                              <MenuItem value="__new__">
                                <Typography variant="body2" className="text-primary font-semibold">
                                  + My facility isn't listed — add it
                                </Typography>
                              </MenuItem>
                            </>
                          )}
                        </Select>
                        {errors.facilityId && <FormHelperText>{errors.facilityId}</FormHelperText>}
                      </FormControl>
                    )}
                  </Box>
                </Collapse>

                {facilities.length === 0 && form.organizationId && !loadingFacilities && addingNewFacility && (
                  <Alert severity="info">
                    No facilities found yet. You can add your hospital below.
                  </Alert>
                )}

                <FormControl variant="standard" fullWidth error={!!errors.role}>
                  <InputLabel>Role *</InputLabel>
                  <Select
                    value={form.role}
                    onChange={(e) => handleChange("role", e.target.value)}
                  >
                    {ROLES.map((r) => (
                      <MenuItem key={r} value={r}>
                        {r}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.role && <FormHelperText>{errors.role}</FormHelperText>}
                </FormControl>

                <TextField
                  variant="standard"
                  label="Department"
                  fullWidth
                  value={form.department}
                  onChange={(e) => handleChange("department", e.target.value)}
                />

                <TextField
                  variant="standard"
                  label="Staff ID"
                  fullWidth
                  value={form.staffId}
                  onChange={(e) => handleChange("staffId", e.target.value)}
                />

                <Button type="submit" variant="contained" fullWidth disabled={submitting} className="mt-2">
                  {submitting ? <CircularProgress size={22} /> : "Sign Up"}
                </Button>

                <Typography variant="body2" className="text-text-secondary text-center">
                  By signing up, you agree to the{" "}
                  <Link target="_blank" to="/auth/terms-and-conditions" className="link-primary link-underline-hover">
                    Terms and Conditions
                  </Link>{" "}
                  and{" "}
                  <Link target="_blank" to="/auth/privacy-policy" className="link-primary link-underline-hover">
                    Privacy Policy
                  </Link>
                  .
                </Typography>
              </Box>

              <Divider className="text-text-secondary my-4" />

              <Box className="flex flex-col">
                <Typography variant="h6" component="h6">
                  Sign in
                </Typography>
                <Typography variant="body1" className="text-text-secondary">
                  If you already have an account, please{" "}
                  <Link to="/auth/sign-in" className="link-primary link-underline-hover">
                    sign in
                  </Link>
                  .
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}
