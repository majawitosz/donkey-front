/** @format */

import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import openapiTS, { astToString } from 'openapi-typescript';

const baseUrl = process.env.NEXT_PUBLIC_API_URL;

if (!baseUrl) {
	console.error('Environment variable NEXT_PUBLIC_API_URL must be defined.');
	process.exit(1);
}

const schemaPath = '/schema/combined/?format=json';
const outputPath = 'lib/types/openapi.d.ts';

const httpHeaders = {
	accept: 'application/json',
};

const authToken = process.env.OPENAPI_TOKEN;
if (authToken) {
	httpHeaders.Authorization = `Bearer ${authToken}`;
} else {
	try {
		const tokenResponse = await fetch(
			'http://localhost:3000/api/get-token',
		);
		if (tokenResponse.ok) {
			const { token } = await tokenResponse.json();
			httpHeaders.Authorization = `Bearer ${token}`;
			console.log('Using token from active session');
		} else {
			console.warn(
				'No OPENAPI_TOKEN in .env and could not fetch from session. Schema might require auth.',
			);
		}
	} catch (error) {
		console.warn(
			'Could not fetch token from session. Make sure dev server is running or set OPENAPI_TOKEN in .env',
		);
	}
}

try {
	const response = await fetch(baseUrl + schemaPath, {
		headers: httpHeaders,
	});
	if (!response.ok) {
		console.error(
			`Failed to fetch schema: ${response.status} ${response.statusText}`,
		);
		const body = await response.text();
		console.error(body);
		process.exit(1);
	}
	const schemaJson = await response.json();
	const ast = await openapiTS(schemaJson);
	const output = astToString(ast);
	const resolvedOutputPath = resolve(outputPath);
	await mkdir(dirname(resolvedOutputPath), { recursive: true });
	await writeFile(resolvedOutputPath, output, 'utf8');
	console.log(`Types written to ${resolvedOutputPath}`);
} catch (error) {
	console.error('Failed to generate OpenAPI types');
	if (error instanceof Error) {
		console.error(error.message);
	} else {
		console.error(error);
	}
	process.exit(1);
}
