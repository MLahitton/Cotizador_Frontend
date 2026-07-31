"use client";

import { useCallback, useState } from "react";

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
  const [viewState, setViewState] = useState<{
    projectId: string;
    activationTarget: boolean | null;
    isEditing: boolean;
  }>(() => ({
    projectId,
    activationTarget: null,
    isEditing: false,
  }));
  const activationTarget =
    viewState.projectId === projectId ? viewState.activationTarget : null;
  const isEditing = viewState.projectId === projectId && viewState.isEditing;
  const updateProject = useUpdateProject(project);

  const openActivationConfirmation = useCallback(() => {
    if (!project || isActivationSubmitting || isEditing || updateProject.isSubmitting) {
      return;
    }

    updateProject.clearSuccess();
    resetActivation();
    setViewState({
      projectId,
      activationTarget: !project.isActive,
      isEditing: false,
    });
  }, [
    isActivationSubmitting,
    isEditing,
    project,
    projectId,
    resetActivation,
    updateProject,
  ]);

  const cancelActivationConfirmation = useCallback(() => {
    if (isActivationSubmitting) {
      return;
    }

    setViewState({
      projectId,
      activationTarget: null,
      isEditing,
    });
    resetActivation();
  }, [isActivationSubmitting, isEditing, projectId, resetActivation]);

  const confirmActivation = useCallback(async () => {
    if (!project || activationTarget === null || isActivationSubmitting) {
      return;
    }

    if (activationTarget === project.isActive) {
      setViewState({
        projectId,
        activationTarget: null,
        isEditing,
      });
      resetActivation();
      return;
    }

    const result = await setActivation(project, activationTarget);

    if (result.status === "updated") {
      applyProjectUpdate(result.project);
      setViewState({
        projectId,
        activationTarget: null,
        isEditing,
      });
      return;
    }

    if (result.status === "unchanged") {
      setViewState({
        projectId,
        activationTarget: null,
        isEditing,
      });
      resetActivation();
    }
  }, [
    activationTarget,
    applyProjectUpdate,
    isActivationSubmitting,
    isEditing,
    project,
    projectId,
    resetActivation,
    setActivation,
  ]);

  const startEditing = useCallback(() => {
    if (!project || activationTarget !== null || isActivationSubmitting) {
      return;
    }

    resetActivation();
    updateProject.reset();
    setViewState({
      projectId,
      activationTarget: null,
      isEditing: true,
    });
  }, [
    activationTarget,
    isActivationSubmitting,
    project,
    projectId,
    resetActivation,
    updateProject,
  ]);

  const cancelEditing = useCallback(() => {
    if (updateProject.isSubmitting) {
      return;
    }

    updateProject.reset();
    setViewState({
      projectId,
      activationTarget,
      isEditing: false,
    });
  }, [activationTarget, projectId, updateProject]);

  const submitUpdate = useCallback(async () => {
    if (!project) {
      return;
    }

    const result = await updateProject.submit();

    if (result.status === "updated") {
      applyProjectUpdate(result.project);
      setViewState({
        projectId,
        activationTarget,
        isEditing: false,
      });
    }
  }, [activationTarget, applyProjectUpdate, project, projectId, updateProject]);

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
      isPreQuotesDisabled={
        activationTarget !== null ||
        isActivationSubmitting ||
        isEditing ||
        updateProject.isSubmitting
      }
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
