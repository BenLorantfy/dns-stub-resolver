import { DnsPacket } from "./DnsPacket";
import dgram from 'node:dgram';
import { program } from 'commander';

function resolveName(name: string) {
    return new Promise((resolve, reject) => {
        const dnsPacket = DnsPacket.createQueryPacket(name);
        const server = dgram.createSocket('udp4');
    
        server.on('error', (err) => {
            server.close();
            reject(err);
        });
    
        server.on('message', (msg) => {
            const dnsResponse = DnsPacket.fromBytes(msg);
            resolve(dnsResponse.getAnswer())
        });
    
        server.bind(41234);
    
        server.send(dnsPacket.toBuffer(), 53, '8.8.8.8', (err) => {
            if (err) {
                reject(err);
            }
        })
    })
}

program
  .name('dns-stub-resolver')
  .description('CLI to resolve a domain name to a v4 IP address')
  .version('1.0.0')
  .argument('<domain_name>', 'The domain name to resolve to an IP address')
  .action((domainName) => {
    resolveName(domainName)
        .then((ip) => {
            console.log(ip);
            process.exit(0);
        })
        .catch((err) => {
            console.error(err.toString());
            process.exit(1);
        })
  })
  .parse(process.argv)
