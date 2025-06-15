export function getTemplate(email_type) {
  switch (email_type) {
    case 'payment_confirmation':
      return {
        subject: 'Payment Confirmation',
        body: 'Thank you for your payment. We’ve received it and will process your order soon.',
      };
    case 'new_lead':
      return {
        subject: 'Re: Your Inquiry',
        body: 'Thanks for reaching out! I’d love to discuss your needs. Please let me know a convenient time for a call.',
      };
    case 'feedback':
      return {
        subject: 'Thank You for Your Feedback',
        body: 'We appreciate your feedback and will use it to improve our services.',
      };
    case 'spam':
      return {
        subject: 'Re: Your Message',
        body: 'Thank you for your message. We’ll review it and get back if necessary.',
      };
    default:
      throw new Error('Invalid email type');
  }
}