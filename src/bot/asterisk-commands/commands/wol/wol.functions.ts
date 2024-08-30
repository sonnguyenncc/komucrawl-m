import net from 'net';
import find from 'local-devices';
import wol from 'wake_on_lan';
import os from 'os';
import broadcastAddress from 'broadcast-address';
import { EWolCommand } from './wol.constants';

const sendCMDToPfsense = (
  branch: string,
  identity: string,
  ipAddress: string,
) => {
  const hosts = {
    hn2: '10.10.40.1',
    hn3: '10.10.70.1',
    dn: '10.10.30.1',
    sg1: '10.10.10.1',
    sg2: '10.10.50.1',
    vinh: '10.10.20.1',
    qn: '10.10.60.1',
    hn1: '172.16.10.1',
  };
  const host = hosts[branch] || '172.16.10.1';
  const client = new net.Socket();
  client.connect(
    {
      host: host,
      port: 6996,
    },
    () => {
      client.write(`${ipAddress} ${identity}`);
    },
  );
  client.on('data', (data) => {
    client.end();
  });
};

const discoverDevice = async (macOrIp, ipAddress) => {
  const isIp = macOrIp.includes('.');
  if (!isIp) {
    return Promise.resolve({ mac: macOrIp, ip: ipAddress });
  }
  try {
    return await find(macOrIp);
  } catch {
    return await discoverDeviceFallback(macOrIp);
  }
};

const discoverDeviceFallback = async (ip) => {
  const devices = await find(null);
  return devices.find((dev) => dev.ip === ip) || null;
};

const getAvailableBroadcastAddresses = () => {
  const interfacesNames = Object.keys(os.networkInterfaces());
  const addresses = [];
  for (const name of interfacesNames) {
    const addr = broadcastAddress(name);
    addresses.push(addr);
  }
  return addresses;
};

const wakeDevice = async (macAddress, netMask, silent) => {
  return new Promise((resolve, reject) => {
    wol.wake(
      macAddress,
      { address: netMask, port: 7, num_packets: 3 },
      (error) => {
        if (error && !silent) {
          return reject(new Error(EWolCommand.WOL_FAIL));
        }
        return resolve({ macAddress, netMask });
      },
    );
  });
};

const wakeDeviceOnAvailableNetworks = (macAddress) => {
  const addresses = getAvailableBroadcastAddresses();
  return Promise.all(
    addresses.map((addr) => wakeDevice(macAddress, addr, true)),
  );
};

export const handleWoL = async (message, args) => {
  const identity = args[0];
  const ipAddress = args[1];
  const branch = args[2];
  sendCMDToPfsense(branch, identity, ipAddress);
  try {
    const device = (await discoverDevice(identity, ipAddress)) as any;
    if (!device || !device.mac) {
      console.log(device);
      throw new Error(EWolCommand.ERROR_DEVICE);
    }
    const wakeFunction = device.ip
      ? wakeDevice(device.mac, device.ip, null)
      : wakeDeviceOnAvailableNetworks(device.mac);
    const res = await wakeFunction;
    if (!res) throw new Error(EWolCommand.NO_WOL);
    return EWolCommand.WOL_DONE;
  } catch (error) {
    console.error(error);
    return `Failed, ${error.message}` as EWolCommand;
  }
};
