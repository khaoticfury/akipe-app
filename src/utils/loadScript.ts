

const GOOGLE_MAPS_API_KEY = 'AIzaSyBqTXBlDlviimIzwCGoOtda0tVI9h5Matg';

export const loadGoogleMaps = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    let retryCount = 0;
    const maxRetries = 3;

    const loadScript = () => {
      // Define the callback function
      (window as any).initMap = () => {
        resolve();
      };

      // Check if Google Maps is already loaded
      if (window.google && window.google.maps && window.google.maps.Map) {
        resolve();
        return;
      }

      // Check if script is already loading
      const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
      if (existingScript) {
        // Wait for it to load
        const checkGoogle = () => {
          if (window.google && window.google.maps && window.google.maps.Map) {
            resolve();
          } else {
            setTimeout(checkGoogle, 100);
          }
        };
        checkGoogle();
        return;
      }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places,geometry&loading=async`;
    script.async = true;
    script.defer = true;

      script.onerror = () => {
        retryCount++;
        if (retryCount < maxRetries) {
          console.log(`Retrying Google Maps load (${retryCount}/${maxRetries})`);
          setTimeout(loadScript, 1000);
        } else {
          reject(new Error('Failed to load Google Maps API after retries. Please check your API key and internet connection.'));
        }
      };

      script.onload = () => {
        // Wait for Google Maps to be available
        const checkGoogle = () => {
          if (window.google && window.google.maps && window.google.maps.Map) {
            resolve();
          } else {
            setTimeout(checkGoogle, 100);
          }
        };
        checkGoogle();
      };

      document.head.appendChild(script);
    };

    loadScript();
  });
};

export const loadScript = (src: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = src;
    script.async = true;

    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`));

    document.head.appendChild(script);
  });
};
