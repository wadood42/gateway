import { ApolloServer } from "apollo-server";
import {
	ApolloGateway,
	GraphQLDataSourceProcessOptions,
	RemoteGraphQLDataSource,
} from "@apollo/gateway";
import { AuthenticationError } from "apollo-server";
import { readFileSync } from "fs";
import path from "path";
import * as dotenv from "dotenv";
dotenv.config();
import { verifyToken } from "./lib/verifyToken";
const superGraphPath = path.join(process.cwd(), "src");

const supergraphSdl = readFileSync(
	superGraphPath + "/supergraph-schema.graphql",
	{ encoding: "utf-8" }
).toString();

class AuthenticatedDataSource extends RemoteGraphQLDataSource {
	willSendRequest(
		options: GraphQLDataSourceProcessOptions<Record<string, any>>
	): void | Promise<void> {
		console.log("request to: ", options.request.http?.url);
		if (options.context.token) {
			let jwt = options.context.token.split(" ")[1];
			let authedAccount: { account_id: string; email: string };
			authedAccount = verifyToken(jwt);

			console.log("authed account", authedAccount);
			options.request.http?.headers.set("account_id", authedAccount.account_id);
		}
	}
}

const gateway = new ApolloGateway({
	supergraphSdl,
	buildService({ name, url }) {
		console.log("build service", name, url);
		return new AuthenticatedDataSource({ url });
	},
});
const apolloServer = new ApolloServer({
	gateway: gateway,
	context: ({ req, res }) => {
		const token = req.headers.authorization || "";
		console.log("gateway request xxx", req.headers);

		// if (!token) {
		// 	throw new AuthenticationError("you need log in first sorry");
		// }

		return { token };
	},
});

apolloServer
	.listen()
	.then(({ url }) => {
		console.log(`🚀 Gateway ready at ${url}`);
	})
	.catch((err) => {
		console.log(err);
	});
