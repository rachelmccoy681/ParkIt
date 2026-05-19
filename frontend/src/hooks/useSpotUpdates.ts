import { Client } from '@stomp/stompjs';
import { useEffect, useRef } from 'react';
import { WS_URL } from '../api/client';
import { SpotStatusMessage } from '../types';

export function useSpotUpdates(onMessage: (msg: SpotStatusMessage) => void) {
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  useEffect(() => {
    const client = new Client({
      brokerURL: WS_URL,
      reconnectDelay: 5000,
      onConnect: () => {
        client.subscribe('/topic/spots', (frame) => {
          const msg: SpotStatusMessage = JSON.parse(frame.body);
          onMessageRef.current(msg);
        });
      },
    });

    client.activate();
    return () => { client.deactivate(); };
  }, []);
}
