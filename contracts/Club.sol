pragma solidity 0.8.9;
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
}
