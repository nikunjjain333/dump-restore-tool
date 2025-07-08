import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { 
  Database, 
  Play, 
  Save, 
  Settings, 
  FolderOpen, 
  HardDrive, 
  Zap,
  CheckCircle,
  AlertCircle,
  Loader2,
  ArrowLeft
} from 'lucide-react';
import './AddConfigurationPage.scss';
import { api, Config, ConfigCreate, DumpRequest, RestoreRequest } from '../api/client';
import DatabaseTypeSelector from '../components/DatabaseTypeSelector';
import OperationSelector from '../components/OperationSelector';
import DynamicFormFields from '../components/DynamicFormFields';
import ConfigNameInput from '../components/ConfigNameInput';
import PathInput from '../components/PathInput';
import SavedConfigsList from '../components/SavedConfigsList';
import StartProcessButton from '../components/StartProcessButton';
import Modal from '../components/Modal';

interface FormData {
  dbType: string;
  operation: 'dump' | 'restore';
  configName: string;
  dumpPath: string;
  restorePath: string;
  runPath?: string;
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

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>();

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
      setValue('operation', config.operation as 'dump' | 'restore');
      setValue('configName', config.name);
      
      // Set database parameters from config.params
      Object.entries(config.params).forEach(([key, value]) => {
        setValue(key, value);
      });
      
      // Set path fields from dedicated database columns
      setTimeout(() => {
        if (config.dump_path) {
          setValue('dumpPath', config.dump_path);
        }
        if (config.restore_path) {
          setValue('restorePath', config.restore_path);
        }
        if (config.run_path) {
          setValue('runPath', config.run_path);
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
    setIsLoading(true);
    const loadingToast = toast.loading(`Starting ${data.operation} process...`);
    let savedConfig: any = null;
    
    try {
      const configData: ConfigCreate = {
        name: data.configName,
        db_type: data.dbType,
        operation: data.operation,
        params: {
          ...data,
          configName: undefined,
          dbType: undefined,
          operation: undefined,
          dumpPath: undefined,
          restorePath: undefined,
          runPath: undefined
        },
        dump_path: data.dumpPath,
        restore_path: data.restorePath,
        run_path: data.runPath
      };

      // Save config
      savedConfig = await api.createConfig(configData);
      toast.success('Configuration saved successfully!');
      
      // Update local state with the new config
      setSavedConfigs(prev => [...prev, savedConfig.data]);

      // Start process
      const processData: DumpRequest | RestoreRequest = {
        db_type: data.dbType,
        params: configData.params,
        path: data.operation === 'dump' ? data.dumpPath : data.restorePath,
        run_path: data.runPath
      };

      // Set status to running for the new config
      setOperationStatus(prev => ({ ...prev, [savedConfig.data.id]: 'running' }));

      if (data.operation === 'dump') {
        const result = await api.startDump(processData as DumpRequest);
        toast.dismiss(loadingToast);
        if (result.data.success) {
          setOperationStatus(prev => ({ ...prev, [savedConfig.data.id]: 'success' }));
          toast.success(`✅ ${result.data.message}`);
        } else {
          setOperationStatus(prev => ({ ...prev, [savedConfig.data.id]: 'error' }));
          // Show simple message in toast
          toast.error(`❌ ${data.operation} failed`);
          // Show detailed error in modal
          setModal({
            isOpen: true,
            title: `${data.operation.charAt(0).toUpperCase() + data.operation.slice(1)} Operation Failed`,
            message: result.data.message,
            type: 'error',
            contentType: 'preformatted'
          });
        }
      } else {
        const result = await api.startRestore(processData as RestoreRequest);
        toast.dismiss(loadingToast);
        if (result.data.success) {
          setOperationStatus(prev => ({ ...prev, [savedConfig.data.id]: 'success' }));
          toast.success(`✅ ${result.data.message}`);
        } else {
          setOperationStatus(prev => ({ ...prev, [savedConfig.data.id]: 'error' }));
          // Show simple message in toast
          toast.error(`❌ ${data.operation} failed`);
          // Show detailed error in modal
          setModal({
            isOpen: true,
            title: `${data.operation.charAt(0).toUpperCase() + data.operation.slice(1)} Operation Failed`,
            message: result.data.message,
            type: 'error',
            contentType: 'preformatted'
          });
        }
      }
    } catch (error: any) {
      console.error('Failed to start process:', error);
      toast.dismiss(loadingToast);
      
      const errorMessage = error.response?.data?.detail || error.message || 'Failed to start process';
      
      // If we have a saved config, update its status to error
      if (savedConfig?.data?.id) {
        setOperationStatus(prev => ({ ...prev, [savedConfig.data.id]: 'error' }));
      }
      
      // Show error in modal instead of toast for better readability
      setModal({
        isOpen: true,
        title: `${data.operation.charAt(0).toUpperCase() + data.operation.slice(1)} Operation Failed`,
        message: errorMessage,
        type: 'error',
        contentType: 'preformatted' // Use preformatted for better error display
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfigSelect = (config: Config) => {
    setSelectedConfig(config);
    setValue('dbType', config.db_type);
    setValue('operation', config.operation as 'dump' | 'restore');
    setValue('configName', config.name);
    
    // Set database parameters from config.params
    Object.entries(config.params).forEach(([key, value]) => {
      setValue(key, value);
    });
    
    // Set path fields from dedicated database columns
    setTimeout(() => {
      if (config.dump_path) {
        setValue('dumpPath', config.dump_path);
      }
      if (config.restore_path) {
        setValue('restorePath', config.restore_path);
      }
      if (config.run_path) {
        setValue('runPath', config.run_path);
      }
    }, 100);
    
    // Reset the navigation flag and show toast for manual selection
    configLoadedFromNavigation.current = false;
    toast.success(`Configuration "${config.name}" loaded!`);
  };

  const handleStartOperation = async (config: Config) => {
    // Set status to running
    setOperationStatus(prev => ({ ...prev, [config.id]: 'running' }));
    
    try {
      // Prepare the operation data
      const processData: DumpRequest | RestoreRequest = {
        db_type: config.db_type,
        params: config.params,
        path: config.operation === 'dump' ? config.dump_path! : config.restore_path!,
        run_path: config.run_path
      };

      // Start the operation
      if (config.operation === 'dump') {
        const result = await api.startDump(processData as DumpRequest);
        if (result.data.success) {
          setOperationStatus(prev => ({ ...prev, [config.id]: 'success' }));
          toast.success(`✅ ${result.data.message}`);
        } else {
          setOperationStatus(prev => ({ ...prev, [config.id]: 'error' }));
          // Show simple message in toast
          toast.error(`❌ ${config.operation} failed`);
          // Show detailed error in modal
          setModal({
            isOpen: true,
            title: `${config.operation.charAt(0).toUpperCase() + config.operation.slice(1)} Operation Failed`,
            message: result.data.message,
            type: 'error',
            contentType: 'preformatted'
          });
        }
      } else {
        const result = await api.startRestore(processData as RestoreRequest);
        if (result.data.success) {
          setOperationStatus(prev => ({ ...prev, [config.id]: 'success' }));
          toast.success(`✅ ${result.data.message}`);
        } else {
          setOperationStatus(prev => ({ ...prev, [config.id]: 'error' }));
          // Show simple message in toast
          toast.error(`❌ ${config.operation} failed`);
          // Show detailed error in modal
          setModal({
            isOpen: true,
            title: `${config.operation.charAt(0).toUpperCase() + config.operation.slice(1)} Operation Failed`,
            message: result.data.message,
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
      toast.error(`❌ ${config.operation} failed`);
      
      // Show detailed error in modal
      setModal({
        isOpen: true,
        title: `${config.operation.charAt(0).toUpperCase() + config.operation.slice(1)} Operation Failed`,
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

          <div className="form-section">
            <div className="section__header">
              <Play className="icon" />
              <h2>Operation</h2>
            </div>
            <OperationSelector 
              value={operation} 
              onChange={(value) => setValue('operation', value as 'dump' | 'restore')}
              register={register}
              errors={errors}
            />
          </div>

          {dbType && operation && (
            <div className="form-section">
              <div className="section__header">
                <Settings className="icon" />
                <h2>Database Parameters</h2>
              </div>
              <DynamicFormFields 
                dbType={dbType}
                operation={operation}
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
            {operation === 'dump' && (
              <PathInput 
                label="Dump Path"
                name="dumpPath"
                register={register}
                errors={errors}
                operation={operation}
                dbType={dbType}
              />
            )}
            {operation === 'restore' && (
              <PathInput 
                label="Restore Path"
                name="restorePath"
                register={register}
                errors={errors}
                operation={operation}
                dbType={dbType}
              />
            )}
            <PathInput 
              label="Run Path (Microservice) - Optional"
              name="runPath"
              register={register}
              errors={errors}
              required={false}
            />
          </div>

          {/* <div className="form-section">
            <div className="section__header">
              <FolderOpen className="icon" />
              <h2>Saved Configurations</h2>
            </div>
            <SavedConfigsList 
              configs={savedConfigs}
              onSelect={handleConfigSelect}
              onStartOperation={handleStartOperation}
              operationStatus={operationStatus}
            />
          </div> */}

          <div className="form-section">
            <div className="section__header">
              <HardDrive className="icon" />
              <h2>Start Process</h2>
            </div>
            <StartProcessButton 
              isLoading={isLoading}
              operation={operation}
            />
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddConfigurationPage; 