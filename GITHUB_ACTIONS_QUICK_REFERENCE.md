# GitHub Actions Quick Reference

## 🚀 Quick Start

### 1. Setup Secrets
```bash
./setup-github-secrets.sh
```

### 2. Push to GitHub
```bash
git add .
git commit -m "Add GitHub Actions CI/CD pipeline"
git push origin main
```

### 3. Monitor Workflow
- Go to GitHub > Actions tab
- Check job status and logs

## 📋 Workflow Stages

| Stage | Jobs | Trigger |
|-------|------|---------|
| **Install** | `install-dependencies`, `install-frontend-deps`, `install-terraform` | PR, main, develop |
| **Test** | `test-backend`, `test-frontend`, `test-docker`, `security-scan` | PR, main, develop |
| **Build** | `build-backend`, `build-frontend` | main only |
| **Deploy** | `deploy-infrastructure`, `deploy-application`, `notify-deployment` | main only |

## 🔄 Workflow Behavior

### On Pull Request
- ✅ Install dependencies
- ✅ Run tests
- ✅ Code quality checks

### On Push to Main
- ✅ Install dependencies
- ✅ Run tests
- ✅ Build Docker images
- ✅ Deploy infrastructure
- ✅ Deploy application
- ✅ Security scans
- ✅ Notifications

### On Push to Develop
- ✅ Install dependencies
- ✅ Run tests
- ✅ Deploy to staging

## 🔑 Required Secrets

### AWS Configuration
```bash
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_DEFAULT_REGION=us-east-1
```

### ECR Configuration
```bash
ECR_REGISTRY=your_account_id.dkr.ecr.us-east-1.amazonaws.com
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

### Check Workflow Status
```bash
# View workflow runs
gh run list --repo owner/repo

# View specific run logs
gh run view --repo owner/repo --log

# Download artifacts
gh run download --repo owner/repo <run-id>
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

### GitHub Actions Analytics
- Workflow success rate
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

### Stop Workflow
```bash
# Cancel running workflow
gh run cancel --repo owner/repo <run-id>
```

### Manual Rollback
```bash
# Deploy specific version
docker pull $ECR_REGISTRY/backend:$VERSION
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

### 3. Pull Request Process
1. Create feature branch
2. Implement changes
3. Add tests
4. Create pull request
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
  name: Deploy to Staging
  runs-on: ubuntu-latest
  environment: staging
```

### Modify Deployment Strategy
```yaml
deploy-blue-green:
  steps:
    - name: Deploy Blue
      run: |
        aws ecs update-service --cluster $CLUSTER --service $SERVICE --desired-count 0
        aws ecs update-service --cluster $CLUSTER --service $NEW_SERVICE --desired-count 2
```

## 📞 Support

### Workflow Issues
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

## 🎯 Workflow Flow Diagram

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
- [ ] Set up GitHub secrets
- [ ] Configure AWS credentials
- [ ] Set up ECR repositories
- [ ] Set up application URLs
- [ ] Configure notifications (optional)
- [ ] Test workflow on feature branch

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

## 🔄 Key Differences from GitLab

### GitHub Actions Advantages
- **Native GitHub Integration**: Seamless with GitHub repositories
- **Better UI**: More intuitive workflow visualization
- **Matrix Builds**: Run jobs on multiple configurations
- **Reusable Workflows**: Share across repositories
- **Environment Protection**: Protect production deployments

### ECR vs GitLab Container Registry
- **AWS Native**: Better AWS service integration
- **Cost Effective**: Pay only for storage and transfer
- **Security**: IAM integration for access control
- **Scalability**: Enterprise-grade container registry

### Security Features
- **GitHub Security Tab**: Integrated security scanning
- **Dependabot**: Automated dependency updates
- **Code Scanning**: Advanced code analysis
- **Secret Scanning**: Automatic secret detection 