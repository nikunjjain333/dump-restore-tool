import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import toast, { Toaster } from 'react-hot-toast';
import './MainPage.scss';
import DockerButton from '../components/DockerButton';
import DatabaseTypeSelector from '../components/DatabaseTypeSelector';
import OperationSelector from '../components/OperationSelector';
import DynamicFormFields from '../components/DynamicFormFields';
import ConfigNameInput from '../components/ConfigNameInput';
import PathInput from '../components/PathInput';
import SavedConfigsList from '../components/SavedConfigsList';
import StartProcessButton from '../components/StartProcessButton';
import { api, Config, ConfigCreate, DumpRequest, RestoreRequest } from '../api/client';

interface FormData {
  dbType: string;
  operation: 'dump' | 'restore';
  configName: string;
  dumpPath: string;
  restorePath: string;
  runPath: string;
  [key: string]: any;
}

const MainPage: React.FC = () => {
  const [selectedConfig, setSelectedConfig] = useState<Config | null>(null);
  const [savedConfigs, setSavedConfigs] = useState<Config[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>();

  const dbType = watch('dbType') || '';
  const operation = watch('operation') || '';

  useEffect(() => {
    loadSavedConfigs();
  }, []);

  const loadSavedConfigs = async () => {
    try {
      const response = await api.getConfigs();
      setSavedConfigs(response.data);
    } catch (error) {
      console.error('Failed to load configs:', error);
      toast.error('Failed to load saved configurations');
    }
  };

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    const loadingToast = toast.loading(`Starting ${data.operation} process...`);
    
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
        }
      };

      // Save config
      await api.createConfig(configData);
      toast.success('Configuration saved successfully!');

      // Start process
      const processData: DumpRequest | RestoreRequest = {
        db_type: data.dbType,
        params: configData.params,
        path: data.operation === 'dump' ? data.dumpPath : data.restorePath,
        run_path: data.runPath
      };

      if (data.operation === 'dump') {
        const result = await api.startDump(processData as DumpRequest);
        toast.dismiss(loadingToast);
        toast.success(`✅ ${result.data.message}`);
      } else {
        const result = await api.startRestore(processData as RestoreRequest);
        toast.dismiss(loadingToast);
        toast.success(`✅ ${result.data.message}`);
      }

      loadSavedConfigs();
    } catch (error: any) {
      console.error('Failed to start process:', error);
      toast.dismiss(loadingToast);
      
      const errorMessage = error.response?.data?.detail || error.message || 'Failed to start process';
      toast.error(`❌ ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfigSelect = (config: Config) => {
    setSelectedConfig(config);
    setValue('dbType', config.db_type);
    setValue('operation', config.operation as 'dump' | 'restore');
    setValue('configName', config.name);
    // Set other fields based on config.params
    Object.entries(config.params).forEach(([key, value]) => {
      setValue(key, value);
    });
    toast.success(`Configuration "${config.name}" loaded!`);
  };

  return (
    <div className="main-page">
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
            borderRadius: '8px',
            padding: '12px 16px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            zIndex: 9999,
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
          loading: {
            iconTheme: {
              primary: '#3b82f6',
              secondary: '#fff',
            },
          },
        }}
      />
      
      <div className="container">
        <form onSubmit={handleSubmit(onSubmit)} className="main-form">
          <div className="form-section">
            <h2>Docker Control</h2>
            <DockerButton />
          </div>

          <div className="form-section">
            <h2>Database Configuration</h2>
            <DatabaseTypeSelector 
              value={dbType} 
              onChange={(value) => setValue('dbType', value)}
              register={register}
              errors={errors}
            />
          </div>

          <div className="form-section">
            <h2>Operation</h2>
            <OperationSelector 
              value={operation} 
              onChange={(value) => setValue('operation', value as 'dump' | 'restore')}
              register={register}
              errors={errors}
            />
          </div>

          {dbType && operation && (
            <div className="form-section">
              <h2>Database Parameters</h2>
              <DynamicFormFields 
                dbType={dbType}
                operation={operation}
                register={register}
                errors={errors}
              />
            </div>
          )}

          <div className="form-section">
            <h2>Configuration</h2>
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
              />
            )}
            {operation === 'restore' && (
              <PathInput 
                label="Restore Path"
                name="restorePath"
                register={register}
                errors={errors}
              />
            )}
            <PathInput 
              label="Run Path (Microservice)"
              name="runPath"
              register={register}
              errors={errors}
            />
          </div>

          <div className="form-section">
            <h2>Saved Configurations</h2>
            <SavedConfigsList 
              configs={savedConfigs}
              onSelect={handleConfigSelect}
            />
          </div>

          <div className="form-section">
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

export default MainPage; 