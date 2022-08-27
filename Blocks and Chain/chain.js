import moment from "moment";
import {Block, BlockHeader} from "./block.js";

//Hash Function
import sha256 from 'crypto-js/sha256.js';

const getGenesisBlock = () => {
    let blockHeader = new BlockHeader(1, null, "0x1bc3300000000000000000000000000000000000000000000", moment().unix(), "0x181b8330", '1DAC2B7C');
    return new Block(blockHeader, 0, null);
};

const getLatestBlock = () => blockchain[blockchain.length-1]; //Last element of blockchain array

const getBlock = (index) => {
    if (blockchain.length-1 >= index)
        return blockchain[index];
    else
        return null;
}

const addBlk = (newBlock) => {
    let prevBlock = getLatestBlock();
    if (prevBlock.idx < newBlock.idx && newBlock.blockHeader.prevHash === prevBlock.blockHeader.merkleRoot) {
        blockchain.push(newBlock);
    }
}
export const blockchain = [getGenesisBlock()];

const generateNextBlock = (txns) => {
    const prevBlock = getLatestBlock(),
        prevMerkleRoot = prevBlock.blockHeader.merkleRoot;
    let nextIndex;
    let nextTime;
    let nextMerkleRoot;
    nextIndex = prevBlock.idx + 1
        nextTime = moment().unix()
        nextMerkleRoot = sha256(1, prevMerkleRoot, nextTime).toString();

    const blockHeader = new BlockHeader(1, prevMerkleRoot, nextMerkleRoot, nextTime);
    const newBlock = new Block(blockHeader, nextIndex, txns);
    blockchain.push(newBlock);
    return newBlock;
};

export {addBlk, getGenesisBlock,getLatestBlock, getBlock , generateNextBlock}