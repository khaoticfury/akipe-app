// Google Maps API type declarations
declare global {
  namespace google {
    namespace maps {
      class Map {
        constructor(mapDiv: HTMLElement, opts?: MapOptions);
        setCenter(latlng: LatLng | LatLngLiteral): void;
        setZoom(zoom: number): void;
        addListener(eventName: string, handler: () => void): void;
        getCenter(): LatLng;
      }

      class Marker {
        constructor(opts?: MarkerOptions);
        setMap(map: Map | null): void;
        getPosition(): LatLng | null;
        setPosition(latlng: LatLng | LatLngLiteral): void;
        addListener(eventName: string, handler: (event: any) => void): void;
        getMap(): Map | null;
      }

      class Circle {
        constructor(opts?: CircleOptions);
        setMap(map: Map | null): void;
      }

      class Polyline {
        constructor(opts?: PolylineOptions);
        setMap(map: Map | null): void;
        getPath(): MVCArray<LatLng>;
      }

      class LatLng {
        constructor(lat: number, lng: number);
        lat(): number;
        lng(): number;
      }

      class Geocoder {
        constructor();
        geocode(request: GeocoderRequest, callback: (results: GeocoderResult[], status: GeocoderStatus) => void): void;
      }

      interface MapOptions {
        center?: LatLngLiteral;
        zoom?: number;
        styles?: MapTypeStyle[];
        disableDefaultUI?: boolean;
        zoomControl?: boolean;
        zoomControlOptions?: ZoomControlOptions;
        gestureHandling?: string;
        mapTypeControl?: boolean;
        streetViewControl?: boolean;
        fullscreenControl?: boolean;
      }

      interface MarkerOptions {
        position?: LatLng | LatLngLiteral;
        map?: Map;
        title?: string;
        label?: MarkerLabel;
        icon?: Icon | string;
        draggable?: boolean;
        animation?: Animation;
      }

      interface CircleOptions {
        strokeColor?: string;
        strokeOpacity?: number;
        strokeWeight?: number;
        fillColor?: string;
        fillOpacity?: number;
        map?: Map;
        center?: LatLng | LatLngLiteral;
        radius?: number;
      }

      interface PolylineOptions {
        path?: (LatLng | LatLngLiteral)[];
        icons?: IconSequence[];
        strokeColor?: string;
        strokeOpacity?: number;
        strokeWeight?: number;
        map?: Map;
      }

      interface LatLngLiteral {
        lat: number;
        lng: number;
      }

      interface MarkerLabel {
        text: string;
        color?: string;
        fontWeight?: string;
        fontSize?: string;
      }

      interface Icon {
        url: string;
        scaledSize?: Size;
        anchor?: Point;
      }

      interface IconSequence {
        icon: Icon;
        offset?: string;
      }

      interface Size {
        width: number;
        height: number;
      }

      interface Point {
        x: number;
        y: number;
      }

      interface MapTypeStyle {
        featureType?: string;
        elementType?: string;
        stylers?: MapTypeStyler[];
      }

      interface MapTypeStyler {
        visibility?: string;
      }

      interface ZoomControlOptions {
        position?: number;
      }

      interface GeocoderRequest {
        address?: string;
      }

      interface GeocoderResult {
        geometry: {
          location: LatLng;
        };
      }

      type GeocoderStatus = 'OK' | 'ERROR' | 'INVALID_REQUEST' | 'OVER_QUERY_LIMIT' | 'REQUEST_DENIED' | 'UNKNOWN_ERROR' | 'ZERO_RESULTS';

      enum Animation {
        DROP = 1,
        BOUNCE = 2
      }

      enum ControlPosition {
        RIGHT_CENTER = 8
      }

      enum SymbolPath {
        CIRCLE = 0,
        FORWARD_CLOSED_ARROW = 3
      }

      class MVCArray<T> {
        getLength(): number;
        setAt(index: number, element: T): void;
      }
    }
  }
}

export {};
