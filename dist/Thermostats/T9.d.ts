import { PlatformAccessory } from 'homebridge';
import { HoneywellHomeThermostatPlatform } from '../platform';
import { location, accessoryAttribute, T9Thermostat } from '../configTypes';
/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
export declare class T9 {
    private readonly platform;
    private accessory;
    readonly locationId: location['locationID'];
    device: T9Thermostat;
    readonly firmware: accessoryAttribute['softwareRevision'];
    private service;
    fanService: any;
    holdService: any;
    holdEnabledService: any;
    private modes;
    CurrentTemperature: number;
    TargetTemperature: number;
    CurrentHeatingCoolingState: number;
    TargetHeatingCoolingState: number;
    CoolingThresholdTemperature: number;
    HeatingThresholdTemperature: number;
    CurrentRelativeHumidity: number;
    TemperatureDisplayUnits: number;
    SetpointStatus: string;
    honeywellMode: Array<string>;
    setpointStatusMode: Array<string>;
    noHoldSetpointStatusMode: string;
    roompriority: any;
    Active: number;
    TargetFanState: number;
    deviceFan: any;
    roomUpdateInProgress: boolean;
    doRoomUpdate: any;
    thermostatUpdateInProgress: boolean;
    doThermostatUpdate: any;
    fanUpdateInProgress: boolean;
    doFanUpdate: any;
    constructor(platform: HoneywellHomeThermostatPlatform, accessory: PlatformAccessory, locationId: location['locationID'], device: T9Thermostat, firmware: accessoryAttribute['softwareRevision']);
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
     * Pushes the requested changes for Room Priority to the Honeywell API
     */
    pushRoomChanges(): Promise<void>;
    /**
     * Updates the status for each of the HomeKit Characteristics
     */
    updateHomeKitCharacteristics(): void;
    setTargetHeatingCoolingState(value: any, callback: (arg0: null) => void): void;
    setHeatingThresholdTemperature(value: any, callback: (arg0: null) => void): void;
    setCoolingThresholdTemperature(value: any, callback: (arg0: null) => void): void;
    setTargetTemperature(value: any, callback: (arg0: null) => void): void;
    setTemperatureDisplayUnits(value: any, callback: (arg0: null) => void): void;
    setSetpointStatusHoldMode(value: any, callback: (arg0: null) => void): void;
    setSetpointStatusHoldActive(value: any, callback: (arg0: null) => void): void;
    /**
     * Converts the value to celsius if the temperature units are in Fahrenheit
     */
    toCelsius(value: number): number;
    /**
     * Converts the value to fahrenheit if the temperature units are in Fahrenheit
     */
    toFahrenheit(value: number): number;
    /**
     * Pushes the requested changes for Fan to the Honeywell API
     */
    pushFanChanges(): Promise<void>;
    /**
     * Updates the status for each of the HomeKit Characteristics
     */
    setActive(value: number, callback: (arg0: null) => void): void;
    setTargetFanState(value: number, callback: (arg0: null) => void): void;
    private TargetState;
}
//# sourceMappingURL=T9.d.ts.map