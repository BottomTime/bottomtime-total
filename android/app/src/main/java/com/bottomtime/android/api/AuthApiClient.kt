package com.bottomtime.android.api

import com.android.volley.Request
import com.android.volley.RequestQueue
import com.android.volley.Response
import com.android.volley.toolbox.JsonObjectRequest
import kotlinx.coroutines.Deferred

class AuthApiClient(client: RequestQueue) {
  private val _client = client;

  suspend fun getCurrentUser(): UserDTO? {
    val request = JsonObjectRequest(Request.Method.GET, "", null,
      Response.Listener { response -> },
      Response.ErrorListener { error -> })

    _client.add(request);
    return null;
  }
}
