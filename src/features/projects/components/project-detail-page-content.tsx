"use client";

import { useCallback, useEffect, useState } from "react";

import { ProjectActivationConfirmation } from "@/features/projects/components/project-activation-confirmation";
import { ProjectClientSummary } from "@/features/projects/components/project-client-summary";
import { ProjectEditForm } from "@/features/projects/components/project-edit-form";
import {
  InvalidProjectIdFeedback,
  ProjectDetailsErrorFeedback,
  ProjectDetailsLoading,
} from "@/features/projects/components/project-detail-feedback";
import { ProjectDetailView } from "@/features/projects/components/project-detail-view";
import { useProjectDetails } from "@/features/projects/use-project-details";
import { useSetProjectActivation } from "@/features/projects/use-set-project-activation";
import { useUpdateProject } from "@/features/projects/use-update-project";

export function ProjectDetailPageContent({
  projectId,
}: {
  projectId: string;
}) {
  const {
    project,
    projectError,
    isProjectLoading,
    retryProject,
    applyProjectUpdate,
    client,
    clientError,
    isClientLoading,
    retryClient,
    isProjectIdValid,
  } = useProjectDetails(projectId);
  const {
    setActivation,
    isSubmitting: isActivationSubmitting,
    error: activationError,
    successMessage,
    reset: resetActivation,
  } = useSetProjectActivation(projectId);
  const [activationTarget, setActivationTarget] = useState<boolean | null>(
    null,
  );
  const [isEditing, setIsEditing] = useState(false);
  const updateProject = useUpdateProject(project);

  useEffect(() => {
    queueMicrotask(() => {
      setActivationTarget(null);
      setIsEditing(false);
    });
  }, [projectId]);

  const openActivationConfirmation = useCallback(() => {
    if (!project || isActivationSubmitting || isEditing || updateProject.isSubmitting) {
      return;
    }

    updateProject.clearSuccess();
    resetActivation();
    setActivationTarget(!project.isActive);
  }, [
    isActivationSubmitting,
    isEditing,
    project,
    resetActivation,
    updateProject,
  ]);

  const cancelActivationConfirmation = useCallback(() => {
    if (isActivationSubmitting) {
      return;
    }

    setActivationTarget(null);
    resetActivation();
  }, [isActivationSubmitting, resetActivation]);

  const confirmActivation = useCallback(async () => {
    if (!project || activationTarget === null || isActivationSubmitting) {
      return;
    }

    if (activationTarget === project.isActive) {
      setActivationTarget(null);
      resetActivation();
      return;
    }

    const result = await setActivation(project, activationTarget);

    if (result.status === "updated") {
      applyProjectUpdate(result.project);
      setActivationTarget(null);
      return;
    }

    if (result.status === "unchanged") {
      setActivationTarget(null);
      resetActivation();
    }
  }, [
    activationTarget,
    applyProjectUpdate,
    isActivationSubmitting,
    project,
    resetActivation,
    setActivation,
  ]);

  const startEditing = useCallback(() => {
    if (!project || activationTarget !== null || isActivationSubmitting) {
      return;
    }

    resetActivation();
    updateProject.reset();
    setIsEditing(true);
  }, [
    activationTarget,
    isActivationSubmitting,
    project,
    resetActivation,
    updateProject,
  ]);

  const cancelEditing = useCallback(() => {
    if (updateProject.isSubmitting) {
      return;
    }

    updateProject.reset();
    setIsEditing(false);
  }, [updateProject]);

  const submitUpdate = useCallback(async () => {
    if (!project) {
      return;
    }

    const result = await updateProject.submit();

    if (result.status === "updated") {
      applyProjectUpdate(result.project);
      setIsEditing(false);
    }
  }, [applyProjectUpdate, project, updateProject]);

  if (!isProjectIdValid) {
    return <InvalidProjectIdFeedback />;
  }

  if (isProjectLoading) {
    return <ProjectDetailsLoading />;
  }

  if (projectError) {
    return (
      <ProjectDetailsErrorFeedback
        error={projectError}
        onRetry={retryProject}
      />
    );
  }

  if (!project) {
    return (
      <ProjectDetailsErrorFeedback
        error={{ cause: new Error("Proyecto no disponible.") }}
        onRetry={retryProject}
      />
    );
  }

  return (
    <ProjectDetailView
      project={project}
      successMessage={updateProject.successMessage ?? successMessage}
      isActivationDisabled={
        activationTarget !== null ||
        isActivationSubmitting ||
        isEditing ||
        updateProject.isSubmitting
      }
      isEditDisabled={activationTarget !== null || isActivationSubmitting}
      isEditing={isEditing}
      editForm={
        <ProjectEditForm
          values={updateProject.values}
          errors={updateProject.errors}
          isSubmitting={updateProject.isSubmitting}
          isDirty={updateProject.isDirty}
          submitError={updateProject.submitError}
          showProjectsLink={updateProject.showProjectsLink}
          onFieldChange={updateProject.updateField}
          onCodeBlur={updateProject.normalizeCodeField}
          onSubmit={submitUpdate}
          onCancel={cancelEditing}
        />
      }
      activationConfirmation={
        activationTarget !== null ? (
          <ProjectActivationConfirmation
            projectName={project.name}
            targetIsActive={activationTarget}
            isSubmitting={isActivationSubmitting}
            error={activationError}
            onConfirm={confirmActivation}
            onCancel={cancelActivationConfirmation}
          />
        ) : null
      }
      onRequestEdit={startEditing}
      onRequestActivation={openActivationConfirmation}
      clientSummary={
        <ProjectClientSummary
          projectId={project.id}
          client={client}
          error={clientError}
          isLoading={isClientLoading}
          onRetry={retryClient}
        />
      }
    />
  );
}
