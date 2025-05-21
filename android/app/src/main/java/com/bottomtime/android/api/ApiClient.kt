package com.bottomtime.android.api

class ApiClient (private val fetcher: Fetcher) {
  val auth = AuthApiClient(fetcher)
}
