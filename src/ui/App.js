import React, { Component } from 'react';
import { DEPTH_1, DEPTH_2, DEPTH_3 } from './../api/username';
import { Query } from "react-apollo";
import vis from 'vis';
import './App.css';

const getFollowers = (data, user = null) => {
  let nodes = [
    { // root user node
      label: data.login,
      id: data.login,
      image: data.avatarUrl,
      predecessor: user,
      color: user ? 'rgba(65, 160, 211, 0.6)' : 'rgba(221, 106, 128, 0.6)'
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
const createData = data => {
  let followers = getFollowers(data)

  let uniqueNodes = followers.reduce((acc, curr) => {
    let n = acc.filter(n => n.id === curr.id);
    if (n.length === 0) {
      acc.push(curr);
    }
    return acc;
  }, [])

  let allEdges = followers
    .filter(u => u.predecessor)
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
      username: username
    });
  }

  handleDepthChange(e) {
    //e.preventDefault();
    this.setState({
      depth: Number(e.target.value)
    });
  }


  handleProgress(progress) {
    if (progress === 100) {
      this.setState({
        progress,
        loading: false
      });
    } else {
      this.setState({
        progress,
        loading: true
      });
    }
  }

  render() {
    let GQL_QUERY;
    switch(this.state.depth) {
      case 1:
        GQL_QUERY = DEPTH_1;
        break;
      case 2:
        GQL_QUERY = DEPTH_2;
        break;
      case 3:
        GQL_QUERY = DEPTH_3;
        break;
      default:
        GQL_QUERY = DEPTH_2;
    }

    return (
        <div>
        <Query
          query={GQL_QUERY}
          variables={{
            username: this.state.username,
          }}
          errorPolicy={"all"}
        >
          {({ loading, error, data }) => {
            if(loading) return <p className="Message">Loading...</p>;
            if(error) return <p className="Message">Error :(</p>;
            const networkData = createData(data.user);

            return <RelationGraph
              width="100%"
              height="100vh"
              callbacks={{
                handleProgress: (val) => this.handleProgress(val),
                handleUserChange: (val) => this.handleUserChange(val),
              }}
              data={networkData} />
            }}
        </Query>
        <Toolbar callbacks={{
          handleUserChange: (e) => {
            e.preventDefault();
            this.handleUserChange(e.target.username.value)
          },
          handleDepthChange: (e) => this.handleDepthChange(e)
        }} data={this.state}/>
        </div>
    );
  }
}

class Toolbar extends Component {
  render() {
    return <div className="Toolbar">
      <h1 className="Toolbar-title">Six degrees of devs</h1>
      <form onSubmit={ this.props.callbacks.handleUserChange }>
        <label htmlFor="username">Username</label><br />
        <input type="text" id="username" />
        <input type="submit" value="GO 🚀" />
      </form>
      <label htmlFor="depth">Depth</label><br />
      <select id="depth" defaultValue="2"
        onChange={ this.props.callbacks.handleDepthChange }>
        <option value="1">1</option>
        <option value="2">2</option>
        <option value="3">3</option>
      </select>
    </div>
  }
}


class RelationGraph extends Component {
  componentDidMount() {
    this.createGraph(this.refs.el);
  }

  createGraph(el) {
    //console.log(this.props.data)
    const options = {
      nodes: {
        borderWidth:4,
        size: 16,
	      color: {
          border: '#406897',
          background: '#6AAFFF'
        },
        shape: 'circularImage',
        font:{color:'rgb(247, 248, 251, 0.5)', face: 'Karla'}
      },
      edges: {},
    }
    const network = new vis.Network(el, this.props.data, options);

    network.on("stabilizationProgress", (params) => {
      this.props.callbacks.handleProgress(
        Math.max(params.iterations/params.total * 100)
      );
    });

    network.once("stabilizationIterationsDone", (params) => {
      this.props.callbacks.handleProgress(100);
    });

    network.on("doubleClick", (params) => {
      if (params.nodes.length > 0) {
        this.props.callbacks.handleUserChange(params.nodes[0])
      }
    });
  }

  render() {
    return <div className="RelationGraph" style={{height: this.props.height}} ref="el"></div>
  }
}

export default App;
