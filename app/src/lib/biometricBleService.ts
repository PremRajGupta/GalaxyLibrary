/**
 * Biometric Web Bluetooth Service for Petpooja_Payroll_72 (ESP32 Biometric Puck)
 * Communicates directly with the device over Bluetooth Low Energy (BLE)
 * No third-party software or Petpooja cloud subscription needed!
 */

export interface PunchEvent {
  raw: string;
  fingerId?: number;
  studentId?: string;
  timestamp: string;
  action: 'in' | 'out' | 'unknown';
}

export interface FingerMapping {
  fingerId: number;
  studentId: string;
  studentName: string;
  seatNumber?: string;
}

class BiometricBleService {
  private device: any = null;
  private server: any = null;
  public characteristic: any = null;
  private isConnected: boolean = false;
  private punchListeners: ((event: PunchEvent) => void)[] = [];
  private logListeners: ((log: string) => void)[] = [];
  private statusListeners: ((connected: boolean, deviceName: string) => void)[] = [];

  // Common BLE Service UUIDs for ESP32 and serial BLE devices
  private candidateServices = [
    '0000ffe0-0000-1000-8000-00805f9b34fb', // Standard Serial / UART
    '0000fff0-0000-1000-8000-00805f9b34fb', // Custom UART
    '0000ff00-0000-1000-8000-00805f9b34fb',
    '6e400001-b5a3-f393-e0a9-e50e24dcca9e', // Nordic UART
    '49535343-fe7d-4ae5-8fa9-9fafd205e455', // ISSC Transparent
    '0000fee0-0000-1000-8000-00805f9b34fb',
    '0000180a-0000-1000-8000-00805f9b34fb', // Device Info
    '00001800-0000-1000-8000-00805f9b34fb',
  ];

  public getConnectedStatus(): boolean {
    return this.isConnected && !!this.server?.connected;
  }

  public getDeviceName(): string {
    return this.device?.name || 'Petpooja_Payroll_72';
  }

  public onPunch(callback: (event: PunchEvent) => void) {
    this.punchListeners.push(callback);
    return () => {
      this.punchListeners = this.punchListeners.filter((cb) => cb !== callback);
    };
  }

  public onLog(callback: (log: string) => void) {
    this.logListeners.push(callback);
    return () => {
      this.logListeners = this.logListeners.filter((cb) => cb !== callback);
    };
  }

  public onStatus(callback: (connected: boolean, deviceName: string) => void) {
    this.statusListeners.push(callback);
    return () => {
      this.statusListeners = this.statusListeners.filter((cb) => cb !== callback);
    };
  }

  private log(message: string) {
    const time = new Date().toLocaleTimeString('en-US', { hour12: false });
    const formatted = `[${time}] ${message}`;
    console.log('[Biometric BLE]', formatted);
    this.logListeners.forEach((cb) => cb(formatted));
  }

  private notifyStatus(connected: boolean) {
    this.isConnected = connected;
    this.statusListeners.forEach((cb) => cb(connected, this.getDeviceName()));
  }

  /** Connect to Petpooja_Payroll_72 via Web Bluetooth */
  public async connect(): Promise<boolean> {
    const nav = navigator as any;
    if (!nav.bluetooth) {
      throw new Error(
        'Web Bluetooth is not supported in this browser. Please use Google Chrome or Microsoft Edge on PC or Android.'
      );
    }

    try {
      this.log('Scanning for Petpooja Biometric Puck...');
      const device = await nav.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: this.candidateServices,
      });

      this.device = device;
      this.log(`Found device: "${device.name}" (ID: ${device.id})`);

      device.addEventListener('gattserverdisconnected', () => {
        this.log('⚠️ Device disconnected.');
        this.notifyStatus(false);
      });

      this.log('Connecting to GATT Server...');
      const server = await device.gatt.connect();
      this.server = server;
      this.log('Connected to GATT Server successfully!');

      // Discover available primary services
      let primaryServices: any[] = [];
      try {
        primaryServices = await server.getPrimaryServices();
      } catch (err) {
        this.log('Could not list all services directly, trying candidate services...');
      }

      this.log(`Discovered ${primaryServices.length} BLE services.`);

      let subscribedCount = 0;

      // Try subscribing to notify/indicate characteristics
      for (const service of primaryServices) {
        try {
          const chars = await service.getCharacteristics();
          for (const ch of chars) {
            const props = ch.properties;
            if (props.notify || props.indicate) {
              await ch.startNotifications();
              ch.addEventListener('characteristicvaluechanged', (e: any) =>
                this.handleCharacteristicValueChanged(e)
              );
              this.characteristic = ch;
              subscribedCount++;
              this.log(`✅ Subscribed to notifications on characteristic: ${ch.uuid}`);
            }
          }
        } catch (e) {
          // Continue scanning other services
        }
      }

      if (subscribedCount === 0) {
        // Fallback: Try specific candidates
        for (const sUuid of this.candidateServices) {
          try {
            const s = await server.getPrimaryService(sUuid);
            const chars = await s.getCharacteristics();
            for (const ch of chars) {
              if (ch.properties.notify || ch.properties.indicate) {
                await ch.startNotifications();
                ch.addEventListener('characteristicvaluechanged', (e: any) =>
                  this.handleCharacteristicValueChanged(e)
                );
                this.characteristic = ch;
                subscribedCount++;
                this.log(`✅ Subscribed to notifications on candidate: ${ch.uuid}`);
              }
            }
          } catch {}
        }
      }

      this.notifyStatus(true);
      this.log(
        subscribedCount > 0
          ? '🎯 Biometric Scanner is READY! Touch your finger to test live attendance punch.'
          : '⚠️ Device connected, but notification channel was restricted. Listening for live events...'
      );
      return true;
    } catch (err: any) {
      this.log(`❌ Connection failed: ${err.message || err}`);
      this.notifyStatus(false);
      throw err;
    }
  }

  public async disconnect() {
    if (this.device?.gatt?.connected) {
      await this.device.gatt.disconnect();
    }
    this.notifyStatus(false);
    this.log('Biometric scanner disconnected.');
  }

  /** Handle raw data packet received from device */
  private handleCharacteristicValueChanged(event: any) {
    const value: DataView = event.target.value;
    const bytes: number[] = [];
    for (let i = 0; i < value.byteLength; i++) {
      bytes.push(value.getUint8(i));
    }

    const hex = bytes.map((b) => b.toString(16).padStart(2, '0')).join(' ');
    const text = new TextDecoder('utf-8').decode(value.buffer).replace(/[^\x20-\x7E]/g, '');

    this.log(`📡 Packet Received (${value.byteLength} bytes): [HEX: ${hex}] ${text ? `"${text}"` : ''}`);

    // Parse packet for Fingerprint ID / payload
    const parsed = this.parsePunchPayload(bytes, text);
    if (parsed) {
      this.punchListeners.forEach((cb) => cb(parsed));
    }
  }

  /** Heuristic parser for Petpooja / ESP32 biometric packets */
  private parsePunchPayload(bytes: number[], text: string): PunchEvent {
    let fingerId: number | undefined = undefined;

    // 1. Text based payload check (e.g. "FP:1" or "ID:2" or JSON)
    const idMatch = text.match(/(?:ID|FP|USER|UID|PUNCH)[:=_\s]?([0-9]+)/i);
    if (idMatch && idMatch[1]) {
      fingerId = parseInt(idMatch[1], 10);
    }

    // 2. Binary packet check (common R503 / ESP32 protocol byte 2 or 3 is ID)
    if (fingerId === undefined && bytes.length >= 2) {
      // Find non-header byte
      for (const b of bytes) {
        if (b > 0 && b < 255 && b !== 0xef && b !== 0x01) {
          fingerId = b;
          break;
        }
      }
    }

    // Lookup finger mapping in localStorage
    let studentId: string | undefined = undefined;
    if (fingerId !== undefined) {
      const mappings = this.getFingerMappings();
      const mapped = mappings.find((m) => m.fingerId === fingerId);
      if (mapped) {
        studentId = mapped.studentId;
      }
    }

    const event: PunchEvent = {
      raw: text || bytes.map((b) => b.toString(16)).join(' '),
      fingerId,
      studentId,
      timestamp: new Date().toLocaleTimeString('en-US', { hour12: true }),
      action: 'in', // default, attendance service toggles to out if already inside
    };

    return event;
  }

  // Fingerprint Mappings in localStorage
  public getFingerMappings(): FingerMapping[] {
    try {
      const saved = localStorage.getItem('galaxy_finger_mappings');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  }

  public saveFingerMapping(mapping: FingerMapping) {
    const list = this.getFingerMappings().filter((m) => m.fingerId !== mapping.fingerId);
    list.push(mapping);
    localStorage.setItem('galaxy_finger_mappings', JSON.stringify(list));
    return list;
  }

  public removeFingerMapping(fingerId: number) {
    const list = this.getFingerMappings().filter((m) => m.fingerId !== fingerId);
    localStorage.setItem('galaxy_finger_mappings', JSON.stringify(list));
    return list;
  }
}

export const biometricBleService = new BiometricBleService();
