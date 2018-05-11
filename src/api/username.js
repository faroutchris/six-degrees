import gql from "graphql-tag";

export const USERNAME = gql`
    query getFollowers {
        user(login:"faroutchris") {
            avatarUrl
            login
            followers(first: 30) {
                totalCount
                nodes {
                    avatarUrl
                    login
                    followers(first: 30) {
                        totalCount
                        nodes {
                            avatarUrl
                            login
                            # followers(first: 10) {
                            #     totalCount
                            #     nodes {
                            #         login
                            #         avatarUrl
                            #     }
                            # }
                        }
                    }
                }
            }
        }
    }
`;