import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

/**
 * Returns a width value proportional to screen width.
 * @param {number} percent - Percentage of screen width (0-100)
 * @returns {number}
 */
export const wp = (percent) => (width * percent) / 100;

/**
 * Returns a height value proportional to screen height.
 * @param {number} percent - Percentage of screen height (0-100)
 * @returns {number}
 */
export const hp = (percent) => (height * percent) / 100;

/**
 * Returns a font size scaled to screen width.
 * Base reference width is 390px (regular Android).
 * @param {number} size - Font size designed for 390px screen
 * @returns {number}
 */
export const fp = (size) => Math.round((width / 390) * size);

export { width as screenWidth, height as screenHeight };
