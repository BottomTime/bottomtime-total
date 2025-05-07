package com.bottomtime.android

import android.content.Context
import android.content.SharedPreferences
import android.preference.PreferenceManager
import android.provider.Settings

class AppConfig(ctx: Context) {
  private final val preferences: SharedPreferences;

  // API URL
  init {
    preferences = PreferenceManager.getDefaultSharedPreferences(ctx)
  }

  val apiUrl: String
    get(): String {
      val defaultUrl = "http://localhost:4500"
      return this.preferences.getString("BT_API_URL", defaultUrl) ?: defaultUrl
    }
}
