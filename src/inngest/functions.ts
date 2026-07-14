import { inngest } from "./client";
import { createClient } from "../lib/supabase/server";

import { executeMultiLLMScanLogic } from "../lib/multi-scanner";

// 1. The Cron Trigger
// This runs on the 1st of every month at midnight.
// It finds all domains and fans out a separate "scan" event for each one.
export const monthlyScanTrigger = inngest.createFunction(
  { 
    id: "monthly-scan-trigger",
    triggers: [{ cron: "0 0 1 * *" }]
  },
  async ({ step }) => {
    // We use step.run to ensure this query is retried if it fails
    const domainsToScan = await step.run("fetch-domains", async () => {
      const supabase = await createClient();
      
      // Get all unique domains we've scanned before
      const { data: scans, error } = await supabase
        .from('scans')
        .select('domain, user_id')
        
      if (error || !scans) return [];

      // Deduplicate
      const uniqueDomains = new Map();
      scans.forEach(scan => {
        if (!uniqueDomains.has(scan.domain)) {
          uniqueDomains.set(scan.domain, scan.user_id);
        }
      });

      return Array.from(uniqueDomains.entries()).map(([domain, userId]) => ({ domain, userId }));
    });

    // Fan-out: Send an individual event for every single domain.
    // Inngest will process these in parallel, completely bypassing Vercel timeout limits.
    const events = domainsToScan.map(({ domain, userId }) => ({
      name: "app/scan.requested",
      data: { domain, userId }
    }));

    if (events.length > 0) {
      await step.sendEvent("fan-out-scans", events);
    }

    return { scheduled: events.length };
  }
);

// 2. The Background Worker
// This listens for the fan-out events and does the heavy 20s LLM work.
export const processDomainScan = inngest.createFunction(
  { 
    id: "process-domain-scan",
    // We can configure retries and concurrency here
    retries: 3,
    triggers: [{ event: "app/scan.requested" }]
  },
  async ({ event, step }) => {
    const { domain, userId } = event.data;

    const report = await step.run("run-llm-scan", async () => {
      const targetUrl = `https://${domain}`;
      let finalReport = null;
      
      await executeMultiLLMScanLogic({
        targetUrl,
        domain,
        description: "",
        entityType: "",
        basedIn: "",
        servesMarket: "local",
        targetClient: "",
        userId,
        ip: null,
        sendEvent: (eventName, data) => {
          if (eventName === 'scan_complete') {
            finalReport = data;
          }
        }
      });
      
      return finalReport;
    });

    return { success: true, domain, report };
  }
);
