import { keystoneContext } from '../../features/keystone/context'
import { createYoga } from "graphql-yoga";
import processRequest from "graphql-upload/processRequest.js";
import { type NextApiRequest, type NextApiResponse } from 'next'

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const contentType = req.headers["content-type"];
  if (contentType?.startsWith("multipart/form-data")) {
    req.body = await processRequest(req, res);
  }

  return createYoga<{ req: NextApiRequest; res: NextApiResponse }>({
    graphiql: false,
    graphqlEndpoint: "/api/graphql",
    schema: keystoneContext.graphql.schema,
    context: ({ req, res }) => {
      return keystoneContext.withRequest(req, res);
    },
    multipart: false,
  })(req, res);
}