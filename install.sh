#!/bin/bash

# TaskLine - One-Command Installer
# Install TaskLine - a local-first task management app
# Usage: curl -fsSL https://mytaskline.app/install.sh | bash

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
CONTAINER_NAME="taskline"
IMAGE_NAME="web3dozie/taskline:latest"
PORT="3456"
DATA_DIR="$HOME/.taskline"
VOLUME_NAME="taskline-data"

# Banner
echo -e "${CYAN}"
cat << "EOF"
╔════════════════════════════════════════╗
║                                        ║
║   ████████╗ █████╗ ███████╗██╗  ██╗  ║
║   ╚══██╔══╝██╔══██╗██╔════╝██║ ██╔╝  ║
║      ██║   ███████║███████╗█████╔╝   ║
║      ██║   ██╔══██║╚════██║██╔═██╗   ║
║      ██║   ██║  ██║███████║██║  ██╗  ║
║      ╚═╝   ╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝  ║
║                                        ║
║   LINE - Lock in. Get it done.        ║
║   Stay zen.                            ║
║                                        ║
╚════════════════════════════════════════╝
EOF
echo -e "${NC}"

echo -e "${BLUE}TaskLine Installer${NC}"
echo ""

# Check if Docker is installed
echo -e "${YELLOW}→${NC} Checking for Docker..."
if ! command -v docker &> /dev/null; then
    echo -e "${RED}✗${NC} Docker is not installed."
    echo ""
    echo "Please install Docker first:"
    echo "  • macOS: https://docs.docker.com/desktop/install/mac-install/"
    echo "  • Linux: https://docs.docker.com/engine/install/"
    echo ""
    exit 1
fi
echo -e "${GREEN}✓${NC} Docker found"

# Check if Docker is running
echo -e "${YELLOW}→${NC} Checking if Docker is running..."
if ! docker info &> /dev/null; then
    echo -e "${RED}✗${NC} Docker is not running."
    echo ""
    echo "Please start Docker and run this installer again."
    exit 1
fi
echo -e "${GREEN}✓${NC} Docker is running"

# Check for existing container
echo -e "${YELLOW}→${NC} Checking for existing TaskLine installation..."
if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo -e "${YELLOW}!${NC} Found existing TaskLine container"

    # Ask user what to do
    echo ""
    echo "What would you like to do?"
    echo "  1) Update to latest version (keeps your data)"
    echo "  2) Reinstall (removes container, keeps data)"
    echo "  3) Cancel installation"
    echo ""
    read -p "Enter choice [1-3]: " choice

    case $choice in
        1)
            echo -e "${YELLOW}→${NC} Updating TaskLine..."
            docker stop ${CONTAINER_NAME} 2>/dev/null || true
            docker rm ${CONTAINER_NAME} 2>/dev/null || true
            ;;
        2)
            echo -e "${YELLOW}→${NC} Reinstalling TaskLine..."
            docker stop ${CONTAINER_NAME} 2>/dev/null || true
            docker rm ${CONTAINER_NAME} 2>/dev/null || true
            ;;
        3)
            echo -e "${CYAN}Installation cancelled.${NC}"
            exit 0
            ;;
        *)
            echo -e "${RED}Invalid choice. Exiting.${NC}"
            exit 1
            ;;
    esac
fi

# Pull latest image
echo -e "${YELLOW}→${NC} Pulling latest TaskLine image..."
docker pull ${IMAGE_NAME}
echo -e "${GREEN}✓${NC} Image downloaded"

# Create data directory
mkdir -p ${DATA_DIR}

# Start container
echo -e "${YELLOW}→${NC} Starting TaskLine..."
docker run -d \
    --name ${CONTAINER_NAME} \
    -p ${PORT}:3456 \
    -v ${VOLUME_NAME}:/data \
    --restart unless-stopped \
    ${IMAGE_NAME}

# Wait for container to be healthy
echo -e "${YELLOW}→${NC} Waiting for TaskLine to start..."
MAX_WAIT=60
COUNTER=0
while [ $COUNTER -lt $MAX_WAIT ]; do
    if docker exec ${CONTAINER_NAME} curl -sf http://localhost:3456/health > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} TaskLine is ready!"
        break
    fi
    sleep 1
    COUNTER=$((COUNTER+1))
    if [ $((COUNTER % 5)) -eq 0 ]; then
        echo -e "  Still waiting... (${COUNTER}s)"
    fi
done

if [ $COUNTER -ge $MAX_WAIT ]; then
    echo -e "${RED}✗${NC} TaskLine failed to start within ${MAX_WAIT} seconds"
    echo ""
    echo "Check logs with: docker logs ${CONTAINER_NAME}"
    exit 1
fi

# Success message
echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                                                        ║${NC}"
echo -e "${GREEN}║  ✓ TaskLine installed successfully!                   ║${NC}"
echo -e "${GREEN}║                                                        ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${CYAN}→ Access TaskLine:${NC}"
echo -e "  ${GREEN}http://localhost:${PORT}${NC}"
echo ""
echo -e "${CYAN}→ Data Location:${NC}"
echo -e "  Docker Volume: ${YELLOW}${VOLUME_NAME}${NC}"
echo ""
echo -e "${CYAN}→ Useful Commands:${NC}"
echo -e "  • View logs:    ${YELLOW}docker logs ${CONTAINER_NAME}${NC}"
echo -e "  • Stop:         ${YELLOW}docker stop ${CONTAINER_NAME}${NC}"
echo -e "  • Start:        ${YELLOW}docker start ${CONTAINER_NAME}${NC}"
echo -e "  • Restart:      ${YELLOW}docker restart ${CONTAINER_NAME}${NC}"
echo -e "  • Uninstall:    ${YELLOW}docker rm -f ${CONTAINER_NAME}${NC}"
echo ""
echo -e "${CYAN}→ Backup Your Data:${NC}"
echo -e "  ${YELLOW}docker run --rm -v ${VOLUME_NAME}:/data -v \$(pwd):/backup ubuntu tar czf /backup/taskline-backup.tar.gz -C /data .${NC}"
echo ""

# Offer to install CLI wrapper
echo -e "${CYAN}→ Install 'taskline' command?${NC}"
echo "  This will create a simple CLI tool for managing TaskLine"
read -p "  Install? [y/N]: " install_cli

if [[ $install_cli =~ ^[Yy]$ ]]; then
    # Determine install location
    if [ -w "/usr/local/bin" ]; then
        CLI_PATH="/usr/local/bin/taskline"
    else
        CLI_PATH="$HOME/.local/bin/taskline"
        mkdir -p "$HOME/.local/bin"

        # Add to PATH if not already there
        if [[ ":$PATH:" != *":$HOME/.local/bin:"* ]]; then
            echo ""
            echo -e "${YELLOW}Note:${NC} Add $HOME/.local/bin to your PATH:"
            echo -e "  ${YELLOW}echo 'export PATH=\"\$HOME/.local/bin:\$PATH\"' >> ~/.bashrc${NC}"
            echo -e "  ${YELLOW}source ~/.bashrc${NC}"
        fi
    fi

    # Create CLI script
    cat > $CLI_PATH << 'EOFCLI'
#!/bin/bash
# TaskLine CLI Wrapper

CONTAINER_NAME="taskline"
IMAGE_NAME="web3dozie/taskline:latest"
PORT="3456"
VOLUME_NAME="taskline-data"

case "$1" in
    start)
        echo "Starting TaskLine..."
        docker start ${CONTAINER_NAME} 2>/dev/null || \
        docker run -d --name ${CONTAINER_NAME} -p ${PORT}:3456 -v ${VOLUME_NAME}:/data --restart unless-stopped ${IMAGE_NAME}
        echo "TaskLine is running at http://localhost:${PORT}"
        ;;
    stop)
        echo "Stopping TaskLine..."
        docker stop ${CONTAINER_NAME}
        ;;
    restart)
        echo "Restarting TaskLine..."
        docker restart ${CONTAINER_NAME}
        ;;
    status)
        if docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
            echo "TaskLine is running"
            echo "URL: http://localhost:${PORT}"
            docker ps --filter "name=${CONTAINER_NAME}" --format "table {{.Status}}\t{{.Ports}}"
        else
            echo "TaskLine is not running"
        fi
        ;;
    logs)
        docker logs -f ${CONTAINER_NAME}
        ;;
    update)
        echo "Updating TaskLine..."
        docker pull ${IMAGE_NAME}
        docker stop ${CONTAINER_NAME}
        docker rm ${CONTAINER_NAME}
        docker run -d --name ${CONTAINER_NAME} -p ${PORT}:3456 -v ${VOLUME_NAME}:/data --restart unless-stopped ${IMAGE_NAME}
        echo "TaskLine updated and running at http://localhost:${PORT}"
        ;;
    uninstall)
        read -p "Remove TaskLine container? Data will be preserved. [y/N]: " confirm
        if [[ $confirm =~ ^[Yy]$ ]]; then
            docker rm -f ${CONTAINER_NAME}
            echo "TaskLine removed. Data volume '${VOLUME_NAME}' preserved."
            echo "To remove data: docker volume rm ${VOLUME_NAME}"
        fi
        ;;
    backup)
        BACKUP_FILE="taskline-backup-$(date +%Y%m%d-%H%M%S).tar.gz"
        echo "Backing up TaskLine data..."
        docker run --rm -v ${VOLUME_NAME}:/data -v $(pwd):/backup ubuntu tar czf /backup/${BACKUP_FILE} -C /data .
        echo "Backup saved: ${BACKUP_FILE}"
        ;;
    *)
        echo "TaskLine CLI - Manage your TaskLine installation"
        echo ""
        echo "Usage: taskline <command>"
        echo ""
        echo "Commands:"
        echo "  start      - Start TaskLine"
        echo "  stop       - Stop TaskLine"
        echo "  restart    - Restart TaskLine"
        echo "  status     - Check TaskLine status"
        echo "  logs       - View TaskLine logs"
        echo "  update     - Update to latest version"
        echo "  backup     - Backup TaskLine data"
        echo "  uninstall  - Remove TaskLine (keeps data)"
        ;;
esac
EOFCLI

    chmod +x $CLI_PATH
    echo -e "${GREEN}✓${NC} CLI installed: ${CLI_PATH}"
    echo -e "  Run ${YELLOW}taskline${NC} to see available commands"
fi

echo ""
echo -e "${GREEN}🎉 Setup complete! Open your browser to get started.${NC}"
echo ""
