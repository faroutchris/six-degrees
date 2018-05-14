import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { Query, ApolloProvider } from "react-apollo";
import vis from 'vis';
import { client } from './../api/client';
import { DEPTH_1, DEPTH_2, DEPTH_3 } from './../api/query';
import './App.css';

/**
 * getFollowers
 * Returns followers recursively from githubs User data structure.
 * @param {*} data User data structure
 * @param {*} predecessor predecessing user of current level of users
 * @returns {Array<>} Flattened array of followers/users
 */
const getFollowers = (data, predecessor = null) => {
  let nodes = [
    { // root user node
      label: data.login,
      id: data.login,
      image: data.avatarUrl,
      predecessor: predecessor,
      color: predecessor ?
        'rgba(65, 160, 211, 0.6)' : 'rgba(221, 106, 128, 0.6)'
    }
  ];

  if (data.followers) {
    const followers = data.followers.nodes
      .map((follower) => getFollowers(follower, data.login))
      .reduce((acc, curr) => { return acc.concat(curr) }, [])

    return nodes.concat(followers)
  }
  return nodes;
}

/**
 * createData
 * Generates nodes and edges necessary for the Vis network graph
 * @param {*} data User data structure
 * @returns {Object} Nodes and edges
 */
const createData = data => {
  const followers = getFollowers(data)

  const uniqueNodes = followers.reduce((acc, curr) => {
    let dup = acc.filter(n => n.id === curr.id);
    if (dup.length === 0) {
      acc.push(curr);
    }
    return acc;
  }, [])

  const allEdges = followers.filter(u => u.predecessor)
    .map(u => ({to: u.id, from: u.predecessor}))
    .reduce((acc, curr, edges) => {
      let dup = acc.filter(edge => edge.to === curr.to && edge.from === curr.from);
      if (dup.length === 0) {
        acc.push(curr);
      }
      return acc;
    }, [])

  return {
    nodes: uniqueNodes,
    edges: allEdges
  }
};

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      username: 'faroutchris',
      depth: 2,
      loading: true,
      progress: 0
    }
  }

  handleUserChange(username) {
    this.setState({
      username: username ? username : this.state.username
    });
  }

  handleDepthChange(depth) {
    this.setState({
      depth: Number(depth)
    });
  }


  handleProgress(progress) {
    this.setState({
      progress: Math.round(Math.max(progress)), // bug on Math.max(55.000001)..?
      loading: progress === 100 ? false : true
    });
  }

  render() {
    const GQL_QUERY = [DEPTH_1, DEPTH_2, DEPTH_3]

    return (
      <div className="App">
        {!! this.state.username.trim() ?
          <Query
            query={GQL_QUERY[this.state.depth - 1]}
            variables={{
              username: this.state.username,
            }}
            errorPolicy={"all"}
          >
            {({ loading, error, data }) => {
              if(loading) {
                return <Loader progress={null} />;
              }
              if(error) {
                return <Message message={error.message}/>;
              };

              const networkData = createData(data.user);

              return <RelationGraph data={networkData}
                callbacks={{
                  handleProgress: (val) => this.handleProgress(val),
                  handleUserChange: (val) => this.handleUserChange(val),
                }} />
              }}
          </Query> :
          null
        }
        <Toolbar callbacks={{
          handleFormSubmit: (e) => {
            e.preventDefault();
            this.handleUserChange(e.target.username.value);
          },
          handleDepthChange: (e) => this.handleDepthChange(e.target.value)
        }} data={this.state}/>
        {
          this.state.loading ?
            <Loader progress={this.state.progress} /> :
            null
        }
      </div>
    );
  }
}

const Loader = (props) => (
  <div className="Loader">
    <div className="Loader-spinner"></div>
    <div className="Loader-value">{props.progress}</div>
  </div>
);

const Message = (props) => (
  <div className="Message">
    {props.message}
  </div>
)

class Toolbar extends Component {
  render() {
    return <div className="Toolbar">
      <h1 className="Toolbar-title">Six degrees of devs</h1>

      <form onSubmit={ this.props.callbacks.handleFormSubmit }
        className="Toolbar-search">
        <label htmlFor="username">Username: </label>
        <input type="text" id="username" />
        <input type="submit" value="GO" />
      </form>

      <div className="Toolbar-depth">
        <label htmlFor="depth">Depth: </label>
        <select id="depth" defaultValue="2" onChange={ this.props.callbacks.handleDepthChange }>
          <option value="1">1</option>
          <option value="2">2</option>
          <option value="3">3 (Warning!)</option>
        </select>
      </div>
    </div>
  }
}


class RelationGraph extends Component {
  constructor(props) {
    super(props);
    this.nodes = new vis.DataSet();
    this.edges = new vis.DataSet();
    this.network = null;
    this.localCopyOfNodeArray = null;
  }

  componentDidMount() {
    this.nodes.add(this.props.data.nodes);
    this.edges.add(this.props.data.edges);
    this.create(this.refs.el);
  }

  componentWillReceiveProps(props) {
    /**
    * Only rerender graph when props and local vars diff
    */
    if(JSON.stringify(this.localCopyOfNodeArray) !== JSON.stringify(props.data.nodes)) {
      this.nodes = new vis.DataSet();
      this.edges = new vis.DataSet();
      this.nodes.add(this.props.data.nodes);
      this.edges.add(this.props.data.edges);
      this.localCopyOfNodeArray = props.data.nodes;
    }
  }

  componentWillUnmount() {
    this.network.off('stabilizationProgress'); // is .off needed?
    this.network.off('doubleClick');
    this.network = null;
  }

  create(el) {
    const options = {
      nodes: {
        borderWidth:4,
        size: 16,
	      color: {
          border: '#406897',
          background: '#6AAFFF'
        },
        shape: 'circularImage',
        font:{ color:'rgb(247, 248, 251, 0.5)', face: 'Karla' }
      },
      edges: {},
    }
    this.network = new vis.Network(el, {
      nodes: this.nodes,
      edges: this.edges
    }, options);

    this.props.callbacks.handleProgress(0);

    this.network.on("stabilizationProgress", (params) => {
      this.props.callbacks.handleProgress((params.iterations / params.total) * 100);
    });

    this.network.once("stabilizationIterationsDone", (params) => {
      this.props.callbacks.handleProgress(100);
    });

    this.network.on("doubleClick", (params) => {
      if (params.nodes.length > 0) {
        this.props.callbacks.handleUserChange(params.nodes[0])
      }
    });
  }

  render() {
    return <div className="RelationGraph" ref="el"></div>
  }
}

export default ReactDOM.render(
  <ApolloProvider client={client}>
      <App />
  </ApolloProvider>,
  document.getElementById('root')
);
