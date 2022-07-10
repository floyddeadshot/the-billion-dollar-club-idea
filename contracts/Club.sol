pragma solidity ^0.8.9;
import "hardhat/console.sol";
import "./MerkleTreeWithHistory.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

interface IVerifier {
    function verifyProof(bytes memory _proof, uint256[6] memory _input)
        external
        returns (bool);
}

contract Club is MerkleTreeWithHistory, ReentrancyGuard {
    IVerifier public immutable verifier;
    mapping(bytes32 => bool) public commitments;
    event SignUp(
        bytes32 indexed commitment,
        uint32 leafIndex,
        uint256 timestamp
    );

    constructor(
        IVerifier _verifier,
        IHasher _hasher,
        uint32 _merkleTreeHeight
    ) MerkleTreeWithHistory(_merkleTreeHeight, _hasher) {
        verifier = _verifier;
    }

    function signUp(bytes32 _commitment) external nonReentrant {
        require(!commitments[_commitment], "The commitment has been submitted");
        uint32 insertedIndex = _insert(_commitment);
        commitments[_commitment] = true;
        console.log("InsertedIndex", insertedIndex);
        emit SignUp(_commitment, insertedIndex, block.timestamp);
    }

    // function checkSignUp(
    //     bytes calldata _proof,
    //     bytes32 _root,
    //     address payable _recipient,
    //     address payable _relayer,
    //     uint256 _fee,
    //     uint256 _refund
    // ) external payable nonReentrant {
    //     require(isKnownRoot(_root), "Cannot find your merkle root"); // Make sure to use a recent one
    //     require(
    //         verifier.verifyProof(
    //             _proof,
    //             [
    //                 uint256(_root),
    //                 uint256(_nullifierHash),
    //                 uint256(_recipient),
    //                 uint256(_relayer),
    //                 _fee,
    //                 _refund
    //             ]
    //         ),
    //         "Invalid withdraw proof"
    //     );

    //     emit Withdrawal(_recipient, _nullifierHash, _relayer, _fee);
    // }
}
