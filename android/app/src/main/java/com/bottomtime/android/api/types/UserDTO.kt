package com.bottomtime.android.api.types

class UserDTO() {
  val accountTier: Int = 0;
  val email: String? = null;
  val emailVerified: Boolean = false;
  val hasPassword: Boolean = false;
  val id: String = "";
  val isLockedOut: Boolean = false;
  val lastLogin: Long? = null;
  val lastPasswordChange: Long? = null;
  val memberSince: Long = 0;
  val profile: UserProfileDTO = UserProfileDTO();
  val role: UserRole = UserRole.User;
  val settings: UserSettingsDTO = UserSettingsDTO();
  val username: String = "";
}
