//BLOCK -> Index , txns
//BLOCKCHAIN HEADER

/*
 VERSION
 previous block header hash function -> SHA-256
 Merkle root hash: A Merkle tree is a binary tree that holds all the hashed pairs of the tree.
 timestamp
*/


export class BlockHeader {
    constructor(ver, prevHash, merkleRoot, time) {
        this.ver = ver;
        this.prevHash = prevHash;
        this.merkleRoot = merkleRoot;
        this.time = time;
    }
}

export class Block{
    constructor(blockHeader, idx, txns) {
        this.blockHeader = blockHeader;
        this.idx = idx;
        this.txns = txns;
    }
}