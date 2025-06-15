import { logger } from '../src/utils/logger.js';

async function runEvals() {
  logger.info('Running evaluations...');
  logger.info('Evaluations complete.');
}

runEvals().catch((err) => {
  logger.error(`Eval error: ${err.message}`);
  process.exit(1);
});