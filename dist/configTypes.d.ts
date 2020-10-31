import { PlatformConfig } from 'homebridge';
export interface HoneywellPlatformConfig extends PlatformConfig {
    credentials?: credentials;
    devicediscovery?: boolean;
    options?: options;
}
export declare type credentials = {
    accessToken?: any;
    consumerKey?: any;
    consumerSecret?: any;
    refreshToken?: any;
};
export declare type options = {
    ttl?: number;
    thermostat?: thermostat;
    leaksensor?: leaksensor;
    roomsensor?: roomsensor;
    roompriority?: roompriority;
};
export declare type thermostat = {
    hide?: boolean;
    hide_fan?: boolean;
    thermostatSetpointStatus?: string;
};
export declare type leaksensor = {
    hide?: boolean;
    hide_humidity?: boolean;
    hide_temperature?: boolean;
    hide_leak?: boolean;
};
export declare type roomsensor = {
    hide?: boolean;
    hide_temperature: boolean;
    hide_occupancy: boolean;
    hide_motion: boolean;
    hide_humidity: boolean;
};
export declare type roompriority = {
    thermostat?: boolean;
    priorityType?: string;
};
export declare type location = {
    locationID: number;
    name: string;
    devices: T9Thermostat | T5Device | LeakDevice | TCCDevice | RoundDevice;
};
export declare type T9Thermostat = {
    groups: Array<T9groups>;
    inBuiltSensorState: inBuiltSensorState;
    settings: Settings;
    deviceClass: string;
    deviceType: string;
    deviceID: string;
    userDefinedDeviceName: string;
    name: string;
    isAlive: boolean;
    priorityType: string;
    units: string;
    indoorTemperature: number;
    allowedModes: string;
    minHeatSetpoint: number;
    maxHeatSetpoint: number;
    minCoolSetpoint: number;
    maxCoolSetpoint: number;
    changeableValues: T9changeableValues;
    operationStatus: OperationStatusT9;
    indoorHumidity: number;
    deviceModel: string;
};
export declare type OperationStatusT9 = {
    mode: string;
    fanRequest: boolean;
    circulationFanRequest: boolean;
};
export declare type T9groups = {
    id: number;
};
export declare type inBuiltSensorState = {
    roomId: number;
    roomName: string;
};
export declare type T9changeableValues = {
    mode: string;
    autoChangeoverActive: boolean;
    heatSetpoint: number;
    coolSetpoint: number;
    thermostatSetpointStatus: string;
    nextPeriodTime: string;
    endHeatSetpoint: number;
    endCoolSetpoint: number;
    heatCoolMode: string;
};
export declare type T5Device = {
    displayedOutdoorHumidity: number;
    scheduleStatus: string;
    allowedTimeIncrements: number;
    settings: Settings;
    deviceClass: string;
    deviceType: string;
    deviceID: string;
    userDefinedDeviceName: string;
    name: string;
    isAlive: boolean;
    isUpgrading: boolean;
    isProvisioned: boolean;
    macID: string;
    dataSyncStatus: string;
    units: string;
    indoorTemperature: number;
    outdoorTemperature: number;
    allowedModes: string;
    deadband: number;
    hasDualSetpointStatus: boolean;
    minHeatSetpoint: number;
    maxHeatSetpoint: number;
    minCoolSetpoint: number;
    maxCoolSetpoint: number;
    changeableValues: T5ChangeableValues;
    operationStatus: OperationStatusT5;
    deviceModel: string;
};
export declare type T5ChangeableValues = {
    mode: string;
    autoChangeoverActive: boolean;
    heatSetpoint: number;
    coolSetpoint: number;
    thermostatSetpointStatus: string;
    heatCoolMode: string;
};
export declare type OperationStatusT5 = {
    mode: string;
    fanRequest: boolean;
    circulationFanRequest: boolean;
};
export declare type TCCDevice = {
    thermostatVersion: string;
    scheduleStatus: string;
    settings: Settings;
    deviceClass: string;
    deviceType: string;
    deviceID: string;
    userDefinedDeviceName: string;
    name: string;
    isAlive: boolean;
    isUpgrading: boolean;
    isProvisioned: boolean;
    macID: string;
    parentDeviceId: number;
    service: Service;
    units: string;
    indoorTemperature: number;
    outdoorTemperature: number;
    allowedModes: string;
    hasDualSetpointStatus: boolean;
    minHeatSetpoint: number;
    maxHeatSetpoint: number;
    minCoolSetpoint: number;
    maxCoolSetpoint: number;
    changeableValues: TCC_ChangeableValues;
    operationStatus: OperationStatusTCC;
    indoorHumidity: number;
    deviceModel: string;
};
export declare type OperationStatusTCC = {
    mode: string;
};
export declare type TCC_ChangeableValues = {
    mode: string;
    heatSetpoint: number;
    coolSetpoint: number;
    thermostatSetpointStatus: string;
    nextPeriodTime: string;
    heatCoolMode: string;
};
export declare type Service = {
    mode: string;
};
export declare type RoundDevice = {
    thermostatVersion: string;
    settings: RoundSettings;
    deviceClass: string;
    deviceType: string;
    deviceID: string;
    userDefinedDeviceName: string;
    name: string;
    isAlive: boolean;
    macID: string;
    deviceSettings: Record<string, unknown>;
    service: Service;
    units: string;
    indoorTemperature: number;
    outdoorTemperature: number;
    allowedModes: string;
    hasDualSetpointStatus: boolean;
    minHeatSetpoint: number;
    maxHeatSetpoint: number;
    minCoolSetpoint: number;
    maxCoolSetpoint: number;
    changeableValues: RoundChangeableValues;
    operationStatus: OperationStatusTCC;
    indoorHumidity: number;
    deviceModel: string;
};
export declare type RoundChangeableValues = {
    mode: string;
    autoChangeoverActive: boolean;
    emergencyHeatActive: boolean;
    heatSetpoint: number;
    coolSetpoint: number;
    heatCoolMode: string;
};
export declare type RoundSettings = {
    homeSetPoints: HomeSetPoints;
    awaySetPoints: AwaySetPoints;
    fan: Fan;
    temperatureMode: TemperatureMode;
    specialMode: SpecialMode;
};
export declare type AwaySetPoints = {
    awayHeatSP: number;
    awayCoolSP: number;
    smartCoolSP: number;
    smartHeatSP: number;
    useAutoSmart: boolean;
    units: string;
};
export declare type HomeSetPoints = {
    homeHeatSP: number;
    homeCoolSP: number;
    units: string;
};
export declare type TemperatureMode = {
    feelsLike: boolean;
    air: boolean;
};
export declare type SpecialMode = {
    autoChangeoverActive: boolean;
    emergencyHeatActive: boolean;
};
export declare type Settings = {
    fan: Fan;
};
export declare type Fan = {
    allowedModes: string;
    changeableValues: FanChangeableValues;
    fanRunning: boolean;
};
export declare type FanChangeableValues = {
    mode: string;
};
export declare type LeakDevice = {
    waterPresent: boolean;
    currentSensorReadings: CurrentSensorReadings;
    batteryRemaining: number;
    isRegistered: boolean;
    hasDeviceCheckedIn: boolean;
    isDeviceOffline: boolean;
    deviceClass: string;
    deviceType: string;
    deviceID: string;
    userDefinedDeviceName: string;
    isAlive: boolean;
    deviceSettings: DeviceSettings;
    service: Service;
};
export declare type DeviceSettings = {
    temp: Temp;
    humidity: Humidity;
    userDefinedName: string;
    buzzerMuted: boolean;
    checkinPeriod: number;
    currentSensorReadPeriod: number;
};
export declare type Humidity = {
    high: Record<string, unknown>;
    low: Record<string, unknown>;
};
export declare type CurrentSensorReadings = {
    temperature: number;
    humidity: number;
};
export declare type Temp = {
    high: Record<string, unknown>;
    low: Record<string, unknown>;
};
export declare type sensoraccessory = {
    accessoryId: number;
    accessoryAttribute: accessoryAttribute;
    accessoryValue: accessoryValue;
};
export declare type accessoryAttribute = {
    type: string;
    connectionMethod: string;
    name: string;
    model: string;
    serialNumber: string;
    softwareRevision: string;
    hardwareRevision: string;
};
export declare type accessoryValue = {
    coolSetpoint: number;
    heatSetpoint: number;
    indoorHumidity: number;
    indoorTemperature: number;
    motionDet: boolean;
    occupancyDet: boolean;
    excludeTemp: boolean;
    excludeMotion: boolean;
    pressure: number;
    occupancyTimeout: number;
    status: string;
    batteryStatus: string;
    rssiAverage: number;
    occupancySensitivity: string;
};
export declare type Priority = {
    deviceId: string;
    status: string;
    currentPriority: CurrentPriority;
};
export declare type CurrentPriority = {
    priorityType: string;
    selectedRooms: Record<string, unknown>;
    rooms: PriorityRooms[];
};
export declare type PriorityRooms = {
    rooms: PriorityRoom;
};
export declare type PriorityRoom = {
    id: number;
    roomName: string;
    roomAvgTemp: number;
    roomAvgHumidity: number;
    overallMotion: boolean;
    accessories: Accessory[];
};
export declare type Accessory = {
    id: number;
    type: string;
    excludeTemp: boolean;
    excludeMotion: boolean;
    temperature: number;
    status: string;
    detectMotion: boolean;
};
export interface AxiosRequestConfig {
    params?: Record<string, unknown>;
    headers?: any;
}
//# sourceMappingURL=configTypes.d.ts.map