import crypto from 'crypto';

//Used to create a network swarm that uses
//discovery-channel to find and connect peers
import Swarm from 'discovery-swarm';

//deploys servers that are used to discover other peers
import defaults from 'dat-swarm-defaults';

//get-port: Gets available TCP ports
import getPort from "get-port";

//Chain
import {getLatestBlock, blockchain, getBlock,addBlock} from '../Blocks and Chain/chain.js'

//message and request receive by latest block
let MessageType = {
    REQUEST_LATEST_BLOCK: 'requestLatestBlock',
    LATEST_BLOCK: 'latestBlock',
};

//peers
const peers = {};

//Holding connection seq
let connSeq = 0;


let channel = 'myBlockchain';

//Generate peer id
const myPeerId = crypto.randomBytes(32);
console.log('myPeer: ' + myPeerId.toString('hex'));

/*
The swarm library can be found
here: https://github.com/mafintosh/discovery-swarm. What it does
    is create a network swarm that uses the discovery-channel library to find
and connect peers on a UCP/TCP network
*/

const config = defaults({
    id: myPeerId,
});

const swarm = Swarm(config);

(async () => {
    //Listen at random port
    const port = await getPort();
    swarm.listen(port);
    console.log('Listening port: ' + port);

    swarm.join(channel);
    swarm.on('connection', (conn, info) => {
        const seq = connSeq;
        const peerId = info.id.toString('hex');
        console.log(`Connected #${seq} to peer: ${peerId}`);
        if (info.initiator) {
            try {
                conn.setKeepAlive(true, 600);

            } catch (exception) {
                console.log('exception', exception);
            }
        }
        conn.on('data', data => {
            let message = JSON.parse(data);
            console.log('----------- Received Message start -------------');
            console.log(
                'from: ' + peerId.toString('hex'),
                'to: ' + peerId.toString(message.to),
                'my: ' + myPeerId.toString('hex'),
                'type: ' + JSON.stringify(message.type)
            );
            console.log('----------- Received Message end -------------');
            //Handle Req
            switch (message.type) {
                case MessageType.REQUEST_BLOCK:
                    console.log('REQUEST BLOCK');
                    const reqIndex = (JSON.parse(JSON.stringify(message.data))).index;
                    const reqBlock = getBlock(reqIndex);
                    if (reqBlock)
                        writeMessageToPeerToId(peerId.toString('hex'), MessageType.RECEIVE_NEXT_BLOCK, reqBlock)
                    else
                        console.log('NO BLOCK FOUND ' + reqIndex)
                    break;

                case MessageType.RECEIVE_NEXT_BLOCK:
                    console.log('-----------RECEIVE_NEXT_BLOCK-------------');
                    addBlock(JSON.parse(JSON.stringify(message.data)));
                    console.log(JSON.stringify(blockchain));
                    let nextBlockIndex = getLatestBlock().index + 1;
                    console.log('-- request next block @ index: ' + nextBlockIndex);
                    writeMessageToPeers(MessageType.REQUEST_BLOCK, {index: nextBlockIndex});
                    console.log('-----------RECEIVE_NEXT_BLOCK-------------');
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
    writeMessageToPeers(MessageType.REQUEST_BLOCK, {index: getLatestBlock().index+1});
}, 5000);
