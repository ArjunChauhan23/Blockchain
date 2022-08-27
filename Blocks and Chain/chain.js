import moment from "moment";
import {Block, BlockHeader} from "./block.js";

const getGenesisBlock = () => {
    let blockHeader = new BlockHeader(1, null, "0x1bc3300000000000000000000000000000000000000000000", moment().unix(), "0x181b8330", '1DAC2B7C');
    return new Block(blockHeader, 0, null);
};

const getLatestBlock = () => blockchain[blockchain.length-1];

const getBlock = (index) => {
    if (blockchain.length-1 >= index)
        return blockchain[index];
    else
        return null;
}

const addBlock = (newBlock) => {
    let prevBlock = getLatestBlock();
    if (prevBlock.index < newBlock.index && newBlock.blockHeader.prevHash === prevBlock.blockHeader.merkleRoot) {
        blockchain.push(newBlock);
    }
}
const blockchain = [getGenesisBlock()];

    exports.addBlock = addBlock;
    exports.getBlock = getBlock;
    exports.blockchain = blockchain;
    exports.getLatestBlock = getLatestBlock;
