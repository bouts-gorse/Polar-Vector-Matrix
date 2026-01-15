// SPDX-License-Identifier: MPL-2.0
pragma solidity ^0.8.20;

contract ExecutionIndex {
    mapping(address => uint256) private firstObserved;

    function index(address target) external {
        if (firstObserved[target] == 0) {
            firstObserved[target] = block.timestamp;
        }
    }

    function observedAt(address target) external view returns (uint256) {
        return firstObserved[target];
    }
}
