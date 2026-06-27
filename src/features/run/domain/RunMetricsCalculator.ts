const EARTH_RADIUS_M = 6371000;
const MIN_ACCURACY_M = 20;
const MIN_DISTANCE_M = 1;
const MAX_SPEED_MPS = 5.5;
const MIN_SPEED_MPS = 0.5;
const EMA_ALPHA = 0.15;
const PACE_WINDOW_SIZE = 15;
const DEAD_RECKONING_STRIDE_M = 0.75;
const CALORIES_FACTOR = 1.036;

interface Coords {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  speed: number | null;
  timestamp: number;
}

export class RunMetricsCalculator {
  private prevCoords: Coords | null = null;
  private totalDistanceM = 0;
  private paceWindow: number[] = [];
  private ema: number = 0;
  private totalSteps = 0;

  static haversineMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return EARTH_RADIUS_M * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  updateMetrics(location: {
    coords: { latitude: number; longitude: number; accuracy: number | null; speed: number | null };
    timestamp: number;
  }): { distanceMeters: number; averagePace: number; lastSpeed: number } {
    const current: Coords = {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      accuracy: location.coords.accuracy,
      speed: location.coords.speed,
      timestamp: location.timestamp,
    };

    let distM = 0;
    let elapsedSeconds = 1;

    if (this.prevCoords !== null) {
      distM = RunMetricsCalculator.haversineMeters(
        this.prevCoords.latitude,
        this.prevCoords.longitude,
        current.latitude,
        current.longitude
      );
      const dtMs = current.timestamp - this.prevCoords.timestamp;
      if (dtMs > 0) elapsedSeconds = dtMs / 1000;
    }

    const dopplerSpeed = current.speed;
    const calculatedSpeed = elapsedSeconds > 0 ? distM / elapsedSeconds : 0;
    const effectiveSpeed = dopplerSpeed !== null ? dopplerSpeed : calculatedSpeed;

    const gpsValid = current.accuracy === null || current.accuracy <= MIN_ACCURACY_M;
    const isMoving = effectiveSpeed >= MIN_SPEED_MPS;
    const isVehicle = effectiveSpeed > MAX_SPEED_MPS;

    this.prevCoords = current;

    if (!gpsValid || distM < MIN_DISTANCE_M || isVehicle || !isMoving) {
      return {
        distanceMeters: this.totalDistanceM,
        averagePace: this.getAveragePace(),
        lastSpeed: effectiveSpeed,
      };
    }

    this.totalDistanceM += distM;

    if (calculatedSpeed >= MIN_SPEED_MPS && calculatedSpeed <= MAX_SPEED_MPS) {
      this.paceWindow.push(calculatedSpeed);
      if (this.paceWindow.length > PACE_WINDOW_SIZE) {
        this.paceWindow.shift();
      }
      if (this.paceWindow.length === 1) {
        this.ema = calculatedSpeed;
      } else {
        this.ema = EMA_ALPHA * calculatedSpeed + (1 - EMA_ALPHA) * this.ema;
      }
    }

    return {
      distanceMeters: this.totalDistanceM,
      averagePace: this.getAveragePace(),
      lastSpeed: effectiveSpeed,
    };
  }

  private getAveragePace(): number {
    if (this.paceWindow.length < 2) return NaN;
    return 1000 / this.ema / 60;
  }

  resetPaceWindow(): void {
    this.paceWindow = [];
    this.ema = 0;
  }

  addDeadReckoningSteps(stepDelta: number, strideMeters: number = DEAD_RECKONING_STRIDE_M): number {
    this.totalSteps += stepDelta;
    this.totalDistanceM += stepDelta * strideMeters;
    return this.totalDistanceM;
  }

  static computeCalories(distanceKm: number, weightKg: number): number {
    return distanceKm * weightKg * CALORIES_FACTOR;
  }

  reset(): void {
    this.prevCoords = null;
    this.totalDistanceM = 0;
    this.paceWindow = [];
    this.ema = 0;
    this.totalSteps = 0;
  }

  getTotalDistance(): number {
    return this.totalDistanceM;
  }
}
