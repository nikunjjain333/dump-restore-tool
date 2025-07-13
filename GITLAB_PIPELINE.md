# GitLab CI/CD Pipeline Documentation

This document describes the complete GitLab CI/CD pipeline for the Database Dump & Restore Tool.

## 🚀 Pipeline Overview

The pipeline consists of 4 main stages:
1. **Install** - Install dependencies
2. **Test** - Run tests and quality checks
3. **Build** - Build Docker images
4. **Deploy** - Deploy to AWS

## 📋 Pipeline Behavior

### On Commit (Any Branch)
- ✅ **Install Dependencies** (Backend & Frontend)
- ✅ **Run Tests** (Unit & Integration)
- ✅ **Code Quality Checks** (Linting, Security)

### On Merge to Main
- ✅ **Install Dependencies** (Backend, Frontend & Terraform)
- ✅ **Run Tests** (Unit, Integration & Docker)
- ✅ **Build Docker Images** (Backend & Frontend)
- ✅ **Deploy Infrastructure** (Terraform)
- ✅ **Deploy Application** (ECS)
- ✅ **Security Scans** (Trivy)
- ✅ **Notifications** (Slack)

## 🔧 Pipeline Stages

### 1. Install Stage

#### `install-dependencies`
- **Purpose**: Install Python dependencies for backend
- **Image**: `python:3.11-slim`
- **Artifacts**: `backend/venv/`
- **Triggers**: Merge requests, main, develop

#### `install-frontend-deps`
- **Purpose**: Install Node.js dependencies for frontend
- **Image**: `node:18-alpine`
- **Artifacts**: `frontend/node_modules/`
- **Triggers**: Merge requests, main, develop

#### `install-terraform`
- **Purpose**: Initialize Terraform for deployment
- **Image**: `hashicorp/terraform:1.5.0`
- **Artifacts**: `terraform/.terraform/`
- **Triggers**: main only

### 2. Test Stage

#### `test-backend`
- **Purpose**: Run backend tests and quality checks
- **Dependencies**: `install-dependencies`
- **Tests**: Unit tests, integration tests, linting
- **Coverage**: Generates coverage reports
- **Triggers**: Merge requests, main, develop

#### `test-frontend`
- **Purpose**: Run frontend tests and quality checks
- **Dependencies**: `install-frontend-deps`
- **Tests**: Unit tests, integration tests, linting
- **Coverage**: Generates coverage reports
- **Triggers**: Merge requests, main, develop

#### `test-docker`
- **Purpose**: Test Docker builds
- **Image**: `docker:20.10.16`
- **Tests**: Backend and frontend Docker builds
- **Triggers**: Merge requests, main

#### `security-scan`
- **Purpose**: Security vulnerability scanning
- **Tool**: Trivy
- **Scans**: Docker images for vulnerabilities
- **Triggers**: main only
- **Failure**: Allowed (non-blocking)

### 3. Build Stage

#### `build-backend`
- **Purpose**: Build and push backend Docker image
- **Image**: `docker:20.10.16`
- **Registry**: GitLab Container Registry
- **Tags**: `latest` and commit SHA
- **Triggers**: main only

#### `build-frontend`
- **Purpose**: Build and push frontend Docker image
- **Image**: `docker:20.10.16`
- **Registry**: GitLab Container Registry
- **Tags**: `latest` and commit SHA
- **Triggers**: main only

### 4. Deploy Stage

#### `deploy-infrastructure`
- **Purpose**: Deploy AWS infrastructure using Terraform
- **Image**: `hashicorp/terraform:1.5.0`
- **Environment**: Production
- **Triggers**: main only

#### `deploy-application`
- **Purpose**: Deploy application to ECS
- **Dependencies**: `build-backend`, `build-frontend`
- **Environment**: Production
- **Triggers**: main only

#### `deploy-staging`
- **Purpose**: Deploy to staging environment
- **Environment**: Staging
- **Triggers**: develop branch

#### `notify-deployment`
- **Purpose**: Send deployment notifications
- **Channel**: Slack
- **Triggers**: main only (on success)

#### `cleanup-old-images`
- **Purpose**: Clean up old Docker images
- **Triggers**: main only (always runs)

## 🔑 Required Variables

### GitLab CI/CD Variables

Set these in GitLab Project Settings > CI/CD > Variables:

#### AWS Configuration
```bash
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_DEFAULT_REGION=us-east-1
```

#### Application Configuration
```bash
APPLICATION_URL=https://your-app-domain.com
ECS_CLUSTER_NAME=dev-cluster
BACKEND_SERVICE_NAME=dev-backend-service
FRONTEND_SERVICE_NAME=dev-frontend-service
```

#### Notification Configuration
```bash
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK
```

#### Staging Configuration
```bash
STAGING_URL=https://staging.your-app-domain.com
```

### Protected Variables

Mark these variables as **Protected**:
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `SLACK_WEBHOOK_URL`

## 🏗️ Pipeline Configuration

### Cache Configuration
```yaml
cache:
  key: ${CI_COMMIT_REF_SLUG}
  paths:
    - backend/venv/
    - frontend/node_modules/
    - .terraform/
```

### Artifacts
- **Test Results**: JUnit XML reports
- **Coverage Reports**: HTML and XML coverage
- **Build Artifacts**: Docker images in registry
- **Terraform State**: State files for infrastructure

## 🔄 Pipeline Flow

### Development Workflow
1. **Create Feature Branch**
   ```bash
   git checkout -b feature/new-feature
   ```

2. **Make Changes & Commit**
   ```bash
   git add .
   git commit -m "Add new feature"
   git push origin feature/new-feature
   ```

3. **Create Merge Request**
   - Pipeline runs: Install + Test stages
   - Code review and approval
   - Merge to main

### Production Deployment
1. **Merge to Main**
   - Triggers full pipeline
   - All stages execute

2. **Deployment Process**
   - Infrastructure deployment (Terraform)
   - Application deployment (ECS)
   - Health checks and monitoring

3. **Post-Deployment**
   - Security scans
   - Notifications
   - Cleanup

## 📊 Monitoring & Reporting

### Test Coverage
- **Backend**: Python coverage with pytest-cov
- **Frontend**: Jest coverage reports
- **Reports**: Available in GitLab UI

### Security Scanning
- **Tool**: Trivy
- **Scope**: Docker images
- **Severity**: HIGH, CRITICAL
- **Action**: Non-blocking (allows deployment)

### Quality Gates
- **Linting**: Black (Python), ESLint (JavaScript)
- **Tests**: Must pass all unit and integration tests
- **Build**: Docker builds must succeed
- **Security**: Vulnerabilities reported but don't block

## 🛠️ Troubleshooting

### Common Issues

#### 1. Dependency Installation Fails
```bash
# Check cache
gitlab-ci cache clear

# Verify requirements.txt
pip check -r backend/requirements.txt
```

#### 2. Tests Fail
```bash
# Run tests locally
cd backend && python -m pytest
cd frontend && npm test
```

#### 3. Docker Build Fails
```bash
# Test locally
docker build -t test-backend backend/
docker build -t test-frontend frontend/
```

#### 4. Terraform Deployment Fails
```bash
# Check AWS credentials
aws sts get-caller-identity

# Validate Terraform
cd terraform && terraform validate
```

#### 5. ECS Deployment Fails
```bash
# Check ECS service status
aws ecs describe-services --cluster dev-cluster --services dev-backend-service

# View service logs
aws logs tail /ecs/dev-app --follow
```

### Debug Commands

#### Check Pipeline Status
```bash
# View pipeline logs
gitlab-ci logs --job=test-backend

# Download artifacts
gitlab-ci artifacts download
```

#### Manual Deployment
```bash
# Deploy infrastructure
cd terraform
terraform apply

# Deploy application
aws ecs update-service --cluster dev-cluster --service dev-backend-service --force-new-deployment
```

## 🔧 Customization

### Adding New Tests
1. **Backend Tests**
   ```python
   # Add to backend/tests/
   def test_new_feature():
       assert True
   ```

2. **Frontend Tests**
   ```javascript
   // Add to frontend/src/__tests__/
   test('new feature', () => {
     expect(true).toBe(true);
   });
   ```

### Adding New Environments
1. **Create Environment Variable**
   ```bash
   STAGING_URL=https://staging.example.com
   ```

2. **Add Deployment Job**
   ```yaml
   deploy-staging:
     stage: deploy
     environment:
       name: staging
       url: $STAGING_URL
   ```

### Modifying Deployment Strategy
1. **Blue-Green Deployment**
   ```yaml
   deploy-blue-green:
     script:
       - aws ecs update-service --cluster $CLUSTER --service $SERVICE --desired-count 0
       - aws ecs update-service --cluster $CLUSTER --service $NEW_SERVICE --desired-count 2
   ```

2. **Rolling Deployment**
   ```yaml
   deploy-rolling:
     script:
       - aws ecs update-service --cluster $CLUSTER --service $SERVICE --force-new-deployment
   ```

## 📈 Best Practices

### 1. Branch Strategy
- **main**: Production deployments
- **develop**: Staging deployments
- **feature/***: Development branches

### 2. Commit Messages
```
feat: add new database type support
fix: resolve connection timeout issue
docs: update API documentation
test: add unit tests for config service
```

### 3. Merge Request Process
1. Create feature branch
2. Implement changes
3. Add tests
4. Create merge request
5. Code review
6. Merge to main

### 4. Monitoring
- **Pipeline Metrics**: GitLab Analytics
- **Application Metrics**: CloudWatch
- **Error Tracking**: Application logs

## 🚨 Emergency Procedures

### Rollback Deployment
```bash
# Rollback to previous version
aws ecs update-service --cluster dev-cluster --service dev-backend-service --task-definition dev-backend:previous

# Or use GitLab UI
# Go to Deployments > Environments > Production > Rollback
```

### Stop Pipeline
```bash
# Cancel running pipeline
gitlab-ci cancel --pipeline-id $PIPELINE_ID
```

### Manual Deployment
```bash
# Deploy specific version
docker pull $CI_REGISTRY_IMAGE/backend:$VERSION
aws ecs update-service --cluster dev-cluster --service dev-backend-service --force-new-deployment
```

## 📞 Support

For pipeline issues:
1. Check GitLab CI/CD logs
2. Review test results and coverage
3. Verify AWS credentials and permissions
4. Check Terraform state and logs
5. Monitor ECS service health

### Useful Links
- [GitLab CI/CD Documentation](https://docs.gitlab.com/ee/ci/)
- [Terraform Documentation](https://www.terraform.io/docs)
- [AWS ECS Documentation](https://docs.aws.amazon.com/ecs/)
- [Docker Documentation](https://docs.docker.com/) 