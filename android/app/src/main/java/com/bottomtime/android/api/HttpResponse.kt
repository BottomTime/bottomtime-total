package com.bottomtime.android.api

data class HttpResponse<T> (val data: T, val status: Int) {}
