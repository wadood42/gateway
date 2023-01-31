import jwt from "jsonwebtoken";

export function verifyToken(token: string) {
	let privateKey = process.env.SECRET_KEY;

	if (privateKey) {
		console.log("private key", privateKey);
		const decoded: any = jwt.verify(token, privateKey);

		return decoded.data;
	}
}
