"use client";

import { useCallback, useState } from "react";

import { Surface } from "@/components/ui/surface";
import { useAuth } from "@/features/auth/auth-context";
import { ProjectActivationConfirmation } from "@/features/projects/components/project-activation-confirmation";
import {
  InvalidProjectIdFeedback,
  ProjectDetailsErrorFeedback,
  ProjectDetailsLoading,
} from "@/features/projects/components/project-detail-feedback";
import { ProjectContextStep } from "@/features/projects/components/project-context-step";
import { ProjectEditForm } from "@/features/projects/components/project-edit-form";
import {
  ProjectConfigurationStep,
  ProjectDocumentsStep,
  ProjectMomentsStep,
  ProjectSummaryStep,
} from "@/features/projects/components/project-workspace-placeholder-steps";
import { ProjectWorkspaceHeader } from "@/features/projects/components/project-workspace-header";
import {
  ProjectWorkspaceNavigation,
  type ProjectWorkspaceStep,
} from "@/features/projects/components/project-workspace-navigation";
import { useProjectDetails } from "@/features/projects/use-project-details";
import { useProjectWorkspace } from "@/features/projects/use-project-workspace";
import { useProjectWorkspaceProposal } from "@/features/projects/use-project-workspace-proposal";
import { useSetProjectActivation } from "@/features/projects/use-set-project-activation";
import { useUpdateProject } from "@/features/projects/use-update-project";

function ProjectWorkspaceSuccessMessage({
  message,
}: {
  message: string | null;
}) {
  if (!message) {
    return null;
  }

  return (
    <Surface variant="subtle" className="border-success bg-success-soft">
      <p className="text-sm font-medium text-success">{message}</p>
    </Surface>
  );
}

function ProjectWorkspaceStepContent({
  activeStep,
  workspace,
  proposal,
  isProposalLoading,
  hasProposalError,
  onRetryProposal,
}: {
  activeStep: ProjectWorkspaceStep;
  workspace: NonNullable<ReturnType<typeof useProjectWorkspace>["workspace"]>;
  proposal: ReturnType<typeof useProjectWorkspaceProposal>["proposal"];
  isProposalLoading: boolean;
  hasProposalError: boolean;
  onRetryProposal: () => void;
}) {
  switch (activeStep) {
    case "context":
      return (
        <ProjectContextStep
          workspace={workspace}
          proposal={proposal}
          isProposalLoading={isProposalLoading}
          hasProposalError={hasProposalError}
          onRetryProposal={onRetryProposal}
        />
      );
    case "moments":
      return <ProjectMomentsStep />;
    case "configuration":
      return <ProjectConfigurationStep />;
    case "summary":
      return <ProjectSummaryStep />;
    case "documents":
      return <ProjectDocumentsStep />;
  }
}

export function ProjectWorkspacePageContent({
  projectId,
}: {
  projectId: string;
}) {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const [activeStep, setActiveStep] = useState<ProjectWorkspaceStep>("context");
  const {
    workspace,
    workspaceError,
    isWorkspaceLoading,
    retryWorkspace,
    applyProjectUpdate: applyWorkspaceProjectUpdate,
    isProjectIdValid,
  } = useProjectWorkspace(projectId);
  const {
    project,
    isProjectLoading,
    applyProjectUpdate: applyLegacyProjectUpdate,
  } = useProjectDetails(projectId);
  const shouldLoadProposal =
    workspace?.workflow.resolutionState === "RESOLVED" &&
    Boolean(
      workspace.workflow.requirementId &&
        workspace.workflow.hasTechnicalProposal,
    );
  const {
    proposal,
    proposalError,
    isProposalLoading,
    retryProposal,
  } = useProjectWorkspaceProposal(
    workspace?.workflow.requirementId ?? null,
    shouldLoadProposal,
  );
  const {
    setActivation,
    isSubmitting: isActivationSubmitting,
    error: activationError,
    successMessage: activationSuccessMessage,
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
    if (
      !project ||
      isActivationSubmitting ||
      isEditing ||
      updateProject.isSubmitting
    ) {
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
      applyLegacyProjectUpdate(result.project);
      applyWorkspaceProjectUpdate(result.project);
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
    applyLegacyProjectUpdate,
    applyWorkspaceProjectUpdate,
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
      applyLegacyProjectUpdate(result.project);
      applyWorkspaceProjectUpdate(result.project);
      setViewState({
        projectId,
        activationTarget,
        isEditing: false,
      });
    }
  }, [
    activationTarget,
    applyLegacyProjectUpdate,
    applyWorkspaceProjectUpdate,
    project,
    projectId,
    updateProject,
  ]);

  if (!isProjectIdValid) {
    return <InvalidProjectIdFeedback />;
  }

  if (isWorkspaceLoading) {
    return <ProjectDetailsLoading />;
  }

  if (workspaceError) {
    return (
      <ProjectDetailsErrorFeedback
        error={workspaceError}
        onRetry={retryWorkspace}
      />
    );
  }

  if (!workspace) {
    return (
      <ProjectDetailsErrorFeedback
        error={{ cause: new Error("Proyecto no disponible.") }}
        onRetry={retryWorkspace}
      />
    );
  }

  const successMessage =
    updateProject.successMessage ?? activationSuccessMessage;
  const actionsNeedProject = !project || isProjectLoading;
  const isEditDisabled =
    actionsNeedProject || activationTarget !== null || isActivationSubmitting;
  const isActivationDisabled =
    actionsNeedProject ||
    activationTarget !== null ||
    isActivationSubmitting ||
    isEditing ||
    updateProject.isSubmitting;

  return (
    <div className="space-y-5">
      <ProjectWorkspaceHeader
        workspace={workspace}
        readOnly={isAdmin}
        userInitials={(user?.firstName?.charAt(0) ?? "") + (user?.lastName?.charAt(0) ?? "")}
        isEditDisabled={isEditDisabled}
        isActivationDisabled={isActivationDisabled}
        onRequestEdit={startEditing}
        onRequestActivation={openActivationConfirmation}
      />

      <ProjectWorkspaceSuccessMessage message={successMessage} />

      {!isAdmin && isEditing ? (
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
      ) : null}

      {!isAdmin && activationTarget !== null ? (
        <ProjectActivationConfirmation
          projectName={workspace.project.name}
          targetIsActive={activationTarget}
          isSubmitting={isActivationSubmitting}
          error={activationError}
          onConfirm={confirmActivation}
          onCancel={cancelActivationConfirmation}
        />
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[14rem_minmax(0,1fr)]">
        <ProjectWorkspaceNavigation
          activeStep={activeStep}
          onStepChange={setActiveStep}
        />
        <ProjectWorkspaceStepContent
          activeStep={activeStep}
          workspace={workspace}
          proposal={proposal}
          isProposalLoading={isProposalLoading}
          hasProposalError={Boolean(proposalError)}
          onRetryProposal={retryProposal}
        />
      </div>
    </div>
  );
}
