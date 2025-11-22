# Data Management

TaskLine stores all data locally and provides export and import options.

## Data Storage

- All data is stored locally in SQLite database
- No cloud sync or external storage
- Data stays on the local computer

## Export Data

Save tasks and settings to a JSON file:

1. Go to **Settings**
2. Find **Data Management** section
3. Click **"Export Data"**
4. Save the downloaded file

The export includes:
- All tasks
- Categories
- Settings
- User preferences

## Import Data

Restore data from a JSON file:

1. Go to **Settings**
2. Find **Data Management** section
3. Click **"Import Data"**
4. Select the JSON file
5. Confirm the import

Note: Importing data may overwrite existing data.

## Backup Recommendations

- Export data regularly
- Keep backup files in a safe location
- Export before major updates

## Using Docker Backup

If using Docker, backup with the `taskline` command:
```bash
taskline backup
```

This creates a backup of all TaskLine data.
