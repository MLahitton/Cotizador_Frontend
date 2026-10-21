import { apiRequest } from "@/lib/http/api-client";
import { ApiError } from "@/lib/http/api-error";
import { isProjectDiagnosisResponse, type ProjectDiagnosisResponse } from "./project-diagnosis-types";

export async function getProjectDiagnosis(projectId: string): Promise<ProjectDiagnosisResponse> {
  const response = await apiRequest(
    `/api/v2/projects/${encodeURIComponent(projectId)}/diagnosis`,
    { authenticated: true },
  );
  if (!isProjectDiagnosisResponse(response)) {
    throw new ApiError({
      status: 0,
      title: "Respuesta inválida",
      detail: "El servidor devolvió una respuesta inesperada al consultar el diagnóstico del proyecto.",
    });
  }
  return response;
}
