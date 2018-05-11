import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import registerServiceWorker from './../registerServiceWorker';
import { client } from './../client';
import { ApolloProvider } from "react-apollo";
import App from './App';


ReactDOM.render(
    <ApolloProvider client={client}>
        <App />
    </ApolloProvider>,
    document.getElementById('root'));
registerServiceWorker();
