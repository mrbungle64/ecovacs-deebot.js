'use strict';

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
class AuthError extends Error {
  /**
   * @param {string} message - a human-readable description
   * @param {string} [code] - the Ecovacs API response code (e.g. '1013')
   */
  constructor(message, code) {
    super(message);
    this.name = 'AuthError';
    this.code = code;
  }
}

/**
 * Thrown when the Ecovacs login endpoint reports response code `1013`, meaning
 * the client device ID must be verified (via an e-mailed code) before login can
 * proceed. Recover by calling `requestDeviceVerificationCode()` followed by
 * `verifyDevice(code)`.
 */
class DeviceVerificationRequired extends AuthError {
  /**
   * @param {string} [message] - a human-readable description
   * @param {string} [code='1013'] - the Ecovacs API response code
   */
  constructor(message, code = '1013') {
    super(message || 'Device verification required', code);
    this.name = 'DeviceVerificationRequired';
  }
}

/**
 * Thrown when the device-verification endpoint reports response code `1012`,
 * meaning the supplied verification code is invalid or expired.
 */
class InvalidVerificationCode extends AuthError {
  /**
   * @param {string} [message] - a human-readable description
   * @param {string} [code='1012'] - the Ecovacs API response code
   */
  constructor(message, code = '1012') {
    super(message || 'Invalid or expired verification code', code);
    this.name = 'InvalidVerificationCode';
  }
}

module.exports = {
  AuthError,
  DeviceVerificationRequired,
  InvalidVerificationCode
};
