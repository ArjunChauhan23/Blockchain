import moment from "moment";
import {Block, BlockHeader} from "./block.js";

//DB
import {Level} from 'level';
import * as fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);

const __dirname = path.dirname(__filename);



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

//DataBase
let db;



const createDb = (peerId) => {
    const dir = '/home/arjunchauhan/Code/The-blockchain'+ '/db/' + peerId
    if(!fs.existsSync(dir)){
        fs.mkdirSync(dir);
        db = new Level(dir);
        storeBlock(getGenesisBlock());
    }
}
function storeBlock(newBlock) {
    db.put(newBlock.idx, JSON.stringify(newBlock) , (err) => {
        if(err){
            console.log(err)
        }else
            console.log('--- Inserting block index: ' + newBlock.idx);
    })
}

let getDbBlock = (index, res) => {
    db.get(index, function (err, value) {
        if (err) return res.send(JSON.stringify(err));
        return(res.send(value));
    });
}
export {addBlk, getGenesisBlock,getLatestBlock, getBlock , generateNextBlock, createDb, getDbBlock}