import type { CurrentRequirement, ProcessedRequirement } from "../prequotes/requirement-types";

export interface ProjectAnalysisState {
  status: string | null;
  error: string | null;
  isSubmitting: boolean;
}

interface AnalysisOptions {
  requirementId: string;
  preQuoteId: string | null;
  status: string | null;
  readOnly: boolean;
  processRequirement: (id: string) => Promise<ProcessedRequirement>;
  getCurrentRequirement: (id: string) => Promise<CurrentRequirement | null>;
  isAlreadyActive: (error: unknown) => boolean;
  errorMessage: (error: unknown) => string;
  failureMessage: (code: string | null) => string;
  onChange: (state: ProjectAnalysisState) => void;
  onRefresh: () => void;
  schedule: (callback: () => void, delay: number) => () => void;
}

// One session per project/requirement; late requests cannot affect a new workspace.
export function createProjectRequirementAnalysis(options: AnalysisOptions) {
  let state: ProjectAnalysisState = { status: options.status, error: null, isSubmitting: false };
  let disposed = false;
  let busy = false;
  let cancelTimer: (() => void) | undefined;
  const publish = (next: ProjectAnalysisState) => {
    state = next;
    if (!disposed) options.onChange(state);
  };
  const pollLater = () => {
    cancelTimer?.();
    if (!disposed && state.status === "PROCESSING" && options.preQuoteId) {
      cancelTimer = options.schedule(() => { void poll(); }, 7000);
    }
  };
  const poll = async () => {
    if (disposed || busy || !options.preQuoteId) return;
    try {
      const current = await options.getCurrentRequirement(options.preQuoteId);
      if (disposed) return;
      if (!current || current.requirementId !== options.requirementId) {
        options.onRefresh();
        return;
      }
      publish({
        status: current.status,
        isSubmitting: false,
        error: current.status === "FAILED" ? options.failureMessage(current.latestAttemptErrorCode) : null,
      });
      if (current.status === "PROCESSED" || current.hasTechnicalProposal) {
        options.onRefresh();
        return;
      }
    } catch (error) {
      if (disposed) return;
      publish({ ...state, error: options.errorMessage(error) });
    }
    pollLater();
  };

  return {
    startPolling: pollLater,
    async process() {
      if (disposed || busy || options.readOnly || (state.status !== "PENDING" && state.status !== "FAILED")) return;
      busy = true;
      cancelTimer?.();
      const previousStatus = state.status;
      publish({ status: "PROCESSING", error: null, isSubmitting: true });
      try {
        const result = await options.processRequirement(options.requirementId);
        if (disposed) return;
        if (result.outcome === "Completed" || result.outcome === "RequiresReview") {
          publish({ status: "PROCESSED", error: null, isSubmitting: false });
          options.onRefresh();
        } else {
          publish({
            status: result.outcome === "Cancelled" ? "CANCELLED" : "FAILED",
            error: result.outcome === "Failed" ? options.failureMessage(result.errorCode) : null,
            isSubmitting: false,
          });
        }
      } catch (error) {
        if (disposed) return;
        const active = options.isAlreadyActive(error);
        publish({ status: active ? "PROCESSING" : previousStatus, error: active ? null : options.errorMessage(error), isSubmitting: false });
      } finally {
        busy = false;
        pollLater();
      }
    },
    dispose() {
      disposed = true;
      cancelTimer?.();
    },
  };
}
