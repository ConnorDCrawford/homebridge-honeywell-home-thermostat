import { API, DynamicPlatformPlugin, Logger, PlatformAccessory, Service, Characteristic } from 'homebridge';
import { AxiosInstance } from 'axios';
import { location, sensoraccessory, accessoryAttribute, T9Thermostat, T9groups, inBuiltSensorState, Settings, HoneywellPlatformConfig } from './configTypes';
/**
 * HomebridgePlatform
 * This class is the main constructor for your plugin, this is where you should
 * parse the user config and discover/register accessories with Homebridge.
 */
export declare class HoneywellHomeThermostatPlatform implements DynamicPlatformPlugin {
    readonly log: Logger;
    readonly config: HoneywellPlatformConfig;
    readonly api: API;
    readonly Service: typeof Service;
    readonly Characteristic: typeof Characteristic;
    readonly accessories: PlatformAccessory[];
    axios: AxiosInstance;
    locations?: any;
    firmware: accessoryAttribute['softwareRevision'];
    sensoraccessory: sensoraccessory;
    constructor(log: Logger, config: HoneywellPlatformConfig, api: API);
    /**
     * This function is invoked when homebridge restores cached accessories from disk at startup.
     * It should be used to setup event handlers for characteristics and update respective values.
     */
    configureAccessory(accessory: PlatformAccessory): void;
    /**
     * Verify the config passed to the plugin is valid
     */
    verifyConfig(): void;
    /**
     * Exchange the refresh token for an access token
     */
    getAccessToken(): Promise<void>;
    /**
     * The refresh token will periodically change.
     * This method saves the updated refresh token in the config.json file
     * @param newRefreshToken
     */
    updateRefreshToken(newRefreshToken: string): Promise<void>;
    /**
     * this method discovers the Locations
     */
    discoverlocations(): Promise<any>;
    /**
     * this method discovers the rooms at each location
     */
    Sensors(device: T9Thermostat, group: T9groups, locationId: location['locationID']): Promise<any>;
    /**
     * this method discovers the firmware Veriosn for T9 Thermostats
     */
    Firmware(): Promise<any>;
    /**
     * This method is used to discover the your location and devices.
     * Accessories are registered by either their DeviceClass, DeviceModel, or DeviceID
     */
    private discoverDevices;
    private T9;
    private T5;
    private Round;
    private TCC;
    unregisterPlatformAccessories(existingAccessory: PlatformAccessory): void;
    locationinfo(location: location): void;
    deviceinfo(device: {
        deviceID: string;
        deviceType: string;
        deviceClass: string;
        deviceModel: string;
        priorityType: string;
        settings: Settings;
        inBuiltSensorState: inBuiltSensorState;
        groups: T9Thermostat['groups'];
    }): void;
}
//# sourceMappingURL=platform.d.ts.map