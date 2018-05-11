import React, { Component } from 'react';
import { USERNAME } from './../api/username';
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
      shape: 'circularImage',
      color: user ? 'rgba(99, 173, 139, 0.6)' : 'rgba(221, 106, 128, 0.6)'
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
  render() {
    return (
        <div>
        <Query query={USERNAME}>
          {({ loading, error, data }) => {
            if(loading) return <p>Loading...</p>;
            if(error) return <p>Error :(</p>;
              return <RelationGraph width="100%" height="100vh" data={createData(data.user)} />
            }}
        </Query>
        <Toolbar />
        </div>
    );
  }
}
class Toolbar extends Component {
  render() {
    return <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      height: '100vh',
      width: '20rem',
      color: 'white',
      background: 'rgba(0,0,0,0.7)'
    }}>Hello</div>
  }
}


class RelationGraph extends Component {
  componentDidMount() {
    this.createGraph(this.refs.el);
    this.setWidth(this.refs.el);
  }

  componentDidUpdate() {
    this.createGraph(this.refs.el);
    this.setWidth(this.refs.el);
  }

  setWidth(el) {

  }

  createGraph(el) {
    console.log(this.props.data)
    const options = {
      nodes: {
        borderWidth:4,
        size: 16,
	      color: {
          border: '#406897',
          background: '#6AAFFF'
        },
        font:{color:'#eee'}
      },
      edges: {
        color: 'blue',
        // "smooth": {
        //   "type": "discrete",
        //   "forceDirection": "none",
        //   "roundness": 0.5
        // }
      },
      // layout: {
      //   improvedLayout: false
      // },
      // physics: {
      //   enabled: false
      //  }
    }
    new vis.Network(el, this.props.data, options)
  }

  render() {
    return <div className="RelationGraph" style={{height: this.props.height}} ref="el"></div>
  }
}

export default App;
