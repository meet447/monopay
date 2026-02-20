import NfcManager, { Ndef, NfcEvents, NfcTech } from 'react-native-nfc-manager';
import { Alert } from 'react-native';

class NFCService {
    async init() {
        try {
            await NfcManager.start();
        } catch (ex) {
            console.warn('NfcManager.start failed', ex);
        }
    }

    async isSupported() {
        return await NfcManager.isSupported();
    }

    async writeNdef(payload: string) {
        let result = false;

        try {
            // Prompt user to tap device
            await NfcManager.requestTechnology(NfcTech.Ndef);

            const bytes = Ndef.encodeMessage([
                Ndef.textRecord(payload),
            ]);

            if (bytes) {
                await NfcManager.ndefHandler.writeNdefMessage(bytes);
                result = true;
            }
        } catch (ex) {
            console.warn('writeNdef failed', ex);
        } finally {
            // Stop the nfc scanning
            NfcManager.cancelTechnologyRequest();
        }

        return result;
    }

    startListening(onMessage: (payload: string) => void) {
        NfcManager.setEventListener(NfcEvents.DiscoverTag, (tag: any) => {
            // NDEF message is an array of NDEF records
            if (tag.ndefMessage && tag.ndefMessage.length > 0) {
                // Decode the first text record
                const ndefRecord = tag.ndefMessage[0];
                if (ndefRecord.payload) {
                    const payload = Ndef.text.decodePayload(ndefRecord.payload);
                    onMessage(payload);
                }
            }
        });

        NfcManager.registerTagEvent();
    }

    stopListening() {
        NfcManager.setEventListener(NfcEvents.DiscoverTag, null);
        NfcManager.unregisterTagEvent().catch(() => 0);
    }
}

export const nfcService = new NFCService();
