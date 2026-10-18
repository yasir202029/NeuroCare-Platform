#!/usr/bin/env bash
#
# NeuroCare Platform - Deployment Script
# ============================================================================
# Usage: ./deploy.sh [dev|prod] [action]
#   action: up, down, restart, build, logs, status, clean
# ============================================================================

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

ENVIRONMENT="${1:-dev}"
ACTION="${2:-up}"

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="${PROJECT_DIR}/.env"

# Validate environment
if [[ "$ENVIRONMENT" != "dev" && "$ENVIRONMENT" != "prod" ]]; then
    echo -e "${RED}Error: Environment must be 'dev' or 'prod'${NC}"
    exit 1
fi

# Load environment variables
if [[ -f "$ENV_FILE" ]]; then
    echo -e "${BLUE}Loading environment from ${ENV_FILE}${NC}"
    set -a
    source "$ENV_FILE"
    set +a
else
    echo -e "${YELLOW}Warning: .env file not found, using defaults${NC}"
fi

# Export required variables
export DATABASE_URL="${DATABASE_URL:-postgresql://clinic:clinic@postgres:5432/clinic}"
export JWT_ACCESS_SECRET="${JWT_ACCESS_SECRET:-dev-access-secret-change-me-in-production}"
export JWT_REFRESH_SECRET="${JWT_REFRESH_SECRET:-dev-refresh-secret-change-me-in-production}"
export NEXT_PUBLIC_API_BASE_URL="${NEXT_PUBLIC_API_BASE_URL:-http://localhost:4000}"
export APP_BASE_URL="${APP_BASE_URL:-http://localhost:3000}"
export CORS_ORIGIN="${CORS_ORIGIN:-http://localhost:3000}"
export POSTGRES_PORT="${POSTGRES_PORT:-5432}"
export BACKEND_PORT="${BACKEND_PORT:-4000}"
export FRONTEND_PORT="${FRONTEND_PORT:-3000}"
export NGINX_PORT="${NGINX_PORT:-80}"
export NGINX_SSL_PORT="${NGINX_SSL_PORT:-443}"

COMPOSE_FILE="docker-compose.yml"
COMPOSE_CMD="docker compose -f ${COMPOSE_FILE}"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  NeuroCare Platform Deployment${NC}"
echo -e "${BLUE}  Environment: ${ENVIRONMENT}${NC}"
echo -e "${BLUE}  Action: ${ACTION}${NC}"
echo -e "${BLUE}========================================${NC}"

case "$ACTION" in
    up)
        echo -e "${GREEN}Starting NeuroCare Platform...${NC}"
        $COMPOSE_CMD up -d
        echo -e "${GREEN}Platform started successfully!${NC}"
        echo ""
        echo "Access points:"
        echo "  Frontend:  http://localhost:${FRONTEND_PORT}"
        echo "  Backend:   http://localhost:${BACKEND_PORT}/api/v1/health"
        echo "  Engine:    http://localhost:4000/api/v1/engine"
        echo ""
        ;;

    down)
        echo -e "${YELLOW}Stopping NeuroCare Platform...${NC}"
        $COMPOSE_CMD down
        echo -e "${GREEN}Platform stopped.${NC}"
        ;;

    restart)
        echo -e "${YELLOW}Restarting NeuroCare Platform...${NC}"
        $COMPOSE_CMD down
        $COMPOSE_CMD up -d
        echo -e "${GREEN}Platform restarted.${NC}"
        ;;

    build)
        echo -e "${YELLOW}Building NeuroCare Platform images...${NC}"
        $COMPOSE_CMD build --no-cache
        echo -e "${GREEN}Build complete.${NC}"
        ;;

    logs)
        $COMPOSE_CMD logs -f --tail=100
        ;;

    status)
        $COMPOSE_CMD ps
        ;;

    clean)
        echo -e "${YELLOW}Cleaning up NeuroCare Platform...${NC}"
        $COMPOSE_CMD down -v --rmi all
        echo -e "${GREEN}Cleanup complete.${NC}"
        ;;

    *)
        echo -e "${RED}Unknown action: ${ACTION}${NC}"
        echo "Usage: $0 [dev|prod] [up|down|restart|build|logs|status|clean]"
        exit 1
        ;;
esac