/** @format */

export async function POST(request: Request) {
	const formData = await request.formData();
	const data = Object.fromEntries(formData.entries());
	console.log('hello form api', data);
	return Response.json({ message: 'Hello World' });
}
