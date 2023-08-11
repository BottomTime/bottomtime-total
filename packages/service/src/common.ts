export interface GpsCoordinates {
  lat: number;
  lon: number;
}

export interface Depth {
  depth: number;
  unit: 'ft' | 'm';
}

export interface Range {
  min: number;
  max: number;
}
