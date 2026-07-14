export interface GeoCoordinates {
  lat: number;
  lng: number;
}

export function getCurrentLocation(): Promise<GeoCoordinates> {
  return new Promise((resolve) => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        () => {
          // Fallback simulation on error/denial
          resolve({ lat: 37.7749, lng: -122.4194 });
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } else {
      // Fallback simulation when geolocation unavailable
      resolve({ lat: 37.7749, lng: -122.4194 });
    }
  });
}
