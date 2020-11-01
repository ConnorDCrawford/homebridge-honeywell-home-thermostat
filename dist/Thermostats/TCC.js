"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TCC = void 0;
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
const settings_1 = require("../settings");
/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
class TCC {
    constructor(platform, accessory, locationId, device) {
        var _a, _b, _c, _d, _e, _f, _g, _h;
        this.platform = platform;
        this.accessory = accessory;
        this.locationId = locationId;
        this.device = device;
        // Map Honeywell Modes to HomeKit Modes
        this.modes = {
            Off: platform.Characteristic.TargetHeatingCoolingState.OFF,
            Heat: platform.Characteristic.TargetHeatingCoolingState.HEAT,
            Cool: platform.Characteristic.TargetHeatingCoolingState.COOL,
            Auto: platform.Characteristic.TargetHeatingCoolingState.AUTO,
        };
        // Map HomeKit Modes to Honeywell Modes
        // Don't change the order of these!
        this.honeywellMode = ['Off', 'Heat', 'Cool', 'Auto'];
        // default placeholders
        this.CurrentTemperature;
        this.TargetTemperature;
        this.CurrentHeatingCoolingState;
        this.TargetHeatingCoolingState;
        this.CoolingThresholdTemperature;
        this.HeatingThresholdTemperature;
        this.CurrentRelativeHumidity;
        this.TemperatureDisplayUnits;
        this.Active;
        this.TargetFanState;
        // this is subject we use to track when we need to POST changes to the Honeywell API
        this.doThermostatUpdate = new rxjs_1.Subject();
        this.thermostatUpdateInProgress = false;
        this.doFanUpdate = new rxjs_1.Subject();
        this.fanUpdateInProgress = false;
        // set accessory information
        this.accessory
            .getService(this.platform.Service.AccessoryInformation)
            .setCharacteristic(this.platform.Characteristic.Manufacturer, 'Honeywell')
            .setCharacteristic(this.platform.Characteristic.Model, this.device.deviceModel)
            .setCharacteristic(this.platform.Characteristic.SerialNumber, this.device.deviceID)
            .setCharacteristic(this.platform.Characteristic.FirmwareRevision, this.device.thermostatVersion);
        // get the LightBulb service if it exists, otherwise create a new LightBulb service
        // you can create multiple services for each accessory
        (this.service =
            this.accessory.getService(this.platform.Service.Thermostat) ||
                this.accessory.addService(this.platform.Service.Thermostat)),
            `${this.device.name} ${this.device.deviceClass}`;
        // To avoid "Cannot add a Service with the same UUID another Service without also defining a unique 'subtype' property." error,
        // when creating multiple services of the same type, you need to use the following syntax to specify a name and subtype id:
        // this.accessory.getService('NAME') ?? this.accessory.addService(this.platform.Service.Lightbulb, 'NAME', 'USER_DEFINED_SUBTYPE');
        // set the service name, this is what is displayed as the default name on the Home app
        // in this example we are using the name we stored in the `accessory.context` in the `discoverDevices` method.
        this.service.setCharacteristic(this.platform.Characteristic.Name, `${this.device.name} ${this.device.deviceClass}`);
        // each service must implement at-minimum the "required characteristics" for the given service type
        // see https://developers.homebridge.io/#/service/Thermostat
        // Do initial device parse
        this.parseStatus();
        // Set Min and Max
        if (this.device.changeableValues.heatCoolMode === 'Heat') {
            this.platform.log.debug('Device is in "Heat" mode');
            this.service.getCharacteristic(this.platform.Characteristic.TargetTemperature).setProps({
                minValue: this.toCelsius(device.minHeatSetpoint),
                maxValue: this.toCelsius(device.maxHeatSetpoint),
                minStep: 0.5,
            });
        }
        else if (this.device.changeableValues.heatCoolMode === 'Cool') {
            this.platform.log.debug('Device is in "Cool" mode');
            this.service.getCharacteristic(this.platform.Characteristic.TargetTemperature).setProps({
                minValue: this.toCelsius(device.minCoolSetpoint),
                maxValue: this.toCelsius(device.maxCoolSetpoint),
                minStep: 0.5,
            });
        }
        // The value property of TargetHeaterCoolerState must be one of the following:
        //AUTO = 3; HEAT = 1; COOL = 2; OFF = 0;
        // Set control bindings
        const TargetState = this.TargetState();
        {
            this.service
                .getCharacteristic(this.platform.Characteristic.TargetHeatingCoolingState)
                .setProps({
                validValues: TargetState,
            })
                .on('set', this.setTargetHeatingCoolingState.bind(this));
        }
        this.service.setCharacteristic(this.platform.Characteristic.CurrentHeatingCoolingState, this.CurrentHeatingCoolingState);
        this.service
            .getCharacteristic(this.platform.Characteristic.HeatingThresholdTemperature)
            .on('set', this.setHeatingThresholdTemperature.bind(this));
        this.service
            .getCharacteristic(this.platform.Characteristic.CoolingThresholdTemperature)
            .on('set', this.setCoolingThresholdTemperature.bind(this));
        this.service
            .getCharacteristic(this.platform.Characteristic.TargetTemperature)
            .on('set', this.setTargetTemperature.bind(this));
        this.service
            .getCharacteristic(this.platform.Characteristic.TemperatureDisplayUnits)
            .on('set', this.setTemperatureDisplayUnits.bind(this));
        // Fan Controls
        this.fanService = accessory.getService(this.platform.Service.Fanv2);
        if (((_a = this.device.settings) === null || _a === void 0 ? void 0 : _a.fan) && !((_c = (_b = this.platform.config.options) === null || _b === void 0 ? void 0 : _b.thermostat) === null || _c === void 0 ? void 0 : _c.hide_fan)) {
            this.platform.log.debug('Available FAN settings', this.device.settings.fan);
            this.fanService =
                accessory.getService(this.platform.Service.Fanv2) ||
                    accessory.addService(this.platform.Service.Fanv2, `${this.device.name} ${this.device.deviceClass} Fan`);
            this.fanService.getCharacteristic(this.platform.Characteristic.Active).on('set', this.setActive.bind(this));
            this.fanService
                .getCharacteristic(this.platform.Characteristic.TargetFanState)
                .on('set', this.setTargetFanState.bind(this));
        }
        else if (this.fanService && ((_e = (_d = this.platform.config.options) === null || _d === void 0 ? void 0 : _d.thermostat) === null || _e === void 0 ? void 0 : _e.hide_fan)) {
            accessory.removeService(this.fanService);
        }
        // Retrieve initial values and updateHomekit
        this.refreshStatus();
        // Start an update interval
        rxjs_1.interval(this.platform.config.options.ttl * 1000)
            .pipe(operators_1.skipWhile(() => this.thermostatUpdateInProgress))
            .subscribe(() => {
            this.refreshStatus();
        });
        // Watch for thermostat change events
        // We put in a debounce of 100ms so we don't make duplicate calls
        this.doThermostatUpdate
            .pipe(operators_1.tap(() => {
            this.thermostatUpdateInProgress = true;
        }), operators_1.debounceTime(100))
            .subscribe(async () => {
            try {
                await this.pushChanges();
            }
            catch (e) {
                this.platform.log.error(JSON.stringify(e.message));
                this.platform.log.debug(JSON.stringify(e));
            }
            this.thermostatUpdateInProgress = false;
        });
        if (((_f = this.device.settings) === null || _f === void 0 ? void 0 : _f.fan) && !((_h = (_g = this.platform.config.options) === null || _g === void 0 ? void 0 : _g.thermostat) === null || _h === void 0 ? void 0 : _h.hide_fan)) {
            this.doFanUpdate
                .pipe(operators_1.tap(() => {
                this.fanUpdateInProgress = true;
            }), operators_1.debounceTime(100))
                .subscribe(async () => {
                try {
                    await this.pushFanChanges();
                }
                catch (e) {
                    this.platform.log.error(JSON.stringify(e.message));
                    this.platform.log.debug(JSON.stringify(e));
                }
                this.fanUpdateInProgress = false;
            });
        }
    }
    /**
     * Parse the device status from the honeywell api
     */
    parseStatus() {
        var _a;
        if (this.device.units === 'Fahrenheit') {
            this.TemperatureDisplayUnits = this.platform.Characteristic.TemperatureDisplayUnits.FAHRENHEIT;
        }
        if (this.device.units === 'Celsius') {
            this.TemperatureDisplayUnits = this.platform.Characteristic.TemperatureDisplayUnits.CELSIUS;
        }
        this.CurrentTemperature = this.toCelsius(this.device.indoorTemperature);
        this.CurrentRelativeHumidity = this.device.indoorHumidity;
        if (this.device.changeableValues.heatSetpoint > 0) {
            this.HeatingThresholdTemperature = this.toCelsius(this.device.changeableValues.heatSetpoint);
        }
        if (this.device.changeableValues.coolSetpoint > 0) {
            this.CoolingThresholdTemperature = this.toCelsius(this.device.changeableValues.coolSetpoint);
        }
        this.TargetHeatingCoolingState = this.modes[this.device.changeableValues.mode];
        /**
         * The CurrentHeatingCoolingState is either 'Heat', 'Cool', or 'Off'
         * CurrentHeatingCoolingState =  OFF = 0, HEAT = 1, COOL = 2
         */
        if (this.device.operationStatus.mode === 'Heat') {
            this.CurrentHeatingCoolingState = 1;
            this.platform.log.debug('Device is Currently: ', this.CurrentHeatingCoolingState);
        }
        else if (this.device.operationStatus.mode === 'Cool') {
            this.CurrentHeatingCoolingState = 2;
            this.platform.log.debug('Device is Currently: ', this.CurrentHeatingCoolingState);
        }
        else {
            this.CurrentHeatingCoolingState = 0;
            this.platform.log.debug('Device is Currently: ', this.CurrentHeatingCoolingState);
        }
        // Set the TargetTemperature value based on the current mode
        if (this.TargetHeatingCoolingState === this.platform.Characteristic.TargetHeatingCoolingState.HEAT) {
            if (this.device.changeableValues.heatSetpoint > 0 || this.device.minHeatSetpoint) {
                this.TargetTemperature = this.toCelsius(this.device.changeableValues.heatSetpoint);
            }
        }
        else {
            if (this.device.changeableValues.coolSetpoint > 0 || this.device.minCoolSetpoint) {
                this.TargetTemperature = this.toCelsius(this.device.changeableValues.coolSetpoint);
            }
        }
        // Set the Target Fan State
        if (((_a = this.device.settings) === null || _a === void 0 ? void 0 : _a.fan) && !this.platform.config.options.thermostat.hide_fan) {
            if (this.deviceFan) {
                this.platform.log.debug(`${JSON.stringify(this.deviceFan)}`);
                if (this.deviceFan.mode === 'Auto') {
                    this.TargetFanState = this.platform.Characteristic.TargetFanState.AUTO;
                    this.Active = this.platform.Characteristic.Active.INACTIVE;
                }
                else if (this.deviceFan.mode === 'On') {
                    this.TargetFanState = this.platform.Characteristic.TargetFanState.MANUAL;
                    this.Active = this.platform.Characteristic.Active.ACTIVE;
                }
                else if (this.deviceFan.mode === 'Circulate') {
                    this.TargetFanState = this.platform.Characteristic.TargetFanState.MANUAL;
                    this.Active = this.platform.Characteristic.Active.INACTIVE;
                }
            }
        }
    }
    /**
     * Asks the Honeywell Home API for the latest device information
     */
    async refreshStatus() {
        var _a, _b, _c, _d;
        try {
            this.device = (await this.platform.axios.get(`${settings_1.DeviceURL}/thermostats/${this.device.deviceID}`, {
                params: {
                    locationId: this.locationId,
                },
            })).data;
            this.platform.log.debug(`Fetched update for ${this.device.name} from Honeywell API: ${JSON.stringify(this.device.changeableValues)}`);
            this.platform.log.debug(JSON.stringify(this.device));
            if (((_a = this.device.settings) === null || _a === void 0 ? void 0 : _a.fan) && !((_c = (_b = this.platform.config.options) === null || _b === void 0 ? void 0 : _b.thermostat) === null || _c === void 0 ? void 0 : _c.hide_fan)) {
                this.deviceFan = (await this.platform.axios.get(`${settings_1.DeviceURL}/thermostats/${this.device.deviceID}/fan`, {
                    params: {
                        locationId: this.locationId,
                    },
                })).data;
                this.platform.log.debug(JSON.stringify((_d = this.device.settings) === null || _d === void 0 ? void 0 : _d.fan));
                this.platform.log.debug(JSON.stringify(this.deviceFan));
                this.platform.log.debug(`Fetched update for ${this.device.name} Fan from Honeywell Fan API: ${JSON.stringify(this.deviceFan)}`);
            }
            this.parseStatus();
            this.updateHomeKitCharacteristics();
        }
        catch (e) {
            this.platform.log.error(`Failed to update status of ${this.device.name}`, JSON.stringify(e.message), this.platform.log.debug(JSON.stringify(e)));
        }
    }
    /**
     * Pushes the requested changes to the Honeywell API
     */
    async pushChanges() {
        var _a, _b, _c, _d;
        const payload = {
            mode: this.honeywellMode[this.TargetHeatingCoolingState],
            thermostatSetpointStatus: (_b = (_a = this.platform.config.options) === null || _a === void 0 ? void 0 : _a.thermostat) === null || _b === void 0 ? void 0 : _b.thermostatSetpointStatus,
        };
        // Set the heat and cool set point value based on the selected mode
        if (this.TargetHeatingCoolingState === this.platform.Characteristic.TargetHeatingCoolingState.HEAT) {
            payload.heatSetpoint = this.toFahrenheit(this.TargetTemperature);
            payload.coolSetpoint = this.toFahrenheit(this.CoolingThresholdTemperature);
        }
        else if (this.TargetHeatingCoolingState === this.platform.Characteristic.TargetHeatingCoolingState.COOL) {
            payload.coolSetpoint = this.toFahrenheit(this.TargetTemperature);
            payload.heatSetpoint = this.toFahrenheit(this.HeatingThresholdTemperature);
        }
        else if (this.TargetHeatingCoolingState === this.platform.Characteristic.TargetHeatingCoolingState.AUTO) {
            payload.coolSetpoint = this.toFahrenheit(this.CoolingThresholdTemperature);
            payload.heatSetpoint = this.toFahrenheit(this.HeatingThresholdTemperature);
        }
        else {
            payload.coolSetpoint = this.toFahrenheit(this.CoolingThresholdTemperature);
            payload.heatSetpoint = this.toFahrenheit(this.HeatingThresholdTemperature);
        }
        this.platform.log.info('Sending request to Honeywell API. mode:', `${payload.mode}, coolSetpoint:`, `${payload.coolSetpoint}, heatSetpoint:`, `${payload.heatSetpoint}, thermostatSetpointStatus:`, (_d = (_c = this.platform.config.options) === null || _c === void 0 ? void 0 : _c.thermostat) === null || _d === void 0 ? void 0 : _d.thermostatSetpointStatus);
        this.platform.log.debug(JSON.stringify(payload));
        // Make the API request
        await this.platform.axios.post(`${settings_1.DeviceURL}/thermostats/${this.device.deviceID}`, payload, {
            params: {
                locationId: this.locationId,
            },
        });
        // Refresh the status from the API
        await this.refreshStatus();
    }
    /**
     * Updates the status for each of the HomeKit Characteristics
     */
    updateHomeKitCharacteristics() {
        var _a, _b, _c, _d, _e;
        this.service.updateCharacteristic(this.platform.Characteristic.TemperatureDisplayUnits, this.TemperatureDisplayUnits);
        this.service.updateCharacteristic(this.platform.Characteristic.CurrentTemperature, this.CurrentTemperature);
        this.service.updateCharacteristic(this.platform.Characteristic.CurrentRelativeHumidity, this.CurrentRelativeHumidity);
        this.service.updateCharacteristic(this.platform.Characteristic.TargetTemperature, this.TargetTemperature);
        this.service.updateCharacteristic(this.platform.Characteristic.HeatingThresholdTemperature, this.HeatingThresholdTemperature);
        this.service.updateCharacteristic(this.platform.Characteristic.CoolingThresholdTemperature, this.CoolingThresholdTemperature);
        this.service.updateCharacteristic(this.platform.Characteristic.TargetHeatingCoolingState, this.TargetHeatingCoolingState);
        this.service.updateCharacteristic(this.platform.Characteristic.CurrentHeatingCoolingState, this.CurrentHeatingCoolingState);
        if (((_a = this.device.settings) === null || _a === void 0 ? void 0 : _a.fan) && !((_c = (_b = this.platform.config.options) === null || _b === void 0 ? void 0 : _b.thermostat) === null || _c === void 0 ? void 0 : _c.hide_fan)) {
            (_d = this.fanService) === null || _d === void 0 ? void 0 : _d.updateCharacteristic(this.platform.Characteristic.TargetFanState, this.TargetFanState);
            (_e = this.fanService) === null || _e === void 0 ? void 0 : _e.updateCharacteristic(this.platform.Characteristic.Active, this.Active);
        }
    }
    setTargetHeatingCoolingState(value, callback) {
        this.platform.log.debug(`Set TargetHeatingCoolingState: ${value}`);
        this.TargetHeatingCoolingState = value;
        // Set the TargetTemperature value based on the selected mode
        if (this.TargetHeatingCoolingState === this.platform.Characteristic.TargetHeatingCoolingState.HEAT) {
            this.TargetTemperature = this.toCelsius(this.device.changeableValues.heatSetpoint);
        }
        else {
            this.TargetTemperature = this.toCelsius(this.device.changeableValues.coolSetpoint);
        }
        this.service.updateCharacteristic(this.platform.Characteristic.TargetTemperature, this.TargetTemperature);
        this.doThermostatUpdate.next();
        callback(null);
    }
    setHeatingThresholdTemperature(value, callback) {
        this.platform.log.debug(`Set HeatingThresholdTemperature: ${value}`);
        this.HeatingThresholdTemperature = value;
        this.doThermostatUpdate.next();
        callback(null);
    }
    setCoolingThresholdTemperature(value, callback) {
        this.platform.log.debug(`Set CoolingThresholdTemperature: ${value}`);
        this.CoolingThresholdTemperature = value;
        this.doThermostatUpdate.next();
        callback(null);
    }
    setTargetTemperature(value, callback) {
        this.platform.log.debug(`Set TargetTemperature:': ${value}`);
        this.TargetTemperature = value;
        this.doThermostatUpdate.next();
        callback(null);
    }
    setTemperatureDisplayUnits(value, callback) {
        this.platform.log.debug(`Set TemperatureDisplayUnits: ${value}`);
        this.platform.log.warn('Changing the Hardware Display Units from HomeKit is not supported.');
        // change the temp units back to the one the Honeywell API said the thermostat was set to
        setTimeout(() => {
            this.service.updateCharacteristic(this.platform.Characteristic.TemperatureDisplayUnits, this.TemperatureDisplayUnits);
        }, 100);
        callback(null);
    }
    /**
     * Converts the value to celsius if the temperature units are in Fahrenheit
     */
    toCelsius(value) {
        if (this.TemperatureDisplayUnits === this.platform.Characteristic.TemperatureDisplayUnits.CELSIUS) {
            return value;
        }
        // celsius should be to the nearest 0.5 degree
        return Math.round((5 / 9) * (value - 32) * 2) / 2;
    }
    /**
     * Converts the value to fahrenheit if the temperature units are in Fahrenheit
     */
    toFahrenheit(value) {
        if (this.TemperatureDisplayUnits === this.platform.Characteristic.TemperatureDisplayUnits.CELSIUS) {
            return value;
        }
        return Math.round((value * 9) / 5 + 32);
    }
    /**
     * Pushes the requested changes for Fan to the Honeywell API
     */
    async pushFanChanges() {
        var _a, _b, _c;
        let payload = {
            mode: 'Auto',
        };
        if (((_a = this.device.settings) === null || _a === void 0 ? void 0 : _a.fan) && !((_c = (_b = this.platform.config.options) === null || _b === void 0 ? void 0 : _b.thermostat) === null || _c === void 0 ? void 0 : _c.hide_fan)) {
            this.platform.log.debug(`TargetFanState' ${this.TargetFanState} 'Active' ${this.Active}`);
            if (this.TargetFanState === this.platform.Characteristic.TargetFanState.AUTO) {
                payload = {
                    mode: 'Auto',
                };
            }
            else if (this.TargetFanState === this.platform.Characteristic.TargetFanState.MANUAL &&
                this.Active === this.platform.Characteristic.Active.ACTIVE) {
                payload = {
                    mode: 'On',
                };
            }
            else if (this.TargetFanState === this.platform.Characteristic.TargetFanState.MANUAL &&
                this.Active === this.platform.Characteristic.Active.INACTIVE) {
                payload = {
                    mode: 'Circulate',
                };
            }
            this.platform.log.info(`Sending request to Honeywell API. Fan Mode: ${payload.mode}`);
            this.platform.log.debug(JSON.stringify(payload));
            // Make the API request
            await this.platform.axios.post(`${settings_1.DeviceURL}/thermostats/${this.device.deviceID}/fan`, payload, {
                params: {
                    locationId: this.locationId,
                },
            });
        }
        // Refresh the status from the API
        await this.refreshStatus();
    }
    /**
     * Updates the status for each of the HomeKit Characteristics
     */
    setActive(value, callback) {
        this.platform.log.debug(`Set Active State: ${value}`);
        this.Active = value;
        this.doFanUpdate.next();
        callback(null);
    }
    setTargetFanState(value, callback) {
        this.platform.log.debug(`Set Target Fan State: ${value}`);
        this.TargetFanState = value;
        this.doFanUpdate.next();
        callback(null);
    }
    TargetState() {
        this.platform.log.debug(this.device.allowedModes);
        const TargetState = [4];
        TargetState.pop();
        if (this.device.allowedModes.includes('Cool')) {
            TargetState.push(this.platform.Characteristic.TargetHeatingCoolingState.COOL);
        }
        if (this.device.allowedModes.includes('Heat')) {
            TargetState.push(this.platform.Characteristic.TargetHeatingCoolingState.HEAT);
        }
        if (this.device.allowedModes.includes('Off')) {
            TargetState.push(this.platform.Characteristic.TargetHeatingCoolingState.OFF);
        }
        if (this.device.allowedModes.includes('Auto')) {
            TargetState.push(this.platform.Characteristic.TargetHeatingCoolingState.AUTO);
        }
        this.platform.log.debug('Only Show These Modes:', JSON.stringify(TargetState));
        return TargetState;
    }
}
exports.TCC = TCC;
//# sourceMappingURL=TCC.js.map