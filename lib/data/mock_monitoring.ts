import { RelatorioMonitoramento } from '../types/monitoring';

export const mockRelatorio: RelatorioMonitoramento = {
    fazenda: 'Fazenda Boa Esperança',
    safra: '2024/2025',
    data: '17/09/2025',
    tecnico: 'João Silva',
    crea: 'CREA-SP 12345/D',
    talhoes: [
        {
            id: 'T01',
            nome: 'Talhão 01',
            cultura: 'Soja',
            variedade: 'TMG 7062 IPRO',
            estagio: 'R1 – Floração',
            area_ha: 45.8,
            condicoes_climaticas: { temperatura: 28, umidade: 65, chuva: 'Sem Chuva' },
            poligono_geojson: {
                type: 'Feature',
                geometry: {
                    type: 'Polygon',
                    coordinates: [[
                        [-46.2360, -23.5380],
                        [-46.2300, -23.5380],
                        [-46.2280, -23.5420],
                        [-46.2310, -23.5450],
                        [-46.2370, -23.5440],
                        [-46.2390, -23.5410],
                        [-46.2360, -23.5380],
                    ]],
                },
            },
            pontos: [
                {
                    id: 'p1', identificador: 'P1', lat: -23.5395, lng: -46.2355,
                    infestacoes: [
                        { id: 'i1', tipo: 'praga', nome: 'Lagarta-Alfinete', terco: 'Médio', quantidade: 4, severidade: 40 },
                    ],
                },
                {
                    id: 'p2', identificador: 'P2', lat: -23.5410, lng: -46.2330,
                    infestacoes: [
                        { id: 'i2', tipo: 'doenca', nome: 'Ferrugem Asiática', terco: 'Baixeiro', quantidade: null, severidade: 32, imagem: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/43/Phakopsora_pachyrhizi_on_soybean_1.jpg/320px-Phakopsora_pachyrhizi_on_soybean_1.jpg' },
                        { id: 'i3', tipo: 'praga', nome: 'Percevejo Marrom', terco: 'Ponteiro', quantidade: 2, severidade: 18 },
                    ],
                },
                {
                    id: 'p3', identificador: 'P3', lat: -23.5425, lng: -46.2310,
                    infestacoes: [
                        { id: 'i4', tipo: 'daninha', nome: 'Buva', terco: 'Médio', quantidade: null, severidade: 8 },
                        { id: 'i5', tipo: 'doenca', nome: 'Ferrugem Asiática', terco: 'Médio', quantidade: null, severidade: 28 },
                    ],
                },
                {
                    id: 'p4', identificador: 'P4', lat: -23.5398, lng: -46.2295,
                    infestacoes: [
                        { id: 'i6', tipo: 'praga', nome: 'Percevejo Marrom', terco: 'Ponteiro', quantidade: 3, severidade: 22 },
                    ],
                },
                {
                    id: 'p5', identificador: 'P5', lat: -23.5385, lng: -46.2318,
                    infestacoes: [
                        { id: 'i7', tipo: 'doenca', nome: 'Ferrugem Asiática', terco: 'Baixeiro', quantidade: null, severidade: 35, imagem: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/43/Phakopsora_pachyrhizi_on_soybean_1.jpg/320px-Phakopsora_pachyrhizi_on_soybean_1.jpg' },
                        { id: 'i8', tipo: 'praga', nome: 'Pulgão', terco: 'Ponteiro', quantidade: null, severidade: 12 },
                    ],
                },
                {
                    id: 'p6', identificador: 'P6', lat: -23.5440, lng: -46.2340,
                    infestacoes: [],
                },
                {
                    id: 'p7', identificador: 'P7', lat: -23.5432, lng: -46.2360,
                    infestacoes: [
                        { id: 'i9', tipo: 'praga', nome: 'Lagarta-Alfinete', terco: 'Médio', quantidade: 2, severidade: 20 },
                    ],
                },
                {
                    id: 'p8', identificador: 'P8', lat: -23.5415, lng: -46.2375,
                    infestacoes: [
                        { id: 'i10', tipo: 'daninha', nome: 'Capim Colchão', terco: 'Baixeiro', quantidade: null, severidade: 6 },
                    ],
                },
                {
                    id: 'p9', identificador: 'P9', lat: -23.5400, lng: -46.2387,
                    infestacoes: [],
                },
                {
                    id: 'p10', identificador: 'P10', lat: -23.5388, lng: -46.2370,
                    infestacoes: [
                        { id: 'i11', tipo: 'doenca', nome: 'Mancha Alvo', terco: 'Médio', quantidade: null, severidade: 15 },
                    ],
                },
                {
                    id: 'p11', identificador: 'P11', lat: -23.5420, lng: -46.2295,
                    infestacoes: [
                        { id: 'i12', tipo: 'praga', nome: 'Percevejo Marrom', terco: 'Ponteiro', quantidade: 5, severidade: 45 },
                        { id: 'i13', tipo: 'doenca', nome: 'Ferrugem Asiática', terco: 'Baixeiro', quantidade: null, severidade: 38 },
                    ],
                },
                {
                    id: 'p12', identificador: 'P12', lat: -23.5408, lng: -46.2352,
                    infestacoes: [
                        { id: 'i14', tipo: 'praga', nome: 'Lagarta-Alfinete', terco: 'Médio', quantidade: 6, severidade: 50, imagem: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8b/Spodoptera_frugiperda_larva_01.jpg/320px-Spodoptera_frugiperda_larva_01.jpg' },
                    ],
                },
            ],
        },

        // ── TALHÃO 02 ─────────────────────────────────────────────────────────────
        {
            id: 'T02',
            nome: 'Talhão 02',
            cultura: 'Milho',
            variedade: 'DKB 390 PRO3',
            estagio: 'V8 – Oitava folha',
            area_ha: 32.4,
            condicoes_climaticas: { temperatura: 30, umidade: 72, chuva: 'Chuva Fraca' },
            poligono_geojson: {
                type: 'Feature',
                geometry: {
                    type: 'Polygon',
                    coordinates: [[
                        [-46.2180, -23.5420],
                        [-46.2120, -23.5420],
                        [-46.2110, -23.5460],
                        [-46.2140, -23.5480],
                        [-46.2190, -23.5465],
                        [-46.2200, -23.5435],
                        [-46.2180, -23.5420],
                    ]],
                },
            },
            pontos: [
                {
                    id: 'q1', identificador: 'P1', lat: -23.5430, lng: -46.2175,
                    infestacoes: [
                        { id: 'j1', tipo: 'praga', nome: 'Lagarta do Cartucho', terco: 'Ponteiro', quantidade: 8, severidade: 55, imagem: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8b/Spodoptera_frugiperda_larva_01.jpg/320px-Spodoptera_frugiperda_larva_01.jpg' },
                    ],
                },
                {
                    id: 'q2', identificador: 'P2', lat: -23.5445, lng: -46.2155,
                    infestacoes: [
                        { id: 'j2', tipo: 'praga', nome: 'Lagarta do Cartucho', terco: 'Ponteiro', quantidade: 6, severidade: 45 },
                        { id: 'j3', tipo: 'doenca', nome: 'Ferrugem', terco: 'Médio', quantidade: null, severidade: 20 },
                    ],
                },
                {
                    id: 'q3', identificador: 'P3', lat: -23.5460, lng: -46.2138,
                    infestacoes: [
                        { id: 'j4', tipo: 'daninha', nome: 'Capim Braquiária', terco: 'Baixeiro', quantidade: null, severidade: 10 },
                    ],
                },
                {
                    id: 'q4', identificador: 'P4', lat: -23.5455, lng: -46.2168,
                    infestacoes: [
                        { id: 'j5', tipo: 'praga', nome: 'Cigarrinha', terco: 'Médio', quantidade: null, severidade: 25 },
                        { id: 'j6', tipo: 'praga', nome: 'Pulgão', terco: 'Ponteiro', quantidade: null, severidade: 14 },
                    ],
                },
                {
                    id: 'q5', identificador: 'P5', lat: -23.5440, lng: -46.2192,
                    infestacoes: [],
                },
                {
                    id: 'q6', identificador: 'P6', lat: -23.5428, lng: -46.2145,
                    infestacoes: [
                        { id: 'j7', tipo: 'doenca', nome: 'Míldio', terco: 'Médio', quantidade: null, severidade: 30 },
                    ],
                },
                {
                    id: 'q7', identificador: 'P7', lat: -23.5465, lng: -46.2155,
                    infestacoes: [
                        { id: 'j8', tipo: 'praga', nome: 'Lagarta do Cartucho', terco: 'Ponteiro', quantidade: 10, severidade: 60 },
                        { id: 'j9', tipo: 'daninha', nome: 'Tiririca', terco: 'Baixeiro', quantidade: null, severidade: 8 },
                    ],
                },
                {
                    id: 'q8', identificador: 'P8', lat: -23.5472, lng: -46.2175,
                    infestacoes: [
                        { id: 'j10', tipo: 'doenca', nome: 'Antracnose', terco: 'Baixeiro', quantidade: null, severidade: 18 },
                    ],
                },
            ],
        },
    ],
};
