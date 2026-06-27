import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import { useRunStore } from '../../../core/store/run.store';

export const LOCATION_TASK_NAME = 'background-location';

TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
  if (error) return;
  const { locations } = data as { locations: Location.LocationObject[] };
  const location = locations[locations.length - 1];
  if (!location) return;
  useRunStore.getState().onLocationUpdate(location);
});
