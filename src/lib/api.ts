import assert from 'assert';
// import http2 from 'http2-wrapper';
import axios, { AxiosInstance, AxiosProxyConfig, AxiosResponse, HeadersDefaults } from 'axios';
import { includes } from 'lodash';
import { RandomRequest } from './random';
import {
  AuthError,
  VerificationError,
  MissingAccessTokenError,
  MissingParameterError
} from './exceptions';
import { require_auth, randomizable } from './decorators';

const API_URL: string = 'https://api.airbnb.com/v2';
const API_KEY: string = '915pw2pnf4h1aiguhph5gc5b2';
const date: Date = new Date();

export interface AirBnBInitOptions {
    email?: string;
    password?: string ;
    accessToken?: string;
    apiKey?: string  | typeof API_KEY;
    sessionCookie?: string | null;
    randomize?: boolean;
    proxy?: AxiosProxyConfig | false;
}

// function http2AdapterEnhancer(adapter: AxiosAdapter) {
//   return async (config: Http2RequestConfig) => {
//     let req: http2.ClientRequest = (undefined as unknown) as http2.ClientRequest;

//     config.transport = {
//       request: function request(
//         options: Record<string, unknown>,
//         handleResponse: http2.RequestFunction<http2.ClientRequest>
//       ) {
//         req = http2.request(options, handleResponse);
//         return req;
//       }
//     };

//     if (req) {
//       const listeners = req.listeners('socket');
//       if (listeners.length) {
//         const listener = listeners[0] as () => void;
//         req.removeListener('socket', listener);
//       }
//     }

//     const ret = adapter(config);

//     return ret;
//   };
// }


// const http2Adapter = http2AdapterEnhancer(
//   axios.defaults.adapter as AxiosAdapter
// );

class Airbnb {
  /*
        Base API class
        ----------------
        api = new Api(accessToken=os.environ.get("AIRBNB_ACCESS_TOKEN"))
        api.get_profile() # doctest: +ELLIPSIS
        api = Api()
        api.get_homes("Lisbon, Portugal") # doctest: +ELLIPSIS
        api.get_homes(gps_lat=55.6123352, gps_lng=37.7117917) # doctest: +ELLIPSIS
        api.get_homes("Lisbon, Portugal", checkin=datetime.datetime.now().strftime("%Y-%m-%d"), checkout=(datetime.datetime.now() + datetime.timedelta(days=30)).strftime("%Y-%m-%d")) # doctest: +ELLIPSIS
        api.get_calendar(975964) # doctest: +ELLIPSIS
        api.get_reviews(975964) # doctest: +ELLIPSIS
        api = Api(randomize=True)
        api.get_listing_details(975964) # doctest: +ELLIPSIS

    */
  private _accessToken: string | null;
  private _session: AxiosInstance;
  private userAgent: string;
  private uuid: string;
  private udid: string;
  private _randomize: boolean;
  private _loginPayload: {
    email: string,
    password: string,
    type: 'email',
  } | null;

  constructor({email, password, accessToken, apiKey, sessionCookie, randomize, proxy}: AirBnBInitOptions) {

    this._session = axios.create({
      baseURL: API_URL,
      // adapter: http2Adapter
    });

    this._loginPayload = null;
    this._accessToken = null;
    this.userAgent =
      'Airbnb/22.37 Name/GLOBAL_TRAVEL AppVersion/22.37 ReleaseStage/live iPhone/16.0 Type/Phone';
    this.udid = '9120210f8fb1ae837affff54a0a2f64da821d227';
    this.uuid = 'C326397B-3A38-474B-973B-F022E6E4E6CC';
    this._randomize = !!randomize;

    this._session.defaults.headers = ({
      accepts: 'application/json',
      'accept-encoding': 'br, gzip, deflate',
      'content-type': 'application/json',
      'x-airbnb-api-key': apiKey || API_KEY,
      'user-agent': this.userAgent,
      'x-airbnb-carrier-name': 'T-Mobile',
      'x-airbnb-network-type': 'wifi',
      'x-airbnb-currency': 'USD',
      'x-airbnb-carrier-country': 'us',
      'accept-language': 'en-us',
      'airbnb-device-id': this.udid,
      'x-airbnb-advertising-id': this.uuid,
      'x-airbnb-locale': 'en-GB',
      'x-user-is-auto-translation-enabled': true,
      'x-airbnb-device-id': '50b542e16275c2ff8599a08b7e57fcf4c17c266d',
      // cookie: bev=1663359282_YjYyMjUzMjFmYmVm
      // cookie: cdn_exp_0a29550f59cc0a868=control
      // cookie: cdn_exp_29e65ed560e5fd9f1=control
      // cookie: cdn_exp_664025b35de9ca5f8=treatment
      // cookie: cdn_exp_7b27e8582f6ea5b25=control
      // cookie: cdn_exp_7d88e310aadc73d9b=treatment
      // cookie: cdn_exp_b910f64ca3b409af4=treatment
      // cookie: cdn_exp_d92fdc77c0b0762c0=control
      // cookie: cdn_exp_edca6a5ab9666c814=control
      // cookie: cdn_exp_fea7ec9bd22598e31=control
      // cookie: country=NG
      // cookie: jitney_client_session_created_at=1663359280
      // cookie: jitney_client_session_id=3ede1ba1-fd9c-49ac-b375-2ef96eda45d2
      // cookie: jitney_client_session_updated_at=1663359280
      'x-airbnb-screensize': 'w=414.00;h=896.00',
      'content-length': 123,
      'x-airbnb-client-action-id': '8912B46D-57EA-4D12-B71E-6D40DD8DEE2A',
      'x-airbnb-supports-airlock-v2': true,
      'x-airbnb-everest-device-id': '1663325764.fY_AaDeVXaMHePz-VZiT.GdzfLafNIfGf4n58_8ekBhOCDRz-Oul82T29YJaqSvQ',
      'accept': 'application/json',
      // 'x-airbnb-timezone': 'Africa/Lagos',
      'x-csrf-token': 'V4$.airbnb.com$PjKi219fUl0$3vkgLmRwcKj0wOYW7jYU0532uL1aMP3OEh4oSS4c61U='
    } as unknown) as HeadersDefaults;

    if (proxy) {
      this._session.defaults.proxy = proxy;
    }

    if (accessToken) {
      this._accessToken = accessToken;

      if (sessionCookie && includes(sessionCookie, '_airbed_session_id=')) {
        this._session.defaults.headers = {
          ...this._session.defaults.headers,
          Cookie: sessionCookie
        } as HeadersDefaults;
      }

        this._session.defaults.headers = {
          ...this._session.defaults.headers,
          'x-airbnb-oauth-token': this._accessToken
        } as HeadersDefaults;

    } else if (email && password) {
      this._loginPayload = {
        email,
        password,
        type: 'email'
      };

      return this;
    }
  }

  async initialize() {
      return this._session
        .post('/authentications', this._loginPayload)
        .then((response: AxiosResponse) => {
          console.log(response, '<<<<<<<<<<<<<<<<response>>>>>>>>>>>>>>>>');

          if (response.status == 420) {
            throw new VerificationError();
          } else if (response.status == 403) {
            throw new AuthError();
          }
          this._accessToken = response.data['login']['id'];
          this._session.defaults.headers = {
            ...this._session.defaults.headers,
            'x-airbnb-oauth-token': this._accessToken
          } as HeadersDefaults;

          return response.data;
        })
        .catch(error => {
          console.log(error, '<<<<<<<<<<<<<<<<<<<<<<<<<<');
          throw error;
        });


  }

  public randomize() {
    return this._randomize;
  }

  public accessToken() {
    return this._accessToken;
  }

  public setUserAgent(userAgent: string) {
    this.userAgent = userAgent;

        this._session.defaults.headers = {
          ...this._session.defaults.headers,
          'user-agent': userAgent
        } as HeadersDefaults;
  }

  public setUDID(udid: string) {
    this.udid = udid;

        this._session.defaults.headers = {
          ...this._session.defaults.headers,
          'airbnb-device-id': udid
        } as HeadersDefaults;

  }

  public setUUID(uuid: string) {
    this.uuid = uuid;
        this._session.defaults.headers = {
          ...this._session.defaults.headers,
          'x-airbnb-advertising-id': uuid
        } as HeadersDefaults;
  }

  public randomizeHeaders() {
    this.setUserAgent(RandomRequest.getRandomUserAgent());
    this.setUDID(RandomRequest.getRandomUDID());
    this.setUUID(RandomRequest.getRandomUUID());
  }

  /**
   * Get my own profile
   */
  @require_auth
  public async getProfile() {
    return this._session
      .get('/logins/me')
      .then(response => response.data)
      .catch(error => {
        throw error;
      });
  }

  /*
   * Get availability calendar for a given listing
   */
  @randomizable
  public async getCalendar(
    listing_id: string,
    starting_month: string = (date.getMonth() + 1).toString(),
    starting_year: string = (date.getFullYear() + 1).toString(),
    calendar_months: number = 12
  ) {
    const params = {
      year: starting_year,
      listing_id: listing_id,
      _format: 'with_conditions',
      count: calendar_months,
      month: starting_month
    };

    return this._session
      .get('/calendar_months', { params })
      .then(response => response.data)
      .catch(error => {
        throw error;
      });
  }

  /*
   * Get reviews for a given listing
   */
  @randomizable
  public async getReviews(
    listing_id: string,
    offset: number = 0,
    limit: number = 20
  ) {
    const params = {
      _order: 'language_country',
      listing_id: listing_id.toString(),
      _offset: offset.toString(),
      role: 'all',
      _limit: limit.toString(),
      _format: 'for_mobile_client'
    };

    return this._session
      .get(API_URL + '/reviews', { params })
      .then(response => response.data)
      .catch(error => {
        throw error;
      });
  }

  /*
   * Get host availability calendar for a given listing
   */
  @require_auth
  public async getListingCalendar(
    listing_id: string,
    starting_date: string = date.toDateString(),
    calendar_months: number = 6
  ) {
    const params = {
      _format: 'host_calendar_detailed',
      calendar_months
    };
    const _date: Date = new Date(starting_date);
    // "%Y-%m-%d"
    const starting_date_str: string = await _date.toISOString().split('T')[0];

    const ending_date: Date = new Date(_date.setMonth(_date.getMonth() + 1));
    const ending_date_str: string = ending_date.toISOString().split('T')[0];

    return this._session
      .get(`/calendars/${listing_id}/${starting_date_str}/${ending_date_str}`, {
        params
      })
      .then(response => response.data)
      .catch(error => {
        throw error;
      });
  }

  /*
   * User past trips and stats
   */
  @require_auth
  public async getTripSchedules() {
    const params = {
      _format: 'for_unbundled_itinerary',
      _limit: '10',
      _offset: '0',
      client_version: '3',
      exclude_free_time: 'false'
    };

    return this._session
      .get('/trip_schedules', { params })
      .then(response => response.data)
      .catch(error => {
        throw error;
      });
  }

  /*
   * User travelling plan
   */
  @require_auth
  public async getTravelPlans(
    upcoming_scheduled_plans_limit: number = 20,
    past_scheduled_plans_limit: number = 8
  ) {
    const now: string = new Date().toISOString();
    const strftime_date = now.split('.')[0];

    const params = {
      now: strftime_date,
      upcoming_scheduled_plans_limit: upcoming_scheduled_plans_limit,
      past_scheduled_plans_limit: past_scheduled_plans_limit
    };

    return this._session
      .get('/plans', { params })
      .then(response => response.data['plans'][0])
      .catch(error => {
        throw error;
      });
  }

  /*
   * User scheduled plan
   */
  @require_auth
  public async getScheduledPlan(identifier: string | number) {
    await assert(this._accessToken, new MissingAccessTokenError());

    const params = {
      _format: 'for_trip_day_view'
    };

    return this._session
      .get(`/scheduled_plans/${identifier}`, { params })
      .then(response => response.data['scheduled_plan'])
      .catch(error => {
        throw error;
      });
  }

  /*
   * get reservation
   */
  @require_auth
  public async getReservation(reservation_id: string | number) {
    await assert(this._accessToken, new MissingAccessTokenError());

    const params = {
      _format: 'for_trip_planner'
    };

    return this._session
      .get(`/reservations/${reservation_id}`, { params })
      .then(response => response.data['reservation'])
      .catch(error => {
        throw error;
      });
  }

  /*
   * get all past reservation
   */
  @require_auth
  public async getAllPastReservations() {
    const travelPlans = await this.getTravelPlans();
    const pastScheduledPlansIds =
      travelPlans['past_scheduled_plans']['metadata']['cache']['identifiers'];
    const pastReservations: Array<any> = [];

    for (const planId in pastScheduledPlansIds) {
      if (pastScheduledPlansIds.hasOwnProperty(planId)) {
        const scheduledPlan = await this.getScheduledPlan(planId);
        const reservationId =
          scheduledPlan['events'][0]['destination']['reservation_key'];
        pastReservations.push(this.getReservation(reservationId));
      }
    }

    return pastReservations;
  }

  /*
   * Listing search
   * Search listings with
   * Query (e.g. query="Lisbon, Portugal") or
   * Location (e.g. gps_lat=55.6123352&gps_lng=37.7117917)
   * Check in/check out filters (e.g. checkin=2019-05-15&checkout=2019-05-20)
   */
  @randomizable
  public async getHomes(
    query: string | null = null,
    gps_lat: string | null = null,
    gps_lng: string | null = null,
    checkin: string | null = null,
    checkout: string | null = null,
    offset: number = 0,
    items_per_grid: number = 8
  ) {
    const params: any = {
      toddlers: '0',
      adults: '0',
      infants: '0',
      is_guided_search: 'true',
      version: '1.4.8',
      section_offset: '0',
      items_offset: offset,
      screen_size: 'small',
      source: 'explore_tabs',
      items_per_grid: items_per_grid,
      _format: 'for_explore_search_native',
      metadata_only: 'false',
      'refinement_paths[]': '/homes',
      timezone: 'Europe/Lisbon',
      satori_version: '1.1.0'
    };

    if (!query && !(gps_lat && gps_lng)) {
      throw new MissingParameterError('Missing query or gps coordinates');
    }
    if (query) {
      params['query'] = query;
    }
    if (gps_lat && gps_lng) {
      params['lat'] = gps_lat;
      params['lng'] = gps_lng;
    }
    if (checkin && checkout) {
      params['checkin'] = checkin;
      params['checkout'] = checkout;
    }
    return this._session
      .get('/explore_tabs', { params })
      .then(response => response.data)
      .catch(error => {
        throw error;
      });
  }

  @randomizable
  public async getListingDetails(listing_id: string | number) {
    const params = {
      adults: '0',
      _format: 'for_native',
      infants: '0',
      children: '0'
    };

    return this._session
      .get(`/pdp_listing_details/${listing_id}`, { params })
      .then(response => response.data)
      .catch(error => {
        throw error;
      });
  }
}

export default Airbnb;
