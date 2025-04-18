export interface GeolocationData {
  ip: string;
  hostname?: string;
  continent_code: string;
  continent_name: string;
  country_code2: string;
  country_code3: string;
  country_name: string;
  country_name_official: string;
  country_capital: string;
  state_prov: string;
  state_code: string;
  district: string;
  city: string;
  zipcode: string;
  latitude: string;
  longitude: string;
  is_eu: boolean;
  calling_code: string;
  country_tld: string;
  languages: string;
  country_flag: string;
  geoname_id: string;
  isp: string;
  connection_type: string;
  organization: string;
  country_emoji: string;
  asn?: string;
  currency: {
    code: string;
    name: string;
    symbol: string;
  };
  time_zone: {
    name: string;
    offset: number;
    offset_with_dst: number;
    current_time: string;
    current_time_unix: number;
    is_dst: boolean;
    dst_savings: number;
    dst_exists: boolean;
    dst_start: {
      utc_time: string;
      duration: string;
      gap: boolean;
      dateTimeAfter: string;
      dateTimeBefore: string;
      overlap: boolean;
    };
    dst_end: {
      utc_time: string;
      duration: string;
      gap: boolean;
      dateTimeAfter: string;
      dateTimeBefore: string;
      overlap: boolean;
    };
  };
}

declare global {
  namespace Express {
    interface Request {
      geolocation?: GeolocationData | undefined;
    }
  }
}
