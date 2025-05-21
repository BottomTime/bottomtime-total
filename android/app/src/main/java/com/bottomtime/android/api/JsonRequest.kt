package com.bottomtime.android.api

import android.util.Log
import com.android.volley.NetworkResponse
import com.android.volley.Request
import com.android.volley.Response
import com.android.volley.VolleyError
import com.android.volley.toolbox.HttpHeaderParser
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import java.nio.charset.Charset

internal class JsonRequest<TResponse, TBody>(
  method: Int,
  url: String,
  private val listener: Response.Listener<HttpResponse<TResponse>>,
  private val errorListener: Response.ErrorListener,
  headers: MutableMap<String, String>? = null,
  body: TBody? = null
) : Request<HttpResponse<TResponse>>(method, url, errorListener) {
  private val gson = Gson()

  override fun getHeaders(): Map<String?, String?>? {
    return this.headers ?: super.getHeaders()
  }

  override fun getBody(): ByteArray? {
    if (this.body == null) return super.getBody()
    return this.gson.toJson(body).toString().encodeToByteArray()
  }

  override fun parseNetworkResponse(response: NetworkResponse?): Response<HttpResponse<TResponse>>? {
    try {
      if (response == null) return null

      Log.d("JsonRequest", "Reading string response")
      val jsonString = String(
        response.data ?: ByteArray(0),
        Charset.forName(HttpHeaderParser.parseCharset(response.headers))
      )

      Log.d("JsonRequest", "Parsing JSON content")
      val type = object : TypeToken<TResponse>() {}.type
      val data = this.gson.fromJson<TResponse>(jsonString, type)

      Log.v("JsonRequest", data.toString())

      return Response.success(
        HttpResponse(data, response.statusCode),
        HttpHeaderParser.parseCacheHeaders(response)
      )
    }
    catch (error: VolleyError) {
      return Response.error(error)
    }
    catch (error: Throwable) {
      return Response.error(VolleyError(error.message, error))
    }
  }

  override fun deliverResponse(response: HttpResponse<TResponse>?) {
    this.listener.onResponse(response)
  }
}
