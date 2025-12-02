# Troubleshooting

Solutions to common issues with TaskLine.

## Installation Issues

### Docker Not Found

**Problem:** Install script says Docker is not found.

**Solution:**
1. Install Docker Desktop from [docker.com](https://www.docker.com/products/docker-desktop/)
2. Start Docker Desktop
3. Wait until Docker is running (check the whale icon)
4. Run the install script again

### Port Already in Use

**Problem:** Error says port 3456 is already in use.

**Solution:**
1. Stop any service using port 3456
2. Or use a different port:
```bash
   docker run -d --name taskline -p 3457:3456 -v taskline-data:/data web3dozie/taskline:latest
```
3. Access at `http://localhost:3457` instead

### Container Won't Start

**Problem:** TaskLine container fails to start.

**Solution:**
1. Check Docker logs:
```bash
   taskline logs
```
2. Restart the container:
```bash
   taskline restart
```
3. If issues persist, reinstall:
```bash
   taskline uninstall
   curl -fsSL https://mytaskline.app/install.sh | bash
```

## Application Issues

### Cannot Log In

**Problem:** PIN is not accepted.

**Solution:**
1. Make sure Caps Lock is off
2. Enter the correct 4-8 digit PIN
3. If PIN is forgotten, data must be reset

### Tasks Not Saving

**Problem:** Tasks disappear or do not save.

**Solution:**
1. Check browser console for errors
2. Refresh the page
3. Check if storage is full
4. Restart TaskLine:
```bash
   taskline restart
```

### Page Not Loading

**Problem:** Browser shows error or blank page.

**Solution:**
1. Check if TaskLine is running:
```bash
   taskline status
```
2. If not running, start it:
```bash
   taskline start
```
3. Clear browser cache and refresh

## Database Issues

### Migration Errors

**Problem:** Database migration errors on startup.

**Solution:**
1. Check logs for specific error:
```bash
   taskline logs
```
2. Restart the container:
```bash
   taskline restart
```

## Getting More Help

If issues persist:
1. Check the [FAQ](faq.md)
2. Review Docker logs with `taskline logs`
3. Report issues on GitHub
