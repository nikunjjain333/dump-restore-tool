import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { 
  Database, 
  Save, 
  ArrowLeft,
  Edit
} from 'lucide-react';
import './AddConfigurationPage.scss';
import { api, Config } from '../api/client';
import DatabaseTypeSelector from '../components/DatabaseTypeSelector';
import DynamicFormFields from '../components/DynamicFormFields';
import ConfigNameInput from '../components/ConfigNameInput';
import DumpFileNameInput from '../components/DumpFileNameInput';
import SavedConfigsList from '../components/SavedConfigsList';
import StartProcessButton from '../components/StartProcessButton';
import Modal from '../components/Modal';
import { useOperationStatus } from '../contexts/OperationStatusContext';

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
  
  const { setOperationStatus } = useOperationStatus();

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>();

  const dbType = watch('dbType') || '';

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
      
      toast.success(`Configuration "${config.name}" loaded!`);
      configLoadedFromNavigation.current = true;
    }
  }, [location.state, setValue]);

  const loadSavedConfigs = useCallback(async () => {
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
  }, [isLoadingConfigs]);

  const onSubmit = useCallback(async (data: FormData) => {
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
        toast.success('Configuration created successfully');
      }
      
      navigate('/configurations');
    } catch (error: any) {
      console.error('Failed to save configuration:', error);
      const errorMessage = error.response?.data?.detail || error.message || 'Failed to save configuration';
      toast.error(errorMessage);
    }
  }, [selectedConfig, navigate]);

  const handleConfigSelect = useCallback((config: Config) => {
    setSelectedConfig(config);
    setValue('dbType', config.db_type);
    setValue('configName', config.name);
    
    // Set database parameters from config.params
    Object.entries(config.params).forEach(([key, value]) => {
      setValue(key, value);
    });
    
    // Set path fields from dedicated database columns
    setTimeout(() => {
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
    
    toast.success(`Configuration "${config.name}" loaded!`);
  }, [setValue]);

  const handleStartOperation = useCallback(async (config: Config, operationType: 'dump' | 'restore') => {
    setOperationStatus(config.id, 'running');
    try {
      // Prepare the operation data with config_name instead of path
      const processData = {
        db_type: config.db_type,
        params: config.params,
        config_name: config.name,
      };
      
      let result;
      if (operationType === 'dump') {
        result = await api.startDump(processData);
      } else {
        // Add restore-specific parameters for restore operations
        const restoreData = {
          ...processData,
          restore_password: config.restore_password,
          local_database_name: config.local_database_name,
          restore_username: config.restore_username,
          restore_host: config.restore_host,
          restore_port: config.restore_port,
        };
        result = await api.startRestore(restoreData);
      }
      
      if (result.data.success) {
        toast.success(`✅ ${operationType} successful`);
        setModal({
          isOpen: true,
          title: `${operationType.charAt(0).toUpperCase() + operationType.slice(1)} Operation Successful`,
          message: result.data.message || 'Operation completed successfully',
          type: 'success',
          contentType: 'preformatted'
        });
        setTimeout(() => {
          setOperationStatus(config.id, 'success');
        }, 2000);
      } else {
        setOperationStatus(config.id, 'error');
        toast.error(`❌ ${operationType} failed`);
        setModal({
          isOpen: true,
          title: `${operationType.charAt(0).toUpperCase() + operationType.slice(1)} Operation Failed`,
          message: result.data.message || 'Operation failed with unknown error',
          type: 'error',
          contentType: 'preformatted'
        });
      }
    } catch (error: any) {
      setOperationStatus(config.id, 'error');
      console.error('Failed to start operation:', error);
      
      const errorMessage = error.response?.data?.detail || error.message || 'Failed to start operation';
      
      toast.error(`❌ ${operationType} failed`);
      
      setModal({
        isOpen: true,
        title: `${operationType.charAt(0).toUpperCase() + operationType.slice(1)} Operation Failed`,
        message: errorMessage,
        type: 'error',
        contentType: 'preformatted'
      });
    }
  }, [setOperationStatus]);

  const handleBackClick = useCallback(() => {
    navigate('/configurations');
  }, [navigate]);

  const closeModal = useCallback(() => {
    setModal(prev => ({ ...prev, isOpen: false }));
  }, []);

  const pageTitle = useMemo(() => {
    return selectedConfig ? 'Edit Configuration' : 'Add New Configuration';
  }, [selectedConfig]);

  const submitButtonText = useMemo(() => {
    return selectedConfig ? 'Update Configuration' : 'Create Configuration';
  }, [selectedConfig]);

  return (
    <div className="add-configuration-page">
      <Modal
        isOpen={modal.isOpen}
        onClose={closeModal}
        title={modal.title}
        message={modal.message}
        type={modal.type}
        contentType={modal.contentType}
        autoClose={modal.type === 'success'}
        autoCloseDelay={3000}
      />
      
      <div className="container">
        <div className="page-header">
          <button 
            className="btn btn--secondary"
            onClick={handleBackClick}
          >
            <ArrowLeft />
            Back to Configurations
          </button>
          <h1>{pageTitle}</h1>
        </div>

        <div className="content-grid">
          <div className="form-section">
            <form onSubmit={handleSubmit(onSubmit)} className="configuration-form">
              <div className="form-header">
                <div className="header-icon">
                  {selectedConfig ? <Edit /> : <Database />}
                </div>
                <div className="header-content">
                  <h2>{pageTitle}</h2>
                  <p>Configure your database connection settings</p>
                </div>
              </div>

              <div className="form-sections">
                {/* Configuration Name */}
                <div className="form-section">
                  <ConfigNameInput
                    register={register}
                    errors={errors}
                  />
                </div>

                {/* Database Type Selection */}
                <div className="form-section">
                  <DatabaseTypeSelector
                    value={dbType}
                    onChange={(value) => setValue('dbType', value)}
                    register={register}
                    errors={errors}
                  />
                </div>

                {/* Dynamic Form Fields */}
                {dbType && (
                  <div className="form-section">
                    <DynamicFormFields
                      dbType={dbType}
                      register={register}
                      errors={errors}
                    />
                  </div>
                )}

                {/* Dump File Name */}
                {dbType && (
                  <div className="form-section">
                    <DumpFileNameInput
                      value={watch('dump_file_name') || ''}
                      onChange={(value) => setValue('dump_file_name', value)}
                      error={errors.dump_file_name?.message?.toString()}
                    />
                  </div>
                )}

                {/* Submit Button */}
                <div className="form-section">
                  <StartProcessButton
                    isLoading={isLoading}
                    label={submitButtonText}
                    icon={selectedConfig ? <Edit /> : <Save />}
                  />
                </div>
              </div>
            </form>
          </div>

          {/* Saved Configurations Sidebar */}
          <div className="sidebar-section">
            <SavedConfigsList
              configs={savedConfigs}
              onSelect={handleConfigSelect}
              onStartOperation={handleStartOperation}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddConfigurationPage; 