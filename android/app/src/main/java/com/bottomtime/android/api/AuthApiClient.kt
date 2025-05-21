package com.bottomtime.android.api

import android.util.Log
import com.bottomtime.android.api.types.*
import com.android.volley.Request
import com.android.volley.RequestQueue
import com.android.volley.Response
import com.android.volley.toolbox.JsonObjectRequest
import com.android.volley.toolbox.StringRequest
import kotlinx.coroutines.Deferred

class AuthApiClient(private val fetcher: Fetcher) {
  suspend fun getCurrentUser(): UserDTO? {
    val url = this.fetcher.buildUrl("/api/auth/me")
    val response = this.fetcher.get<UserDTO, Nothing>(url)
    return response.data
  }
}
