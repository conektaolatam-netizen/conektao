import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.6dd176645e804e5fb55b43f1aec72e3a',
  appName: 'conektao',
  webDir: 'dist',
  server: {
    url: 'https://6dd17664-5e80-4e5f-b55b-43f1aec72e3a.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    Geolocation: {
      permissions: ['ACCESS_COARSE_LOCATION', 'ACCESS_FINE_LOCATION']
    },
    Camera: {
      permissions: ['CAMERA', 'READ_EXTERNAL_STORAGE', 'WRITE_EXTERNAL_STORAGE']
    }
  }
};

export default config;