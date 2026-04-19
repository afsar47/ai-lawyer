'use client';

import { useState, useEffect } from 'react';
import ProtectedRoute from '../protected-route';
import SidebarLayout from '../components/sidebar-layout';
import SearchablePatientSelect from '../components/SearchablePatientSelect';
import { useTranslations } from '../hooks/useTranslations';
import { aiService } from '../../lib/ai-service';
import { aiConfigManager } from '../../lib/ai-config';
import { 
  Mic, 
  MicOff, 
  Play, 
  Pause, 
  Download, 
  Share2, 
  FileText,
  Brain,
  BarChart3,
  Target,
  Zap,
  CheckCircle,
  AlertTriangle,
  Volume2,
  Settings,
  Headphones,
  MessageSquare,
  Users,
  Save
} from 'lucide-react';
import FormattedAIResult from '../components/FormattedAIResult';

export default function AIVoiceInputPage() {
  const { t, translationsLoaded } = useTranslations();
  const [activeTab, setActiveTab] = useState<'voice' | 'commands' | 'transcription' | 'settings'>('voice');
  const [isRecording, setIsRecording] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [activeModel, setActiveModel] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
  const [speechRecognition, setSpeechRecognition] = useState<any>(null);
  const [interimTranscript, setInterimTranscript] = useState<string>('');
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [selectedPatient, setSelectedPatient] = useState<any>(null);

  // Load active AI model on component mount
  useEffect(() => {
    const loadActiveModel = async () => {
      try {
        const model = await aiConfigManager.getActiveModel();
        setActiveModel(model);
        console.log('Active AI model loaded for voice input:', model);
      } catch (error) {
        console.error('Error loading active model:', error);
      }
    };

    loadActiveModel();
  }, []);

  // Check microphone permission and setup media recorder
  useEffect(() => {
    const setupMediaRecorder = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        setHasPermission(true);
        setAudioStream(stream);
        
        // Try to find a supported mime type
        let mimeType = 'audio/webm';
        if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
          mimeType = 'audio/webm;codecs=opus';
        } else if (MediaRecorder.isTypeSupported('audio/webm')) {
          mimeType = 'audio/webm';
        } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
          mimeType = 'audio/mp4';
        }
        
        const recorder = new MediaRecorder(stream, {
          mimeType: mimeType
        });
        
        let chunks: Blob[] = [];
        
        recorder.ondataavailable = (event) => {
          if (event.data && event.data.size > 0) {
            chunks.push(event.data);
            setAudioChunks([...chunks]);
          }
        };
        
        recorder.onstart = () => {
          console.log('MediaRecorder started');
          chunks = []; // Reset chunks when starting
          setAudioChunks([]);
          setIsRecording(true);
          setTranscription(''); // Clear previous transcription
          setInterimTranscript(''); // Clear interim transcript
          
          // Start speech recognition if available
          // @ts-ignore - Web Speech API types may not be available
          const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
          if (SpeechRecognition) {
            // @ts-ignore
            const recognition = new SpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = 'en-US';

            let isStillRecording = true; // Track recording state locally

            recognition.onresult = (event: any) => {
              let interim = '';
              let final = '';

              for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                  final += transcript + ' ';
                } else {
                  interim += transcript;
                }
              }

              // Update interim transcript for real-time display
              setInterimTranscript(interim);
              
              // Update final transcript
              if (final) {
                setTranscription(prev => prev + final);
              }
            };

            recognition.onerror = (event: any) => {
              console.error('Speech recognition error:', event.error);
              // Don't show error for 'no-speech' as it's common
            };

            recognition.onend = () => {
              // Restart recognition if still recording
              if (isStillRecording) {
                try {
                  recognition.start();
                } catch (error) {
                  console.error('Error restarting recognition:', error);
                }
              }
            };

            setSpeechRecognition(recognition);
            
            // Update isStillRecording when recording stops
            const originalStop = recorder.stop.bind(recorder);
            recorder.stop = () => {
              isStillRecording = false;
              if (recognition) {
                try {
                  recognition.stop();
                } catch (error) {
                  console.error('Error stopping recognition:', error);
                }
              }
              originalStop();
            };
            
            try {
              recognition.start();
            } catch (error) {
              console.error('Error starting speech recognition:', error);
            }
          }
        };
        
        recorder.onstop = async () => {
          console.log('MediaRecorder stopped');
          setIsRecording(false);
          
          // Automatically switch to transcription tab
          setActiveTab('transcription');
          
          // Stop speech recognition
          if (speechRecognition) {
            try {
              speechRecognition.stop();
            } catch (error) {
              console.error('Error stopping speech recognition:', error);
            }
          }
          
          // Get current transcription (use state updater to get latest values)
          setTranscription(currentTranscription => {
            setInterimTranscript(currentInterim => {
              const fullTranscript = (currentTranscription + currentInterim).trim();
              
              // If we have transcription from speech recognition, format it with AI
              if (fullTranscript) {
                formatTranscriptionWithAI(fullTranscript);
              } else {
                // Fallback: Process audio if no transcription available
                if (chunks.length > 0) {
                  const audioBlob = new Blob(chunks, { type: mimeType });
                  const reader = new FileReader();
                  reader.onloadend = async () => {
                    const base64Audio = reader.result as string;
                    await processAudioTranscription(base64Audio);
                  };
                  reader.onerror = (error) => {
                    console.error('Error reading audio blob:', error);
                    setTranscription('Error processing audio recording. Please try again.');
                    setIsProcessing(false);
                  };
                  reader.readAsDataURL(audioBlob);
                } else {
                  setTranscription('No audio data recorded. Please try recording again.');
                  setIsProcessing(false);
                }
              }
              
              return ''; // Clear interim transcript
            });
            
            return currentTranscription; // Return unchanged for now
          });
          
          chunks = []; // Clear chunks after processing
          setAudioChunks([]);
        };
        
        recorder.onerror = (event) => {
          console.error('MediaRecorder error:', event);
          setIsRecording(false);
          setTranscription('Error during recording. Please try again.');
        };
        
        setMediaRecorder(recorder);
      } catch (error) {
        console.error('Error accessing microphone:', error);
        setHasPermission(false);
        if (error instanceof Error) {
          if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
            alert('Microphone permission denied. Please allow microphone access in your browser settings and refresh the page.');
          } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
            alert('No microphone found. Please connect a microphone and try again.');
          } else {
            alert(`Error accessing microphone: ${error.message}`);
          }
        }
      }
    };

    setupMediaRecorder();
    
    // Cleanup function to stop the stream when component unmounts
    return () => {
      if (audioStream) {
        audioStream.getTracks().forEach(track => track.stop());
      }
      if (speechRecognition) {
        try {
          speechRecognition.stop();
        } catch (error) {
          // Ignore errors on cleanup
        }
      }
    };
  }, []);

  // Format transcribed text with AI
  const formatTranscriptionWithAI = async (transcribedText: string) => {
    setIsProcessing(true);
    try {
      // Get active model - try state first, then fetch if needed
      let model = activeModel;
      if (!model) {
        try {
          model = await aiConfigManager.getActiveModel();
          if (model) {
            setActiveModel(model); // Update state for future use
          }
        } catch (error) {
          console.error('Error fetching active model:', error);
        }
      }

      if (!model) {
        // If no model, show raw transcription
        setTranscription(transcribedText || 'No speech detected.');
        setIsProcessing(false);
        return;
      }

      // Format the transcribed text with AI
      const result = await aiService.generateText({
        prompt: `Please format the following transcribed medical voice note into a well-structured medical documentation. Make it professional and organized. Keep all important medical information:\n\n${transcribedText}`,
        modelId: model.id,
        maxTokens: 500
      });
      
      if (result.success && result.content) {
        setTranscription(result.content);
      } else {
        // If AI formatting fails, show raw transcription
        setTranscription(transcribedText || 'No speech detected. Please try again.');
      }
    } catch (error) {
      console.error('Error formatting transcription:', error);
      // If AI formatting fails, show raw transcription
      setTranscription(transcribedText || 'Transcription completed but formatting failed.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Fallback function for when Web Speech API is not available
  const processAudioTranscription = async (base64Audio: string) => {
    setIsProcessing(true);
    try {
      // Get active model - try state first, then fetch if needed
      let model = activeModel;
      if (!model) {
        try {
          model = await aiConfigManager.getActiveModel();
          if (model) {
            setActiveModel(model); // Update state for future use
          }
        } catch (error) {
          console.error('Error fetching active model:', error);
        }
      }

      if (!model) {
        setTranscription('No active AI model found. Please configure an AI model in Settings first.');
        setIsProcessing(false);
        return;
      }

      // Note: Web Speech API is not available, show message
      setTranscription('Speech recognition is not available in this browser. Please use Chrome, Edge, or Safari for voice transcription. The audio was recorded but cannot be transcribed without browser speech recognition support.');
      setIsProcessing(false);
    } catch (error) {
      console.error('Error during audio transcription:', error);
      setTranscription(`Transcription error: ${error instanceof Error ? error.message : 'Unknown error'}. Please check your AI model configuration.`);
      setIsProcessing(false);
    }
  };

  const toggleRecording = () => {
    if (!activeModel) {
      alert('No active AI model found. Please configure an AI model in Settings first.');
      return;
    }

    if (!hasPermission) {
      alert('Microphone permission is required for voice recording. Please allow microphone access and refresh the page.');
      return;
    }

    if (!mediaRecorder) {
      alert('Media recorder not available. Please refresh the page and try again.');
      return;
    }

    console.log('Current recorder state:', mediaRecorder.state, 'isRecording:', isRecording);

    try {
      if (mediaRecorder.state === 'inactive' || mediaRecorder.state === 'paused') {
        // Start recording
        console.log('Starting recording...');
        setAudioChunks([]);
        setTranscription(''); // Clear previous transcription
        mediaRecorder.start(1000); // Collect data every second
      } else if (mediaRecorder.state === 'recording') {
        // Stop recording
        console.log('Stopping recording...');
        mediaRecorder.stop();
      }
    } catch (error) {
      console.error('Error toggling recording:', error);
      alert(`Error ${mediaRecorder.state === 'recording' ? 'stopping' : 'starting'} recording: ${error instanceof Error ? error.message : 'Unknown error'}`);
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

  return (
    <ProtectedRoute>
      <SidebarLayout 
        title={t('ai.ai.voiceInput.title')} 
        description={t('ai.ai.voiceInput.description')}
      >
        <div className="space-y-6">
          {/* Header with AI Stats */}
          <div className="bg-gradient-to-r from-violet-600 to-purple-600 rounded-lg p-6 text-white">
            <div className="flex items-center space-x-3 mb-4">
              <Mic className="w-8 h-8" />
              <h2 className="text-2xl font-bold">{t('ai.ai.voiceInput.title')}</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{activeModel ? 'AI-Powered' : 'N/A'}</div>
                <div className="text-violet-100">{t('ai.ai.voiceInput.voiceRecognition')}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{activeModel ? activeModel.name : t('ai.ai.voiceInput.noModel')}</div>
                <div className="text-violet-100">{t('ai.ai.voiceInput.activeModel')}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {isRecording ? t('ai.ai.voiceInput.recording') : isProcessing ? t('ai.ai.voiceInput.processing') : transcription ? t('ai.ai.voiceInput.ready') : t('ai.ai.voiceInput.standby')}
                </div>
                <div className="text-violet-100">{t('ai.ai.voiceInput.status')}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {hasPermission === false ? t('ai.ai.voiceInput.noMic') : activeModel ? t('ai.ai.voiceInput.online') : t('ai.ai.voiceInput.offline')}
                </div>
                <div className="text-violet-100">{t('ai.ai.voiceInput.service')}</div>
              </div>
            </div>
            
            {/* Status Information */}
            {activeModel ? (
              <div className="mt-4 p-3 bg-opacity-20 rounded-lg">
                <div className="flex items-center space-x-2 text-sm">
                  <Brain className="w-4 h-4" />
                  <span>{t('ai.ai.voiceInput.activeModelInfo')} <strong>{activeModel.name}</strong> ({activeModel.provider})</span>
                </div>
                {hasPermission === false && (
                  <div className="flex items-center space-x-2 text-sm mt-2">
                    <AlertTriangle className="w-4 h-4 text-yellow-400" />
                    <span>{t('ai.ai.voiceInput.microphonePermissionRequired')}</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="mt-4 p-3 bg-yellow-500 bg-opacity-20 rounded-lg">
                <div className="flex items-center space-x-2 text-sm">
                  <AlertTriangle className="w-4 h-4" />
                  <span>{t('ai.ai.voiceInput.noActiveModelFound')} <a href="/ai-settings" className="underline">{t('ai.ai.voiceInput.configureModelInSettings')}</a></span>
                </div>
              </div>
            )}
          </div>

          {/* Tab Navigation */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'voice', label: t('ai.ai.voiceInput.voiceInput'), icon: Mic },
                { id: 'transcription', label: t('ai.ai.voiceInput.transcription'), icon: FileText },
                { id: 'commands', label: t('ai.ai.voiceInput.voiceCommands'), icon: MessageSquare },
                { id: 'settings', label: t('ai.ai.voiceInput.settings'), icon: Settings }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? 'border-violet-500 text-violet-600'
                      : 'border-transparent text-gray-700 hover:text-gray-900 hover:border-gray-300'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Voice Input Tab */}
          {activeTab === 'voice' && (
            <div className="space-y-6">
              {/* Patient Selection */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                  <Users className="w-5 h-5" />
                  <span>Select Patient</span>
                </h3>
                <SearchablePatientSelect
                  value={selectedPatient?.name || selectedPatientId || ''}
                  onChange={(patient) => {
                    if (patient) {
                      setSelectedPatientId(patient._id);
                      setSelectedPatient(patient);
                    } else {
                      setSelectedPatientId('');
                      setSelectedPatient(null);
                    }
                  }}
                />
              </div>

              {/* Voice Recording Interface */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                  <Mic className="w-5 h-5" />
                  <span>{t('ai.ai.voiceInput.voiceRecording')}</span>
                </h3>
                
                <div className="text-center py-12">
                  <button
                    onClick={toggleRecording}
                    disabled={isProcessing || !activeModel || !hasPermission}
                    className={`w-24 h-24 rounded-full flex items-center justify-center text-white text-2xl focus:outline-none focus:ring-4 transition-all duration-200 ${
                      isRecording 
                        ? 'bg-red-600 hover:bg-red-700 focus:ring-red-300 animate-pulse' 
                        : isProcessing
                        ? 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-300 animate-pulse cursor-not-allowed'
                        : !activeModel || !hasPermission
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-violet-600 hover:bg-violet-700 focus:ring-violet-300'
                    }`}
                  >
                    {isProcessing ? (
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                    ) : isRecording ? (
                      <MicOff />
                    ) : (
                      <Mic />
                    )}
                  </button>
                  
                  <div className="mt-6">
                    <h4 className="text-lg font-medium text-gray-900 mb-2">
                      {isProcessing 
                        ? t('ai.ai.voiceInput.processingAudio')
                        : isRecording 
                        ? t('ai.ai.voiceInput.recording')
                        : !activeModel
                        ? t('ai.ai.voiceInput.noAIModelAvailable')
                        : !hasPermission
                        ? t('ai.ai.voiceInput.microphonePermissionRequiredTitle')
                        : t('ai.ai.voiceInput.clickToStartRecording')
                      }
                    </h4>
                    <p className="text-gray-500">
                      {isProcessing
                        ? t('ai.ai.voiceInput.aiProcessingVoiceRecording')
                        : isRecording 
                        ? t('ai.ai.voiceInput.recordingYourVoice')
                        : !activeModel
                        ? t('ai.ai.voiceInput.configureAIModelFirst')
                        : !hasPermission
                        ? t('ai.ai.voiceInput.allowMicrophoneAccess')
                        : t('ai.ai.voiceInput.clickMicrophoneToStart')
                      }
                    </p>
                  </div>

                  {isRecording && (
                    <div className="mt-6">
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                      <p className="text-sm text-red-600 mt-2">{t('ai.ai.voiceInput.recordingInProgress')}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Voice Features */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('ai.ai.voiceInput.voiceFeatures')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <span className="text-sm text-gray-700">{t('ai.ai.voiceInput.realTimeTranscription')}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <span className="text-sm text-gray-700">{t('ai.ai.voiceInput.medicalTerminologyRecognition')}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <span className="text-sm text-gray-700">{t('ai.ai.voiceInput.multiLanguageSupport')}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <span className="text-sm text-gray-700">{t('ai.ai.voiceInput.noiseCancellation')}</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <span className="text-sm text-gray-700">{t('ai.ai.voiceInput.voiceCommands')}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <span className="text-sm text-gray-700">{t('ai.ai.voiceInput.autoFormatting')}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <span className="text-sm text-gray-700">{t('ai.ai.voiceInput.secureRecording')}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <span className="text-sm text-gray-700">{t('ai.ai.voiceInput.cloudSync')}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Voice Commands Tab */}
          {activeTab === 'commands' && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                  <MessageSquare className="w-5 h-5" />
                  <span>{t('ai.ai.voiceInput.voiceCommands')}</span>
                </h3>
                
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">{t('ai.ai.voiceInput.documentationCommands')}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                      <div className="text-gray-900 font-medium">"{t('ai.ai.voiceInput.newPatientNote')}"</div>
                      <div className="text-gray-900 font-medium">"{t('ai.ai.voiceInput.startConsultation')}"</div>
                      <div className="text-gray-900 font-medium">"{t('ai.ai.voiceInput.endNote')}"</div>
                      <div className="text-gray-900 font-medium">"{t('ai.ai.voiceInput.saveDocument')}"</div>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-green-50 rounded-lg">
                    <h4 className="font-medium text-green-900 mb-2">{t('ai.ai.voiceInput.formattingCommands')}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                      <div className="text-gray-900 font-medium">"{t('ai.ai.voiceInput.newParagraph')}"</div>
                      <div className="text-gray-900 font-medium">"{t('ai.ai.voiceInput.bulletPoint')}"</div>
                      <div className="text-gray-900 font-medium">"{t('ai.ai.voiceInput.numberedList')}"</div>
                      <div className="text-gray-900 font-medium">"{t('ai.ai.voiceInput.boldText')}"</div>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <h4 className="font-medium text-purple-900 mb-2">{t('ai.ai.voiceInput.navigationCommands')}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                      <div className="text-gray-900 font-medium">"{t('ai.ai.voiceInput.goToPatients')}"</div>
                      <div className="text-gray-900 font-medium">"{t('ai.ai.voiceInput.openAppointments')}"</div>
                      <div className="text-gray-900 font-medium">"{t('ai.ai.voiceInput.showDashboard')}"</div>
                      <div className="text-gray-900 font-medium">"{t('ai.ai.voiceInput.searchRecords')}"</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Transcription Tab */}
          {activeTab === 'transcription' && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                  <FileText className="w-5 h-5" />
                  <span>{t('ai.ai.voiceInput.transcriptionResults')}</span>
                </h3>
                
                {isProcessing ? (
                  <div className="text-center py-12">
                    <div className="flex flex-col items-center justify-center space-y-4">
                      <div className="relative">
                        <div className="w-16 h-16 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin"></div>
                      </div>
                      <p className="text-gray-600 font-medium">{t('ai.ai.voiceInput.processingAudio')}</p>
                      <p className="text-sm text-gray-500">Formatting transcription with AI...</p>
                    </div>
                  </div>
                ) : (transcription || interimTranscript) ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <h4 className="font-medium text-blue-900 mb-2">{t('ai.ai.voiceInput.voiceTranscription')}</h4>
                      <p className="text-blue-800 text-sm mb-3">
                        <strong>{t('ai.ai.voiceInput.aiProcessed')}</strong> {t('ai.ai.voiceInput.voiceRecordingTranscribed')}
                      </p>
                      <div className="text-gray-700 leading-relaxed">
                        {transcription ? (
                          <div className="bg-white rounded-lg p-4 border border-gray-200">
                            <FormattedAIResult
                              content={transcription}
                              type="voice-transcription"
                            />
                          </div>
                        ) : null}
                        {interimTranscript && (
                          <p className="text-gray-500 italic mt-2">{interimTranscript}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex space-x-3">
                      <button 
                        onClick={async () => {
                          if (!transcription) {
                            alert('No transcription to save.');
                            return;
                          }
                          if (!selectedPatientId) {
                            alert('Please select a patient first.');
                            return;
                          }
                          
                          try {
                            const response = await fetch('/api/ai-results', {
                              method: 'POST',
                              headers: {
                                'Content-Type': 'application/json',
                              },
                              body: JSON.stringify({
                                patientId: selectedPatientId,
                                type: 'voice-transcription',
                                title: `Voice Transcription - ${new Date().toLocaleDateString()}`,
                                content: transcription,
                                aiModel: activeModel ? {
                                  id: activeModel.id,
                                  name: activeModel.name,
                                  provider: activeModel.provider,
                                } : undefined,
                              }),
                            });

                            if (response.ok) {
                              alert('Transcription saved successfully!');
                            } else {
                              const errorData = await response.json();
                              alert(`Failed to save transcription: ${errorData.error || 'Unknown error'}`);
                            }
                          } catch (error) {
                            console.error('Error saving transcription:', error);
                            alert('Error saving transcription. Please try again.');
                          }
                        }}
                        disabled={!transcription || !selectedPatientId}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 flex items-center space-x-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                      >
                        <Save className="w-4 h-4" />
                        <span>Save Transcription</span>
                      </button>
                      <button className="bg-violet-600 text-white px-4 py-2 rounded-lg hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-500 flex items-center space-x-2">
                        <Download className="w-4 h-4" />
                        <span>{t('ai.ai.voiceInput.download')}</span>
                      </button>
                      <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center space-x-2">
                        <Share2 className="w-4 h-4" />
                        <span>{t('ai.ai.voiceInput.share')}</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Mic className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">{t('ai.ai.voiceInput.noVoiceRecordingYet')}</h3>
                    <p className="text-gray-500 mb-4">{t('ai.ai.voiceInput.clickRecordButtonToStart')}</p>
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg max-w-md mx-auto">
                      <p className="text-blue-800 text-sm">
                        <strong>{t('ai.ai.voiceInput.liveRecording')}</strong> {t('ai.ai.voiceInput.voiceWillBeRecorded')}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                  <Settings className="w-5 h-5" />
                  <span>{t('ai.ai.voiceInput.voiceSettings')}</span>
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('ai.ai.voiceInput.language')}</label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500">
                      <option>{t('ai.ai.voiceInput.englishUS')}</option>
                      <option>{t('ai.ai.voiceInput.spanish')}</option>
                      <option>{t('ai.ai.voiceInput.french')}</option>
                      <option>{t('ai.ai.voiceInput.german')}</option>
                      <option>{t('ai.ai.voiceInput.arabic')}</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('ai.ai.voiceInput.microphone')}</label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500">
                      <option>{t('ai.ai.voiceInput.defaultMicrophone')}</option>
                      <option>{t('ai.ai.voiceInput.builtInMicrophone')}</option>
                      <option>{t('ai.ai.voiceInput.externalMicrophone')}</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('ai.ai.voiceInput.noiseReduction')}</label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500">
                      <option>{t('ai.ai.voiceInput.high')}</option>
                      <option>{t('ai.ai.voiceInput.medium')}</option>
                      <option>{t('ai.ai.voiceInput.low')}</option>
                      <option>{t('ai.ai.voiceInput.off')}</option>
                    </select>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="auto-save" className="rounded border-gray-300 text-violet-600 focus:ring-violet-500" />
                    <label htmlFor="auto-save" className="text-sm text-gray-700">{t('ai.ai.voiceInput.autoSaveTranscriptions')}</label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="voice-commands" className="rounded border-gray-300 text-violet-600 focus:ring-violet-500" />
                    <label htmlFor="voice-commands" className="text-sm text-gray-700">{t('ai.ai.voiceInput.enableVoiceCommands')}</label>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </SidebarLayout>
    </ProtectedRoute>
  );
}
