import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { api, DockerComposeConfigCreate } from '../api/client';
import './DockerComposeConfigForm.scss';

interface DockerComposeConfigFormProps {
  onSubmit: (config: DockerComposeConfigCreate) => void;
  onCancel: () => void;
  loading?: boolean;
}

interface FormData {
  name: string;
  path: string;
  service_name: string;
  description: string;
  flags: {
    detach: boolean;
    build: boolean;
    force_recreate: boolean;
    no_recreate: boolean;
    no_build: boolean;
    no_deps: boolean;
    pull: boolean;
  };
}

const DockerComposeConfigForm: React.FC<DockerComposeConfigFormProps> = ({
  onSubmit,
  onCancel,
  loading = false
}) => {
  const [error, setError] = useState<string>('');
  
  const {
    control,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<FormData>({
    defaultValues: {
      name: '',
      path: '',
      service_name: '',
      description: '',
      flags: {
        detach: true,
        build: false,
        force_recreate: false,
        no_recreate: false,
        no_build: false,
        no_deps: false,
        pull: false
      }
    }
  });

  const onFormSubmit = async (data: FormData) => {
    try {
      setError('');
      
      // Convert form data to API format
      const config: DockerComposeConfigCreate = {
        name: data.name,
        path: data.path,
        service_name: data.service_name || undefined,
        description: data.description || undefined,
        flags: Object.entries(data.flags)
          .filter(([_, value]) => value)
          .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {})
      };

      onSubmit(config);
      reset();
    } catch (err) {
      setError('Failed to create configuration');
    }
  };

  return (
    <div className="docker-compose-config-form">
      <h3>Add Docker Compose Configuration</h3>
      
      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={handleSubmit(onFormSubmit)}>
        <div className="form-group">
          <label htmlFor="name">Configuration Name *</label>
          <Controller
            name="name"
            control={control}
            rules={{ 
              required: 'Name is required',
              minLength: { value: 3, message: 'Name must be at least 3 characters' }
            }}
            render={({ field }) => (
              <input
                {...field}
                type="text"
                id="name"
                placeholder="Enter configuration name"
                disabled={loading}
              />
            )}
          />
          {errors.name && <span className="error">{errors.name.message}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="path">Docker Compose Path *</label>
          <Controller
            name="path"
            control={control}
            rules={{ required: 'Path is required' }}
            render={({ field }) => (
              <input
                {...field}
                type="text"
                id="path"
                placeholder="/path/to/docker-compose.yml directory"
                disabled={loading}
              />
            )}
          />
          {errors.path && <span className="error">{errors.path.message}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="service_name">Service Name (Optional)</label>
          <Controller
            name="service_name"
            control={control}
            render={({ field }) => (
              <input
                {...field}
                type="text"
                id="service_name"
                placeholder="Specific service to operate on"
                disabled={loading}
              />
            )}
          />
        </div>

        <div className="form-group">
          <label htmlFor="description">Description (Optional)</label>
          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <textarea
                {...field}
                id="description"
                placeholder="Configuration description"
                rows={3}
                disabled={loading}
              />
            )}
          />
        </div>

        <div className="form-group">
          <label>Docker Compose Flags</label>
          <div className="flags-grid">
            <Controller
              name="flags.detach"
              control={control}
              render={({ field }) => (
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    disabled={loading}
                  />
                  <span>Detach (run in background)</span>
                </label>
              )}
            />

            <Controller
              name="flags.build"
              control={control}
              render={({ field }) => (
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    disabled={loading}
                  />
                  <span>Build images before starting</span>
                </label>
              )}
            />

            <Controller
              name="flags.force_recreate"
              control={control}
              render={({ field }) => (
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    disabled={loading}
                  />
                  <span>Force recreate containers</span>
                </label>
              )}
            />

            <Controller
              name="flags.no_recreate"
              control={control}
              render={({ field }) => (
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    disabled={loading}
                  />
                  <span>Don't recreate containers</span>
                </label>
              )}
            />

            <Controller
              name="flags.no_build"
              control={control}
              render={({ field }) => (
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    disabled={loading}
                  />
                  <span>Don't build images</span>
                </label>
              )}
            />

            <Controller
              name="flags.no_deps"
              control={control}
              render={({ field }) => (
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    disabled={loading}
                  />
                  <span>Don't start linked services</span>
                </label>
              )}
            />

            <Controller
              name="flags.pull"
              control={control}
              render={({ field }) => (
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    disabled={loading}
                  />
                  <span>Pull latest images</span>
                </label>
              )}
            />
          </div>
        </div>

        <div className="form-actions">
          <button
            type="button"
            onClick={onCancel}
            className="btn btn-secondary"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? 'Adding...' : 'Add Configuration'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default DockerComposeConfigForm; 