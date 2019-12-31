

export class AuthError extends Error {

// Authentication error

}

export class VerificationError extends AuthError {

// VerificationError error

}

export class MissingParameterError extends Error {

// MissingParameterError error

}

export class MissingAccessTokenError extends MissingParameterError {

// MissingAccessTokenError error

}