package com.bottomtime.android.api.types

class UserSettingsDTO {
  val depthUnit: DepthUnit = DepthUnit.Meters;
  val pressureUnit: PressureUnit = PressureUnit.Bar;
  val temperatureUnit: TemperatureUnit = TemperatureUnit.Celcius;
  val weightUnit: WeightUnit = WeightUnit.Kilograms;
}
