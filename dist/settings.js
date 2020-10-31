"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UIurl = exports.LocationURL = exports.DeviceURL = exports.AuthURL = exports.PLUGIN_NAME = exports.PLATFORM_NAME = void 0;
/**
 * This is the name of the platform that users will use to register the plugin in the Homebridge config.json
 */
exports.PLATFORM_NAME = 'HoneywellHomeThermostat';
/**
 * This must match the name of your plugin as defined the package.json
 */
exports.PLUGIN_NAME = 'homebridge-honeywell-home-thermostat';
/**
 * This is the main url used to access honeywell API
 */
exports.AuthURL = 'https://api.honeywell.com/oauth2/token';
/**
 * This is the main url used to access honeywell API
 */
exports.DeviceURL = 'https://api.honeywell.com/v2/devices';
/**
 * This is the main url used to access honeywell API
 */
exports.LocationURL = 'https://api.honeywell.com/v2/locations';
/**
 * This is the url used to access UI Login to honeywell API
 */
exports.UIurl = 'https://homebridge-honeywell.iot.oz.nu/user/refresh';
//# sourceMappingURL=settings.js.map