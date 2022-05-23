import React, { Component } from "react";
import ItemManagerContract from "./contracts/ItemManager.json";
import ItemContract from "./contracts/Item.json";
import getWeb3 from "./getWeb3";
import update from "react-addons-update"; // ES6

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

      this.listenToPaymentEvent();
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

  listenToPaymentEvent = () => {
    this.itemManager.events
      .SupplyChainSetState()
      .on("data", async function (evt) {
        console.log(evt);
      });
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
        .send({ from: this.state.currentAccount.toLowerCase() })
        .then((result) => {
          console.log(result);

          let itemObject = {
            index: result.events.SupplyChainSetState.returnValues._itemIndex,
            address:
              result.events.SupplyChainSetState.returnValues._itemAddress,
            identifier: itemName,
            cost: cost,
            status: "Created",
            quality: 10,
          };
          this.setState((prevState) => ({
            itemsList: [...prevState.itemsList, itemObject],
          }));
          console.log(
            "Item address:" +
              result.events.SupplyChainSetState.returnValues._itemAddress
          );
        });
      console.log(this.state.itemsList);
    } else {
      alert("Only owner");
    }
  };

  triggerDelivery = (key, index) => {
    console.log(index);
    if (this.state.owner === this.state.currentAccount.toLowerCase()) {
      this.itemManager.methods
        .triggerDelivery(parseInt(index))
        .send({ from: this.state.currentAccount.toLowerCase() })
        .then((result) => {
          let items = [...this.state.itemsList];
          let item = { ...items[key], status: "In transit" };
          items[key] = item;
          this.setState({ itemsList: items });
          console.log(this.state);
        });
    } else {
      alert("Only owner");
    }
  };

  triggerArrival = (key, index) => {
    console.log(index);
    if (this.state.owner !== this.state.currentAccount.toLowerCase()) {
      this.itemManager.methods
        .triggerArrival(parseInt(index))
        .send({ from: this.state.currentAccount.toLowerCase() })
        .then((result) => {
          let items = [...this.state.itemsList];
          let item = { ...items[key], status: "Delivered" };
          items[key] = item;
          this.setState({ itemsList: items });
          console.log(this.state);
        });
    } else {
      alert("Only customer");
    }
  };

  triggerEvaluation = (key, index) => {
    if (this.state.owner !== this.state.currentAccount.toLowerCase()) {
      this.itemManager.methods
        .triggerExamination(parseInt(index), 10)
        .send({ from: this.state.currentAccount.toLowerCase() })
        .then((result) => {
          let items = [...this.state.itemsList];
          let item = { ...items[key], status: "Evaluated" };
          items[key] = item;
          this.setState({ itemsList: items });
          console.log(this.state);
        });
    } else {
      alert("Only customer");
    }
  };

  triggerPayment = (key, index, address, cost) => {
    if (this.state.owner !== this.state.currentAccount.toLowerCase()) {
      this.web3.eth
        .sendTransaction({
          to: address,
          value: cost,
          from: this.state.currentAccount.toLowerCase(),
          gas: 300000,
        })
        .then(() => {
          let items = [...this.state.itemsList];
          let item = { ...items[key], status: "Paid" };
          items[key] = item;
          this.setState({ itemsList: items });
        });

      console.log(this.state);
    } else {
      alert("Only customer");
    }
  };

  render() {
    return (
      <div className="App">
        <nav class="navbar navbar-light bg-light">
          <div>
            <span class="navbar-brand" href="#">
              <img
                src="/process.png"
                width="30"
                height="30"
                class="d-inline-block align-top"
                alt=""
                className="m-2"
              />
            </span>
            <span>Supply Chain Project</span>
          </div>
        </nav>
        <h2>Add Items</h2>
        <div className="row justify-content-md-center mt-4">
          <div className="col-md-4">
            <form>
              <div class="form-group">
                <label>Cost in Wei: </label>
                <input
                  className="form-control"
                  type="text"
                  name="cost"
                  value={this.state.cost}
                  onChange={this.handleInputChange}
                ></input>
              </div>
              <div class="form-group">
                <label>Item Name: </label>
                <input
                  className="form-control"
                  type="text"
                  name="itemName"
                  value={this.state.itemName}
                  onChange={this.handleInputChange}
                ></input>
                <button
                  className="btn btn-primary mt-3"
                  type="button"
                  onClick={this.handleSubmit}
                >
                  Create new item
                </button>
              </div>
            </form>
          </div>
        </div>
        <div className="m-5">
          <h1>Items</h1>
          <div>
            <table className="table table-striped mt-5">
              <thead>
                <tr>
                  <th scope="col">#</th>
                  <th scope="col">Address</th>
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
                    <td>{item.index}</td>
                    <td>{item.address}</td>
                    <td>{item.identifier}</td>
                    <td>{item.cost}</td>
                    <td>{item.quality}</td>
                    <td>
                      {item.status === "Created" && (
                        <span className="badge rounded-pill bg-info">
                          {item.status}
                        </span>
                      )}
                      {item.status === "In transit" && (
                        <span className="badge rounded-pill bg-secondary">
                          {item.status}
                        </span>
                      )}
                      {item.status === "Delivered" && (
                        <span className="badge rounded-pill bg-warning">
                          {item.status}
                        </span>
                      )}
                      {item.status === "Evaluated" && (
                        <span className="badge rounded-pill bg-danger">
                          {item.status}
                        </span>
                      )}
                      {item.status === "Paid" && (
                        <span className="badge rounded-pill bg-success">
                          {item.status}
                        </span>
                      )}
                    </td>
                    <td>
                      {item.status == "Created" && (
                        <button
                          type="button"
                          className="btn btn-primary btn-small"
                          onClick={() => this.triggerDelivery(key, item.index)}
                        >
                          Trigger Delivery
                        </button>
                      )}

                      {item.status == "In transit" && (
                        <button
                          type="button"
                          className="btn btn-warning btn-small"
                          onClick={() => this.triggerArrival(key, item.index)}
                        >
                          Trigger Arrival
                        </button>
                      )}
                      {item.status == "Delivered" && (
                        <button
                          type="button"
                          className="btn btn-danger btn-small"
                          onClick={() =>
                            this.triggerEvaluation(key, item.index)
                          }
                        >
                          Trigger Examination
                        </button>
                      )}

                      {item.status == "Evaluated" && (
                        <button
                          type="button"
                          className="btn btn-success btn-small"
                          onClick={() =>
                            this.triggerPayment(
                              key,
                              item.index,
                              item.address,
                              item.cost
                            )
                          }
                        >
                          Proceed to Payment
                        </button>
                      )}
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
