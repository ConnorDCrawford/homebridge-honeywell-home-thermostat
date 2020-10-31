import { Service, PlatformAccessory } from 'homebridge';
import { HoneywellHomeThermostatPlatform } from '../platform';
import { location, TCCDevice } from '../configTypes';
/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
export declare class TCC {
    private readonly platform;
    private accessory;
    readonly locationId: location['locationID'];
    device: TCCDevice;
    private service;
    fanService?: Service;
    private modes;
    CurrentTemperature: number;
    TargetTemperature: number;
    CurrentHeatingCoolingState: number;
    TargetHeatingCoolingState: number;
    CoolingThresholdTemperature: number;
    HeatingThresholdTemperature: number;
    CurrentRelativeHumidity: number;
    TemperatureDisplayUnits: number;
    honeywellMode: Array<string>;
    Active: number;
    TargetFanState: number;
    deviceFan: any;
    thermostatUpdateInProgress: boolean;
    doThermostatUpdate: any;
    fanUpdateInProgress: boolean;
    doFanUpdate: any;
    constructor(platform: HoneywellHomeThermostatPlatform, accessory: PlatformAccessory, locationId: location['locationID'], device: TCCDevice);
    /**
     * Parse the device status from the honeywell api
     */
    parseStatus(): void;
    /**
     * Asks the Honeywell Home API for the latest device information
     */
    refreshStatus(): Promise<void>;
    /**
     * Pushes the requested changes to the Honeywell API
     */
    pushChanges(): Promise<void>;
    /**
     * Updates the status for each of the HomeKit Characteristics
     */
    updateHomeKitCharacteristics(): void;
    setTargetHeatingCoolingState(value: any, callback: any): void;
    setHeatingThresholdTemperature(value: any, callback: any): void;
    setCoolingThresholdTemperature(value: any, callback: any): void;
    setTargetTemperature(value: any, callback: any): void;
    setTemperatureDisplayUnits(value: any, callback: any): void;
    /**
     * Converts the value to celsius if the temperature units are in Fahrenheit
     */
    toCelsius(value: any): any;
    /**
     * Converts the value to fahrenheit if the temperature units are in Fahrenheit
     */
    toFahrenheit(value: any): any;
    /**
     * Pushes the requested changes for Fan to the Honeywell API
     */
    pushFanChanges(): Promise<void>;
    /**
     * Updates the status for each of the HomeKit Characteristics
     */
    setActive(value: any, callback: any): void;
    setTargetFanState(value: any, callback: any): void;
    private TargetState;
}
//# sourceMappingURL=TCC.d.ts.map