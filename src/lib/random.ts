import uuidv4 from 'uuid';
import airbnb_versions from '../files/airbnb_versions';
import ios_versions from '../files/supported_ios_versions';


const random = (array: Array<any> | String) => {
    array =  array instanceof Array ? array : array.split('');
    return array[Math.floor((Math.random()*array.length))];
}


class RandomRequest {
    
    /**
     * get_random_userAgent
     */
    static getRandomUserAgent() {
        return `Airbnb/${random(airbnb_versions)} iPhone/${random(ios_versions)} Type/Phone`;
    }

    /**
     * getRandomUDID
     */
    static getRandomUDID() {
        const hex_digits = "0123456789abcdef";
        var randomString = '';
        for (var i = 0; i < 40; i++) {
            let randomPoz = Math.floor(Math.random() * hex_digits.length);
            randomString += hex_digits.substring(randomPoz,randomPoz+1);
        }
        return randomString;
    }
    /**
     * getRandomUUID
     */
    static getRandomUUID() {
        return uuidv4().toString().toUpperCase();
    }
}



export {
    RandomRequest
}