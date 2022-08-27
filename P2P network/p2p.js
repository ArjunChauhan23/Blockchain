import crypto from 'crypto';

//Used to create a network swarm that uses
//discovery-channel to find and connect peers
import Swarm from 'discovery-swarm';

//deploys servers that are used to discover other peers
import defaults from 'dat-swarm-defaults';

//get-port: Gets available TCP ports
import getPort from "get-port";

//
import {CronJob} from 'cron';

//Chain
import {getLatestBlock, blockchain, getBlock, addBlk, generateNextBlock, createDb} from '../Blocks and Chain/chain.js'

//message and request receive by latest block
let MessageType = {
    REQUEST_BLOCK: 'requestBlock',
    RECEIVE_NEXT_BLOCK: 'receiveNextBlock',
    RECEIVE_NEW_BLOCK: 'receiveNewBlock',
    REQUEST_ALL_REGISTER_MINERS: 'requestAllRegisterMiners',
    REGISTER_MINER: 'registerMiner'
};

//peers
const peers = {};

//Holding connection seq
let connSeq = 0;


let channel = 'myBlockchain';

let registeredMiners = [],
      lastBlockMinedBy = null;

//Generate peer id
const myPeerId = crypto.randomBytes(32);
console.log('myPeer: ' + myPeerId.toString('hex'));

/*
The swarm library can be found
here: https://github.com/mafintosh/discovery-swarm. What it does
    is create a network swarm that uses the discovery-channel library to find
and connect peers on a UCP/TCP network
*/

createDb(myPeerId.toString('hex'));

const config = defaults({
    id: myPeerId,
});

const swarm = Swarm(config);

(async () => {
    //Listen at random port
    const port = await getPort();
    swarm.listen(port);
    console.log('LISTENING PORT: ' + port);

    swarm.join(channel);

    swarm.on('CONNECTION', (conn, info) => {
        const seq = connSeq;
        const peerId = info.id.toString('hex');
        console.log(`CONNECTED #${seq} TO PEER: ${peerId}`);

        if (info.initiator) {
            try {
                conn.setKeepAlive(true, 600);

            } catch (exception) {
                console.log('exception', exception);
            }
        }
        conn.on('data', data => {
            let message = JSON.parse(JSON.stringify(data));
            console.log('----------- RECEIVED MSG START -------------');
            console.log(
                'from: ' + peerId.toString('hex'),
                'to: ' + peerId.toString(message.to),
                'my: ' + myPeerId.toString('hex'),
                'type: ' + JSON.stringify(message.type)
            );
            console.log('-----------  RECEIVED MSG END -------------');
            //Handle Req

            switch (message.type) {
                case MessageType.REQUEST_BLOCK:
                    console.log('--------------------REQUEST BLOCK-------------------');
                    let msg = JSON.stringify(message.data)
                    console.log((JSON.parse(msg)))
                    const reqIndex = (JSON.parse(msg)).idx;

                    const reqBlock = getBlock(reqIndex)
                    if (reqBlock)
                        writeMessageToPeerToId(peerId.toString('hex'), MessageType.RECEIVE_NEXT_BLOCK, reqBlock)
                    else
                        console.log('NO BLOCK FOUND ' + reqIndex)
                    break;

                case MessageType.RECEIVE_NEXT_BLOCK:
                    console.log('-----------RECEIVE_NEXT_BLOCK-------------');
                    addBlk(JSON.parse(JSON.stringify(message)));
                    console.log(JSON.stringify(blockchain));
                    let nextBlockIndex = getLatestBlock.idx + 1;
                    console.log('-- request next block @ index: ' + nextBlockIndex);
                    writeMessageToPeers(MessageType.REQUEST_BLOCK, {idx: nextBlockIndex});
                    console.log('-----------RECEIVE_NEXT_BLOCK-------------');
                    break;

                case MessageType.RECEIVE_NEW_BLOCK:
                    if ( message.to === myPeerId.toString('hex') && message.from !== myPeerId.toString('hex')) {
                        console.log('-----------RECEIVE_NEW_BLOCK------------- ' + message.to);
                        const msg = JSON.stringify(message.data)
                        addBlk(JSON.parse(msg));
                        console.log(JSON.stringify(blockchain));
                        console.log('-----------RECEIVE_NEW_BLOCK------------- ' + message.to);
                    }
                    break;
                case MessageType.REQUEST_ALL_REGISTER_MINERS:
                    console.log('-----------REQUEST_ALL_REGISTER_MINERS------------- ' + message.to);
                    writeMessageToPeers(MessageType.REGISTER_MINER, registeredMiners);
                    msg = JSON.stringify(message.data)
                    registeredMiners = JSON.parse(msg);
                    console.log('-----------REQUEST_ALL_REGISTER_MINERS------------- ' + message.to);
                    break;
                case MessageType.REGISTER_MINER:
                    console.log('-----------REGISTER_MINER------------- ' + message.to);
                    let miners = JSON.stringify(message);
                    registeredMiners = JSON.parse(miners);
                    console.log(registeredMiners);
                    console.log('-----------REGISTER_MINER------------- ' + message.to);
                    break;

            }
        });


        conn.on('close', () => {
            console.log(`Connection ${seq} closed, peerId:
            ${peerId}`);
            if (peers[peerId].seq === seq) {
                delete peers[peerId]
            }
        });

        if (!peers[peerId]) {
            peers[peerId] = {}
        }
        peers[peerId].conn = conn;
        peers[peerId].seq = seq;
        connSeq++
    })
})();

// Here, you will be using a setTimeout Node.js native function to send
// a message after ten seconds to any available peers. The first message
// you will be sending is just an “hello” message. You create methods called
// writeMessageToPeers and writeMessageToPeerToId to handle your
// object, so it’s formatted with the data you want to transmit and who you want
// to send it to.


let writeMessageToPeers;
writeMessageToPeers = (type, data) => {
    for (let id in peers) {
        console.log('-------- writeMessageToPeers start -------- ');
        console.log('type: ' + type + ', to: ' + id);
        console.log('-------- writeMessageToPeers end ----------- ');
        sendMessage(id, type, data);
    }
};
let writeMessageToPeerToId;
writeMessageToPeerToId = (toId, type, data) => {
    for (let id in peers) {
        if (id === toId) {
            console.log('-------- writeMessageToPeerToId start-------- ');
            console.log('type: ' + type + ', to: ' + toId);

            console.log('-------- writeMessageToPeerToId end ----------- ');
            sendMessage(id, type, data);
        }
    }
};
let sendMessage;
sendMessage = (id, type) => {
    peers[id].conn.write(JSON.stringify(
        {
            to: id,
            from: myPeerId,
            type: type,
        }
    ));
};

// Every 5000ms  new block add
setTimeout(function(){
    writeMessageToPeers(MessageType.REQUEST_ALL_REGISTER_MINERS, null);
}, 5000);

setTimeout(function(){
    writeMessageToPeers(MessageType.REQUEST_BLOCK, {index: getLatestBlock().idx+1});
}, 5000);

setTimeout(function(){
    const myPId = myPeerId.toString('hex')
    registeredMiners.push(myPId);
    console.log('----------Register my miner --------------');
    console.log(registeredMiners);
    writeMessageToPeers(MessageType.REGISTER_MINER, registeredMiners);
    console.log('---------- Register my miner --------------');
}, 7000);

const job = new CronJob('30 * * * * *', function() {
    let index = 0; // first block
    if (lastBlockMinedBy) {
        let newIndex = registeredMiners.indexOf(lastBlockMinedBy);
        index = ( newIndex+1 > registeredMiners.length-1) ? 0 : newIndex + 1;
    }
    lastBlockMinedBy = registeredMiners[index];
    console.log('-- REQUESTING NEW BLOCK FROM: ' + registeredMiners[index] + ', index: ' + index);
    console.log(JSON.stringify(registeredMiners));
    if (registeredMiners[index] === myPeerId.toString('hex')) {
        console.log('-----------create next block -----------------');
        let newBlock = generateNextBlock(null);
        addBlk(newBlock);
        console.log(JSON.stringify(newBlock));
        writeMessageToPeers(MessageType.RECEIVE_NEW_BLOCK, newBlock);
        console.log(JSON.stringify(blockchain));
        console.log('-----------create next block -----------------');
    }
});
job.start();