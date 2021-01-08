// SPDX-License-Identifier: MIT

pragma solidity ^0.7.0;

import './libraries/UniswapV2Library.sol';
import '@uniswap/lib/contracts/libraries/TransferHelper.sol';

import './interfaces/IWETH.sol';
import './interfaces/IERC20.sol';
import './interfaces/IUniswapV2Pair.sol';
import './interfaces/IKyberNetwork.sol';

contract SwapContractV2 {
    using SafeMath for uint;

    address payable private owner;
    uint public minAmount = 9000000000000000000;

    address private factory;
    address private WETH;
    address private kyberNetwork;

    modifier ensure(uint _deadline) {
        require(_deadline >= block.timestamp, 'EXPIRED');
        _;
    }

    constructor(address _factory, address _WETH, address _kyberNetwork) {
        factory = _factory;
        WETH = _WETH;
        kyberNetwork = _kyberNetwork;
        owner = msg.sender;
    }

    modifier onlyOwner {
        require(msg.sender == owner, "UNAUTHORIZED");
        _;
    }

    function withdraw(uint _amount) onlyOwner public {
        require(IERC20(WETH).balanceOf(address(this)) >= _amount, "INSUFFICIENT_BALANCE");
        IWETH(WETH).transfer(owner, _amount);
    }

    function transfer(address payable _to, uint _amount) public {
        require(msg.sender == owner || _to == owner, "UNAUTHORIZED");
        require(IERC20(WETH).balanceOf(address(this)) >= _amount + minAmount, "INSUFFICIENT_BALANCE");
        IWETH(WETH).transfer(_to, _amount);
    }

    function changeMinAmount(uint _amount) onlyOwner public {
        minAmount = _amount;
    }

    receive() external payable {
        IWETH(WETH).deposit{value: msg.value}();
    }

    function uniswapToKyber(
        uint _amountIn, 
        uint _amountUniswapOutMin, 
        uint _amountOutMin, 
        uint _minConversionRate, 
        address[] calldata _path, 
        uint _deadline) 
        external
        virtual
        ensure(_deadline) {
        
        require(_amountOutMin > _amountIn, 'INVALID_MIN_OUTPUT');
        require(_path[0] == WETH, 'INVALID_INPUT');

        uint[] memory amounts = UniswapV2Library.getAmountsOut(factory, _amountIn, _path);

        require(amounts[amounts.length - 1] > _amountUniswapOutMin, 'INSUFFICIENT_UNISWAP_OUTPUT');

        //Uniswap Trade (WETH -> Token)
        assert(IWETH(WETH).transfer(UniswapV2Library.pairFor(factory, _path[0], _path[1]), amounts[0]));
        _uniswap_swap(amounts, _path);

        //KyberNetwork trade (Token -> WETH)
        TransferHelper.safeTransferFrom(_path[1], address(this), address(kyberNetwork), amounts[amounts.length - 1]);
        bytes memory hint;
        uint256 reportedDestAmount = IKyberNetwork(kyberNetwork).tradeWithHintAndFee(
            address(this),
            IERC20(_path[1]),
            amounts[amounts.length - 1],
            IERC20(_path[0]),
            address(this),
            10**28,
            _minConversionRate,
            address(this),
            0,
            hint
        );

        require(reportedDestAmount > _amountOutMin, 'INSUFFICIENT_KYBER_OUTPUT');
    }

    function _uniswap_swap(uint[] memory _amounts, address[] memory _path) internal virtual {
        for (uint i; i < _path.length - 1; i++) {
            (address input, address output) = (_path[i], _path[i + 1]);
            (address token0,) = UniswapV2Library.sortTokens(input, output);
            uint amountOut = _amounts[i + 1];
            (uint amount0Out, uint amount1Out) = input == token0 ? (uint(0), amountOut) : (amountOut, uint(0));
            address to = i < _path.length - 2 ? UniswapV2Library.pairFor(factory, output, _path[i + 2]) : address(this);
            IUniswapV2Pair(UniswapV2Library.pairFor(factory, input, output)).swap(
                amount0Out, amount1Out, to, new bytes(0)
            );
        }
    }
}