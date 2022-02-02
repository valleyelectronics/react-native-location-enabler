import { useState, useEffect, useCallback } from 'react';
import { NativeModules, NativeEventEmitter, Platform } from 'react-native';
import type {
  LocationEnablerType,
  Listener,
  Config,
  LocationStatus,
  LocationSettings,
} from './types';

const { LocationEnabler } = NativeModules;
const EVENT_NAME = 'onChangeLocationSettings';

// Override
const locationEnabler = Platform.OS === 'android' ? new NativeEventEmitter(LocationEnabler) : undefined;

// Do not create NativeEventEmitter listeners if the platform is iOS
/* 
 * For reasons I could not find out this method must not have the same name
 * as the new NativeEventEmitter().addListener() added to the Kotlin class
 * to prevent a warning message on launch. If both have the same name, this
 * ends in an endless loop.
 */
LocationEnabler.addChangeListener = (listener: Listener, context?: any) =>
  Platform.OS === 'android'
    ? locationEnabler?.addListener(EVENT_NAME, listener, context)
    : () => null;

// Do not create NativeEventEmitter listeners if the platform is iOS
LocationEnabler.once = (listener: Listener, context?: any) =>
  Platform.OS === 'android'
    ? locationEnabler?.once(EVENT_NAME, listener, context)
    : () => null;

LocationEnabler.PRIORITIES = LocationEnabler.getConstants();

LocationEnabler.useLocationSettings = (
  settings: Config,
  initial?: LocationStatus
): LocationSettings => {
  const [enabled, setEnabled] = useState<LocationStatus>(initial || undefined);

  const callback = useCallback(() => {
    const listner = LocationEnabler.addListener(
      ({ locationEnabled }: { locationEnabled: boolean }) =>
        setEnabled(locationEnabled)
    );
    LocationEnabler.checkSettings(settings);
    if (enabled) listner.remove();
    else return listner;
  }, [enabled, settings]);

  useEffect(() => {
    const listner = callback();
    return () => listner?.remove();
  }, [callback]);

  const requestResolutionSettings = useCallback(
    () => LocationEnabler.requestResolutionSettings(settings),
    [settings]
  );

  return [enabled, requestResolutionSettings];
};

export default LocationEnabler as LocationEnablerType;
