const Web3 = require("web3");
const rpcURL = "http://127.0.0.1:7545";
const web3 = new Web3(rpcURL);

const contractData = require("../config/contracts");
const { Contract } = require("../config/web3");
const SwapContractV2 = artifacts.require("SwapContractV2");
const { toWei, toEth } = require("../utils/web3");

require("chai").use(require("chai-as-promised")).should();

contract("SwapContractV2", ([owner, stranger]) => {
  let swapContractV2;
  let wethContract;

  beforeEach(async () => {
    swapContractV2 = await SwapContractV2.new(
      contractData.uniswap.addresses.factory,
      contractData.token.WETH.address[1],
      contractData.kyber.addresses.network[1]
    );
    wethContract = new Contract(
      contractData.token.abi,
      contractData.token.WETH.address[1]
    );

    console.log(contractData.token.WETH.address[1]);

    await web3.eth.sendTransaction({
      from: owner,
      to: swapContractV2.address,
      value: toWei("1"),
    });

    await swapContractV2.changeMinAmount(toWei("0.01"), {
      from: owner,
      to: swapContractV2.address,
    });
  });

  describe("payable functionality", async () => {
    it("allows receving ether and converts to WETH", async () => {
      startAmount = toEth(await web3.eth.getBalance(owner));
      await web3.eth.sendTransaction({
        from: owner,
        to: swapContractV2.address,
        value: toWei("1"),
      });
      endAmount = toEth(await web3.eth.getBalance(owner));
      endAmountContract = toEth(
        await wethContract.methods.balanceOf(swapContractV2.address).call()
      );
      assert.equal(endAmountContract, 2);
      assert(startAmount > endAmount, "ether has not been transfered");
    });

    it("allows withdrawing to owner", async () => {
      startAmount = toEth(await wethContract.methods.balanceOf(owner).call());
      await swapContractV2.withdraw(toWei("0.1"), {
        from: owner,
      });
      endAmount = toEth(await wethContract.methods.balanceOf(owner).call());
      endAmountContract = toEth(
        await wethContract.methods.balanceOf(swapContractV2.address).call()
      );

      assert.equal(endAmountContract, 0.9);
      assert(startAmount < endAmount, "ether has not been transfered to owner");
    });

    it("does not allow withdrawing to stranger", async () => {
      await swapContractV2
        .withdraw(toWei("0.1"), {
          from: stranger,
        })
        .catch(async (err) => {
          if (err.toString().indexOf("UNAUTHORIZED") == -1)
            assert.fail(err.toString());
          else {
            endAmountContract = toEth(
              await wethContract.methods
                .balanceOf(swapContractV2.address)
                .call()
            );
            assert.equal(endAmountContract, 1);
          }
        });
    });

    it("allows transferring to stranger using owner", async () => {
      startAmount = toEth(
        await wethContract.methods.balanceOf(stranger).call()
      );
      await swapContractV2.transfer(stranger, toWei("0.1"), {
        from: owner,
      });
      endAmount = toEth(await wethContract.methods.balanceOf(stranger).call());
      endAmountContract = toEth(
        await wethContract.methods.balanceOf(swapContractV2.address).call()
      );

      assert.equal(endAmountContract, 0.9);
      assert(
        startAmount < endAmount,
        "ether has not been transfered to stranger"
      );
    });

    it("does not allow transfering to stranger from stranger", async () => {
      await swapContractV2
        .transfer(stranger, toWei("0.1"), {
          from: stranger,
        })
        .catch(async (err) => {
          if (err.toString().indexOf("UNAUTHORIZED") == -1)
            assert.fail(err.toString());
          else {
            endAmountContract = toEth(
              await wethContract.methods
                .balanceOf(swapContractV2.address)
                .call()
            );
            assert.equal(endAmountContract, 1);
          }
        });
    });

    it("does not allow transfering to stranger more that minAmount from owner", async () => {
      await swapContractV2
        .transfer(stranger, toWei("9"), {
          from: owner,
        })
        .catch(async (err) => {
          if (err.toString().indexOf("INSUFFICIENT_BALANCE") == -1)
            assert.fail(err.toString());
          else {
            endAmountContract = toEth(
              await wethContract.methods
                .balanceOf(swapContractV2.address)
                .call()
            );
            assert.equal(endAmountContract, 1);
          }
        });
    });

    it("allows transferring to owner using stranger", async () => {
      startAmount = toEth(await wethContract.methods.balanceOf(owner).call());
      await swapContractV2.transfer(owner, toWei("0.1"), {
        from: stranger,
      });
      endAmount = toEth(await wethContract.methods.balanceOf(owner).call());
      endAmountContract = toEth(
        await wethContract.methods.balanceOf(swapContractV2.address).call()
      );

      assert.equal(endAmountContract, 0.9);
      assert(startAmount < endAmount, "ether has not been transfered to owner");
    });

    it("does not allow transfering to owner more that minAmount from stranger", async () => {
      await swapContractV2
        .transfer(owner, toWei("1"), {
          from: stranger,
        })
        .catch(async (err) => {
          if (err.toString().indexOf("INSUFFICIENT_BALANCE") == -1)
            assert.fail(err.toString());
          else {
            endAmountContract = toEth(
              await wethContract.methods
                .balanceOf(swapContractV2.address)
                .call()
            );
            assert.equal(endAmountContract, 1);
          }
        });
    });

    it("allows owner to change minAmount", async () => {
      await swapContractV2.changeMinAmount(toWei("2"), {
        from: owner,
        to: swapContractV2.address,
      });
      var minAmount = toEth(await swapContractV2.minAmount.call());
      assert.equal(minAmount, 2);
    });

    it("does not allow stranger to change minAmount", async () => {
      await swapContractV2
        .changeMinAmount(toWei("4"), {
          from: stranger,
          to: swapContractV2.address,
        })
        .catch(async (err) => {
          if (err.toString().indexOf("UNAUTHORIZED") == -1)
            assert.fail(err.toString());
          else {
            var minAmount = toEth(await swapContractV2.minAmount.call());
            assert.equal(minAmount, 0.01);
          }
        });
    });
  });

  // describe("trade functionality", async () => {
  //   it("fails if minimum output minus initial gas usage is ", async () => {
  //     const path = [
  //       WETH[4].address,
  //       "0xc7AD46e0b8a400Bb3C915120d284AafbA8fc4735",
  //       "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
  //       WETH[4].address,
  //     ];
  //     await swapContract
  //       .trade(
  //         wei("0.1"),
  //         wei("0.11"),
  //         path,
  //         Math.floor(Date.now() / 1000) + 60 * 2,
  //         { from: owner }
  //       )
  //       .catch(async (err) => {
  //         if (err.toString().indexOf("INSUFFICIENT_OUTPUT") == -1)
  //           assert.fail(err.toString());
  //         else {
  //         }
  //       });
  //   });

  //   it("fails when input is not WETH", async () => {
  //     const path = [
  //       "0xc7AD46e0b8a400Bb3C915120d284AafbA8fc4735",
  //       "0xc7AD46e0b8a400Bb3C915120d284AafbA8fc4735",
  //       "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
  //       WETH[4].address,
  //     ];
  //     await swapContract
  //       .trade(
  //         wei("0.1"),
  //         wei("0.2"),
  //         path,
  //         Math.floor(Date.now() / 1000) + 60 * 2,
  //         { from: owner }
  //       )
  //       .catch(async (err) => {
  //         if (err.toString().indexOf("INVALID_INPUT") == -1)
  //           assert.fail(err.toString());
  //       });
  //   });

  //   it("fails when output is not WETH", async () => {
  //     const path = [
  //       WETH[4].address,
  //       "0xc7AD46e0b8a400Bb3C915120d284AafbA8fc4735",
  //       "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
  //       "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
  //     ];
  //     await swapContract
  //       .trade(
  //         wei("0.1"),
  //         wei("0.2"),
  //         path,
  //         Math.floor(Date.now() / 1000) + 60 * 2,
  //         { from: owner }
  //       )
  //       .catch(async (err) => {
  //         if (err.toString().indexOf("INVALID_OUTPUT") == -1)
  //           assert.fail(err.toString());
  //       });
  //   });

  //   it("fails when min output is less than input", async () => {
  //     const path = [
  //       WETH[4].address,
  //       "0xc7AD46e0b8a400Bb3C915120d284AafbA8fc4735",
  //       "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
  //       WETH[4].address,
  //     ];
  //     await swapContract
  //       .trade(
  //         wei("0.1"),
  //         wei("0.09"),
  //         path,
  //         Math.floor(Date.now() / 1000) + 60 * 20,
  //         { from: owner }
  //       )
  //       .catch(async (err) => {
  //         if (err.toString().indexOf("INVALID_MIN_OUTPUT") == -1)
  //           assert.fail(err.toString());
  //       });
  //   });
  // });
});
