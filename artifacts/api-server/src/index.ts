// @ts-nocheck
import "dotenv/config";
import app from "./app";
import { logger } from "./lib/logger";

const rawPort = process.env["PORT"] || "3000";
const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

import { ensureDefaultSettings, processWeeklyPayouts } from "./lib/referralService";

app.listen(port, async (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");

  // Run startup tasks
  try {
    await ensureDefaultSettings();
    await processWeeklyPayouts();
    logger.info("Startup tasks completed");
  } catch (startupErr) {
    logger.error({ err: startupErr }, "Error during startup tasks");
  }
});

export default app;
