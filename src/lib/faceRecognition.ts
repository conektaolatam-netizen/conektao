import * as faceapi from 'face-api.js';

let modelsLoaded = false;
let modelsLoading = false;

// CDN URL for face-api.js models
const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.2/model';

export const loadFaceRecognitionModels = async (): Promise<boolean> => {
  if (modelsLoaded) return true;
  
  if (modelsLoading) {
    // Wait for loading to complete
    while (modelsLoading) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return modelsLoaded;
  }
  
  modelsLoading = true;
  
  try {
    console.log('📦 Loading face recognition models from CDN...');
    
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
    ]);
    
    modelsLoaded = true;
    console.log('✅ Face recognition models loaded successfully');
    return true;
  } catch (error) {
    console.error('❌ Error loading face recognition models:', error);
    modelsLoaded = false;
    return false;
  } finally {
    modelsLoading = false;
  }
};

export const detectFace = async (
  videoElement: HTMLVideoElement
): Promise<faceapi.WithFaceDescriptor<faceapi.WithFaceLandmarks<{ detection: faceapi.FaceDetection }, faceapi.FaceLandmarks68>> | null> => {
  const detection = await faceapi
    .detectSingleFace(videoElement, new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.5 }))
    .withFaceLandmarks()
    .withFaceDescriptor();
  
  return detection || null;
};

export const extractFaceDescriptor = async (
  videoElement: HTMLVideoElement
): Promise<Float32Array | null> => {
  const detection = await detectFace(videoElement);
  
  if (!detection) {
    return null;
  }
  
  return detection.descriptor;
};

export const compareFaces = (
  descriptor1: Float32Array | number[],
  descriptor2: Float32Array | number[]
): { isMatch: boolean; confidence: number; distance: number } => {
  const arr1 = Array.from(descriptor1);
  const arr2 = Array.from(descriptor2);
  
  const distance = faceapi.euclideanDistance(arr1, arr2);
  
  // Threshold: 0.6 is typical, lower = more strict
  const threshold = 0.6;
  const isMatch = distance < threshold;
  
  // Convert distance to confidence (0-1 scale)
  // Distance 0 = 100% confidence, Distance 0.6+ = 0% confidence
  const confidence = Math.max(0, Math.min(1, 1 - (distance / threshold)));
  
  return { isMatch, confidence, distance };
};

export const captureFrameAsBlob = async (
  videoElement: HTMLVideoElement
): Promise<Blob | null> => {
  const canvas = document.createElement('canvas');
  canvas.width = videoElement.videoWidth;
  canvas.height = videoElement.videoHeight;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  
  ctx.drawImage(videoElement, 0, 0);
  
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.8);
  });
};

export const isModelsLoaded = () => modelsLoaded;
