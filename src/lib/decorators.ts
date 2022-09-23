import { MissingAccessTokenError } from "./exceptions";

export function require_auth(target: any, _propertyKey: string, _descriptor: PropertyDescriptor) {
        if (!target.accessToken) {
                throw new MissingAccessTokenError();
        }
}


export function randomizable(target: any, _propertyKey: string, _descriptor: PropertyDescriptor) {
        if(target.randomize()) {
                target.randomizeHeaders();
        }
}
