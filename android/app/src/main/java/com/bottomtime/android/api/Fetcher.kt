package com.bottomtime.android.api

import android.content.Context
import androidx.core.net.toUri
import com.android.volley.Request
import com.android.volley.Response
import com.android.volley.toolbox.Volley
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException
import kotlin.coroutines.suspendCoroutine

class Fetcher (
  private val context: Context,
  private val baseUrl: String = "http://localhost:4800",
  var jwt: String? = null,
) {
  private val queue = Volley.newRequestQueue(this.context)

  private suspend fun <TBody, TResponse> craftRequest(
    method: Int,
    url: String,
    body: TBody? = null,
  ): HttpResponse<TResponse> {
    return suspendCoroutine { continuation ->
      // Prepare headers.
      val headers = mutableMapOf<String, String>(
        "Accept" to "application/json",
        "Accept-Encoding" to "gzip, deflate, br, zstd",
        "Content-Type" to "application/json",
      )

      // Include auth token, if provided.
      if (this.jwt is String) {
        headers.put("Authorization", "Bearer ${this.jwt}")
      }

      // Prepare request with callbacks.
      val request = JsonRequest<TResponse, TBody>(
        method,
        url,
        Response.Listener<HttpResponse<TResponse>> { response ->
          continuation.resume(response)
        },
        Response.ErrorListener { error ->
          continuation.resumeWithException(error)
        },
        headers,
        body,
      )

      // Queue the request for transmission
      this.queue.add(request)
    }
  }

  fun buildUrl(url: String, query: Map<String, String>? = null): String {
    var fullUrl = this.baseUrl.toUri().buildUpon()
    fullUrl = fullUrl.appendEncodedPath(url)
    query?.entries?.forEach { (key, value) -> fullUrl = fullUrl.appendQueryParameter(key, value) }
    return fullUrl.build().toString()
  }

  suspend fun <TBody : Any> head(url: String, body: TBody? = null): Int {
    val response = this.craftRequest<TBody, Any>(
      Request.Method.HEAD,
      url,
      body,
    )

    return response.status
  }

  suspend fun <TResponse, TBody> get(url: String, body: TBody? = null): HttpResponse<TResponse> {
    return this.craftRequest<TBody, TResponse>(
      Request.Method.GET,
      url,
      body,
    )
  }

  suspend fun <TBody, TResponse> post(url: String, body: TBody?): HttpResponse<TResponse> {
    return this.craftRequest(
      Request.Method.POST,
      url,
      body
    )
  }

  suspend fun <TBody, TResponse> put(url: String, body: TBody?): HttpResponse<TResponse> {
    return this.craftRequest(
      Request.Method.PUT,
      url,
      body
    )
  }

  suspend fun <TBody, TResponse> patch(url: String, body: TBody?): HttpResponse<TResponse> {
    return this.craftRequest(
      Request.Method.PATCH,
      url,
      body
    )
  }

  suspend fun <TBody, TResponse> delete(url: String, body: TBody?): HttpResponse<TResponse> {
    return this.craftRequest(
      Request.Method.DELETE,
      url,
      body
    )
  }
}
