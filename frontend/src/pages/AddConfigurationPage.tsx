import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { 
  Database, 
  Save, 
  Settings, 
  FolderOpen, 
  HardDrive, 

  ArrowLeft,
  Edit
} from 'lucide-react';
import './AddConfigurationPage.scss';
import { api, Config, ConfigCreate, DumpRequest, RestoreRequest } from '../api/client';
import DatabaseTypeSelector from '../components/DatabaseTypeSelector';
import DynamicFormFields from '../components/DynamicFormFields';
import ConfigNameInput from '../components/ConfigNameInput';
import DumpFileNameInput from '../components/DumpFileNameInput';
import SavedConfigsList from '../components/SavedConfigsList';
import StartProcessButton from '../components/StartProcessButton';
import Modal from '../components/Modal';

interface FormData {
  dbType: string;
  configName: string;
  runPath?: string;
  restore_password: string;
  local_database_name?: string;
  dump_file_name?: string;
  restore_username?: string;
  restore_host?: string;
  restore_port?: string;
  [key: string]: any;
}

const AddConfigurationPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [selectedConfig, setSelectedConfig] = useState<Config | null>(null);
  const [savedConfigs, setSavedConfigs] = useState<Config[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingConfigs, setIsLoadingConfigs] = useState(false);
  const hasInitialized = useRef(false);
  const currentConfigRequestId = useRef(0);
  const configLoadedFromNavigation = useRef(false);
  const [modal, setModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
    contentType?: 'text' | 'logs' | 'preformatted';
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info'
  });
  
  const [operationStatus, setOperationStatus] = useState<Record<number, 'idle' | 'running' | 'success' | 'error'>>({});

  const [formData, setFormData] = useState({
    name: '',
    db_type: '',
    params: {} as Record<string, any>,
    run_path: '',
    restore_password: '',
    local_database_name: '',
    dump_file_name: ''
  });

  const { register, handleSubmit, watch, setValue, formState: { errors }, reset } = useForm<FormData>();

  const dbType = watch('dbType') || '';
  const operation = watch('operation') || '';

  // Load configs only once on mount
  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      // Add a small delay to prevent race conditions
      const timer = setTimeout(() => {
        loadSavedConfigs();
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, []);

  // Load selected config from navigation state
  useEffect(() => {
    if (location.state?.selectedConfig && !configLoadedFromNavigation.current) {
      const config = location.state.selectedConfig;
      
      setSelectedConfig(config);
      setValue('dbType', config.db_type);
      setValue('configName', config.name);
      
      // Set database parameters from config.params
      Object.entries(config.params).forEach(([key, value]) => {
        setValue(key, value);
      });
      
      // Set path fields from dedicated database columns
      setTimeout(() => {
        if (config.run_path) {
          setValue('runPath', config.run_path);
        }
        if (config.restore_password) {
          setValue('restore_password', config.restore_password);
        }
        if (config.local_database_name) {
          setValue('local_database_name', config.local_database_name);
        }
        if (config.dump_file_name) {
          setValue('dump_file_name', config.dump_file_name);
        }
      }, 100);
      
      toast.success(`Configuration "${config.name}" loaded!`);
      configLoadedFromNavigation.current = true;
    }
  }, [location.state, setValue]);

  const loadSavedConfigs = async () => {
    // Prevent multiple simultaneous calls
    if (isLoadingConfigs) {
      console.log('🚫 Config loading already in progress, skipping...');
      return;
    }
    
    const requestId = ++currentConfigRequestId.current;
    console.log(`📋 Loading configs... (Request ID: ${requestId})`);
    setIsLoadingConfigs(true);
    
    try {
      const response = await api.getConfigs();
      
      // Check if this is still the current request
      if (requestId !== currentConfigRequestId.current) {
        console.log(`🚫 Config request ${requestId} is outdated, ignoring response`);
        return;
      }
      
      console.log(`✅ Configs loaded successfully (${response.data.length} configs)`);
      setSavedConfigs(response.data);
    } catch (error) {
      console.error('Failed to load configs:', error);
      toast.error('Failed to load saved configurations');
    } finally {
      // Only reset if this is still the current request
      if (requestId === currentConfigRequestId.current) {
        setIsLoadingConfigs(false);
      }
    }
  };

  const onSubmit = async (data: FormData) => {
    try {
      // Extract database parameters from form data
      const dbParams: Record<string, any> = {};
      
      // Extract database-specific parameters based on database type
      if (data.dbType === 'postgres' || data.dbType === 'mysql') {
        dbParams.host = data.host || 'localhost';
        dbParams.port = data.port || (data.dbType === 'postgres' ? 5432 : 3306);
        dbParams.database = data.database;
        dbParams.username = data.username;
        dbParams.password = data.password;
      } else if (data.dbType === 'mongodb') {
        dbParams.uri = data.uri;
        dbParams.database = data.database;
      } else if (data.dbType === 'redis') {
        dbParams.host = data.host || 'localhost';
        dbParams.port = data.port || 6379;
        if (data.password) dbParams.password = data.password;
        dbParams.db = data.db || 0;
      } else if (data.dbType === 'sqlite') {
        dbParams.database = data.database;
      }
      
      const configData = {
        name: data.configName,
        db_type: data.dbType,
        params: dbParams,
        run_path: data.runPath || undefined,
        restore_password: data.restore_password,
        local_database_name: data.local_database_name || undefined,
        dump_file_name: data.dump_file_name || undefined,
        restore_username: data.restore_username || undefined,
        restore_host: data.restore_host || undefined,
        restore_port: data.restore_port || undefined
      };

      if (selectedConfig) {
        // Update existing config
        await api.updateConfig(selectedConfig.id, configData);
        toast.success('Configuration updated successfully');
      } else {
        // Create new config
        await api.createConfig(configData);
        toast.success('Configuration saved successfully');
      }
      
      // Reset form
      reset();
      setFormData({
        name: '',
        db_type: '',
        params: {},
        run_path: '',
        restore_password: '',
        local_database_name: '',
        dump_file_name: ''
      });
      setSelectedConfig(null);
      
      // Reload configurations
      loadSavedConfigs();
    } catch (error: any) {
      console.error('Failed to save configuration:', error);
      toast.error(error.response?.data?.detail || 'Failed to save configuration');
    }
  };

  const handleConfigSelect = (config: Config) => {
    setSelectedConfig(config);
    setValue('dbType', config.db_type);
    setValue('configName', config.name);
    
    // Set database parameters from config.params
    Object.entries(config.params).forEach(([key, value]) => {
      setValue(key, value);
    });
    
    // Set path fields from dedicated database columns
    setTimeout(() => {
      if (config.run_path) {
        setValue('runPath', config.run_path);
      }
      if (config.restore_password) {
        setValue('restore_password', config.restore_password);
      }
      if (config.local_database_name) {
        setValue('local_database_name', config.local_database_name);
      }
      if (config.dump_file_name) {
        setValue('dump_file_name', config.dump_file_name);
      }
      if (config.restore_username) {
        setValue('restore_username', config.restore_username);
      }
      if (config.restore_host) {
        setValue('restore_host', config.restore_host);
      }
      if (config.restore_port) {
        setValue('restore_port', config.restore_port);
      }
    }, 100);
    
    // Reset the navigation flag and show toast for manual selection
    configLoadedFromNavigation.current = false;
    toast.success(`Configuration "${config.name}" loaded!`);
  };

  const handleStartOperation = async (config: Config, operationType: 'dump' | 'restore') => {
    // Set status to running
    setOperationStatus(prev => ({ ...prev, [config.id]: 'running' }));
    
    try {
      // Prepare the operation data with config_name instead of path
      const processData: DumpRequest | RestoreRequest = {
        db_type: config.db_type,
        params: config.params,
        config_name: config.name,
        run_path: config.run_path,
        dump_file_name: config.dump_file_name
      };

      // Add restore-specific parameters for restore operations
      if (operationType === 'restore') {
        (processData as RestoreRequest).restore_password = config.restore_password;
        (processData as RestoreRequest).local_database_name = config.local_database_name;
        (processData as RestoreRequest).restore_username = config.restore_username;
        (processData as RestoreRequest).restore_host = config.restore_host;
        (processData as RestoreRequest).restore_port = config.restore_port;
      }

      // Start the operation
      if (operationType === 'dump') {
        const result = await api.startDump(processData as DumpRequest);
        if (result.data.success) {
          setOperationStatus(prev => ({ ...prev, [config.id]: 'success' }));
          // Show simple message in toast
          toast.success(`✅ ${operationType} successful`);
          // Show detailed message in modal
          setModal({
            isOpen: true,
            title: `${operationType.charAt(0).toUpperCase() + operationType.slice(1)} Operation Successful`,
            message: result.data.message || 'Operation completed successfully',
            type: 'success',
            contentType: 'preformatted'
          });
        } else {
          setOperationStatus(prev => ({ ...prev, [config.id]: 'error' }));
          // Show simple message in toast
          toast.error(`❌ ${operationType} failed`);
          // Show detailed error in modal
          setModal({
            isOpen: true,
            title: `${operationType.charAt(0).toUpperCase() + operationType.slice(1)} Operation Failed`,
            message: result.data.message || 'Operation failed with unknown error',
            type: 'error',
            contentType: 'preformatted'
          });
        }
      } else {
        const result = await api.startRestore(processData as RestoreRequest);
        if (result.data.success) {
          setOperationStatus(prev => ({ ...prev, [config.id]: 'success' }));
          // Show simple message in toast
          toast.success(`✅ ${operationType} successful`);
          // Show detailed message in modal
          setModal({
            isOpen: true,
            title: `${operationType.charAt(0).toUpperCase() + operationType.slice(1)} Operation Successful`,
            message: result.data.message || 'Operation completed successfully',
            type: 'success',
            contentType: 'preformatted'
          });
        } else {
          setOperationStatus(prev => ({ ...prev, [config.id]: 'error' }));
          // Show simple message in toast
          toast.error(`❌ ${operationType} failed`);
          // Show detailed error in modal
          setModal({
            isOpen: true,
            title: `${operationType.charAt(0).toUpperCase() + operationType.slice(1)} Operation Failed`,
            message: result.data.message || 'Operation failed with unknown error',
            type: 'error',
            contentType: 'preformatted'
          });
        }
      }
    } catch (error: any) {
      console.error('Failed to start operation:', error);
      setOperationStatus(prev => ({ ...prev, [config.id]: 'error' }));
      
      const errorMessage = error.response?.data?.detail || error.message || 'Failed to start operation';
      
      // Show simple message in toast
      toast.error(`❌ ${operationType} failed`);
      
      // Show detailed error in modal
      setModal({
        isOpen: true,
        title: `${operationType.charAt(0).toUpperCase() + operationType.slice(1)} Operation Failed`,
        message: errorMessage,
        type: 'error',
        contentType: 'preformatted'
      });
    }
  };

  return (
    <div className="add-configuration-page">
      <Modal
        isOpen={modal.isOpen}
        onClose={() => setModal(prev => ({ ...prev, isOpen: false }))}
        title={modal.title}
        message={modal.message}
        type={modal.type}
        contentType={modal.contentType}
      />

      
      <div className="container">
        <div className="page-header">
          <button 
            className="btn btn--secondary"
            onClick={() => navigate('/')}
          >
            <ArrowLeft />
            Back to Home
          </button>
          <h1>Add Configuration</h1>
        </div>
        
        <form onSubmit={handleSubmit(onSubmit)} className="main-form">
          <div className="form-section">
            <div className="section__header">
              <Database className="icon" />
              <h2>Database Configuration</h2>
            </div>
            <DatabaseTypeSelector 
              value={dbType} 
              onChange={(value) => setValue('dbType', value)}
              register={register}
              errors={errors}
            />
          </div>

          {dbType && (
            <div className="form-section">
              <div className="section__header">
                <Settings className="icon" />
                <h2>Database Parameters</h2>
              </div>
              <DynamicFormFields 
                dbType={dbType}
                register={register}
                errors={errors}
              />
            </div>
          )}

          <div className="form-section">
            <div className="section__header">
              <Save className="icon" />
              <h2>Configuration</h2>
            </div>
            <ConfigNameInput 
              register={register}
              errors={errors}
            />
            <div className="run-path-input">
              <label className="field-label">
                <FolderOpen className="field-icon" />
                Run Path (Microservice) - Optional
              </label>
              <div className="input-wrapper">
                <input
                  type="text"
                  {...register('runPath')}
                  className={`field-input ${errors.runPath ? 'error' : ''}`}
                  placeholder="e.g., /app or /var/www"
                />
              </div>
              {errors.runPath && (
                <div className="field-error">
                  <span className="error-icon">⚠</span>
                  {errors.runPath.message?.toString() || 'This field is required'}
                </div>
              )}
            </div>
            <DumpFileNameInput 
              value={watch('dump_file_name') || ''}
              onChange={(value) => setValue('dump_file_name', value)}
              error={errors.dump_file_name?.message?.toString() || undefined}
            />
          </div>
          <div className="form-section">
            <div className="section__header">
              <HardDrive className="icon" />
              <h2>{selectedConfig ? 'Update Configuration' : 'Add Configuration'}</h2>
            </div>
            <StartProcessButton 
              isLoading={isLoading}
              label={selectedConfig ? 'Update Configuration' : 'Add Configuration'}
              icon={selectedConfig ? <Edit /> : <Save />}
            />
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddConfigurationPage; 