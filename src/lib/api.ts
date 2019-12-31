import assert from 'assert';
import axios, { AxiosInstance, AxiosProxyConfig,  AxiosResponse } from "axios";
import { includes } from 'lodash';
import { RandomRequest } from './random';
import { AuthError, VerificationError, MissingAccessTokenError, MissingParameterError } from './exceptions';
import { require_auth, randomizable } from './decorators';

const API_URL:string = "https://api.airbnb.com/v2"
const API_KEY:string = "915pw2pnf4h1aiguhph5gc5b2"
const date:Date = new Date();

class Airbnb {
    /* 
        Base API class
        ----------------
        api = new Api(accessToken=os.environ.get("AIRBNB_accessToken"))
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
    private _accessToken: String | null;
    private _session: AxiosInstance;
    private userAgent: String;
    private uuid: String;
    private udid: String;
    private _randomize: Boolean

    constructor(
        username:String | null =null, 
        password:String | null =null, 
        accessToken:String | null =null, 
        api_key: String =API_KEY, 
        session_cookie:String | null=null, 
        randomize:Boolean = false,
        proxy: AxiosProxyConfig | false | undefined) {

        this._session = axios.create({
            baseURL: API_URL
        });

        this._accessToken = null
        this.userAgent = "Airbnb/19.18 AppVersion/19.18 iPhone/12.2 Type/Phone"
        this.udid = "9120210f8fb1ae837affff54a0a2f64da821d227"
        this.uuid = "C326397B-3A38-474B-973B-F022E6E4E6CC"
        this._randomize = randomize

        this._session.defaults.headers = {
            "accept": "application/json",
            "accept-encoding": "br, gzip, deflate",
            "content-type": "application/json",
            "x-airbnb-api-key": api_key,
            "user-agent": this.userAgent,
            "x-airbnb-screensize": "w=375.00;h=812.00",
            "x-airbnb-carrier-name": "T-Mobile",
            "x-airbnb-network-type": "wifi",
            "x-airbnb-currency": "USD",
            "x-airbnb-locale": "en",
            "x-airbnb-carrier-country": "us",
            "accept-language": "en-us",
            "airbnb-device-id": this.udid,
            "x-airbnb-advertising-id": this.uuid
        }

        if (proxy) {
            this._session.defaults.proxy = proxy
        }

        if (accessToken) {
            this._accessToken = accessToken

            if (session_cookie && includes(session_cookie, '_airbed_session_id=')) {

                this._session.defaults.headers['Cookie'] = session_cookie;

            }
            this._session.defaults.headers["x-airbnb-oauth-token"] = this._accessToken;

        }
        else if ( username && password) {

            let login_payload = {
                email: username,
                password: password,
                type: 'email'
            }

            this._session.post('/logins', login_payload)
                .then((response: AxiosResponse) => {
                    if (response.status == 420) {
                        throw new VerificationError;
                        
                    } else if (response.status == 403) {
                        throw new AuthError;
                    } 
                    this._accessToken = response.data["login"]["id"];
                })
                .catch(error => {
                    throw error;
                })

            this._session.defaults.headers[ "x-airbnb-oauth-token"] =  this._accessToken;
        }
    }

    public randomize() {
        return this._randomize;
    }

    public accessToken(){
        return this._accessToken;
    }

    public setUserAgent(userAgent: String) {
        this.userAgent = userAgent;
        this._session.defaults.headers['user-agent'] = userAgent;
    }

    public setUDID(udid: String) {
        this.udid = udid;
        this._session.defaults.headers['airbnb-device-id'] = udid;
    }

    public setUUID(uuid: String){
        this.uuid = uuid;
        this._session.defaults.headers['x-airbnb-advertising-id'] = uuid;
    }

    public randomizeHeaders() {
        this.setUserAgent(RandomRequest.getRandomUserAgent())
        this.setUDID(RandomRequest.getRandomUDID())
        this.setUUID(RandomRequest.getRandomUUID())
    }

    /** 
    * Get my own profile
    */
    @require_auth
    public async getProfile() {
        return this._session.get('/logins/me')
            .then(response => response.data)
            .catch(error => {
                throw error
            });
    }

    /*
    * Get availability calendar for a given listing 
    */
    @randomizable
    public async getCalendar(
        listing_id:String, 
        starting_month:String=(date.getMonth() + 1).toString(),
        starting_year:String=(date.getFullYear() + 1).toString(), 
        calendar_months:Number = 12
    ) {
      
        const params = {
            'year': starting_year,
            'listing_id': listing_id,
            '_format': 'with_conditions',
            'count': calendar_months,
            'month': starting_month
        }

        return this._session.get('/calendar_months', {params})
            .then(response => response.data)
            .catch(error => {
                throw error
            });
    }

    /* 
    * Get reviews for a given listing
    */
    @randomizable
    public async getReviews(
        listing_id:String, 
        offset:Number=0, 
        limit:Number=20) {

        const params = {
            '_order': 'language_country',
            'listing_id': listing_id.toString(),
            '_offset': offset.toString(),
            'role': 'all',
            '_limit': limit.toString(),
            '_format': 'for_mobile_client',
        }

        return this._session.get(API_URL + "/reviews", {params})
            .then(response => response.data)
            .catch(error => {
                throw error
            });
    }

    /* 
    * Get host availability calendar for a given listing
    */
    @require_auth
    public async getListingCalendar(
        listing_id:String, 
        starting_date:string=date.toDateString(), 
        calendar_months:Number=6) {

        const params = {
            _format: 'host_calendar_detailed',
            calendar_months
        }
        const _date:Date = (new Date(starting_date));
        // "%Y-%m-%d"
        const starting_date_str:String = await _date.toISOString().split('T')[0];

        const ending_date:Date = new Date(_date.setMonth(_date.getMonth() + 1));
        const ending_date_str:String = ending_date.toISOString().split('T')[0];

        return this._session.get(`/calendars/${listing_id}/${starting_date_str}/${ending_date_str}`, {params})
            .then(response => response.data)
            .catch(error => {
                throw error
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
        }
        
        return this._session.get('/trip_schedules', {params})
            .then(response => response.data)
            .catch(error => {
                throw error
            });
    }


    /* 
    * User travelling plan
    */
    @require_auth
    public async getTravelPlans(
        upcoming_scheduled_plans_limit:Number=20, 
        past_scheduled_plans_limit:Number=8
    ) {

        const now:String = (new Date()).toISOString();
        const strftime_date = now.split('.')[0]

        const params =  {
            'now': strftime_date,
            'upcoming_scheduled_plans_limit': upcoming_scheduled_plans_limit,
            'past_scheduled_plans_limit': past_scheduled_plans_limit
        }

        return this._session.get('/plans', {params})
            .then(response => response.data['plans'][0])
            .catch(error => {
                throw error
            });
    }



    /* 
    * User scheduled plan
    */
    @require_auth
    public async getScheduledPlan(
        identifier:String | Number
    ) {

        await assert(this._accessToken, new MissingAccessTokenError());

        const params =  {
            _format: 'for_trip_day_view'
        }

        return this._session.get(`/scheduled_plans/${identifier}`, {params})
            .then(response => response.data['scheduled_plan'])
            .catch(error => {
                throw error
            });
    }


    /* 
    * get reservation
    */
    @require_auth
    public async getReservation(
        reservation_id:String | Number
    ) {

        await assert(this._accessToken, new MissingAccessTokenError());

        const params =  {
            _format: 'for_trip_planner'
        }

        return this._session.get(`/reservations/${reservation_id}`, {params})
            .then(response => response.data['reservation'])
            .catch(error => {
                throw error
            });
    }

    /* 
    * get all past reservation
    */
    @require_auth
    public async getAllPastReservations() {

        const travelPlans = await this.getTravelPlans();
        const pastScheduledPlansIds = travelPlans['past_scheduled_plans']['metadata']['cache']['identifiers']
        const pastReservations:Array<any> = []
        
        for (const planId in pastScheduledPlansIds) {
            if (pastScheduledPlansIds.hasOwnProperty(planId)) {
                
                const scheduledPlan = await this.getScheduledPlan(planId);
                const reservationId = scheduledPlan['events'][0]['destination']['reservation_key'];
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
        query:String|null=null, 
        gps_lat:String | null=null, 
        gps_lng:String | null=null, 
        checkin:String|null=null, 
        checkout:String|null=null, 
        offset:Number=0, 
        items_per_grid:Number=8) {
            
        const params: any = {
            'toddlers': '0',
            'adults': '0',
            'infants': '0',
            'is_guided_search': 'true',
            'version': '1.4.8',
            'section_offset': '0',
            'items_offset': offset,
            'screen_size': 'small',
            'source': 'explore_tabs',
            'items_per_grid': items_per_grid,
            '_format': 'for_explore_search_native',
            'metadata_only': 'false',
            'refinement_paths[]': '/homes',
            'timezone': 'Europe/Lisbon',
            'satori_version': '1.1.0'
        }

        if ( !query && !(gps_lat && gps_lng)) {
            throw new MissingParameterError("Missing query or gps coordinates")
        }
        if (query) {
            params['query'] = query
        }
        if (gps_lat && gps_lng) {
            params['lat'] = gps_lat
            params['lng'] = gps_lng
        }
        if (checkin && checkout) {
            params['checkin'] = checkin
            params['checkout'] = checkout
        }
        return this._session.get('/explore_tabs', {params})
            .then(response => response.data)
            .catch(error => {
                throw error
            });

    }

    @randomizable
    public async getListingDetails(
        listing_id:String|Number) {
        const params = {
            'adults': '0',
            '_format': 'for_native',
            'infants': '0',
            'children': '0'
        }

        return this._session.get(`/pdp_listing_details/${listing_id}`, {params})
            .then(response => response.data)
            .catch(error => {
                throw error
            });
    }
}


export default Airbnb