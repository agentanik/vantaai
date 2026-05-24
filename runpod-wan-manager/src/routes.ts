import { Router } from 'express';
import { ModelController } from './controllers/modelController';
import { JobController } from './controllers/jobController';
import { CostController } from './controllers/costController';
import { ProviderController } from './controllers/providerController';
import { MonitoringController } from './controllers/monitoringController';
import { WorkflowController } from './controllers/workflowController';
import { AuditLogController } from './controllers/auditLogController';
import { OutputController } from './controllers/outputController';
import { apiKeyController } from './controllers/apiKeyController';

import { authMiddleware, requireScope } from './middleware/authMiddleware';
import { rateLimitMiddleware } from './middleware/rateLimitMiddleware';
import { requireAdmin } from './middleware/roleMiddleware';
import { getRunpodHealth } from './api/v1/health/runpod';
import { getStorageHealth } from './api/v1/health/storage';

const router = Router();

// Public Health Check Endpoint
router.get('/health', MonitoringController.getHealth);
router.get('/health/runpod', getRunpodHealth);
router.get('/health/storage', getStorageHealth);

// Protect all /api routes with Auth and Rate limiting
router.use('/api', rateLimitMiddleware);
router.use('/api', authMiddleware);

// API Key Management Routes
router.post('/api/v1/keys', requireScope('keys:write'), apiKeyController.createKey);
router.get('/api/v1/keys', requireScope('keys:read'), apiKeyController.listKeys);
router.get('/api/v1/keys/:id', requireScope('keys:read'), apiKeyController.getKey);
router.delete('/api/v1/keys/:id', requireScope('keys:write'), apiKeyController.revokeKey);
router.post('/api/v1/keys/:id/rotate', requireScope('keys:write'), apiKeyController.rotateKey);

// Model Registry Routes
router.get('/api/models', requireScope('models:read'), ModelController.listModels);
router.get('/api/models/:id', requireScope('models:read'), ModelController.getModel);
router.post('/api/models/toggle', requireAdmin, requireScope('models:write'), ModelController.toggleModel);

// Job Queue and State Routes
router.post('/api/jobs', requireScope('jobs:write'), JobController.createJob);
router.post('/api/video/generate', requireScope('jobs:write'), JobController.createJob);
router.post('/api/v1/video/generate', requireScope('jobs:write'), JobController.createJob);
router.get('/api/jobs', requireScope('jobs:read'), JobController.listJobs);
router.get('/api/video/jobs', requireScope('jobs:read'), JobController.listJobs);
router.get('/api/jobs/:id', requireScope('jobs:read'), JobController.getJob);
router.get('/api/video/status/:id', requireScope('jobs:read'), JobController.getJob);
router.get('/api/v1/video/status/:id', requireScope('jobs:read'), JobController.getJob);
router.post('/api/jobs/:id/cancel', requireScope('jobs:write'), JobController.cancelJob);
router.post('/api/video/cancel/:id', requireScope('jobs:write'), JobController.cancelJob);
router.post('/api/v1/video/cancel/:id', requireScope('jobs:write'), JobController.cancelJob);

// Financial / Credit / Budget Routes
router.post('/api/costs/estimate', requireScope('billing:read'), CostController.estimateCost);
router.get('/api/costs/ledger', requireScope('billing:read'), CostController.getLedger);
router.get('/api/costs/stats', requireScope('billing:read'), CostController.getCostStats);

// Compute Provider Routes
router.get('/api/providers', requireAdmin, requireScope('pod:read'), ProviderController.listProviders);
router.get('/api/providers/pods', requireAdmin, requireScope('pod:read'), ProviderController.listPods);
router.get('/api/pod/status', requireAdmin, requireScope('pod:read'), ProviderController.listPods);
router.post('/api/providers/start', requireAdmin, requireScope('pod:write'), ProviderController.startPod);
router.post('/api/pod/start', requireAdmin, requireScope('pod:write'), ProviderController.startPod);
router.post('/api/providers/stop', requireAdmin, requireScope('pod:write'), ProviderController.stopPod);
router.post('/api/pod/stop', requireAdmin, requireScope('pod:write'), ProviderController.stopPod);
router.post('/api/admin/emergency-stop', requireAdmin, requireScope('admin:*'), ProviderController.emergencyStop);

// Enterprise GPU Lifecycle and Admin Overview Routes
router.post('/api/v1/pod/create-or-connect', requireAdmin, requireScope('pod:write'), ProviderController.createOrConnectPod);
router.post('/api/v1/pod/start', requireAdmin, requireScope('pod:write'), ProviderController.startPod);
router.post('/api/v1/pod/stop', requireAdmin, requireScope('pod:write'), ProviderController.stopPod);
router.get('/api/v1/pod/status', requireAdmin, requireScope('pod:read'), ProviderController.getPodStatus);
router.post('/api/v1/pod/emergency-stop', requireAdmin, requireScope('admin:*'), ProviderController.emergencyStop);
router.get('/api/v1/pod/comfy-url', requireScope('pod:read'), ProviderController.getComfyUrl);
router.get('/api/v1/admin/overview', requireAdmin, requireScope('admin:*'), ProviderController.getAdminOverview);


// Monitoring Routes
router.get('/api/monitoring/metrics', requireAdmin, requireScope('admin:*'), MonitoringController.getMetrics);
router.get('/api/monitoring/storage', requireAdmin, requireScope('admin:*'), MonitoringController.getStorage);

// Workflow Routes
router.get('/api/workflows', requireScope('admin:*'), WorkflowController.listWorkflows);
router.get('/api/workflows/:id', requireScope('admin:*'), WorkflowController.getWorkflow);
router.post('/api/v1/workflows/validate', requireScope('jobs:write'), WorkflowController.validateWorkflow);

// Audit Logging Route
router.get('/api/audit-logs', requireAdmin, requireScope('admin:*'), AuditLogController.listLogs);

// Streaming output download
router.get('/api/output/view/:filename', requireScope('video:read'), OutputController.viewOutput);
router.get('/api/v1/outputs/:filename', requireScope('video:read'), OutputController.viewOutput);

export default router;

