import { DnsHeader } from './DnsHeader';
import { concatenateBytes, splitWordIntoBytes } from './utils';

export interface DnsAnswer {
    name: string;
    type: number;
    class: number;
    ttl: number;
    len: number;
    ip: string;
}

export interface DnsQuestion {
    name: string;
    type: number;
    class: number;
}

export class DnsPacket {
    dnsHeader: DnsHeader;

    // Only support one query and answer for now, but DNS supports multiple
    // queries and answers
    question: DnsQuestion;
    answer: DnsAnswer;

    static createQueryPacket(name: string) {
        const dnsPacket = new DnsPacket();
        dnsPacket.question.name = name;
        return dnsPacket;
    }

    static fromBytes(bytes: Buffer) {
        const dnsPacket = new DnsPacket();

        dnsPacket.dnsHeader = DnsHeader.fromBuffer(bytes);

        const { name, lastByteOfSequence } = dnsPacket.parseLabelSequence(bytes, 12);

        dnsPacket.question.name = name;
        dnsPacket.question.type = concatenateBytes(bytes[lastByteOfSequence + 1], bytes[lastByteOfSequence + 2]);
        dnsPacket.question.class = concatenateBytes(bytes[lastByteOfSequence + 3], bytes[lastByteOfSequence + 4]);

        if (dnsPacket.dnsHeader.isRequest()) {
            return dnsPacket;
        }

        //        name     type   class         ttl        len      ip
        //        ------  ------  ------  --------------  ------  --------------
        //  HEX   c0  0c  00  01  00  01  00  00  01  25  00  04  d8  3a  d3  8e
        //  DEC   192 12    1       1           293         4     216 58  211 142
        const { 
            name: answerName, 
            lastByteOfSequence: lastByteOfAnswerSequence 
        } = dnsPacket.parseLabelSequence(bytes, lastByteOfSequence + 5);
        
        const len = concatenateBytes(bytes[lastByteOfAnswerSequence + 9], bytes[lastByteOfAnswerSequence + 10]);
        if (len !== 4) {
            throw new Error("Expected len to be of length 4");
        }

        dnsPacket.answer = {
            name: answerName,
            type: concatenateBytes(bytes[lastByteOfAnswerSequence + 1], bytes[lastByteOfAnswerSequence + 2]),
            class: concatenateBytes(bytes[lastByteOfAnswerSequence + 3], bytes[lastByteOfAnswerSequence + 4]),
            ttl: Buffer.from([
                bytes[lastByteOfAnswerSequence + 5],
                bytes[lastByteOfAnswerSequence + 6],
                bytes[lastByteOfAnswerSequence + 7],
                bytes[lastByteOfAnswerSequence + 8]
            ]).readUInt32BE(),
            len: concatenateBytes(bytes[lastByteOfAnswerSequence + 9], bytes[lastByteOfAnswerSequence + 10]),
            ip: `${bytes[lastByteOfAnswerSequence + 11]}.${bytes[lastByteOfAnswerSequence + 12]}.${bytes[lastByteOfAnswerSequence + 13]}.${bytes[lastByteOfAnswerSequence + 14]}`
        }

        return dnsPacket;
    }

    protected constructor() {
        this.dnsHeader = new DnsHeader();
        this.question = {
            name: '',
            type: 1,
            class: 1,
        }

        this.answer = {
            class: 1,
            type: 1,
            name: '',
            ip: '',
            len: 4,
            ttl: 300
        }
    }

    toBuffer() {
        if (this.dnsHeader.getNumAnswers() > 0) {
            throw new Error('toBuffer for DNS responses is not currently supported');
        }

        return Buffer.concat([
            this.dnsHeader.toBuffer(),
            this.convertNameToBuffer(this.question.name),
            Buffer.from([
                ...splitWordIntoBytes(this.question.type),
                ...splitWordIntoBytes(this.question.class)
            ])
        ])
    }

    getAnswer() {
        return this.answer.ip;
    }

    private convertNameToBuffer(name: string) {
        const labels = name.split('.');

        const bufferParts: number[] = [];

        labels.forEach((label) => {
            bufferParts.push(label.length);
            
            for (let c of label) {
                bufferParts.push(c.charCodeAt(0));
            }
        });

        bufferParts.push(0);

        return Buffer.from(bufferParts);
    }

    private parseLabelSequence(bytes: Buffer, startAtByte: number) { 
        const labels = [];
        const maxLimit = 512;
        
        const shouldJump = this.isJumpDirective(bytes[startAtByte]);
        let pointer = shouldJump ? concatenateBytes(bytes[startAtByte], bytes[startAtByte + 1]) ^ 0xC000 : startAtByte;
        let currentLabelEventualLength = bytes[pointer];
        let currentLabel = Buffer.alloc(currentLabelEventualLength);
        let numBytesInCurrentLabel = 0;


        while(true) {
            pointer++;

            currentLabel[numBytesInCurrentLabel] = bytes[pointer];
            numBytesInCurrentLabel++;

            if (numBytesInCurrentLabel === currentLabelEventualLength) {
                labels.push(currentLabel.toString());

                pointer++;
                currentLabelEventualLength = bytes[pointer];

                if (this.isJumpDirective(currentLabelEventualLength)) {
                    throw new Error("Tried to jump more than once.  Parser currently only supports one jump directive at beginning of label sequence")
                }

                currentLabel = Buffer.alloc(currentLabelEventualLength);
                numBytesInCurrentLabel = 0;

                if (currentLabelEventualLength === 0) {
                    break;
                }
            }

            if (pointer > maxLimit) {
                throw new Error("Something went wrong with parsing the DNS packet.  Exceeded max length of DNS packet while trying to get query name");
            }
        }

        return {
            name: labels.join('.'),
            lastByteOfSequence: shouldJump ? startAtByte + 1 : pointer,
        }
    }

    private isJumpDirective(byte: number) {
        // If the first two most significant bytes are 1, then the byte
        // indicates the beginning of a jump directive
        return byte >> 6 === 3;
    }
}
