# Frequently Asked Questions

Common questions about TaskLine.

## General

### What is TaskLine?

TaskLine is a local-first task management application that runs entirely on the local computer. It helps users stay organized with features like task management, calendar views, a pomodoro timer, and more.

### Is TaskLine free?

Yes, TaskLine is free and open source under the MIT license.

### Does TaskLine require an internet connection?

No, TaskLine runs locally and works offline. An internet connection is only needed for:
- Initial installation
- Updating to new versions
- AI chat feature (if enabled)

### Where is data stored?

All data is stored locally in a SQLite database inside the Docker container. Data never leaves the local computer.

## Installation

### What are the system requirements?

- Docker Desktop installed and running
- Any operating system that supports Docker (macOS, Windows, Linux)

### How do I update TaskLine?

Run the update command:
```bash
taskline update
```

### How do I uninstall TaskLine?

Run the uninstall command:
```bash
taskline uninstall
```
This removes TaskLine but keeps the data. To remove data too, delete the Docker volume.

## Features

### Can I use TaskLine on multiple devices?

TaskLine is designed for single-device use. Each installation is independent with its own local data.

### What is the Pomodoro Timer?

The Pomodoro Timer is a focus tool that uses 25-minute work sessions followed by short breaks to improve productivity.

### What is Zedd Mode?

Zedd Mode is an optional AI chat assistant. It requires an OpenAI-compatible API URL to be configured in Settings.

## Security

### How secure is TaskLine?

TaskLine includes several security features:
- PIN-based authentication (4-8 digits)
- Auto-lock after inactivity
- Local data storage (no cloud)
- Session tracking
- Rate limiting

### What if I forget my PIN?

There is no PIN recovery option. If the PIN is forgotten, the data must be reset.

### Is my data private?

Yes. All data stays on the local computer. TaskLine does not collect, track, or send any data externally.

## Troubleshooting

### TaskLine is not starting

1. Check if Docker is running
2. Run `taskline status` to check status
3. Run `taskline restart` to restart
4. Check logs with `taskline logs`

### I found a bug

Report issues on the GitHub repository.
