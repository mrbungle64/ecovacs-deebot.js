/**
 * Authentication error types raised by the Ecovacs auth flow.
 *
 * These are exported so callers can react to specific failure states with
 * `instanceof` checks (e.g. prompt the user for a device-verification code when
 * a {@link DeviceVerificationRequired} is thrown) instead of matching on
 * error-message strings.
 */
/**
 * Base class for authentication failures that carry the API response code.
 */
export class AuthError extends Error {
    /**
     * @param {string} message - a human-readable description
     * @param {string} [code] - the Ecovacs API response code (e.g. '1013')
     */
    constructor(message: string, code?: string);
    code: string | undefined;
}
/**
 * Thrown when the Ecovacs login endpoint reports response code `1013`, meaning
 * the client device ID must be verified (via an e-mailed code) before login can
 * proceed. Recover by calling `requestDeviceVerificationCode()` followed by
 * `verifyDevice(code)`.
 */
export class DeviceVerificationRequired extends AuthError {
    /**
     * @param {string} [message] - a human-readable description
     * @param {string} [code='1013'] - the Ecovacs API response code
     */
    constructor(message?: string, code?: string);
}
/**
 * Thrown when the device-verification endpoint reports response code `1012`,
 * meaning the supplied verification code is invalid or expired.
 */
export class InvalidVerificationCode extends AuthError {
    /**
     * @param {string} [message] - a human-readable description
     * @param {string} [code='1012'] - the Ecovacs API response code
     */
    constructor(message?: string, code?: string);
}
/**
 * Thrown when a stored account session cannot be used (any more): the cloud
 * rejected its access token, or the session belongs to a different client
 * device id / region. Recover with a password login (`connect()`), which may in
 * turn require device verification.
 */
export class AccountSessionRejected extends AuthError {
    /**
     * @param {string} [message] - a human-readable description
     * @param {string} [code] - the Ecovacs API response code, if the cloud rejected the session
     * @param {{cause?: unknown}} [options] - the underlying error
     */
    constructor(message?: string, code?: string, options?: {
        cause?: unknown;
    });
    cause: unknown;
}
//# sourceMappingURL=errors.d.ts.map