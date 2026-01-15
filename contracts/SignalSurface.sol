// SPDX-License-Identifier: MPL-2.0
pragma solidity ^0.8.20;

contract SignalSurface {
    function surface()
        external
        view
        returns (uint256 blockNumber, uint256 timestamp, uint256 basefee)
    {
        blockNumber = block.number;
        timestamp = block.timestamp;
        basefee = block.basefee;
    }
}
