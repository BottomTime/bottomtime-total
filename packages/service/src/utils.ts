import {
  DepthDTO,
  DepthUnit,
  PressureDTO,
  PressureUnit,
  TemperatureDTO,
  TemperatureUnit,
  WeightDTO,
  WeightUnit,
} from '@bottomtime/api';

export class UnitUtils {
  static convertDepth(depth: DepthDTO, expectedUnit: DepthUnit): DepthDTO {
    if (expectedUnit === depth.unit) return depth;

    if (expectedUnit === DepthUnit.Meters) {
      return {
        depth: depth.depth * 0.3048,
        unit: DepthUnit.Meters,
      };
    } else {
      return {
        depth: depth.depth / 0.3048,
        unit: DepthUnit.Feet,
      };
    }
  }

  static convertTemperature(
    temperature: TemperatureDTO,
    expectedUnit: TemperatureUnit,
  ): TemperatureDTO {
    if (expectedUnit === temperature.unit) return temperature;

    if (expectedUnit === TemperatureUnit.Celsius) {
      return {
        temperature: (temperature.temperature - 32) * (5 / 9),
        unit: TemperatureUnit.Celsius,
      };
    } else {
      return {
        temperature: temperature.temperature * (9 / 5) + 32,
        unit: TemperatureUnit.Fahrenheit,
      };
    }
  }

  static convertPressure(
    pressure: PressureDTO,
    expectedUnit: PressureUnit,
  ): PressureDTO {
    if (expectedUnit === pressure.unit) return pressure;

    if (expectedUnit === PressureUnit.Bar) {
      return {
        pressure: pressure.pressure * 0.0689475729,
        unit: PressureUnit.Bar,
      };
    } else {
      return {
        pressure: pressure.pressure / 0.0689475729,
        unit: PressureUnit.PSI,
      };
    }
  }

  static convertWeight(weight: WeightDTO, expectedUnit: WeightUnit): WeightDTO {
    if (expectedUnit === weight.unit) return weight;

    if (expectedUnit === WeightUnit.Kilograms) {
      return {
        weight: weight.weight * 2.20462,
        unit: WeightUnit.Kilograms,
      };
    } else {
      return {
        weight: weight.weight / 2.20462,
        unit: WeightUnit.Pounds,
      };
    }
  }
}
