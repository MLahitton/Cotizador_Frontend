"use client";

import { useCallback, useEffect, useState } from "react";

import { ProjectActivationConfirmation } from "@/features/projects/components/project-activation-confirmation";
import { ProjectClientSummary } from "@/features/projects/components/project-client-summary";
import {
  InvalidProjectIdFeedback,
  ProjectDetailsErrorFeedback,
  ProjectDetailsLoading,
} from "@/features/projects/components/project-detail-feedback";
import { ProjectDetailView } from "@/features/projects/components/project-detail-view";
import { useProjectDetails } from "@/features/projects/use-project-details";
import { useSetProjectActivation } from "@/features/projects/use-set-project-activation";

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

  useEffect(() => {
    queueMicrotask(() => {
      setActivationTarget(null);
    });
  }, [projectId]);

  const openActivationConfirmation = useCallback(() => {
    if (!project || isActivationSubmitting) {
      return;
    }

    resetActivation();
    setActivationTarget(!project.isActive);
  }, [isActivationSubmitting, project, resetActivation]);

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
      successMessage={successMessage}
      isActivationDisabled={activationTarget !== null || isActivationSubmitting}
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
