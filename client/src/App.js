import React, { Component } from "react";
import ItemManagerContract from "./contracts/ItemManager.json";
import ItemContract from "./contracts/Item.json";
import getWeb3 from "./getWeb3";

import "./App.css";

class App extends Component {
  state = {
    loaded: false,
    cost: 0,
    itemName: "Example1",
    itemsList: [],
    count: 0,
    owner: "0x7e5a30f9c1f27c19211928f22523694273d23e7d",
    currentAccount: "",
  };

  componentDidMount = async () => {
    try {
      // Get network provider and web3 instance.
      this.web3 = await getWeb3();

      // Use web3 to get the user's accounts.
      this.accounts = await this.web3.eth.getAccounts();
      this.setState({ currentAccount: this.accounts[0] });
      // Get the contract instance.
      this.networkId = await this.web3.eth.net.getId();
      this.itemManager = new this.web3.eth.Contract(
        ItemManagerContract.abi,
        ItemManagerContract.networks[this.networkId] &&
          ItemManagerContract.networks[this.networkId].address
      );

      this.item = new this.web3.eth.Contract(
        ItemContract.abi,
        ItemContract.networks[this.networkId] &&
          ItemContract.networks[this.networkId].address
      );

      // Set web3, accounts, and contract to the state, and then proceed with an
      // example of interacting with the contract's methods.
      this.setState({ loaded: true }, this.runExample);
      console.log(this.accounts[0]);

      window.ethereum.on("accountsChanged", (accounts) => {
        console.log("Changed");
        this.setState({ currentAccount: accounts[0] });
      });
    } catch (error) {
      // Catch any errors for any of the above operations.
      alert(
        `Failed to load web3, accounts, or contract. Check console for details.`
      );
      console.error(error);
    }
  };

  handleInputChange = (event) => {
    const target = event.target;
    const value = target === "checkbox" ? target.checked : target.value;
    const name = target.name;
    this.setState({ [name]: value });
  };

  handleSubmit = () => {
    console.log("Owner: " + this.state.owner);
    console.log("User: " + this.state.currentAccount);

    if (this.state.owner === this.state.currentAccount.toLowerCase()) {
      const { cost, itemName } = this.state;

      this.itemManager.methods
        .createItem(itemName, cost)
        .send({ from: this.state.currentAccount })
        .then((result) => {
          let itemObject = {
            identifier: itemName,
            cost: cost,
            status: "Created",
            quality: 10,
          };
          this.setState((prevState) => ({
            itemsList: [...prevState.itemsList, itemObject],
          }));
          console.log(result);
        });
      console.log(this.state.itemsList);
    } else {
      alert("Only owner");
    }
  };

  triggerDelivery = (index) => {
    if (this.state.owner === this.state.currentAccount.toLowerCase()) {
      this.itemManager.methods
        .triggerDelivery(index)
        .send({ from: this.state.currentAccount })
        .then((result) => {
          this.state.items[index].status = "In transit";
          console.log(result);
        });
    } else {
      alert("Only owner");
    }
  };

  triggerArrival = (e) => {
    console.log(e);
    // this.itemManager.methods
    //   .triggerArrival(1)
    //   .send({ from: this.accounts[0] });
    // console.log(result);
  };

  render() {
    // if (!this.loaded) {
    //   return <div>Loading Web3, accounts, and contract...</div>;
    // }
    return (
      <div className="App">
        <h1>Supply Chain Example</h1>
        <h2>Items</h2>
        <h2>Add Items</h2>
        Cost in Wei:{" "}
        <input
          type="text"
          name="cost"
          value={this.state.cost}
          onChange={this.handleInputChange}
        ></input>
        Item Identifier:{" "}
        <input
          type="text"
          name="itemName"
          value={this.state.itemName}
          onChange={this.handleInputChange}
        ></input>
        <button type="button" onClick={this.handleSubmit}>
          Create new item
        </button>
        <button type="button" onClick={this.triggerDelivery}>
          Trigger delivery
        </button>
        <button type="button" onClick={this.triggerArrival}>
          Trigger arrival
        </button>
        <div className="m-5">
          <h1>Items</h1>
          <div>
            <table className="table mt-5">
              <thead>
                <tr>
                  <th scope="col">#</th>
                  <th scope="col">Name</th>
                  <th scope="col">Cost</th>
                  <th scope="col">Quality</th>
                  <th scope="col">Status</th>
                  <th scope="col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {this.state.itemsList.map((item, key) => (
                  <tr>
                    <td>{key}</td>
                    <td>{item.identifier}</td>
                    <td>{item.cost}</td>
                    <td>{item.quality}</td>
                    <td>
                      <span className="badge rounded-pill bg-primary">
                        {item.status}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-primary btn-small"
                        onClick={() => this.triggerDelivery(key)}
                      >
                        Trigger Delivery
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }
}

export default App;
