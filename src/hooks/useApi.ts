import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, getAccessToken } from "@/lib/api";

export function useDashboard(period?: string) {
  return useQuery({
    queryKey: ["dashboard", period],
    queryFn: () => api.get<any>(`/dashboard${period ? `?period=${period}` : ""}`),
    refetchInterval: 60000,
  });
}

export function useDashboardCounters() {
  return useQuery({
    queryKey: ["dashboard-counters"],
    queryFn: () => api.get<any>("/dashboard/counters"),
    refetchInterval: 60000,
  });
}

export function useFlags(params?: Record<string, string>) {
  const query = new URLSearchParams(params).toString();
  return useQuery({
    queryKey: ["flags", params],
    queryFn: () => api.get<any>(`/flags${query ? `?${query}` : ""}`),
  });
}

export function useFlag(id: string) {
  return useQuery({
    queryKey: ["flag", id],
    queryFn: () => api.get<any>(`/flags/${id}`),
    enabled: !!id,
  });
}

export function useAssignFlag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, assignedTo }: { id: string; assignedTo: string }) =>
      api.patch(`/flags/${id}/assign`, { assignedTo }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["flags"] }); qc.invalidateQueries({ queryKey: ["dashboard"] }); },
  });
}

export function useUpdateFlagStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, note }: { id: string; status: string; note?: string }) =>
      api.patch(`/flags/${id}/status`, { status, note }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["flags"] }); qc.invalidateQueries({ queryKey: ["dashboard"] }); },
  });
}

export function useEscalateFlag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, escalatedTo, note }: { id: string; escalatedTo: string; note?: string }) =>
      api.patch(`/flags/${id}/escalate`, { escalatedTo, note }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["flags"] }); },
  });
}

export function useFlagRules(reportType?: string) {
  return useQuery({
    queryKey: ["flag-rules", reportType],
    queryFn: () => api.get<any>(`/flags/rules${reportType ? `?reportType=${reportType}` : ""}`),
  });
}

export function useFlagCounts() {
  return useQuery({
    queryKey: ["flag-counts"],
    queryFn: () => api.get<any>("/flags/counts"),
    refetchInterval: 60000,
  });
}

export function useUploadMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ file, reportType, facilityId }: { file: File; reportType: string; facilityId?: string }) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("reportType", reportType);
      if (facilityId) formData.append("facilityId", facilityId);

      return fetch("/api/v1/uploads", {
        method: "POST",
        headers: { Authorization: `Bearer ${getAccessToken() || ""}` },
        body: formData,
      }).then((r) => r.json());
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["dashboard"] }); qc.invalidateQueries({ queryKey: ["flags"] }); },
  });
}

export function useImportLogs(params?: Record<string, string>) {
  const query = new URLSearchParams(params).toString();
  return useQuery({
    queryKey: ["import-logs", params],
    queryFn: () => api.get<any>(`/uploads/logs${query ? `?${query}` : ""}`),
  });
}

export function useSidebar() {
  return useQuery({
    queryKey: ["sidebar"],
    queryFn: () => api.get<any>("/settings/sidebar"),
    staleTime: Infinity,
  });
}

// User management
export function useUsers(params?: Record<string, string>) {
  const query = new URLSearchParams(params).toString();
  return useQuery({
    queryKey: ["users", params],
    queryFn: () => api.get<any>(`/users${query ? `?${query}` : ""}`),
  });
}

export function useUser(id: string) {
  return useQuery({
    queryKey: ["user", id],
    queryFn: () => api.get<any>(`/users/${id}`),
    enabled: !!id,
  });
}

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.post("/users", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
  });
}

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.patch(`/users/${id}`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["users"] }); qc.invalidateQueries({ queryKey: ["user"] }); },
  });
}

export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/users/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
  });
}

export function useUsersByRole(role?: string) {
  return useQuery({
    queryKey: ["users-by-role", role],
    queryFn: () => api.get<any>(`/users/roles?role=${role || ""}`),
    enabled: !!role,
  });
}

// Client management
export function useClients(params?: Record<string, string>) {
  const query = new URLSearchParams(params).toString();
  return useQuery({
    queryKey: ["clients", params],
    queryFn: () => api.get<any>(`/clients${query ? `?${query}` : ""}`),
  });
}

export function useClient(id: string) {
  return useQuery({
    queryKey: ["client", id],
    queryFn: () => api.get<any>(`/clients/${id}`),
    enabled: !!id,
  });
}

// Organizations (admin CRUD)
export function useOrganizations(params?: Record<string, string>) {
  const query = new URLSearchParams(params).toString();
  return useQuery({
    queryKey: ["organizations", params],
    queryFn: () => api.get<any>(`/organizations${query ? `?${query}` : ""}`),
  });
}

export function useCreateOrganization() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.post("/organizations", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["organizations"] }),
  });
}

export function useUpdateOrganization() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.patch(`/organizations/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["organizations"] }),
  });
}

// Facilities (admin CRUD)
export function useFacilities(params?: Record<string, string>) {
  const query = new URLSearchParams(params).toString();
  return useQuery({
    queryKey: ["facilities", params],
    queryFn: () => api.get<any>(`/facilities${query ? `?${query}` : ""}`),
  });
}

export function useFacilitiesAdmin(params?: Record<string, string>) {
  return useQuery({
    queryKey: ["facilities-admin", params],
    queryFn: () => api.get<any>("/facilities" + (params ? `?${new URLSearchParams(params).toString()}` : "")),
  });
}

export function useCreateFacility() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.post("/facilities", data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["facilities-admin"] }); qc.invalidateQueries({ queryKey: ["facilities"] }); },
  });
}

export function useUpdateFacility() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.patch(`/facilities/${id}`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["facilities-admin"] }); qc.invalidateQueries({ queryKey: ["facilities"] }); },
  });
}

export function useApproveFacility() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, action, reason }: { id: string; action: "approve" | "reject"; reason?: string }) =>
      api.post(`/facilities/${id}/${action}`, { reason }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["facilities-admin"] }); qc.invalidateQueries({ queryKey: ["facilities"] }); },
  });
}

export function useToggleFacilityStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post(`/facilities/${id}/toggle-status`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["facilities-admin"] }),
  });
}

// Lookups (dropdown selects)
export function useOrganizationsLookup() {
  return useQuery({
    queryKey: ["organizations-lookup"],
    queryFn: () => api.get<any>("/lookups/organizations"),
  });
}

export function useFacilitiesLookup(organizationId?: string) {
  return useQuery({
    queryKey: ["facilities-lookup", organizationId],
    queryFn: () => api.get<any>(`/lookups/facilities?organization=${organizationId}`),
    enabled: !!organizationId,
  });
}

// Report Records
export function useReportRecords(params?: Record<string, string>) {
  const query = new URLSearchParams(params).toString();
  return useQuery({
    queryKey: ["report-records", params],
    queryFn: () => api.get<any>(`/report-records${query ? `?${query}` : ""}`),
  });
}

// Audit Logs
export function useAuditLogs(params?: Record<string, string>) {
  const query = new URLSearchParams(params).toString();
  return useQuery({
    queryKey: ["audit-logs", params],
    queryFn: () => api.get<any>(`/audit${query ? `?${query}` : ""}`),
  });
}

// Clients mutations
export function useUpdateClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.patch(`/clients/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["clients"] }),
  });
}

// Follow-ups
export function useFollowups(params?: Record<string, string>) {
  const query = new URLSearchParams(params).toString();
  return useQuery({
    queryKey: ["followups", params],
    queryFn: () => api.get<any>(`/followups${query ? `?${query}` : ""}`),
  });
}

// KPIs
export function useKpis(params?: Record<string, string>) {
  const query = new URLSearchParams(params).toString();
  return useQuery({
    queryKey: ["kpis", params],
    queryFn: () => api.get<any>(`/kpis${query ? `?${query}` : ""}`),
  });
}

// Flag Rules Config
export function useFlagRulesConfigs() {
  return useQuery({
    queryKey: ["flag-rules-configs"],
    queryFn: () => api.get<any>("/flag-rules-config"),
  });
}

export function useFlagRulesConfig(reportType: string) {
  return useQuery({
    queryKey: ["flag-rules-config", reportType],
    queryFn: () => api.get<any>(`/flag-rules-config/${reportType}`),
    enabled: !!reportType,
  });
}

export function useUpdateFlagRulesConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ reportType, data }: { reportType: string; data: any }) =>
      api.put(`/flag-rules-config/${reportType}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["flag-rules-configs"] }),
  });
}

export function useTestFlagRules() {
  return useMutation({
    mutationFn: ({ reportType, sampleRow }: { reportType: string; sampleRow: any }) =>
      api.post(`/flag-rules-config/${reportType}/test`, { sampleRow }),
  });
}

// Audit log (single)
export function useAuditLog(id: string) {
  return useQuery({
    queryKey: ["audit-log", id],
    queryFn: () => api.get<any>(`/audit/${id}`),
    enabled: !!id,
  });
}

export function useCaseManagers() {
  return useQuery({
    queryKey: ["case-managers"],
    queryFn: () => api.get<any>("/reports/case-managers"),
  });
}
