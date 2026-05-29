let googleMapsPromise: Promise<void> | null = null;

export const loadGoogleMaps = (): Promise<void> => {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Google Maps solo puede cargarse en el navegador"));
  }

  if (
    window.google &&
    window.google.maps &&
    window.google.maps.places &&
    window.google.maps.geometry
  ) {
    return Promise.resolve();
  }

  if (googleMapsPromise) {
    return googleMapsPromise;
  }

  googleMapsPromise = new Promise((resolve, reject) => {
    const existingScript = document.getElementById("google-maps-script");

    if (existingScript) {
      const checkExistingLoad = () => {
        if (
          window.google &&
          window.google.maps &&
          window.google.maps.places &&
          window.google.maps.geometry
        ) {
          resolve();
        } else {
          setTimeout(checkExistingLoad, 300);
        }
      };

      checkExistingLoad();
      return;
    }

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      reject(
        new Error(
          "Falta NEXT_PUBLIC_GOOGLE_MAPS_API_KEY en tu archivo .env.local"
        )
      );
      return;
    }

    const script = document.createElement("script");
    script.id = "google-maps-script";
    script.async = true;
    script.defer = true;

    script.src =
      `https://maps.googleapis.com/maps/api/js` +
      `?key=${apiKey}` +
      `&libraries=places,marker,geometry` +
      `&v=weekly` +
      `&loading=async`;

    script.onload = () => {
      const checkLibraries = () => {
        if (
          window.google &&
          window.google.maps &&
          window.google.maps.places &&
          window.google.maps.geometry
        ) {
          resolve();
          return;
        }

        setTimeout(checkLibraries, 300);
      };

      checkLibraries();
    };

    script.onerror = () => {
      googleMapsPromise = null;
      reject(new Error("No se pudo cargar Google Maps"));
    };

    document.head.appendChild(script);
  });

  return googleMapsPromise;
};