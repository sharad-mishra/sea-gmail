import { logger } from '../utils/logger.js';
import { getOAuthClient } from '../auth/oauth.js';
export async function categorizeEmail(params) {
  const { subject, body } = params;
  logger.info(`Categorizing email: ${subject}`);

  const lowerSubject = subject.toLowerCase();
  const lowerBody = body.toLowerCase();

  if (lowerSubject.includes('invoice') || lowerBody.includes('payment due')) {
    return 'invoice';
  }
  if (lowerSubject.includes('feedback') || lowerBody.includes('suggestion')) {
    return 'feedback';
  }
  if (lowerSubject.includes('lead') || lowerBody.includes('interested in')) {
    return 'lead';
  }
  if (lowerSubject.includes('unsubscribe') || lowerBody.includes('spam')) {
    return 'spam';
  }

  return 'other';
}