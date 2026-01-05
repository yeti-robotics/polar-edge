#! /bin/bash

# Define color codes
RED='\033[0;31m'
NC='\033[0m' # No Color

if command -v docker &> /dev/null; then
    echo "Docker detected, starting Postgres container..."
    docker compose up -d
    if [ $? -ne 0 ]; then
        echo -e "${RED}Error: Failed to start Postgres container. Ensure Docker is running and try again. Exiting.${NC}" >&2
        exit 1
    fi

    # Wait for the Postgres container to be ready
    echo "Waiting for Postgres container to be ready..."
    while ! docker exec polar_postgres pg_isready -U postgres -d scout &> /dev/null; do
        sleep 1
    done
    echo "Postgres container is ready."
else
    echo "Docker not detected, checking for local Postgres..."

    # Check if pg_isready command is available
    if ! command -v pg_isready &> /dev/null; then
        echo -e "${RED}Error: pg_isready command not found. Please ensure PostgreSQL is installed.${NC}" >&2
        exit 1
    fi

    # Check if Postgres is running locally
    if pg_isready -U postgres -d scout &> /dev/null; then
        echo "Local Postgres is running."
    else
        echo -e "${RED}Local Postgres is not running. Please start it manually.${NC}" >&2
        exit 1
    fi
fi