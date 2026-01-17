/** @format */

import { getRequestConfig } from 'next-intl/server';

export default getRequestConfig(async ({ requestLocale }) => {
	let locale = await requestLocale;

	if (!locale || !['en', 'pl'].includes(locale)) {
		locale = 'pl';
	}

	return {
		locale,
		messages: (await import(`../messages/${locale}.json`)).default,
	};
});
