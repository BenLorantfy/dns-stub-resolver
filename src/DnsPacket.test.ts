import { expect, test } from 'vitest'
import { DnsPacket } from './DnsPacket';

// test('should properly parse a header for a DNS query', () => {
//     const buffer = Buffer.from([
//         0x95, 
//         0xe5, 
//         0b00000001,
//         //       R
//         //       D
//         0b00100000,
//         // ---
//         //  Z

//         // Num questions
//         0x00,
//         0x01,

//         // Num answers
//         0x00,
//         0x00,

//         // Num authority
//         0x00,
//         0x00,

//         // Num additional
//         0x00,
//         0x00,
//     ]);


//     const dnsPacket = new DnsPacket(buffer);

//     expect(dnsPacket.ID).toEqual(0x95e5);
//     expect(dnsPacket.ID).toEqual(38373);
    
//     expect(dnsPacket.QR).toEqual(0);
//     expect(dnsPacket.OPCODE).toEqual(0);
//     expect(dnsPacket.AA).toEqual(0);
//     expect(dnsPacket.TC).toEqual(0);
//     expect(dnsPacket.RD).toEqual(1);
    
//     expect(dnsPacket.RA).toEqual(0);
//     expect(dnsPacket.Z).toEqual(0b010);
//     expect(dnsPacket.Z).toEqual(2);
//     expect(dnsPacket.RCODE).toEqual(0);

//     expect(dnsPacket.QDCOUNT).toEqual(1);
//     expect(dnsPacket.ANCOUNT).toEqual(0);
//     expect(dnsPacket.NSCOUNT).toEqual(0);
//     expect(dnsPacket.ARCOUNT).toEqual(0);
// })

test('should properly parse a DNS response', () => {
    const buffer = Buffer.from([
        0x95, 
        0xe5, 
        0b10000001,
        0b10000000,

        // Num questions
        0x00,
        0x01,

        // Num answers
        0x00,
        0x01,

        // Num authority
        0x00,
        0x00,

        // Num additional
        0x00,
        0x00,

        // Payload
        //                         query name              type   class
        //            -----------------------------------  -----  -----
        //     HEX    06 67 6f 6f 67 6c 65 03 63 6f 6d 00  00 01  00 01
        //     ASCII     g  o  o  g  l  e     c  o  m
        //     DEC    6                    3           0       1      1

        // Query name
        0x06,
        0x67,
        0x6f,
        0x6f,
        0x67,
        0x6c,
        0x65,
        0x03,
        0x63,
        0x6f,
        0x6d,
        0x00,

        // Type
        0x00,
        0x01,

        // Class
        0x00,
        0x01,

        // Answer name
        0xc0,
        0x0c,
        0x00,
        0x01,
        0x00,
        0x01,
        0x00,
        0x00,
        0x00,
        0x13,
        0x00,
        0x04,
        0x8e,
        0xfb,
        0x29,
        0x2e,
    ]);

    const dnsPacket = DnsPacket.fromBytes(buffer);
    const dnsHeader = dnsPacket.dnsHeader.getRawHeaderInfo();
    
    expect(dnsHeader).toEqual({
        ID: 0x95e5,
        QR: 1,
        OPCODE: 0,
        AA: 0,
        TC: 0,
        RD: 1,
        RA: 1,
        Z: 0,
        RCODE: 0,
        QDCOUNT: 1,
        ANCOUNT: 1,
        NSCOUNT: 0,
        ARCOUNT: 0
    })

    expect(dnsPacket.queryName).toEqual('google.com');
    expect(dnsPacket.queryType).toEqual(1); // A record
    expect(dnsPacket.queryClass).toEqual(1);

    expect(dnsPacket.answer).toEqual({
        name: 'google.com',
        type: 1,
        class: 1,
        ttl: 19,
        len: 4,
        ip: '142.251.41.46'
    });
})