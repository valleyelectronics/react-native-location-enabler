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

if (Platform.OS === 'android') {
  const EVENT_NAME = 'onChangeLocationSettings';
  // Override
  const locationEnabler = new NativeEventEmitter(LocationEnabler);

  LocationEnabler.addChangeListener = (listener: Listener, context?: any) =>
    locationEnabler.addListener(EVENT_NAME, listener, context);

  LocationEnabler.once = (listener: Listener, context?: any) =>
    locationEnabler.once(EVENT_NAME, listener, context);

  LocationEnabler.PRIORITIES = LocationEnabler.getConstants();

  LocationEnabler.useLocationSettings = (
    settings: Config,
    initial?: LocationStatus
  ): LocationSettings => {
    const [enabled, setEnabled] = useState<LocationStatus>(
      initial || undefined
    );

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
} else if (Platform.OS === 'ios') {
  LocationEnabler.PRIORITIES = {
    HIGH_ACCURACY: 100,
    BALANCED_POWER_ACCURACY: 102,
    LOW_POWER: 104,
    NO_POWER: 105,
  };

  LocationEnabler.useLocationSettings = (
    _config: Config,
    _initial?: LocationStatus
  ): LocationSettings => {
    return [false, () => {}];
  };

  LocationEnabler.checkSettings = (_config: Config): void => {};

  LocationEnabler.requestResolutionSettings = (_config: Config): void => {};

  LocationEnabler.addChangeListener = (_listener: Listener, _context?: any) => {
    return {
      remove: () => {},
    };
  };

  LocationEnabler.once = (_listener: Listener, _context?: any) => {
    return {
      remove: () => {},
    };
  };
}

export default LocationEnabler as LocationEnablerType;
