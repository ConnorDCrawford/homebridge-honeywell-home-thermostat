"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HoneywellHomeThermostatPlatform = void 0;
const rxjs_1 = require("rxjs");
const axios_1 = __importDefault(require("axios"));
const qs = __importStar(require("querystring"));
const fs_1 = require("fs");
const settings_1 = require("./settings");
const T9_1 = require("./Thermostats/T9");
const T5_1 = require("./Thermostats/T5");
const Round_1 = require("./Thermostats/Round");
const TCC_1 = require("./Thermostats/TCC");
/**
 * HomebridgePlatform
 * This class is the main constructor for your plugin, this is where you should
 * parse the user config and discover/register accessories with Homebridge.
 */
class HoneywellHomeThermostatPlatform {
    constructor(log, config, api) {
        this.log = log;
        this.config = config;
        this.api = api;
        this.Service = this.api.hap.Service;
        this.Characteristic = this.api.hap.Characteristic;
        // this is used to track restored cached accessories
        this.accessories = [];
        this.axios = axios_1.default.create({
            responseType: 'json',
        });
        this.log.debug('Finished initializing platform:', this.config.name);
        // only load if configured
        if (!this.config) {
            return;
        }
        // verify the config
        try {
            this.verifyConfig();
            this.log.debug('Config OK');
        }
        catch (e) {
            this.log.error(JSON.stringify(e.message));
            this.log.debug(JSON.stringify(e));
            return;
        }
        // setup axios interceptor to add headers / api key to each request
        this.axios.interceptors.request.use((request) => {
            var _a, _b;
            request.headers.Authorization = `Bearer ${(_a = this.config.credentials) === null || _a === void 0 ? void 0 : _a.accessToken}`;
            request.params = request.params || {};
            request.params.apikey = (_b = this.config.credentials) === null || _b === void 0 ? void 0 : _b.consumerKey;
            request.headers['Content-Type'] = 'application/json';
            return request;
        });
        // When this event is fired it means Homebridge has restored all cached accessories from disk.
        // Dynamic Platform plugins should only register new accessories after this event was fired,
        // in order to ensure they weren't added to homebridge already. This event can also be used
        // to start discovery of new accessories.
        this.api.on('didFinishLaunching', async () => {
            log.debug('Executed didFinishLaunching callback');
            // run the method to discover / register your devices as accessories
            rxjs_1.interval((1800 / 3) * 1000).subscribe(async () => {
                try {
                    await this.getAccessToken();
                }
                catch (e) {
                    this.log.error('Failed to refresh access token.', JSON.stringify(e.message));
                    this.log.debug(JSON.stringify(e));
                }
            });
            try {
                this.locations = await this.discoverlocations();
            }
            catch (e) {
                this.log.error('Failed to Discover Locations.', JSON.stringify(e.message));
                this.log.debug(JSON.stringify(e));
            }
            try {
                this.discoverDevices();
            }
            catch (e) {
                this.log.error('Failed to Discover Devices.', JSON.stringify(e.message));
                this.log.debug(JSON.stringify(e));
            }
        });
    }
    /**
     * This function is invoked when homebridge restores cached accessories from disk at startup.
     * It should be used to setup event handlers for characteristics and update respective values.
     */
    configureAccessory(accessory) {
        this.log.info('Loading accessory from cache:', accessory.displayName);
        // add the restored accessory to the accessories cache so we can track if it has already been registered
        this.accessories.push(accessory);
    }
    /**
     * Verify the config passed to the plugin is valid
     */
    verifyConfig() {
        var _a, _b, _c, _d;
        /**
         * Hidden Device Discovery Option - This will disable adding any device and will just output info.
         */
        this.config.devicediscovery;
        if ((_a = this.config.options) === null || _a === void 0 ? void 0 : _a.thermostat) {
            // Thermostat Config Options
            this.config.options.thermostat.hide;
            this.config.options.thermostat.hide_fan;
            this.config.options.thermostat.thermostatSetpointStatus =
                this.config.options.thermostat.thermostatSetpointStatus || 'PermanentHold';
        }
        if ((_b = this.config.options) === null || _b === void 0 ? void 0 : _b.roompriority) {
            // Room Priority Config Options
            this.config.options.roompriority.thermostat;
            this.config.options.roompriority.priorityType = this.config.options.roompriority.priorityType || 'PickARoom';
        }
        this.config.options.ttl = ((_c = this.config.options) === null || _c === void 0 ? void 0 : _c.ttl) || 300; // default 300 seconds
        if (!((_d = this.config.credentials) === null || _d === void 0 ? void 0 : _d.consumerSecret) && this.config.options.ttl < 300) {
            this.log.debug('TTL must be set to 300 or higher unless you setup your own consumerSecret.');
            this.config.options.ttl = 300;
        }
        if (!this.config.credentials) {
            throw new Error('Missing Credentials');
        }
        if (!this.config.credentials.consumerKey) {
            throw new Error('Missing consumerKey');
        }
        if (!this.config.credentials.refreshToken) {
            throw new Error('Missing refreshToken');
        }
    }
    /**
     * Exchange the refresh token for an access token
     */
    async getAccessToken() {
        let result;
        if (this.config.credentials.consumerSecret) {
            result = (await axios_1.default({
                url: settings_1.AuthURL,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                auth: {
                    username: this.config.credentials.consumerKey,
                    password: this.config.credentials.consumerSecret,
                },
                data: qs.stringify({
                    grant_type: 'refresh_token',
                    refresh_token: this.config.credentials.refreshToken,
                }),
                responseType: 'json',
            })).data;
        }
        else {
            this.log.warn('Please re-link your account in the Homebridge UI.');
            // if no consumerSecret is defined, attempt to use the shared consumerSecret
            try {
                result = (await axios_1.default.post(settings_1.UIurl, {
                    consumerKey: this.config.credentials.consumerKey,
                    refresh_token: this.config.credentials.refreshToken,
                })).data;
            }
            catch (e) {
                this.log.error('Failed to exchange refresh token for an access token.', JSON.stringify(e.message));
                this.log.debug(JSON.stringify(e));
                throw e;
            }
        }
        this.config.credentials.accessToken = result.access_token;
        this.log.warn('Got access token:', this.config.credentials.accessToken);
        // check if the refresh token has changed
        if (result.refresh_token !== this.config.credentials.refreshToken) {
            this.log.warn('New refresh token:', result.refresh_token);
            await this.updateRefreshToken(result.refresh_token);
        }
        this.config.credentials.refreshToken = result.refresh_token;
    }
    /**
     * The refresh token will periodically change.
     * This method saves the updated refresh token in the config.json file
     * @param newRefreshToken
     */
    async updateRefreshToken(newRefreshToken) {
        try {
            // check the new token was provided
            if (!newRefreshToken) {
                throw new Error('New token not provided');
            }
            // load in the current config
            const currentConfig = JSON.parse(fs_1.readFileSync(this.api.user.configPath(), 'utf8'));
            // check the platforms section is an array before we do array things on it
            if (!Array.isArray(currentConfig.platforms)) {
                throw new Error('Cannot find platforms array in config');
            }
            // find this plugins current config
            const pluginConfig = currentConfig.platforms.find((x) => x.platform === settings_1.PLATFORM_NAME);
            if (!pluginConfig) {
                throw new Error(`Cannot find config for ${settings_1.PLATFORM_NAME} in platforms array`);
            }
            // check the .credentials is an object before doing object things with it
            if (typeof pluginConfig.credentials !== 'object') {
                throw new Error('pluginConfig.credentials is not an object');
            }
            // set the refresh token
            pluginConfig.credentials.refreshToken = newRefreshToken;
            // save the config, ensuring we maintain pretty json
            fs_1.writeFileSync(this.api.user.configPath(), JSON.stringify(currentConfig, null, 4));
            this.log.warn('Homebridge config.json has been updated with new refresh token.');
        }
        catch (e) {
            this.log.error('Failed to update refresh token in config:', JSON.stringify(e.message));
            this.log.debug(JSON.stringify(e));
        }
    }
    /**
     * this method discovers the Locations
     */
    async discoverlocations() {
        // try and get the access token. If it fails stop here.
        try {
            await this.getAccessToken();
        }
        catch (e) {
            this.log.error('Failed to refresh access token.', JSON.stringify(e.message));
            this.log.debug(JSON.stringify(e));
            return;
        }
        const locations = (await this.axios.get(settings_1.LocationURL)).data;
        this.log.info(`Total Locations Found: ${locations.length}`);
        return locations;
    }
    /**
     * this method discovers the rooms at each location
     */
    async Sensors(device, group, locationId) {
        return (await this.axios.get(`${settings_1.DeviceURL}/thermostats/${device.deviceID}/group/${group.id}/rooms`, {
            params: {
                locationId: locationId,
            },
        })).data;
    }
    /**
     * this method discovers the firmware Veriosn for T9 Thermostats
     */
    async Firmware() {
        var _a, _b;
        // get the devices at each location
        for (const location of this.locations) {
            const locationId = location.locationID;
            for (const device of location.devices) {
                if (device.deviceID.startsWith('LCC')) {
                    if (device.deviceModel.startsWith('T9')) {
                        if (device.groups) {
                            const groups = device.groups;
                            for (const group of groups) {
                                const roomsensors = await this.Sensors(device, group, locationId);
                                if (roomsensors.rooms) {
                                    const rooms = roomsensors.rooms;
                                    if ((_b = (_a = this.config.options) === null || _a === void 0 ? void 0 : _a.roompriority) === null || _b === void 0 ? void 0 : _b.thermostat) {
                                        this.log.info(`Total Rooms Found: ${rooms.length}`);
                                    }
                                    for (const accessories of rooms) {
                                        if (accessories) {
                                            for (const accessory of accessories.accessories) {
                                                const sensoraccessory = accessory;
                                                if (sensoraccessory.accessoryAttribute) {
                                                    if (sensoraccessory.accessoryAttribute.type) {
                                                        if (sensoraccessory.accessoryAttribute.type.startsWith('Thermostat')) {
                                                            this.log.debug(JSON.stringify(sensoraccessory.accessoryAttribute.softwareRevision));
                                                            const softwareRevision = sensoraccessory.accessoryAttribute.softwareRevision;
                                                            return softwareRevision;
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    /**
     * This method is used to discover the your location and devices.
     * Accessories are registered by either their DeviceClass, DeviceModel, or DeviceID
     */
    async discoverDevices() {
        if (this.locations) {
            // get the devices at each location
            for (const location of this.locations) {
                this.log.info(`Getting devices for ${location.name}...`);
                this.log.info(`Total Devices Found at ${location.name}: ${location.devices.length}`);
                const locationId = location.locationID;
                this.log.debug(JSON.stringify(location));
                this.locationinfo(location);
                for (const device of location.devices) {
                    if (device.isAlive && device.deviceClass === 'Thermostat') {
                        if (device.deviceID.startsWith('LCC')) {
                            if (device.deviceModel.startsWith('T9')) {
                                try {
                                    this.firmware = await this.Firmware();
                                }
                                catch (e) {
                                    this.log.error('Failed to Get T9 Firmware Version.', JSON.stringify(e.message));
                                    this.log.debug(JSON.stringify(e));
                                }
                                this.deviceinfo(device);
                                this.log.debug(JSON.stringify(device));
                                this.T9(device, locationId, this.firmware);
                            }
                            else if (device.deviceModel.startsWith('T5')) {
                                this.deviceinfo(device);
                                this.log.debug(JSON.stringify(device));
                                this.T5(device, locationId);
                            }
                            else if (!device.DeviceModel) {
                                this.log.info('A LLC Device has been discovered with a deviceModel that does not start with T5 or T9');
                            }
                        }
                        else if (device.deviceID.startsWith('TCC')) {
                            this.log.info('A TCC Device has been discovered, Currently writing to Honeywell API does not work.');
                            this.log.info(' Feel free to open an issue on GitHub https://git.io/JURI5');
                            if (device.deviceModel.startsWith('Round')) {
                                this.deviceinfo(device);
                                this.log.debug(JSON.stringify(device));
                                this.Round(device, locationId);
                            }
                            else if (device.deviceModel.startsWith('Unknown')) {
                                this.deviceinfo(device);
                                this.log.debug(JSON.stringify(device));
                                this.TCC(device, locationId);
                            }
                            else if (!device.deviceModel) {
                                this.log.info('A TCC Device has been discovered with a deviceModel that does not start with Round or Unknown');
                            }
                        }
                        else {
                            this.log.info('A Device was found that is not supported, ', 'Please open Feature Request Here: https://git.io/JURLY, ', 'If you would like to see support.');
                        }
                    }
                }
            }
        }
        else {
            this.log.error('Failed to Discover Locations. Re-Link Your Honeywell Home Account.');
        }
    }
    async T9(device, locationId, firmware) {
        var _a, _b, _c, _d, _e, _f;
        const uuid = this.api.hap.uuid.generate(`${device.name}-${device.deviceID}-${device.deviceModel}`);
        // see if an accessory with the same uuid has already been registered and restored from
        // the cached devices we stored in the `configureAccessory` method above
        const existingAccessory = this.accessories.find((accessory) => accessory.UUID === uuid);
        if (existingAccessory) {
            // the accessory already exists
            if (!((_b = (_a = this.config.options) === null || _a === void 0 ? void 0 : _a.thermostat) === null || _b === void 0 ? void 0 : _b.hide) && device.isAlive) {
                this.log.info('Restoring existing accessory from cache:', existingAccessory.displayName);
                // if you need to update the accessory.context then you should run `api.updatePlatformAccessories`. eg.:
                existingAccessory.context.firmwareRevision = firmware;
                this.api.updatePlatformAccessories([existingAccessory]);
                // create the accessory handler for the restored accessory
                // this is imported from `platformAccessory.ts`
                new T9_1.T9(this, existingAccessory, locationId, device, firmware);
                this.log.debug(`T9 UDID: ${device.name}-${device.deviceID}-${device.deviceModel}`);
            }
            else if (!device.isAlive || ((_d = (_c = this.config.options) === null || _c === void 0 ? void 0 : _c.thermostat) === null || _d === void 0 ? void 0 : _d.hide)) {
                this.unregisterPlatformAccessories(existingAccessory);
            }
        }
        else if (!((_f = (_e = this.config.options) === null || _e === void 0 ? void 0 : _e.thermostat) === null || _f === void 0 ? void 0 : _f.hide)) {
            // the accessory does not yet exist, so we need to create it
            this.log.info('Adding new accessory:', `${device.name} ${device.deviceModel} ${device.deviceType}`);
            this.log.debug(`Registering new device: ${device.name} ${device.deviceModel} ${device.deviceType} - ${device.deviceID}`);
            // create a new accessory
            const accessory = new this.api.platformAccessory(`${device.name} ${device.deviceType}`, uuid);
            // store a copy of the device object in the `accessory.context`
            // the `context` property can be used to store any data about the accessory you may need
            accessory.context.firmwareRevision = firmware;
            accessory.context.device = device;
            // accessory.context.firmwareRevision = findaccessories.accessoryAttribute.softwareRevision;
            // create the accessory handler for the newly create accessory
            // this is imported from `platformAccessory.ts`
            new T9_1.T9(this, accessory, locationId, device, firmware);
            this.log.debug(`T9 UDID: ${device.name}-${device.deviceID}-${device.deviceModel}`);
            // link the accessory to your platform
            this.api.registerPlatformAccessories(settings_1.PLUGIN_NAME, settings_1.PLATFORM_NAME, [accessory]);
        }
    }
    T5(device, locationId) {
        var _a, _b, _c, _d, _e, _f;
        const uuid = this.api.hap.uuid.generate(`${device.name}-${device.deviceID}-${device.deviceModel}`);
        // see if an accessory with the same uuid has already been registered and restored from
        // the cached devices we stored in the `configureAccessory` method above
        const existingAccessory = this.accessories.find((accessory) => accessory.UUID === uuid);
        if (existingAccessory) {
            // the accessory already exists
            if (!((_b = (_a = this.config.options) === null || _a === void 0 ? void 0 : _a.thermostat) === null || _b === void 0 ? void 0 : _b.hide) && device.isAlive) {
                this.log.info('Restoring existing accessory from cache:', existingAccessory.displayName);
                // if you need to update the accessory.context then you should run `api.updatePlatformAccessories`. eg.:
                //existingAccessory.context.firmwareRevision = findaccessories.accessoryAttribute.softwareRevision;
                //this.api.updatePlatformAccessories([existingAccessory]);
                // create the accessory handler for the restored accessory
                // this is imported from `platformAccessory.ts`
                new T5_1.T5(this, existingAccessory, locationId, device);
                this.log.debug(`T5 UDID: ${device.name}-${device.deviceID}-${device.deviceModel}`);
            }
            else if (!device.isAlive || ((_d = (_c = this.config.options) === null || _c === void 0 ? void 0 : _c.thermostat) === null || _d === void 0 ? void 0 : _d.hide)) {
                this.unregisterPlatformAccessories(existingAccessory);
            }
        }
        else if (!((_f = (_e = this.config.options) === null || _e === void 0 ? void 0 : _e.thermostat) === null || _f === void 0 ? void 0 : _f.hide)) {
            // the accessory does not yet exist, so we need to create it
            this.log.info('Adding new accessory:', `${device.name} ${device.deviceModel} ${device.deviceType}`);
            this.log.debug(`Registering new device: ${device.name} ${device.deviceModel} ${device.deviceType} - ${device.deviceID}`);
            // create a new accessory
            const accessory = new this.api.platformAccessory(`${device.name} ${device.deviceType}`, uuid);
            // store a copy of the device object in the `accessory.context`
            // the `context` property can be used to store any data about the accessory you may need
            accessory.context.device = device;
            // accessory.context.firmwareRevision = findaccessories.accessoryAttribute.softwareRevision;
            // create the accessory handler for the newly create accessory
            // this is imported from `platformAccessory.ts`
            new T5_1.T5(this, accessory, locationId, device);
            this.log.debug(`T5 UDID: ${device.name}-${device.deviceID}-${device.deviceModel}`);
            // link the accessory to your platform
            this.api.registerPlatformAccessories(settings_1.PLUGIN_NAME, settings_1.PLATFORM_NAME, [accessory]);
        }
    }
    Round(device, locationId) {
        var _a, _b, _c, _d, _e, _f;
        const uuid = this.api.hap.uuid.generate(`${device.name}-${device.deviceID}-${device.deviceModel}`);
        // see if an accessory with the same uuid has already been registered and restored from
        // the cached devices we stored in the `configureAccessory` method above
        const existingAccessory = this.accessories.find((accessory) => accessory.UUID === uuid);
        if (existingAccessory) {
            // the accessory already exists
            if (!((_b = (_a = this.config.options) === null || _a === void 0 ? void 0 : _a.thermostat) === null || _b === void 0 ? void 0 : _b.hide) && device.isAlive) {
                this.log.info('Restoring existing accessory from cache:', existingAccessory.displayName);
                // if you need to update the accessory.context then you should run `api.updatePlatformAccessories`. eg.:
                existingAccessory.context.firmwareRevision = device.thermostatVersion;
                this.api.updatePlatformAccessories([existingAccessory]);
                // create the accessory handler for the restored accessory
                // this is imported from `platformAccessory.ts`
                new Round_1.Round(this, existingAccessory, locationId, device);
                this.log.debug(`Round UDID: ${device.name}-${device.deviceID}-${device.deviceModel}`);
            }
            else if (!device.isAlive || ((_d = (_c = this.config.options) === null || _c === void 0 ? void 0 : _c.thermostat) === null || _d === void 0 ? void 0 : _d.hide)) {
                this.unregisterPlatformAccessories(existingAccessory);
            }
        }
        else if (!((_f = (_e = this.config.options) === null || _e === void 0 ? void 0 : _e.thermostat) === null || _f === void 0 ? void 0 : _f.hide)) {
            // the accessory does not yet exist, so we need to create it
            this.log.info('Adding new accessory:', `${device.name} ${device.deviceModel} ${device.deviceType}`);
            this.log.debug(`Registering new device: ${device.name} ${device.deviceModel} ${device.deviceType} - ${device.deviceID}`);
            // create a new accessory
            const accessory = new this.api.platformAccessory(`${device.name} ${device.deviceType}`, uuid);
            // store a copy of the device object in the `accessory.context`
            // the `context` property can be used to store any data about the accessory you may need
            accessory.context.device = device;
            accessory.context.firmwareRevision = device.thermostatVersion;
            // create the accessory handler for the newly create accessory
            // this is imported from `platformAccessory.ts`
            new Round_1.Round(this, accessory, locationId, device);
            this.log.debug(`Round UDID: ${device.name}-${device.deviceID}-${device.deviceModel}`);
            // link the accessory to your platform
            this.api.registerPlatformAccessories(settings_1.PLUGIN_NAME, settings_1.PLATFORM_NAME, [accessory]);
        }
    }
    TCC(device, locationId) {
        var _a, _b, _c, _d, _e, _f;
        const uuid = this.api.hap.uuid.generate(`${device.name}-${device.deviceID}-${device.deviceModel}`);
        // see if an accessory with the same uuid has already been registered and restored from
        // the cached devices we stored in the `configureAccessory` method above
        const existingAccessory = this.accessories.find((accessory) => accessory.UUID === uuid);
        if (existingAccessory) {
            // the accessory already exists
            if (!((_b = (_a = this.config.options) === null || _a === void 0 ? void 0 : _a.thermostat) === null || _b === void 0 ? void 0 : _b.hide) && device.isAlive) {
                this.log.info('Restoring existing accessory from cache:', existingAccessory.displayName);
                // if you need to update the accessory.context then you should run `api.updatePlatformAccessories`. eg.:
                existingAccessory.context.firmwareRevision = device.thermostatVersion;
                this.api.updatePlatformAccessories([existingAccessory]);
                // create the accessory handler for the restored accessory
                // this is imported from `platformAccessory.ts`
                new TCC_1.TCC(this, existingAccessory, locationId, device);
                this.log.debug(`TCC UDID: ${device.name}-${device.deviceID}-${device.deviceModel}`);
            }
            else if (!device.isAlive || ((_d = (_c = this.config.options) === null || _c === void 0 ? void 0 : _c.thermostat) === null || _d === void 0 ? void 0 : _d.hide)) {
                this.unregisterPlatformAccessories(existingAccessory);
            }
        }
        else if (!((_f = (_e = this.config.options) === null || _e === void 0 ? void 0 : _e.thermostat) === null || _f === void 0 ? void 0 : _f.hide)) {
            // the accessory does not yet exist, so we need to create it
            this.log.info('Adding new accessory:', `${device.name} TCC(${device.deviceModel}) ${device.deviceType}`);
            this.log.debug(`Registering new device: ${device.name} TCC(${device.deviceModel}) ${device.deviceType} - ${device.deviceID}`);
            // create a new accessory
            const accessory = new this.api.platformAccessory(`${device.name} ${device.deviceType}`, uuid);
            // store a copy of the device object in the `accessory.context`
            // the `context` property can be used to store any data about the accessory you may need
            accessory.context.device = device;
            accessory.context.firmwareRevision = device.thermostatVersion;
            // create the accessory handler for the newly create accessory
            // this is imported from `platformAccessory.ts`
            new TCC_1.TCC(this, accessory, locationId, device);
            this.log.debug(`TCC UDID: ${device.name}-${device.deviceID}-${device.deviceModel}`);
            // link the accessory to your platform
            this.api.registerPlatformAccessories(settings_1.PLUGIN_NAME, settings_1.PLATFORM_NAME, [accessory]);
        }
    }
    unregisterPlatformAccessories(existingAccessory) {
        // remove platform accessories when no longer present
        this.api.unregisterPlatformAccessories(settings_1.PLUGIN_NAME, settings_1.PLATFORM_NAME, [existingAccessory]);
        this.log.info('Removing existing accessory from cache:', existingAccessory.displayName);
    }
    locationinfo(location) {
        if (this.config.devicediscovery) {
            if (location) {
                this.log.warn(JSON.stringify(location));
            }
        }
    }
    deviceinfo(device) {
        if (this.config.devicediscovery) {
            this.log.warn(JSON.stringify(device));
            if (device.deviceID) {
                this.log.warn(JSON.stringify(device.deviceID));
                this.log.error(`Device ID: ${device.deviceID}`);
            }
            if (device.deviceType) {
                this.log.warn(JSON.stringify(device.deviceType));
                this.log.error(`Device Type: ${device.deviceType}`);
            }
            if (device.deviceClass) {
                this.log.warn(JSON.stringify(device.deviceClass));
                this.log.error(`Device Class: ${device.deviceClass}`);
            }
            if (device.deviceModel) {
                this.log.warn(JSON.stringify(device.deviceModel));
                this.log.error(`Device Model: ${device.deviceModel}`);
            }
            if (device.priorityType) {
                this.log.warn(JSON.stringify(device.priorityType));
                this.log.error(`Device Priority Type: ${device.priorityType}`);
            }
            if (device.settings) {
                this.log.warn(JSON.stringify(device.settings));
                if (device.settings.fan) {
                    this.log.warn(JSON.stringify(device.settings.fan));
                    this.log.error(`Device Fan Settings: ${device.settings.fan}`);
                    if (device.settings.fan.allowedModes) {
                        this.log.warn(JSON.stringify(device.settings.fan.allowedModes));
                        this.log.error(`Device Fan Allowed Modes: ${device.settings.fan.allowedModes}`);
                    }
                    if (device.settings.fan.changeableValues) {
                        this.log.warn(JSON.stringify(device.settings.fan.changeableValues));
                        this.log.error(`Device Fan Changeable Values: ${device.settings.fan.changeableValues}`);
                    }
                }
            }
            if (device.inBuiltSensorState) {
                this.log.warn(JSON.stringify(device.inBuiltSensorState));
                if (device.inBuiltSensorState.roomId) {
                    this.log.warn(JSON.stringify(device.inBuiltSensorState.roomId));
                    this.log.error(`Device Built In Sensor Room ID: ${device.inBuiltSensorState.roomId}`);
                }
                if (device.inBuiltSensorState.roomName) {
                    this.log.warn(JSON.stringify(device.inBuiltSensorState.roomName));
                    this.log.error(`Device Built In Sensor Room Name: ${device.inBuiltSensorState.roomName}`);
                }
            }
            if (device.groups) {
                this.log.warn(JSON.stringify(device.groups));
                for (const group of device.groups) {
                    this.log.error(`Group: ${group.id}`);
                }
            }
        }
    }
}
exports.HoneywellHomeThermostatPlatform = HoneywellHomeThermostatPlatform;
//# sourceMappingURL=platform.js.map