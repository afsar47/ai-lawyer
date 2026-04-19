'use client';

import { useState, useEffect } from 'react';
import ProtectedRoute from '../protected-route';
import SidebarLayout from '../components/sidebar-layout';
import { useTranslations } from '../hooks/useTranslations';
import { 
  Settings, 
  Brain, 
  CheckCircle, 
  Save,
  X,
  RefreshCw,
  Star,
  TestTube
} from 'lucide-react';
import { AIModel, aiConfigManager } from '../../lib/ai-config';
import { aiService } from '../../lib/ai-service';

// Simplified AI models list - Only GPT 4.1
const AI_MODELS = [
  {
    id: 'gpt-4.1',
    name: 'GPT-4.1',
    provider: 'OpenAI',
    description: 'Enhanced GPT-4.1 model with improved legal analysis',
    type: 'llm',
    maxTokens: 128000,
    cost: 0.0055,
    features: ['Document drafting', 'Issue spotting', 'Summarization', 'Enhanced reasoning'],
    recommended: true
  }
];

export default function AISettingsPage() {
  const { t, translationsLoaded } = useTranslations();
  const [models, setModels] = useState<AIModel[]>([]);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [configuringModel, setConfiguringModel] = useState<any>(null);
  const [config, setConfig] = useState({
    apiKey: '',
    temperature: 0.3,
    maxTokens: 4000
  });
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [testingModel, setTestingModel] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, { success: boolean; message: string }>>({});

  useEffect(() => {
    loadModels();
  }, []);

  const loadModels = async () => {
    try {
      setLoading(true);
      const loadedModels = await aiConfigManager.loadModels();
      setModels(loadedModels);
      console.log('Loaded models:', loadedModels);
    } catch (error) {
      console.error('Error loading models:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActiveModel = () => {
    return models.find(m => m.isActive);
  };

  const setActiveModel = async (modelId: string) => {
    try {
      const success = await aiConfigManager.setActiveModel(modelId);
      if (success) {
        await loadModels();
        alert('Model activated successfully!');
      } else {
        alert('Failed to set active model');
      }
    } catch (error) {
      console.error('Error setting active model:', error);
      alert('Failed to set active model');
    }
  };

  const configureModel = (modelInfo: any) => {
    setConfiguringModel(modelInfo);
    
    // Check if this model is already configured
    const existingModel = models.find(m => m.model === modelInfo.id);
    
    if (existingModel) {
      // Load existing configuration
      setConfig({
        apiKey: existingModel.apiKey || '',
        temperature: existingModel.temperature || 0.3,
        maxTokens: existingModel.maxTokens || modelInfo.maxTokens || 4000
      });
    } else {
      // Set default values for new model
      setConfig({
        apiKey: '',
        temperature: 0.3,
        maxTokens: modelInfo.maxTokens || 4000
      });
    }
    
    setShowConfigModal(true);
  };

  const saveModelConfig = async () => {
    if (!configuringModel || !config.apiKey.trim()) {
      alert('Please provide an API key to save the configuration.');
      return;
    }

    setIsSaving(true);
    console.log('=== SAVING MODEL CONFIG ===');
    console.log('Configuring model:', configuringModel);
    console.log('Config data:', { ...config, apiKey: '[HIDDEN]' });

    try {
      // Check if this model is already configured
      const existingModel = models.find(m => m.model === configuringModel.id);
      
      if (existingModel) {
        // Update existing model
        console.log('Updating existing model:', existingModel.id);
        
        const updateData = {
          apiKey: config.apiKey,
          temperature: config.temperature,
          maxTokens: config.maxTokens,
          lastTest: new Date().toLocaleString()
        };
        
        const updateSuccess = await aiConfigManager.updateModel(existingModel.id, updateData);
        
        if (updateSuccess) {
          console.log('Model updated successfully');
          await loadModels();
          setShowConfigModal(false);
          setConfiguringModel(null);
          setConfig({ apiKey: '', temperature: 0.3, maxTokens: 4000 });
          alert(`✅ ${configuringModel.name} configuration updated successfully!`);
        } else {
          console.error('Failed to update model');
          alert(`❌ Error updating configuration. Please check the console for details.`);
        }
      } else {
        // Create new model
        console.log('Creating new model');
        
        const modelToAdd = {
          name: configuringModel.name,
          provider: configuringModel.provider,
          type: configuringModel.type as any,
          status: 'inactive' as const,
          apiKey: config.apiKey,
          endpoint: getEndpointForProvider(configuringModel.provider),
          model: configuringModel.id,
          maxTokens: config.maxTokens,
          temperature: config.temperature,
          accuracy: 90,
          speed: 80,
          cost: configuringModel.cost,
          features: configuringModel.features,
          lastTest: new Date().toLocaleString(),
          testResults: { accuracy: 90, responseTime: 2.0, reliability: 90 }
        };

        console.log('Model to add:', { ...modelToAdd, apiKey: '[HIDDEN]' });

        const newModelId = await aiConfigManager.addModel(modelToAdd);
        console.log('Model added successfully with ID:', newModelId);
        
        // Refresh the models list
        await loadModels();
        
        // Close modal and reset form
        setShowConfigModal(false);
        setConfiguringModel(null);
        setConfig({ apiKey: '', temperature: 0.3, maxTokens: 4000 });
        
        // Show success feedback
        alert(`✅ ${configuringModel.name} configured successfully!`);
      }
    } catch (error) {
      console.error('Error saving model config:', error);
      alert(`❌ Error saving configuration: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const getEndpointForProvider = (provider: string) => {
    switch (provider) {
      case 'OpenAI': return 'https://api.openai.com/v1/chat/completions';
      case 'Anthropic': return 'https://api.anthropic.com/v1/messages';
      case 'Google': return 'https://generativelanguage.googleapis.com/v1beta';
      default: return '';
    }
  };

  const deleteModel = async (id: string) => {
    if (confirm('Are you sure you want to remove this model configuration?')) {
      try {
        await aiConfigManager.deleteModel(id);
        await loadModels();
        alert('Model configuration removed successfully!');
      } catch (error) {
        console.error('Error deleting model:', error);
        alert('Failed to delete model configuration');
      }
    }
  };

  const clearAllModels = async () => {
    if (confirm('Are you sure you want to clear all AI model configurations? This action cannot be undone.')) {
      try {
        await aiConfigManager.clearAllModels();
        await loadModels();
        alert('All AI model configurations have been cleared.');
      } catch (error) {
        console.error('Error clearing models:', error);
        alert('Failed to clear models from database');
      }
    }
  };

  const testModel = async (modelId: string) => {
    setTestingModel(modelId);
    try {
      console.log('Testing model:', modelId);
      const success = await aiService.testModelConnection(modelId);
      
      const result = {
        success,
        message: success 
          ? '✅ Connection test successful! Model is working properly.' 
          : '❌ Connection test failed. Please check your API key and configuration.'
      };
      
      setTestResults(prev => ({ ...prev, [modelId]: result }));
      
      // Update the model's last test time if successful
      if (success) {
        await aiConfigManager.updateModel(modelId, {
          lastTest: new Date().toLocaleString(),
          status: 'active'
        });
        await loadModels();
      }
      
    } catch (error) {
      console.error('Error testing model:', error);
      setTestResults(prev => ({ 
        ...prev, 
        [modelId]: { 
          success: false, 
          message: '❌ Test failed: ' + (error instanceof Error ? error.message : 'Unknown error')
        } 
      }));
    } finally {
      setTestingModel(null);
    }
  };

  // Show loading state if translations aren't loaded yet
  if (!translationsLoaded) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading translations...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <SidebarLayout 
          title={t('ai.settings.title')} 
          description={t('ai.settings.description')}
        >
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          </div>
        </SidebarLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <SidebarLayout 
        title={t('ai.settings.title')} 
        description={t('ai.settings.description')}
      >
        <div className="space-y-6">
          {/* Header with Active Model */}
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg p-6 text-white">
            <div className="flex items-center space-x-3 mb-4">
              <Settings className="w-8 h-8" />
              <h2 className="text-2xl font-bold">{t('ai.settings.aiModelManagement')}</h2>
            </div>
            
            <div className="bg-white/10 rounded-lg p-4">
              <h3 className="font-semibold mb-2">{t('ai.settings.activeModel')}</h3>
              {(() => {
                const activeModel = getActiveModel();
                return activeModel ? (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{activeModel.name}</p>
                      <p className="text-purple-100 text-sm">{activeModel.provider} • ${activeModel.cost}/1K tokens</p>
                    </div>
                    <span className="px-3 py-1 bg-green-500 text-white rounded-full text-sm font-medium">
                      {t('ai.settings.active')}
                    </span>
                  </div>
                ) : (
                  <p className="text-purple-100">{t('ai.settings.noActiveModelSelected')}</p>
                );
              })()}
            </div>
          </div>

          {/* Controls */}
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">{t('ai.settings.availableAIModels')}</h3>
            <div className="flex space-x-2">
              <button
                onClick={loadModels}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 flex items-center space-x-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>{t('ai.settings.refresh')}</span>
              </button>
            </div>
          </div>

          {/* Models Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {AI_MODELS.map((modelInfo) => {
              const isConfigured = models.some(m => m.model === modelInfo.id);
              const configuredModel = models.find(m => m.model === modelInfo.id);
              const isActive = getActiveModel()?.model === modelInfo.id;

              return (
                <div key={modelInfo.id} className="bg-white rounded-lg shadow p-6 border-2 hover:border-purple-200 transition-colors">
                  {/* Model Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <Brain className="w-5 h-5 text-purple-600" />
                      <div>
                        <h4 className="font-semibold text-gray-900 flex items-center space-x-2">
                          <span>{modelInfo.name}</span>
                          {modelInfo.recommended && <Star className="w-4 h-4 text-yellow-500" />}
                        </h4>
                        <p className="text-sm text-gray-500">{modelInfo.provider}</p>
                      </div>
                    </div>
                    {isActive && (
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                        {t('ai.settings.active')}
                      </span>
                    )}
                  </div>

                  {/* Model Description */}
                  <p className="text-sm text-gray-600 mb-4">{modelInfo.description}</p>

                  {/* Model Stats */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="text-center p-2 bg-gray-50 rounded">
                      <div className="text-sm font-bold text-purple-600">${modelInfo.cost}</div>
                      <div className="text-xs text-gray-600">{t('ai.settings.per1KTokens')}</div>
                    </div>
                    <div className="text-center p-2 bg-gray-50 rounded">
                      <div className="text-sm font-bold text-blue-600">{modelInfo.maxTokens.toLocaleString()}</div>
                      <div className="text-xs text-gray-600">{t('ai.settings.maxTokens')}</div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-2">
                    {isConfigured ? (
                      <>
                        {isActive ? (
                          <div className="flex items-center justify-center space-x-2 text-green-600 text-sm">
                            <CheckCircle className="w-4 h-4" />
                            <span>{t('ai.settings.currentlyActive')}</span>
                          </div>
                        ) : (
                          <button
                            onClick={() => configuredModel && setActiveModel(configuredModel.id)}
                            className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                          >
{t('ai.settings.setAsActive')}
                          </button>
                        )}
                        <div className="space-y-2">
                          <button
                            onClick={() => configuredModel && testModel(configuredModel.id)}
                            disabled={testingModel === configuredModel?.id}
                            className="w-full bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm flex items-center justify-center space-x-2 disabled:opacity-50"
                          >
                            {testingModel === configuredModel?.id ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            ) : (
                              <TestTube className="w-4 h-4" />
                            )}
                            <span>{testingModel === configuredModel?.id ? t('ai.settings.testing') : t('ai.settings.testModel')}</span>
                          </button>
                          
                          {testResults[configuredModel?.id || ''] && (
                            <div className={`p-2 rounded text-xs ${
                              testResults[configuredModel?.id || ''].success 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {testResults[configuredModel?.id || ''].message}
                            </div>
                          )}
                          
                          <button
                            onClick={() => configureModel(modelInfo)}
                            className="w-full bg-gray-600 text-white px-3 py-2 rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 text-sm"
                          >
                            {t('ai.settings.edit')}
                          </button>
                        </div>
                      </>
                    ) : (
                      <button
                        onClick={() => configureModel(modelInfo)}
                        className="w-full bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                      >
{t('ai.settings.configureModel')}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Configuration Modal */}
          {showConfigModal && configuringModel && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">{t('ai.settings.configure')} {configuringModel.name}</h3>
                  <button
                    onClick={() => setShowConfigModal(false)}
                    className="text-gray-700 hover:text-gray-900"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('ai.settings.apiKey')} *</label>
                    <input
                      type="password"
                      value={config.apiKey}
                      onChange={(e) => setConfig({...config, apiKey: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder={t('ai.settings.enterApiKey', { provider: configuringModel.provider })}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('ai.settings.temperature')}</label>
                    <input
                      type="number"
                      step="0.1"
                      value={config.temperature}
                      onChange={(e) => setConfig({...config, temperature: parseFloat(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      min="0"
                      max="2"
                    />
                    <p className="text-xs text-gray-500 mt-1">{t('ai.settings.temperatureDescription')}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('ai.settings.maxTokens')}</label>
                    <input
                      type="number"
                      value={config.maxTokens}
                      onChange={(e) => setConfig({...config, maxTokens: parseInt(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      min="100"
                      max={configuringModel.maxTokens}
                    />
                    <p className="text-xs text-gray-500 mt-1">{t('ai.settings.maxTokensDescription', { max: configuringModel.maxTokens.toLocaleString() })}</p>
                  </div>
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    onClick={() => setShowConfigModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
{t('ai.settings.cancel')}
                  </button>
                  <button
                    onClick={saveModelConfig}
                    disabled={!config.apiKey.trim() || isSaving}
                    className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 flex items-center space-x-2 disabled:opacity-50"
                  >
                    {isSaving ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    <span>{isSaving ? t('ai.settings.saving') : t('ai.settings.saveConfiguration')}</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </SidebarLayout>
    </ProtectedRoute>
  );
}