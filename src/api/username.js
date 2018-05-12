import gql from "graphql-tag";

export const DEPTH_1 = gql`
    query getFollowers($username: String!) {
        user(login: $username) {
            avatarUrl
            login
            followers(first: 20) {
                totalCount
                nodes {
                    avatarUrl
                    login
                }
            }
        }
    }
`;

export const DEPTH_2 = gql`
    query getFollowers($username: String!) {
        user(login: $username) {
            avatarUrl
            login
            followers(first: 20) {
                totalCount
                nodes {
                    avatarUrl
                    login
                    followers(first: 20) {
                        totalCount
                        nodes {
                            avatarUrl
                            login
                        }
                    }
                }
            }
        }
    }
`;

export const DEPTH_3 = gql`
    query getFollowers($username: String!) {
        user(login: $username) {
            avatarUrl
            login
            followers(first: 20) {
                totalCount
                nodes {
                    avatarUrl
                    login
                    followers(first: 20) {
                        totalCount
                        nodes {
                            avatarUrl
                            login
                            followers(first: 20) {
                                totalCount
                                nodes {
                                    login
                                    avatarUrl
                                }
                            }
                        }
                    }
                }
            }
        }
    }
`;