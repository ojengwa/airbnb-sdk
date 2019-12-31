import { MissingAccessTokenError } from "./exceptions";

export function require_auth(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        if (!target.accessToken) {
                throw new MissingAccessTokenError();
        }
        console.log(`require_auth(): ${target}, ${propertyKey}, ${descriptor}`);
}


export function randomizable(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        if(target.randomize()) {
                target.randomizeHeaders();
        }
        console.log(`require_auth(): ${target}, ${propertyKey}, ${descriptor}`);
}
