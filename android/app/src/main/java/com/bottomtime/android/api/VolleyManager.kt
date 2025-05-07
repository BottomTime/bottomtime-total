package com.bottomtime.android.api

import com.android.volley.Request
import com.android.volley.RequestQueue
import com.android.volley.toolbox.JsonObjectRequest
import kotlinx.coroutines.suspendCancellableCoroutine
import org.json.JSONObject
//import com.google.gson.Gson

internal final class VolleyManager(queue: RequestQueue) {
  private fun getFullUrl(url: String): String {}

  suspend fun <T> getRequest(url: String, query: JSONObject?): T {
    return suspendCancellableCoroutine<T> { continuation ->
      val request = JsonObjectRequest(Request.Method.GET, url, query,
      { response -> gson
      }, { error -> })
    }
  }
}
