import ApolloClient from "apollo-boost";

export const client = new ApolloClient({
  uri: "https://api.github.com/graphql",
  request: async(operation) => {
    operation.setContext({
      headers: {
        Authorization: `bearer ${process.env.REACT_APP_API_TOKEN}`
      }
    })
  }
});