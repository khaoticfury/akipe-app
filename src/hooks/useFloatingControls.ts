import { useState, useEffect, useCallback } from 'react';

export const useFloatingControls = () => {
  const [showFloatingControls, setShowFloatingControls] = useState(true);
  const [mapMovedRecently, setMapMovedRecently] = useState(false);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const [isUserInteracting, setIsUserInteracting] = useState(false);

  const handleMapInteraction = useCallback(() => {
    setShowFloatingControls(true);
    setMapMovedRecently(true);
    setHasUserInteracted(true);
    setIsUserInteracting(true);
  }, []);

  const handleShowControls = useCallback(() => {
    setShowFloatingControls(true);
    setMapMovedRecently(false);
    setHasUserInteracted(true);
    setIsUserInteracting(false);
  }, []);

  // Auto-hide floating controls only when user stops interacting with the map
  useEffect(() => {
    let hideTimer: ReturnType<typeof setTimeout>;
    let interactionTimer: ReturnType<typeof setTimeout>;

    const setupMapInteractionListener = () => {
      const handleMapInteractionStart = () => {
        handleMapInteraction();
        setIsUserInteracting(true);

        // Clear any existing timers
        if (hideTimer) clearTimeout(hideTimer);
        if (interactionTimer) clearTimeout(interactionTimer);

        // Set timer to detect when user stops interacting
        interactionTimer = setTimeout(() => {
          setIsUserInteracting(false);
        }, 500); // Consider user stopped interacting after 500ms of no events
      };

      const handleMapInteractionEnd = () => {
        // Start auto-hide timer only when user stops interacting
        if (hideTimer) clearTimeout(hideTimer);
        hideTimer = setTimeout(() => {
          setShowFloatingControls(false);
          setMapMovedRecently(false);
        }, 3000); // Auto-hide after 3 seconds of no interaction
      };

      // Listen for map interaction events
      window.addEventListener('mapInteractionStart', handleMapInteractionStart);
      window.addEventListener('mapInteractionEnd', handleMapInteractionEnd);

      return () => {
        window.removeEventListener('mapInteractionStart', handleMapInteractionStart);
        window.removeEventListener('mapInteractionEnd', handleMapInteractionEnd);
        if (hideTimer) clearTimeout(hideTimer);
        if (interactionTimer) clearTimeout(interactionTimer);
      };
    };

    const cleanup = setupMapInteractionListener();

    return cleanup;
  }, [handleMapInteraction]);

  // Auto-hide controls when user is not interacting (idle timeout)
  useEffect(() => {
    let idleTimer: ReturnType<typeof setTimeout>;

    const resetIdleTimer = () => {
      if (idleTimer) clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        // Only auto-hide if user hasn't interacted recently and isn't actively interacting
        if (!hasUserInteracted || !isUserInteracting) {
          setShowFloatingControls(false);
          setMapMovedRecently(false);
        }
      }, 10000); // Auto-hide after 10 seconds of complete inactivity
    };

    // Reset idle timer on any user activity
    const handleUserActivity = () => {
      setShowFloatingControls(true);
      resetIdleTimer();
    };

    // Listen for various user activity events
    window.addEventListener('click', handleUserActivity);
    window.addEventListener('touchstart', handleUserActivity);
    window.addEventListener('scroll', handleUserActivity);
    window.addEventListener('keydown', handleUserActivity);

    resetIdleTimer(); // Start initial timer

    return () => {
      window.removeEventListener('click', handleUserActivity);
      window.removeEventListener('touchstart', handleUserActivity);
      window.removeEventListener('scroll', handleUserActivity);
      window.removeEventListener('keydown', handleUserActivity);
      if (idleTimer) clearTimeout(idleTimer);
    };
  }, [hasUserInteracted, isUserInteracting]);

  return {
    showFloatingControls,
    mapMovedRecently,
    hasUserInteracted,
    handleShowControls,
    isUserInteracting
  };
};
