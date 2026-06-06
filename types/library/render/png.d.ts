/**
 * Encodes a FrameBuffer as a PNG and returns the raw bytes as a Buffer.
 */
export function encodePNG(frameBuffer: any): Buffer<ArrayBuffer>;
/**
 * Encodes a FrameBuffer as a `data:image/png;base64,...` URL, matching the
 * existing `getBase64PNG()` / canvas `toDataURL()` output contract.
 */
export function encodePNGDataURL(frameBuffer: any): string;
export function crc32(buf: any): number;
/**
 * Pure-JS PNG encoder for {@link module:render/framebuffer~FrameBuffer}.
 *
 * Emits an 8-bit truecolour-with-alpha (colour type 6) PNG: signature +
 * IHDR + IDAT (zlib `deflate`) + IEND, each chunk carrying its CRC32. This
 * replaces the native `canvas` `toDataURL()` while keeping the same
 * `data:image/png;base64,...` output contract.
 *
 * @see https://www.w3.org/TR/png/
 */
export const PNG_SIGNATURE: Buffer<ArrayBuffer>;
//# sourceMappingURL=png.d.ts.map