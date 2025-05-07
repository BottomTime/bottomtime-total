package com.bottomtime.android.api

import android.content.Context
import com.android.volley.RequestQueue
import com.android.volley.toolbox.Volley

class ApiClient(ctx: Context) {
  private val _client: RequestQueue = Volley.newRequestQueue(ctx);

  final val auth = AuthApiClient(this._client)
}
