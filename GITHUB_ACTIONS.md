# GitHub Actions CI/CD Pipeline Documentation

This document describes the complete GitHub Actions CI/CD pipeline for the Database Dump & Restore Tool.

## 🚀 Pipeline Overview

The pipeline consists of 4 main stages:
1. **Install** - Install dependencies
2. **Test** - Run tests and quality checks
3. **Build** - Build Docker images
4. **Deploy** - Deploy to AWS

## 📋 Pipeline Behavior

### On Pull Request
- ✅ **Install Dependencies** (Backend & Frontend)
- ✅ **Run Tests** (Unit & Integration)
- ✅ **Code Quality Checks** (Linting, Security)

### On Push to Main
- ✅ **Install Dependencies** (Backend, Frontend & Terraform)
- ✅ **Run Tests** (Unit, Integration & Docker)
- ✅ **Build Docker Images** (Backend & Frontend)
- ✅ **Deploy Infrastructure** (Terraform)
- ✅ **Deploy Application** (ECS)
- ✅ **Security Scans** (Trivy)
- ✅ **Notifications** (Slack)

### On Push to Develop
- ✅ **Install Dependencies** (Backend & Frontend)
- ✅ **Run Tests** (Unit & Integration)
- ✅ **Deploy to Staging** (Terraform)

## 🔧 Pipeline Stages

### 1. Install Stage

#### `install-dependencies`
- **Purpose**: Install Python dependencies for backend
- **Runner**: `ubuntu-latest`
- **Cache**: Python dependencies
- **Triggers**: Pull requests, main, develop

#### `install-frontend-deps`
- **Purpose**: Install Node.js dependencies for frontend
- **Runner**: `ubuntu-latest`
- **Cache**: Node.js dependencies
- **Triggers**: Pull requests, main, develop

#### `install-terraform`
- **Purpose**: Initialize Terraform for deployment
- **Runner**: `ubuntu-latest`
- **Triggers**: main only

### 2. Test Stage

#### `test-backend`
- **Purpose**: Run backend quality checks
- **Dependencies**: `install-dependencies`
- **Tests**: Code linting (black, flake8)
- **Triggers**: Pull requests, main, develop

#### `test-frontend`
- **Purpose**: Run frontend tests and quality checks
- **Dependencies**: `install-frontend-deps`
- **Tests**: Unit tests, integration tests, linting
- **Coverage**: Generates coverage reports
- **Triggers**: Pull requests, main, develop

#### `test-docker`
- **Purpose**: Test Docker builds
- **Runner**: `ubuntu-latest`
- **Tests**: Backend and frontend Docker builds
- **Triggers**: Pull requests, main

#### `security-scan`
- **Purpose**: Security vulnerability scanning
- **Dependencies**: `build-backend`, `build-frontend`
- **Tool**: Trivy
- **Scans**: Docker images in ECR for vulnerabilities
- **Triggers**: main only
- **Failure**: Allowed (non-blocking)

### 3. Build Stage

#### `build-backend`
- **Purpose**: Build and push backend Docker image
- **Runner**: `ubuntu-latest`
- **Registry**: Amazon ECR
- **Tags**: `latest` and commit SHA
- **Triggers**: main only

#### `build-frontend`
- **Purpose**: Build and push frontend Docker image
- **Runner**: `ubuntu-latest`
- **Registry**: Amazon ECR
- **Tags**: `latest` and commit SHA
- **Triggers**: main only

### 4. Deploy Stage

#### `deploy-infrastructure`
- **Purpose**: Deploy AWS infrastructure using Terraform
- **Runner**: `ubuntu-latest`
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

## 🔑 Required Secrets

### GitHub Repository Secrets

Set these in GitHub Repository Settings > Secrets and variables > Actions:

#### AWS Configuration
```bash
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_DEFAULT_REGION=us-east-1
```

#### ECR Configuration
```bash
ECR_REGISTRY=your_account_id.dkr.ecr.us-east-1.amazonaws.com
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

## 🏗️ Pipeline Configuration

### Cache Configuration
```yaml
- name: Cache Python dependencies
  uses: actions/cache@v3
  with:
    path: backend/venv
    key: ${{ runner.os }}-python-${{ hashFiles('backend/requirements.txt') }}
```

### Artifacts
- **Test Results**: Coverage reports and test artifacts
- **Build Artifacts**: Docker images in ECR
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

3. **Create Pull Request**
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
- **Backend**: Code quality checks (black, flake8)
- **Frontend**: Jest coverage reports (50% threshold)
- **Reports**: Available in GitHub Actions

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
gh run list --repo owner/repo

# Verify requirements.txt
pip check -r backend/requirements.txt
```

#### 2. Tests Fail
```bash
# Run backend linting locally
cd backend && black --check app/ && flake8 app/ --max-line-length=88

# Run frontend tests locally
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

#### Check Workflow Status
```bash
# View workflow runs
gh run list --repo owner/repo

# View specific run logs
gh run view --repo owner/repo --log
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
     name: Deploy to Staging
     runs-on: ubuntu-latest
     environment: staging
   ```

### Modifying Deployment Strategy
1. **Blue-Green Deployment**
   ```yaml
   deploy-blue-green:
     steps:
       - name: Deploy Blue
         run: |
           aws ecs update-service --cluster $CLUSTER --service $SERVICE --desired-count 0
           aws ecs update-service --cluster $CLUSTER --service $NEW_SERVICE --desired-count 2
   ```

2. **Rolling Deployment**
   ```yaml
   deploy-rolling:
     steps:
       - name: Rolling Deploy
         run: |
           aws ecs update-service --cluster $CLUSTER --service $SERVICE --force-new-deployment
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

### 3. Pull Request Process
1. Create feature branch
2. Implement changes
3. Add tests
4. Create pull request
5. Code review
6. Merge to main

### 4. Monitoring
- **Pipeline Metrics**: GitHub Actions Analytics
- **Application Metrics**: CloudWatch
- **Error Tracking**: Application logs

## 🚨 Emergency Procedures

### Rollback Deployment
```bash
# Rollback to previous version
aws ecs update-service --cluster dev-cluster --service dev-backend-service --task-definition dev-backend:previous

# Or use GitHub UI
# Go to Actions > Deploy Application > Re-run jobs
```

### Stop Workflow
```bash
# Cancel running workflow
gh run cancel --repo owner/repo <run-id>
```

### Manual Deployment
```bash
# Deploy specific version
docker pull $ECR_REGISTRY/backend:$VERSION
aws ecs update-service --cluster dev-cluster --service dev-backend-service --force-new-deployment
```

## 📞 Support

For pipeline issues:
1. Check GitHub Actions logs
2. Review test results and coverage
3. Verify AWS credentials and permissions
4. Check Terraform state and logs
5. Monitor ECS service health

### Useful Links
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Terraform Documentation](https://www.terraform.io/docs)
- [AWS ECS Documentation](https://docs.aws.amazon.com/ecs/)
- [Docker Documentation](https://docs.docker.com/)

## 🎯 Key Differences from GitLab

### GitHub Actions Features
- **Native GitHub Integration**: Seamless integration with GitHub repositories
- **Matrix Builds**: Run jobs on multiple configurations
- **Reusable Workflows**: Share workflows across repositories
- **Environment Protection**: Protect production deployments
- **Manual Triggers**: Manual workflow execution
- **Self-hosted Runners**: Use your own infrastructure

### ECR vs GitLab Container Registry
- **Amazon ECR**: AWS-native container registry
- **Better Integration**: Seamless AWS service integration
- **Cost Optimization**: Pay only for storage and data transfer
- **Security**: IAM integration for access control

### Security Features
- **GitHub Security Tab**: Integrated security scanning
- **Dependabot**: Automated dependency updates
- **Code Scanning**: Advanced code analysis
- **Secret Scanning**: Automatic secret detection 