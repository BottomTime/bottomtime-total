class AppConfig {
  get adminEmail(): string {
    return process.env.VUE_APP_BT_ADMIN_EMAIL ?? 'admin@bottomti.me';
  }

  get baseUrl(): string {
    return process.env.BASE_URL ?? 'http://localhost:8080/';
  }

  get env(): string {
    return process.env.NODE_ENV ?? 'local';
  }

  get isProduction(): boolean {
    return this.env === 'production';
  }
}

export default new AppConfig();
