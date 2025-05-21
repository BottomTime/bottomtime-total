package com.bottomtime.android

import android.app.Application
import com.bottomtime.android.api.*

class BottomTimeApp : Application() {
  override fun onCreate() {
    super.onCreate()
    // TODO: Figure out base URL. (Different for each environment.)
    _apiClient = ApiClient(Fetcher(applicationContext))
  }

  companion object {
    private lateinit var _apiClient: ApiClient

    val apiClient: ApiClient
      get() { return _apiClient }
  }
}
