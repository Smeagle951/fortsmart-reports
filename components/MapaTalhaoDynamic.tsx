'use client';

import dynamic from 'next/dynamic';

const MapaTalhao = dynamic(() => import('./MapaTalhao'), { ssr: false });

export default MapaTalhao;
