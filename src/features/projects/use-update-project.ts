"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { classifyProjectUpdateError } from "@/features/projects/project-update-error";
import {
  normalizeProjectCode,
  toUpdateProjectRequest,
  validateProjectEditableFields,
} from "@/features/projects/project-form-validation";
import { updateProject } from "@/features/projects/projects-api";
import type {
  ProjectDetails,
  ProjectFormErrors,
  ProjectFormValues,
  UpdateProjectRequest,
} from "@/features/projects/projects-types";

export type ProjectUpdateResult =
  | { status: "updated"; project: ProjectDetails }
  | { status: "unchanged" }
  | { status: "failed" }
  | { status: "stale" };

export interface UseUpdateProjectResult {
  values: ProjectFormValues;
  errors: ProjectFormErrors;
  submitError: string | null;
  successMessage: string | null;
  isSubmitting: boolean;
  isDirty: boolean;
  showProjectsLink: boolean;
  updateField: (field: keyof ProjectFormValues, value: string) => void;
  normalizeCodeField: () => void;
  submit: () => Promise<ProjectUpdateResult>;
  reset: () => void;
  clearSuccess: () => void;
}

function valuesFromProject(project: ProjectDetails | null): ProjectFormValues {
  if (!project) {
    return {
      code: "",
      name: "",
      location: "",
      description: "",
    };
  }

  return {
    code: project.code,
    name: project.name,
    location: project.location ?? "",
    description: project.description ?? "",
  };
}

function normalizedComparable(
  values: ProjectFormValues,
): UpdateProjectRequest {
  return toUpdateProjectRequest(values);
}

function requestsAreEqual(
  left: UpdateProjectRequest,
  right: UpdateProjectRequest,
): boolean {
  return (
    left.code === right.code &&
    left.name === right.name &&
    left.location === right.location &&
    left.description === right.description
  );
}

export function useUpdateProject(
  project: ProjectDetails | null,
): UseUpdateProjectResult {
  const [values, setValues] = useState<ProjectFormValues>(() =>
    valuesFromProject(project),
  );
  const [errors, setErrors] = useState<ProjectFormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showProjectsLink, setShowProjectsLink] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSubmittingRef = useRef(false);
  const requestIdRef = useRef(0);
  const currentProjectIdRef = useRef(project?.id ?? "");

  const baseRequest = useMemo(
    () => normalizedComparable(valuesFromProject(project)),
    [project],
  );
  const currentRequest = useMemo(() => normalizedComparable(values), [values]);
  const isDirty = !requestsAreEqual(baseRequest, currentRequest);

  useEffect(() => {
    const nextProjectId = project?.id ?? "";
    if (currentProjectIdRef.current === nextProjectId) {
      return;
    }

    currentProjectIdRef.current = nextProjectId;
    requestIdRef.current += 1;
    isSubmittingRef.current = false;

    queueMicrotask(() => {
      if (currentProjectIdRef.current !== nextProjectId) {
        return;
      }

      setValues(valuesFromProject(project));
      setErrors({});
      setSubmitError(null);
      setSuccessMessage(null);
      setShowProjectsLink(false);
      setIsSubmitting(false);
    });
  }, [project]);

  const updateField = useCallback(
    (field: keyof ProjectFormValues, value: string) => {
      const nextValue = field === "code" ? value.toUpperCase() : value;
      setValues((current) => ({ ...current, [field]: nextValue }));
      setErrors((current) => {
        if (!current[field]) {
          return current;
        }

        const nextErrors = { ...current };
        delete nextErrors[field];
        delete nextErrors.form;
        return nextErrors;
      });
      setSubmitError(null);
      setShowProjectsLink(false);
    },
    [],
  );

  const normalizeCodeField = useCallback(() => {
    setValues((current) => ({
      ...current,
      code: normalizeProjectCode(current.code),
    }));
  }, []);

  const submit = useCallback(async () => {
    if (!project || isSubmittingRef.current) {
      return { status: "unchanged" } satisfies ProjectUpdateResult;
    }

    setSubmitError(null);
    setShowProjectsLink(false);
    const validationErrors = validateProjectEditableFields(values);

    if (Object.keys(validationErrors).length > 0) {
      setErrors({
        ...validationErrors,
        form: "Revisa los campos marcados antes de continuar.",
      });
      return { status: "failed" } satisfies ProjectUpdateResult;
    }

    const request = toUpdateProjectRequest(values);
    if (requestsAreEqual(baseRequest, request)) {
      setErrors({});
      return { status: "unchanged" } satisfies ProjectUpdateResult;
    }

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    const requestedProjectId = project.id;

    isSubmittingRef.current = true;
    setIsSubmitting(true);
    setErrors({});

    try {
      const updatedProject = await updateProject(
        requestedProjectId,
        request,
        project,
      );

      if (
        requestId !== requestIdRef.current ||
        currentProjectIdRef.current !== requestedProjectId
      ) {
        return { status: "stale" } satisfies ProjectUpdateResult;
      }

      setValues(valuesFromProject(updatedProject));
      setErrors({});
      setSubmitError(null);
      setShowProjectsLink(false);
      setSuccessMessage("Proyecto actualizado correctamente.");

      return {
        status: "updated",
        project: updatedProject,
      } satisfies ProjectUpdateResult;
    } catch (error: unknown) {
      if (
        requestId !== requestIdRef.current ||
        currentProjectIdRef.current !== requestedProjectId
      ) {
        return { status: "stale" } satisfies ProjectUpdateResult;
      }

      const classifiedError = classifyProjectUpdateError(error);

      if (classifiedError.field === "code") {
        setErrors({
          code: classifiedError.message,
          form: classifiedError.formMessage,
        });
        return { status: "failed" } satisfies ProjectUpdateResult;
      }

      setSubmitError(classifiedError.message);
      setShowProjectsLink(Boolean(classifiedError.showProjectsLink));
      return { status: "failed" } satisfies ProjectUpdateResult;
    } finally {
      if (
        requestId === requestIdRef.current &&
        currentProjectIdRef.current === requestedProjectId
      ) {
        isSubmittingRef.current = false;
        setIsSubmitting(false);
      }
    }
  }, [baseRequest, project, values]);

  const reset = useCallback(() => {
    requestIdRef.current += 1;
    isSubmittingRef.current = false;
    setValues(valuesFromProject(project));
    setErrors({});
    setSubmitError(null);
    setShowProjectsLink(false);
    setIsSubmitting(false);
  }, [project]);

  const clearSuccess = useCallback(() => {
    setSuccessMessage(null);
  }, []);

  return {
    values,
    errors,
    submitError,
    successMessage,
    isSubmitting,
    isDirty,
    showProjectsLink,
    updateField,
    normalizeCodeField,
    submit,
    reset,
    clearSuccess,
  };
}
