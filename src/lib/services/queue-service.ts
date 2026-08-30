import "server-only";

export type JobType =
  | "GENERATE_MONTHLY_LEDGER_PDF"
  | "DISPATCH_SHIFT_SMS_SUMMARY"
  | "CALCULATE_ANNUAL_TAX_REPORT"
  | "SYNC_OFFLINE_SALES_BATCH";

export type JobStatus = "QUEUED" | "PROCESSING" | "COMPLETED" | "FAILED";

export interface BackgroundJob<T = Record<string, unknown>> {
  id: string;
  stationId: string;
  type: JobType;
  payload: T;
  status: JobStatus;
  progressPercent: number;
  attempts: number;
  maxAttempts: number;
  result?: Record<string, unknown> | null;
  error?: string | null;
  createdAt: string;
  completedAt?: string | null;
}

// In-memory high-throughput job queue registry for background task execution
const jobStore = new Map<string, BackgroundJob>();

export class QueueService {
  /**
   * Enqueues a heavy computation or external I/O task and returns immediately (<10ms).
   */
  static enqueue<T extends Record<string, unknown>>(params: {
    stationId: string;
    type: JobType;
    payload: T;
  }): BackgroundJob<T> {
    const id = `job-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const job: BackgroundJob<T> = {
      id,
      stationId: params.stationId,
      type: params.type,
      payload: params.payload,
      status: "QUEUED",
      progressPercent: 0,
      attempts: 0,
      maxAttempts: 3,
      createdAt: new Date().toISOString(),
    };

    jobStore.set(id, job as BackgroundJob);

    // Trigger async execution on next microtask without blocking HTTP thread
    setTimeout(() => {
      QueueService.processJob(id);
    }, 10);

    return job;
  }

  /**
   * Retrieves background job status and progress.
   */
  static getJob(id: string): BackgroundJob | null {
    return jobStore.get(id) ?? null;
  }

  /**
   * Lists background jobs for a specific station tenant.
   */
  static listStationJobs(stationId: string): BackgroundJob[] {
    return Array.from(jobStore.values())
      .filter((j) => j.stationId === stationId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  /**
   * Simulates asynchronous job processing (e.g. PDF render, SMS gateway, Annual Tax).
   */
  private static async processJob(id: string) {
    const job = jobStore.get(id);
    if (!job) return;

    job.status = "PROCESSING";
    job.attempts += 1;
    job.progressPercent = 25;

    try {
      if (job.type === "GENERATE_MONTHLY_LEDGER_PDF") {
        job.progressPercent = 75;
        // Simulates PDF rendering & storage upload
        job.result = {
          downloadUrl: `/api/reports/download/ledger_${job.payload.monthBS || "2083_05"}.pdf`,
          fileSizeKb: 842,
          generatedAt: new Date().toISOString(),
        };
      } else if (job.type === "DISPATCH_SHIFT_SMS_SUMMARY") {
        job.progressPercent = 100;
        job.result = {
          smsGatewayStatus: "DELIVERED",
          recipientsCount: 2,
          deliveredAt: new Date().toISOString(),
        };
      } else if (job.type === "CALCULATE_ANNUAL_TAX_REPORT") {
        job.progressPercent = 100;
        job.result = {
          taxYear: "2082/2083",
          totalGrossSalesNpr: "Rs 4,82,19,400.00",
          vatPayableNpr: "Rs 55,47,138.00",
          reconciliationStatus: "MATCHED_IRD_CBMS",
        };
      }

      job.status = "COMPLETED";
      job.progressPercent = 100;
      job.completedAt = new Date().toISOString();
    } catch (err: any) {
      job.status = "FAILED";
      job.error = err?.message || "Job execution encountered an unexpected error.";
    }
  }
}
