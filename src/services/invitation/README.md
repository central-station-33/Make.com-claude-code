
# Invitation Service Documentation

The invitation service is split into several modules to handle different aspects of the invitation flow:

## Core Invitation Service (`invitationService.ts`)

Handles the main invitation operations:

```typescript
import { invitationService } from '@/services/invitation';

// Check for existing invites
const existingInvite = await invitationService.checkExistingInvite(email);

// Create a new invitation
const invitationId = await invitationService.createInvitation(email, createdBy);

// Resend an invitation
const success = await invitationService.resendInvitation(invitationId);

// Process invitation status changes
await invitationService.processInvitation(invitationId, InvitationStatus.accepted);
```

## Email Service (`emailService.ts`)

Handles sending invitation emails:

```typescript
import { emailService } from '@/services/invitation/emailService';

await emailService.sendInvitationEmail(email, token);
```

## Onboarding Service (`onboardingService.ts`)

Manages agent onboarding records:

```typescript
import { onboardingService } from '@/services/invitation/onboardingService';

await onboardingService.createOnboarding(email);
```

## Cleanup Service (`cleanupService.ts`)

Handles cleanup of failed or expired invitations:

```typescript
import { cleanupService } from '@/services/invitation/cleanupService';

await cleanupService.cleanupFailedInvitations();
```

## Types (`types.ts`)

Contains all type definitions for the invitation system:

```typescript
import { CreateInvitationParams, ProcessInvitationParams, InvitationResponse } from '@/services/invitation/types';
```

## Complete Example

Here's a complete example of creating and sending an invitation:

```typescript
import { invitationService } from '@/services/invitation';

async function handleInvite(email: string, createdBy: string) {
  try {
    // Check for existing invite
    const existing = await invitationService.checkExistingInvite(email);
    if (existing) {
      throw new Error('Invitation already exists');
    }

    // Create invitation
    const invitationId = await invitationService.createInvitation(email, createdBy);

    // Create onboarding record
    await invitationService.createOnboarding(email);

    // Get invitation details
    const { data: invitation } = await supabase
      .from('invitations')
      .select('*')
      .eq('id', invitationId)
      .single();

    // Send invitation email
    await invitationService.sendInvitationEmail(email, invitation.token);

    return invitation;
  } catch (error) {
    console.error('Failed to create invitation:', error);
    throw error;
  }
}
```

## Error Handling

All service methods throw errors that should be caught and handled appropriately:

```typescript
try {
  await invitationService.processInvitation(id, status);
} catch (error) {
  console.error('Failed to process invitation:', error);
  // Handle error appropriately
}
```

## Best Practices

1. Always check for existing invitations before creating new ones
2. Handle cleanup of failed invitations regularly
3. Validate email addresses before creating invitations
4. Implement proper error handling for all service calls
5. Monitor invitation statuses and handle expired invitations

