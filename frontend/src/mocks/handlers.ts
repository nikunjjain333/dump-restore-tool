import { http, HttpResponse, delay as mswDelay, DefaultBodyType } from 'msw';
import { mockConfigs, mockOperations } from './data';
import { DatabaseConfig, OperationLog } from '../context/DatabaseContext';

// Type for the request body
type ConfigRequest = Omit<DatabaseConfig, 'id' | 'created_at' | 'updated_at'>;

let configs = [...mockConfigs];
let operations = [...mockOperations];

// Helper function to simulate network delay
const delay = process.env.NODE_ENV === 'test' ? 0 : 100;

export const handlers = [
  // Get all configs
  http.get('/api/configs', async () => {
    if (process.env.NODE_ENV !== 'test') {
      await mswDelay(100);
    }
    return HttpResponse.json(configs);
  }),

  // Get single config
  http.get('/api/configs/:id', async ({ params }) => {
    const config = configs.find(c => c.id === Number(params.id));
    
    if (!config) {
      return new HttpResponse(
        JSON.stringify({ message: 'Config not found' }), 
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    if (process.env.NODE_ENV !== 'test') {
      await mswDelay(100);
    }
    return HttpResponse.json(config);
  }),

  // Create config
  http.post('/api/configs', async ({ request }) => {
    const newConfig = await request.json() as Omit<DatabaseConfig, 'id' | 'created_at' | 'updated_at'>;
    const config: DatabaseConfig = {
      ...newConfig,
      id: Math.max(0, ...configs.map(c => c.id ?? 0)) + 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    configs.push(config);
    
    if (process.env.NODE_ENV !== 'test') {
      await mswDelay(100);
    }
    
    return HttpResponse.json(config, { status: 201 });
  }),

  // Update config
  http.put('/api/configs/:id', async ({ request, params }) => {
    const index = configs.findIndex(c => c.id === Number(params.id));
    
    if (index === -1) {
      return new HttpResponse(
        JSON.stringify({ message: 'Configuration not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    const updateData = await request.json() as Partial<ConfigRequest>;
    const updatedConfig = {
      ...configs[index],
      ...updateData,
      id: Number(params.id),
      updated_at: new Date().toISOString(),
    };
    
    configs[index] = updatedConfig;
    
    if (process.env.NODE_ENV !== 'test') {
      await mswDelay(100);
    }
    
    return HttpResponse.json(updatedConfig);
  }),

  // Delete config
  http.delete('/api/configs/:id', async ({ params }) => {
    const index = configs.findIndex(c => c.id === Number(params.id));
    
    if (index === -1) {
      return new HttpResponse(
        JSON.stringify({ message: 'Configuration not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    configs.splice(index, 1);
    
    if (process.env.NODE_ENV !== 'test') {
      await mswDelay(100);
    }
    
    return new HttpResponse(null, { status: 204 });
  }),

  // Execute dump operation
  http.post('/api/operations/dump/:configId', async ({ params }) => {
    const config = configs.find(c => c.id === Number(params.configId));
    
    if (!config || !config.id) {
      return new HttpResponse(
        JSON.stringify({ message: 'Config not found or invalid' }), 
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    const newOperation: OperationLog = {
      id: Math.max(0, ...operations.map(o => o.id)) + 1,
      config_id: config.id,
      operation_type: 'dump',
      status: 'in_progress',
      file_path: `/dumps/backup_${new Date().toISOString().replace(/[:.]/g, '-')}.sql`,
      start_time: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };
    
    operations.unshift(newOperation);
    
    if (process.env.NODE_ENV !== 'test') {
      await mswDelay(1000); // Simulate longer operation
    }
    
    return HttpResponse.json(newOperation, { status: 201 });
  }),

  // Execute restore operation
  http.post(
    '/api/operations/restore/:configId',
    async ({ request, params }) => {
      const { filePath } = await request.json() as { filePath: string };
      const config = configs.find(c => c.id === Number(params.configId));
      
      if (!config || !config.id) {
        return new HttpResponse(
          JSON.stringify({ message: 'Config not found or invalid' }), 
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }
      
      const newOperation: OperationLog = {
        id: Math.max(0, ...operations.map(o => o.id)) + 1,
        config_id: config.id,
        operation_type: 'restore',
        status: 'in_progress',
        file_path: filePath,
        start_time: new Date().toISOString(),
        end_time: new Date(Date.now() + 2000).toISOString(), // 2 seconds later
        created_at: new Date().toISOString(),
      };
      
      operations.unshift(newOperation);
      
      if (process.env.NODE_ENV !== 'test') {
        await mswDelay(2000); // Simulate longer operation
      }
      
      return HttpResponse.json(newOperation, { status: 201 });
    }
  ),

  // Get operations
  http.get('/api/operations', ({ request }) => {
    const url = new URL(request.url);
    const configId = url.searchParams.get('configId');
    
    let filteredOperations = [...operations];
    
    if (configId) {
      filteredOperations = filteredOperations.filter(
        op => op.config_id === Number(configId)
      );
    }
    
    if (process.env.NODE_ENV !== 'test') {
      // No delay in test environment
      return HttpResponse.json(filteredOperations);
    }
    
    return HttpResponse.json(filteredOperations);
  }),

  // Get operation by ID
  http.get('/api/operations/:id', ({ params }) => {
    const operation = operations.find(op => op.id === Number(params.id));
    
    if (!operation) {
      return new HttpResponse(
        JSON.stringify({ message: 'Operation not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    return HttpResponse.json(operation);
  }),
];
