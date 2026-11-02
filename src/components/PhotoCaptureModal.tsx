import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  Image as ImageIcon,
  RotateCw,
  X,
  Check,
  Upload,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { compressAndResizeImage } from '../utils/imageUtils';

interface PhotoCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPhotoSelected: (dataUrl: string) => void;
  title?: string;
  subtitle?: string;
  currentPhotoUrl?: string;
}

export const PhotoCaptureModal: React.FC<PhotoCaptureModalProps> = ({
  isOpen,
  onClose,
  onPhotoSelected,
  title = 'Adicionar Foto',
  subtitle = 'Tire uma foto com a câmera ou selecione da sua galeria',
  currentPhotoUrl,
}) => {
  const [activeMode, setActiveMode] = useState<'options' | 'camera' | 'preview'>('options');
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const nativeCameraInputRef = useRef<HTMLInputElement | null>(null);

  // Desliga o stream de vídeo da câmera ao fechar ou trocar de modo
  const stopCameraStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  useEffect(() => {
    if (!isOpen) {
      stopCameraStream();
      setActiveMode('options');
      setCapturedPhoto(null);
      setCameraError(null);
    }
  }, [isOpen]);

  useEffect(() => {
    return () => {
      stopCameraStream();
    };
  }, []);

  // Inicia câmera ao vivo
  const startCamera = async (mode: 'user' | 'environment') => {
    setCameraError(null);
    stopCameraStream();
    setActiveMode('camera');

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError('Seu navegador não suporta acesso direto à câmera. Use a opção de galeria ou câmera nativa abaixo.');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: mode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch((err) => {
          console.warn('Erro ao reproduzir vídeo:', err);
        });
      }
    } catch (err: any) {
      console.warn('Erro ao acessar câmera:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraError('Permissão de acesso à câmera negada. Permita o acesso nas configurações do navegador ou use o botão de arquivo/galeria.');
      } else {
        setCameraError('Não foi possível iniciar a câmera neste dispositivo. Use a opção de galeria ou câmera nativa.');
      }
    }
  };

  // Alterna entre câmera frontal e traseira
  const handleToggleFacingMode = () => {
    const nextMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextMode);
    startCamera(nextMode);
  };

  // Disparo de foto pela webcam / câmera ao vivo
  const handleSnapPhoto = async () => {
    if (!videoRef.current) return;
    setIsProcessing(true);

    try {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Se estiver usando câmera frontal, espelha para parecer espelho natural
        if (facingMode === 'user') {
          ctx.translate(canvas.width, 0);
          ctx.scale(-1, 1);
        }
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const rawDataUrl = canvas.toDataURL('image/jpeg', 0.9);
        const compressed = await compressAndResizeImage(rawDataUrl, 800, 800, 0.82);

        stopCameraStream();
        setCapturedPhoto(compressed);
        setActiveMode('preview');
      }
    } catch (err) {
      console.error('Erro ao tirar foto:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Upload a partir de arquivo da galeria ou câmera nativa
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    try {
      const compressed = await compressAndResizeImage(file, 800, 800, 0.82);
      setCapturedPhoto(compressed);
      setActiveMode('preview');
    } catch (err) {
      console.error('Erro ao processar imagem:', err);
      alert('Erro ao carregar imagem selecionada.');
    } finally {
      setIsProcessing(false);
      if (e.target) e.target.value = '';
    }
  };

  // Confirmação final da foto
  const handleConfirmPhoto = () => {
    if (capturedPhoto) {
      onPhotoSelected(capturedPhoto);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in">
      <div className="bg-white rounded-2xl sm:rounded-3xl max-w-lg w-full border border-stone-200 shadow-2xl overflow-hidden my-auto flex flex-col">
        {/* Topo do Modal */}
        <div className="p-4 sm:p-5 border-b border-stone-100 flex items-center justify-between bg-[#FDFBF9]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-gradient-to-br from-rose-500 to-rose-600 text-white rounded-xl shadow-xs">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif text-base sm:text-lg font-bold text-stone-900">
                {title}
              </h3>
              <p className="text-[11px] sm:text-xs text-stone-500">
                {subtitle}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              stopCameraStream();
              onClose();
            }}
            className="text-stone-400 hover:text-stone-800 p-1.5 rounded-xl hover:bg-stone-100 transition-colors cursor-pointer"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Inputs ocultos para galeria e câmera nativa */}
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
        <input
          type="file"
          ref={nativeCameraInputRef}
          accept="image/*"
          capture="environment"
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Corpo do Modal */}
        <div className="p-4 sm:p-6 text-xs space-y-4">
          {/* MODO 1: MENU DE OPÇÕES (Galeria ou Câmera) */}
          {activeMode === 'options' && (
            <div className="space-y-4">
              {currentPhotoUrl && (
                <div className="flex items-center justify-center pb-2">
                  <div className="relative group">
                    <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-rose-200 bg-rose-50 shadow-inner">
                      <img
                        src={currentPhotoUrl}
                        alt="Foto Atual"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span className="absolute -bottom-2 inset-x-0 text-center text-[10px] font-bold text-rose-700 bg-rose-100 py-0.5 rounded-full shadow-2xs">
                      Foto Atual
                    </span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {/* Opção A: Câmera em Tempo Real */}
                <button
                  type="button"
                  onClick={() => startCamera(facingMode)}
                  className="p-4 sm:p-5 rounded-2xl border-2 border-dashed border-rose-200 hover:border-rose-400 bg-gradient-to-br from-[#FFF8F9] to-[#FFF0F3] flex flex-col items-center justify-center text-center gap-2.5 transition-all group cursor-pointer shadow-2xs hover:shadow-xs"
                >
                  <div className="w-12 h-12 rounded-2xl bg-white border border-rose-200 flex items-center justify-center text-rose-600 group-hover:scale-105 transition-transform shadow-xs">
                    <Camera className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="font-bold text-stone-900 block text-xs sm:text-sm">
                      Tirar com a Câmera
                    </span>
                    <span className="text-[11px] text-stone-500 block mt-0.5">
                      Abrir câmera agora no aparelho
                    </span>
                  </div>
                </button>

                {/* Opção B: Galeria / Arquivos */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-4 sm:p-5 rounded-2xl border-2 border-dashed border-stone-200 hover:border-rose-300 bg-white hover:bg-stone-50 flex flex-col items-center justify-center text-center gap-2.5 transition-all group cursor-pointer shadow-2xs hover:shadow-xs"
                >
                  <div className="w-12 h-12 rounded-2xl bg-stone-50 border border-stone-200 flex items-center justify-center text-stone-700 group-hover:scale-105 transition-transform shadow-xs">
                    <ImageIcon className="w-6 h-6 text-rose-500" />
                  </div>
                  <div>
                    <span className="font-bold text-stone-900 block text-xs sm:text-sm">
                      Escolher da Galeria
                    </span>
                    <span className="text-[11px] text-stone-500 block mt-0.5">
                      Selecionar foto salva no celular ou PC
                    </span>
                  </div>
                </button>
              </div>

              {/* Botão extra: Disparar câmera nativa do celular (caso queira o app de foto do sistema) */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => nativeCameraInputRef.current?.click()}
                  className="w-full py-2.5 px-3 rounded-xl border border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-700 font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5 text-stone-500" />
                  <span>Usar Aplicativo de Câmera Nativo do Aparelho</span>
                </button>
              </div>
            </div>
          )}

          {/* MODO 2: CÂMERA AO VIVO */}
          {activeMode === 'camera' && (
            <div className="space-y-3">
              {cameraError ? (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-3">
                  <div className="flex items-start gap-2.5 text-amber-800">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-xs">{cameraError}</p>
                      <p className="text-[11px] text-amber-700 mt-1">
                        Você também pode usar o botão abaixo para abrir a câmera padrão do seu celular:
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => nativeCameraInputRef.current?.click()}
                      className="flex-1 py-2 px-3 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-center cursor-pointer"
                    >
                      Abrir Câmera do Celular
                    </button>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex-1 py-2 px-3 bg-white border border-amber-300 text-amber-900 font-bold rounded-xl text-center cursor-pointer"
                    >
                      Escolher da Galeria
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="relative w-full aspect-4/3 bg-stone-950 rounded-2xl overflow-hidden shadow-inner flex items-center justify-center">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />

                    {/* Guia visual de enquadramento suave */}
                    <div className="absolute inset-0 border-2 border-white/20 pointer-events-none rounded-2xl flex items-center justify-center">
                      <div className="w-48 h-48 border border-white/40 border-dashed rounded-full" />
                    </div>

                    {/* Botão de inverter câmera (frontal / traseira) */}
                    <button
                      type="button"
                      onClick={handleToggleFacingMode}
                      className="absolute top-3 right-3 p-2.5 bg-black/50 hover:bg-black/70 text-white rounded-full backdrop-blur-xs transition-colors cursor-pointer"
                      title="Alternar Câmera"
                    >
                      <RotateCw className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Barra de Disparo */}
                  <div className="flex items-center justify-center gap-4 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        stopCameraStream();
                        setActiveMode('options');
                      }}
                      className="px-4 py-2 border border-stone-200 text-stone-600 hover:bg-stone-50 rounded-xl font-medium cursor-pointer"
                    >
                      Voltar
                    </button>

                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={handleSnapPhoto}
                      className="w-14 h-14 rounded-full bg-gradient-to-tr from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white flex items-center justify-center shadow-lg shadow-rose-300 transition-transform active:scale-95 cursor-pointer"
                      title="Tirar Foto"
                    >
                      <Camera className="w-6 h-6" />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        stopCameraStream();
                        fileInputRef.current?.click();
                      }}
                      className="px-3.5 py-2 border border-stone-200 text-stone-600 hover:bg-stone-50 rounded-xl font-medium cursor-pointer"
                    >
                      Galeria
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* MODO 3: PRÉ-VISUALIZAÇÃO DA FOTO CAPTURADA */}
          {activeMode === 'preview' && capturedPhoto && (
            <div className="space-y-4">
              <div className="flex flex-col items-center justify-center">
                <div className="w-56 h-56 sm:w-64 sm:h-64 rounded-3xl overflow-hidden border-2 border-rose-300 bg-stone-900 shadow-md">
                  <img
                    src={capturedPhoto}
                    alt="Foto Capturada"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex items-center gap-1.5 text-emerald-700 font-semibold text-xs mt-3">
                  <Check className="w-4 h-4" />
                  <span>Foto pronta e otimizada!</span>
                </div>
              </div>

              <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => {
                    setCapturedPhoto(null);
                    setActiveMode('options');
                  }}
                  className="w-full sm:w-auto px-4 py-2.5 border border-stone-200 hover:bg-stone-50 text-stone-700 font-semibold rounded-xl text-center transition-colors cursor-pointer"
                >
                  Tirar Outra / Trocar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmPhoto}
                  className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white font-bold rounded-xl text-center shadow-xs shadow-rose-200 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Usar Esta Foto</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
