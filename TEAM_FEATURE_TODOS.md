# Private Challenges with Invitations - Implementation Requirements

## Overview

Currently, all challenges in the fitness tracking application are public and visible to all users. We need to implement a private challenge feature where challenges can be set to "private" and only accessible to the creator and invited participants.

## Database Changes

### 1. Add Visibility Field to Challenges Table

Modify the `challenges` table to add a new column:
- `visibility` (string): Values can be "public" or "private" (default: "public")

SQL:
```sql
ALTER TABLE challenges ADD COLUMN visibility TEXT NOT NULL DEFAULT 'public';
```

### 2. Create Challenge Invites Table

Create a new `challenge_invites` table to store invitations:

```sql
CREATE TABLE challenge_invites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    challenge_id UUID NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending', -- pending, accepted, declined
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(challenge_id, email)
);
```

## Feature Requirements

### A. Challenge Creation Updates

1. Modify the ChallengeForm component to:
   - Add a visibility toggle (public/private)
   - Add an email input field for inviting participants (visible only when "private" is selected)
   - Add ability to add multiple email addresses (comma or space separated)
   - Validate email formats

2. When saving a private challenge:
   - Set the visibility field to "private"
   - Create records in the challenge_invites table for each invited email

### B. Challenge Listing Updates

1. Update the ChallengeList component to:
   - For regular users: Show only public challenges OR private challenges they've been invited to
   - For admins: Show all challenges
   - Add a visual indicator to distinguish public vs private challenges

2. Add an "Invitations" section to the challenges page that:
   - Shows pending invitations for the current user
   - Provides a "Join Challenge" button for each invitation
   - Updates invitation status to "accepted" when joined
   - Creates a new record in challenge_participants when accepted

### C. Challenge Management Updates

1. Create a new "Manage Invitations" section on the challenge details page for challenge creators:
   - Shows a list of all invited emails
   - Displays invitation status (pending/accepted)
   - Provides actions to:
     - Revoke invitations (delete from challenge_invites)
     - Remove participants (delete from challenge_participants)
     - Re-send invitations (update timestamp)
     - Add new invitations

2. Update challenge visibility controls:
   - Allow creator to change visibility from private to public and vice versa
   - When changing from private to public, show a confirmation dialog

### D. Challenge Participation Logic Updates

1. Update all queries in ExerciseTracker, Leaderboard, and other components to:
   - Only show data for public challenges OR private challenges the user is participating in
   - Hide data for private challenges the user is not invited to

2. Update the join challenge functionality to:
   - Check if user can join (public challenge OR has invitation for private challenge)
   - Reject join attempts for private challenges without invitation

## Implementation Strategy

### 1. Database Updates
- First, apply all database schema changes
- Ensure all existing challenges are marked as "public"

### 2. Component Updates
- Update ChallengeForm component for creating private challenges with invitations
- Update ChallengeList to filter based on visibility and invitations
- Create the invitation management interface
- Update challenge details page for creators

### 3. Queries and Logic
- Update all relevant queries to respect challenge visibility
- Implement invitation checking logic
- Add permission checks before allowing challenge joins

### 4. UI/UX Enhancements
- Add visual cues for private vs public challenges
- Create the invitation list UI
- Add notifications for pending invitations

## Testing Scenarios

1. **Challenge Creation**
   - Create a public challenge - verify it's visible to all users
   - Create a private challenge with invitations - verify it's only visible to creator and invitees

2. **Invitation Flow**
   - Invite a user to a private challenge
   - Login as invited user and verify invitation appears
   - Accept invitation and verify challenge appears in user's challenges
   - Verify exercise tracking works for the joined challenge

3. **Management**
   - Test revoking invitations
   - Test removing participants
   - Test changing visibility from private to public and vice versa

4. **Permission Enforcement**
   - Verify non-invited users cannot see or join private challenges
   - Verify invited users can only see challenges they're invited to

## Notes

- Keep the implementation simple without using row-level security
- Implement access control in the application logic
- All existing challenges should remain public
- The system will only check for invitations within the app (no email notifications)
- Users will see their invitations in the challenges page (no separate invitations page)