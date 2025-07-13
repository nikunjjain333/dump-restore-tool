# GitLab Pipeline Quick Reference

## 🚀 Quick Start

### 1. Setup Variables
```bash
./setup-gitlab-variables.sh
```

### 2. Push to GitLab
```bash
git add .
git commit -m "Add GitLab CI/CD pipeline"
git push origin main
```

### 3. Monitor Pipeline
- Go to GitLab > CI/CD > Pipelines
- Check job status and logs

## 📋 Pipeline Stages

| Stage | Jobs | Trigger |
|-------|------|---------|
| **Install** | `install-dependencies`, `install-frontend-deps`, `install-terraform` | MR, main, develop |
| **Test** | `test-backend`, `test-frontend`, `test-docker`, `security-scan` | MR, main, develop |
| **Build** | `build-backend`, `build-frontend` | main only |
| **Deploy** | `deploy-infrastructure`, `deploy-application`, `notify-deployment` | main only |

## 🔄 Pipeline Behavior

### On Commit (Any Branch)
- ✅ Install dependencies
- ✅ Run tests
- ✅ Code quality checks

### On Merge to Main
- ✅ Install dependencies
- ✅ Run tests
- ✅ Build Docker images
- ✅ Deploy infrastructure
- ✅ Deploy application
- ✅ Security scans
- ✅ Notifications

## 🔑 Required Variables

### AWS Configuration
```bash
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_DEFAULT_REGION=us-east-1
```

### Application Configuration
```bash
APPLICATION_URL=https://your-app-domain.com
ECS_CLUSTER_NAME=dev-cluster
BACKEND_SERVICE_NAME=dev-backend-service
FRONTEND_SERVICE_NAME=dev-frontend-service
```

### Optional Configuration
```bash
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK
STAGING_URL=https://staging.your-app-domain.com
```

## 🛠️ Common Commands

### Check Pipeline Status
```bash
# View pipeline logs
gitlab-ci logs --job=test-backend

# Download artifacts
gitlab-ci artifacts download
```

### Manual Deployment
```bash
# Deploy infrastructure
cd terraform && terraform apply

# Deploy application
aws ecs update-service --cluster dev-cluster --service dev-backend-service --force-new-deployment
```

### Troubleshooting
```bash
# Check ECS status
aws ecs describe-services --cluster dev-cluster --services dev-backend-service

# View logs
aws logs tail /ecs/dev-app --follow

# Check ALB health
aws elbv2 describe-target-health --target-group-arn $(terraform output -raw backend_target_group_arn)
```

## 📊 Monitoring

### GitLab Analytics
- Pipeline success rate
- Job duration
- Test coverage

### AWS Monitoring
- ECS service health
- ALB target health
- CloudWatch metrics

### Application Monitoring
- Application logs
- Error tracking
- Performance metrics

## 🚨 Emergency Procedures

### Rollback Deployment
```bash
# Rollback to previous version
aws ecs update-service --cluster dev-cluster --service dev-backend-service --task-definition dev-backend:previous
```

### Stop Pipeline
```bash
# Cancel running pipeline
gitlab-ci cancel --pipeline-id $PIPELINE_ID
```

### Manual Rollback
```bash
# Deploy specific version
docker pull $CI_REGISTRY_IMAGE/backend:$VERSION
aws ecs update-service --cluster dev-cluster --service dev-backend-service --force-new-deployment
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

## 🔧 Customization

### Add New Tests
```python
# Backend test
def test_new_feature():
    assert True
```

```javascript
// Frontend test
test('new feature', () => {
  expect(true).toBe(true);
});
```

### Add New Environment
```yaml
deploy-staging:
  stage: deploy
  environment:
    name: staging
    url: $STAGING_URL
```

### Modify Deployment Strategy
```yaml
deploy-blue-green:
  script:
    - aws ecs update-service --cluster $CLUSTER --service $SERVICE --desired-count 0
    - aws ecs update-service --cluster $CLUSTER --service $NEW_SERVICE --desired-count 2
```

## 📞 Support

### Pipeline Issues
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

## 🎯 Pipeline Flow Diagram

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Commit    │───▶│   Install   │───▶│    Test     │───▶│    Build    │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
                                                              │
                                                              ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Deploy    │◀───│  Notify     │◀───│   Deploy    │◀───│   Deploy    │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
│              │    │              │    │              │    │              │
▼              ▼    ▼              ▼    ▼              ▼    ▼              ▼
Infrastructure  App  Security     Slack  ECS         Terraform  Docker   AWS
```

## 📋 Checklist

### Before First Deployment
- [ ] Set up GitLab variables
- [ ] Configure AWS credentials
- [ ] Set up application URLs
- [ ] Configure notifications (optional)
- [ ] Test pipeline on feature branch

### Before Production Deployment
- [ ] All tests passing
- [ ] Security scan clean
- [ ] Code review approved
- [ ] Infrastructure ready
- [ ] Monitoring configured

### After Deployment
- [ ] Verify application is accessible
- [ ] Check ECS service health
- [ ] Monitor application logs
- [ ] Test core functionality
- [ ] Update documentation 