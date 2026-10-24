import React, { useState } from 'react';
import { Terminal, Play, Copy, Check, Code2 } from 'lucide-react';
import { Hotel, Room } from '../types';

interface ApiDocsViewProps {
  hotels: Hotel[];
  rooms: Room[];
  onCreateHotel: (hotel: { name: string; address: string; city: string; country: string }) => void;
  onCreateRoom: (room: { hotelId: number; roomNumber: number; status: any; roomType?: any; floor?: number; pricePerNight?: number }) => void;
}

export const ApiDocsView: React.FC<ApiDocsViewProps> = ({
  hotels,
  rooms,
  onCreateHotel,
  onCreateRoom,
}) => {
  const [activeEndpoint, setActiveEndpoint] = useState<string>('get-root');
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);
  const [responseOutput, setResponseOutput] = useState<{
    status: number;
    timeMs: number;
    body: any;
  } | null>(null);

  const [hotelPayload, setHotelPayload] = useState({
    name: 'Harbor House',
    address: '1 Marina Way',
    city: 'Boston',
    country: 'USA',
  });

  const [hotelIdParam, setHotelIdParam] = useState<number>(1);
  const [roomNumberParam, setRoomNumberParam] = useState<number>(501);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(id);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  const executeEndpoint = (key: string) => {
    const startTime = performance.now();
    if (key === 'get-root') {
      const resp = { service: 'hotel-manager', status: 'ok' };
      setResponseOutput({ status: 200, timeMs: Math.round(performance.now() - startTime + 8), body: resp });
    } else if (key === 'get-hotels') {
      setResponseOutput({ status: 200, timeMs: Math.round(performance.now() - startTime + 12), body: hotels });
    } else if (key === 'post-hotels') {
      onCreateHotel(hotelPayload);
      const newHotel = { id: hotels.length + 1, ...hotelPayload };
      setResponseOutput({ status: 201, timeMs: Math.round(performance.now() - startTime + 15), body: newHotel });
    } else if (key === 'get-hotel-by-id') {
      const match = hotels.find((h) => h.id === Number(hotelIdParam));
      if (match) {
        setResponseOutput({ status: 200, timeMs: Math.round(performance.now() - startTime + 6), body: match });
      } else {
        setResponseOutput({ status: 404, timeMs: 6, body: { detail: 'Hotel not found' } });
      }
    } else if (key === 'get-rooms') {
      setResponseOutput({ status: 200, timeMs: Math.round(performance.now() - startTime + 10), body: rooms });
    } else if (key === 'post-rooms') {
      onCreateRoom({
        hotelId: hotels[0]?.id || 1,
        roomNumber: roomNumberParam,
        status: 'available',
      });
      setResponseOutput({
        status: 201,
        timeMs: 14,
        body: { message: 'Room created successfully', room_number: roomNumberParam, status: 'available' },
      });
    }
  };

  const curlHotelCreate = `curl -X 'POST' 'http://127.0.0.1:8000/hotels' -H 'Content-Type: application/json' -d '${JSON.stringify(hotelPayload)}'`;
  const pwshHotelCreate = `Invoke-RestMethod -Method Post -Uri http://127.0.0.1:8000/hotels -ContentType "application/json" -Body '${JSON.stringify(hotelPayload)}'`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Terminal className="w-6 h-6 text-amber-400" />
            <span>FastAPI Interactive API & OpenAPI Specs</span>
          </h1>
          <p className="text-sm text-slate-400">
            Interactive console matching FastAPI's Swagger UI (<code>/docs</code>) and ReDoc
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4 space-y-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block px-1">
            Endpoints
          </span>

          {[
            { id: 'get-root', method: 'GET', path: '/', label: 'Health check' },
            { id: 'get-hotels', method: 'GET', path: '/hotels', label: 'List hotels' },
            { id: 'post-hotels', method: 'POST', path: '/hotels', label: 'Create hotel' },
            { id: 'get-hotel-by-id', method: 'GET', path: '/hotels/{id}', label: 'Get by ID' },
            { id: 'get-rooms', method: 'GET', path: '/rooms', label: 'List rooms' },
            { id: 'post-rooms', method: 'POST', path: '/rooms', label: 'Create room' },
          ].map((ep) => (
            <button
              key={ep.id}
              onClick={() => {
                setActiveEndpoint(ep.id);
                executeEndpoint(ep.id);
              }}
              className={`w-full text-left p-3 rounded-xl border transition flex items-center justify-between ${
                activeEndpoint === ep.id
                  ? 'bg-slate-900 border-amber-500/50'
                  : 'bg-slate-950 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    ep.method === 'POST' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400'
                  }`}
                >
                  {ep.method}
                </span>
                <span className="font-mono text-xs text-white">{ep.path}</span>
              </div>
              <span className="text-[11px] text-slate-400">{ep.label}</span>
            </button>
          ))}
        </div>

        <div className="lg:col-span-8 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <span className="font-mono text-sm text-white font-semibold">
                Selected: {activeEndpoint}
              </span>
              <button
                onClick={() => executeEndpoint(activeEndpoint)}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Execute</span>
              </button>
            </div>

            {responseOutput && (
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Response ({responseOutput.timeMs}ms)</span>
                  <span className="font-mono text-emerald-400 font-bold">Status: {responseOutput.status}</span>
                </div>
                <pre className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs font-mono text-emerald-400 overflow-x-auto max-h-64">
                  {JSON.stringify(responseOutput.body, null, 2)}
                </pre>
              </div>
            )}
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 font-semibold">cURL Command</span>
              <button
                onClick={() => copyToClipboard(curlHotelCreate, 'curl')}
                className="text-amber-400 text-xs font-bold"
              >
                {copiedCmd === 'curl' ? 'Copied!' : 'Copy cURL'}
              </button>
            </div>
            <pre className="bg-slate-950 p-2.5 rounded text-xs font-mono text-slate-300 overflow-x-auto">
              {curlHotelCreate}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};