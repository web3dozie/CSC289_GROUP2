# Auto-Lock Security

TaskLine includes PIN-based authentication and auto-lock features to keep tasks private.

## PIN Authentication

TaskLine uses a 4-8 digit PIN for security:

- Set during account creation
- Required to unlock the app
- Can be changed in Settings

## Auto-Lock

The app automatically locks after a period of inactivity.

### Setting Auto-Lock Time

1. Go to **Settings**
2. Find **Security** section
3. Select auto-lock timeout:
   - 1 minute
   - 5 minutes
   - 15 minutes
   - 30 minutes
   - Never

### Manual Lock

Lock the app manually:

1. Click the **Lock** icon in the header
2. The app locks immediately
3. Enter PIN to unlock

## Session Management

- Sessions are tracked in the database
- Closing the browser ends the session
- Each session is secured with authentication tokens

## Security Features

| Feature | Description |
|---------|-------------|
| PIN Authentication | 4-8 digit secure PIN |
| Auto-Lock | Locks after inactivity |
| Session Tracking | Database-tracked sessions |
| Rate Limiting | Prevents brute force attempts |
| Security Logging | Logs authentication events |
