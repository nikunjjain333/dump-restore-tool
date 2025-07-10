FROM python:3.11-slim

WORKDIR /app

# Step 1: Install lsb-release, wget, and gnupg first
RUN apt-get update && \
    apt-get install -y lsb-release wget gnupg ca-certificates && \
    rm -rf /var/lib/apt/lists/*

# Step 2: Add PostgreSQL 16 repository
RUN echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list && \
    wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | apt-key add -

# Step 3: Install database tools
RUN apt-get update && \
    apt-get install -y \
        curl \
        postgresql-client-16 \
        default-mysql-client \
        redis-tools \
        && rm -rf /var/lib/apt/lists/*

# Install Docker CLI only if not already installed
RUN if ! command -v docker > /dev/null 2>&1; then \
      # Add Docker's official GPG key \
      curl -fsSL https://download.docker.com/linux/debian/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg; \
      # Add Docker repository \
      echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/debian $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null; \
      # Install Docker CLI \
      apt-get update && apt-get install -y docker-ce-cli && rm -rf /var/lib/apt/lists/*; \
    fi

# Install Docker Compose only if not already installed
RUN if ! command -v docker-compose > /dev/null 2>&1; then \
      curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose && \
      chmod +x /usr/local/bin/docker-compose; \
    fi

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY ./app ./app

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
