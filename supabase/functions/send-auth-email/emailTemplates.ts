interface EmailTemplate {
  subject: string;
  html: (params: any) => string;
}

export const emailTemplates: Record<string, EmailTemplate> = {
  invitation: {
    subject: "You've been invited to join JRA",
    html: ({ name, baseUrl, token }) => `
      <h1>Welcome to JRA!</h1>
      <p>Hello${name ? ` ${name}` : ''},</p>
      <p>You've been invited to join JRA. Click the link below to create your account:</p>
      <p><a href="${baseUrl}/auth?invite=${token}">Accept Invitation</a></p>
      <p>This invitation link will expire in 24 hours.</p>
      <p>Best regards,<br>The JRA Team</p>
    `
  },
  verification: {
    subject: "Verify Your Email",
    html: ({ name, baseUrl, token }) => `
      <h1>Welcome to JRA!</h1>
      <p>Hello${name ? ` ${name}` : ''},</p>
      <p>Please verify your email address by clicking the link below:</p>
      <p><a href="${baseUrl}/auth/verify?token=${token}">Verify Email</a></p>
      <p>Best regards,<br>The JRA Team</p>
    `
  },
  reset: {
    subject: "Reset Your Password",
    html: ({ name, baseUrl, token }) => `
      <h1>Password Reset Request</h1>
      <p>Hello${name ? ` ${name}` : ''},</p>
      <p>We received a request to reset your password. Click the link below to set a new password:</p>
      <p><a href="${baseUrl}/auth/reset-password?token=${token}">Reset Password</a></p>
      <p>This link will expire in 1 hour. If you didn't request this reset, please ignore this email.</p>
      <p>Best regards,<br>The JRA Team</p>
    `
  }
};